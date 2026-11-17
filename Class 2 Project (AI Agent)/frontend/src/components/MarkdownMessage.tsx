"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  const components: Components = {
    pre: CodeBlock,
    code({ className, children, ...props }) {
      const language = /language-([\w-]+)/.exec(className || "")?.[1];
      if (!language) return <code className={className} {...props}>{children}</code>;
      return <code className={className} {...props}>{highlightCode(String(children), language)}</code>;
    },
    a({ href, children, ...props }) {
      return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
    },
  };
  return <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown></div>;
}

const keywordSet = new Set("as async await break case catch class const continue def del elif else export extends finally for from function if import in is let new of pass raise return static switch this throw try typeof var void while with yield true false null None self console log print interface type enum implements public private protected try using namespace package select from where join left inner outer on as order by group having desc asc insert into values update set delete create table text integer primary key autoincrement default not null and or distinct limit offset count sum avg".split(" "));
const keywordPattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;

function highlightCode(code: string, language: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  keywordPattern.lastIndex = 0;
  while ((match = keywordPattern.exec(code))) {
    if (match.index > lastIndex) parts.push(code.slice(lastIndex, match.index));
    const token = match[0];
    const className = token.startsWith("//") || token.startsWith("#") || token.startsWith("/*")
      ? "hljs-comment"
      : /^["'`]/.test(token)
        ? "hljs-string"
        : /^\d/.test(token)
          ? "hljs-number"
          : keywordSet.has(language === "json" ? token.toLowerCase() : token) || (language === "json" && ["true", "false", "null"].includes(token.toLowerCase()))
            ? "hljs-keyword"
            : "";
    parts.push(className ? <span className={className} key={`${match.index}-${token}`}>{token}</span> : token);
    lastIndex = keywordPattern.lastIndex;
  }
  if (lastIndex < code.length) parts.push(code.slice(lastIndex));
  return parts;
}

function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(extractText(children));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code-frame">
      <div className="code-toolbar"><span>Code</span><button onClick={copy} aria-label="Copy code">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) return extractText((node as { props: { children?: ReactNode } }).props.children);
  return "";
}
