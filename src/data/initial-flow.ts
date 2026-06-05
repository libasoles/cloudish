import type { AppEdge, AppNode } from "@/types/flow";

// Multi-AZ 3-tier web architecture:
// Route 53 → IGW → ALB → EC2/ASG (x2 AZs) → RDS Multi-AZ + ElastiCache + S3

export const initialNodes: AppNode[] = [
  // ── Outside AWS ──────────────────────────────────────────────────────────

  {
    id: "web-client",
    type: "awsService",
    position: { x: 30, y: 310 },
    data: { name: "Web", slug: "html5", category: "Clients", serviceId: "web-client" },
  },
  {
    id: "route53-node",
    type: "awsService",
    position: { x: 30, y: 510 },
    data: { name: "Route 53", slug: "aws-amazon-route-53", category: "Networking", serviceId: "route53" },
  },

  // ── Global services (outside region) ─────────────────────────────────────

  {
    id: "s3-node",
    type: "awsService",
    position: { x: 2280, y: 320 },
    data: { name: "S3", slug: "aws-amazon-simple-storage-service", category: "Storage", serviceId: "s3" },
  },
  {
    id: "cloudwatch-node",
    type: "awsService",
    position: { x: 2280, y: 530 },
    data: { name: "CloudWatch", slug: "aws-amazon-cloudwatch", category: "Management", serviceId: "cloudwatch" },
  },

  // ── Region ───────────────────────────────────────────────────────────────

  {
    id: "region",
    type: "networkContainer",
    position: { x: 190, y: 80 },
    style: { width: 2010, height: 1060 },
    data: { containerType: "region", label: "AWS Region: us-east-1" },
  },

  // ── VPC ──────────────────────────────────────────────────────────────────

  {
    id: "vpc",
    type: "networkContainer",
    position: { x: 100, y: 70 },
    style: { width: 1790, height: 920 },
    data: { containerType: "vpc", label: "VPC — 10.0.0.0/16" },
    parentId: "region",
    extent: "parent",
  },

  // ── Internet Gateway & ALB at VPC level (above AZs, vertically separated) ─

  {
    id: "igw-node",
    type: "awsService",
    position: { x: 862, y: 20 },
    data: {
      name: "Internet Gateway",
      slug: "aws-res-amazon-vpc-internet-gateway",
      category: "Networking",
      serviceId: "internet-gateway",
    },
    parentId: "vpc",
    extent: "parent",
  },
  {
    id: "alb-node",
    type: "awsService",
    position: { x: 848, y: 180 },
    data: { name: "ALB", slug: "aws-elastic-load-balancing", category: "Networking", serviceId: "elb" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── AZ-A ─────────────────────────────────────────────────────────────────

  {
    id: "az-a",
    type: "networkContainer",
    position: { x: 30, y: 300 },
    style: { width: 790, height: 570 },
    data: { containerType: "az", label: "AZ-A (us-east-1a)" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── AZ-B ─────────────────────────────────────────────────────────────────

  {
    id: "az-b",
    type: "networkContainer",
    position: { x: 970, y: 300 },
    style: { width: 790, height: 570 },
    data: { containerType: "az", label: "AZ-B (us-east-1b)" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── Public Subnet AZ-A ───────────────────────────────────────────────────

  {
    id: "pub-subnet-a",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 750, height: 165 },
    data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-A — 10.0.1.0/24" },
    parentId: "az-a",
    extent: "parent",
  },

  // ── Private Subnet AZ-A ──────────────────────────────────────────────────

  {
    id: "priv-subnet-a",
    type: "networkContainer",
    position: { x: 20, y: 275 },
    style: { width: 750, height: 265 },
    data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-A — 10.0.2.0/24" },
    parentId: "az-a",
    extent: "parent",
  },

  // ── Public Subnet AZ-B ───────────────────────────────────────────────────

  {
    id: "pub-subnet-b",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 750, height: 165 },
    data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-B — 10.0.3.0/24" },
    parentId: "az-b",
    extent: "parent",
  },

  // ── Private Subnet AZ-B ──────────────────────────────────────────────────

  {
    id: "priv-subnet-b",
    type: "networkContainer",
    position: { x: 20, y: 275 },
    style: { width: 750, height: 265 },
    data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-B — 10.0.4.0/24" },
    parentId: "az-b",
    extent: "parent",
  },

  // ── NAT Gateway AZ-A (public subnet) ─────────────────────────────────────

  {
    id: "nat-gw-a",
    type: "awsService",
    position: { x: 330, y: 48 },
    data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" },
    parentId: "pub-subnet-a",
    extent: "parent",
  },

  // ── NAT Gateway AZ-B (public subnet) ─────────────────────────────────────

  {
    id: "nat-gw-b",
    type: "awsService",
    position: { x: 330, y: 48 },
    data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" },
    parentId: "pub-subnet-b",
    extent: "parent",
  },

  // ── Auto Scaling Group AZ-A (private subnet) ─────────────────────────────

  {
    id: "asg-a",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 240, height: 165 },
    data: { containerType: "asg", label: "Auto Scaling Group" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },

  // ── EC2 inside ASG AZ-A ───────────────────────────────────────────────────

  {
    id: "ec2-a",
    type: "awsService",
    position: { x: 70, y: 50 },
    data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" },
    parentId: "asg-a",
    extent: "parent",
  },

  // ── RDS Primary (private subnet AZ-A) ────────────────────────────────────

  {
    id: "rds-primary",
    type: "awsService",
    position: { x: 360, y: 88 },
    data: { name: "RDS Primary", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },

  // ── ElastiCache (private subnet AZ-A) ─────────────────────────────────────

  {
    id: "elasticache-node",
    type: "awsService",
    position: { x: 570, y: 88 },
    data: { name: "ElastiCache", slug: "aws-amazon-elasticache", category: "Database", serviceId: "elasticache" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },

  // ── Auto Scaling Group AZ-B (private subnet) ─────────────────────────────

  {
    id: "asg-b",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 240, height: 165 },
    data: { containerType: "asg", label: "Auto Scaling Group" },
    parentId: "priv-subnet-b",
    extent: "parent",
  },

  // ── EC2 inside ASG AZ-B ───────────────────────────────────────────────────

  {
    id: "ec2-b",
    type: "awsService",
    position: { x: 70, y: 50 },
    data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" },
    parentId: "asg-b",
    extent: "parent",
  },

  // ── RDS Standby (private subnet AZ-B) ────────────────────────────────────

  {
    id: "rds-standby",
    type: "awsService",
    position: { x: 360, y: 88 },
    data: { name: "RDS Standby", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" },
    parentId: "priv-subnet-b",
    extent: "parent",
  },
];

export const initialEdges: AppEdge[] = [
  // ── Request path (animated) ───────────────────────────────────────────────
  // web-client ABOVE route53
  { id: "e-web-r53", source: "web-client", target: "route53-node", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  // route53 LEFT of igw
  { id: "e-r53-igw", source: "route53-node", target: "igw-node", animated: true, sourceHandle: "right", targetHandle: "left" },
  // igw ABOVE alb
  { id: "e-igw-alb", source: "igw-node", target: "alb-node", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  // alb ABOVE both ec2 nodes
  { id: "e-alb-ec2a", source: "alb-node", target: "ec2-a", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-alb-ec2b", source: "alb-node", target: "ec2-b", animated: true, sourceHandle: "bottom", targetHandle: "top" },

  // ── App → Database ────────────────────────────────────────────────────────
  // ec2-a LEFT of rds-primary (same subnet)
  { id: "e-ec2a-rds", source: "ec2-a", target: "rds-primary", sourceHandle: "right", targetHandle: "left" },
  // ec2-b RIGHT of rds-primary (cross-AZ)
  { id: "e-ec2b-rds", source: "ec2-b", target: "rds-primary", sourceHandle: "left", targetHandle: "right" },

  // ── RDS Multi-AZ synchronous replication ──────────────────────────────────
  // rds-primary LEFT of rds-standby
  {
    id: "e-rds-replication",
    source: "rds-primary",
    target: "rds-standby",
    label: "Sync replication",
    style: { strokeDasharray: "6 3", stroke: "#a78bfa" },
    sourceHandle: "right",
    targetHandle: "left",
  },

  // ── App → ElastiCache (sessions / cache) ──────────────────────────────────
  // ec2-a LEFT of elasticache
  { id: "e-ec2a-cache", source: "ec2-a", target: "elasticache-node", sourceHandle: "right", targetHandle: "left" },
  // ec2-b RIGHT of elasticache (cross-AZ)
  { id: "e-ec2b-cache", source: "ec2-b", target: "elasticache-node", sourceHandle: "left", targetHandle: "right" },

  // ── Private → NAT Gateway → Internet ─────────────────────────────────────
  // ec2 BELOW nat-gw in same AZ (private subnet below public subnet)
  { id: "e-ec2a-nat", source: "ec2-a", target: "nat-gw-a", sourceHandle: "top", targetHandle: "bottom" },
  { id: "e-ec2b-nat", source: "ec2-b", target: "nat-gw-b", sourceHandle: "top", targetHandle: "bottom" },
  // nat-gw-a LEFT of igw; nat-gw-b RIGHT of igw
  { id: "e-nata-igw", source: "nat-gw-a", target: "igw-node", sourceHandle: "right", targetHandle: "left" },
  { id: "e-natb-igw", source: "nat-gw-b", target: "igw-node", sourceHandle: "left", targetHandle: "right" },

  // ── Static assets → S3 ────────────────────────────────────────────────────
  // ec2-a LEFT of s3 (global service, far right)
  { id: "e-ec2a-s3", source: "ec2-a", target: "s3-node", sourceHandle: "right", targetHandle: "left" },

  // ── CloudWatch monitors Auto Scaling Groups ───────────────────────────────
  // cloudwatch RIGHT of both ASGs
  {
    id: "e-cw-asga",
    source: "cloudwatch-node",
    target: "asg-a",
    sourceHandle: "left",
    style: { stroke: "#6b7280", strokeDasharray: "4 3" },
  },
  {
    id: "e-cw-asgb",
    source: "cloudwatch-node",
    target: "asg-b",
    sourceHandle: "left",
    style: { stroke: "#6b7280", strokeDasharray: "4 3" },
  },
];
