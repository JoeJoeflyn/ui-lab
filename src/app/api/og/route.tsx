import { render } from "takumi-js";
import { spawn } from "child_process";

export const dynamic = "force-static";

// Letter shapes in a 7x10 grid — bigger, more detailed
const LETTERS: Record<string, number[][]> = {
  U: [
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
  ],
  I: [
    [1,1,1,1,1,1],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [1,1,1,1,1,1],
  ],
  L: [
    [1,1,1,1,1,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,0,0,0,0],
    [1,1,1,1,1,1],
  ],
  A: [
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,0,0,1,1,0],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
  ],
  B: [
    [1,1,1,1,1,1,1,0],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,0],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,0],
  ],
};

const CELL = 16;
const GAP = 12;
const LETTER_W: Record<string, number> = { U: 8, I: 6, L: 6, A: 9, B: 8 };

interface Particle {
  tx: number; ty: number;
  sx: number; sy: number;
  r: number; g: number; b: number;
  size: number;
}

// Deterministic PRNG
let seed = 42;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  const text = "UILAB";
  const totalW = text.split("").reduce((s, l) => s + LETTER_W[l] * CELL + GAP, 0) - GAP;
  const startX = 600 - totalW / 2;
  const startY = 230;

  let cursorX = startX;
  for (const char of text) {
    const grid = LETTERS[char];
    const cols = LETTER_W[char];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col]) {
          for (let p = 0; p < 12; p++) {
            const jx = (rand() - 0.5) * CELL * 0.5;
            const jy = (rand() - 0.5) * CELL * 0.5;
            const tx = cursorX + col * CELL + CELL / 2 + jx;
            const ty = startY + row * CELL + CELL / 2 + jy;
            const angle = rand() * Math.PI * 2;
            const dist = 350 + rand() * 250;
            const tint = rand();
            particles.push({
              tx, ty,
              sx: tx + Math.cos(angle) * dist,
              sy: ty + Math.sin(angle) * dist,
              r: 200 + tint * 40,
              g: 150 + tint * 30,
              b: 40 + tint * 20,
              size: 2 + rand() * 2.5,
            });
          }
        }
      }
    }
    cursorX += cols * CELL + GAP;
  }
  return particles;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function buildScene(particles: Particle[], t: number) {
  const eased = easeOutCubic(Math.min(t * 1.15, 1));

  const dots = particles.map((p, i) => {
    const x = p.sx + (p.tx - p.sx) * eased;
    const y = p.sy + (p.ty - p.sy) * eased;
    const opacity = 0.3 + eased * 0.6;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: p.size,
          height: p.size,
          background: `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`,
          borderRadius: "50%",
          opacity,
        }}
      />
    );
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(25,22,50,0.5), transparent), radial-gradient(ellipse 60% 40% at 85% 15%, rgba(100,160,220,0.1), transparent), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(200,160,60,0.06), transparent), #080a12",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      {dots}

      {/* Logo mark */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 28 28"
        fill="none"
        style={{
          marginBottom: 220,
          opacity: 0.7,
        }}
      >
        <circle cx="14" cy="14" r="12" stroke="#c9a227" strokeWidth="1" opacity="0.3" />
        <circle cx="14" cy="14" r="7" stroke="#c9a227" strokeWidth="1" opacity="0.5" />
        <circle cx="14" cy="14" r="2.5" fill="#c9a227" />
        <circle cx="14" cy="2" r="1" fill="#c9a227" opacity="0.6" />
        <circle cx="26" cy="14" r="1" fill="#c9a227" opacity="0.6" />
        <circle cx="14" cy="26" r="1" fill="#c9a227" opacity="0.6" />
        <circle cx="2" cy="14" r="1" fill="#c9a227" opacity="0.6" />
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: 130,
          fontSize: 22,
          color: "#8a9ab8",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.25em",
          opacity: 1,
        }}
      >
        Gallery of GPU Shader Art
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 70,
          display: "flex",
          gap: 40,
          color: "#c9a227",
          fontFamily: "Georgia, serif",
          opacity: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>50</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.5, letterSpacing: "0.15em" }}>HOVER</span>
        </div>
        <div style={{ color: "#3a4a7a", fontSize: 28 }}>·</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>75</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.5, letterSpacing: "0.15em" }}>ENTRANCE</span>
        </div>
        <div style={{ color: "#3a4a7a", fontSize: 28 }}>·</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>5</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.5, letterSpacing: "0.15em" }}>PAINTINGS</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 30,
          fontSize: 13,
          fontFamily: "monospace",
          color: "#5a6a8a",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          display: "flex",
          gap: 12,
          opacity: 1,
        }}
      >
        <span>GLSL</span>
        <span style={{ color: "#3a4a7a" }}>·</span>
        <span>Three.js</span>
        <span style={{ color: "#3a4a7a" }}>·</span>
        <span>Next.js</span>
        <span style={{ color: "#3a4a7a" }}>·</span>
        <span>WebGL</span>
      </div>
    </div>
  );
}

// Render frames and encode as GIF using ffmpeg
async function renderGif(): Promise<Buffer> {
  const W = 1200;
  const H = 630;
  const fps = 60;
  const durationSec = 4;
  const totalFrames = fps * durationSec; // 120 frames — smooth + fast
  const particles = generateParticles();

  // Spawn ffmpeg to encode GIF from raw RGBA frames
  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-f", "rawvideo",
    "-pixel_format", "rgba",
    "-video_size", `${W}x${H}`,
    "-framerate", `${fps}`,
    "-i", "pipe:0",
    "-vf", `fps=${fps},scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`,
    "-loop", "0",
    "-f", "gif",
    "pipe:1",
  ], { stdio: ["pipe", "pipe", "pipe"] });

  const chunks: Buffer[] = [];
  ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));

  const stderrChunks: Buffer[] = [];
  ffmpeg.stderr.on("data", (chunk) => stderrChunks.push(chunk));

  // Render and pipe frames to ffmpeg
  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / (totalFrames - 1);
    const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const scene = buildScene(particles, t);
    const rawBuffer = await render(scene, { width: W, height: H, format: "raw" });
    ffmpeg.stdin.write(Buffer.from(rawBuffer));
  }

  ffmpeg.stdin.end();

  // Wait for ffmpeg to finish
  await new Promise<void>((resolve, reject) => {
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const stderr = Buffer.concat(stderrChunks).toString();
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });
    ffmpeg.on("error", reject);
  });

  return Buffer.concat(chunks);
}

// Cache the rendered GIF
let cachedGif: Buffer | null = null;

export async function GET() {
  if (!cachedGif) {
    cachedGif = await renderGif();
  }

  return new Response(new Uint8Array(cachedGif), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
