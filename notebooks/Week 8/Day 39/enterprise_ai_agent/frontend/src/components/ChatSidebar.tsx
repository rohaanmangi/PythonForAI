"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronsLeft, ChevronsRight, Menu, MessageSquarePlus, Moon,
  Search, Sun, X,
} from "lucide-react";
import type { ConversationSummary, Theme } from "@/lib/types";

type Props = {
  sessions: ConversationSummary[];
  activeSessionId: string;
  theme: Theme;
  mobileOpen: boolean;
  onNewChat: () => void;
  onSelect: (sessionId: string) => void;
  onThemeChange: (theme: Theme) => void;
  onMobileClose: () => void;
};

export function ChatSidebar({ sessions, activeSessionId, theme, mobileOpen, onNewChat, onSelect, onThemeChange, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const visibleSessions = useMemo(() => sessions.filter((session) => session.title.toLowerCase().includes(search.toLowerCase())), [sessions, search]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "k") { event.preventDefault(); onNewChat(); }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); setCollapsed(false); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [onNewChat]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const expandForMobile = (event: MediaQueryListEvent | MediaQueryList) => { if (event.matches) setCollapsed(false); };
    expandForMobile(query);
    query.addEventListener("change", expandForMobile);
    return () => query.removeEventListener("change", expandForMobile);
  }, []);

  return (
    <>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onMobileClose} />}
      <aside id="app-navigation" className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="#main" aria-label="Xander home">
            <span className="brand-mark"><span /></span>
            {!collapsed && <span className="brand-name">xander<span className="brand-period">.</span></span>}
          </a>
          <button className="icon-button collapse-button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-controls="app-navigation" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
          <button className="icon-button mobile-close" onClick={onMobileClose} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <button className="new-chat-button" onClick={onNewChat} title="Start a new chat">
          <MessageSquarePlus size={17} strokeWidth={1.8} />
          {!collapsed && <span>New chat</span>}
          {!collapsed && <kbd>Ctrl K</kbd>}
        </button>

        {!collapsed && <div className="sidebar-section-label">Workspace</div>}
        <div className="sidebar-tools">
          {!collapsed ? (
            <label className="search-field"><Search size={16} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" aria-label="Search conversations" /><kbd>Ctrl F</kbd></label>
          ) : <button className="side-tool icon-button" title="Search chats" aria-label="Search chats" onClick={() => setCollapsed(false)}><Search size={18} /></button>}
        </div>

        <div className="conversation-list-wrap">
          {!collapsed && <div className="sidebar-section-label recent-label">Recent</div>}
          <div className="conversation-list">
            {visibleSessions.map((session) => (
              <button key={session.sessionId} className={`conversation-item ${activeSessionId === session.sessionId ? "conversation-item--active" : ""}`} onClick={() => { onSelect(session.sessionId); onMobileClose(); }} title={session.title}>
                <MessageSquarePlus size={16} strokeWidth={1.7} />
                {!collapsed && <span className="conversation-title">{session.title}</span>}
              </button>
            ))}
            {!collapsed && visibleSessions.length === 0 && <p className="empty-search">{search ? "No matching chats" : "Your conversations will appear here."}</p>}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-row" title="Xander restaurant support">
            <span className="profile-avatar">X</span>
            {!collapsed && <span className="profile-copy"><strong>Xander Support</strong><small>Restaurant assistant</small></span>}
          </div>
          <div className="sidebar-bottom-actions">
            <button className="bottom-action" onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {!collapsed && <span>{theme === "dark" ? "Light appearance" : "Dark appearance"}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick, expanded }: { onClick: () => void; expanded: boolean }) {
  return <button className="icon-button mobile-menu-button" aria-expanded={expanded} aria-controls="app-navigation" aria-label={expanded ? "Close navigation" : "Open navigation"} onClick={onClick}><Menu size={20} /></button>;
}

