import type {SupabaseClient} from "@supabase/supabase-js";
import type {Brand, Priority, Status, Task} from "@/lib/types";

export type ProjectLink={id:string;title:string;url:string;project:string;brand:Brand;kind:string;updatedAt?:string};

type WorkItemRow={
  id:string;
  title:string;
  brand:Brand;
  client_name:string;
  project_key:string;
  assignee_name:string;
  assignee_initials:string;
  status:"not_started"|"in_progress"|"needs_approval"|"revisions"|"complete"|"cancelled";
  priority:"low"|"normal"|"high"|"urgent";
  due_date:string;
  kind:"Task"|"Deliverable";
  working_url:string|null;
  review_url:string|null;
  final_url:string|null;
  completed_at:string|null;
  updated_at:string;
};

type ProjectLinkRow={
  id:string;
  title:string;
  url:string;
  project_key:string;
  brand:Brand;
  kind:string;
  updated_at:string;
};

const statusToDatabase:Record<Status,WorkItemRow["status"]>={
  "Not started":"not_started",
  "In progress":"in_progress",
  "Needs approval":"needs_approval",
  Revisions:"revisions",
  Complete:"complete"
};

const statusFromDatabase:Record<WorkItemRow["status"],Status>={
  not_started:"Not started",
  in_progress:"In progress",
  needs_approval:"Needs approval",
  revisions:"Revisions",
  complete:"Complete",
  cancelled:"Complete"
};

const priorityToDatabase:Record<Priority,WorkItemRow["priority"]>={
  Low:"low",
  Normal:"normal",
  High:"high",
  Urgent:"urgent"
};

const priorityFromDatabase:Record<WorkItemRow["priority"],Priority>={
  low:"Low",
  normal:"Normal",
  high:"High",
  urgent:"Urgent"
};

export function taskFromRow(row:WorkItemRow):Task{
  return {
    id:row.id,
    title:row.title,
    brand:row.brand,
    client:row.client_name,
    project:row.project_key,
    assignee:row.assignee_name,
    initials:row.assignee_initials,
    status:statusFromDatabase[row.status],
    priority:priorityFromDatabase[row.priority],
    due:row.due_date,
    kind:row.kind,
    working:row.working_url||undefined,
    review:row.review_url||undefined,
    final:row.final_url||undefined,
    completedAt:row.completed_at||undefined,
    updatedAt:row.updated_at
  };
}

export function taskToRow(task:Task,createdBy?:string){
  return {
    id:task.id,
    title:task.title,
    brand:task.brand,
    client_name:task.client,
    project_key:task.project,
    assignee_name:task.assignee,
    assignee_initials:task.initials,
    status:statusToDatabase[task.status],
    priority:priorityToDatabase[task.priority],
    due_date:task.due,
    kind:task.kind,
    working_url:task.working||null,
    review_url:task.review||null,
    final_url:task.final||null,
    completed_at:task.completedAt||null,
    updated_at:task.updatedAt||new Date().toISOString(),
    ...(createdBy?{created_by:createdBy}:{})
  };
}

export async function loadTasks(client:SupabaseClient){
  const {data,error}=await client.from("hub_work_items").select("id,title,brand,client_name,project_key,assignee_name,assignee_initials,status,priority,due_date,kind,working_url,review_url,final_url,completed_at,updated_at").order("created_at",{ascending:true});
  if(error)throw error;
  return ((data||[]) as WorkItemRow[]).map(taskFromRow);
}

export async function upsertTask(client:SupabaseClient,task:Task,createdBy?:string){
  const {error}=await client.from("hub_work_items").upsert(taskToRow(task,createdBy),{onConflict:"id"});
  if(error)throw error;
}

export function linkFromRow(row:ProjectLinkRow):ProjectLink{
  return {id:row.id,title:row.title,url:row.url,project:row.project_key,brand:row.brand,kind:row.kind,updatedAt:row.updated_at};
}

export function linkToRow(link:ProjectLink,createdBy?:string){
  return {
    id:link.id,
    title:link.title,
    url:link.url,
    project_key:link.project,
    brand:link.brand,
    kind:link.kind,
    updated_at:link.updatedAt||new Date().toISOString(),
    ...(createdBy?{created_by:createdBy}:{})
  };
}

export async function loadProjectLinks(client:SupabaseClient){
  const {data,error}=await client.from("hub_project_links").select("id,title,url,project_key,brand,kind,updated_at").order("created_at",{ascending:false});
  if(error)throw error;
  return ((data||[]) as ProjectLinkRow[]).map(linkFromRow);
}

export async function upsertProjectLink(client:SupabaseClient,link:ProjectLink,createdBy?:string){
  const {error}=await client.from("hub_project_links").upsert(linkToRow(link,createdBy),{onConflict:"id"});
  if(error)throw error;
}

export async function deleteProjectLink(client:SupabaseClient,id:string){
  const {error}=await client.from("hub_project_links").delete().eq("id",id);
  if(error)throw error;
}
