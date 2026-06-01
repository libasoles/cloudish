import type { AwsCategory, AwsService } from "@/data/aws-services";
import type { ServiceField } from "@/data/aws-service-fields";

export type Locale = "en" | "es";

type FieldTranslations = Record<
  string,
  {
    label?: string;
    placeholder?: string;
    options?: Record<string, string>;
  }
>;

export const UI_TEXT = {
  en: {
    dragAndDrop: "Drag & Drop",
    subnet: "Subnet",
    dragSubnet: "Drag subnet",
    region: "Region",
    dragRegion: "Drag region",
    dragService: (serviceName: string) => `Drag ${serviceName}`,
    closeInspector: "Close inspector",
    openInspector: "Open inspector",
    noNodeSelected: "No node selected",
    edge: "Edge",
    label: "Label",
    arrowDirection: "Arrow direction",
    noArrows: "No arrows",
    sourceArrow: "Source",
    targetArrow: "Target",
    bothArrows: "Both",
    type: "Type",
    public: "Public",
    private: "Private",
    subnetLabel: (subnetType: string, index: number) =>
      `Subnet ${subnetType} ${index}`,
    comingSoon: "Coming Soon",
    fieldsUnavailable:
      "Configuration fields for this service are not available yet.",
    position: "Position",
    clickNodeDetails: "Click a node or edge to see its details.",
    user: "User",
    searchPlaceholder: "Search AWS services...",
    clearSearch: "Clear search",
    availabilityZone: "AZ",
    numberOfAZs: "Availability Zones",
    numberOfVPCs: "VPCs",
    numberOfSubnets: "Subnets",
    syncAzs: "Sync AZs",
  },
  es: {
    dragAndDrop: "Arrastrar",
    subnet: "Subred",
    dragSubnet: "Arrastrar subred",
    region: "Region",
    dragRegion: "Arrastrar region",
    dragService: (serviceName: string) => `Arrastrar ${serviceName}`,
    closeInspector: "Cerrar inspector",
    openInspector: "Abrir inspector",
    noNodeSelected: "Ningun nodo seleccionado",
    edge: "Conexion",
    label: "Etiqueta",
    arrowDirection: "Direccion de flecha",
    noArrows: "Sin puntas",
    sourceArrow: "Origen",
    targetArrow: "Destino",
    bothArrows: "Ambas",
    type: "Tipo",
    public: "Publica",
    private: "Privada",
    subnetLabel: (subnetType: string, index: number) =>
      `Subred ${subnetType} ${index}`,
    comingSoon: "Proximamente",
    fieldsUnavailable:
      "Los campos de configuracion para este servicio todavia no estan disponibles.",
    position: "Posicion",
    clickNodeDetails: "Selecciona un nodo o conexion para ver sus detalles.",
    user: "Usuario",
    searchPlaceholder: "Buscar servicios de AWS...",
    clearSearch: "Limpiar busqueda",
    availabilityZone: "AZ",
    numberOfAZs: "Zonas de Disponibilidad",
    numberOfVPCs: "VPCs",
    numberOfSubnets: "Subredes",
    syncAzs: "Sincronizar AZs",
  },
} as const;

const CATEGORY_LABELS: Record<Locale, Record<AwsCategory, string>> = {
  en: {
    Compute: "Compute",
    Storage: "Storage",
    Database: "Database",
    Networking: "Networking",
    Security: "Security",
    Analytics: "Analytics",
    "ML/AI": "ML/AI",
    "Developer Tools": "Developer Tools",
    Management: "Management",
    Messaging: "Messaging",
  },
  es: {
    Compute: "Computo",
    Storage: "Almacenamiento",
    Database: "Bases de datos",
    Networking: "Redes",
    Security: "Seguridad",
    Analytics: "Analitica",
    "ML/AI": "ML/IA",
    "Developer Tools": "Herramientas de desarrollo",
    Management: "Administracion",
    Messaging: "Mensajeria",
  },
};

const EN_SERVICE_DESCRIPTIONS: Record<string, string> = {
  ec2: "Scalable virtual servers for running applications in the cloud.",
  lambda: "Runs code without managing servers, responding to events on demand.",
  ecs: "Orchestrates and runs Docker containers on managed infrastructure or EC2.",
  eks: "Managed service for running Kubernetes clusters on AWS.",
  fargate: "Runs containers without provisioning or managing servers.",
  "elastic-beanstalk":
    "Deploys and scales web applications while automatically managing infrastructure.",
  batch: "Schedules and runs batch jobs at any scale on AWS.",
  lightsail:
    "Provides simple virtual servers, storage, and networking with predictable pricing.",
  "app-runner":
    "Builds and runs containerized web applications and APIs without managing infrastructure.",
  outposts: "Extends AWS infrastructure and services to on-premises locations.",
  s3: "Scalable object storage for data, static sites, and backups.",
  ebs: "Persistent block storage volumes for EC2 instances.",
  efs: "Managed, elastic shared file system for Linux workloads.",
  fsx: "Managed file systems for Windows, Lustre, NetApp ONTAP, and OpenZFS.",
  "storage-gateway":
    "Connects on-premises environments to AWS cloud storage through gateways.",
  backup:
    "Centralizes and automates backups for AWS resources and applications.",
  "s3-glacier":
    "Low-cost S3 storage classes for archive and long-term retention.",
  rds: "Managed relational database for engines such as MySQL, PostgreSQL, and SQL Server.",
  dynamodb:
    "Serverless key-value and document NoSQL database with low latency.",
  aurora:
    "AWS-optimized relational database compatible with MySQL and PostgreSQL.",
  elasticache:
    "Managed in-memory cache compatible with Redis, Valkey, and Memcached.",
  redshift: "Cloud data warehouse for SQL analytics over large data volumes.",
  documentdb: "Managed document database compatible with MongoDB workloads.",
  neptune: "Managed graph database for highly connected relationships.",
  keyspaces: "Serverless, managed database compatible with Apache Cassandra.",
  qldb: "Managed ledger with cryptographically verifiable and immutable history.",
  timestream: "Serverless database for IoT and operations time series.",
  vpc: "Isolated virtual network for launching and connecting AWS resources.",
  cloudfront: "Global CDN that delivers content and APIs with low latency.",
  route53: "Scalable DNS service with domain registration and traffic routing.",
  "api-gateway":
    "Creates, publishes, protects, and monitors REST, HTTP, and WebSocket APIs.",
  "direct-connect":
    "Dedicated network connection between your facilities and AWS.",
  "transit-gateway":
    "Managed hub for connecting VPCs and on-premises networks at scale.",
  "app-mesh":
    "Service mesh for controlling and observing communication between microservices.",
  "global-accelerator":
    "Improves availability and performance using the AWS global network.",
  privatelink:
    "Private access to services across VPCs without exposing traffic to the internet.",
  elb: "Distributes incoming traffic across multiple targets for high availability.",
  iam: "Manages identities, permissions, and access to AWS resources.",
  cognito: "Adds sign-up, sign-in, and access control for app users.",
  acm: "Provisions, manages, and renews TLS certificates for AWS services.",
  shield: "Managed protection against DDoS attacks for applications on AWS.",
  waf: "Web application firewall for filtering malicious HTTP traffic.",
  kms: "Creates and controls cryptographic keys for encrypting data on AWS.",
  "secrets-manager":
    "Stores, rotates, and retrieves secrets such as credentials and API keys.",
  guardduty:
    "Detects threats by analyzing AWS account, workload, and data activity.",
  "security-hub":
    "Centralizes findings and security posture across AWS accounts and services.",
  inspector:
    "Automatically scans workloads, containers, and functions for vulnerabilities.",
  macie: "Discovers and protects sensitive data, especially in Amazon S3.",
  athena: "Queries data in S3 with SQL without managing servers.",
  emr: "Runs managed big data frameworks such as Spark, Hive, and Presto.",
  kinesis: "Ingests, processes, and analyzes real-time streaming data.",
  glue: "Serverless data integration for cataloging, preparing, and moving data.",
  quicksight:
    "Managed business intelligence for dashboards, visualizations, and embedded analytics.",
  "lake-formation":
    "Creates, secures, and manages data lakes on AWS with centralized governance.",
  msk: "Managed service for running Apache Kafka-compatible workloads on AWS.",
  opensearch:
    "Search, log analytics, and observability using managed OpenSearch.",
  "data-exchange": "Finds, subscribes to, and uses third-party data on AWS.",
  "clean-rooms":
    "Collaborates and analyzes data across organizations without sharing raw data.",
  sagemaker:
    "Platform for building, training, and deploying machine learning models.",
  rekognition:
    "Analyzes images and videos to detect objects, text, faces, and content.",
  polly: "Converts text into natural-sounding speech.",
  transcribe: "Converts audio into text with automatic speech recognition.",
  translate: "Neural machine translation for text across languages.",
  lex: "Builds voice and text conversational interfaces for applications.",
  comprehend:
    "Extracts entities, sentiment, language, and topics from text with NLP.",
  bedrock: "Builds generative AI applications using managed foundation models.",
  kendra:
    "Intelligent enterprise search across documents and corporate data sources.",
  forecast: "Generates time-series forecasts with managed machine learning.",
  codecommit: "Managed private Git repository for hosting source code.",
  codebuild: "Builds, tests, and packages code in a managed build service.",
  codedeploy:
    "Automates application deployments to EC2, Lambda, and on-premises servers.",
  codepipeline:
    "Orchestrates continuous delivery pipelines for software changes.",
  cloud9: "Browser-based cloud IDE with terminal and development tools.",
  xray: "Traces distributed requests to analyze and debug applications.",
  cloudshell: "Browser-based shell with AWS CLI and preconfigured credentials.",
  cloudwatch:
    "Monitors metrics, logs, events, and alarms for resources and applications.",
  cloudformation: "Models and provisions AWS infrastructure as code.",
  "systems-manager":
    "Manages operations, configuration, and automation of resources at scale.",
  config:
    "Records resource configurations and evaluates compliance against rules.",
  cloudtrail:
    "Records account activity and API calls for auditing and security.",
  organizations:
    "Manages multiple AWS accounts with centralized policies and billing.",
  "control-tower":
    "Sets up and governs multi-account AWS environments using best practices.",
  "service-catalog":
    "Creates and distributes approved catalogs of cloud products and resources.",
  sqs: "Managed message queues for decoupling and scaling components.",
  sns: "Managed pub/sub messaging for notifications and event fanout.",
  eventbridge:
    "Serverless event bus for connecting applications, SaaS, and AWS services.",
  "step-functions":
    "Orchestrates visual workflows that coordinate services and tasks.",
  ses: "Scalable service for sending and receiving email.",
  pinpoint: "Manages multichannel communications and targeted user campaigns.",
  appsync: "Creates managed GraphQL APIs with real-time and offline data.",
};

const ES_FIELD_TRANSLATIONS: Record<string, FieldTranslations> = {
  ec2: {
    instanceType: { label: "Tipo de instancia" },
    amiId: { label: "ID de AMI" },
  },
  lambda: {
    functionName: { label: "Nombre de funcion", placeholder: "mi-funcion" },
    runtime: { label: "Runtime" },
  },
  ecs: {
    clusterName: { label: "Nombre del cluster", placeholder: "mi-cluster" },
    launchType: {
      label: "Tipo de lanzamiento",
      options: { EXTERNAL: "Externo" },
    },
  },
  eks: {
    clusterName: { label: "Nombre del cluster", placeholder: "mi-cluster-eks" },
    kubernetesVersion: { label: "Version de Kubernetes" },
  },
  s3: {
    bucketName: { label: "Nombre del bucket", placeholder: "mi-bucket" },
    versioning: { label: "Versionado" },
  },
  ebs: {
    volumeType: {
      label: "Tipo de volumen",
      options: {
        gp3: "gp3 (SSD de proposito general)",
        gp2: "gp2 (SSD de proposito general)",
        io2: "io2 (SSD con IOPS provisionadas)",
        io1: "io1 (SSD con IOPS provisionadas)",
        st1: "st1 (HDD optimizado para throughput)",
        sc1: "sc1 (HDD frio)",
      },
    },
    sizeGiB: { label: "Tamano (GiB)" },
  },
  rds: {
    engine: { label: "Motor" },
    instanceClass: { label: "Clase de instancia" },
  },
  dynamodb: {
    tableName: { label: "Nombre de tabla", placeholder: "mi-tabla" },
    billingMode: {
      label: "Modo de facturacion",
      options: { PAY_PER_REQUEST: "Bajo demanda", PROVISIONED: "Provisionado" },
    },
  },
  aurora: {
    engine: { label: "Motor" },
    instanceClass: { label: "Clase de instancia" },
  },
  elasticache: {
    engine: { label: "Motor" },
    nodeType: { label: "Tipo de nodo" },
  },
  redshift: {
    clusterIdentifier: {
      label: "Identificador del cluster",
      placeholder: "mi-cluster-redshift",
    },
    nodeType: { label: "Tipo de nodo" },
  },
  vpc: {
    cidrBlock: { label: "Bloque CIDR" },
    region: {
      label: "Region",
      options: {
        "us-east-1": "EE.UU. Este (N. Virginia)",
        "us-east-2": "EE.UU. Este (Ohio)",
        "us-west-1": "EE.UU. Oeste (N. California)",
        "us-west-2": "EE.UU. Oeste (Oregon)",
        "eu-west-1": "Europa (Irlanda)",
        "eu-west-2": "Europa (Londres)",
        "eu-central-1": "Europa (Frankfurt)",
        "ap-southeast-1": "Asia Pacifico (Singapur)",
        "ap-southeast-2": "Asia Pacifico (Sydney)",
        "ap-northeast-1": "Asia Pacifico (Tokio)",
        "sa-east-1": "Sudamerica (Sao Paulo)",
      },
    },
  },
  cloudfront: {
    originDomain: { label: "Dominio de origen" },
    priceClass: {
      label: "Clase de precio",
      options: {
        PriceClass_100: "Clase de precio 100 (EE.UU., Canada, Europa)",
        PriceClass_200: "Clase de precio 200 (+ Asia, Africa)",
        PriceClass_All: "Todas las ubicaciones edge",
      },
    },
  },
  route53: {
    domainName: { label: "Nombre de dominio" },
    recordType: { label: "Tipo de registro" },
  },
  "api-gateway": {
    apiName: { label: "Nombre de API", placeholder: "mi-api" },
    stage: { label: "Stage" },
  },
  elb: {
    loadBalancerName: {
      label: "Nombre del balanceador",
      placeholder: "mi-balanceador",
    },
    scheme: {
      label: "Esquema",
      options: {
        "internet-facing": "Expuesto a internet",
        internal: "Interno",
      },
    },
  },
  iam: {
    roleName: { label: "Nombre del rol", placeholder: "mi-rol" },
    policyArn: { label: "ARN de politica" },
  },
  cognito: {
    userPoolName: {
      label: "Nombre del user pool",
      placeholder: "mi-user-pool",
    },
    mfaEnabled: { label: "MFA habilitado" },
  },
  "secrets-manager": {
    secretName: { label: "Nombre del secreto", placeholder: "mi-secreto" },
    rotationEnabled: { label: "Rotacion habilitada" },
  },
  cloudwatch: {
    logGroupName: { label: "Nombre del grupo de logs" },
    retentionDays: {
      label: "Retencion (dias)",
      options: {
        "1": "1 dia",
        "3": "3 dias",
        "7": "7 dias",
        "14": "14 dias",
        "30": "30 dias",
        "60": "60 dias",
        "90": "90 dias",
        "180": "180 dias",
        "365": "1 ano",
        "0": "No expira",
      },
    },
  },
  sns: {
    topicName: { label: "Nombre del topico", placeholder: "mi-topico" },
    type: { label: "Tipo" },
  },
  sqs: {
    queueName: { label: "Nombre de la cola", placeholder: "mi-cola" },
    type: { label: "Tipo" },
  },
  user: {
    label: { label: "Nombre", placeholder: "Usuario" },
  },
  region: {
    region: {
      label: "Region",
      options: {
        "us-east-1": "EE.UU. Este (N. Virginia)",
        "us-east-2": "EE.UU. Este (Ohio)",
        "us-west-1": "EE.UU. Oeste (N. California)",
        "us-west-2": "EE.UU. Oeste (Oregon)",
        "eu-west-1": "Europa (Irlanda)",
        "eu-west-2": "Europa (Londres)",
        "eu-central-1": "Europa (Frankfurt)",
        "ap-southeast-1": "Asia Pacifico (Singapur)",
        "ap-southeast-2": "Asia Pacifico (Sydney)",
        "ap-northeast-1": "Asia Pacifico (Tokio)",
        "sa-east-1": "Sudamerica (Sao Paulo)",
      },
    },
    numberOfAZs: { label: "Zonas de Disponibilidad" },
  },
};

export function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function getCategoryLabel(category: AwsCategory, locale: Locale) {
  return CATEGORY_LABELS[locale][category] ?? category;
}

export function getServiceDescription(
  service: AwsService | undefined,
  locale: Locale,
  fallback = "",
) {
  if (!service) {
    return fallback;
  }

  if (locale === "en") {
    return EN_SERVICE_DESCRIPTIONS[service.id] ?? service.description;
  }

  return service.description;
}

export function getLocalizedField(
  serviceId: string,
  field: ServiceField,
  locale: Locale,
): ServiceField {
  if (locale === "en") {
    return field;
  }

  const translation = ES_FIELD_TRANSLATIONS[serviceId]?.[field.key];

  return {
    ...field,
    label: translation?.label ?? field.label,
    placeholder: translation?.placeholder ?? field.placeholder,
    options: field.options?.map((option) => ({
      ...option,
      label: translation?.options?.[option.value] ?? option.label,
    })),
  };
}
