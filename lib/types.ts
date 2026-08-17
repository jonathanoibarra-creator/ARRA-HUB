export type Brand="ARRA"|"SQUATCH"; export type Priority="Urgent"|"High"|"Normal"|"Low";
export type Status="Not started"|"In progress"|"Needs approval"|"Revisions"|"Complete";
export type Task={id:string;title:string;brand:Brand;client:string;project:string;assignee:string;initials:string;status:Status;priority:Priority;due:string;kind:"Task"|"Deliverable";working?:string;review?:string;final?:string;completedAt?:string;updatedAt?:string};
