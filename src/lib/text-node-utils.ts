export const TEXT_FONT_WIDTH_SCALE = 8;
export const TEXT_FONT_HEIGHT_SCALE = 0.46;
export const MIN_TEXT_FONT_SIZE = 12;
export const MAX_TEXT_FONT_SIZE = 64;
export const MIN_TEXT_NODE_WIDTH = MIN_TEXT_FONT_SIZE * TEXT_FONT_WIDTH_SCALE;
export const MIN_TEXT_NODE_HEIGHT = Math.ceil(
  MIN_TEXT_FONT_SIZE / TEXT_FONT_HEIGHT_SCALE,
);
export const MAX_TEXT_NODE_WIDTH = MAX_TEXT_FONT_SIZE * TEXT_FONT_WIDTH_SCALE;
export const MAX_TEXT_NODE_HEIGHT = Math.ceil(
  MAX_TEXT_FONT_SIZE / TEXT_FONT_HEIGHT_SCALE,
);

export function clampTextFontSize(fontSize: number) {
  return Math.max(MIN_TEXT_FONT_SIZE, Math.min(MAX_TEXT_FONT_SIZE, fontSize));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getTextFontSizeForNodeSize(width: number, height: number) {
  return clamp(
    Math.min(width / TEXT_FONT_WIDTH_SCALE, height * TEXT_FONT_HEIGHT_SCALE),
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );
}

export function getTextFontSizeForWidth(width: number) {
  return clamp(width / TEXT_FONT_WIDTH_SCALE, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE);
}

export function getTextNodeSizeForFont(fontSize: number) {
  const clampedFontSize = clamp(
    fontSize,
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );

  return {
    width: clampedFontSize * TEXT_FONT_WIDTH_SCALE,
    height: Math.ceil(clampedFontSize / TEXT_FONT_HEIGHT_SCALE),
  };
}

const TEXT_HORIZONTAL_PADDING = 16;
const TEXT_VERTICAL_PADDING = 8;
const TEXT_MEASUREMENT_BUFFER = 8;

export function measureTextWidth(text: string, fontSize: number): number {
  if (typeof document === "undefined") {
    return text.length * fontSize * 0.55;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return text.length * fontSize * 0.55;
  }
  context.font = `500 ${fontSize}px system-ui, "Segoe UI", Roboto, sans-serif`;
  return context.measureText(text).width;
}

export function getFittedTextNodeSize(text: string, fontSize: number) {
  return {
    width: Math.max(
      Math.ceil(
        measureTextWidth(text, fontSize) +
          TEXT_HORIZONTAL_PADDING +
          TEXT_MEASUREMENT_BUFFER,
      ),
      MIN_TEXT_NODE_WIDTH,
    ),
    height: clamp(
      Math.ceil(fontSize * 1.15 + TEXT_VERTICAL_PADDING),
      MIN_TEXT_NODE_HEIGHT,
      MAX_TEXT_NODE_HEIGHT,
    ),
  };
}

const LINE_HEIGHT_RATIO = 1.25; // matches Tailwind `leading-tight`

function countWrappedLines(
  paragraphs: string[],
  maxWidth: number,
  ctx: CanvasRenderingContext2D,
): number {
  let totalLines = 0;
  const spaceWidth = ctx.measureText(" ").width;

  for (const para of paragraphs) {
    if (!para) {
      totalLines++;
      continue;
    }

    let lineWidth = 0;

    for (const word of para.split(" ")) {
      const wordWidth = ctx.measureText(word).width;
      const gap = lineWidth > 0 ? spaceWidth : 0;

      if (lineWidth > 0 && lineWidth + gap + wordWidth > maxWidth) {
        totalLines++;
        lineWidth = 0;
      }

      if (wordWidth > maxWidth) {
        // Mirror CSS overflow-wrap: break-word — split long words at character boundaries.
        let pos = 0;
        while (pos < word.length) {
          let w = 0;
          let end = pos;
          while (end < word.length) {
            const cw = ctx.measureText(word[end]).width;
            if (w + cw > maxWidth && end > pos) break;
            w += cw;
            end++;
          }
          if (end === pos) end = pos + 1; // always advance at least one character
          if (end < word.length) {
            totalLines++; // this chunk fills a complete line
          } else {
            lineWidth = w; // last chunk stays on the current line
          }
          pos = end;
        }
      } else {
        lineWidth += (lineWidth > 0 ? spaceWidth : 0) + wordWidth;
      }
    }

    totalLines++; // last (or only) line of the paragraph
  }

  return totalLines;
}

/**
 * Binary search for the largest integer fontSize such that all text fits
 * within containerWidth × containerHeight with word-wrapping.
 * Uses Canvas measureText only — no DOM layout triggered, ~6 iterations.
 */
export function fitFontSizeToBox(
  text: string,
  containerWidth: number,
  containerHeight: number,
): number {
  const innerWidth = containerWidth - TEXT_HORIZONTAL_PADDING;
  const paragraphs = (text || " ").split("\n");

  const fallback = clamp(
    Math.min(
      containerWidth / TEXT_FONT_WIDTH_SCALE,
      containerHeight * TEXT_FONT_HEIGHT_SCALE,
    ),
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );

  if (typeof document === "undefined") return fallback;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;

  let lo = MIN_TEXT_FONT_SIZE;
  let hi = MAX_TEXT_FONT_SIZE;
  let best = MIN_TEXT_FONT_SIZE;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `500 ${mid}px system-ui,"Segoe UI",Roboto,sans-serif`;
    const lines = countWrappedLines(paragraphs, innerWidth, ctx);
    // Small buffer compensates for Canvas measureText vs actual browser rendering discrepancy.
    const totalHeight =
      Math.ceil(lines * mid * LINE_HEIGHT_RATIO) + TEXT_VERTICAL_PADDING + 4;
    if (totalHeight <= containerHeight) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}
