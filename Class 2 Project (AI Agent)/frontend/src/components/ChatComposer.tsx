"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = { value: string; onChange: (value: string) => void; onSend: () => void; disabled: boolean };

export function ChatComposer({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <div className="composer-shell">
      <div className="composer-box">
        <label className="composer-label" htmlFor="message-input">Message</label>
        <textarea
          ref={ref}
          id="message-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Message Xander..."
          rows={1}
          maxLength={8000}
          aria-label="Message Xander"
          disabled={disabled}
        />
        <div className="composer-controls">
          <div className="composer-left">
            <span className="composer-context"><Sparkles size={13} /> Xander support</span>
          </div>
          <div className="composer-right">
            <span className="composer-hint">Shift + Enter for a new line</span>
            <button className="send-button" onClick={onSend} disabled={disabled || !value.trim()} aria-label="Send message" title="Send message">
              <ArrowUp size={19} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
      <p className="composer-note">Xander can make mistakes. Check important details.</p>
    </div>
  );
}

