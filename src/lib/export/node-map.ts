type Fields = Record<string, string | boolean | number | undefined>;

export type ServiceResourceMap = {
  terraform?: string | ((f: Fields) => string);
  cloudformation?: string;
  tfProps?: (f: Fields) => Record<string, unknown>;
  cfProps?: (f: Fields) => Record<string, unknown>;
  /** If set, the generator injects this TF attribute with the ancestor ref instead of the default subnet_id/vpc_id logic */
  tfLocation?: "subnet_id" | "vpc_id" | "availability_zone" | "none";
  /** Same for CloudFormation */
  cfLocation?: "SubnetId" | "VpcId" | "AvailabilityZone" | "none";
};

const str = (v: unknown, fallback = "") => (v != null ? String(v) : fallback);
const num = (v: unknown, fallback = 0) => (v != null ? Number(v) : fallback);
const bool = (v: unknown) => Boolean(v);

// ─── Compute ─────────────────────────────────────────────────────────────────

const COMPUTE: Record<string, ServiceResourceMap> = {
  ec2: {
    terraform: "aws_instance",
    cloudformation: "AWS::EC2::Instance",
    tfProps: (f) => ({
      ami: str(f.amiId, "ami-REPLACE_ME"),
      instance_type: str(f.instanceType, "t3.micro"),
      associate_public_ip_address: bool(f.publicAccess),
    }),
    cfProps: (f) => ({
      ImageId: str(f.amiId, "ami-REPLACE_ME"),
      InstanceType: str(f.instanceType, "t3.micro"),
    }),
    tfLocation: "subnet_id",
    cfLocation: "SubnetId",
  },

  lambda: {
    terraform: "aws_lambda_function",
    cloudformation: "AWS::Lambda::Function",
    tfProps: (f) => ({
      function_name: str(f.functionName, "my-function"),
      runtime: str(f.runtime, "nodejs22.x"),
      handler: "index.handler",
      role: "arn:aws:iam::REPLACE_ME:role/lambda-execution-role",
      memory_size: num(f.memoryMiB, 512),
      timeout: num(f.timeoutSeconds, 30),
    }),
    cfProps: (f) => ({
      FunctionName: str(f.functionName, "my-function"),
      Runtime: str(f.runtime, "nodejs22.x"),
      Handler: "index.handler",
      Role: "arn:aws:iam::REPLACE_ME:role/lambda-execution-role",
      MemorySize: num(f.memoryMiB, 512),
      Timeout: num(f.timeoutSeconds, 30),
      Code: { ZipFile: "# Replace with your function code" },
    }),
  },

  ecs: {
    terraform: "aws_ecs_cluster",
    cloudformation: "AWS::ECS::Cluster",
    tfProps: (f) => ({ name: str(f.clusterName, "my-cluster") }),
    cfProps: (f) => ({ ClusterName: str(f.clusterName, "my-cluster") }),
  },

  eks: {
    terraform: "aws_eks_cluster",
    cloudformation: "AWS::EKS::Cluster",
    tfProps: (f) => ({
      name: str(f.clusterName, "my-eks-cluster"),
      version: str(f.kubernetesVersion, "1.34"),
      role_arn: "arn:aws:iam::REPLACE_ME:role/eks-cluster-role",
    }),
    cfProps: (f) => ({
      Name: str(f.clusterName, "my-eks-cluster"),
      Version: str(f.kubernetesVersion, "1.34"),
      RoleArn: "arn:aws:iam::REPLACE_ME:role/eks-cluster-role",
      ResourcesVpcConfig: { SubnetIds: ["REPLACE_ME"], SecurityGroupIds: ["REPLACE_ME"] },
    }),
  },

  fargate: {
    terraform: "aws_ecs_service",
    cloudformation: "AWS::ECS::Service",
    tfProps: (f) => ({
      name: str(f.serviceName, "my-service"),
      cluster: "REPLACE_ME",
      task_definition: "REPLACE_ME",
      desired_count: num(f.desiredCount, 2),
      launch_type: "FARGATE",
    }),
    cfProps: (f) => ({
      ServiceName: str(f.serviceName, "my-service"),
      Cluster: "REPLACE_ME",
      TaskDefinition: "REPLACE_ME",
      DesiredCount: num(f.desiredCount, 2),
      LaunchType: "FARGATE",
    }),
  },

  "elastic-beanstalk": {
    terraform: "aws_elastic_beanstalk_application",
    cloudformation: "AWS::ElasticBeanstalk::Application",
    tfProps: (f) => ({ name: str(f.applicationName, "my-app") }),
    cfProps: (f) => ({ ApplicationName: str(f.applicationName, "my-app") }),
  },

  batch: {
    terraform: "aws_batch_compute_environment",
    cloudformation: "AWS::Batch::ComputeEnvironment",
    tfProps: (f) => ({
      compute_environment_name: str(f.computeEnvironmentName, "my-compute-env"),
      type: "MANAGED",
    }),
    cfProps: (f) => ({
      ComputeEnvironmentName: str(f.computeEnvironmentName, "my-compute-env"),
      Type: "MANAGED",
    }),
  },

  "app-runner": {
    terraform: "aws_apprunner_service",
    cloudformation: "AWS::AppRunner::Service",
    tfProps: (f) => ({
      service_name: str(f.serviceName, "my-app-runner-service"),
    }),
    cfProps: (f) => ({
      ServiceName: str(f.serviceName, "my-app-runner-service"),
    }),
  },

  lightsail: {
    terraform: "aws_lightsail_instance",
    cloudformation: "AWS::Lightsail::Instance",
    tfProps: (f) => ({
      name: str(f.instanceName, "my-instance"),
      bundle_id: str(f.bundleId, "micro_3_0"),
      blueprint_id: "amazon_linux_2023",
      availability_zone: "REPLACE_ME",
    }),
    cfProps: (f) => ({
      InstanceName: str(f.instanceName, "my-instance"),
      BundleId: str(f.bundleId, "micro_3_0"),
      BlueprintId: "amazon_linux_2023",
    }),
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE: Record<string, ServiceResourceMap> = {
  s3: {
    terraform: "aws_s3_bucket",
    cloudformation: "AWS::S3::Bucket",
    tfProps: (f) => ({
      bucket: str(f.bucketName, "my-bucket-REPLACE_ME"),
      force_destroy: false,
      ...(bool(f.versioning) ? { versioning: [{ enabled: true }] } : {}),
      ...(bool(f.encryptionEnabled) ? {
        server_side_encryption_configuration: [{
          rule: [{ apply_server_side_encryption_by_default: [{ sse_algorithm: "AES256" }] }],
        }],
      } : {}),
    }),
    cfProps: (f) => ({
      BucketName: str(f.bucketName, "my-bucket-REPLACE_ME"),
      VersioningConfiguration: f.versioning
        ? { Status: "Enabled" }
        : undefined,
      BucketEncryption: bool(f.encryptionEnabled)
        ? {
            ServerSideEncryptionConfiguration: [
              { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
            ],
          }
        : undefined,
    }),
  },

  ebs: {
    terraform: "aws_ebs_volume",
    cloudformation: "AWS::EC2::Volume",
    tfProps: (f) => ({
      type: str(f.volumeType, "gp3"),
      size: num(f.sizeGiB, 20),
      iops: str(f.volumeType, "gp3") === "gp3" ? num(f.iops, 3000) : undefined,
      encrypted: bool(f.encryptionEnabled),
    }),
    cfProps: (f) => ({
      VolumeType: str(f.volumeType, "gp3"),
      Size: num(f.sizeGiB, 20),
      Encrypted: bool(f.encryptionEnabled),
    }),
    tfLocation: "availability_zone",
    cfLocation: "AvailabilityZone",
  },

  efs: {
    terraform: "aws_efs_file_system",
    cloudformation: "AWS::EFS::FileSystem",
    tfProps: (f) => ({
      performance_mode: str(f.performanceMode, "generalPurpose"),
      throughput_mode: str(f.throughputMode, "elastic"),
      encrypted: bool(f.encryptionEnabled),
    }),
    cfProps: (f) => ({
      PerformanceMode: str(f.performanceMode, "generalPurpose"),
      ThroughputMode: str(f.throughputMode, "elastic"),
      Encrypted: bool(f.encryptionEnabled),
    }),
  },

  fsx: {
    terraform: (f) => {
      const t = str(f.fileSystemType, "WINDOWS");
      if (t === "LUSTRE") return "aws_fsx_lustre_file_system";
      if (t === "ONTAP") return "aws_fsx_ontap_file_system";
      if (t === "OPENZFS") return "aws_fsx_openzfs_file_system";
      return "aws_fsx_windows_file_system";
    },
    cloudformation: "AWS::FSx::FileSystem",
    tfProps: (f) => ({
      storage_capacity: num(f.storageCapacityGiB, 1024),
      subnet_ids: ["REPLACE_ME"],
    }),
    cfProps: (f) => ({
      FileSystemType: str(f.fileSystemType, "WINDOWS"),
      StorageCapacity: num(f.storageCapacityGiB, 1024),
      SubnetIds: ["REPLACE_ME"],
    }),
  },

  backup: {
    terraform: "aws_backup_plan",
    cloudformation: "AWS::Backup::BackupPlan",
    tfProps: (f) => ({ name: str(f.backupPlanName, "daily-backup") }),
    cfProps: (f) => ({
      BackupPlan: {
        BackupPlanName: str(f.backupPlanName, "daily-backup"),
        BackupPlanRule: [
          {
            RuleName: "daily",
            TargetBackupVault: "Default",
            ScheduleExpression: "cron(0 5 ? * * *)",
            Lifecycle: { DeleteAfterDays: num(f.backupRetentionDays, 35) },
          },
        ],
      },
    }),
  },

  "storage-gateway": {
    terraform: "aws_storagegateway_gateway",
    cloudformation: "AWS::StorageGateway::Gateway",
    tfProps: (f) => ({
      gateway_name: str(f.gatewayName, "my-gateway"),
      gateway_type: str(f.gatewayType, "S3_FILE"),
      gateway_ip_address: "REPLACE_ME",
    }),
    cfProps: (f) => ({
      GatewayName: str(f.gatewayName, "my-gateway"),
      GatewayType: str(f.gatewayType, "S3_FILE"),
    }),
  },

  "s3-glacier": {
    terraform: "aws_glacier_vault",
    cloudformation: "AWS::Glacier::Vault",
    tfProps: (f) => ({ name: str(f.vaultName, "archive-vault") }),
    cfProps: (f) => ({ VaultName: str(f.vaultName, "archive-vault") }),
  },
};

// ─── Database ─────────────────────────────────────────────────────────────────

const DATABASE: Record<string, ServiceResourceMap> = {
  rds: {
    terraform: "aws_db_instance",
    cloudformation: "AWS::RDS::DBInstance",
    tfProps: (f) => ({
      engine: str(f.engine, "mysql"),
      instance_class: str(f.instanceClass, "db.t4g.micro"),
      allocated_storage: 20,
      db_name: "mydb",
      username: "admin",
      password: "REPLACE_ME",
      multi_az: bool(f.multiAz),
      backup_retention_period: num(f.backupRetentionDays, 7),
      deletion_protection: bool(f.deletionProtection),
      skip_final_snapshot: true,
    }),
    cfProps: (f) => ({
      Engine: str(f.engine, "mysql"),
      DBInstanceClass: str(f.instanceClass, "db.t4g.micro"),
      AllocatedStorage: "20",
      MasterUsername: "admin",
      MasterUserPassword: "REPLACE_ME",
      MultiAZ: bool(f.multiAz),
      BackupRetentionPeriod: num(f.backupRetentionDays, 7),
      DeletionProtection: bool(f.deletionProtection),
    }),
  },

  dynamodb: {
    terraform: "aws_dynamodb_table",
    cloudformation: "AWS::DynamoDB::Table",
    tfProps: (f) => ({
      name: str(f.tableName, "my-table"),
      billing_mode: str(f.billingMode, "PAY_PER_REQUEST"),
      hash_key: "id",
      attribute: [{ name: "id", type: "S" }],
      point_in_time_recovery: bool(f.pointInTimeRecovery)
        ? [{ enabled: true }]
        : undefined,
    }),
    cfProps: (f) => ({
      TableName: str(f.tableName, "my-table"),
      BillingMode: str(f.billingMode, "PAY_PER_REQUEST"),
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    }),
  },

  aurora: {
    terraform: "aws_rds_cluster",
    cloudformation: "AWS::RDS::DBCluster",
    tfProps: (f) => ({
      engine: str(f.engine, "aurora-mysql"),
      engine_mode: "provisioned",
      master_username: "admin",
      master_password: "REPLACE_ME",
      backup_retention_period: num(f.backupRetentionDays, 7),
      skip_final_snapshot: true,
    }),
    cfProps: (f) => ({
      Engine: str(f.engine, "aurora-mysql"),
      MasterUsername: "admin",
      MasterUserPassword: "REPLACE_ME",
      BackupRetentionPeriod: num(f.backupRetentionDays, 7),
    }),
  },

  elasticache: {
    terraform: "aws_elasticache_replication_group",
    cloudformation: "AWS::ElastiCache::ReplicationGroup",
    tfProps: (f) => ({
      replication_group_id: "my-cache",
      description: "ElastiCache replication group",
      node_type: str(f.nodeType, "cache.t4g.micro"),
      num_cache_clusters: num(f.nodeCount, 2),
      engine: str(f.engine, "redis"),
    }),
    cfProps: (f) => ({
      ReplicationGroupDescription: "ElastiCache replication group",
      CacheNodeType: str(f.nodeType, "cache.t4g.micro"),
      NumCacheClusters: num(f.nodeCount, 2),
      Engine: str(f.engine, "redis"),
    }),
  },

  redshift: {
    terraform: "aws_redshift_cluster",
    cloudformation: "AWS::Redshift::Cluster",
    tfProps: (f) => ({
      cluster_identifier: str(f.clusterIdentifier, "my-redshift-cluster"),
      node_type: str(f.nodeType, "ra3.xlplus"),
      number_of_nodes: num(f.nodeCount, 2),
      database_name: "dev",
      master_username: "admin",
      master_password: "REPLACE_ME",
      encrypted: bool(f.encryptionEnabled),
      skip_final_snapshot: true,
    }),
    cfProps: (f) => ({
      ClusterIdentifier: str(f.clusterIdentifier, "my-redshift-cluster"),
      NodeType: str(f.nodeType, "ra3.xlplus"),
      NumberOfNodes: num(f.nodeCount, 2),
      DBName: "dev",
      MasterUsername: "admin",
      MasterUserPassword: "REPLACE_ME",
      ClusterType: num(f.nodeCount, 2) > 1 ? "multi-node" : "single-node",
    }),
  },

  documentdb: {
    terraform: "aws_docdb_cluster",
    cloudformation: "AWS::DocDB::DBCluster",
    tfProps: (f) => ({
      cluster_identifier: str(f.clusterIdentifier, "my-docdb-cluster"),
      master_username: "admin",
      master_password: "REPLACE_ME",
      backup_retention_period: num(f.backupRetentionDays, 7),
      skip_final_snapshot: true,
    }),
    cfProps: (f) => ({
      DBClusterIdentifier: str(f.clusterIdentifier, "my-docdb-cluster"),
      MasterUsername: "admin",
      MasterUserPassword: "REPLACE_ME",
      BackupRetentionPeriod: num(f.backupRetentionDays, 7),
    }),
  },

  neptune: {
    terraform: "aws_neptune_cluster",
    cloudformation: "AWS::Neptune::DBCluster",
    tfProps: (f) => ({
      cluster_identifier: str(f.clusterIdentifier, "my-neptune-cluster"),
      engine: "neptune",
      backup_retention_period: 7,
      skip_final_snapshot: true,
    }),
    cfProps: (f) => ({
      DBClusterIdentifier: str(f.clusterIdentifier, "my-neptune-cluster"),
    }),
  },

  qldb: {
    terraform: "aws_qldb_ledger",
    cloudformation: "AWS::QLDB::Ledger",
    tfProps: (f) => ({
      name: str(f.ledgerName, "my-ledger"),
      permissions_mode: "STANDARD",
      deletion_protection: bool(f.deletionProtection),
    }),
    cfProps: (f) => ({
      Name: str(f.ledgerName, "my-ledger"),
      PermissionsMode: "STANDARD",
      DeletionProtection: bool(f.deletionProtection),
    }),
  },

  timestream: {
    terraform: "aws_timestreamwrite_database",
    cloudformation: "AWS::Timestream::Database",
    tfProps: (f) => ({ database_name: str(f.databaseName, "metrics") }),
    cfProps: (f) => ({ DatabaseName: str(f.databaseName, "metrics") }),
  },

  keyspaces: {
    terraform: "aws_keyspaces_table",
    cloudformation: "AWS::Cassandra::Table",
    tfProps: (f) => ({
      keyspace_name: str(f.keyspaceName, "my_keyspace"),
      table_name: str(f.tableName, "my_table"),
      schema_definition: [{
        column: [{ name: "id", type: "text" }],
        partition_key: [{ name: "id" }],
      }],
    }),
    cfProps: (f) => ({
      KeyspaceName: str(f.keyspaceName, "my_keyspace"),
      TableName: str(f.tableName, "my_table"),
      PartitionKeyColumns: [{ ColumnName: "id", ColumnType: "text" }],
    }),
  },
};

// ─── Networking ───────────────────────────────────────────────────────────────

const NETWORKING: Record<string, ServiceResourceMap> = {
  cloudfront: {
    terraform: "aws_cloudfront_distribution",
    cloudformation: "AWS::CloudFront::Distribution",
    tfProps: (f) => ({
      enabled: true,
      default_cache_behavior: {
        allowed_methods: ["GET", "HEAD"],
        cached_methods: ["GET", "HEAD"],
        target_origin_id: "primary",
        viewer_protocol_policy: str(f.viewerProtocolPolicy, "redirect-to-https"),
        forwarded_values: { query_string: false, cookies: { forward: "none" } },
      },
      origin: {
        domain_name: str(f.originDomain, "REPLACE_ME.s3.amazonaws.com"),
        origin_id: "primary",
      },
      price_class: str(f.priceClass, "PriceClass_100"),
      restrictions: { geo_restriction: { restriction_type: "none" } },
      viewer_certificate: { cloudfront_default_certificate: true },
    }),
    cfProps: (f) => ({
      DistributionConfig: {
        Enabled: true,
        Origins: [
          {
            DomainName: str(f.originDomain, "REPLACE_ME.s3.amazonaws.com"),
            Id: "primary",
          },
        ],
        DefaultCacheBehavior: {
          TargetOriginId: "primary",
          ViewerProtocolPolicy: str(f.viewerProtocolPolicy, "redirect-to-https"),
          AllowedMethods: ["GET", "HEAD"],
          CachedMethods: ["GET", "HEAD"],
          ForwardedValues: { QueryString: false, Cookies: { Forward: "none" } },
        },
        PriceClass: str(f.priceClass, "PriceClass_100"),
      },
    }),
  },

  route53: {
    terraform: "aws_route53_zone",
    cloudformation: "AWS::Route53::HostedZone",
    tfProps: (f) => ({ name: str(f.domainName, "example.com") }),
    cfProps: (f) => ({ Name: str(f.domainName, "example.com") }),
  },

  "api-gateway": {
    terraform: "aws_apigatewayv2_api",
    cloudformation: "AWS::ApiGatewayV2::Api",
    tfProps: (f) => ({
      name: str(f.apiName, "my-api"),
      protocol_type: str(f.apiType, "HTTP"),
    }),
    cfProps: (f) => ({
      Name: str(f.apiName, "my-api"),
      ProtocolType: str(f.apiType, "HTTP"),
    }),
  },

  "direct-connect": {
    terraform: "aws_dx_connection",
    cloudformation: "AWS::DirectConnect::Connection",
    tfProps: (f) => ({
      name: str(f.connectionName, "my-dx"),
      bandwidth: str(f.connectionSpeed, "10Gbps"),
      location: "REPLACE_ME",
    }),
    cfProps: (f) => ({
      ConnectionName: str(f.connectionName, "my-dx"),
      Bandwidth: str(f.connectionSpeed, "10Gbps"),
      Location: "REPLACE_ME",
    }),
  },

  "transit-gateway": {
    terraform: "aws_ec2_transit_gateway",
    cloudformation: "AWS::EC2::TransitGateway",
    tfProps: (f) => ({
      default_route_table_association: bool(f.defaultRouteTableAssociation) ? "enable" : "disable",
      auto_accept_shared_attachments: bool(f.autoAcceptAttachments) ? "enable" : "disable",
    }),
    cfProps: () => ({}),
  },

  "customer-gateway": {
    terraform: "aws_customer_gateway",
    cloudformation: "AWS::EC2::CustomerGateway",
    tfProps: (f) => ({
      bgp_asn: num(f.bgpAsn, 65000),
      ip_address: str(f.ipAddress, "203.0.113.10"),
      type: "ipsec.1",
      tags: { Name: str(f.customerGatewayName, "my-customer-gateway") },
    }),
    cfProps: (f) => ({
      BgpAsn: num(f.bgpAsn, 65000),
      IpAddress: str(f.ipAddress, "203.0.113.10"),
      Type: "ipsec.1",
      Tags: [{ Key: "Name", Value: str(f.customerGatewayName, "my-customer-gateway") }],
    }),
    tfLocation: "none",
    cfLocation: "none",
  },

  elb: {
    terraform: "aws_lb",
    cloudformation: "AWS::ElasticLoadBalancingV2::LoadBalancer",
    tfProps: (f) => ({
      name: str(f.loadBalancerName, "my-load-balancer"),
      load_balancer_type: str(f.loadBalancerType, "application"),
      internal: str(f.scheme, "internet-facing") === "internal",
    }),
    cfProps: (f) => ({
      Name: str(f.loadBalancerName, "my-load-balancer"),
      Type: str(f.loadBalancerType, "application"),
      Scheme: str(f.scheme, "internet-facing"),
    }),
  },

  "global-accelerator": {
    terraform: "aws_globalaccelerator_accelerator",
    cloudformation: "AWS::GlobalAccelerator::Accelerator",
    tfProps: (f) => ({
      name: str(f.acceleratorName, "my-accelerator"),
      ip_address_type: "IPV4",
      enabled: true,
    }),
    cfProps: (f) => ({
      Name: str(f.acceleratorName, "my-accelerator"),
      IpAddressType: "IPV4",
      Enabled: true,
    }),
  },

  "app-mesh": {
    terraform: "aws_appmesh_mesh",
    cloudformation: "AWS::AppMesh::Mesh",
    tfProps: (f) => ({
      name: str(f.meshName, "my-mesh"),
      spec: [{ egress_filter: [{ type: "ALLOW_ALL" }] }],
    }),
    cfProps: (f) => ({
      MeshName: str(f.meshName, "my-mesh"),
      Spec: { EgressFilter: { Type: "ALLOW_ALL" } },
    }),
  },

  privatelink: {
    terraform: "aws_vpc_endpoint",
    cloudformation: "AWS::EC2::VPCEndpoint",
    tfProps: (f) => ({
      service_name: str(f.endpointServiceName, "com.amazonaws.REPLACE_ME.s3"),
      vpc_endpoint_type: str(f.endpointType, "Interface"),
    }),
    cfProps: (f) => ({
      ServiceName: str(f.endpointServiceName, "com.amazonaws.REPLACE_ME.s3"),
      VpcEndpointType: str(f.endpointType, "Interface"),
    }),
    tfLocation: "vpc_id",
    cfLocation: "VpcId",
  },
};

// ─── Security ─────────────────────────────────────────────────────────────────

const SECURITY: Record<string, ServiceResourceMap> = {
  iam: {
    terraform: "aws_iam_role",
    cloudformation: "AWS::IAM::Role",
    tfProps: (f) => ({
      name: str(f.roleName, "my-role"),
      assume_role_policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    }),
    cfProps: (f) => ({
      RoleName: str(f.roleName, "my-role"),
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      },
    }),
  },

  cognito: {
    terraform: "aws_cognito_user_pool",
    cloudformation: "AWS::Cognito::UserPool",
    tfProps: (f) => ({
      name: str(f.userPoolName, "my-user-pool"),
      mfa_configuration: bool(f.mfaEnabled) ? "ON" : "OFF",
    }),
    cfProps: (f) => ({
      UserPoolName: str(f.userPoolName, "my-user-pool"),
      MfaConfiguration: bool(f.mfaEnabled) ? "ON" : "OFF",
    }),
  },

  acm: {
    terraform: "aws_acm_certificate",
    cloudformation: "AWS::CertificateManager::Certificate",
    tfProps: (f) => ({
      domain_name: str(f.domainName, "example.com"),
      validation_method: str(f.validationMethod, "DNS"),
    }),
    cfProps: (f) => ({
      DomainName: str(f.domainName, "example.com"),
      ValidationMethod: str(f.validationMethod, "DNS"),
    }),
  },

  waf: {
    terraform: "aws_wafv2_web_acl",
    cloudformation: "AWS::WAFv2::WebACL",
    tfProps: (f) => ({
      name: str(f.webAclName, "my-web-acl"),
      scope: str(f.scope, "REGIONAL"),
      default_action: bool(f.defaultAction === "block") ? [{ block: {} }] : [{ allow: {} }],
      visibility_config: {
        cloudwatch_metrics_enabled: true,
        metric_name: str(f.webAclName, "my-web-acl"),
        sampled_requests_enabled: true,
      },
    }),
    cfProps: (f) => ({
      Name: str(f.webAclName, "my-web-acl"),
      Scope: str(f.scope, "REGIONAL"),
      DefaultAction: str(f.defaultAction, "allow") === "block" ? { Block: {} } : { Allow: {} },
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: str(f.webAclName, "my-web-acl"),
        SampledRequestsEnabled: true,
      },
    }),
  },

  kms: {
    terraform: "aws_kms_key",
    cloudformation: "AWS::KMS::Key",
    tfProps: (f) => ({
      description: str(f.keyAlias, "alias/my-key"),
      key_usage: str(f.keyUsage, "ENCRYPT_DECRYPT"),
      customer_master_key_spec: str(f.keySpec, "SYMMETRIC_DEFAULT"),
      enable_key_rotation: bool(f.rotationEnabled),
    }),
    cfProps: (f) => ({
      Description: str(f.keyAlias, "alias/my-key"),
      KeyUsage: str(f.keyUsage, "ENCRYPT_DECRYPT"),
      KeySpec: str(f.keySpec, "SYMMETRIC_DEFAULT"),
      EnableKeyRotation: bool(f.rotationEnabled),
    }),
  },

  "secrets-manager": {
    terraform: "aws_secretsmanager_secret",
    cloudformation: "AWS::SecretsManager::Secret",
    tfProps: (f) => ({ name: str(f.secretName, "my-secret") }),
    cfProps: (f) => ({ Name: str(f.secretName, "my-secret") }),
  },

  guardduty: {
    terraform: "aws_guardduty_detector",
    cloudformation: "AWS::GuardDuty::Detector",
    tfProps: (f) => ({ enable: bool(f.enabled) }),
    cfProps: (f) => ({ Enable: bool(f.enabled) }),
  },

  "security-hub": {
    terraform: "aws_securityhub_account",
    cloudformation: "AWS::SecurityHub::Hub",
    tfProps: () => ({}),
    cfProps: () => ({}),
  },

  macie: {
    terraform: "aws_macie2_account",
    cloudformation: "AWS::Macie::Session",
    tfProps: () => ({ status: "ENABLED" }),
    cfProps: () => ({ Status: "ENABLED" }),
  },

  shield: {
    terraform: "aws_shield_protection",
    cloudformation: "AWS::Shield::Protection",
    tfProps: () => ({
      name: "resource-protection",
      resource_arn: "REPLACE_ME",
    }),
    cfProps: () => ({
      Name: "resource-protection",
      ResourceArn: "REPLACE_ME",
    }),
  },

  inspector: {
    terraform: "aws_inspector2_enabler",
    cloudformation: "AWS::InspectorV2::Filter",
    tfProps: () => ({
      account_ids: ["REPLACE_ME"],
      resource_types: ["EC2", "ECR", "LAMBDA"],
    }),
    cfProps: () => ({
      FilterName: "my-inspector-filter",
      FilterAction: "INCLUDE",
      FilterCriteria: {},
    }),
  },
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const ANALYTICS: Record<string, ServiceResourceMap> = {
  athena: {
    terraform: "aws_athena_workgroup",
    cloudformation: "AWS::Athena::WorkGroup",
    tfProps: (f) => ({ name: str(f.workgroupName, "primary") }),
    cfProps: (f) => ({ Name: str(f.workgroupName, "primary") }),
  },

  emr: {
    terraform: "aws_emr_cluster",
    cloudformation: "AWS::EMR::Cluster",
    tfProps: (f) => ({
      name: str(f.clusterName, "my-emr-cluster"),
      release_label: str(f.releaseLabel, "emr-7.x"),
      service_role: "arn:aws:iam::REPLACE_ME:role/EMR_DefaultRole",
    }),
    cfProps: (f) => ({
      Name: str(f.clusterName, "my-emr-cluster"),
      ReleaseLabel: str(f.releaseLabel, "emr-7.x"),
      ServiceRole: "arn:aws:iam::REPLACE_ME:role/EMR_DefaultRole",
      JobFlowRole: "arn:aws:iam::REPLACE_ME:role/EMR_EC2_DefaultRole",
      Instances: { MasterInstanceGroup: { InstanceCount: 1, InstanceType: "m5.large" } },
    }),
  },

  kinesis: {
    terraform: "aws_kinesis_stream",
    cloudformation: "AWS::Kinesis::Stream",
    tfProps: (f) => ({
      name: str(f.streamName, "my-stream"),
      stream_mode_details: [{ stream_mode: str(f.streamMode, "ON_DEMAND") }],
    }),
    cfProps: (f) => ({
      Name: str(f.streamName, "my-stream"),
      StreamModeDetails: { StreamMode: str(f.streamMode, "ON_DEMAND") },
    }),
  },

  glue: {
    terraform: "aws_glue_job",
    cloudformation: "AWS::Glue::Job",
    tfProps: (f) => ({
      name: str(f.jobName, "my-glue-job"),
      role_arn: "arn:aws:iam::REPLACE_ME:role/glue-role",
      command: [{ name: "glueetl", script_location: "s3://REPLACE_ME/script.py" }],
    }),
    cfProps: (f) => ({
      Name: str(f.jobName, "my-glue-job"),
      Role: "arn:aws:iam::REPLACE_ME:role/glue-role",
      Command: { Name: "glueetl", ScriptLocation: "s3://REPLACE_ME/script.py" },
    }),
  },

  msk: {
    terraform: "aws_msk_cluster",
    cloudformation: "AWS::MSK::Cluster",
    tfProps: (f) => ({
      cluster_name: str(f.clusterName, "my-msk-cluster"),
      kafka_version: "3.6.0",
      number_of_broker_nodes: num(f.brokerCount, 3),
      broker_node_group_info: [
        {
          instance_type: str(f.brokerInstanceType, "kafka.m7g.large"),
          client_subnets: ["REPLACE_ME"],
          storage_info: [{ ebs_storage_info: [{ volume_size: 100 }] }],
        },
      ],
    }),
    cfProps: (f) => ({
      ClusterName: str(f.clusterName, "my-msk-cluster"),
      KafkaVersion: "3.6.0",
      NumberOfBrokerNodes: num(f.brokerCount, 3),
      BrokerNodeGroupInfo: {
        InstanceType: str(f.brokerInstanceType, "kafka.m7g.large"),
        ClientSubnets: ["REPLACE_ME"],
        StorageInfo: { EBSStorageInfo: { VolumeSize: 100 } },
      },
    }),
  },

  opensearch: {
    terraform: "aws_opensearch_domain",
    cloudformation: "AWS::OpenSearchService::Domain",
    tfProps: (f) => ({
      domain_name: str(f.domainName, "search-domain"),
      engine_version: str(f.engineVersion, "OpenSearch_2.x"),
      cluster_config: [{ instance_type: str(f.instanceType, "m7g.large.search") }],
    }),
    cfProps: (f) => ({
      DomainName: str(f.domainName, "search-domain"),
      EngineVersion: str(f.engineVersion, "OpenSearch_2.x"),
      ClusterConfig: { InstanceType: str(f.instanceType, "m7g.large.search") },
    }),
  },

  "lake-formation": {
    terraform: "aws_lakeformation_data_lake_settings",
    cloudformation: "AWS::LakeFormation::DataLakeSettings",
    tfProps: () => ({
      admins: ["REPLACE_ME"],
    }),
    cfProps: () => ({
      Admins: [{ DataLakePrincipalIdentifier: "REPLACE_ME" }],
    }),
  },

  "clean-rooms": {
    terraform: "aws_cleanrooms_collaboration",
    cloudformation: "AWS::CleanRooms::Collaboration",
    tfProps: (f) => ({
      name: str(f.collaborationName, "partner-analysis"),
      creator_display_name: "REPLACE_ME",
      creator_member_abilities: ["CAN_QUERY", "CAN_RECEIVE_RESULTS"],
      query_log_status: "ENABLED",
    }),
    cfProps: (f) => ({
      Name: str(f.collaborationName, "partner-analysis"),
      CreatorDisplayName: "REPLACE_ME",
      CreatorMemberAbilities: ["CAN_QUERY", "CAN_RECEIVE_RESULTS"],
      QueryLogStatus: "ENABLED",
    }),
  },
};

// ─── Messaging ────────────────────────────────────────────────────────────────

const MESSAGING: Record<string, ServiceResourceMap> = {
  sqs: {
    terraform: "aws_sqs_queue",
    cloudformation: "AWS::SQS::Queue",
    tfProps: (f) => ({
      name: str(f.queueName, "my-queue"),
      fifo_queue: str(f.type, "standard") === "fifo",
      sqs_managed_sse_enabled: bool(f.encryptionEnabled),
    }),
    cfProps: (f) => ({
      QueueName: str(f.queueName, "my-queue"),
      FifoQueue: str(f.type, "standard") === "fifo",
      SqsManagedSseEnabled: bool(f.encryptionEnabled),
    }),
  },

  sns: {
    terraform: "aws_sns_topic",
    cloudformation: "AWS::SNS::Topic",
    tfProps: (f) => ({
      name: str(f.topicName, "my-topic"),
      fifo_topic: str(f.type, "standard") === "fifo",
    }),
    cfProps: (f) => ({
      TopicName: str(f.topicName, "my-topic"),
      FifoTopic: str(f.type, "standard") === "fifo",
    }),
  },

  eventbridge: {
    terraform: "aws_cloudwatch_event_bus",
    cloudformation: "AWS::Events::EventBus",
    tfProps: (f) => ({ name: str(f.eventBusName, "my-event-bus") }),
    cfProps: (f) => ({ Name: str(f.eventBusName, "my-event-bus") }),
  },

  "step-functions": {
    terraform: "aws_sfn_state_machine",
    cloudformation: "AWS::StepFunctions::StateMachine",
    tfProps: (f) => ({
      name: str(f.stateMachineName, "my-workflow"),
      type: str(f.workflowType, "STANDARD"),
      role_arn: "arn:aws:iam::REPLACE_ME:role/step-functions-role",
      definition: JSON.stringify({ Comment: "Replace with your state machine definition", StartAt: "FirstState", States: { FirstState: { Type: "Pass", End: true } } }),
    }),
    cfProps: (f) => ({
      StateMachineName: str(f.stateMachineName, "my-workflow"),
      StateMachineType: str(f.workflowType, "STANDARD"),
      RoleArn: "arn:aws:iam::REPLACE_ME:role/step-functions-role",
      DefinitionString: '{"Comment":"Replace with your state machine definition","StartAt":"FirstState","States":{"FirstState":{"Type":"Pass","End":true}}}',
    }),
  },

  ses: {
    terraform: "aws_ses_domain_identity",
    cloudformation: "AWS::SES::EmailIdentity",
    tfProps: (f) => ({ domain: str(f.identityName, "example.com") }),
    cfProps: (f) => ({ EmailIdentity: str(f.identityName, "example.com") }),
  },

  appsync: {
    terraform: "aws_appsync_graphql_api",
    cloudformation: "AWS::AppSync::GraphQLApi",
    tfProps: (f) => ({
      name: str(f.apiName, "graphql-api"),
      authentication_type: str(f.authType, "AMAZON_COGNITO_USER_POOLS"),
    }),
    cfProps: (f) => ({
      Name: str(f.apiName, "graphql-api"),
      AuthenticationType: str(f.authType, "AMAZON_COGNITO_USER_POOLS"),
    }),
  },

  pinpoint: {
    terraform: "aws_pinpoint_app",
    cloudformation: "AWS::Pinpoint::App",
    tfProps: (f) => ({ name: str(f.applicationName, "customer-engagement") }),
    cfProps: (f) => ({ Name: str(f.applicationName, "customer-engagement") }),
  },

  lex: {
    terraform: "aws_lexv2models_bot",
    cloudformation: "AWS::Lex::Bot",
    tfProps: (f) => ({
      name: str(f.botName, "support-bot"),
      idle_session_ttl_in_seconds: 300,
      role_arn: "arn:aws:iam::REPLACE_ME:role/lex-role",
      data_privacy: [{ child_directed: false }],
    }),
    cfProps: (f) => ({
      Name: str(f.botName, "support-bot"),
      IdleSessionTTLInSeconds: 300,
      RoleArn: "arn:aws:iam::REPLACE_ME:role/lex-role",
      DataPrivacy: { ChildDirected: false },
      BotLocales: [{ LocaleId: str(f.languageCode, "en_US"), NluConfidenceThreshold: 0.4 }],
    }),
  },
};

// ─── Management ───────────────────────────────────────────────────────────────

const MANAGEMENT: Record<string, ServiceResourceMap> = {
  cloudwatch: {
    terraform: "aws_cloudwatch_log_group",
    cloudformation: "AWS::Logs::LogGroup",
    tfProps: (f) => ({
      name: str(f.logGroupName, "/aws/app/logs"),
      retention_in_days: parseInt(str(f.retentionDays, "30")) || 30,
    }),
    cfProps: (f) => ({
      LogGroupName: str(f.logGroupName, "/aws/app/logs"),
      RetentionInDays: parseInt(str(f.retentionDays, "30")) || 30,
    }),
  },

  cloudtrail: {
    terraform: "aws_cloudtrail",
    cloudformation: "AWS::CloudTrail::Trail",
    tfProps: (f) => ({
      name: str(f.trailName, "organization-trail"),
      s3_bucket_name: "REPLACE_ME-cloudtrail-logs",
      is_multi_region_trail: str(f.trailType, "multi-region") !== "single-region",
      enable_logging: true,
    }),
    cfProps: (f) => ({
      TrailName: str(f.trailName, "organization-trail"),
      S3BucketName: "REPLACE_ME-cloudtrail-logs",
      IsMultiRegionTrail: str(f.trailType, "multi-region") !== "single-region",
      IsLogging: true,
    }),
  },

  codebuild: {
    terraform: "aws_codebuild_project",
    cloudformation: "AWS::CodeBuild::Project",
    tfProps: (f) => ({
      name: str(f.projectName, "my-build"),
      service_role: "arn:aws:iam::REPLACE_ME:role/codebuild-role",
      artifacts: [{ type: "NO_ARTIFACTS" }],
      environment: [
        {
          compute_type: str(f.computeType, "BUILD_GENERAL1_SMALL"),
          image: str(f.buildImage, "aws/codebuild/standard:7.0"),
          type: "LINUX_CONTAINER",
        },
      ],
      source: [{ type: "NO_SOURCE", buildspec: "version: 0.2\nphases:\n  build:\n    commands:\n      - echo Build started" }],
    }),
    cfProps: (f) => ({
      Name: str(f.projectName, "my-build"),
      ServiceRole: "arn:aws:iam::REPLACE_ME:role/codebuild-role",
      Artifacts: { Type: "NO_ARTIFACTS" },
      Environment: {
        ComputeType: str(f.computeType, "BUILD_GENERAL1_SMALL"),
        Image: str(f.buildImage, "aws/codebuild/standard:7.0"),
        Type: "LINUX_CONTAINER",
      },
      Source: { Type: "NO_SOURCE" },
    }),
  },

  codepipeline: {
    terraform: "aws_codepipeline",
    cloudformation: "AWS::CodePipeline::Pipeline",
    tfProps: (f) => ({
      name: str(f.pipelineName, "delivery-pipeline"),
      pipeline_type: str(f.pipelineType, "V2"),
      role_arn: "arn:aws:iam::REPLACE_ME:role/codepipeline-role",
      artifact_store: [{ location: "REPLACE_ME", type: "S3" }],
      stage: [
        { name: "Source", action: [{ name: "Source", category: "Source", owner: "AWS", provider: "CodeCommit", version: "1", output_artifacts: ["source_output"], configuration: { RepositoryName: "REPLACE_ME", BranchName: "main" } }] },
        { name: "Deploy", action: [{ name: "Deploy", category: "Deploy", owner: "AWS", provider: "ECS", version: "1", input_artifacts: ["source_output"], configuration: { ClusterName: "REPLACE_ME", ServiceName: "REPLACE_ME" } }] },
      ],
    }),
    cfProps: (f) => ({
      Name: str(f.pipelineName, "delivery-pipeline"),
      RoleArn: "arn:aws:iam::REPLACE_ME:role/codepipeline-role",
      ArtifactStore: { Location: "REPLACE_ME", Type: "S3" },
      Stages: [
        { Name: "Source", Actions: [{ Name: "Source", ActionTypeId: { Category: "Source", Owner: "AWS", Provider: "CodeCommit", Version: "1" }, OutputArtifacts: [{ Name: "SourceOutput" }], Configuration: { RepositoryName: "REPLACE_ME", BranchName: "main" } }] },
      ],
    }),
  },

  codecommit: {
    terraform: "aws_codecommit_repository",
    cloudformation: "AWS::CodeCommit::Repository",
    tfProps: (f) => ({ repository_name: str(f.repositoryName, "my-repo") }),
    cfProps: (f) => ({ RepositoryName: str(f.repositoryName, "my-repo") }),
  },

  codedeploy: {
    terraform: "aws_codedeploy_app",
    cloudformation: "AWS::CodeDeploy::Application",
    tfProps: (f) => ({
      name: str(f.applicationName, "my-app"),
      compute_platform: str(f.computePlatform, "ECS"),
    }),
    cfProps: (f) => ({
      ApplicationName: str(f.applicationName, "my-app"),
      ComputePlatform: str(f.computePlatform, "ECS"),
    }),
  },

  "service-catalog": {
    terraform: "aws_servicecatalog_portfolio",
    cloudformation: "AWS::ServiceCatalog::Portfolio",
    tfProps: (f) => ({
      name: str(f.portfolioName, "approved-products"),
      provider_name: "Platform Team",
    }),
    cfProps: (f) => ({
      DisplayName: str(f.portfolioName, "approved-products"),
      ProviderName: "Platform Team",
    }),
  },

  "systems-manager": {
    terraform: "aws_ssm_parameter",
    cloudformation: "AWS::SSM::Parameter",
    tfProps: () => ({
      name: "/app/config/REPLACE_ME",
      type: "String",
      value: "REPLACE_ME",
    }),
    cfProps: () => ({
      Name: "/app/config/REPLACE_ME",
      Type: "String",
      Value: "REPLACE_ME",
    }),
  },

  config: {
    terraform: "aws_config_config_rule",
    cloudformation: "AWS::Config::ConfigRule",
    tfProps: () => ({
      name: "required-tags",
      source: [{ owner: "AWS", source_identifier: "REQUIRED_TAGS" }],
    }),
    cfProps: () => ({
      ConfigRuleName: "required-tags",
      Source: { Owner: "AWS", SourceIdentifier: "REQUIRED_TAGS" },
    }),
  },

  organizations: {
    terraform: "aws_organizations_organizational_unit",
    cloudformation: "AWS::Organizations::OrganizationalUnit",
    tfProps: (f) => ({
      name: str(f.organizationalUnitName, "production"),
      parent_id: "REPLACE_ME",
    }),
    cfProps: (f) => ({
      Name: str(f.organizationalUnitName, "production"),
      ParentId: "REPLACE_ME",
    }),
  },
};

// ─── ML/AI ────────────────────────────────────────────────────────────────────

const ML_AI: Record<string, ServiceResourceMap> = {
  sagemaker: {
    terraform: "aws_sagemaker_domain",
    cloudformation: "AWS::SageMaker::Domain",
    tfProps: (f) => ({
      domain_name: str(f.domainName, "ml-domain"),
      auth_mode: "IAM",
      vpc_id: "REPLACE_ME",
      subnet_ids: ["REPLACE_ME"],
      default_user_settings: [{ execution_role: "arn:aws:iam::REPLACE_ME:role/sagemaker-role" }],
    }),
    cfProps: (f) => ({
      DomainName: str(f.domainName, "ml-domain"),
      AuthMode: "IAM",
      VpcId: "REPLACE_ME",
      SubnetIds: ["REPLACE_ME"],
      DefaultUserSettings: { ExecutionRole: "arn:aws:iam::REPLACE_ME:role/sagemaker-role" },
    }),
  },

  kendra: {
    terraform: "aws_kendra_index",
    cloudformation: "AWS::Kendra::Index",
    tfProps: (f) => ({
      name: str(f.indexName, "enterprise-search"),
      role_arn: "arn:aws:iam::REPLACE_ME:role/kendra-role",
      edition: str(f.edition, "ENTERPRISE_EDITION"),
    }),
    cfProps: (f) => ({
      Name: str(f.indexName, "enterprise-search"),
      RoleArn: "arn:aws:iam::REPLACE_ME:role/kendra-role",
      Edition: str(f.edition, "ENTERPRISE_EDITION"),
    }),
  },

  cloud9: {
    terraform: "aws_cloud9_environment_ec2",
    cloudformation: "AWS::Cloud9::EnvironmentEC2",
    tfProps: (f) => ({
      name: str(f.environmentName, "dev-env"),
      instance_type: str(f.instanceType, "t3.micro"),
      automatic_stop_time_minutes: 30,
    }),
    cfProps: (f) => ({
      Name: str(f.environmentName, "dev-env"),
      InstanceType: str(f.instanceType, "t3.micro"),
      AutomaticStopTimeMinutes: 30,
    }),
  },

  xray: {
    terraform: "aws_xray_group",
    cloudformation: "AWS::XRay::Group",
    tfProps: (f) => ({
      group_name: str(f.groupName, "service-map"),
      filter_expression: "service(\"REPLACE_ME\")",
    }),
    cfProps: (f) => ({
      GroupName: str(f.groupName, "service-map"),
      FilterExpression: "service(\"REPLACE_ME\")",
    }),
  },

  bedrock: {
    terraform: "aws_bedrock_model_invocation_logging_configuration",
    cloudformation: "AWS::Bedrock::ModelInvocationLoggingConfiguration",
    tfProps: () => ({
      logging_config: [{
        embedding_data_delivery_enabled: true,
        image_data_delivery_enabled: false,
        text_data_delivery_enabled: true,
        s3_config: [{ bucket_name: "REPLACE_ME-bedrock-logs" }],
      }],
    }),
    cfProps: () => ({
      LoggingConfig: {
        EmbeddingDataDeliveryEnabled: true,
        ImageDataDeliveryEnabled: false,
        TextDataDeliveryEnabled: true,
        S3Config: { BucketName: "REPLACE_ME-bedrock-logs" },
      },
    }),
  },
};

// ─── Combined map ─────────────────────────────────────────────────────────────

export const SERVICE_MAP: Record<string, ServiceResourceMap> = {
  ...COMPUTE,
  ...STORAGE,
  ...DATABASE,
  ...NETWORKING,
  ...SECURITY,
  ...ANALYTICS,
  ...MESSAGING,
  ...MANAGEMENT,
  ...ML_AI,
};
