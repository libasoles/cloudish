export type FieldType = "text" | "select" | "boolean" | "number";

export interface ServiceField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: string | boolean | number;
  options?: { value: string; label: string }[];
}

const option = (value: string, label = value) => ({ value, label });

const textField = (
  key: string,
  label: string,
  placeholder?: string,
  defaultValue?: string,
): ServiceField => ({
  key,
  label,
  type: "text",
  placeholder,
  defaultValue,
});

const numberField = (
  key: string,
  label: string,
  defaultValue?: number,
): ServiceField => ({
  key,
  label,
  type: "number",
  defaultValue,
});

const booleanField = (
  key: string,
  label: string,
  defaultValue = false,
): ServiceField => ({
  key,
  label,
  type: "boolean",
  defaultValue,
});

const selectField = (
  key: string,
  label: string,
  options: ServiceField["options"],
  defaultValue?: string,
): ServiceField => ({
  key,
  label,
  type: "select",
  options,
  defaultValue,
});

const AWS_REGION_OPTIONS = [
  option("us-east-1", "US East (N. Virginia)"),
  option("us-east-2", "US East (Ohio)"),
  option("us-west-1", "US West (N. California)"),
  option("us-west-2", "US West (Oregon)"),
  option("eu-west-1", "Europe (Ireland)"),
  option("eu-west-2", "Europe (London)"),
  option("eu-central-1", "Europe (Frankfurt)"),
  option("ap-southeast-1", "Asia Pacific (Singapore)"),
  option("ap-southeast-2", "Asia Pacific (Sydney)"),
  option("ap-northeast-1", "Asia Pacific (Tokyo)"),
  option("sa-east-1", "South America (Sao Paulo)"),
];

const ENVIRONMENT_OPTIONS = [
  option("dev", "Development"),
  option("staging", "Staging"),
  option("prod", "Production"),
];

const COMMON_FIELDS = {
  environment: selectField(
    "environment",
    "Environment",
    ENVIRONMENT_OPTIONS,
    "prod",
  ),
  region: selectField("region", "Region", AWS_REGION_OPTIONS, "us-east-1"),
  tags: textField("tags", "Tags", "owner=platform, app=checkout"),
  encryptionEnabled: booleanField("encryptionEnabled", "Encryption Enabled", true),
  loggingEnabled: booleanField("loggingEnabled", "Logging Enabled", true),
  publicAccess: booleanField("publicAccess", "Public Access", false),
  deletionProtection: booleanField(
    "deletionProtection",
    "Deletion Protection",
    false,
  ),
  backupRetentionDays: numberField(
    "backupRetentionDays",
    "Backup Retention (days)",
    7,
  ),
  autoscalingEnabled: booleanField("autoscalingEnabled", "Autoscaling", true),
  minCapacity: numberField("minCapacity", "Min Capacity", 1),
  maxCapacity: numberField("maxCapacity", "Max Capacity", 3),
};

const CONTAINER_RUNTIME_OPTIONS = [
  option("container-image", "Container image"),
  option("source-build", "Source build"),
];

const PROTOCOL_OPTIONS = [
  option("HTTP"),
  option("HTTPS"),
  option("TCP"),
  option("TLS"),
  option("UDP"),
];

const LAMBDA_RUNTIME_OPTIONS = [
  option("nodejs22.x", "Node.js 22"),
  option("nodejs20.x", "Node.js 20"),
  option("nodejs18.x", "Node.js 18"),
  option("python3.13", "Python 3.13"),
  option("python3.12", "Python 3.12"),
  option("python3.11", "Python 3.11"),
  option("java21", "Java 21"),
  option("java17", "Java 17"),
  option("dotnet8", ".NET 8"),
  option("ruby3.3", "Ruby 3.3"),
  option("provided.al2023", "Custom runtime (AL2023)"),
  option("container-image", "Container image"),
];

const EC2_INSTANCE_OPTIONS = [
  option("t3.micro"),
  option("t3.small"),
  option("t3.medium"),
  option("t4g.micro"),
  option("t4g.small"),
  option("m7i.large"),
  option("m7g.large"),
  option("c7i.large"),
  option("c7g.large"),
  option("r7i.large"),
  option("r7g.large"),
  option("m5.large"),
  option("c5.large"),
  option("r5.large"),
];

const PURCHASE_OPTIONS = [
  option("on-demand", "On-Demand"),
  option("spot", "Spot"),
  option("savings-plan", "Savings Plan"),
  option("reserved", "Reserved"),
];

const CLOUDWATCH_RETENTION_OPTIONS = [
  option("1", "1 day"),
  option("3", "3 days"),
  option("5", "5 days"),
  option("7", "7 days"),
  option("14", "14 days"),
  option("30", "30 days"),
  option("60", "60 days"),
  option("90", "90 days"),
  option("120", "120 days"),
  option("180", "180 days"),
  option("365", "1 year"),
  option("400", "400 days"),
  option("545", "18 months"),
  option("731", "2 years"),
  option("1827", "5 years"),
  option("3653", "10 years"),
  option("0", "Never expire"),
];

export const AWS_SERVICE_FIELDS: Record<string, ServiceField[]> = {
  // ─── Compute ────────────────────────────────────────────────────────────────
  ec2: [
    selectField("instanceType", "Instance Type", EC2_INSTANCE_OPTIONS, "t3.micro"),
    selectField("purchaseOption", "Purchase Option", PURCHASE_OPTIONS, "on-demand"),
    textField("amiId", "AMI ID", "ami-0abcdef1234567890"),
    COMMON_FIELDS.publicAccess,
  ],

  lambda: [
    textField("functionName", "Function Name", "my-function"),
    selectField("runtime", "Runtime", LAMBDA_RUNTIME_OPTIONS, "nodejs22.x"),
    numberField("memoryMiB", "Memory (MiB)", 512),
    numberField("timeoutSeconds", "Timeout (seconds)", 30),
    COMMON_FIELDS.loggingEnabled,
  ],

  ecs: [
    textField("clusterName", "Cluster Name", "my-cluster"),
    selectField("launchType", "Launch Type", [
      option("FARGATE", "Fargate"),
      option("EC2"),
      option("EXTERNAL", "External"),
    ], "FARGATE"),
    numberField("desiredCount", "Desired Count", 2),
    COMMON_FIELDS.autoscalingEnabled,
  ],

  eks: [
    textField("clusterName", "Cluster Name", "my-eks-cluster"),
    selectField("kubernetesVersion", "Kubernetes Version", [
      option("1.34"),
      option("1.33"),
      option("1.32"),
      option("1.31"),
      option("1.30"),
    ], "1.34"),
    selectField("endpointAccess", "Endpoint Access", [
      option("public-and-private", "Public and private"),
      option("private", "Private"),
      option("public", "Public"),
    ], "public-and-private"),
    COMMON_FIELDS.loggingEnabled,
  ],

  fargate: [
    textField("serviceName", "Service Name", "my-service"),
    textField("containerImage", "Container Image", "public.ecr.aws/nginx/nginx:latest"),
    numberField("cpu", "CPU units", 512),
    numberField("memoryMiB", "Memory (MiB)", 1024),
    numberField("desiredCount", "Desired Count", 2),
  ],

  "elastic-beanstalk": [
    textField("applicationName", "Application Name", "my-app"),
    selectField("platform", "Platform", [
      option("nodejs", "Node.js"),
      option("python", "Python"),
      option("java", "Java"),
      option("dotnet", ".NET"),
      option("docker", "Docker"),
    ], "nodejs"),
    selectField("environmentType", "Environment Type", [
      option("load-balanced", "Load balanced"),
      option("single-instance", "Single instance"),
    ], "load-balanced"),
  ],

  batch: [
    textField("computeEnvironmentName", "Compute Environment Name", "my-compute-env"),
    selectField("computeType", "Compute Type", [
      option("FARGATE", "Fargate"),
      option("EC2"),
      option("SPOT", "Spot"),
    ], "FARGATE"),
    numberField("maxVcpus", "Max vCPUs", 16),
  ],

  lightsail: [
    textField("instanceName", "Instance Name", "my-instance"),
    selectField("bundleId", "Bundle", [
      option("nano_3_0", "Nano"),
      option("micro_3_0", "Micro"),
      option("small_3_0", "Small"),
      option("medium_3_0", "Medium"),
    ], "micro_3_0"),
    COMMON_FIELDS.publicAccess,
  ],

  "app-runner": [
    textField("serviceName", "Service Name", "my-app-runner-service"),
    selectField("sourceType", "Source Type", CONTAINER_RUNTIME_OPTIONS, "container-image"),
    textField("containerImage", "Container Image", "public.ecr.aws/nginx/nginx:latest"),
    COMMON_FIELDS.autoscalingEnabled,
  ],

  outposts: [
    textField("outpostName", "Outpost Name", "my-outpost"),
    selectField("deploymentModel", "Deployment Model", [
      option("rack", "Rack"),
      option("server", "Server"),
    ], "rack"),
    COMMON_FIELDS.region,
  ],

  // ─── Storage ────────────────────────────────────────────────────────────────
  s3: [
    textField("bucketName", "Bucket Name", "my-bucket"),
    selectField("storageClass", "Storage Class", [
      option("STANDARD", "Standard"),
      option("INTELLIGENT_TIERING", "Intelligent-Tiering"),
      option("STANDARD_IA", "Standard-IA"),
      option("ONEZONE_IA", "One Zone-IA"),
      option("GLACIER_IR", "Glacier Instant Retrieval"),
      option("DEEP_ARCHIVE", "Deep Archive"),
    ], "STANDARD"),
    booleanField("versioning", "Versioning"),
    COMMON_FIELDS.encryptionEnabled,
    COMMON_FIELDS.publicAccess,
  ],

  ebs: [
    selectField("volumeType", "Volume Type", [
      option("gp3", "gp3 (General Purpose SSD)"),
      option("gp2", "gp2 (General Purpose SSD)"),
      option("io2", "io2 (Provisioned IOPS SSD)"),
      option("io1", "io1 (Provisioned IOPS SSD)"),
      option("st1", "st1 (Throughput Optimized HDD)"),
      option("sc1", "sc1 (Cold HDD)"),
    ], "gp3"),
    numberField("sizeGiB", "Size (GiB)", 20),
    numberField("iops", "IOPS", 3000),
    numberField("throughputMbps", "Throughput (MB/s)", 125),
    COMMON_FIELDS.encryptionEnabled,
  ],

  efs: [
    textField("fileSystemName", "File System Name", "my-efs"),
    selectField("performanceMode", "Performance Mode", [
      option("generalPurpose", "General Purpose"),
      option("maxIO", "Max I/O"),
    ], "generalPurpose"),
    selectField("throughputMode", "Throughput Mode", [
      option("elastic", "Elastic"),
      option("bursting", "Bursting"),
      option("provisioned", "Provisioned"),
    ], "elastic"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  fsx: [
    textField("fileSystemName", "File System Name", "my-fsx"),
    selectField("fileSystemType", "File System Type", [
      option("WINDOWS", "Windows File Server"),
      option("LUSTRE", "Lustre"),
      option("ONTAP", "NetApp ONTAP"),
      option("OPENZFS", "OpenZFS"),
    ], "WINDOWS"),
    numberField("storageCapacityGiB", "Storage Capacity (GiB)", 1024),
    COMMON_FIELDS.backupRetentionDays,
  ],

  "storage-gateway": [
    textField("gatewayName", "Gateway Name", "my-gateway"),
    selectField("gatewayType", "Gateway Type", [
      option("S3_FILE", "Amazon S3 File Gateway"),
      option("FSX_SMB", "Amazon FSx File Gateway"),
      option("VOLUME", "Volume Gateway"),
      option("TAPE", "Tape Gateway"),
    ], "S3_FILE"),
    COMMON_FIELDS.loggingEnabled,
  ],

  backup: [
    textField("backupPlanName", "Backup Plan Name", "daily-backup"),
    numberField("backupRetentionDays", "Backup Retention (days)", 35),
    booleanField("crossRegionCopy", "Cross-Region Copy"),
  ],

  "s3-glacier": [
    textField("vaultName", "Vault Name", "archive-vault"),
    selectField("retrievalTier", "Retrieval Tier", [
      option("expedited", "Expedited"),
      option("standard", "Standard"),
      option("bulk", "Bulk"),
    ], "standard"),
    textField("lifecyclePolicy", "Lifecycle Policy", "Transition after 90 days"),
  ],

  // ─── Database ───────────────────────────────────────────────────────────────
  rds: [
    selectField("engine", "Engine", [
      option("mysql", "MySQL"),
      option("postgres", "PostgreSQL"),
      option("mariadb", "MariaDB"),
      option("oracle-ee", "Oracle EE"),
      option("sqlserver-ex", "SQL Server Express"),
      option("sqlserver-se", "SQL Server SE"),
    ], "mysql"),
    selectField("instanceClass", "Instance Class", [
      option("db.t4g.micro"),
      option("db.t4g.small"),
      option("db.t4g.medium"),
      option("db.m7g.large"),
      option("db.m7i.large"),
      option("db.r7g.large"),
      option("db.r7i.large"),
    ], "db.t4g.micro"),
    booleanField("multiAz", "Multi-AZ"),
    COMMON_FIELDS.backupRetentionDays,
    COMMON_FIELDS.deletionProtection,
  ],

  dynamodb: [
    textField("tableName", "Table Name", "my-table"),
    selectField("billingMode", "Billing Mode", [
      option("PAY_PER_REQUEST", "On-Demand"),
      option("PROVISIONED", "Provisioned"),
    ], "PAY_PER_REQUEST"),
    booleanField("pointInTimeRecovery", "Point-in-Time Recovery"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  aurora: [
    selectField("engine", "Engine", [
      option("aurora-mysql", "Aurora MySQL"),
      option("aurora-postgresql", "Aurora PostgreSQL"),
    ], "aurora-mysql"),
    selectField("capacityMode", "Capacity Mode", [
      option("provisioned", "Provisioned"),
      option("serverless-v2", "Serverless v2"),
    ], "serverless-v2"),
    selectField("instanceClass", "Instance Class", [
      option("db.serverless", "Serverless v2"),
      option("db.r7g.large"),
      option("db.r7g.xlarge"),
      option("db.r6g.large"),
      option("db.r6g.xlarge"),
    ], "db.serverless"),
    COMMON_FIELDS.backupRetentionDays,
  ],

  elasticache: [
    selectField("engine", "Engine", [
      option("valkey", "Valkey"),
      option("redis", "Redis OSS"),
      option("memcached", "Memcached"),
    ], "valkey"),
    selectField("nodeType", "Node Type", [
      option("cache.t4g.micro"),
      option("cache.t4g.small"),
      option("cache.t4g.medium"),
      option("cache.m7g.large"),
      option("cache.r7g.large"),
    ], "cache.t4g.micro"),
    numberField("nodeCount", "Node Count", 2),
  ],

  redshift: [
    textField("clusterIdentifier", "Cluster Identifier", "my-redshift-cluster"),
    selectField("nodeType", "Node Type", [
      option("ra3.xlplus"),
      option("ra3.4xlarge"),
      option("ra3.16xlarge"),
      option("serverless", "Serverless"),
    ], "ra3.xlplus"),
    numberField("nodeCount", "Node Count", 2),
    COMMON_FIELDS.encryptionEnabled,
  ],

  documentdb: [
    textField("clusterIdentifier", "Cluster Identifier", "my-docdb-cluster"),
    selectField("instanceClass", "Instance Class", [
      option("db.t4g.medium"),
      option("db.r6g.large"),
      option("db.r6g.xlarge"),
      option("db.r7g.large"),
    ], "db.t4g.medium"),
    numberField("instanceCount", "Instance Count", 2),
    COMMON_FIELDS.backupRetentionDays,
  ],

  neptune: [
    textField("clusterIdentifier", "Cluster Identifier", "my-neptune-cluster"),
    selectField("engine", "Engine", [
      option("neptune", "Neptune Database"),
      option("neptune-analytics", "Neptune Analytics"),
    ], "neptune"),
    selectField("instanceClass", "Instance Class", [
      option("db.r6g.large"),
      option("db.r6g.xlarge"),
      option("db.r7g.large"),
    ], "db.r6g.large"),
  ],

  keyspaces: [
    textField("keyspaceName", "Keyspace Name", "my_keyspace"),
    textField("tableName", "Table Name", "my_table"),
    selectField("capacityMode", "Capacity Mode", [
      option("on-demand", "On-Demand"),
      option("provisioned", "Provisioned"),
    ], "on-demand"),
  ],

  qldb: [
    textField("ledgerName", "Ledger Name", "my-ledger"),
    COMMON_FIELDS.deletionProtection,
  ],

  timestream: [
    textField("databaseName", "Database Name", "metrics"),
    textField("tableName", "Table Name", "events"),
    numberField("memoryStoreRetentionHours", "Memory Store Retention (hours)", 24),
    numberField("magneticStoreRetentionDays", "Magnetic Store Retention (days)", 365),
  ],

  // ─── Networking ─────────────────────────────────────────────────────────────
  vpc: [
    textField("cidrBlock", "CIDR Block", "10.0.0.0/16", "10.0.0.0/16"),
    COMMON_FIELDS.region,
  ],

  cloudfront: [
    textField("originDomain", "Origin Domain", "my-bucket.s3.amazonaws.com"),
    selectField("priceClass", "Price Class", [
      option("PriceClass_100", "Price Class 100 (US, Canada, Europe)"),
      option("PriceClass_200", "Price Class 200 (+ Asia, Africa)"),
      option("PriceClass_All", "All Edge Locations"),
    ], "PriceClass_100"),
    selectField("viewerProtocolPolicy", "Viewer Protocol Policy", [
      option("redirect-to-https", "Redirect HTTP to HTTPS"),
      option("https-only", "HTTPS only"),
      option("allow-all", "Allow HTTP and HTTPS"),
    ], "redirect-to-https"),
  ],

  route53: [
    textField("domainName", "Domain Name", "example.com"),
    selectField("recordType", "Record Type", [
      option("A"),
      option("AAAA"),
      option("CNAME"),
      option("MX"),
      option("TXT"),
      option("NS"),
      option("SOA"),
      option("CAA"),
    ], "A"),
    selectField("routingPolicy", "Routing Policy", [
      option("simple", "Simple"),
      option("weighted", "Weighted"),
      option("latency", "Latency"),
      option("failover", "Failover"),
      option("geolocation", "Geolocation"),
    ], "simple"),
  ],

  "api-gateway": [
    textField("apiName", "API Name", "my-api"),
    selectField("apiType", "API Type", [
      option("HTTP"),
      option("REST"),
      option("WebSocket"),
    ], "HTTP"),
    selectField("endpointType", "Endpoint Type", [
      option("regional", "Regional"),
      option("edge-optimized", "Edge-optimized"),
      option("private", "Private"),
    ], "regional"),
    textField("stage", "Stage", "prod", "prod"),
  ],

  "direct-connect": [
    textField("connectionName", "Connection Name", "my-dx"),
    selectField("connectionSpeed", "Connection Speed", [
      option("1Gbps"),
      option("10Gbps"),
      option("100Gbps"),
    ], "10Gbps"),
    selectField("virtualInterfaceType", "Virtual Interface Type", [
      option("private", "Private"),
      option("public", "Public"),
      option("transit", "Transit"),
    ], "private"),
  ],

  "transit-gateway": [
    textField("gatewayName", "Gateway Name", "my-tgw"),
    booleanField("autoAcceptAttachments", "Auto-Accept Attachments"),
    booleanField("defaultRouteTableAssociation", "Default Route Table Association", true),
  ],

  "customer-gateway": [
    textField("customerGatewayName", "Customer Gateway Name", "my-customer-gateway"),
    textField("ipAddress", "IP Address", "203.0.113.10"),
    numberField("bgpAsn", "BGP ASN", 65000),
  ],

  "app-mesh": [
    textField("meshName", "Mesh Name", "my-mesh"),
    selectField("protocol", "Protocol", [
      option("http", "HTTP"),
      option("http2", "HTTP/2"),
      option("grpc", "gRPC"),
      option("tcp", "TCP"),
    ], "http"),
  ],

  "global-accelerator": [
    textField("acceleratorName", "Accelerator Name", "my-accelerator"),
    selectField("acceleratorType", "Accelerator Type", [
      option("standard", "Standard"),
      option("custom-routing", "Custom routing"),
    ], "standard"),
    COMMON_FIELDS.loggingEnabled,
  ],

  privatelink: [
    textField("endpointServiceName", "Endpoint Service Name", "com.amazonaws.vpce.us-east-1.vpce-svc-123"),
    selectField("endpointType", "Endpoint Type", [
      option("interface", "Interface endpoint"),
      option("gateway", "Gateway endpoint"),
      option("gateway-load-balancer", "Gateway Load Balancer endpoint"),
    ], "interface"),
  ],

  elb: [
    textField("loadBalancerName", "Load Balancer Name", "my-load-balancer"),
    selectField("loadBalancerType", "Load Balancer Type", [
      option("application", "Application Load Balancer"),
      option("network", "Network Load Balancer"),
      option("gateway", "Gateway Load Balancer"),
      option("classic", "Classic Load Balancer"),
    ], "application"),
    selectField("scheme", "Scheme", [
      option("internet-facing", "Internet-facing"),
      option("internal", "Internal"),
    ], "internet-facing"),
    selectField("listenerProtocol", "Listener Protocol", PROTOCOL_OPTIONS, "HTTPS"),
  ],

  // ─── Security ───────────────────────────────────────────────────────────────
  iam: [
    textField("roleName", "Role Name", "my-role"),
    textField("policyArn", "Policy ARN", "arn:aws:iam::aws:policy/ReadOnlyAccess"),
  ],

  cognito: [
    textField("userPoolName", "User Pool Name", "my-user-pool"),
    booleanField("mfaEnabled", "MFA Enabled"),
    booleanField("hostedUiEnabled", "Hosted UI Enabled"),
  ],

  acm: [
    textField("domainName", "Domain Name", "example.com"),
    selectField("validationMethod", "Validation Method", [
      option("DNS"),
      option("EMAIL", "Email"),
    ], "DNS"),
    selectField("certificateType", "Certificate Type", [
      option("public", "Public"),
      option("private", "Private"),
      option("imported", "Imported"),
    ], "public"),
  ],

  shield: [
    selectField("protectionLevel", "Protection Level", [
      option("standard", "Standard"),
      option("advanced", "Advanced"),
    ], "standard"),
    COMMON_FIELDS.loggingEnabled,
  ],

  waf: [
    textField("webAclName", "Web ACL Name", "my-web-acl"),
    selectField("scope", "Scope", [
      option("REGIONAL", "Regional"),
      option("CLOUDFRONT", "CloudFront"),
    ], "REGIONAL"),
    selectField("defaultAction", "Default Action", [
      option("allow", "Allow"),
      option("block", "Block"),
    ], "allow"),
  ],

  kms: [
    textField("keyAlias", "Key Alias", "alias/my-key"),
    selectField("keySpec", "Key Spec", [
      option("SYMMETRIC_DEFAULT", "Symmetric"),
      option("RSA_2048"),
      option("RSA_3072"),
      option("RSA_4096"),
      option("ECC_NIST_P256"),
    ], "SYMMETRIC_DEFAULT"),
    selectField("keyUsage", "Key Usage", [
      option("ENCRYPT_DECRYPT", "Encrypt/decrypt"),
      option("SIGN_VERIFY", "Sign/verify"),
    ], "ENCRYPT_DECRYPT"),
    booleanField("rotationEnabled", "Rotation Enabled", true),
  ],

  "secrets-manager": [
    textField("secretName", "Secret Name", "my-secret"),
    booleanField("rotationEnabled", "Rotation Enabled"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  guardduty: [
    booleanField("enabled", "Enabled", true),
    booleanField("s3ProtectionEnabled", "S3 Protection Enabled", true),
    booleanField("eksProtectionEnabled", "EKS Protection Enabled", true),
  ],

  "security-hub": [
    booleanField("enabled", "Enabled", true),
    booleanField("standardsEnabled", "Security Standards Enabled", true),
    booleanField("findingExportEnabled", "Finding Export Enabled"),
  ],

  inspector: [
    selectField("scanType", "Scan Type", [
      option("ec2", "EC2"),
      option("ecr", "ECR"),
      option("lambda", "Lambda"),
      option("all", "All supported resources"),
    ], "all"),
    booleanField("continuousScanning", "Continuous Scanning", true),
  ],

  macie: [
    booleanField("enabled", "Enabled", true),
    selectField("sensitiveDataDiscovery", "Sensitive Data Discovery", [
      option("automated", "Automated"),
      option("scheduled", "Scheduled"),
      option("disabled", "Disabled"),
    ], "automated"),
  ],

  // ─── Analytics ──────────────────────────────────────────────────────────────
  athena: [
    textField("workgroupName", "Workgroup Name", "primary"),
    selectField("queryEngine", "Query Engine", [
      option("athena-sql", "Athena SQL"),
      option("apache-spark", "Apache Spark"),
    ], "athena-sql"),
    textField("outputLocation", "Output Location", "s3://query-results/"),
  ],

  emr: [
    textField("clusterName", "Cluster Name", "my-emr-cluster"),
    selectField("framework", "Framework", [
      option("spark", "Spark"),
      option("hive", "Hive"),
      option("presto", "Presto"),
      option("hbase", "HBase"),
    ], "spark"),
    selectField("releaseLabel", "Release Label", [
      option("emr-7.x", "EMR 7.x"),
      option("emr-6.x", "EMR 6.x"),
    ], "emr-7.x"),
  ],

  kinesis: [
    textField("streamName", "Stream Name", "my-stream"),
    selectField("streamMode", "Stream Mode", [
      option("ON_DEMAND", "On-Demand"),
      option("PROVISIONED", "Provisioned"),
    ], "ON_DEMAND"),
    numberField("shardCount", "Shard Count", 1),
  ],

  glue: [
    textField("jobName", "Job Name", "my-glue-job"),
    selectField("jobType", "Job Type", [
      option("spark", "Spark"),
      option("ray", "Ray"),
      option("python-shell", "Python shell"),
      option("streaming", "Streaming"),
    ], "spark"),
    textField("dataCatalogName", "Data Catalog Name", "AwsDataCatalog"),
  ],

  quicksight: [
    textField("dashboardName", "Dashboard Name", "executive-dashboard"),
    selectField("edition", "Edition", [
      option("standard", "Standard"),
      option("enterprise", "Enterprise"),
    ], "enterprise"),
  ],

  "lake-formation": [
    textField("dataLakeName", "Data Lake Name", "analytics-lake"),
    booleanField("governedTablesEnabled", "Governed Tables Enabled"),
    booleanField("crossAccountSharing", "Cross-Account Sharing"),
  ],

  msk: [
    textField("clusterName", "Cluster Name", "my-msk-cluster"),
    selectField("brokerInstanceType", "Broker Instance Type", [
      option("kafka.t3.small"),
      option("kafka.m7g.large"),
      option("kafka.m7g.xlarge"),
      option("kafka.m5.large"),
    ], "kafka.m7g.large"),
    numberField("brokerCount", "Broker Count", 3),
  ],

  opensearch: [
    textField("domainName", "Domain Name", "search-domain"),
    selectField("engineVersion", "Engine Version", [
      option("OpenSearch_2.x", "OpenSearch 2.x"),
      option("OpenSearch_1.x", "OpenSearch 1.x"),
      option("Elasticsearch_7.10", "Elasticsearch 7.10"),
    ], "OpenSearch_2.x"),
    selectField("instanceType", "Instance Type", [
      option("t3.small.search"),
      option("m7g.large.search"),
      option("r7g.large.search"),
    ], "m7g.large.search"),
  ],

  "data-exchange": [
    textField("dataSetName", "Data Set Name", "market-data"),
    selectField("assetType", "Asset Type", [
      option("s3-snapshot", "S3 snapshot"),
      option("api", "API"),
      option("redshift", "Redshift"),
    ], "s3-snapshot"),
  ],

  "clean-rooms": [
    textField("collaborationName", "Collaboration Name", "partner-analysis"),
    selectField("analysisRuleType", "Analysis Rule Type", [
      option("aggregation", "Aggregation"),
      option("list", "List"),
      option("custom", "Custom"),
    ], "aggregation"),
  ],

  // ─── ML/AI ─────────────────────────────────────────────────────────────────
  sagemaker: [
    textField("domainName", "Domain Name", "ml-domain"),
    selectField("workloadType", "Workload Type", [
      option("training", "Training"),
      option("inference", "Inference"),
      option("notebook", "Notebook"),
      option("pipeline", "Pipeline"),
    ], "inference"),
    textField("instanceType", "Instance Type", "ml.m5.large"),
  ],

  rekognition: [
    selectField("feature", "Feature", [
      option("labels", "Labels"),
      option("faces", "Faces"),
      option("text", "Text"),
      option("moderation", "Moderation"),
      option("custom-labels", "Custom Labels"),
    ], "labels"),
  ],

  polly: [
    selectField("voiceId", "Voice", [
      option("Joanna"),
      option("Matthew"),
      option("Lupe"),
      option("Lucia"),
    ], "Joanna"),
    selectField("outputFormat", "Output Format", [
      option("mp3", "MP3"),
      option("ogg_vorbis", "Ogg Vorbis"),
      option("pcm", "PCM"),
    ], "mp3"),
  ],

  transcribe: [
    textField("jobName", "Job Name", "transcription-job"),
    selectField("languageCode", "Language Code", [
      option("en-US", "English (US)"),
      option("es-US", "Spanish (US)"),
      option("es-ES", "Spanish (Spain)"),
      option("pt-BR", "Portuguese (Brazil)"),
    ], "en-US"),
  ],

  translate: [
    selectField("sourceLanguageCode", "Source Language", [
      option("auto", "Auto"),
      option("en", "English"),
      option("es", "Spanish"),
      option("pt", "Portuguese"),
    ], "auto"),
    selectField("targetLanguageCode", "Target Language", [
      option("en", "English"),
      option("es", "Spanish"),
      option("pt", "Portuguese"),
    ], "es"),
  ],

  lex: [
    textField("botName", "Bot Name", "support-bot"),
    selectField("languageCode", "Language Code", [
      option("en_US", "English (US)"),
      option("es_US", "Spanish (US)"),
      option("es_419", "Spanish (Latin America)"),
    ], "en_US"),
  ],

  comprehend: [
    selectField("feature", "Feature", [
      option("entities", "Entities"),
      option("sentiment", "Sentiment"),
      option("key-phrases", "Key phrases"),
      option("language", "Language"),
    ], "entities"),
  ],

  bedrock: [
    selectField("modelProvider", "Model Provider", [
      option("anthropic", "Anthropic"),
      option("amazon", "Amazon"),
      option("cohere", "Cohere"),
      option("meta", "Meta"),
      option("mistral", "Mistral AI"),
    ], "anthropic"),
    textField("modelId", "Model ID", "anthropic.claude-3-5-sonnet"),
    COMMON_FIELDS.loggingEnabled,
  ],

  kendra: [
    textField("indexName", "Index Name", "enterprise-search"),
    selectField("edition", "Edition", [
      option("DEVELOPER_EDITION", "Developer"),
      option("ENTERPRISE_EDITION", "Enterprise"),
    ], "ENTERPRISE_EDITION"),
  ],

  forecast: [
    textField("datasetGroupName", "Dataset Group Name", "demand-forecast"),
    selectField("forecastFrequency", "Forecast Frequency", [
      option("H", "Hourly"),
      option("D", "Daily"),
      option("W", "Weekly"),
      option("M", "Monthly"),
    ], "D"),
  ],

  // ─── Developer Tools ────────────────────────────────────────────────────────
  codecommit: [
    textField("repositoryName", "Repository Name", "my-repo"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  codebuild: [
    textField("projectName", "Project Name", "my-build"),
    selectField("buildImage", "Build Image", [
      option("aws/codebuild/standard:7.0"),
      option("aws/codebuild/amazonlinux-x86_64-standard:5.0"),
      option("custom", "Custom image"),
    ], "aws/codebuild/standard:7.0"),
    selectField("computeType", "Compute Type", [
      option("BUILD_GENERAL1_SMALL", "Small"),
      option("BUILD_GENERAL1_MEDIUM", "Medium"),
      option("BUILD_GENERAL1_LARGE", "Large"),
    ], "BUILD_GENERAL1_SMALL"),
  ],

  codedeploy: [
    textField("applicationName", "Application Name", "my-app"),
    selectField("deploymentType", "Deployment Type", [
      option("in-place", "In-place"),
      option("blue-green", "Blue/green"),
    ], "blue-green"),
    selectField("computePlatform", "Compute Platform", [
      option("Server", "EC2/on-premises"),
      option("Lambda"),
      option("ECS"),
    ], "ECS"),
  ],

  codepipeline: [
    textField("pipelineName", "Pipeline Name", "delivery-pipeline"),
    selectField("pipelineType", "Pipeline Type", [
      option("V2"),
      option("V1"),
    ], "V2"),
    COMMON_FIELDS.loggingEnabled,
  ],

  cloud9: [
    textField("environmentName", "Environment Name", "dev-env"),
    selectField("instanceType", "Instance Type", EC2_INSTANCE_OPTIONS, "t3.micro"),
  ],

  xray: [
    textField("groupName", "Group Name", "service-map"),
    numberField("traceSamplingRate", "Trace Sampling Rate (%)", 10),
  ],

  cloudshell: [
    COMMON_FIELDS.region,
    selectField("shellType", "Shell Type", [
      option("bash", "Bash"),
      option("zsh", "Zsh"),
      option("powershell", "PowerShell"),
    ], "bash"),
  ],

  // ─── Management ─────────────────────────────────────────────────────────────
  cloudwatch: [
    textField("logGroupName", "Log Group Name", "/aws/lambda/my-function"),
    selectField("retentionDays", "Retention (days)", CLOUDWATCH_RETENTION_OPTIONS, "30"),
  ],

  cloudformation: [
    textField("stackName", "Stack Name", "network-stack"),
    selectField("templateFormat", "Template Format", [
      option("yaml", "YAML"),
      option("json", "JSON"),
    ], "yaml"),
    COMMON_FIELDS.deletionProtection,
  ],

  "systems-manager": [
    selectField("documentType", "Document Type", [
      option("Command"),
      option("Automation"),
      option("Session"),
      option("Policy"),
    ], "Automation"),
    COMMON_FIELDS.loggingEnabled,
  ],

  config: [
    booleanField("recordingEnabled", "Recording Enabled", true),
    selectField("ruleType", "Rule Type", [
      option("managed", "Managed rule"),
      option("custom", "Custom rule"),
      option("conformance-pack", "Conformance pack"),
    ], "managed"),
  ],

  cloudtrail: [
    textField("trailName", "Trail Name", "organization-trail"),
    selectField("trailType", "Trail Type", [
      option("single-region", "Single-region"),
      option("multi-region", "Multi-region"),
      option("organization", "Organization"),
    ], "multi-region"),
    COMMON_FIELDS.loggingEnabled,
  ],

  organizations: [
    textField("organizationalUnitName", "Organizational Unit Name", "production"),
    booleanField("serviceControlPoliciesEnabled", "Service Control Policies Enabled", true),
  ],

  "control-tower": [
    textField("landingZoneName", "Landing Zone Name", "aws-landing-zone"),
    booleanField("guardrailsEnabled", "Guardrails Enabled", true),
  ],

  "service-catalog": [
    textField("portfolioName", "Portfolio Name", "approved-products"),
    textField("productName", "Product Name", "standard-vpc"),
  ],

  // ─── Messaging ──────────────────────────────────────────────────────────────
  sns: [
    textField("topicName", "Topic Name", "my-topic"),
    selectField("type", "Type", [
      option("standard", "Standard"),
      option("fifo", "FIFO"),
    ], "standard"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  sqs: [
    textField("queueName", "Queue Name", "my-queue"),
    selectField("type", "Type", [
      option("standard", "Standard"),
      option("fifo", "FIFO"),
    ], "standard"),
    booleanField("deadLetterQueueEnabled", "Dead-Letter Queue Enabled"),
    COMMON_FIELDS.encryptionEnabled,
  ],

  eventbridge: [
    textField("eventBusName", "Event Bus Name", "default"),
    selectField("eventSource", "Event Source", [
      option("aws-service", "AWS service"),
      option("custom", "Custom application"),
      option("partner", "Partner/SaaS"),
    ], "aws-service"),
    booleanField("archiveEnabled", "Archive Enabled"),
  ],

  "step-functions": [
    textField("stateMachineName", "State Machine Name", "workflow"),
    selectField("workflowType", "Workflow Type", [
      option("STANDARD", "Standard"),
      option("EXPRESS", "Express"),
    ], "STANDARD"),
    COMMON_FIELDS.loggingEnabled,
  ],

  ses: [
    textField("identityName", "Identity Name", "example.com"),
    selectField("emailIdentityType", "Email Identity Type", [
      option("domain", "Domain"),
      option("email-address", "Email address"),
    ], "domain"),
    booleanField("dkimEnabled", "DKIM Enabled", true),
  ],

  pinpoint: [
    textField("applicationName", "Application Name", "customer-engagement"),
    selectField("channelType", "Channel Type", [
      option("email", "Email"),
      option("sms", "SMS"),
      option("push", "Push"),
      option("voice", "Voice"),
    ], "email"),
  ],

  appsync: [
    textField("apiName", "API Name", "graphql-api"),
    selectField("authType", "Auth Type", [
      option("API_KEY", "API key"),
      option("AWS_IAM", "AWS IAM"),
      option("AMAZON_COGNITO_USER_POOLS", "Cognito user pools"),
      option("OPENID_CONNECT", "OpenID Connect"),
      option("AWS_LAMBDA", "Lambda authorizer"),
    ], "AMAZON_COGNITO_USER_POOLS"),
    COMMON_FIELDS.loggingEnabled,
  ],
};

// ─── Non-AWS node fields ──────────────────────────────────────────────────────
const EXTRA_NODE_FIELDS: Record<string, ServiceField[]> = {
  user: [
    textField("label", "Name", "User", "User"),
  ],
  region: [
    COMMON_FIELDS.region,
    numberField("numberOfAZs", "Availability Zones", 1),
  ],
};

export function getNodeFields(nodeTypeOrServiceId: string): ServiceField[] {
  return (
    AWS_SERVICE_FIELDS[nodeTypeOrServiceId] ??
    EXTRA_NODE_FIELDS[nodeTypeOrServiceId] ??
    []
  );
}
