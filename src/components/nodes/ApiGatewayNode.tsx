import { Handle, Position } from "@xyflow/react";
import RectangularNode, {
  type RectangularHandleId,
} from "@/components/nodes/RectangularNode";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import EditableNodeLabel from "@/components/EditableNodeLabel";
import type { HandleDecoration } from "@/components/nodes/CircularNode";
import type { AwsCategory } from "@/data/aws-services";
import type { ApiGatewayRoute } from "@/types/flow";

interface ApiGatewayNodeProps {
  selected?: boolean;
  pulseKey?: string;
  slug: string;
  category: AwsCategory;
  name: string;
  routes?: ApiGatewayRoute[];
  editLabel: string;
  onRename: (name: string) => void;
  /** Per-handle overrides forwarded from the parent node (e.g. VPN decorations). */
  handleDecorations?: Partial<Record<RectangularHandleId, HandleDecoration>>;
}

export default function ApiGatewayNode({
  selected,
  pulseKey,
  slug,
  category,
  name,
  routes,
  editLabel,
  onRename,
  handleDecorations,
}: ApiGatewayNodeProps) {
  const visibleRoutes = (routes ?? []).filter((r) => r.path.trim() !== "");

  // The right handle sits at top:28 to align with the header icon row.
  const mergedDecorations: Partial<Record<RectangularHandleId, HandleDecoration>> = {
    ...handleDecorations,
    right: {
      ...handleDecorations?.right,
      style: { top: 28, ...handleDecorations?.right?.style },
    },
  };

  return (
    <RectangularNode
      selected={selected}
      pulseKey={pulseKey}
      className="flex flex-col min-w-36"
      handleDecorations={mergedDecorations}
    >
      <div className="flex flex-col items-center gap-1 px-3 py-2">
        <AwsServiceIcon slug={slug} category={category} name={name} size="medium" />
        <EditableNodeLabel value={name} editLabel={editLabel} onCommit={onRename} />
      </div>
      {visibleRoutes.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {visibleRoutes.map((route) => (
            <div
              key={route.id}
              className="relative flex items-center gap-1.5 px-3 py-1.5"
            >
              <span className="text-xs font-semibold text-violet-600">
                {route.method}
              </span>
              <span className="text-xs text-gray-600 font-mono truncate">
                {route.path}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`route-${route.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </RectangularNode>
  );
}
