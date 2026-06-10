import type { Edge, Node, Viewport } from "@xyflow/react";
import type { AwsServiceNodeType } from "@/components/nodes/AwsServiceNode";
import type { GatewayServiceNodeType } from "@/components/nodes/GatewayServiceNode";
import type { NetworkContainerNodeType } from "@/components/nodes/network-containers/NetworkContainerNode";
import type { PlainTextNodeType } from "@/components/nodes/PlainTextNode";
import type { MiscellaneousNodeType } from "@/components/nodes/MiscellaneousNode";
import type { ImageNodeType } from "@/components/nodes/ImageNode";
import type { ContainerInsets } from "@/lib/graph-utils";
export type { PlacementScope } from "@/data/aws-services";

export type AppNode =
  | Node
  | AwsServiceNodeType
  | GatewayServiceNodeType
  | NetworkContainerNodeType
  | PlainTextNodeType
  | ImageNodeType
  | MiscellaneousNodeType;
export type AppEdge = Edge;

export type SubnetType = "Public" | "Private";

export type NetworkContainerType = "aws" | "subnet" | "vpc" | "region" | "az" | "asg" | "generic";

export type ContainerDropPreview = {
  parentId: string;
  childType: NetworkContainerType;
};

export type NetworkContainerNodeData = {
  containerType: NetworkContainerType;
  label: string;
  subnetType?: SubnetType;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
  synced?: boolean;
  gatewayInsets?: ContainerInsets;
  scopeInsets?: ContainerInsets;
};

export type SubnetNodeData = NetworkContainerNodeData & {
  containerType: "subnet";
  subnetType: SubnetType;
};

export type FlowPosition = {
  x: number;
  y: number;
};

export type FlowViewport = Viewport;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "ANY";

export type ApiGatewayRoute = {
  id: string;
  method: HttpMethod;
  path: string;
};

export type AzSyncRole = "source" | "mirror";

export type AzSyncNodeData = {
  syncGroupId?: string;
  syncSourceAzId?: string;
  syncRole?: AzSyncRole;
};

export type AzSyncEdgeData = AzSyncNodeData;
