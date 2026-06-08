import { AWS_SERVICES, type AwsService } from "@/data/aws-services";

export const TOP_AWS_SERVICE_IDS = [
  "ec2",
  "s3",
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

export const draggableAwsServices = TOP_AWS_SERVICE_IDS.map((serviceId) =>
  AWS_SERVICES.find((service) => service.id === serviceId),
).filter((service): service is AwsService => Boolean(service));
