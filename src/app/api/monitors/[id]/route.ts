import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {Monitor,CheckResult,Incident,IncidentHistory} from "@/models";
import connectDB from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};


export async function GET(_request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }

    const monitor = await Monitor.findById(id)
      .populate("projectId", "name slug isActive")
      .lean();

    if (!monitor) {
      return NextResponse.json(
        { success: false, message: "Monitor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: monitor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET MONITOR ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch monitor" },
      { status: 500 }
    );
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

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

    const monitor = await Monitor.findById(id);

    if (!monitor) {
      return NextResponse.json(
        { success: false, message: "Monitor not found" },
        { status: 404 }
      );
    }

    const data = body as Record<string, unknown>;

    const allowedFields = ["name","url","type","interval","timeout","expectedStatusCodes","enabled"];

    const providedFields = Object.keys(data);

    if (
      providedFields.length === 0 ||
      providedFields.some(
        (field) => !allowedFields.includes(field)
      )
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
        data.url.trim().length === 0 ||
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
        (parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:") ||
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
      if (
        data.type !== "website" &&
        data.type !== "api"
      ) {
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

      const validCodes = codes as number[];

      if (new Set(validCodes).size !== validCodes.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Duplicate expected status codes are not allowed.",
          },
          { status: 400 }
        );
      }

      monitor.expectedStatusCodes = validCodes;
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

// ==========================================
// DELETE MONITOR
// ==========================================

export async function DELETE(_request: Request,{ params }: RouteContext) {
  let session: mongoose.ClientSession | undefined;

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid monitor ID",
        },
        { status: 400 }
      );
    }

    session = await mongoose.startSession();

    const deletedCounts = {
      checkResults: 0,
      incidents: 0,
      incidentHistories: 0,
    };

    await session.withTransaction(async () => {
      const monitor = await Monitor.findById(id).session(session!);

      if (!monitor) {
        throw new Error("MONITOR_NOT_FOUND");
      }

      const incidents = await Incident.find({monitorId: id,}).select("_id").session(session!).lean();

      const incidentIds = incidents.map(
        (incident) => incident._id
      );

      // 2. Delete incident histories
      const historyResult = await IncidentHistory.deleteMany(
        {
          incidentId: { $in: incidentIds },
        },
        { session }
      );

      deletedCounts.incidentHistories =
        historyResult.deletedCount;

      // 3. Delete incidents
      const incidentResult = await Incident.deleteMany(
        { monitorId: id },
        { session }
      );

      deletedCounts.incidents =
        incidentResult.deletedCount;

      // 4. Delete check results
      const checkResult = await CheckResult.deleteMany(
        { monitorId: id },
        { session }
      );

      deletedCounts.checkResults =
        checkResult.deletedCount;

      // 5. Delete monitor
      await Monitor.findByIdAndDelete(id).session(session!);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Monitor and related records deleted successfully.",
        data: deletedCounts,
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "MONITOR_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Monitor not found",
        },
        { status: 404 }
      );
    }

    console.error("DELETE MONITOR ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete monitor.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
