import { useEffect, useState } from 'react';

const cutoutCache = new Map<string, string>();
const cutoutPending = new Map<string, Array<(url: string, isCutout: boolean) => void>>();

function parseHexRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function processStudioCutout(
  rawSrc: string,
  tintHex: string | null | undefined,
  callback: (url: string, isCutout: boolean) => void
) {
  if (!rawSrc) {
    callback(rawSrc, false);
    return;
  }

  const normalizedTint = tintHex ? tintHex.trim().toLowerCase() : '';
  const cacheKey = normalizedTint ? `${rawSrc}::${normalizedTint}` : rawSrc;

  const cached = cutoutCache.get(cacheKey);
  if (cached) {
    callback(cached, true);
    return;
  }

  const queue = cutoutPending.get(cacheKey);
  if (queue) {
    queue.push(callback);
    return;
  }

  cutoutPending.set(cacheKey, [callback]);

  const flush = (url: string, isCutout: boolean) => {
    const cbs = cutoutPending.get(cacheKey) || [];
    cutoutPending.delete(cacheKey);
    cbs.forEach((fn) => fn(url, isCutout));
  };

  const img = new Image();
  if (!rawSrc.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  img.onload = () => {
    try {
      const maxDim = 540;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(1, Math.round((img.naturalWidth || 400) * scale));
      const h = Math.max(1, Math.round((img.naturalHeight || 500) * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        flush(rawSrc, false);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const corners = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ];

      let bgR = 255;
      let bgG = 255;
      let bgB = 255;
      let brightCorners = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (const idx of corners) {
        const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (lum >= 225) {
          brightCorners += 1;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
        }
      }

      const visited = new Uint8Array(w * h);

      if (brightCorners > 0) {
        bgR = sumR / brightCorners;
        bgG = sumG / brightCorners;
        bgB = sumB / brightCorners;

        const stack = new Int32Array(w * h);
        let sp = 0;

        const isBgPixel = (pIdx: number) => {
          const i = pIdx * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const sat = maxC - minC;
          const lum = (r + g + b) / 3;
          const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          return (lum >= 230 && sat <= 16) || (lum >= 220 && dist <= 40 && sat <= 20);
        };

        for (let x = 0; x < w; x++) {
          const top = x;
          const bottom = (h - 1) * w + x;
          if (!visited[top] && isBgPixel(top)) {
            visited[top] = 1;
            stack[sp++] = top;
          }
          if (!visited[bottom] && isBgPixel(bottom)) {
            visited[bottom] = 1;
            stack[sp++] = bottom;
          }
        }

        for (let y = 0; y < h; y++) {
          const left = y * w;
          const right = y * w + (w - 1);
          if (!visited[left] && isBgPixel(left)) {
            visited[left] = 1;
            stack[sp++] = left;
          }
          if (!visited[right] && isBgPixel(right)) {
            visited[right] = 1;
            stack[sp++] = right;
          }
        }

        while (sp > 0) {
          const curr = stack[--sp];
          const cx = curr % w;
          const cy = (curr - cx) / w;
          const p4 = curr * 4;
          data[p4 + 3] = 0;

          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n] && isBgPixel(n)) {
              visited[n] = 1;
              stack[sp++] = n;
            }
          }
          if (cx < w - 1) {
            const n = curr + 1;
            if (!visited[n] && isBgPixel(n)) {
              visited[n] = 1;
              stack[sp++] = n;
            }
          }
          if (cy > 0) {
            const n = curr - w;
            if (!visited[n] && isBgPixel(n)) {
              visited[n] = 1;
              stack[sp++] = n;
            }
          }
          if (cy < h - 1) {
            const n = curr + w;
            if (!visited[n] && isBgPixel(n)) {
              visited[n] = 1;
              stack[sp++] = n;
            }
          }
        }

        // Soft anti-aliased edge feathering
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (visited[idx]) continue;
            const touchesBg =
              visited[idx - 1] || visited[idx + 1] || visited[idx - w] || visited[idx + w];
            if (touchesBg) {
              const p4 = idx * 4;
              const lum = (data[p4] + data[p4 + 1] + data[p4 + 2]) / 3;
              if (lum > 185) {
                data[p4 + 3] = Math.round(data[p4 + 3] * 0.42);
              }
            }
          }
        }
      }

      // Dynamic garment/footwear studio recoloring when a non-default color variant is active
      const targetRgb = normalizedTint ? parseHexRgb(normalizedTint) : null;
      if (targetRgb) {
        const [tr, tg, tb] = targetRgb;
        const tLum = (0.299 * tr + 0.587 * tg + 0.114 * tb) / 255;

        // First pass: measure average fabric luminance across opaque foreground pixels
        let lumSum = 0;
        let lumCount = 0;
        for (let p = 0; p < w * h; p++) {
          const i = p * 4;
          if (data[i + 3] < 35) continue;
          const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          lumSum += l;
          lumCount++;
        }
        const meanLum = lumCount > 0 ? lumSum / lumCount : 0.4;

        // Second pass: recolor garment/footwear fabric while keeping wooden hanger & crisp logos intact
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const p = y * w + x;
            const i = p * 4;
            if (data[i + 3] < 20) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const origLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const sat = Math.max(r, g, b) - Math.min(r, g, b);

            // Preserve top hanger wood & brushed chrome hook
            if (y < h * 0.17 && ((r > g + 14 && g > b + 10) || (sat < 18 && origLum > 0.42))) {
              continue;
            }

            // Preserve high-contrast white print logos on dark garments
            if (meanLum < 0.36 && origLum > 0.8 && sat < 28) {
              if (tLum > 0.72) {
                // Darken white chest logo gently when shirt is switched to Cream/White so print stays legible
                data[i] = 34;
                data[i + 1] = 34;
                data[i + 2] = 38;
              }
              continue;
            }

            const rel = Math.max(0.22, Math.min(1.65, origLum / Math.max(0.18, meanLum)));
            let shade: number;
            if (tLum > 0.72) {
              shade = 0.62 + (rel - 0.22) * 0.34;
            } else if (tLum < 0.18) {
              shade = 0.58 + (rel - 0.22) * 0.68;
            } else {
              shade = 0.45 + (rel - 0.22) * 0.58;
            }

            const specular = rel > 1.24 ? (rel - 1.24) * 30 : 0;
            data[i] = Math.min(255, Math.max(0, Math.round(tr * shade + specular)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(tg * shade + specular)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(tb * shade + specular)));
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const outUrl = canvas.toDataURL('image/png');
      cutoutCache.set(cacheKey, outUrl);
      flush(outUrl, brightCorners > 0 || Boolean(targetRgb));
    } catch {
      flush(rawSrc, false);
    }
  };

  img.onerror = () => flush(rawSrc, false);
  img.src = rawSrc;
}

export function useCutoutImage(rawSrc: string, tintHex?: string | null) {
  const normalizedTint = tintHex ? tintHex.trim().toLowerCase() : '';
  const cacheKey = normalizedTint ? `${rawSrc}::${normalizedTint}` : rawSrc;

  const [state, setState] = useState<{ src: string; isCutout: boolean }>(() => {
    const cached = cutoutCache.get(cacheKey);
    return cached ? { src: cached, isCutout: true } : { src: rawSrc, isCutout: false };
  });

  useEffect(() => {
    let active = true;
    const cached = cutoutCache.get(cacheKey);
    if (cached) {
      setState({ src: cached, isCutout: true });
      return;
    }
    processStudioCutout(rawSrc, tintHex, (cleanSrc, isCutout) => {
      if (active) {
        setState({ src: cleanSrc, isCutout });
      }
    });
    return () => {
      active = false;
    };
  }, [rawSrc, tintHex, cacheKey]);

  return state;
}
