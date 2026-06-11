import type { AppEdge, AppNode, NetworkContainerType } from "@/types/flow";
import {
  isVpcNode,
  isAzNode,
  isSubnetNode,
  buildVpcNodes,
  buildAzNodes,
  buildSubnetNodes,
  orderNodesForSubflows,
  getAbsolutePosition,
  getNodeSize,
  getNetworkContainerType,
  resizeContainerNode,
} from "@/lib/graph-utils";

type ManagedChildCountField = "numberOfVPCs" | "numberOfAZs" | "numberOfSubnets";

type ManagedChildConfig = {
  countField: ManagedChildCountField;
  isChildNode: (n: AppNode) => boolean;
  // Axis children are laid out along: columns ("x") or rows ("y")
  layoutAxis: "x" | "y";
  buildChildren: (
    parentId: string,
    parentW: number,
    parentH: number,
    count: number,
    labelFn?: (subnetType: string, index: number) => string,
  ) => AppNode[];
};

const MANAGED_CHILD_CONFIGS = {
  region: {
    countField: "numberOfVPCs",
    isChildNode: isVpcNode,
    layoutAxis: "x",
    buildChildren: (id, w, h, count) => buildVpcNodes(id, w, h, count),
  },
  vpc: {
    countField: "numberOfAZs",
    isChildNode: isAzNode,
    layoutAxis: "x",
    buildChildren: (id, w, h, count) => buildAzNodes(id, w, h, count),
  },
  az: {
    countField: "numberOfSubnets",
    isChildNode: isSubnetNode,
    layoutAxis: "y",
    buildChildren: (id, w, h, count, labelFn) =>
      buildSubnetNodes(
        id,
        w,
        h,
        count,
        labelFn ?? ((type, i) => `Subnet ${type} ${i}`),
      ),
  },
} satisfies Record<Exclude<NetworkContainerType, "aws" | "subnet" | "asg" | "generic">, ManagedChildConfig>;

// Build only the children appended beyond existingCount. Reuses the build
// functions by taking the tail of a full-count layout — the geometry is
// provisional (the redistribute pass at the end of setManagedChildCount sets
// the real positions/sizes), but labels keep numbering from the total count.
// Ids that collide with an existing node are remapped to the next free suffix.
function buildAppendedChildren(
  config: ManagedChildConfig,
  parentId: string,
  parentW: number,
  parentH: number,
  existingCount: number,
  count: number,
  subnetLabelFn: (subnetType: string, index: number) => string,
  usedIds: Set<string>,
): AppNode[] {
  const template = config.buildChildren(
    parentId,
    parentW,
    parentH,
    count,
    subnetLabelFn,
  );

  return template.slice(existingCount).map((node) => {
    if (!usedIds.has(node.id)) {
      usedIds.add(node.id);
      return node;
    }
    const prefix = node.id.replace(/-\d+$/, "");
    let suffix = 1;
    while (usedIds.has(`${prefix}-${suffix}`)) suffix++;
    const id = `${prefix}-${suffix}`;
    usedIds.add(id);
    return { ...node, id };
  });
}

export function setManagedChildCount(
  nodeId: string,
  count: number,
  prevNodes: AppNode[],
  edges: AppEdge[],
  subnetLabelFn: (subnetType: string, index: number) => string,
): { nodes: AppNode[]; edges: AppEdge[] } {
  const parent = prevNodes.find((n) => n.id === nodeId);
  if (!parent) return { nodes: prevNodes, edges };

  const containerType = getNetworkContainerType(parent);
  if (!containerType || !(containerType in MANAGED_CHILD_CONFIGS)) {
    return { nodes: prevNodes, edges };
  }

  const config =
    MANAGED_CHILD_CONFIGS[
      containerType as keyof typeof MANAGED_CHILD_CONFIGS
    ];
  const { width: parentW, height: parentH } = getNodeSize(parent);

  // The Inspector slider displays the count of ALL children of the managed
  // type — manual and auto-generated alike — so the adjustment must operate
  // over that same set or the displayed value jumps past the requested one.
  const existing = prevNodes
    .filter((n) => n.parentId === parent.id && config.isChildNode(n))
    .sort(
      (a, b) => a.position[config.layoutAxis] - b.position[config.layoutAxis],
    );

  const target = Math.max(0, count);
  if (target === existing.length) return { nodes: prevNodes, edges };

  let result: AppNode[];

  if (target > existing.length) {
    const appended = buildAppendedChildren(
      config,
      parent.id,
      parentW,
      parentH,
      existing.length,
      target,
      subnetLabelFn,
      new Set(prevNodes.map((n) => n.id)),
    );
    result = [...prevNodes, ...appended];
  } else {
    // Prefer removing children whose loss is invisible: empty auto-generated
    // first, then empty manual ones, and only then occupied children (last in
    // layout order first). Children of a removed container are re-parented to
    // the slider's container, keeping their absolute canvas positions.
    const hasContent = (id: string) =>
      prevNodes.some((n) => n.parentId === id);
    const managedEmpty = existing.filter(
      (n) => n.draggable === false && !hasContent(n.id),
    );
    const manualEmpty = existing.filter(
      (n) => n.draggable !== false && !hasContent(n.id),
    );
    const occupied = existing.filter((n) => hasContent(n.id));
    const removalOrder = [
      ...managedEmpty.slice().reverse(),
      ...manualEmpty.slice().reverse(),
      ...occupied.slice().reverse(),
    ];
    const removedIds = new Set(
      removalOrder.slice(0, existing.length - target).map((n) => n.id),
    );

    const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
    const parentAbsPos = getAbsolutePosition(parent, nodesById);

    result = prevNodes
      .filter((n) => !removedIds.has(n.id))
      .map((n) => {
        if (!n.parentId || !removedIds.has(n.parentId)) return n;
        const childAbsPos = getAbsolutePosition(
          nodesById.get(n.parentId)!,
          nodesById,
        );
        return {
          ...n,
          parentId: parent.id,
          position: {
            x: childAbsPos.x + n.position.x - parentAbsPos.x,
            y: childAbsPos.y + n.position.y - parentAbsPos.y,
          },
        };
      });
  }

  result = result.map((n) =>
    n.id === parent.id
      ? {
          ...n,
          data: {
            ...n.data,
            fields: {
              ...(n.data as { fields?: Record<string, unknown> }).fields,
              [config.countField]: target,
            },
          },
        }
      : n,
  );

  // Surviving and appended children alike get their final geometry here, so
  // a single remaining child always expands to fill the parent's content box.
  result = resizeContainerNode(parent.id, parentW, parentH, result);

  return { nodes: orderNodesForSubflows(result), edges };
}
