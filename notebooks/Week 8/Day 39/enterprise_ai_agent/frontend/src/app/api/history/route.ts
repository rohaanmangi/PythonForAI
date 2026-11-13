import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "A session ID is required." }, { status: 400 });

  try {
    const url = `${backendUrl.replace(/\/$/, "")}/ai/history?session_id=${encodeURIComponent(sessionId)}`;
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const data = await response.json().catch(() => ({ error: "History could not be read." }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach the conversation history service." }, { status: 502 });
  }
}
