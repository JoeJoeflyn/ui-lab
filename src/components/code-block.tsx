"use client";

import { useState, useMemo } from "react";

/**
 * CodeBlock — code display with copy-to-clipboard + syntax highlighting.
 *
 * Lightweight regex-based highlighter — no external dependency.
 * Supports tsx, bash. Colors: keywords (gold), strings (cyan),
 * comments (muted), JSX tags (gold), props (blue), numbers (amber).
 */
export function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlighted = useMemo(
    () => (language === "bash" ? highlightBash(code) : highlightTsx(code)),
    [code, language],
  );

  return (
    <div className="group relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 rounded-md border border-gold/15 bg-background/80 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-gold/60 opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-gold/30 hover:text-gold group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      {/* Language badge */}
      <span className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/30">
        {language}
      </span>

      <pre className="overflow-x-auto rounded-lg border border-gold/10 bg-card p-5 pt-8 font-mono text-xs leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Lightweight syntax highlighters
 * ────────────────────────────────────────────────────────────── */

const TSX_KEYWORDS = new Set([
  "import", "export", "from", "default", "const", "let", "var", "function",
  "return", "if", "else", "for", "while", "async", "await", "new", "class",
  "extends", "interface", "type", "enum", "as", "in", "of", "typeof",
  "true", "false", "null", "undefined", "void", "this", "super", "try",
  "catch", "finally", "throw", "break", "continue", "switch", "case",
  "default", "use client", "use server",
]);

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightTsx(code: string): string {
  // Tokenize while preserving positions. We process in order:
  // comments → strings → JSX tags → keywords → numbers → props
  // Using a single-pass tokenizer to avoid double-highlighting.

  const tokens: { type: string; value: string }[] = [];
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    // Line comment
    if (rest.startsWith("//")) {
      const end = code.indexOf("\n", i);
      const len = end === -1 ? code.length - i : end - i;
      tokens.push({ type: "comment", value: code.slice(i, i + len) });
      i += len;
      continue;
    }

    // Block comment
    if (rest.startsWith("/*")) {
      const end = code.indexOf("*/", i + 2);
      const len = end === -1 ? code.length - i : end + 2 - i;
      tokens.push({ type: "comment", value: code.slice(i, i + len) });
      i += len;
      continue;
    }

    // String (double, single, backtick)
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== ch) {
        if (code[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // JSX opening/closing tag name: <Component or </Component
    if (ch === "<" && /[a-zA-Z/]/.test(code[i + 1] ?? "")) {
      // Tag name
      let j = i + 1;
      if (code[j] === "/") j++;
      const tagStart = j;
      while (j < code.length && /[a-zA-Z0-9.]/.test(code[j])) j++;
      const tagName = code.slice(tagStart, j);
      if (tagName) {
        tokens.push({ type: "punct", value: code.slice(i, tagStart) });
        tokens.push({ type: "tag", value: tagName });
        i = j;
        continue;
      }
    }

    // JSX closing >
    if (ch === ">" || (ch === "/" && code[i + 1] === ">")) {
      const len = code[i + 1] === ">" ? 2 : 1;
      tokens.push({ type: "punct", value: code.slice(i, i + len) });
      i += len;
      continue;
    }

    // JSX prop name: word followed by =
    const propMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*=/);
    if (propMatch) {
      tokens.push({ type: "prop", value: propMatch[1] });
      i += propMatch[1].length;
      continue;
    }

    // Identifier / keyword
    const idMatch = rest.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (idMatch) {
      const word = idMatch[0];
      if (TSX_KEYWORDS.has(word) || TSX_KEYWORDS.has(word.toLowerCase())) {
        tokens.push({ type: "keyword", value: word });
      } else {
        tokens.push({ type: "ident", value: word });
      }
      i += word.length;
      continue;
    }

    // Number
    const numMatch = rest.match(/^\d+(\.\d+)?/);
    if (numMatch) {
      tokens.push({ type: "number", value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Default: single char
    tokens.push({ type: "text", value: ch });
    i++;
  }

  return tokens
    .map((t) => {
      const v = escapeHtml(t.value);
      switch (t.type) {
        case "comment":
          return `<span style="color:oklch(0.55 0.02 260 / 0.4);font-style:italic">${v}</span>`;
        case "string":
          return `<span style="color:oklch(0.70 0.14 220 / 0.85)">${v}</span>`;
        case "keyword":
          return `<span style="color:oklch(0.82 0.16 85 / 0.9);font-weight:600">${v}</span>`;
        case "tag":
          return `<span style="color:oklch(0.82 0.16 85 / 0.8)">${v}</span>`;
        case "prop":
          return `<span style="color:oklch(0.65 0.12 200 / 0.9)">${v}</span>`;
        case "number":
          return `<span style="color:oklch(0.75 0.15 60 / 0.8)">${v}</span>`;
        case "punct":
          return `<span style="color:oklch(0.6 0.02 260 / 0.5)">${v}</span>`;
        default:
          return `<span style="color:oklch(0.85 0.01 260 / 0.8)">${v}</span>`;
      }
    })
    .join("");
}

function highlightBash(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line) => {
      // Comment
      if (line.trim().startsWith("#")) {
        return `<span style="color:oklch(0.55 0.02 260 / 0.4);font-style:italic">${escapeHtml(line)}</span>`;
      }
      // Command (first word)
      const cmdMatch = line.match(/^(\s*)([a-zA-Z]+)/);
      if (cmdMatch) {
        const indent = cmdMatch[1];
        const cmd = cmdMatch[2];
        const rest = line.slice(indent.length + cmd.length);
        return `${indent}<span style="color:oklch(0.82 0.16 85 / 0.9);font-weight:600">${escapeHtml(cmd)}</span><span style="color:oklch(0.85 0.01 260 / 0.8)">${escapeHtml(rest)}</span>`;
      }
      return `<span style="color:oklch(0.85 0.01 260 / 0.8)">${escapeHtml(line)}</span>`;
    })
    .join("\n");
}
