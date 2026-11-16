import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Monitor } from "@/models";
import mongoose from "mongoose";
import { Project } from "@/models";


export async function GET() {
  try {
    await connectDB();

    const monitors = await Monitor.find()
      .populate("projectId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: monitors.length,
        data: monitors,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Monitors Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch monitors",
      },
      { status: 500 },
    );
  }
}
//! interval 5,10,15,30 minute hi ho sakta hai schema me set kiya hai 
export async function POST(request: Request) {
  try {
    await connectDB();
const body=await request.json();
    const {
      projectId,
      name,
      url,
      type,
      interval,
      timeout,
      expectedStatusCodes,
    } = body

    if (!projectId || !name || !url || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "ProjectId name,url and type are required",
        },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "project Id is required",
        },
        { status: 400 },
      );
    }

    if (type !== "website" && type !== "api") {
      return NextResponse.json(
        { success: false, message: "Type must be website or api" },
        { status: 400 },
      );
    }
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid URL" },
        { status: 400 },
      );
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        {
          success: false,
          message: "Only HTTP and HTTPS URLs are allowed",
        },
        { status: 400 },
      );
    }
    const project = await Project.findById(projectId);

    if (!project || !project.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found or inactive",
        },
        { status: 404 },
      );
    }

    const monitor = await Monitor.create({
      projectId,
      name,
      url: parsedUrl.toString(),
      type,
      ...(interval !== undefined && { interval }),
      ...(timeout !== undefined && { timeout }),
      ...(expectedStatusCodes !== undefined && { expectedStatusCodes }),
    });
    return NextResponse.json(
      {
        success: true,
        message: "Monitor created successfully",
        data: monitor,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST Monitor Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create monitor",
      },
      { status: 500 },
    );
  }
}
