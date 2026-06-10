import type { CSSProperties } from "react";
import { CustomerGatewayIcon } from "@/components/icons/CustomerGatewayIcon";
import type {
  CircularHandleId,
  HandleDecoration,
} from "@/components/nodes/CircularNode";

const VPN_HANDLE_BASE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * Centering transforms for the enlarged customer-gateway handle. The bottom
 * handle has none: it keeps CircularNode's base transform, which already
 * anchors it below the circle.
 */
const VPN_HANDLE_TRANSFORM: Partial<Record<CircularHandleId, string>> = {
  left: "translate(-50%, -50%)",
  right: "translate(50%, -50%)",
  top: "translate(-50%, -50%)",
};

const HANDLE_IDS: readonly CircularHandleId[] = [
  "left",
  "right",
  "top",
  "bottom",
];

export function buildVpnHandleDecorations(
  vpnHandleIds: Set<string>,
): Partial<Record<CircularHandleId, HandleDecoration>> {
  const decorations: Partial<Record<CircularHandleId, HandleDecoration>> = {};
  for (const handleId of HANDLE_IDS) {
    if (!vpnHandleIds.has(handleId)) continue;
    const transform = VPN_HANDLE_TRANSFORM[handleId];
    decorations[handleId] = {
      className: "customer-gateway-handle",
      style: transform ? { ...VPN_HANDLE_BASE, transform } : VPN_HANDLE_BASE,
      content: (
        <CustomerGatewayIcon className="size-7 text-purple-600 pointer-events-none" />
      ),
    };
  }
  return decorations;
}
