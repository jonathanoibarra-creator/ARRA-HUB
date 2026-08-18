"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {ExternalLink,Link2,Plus,Search,X} from "lucide-react";
import type {Brand} from "@/lib/types";
import {useAuth} from "@/components/auth-gate";
import {createClient} from "@/lib/supabase/client";
import {deleteProjectLink,loadProjectLinks,type ProjectLink,upsertProjectLink} from "@/lib/supabase/workspace-data";

const storageKey="arra-hub-project-links";

export function LinksPage({brand,allowedProjects}:{brand:"ALL"|Brand;allowedProjects:Set<string>|null}){
  const {profile}=useAuth();
  const supabase=useMemo(()=>createClient(),[]);
  const [links,setLinks]=useState<ProjectLink[]>([]);
  const [adding,setAdding]=useState(false);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const refresh=useCallback(async(migrateLocal=false)=>{
    if(!supabase)throw new Error("Supabase is not configured.");
    let shared=await loadProjectLinks(supabase);
    if(migrateLocal){
      const saved=window.localStorage.getItem(storageKey);
      if(saved){
        try{
          const stored=JSON.parse(saved) as ProjectLink[];
          const sharedIds=new Set(shared.map(link=>link.id));
          const pending=stored.filter(link=>!sharedIds.has(link.id));
          if(pending.length){
            const {error:saveError}=await supabase.from("hub_project_links").upsert(pending.map(link=>({id:link.id,title:link.title,url:link.url,project_key:link.project,brand:link.brand,kind:link.kind,created_by:profile.id})),{onConflict:"id"});
            if(saveError)throw saveError;
            shared=await loadProjectLinks(supabase);
          }
          window.localStorage.removeItem(storageKey);
        }catch(migrationError){console.error("[workspace-sync] legacy link migration failed",migrationError)}
      }
    }
    setLinks(shared);setError("");
  },[profile.id,supabase]);

  useEffect(()=>{
    if(!supabase){queueMicrotask(()=>{setLoading(false);setError("Shared links are not configured.")});return}
    let active=true;
    const load=async(migrateLocal=false)=>{try{await refresh(migrateLocal)}catch(loadError){console.error("[workspace-sync] link load failed",loadError);if(active)setError("Couldn’t sync links. Check your connection and retry.")}finally{if(active)setLoading(false)}};
    void load(true);
    const channel=supabase.channel("arra-hub-project-links")
      .on("postgres_changes",{event:"*",schema:"public",table:"hub_project_links"},()=>void load())
      .subscribe(status=>{if(status==="CHANNEL_ERROR"&&active)setError("Live link updates paused. Refresh to try again.")});
    const handleFocus=()=>void load();window.addEventListener("focus",handleFocus);
    return()=>{active=false;window.removeEventListener("focus",handleFocus);void supabase.removeChannel(channel)};
  },[refresh,supabase]);

  const visible=links.filter(link=>(!allowedProjects||allowedProjects.has(link.project))&&(brand==="ALL"||link.brand===brand)&&`${link.title} ${link.project} ${link.kind}`.toLowerCase().includes(query.toLowerCase()));

  async function addLink(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const next:ProjectLink={id:crypto.randomUUID(),title:String(data.get("title")).trim(),url:String(data.get("url")).trim(),project:String(data.get("project")).trim(),brand:String(data.get("brand")) as Brand,kind:String(data.get("kind")),updatedAt:new Date().toISOString()};
    setLinks(current=>[next,...current]);setAdding(false);setError("");
    try{if(!supabase)throw new Error("Supabase is not configured.");await upsertProjectLink(supabase,next,profile.id)}
    catch(saveError){console.error("[workspace-sync] link save failed",saveError);setError("That link couldn’t be saved. Your shared links have been restored.");try{await refresh()}catch(refreshError){console.error("[workspace-sync] link recovery failed",refreshError)}}
  }

  async function removeLink(id:string){setLinks(current=>current.filter(link=>link.id!==id));setError("");try{if(!supabase)throw new Error("Supabase is not configured.");await deleteProjectLink(supabase,id)}catch(deleteError){console.error("[workspace-sync] link delete failed",deleteError);setError("That link couldn’t be removed. Your shared links have been restored.");try{await refresh()}catch(refreshError){console.error("[workspace-sync] link recovery failed",refreshError)}}}

  return <div className="content links-page">
    <div className="page-head"><div><h1>Links</h1><p>Keep every project file, review, delivery, and reference one click away.</p></div><button className="primary" onClick={()=>setAdding(true)}><Plus size={15}/>Add link</button></div>
    <div className="links-toolbar"><div><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search links…"/></div><span>{visible.length} saved links</span></div>
    {error?<div className="sync-banner" role="alert"><span>{error}</span><button onClick={()=>void refresh()}>Retry</button></div>:null}
    {adding&&<form className="link-form" onSubmit={addLink}><div className="link-form-head"><div><h2>Add a project link</h2><p>Paste a URL and add enough context to find it later.</p></div><button type="button" onClick={()=>setAdding(false)}><X size={18}/></button></div><div className="link-fields"><label>Link title<input name="title" required placeholder="Furniture City working files"/></label><label>URL<input name="url" required type="url" placeholder="https://…"/></label><label>Project or client<input name="project" required placeholder="Furniture City"/></label><label>Brand<select name="brand" defaultValue={brand==="ALL"?"SQUATCH":brand}><option value="ARRA">ARRA Studios</option><option value="SQUATCH">Squatch Media</option></select></label><label>Link type<select name="kind"><option>Working files</option><option>Client review</option><option>Final delivery</option><option>Reference</option><option>Other</option></select></label></div><div className="link-form-actions"><button type="button" className="secondary" onClick={()=>setAdding(false)}>Cancel</button><button className="primary">Save link</button></div></form>}
    {loading?<div className="links-empty"><div><Link2 size={24}/></div><p>Syncing shared links…</p></div>:visible.length?<div className="links-list">{visible.map(link=><article key={link.id}><div className={`link-icon ${link.brand.toLowerCase()}`}><Link2 size={18}/></div><div><h3>{link.title}</h3><p>{link.project} · {link.kind}</p></div><span className={`brand-tag ${link.brand.toLowerCase()}`}>{link.brand}</span><a href={link.url} target="_blank" rel="noreferrer">Open <ExternalLink size={14}/></a><button aria-label={`Delete ${link.title}`} onClick={()=>void removeLink(link.id)}><X size={15}/></button></article>)}</div>:<div className="links-empty"><div><Link2 size={24}/></div><h2>No links saved yet</h2><p>Add working files, review links, final deliveries, or references for any project.</p><button className="primary" onClick={()=>setAdding(true)}><Plus size={15}/>Add your first link</button></div>}
  </div>
}
