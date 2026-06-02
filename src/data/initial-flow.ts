import { AWS_CATEGORIES } from "@/data/aws-services";
import type { AppEdge, AppNode } from "@/types/flow";

export const initialNodes: AppNode[] = [
  {
    id: "route53",
    type: "awsService",
    zIndex: 10,
    position: { x: 0, y: 100 },
    data: {
      name: "Route 53",
      slug: "aws-amazon-route-53",
      category: AWS_CATEGORIES.NETWORKING,
      serviceId: "route53",
    },
  },
  {
    id: "waf",
    type: "awsService",
    zIndex: 10,
    position: { x: 120, y: -80 },
    data: {
      name: "WAF",
      slug: "aws-aws-waf",
      category: AWS_CATEGORIES.SECURITY,
      serviceId: "waf",
    },
  },
  {
    id: "cloudfront",
    type: "awsService",
    zIndex: 10,
    position: { x: 210, y: 100 },
    data: {
      name: "CloudFront",
      slug: "aws-amazon-cloudfront",
      category: AWS_CATEGORIES.NETWORKING,
      serviceId: "cloudfront",
    },
  },
  {
    id: "acm",
    type: "awsService",
    zIndex: 10,
    position: { x: 120, y: 280 },
    data: {
      name: "ACM",
      slug: "aws-aws-certificate-manager",
      category: AWS_CATEGORIES.SECURITY,
      serviceId: "acm",
    },
  },
  {
    id: "s3",
    type: "awsService",
    zIndex: 10,
    position: { x: 440, y: 100 },
    data: {
      name: "S3",
      slug: "aws-amazon-simple-storage-service",
      category: AWS_CATEGORIES.STORAGE,
      serviceId: "s3",
    },
  },
];

export const initialEdges: AppEdge[] = [
  {
    id: "route53-cloudfront",
    source: "route53",
    target: "cloudfront",
    label: "DNS",
  },
  {
    id: "waf-cloudfront",
    source: "waf",
    target: "cloudfront",
    label: "protects",
  },
  {
    id: "acm-cloudfront",
    source: "acm",
    target: "cloudfront",
    label: "TLS cert",
  },
  { id: "cloudfront-s3", source: "cloudfront", target: "s3", label: "origin" },
];
