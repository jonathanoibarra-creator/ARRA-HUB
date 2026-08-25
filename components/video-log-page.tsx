"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {Archive,ArrowDown,ArrowUp,ArrowUpDown,CalendarDays,Clapperboard,Clock3,ExternalLink,Film,FolderOpen,Grid2X2,List,MapPin,MoreHorizontal,Play,Plus,Search,SlidersHorizontal,Trash2,X} from "lucide-react";
import {useAuth} from "@/components/auth-gate";
import {createClient} from "@/lib/supabase/client";
import {deleteVideoLog,loadVideoLogPreference,loadVideoLogs,saveVideoLogPreference,type VideoLogEntry,type VideoLogPreference,type VideoLogSortDirection,type VideoLogSortKey,type VideoLogStatus,type VideoLogType,type VideoLogView,upsertVideoLog} from "@/lib/supabase/video-log-data";
import type {Brand} from "@/lib/types";

const statuses:VideoLogStatus[]=["Planned","Captured","Editing","In review","Published","Archived"];
const videoTypes:VideoLogType[]=["Social video","Commercial","Interview","Testimonial","Wedding film","Event","Behind the scenes","Other"];
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const displayDate=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

function EntryForm({entry,defaultBrand,close,save,remove}:{entry?:VideoLogEntry;defaultBrand:Brand;close:()=>void;save:(entry:VideoLogEntry,isNew:boolean)=>void;remove?:(entry:VideoLogEntry)=>void}){
  function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const duration=Number(data.get("durationMinutes"));
    save({
      id:entry?.id||crypto.randomUUID(),
      title:String(data.get("title")).trim(),
      brand:String(data.get("brand")) as Brand,
      client:String(data.get("client")).trim(),
      project:String(data.get("project")).trim(),
      videoType:String(data.get("videoType")) as VideoLogType,
      status:String(data.get("status")) as VideoLogStatus,
      shootDate:String(data.get("shootDate")),
      location:String(data.get("location")).trim(),
      locationAddress:String(data.get("locationAddress")).trim()||undefined,
      producer:String(data.get("producer")).trim(),
      subjects:String(data.get("subjects")).trim()||undefined,
      durationMinutes:duration>0?duration:undefined,
      videoUrl:String(data.get("videoUrl")).trim()||undefined,
      reviewUrl:String(data.get("reviewUrl")).trim()||undefined,
      rawFootageUrl:String(data.get("rawFootageUrl")).trim()||undefined,
      tags:Array.from(new Set(String(data.get("tags")).split(",").map(tag=>tag.trim()).filter(Boolean))),
      notes:String(data.get("notes")).trim(),
      createdAt:entry?.createdAt,
      updatedAt:new Date().toISOString()
    },!entry);
  }

  return <><button className="drawer-scrim" onClick={close} aria-label="Close video entry form"/><aside className="video-composer" role="dialog" aria-modal="true" aria-labelledby="video-form-title"><div className="video-form-head"><div><span>{entry?"EDIT ARCHIVE ENTRY":"NEW ARCHIVE ENTRY"}</span><h2 id="video-form-title">{entry?"Update video details":"Log a video"}</h2><p>Keep the production context and every important link together.</p></div><button onClick={close} aria-label="Close"><X size={19}/></button></div><form onSubmit={submit}>
    <label className="wide">Video title<input name="title" required autoFocus defaultValue={entry?.title} placeholder="e.g. Furniture City summer campaign"/></label>
    <label>Client<input name="client" required defaultValue={entry?.client} placeholder="Client name"/></label>
    <label>Project<input name="project" required defaultValue={entry?.project} placeholder="Project or campaign"/></label>
    <label>Brand<select name="brand" defaultValue={entry?.brand||defaultBrand}><option value="ARRA">ARRA Studios</option><option value="SQUATCH">Squatch Media</option></select></label>
    <label>Shoot date<input name="shootDate" type="date" required defaultValue={entry?.shootDate||today()}/></label>
    <label>Status<select name="status" defaultValue={entry?.status||"Captured"}>{statuses.map(status=><option key={status}>{status}</option>)}</select></label>
    <label>Video type<select name="videoType" defaultValue={entry?.videoType||"Social video"}>{videoTypes.map(type=><option key={type}>{type}</option>)}</select></label>
    <label>Producer / owner<input name="producer" required defaultValue={entry?.producer||"Jonathan Ibarra"} placeholder="Jonathan Ibarra"/></label>
    <label>Duration in minutes<input name="durationMinutes" type="number" min="1" max="1440" defaultValue={entry?.durationMinutes} placeholder="Optional"/></label>
    <label>Location<input name="location" required defaultValue={entry?.location} placeholder="Studio, venue, or city"/></label>
    <label>Address<input name="locationAddress" defaultValue={entry?.locationAddress} placeholder="Optional street address"/></label>
    <label className="wide">People / subjects<input name="subjects" defaultValue={entry?.subjects} placeholder="On-camera talent, interview subject, couple…"/></label>
    <label className="wide">Published or master link<input name="videoUrl" type="url" defaultValue={entry?.videoUrl} placeholder="https://…"/></label>
    <label className="wide">Client review link<input name="reviewUrl" type="url" defaultValue={entry?.reviewUrl} placeholder="https://…"/></label>
    <label className="wide">Raw footage / working files<input name="rawFootageUrl" type="url" defaultValue={entry?.rawFootageUrl} placeholder="https://…"/></label>
    <label className="wide">Tags<input name="tags" defaultValue={entry?.tags.join(", ")} placeholder="social, interview, medical"/><small>Separate tags with commas.</small></label>
    <label className="wide">Notes<textarea name="notes" rows={4} defaultValue={entry?.notes} placeholder="Creative notes, deliverables, usage rights, camera details, or anything useful later."/></label>
    <div className="video-form-actions">{entry&&remove?<button type="button" className="video-delete" onClick={()=>remove(entry)}><Trash2 size={14}/>Delete</button>:null}<span/><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" type="submit">{entry?"Save changes":"Add to archive"}</button></div>
  </form></aside></>;
}

function VideoCard({entry,canEdit,onEdit}:{entry:VideoLogEntry;canEdit:boolean;onEdit:(entry:VideoLogEntry)=>void}){
  return <article className="video-card"><div className={`video-preview ${entry.brand.toLowerCase()}`}><div className="video-preview-top"><span className={`brand-tag ${entry.brand.toLowerCase()}`}>{entry.brand}</span><span className={`video-status ${entry.status.toLowerCase().replaceAll(" ","-")}`}>{entry.status}</span></div><div className="video-play"><Play size={20} fill="currentColor"/></div><span className="video-date"><CalendarDays size={12}/>{displayDate(entry.shootDate)}</span></div><div className="video-card-body"><div className="video-card-title"><div><span>{entry.videoType}</span><h2>{entry.title}</h2></div>{canEdit?<button onClick={()=>onEdit(entry)} aria-label={`Edit ${entry.title}`}><MoreHorizontal size={18}/></button>:null}</div><p>{entry.client} <i>·</i> {entry.project}</p><div className="video-meta"><span><MapPin size={13}/>{entry.location}</span><span><Film size={13}/>{entry.producer}</span>{entry.durationMinutes?<span><Clock3 size={13}/>{entry.durationMinutes} min</span>:null}</div>{entry.tags.length?<div className="video-tags">{entry.tags.slice(0,4).map(tag=><span key={tag}>{tag}</span>)}</div>:null}</div><footer>{entry.videoUrl?<a href={entry.videoUrl} target="_blank" rel="noreferrer"><Play size={13}/>Open video<ExternalLink size={12}/></a>:entry.reviewUrl?<a href={entry.reviewUrl} target="_blank" rel="noreferrer"><FolderOpen size={13}/>Open review<ExternalLink size={12}/></a>:entry.rawFootageUrl?<a href={entry.rawFootageUrl} target="_blank" rel="noreferrer"><FolderOpen size={13}/>Working files<ExternalLink size={12}/></a>:<span><Archive size={13}/>No link attached</span>}{canEdit?<button onClick={()=>onEdit(entry)}>Edit details</button>:null}</footer></article>;
}

function SortHeading({label,column,sortKey,direction,onSort}:{label:string;column:VideoLogSortKey;sortKey:VideoLogSortKey;direction:VideoLogSortDirection;onSort:(key:VideoLogSortKey)=>void}){
  const active=column===sortKey;
  return <button className={active?"active":""} onClick={()=>onSort(column)} aria-label={`Sort by ${label}`} aria-pressed={active}>{label}{active?(direction==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}</button>;
}

function VideoTable({entries,canEdit,sortKey,direction,onSort,onEdit}:{entries:VideoLogEntry[];canEdit:boolean;sortKey:VideoLogSortKey;direction:VideoLogSortDirection;onSort:(key:VideoLogSortKey)=>void;onEdit:(entry:VideoLogEntry)=>void}){
  return <div className="video-table-shell"><table className="video-table" aria-label="Video production archive"><thead><tr><th><SortHeading label="Video" column="title" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th><SortHeading label="Client / project" column="client" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th><SortHeading label="Status" column="status" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th><SortHeading label="Shoot date" column="shootDate" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th><SortHeading label="Location" column="location" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th><SortHeading label="Owner" column="producer" sortKey={sortKey} direction={direction} onSort={onSort}/></th><th>Link</th><th><span className="video-table-actions-label">Actions</span></th></tr></thead><tbody>{entries.map(entry=>{
    const link=entry.videoUrl||entry.reviewUrl||entry.rawFootageUrl;
    const linkLabel=entry.videoUrl?"Master":entry.reviewUrl?"Review":entry.rawFootageUrl?"Files":"No link";
    return <tr key={entry.id}><td><div className="video-table-title"><span className={`video-table-mark ${entry.brand.toLowerCase()}`}><Play size={12} fill="currentColor"/></span><span><b>{entry.title}</b><small>{entry.videoType} · {entry.brand}</small></span></div></td><td><b>{entry.client}</b><small>{entry.project}</small></td><td><span className={`video-table-status ${entry.status.toLowerCase().replaceAll(" ","-")}`}>{entry.status}</span></td><td><b>{displayDate(entry.shootDate)}</b><small>{entry.durationMinutes?`${entry.durationMinutes} min`:"Duration open"}</small></td><td><b>{entry.location}</b>{entry.locationAddress?<small>{entry.locationAddress}</small>:null}</td><td><b>{entry.producer}</b><small>{entry.subjects||"Production owner"}</small></td><td>{link?<a className="video-table-link" href={link} target="_blank" rel="noreferrer">{linkLabel}<ExternalLink size={12}/></a>:<span className="video-table-no-link">No link</span>}</td><td>{canEdit?<button className="video-table-edit" onClick={()=>onEdit(entry)} aria-label={`Edit ${entry.title}`}><MoreHorizontal size={18}/></button>:null}</td></tr>;
  })}</tbody></table></div>;
}

export function VideoLogPage({brand,allowedProjects,query,onQueryChange}:{brand:"ALL"|Brand;allowedProjects:Set<string>|null;query:string;onQueryChange:(value:string)=>void}){
  const {profile}=useAuth();
  const canEdit=profile.role!=="client";
  const supabase=useMemo(()=>createClient(),[]);
  const [entries,setEntries]=useState<VideoLogEntry[]>([]);
  const [editing,setEditing]=useState<VideoLogEntry|"new"|null>(null);
  const [status,setStatus]=useState<"ALL"|VideoLogStatus>("ALL");
  const [type,setType]=useState<"ALL"|VideoLogType>("ALL");
  const [view,setView]=useState<VideoLogView>("grid");
  const [sortKey,setSortKey]=useState<VideoLogSortKey>("shootDate");
  const [sortDirection,setSortDirection]=useState<VideoLogSortDirection>("desc");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const refresh=useCallback(async()=>{
    if(!supabase)throw new Error("Supabase is not configured.");
    setEntries(await loadVideoLogs(supabase));
    setError("");
  },[supabase]);

  useEffect(()=>{
    if(!supabase){queueMicrotask(()=>{setLoading(false);setError("The shared video archive is not configured.")});return}
    let active=true;
    const load=async()=>{try{const [,preference]=await Promise.all([refresh(),loadVideoLogPreference(supabase)]);if(active&&preference){setView(preference.view);setSortKey(preference.sortKey);setSortDirection(preference.sortDirection)}}catch(loadError){console.error("[video-log] load failed",loadError);if(active)setError("Couldn’t sync the video archive. Check your connection and retry.")}finally{if(active)setLoading(false)}};
    void load();
    const channel=supabase.channel("arra-hub-video-logs")
      .on("postgres_changes",{event:"*",schema:"public",table:"hub_video_logs"},()=>void load())
      .subscribe(channelStatus=>{if(channelStatus==="CHANNEL_ERROR"&&active)setError("Live video updates paused. Refresh to reconnect.")});
    const handleFocus=()=>void load();
    window.addEventListener("focus",handleFocus);
    return()=>{active=false;window.removeEventListener("focus",handleFocus);void supabase.removeChannel(channel)};
  },[refresh,supabase]);

  const scoped=useMemo(()=>entries.filter(entry=>(!allowedProjects||allowedProjects.has(entry.project))&&(brand==="ALL"||entry.brand===brand)),[allowedProjects,brand,entries]);
  const visible=useMemo(()=>scoped.filter(entry=>{
    const searchable=`${entry.title} ${entry.client} ${entry.project} ${entry.location} ${entry.producer} ${entry.subjects||""} ${entry.tags.join(" ")} ${entry.notes}`.toLowerCase();
    return (status==="ALL"||entry.status===status)&&(type==="ALL"||entry.videoType===type)&&searchable.includes(query.trim().toLowerCase());
  }),[query,scoped,status,type]);
  const sortedVisible=useMemo(()=>[...visible].sort((left,right)=>{
    const comparison=left[sortKey].localeCompare(right[sortKey],"en",{numeric:true,sensitivity:"base"});
    return sortDirection==="asc"?comparison:-comparison;
  }),[sortDirection,sortKey,visible]);
  const activeProduction=scoped.filter(entry=>["Captured","Editing","In review"].includes(entry.status)).length;
  const locations=new Set(scoped.map(entry=>entry.location.toLowerCase())).size;

  async function save(entry:VideoLogEntry,isNew:boolean){
    setEditing(null);setError("");
    setEntries(current=>isNew?[entry,...current]:current.map(item=>item.id===entry.id?entry:item));
    try{if(!supabase)throw new Error("Supabase is not configured.");await upsertVideoLog(supabase,entry,isNew?profile.id:undefined)}
    catch(saveError){console.error("[video-log] save failed",saveError);setError("That video entry couldn’t be saved. The shared archive has been restored.");try{await refresh()}catch(refreshError){console.error("[video-log] recovery failed",refreshError)}}
  }

  async function remove(entry:VideoLogEntry){
    if(!window.confirm(`Delete “${entry.title}” from the video archive?`))return;
    setEditing(null);setEntries(current=>current.filter(item=>item.id!==entry.id));setError("");
    try{if(!supabase)throw new Error("Supabase is not configured.");await deleteVideoLog(supabase,entry.id)}
    catch(deleteError){console.error("[video-log] delete failed",deleteError);setError("That video entry couldn’t be deleted. The shared archive has been restored.");try{await refresh()}catch(refreshError){console.error("[video-log] recovery failed",refreshError)}}
  }

  async function updatePreference(preference:VideoLogPreference){
    setView(preference.view);setSortKey(preference.sortKey);setSortDirection(preference.sortDirection);
    try{if(!supabase)throw new Error("Supabase is not configured.");await saveVideoLogPreference(supabase,preference)}
    catch(preferenceError){console.error("[video-log] preference save failed",preferenceError);setError("Your view changed, but the preference couldn’t be saved for your other devices.")}
  }

  function changeView(nextView:VideoLogView){void updatePreference({view:nextView,sortKey,sortDirection})}
  function changeSort(nextSortKey:VideoLogSortKey){const nextDirection=sortKey===nextSortKey&&sortDirection==="asc"?"desc":"asc";void updatePreference({view,sortKey:nextSortKey,sortDirection:nextDirection})}

  return <div className="content video-log-page"><div className="page-head"><div><span>PRODUCTION LIBRARY</span><h1>Video Log</h1><p>A searchable archive of every shoot, edit, review, and published video.</p></div>{canEdit?<button className="primary" onClick={()=>setEditing("new")}><Plus size={15}/>Log video</button>:null}</div>
    <div className="video-metrics"><article><Clapperboard/><span><b>{scoped.length}</b>Total videos</span></article><article><Film/><span><b>{activeProduction}</b>In production</span></article><article><Play/><span><b>{scoped.filter(entry=>entry.status==="Published").length}</b>Published</span></article><article><MapPin/><span><b>{locations}</b>Locations</span></article></div>
    <div className="video-toolbar"><label><Search size={15}/><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="Search title, client, location, tags…"/></label><div className="video-filters"><SlidersHorizontal size={14}/><select value={status} onChange={event=>setStatus(event.target.value as "ALL"|VideoLogStatus)} aria-label="Filter by status"><option value="ALL">All statuses</option>{statuses.map(value=><option key={value}>{value}</option>)}</select><select value={type} onChange={event=>setType(event.target.value as "ALL"|VideoLogType)} aria-label="Filter by video type"><option value="ALL">All video types</option>{videoTypes.map(value=><option key={value}>{value}</option>)}</select></div><div className="video-view-switch" role="group" aria-label="Video archive view"><button className={view==="grid"?"active":""} onClick={()=>changeView("grid")} aria-pressed={view==="grid"}><Grid2X2 size={13}/>Grid</button><button className={view==="list"?"active":""} onClick={()=>changeView("list")} aria-pressed={view==="list"}><List size={14}/>List</button></div><span>{visible.length} {visible.length===1?"entry":"entries"}</span></div>
    {error?<div className="sync-banner video-sync" role="alert"><span>{error}</span><button onClick={()=>void refresh()}>Retry</button></div>:null}
    {loading?<div className="video-empty"><Clapperboard size={27}/><h2>Opening the video archive…</h2><p>Syncing shared production records.</p></div>:visible.length?(view==="list"?<VideoTable entries={sortedVisible} canEdit={canEdit} sortKey={sortKey} direction={sortDirection} onSort={changeSort} onEdit={setEditing}/>:<div className="video-grid">{sortedVisible.map(entry=><VideoCard key={entry.id} entry={entry} canEdit={canEdit} onEdit={setEditing}/>)}</div>):<div className="video-empty"><Clapperboard size={27}/><h2>{scoped.length?"No videos match these filters":"Start your production archive"}</h2><p>{scoped.length?"Try another search, status, or video type.":"Log shoots, edits, client reviews, and finished videos in one place."}</p>{canEdit&&!scoped.length?<button className="primary" onClick={()=>setEditing("new")}><Plus size={15}/>Log your first video</button>:null}</div>}
    {editing?<EntryForm entry={editing==="new"?undefined:editing} defaultBrand={brand==="ALL"?"SQUATCH":brand} close={()=>setEditing(null)} save={(entry,isNew)=>void save(entry,isNew)} remove={entry=>void remove(entry)}/>:null}
  </div>;
}
