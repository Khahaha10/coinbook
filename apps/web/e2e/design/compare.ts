import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export const REF_DIR = join(__dirname, 'ref');
const PIXEL_THRESHOLD = 0.2;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompareResult {
  ratio: number;
  width: number;
  height: number;
  diff: Buffer;
}

function crop(png: PNG, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, width, height, 0, 0);
  return out;
}

function paint(png: PNG, rects: Rect[]): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x));
    const y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(png.width, Math.ceil(r.x + r.width));
    const y1 = Math.min(png.height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * png.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 255;
        png.data[i + 3] = 255;
      }
    }
  }
}

export function compareWithRef(board: string, actual: Buffer, masks: Rect[]): CompareResult {
  const ref = PNG.sync.read(readFileSync(join(REF_DIR, `${board}.png`)));
  const app = PNG.sync.read(actual);
  const width = Math.min(ref.width, app.width);
  const height = Math.min(ref.height, app.height);
  const a = crop(ref, width, height);
  const b = crop(app, width, height);
  paint(a, masks);
  paint(b, masks);
  const diff = new PNG({ width, height });
  const count = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold: PIXEL_THRESHOLD,
  });
  return { ratio: count / (width * height), width, height, diff: PNG.sync.write(diff) };
}
