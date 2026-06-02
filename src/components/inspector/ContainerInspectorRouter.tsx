import type { NetworkContainerType } from "@/types/flow";
import {
  RegionInspectorPanel,
  type RegionInspectorPanelProps,
} from "@/components/inspector/RegionInspectorPanel";
import {
  VpcInspectorPanel,
  type VpcInspectorPanelProps,
} from "@/components/inspector/VpcInspectorPanel";
import {
  AzInspectorPanel,
  type AzInspectorPanelProps,
} from "@/components/inspector/AzInspectorPanel";
import {
  SubnetInspectorPanel,
  type SubnetInspectorPanelProps,
} from "@/components/inspector/SubnetInspectorPanel";

type ContainerRouterProps = {
  containerType: NetworkContainerType;
  regionProps: RegionInspectorPanelProps;
  vpcProps: VpcInspectorPanelProps;
  azProps: AzInspectorPanelProps;
  subnetProps: SubnetInspectorPanelProps;
};

export function ContainerInspectorRouter({
  containerType,
  regionProps,
  vpcProps,
  azProps,
  subnetProps,
}: ContainerRouterProps) {
  switch (containerType) {
    case "region":
      return <RegionInspectorPanel {...regionProps} />;
    case "vpc":
      return <VpcInspectorPanel {...vpcProps} />;
    case "az":
      return <AzInspectorPanel {...azProps} />;
    case "subnet":
      return <SubnetInspectorPanel {...subnetProps} />;
  }
}
