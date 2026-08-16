"use client";

import {useEffect,useState} from "react";
import {ExternalLink,Link2,Plus,Search,X} from "lucide-react";
import type {Brand} from "@/lib/types";

type ProjectLink={id:string;title:string;url:string;project:string;brand:Brand;kind:string};
const storageKey="arra-hub-project-links";

export function LinksPage({brand}:{brand:"ALL"|Brand}){
  const [links,setLinks]=useState<ProjectLink[]>([]);
  const [adding,setAdding]=useState(false);
  const [query,setQuery]=useState("");

  useEffect(()=>{const saved=window.localStorage.getItem(storageKey);if(saved)queueMicrotask(()=>setLinks(JSON.parse(saved) as ProjectLink[]))},[]);
  const visible=links.filter(link=>(brand==="ALL"||link.brand===brand)&&`${link.title} ${link.project} ${link.kind}`.toLowerCase().includes(query.toLowerCase()));

  function addLink(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const next:ProjectLink={id:crypto.randomUUID(),title:String(data.get("title")),url:String(data.get("url")),project:String(data.get("project")),brand:String(data.get("brand")) as Brand,kind:String(data.get("kind"))};
    const updated=[next,...links];setLinks(updated);window.localStorage.setItem(storageKey,JSON.stringify(updated));setAdding(false);
  }

  function removeLink(id:string){const updated=links.filter(link=>link.id!==id);setLinks(updated);window.localStorage.setItem(storageKey,JSON.stringify(updated))}

  return <div className="content links-page">
    <div className="page-head"><div><h1>Links</h1><p>Keep every project file, review, delivery, and reference one click away.</p></div><button className="primary" onClick={()=>setAdding(true)}><Plus size={15}/>Add link</button></div>
    <div className="links-toolbar"><div><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search links…"/></div><span>{visible.length} saved links</span></div>
    {adding&&<form className="link-form" onSubmit={addLink}><div className="link-form-head"><div><h2>Add a project link</h2><p>Paste a URL and add enough context to find it later.</p></div><button type="button" onClick={()=>setAdding(false)}><X size={18}/></button></div><div className="link-fields"><label>Link title<input name="title" required placeholder="Furniture City working files"/></label><label>URL<input name="url" required type="url" placeholder="https://…"/></label><label>Project or client<input name="project" required placeholder="Furniture City"/></label><label>Brand<select name="brand" defaultValue={brand==="ALL"?"SQUATCH":brand}><option value="ARRA">ARRA Studios</option><option value="SQUATCH">Squatch Media</option></select></label><label>Link type<select name="kind"><option>Working files</option><option>Client review</option><option>Final delivery</option><option>Reference</option><option>Other</option></select></label></div><div className="link-form-actions"><button type="button" className="secondary" onClick={()=>setAdding(false)}>Cancel</button><button className="primary">Save link</button></div></form>}
    {visible.length?<div className="links-list">{visible.map(link=><article key={link.id}><div className={`link-icon ${link.brand.toLowerCase()}`}><Link2 size={18}/></div><div><h3>{link.title}</h3><p>{link.project} · {link.kind}</p></div><span className={`brand-tag ${link.brand.toLowerCase()}`}>{link.brand}</span><a href={link.url} target="_blank" rel="noreferrer">Open <ExternalLink size={14}/></a><button aria-label={`Delete ${link.title}`} onClick={()=>removeLink(link.id)}><X size={15}/></button></article>)}</div>:<div className="links-empty"><div><Link2 size={24}/></div><h2>No links saved yet</h2><p>Add working files, review links, final deliveries, or references for any project.</p><button className="primary" onClick={()=>setAdding(true)}><Plus size={15}/>Add your first link</button></div>}
  </div>
}
