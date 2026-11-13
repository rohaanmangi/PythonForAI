import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const payload = body as { query?: unknown; session_id?: unknown };
  if (typeof payload.query !== "string" || !payload.query.trim() || typeof payload.session_id !== "string" || !payload.session_id.trim()) {
    return NextResponse.json({ error: "A message and session ID are required." }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: payload.query.trim(), session_id: payload.session_id }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    const data = await response.json().catch(() => ({ error: "The assistant returned an unreadable response." }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "The request timed out and may have completed. Start a new chat after checking your history.", retryable: false }, { status: 504 });
    }
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    const retryable = ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH"].includes(code || "");
    const message = retryable
      ? "Could not connect to the assistant. Check that the FastAPI server is running, then retry."
      : "The connection ended before a reply arrived. The request may have completed; start a new chat after checking your history.";
    return NextResponse.json({ error: message, retryable }, { status: 502 });
  }
}
