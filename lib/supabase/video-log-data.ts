import type {SupabaseClient} from "@supabase/supabase-js";
import type {Brand} from "@/lib/types";

export type VideoLogStatus="Planned"|"Captured"|"Editing"|"In review"|"Published"|"Archived";
export type VideoLogType="Social video"|"Commercial"|"Interview"|"Testimonial"|"Wedding film"|"Event"|"Behind the scenes"|"Other";
export type VideoLogView="grid"|"list";
export type VideoLogSortKey="shootDate"|"title"|"client"|"status"|"location"|"producer";
export type VideoLogSortDirection="asc"|"desc";
export type VideoLogPreference={view:VideoLogView;sortKey:VideoLogSortKey;sortDirection:VideoLogSortDirection};

export type VideoLogEntry={
  id:string;
  title:string;
  brand:Brand;
  client:string;
  project:string;
  videoType:VideoLogType;
  status:VideoLogStatus;
  shootDate:string;
  location:string;
  locationAddress?:string;
  producer:string;
  subjects?:string;
  durationMinutes?:number;
  videoUrl?:string;
  reviewUrl?:string;
  rawFootageUrl?:string;
  tags:string[];
  notes:string;
  createdAt?:string;
  updatedAt?:string;
};

type VideoLogRow={
  id:string;
  title:string;
  brand:Brand;
  client_name:string;
  project_key:string;
  video_type:VideoLogType;
  status:"planned"|"shot"|"editing"|"review"|"published"|"archived";
  shoot_date:string;
  location_name:string;
  location_address:string|null;
  producer_name:string;
  subjects:string|null;
  duration_minutes:number|null;
  video_url:string|null;
  review_url:string|null;
  raw_footage_url:string|null;
  tags:string[]|null;
  notes:string;
  created_at:string;
  updated_at:string;
};

const statusToDatabase:Record<VideoLogStatus,VideoLogRow["status"]>={
  Planned:"planned",
  Captured:"shot",
  Editing:"editing",
  "In review":"review",
  Published:"published",
  Archived:"archived"
};

const statusFromDatabase:Record<VideoLogRow["status"],VideoLogStatus>={
  planned:"Planned",
  shot:"Captured",
  editing:"Editing",
  review:"In review",
  published:"Published",
  archived:"Archived"
};

export function videoLogFromRow(row:VideoLogRow):VideoLogEntry{
  return {
    id:row.id,
    title:row.title,
    brand:row.brand,
    client:row.client_name,
    project:row.project_key,
    videoType:row.video_type,
    status:statusFromDatabase[row.status],
    shootDate:row.shoot_date,
    location:row.location_name,
    locationAddress:row.location_address||undefined,
    producer:row.producer_name,
    subjects:row.subjects||undefined,
    durationMinutes:row.duration_minutes||undefined,
    videoUrl:row.video_url||undefined,
    reviewUrl:row.review_url||undefined,
    rawFootageUrl:row.raw_footage_url||undefined,
    tags:row.tags||[],
    notes:row.notes,
    createdAt:row.created_at,
    updatedAt:row.updated_at
  };
}

export function videoLogToRow(entry:VideoLogEntry,createdBy?:string){
  return {
    id:entry.id,
    title:entry.title,
    brand:entry.brand,
    client_name:entry.client,
    project_key:entry.project,
    video_type:entry.videoType,
    status:statusToDatabase[entry.status],
    shoot_date:entry.shootDate,
    location_name:entry.location,
    location_address:entry.locationAddress||null,
    producer_name:entry.producer,
    subjects:entry.subjects||null,
    duration_minutes:entry.durationMinutes||null,
    video_url:entry.videoUrl||null,
    review_url:entry.reviewUrl||null,
    raw_footage_url:entry.rawFootageUrl||null,
    tags:entry.tags,
    notes:entry.notes,
    updated_at:entry.updatedAt||new Date().toISOString(),
    ...(createdBy?{created_by:createdBy}:{})
  };
}

export async function loadVideoLogs(client:SupabaseClient){
  const {data,error}=await client.from("hub_video_logs")
    .select("id,title,brand,client_name,project_key,video_type,status,shoot_date,location_name,location_address,producer_name,subjects,duration_minutes,video_url,review_url,raw_footage_url,tags,notes,created_at,updated_at")
    .order("shoot_date",{ascending:false})
    .order("created_at",{ascending:false});
  if(error)throw error;
  return ((data||[]) as VideoLogRow[]).map(videoLogFromRow);
}

export async function upsertVideoLog(client:SupabaseClient,entry:VideoLogEntry,createdBy?:string){
  const {error}=await client.from("hub_video_logs").upsert(videoLogToRow(entry,createdBy),{onConflict:"id"});
  if(error)throw error;
}

export async function deleteVideoLog(client:SupabaseClient,id:string){
  const {error}=await client.from("hub_video_logs").delete().eq("id",id);
  if(error)throw error;
}

export async function loadVideoLogPreference(client:SupabaseClient):Promise<VideoLogPreference|null>{
  const {data,error}=await client.auth.getUser();
  if(error)throw error;
  const preference=data.user?.user_metadata?.video_log_preference as Partial<VideoLogPreference>|undefined;
  if(!preference)return null;
  const validViews:VideoLogView[]=["grid","list"];
  const validSortKeys:VideoLogSortKey[]=["shootDate","title","client","status","location","producer"];
  const validDirections:VideoLogSortDirection[]=["asc","desc"];
  if(!validViews.includes(preference.view as VideoLogView)||!validSortKeys.includes(preference.sortKey as VideoLogSortKey)||!validDirections.includes(preference.sortDirection as VideoLogSortDirection))return null;
  return {
    view:preference.view as VideoLogView,
    sortKey:preference.sortKey as VideoLogSortKey,
    sortDirection:preference.sortDirection as VideoLogSortDirection
  };
}

export async function saveVideoLogPreference(client:SupabaseClient,preference:VideoLogPreference){
  const {error}=await client.auth.updateUser({data:{video_log_preference:preference}});
  if(error)throw error;
}
