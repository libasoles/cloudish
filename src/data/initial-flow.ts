import type { AppEdge, AppNode } from "@/types/flow";

// Multi-AZ 3-tier web architecture.
//
// Layout heuristics applied:
//   • Main flow left→right: Web/Route53 left | Region center | S3/CloudWatch below
//   • S3 below region (aligned under AZ-A) so EC2→S3 edges go DOWN, not crossing the horizontal flow
//   • CloudWatch below region, centered between the two AZs
//   • IGW and ALB centered in the 110px gap between AZ-A and AZ-B (no overlap with AZ containers)
//   • Containers fill available vertical space — no dead zones

export const initialNodes: AppNode[] = [
  // ── Internet clients (left of region) ────────────────────────────────────

  {
    id: "web-client",
    type: "awsService",
    position: { x: 30, y: 340 },
    data: { name: "Web", slug: "html5", category: "Clients", serviceId: "web-client" },
  },
  {
    id: "route53-node",
    type: "awsService",
    position: { x: 30, y: 540 },
    data: { name: "Route 53", slug: "aws-amazon-route-53", category: "Networking", serviceId: "route53" },
  },

  // ── Global/support services (below region) ────────────────────────────────
  // S3 below AZ-A so EC2→S3 edges go straight down without crossing the main flow
  // CloudWatch centered between the two AZs

  {
    id: "s3-node",
    type: "awsService",
    position: { x: 570, y: 1155 },
    data: { name: "S3", slug: "aws-amazon-simple-storage-service", category: "Storage", serviceId: "s3" },
  },
  {
    id: "cloudwatch-node",
    type: "awsService",
    position: { x: 1160, y: 1155 },
    data: { name: "CloudWatch", slug: "aws-amazon-cloudwatch", category: "Management", serviceId: "cloudwatch" },
  },

  // ── Region ───────────────────────────────────────────────────────────────

  {
    id: "region",
    type: "networkContainer",
    position: { x: 200, y: 80 },
    style: { width: 1850, height: 1010 },
    data: { containerType: "region", label: "AWS Region: us-east-1" },
  },

  // ── VPC ──────────────────────────────────────────────────────────────────
  // Width 1630: AZ-A (30→760) | gap 110px (760→870) | AZ-B (870→1600) | margin 30px
  // Height 850: header 275px (IGW+ALB) | AZs 540px | bottom margin 35px

  {
    id: "vpc",
    type: "networkContainer",
    position: { x: 100, y: 70 },
    style: { width: 1630, height: 850 },
    data: { containerType: "vpc", label: "VPC — 10.0.0.0/16" },
    parentId: "region",
    extent: "parent",
  },

  // ── IGW & ALB — centered in the 110px gap between AZ-A and AZ-B ──────────
  // Gap center at VPC x=815. IGW (56px): x=787. ALB (80px): x=775.
  // Vertical: IGW y=22 (bottom≈104) → 51px gap → ALB y=155 (bottom≈235) → 40px gap → AZs y=275

  {
    id: "igw-node",
    type: "awsService",
    position: { x: 787, y: 22 },
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
    position: { x: 775, y: 155 },
    data: { name: "ALB", slug: "aws-elastic-load-balancing", category: "Networking", serviceId: "elb" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── AZ-A ─────────────────────────────────────────────────────────────────

  {
    id: "az-a",
    type: "networkContainer",
    position: { x: 30, y: 275 },
    style: { width: 730, height: 540 },
    data: { containerType: "az", label: "AZ-A (us-east-1a)" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── AZ-B ─────────────────────────────────────────────────────────────────

  {
    id: "az-b",
    type: "networkContainer",
    position: { x: 870, y: 275 },
    style: { width: 730, height: 540 },
    data: { containerType: "az", label: "AZ-B (us-east-1b)" },
    parentId: "vpc",
    extent: "parent",
  },

  // ── Public Subnet AZ-A ───────────────────────────────────────────────────

  {
    id: "pub-subnet-a",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 690, height: 170 },
    data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-A — 10.0.1.0/24" },
    parentId: "az-a",
    extent: "parent",
  },

  // ── Private Subnet AZ-A ──────────────────────────────────────────────────
  // Height 260: fills remaining AZ space (AZ 540 − pub top 55 − pub h 170 − gap 55 − bottom margin 0 ≈ 260)

  {
    id: "priv-subnet-a",
    type: "networkContainer",
    position: { x: 20, y: 280 },
    style: { width: 690, height: 240 },
    data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-A — 10.0.2.0/24" },
    parentId: "az-a",
    extent: "parent",
  },

  // ── Public Subnet AZ-B ───────────────────────────────────────────────────

  {
    id: "pub-subnet-b",
    type: "networkContainer",
    position: { x: 20, y: 55 },
    style: { width: 690, height: 170 },
    data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-B — 10.0.3.0/24" },
    parentId: "az-b",
    extent: "parent",
  },

  // ── Private Subnet AZ-B ──────────────────────────────────────────────────

  {
    id: "priv-subnet-b",
    type: "networkContainer",
    position: { x: 20, y: 280 },
    style: { width: 690, height: 240 },
    data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-B — 10.0.4.0/24" },
    parentId: "az-b",
    extent: "parent",
  },

  // ── NAT Gateways (in public subnets, centered horizontally) ──────────────
  // Circular node 56px wide: centered in 690px subnet → x = (690−56)/2 = 317

  {
    id: "nat-gw-a",
    type: "awsService",
    position: { x: 317, y: 44 },
    data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" },
    parentId: "pub-subnet-a",
    extent: "parent",
  },
  {
    id: "nat-gw-b",
    type: "awsService",
    position: { x: 317, y: 44 },
    data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" },
    parentId: "pub-subnet-b",
    extent: "parent",
  },

  // ── Auto Scaling Groups (in private subnets) ──────────────────────────────

  {
    id: "asg-a",
    type: "networkContainer",
    position: { x: 20, y: 50 },
    style: { width: 240, height: 165 },
    data: { containerType: "asg", label: "Auto Scaling Group" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },
  {
    id: "ec2-a",
    type: "awsService",
    position: { x: 80, y: 45 },
    data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" },
    parentId: "asg-a",
    extent: "parent",
  },

  {
    id: "asg-b",
    type: "networkContainer",
    position: { x: 20, y: 50 },
    style: { width: 240, height: 165 },
    data: { containerType: "asg", label: "Auto Scaling Group" },
    parentId: "priv-subnet-b",
    extent: "parent",
  },
  {
    id: "ec2-b",
    type: "awsService",
    position: { x: 80, y: 45 },
    data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" },
    parentId: "asg-b",
    extent: "parent",
  },

  // ── RDS Multi-AZ ─────────────────────────────────────────────────────────

  {
    id: "rds-primary",
    type: "awsService",
    position: { x: 355, y: 80 },
    data: { name: "RDS Primary", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },
  {
    id: "rds-standby",
    type: "awsService",
    position: { x: 355, y: 80 },
    data: { name: "RDS Standby", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" },
    parentId: "priv-subnet-b",
    extent: "parent",
  },

  // ── ElastiCache (in AZ-A private subnet) ─────────────────────────────────

  {
    id: "elasticache-node",
    type: "awsService",
    position: { x: 545, y: 80 },
    data: { name: "ElastiCache", slug: "aws-amazon-elasticache", category: "Database", serviceId: "elasticache" },
    parentId: "priv-subnet-a",
    extent: "parent",
  },
];

export const initialEdges: AppEdge[] = [
  // ── Main request path (animated) ─────────────────────────────────────────
  // web ABOVE route53
  { id: "e-web-r53",  source: "web-client",   target: "route53-node", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  // route53 LEFT of igw
  { id: "e-r53-igw",  source: "route53-node", target: "igw-node",     animated: true, sourceHandle: "right",  targetHandle: "left" },
  // igw ABOVE alb
  { id: "e-igw-alb",  source: "igw-node",     target: "alb-node",     animated: true, sourceHandle: "bottom", targetHandle: "top" },
  // alb ABOVE both EC2 nodes
  { id: "e-alb-ec2a", source: "alb-node",     target: "ec2-a",        animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-alb-ec2b", source: "alb-node",     target: "ec2-b",        animated: true, sourceHandle: "bottom", targetHandle: "top" },

  // ── App → Database ────────────────────────────────────────────────────────
  // ec2-a LEFT of rds-primary (same AZ)
  { id: "e-ec2a-rds",  source: "ec2-a", target: "rds-primary",  sourceHandle: "right", targetHandle: "left" },
  // ec2-b RIGHT of rds-primary (cross-AZ read)
  { id: "e-ec2b-rds",  source: "ec2-b", target: "rds-primary",  sourceHandle: "left",  targetHandle: "right" },
  // rds-primary LEFT of rds-standby — synchronous Multi-AZ replication
  {
    id: "e-rds-replication",
    source: "rds-primary",
    target: "rds-standby",
    label: "Sync replication",
    style: { strokeDasharray: "6 3", stroke: "#a78bfa" },
    sourceHandle: "right",
    targetHandle: "left",
  },

  // ── App → Cache ───────────────────────────────────────────────────────────
  // ec2-a LEFT of elasticache (same AZ)
  { id: "e-ec2a-cache", source: "ec2-a", target: "elasticache-node", sourceHandle: "right", targetHandle: "left" },
  // ec2-b RIGHT of elasticache (cross-AZ)
  { id: "e-ec2b-cache", source: "ec2-b", target: "elasticache-node", sourceHandle: "left",  targetHandle: "right" },

  // ── Private subnets → NAT Gateways → IGW ─────────────────────────────────
  // ec2 BELOW nat-gw (private subnet below public subnet)
  { id: "e-ec2a-nat",  source: "ec2-a",    target: "nat-gw-a", sourceHandle: "top",   targetHandle: "bottom" },
  { id: "e-ec2b-nat",  source: "ec2-b",    target: "nat-gw-b", sourceHandle: "top",   targetHandle: "bottom" },
  // nat-gw-a LEFT of igw; nat-gw-b RIGHT of igw
  { id: "e-nata-igw",  source: "nat-gw-a", target: "igw-node", sourceHandle: "right", targetHandle: "left" },
  { id: "e-natb-igw",  source: "nat-gw-b", target: "igw-node", sourceHandle: "left",  targetHandle: "right" },

  // ── EC2 → S3 (static assets / object storage) ────────────────────────────
  // S3 is BELOW the region, aligned under AZ-A → edge goes straight down
  { id: "e-ec2a-s3", source: "ec2-a", target: "s3-node", sourceHandle: "bottom", targetHandle: "top" },

  // ── CloudWatch monitors Auto Scaling Groups ───────────────────────────────
  // CloudWatch is below and to the RIGHT of asg-a → exit left of CW, enter right of asg-a
  {
    id: "e-cw-asga",
    source: "cloudwatch-node",
    target: "asg-a",
    sourceHandle: "left",
    style: { stroke: "#6b7280", strokeDasharray: "4 3" },
  },
  // CloudWatch is below asg-b → exit top of CW (vertical dominant)
  {
    id: "e-cw-asgb",
    source: "cloudwatch-node",
    target: "asg-b",
    sourceHandle: "top",
    style: { stroke: "#6b7280", strokeDasharray: "4 3" },
  },
];
