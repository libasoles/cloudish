export const AWS_CATEGORIES = {
  COMPUTE: 'Compute',
  STORAGE: 'Storage',
  DATABASE: 'Database',
  NETWORKING: 'Networking',
  SECURITY: 'Security',
  ANALYTICS: 'Analytics',
  ML_AI: 'ML/AI',
  DEVELOPER_TOOLS: 'Developer Tools',
  MANAGEMENT: 'Management',
  MESSAGING: 'Messaging',
} as const;

export type AwsCategory = (typeof AWS_CATEGORIES)[keyof typeof AWS_CATEGORIES];

export interface AwsService {
  id: string;
  name: string;
  category: AwsCategory;
  slug: string;
}

const BASE = 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons';

export function getIconUrl(slug: string): string {
  return `${BASE}/${slug}/default.svg`;
}

export const AWS_SERVICES: AwsService[] = [
  // Compute
  { id: 'ec2', name: 'EC2', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-res-amazon-ec2-instance' },
  { id: 'lambda', name: 'Lambda', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-lambda' },
  { id: 'ecs', name: 'ECS', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-elastic-container-service' },
  { id: 'eks', name: 'EKS', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-elastic-kubernetes-service' },
  { id: 'fargate', name: 'Fargate', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-fargate' },
  { id: 'elastic-beanstalk', name: 'Elastic Beanstalk', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-elastic-beanstalk' },
  { id: 'batch', name: 'Batch', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-batch' },
  { id: 'lightsail', name: 'Lightsail', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-lightsail' },
  { id: 'app-runner', name: 'App Runner', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-app-runner' },
  { id: 'outposts', name: 'Outposts', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-outposts' },
  // Storage
  { id: 's3', name: 'S3', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-simple-storage-service' },
  { id: 'ebs', name: 'EBS', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-elastic-block-store' },
  { id: 'efs', name: 'EFS', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-elastic-file-system' },
  { id: 'fsx', name: 'FSx', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-fsx' },
  { id: 'storage-gateway', name: 'Storage Gateway', category: AWS_CATEGORIES.STORAGE, slug: 'aws-aws-storage-gateway' },
  { id: 'backup', name: 'Backup', category: AWS_CATEGORIES.STORAGE, slug: 'aws-aws-backup' },
  { id: 's3-glacier', name: 'S3 Glacier', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-s3-glacier' },
  // Database
  { id: 'rds', name: 'RDS', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-rds' },
  { id: 'dynamodb', name: 'DynamoDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-dynamodb' },
  { id: 'aurora', name: 'Aurora', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-aurora' },
  { id: 'elasticache', name: 'ElastiCache', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-elasticache' },
  { id: 'redshift', name: 'Redshift', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-redshift' },
  { id: 'documentdb', name: 'DocumentDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-documentdb' },
  { id: 'neptune', name: 'Neptune', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-neptune' },
  { id: 'keyspaces', name: 'Keyspaces', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-keyspaces' },
  { id: 'qldb', name: 'QLDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-quantum-ledger-database' },
  { id: 'timestream', name: 'Timestream', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-timestream' },
  // Networking
  { id: 'vpc', name: 'VPC', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-virtual-private-cloud' },
  { id: 'cloudfront', name: 'CloudFront', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-cloudfront' },
  { id: 'route53', name: 'Route 53', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-route-53' },
  { id: 'api-gateway', name: 'API Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-api-gateway' },
  { id: 'direct-connect', name: 'Direct Connect', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-direct-connect' },
  { id: 'transit-gateway', name: 'Transit Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-transit-gateway' },
  { id: 'app-mesh', name: 'App Mesh', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-app-mesh' },
  { id: 'global-accelerator', name: 'Global Accelerator', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-global-accelerator' },
  { id: 'privatelink', name: 'PrivateLink', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-privatelink' },
  { id: 'elb', name: 'ELB', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-elastic-load-balancing' },
  // Security
  { id: 'iam', name: 'IAM', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-identity-and-access-management' },
  { id: 'cognito', name: 'Cognito', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-cognito' },
  { id: 'shield', name: 'Shield', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-shield' },
  { id: 'waf', name: 'WAF', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-waf' },
  { id: 'kms', name: 'KMS', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-key-management-service' },
  { id: 'secrets-manager', name: 'Secrets Manager', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-secrets-manager' },
  { id: 'guardduty', name: 'GuardDuty', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-guardduty' },
  { id: 'security-hub', name: 'Security Hub', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-security-hub' },
  { id: 'inspector', name: 'Inspector', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-inspector' },
  { id: 'macie', name: 'Macie', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-macie' },
  // Analytics
  { id: 'athena', name: 'Athena', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-athena' },
  { id: 'emr', name: 'EMR', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-emr' },
  { id: 'kinesis', name: 'Kinesis', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-kinesis' },
  { id: 'glue', name: 'Glue', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-glue' },
  { id: 'quicksight', name: 'QuickSight', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-quicksight' },
  { id: 'lake-formation', name: 'Lake Formation', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-lake-formation' },
  { id: 'msk', name: 'MSK', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-managed-streaming-for-apache-kafka' },
  { id: 'opensearch', name: 'OpenSearch', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-opensearch-service' },
  { id: 'data-exchange', name: 'Data Exchange', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-data-exchange' },
  { id: 'clean-rooms', name: 'Clean Rooms', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-clean-rooms' },
  // ML/AI
  { id: 'sagemaker', name: 'SageMaker', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-sagemaker' },
  { id: 'rekognition', name: 'Rekognition', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-rekognition' },
  { id: 'polly', name: 'Polly', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-polly' },
  { id: 'transcribe', name: 'Transcribe', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-transcribe' },
  { id: 'translate', name: 'Translate', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-translate' },
  { id: 'lex', name: 'Lex', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-lex' },
  { id: 'comprehend', name: 'Comprehend', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-comprehend' },
  { id: 'bedrock', name: 'Bedrock', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-bedrock' },
  { id: 'kendra', name: 'Kendra', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-kendra' },
  { id: 'forecast', name: 'Forecast', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-forecast' },
  // Developer Tools
  { id: 'codecommit', name: 'CodeCommit', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codecommit' },
  { id: 'codebuild', name: 'CodeBuild', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codebuild' },
  { id: 'codedeploy', name: 'CodeDeploy', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codedeploy' },
  { id: 'codepipeline', name: 'CodePipeline', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codepipeline' },
  { id: 'cloud9', name: 'Cloud9', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-cloud9' },
  { id: 'xray', name: 'X-Ray', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-x-ray' },
  { id: 'cloudshell', name: 'CloudShell', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-cloudshell' },
  // Management
  { id: 'cloudwatch', name: 'CloudWatch', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-amazon-cloudwatch' },
  { id: 'cloudformation', name: 'CloudFormation', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-cloudformation' },
  { id: 'systems-manager', name: 'Systems Manager', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-systems-manager' },
  { id: 'config', name: 'Config', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-config' },
  { id: 'cloudtrail', name: 'CloudTrail', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-cloudtrail' },
  { id: 'organizations', name: 'Organizations', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-organizations' },
  { id: 'control-tower', name: 'Control Tower', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-control-tower' },
  { id: 'service-catalog', name: 'Service Catalog', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-service-catalog' },
  // Messaging
  { id: 'sqs', name: 'SQS', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-queue-service' },
  { id: 'sns', name: 'SNS', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-notification-service' },
  { id: 'eventbridge', name: 'EventBridge', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-eventbridge' },
  { id: 'step-functions', name: 'Step Functions', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-aws-step-functions' },
  { id: 'ses', name: 'SES', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-email-service' },
  { id: 'pinpoint', name: 'Pinpoint', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-pinpoint' },
  { id: 'appsync', name: 'AppSync', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-aws-appsync' },
];
