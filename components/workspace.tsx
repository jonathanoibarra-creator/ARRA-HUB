"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { clients, projects, tasks as seed } from "@/lib/demo-data";
import { Brand, Task } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { LinksPage } from "@/components/links-page";
import { AnalyticsPage } from "@/components/analytics-page";
const nav = [["today", "Today", Icons.Sun], ["tasks", "Tasks", Icons.CircleCheckBig], ["projects", "Projects", Icons.LayoutGrid], ["clients", "Clients", Icons.Building2], ["deliverables", "Deliverables", Icons.PackageCheck], ["deadlines", "Deadlines", Icons.Flag], ["calendar", "Calendar", Icons.CalendarDays], ["links", "Links", Icons.Link2], ["insights", "Insights", Icons.ChartNoAxesCombined]] as const;
const statusTone: Record<string, string> = { "In progress": "blue", "Needs approval": "amber", Revisions: "violet", Complete: "green", "Not started": "gray" };
const getToday = () => { const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const value = Object.fromEntries(parts.map(part => [part.type, part.value])); return `${value.year}-${value.month}-${value.day}`; };
function BrandMark() { return <div className="brand-mark">
<div className="brand-a">A</div>
<div>
<b>ARRA HUB</b>
<span>Creative operations</span>
</div>
</div>; }
function Shell({ children, brand, setBrand, onNew, query, setQuery, count }: {
    children: React.ReactNode;
    brand: "ALL" | Brand;
    setBrand: (b: "ALL" | Brand) => void;
    onNew: () => void;
    query: string;
    setQuery: (value: string) => void;
    count: number;
}) { const path = usePathname().split("/")[1] || "today"; const [mobile, setMobile] = useState(false); return <div className="app">
<aside className={mobile ? "sidebar open" : "sidebar"}>
<BrandMark />
<nav>{nav.map(([href, label, Icon]) => <Link key={href} href={`/${href}`} className={path === href ? "active" : ""} onClick={() => setMobile(false)}>
<Icon size={17}/>{label}{href === "today" && <i>{count}</i>}</Link>)}</nav>
<div className="saved">
<label>Saved views <Icons.Plus size={14}/>
</label>
<a>
<span className="dot urgent"/>Urgent this week</a>
<a>
<span className="dot approval"/>Waiting on clients</a>
<a>
<span className="dot squatch"/>Squatch active</a>
</div>
<div className="team">
<div className="avatar">JI</div>
<div>
<b>Jonathan Ibarra</b>
<span>Workspace admin</span>
</div>
<Icons.MoreHorizontal size={16}/>
</div>
</aside>
<main>
<header>
<button className="mobile-menu" onClick={() => setMobile(!mobile)}>
<Icons.Menu />
</button>
<div className="brand-filter">
<button className={brand === "ALL" ? "selected" : ""} onClick={() => setBrand("ALL")}>All work</button>
<button className={brand === "ARRA" ? "selected" : ""} onClick={() => setBrand("ARRA")}>
<span className="dot arra"/>ARRA</button>
<button className={brand === "SQUATCH" ? "selected" : ""} onClick={() => setBrand("SQUATCH")}>
<span className="dot squatch"/>Squatch</button>
</div>
<label className="search">
<Icons.Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search work"/><kbd>⌘ K</kbd>
</label>
<button className="icon" aria-label="Notifications">
<Icons.Bell size={18}/>
<i />
</button>
<button className="new" onClick={onNew}>
<Icons.Plus size={16}/>New</button>
</header>{children}</main>{mobile && <button className="scrim" onClick={() => setMobile(false)}/>}</div>; }
function PageHead({ eyebrow, title, copy, action = "New task", onAction }: {
    eyebrow?: string;
    title: string;
    copy: string;
    action?: string;
    onAction?: () => void;
}) { return <div className="page-head">
<div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>
<p>{copy}</p>
</div>
<div className="head-actions">
<button className="secondary">
<Icons.SlidersHorizontal size={15}/>Filter</button>
<button className="primary" onClick={onAction}>
<Icons.Plus size={15}/>{action}</button>
</div>
</div>; }
function Pill({ children, tone }: {
    children: React.ReactNode;
    tone: string;
}) { return <span className={`pill ${tone}`}>
<i />{children}</span>; }
function TaskRow({ task, onOpen }: {
    task: Task;
    onOpen: (t: Task) => void;
}) { return <button className="task-row" onClick={() => onOpen(task)}>
<span className={`check ${task.status === "Complete" ? "done" : ""}`}>{task.status === "Complete" && <Icons.Check size={12}/>}</span>
<span className="task-title">
<b>{task.title}</b>
<small>{task.client} <em>·</em> {task.project}</small>
</span>
<span className={`brand-tag ${task.brand.toLowerCase()}`}>{task.brand}</span>
<Pill tone={statusTone[task.status]}>{task.status}</Pill>
<span className="assignee">
<i>{task.initials}</i>{task.assignee}</span>
<span className="due">{new Date(task.due + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
<Icons.ChevronRight className="chevron" size={16}/>
</button>; }
function Section({ title, count, children, tone = "" }: {
    title: string;
    count: number;
    children: React.ReactNode;
    tone?: string;
}) { return <section className="work-section">
<div className="section-title">
<h2 className={tone}>{title}</h2>
<span>{count}</span>
<Icons.MoreHorizontal size={17}/>
</div>
<div className="list">{children}</div>
</section>; }
function Today({ items, onOpen, onNew }: {
    items: Task[];
    onOpen: (t: Task) => void;
    onNew: () => void;
}) { const today=getToday(); const groups = [{ title: "Overdue", tone: "red", filter: (t: Task) => t.due < today && t.status !== "Complete" }, { title: "Due today", tone: "orange", filter: (t: Task) => t.due === today }, { title: "In progress", tone: "blue-text", filter: (t: Task) => t.status === "In progress" }, { title: "Needs approval", tone: "amber-text", filter: (t: Task) => t.status === "Needs approval" }, { title: "Revisions", tone: "violet-text", filter: (t: Task) => t.status === "Revisions" }, { title: "Coming up", tone: "", filter: (t: Task) => t.due > today && t.status !== "Needs approval" }]; return <div className="content">
<PageHead eyebrow={new Date(`${today}T12:00:00`).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} title="Good morning, Jonathan." copy="Here’s what needs your attention across both teams." onAction={onNew}/>
<div className="metrics">
<div>
<Icons.AlertCircle />
<span>
<b>{items.filter(groups[0].filter).length}</b>Overdue</span>
</div>
<div>
<Icons.Clock3 />
<span>
<b>{items.filter(groups[1].filter).length}</b>Due today</span>
</div>
<div>
<Icons.MessageSquareText />
<span>
<b>{items.filter(groups[3].filter).length}</b>Approvals</span>
</div>
<div>
<Icons.RotateCcw />
<span>
<b>{items.filter(groups[4].filter).length}</b>Revisions</span>
</div>
</div>{groups.map(g => { const found = items.filter(g.filter); return found.length ? <Section key={g.title} title={g.title} count={found.length} tone={g.tone}>{found.map(t => <TaskRow task={t} onOpen={onOpen} key={t.id}/>)}</Section> : null; })}</div>; }
function TasksPage({ items, onOpen, onNew, title = "All tasks", kind }: {
    items: Task[];
    onOpen: (t: Task) => void;
    onNew: () => void;
    title?: string;
    kind?: string;
}) { const list = kind ? items.filter(t => t.kind === kind) : items; return <div className="content">
<PageHead title={title} copy={`${list.length} active items across your workspace.`} action={kind === "Deliverable" ? "New deliverable" : "New task"} onAction={onNew}/>
<div className="toolbar">
<div>
<button className="tab active">List</button>
<button className="tab">Board</button>
</div>
<span>{list.length} items</span>
</div>
<Section title={kind || "Work queue"} count={list.length}>{list.map(t => <TaskRow key={t.id} task={t} onOpen={onOpen}/>)}</Section>
</div>; }
function Projects({ brand }: {
    brand: "ALL" | Brand;
}) { const list = projects.filter(p => brand === "ALL" || p.brand === brand); return <div className="content">
<PageHead title="Projects" copy="Campaign health, milestones, and momentum at a glance." action="New project"/>
<div className="card-grid">{list.map(p => <article className="project-card" key={p.name}>
<div>
<span className={`brand-tag ${p.brand.toLowerCase()}`}>{p.brand}</span>
<button>
<Icons.MoreHorizontal />
</button>
</div>
<h3>{p.name}</h3>
<p>{p.client}</p>
<div className="progress-label">
<span>Progress</span>
<b>{p.progress}%</b>
</div>
<div className="progress">
<i style={{ width: `${p.progress}%` }}/>
</div>
<footer>
<span>
<Icons.Calendar size={14}/> Due {p.due}</span>
<span className="avatar-stack">
<i>JI</i>
<i>MC</i>
</span>
</footer>
</article>)}</div>
</div>; }
function Clients({ brand }: {
    brand: "ALL" | Brand;
}) { const list = clients.filter(c => brand === "ALL" || c.brand === brand); return <div className="content">
<PageHead title="Clients" copy="Relationships, contacts, and active work in one place." action="New client"/>
<div className="client-grid">{list.map(c => <article className="client-card" key={c.name}>
<div className={`client-logo ${c.brand.toLowerCase()}`}>{c.name.split(" ").map(x => x[0]).join("")}</div>
<div>
<h3>{c.name}</h3>
<p>{c.contact} · {c.projects} active projects</p>
</div>
<Pill tone={c.health === "At risk" ? "amber" : "green"}>{c.health}</Pill>
<Icons.ChevronRight />
</article>)}</div>
</div>; }
function Calendar({ items }: {
    items: Task[];
}) { const days = Array.from({ length: 35 }, (_, i) => i - 4); return <div className="content">
<PageHead title="August 2026" copy="Deadlines and delivery moments across both brands." action="Add deadline"/>
<div className="calendar">
<div className="cal-head">
<button>
<Icons.ChevronLeft />
</button>
<button>Today</button>
<button>
<Icons.ChevronRight />
</button>
<span>Month <Icons.ChevronDown size={14}/>
</span>
</div>
<div className="weekdays">{"SUN MON TUE WED THU FRI SAT".split(" ").map(x => <b key={x}>{x}</b>)}</div>
<div className="days">{days.map((d, i) => { const n = d < 1 ? 31 + d : d; const iso = `2026-08-${String(n).padStart(2, "0")}`; return <div key={i} className={`${d < 1 || d > 31 ? "muted" : ""} ${n === 16 && d > 0 ? "today" : ""}`}>
<span>{n}</span>{items.filter(t => t.due === iso).map(t => <small className={t.brand.toLowerCase()} key={t.id}>{t.title}</small>)}</div>; })}</div>
</div>
</div>; }
function Drawer({ task, close, update }: {
    task: Task;
    close: () => void;
    update: (task: Task) => void;
}) { return <>
<button className="drawer-scrim" onClick={close}/>
<aside className="drawer">
<div className="drawer-head">
<span>{task.id}</span>
<button onClick={close}>
<Icons.X />
</button>
</div>
<div className="drawer-body">
<div className="drawer-check">
<span className="check"/>
<span>{task.kind}</span>
</div>
<h2>{task.title}</h2>
<p className="description">Create a clean, client-ready result and keep all working context attached to this record.</p>
<div className="drawer-actions"><button className="primary" onClick={() => update({ ...task, status: task.status === "Complete" ? "In progress" : "Complete", completedAt: task.status === "Complete" ? undefined : new Date().toISOString(), updatedAt: new Date().toISOString() })}>{task.status === "Complete" ? <><Icons.RotateCcw size={15}/>Reopen</> : <><Icons.Check size={15}/>Mark complete</>}</button></div>
<div className="detail-grid">
<label>Status <Pill tone={statusTone[task.status]}>{task.status}</Pill>
</label>
<label>Priority <b>{task.priority}</b>
</label>
<label>Assignee <span className="assignee">
<i>{task.initials}</i>{task.assignee}</span>
</label>
<label>Due date <b>{task.due}</b>
</label>
<label>Brand <span className={`brand-tag ${task.brand.toLowerCase()}`}>{task.brand}</span>
</label>
<label>Project <b>{task.project}</b>
</label>
</div>{task.kind === "Deliverable" && <div className="links">
<h3>Deliverable links</h3>{[["Working files", task.working], ["Client review", task.review], ["Final delivery", task.final]].map(([label, url]) => <div key={label}>
<Icons.Link2 size={16}/>
<span>
<b>{label}</b>
<small>{url ? "Link attached" : "Not added yet"}</small>
</span>
<button>{url ? "Open" : "Add link"}</button>
</div>)}</div>}<div className="activity">
<h3>Activity</h3>
<div className="comment">
<div className="avatar">JI</div>
<input placeholder="Write a comment…"/>
<button>
<Icons.Send size={15}/>
</button>
</div>
<p>
<span className="avatar">MC</span>
<b>Maya</b> moved this to <strong>{task.status}</strong>
<small>2 hours ago</small>
</p>
</div>
</div>
</aside>
</>; }
function Login() { const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); async function signIn(e: React.FormEvent) { e.preventDefault(); const supabase = createClient(); if (!supabase) {
    setMessage("Demo mode is active. Add Supabase environment variables to enable sign-in.");
    return;
} const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }); setMessage(error?.message || "Check your email for a secure sign-in link."); } return <div className="login-page">
<div className="login-art">
<BrandMark />
<div>
<span>ARRA STUDIOS × SQUATCH MEDIA</span>
<h1>Make great work.<br />
<em>Keep it moving.</em>
</h1>
<p>One clear, considered place for every brief, deadline, review, and final delivery.</p>
</div>
</div>
<form onSubmit={signIn}>
<div className="login-logo">
<div className="brand-a">A</div>
<b>Welcome to ARRA Hub</b>
<p>Sign in with your work email to continue.</p>
</div>
<label>Work email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/>
</label>
<button>Continue with email <Icons.ArrowRight size={16}/>
</button>{message && <div className="auth-message">{message}</div>}<small>By continuing, you agree to keep the good work organized.</small>
</form>
</div>; }
export function Workspace({ initialPage }: {
    initialPage: string;
}) { const [brand, setBrand] = useState<"ALL" | Brand>("ALL"); const [selected, setSelected] = useState<Task | null>(null); const [creating, setCreating] = useState<Task["kind"]|null>(null); const [query,setQuery]=useState(""); const [allTasks, setAllTasks] = useState<Task[]>(seed); useEffect(() => { const saved = window.localStorage.getItem("arra-hub-tasks"); if (saved) {
    try {
        const custom = JSON.parse(saved) as Task[];
        queueMicrotask(() => setAllTasks([...custom, ...seed]));
    }
    catch {
        window.localStorage.removeItem("arra-hub-tasks");
    }
} }, []); function persist(next: Task[]) { setAllTasks(next); window.localStorage.setItem("arra-hub-tasks", JSON.stringify(next)); } function saveTask(task: Task) { persist([task, ...allTasks]); setCreating(null); } function updateTask(task: Task) { persist(allTasks.map(item => item.id === task.id ? task : item)); setSelected(task); } const items = useMemo(() => allTasks.filter(t => (brand === "ALL" || t.brand === brand) && `${t.title} ${t.client} ${t.project}`.toLowerCase().includes(query.toLowerCase())), [allTasks, brand, query]); if (initialPage === "login")
    return <Login />; let page: React.ReactNode; switch (initialPage) {
    case "tasks":
        page = <TasksPage items={items} onOpen={setSelected} onNew={() => setCreating("Task")}/>;
        break;
    case "projects":
        page = <Projects brand={brand}/>;
        break;
    case "clients":
        page = <Clients brand={brand}/>;
        break;
    case "deliverables":
        page = <TasksPage items={items} onOpen={setSelected} onNew={() => setCreating("Deliverable")} title="Deliverables" kind="Deliverable"/>;
        break;
    case "deadlines":
        page = <TasksPage items={[...items].sort((a, b) => a.due.localeCompare(b.due))} onOpen={setSelected} onNew={() => setCreating("Task")} title="Deadlines"/>;
        break;
    case "calendar":
        page = <Calendar items={items}/>;
        break;
    case "links":
        page = <LinksPage brand={brand}/>;
        break;
    case "insights":
        page = <AnalyticsPage tasks={items} brand={brand}/>;
        break;
    default: page = <Today items={items} onOpen={setSelected} onNew={() => setCreating("Task")}/>;
} ; return <Shell brand={brand} setBrand={setBrand} onNew={() => setCreating("Task")} query={query} setQuery={setQuery} count={allTasks.filter(task => task.status !== "Complete").length}>{page}{selected && <Drawer task={selected} close={() => setSelected(null)} update={updateTask}/>} {creating && <NewTaskModal brand={brand} kind={creating} close={() => setCreating(null)} save={saveTask}/>}</Shell>; }
function NewTaskModal({ brand, kind, close, save }: {
    brand: "ALL" | Brand;
    kind: Task["kind"];
    close: () => void;
    save: (task: Task) => void;
}) { function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); save({ id: `T-${Date.now()}`, title: String(data.get("title")).trim(), client: String(data.get("client")).trim(), project: String(data.get("project")).trim(), brand: String(data.get("brand")) as Brand, status: String(data.get("status")) as Task["status"], priority: String(data.get("priority")) as Task["priority"], due: String(data.get("due")), assignee: "Jonathan Ibarra", initials: "JI", kind }); } return <>
<button className="drawer-scrim" onClick={close} aria-label="Close new task form"/>
<aside className="task-composer" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
<div className="composer-head">
<div>
<span>NEW {kind.toUpperCase()}</span>
<h2 id="new-task-title">{kind==="Deliverable"?"What needs to be delivered?":"What needs to get done?"}</h2>
</div>
<button onClick={close} aria-label="Close">
<Icons.X size={20}/>
</button>
</div>
<form onSubmit={submit}>
<label className="wide">Task name<input name="title" required autoFocus placeholder="e.g. Edit launch video"/>
</label>
<label>Client<input name="client" required placeholder="Client name"/>
</label>
<label>Project<input name="project" required placeholder="Project name"/>
</label>
<label>Brand<select name="brand" defaultValue={brand === "ALL" ? "SQUATCH" : brand}>
<option value="ARRA">ARRA Studios</option>
<option value="SQUATCH">Squatch Media</option>
</select>
</label>
<label>Due date<input name="due" type="date" required defaultValue={getToday()}/>
</label>
<label>Status<select name="status" defaultValue="Not started">
<option>Not started</option>
<option>In progress</option>
<option>Needs approval</option>
<option>Revisions</option>
<option>Complete</option>
</select>
</label>
<label>Priority<select name="priority" defaultValue="Normal">
<option>Urgent</option>
<option>High</option>
<option>Normal</option>
<option>Low</option>
</select>
</label>
<div className="composer-actions">
<button type="button" className="secondary" onClick={close}>Cancel</button>
<button className="primary" type="submit">
<Icons.Plus size={15}/>Create {kind.toLowerCase()}</button>
</div>
</form>
</aside>
</>; }
