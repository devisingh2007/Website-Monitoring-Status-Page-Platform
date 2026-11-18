import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";

import {
  Project,
  Monitor,
  CheckResult,
  Incident,
  IncidentHistory,
} from "@/models";

export async function GET() {
  try {
    await connectDB();

    const models = {
      project: Project,
      monitor: Monitor,
      checkResult: CheckResult,
      incident: Incident,
      IncidentHistory: IncidentHistory,
    };

    return NextResponse.json({
      success: true,
      message: "All models registered successfully",
      models: Object.fromEntries(
        Object.entries(models).map(([key, model]) => [
          key,
          model.modelName,
        ])
      ),
    });
  } catch (error) {
    console.error("Model test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Model registration failed",
      },
      { status: 500 }
    );
  }
}