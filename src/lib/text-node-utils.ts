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
