import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const validUsername=(value:string)=>/^[a-zA-Z0-9._-]{3,32}$/.test(value);
const emailFor=(username:string)=>`${username.toLowerCase()}@users.arra-hub.local`;

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  const url=Deno.env.get("SUPABASE_URL")!;
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const publishable=Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin=createClient(url,serviceKey,{auth:{persistSession:false}});
  const body=await req.json().catch(()=>({}));
  const action=String(body.action||"");

  if(action==="bootstrap"){
    const {count}=await admin.from("user_roles").select("*",{count:"exact",head:true}).eq("role","owner");
    if((count||0)>0) return json({error:"Owner setup has already been completed."},409);
    const username=String(body.username||"").trim();
    const password=String(body.password||"");
    const fullName=String(body.fullName||"Workspace Owner").trim();
    if(!validUsername(username)||password.length<12) return json({error:"Use a 3–32 character username and a password of at least 12 characters."},400);
    const {data,error}=await admin.auth.admin.createUser({email:emailFor(username),password,email_confirm:true,user_metadata:{full_name:fullName}});
    if(error||!data.user) return json({error:error?.message||"Could not create owner."},400);
    const {error:profileError}=await admin.from("profiles").upsert({id:data.user.id,username,full_name:fullName,must_change_password:false},{onConflict:"id"});
    if(profileError){await admin.auth.admin.deleteUser(data.user.id);return json({error:profileError.message},400);}
    const {error:roleError}=await admin.from("user_roles").insert({user_id:data.user.id,role:"owner"});
    if(roleError){await admin.auth.admin.deleteUser(data.user.id);return json({error:"Owner setup has already been completed."},409);}
    return json({ok:true,username});
  }

  const authHeader=req.headers.get("Authorization")||"";
  const token=authHeader.replace(/^Bearer\s+/i,"");
  if(!token) return json({error:"Sign in required."},401);
  const authClient=createClient(url,publishable,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
  const {data:{user},error:userError}=await authClient.auth.getUser(token);
  if(userError||!user) return json({error:"Invalid session."},401);

  if(action==="change-password"){
    const password=String(body.password||"");
    if(password.length<12) return json({error:"Password must be at least 12 characters."},400);
    const {error}=await admin.auth.admin.updateUserById(user.id,{password});
    if(error) return json({error:error.message},400);
    await admin.from("profiles").update({must_change_password:false,updated_at:new Date().toISOString()}).eq("id",user.id);
    return json({ok:true});
  }

  const {data:callerRole}=await admin.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();
  if(!callerRole||!["owner","admin"].includes(callerRole.role)) return json({error:"Admin access required."},403);

  if(action==="list"){
    const {data:profiles,error}=await admin.from("profiles").select("id,username,full_name,email,must_change_password,active,created_at").order("created_at");
    if(error) return json({error:error.message},400);
    const {data:roles}=await admin.from("user_roles").select("user_id,role");
    const {data:access}=await admin.from("user_project_access").select("user_id,project_key");
    return json({users:(profiles||[]).map(profile=>({...profile,role:roles?.find(row=>row.user_id===profile.id)?.role||"partner",projects:(access||[]).filter(row=>row.user_id===profile.id).map(row=>row.project_key)}))});
  }

  if(action==="create"){
    const username=String(body.username||"").trim();
    const password=String(body.password||"");
    const fullName=String(body.fullName||username).trim();
    const role=String(body.role||"partner");
    const projects=Array.isArray(body.projects)?body.projects.map(String):[];
    if(!validUsername(username)||password.length<12||!["admin","partner","client"].includes(role)) return json({error:"Invalid user details."},400);
    const {data,error}=await admin.auth.admin.createUser({email:emailFor(username),password,email_confirm:true,user_metadata:{full_name:fullName}});
    if(error||!data.user) return json({error:error?.message||"Could not create user."},400);
    const {error:profileError}=await admin.from("profiles").upsert({id:data.user.id,username,full_name:fullName,must_change_password:true},{onConflict:"id"});
    if(profileError){await admin.auth.admin.deleteUser(data.user.id);return json({error:profileError.message},400);}
    const {error:roleError}=await admin.from("user_roles").insert({user_id:data.user.id,role,created_by:user.id});
    if(roleError){await admin.auth.admin.deleteUser(data.user.id);return json({error:roleError.message},400);}
    if(projects.length) await admin.from("user_project_access").insert(projects.map(project_key=>({user_id:data.user!.id,project_key})));
    return json({ok:true,id:data.user.id,username});
  }

  if(action==="reset-password"){
    const userId=String(body.userId||"");
    const password=String(body.password||"");
    if(password.length<12) return json({error:"Password must be at least 12 characters."},400);
    const {error}=await admin.auth.admin.updateUserById(userId,{password});
    if(error) return json({error:error.message},400);
    await admin.from("profiles").update({must_change_password:true,updated_at:new Date().toISOString()}).eq("id",userId);
    return json({ok:true});
  }

  if(action==="set-active"){
    const userId=String(body.userId||"");
    const active=Boolean(body.active);
    const {error}=await admin.auth.admin.updateUserById(userId,{ban_duration:active?"none":"876000h"});
    if(error) return json({error:error.message},400);
    await admin.from("profiles").update({active,updated_at:new Date().toISOString()}).eq("id",userId);
    return json({ok:true});
  }

  return json({error:"Unknown action."},400);
});
