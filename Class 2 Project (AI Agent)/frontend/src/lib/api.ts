import type { ChatResponse, HistoryResponse } from "@/lib/types";

export class ChatRequestError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
    this.name = "ChatRequestError";
  }
}

async function readError(response: Response): Promise<ChatRequestError> {
  try {
    const body = await response.json();
    return new ChatRequestError(body.detail || body.error || body.message || `Request failed (${response.status})`, body.retryable === true);
  } catch {
    return new ChatRequestError(`Request failed (${response.status})`);
  }
}

export async function sendMessage(query: string, sessionId: string): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId }),
  });
  if (!response.ok) throw await readError(response);
  return response.json();
}

export async function getHistory(sessionId: string): Promise<HistoryResponse> {
  const response = await fetch(`/api/history?session_id=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw await readError(response);
  return response.json();
}
