import connectDB from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ ok: true, message: "DB connected" });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}