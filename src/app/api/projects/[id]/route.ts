import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Project } from "@/models";
import mongoose from "mongoose";
import { success } from "zod";
import next from "next";

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
        { status: 400 },
      );
    }

    const project = await Project.findById(id).lean();

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: "project  founded",
        data: project,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Project By ID Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 },
      );
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
        data: deletedProject,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE Project Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete project",
      },
      { status: 500 },
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
