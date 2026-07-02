"use client";

import { useState, useEffect, useCallback } from "react";
import { useAsciiText, alligator, bell, chunky, graffiti } from "react-ascii-text";

const FONTS = [
  { id: "alligator", name: "Alligator", font: alligator },
  { id: "chunky", name: "Chunky", font: chunky },
  { id: "bell", name: "Bell", font: bell },
  { id: "graffiti", name: "Graffiti", font: graffiti },
] as const;

const WORD_SETS = [
  ["UI LAB", "GLSL", "SHADERS", "GPU"],
  ["HELLO", "WORLD", "REACT", "THREE"],
  ["ART", "CODE", "PIXEL", "FRAME"],
] as const;

const DIRECTIONS = ["down", "up", "left", "right", "horizontal", "vertical"] as const;

/** Inner component — remounts when key changes so useAsciiText re-inits cleanly */
function AsciiRenderer({
  fontIdx,
  wordIdx,
  dirIdx,
  speed,
}: {
  fontIdx: number;
  wordIdx: number;
  dirIdx: number;
  speed: number;
}) {
  const ref = useAsciiText({
    font: FONTS[fontIdx].font,
    text: WORD_SETS[wordIdx] as unknown as string[],
    animationCharacters: "▒░█",
    animationDirection: DIRECTIONS[dirIdx],
    animationDelay: 2000,
    animationInterval: 100,
    animationLoop: true,
    animationSpeed: speed,
  });

  return (
    <pre
      ref={ref}
      className="font-mono text-[7px] leading-tight text-gold/80 sm:text-[9px] md:text-[11px]"
    />
  );
}

export function AsciiArt() {
  const [fontIdx, setFontIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [dirIdx, setDirIdx] = useState(0);
  const [speed, setSpeed] = useState(30);
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const code = `import { useAsciiText, alligator } from "react-ascii-text";

function AsciiArt() {
  const { text } = useAsciiText({
    text: ["HELLO", "WORLD"],
    font: alligator,
    delay: 30,
  });
  return <pre className="font-mono text-xs">{text}</pre>;
}`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    const lines = [
      "$ ./ui-lab --ascii-mode",
      "› Loading figlet fonts... [alligator, chunky, bell, graffiti]",
      "› Initializing GPU shader gallery...",
      "› Calibrating CRT scanline emulator...",
      "› System ready.",
      "",
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setBootLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setBooted(true), 300);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="terminal-window relative mx-auto max-w-2xl overflow-hidden rounded-lg border border-gold/20 bg-card shadow-2xl">
      {/* === Title bar === */}
      <div className="flex items-center gap-2 border-b border-gold/15 bg-muted px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[oklch(0.55_0.15_25)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.70_0.15_85)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.60_0.14_150)]" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-gold/50">
          ui-lab@terminal — ascii-art
        </span>
        <span className="ml-auto flex items-center gap-3">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${copied ? "border-gold/40 text-gold" : "border-gold/15 text-gold/50 hover:border-gold/40"}`}
            aria-label="Copy component code"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-gold/40">
            <span className="size-1.5 animate-pulse rounded-full bg-gold/60" />
            {booted ? "live" : "booting"}
          </span>
        </span>
      </div>

      {/* === CRT screen area === */}
      <div className="relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 55%, color-mix(in oklch, var(--background) 50%, transparent) 100%)",
          }}
        />
        <div className="ascii-art relative z-10 min-h-[180px]">
          {!booted ? (
            <div className="font-mono text-[10px] leading-relaxed text-gold/60 sm:text-xs">
              {bootLines.map((line, i) => (
                <div key={i} className="ascii-line" style={{ animationDelay: `${i * 0.05}s` }}>
                  {line === "" ? "\u00A0" : line}
                </div>
              ))}
              <span className="inline-block w-2 animate-pulse">▋</span>
            </div>
          ) : (
            <AsciiRenderer
              key={`${fontIdx}-${wordIdx}-${dirIdx}-${speed}`}
              fontIdx={fontIdx}
              wordIdx={wordIdx}
              dirIdx={dirIdx}
              speed={speed}
            />
          )}
        </div>
      </div>

      {/* === Control panel === */}
      {booted && (
        <div className="border-t border-gold/15 bg-muted px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">font</span>
              <select
                value={fontIdx}
                onChange={(e) => setFontIdx(Number(e.target.value))}
                className="terminal-select rounded border border-gold/20 bg-background px-2 py-1 font-mono text-[9px] text-gold/70 outline-none focus:border-gold/40"
              >
                {FONTS.map((f, i) => (
                  <option key={f.id} value={i}>{f.name}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">set</span>
              <select
                value={wordIdx}
                onChange={(e) => setWordIdx(Number(e.target.value))}
                className="terminal-select rounded border border-gold/20 bg-background px-2 py-1 font-mono text-[9px] text-gold/70 outline-none focus:border-gold/40"
              >
                {WORD_SETS.map((set, i) => (
                  <option key={i} value={i}>{set[0]}...</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">dir</span>
              <select
                value={dirIdx}
                onChange={(e) => setDirIdx(Number(e.target.value))}
                className="terminal-select rounded border border-gold/20 bg-background px-2 py-1 font-mono text-[9px] text-gold/70 outline-none focus:border-gold/40"
              >
                {DIRECTIONS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">spd</span>
              <input
                type="range"
                min={10}
                max={80}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="terminal-slider h-1 w-16 cursor-pointer appearance-none rounded-full bg-gold/20"
              />
              <span className="font-mono text-[8px] tabular-nums text-gold/50">{speed}ms</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
