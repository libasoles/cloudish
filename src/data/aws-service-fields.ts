export type FieldType = "text" | "select" | "boolean" | "number";

export interface ServiceField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: string | boolean | number;
  options?: { value: string; label: string }[];
}

export const AWS_SERVICE_FIELDS: Record<string, ServiceField[]> = {
  // ─── Compute ────────────────────────────────────────────────────────────────
  ec2: [
    {
      key: "instanceType",
      label: "Instance Type",
      type: "select",
      defaultValue: "t3.micro",
      options: [
        { value: "t3.micro", label: "t3.micro" },
        { value: "t3.small", label: "t3.small" },
        { value: "t3.medium", label: "t3.medium" },
        { value: "t3.large", label: "t3.large" },
        { value: "m5.large", label: "m5.large" },
        { value: "m5.xlarge", label: "m5.xlarge" },
        { value: "c5.large", label: "c5.large" },
        { value: "c5.xlarge", label: "c5.xlarge" },
        { value: "r5.large", label: "r5.large" },
        { value: "r5.xlarge", label: "r5.xlarge" },
      ],
    },
    {
      key: "amiId",
      label: "AMI ID",
      type: "text",
      placeholder: "ami-0abcdef1234567890",
    },
  ],

  lambda: [
    {
      key: "functionName",
      label: "Function Name",
      type: "text",
      placeholder: "my-function",
    },
    {
      key: "runtime",
      label: "Runtime",
      type: "select",
      defaultValue: "nodejs22.x",
      options: [
        { value: "nodejs22.x", label: "Node.js 22" },
        { value: "nodejs20.x", label: "Node.js 20" },
        { value: "nodejs18.x", label: "Node.js 18" },
        { value: "python3.13", label: "Python 3.13" },
        { value: "python3.12", label: "Python 3.12" },
        { value: "python3.11", label: "Python 3.11" },
        { value: "java21", label: "Java 21" },
        { value: "java17", label: "Java 17" },
        { value: "dotnet8", label: ".NET 8" },
        { value: "ruby3.3", label: "Ruby 3.3" },
      ],
    },
  ],

  ecs: [
    {
      key: "clusterName",
      label: "Cluster Name",
      type: "text",
      placeholder: "my-cluster",
    },
    {
      key: "launchType",
      label: "Launch Type",
      type: "select",
      defaultValue: "FARGATE",
      options: [
        { value: "FARGATE", label: "Fargate" },
        { value: "EC2", label: "EC2" },
        { value: "EXTERNAL", label: "External" },
      ],
    },
  ],

  eks: [
    {
      key: "clusterName",
      label: "Cluster Name",
      type: "text",
      placeholder: "my-eks-cluster",
    },
    {
      key: "kubernetesVersion",
      label: "Kubernetes Version",
      type: "select",
      defaultValue: "1.32",
      options: [
        { value: "1.32", label: "1.32" },
        { value: "1.31", label: "1.31" },
        { value: "1.30", label: "1.30" },
        { value: "1.29", label: "1.29" },
      ],
    },
  ],

  // ─── Storage ─────────────────────────────────────────────────────────────────
  s3: [
    {
      key: "bucketName",
      label: "Bucket Name",
      type: "text",
      placeholder: "my-bucket",
    },
    {
      key: "versioning",
      label: "Versioning",
      type: "boolean",
      defaultValue: false,
    },
  ],

  ebs: [
    {
      key: "volumeType",
      label: "Volume Type",
      type: "select",
      defaultValue: "gp3",
      options: [
        { value: "gp3", label: "gp3 (General Purpose SSD)" },
        { value: "gp2", label: "gp2 (General Purpose SSD)" },
        { value: "io2", label: "io2 (Provisioned IOPS SSD)" },
        { value: "io1", label: "io1 (Provisioned IOPS SSD)" },
        { value: "st1", label: "st1 (Throughput Optimized HDD)" },
        { value: "sc1", label: "sc1 (Cold HDD)" },
      ],
    },
    {
      key: "sizeGiB",
      label: "Size (GiB)",
      type: "number",
      defaultValue: 20,
    },
  ],

  // ─── Database ────────────────────────────────────────────────────────────────
  rds: [
    {
      key: "engine",
      label: "Engine",
      type: "select",
      defaultValue: "mysql",
      options: [
        { value: "mysql", label: "MySQL" },
        { value: "postgres", label: "PostgreSQL" },
        { value: "mariadb", label: "MariaDB" },
        { value: "oracle-ee", label: "Oracle EE" },
        { value: "sqlserver-ex", label: "SQL Server Express" },
        { value: "sqlserver-se", label: "SQL Server SE" },
      ],
    },
    {
      key: "instanceClass",
      label: "Instance Class",
      type: "select",
      defaultValue: "db.t3.micro",
      options: [
        { value: "db.t3.micro", label: "db.t3.micro" },
        { value: "db.t3.small", label: "db.t3.small" },
        { value: "db.t3.medium", label: "db.t3.medium" },
        { value: "db.m5.large", label: "db.m5.large" },
        { value: "db.m5.xlarge", label: "db.m5.xlarge" },
        { value: "db.r5.large", label: "db.r5.large" },
        { value: "db.r5.xlarge", label: "db.r5.xlarge" },
      ],
    },
  ],

  dynamodb: [
    {
      key: "tableName",
      label: "Table Name",
      type: "text",
      placeholder: "my-table",
    },
    {
      key: "billingMode",
      label: "Billing Mode",
      type: "select",
      defaultValue: "PAY_PER_REQUEST",
      options: [
        { value: "PAY_PER_REQUEST", label: "On-Demand" },
        { value: "PROVISIONED", label: "Provisioned" },
      ],
    },
  ],

  aurora: [
    {
      key: "engine",
      label: "Engine",
      type: "select",
      defaultValue: "aurora-mysql",
      options: [
        { value: "aurora-mysql", label: "Aurora MySQL" },
        { value: "aurora-postgresql", label: "Aurora PostgreSQL" },
      ],
    },
    {
      key: "instanceClass",
      label: "Instance Class",
      type: "select",
      defaultValue: "db.r6g.large",
      options: [
        { value: "db.r6g.large", label: "db.r6g.large" },
        { value: "db.r6g.xlarge", label: "db.r6g.xlarge" },
        { value: "db.r6g.2xlarge", label: "db.r6g.2xlarge" },
        { value: "db.serverless", label: "Serverless v2" },
      ],
    },
  ],

  elasticache: [
    {
      key: "engine",
      label: "Engine",
      type: "select",
      defaultValue: "redis",
      options: [
        { value: "redis", label: "Redis" },
        { value: "valkey", label: "Valkey" },
        { value: "memcached", label: "Memcached" },
      ],
    },
    {
      key: "nodeType",
      label: "Node Type",
      type: "select",
      defaultValue: "cache.t3.micro",
      options: [
        { value: "cache.t3.micro", label: "cache.t3.micro" },
        { value: "cache.t3.small", label: "cache.t3.small" },
        { value: "cache.t3.medium", label: "cache.t3.medium" },
        { value: "cache.m6g.large", label: "cache.m6g.large" },
        { value: "cache.r6g.large", label: "cache.r6g.large" },
      ],
    },
  ],

  redshift: [
    {
      key: "clusterIdentifier",
      label: "Cluster Identifier",
      type: "text",
      placeholder: "my-redshift-cluster",
    },
    {
      key: "nodeType",
      label: "Node Type",
      type: "select",
      defaultValue: "ra3.xlplus",
      options: [
        { value: "ra3.xlplus", label: "ra3.xlplus" },
        { value: "ra3.4xlarge", label: "ra3.4xlarge" },
        { value: "ra3.16xlarge", label: "ra3.16xlarge" },
        { value: "dc2.large", label: "dc2.large" },
        { value: "dc2.8xlarge", label: "dc2.8xlarge" },
      ],
    },
  ],

  // ─── Networking ──────────────────────────────────────────────────────────────
  vpc: [
    {
      key: "cidrBlock",
      label: "CIDR Block",
      type: "text",
      placeholder: "10.0.0.0/16",
      defaultValue: "10.0.0.0/16",
    },
    {
      key: "region",
      label: "Region",
      type: "select",
      defaultValue: "us-east-1",
      options: [
        { value: "us-east-1", label: "US East (N. Virginia)" },
        { value: "us-east-2", label: "US East (Ohio)" },
        { value: "us-west-1", label: "US West (N. California)" },
        { value: "us-west-2", label: "US West (Oregon)" },
        { value: "eu-west-1", label: "Europe (Ireland)" },
        { value: "eu-west-2", label: "Europe (London)" },
        { value: "eu-central-1", label: "Europe (Frankfurt)" },
        { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
        { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
        { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
        { value: "sa-east-1", label: "South America (São Paulo)" },
      ],
    },
  ],

  cloudfront: [
    {
      key: "originDomain",
      label: "Origin Domain",
      type: "text",
      placeholder: "my-bucket.s3.amazonaws.com",
    },
    {
      key: "priceClass",
      label: "Price Class",
      type: "select",
      defaultValue: "PriceClass_100",
      options: [
        {
          value: "PriceClass_100",
          label: "Price Class 100 (US, Canada, Europe)",
        },
        { value: "PriceClass_200", label: "Price Class 200 (+ Asia, Africa)" },
        { value: "PriceClass_All", label: "All Edge Locations" },
      ],
    },
  ],

  route53: [
    {
      key: "domainName",
      label: "Domain Name",
      type: "text",
      placeholder: "example.com",
    },
    {
      key: "recordType",
      label: "Record Type",
      type: "select",
      defaultValue: "A",
      options: [
        { value: "A", label: "A" },
        { value: "AAAA", label: "AAAA" },
        { value: "CNAME", label: "CNAME" },
        { value: "MX", label: "MX" },
        { value: "TXT", label: "TXT" },
        { value: "NS", label: "NS" },
        { value: "SOA", label: "SOA" },
        { value: "CAA", label: "CAA" },
      ],
    },
  ],

  "api-gateway": [
    {
      key: "apiName",
      label: "API Name",
      type: "text",
      placeholder: "my-api",
    },
    {
      key: "stage",
      label: "Stage",
      type: "select",
      defaultValue: "prod",
      options: [
        { value: "prod", label: "prod" },
        { value: "staging", label: "staging" },
        { value: "dev", label: "dev" },
        { value: "v1", label: "v1" },
        { value: "v2", label: "v2" },
      ],
    },
  ],

  elb: [
    {
      key: "loadBalancerName",
      label: "Load Balancer Name",
      type: "text",
      placeholder: "my-load-balancer",
    },
    {
      key: "scheme",
      label: "Scheme",
      type: "select",
      defaultValue: "internet-facing",
      options: [
        { value: "internet-facing", label: "Internet-facing" },
        { value: "internal", label: "Internal" },
      ],
    },
  ],

  // ─── Security ────────────────────────────────────────────────────────────────
  iam: [
    {
      key: "roleName",
      label: "Role Name",
      type: "text",
      placeholder: "my-role",
    },
    {
      key: "policyArn",
      label: "Policy ARN",
      type: "text",
      placeholder: "arn:aws:iam::aws:policy/ReadOnlyAccess",
    },
  ],

  cognito: [
    {
      key: "userPoolName",
      label: "User Pool Name",
      type: "text",
      placeholder: "my-user-pool",
    },
    {
      key: "mfaEnabled",
      label: "MFA Enabled",
      type: "boolean",
      defaultValue: false,
    },
  ],

  "secrets-manager": [
    {
      key: "secretName",
      label: "Secret Name",
      type: "text",
      placeholder: "my-secret",
    },
    {
      key: "rotationEnabled",
      label: "Rotation Enabled",
      type: "boolean",
      defaultValue: false,
    },
  ],

  // ─── Management ──────────────────────────────────────────────────────────────
  cloudwatch: [
    {
      key: "logGroupName",
      label: "Log Group Name",
      type: "text",
      placeholder: "/aws/lambda/my-function",
    },
    {
      key: "retentionDays",
      label: "Retention (days)",
      type: "select",
      defaultValue: "30",
      options: [
        { value: "1", label: "1 day" },
        { value: "3", label: "3 days" },
        { value: "7", label: "7 days" },
        { value: "14", label: "14 days" },
        { value: "30", label: "30 days" },
        { value: "60", label: "60 days" },
        { value: "90", label: "90 days" },
        { value: "180", label: "180 days" },
        { value: "365", label: "1 year" },
        { value: "0", label: "Never expire" },
      ],
    },
  ],

  // ─── Messaging ───────────────────────────────────────────────────────────────
  sns: [
    {
      key: "topicName",
      label: "Topic Name",
      type: "text",
      placeholder: "my-topic",
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      defaultValue: "Standard",
      options: [
        { value: "Standard", label: "Standard" },
        { value: "FIFO", label: "FIFO" },
      ],
    },
  ],

  sqs: [
    {
      key: "queueName",
      label: "Queue Name",
      type: "text",
      placeholder: "my-queue",
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      defaultValue: "Standard",
      options: [
        { value: "Standard", label: "Standard" },
        { value: "FIFO", label: "FIFO" },
      ],
    },
  ],
};
