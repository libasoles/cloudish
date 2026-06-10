import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { AppNode, AppEdge } from "@/types/flow";

const PADDING_X = 80;
const PADDING_Y = 60;
const MAX_DIM = 2560;
const MIN_DIM = 600;
// Unified background for the exported image
const BG = "#1c1d21";

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

  const toPngOptions = {
    backgroundColor: BG,
    width: contentW,
    height: contentH,
    style: {
      width: `${contentW}px`,
      height: `${contentH}px`,
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
    filter: (node: Node) => {
      const el = node as Element;
      const cls = el.classList;
      if (!cls) return true;
      if (
        cls.contains("react-flow__nodesselection") ||
        cls.contains("react-flow__resize-control")
      )
        return false;
      if (cls.contains("react-flow__handle")) {
        const handleId = el.getAttribute("data-handleid") ?? "";
        const nodeId =
          el.closest(".react-flow__node")?.getAttribute("data-id") ?? "";
        return connectedHandles.has(`${nodeId}__${handleId}`);
      }
      return true;
    },
  };

  let dataUrl: string;
  try {
    // First call primes the image cache so external CDN icons load on the second pass.
    await toPng(viewport, toPngOptions);
    dataUrl = await toPng(viewport, toPngOptions);
  } finally {
    document.head.removeChild(exportStyle);
  }

  // Convert the data URL to a blob URL — more reliable than a data URL for
  // programmatic downloads triggered from deep async chains where the original
  // user-gesture activation may have expired.
  const blob = await (await fetch(dataUrl)).blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${projectName || "architecture"}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}
