"use client";

import {useMemo,useState} from "react";
import {Activity,ArrowUpRight,CheckCircle2,Clock3,Copy,Download,Share2,Sparkles} from "lucide-react";
import type {Brand,Task} from "@/lib/types";

const dayKey=(date:Date)=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);const value=Object.fromEntries(parts.map(part=>[part.type,part.value]));return `${value.year}-${value.month}-${value.day}`};
const escapeCsv=(value:string|number)=>`"${String(value).replaceAll('"','""')}"`;

export function AnalyticsPage({tasks,brand}:{tasks:Task[];brand:"ALL"|Brand}){
  const [notice,setNotice]=useState("");
  const today=dayKey(new Date());
  const stats=useMemo(()=>{
    const active=tasks.filter(t=>t.status!=="Complete");
    const completed=tasks.filter(t=>t.status==="Complete");
    const overdue=active.filter(t=>t.due<today);
    const approval=active.filter(t=>t.status==="Needs approval"||t.status==="Revisions");
    return {active,completed,overdue,approval,rate:tasks.length?Math.round(completed.length/tasks.length*100):0};
  },[tasks,today]);
  const week=useMemo(()=>Array.from({length:7},(_,index)=>{const date=new Date(`${today}T12:00:00`);date.setDate(date.getDate()-date.getDay()+index);const key=dayKey(date);const due=tasks.filter(t=>t.due===key);return {label:date.toLocaleDateString("en-US",{weekday:"short"}),total:due.length,complete:due.filter(t=>t.status==="Complete").length,overdue:due.filter(t=>t.status!=="Complete"&&key<today).length}}),[tasks,today]);
  const maxDay=Math.max(1,...week.map(day=>day.total));
  const clients=useMemo(()=>Array.from(new Set(tasks.map(t=>t.client))).map(client=>{const work=tasks.filter(t=>t.client===client);return {client,total:work.length,complete:work.filter(t=>t.status==="Complete").length,overdue:work.filter(t=>t.status!=="Complete"&&t.due<today).length,brand:work[0]?.brand||"ARRA"}}).sort((a,b)=>b.total-a.total),[tasks,today]);
  const arra=tasks.filter(t=>t.brand==="ARRA").length;
  const arraPercent=tasks.length?Math.round(arra/tasks.length*100):50;

  function reportText(){return `${new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})} ARRA Hub report\n${stats.completed.length} completed · ${stats.active.length} active · ${stats.overdue.length} overdue · ${stats.rate}% completion\n\n${clients.map(c=>`${c.client}: ${c.complete}/${c.total} complete${c.overdue?`, ${c.overdue} overdue`:""}`).join("\n")}`}
  async function share(){const text=reportText();if(navigator.share){await navigator.share({title:"ARRA Hub monthly report",text})}else{await navigator.clipboard.writeText(text);setNotice("Report copied to clipboard")}}
  async function copy(){await navigator.clipboard.writeText(reportText());setNotice("Report copied to clipboard")}
  function exportCsv(){const rows=[["Client","Brand","Total","Completed","Overdue"],...clients.map(c=>[c.client,c.brand,c.total,c.complete,c.overdue])];const csv=rows.map(row=>row.map(escapeCsv).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const link=document.createElement("a");link.href=url;link.download=`arra-hub-${new Date().toISOString().slice(0,7)}.csv`;link.click();URL.revokeObjectURL(url);setNotice("Monthly report exported")}

  return <div className="content insights-page">
    <div className="page-head"><div><span>PERFORMANCE</span><h1>Insights</h1><p>A clear view of output, workload, and client momentum{brand==="ALL"?".":` for ${brand}.`}</p></div><div className="head-actions"><button className="secondary" onClick={copy}><Copy size={15}/>Copy report</button><button className="primary" onClick={share}><Share2 size={15}/>Share</button></div></div>
    {notice?<div className="insight-toast"><CheckCircle2 size={15}/>{notice}</div>:null}
    <div className="insight-metrics">
      <article><span><Activity size={17}/>Active work</span><b>{stats.active.length}</b><small>{stats.approval.length} need a response</small></article>
      <article><span><CheckCircle2 size={17}/>Completion rate</span><b>{stats.rate}%</b><small>{stats.completed.length} items completed</small></article>
      <article className={stats.overdue.length?"risk":""}><span><Clock3 size={17}/>Overdue</span><b>{stats.overdue.length}</b><small>{stats.overdue.length?"Needs attention":"Everything is on track"}</small></article>
      <article><span><Sparkles size={17}/>Deliverables</span><b>{tasks.filter(t=>t.kind==="Deliverable").length}</b><small>Across {clients.length} clients</small></article>
    </div>
    <div className="insight-grid">
      <section className="insight-card workload-card"><header><div><span>WEEKLY PULSE</span><h2>Workload by day</h2></div><small>{week.reduce((sum,d)=>sum+d.total,0)} items due</small></header><div className="week-chart">{week.map(day=><div className="day-column" key={day.label}><div className="bar-track"><i className="bar-total" style={{height:`${Math.max(day.total?14:2,day.total/maxDay*100)}%`}}/><i className="bar-done" style={{height:`${day.total?day.complete/day.total*100:0}%`}}/></div><b>{day.total}</b><span>{day.label}</span></div>)}</div><footer><span><i className="legend-dot dark"/>Scheduled</span><span><i className="legend-dot green"/>Completed</span></footer></section>
      <section className="insight-card brand-card"><header><div><span>BRAND MIX</span><h2>ARRA vs. Squatch</h2></div></header><div className="brand-donut" style={{background:`conic-gradient(var(--arra) 0 ${arraPercent}%,var(--squatch) ${arraPercent}% 100%)`}}><div><b>{tasks.length}</b><span>Total</span></div></div><div className="brand-legend"><p><i className="legend-dot arra"/><span>ARRA Studios</span><b>{arra}</b></p><p><i className="legend-dot squatch"/><span>Squatch Media</span><b>{tasks.length-arra}</b></p></div></section>
    </div>
    <section className="insight-card report-card"><header><div><span>MONTHLY CLIENT REPORT</span><h2>{new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2></div><button className="secondary" onClick={exportCsv}><Download size={15}/>Export CSV</button></header><div className="report-table"><div className="report-row report-head"><span>Client</span><span>Progress</span><span>Completed</span><span>Overdue</span><span/></div>{clients.map(client=><div className="report-row" key={client.client}><span><i className={`legend-dot ${client.brand.toLowerCase()}`}/><b>{client.client}</b></span><span><i style={{width:`${client.total?client.complete/client.total*100:0}%`}}/></span><span>{client.complete} / {client.total}</span><span className={client.overdue?"red-text":""}>{client.overdue}</span><span><ArrowUpRight size={15}/></span></div>)}</div></section>
  </div>
}
