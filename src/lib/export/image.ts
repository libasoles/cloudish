import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { AppNode, AppEdge } from "@/types/flow";

const PADDING_X = 80;
const PADDING_Y = 60;
const MAX_DIM = 2560;
const MIN_DIM = 600;
// Frame border drawn around the final image
const BORDER = 52;
// Unified background for the entire exported image (frame + canvas content)
const BG = "#1c1d21";
// AWS logo badge — AWS dark blue
const LOGO_BADGE_BG = "#1564a0";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Renders any SVG/image as a flat white silhouette onto a new canvas. */
function toWhiteSilhouette(
  img: HTMLImageElement,
  w: number,
  h: number,
): HTMLCanvasElement {
  const tmp = document.createElement("canvas");
  tmp.width = w * 2; // 2× for sharpness
  tmp.height = h * 2;
  const tc = tmp.getContext("2d")!;
  // 1. Fill with white
  tc.fillStyle = "white";
  tc.fillRect(0, 0, tmp.width, tmp.height);
  // 2. destination-in keeps white only where the logo has opaque pixels
  tc.globalCompositeOperation = "destination-in";
  tc.drawImage(img, 0, 0, tmp.width, tmp.height);
  return tmp;
}

function composeWithFrame(
  baseDataUrl: string,
  contentW: number,
  contentH: number,
): Promise<string> {
  const totalW = contentW + BORDER * 2;
  const totalH = contentH + BORDER * 2;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Unified background for the entire image
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, totalW, totalH);

    const base = new Image();
    base.onload = () => {
      // Diagram content inset by BORDER on each side
      ctx.drawImage(base, BORDER, BORDER, contentW, contentH);

      loadImage(`${window.location.origin}/aws-logo.svg`)
        .then((awsImg) => {
          const aspectRatio = awsImg.naturalWidth / awsImg.naturalHeight;
          // Logo height fits inside a badge centered in the top border strip
          const logoH = Math.round(BORDER * 0.44);
          const logoW = Math.round(logoH * aspectRatio);
          const badgePadX = Math.round(BORDER * 0.22);
          const badgePadY = Math.round(BORDER * 0.18);
          const badgeW = logoW + badgePadX * 2;
          const badgeH = logoH + badgePadY * 2;
          const badgeX = 0;
          const badgeY = 0;

          // Blue rounded badge
          ctx.fillStyle = LOGO_BADGE_BG;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [0, 0, 0, 0]);
          ctx.fill();

          const silhouette = toWhiteSilhouette(awsImg, logoW, logoH);
          ctx.drawImage(
            silhouette,
            badgeX + badgePadX,
            badgeY + badgePadY,
            logoW,
            logoH,
          );

          // "cloudish.com.ar" — bottom-right of frame, muted
          const fontSize = Math.round(BORDER * 0.24);
          ctx.save();
          ctx.font = `500 ${fontSize}px -apple-system, "Segoe UI", sans-serif`;
          ctx.fillStyle = "rgba(148,163,184,0.65)";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "cloudish.com.ar",
            totalW - Math.round(BORDER * 0.35),
            totalH - BORDER / 2,
          );
          ctx.restore();

          resolve(canvas.toDataURL("image/png"));
        })
        .catch(reject);
    };
    base.onerror = reject;
    base.src = baseDataUrl;
  });
}

/** Builds a set of "nodeId__handleId" keys for every endpoint that has an edge. */
function buildConnectedHandles(edges: AppEdge[]): Set<string> {
  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(`${edge.source}__${edge.sourceHandle ?? ""}`);
    connected.add(`${edge.target}__${edge.targetHandle ?? ""}`);
  }
  return connected;
}

export async function exportFlowAsImage(
  nodes: AppNode[],
  edges: AppEdge[],
  projectName: string,
): Promise<void> {
  const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewport) throw new Error("React Flow viewport not found");

  const bounds = getNodesBounds(nodes);

  // Size the content area to fit all nodes, capped at MAX_DIM
  const rawW = bounds.width + PADDING_X * 2;
  const rawH = bounds.height + PADDING_Y * 2;
  const scale = Math.min(1, MAX_DIM / Math.max(rawW, rawH));
  const contentW = Math.max(MIN_DIM, Math.round(rawW * scale));
  const contentH = Math.max(MIN_DIM, Math.round(rawH * scale));

  const paddingRatio =
    Math.min(PADDING_X, PADDING_Y) / Math.min(contentW, contentH);
  const transform = getViewportForBounds(
    bounds,
    contentW,
    contentH,
    0.1,
    4,
    paddingRatio,
  );

  const connectedHandles = buildConnectedHandles(edges);

  // Inject CSS to hide all selection visuals (bounding box, ring, halo)
  const exportStyle = document.createElement("style");
  exportStyle.textContent = `
    .react-flow__node-selectionGroup {
      display: none !important;
    }
    .react-flow__node.selected {
      outline: none !important;
      outline-width: 0 !important;
      outline-offset: 0 !important;
    }
    .react-flow__node.selected > div {
      border-color: rgb(229 231 235) !important;
      --tw-ring-shadow: none !important;
      --tw-ring-offset-shadow: none !important;
      --tw-shadow: none !important;
      --tw-shadow-colored: none !important;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
    }
  `;
  document.head.appendChild(exportStyle);

  let rawDataUrl: string;
  try {
    rawDataUrl = await toPng(viewport, {
      backgroundColor: BG,
      width: contentW,
      height: contentH,
      style: {
        width: `${contentW}px`,
        height: `${contentH}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      filter: (node) => {
        const el = node as Element;
        const cls = el.classList;
        if (!cls) return true;
        // Always exclude: selection overlay, resize controls
        if (
          cls.contains("react-flow__nodesselection") ||
          cls.contains("react-flow__resize-control")
        )
          return false;
        // Handles: only keep those with an active connection
        if (cls.contains("react-flow__handle")) {
          const handleId = el.getAttribute("data-handleid") ?? "";
          const nodeId =
            el.closest(".react-flow__node")?.getAttribute("data-id") ?? "";
          return connectedHandles.has(`${nodeId}__${handleId}`);
        }
        return true;
      },
    });
  } finally {
    document.head.removeChild(exportStyle);
  }

  const composedDataUrl = await composeWithFrame(
    rawDataUrl,
    contentW,
    contentH,
  );

  const a = document.createElement("a");
  a.href = composedDataUrl;
  a.download = `${projectName || "architecture"}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
