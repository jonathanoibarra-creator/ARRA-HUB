import {Task} from "./types";

export const tasks:Task[]=[
  {id:"T-2001",title:"Liz & Junior wedding edit",brand:"ARRA",client:"Liz & Junior",project:"Wedding film",assignee:"Jonathan Ibarra",initials:"JI",status:"In progress",priority:"Urgent",due:"2026-08-15",kind:"Task"},
  {id:"T-2002",title:"Edit Furniture City video",brand:"SQUATCH",client:"Furniture City",project:"Social video",assignee:"Jonathan Ibarra",initials:"JI",status:"Not started",priority:"High",due:"2026-08-16",kind:"Task"},
  {id:"T-2003",title:"Dr. Tehrani — complete 2 videos today",brand:"SQUATCH",client:"Dr. Tehrani",project:"Daily video content",assignee:"Jonathan Ibarra",initials:"JI",status:"In progress",priority:"High",due:"2026-08-16",kind:"Task"},
  {id:"T-2004",title:"Finish Terrazas logo",brand:"ARRA",client:"Terrazas",project:"Brand identity",assignee:"Jonathan Ibarra",initials:"JI",status:"In progress",priority:"High",due:"2026-08-16",kind:"Deliverable",working:"https://drive.google.com"},
  {id:"T-2005",title:"Finish DME video edit",brand:"SQUATCH",client:"DME",project:"Video production",assignee:"Jonathan Ibarra",initials:"JI",status:"In progress",priority:"High",due:"2026-08-16",kind:"Deliverable",working:"https://drive.google.com"},
  {id:"T-2006",title:"Video shoot with Ernesto",brand:"SQUATCH",client:"Ernesto",project:"Video shoot",assignee:"Jonathan Ibarra",initials:"JI",status:"Not started",priority:"High",due:"2026-08-17",kind:"Task"},
  {id:"T-2007",title:"9:00 AM — Video shoot with Dr. Gabbay",brand:"SQUATCH",client:"Dr. Gabbay",project:"Video shoot",assignee:"Jonathan Ibarra",initials:"JI",status:"Not started",priority:"High",due:"2026-08-18",kind:"Task"},
  {id:"T-2008",title:"6:00 PM — Video shoot with Nelson Salinas",brand:"SQUATCH",client:"Nelson Salinas",project:"Video shoot",assignee:"Jonathan Ibarra",initials:"JI",status:"Not started",priority:"High",due:"2026-08-18",kind:"Task"},
  {id:"T-2009",title:"Dr. Tehrani — next 2 daily videos",brand:"SQUATCH",client:"Dr. Tehrani",project:"Daily video content",assignee:"Jonathan Ibarra",initials:"JI",status:"Not started",priority:"Normal",due:"2026-08-17",kind:"Task"}
];

export const clients=[
  {name:"Liz & Junior",brand:"ARRA",projects:1,contact:"Wedding clients",health:"At risk"},
  {name:"Furniture City",brand:"SQUATCH",projects:1,contact:"Marketing team",health:"On track"},
  {name:"Dr. Tehrani",brand:"SQUATCH",projects:1,contact:"Content team",health:"On track"},
  {name:"Dr. Gabbay",brand:"SQUATCH",projects:1,contact:"Practice team",health:"On track"},
  {name:"Nelson Salinas",brand:"SQUATCH",projects:1,contact:"Nelson Salinas",health:"On track"},
  {name:"Terrazas",brand:"ARRA",projects:1,contact:"Brand contact",health:"On track"},
  {name:"DME",brand:"SQUATCH",projects:1,contact:"Marketing team",health:"On track"}
];

export const projects=[
  {name:"Wedding film",client:"Liz & Junior",brand:"ARRA",progress:65,due:"Aug 15"},
  {name:"Daily video content",client:"Dr. Tehrani",brand:"SQUATCH",progress:40,due:"Ongoing"},
  {name:"Social video",client:"Furniture City",brand:"SQUATCH",progress:35,due:"Aug 16"},
  {name:"Brand identity",client:"Terrazas",brand:"ARRA",progress:80,due:"Aug 16"},
  {name:"Video production",client:"DME",brand:"SQUATCH",progress:70,due:"Aug 16"}
];
