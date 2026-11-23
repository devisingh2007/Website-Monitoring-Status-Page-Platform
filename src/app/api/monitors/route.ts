import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { Project, Monitor } from "@/models";


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
//! interval 5,10,15,20,25,30 minute hi ho sakta hai schema me set kiya hai 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      projectId,
      name,
      url,
      type,
      interval = 300,
      timeout = 10000,
      expectedStatusCodes = [200],
    } = body;

    if (!projectId || !name || !url || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID, name, URL and type are required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID.",
        },
        { status: 400 }
      );
    }

    const monitorName = String(name).trim();

    if (monitorName.length < 2 || monitorName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Monitor name must be between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(String(url).trim());
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid URL.",
        },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password ||
      String(url).trim().length > 2048
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only valid HTTP and HTTPS URLs are supported.",
        },
        { status: 400 }
      );
    }

    if (!["website", "api"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Monitor type must be website or api.",
        },
        { status: 400 }
      );
    }

    const allowedIntervals = [300, 600, 900, 1200, 1500, 1800];

    if (!Number.isInteger(interval) ||!allowedIntervals.includes(interval)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid interval. Choose between 5 and 30 minutes.",
        },
        { status: 400 }
      );
    }

    
    if (!Number.isInteger(timeout) ||timeout < 1000 ||timeout > 30000) {
      return NextResponse.json(
        {
          success: false,
          message: "Timeout must be between 1000 and 30000 milliseconds.",
        },
        { status: 400 }
      );
    }

    
    if (
      !Array.isArray(expectedStatusCodes) ||
      expectedStatusCodes.length === 0 ||
      expectedStatusCodes.length > 20 ||
      expectedStatusCodes.some(
        (code: unknown) =>
          typeof code !== "number" ||
          !Number.isInteger(code) ||
          code < 200 ||
          code > 599
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Expected status codes must be integers between 200 and 599.",
        },
        { status: 400 }
      );
    }

    const uniqueStatusCodes = [...new Set(expectedStatusCodes)];

    
    const project = await Project.findById(projectId);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found.",
        },
        { status: 404 }
      );
    }

    if (!project.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot add a monitor to an inactive project.",
        },
        { status: 400 }
      );
    }

    
    const monitor = await Monitor.create({
      projectId,
      name: monitorName,
      url: parsedUrl.toString(),
      type,
      interval,
      timeout,
      expectedStatusCodes: uniqueStatusCodes,
      status: "operational",
      enabled: true,
      failureCount: 0,
      nextCheckAt: new Date(),
      lastCheckedAt: null,
      lastResponseTime: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Monitor created successfully.",
        data: monitor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE MONITOR ERROR:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create monitor.",
      },
      { status: 500 }
    );
  }
}
