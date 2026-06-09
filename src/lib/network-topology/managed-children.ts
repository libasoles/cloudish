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
} from "@/lib/graph-utils";

type ManagedChildCountField = "numberOfVPCs" | "numberOfAZs" | "numberOfSubnets";

type ManagedChildConfig = {
  countField: ManagedChildCountField;
  isChildNode: (n: AppNode) => boolean;
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
    buildChildren: (id, w, h, count) => buildVpcNodes(id, w, h, count),
  },
  vpc: {
    countField: "numberOfAZs",
    isChildNode: isAzNode,
    buildChildren: (id, w, h, count) => buildAzNodes(id, w, h, count),
  },
  az: {
    countField: "numberOfSubnets",
    isChildNode: isSubnetNode,
    buildChildren: (id, w, h, count, labelFn) =>
      buildSubnetNodes(
        id,
        w,
        h,
        count,
        labelFn ?? ((type, i) => `Subnet ${type} ${i}`),
      ),
  },
} satisfies Record<Exclude<NetworkContainerType, "subnet" | "asg" | "generic">, ManagedChildConfig>;

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

  const managedChildren = prevNodes.filter(
    (n) =>
      n.parentId === parent.id &&
      config.isChildNode(n) &&
      n.draggable === false,
  );

  const withoutChildren = prevNodes.filter(
    (n) =>
      !(
        n.parentId === parent.id &&
        config.isChildNode(n) &&
        n.draggable === false
      ),
  );

  const removedChildIds = new Set(managedChildren.map((n) => n.id));
  const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
  const parentAbsPos = getAbsolutePosition(parent, nodesById);

  const reParentedNodes = withoutChildren.map((n) => {
    if (!n.parentId || !removedChildIds.has(n.parentId)) return n;
    const childAbsPos = getAbsolutePosition(nodesById.get(n.parentId)!, nodesById);
    return {
      ...n,
      parentId: parent.id,
      position: {
        x: childAbsPos.x + n.position.x - parentAbsPos.x,
        y: childAbsPos.y + n.position.y - parentAbsPos.y,
      },
    };
  });

  const updatedParent = {
    ...parent,
    data: {
      ...parent.data,
      fields: {
        ...(parent.data as { fields?: Record<string, unknown> }).fields,
        [config.countField]: count,
      },
    },
  };

  const withUpdatedParent = reParentedNodes.map((n) =>
    n.id === parent.id ? updatedParent : n,
  );

  if (count <= 0) {
    return { nodes: withUpdatedParent, edges };
  }

  const newChildren = config.buildChildren(
    parent.id,
    parentW,
    parentH,
    count,
    subnetLabelFn,
  );
  return {
    nodes: orderNodesForSubflows([...withUpdatedParent, ...newChildren]),
    edges,
  };
}
