import {
  User,
  Cloud,
  Globe,
  Layers,
  Network,
  TrendingUp,
  Box,
  Monitor,
  Smartphone,
} from "lucide-react";
import { VpcIcon } from "@/components/icons/VpcIcon";
import { AWS_SERVICE_NODE_TYPE, type DragTool } from "@/lib/drag-tools";

export type InfrastructureItem = {
  id: string;
  name: string;
  descriptionKey: string;
  tooltipKey: string;
  tool: DragTool;
  Icon: React.ComponentType<{ className?: string }>;
  aliases?: string;
  searchOnly?: boolean;
};

export const CONTAINERS: InfrastructureItem[] = [
  {
    id: 'infra-region',
    name: 'Region',
    descriptionKey: 'regionDescription',
    tooltipKey: 'region',
    tool: { type: 'region' },
    Icon: Globe,
    aliases: 'aws region us-east',
  },
  {
    id: "infra-vpc",
    name: "VPC",
    descriptionKey: "vpcDescription",
    tooltipKey: "vpc",
    tool: { type: AWS_SERVICE_NODE_TYPE, serviceId: "vpc" },
    Icon: VpcIcon,
    aliases: "Virtual Private Cloud red virtual",
  },
  {
    id: 'infra-az',
    name: 'AZ',
    descriptionKey: 'azDescription',
    tooltipKey: 'availabilityZone',
    tool: { type: 'az' },
    Icon: Layers,
    aliases: 'availability zone zona disponibilidad',
  },
  {
    id: 'infra-subnet',
    name: 'Subnet',
    descriptionKey: 'subnetDescription',
    tooltipKey: 'subnet',
    tool: { type: 'container' },
    Icon: Network,
    aliases: 'subred network segmento cidr',
  },
  {
    id: 'infra-asg',
    name: 'Auto Scaling',
    descriptionKey: 'asgDescription',
    tooltipKey: 'asg',
    tool: { type: 'asg' },
    Icon: TrendingUp,
    aliases: 'auto scaling group escalado ec2',
  },
  {
    id: 'infra-generic-container',
    name: 'Container',
    descriptionKey: 'genericContainerDescription',
    tooltipKey: 'genericContainer',
    tool: { type: 'genericContainer' },
    Icon: Box,
    aliases: 'container grupo group box agrupador genérico generic contenedor',
    searchOnly: true,
  },
];

export const CLIENTS: InfrastructureItem[] = [
  {
    id: 'infra-web',
    name: 'Web',
    descriptionKey: 'webDescription',
    tooltipKey: 'web',
    tool: { type: 'web' },
    Icon: Monitor,
    aliases: 'browser navegador frontend cliente web client spa',
  },
  {
    id: 'infra-mobile',
    name: 'Mobile',
    descriptionKey: 'mobileDescription',
    tooltipKey: 'mobile',
    tool: { type: 'mobile' },
    Icon: Smartphone,
    aliases: 'app telefono smartphone tablet iOS Android cliente mobile',
  },
];

export const CUSTOM: InfrastructureItem[] = [
  {
    id: 'infra-user',
    name: 'User',
    descriptionKey: 'userDescription',
    tooltipKey: 'user',
    tool: { type: 'user' },
    Icon: User,
    aliases: 'actor cliente externo client',
  },
  {
    id: 'infra-internet',
    name: 'Internet',
    descriptionKey: 'internetDescription',
    tooltipKey: 'internet',
    tool: { type: 'internet' },
    Icon: Cloud,
    aliases: 'web red externa network external',
  },
];

export const INFRASTRUCTURE_ITEM_GROUPS = {
  CONTAINERS,
  CLIENTS,
  CUSTOM,
} as const;

export const INFRASTRUCTURE_ITEMS: InfrastructureItem[] = [
  ...CONTAINERS,
  ...CLIENTS,
  ...CUSTOM,
];
