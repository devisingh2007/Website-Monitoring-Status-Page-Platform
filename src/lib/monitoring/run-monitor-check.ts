import mongoose from "mongoose";
import connectDB from "../db";
import { CheckResult } from '@/models';
import {Monitor} from "@/models";
import { performHealthCheck } from "./health-check";


export async function runMonitorCheck(monitorId:string) {

    await connectDB();
    if(!mongoose.Types.ObjectId.isValid(monitorId))
    {
        throw new Error ("Invalid monitor ID");
    }
    const monitor=await Monitor.findById(monitorId);
    if(!monitor)
    {
        throw new Error("Monitor not found");
    }
    
    //! check monitoring is enable or not
    if(!monitor.enabled)
    {
        throw new Error("Monitorr is not enable");
    }

    //! now Health check for checking endPoint is running or not
    
    const result =await performHealthCheck({
        url:monitor.url,
        timeout:monitor.timeout,
        expectedStatusCodes:monitor.expectedStatusCodes,
    });

    // save it on database
    const checkResult=await CheckResult.create({
        monitorId:monitor._id,
        status:result.status,
        statusCode:result.statusCode,
        responseTime:result.responseTime,
    })

    return {
        monitorId:monitor._id,
        checkResult,
    }
}