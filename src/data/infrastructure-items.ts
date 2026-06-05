import { User, Cloud, Globe, Layers, Network, TrendingUp } from 'lucide-react';
import type { DragTool } from '@/lib/drag-tools';

export type InfrastructureItem = {
  id: string;
  name: string;
  descriptionKey: string;
  tooltipKey: string;
  tool: DragTool;
  Icon: React.ComponentType<{ className?: string }>;
  aliases?: string;
};

export const INFRASTRUCTURE_ITEMS: InfrastructureItem[] = [
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
];
