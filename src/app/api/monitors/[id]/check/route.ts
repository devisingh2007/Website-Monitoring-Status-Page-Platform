import { NextResponse } from "next/server";

import { runMonitorCheck } from "@/lib/monitoring/run-monitor-check";

type RouteContex = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContex) {
  try {
    const { id } = await params;

    const result = await runMonitorCheck(id);
    return NextResponse.json({
      success: true,
      message: "Monitor check complete",
      data: result,
    });
  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : "Health check failed";

    const status =
      message === "Monitor not found" ? 404 :
      message === "Monitor is disabled" ? 409 :
      500;

    console.error("Manual Monitor Check:", error);

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
