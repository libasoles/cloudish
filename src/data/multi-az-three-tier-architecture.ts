const service = (
  id: string,
  name: string,
  slug: string,
  category: string,
  serviceId: string,
  position: { x: number; y: number },
  parentId?: string,
) => {
  const node = {
    id,
    type: "awsService",
    position,
    data: { name, slug, category, serviceId },
  };

  if (!parentId) {
    return node;
  }

  return {
    ...node,
    parentId,
    extent: "parent",
  };
};

const container = (
  id: string,
  containerType: string,
  label: string,
  position: { x: number; y: number },
  style: { width: number; height: number },
  parentId?: string,
  extra: Record<string, string | number | boolean> = {},
) => {
  const node = {
    id,
    type: "networkContainer",
    position,
    style,
    data: { containerType, label, ...extra },
  };

  if (!parentId) {
    return node;
  }

  return {
    ...node,
    parentId,
    extent: "parent",
  };
};

const edge = (
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  ...extra,
});

const traffic = { animated: true, style: { stroke: "#e5e7eb", strokeWidth: 2.5 } };
const egress = { style: { stroke: "#94a3b8", strokeDasharray: "6 4" } };
const dataFlow = { style: { stroke: "#a78bfa", strokeWidth: 2 } };
const observability = { style: { stroke: "#6b7280", strokeDasharray: "4 4" } };

export const multiAzThreeTierArchitectureName = "Multi-AZ 3-Tier Web Architecture";

export const multiAzThreeTierArchitectureNodes = [
  container("region", "region", "AWS Region: us-east-1", { x: 260, y: 80 }, { width: 1700, height: 900 }),
  container("vpc", "vpc", "VPC - 10.0.0.0/16", { x: 40, y: 50 }, { width: 1620, height: 820 }, "region"),
  container("az-a", "az", "AZ-A (us-east-1a)", { x: 40, y: 170 }, { width: 730, height: 620 }, "vpc"),
  container("az-b", "az", "AZ-B (us-east-1b)", { x: 850, y: 170 }, { width: 730, height: 620 }, "vpc"),
  container(
    "pub-subnet-a",
    "subnet",
    "Public Subnet AZ-A - 10.0.1.0/24",
    { x: 25, y: 45 },
    { width: 680, height: 190 },
    "az-a",
    { subnetType: "Public" },
  ),
  container(
    "priv-subnet-a",
    "subnet",
    "Private Subnet AZ-A - 10.0.2.0/24",
    { x: 25, y: 275 },
    { width: 680, height: 315 },
    "az-a",
    { subnetType: "Private" },
  ),
  container(
    "pub-subnet-b",
    "subnet",
    "Public Subnet AZ-B - 10.0.3.0/24",
    { x: 25, y: 45 },
    { width: 680, height: 190 },
    "az-b",
    { subnetType: "Public" },
  ),
  container(
    "priv-subnet-b",
    "subnet",
    "Private Subnet AZ-B - 10.0.4.0/24",
    { x: 25, y: 275 },
    { width: 680, height: 315 },
    "az-b",
    { subnetType: "Private" },
  ),
  container(
    "asg-a",
    "asg",
    "Auto Scaling Group - web tier",
    { x: 60, y: 60 },
    { width: 290, height: 170 },
    "priv-subnet-a",
  ),
  container(
    "asg-b",
    "asg",
    "Auto Scaling Group - web tier",
    { x: 60, y: 60 },
    { width: 290, height: 170 },
    "priv-subnet-b",
  ),
  service("web-client", "Web", "html5", "Clients", "web-client", { x: 90, y: 210 }),
  service("route53-node", "Route 53", "aws-amazon-route-53", "Networking", "route53", { x: 90, y: 360 }),
  service("s3-node", "S3", "aws-amazon-simple-storage-service", "Storage", "s3", { x: 670, y: 1050 }),
  service("cloudwatch-node", "CloudWatch", "aws-amazon-cloudwatch", "Management", "cloudwatch", { x: 1330, y: 1050 }),
  service(
    "igw-node",
    "Internet Gateway",
    "aws-res-amazon-vpc-internet-gateway",
    "Networking",
    "internet-gateway",
    { x: 760, y: 10 },
    "vpc",
  ),
  service("alb-node", "ALB", "aws-elastic-load-balancing", "Networking", "elb", { x: 760, y: 90 }, "vpc"),
  service(
    "nat-gw-a",
    "NAT Gateway",
    "aws-res-amazon-vpc-nat-gateway",
    "Networking",
    "nat-gateway",
    { x: 500, y: 75 },
    "pub-subnet-a",
  ),
  service(
    "nat-gw-b",
    "NAT Gateway",
    "aws-res-amazon-vpc-nat-gateway",
    "Networking",
    "nat-gateway",
    { x: 500, y: 75 },
    "pub-subnet-b",
  ),
  service("ec2-a", "EC2", "aws-res-amazon-ec2-instance", "Compute", "ec2", { x: 95, y: 80 }, "asg-a"),
  service("ec2-b", "EC2", "aws-res-amazon-ec2-instance", "Compute", "ec2", { x: 95, y: 80 }, "asg-b"),
  service(
    "elasticache-a",
    "ElastiCache AZ-A",
    "aws-amazon-elasticache",
    "Database",
    "elasticache",
    { x: 390, y: 75 },
    "priv-subnet-a",
  ),
  service(
    "elasticache-b",
    "ElastiCache AZ-B",
    "aws-amazon-elasticache",
    "Database",
    "elasticache",
    { x: 390, y: 75 },
    "priv-subnet-b",
  ),
  service("rds-primary", "RDS Primary", "aws-amazon-rds", "Database", "rds", { x: 390, y: 205 }, "priv-subnet-a"),
  service("rds-standby", "RDS Standby", "aws-amazon-rds", "Database", "rds", { x: 390, y: 205 }, "priv-subnet-b"),
];

export const multiAzThreeTierArchitectureEdges = [
  edge("e-web-r53", "web-client", "route53-node", "bottom", "top", {
    label: "DNS lookup",
    style: { stroke: "#94a3b8", strokeDasharray: "4 4" },
  }),
  edge("e-r53-alb", "route53-node", "alb-node", "right", "left", {
    label: "Alias record",
    style: { stroke: "#94a3b8", strokeDasharray: "4 4" },
  }),
  edge("e-igw-alb", "igw-node", "alb-node", "bottom", "top", {
    label: "Public ingress",
    ...traffic,
  }),
  edge("e-alb-ec2a", "alb-node", "ec2-a", "bottom", "top", traffic),
  edge("e-alb-ec2b", "alb-node", "ec2-b", "bottom", "top", traffic),
  edge("e-ec2a-cache", "ec2-a", "elasticache-a", "right", "left", dataFlow),
  edge("e-ec2b-cache", "ec2-b", "elasticache-b", "right", "left", dataFlow),
  edge("e-ec2a-rds", "ec2-a", "rds-primary", "right", "left", dataFlow),
  edge("e-ec2b-rds", "ec2-b", "rds-primary", "left", "right", dataFlow),
  edge("e-rds-replication", "rds-primary", "rds-standby", "right", "left", {
    label: "Sync replication",
    style: { stroke: "#c084fc", strokeDasharray: "6 3", strokeWidth: 2 },
  }),
  edge("e-ec2a-nat", "ec2-a", "nat-gw-a", "top", "bottom", {
    label: "Private egress",
    ...egress,
  }),
  edge("e-ec2b-nat", "ec2-b", "nat-gw-b", "top", "bottom", {
    label: "Private egress",
    ...egress,
  }),
  edge("e-nata-igw", "nat-gw-a", "igw-node", "right", "left", egress),
  edge("e-natb-igw", "nat-gw-b", "igw-node", "left", "right", egress),
  edge("e-ec2a-s3", "ec2-a", "s3-node", "bottom", "top", {
    label: "Object storage",
    ...egress,
  }),
  edge("e-ec2b-s3", "ec2-b", "s3-node", "bottom", "top", {
    label: "Object storage",
    ...egress,
  }),
  edge("e-cw-asga", "asg-a", "cloudwatch-node", "bottom", "top", {
    label: "Metrics/logs",
    ...observability,
  }),
  edge("e-cw-asgb", "asg-b", "cloudwatch-node", "bottom", "top", {
    label: "Metrics/logs",
    ...observability,
  }),
];

export const multiAzThreeTierArchitectureViewport = { x: 0, y: 0, zoom: 0.55 };
