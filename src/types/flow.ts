import type { Edge, Node } from "@xyflow/react";
import type { AwsServiceNodeType } from "@/components/AwsServiceNode";
import type { NetworkContainerNodeType } from "@/components/NetworkContainerNode";

export type AppNode = Node | AwsServiceNodeType | NetworkContainerNodeType;
export type AppEdge = Edge;

export type SubnetType = "Public" | "Private";

export type NetworkContainerType = "subnet" | "vpc";

export type NetworkContainerNodeData = {
  containerType: NetworkContainerType;
  label: string;
  subnetType?: SubnetType;
};

export type SubnetNodeData = NetworkContainerNodeData & {
  containerType: "subnet";
  subnetType: SubnetType;
};

export type FlowPosition = {
  x: number;
  y: number;
};
