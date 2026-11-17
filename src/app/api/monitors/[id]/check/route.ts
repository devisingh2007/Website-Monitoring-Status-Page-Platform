import { NextResponse } from "next/server";

import { runMonitorCheck } from "@/lib/monitoring/run-monitor-check";


type RouteContex={params:Promise<{id:string}>};

export async function POST(request:Request,{params}:RouteContex) {
    try {
        const {id }=await params;

        const result =await runMonitorCheck(id);
        return NextResponse.json({success:true,message:"Monitor check complete",data:result})
    } catch (error) {
        return NextResponse.json({success:false,message:error instanceof Error ?error.message:"Health check failed"},{status:500});
    }
    
}