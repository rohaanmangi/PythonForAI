"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, CircleDollarSign, Copy, MessageSquareWarning, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatSidebar, MobileMenuButton } from "@/components/ChatSidebar";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { ChatRequestError, getHistory, sendMessage } from "@/lib/api";
import { createSessionId, getActiveSession, readCachedMessages, readSessions, readTheme, rememberSession, setActiveSession, writeCachedMessages, writeTheme } from "@/lib/storage";
import type { ChatMessage, ConversationSummary, Theme } from "@/lib/types";

const suggestions = [
  { title: "View the menu", prompt: "What is on the menu today?", icon: BookOpen },
  { title: "Check a price", prompt: "How much is a chicken karahi?", icon: CircleDollarSign },
  { title: "Make a complaint", prompt: "I would like to report an issue with my order.", icon: MessageSquareWarning },
];

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const loadSession = useCallback(async (id: string) => {
    const requestId = ++requestRef.current;
    setConnectionError("");
    try {
      const data = await getHistory(id);
      if (requestId !== requestRef.current) return;
      const restoredFromApi = data.messages.map((message, index): ChatMessage => ({
        id: `${id}-${index}`,
        role: message.role === "ai" ? "assistant" : "user",
        content: message.content,
        createdAt: Date.now() - (data.messages.length - index) * 1000,
      }));
      const cached = readCachedMessages(id);
      let sharedPrefix = 0;
      while (sharedPrefix < restoredFromApi.length && sharedPrefix < cached.length && restoredFromApi[sharedPrefix].role === cached[sharedPrefix].role && restoredFromApi[sharedPrefix].content === cached[sharedPrefix].content) sharedPrefix++;
      const restored = [...restoredFromApi, ...cached.slice(sharedPrefix)];
      setMessages(restored);
      if (restored.length) {
        rememberSession(id, restored);
        setSessions(readSessions());
      }
    } catch (error) {
      if (requestId !== requestRef.current) return;
      const cached = readCachedMessages(id);
      setMessages(cached);
      setConnectionError(error instanceof Error ? error.message : "Could not restore conversation history.");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const activeTheme = readTheme();
      setTheme(activeTheme);
      document.documentElement.dataset.theme = activeTheme;
      const storedSessions = readSessions();
      setSessions(storedSessions);
      const activeId = getActiveSession() || createSessionId();
      setActiveSession(activeId);
      setSessionId(activeId);
      if (storedSessions.some((session) => session.sessionId === activeId)) void loadSession(activeId);
    });
  }, [loadSession]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const selectSession = useCallback((id: string) => {
    setActiveSession(id);
    setSessionId(id);
    setMessages([]);
    setInput("");
    setBusy(false);
    void loadSession(id);
  }, [loadSession]);

  const newChat = useCallback(() => {
    const id = createSessionId();
    requestRef.current++;
    setActiveSession(id);
    setSessionId(id);
    setMessages([]);
    setInput("");
    setConnectionError("");
    setBusy(false);
    setMobileOpen(false);
  }, []);

  const updateSessionList = useCallback((id: string, nextMessages: ChatMessage[]) => {
    rememberSession(id, nextMessages);
    const saved = readSessions();
    setSessions(saved);
  }, []);

  const transmit = useCallback(async (query: string, id: string, existingMessages: ChatMessage[]) => {
    if (!query.trim() || !id || busy) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: query.trim(), createdAt: Date.now() };
    const nextMessages = [...removeFailedTurns(existingMessages), userMessage];
    setMessages(nextMessages);
    writeCachedMessages(id, nextMessages);
    setInput("");
    setBusy(true);
    setConnectionError("");
    updateSessionList(id, nextMessages);
    try {
      const response = await sendMessage(userMessage.content, id);
      if (id !== getActiveSession()) return;
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: response.answer, createdAt: Date.now() };
      const complete = [...nextMessages, assistantMessage];
      setMessages(complete);
      writeCachedMessages(id, complete);
      updateSessionList(id, complete);
    } catch (error) {
      if (id !== getActiveSession()) return;
      const failed: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: error instanceof Error ? error.message : "The assistant could not reply.", createdAt: Date.now(), error: true, retryable: error instanceof ChatRequestError && error.retryable };
      setMessages([...nextMessages, failed]);
      writeCachedMessages(id, [...nextMessages, failed]);
      setConnectionError("Your message is still here. You can retry the request.");
    } finally {
      if (id === getActiveSession()) setBusy(false);
    }
  }, [busy, updateSessionList]);

  const send = useCallback(() => { void transmit(input, sessionId, messages); }, [input, messages, sessionId, transmit]);
  const retry = useCallback((message: ChatMessage) => {
    const index = messages.findIndex((item) => item.id === message.id);
    const previousUser = [...messages.slice(0, index)].reverse().find((item) => item.role === "user");
    if (!previousUser || busy) return;
    const withoutError = messages.filter((item) => item.id !== message.id);
    setMessages(withoutError);
    setBusy(true);
    setConnectionError("");
    void sendMessage(previousUser.content, sessionId).then((response) => {
      if (sessionId !== getActiveSession()) return;
      const complete = [...withoutError, { id: crypto.randomUUID(), role: "assistant" as const, content: response.answer, createdAt: Date.now() }];
      setMessages(complete);
      writeCachedMessages(sessionId, complete);
      updateSessionList(sessionId, complete);
    }).catch((error: unknown) => {
      if (sessionId !== getActiveSession()) return;
      const failed: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: error instanceof Error ? error.message : "The assistant could not reply.", createdAt: Date.now(), error: true, retryable: error instanceof ChatRequestError && error.retryable };
      setMessages([...withoutError, failed]);
      writeCachedMessages(sessionId, [...withoutError, failed]);
      setConnectionError("Your message is still here. You can retry the request.");
    }).finally(() => { if (sessionId === getActiveSession()) setBusy(false); });
  }, [busy, messages, sessionId, updateSessionList]);

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    writeTheme(nextTheme);
  };

  const title = useMemo(() => sessions.find((session) => session.sessionId === sessionId)?.title || "New conversation", [sessions, sessionId]);
  const copySessionId = async () => {
    if (!sessionId) return;
    await navigator.clipboard.writeText(sessionId);
    setCopiedId(true);
    window.setTimeout(() => setCopiedId(false), 1500);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to conversation</a>
      <ChatSidebar sessions={sessions} activeSessionId={sessionId} theme={theme} mobileOpen={mobileOpen} onNewChat={newChat} onSelect={selectSession} onThemeChange={changeTheme} onMobileClose={() => setMobileOpen(false)} />
      <main className="main-panel" id="main">
       <section className="chat-workspace app-frame" aria-label="Conversation">
        <header className="topbar">
          <div className="topbar-left"><MobileMenuButton expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} /><div className="mobile-brand"><span className="brand-mark"><span /></span><span className="brand-name">xander<span className="brand-period">.</span></span></div><div className="breadcrumb"><span>Assistant</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div></div>
          <div className="topbar-actions"><div className="agent-badge">Restaurant support</div><button className="icon-button session-menu" title="Copy session ID" aria-label="Copy session ID" onClick={copySessionId}>{copiedId ? <Check size={17} /> : <Copy size={15} />}</button></div>
        </header>

          <div className="message-list" ref={listRef}>
            {messages.length === 0 ? <Welcome onSuggestion={(prompt) => setInput(prompt)} /> : (
              <div className="messages-inner">
                {messages.map((message) => <Message key={message.id} message={message} onRetry={retry} onNewChat={newChat} />)}
                {busy && <div className="message-row assistant-row"><div className="assistant-mark"><Sparkles size={16} /></div><div className="message-content"><div className="thinking-label"><span className="thinking-dots"><i /><i /><i /></span>Thinking</div></div></div>}
              </div>
            )}
          </div>
          <div className="composer-dock"><ChatComposer value={input} onChange={setInput} onSend={send} disabled={busy || messages.some((message) => message.error && !message.retryable)} />{connectionError && <div className="connection-note" role="status">{connectionError}</div>}</div>
       </section>
      </main>
    </div>
  );
}

function Welcome({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  return (
    <div className="welcome-wrap" data-enter>
      <div className="welcome-content">
        <div className="welcome-orb"><div className="orb-inner"><Sparkles size={25} strokeWidth={1.5} /></div><span className="orb-ring orb-ring-one" /><span className="orb-ring orb-ring-two" /></div>
        <p className="welcome-kicker"><span className="kicker-line" /> Menu · prices · order issues</p>
        <h1>Restaurant support<br /><span>for Xander</span></h1>
        <p className="welcome-description">2 specialist agents handle menu and price questions plus order complaints.</p>
        <div className="specialty-row"><span><span className="specialty-icon menu-specialty"><Sparkles size={13} /></span> Menu & prices</span><i /><span><span className="specialty-icon complaint-specialty"><UserRound size={13} /></span> Order complaints</span></div>
        <button className="welcome-action" onClick={() => onSuggestion(suggestions[0].prompt)}>Ask about the menu <ArrowRight size={16} /></button>
        <div className="suggestion-grid">
          {suggestions.map((item, index) => { const Icon = item.icon; return <button key={item.title} className={`suggestion-card suggestion-${index + 1}`} onClick={() => onSuggestion(item.prompt)}><span className="suggestion-title"><Icon size={15} aria-hidden="true" />{item.title}</span><span className="suggestion-arrow">↗</span><small>{item.prompt}</small></button>; })}
        </div>
      </div>
    </div>
  );
}

function Message({ message, onRetry, onNewChat }: { message: ChatMessage; onRetry: (message: ChatMessage) => void; onNewChat: () => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <article className={`message-row ${isUser ? "user-row" : "assistant-row"} ${message.error ? "message-error" : ""}`}>
      {isUser ? <div className="user-mark"><UserRound size={16} /></div> : <div className="assistant-mark"><Sparkles size={16} /></div>}
      <div className="message-content">
        <div className="message-author">{isUser ? "You" : "Xander"}</div>
        {message.error ? <div className="error-message"><p>{message.content}</p>{message.retryable ? <button onClick={() => onRetry(message)}><RotateCcw size={14} /> Retry</button> : <button onClick={onNewChat}>Start a new chat</button>}</div> : isUser ? <p className="user-message-text">{message.content}</p> : <MarkdownMessage content={message.content} />}
        {!isUser && !message.error && <div className="message-actions"><button onClick={copy} aria-label="Copy response" title="Copy response">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>}
      </div>
    </article>
  );
}

function removeFailedTurns(messages: ChatMessage[]) {
  const result = [...messages];
  for (let index = result.length - 1; index >= 0; index--) {
    if (!result[index].error) continue;
    result.splice(index, 1);
    const previousUser = result.slice(0, index).findLastIndex((message) => message.role === "user");
    if (previousUser >= 0) result.splice(previousUser, 1);
  }
  return result;
}
