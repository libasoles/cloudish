// One-shot script: saves initial-flow.ts content to Firestore under the user's account
// Usage: node --env-file=.env.local scripts/save-default-diagram.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const USER_EMAIL = "gperez78@gmail.com";
const ARCHITECTURE_NAME = "Multi-AZ 3-Tier Web Architecture";

// ── Nodes from initial-flow.ts ────────────────────────────────────────────────

const nodes = [
  { id: "web-client", type: "awsService", position: { x: 30, y: 340 }, data: { name: "Web", slug: "html5", category: "Clients", serviceId: "web-client" } },
  { id: "route53-node", type: "awsService", position: { x: 30, y: 540 }, data: { name: "Route 53", slug: "aws-amazon-route-53", category: "Networking", serviceId: "route53" } },
  { id: "s3-node", type: "awsService", position: { x: 570, y: 1155 }, data: { name: "S3", slug: "aws-amazon-simple-storage-service", category: "Storage", serviceId: "s3" } },
  { id: "cloudwatch-node", type: "awsService", position: { x: 1160, y: 1155 }, data: { name: "CloudWatch", slug: "aws-amazon-cloudwatch", category: "Management", serviceId: "cloudwatch" } },
  { id: "region", type: "networkContainer", position: { x: 200, y: 80 }, style: { width: 1850, height: 1010 }, data: { containerType: "region", label: "AWS Region: us-east-1" } },
  { id: "vpc", type: "networkContainer", position: { x: 100, y: 80 }, style: { width: 1750, height: 990 }, data: { containerType: "vpc", label: "VPC — 10.0.0.0/16" }, parentId: "region", extent: "parent" },
  { id: "igw-node", type: "awsService", position: { x: 875, y: 90 }, data: { name: "Internet Gateway", slug: "aws-res-amazon-vpc-internet-gateway", category: "Networking", serviceId: "internet-gateway" }, parentId: "vpc", extent: "parent" },
  { id: "alb-node", type: "awsService", position: { x: 875, y: 180 }, data: { name: "ALB", slug: "aws-elastic-load-balancing", category: "Networking", serviceId: "elb" }, parentId: "vpc", extent: "parent" },
  { id: "az-a", type: "networkContainer", position: { x: 20, y: 240 }, style: { width: 800, height: 700 }, data: { containerType: "az", label: "AZ-A (us-east-1a)" }, parentId: "vpc", extent: "parent" },
  { id: "az-b", type: "networkContainer", position: { x: 920, y: 240 }, style: { width: 800, height: 700 }, data: { containerType: "az", label: "AZ-B (us-east-1b)" }, parentId: "vpc", extent: "parent" },
  { id: "pub-subnet-a", type: "networkContainer", position: { x: 15, y: 20 }, style: { width: 770, height: 220 }, data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-A — 10.0.1.0/24" }, parentId: "az-a", extent: "parent" },
  { id: "priv-subnet-a", type: "networkContainer", position: { x: 15, y: 260 }, style: { width: 770, height: 400 }, data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-A — 10.0.2.0/24" }, parentId: "az-a", extent: "parent" },
  { id: "pub-subnet-b", type: "networkContainer", position: { x: 15, y: 20 }, style: { width: 770, height: 220 }, data: { containerType: "subnet", subnetType: "Public", label: "Public Subnet AZ-B — 10.0.3.0/24" }, parentId: "az-b", extent: "parent" },
  { id: "priv-subnet-b", type: "networkContainer", position: { x: 15, y: 260 }, style: { width: 770, height: 400 }, data: { containerType: "subnet", subnetType: "Private", label: "Private Subnet AZ-B — 10.0.4.0/24" }, parentId: "az-b", extent: "parent" },
  { id: "nat-gw-a", type: "awsService", position: { x: 250, y: 80 }, data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" }, parentId: "pub-subnet-a", extent: "parent" },
  { id: "nat-gw-b", type: "awsService", position: { x: 250, y: 80 }, data: { name: "NAT Gateway", slug: "aws-res-amazon-vpc-nat-gateway", category: "Networking", serviceId: "nat-gateway" }, parentId: "pub-subnet-b", extent: "parent" },
  { id: "asg-a", type: "networkContainer", position: { x: 30, y: 40 }, style: { width: 280, height: 150 }, data: { containerType: "asg", label: "Auto Scaling Group" }, parentId: "priv-subnet-a", extent: "parent" },
  { id: "ec2-a", type: "awsService", position: { x: 100, y: 70 }, data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" }, parentId: "asg-a", extent: "parent" },
  { id: "asg-b", type: "networkContainer", position: { x: 30, y: 40 }, style: { width: 280, height: 150 }, data: { containerType: "asg", label: "Auto Scaling Group" }, parentId: "priv-subnet-b", extent: "parent" },
  { id: "ec2-b", type: "awsService", position: { x: 100, y: 70 }, data: { name: "EC2", slug: "aws-res-amazon-ec2-instance", category: "Compute", serviceId: "ec2" }, parentId: "asg-b", extent: "parent" },
  { id: "rds-primary", type: "awsService", position: { x: 350, y: 200 }, data: { name: "RDS Primary", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" }, parentId: "priv-subnet-a", extent: "parent" },
  { id: "rds-standby", type: "awsService", position: { x: 350, y: 200 }, data: { name: "RDS Standby", slug: "aws-amazon-rds", category: "Database", serviceId: "rds" }, parentId: "priv-subnet-b", extent: "parent" },
  { id: "elasticache-node", type: "awsService", position: { x: 875, y: 450 }, data: { name: "ElastiCache", slug: "aws-amazon-elasticache", category: "Database", serviceId: "elasticache" }, parentId: "vpc", extent: "parent" },
];

const edges = [
  { id: "e-web-r53", source: "web-client", target: "route53-node", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-r53-igw", source: "route53-node", target: "igw-node", animated: true, sourceHandle: "right", targetHandle: "left" },
  { id: "e-igw-alb", source: "igw-node", target: "alb-node", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-alb-ec2a", source: "alb-node", target: "ec2-a", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-alb-ec2b", source: "alb-node", target: "ec2-b", animated: true, sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-ec2a-rds", source: "ec2-a", target: "rds-primary", sourceHandle: "right", targetHandle: "left" },
  { id: "e-ec2b-rds", source: "ec2-b", target: "rds-primary", sourceHandle: "left", targetHandle: "right" },
  { id: "e-rds-replication", source: "rds-primary", target: "rds-standby", label: "Sync replication", style: { strokeDasharray: "6 3", stroke: "#a78bfa" }, sourceHandle: "right", targetHandle: "left" },
  { id: "e-ec2a-cache", source: "ec2-a", target: "elasticache-node", sourceHandle: "right", targetHandle: "left" },
  { id: "e-ec2b-cache", source: "ec2-b", target: "elasticache-node", sourceHandle: "right", targetHandle: "left" },
  { id: "e-ec2a-nat", source: "ec2-a", target: "nat-gw-a", sourceHandle: "top", targetHandle: "bottom" },
  { id: "e-ec2b-nat", source: "ec2-b", target: "nat-gw-b", sourceHandle: "top", targetHandle: "bottom" },
  { id: "e-nata-igw", source: "nat-gw-a", target: "igw-node", sourceHandle: "right", targetHandle: "left" },
  { id: "e-natb-igw", source: "nat-gw-b", target: "igw-node", sourceHandle: "left", targetHandle: "right" },
  { id: "e-ec2a-s3", source: "ec2-a", target: "s3-node", sourceHandle: "bottom", targetHandle: "top" },
  { id: "e-cw-asga", source: "cloudwatch-node", target: "asg-a", sourceHandle: "left", style: { stroke: "#6b7280", strokeDasharray: "4 3" } },
  { id: "e-cw-asgb", source: "cloudwatch-node", target: "asg-b", sourceHandle: "top", style: { stroke: "#6b7280", strokeDasharray: "4 3" } },
];

const viewport = { x: 0, y: 0, zoom: 0.5 };

// ── Firebase Admin setup ──────────────────────────────────────────────────────

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
if (!b64) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON_BASE64");
const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

// ── Get user UID by email ─────────────────────────────────────────────────────

const userRecord = await auth.getUserByEmail(USER_EMAIL);
const uid = userRecord.uid;
console.log(`User: ${userRecord.email} (uid: ${uid})`);

// ── Save to Firestore ─────────────────────────────────────────────────────────

const collectionRef = db.collection("users").doc(uid).collection("architectures");
const docRef = collectionRef.doc();

await docRef.set({
  name: ARCHITECTURE_NAME,
  nodes,
  edges,
  viewport,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

const architectureId = docRef.id;
console.log(`\nArchitecture saved!`);
console.log(`Architecture ID: ${architectureId}`);
console.log(`\nLink: https://cloudish-feb6a.web.app/?p=${architectureId}`);
console.log(`Local: http://localhost:5173/?p=${architectureId}`);

process.exit(0);
