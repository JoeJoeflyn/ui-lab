/**
 * Text-to-particle sampler.
 *
 * Renders text to a 2D canvas, reads back pixel data, and samples
 * non-transparent pixels into a Float32Array of 3D positions.
 * The result is the "home" (rest) position for every particle —
 * the GLSL vertex shader displaces from here based on the active effect.
 */

export interface SampleResult {
  positions: Float32Array; // [x, y, z, x, y, z, ...] — length = count * 3
  count: number; // actual particle count (may be < requested if text is small)
}

export interface SampleOptions {
  text: string;
  /** Target particle count. Actual count may be slightly lower. */
  count: number;
  /** Font size in px for the sampling canvas (higher = denser sampling). */
  fontSize?: number;
  /** Font weight (1-1000 or "bold"/"normal"). */
  weight?: number | string;
  /** Font family string. */
  fontFamily?: string;
  /** Output canvas width — particles are centered in this space. */
  width: number;
  /** Output canvas height. */
  height: number;
}

/**
 * Sample text glyphs into particle positions.
 *
 * Strategy:
 * 1. Render text to an offscreen 2D canvas at high resolution.
 * 2. Read pixel data, collect all non-transparent pixel coords.
 * 3. If we have more pixels than requested particles, sample uniformly.
 * 4. If fewer, duplicate with slight jitter.
 * 5. Center the result in the output width/height space.
 */
export function sampleTextToParticles(opts: SampleOptions): SampleResult {
  const {
    text,
    count,
    fontSize = 120,
    weight = "bold",
    fontFamily = "sans-serif",
    width,
    height,
  } = opts;

  // Offscreen canvas — render at 2x for denser pixel coverage
  const sampleW = Math.max(width, 400);
  const sampleH = Math.max(height, 200);
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { positions: new Float32Array(count * 3), count };
  }

  // Render text
  ctx.fillStyle = "#fff";
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, sampleW / 2, sampleH / 2);

  // Collect non-transparent pixels
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const pixels: Array<[number, number]> = [];
  const stride = 4; // RGBA
  for (let y = 0; y < sampleH; y += 2) {
    // sample every 2px for speed
    for (let x = 0; x < sampleW; x += 2) {
      const idx = (y * sampleW + x) * stride;
      if (imageData.data[idx + 3] > 128) {
        pixels.push([x, y]);
      }
    }
  }

  if (pixels.length === 0) {
    return { positions: new Float32Array(count * 3), count };
  }

  // Sample / duplicate to reach target count
  const positions = new Float32Array(count * 3);
  const scaleX = width / sampleW;
  const scaleY = height / sampleH;
  const offsetX = width / 2;
  const offsetY = height / 2;

  for (let i = 0; i < count; i++) {
    const [px, py] = pixels[i % pixels.length];
    // Add small jitter to break up grid alignment on duplicates
    const jx = pixels.length < count ? (Math.random() - 0.5) * 2 : 0;
    const jy = pixels.length < count ? (Math.random() - 0.5) * 2 : 0;

    positions[i * 3] = (px + jx) * scaleX - offsetX;
    positions[i * 3 + 1] = -(py + jy) * scaleY + offsetY; // flip Y (canvas Y goes down)
    positions[i * 3 + 2] = 0;
  }

  return { positions, count };
}
