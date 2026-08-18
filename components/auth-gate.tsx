"use client";
import {createContext,useCallback,useContext,useEffect,useState} from "react";
import {ArrowRight,KeyRound,LoaderCircle,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

type Profile={username:string;full_name:string;must_change_password:boolean;role:"owner"|"admin"|"partner"|"client";projects:string[]};
type AuthContextValue={profile:Profile;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|null>(null);
const loginEmail=(username:string)=>`${username.trim().toLowerCase()}@users.arra-hub.local`;

export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthGate");return value}

export function AuthGate({children}:{children:React.ReactNode}){
  const [loading,setLoading]=useState(true);const [profile,setProfile]=useState<Profile|null>(null);const [signedIn,setSignedIn]=useState(false);
  const load=useCallback(async()=>{const supabase=createClient();if(!supabase){setLoading(false);return}const {data:{session}}=await supabase.auth.getSession();setSignedIn(Boolean(session));if(session){const [{data:profileData},{data:roleData},{data:accessData}]=await Promise.all([supabase.from("profiles").select("username,full_name,must_change_password").eq("id",session.user.id).single(),supabase.from("user_roles").select("role").eq("user_id",session.user.id).single(),supabase.from("user_project_access").select("project_key").eq("user_id",session.user.id)]);if(profileData&&roleData)setProfile({...profileData,role:roleData.role,projects:(accessData||[]).map(row=>row.project_key)})}else setProfile(null);setLoading(false)},[]);
  useEffect(()=>{queueMicrotask(()=>void load());const supabase=createClient();const listener=supabase?.auth.onAuthStateChange(()=>{queueMicrotask(()=>void load())});return()=>listener?.data.subscription.unsubscribe()},[load]);
  if(loading)return <div className="auth-loading"><LoaderCircle size={26}/><span>Opening ARRA Hub…</span></div>;
  if(!signedIn)return <CredentialsLogin onSuccess={load}/>;
  if(!profile)return <div className="auth-loading"><LoaderCircle size={26}/><span>Preparing your workspace…</span></div>;
  if(profile.must_change_password)return <ChangePassword onSuccess={load}/>;
  return <AuthContext.Provider value={{profile,signOut:async()=>{const supabase=createClient();await supabase?.auth.signOut();await load()}}}>{children}</AuthContext.Provider>;
}

function CredentialsLogin({onSuccess}:{onSuccess:()=>Promise<void>}){
  const [setup,setSetup]=useState(false);const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget);const username=String(form.get("username"));const password=String(form.get("password"));const supabase=createClient();if(!supabase){setMessage("Supabase is not configured.");setBusy(false);return}if(setup){const {error}=await supabase.functions.invoke("admin-users",{body:{action:"bootstrap",username,password,fullName:String(form.get("fullName"))}});if(error){setMessage(error.message);setBusy(false);return}}const {error}=await supabase.auth.signInWithPassword({email:loginEmail(username),password});if(error)setMessage(error.message);else await onSuccess();setBusy(false)}
  return <div className="credentials-page"><section><div className="credentials-brand"><div className="brand-a">A</div><b>ARRA HUB</b></div><div><span>PRIVATE CREATIVE OPERATIONS</span><h1>Your work,<br/>in one place.</h1><p>Secure access for ARRA Studios and Squatch Media.</p></div></section><form onSubmit={submit}><div className="auth-icon"><ShieldCheck/></div><h2>{setup?"Set up the owner account":"Welcome back"}</h2><p>{setup?"Use this once to create the first workspace owner.":"Sign in with the credentials provided by your administrator."}</p>{setup?<label>Full name<input name="fullName" required placeholder="Jonathan Ibarra"/></label>:null}<label>Username<input name="username" autoCapitalize="none" required minLength={3} placeholder="jonathan"/></label><label>Password<input name="password" type="password" required minLength={12} placeholder="••••••••••••"/></label><button className="auth-submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<>{setup?"Create owner":"Sign in"}<ArrowRight size={16}/></>}</button>{message?<div className="auth-error">{message}</div>:null}<button type="button" className="setup-toggle" onClick={()=>{setSetup(!setup);setMessage("")}}>{setup?"I already have an account":"First-time owner setup"}</button></form></div>
}

function ChangePassword({onSuccess}:{onSuccess:()=>Promise<void>}){const [message,setMessage]=useState("");async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const password=String(new FormData(event.currentTarget).get("password"));const supabase=createClient();const {error}=await supabase!.functions.invoke("admin-users",{body:{action:"change-password",password}});if(error)setMessage(error.message);else await onSuccess()}return <div className="password-page"><form onSubmit={submit}><div className="auth-icon"><KeyRound/></div><h2>Create your private password</h2><p>Your temporary password worked. Replace it before entering the hub.</p><label>New password<input name="password" type="password" minLength={12} required placeholder="At least 12 characters"/></label><button className="auth-submit">Save password</button>{message?<div className="auth-error">{message}</div>:null}</form></div>}
