import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Project } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find().sort({ createAt: -1 }).lean();

    return NextResponse.json(
      {
        success: true,
        count: projects.length,
        data: projects,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get projects Error", error);

    return NextResponse.json(
      {
        success: false,
        message: "failed to load projects",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, description, slug } = await request.json();
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Project name and slug are required",
        },
        { status: 400 },
      );
    }
    const existingProject = await Project.findOne({ slug });

    if (existingProject) {
      return NextResponse.json(
        {
          success: false,
          message: "Project with this slug already exist",
        },
        { status: 409 },
      );
    }
    const project = await Project.create({ name, description, slug });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST Project Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create project",
      },
      { status: 500 },
    );
  }
}
