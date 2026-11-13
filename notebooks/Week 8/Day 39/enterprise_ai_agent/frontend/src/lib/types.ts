export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  error?: boolean;
  retryable?: boolean;
};

export type ConversationSummary = {
  sessionId: string;
  title: string;
  updatedAt: number;
};

export type Theme = "dark" | "light";

export type HistoryResponse = {
  session_id: string;
  messages: Array<{ role: "user" | "ai"; content: string }>;
};

export type ChatResponse = { session_id: string; answer: string };
