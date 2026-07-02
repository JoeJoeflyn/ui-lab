/**
 * Ant sprite atlas generator — draws realistic top-down ants.
 *
 * Body segments are large and connected, filling most of the sprite cell
 * so there are no transparent gaps when ants form images.
 * Legs are kept compact (not spread wide) to avoid blur when forming images.
 */

const ANT_SIZE = 64;
const FRAMES = 8;
const COLS = FRAMES;

export function generateAntAtlas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ANT_SIZE * COLS;
  canvas.height = ANT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let frame = 0; frame < FRAMES; frame++) {
    const ox = frame * ANT_SIZE;
    const cx = ox + ANT_SIZE / 2;
    const cy = ANT_SIZE / 2;

    const phase = (frame / FRAMES) * Math.PI * 2;
    const lift1 = Math.sin(phase);
    const lift2 = Math.sin(phase + Math.PI);

    drawAnt(ctx, cx, cy, lift1, lift2);
  }

  return canvas;
}

function drawAnt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lift1: number,
  lift2: number,
) {
  const body = "#c89028";
  const dark = "#8b6010";
  const leg = "#a07020";

  // ── Body: one connected solid mass — no gaps ───────────
  ctx.fillStyle = dark;

  // Draw all three segments overlapping so there are no transparent gaps
  ctx.beginPath();
  // Abdomen (back — large)
  ctx.ellipse(cx, cy + 14, 13, 15, 0, 0, Math.PI * 2);
  // Thorax (middle — overlaps abdomen and head)
  ctx.ellipse(cx, cy + 1, 9, 11, 0, 0, Math.PI * 2);
  // Head (front — overlaps thorax)
  ctx.arc(cx, cy - 12, 10, 0, Math.PI * 2);
  ctx.fill();

  // Thorax highlight (slightly lighter, smaller — stays inside body)
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs — thick, compact ───────────────────────────
  ctx.strokeStyle = leg;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";

  drawLeg(ctx, cx - 4, cy - 5, -1, -0.3, lift1);
  drawLeg(ctx, cx + 4, cy + 1, 1, 0, lift1);
  drawLeg(ctx, cx - 4, cy + 7, -1, 0.3, lift1);

  drawLeg(ctx, cx + 4, cy - 5, 1, -0.3, lift2);
  drawLeg(ctx, cx - 4, cy + 1, -1, 0, lift2);
  drawLeg(ctx, cx + 4, cy + 7, 1, 0.3, lift2);

  // ── Antennae — short, compact ────────────────────────
  ctx.strokeStyle = leg;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 18);
  ctx.quadraticCurveTo(cx - 7, cy - 22, cx - 6 + lift1 * 1.5, cy - 25);
  ctx.moveTo(cx + 3, cy - 18);
  ctx.quadraticCurveTo(cx + 7, cy - 22, cx + 6 - lift1 * 1.5, cy - 25);
  ctx.stroke();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  fwd: number,
  lift: number,
) {
  const reach = 12 + lift * 3;
  const kneeX = x + dir * reach * 0.5;
  const kneeY = y + fwd * 3 - Math.abs(lift) * 2;
  const footX = x + dir * reach;
  const footY = y + fwd * 6 + lift * 2;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
  ctx.stroke();
}

