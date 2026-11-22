"use client";
import { AlertCircle, FolderKanban, History, LayoutDashboard, Monitor, Settings } from "lucide-react";
import Link from "next/link";


const navigation=[
  {
    name:"Dashboard",
    href:"/dashboard",
    icon:LayoutDashboard,
  },
  {
    name:"Projects",
    href:"/projects",
    icon:FolderKanban,
  },
  {
    name:"Monitors",
    href:"/monitors",
    icon:Monitor,
  },
  {
    name:"Incidents",
    href:"/incidents",
    icon:AlertCircle,
  },
  {
    name:"Check History",
    href:"/history",
    icon:History,
  },
  {
    name:"Settings",
    href:"/settings",
    icon:Settings,
  },
]
export default function page()
{
  return(
    <div>


      {
        navigation.map((item)=>{ const Icon = item.icon;

return(<div><Icon size={18} strokeWidth={1.8}/></div>)})
      }
    </div>
  )
}