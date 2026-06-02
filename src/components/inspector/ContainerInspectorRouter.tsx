import type { AppNode, NetworkContainerType } from "@/types/flow";
import { RegionInspectorPanel } from "@/components/inspector/RegionInspectorPanel";
import { VpcInspectorPanel } from "@/components/inspector/VpcInspectorPanel";
import { AzInspectorPanel } from "@/components/inspector/AzInspectorPanel";
import { SubnetInspectorPanel } from "@/components/inspector/SubnetInspectorPanel";

type ContainerRouterProps = {
  node: AppNode;
  containerType: NetworkContainerType;
};

export function ContainerInspectorRouter({
  node,
  containerType,
}: ContainerRouterProps) {
  switch (containerType) {
    case "region":
      return <RegionInspectorPanel node={node} />;
    case "vpc":
      return <VpcInspectorPanel node={node} />;
    case "az":
      return <AzInspectorPanel node={node} />;
    case "subnet":
      return <SubnetInspectorPanel node={node} />;
  }
}
