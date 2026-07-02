import fs from "fs";
import path from "path";

/**
 * Read a component's source code from disk for the copy-to-clipboard feature.
 * Runs server-side only (page.tsx is a server component).
 */
export function getComponentSource(filename: string): string {
  const componentsDir = path.join(process.cwd(), "src", "components");
  const filePath = path.join(componentsDir, filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return `// ${filename} — source not available`;
  }
}

/**
 * Read a lib file's source code.
 */
export function getLibSource(filename: string): string {
  const libDir = path.join(process.cwd(), "src", "lib");
  const filePath = path.join(libDir, filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return `// ${filename} — source not available`;
  }
}

/**
 * Bundle multiple source files into a single string with section headers.
 * Pass pairs of [label, filepath] relative to src/.
 * e.g. bundleSources("components/effect-cards.tsx", "components/particle-text.tsx")
 */
export function bundleSources(...files: string[]): string {
  const srcDir = path.join(process.cwd(), "src");
  const parts: string[] = [];

  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const label = file.split("/").pop() ?? file;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      parts.push(`// ═══════════════════════════════════════════════════════════════\n// ${file}\n// ═══════════════════════════════════════════════════════════════\n\n${content}`);
    } catch {
      parts.push(`// ${label} — source not available`);
    }
  }

  return parts.join("\n\n");
}
