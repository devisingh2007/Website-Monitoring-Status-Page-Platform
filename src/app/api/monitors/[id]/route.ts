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
      .populate("projectId", "name slug isActive").lean();

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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }

    const monitor = await Monitor.findById(id);

    if (!monitor) {
      return NextResponse.json(
        { success: false, message: "Monitor not found" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const allowedFields = ["name","url","type","interval","timeout","expectedStatusCodes","enabled"];

    const providedFields = Object.keys(data);

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid editable fields provided.",
        },
        { status: 400 }
      );
    }

    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        return NextResponse.json(
          { success: false, message: "Monitor name must be text." },
          { status: 400 }
        );
      }

      const name = data.name.trim();

      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Monitor name must be between 2 and 100 characters.",
          },
          { status: 400 }
        );
      }

      monitor.name = name;
    }

    if (data.url !== undefined) {
      if (
        typeof data.url !== "string" ||
        data.url.trim().length > 2048
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid URL." },
          { status: 400 }
        );
      }

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(data.url.trim());
      } catch {
        return NextResponse.json(
          { success: false, message: "Please provide a valid URL." },
          { status: 400 }
        );
      }

      if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        !parsedUrl.hostname ||
        parsedUrl.username ||
        parsedUrl.password
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Only valid HTTP and HTTPS URLs are supported.",
          },
          { status: 400 }
        );
      }

      monitor.url = parsedUrl.toString();
    }

    if (data.type !== undefined) {
      if (data.type !== "website" && data.type !== "api") {
        return NextResponse.json(
          {
            success: false,
            message: "Monitor type must be website or api.",
          },
          { status: 400 }
        );
      }

      monitor.type = data.type;
    }

    if (data.interval !== undefined) {
      const allowedIntervals = [
        300, 600, 900, 1200, 1500, 1800,
      ];

      if (
        typeof data.interval !== "number" ||
        !Number.isInteger(data.interval) ||
        !allowedIntervals.includes(data.interval)
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid monitor interval." },
          { status: 400 }
        );
      }

      monitor.interval = data.interval;
    }

    if (data.timeout !== undefined) {
      if (
        typeof data.timeout !== "number" ||
        !Number.isInteger(data.timeout) ||
        data.timeout < 1000 ||
        data.timeout > 30000
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Timeout must be between 1000 and 30000 milliseconds.",
          },
          { status: 400 }
        );
      }

      monitor.timeout = data.timeout;
    }

    if (data.expectedStatusCodes !== undefined) {
      const codes = data.expectedStatusCodes;

      if (
        !Array.isArray(codes) ||
        codes.length === 0 ||
        codes.length > 20 ||
        codes.some(
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
            message:
              "Expected status codes must be integers between 200 and 599.",
          },
          { status: 400 }
        );
      }

      monitor.expectedStatusCodes = [...new Set(codes)];
    }

    if (data.enabled !== undefined) {
      if (typeof data.enabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "Enabled must be true or false.",
          },
          { status: 400 }
        );
      }

      monitor.enabled = data.enabled;

      if (data.enabled) {
        monitor.nextCheckAt = new Date();
      }
    }

    
    await monitor.save();

    return NextResponse.json(
      {
        success: true,
        message: "Monitor updated successfully.",
        data: monitor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE MONITOR ERROR:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update monitor." },
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
