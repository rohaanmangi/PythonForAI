import type { ChatMessage, ConversationSummary, Theme } from "@/lib/types";

const ACTIVE_KEY = "xander.active-session";
const SESSIONS_KEY = "xander.sessions";
const THEME_KEY = "xander.theme";
const messagesKey = (sessionId: string) => `xander.messages.${sessionId}`;

export function createSessionId() {
  return crypto.randomUUID();
}

export function getActiveSession() {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveSession(sessionId: string) {
  localStorage.setItem(ACTIVE_KEY, sessionId);
}

export function readSessions(): ConversationSummary[] {
  try {
    const value = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeSessions(sessions: ConversationSummary[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function readCachedMessages(sessionId: string): ChatMessage[] {
  try {
    const value = JSON.parse(localStorage.getItem(messagesKey(sessionId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeCachedMessages(sessionId: string, messages: ChatMessage[]) {
  localStorage.setItem(messagesKey(sessionId), JSON.stringify(messages.slice(-200)));
}

export function rememberSession(sessionId: string, messages: ChatMessage[]) {
  const previous = readSessions().filter((session) => session.sessionId !== sessionId);
  const firstUserMessage = messages.find((message) => message.role === "user")?.content;
  const title = firstUserMessage?.replace(/\s+/g, " ").trim().slice(0, 54) || "New conversation";
  writeSessions([{ sessionId, title, updatedAt: Date.now() }, ...previous].slice(0, 80));
}

export function readTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function writeTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}
