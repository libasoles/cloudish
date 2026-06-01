import { AWS_SERVICES, type AwsService } from "@/data/aws-services";

export const TOP_AWS_SERVICE_IDS = [
  "s3",
  "ec2",
  "lambda",
  "fargate",
  "rds",
  "dynamodb",
  "cloudfront",
  "api-gateway",
  "iam",
  "cloudwatch",
  "sqs",
] as const;

export const VPC_SERVICE_ID = "vpc";

export const vpcService = AWS_SERVICES.find(
  (service) => service.id === VPC_SERVICE_ID,
);

export const dragServices = TOP_AWS_SERVICE_IDS.map((serviceId) =>
  AWS_SERVICES.find((service) => service.id === serviceId),
).filter((service): service is AwsService => Boolean(service));
