"use client";

import { useState } from "react";

/**
 * CodeBlock — code display with copy-to-clipboard button.
 */
export function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
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

      <pre className="overflow-x-auto rounded-lg border border-gold/10 bg-card p-5 pt-8 font-mono text-xs leading-relaxed text-card-foreground/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}
