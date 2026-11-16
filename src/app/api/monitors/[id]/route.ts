import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import {Monitor} from "@/models";

type RouteContext = {params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid monitor ID"
        },
        { status: 400 }
      );
    }

    const monitor = await Monitor.findById(id)
      .populate("projectId", "name slug").lean();

    if (!monitor) {
      return NextResponse.json({success: false,message: "Monitor not found"},{ status: 404 }
      );
    }

    return NextResponse.json({success: true,data: monitor},{ status: 200 });
  } catch (error) {
    console.error("GET Monitor By ID Error:", error);

    return NextResponse.json({success: false,message: "Failed to fetch monitor"},{ status: 500 });
  }
}



export async function PATCH(request: Request,{ params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }

     const body = await request.json();

   

    const monitor = await Monitor.findById(id);

    if (!monitor) {
      return NextResponse.json(
        { success: false, message: "Monitor not found" },
        { status: 404 }
      );
    }


    const allowedFields = ["name","url","type","interval","timeout","expectedStatusCodes","enabled",] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({success: false,message: "No valid fields provided"},{ status: 400 }
      );
    }

    if (updates.url !== undefined) {
      if (typeof updates.url !== "string") {
        return NextResponse.json({ success: false, message: "URL must be a string" },{ status: 400 });
      }

      try {
        const parsedUrl = new URL(updates.url);

            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    
          throw new Error("Invalid protocol");
        }

        updates.url = parsedUrl.toString();
      } catch {
        return NextResponse.json({ success: false, message: "Invalid HTTP/HTTPS URL" },{ status: 400 });
      }
    }

    if (updates.type !== undefined &&updates.type !== "website" && updates.type !== "api") {
      return NextResponse.json({success: false,message: "Type must be website or api"},{ status: 400 });
    }

    monitor.set(updates);

    await monitor.save();

    return NextResponse.json({success: true,message: "Monitor updated successfully",data: monitor
      },{ status: 200 });

  } catch (error) {
    console.error("PATCH Monitor Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update monitor"
      },
      { status: 500 }
    );
  }
}



export async function DELETE(_request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
          success: false,
          message: "Invalid monitor ID"
        },{ status: 400 }
      );
    }

    const monitor = await Monitor.findById(id);

    if (!monitor) {
      return NextResponse.json({
          success: false,
          message: "Monitor not found"
        },{ status: 404 }
      );
    }

    monitor.enabled = false;
    monitor.status = "paused";

    await monitor.save();

    return NextResponse.json({
        success: true,
        message: "Monitor disabled successfully",
        data: monitor
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE Monitor Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to disable monitor"
      },
      { status: 500 }
    );
  }
}
