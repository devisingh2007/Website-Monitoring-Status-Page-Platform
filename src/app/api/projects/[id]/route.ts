import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Project ,Monitor} from "@/models";
import mongoose from "mongoose";

type RouteContext = {
  params: Promise<{ id: string }>;
};


export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 }
      );
    }

    const project = await Project.findById(id).lean();

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    const monitors = await Monitor.find({
      projectId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: monitors.length,
      operational: monitors.filter(
        (monitor) => monitor.status === "operational"
      ).length,
      down: monitors.filter(
        (monitor) => monitor.status === "down"
      ).length,
      paused: monitors.filter(
        (monitor) => monitor.status === "paused"
      ).length,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Project details fetched successfully",
        data: {
          project,
          monitors,
          stats,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Project Details Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project details",
      },
      { status: 500 }
    );
  }
}



export async function DELETE(request: Request,{ params }: RouteContext) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const monitorCount = await Monitor.countDocuments({
      projectId: id,
    });

    if (monitorCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `This project has ${monitorCount} monitor(s). Remove or reassign them before deleting the project.`,
          monitorCount,
        },
        { status: 409 }
      );
    }

    await Project.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete project" },
      { status: 500 }
    );
  }
}


export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project id",
        },
        { status: 400 },
      );
    }
    const body = await request.json();

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const allowedfiled = ["name", "description", "slug", "isActive"] as const;

    for (const field of allowedfiled) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        project.set(field, body[field]);
      }
    }

    await project.save();

    return NextResponse.json(
      { success: true, message: "Project updated successfully", data: project },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH Project Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update project",
      },
      { status: 500 },
    );
  }
}
