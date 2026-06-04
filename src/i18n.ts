import type { AwsCategory, AwsService } from "@/data/aws-services";
import type { ServiceField } from "@/data/aws-service-fields";
import { APP_TITLE } from "@/config/app";

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
    dragAndDrop: APP_TITLE,
    newTool: "New",
    newToolTooltip: "Clear the canvas and start from scratch",
    newToolMenuTitle: "Add node",
    newToolConfirmTitle: "Start from scratch?",
    newToolConfirmDescription:
      "This will remove all nodes and containers from the canvas. This action cannot be undone.",
    newToolConfirmAction: "Clear canvas",
    newToolConfirmCancel: "Cancel",
    addTool: (toolName: string) => `Add ${toolName}`,
    dragOrClickToAdd: "Drag onto the canvas or click to add it to the center.",
    clickToAdd: "Click to add it to the center of the canvas.",
    userDescription: "External actor or client that interacts with the system.",
    internet: "Internet",
    internetDescription: "Represents the public internet or external network.",
    regionDescription:
      "Top-level AWS Region container for VPCs and network scope.",
    subnetDescription: "Network segment inside a VPC or Availability Zone.",
    textDescription: "Plain text annotation for notes and labels.",
    subnet: "Subnet",
    text: "Text",
    dragSubnet: "Drag subnet",
    dragText: "Drag text",
    region: "Region",
    dragRegion: "Drag region",
    dragService: (serviceName: string) => `Drag ${serviceName}`,
    closeInspector: "Close inspector",
    openInspector: "Open inspector",
    appLogoAlt: `${APP_TITLE} logo`,
    emptyCanvasTitle: APP_TITLE,
    emptyCanvasDescription:
      "Build an AWS architecture by adding a Region, VPCs, subnets, and services from the tools panel.",
    noNodeSelected: "No node selected",
    edge: "Edge",
    label: "Label",
    arrows: "Arrows",
    sourceArrowToggle: "Toggle source arrow",
    targetArrowToggle: "Toggle target arrow",
    type: "Type",
    public: "Public",
    private: "Private",
    subnetLabel: (subnetType: string, index: number) =>
      `Subnet ${subnetType} ${index}`,
    comingSoon: "Coming Soon",
    fieldsUnavailable:
      "Configuration fields for this service are not available yet.",
    inspectorNoOptionsTitle: "No configurable options",
    inspectorNoOptionsDescription:
      "This node does not have editable settings in the inspector.",
    position: "Position",
    clickNodeDetails: "Click a node or edge to see its details.",
    user: "User",
    searchPlaceholder: "Search AWS services...",
    clearSearch: "Clear search",
    availabilityZone: "AZ",
    dragAz: "Drag AZ",
    azDescription: "Availability Zone container inside a VPC or Region.",
    asg: "Auto Scaling",
    dragAsg: "Drag Auto Scaling Group",
    asgDescription: "Auto Scaling Group container for groups of EC2 instances that scale automatically.",
    asgMinCapacity: "Min instances",
    asgDesiredCapacity: "Desired instances",
    asgMaxCapacity: "Max instances",
    asgScalingPolicyType: "Scaling policy",
    asgHealthCheckType: "Health check",
    asgCooldownSeconds: "Cooldown (seconds)",
    numberOfAZs: "Availability Zones",
    numberOfVPCs: "VPCs",
    numberOfSubnets: "Subnets",
    cidrBlock: "IP range (CIDR)",
    vpcCidrBlockPlaceholder: "10.0.0.0/16",
    subnetCidrBlockPlaceholder: "10.0.1.0/24",
    syncAzs: "Sync AZs",
    syncAzsBannerDescription:
      "When enabled, subnets and services added to the first AZ will be replicated across all sibling AZs in the VPC.",
    editNodeName: "Edit node name",
    editTextNode: "Edit text",
    textNodePlaceholder: "Text",
    textContent: "Text",
    textFontSize: "Text size",
    editProjectName: "Edit project name",
    defaultArchitectureName: "Untitled architecture",
    saveArchitecture: "Save",
    saveArchitectureTooltip: "Save architecture",
    saveArchitectureSaving: "Saving architecture...",
    saveArchitectureSaved: "Done",
    saveArchitectureSavedDescription:
      "Saved to your architecture drafts.",
    saveArchitectureFailed: "Could not save architecture",
    saveArchitectureFailedDescription:
      "Check that you are signed in and try again.",
    exportTooltip: "Export architecture",
    exportTerraform: "Terraform (.tf)",
    exportCloudFormation: "CloudFormation (.yaml)",
    exportDisclaimerTitle: "Before you export",
    exportDisclaimerDescription:
      "This file is an auto-generated scaffold based on your canvas. It is provided as a starting point only. You must review every resource, replace all REPLACE_ME placeholders, and validate the configuration thoroughly before applying it to any environment. The authors of this tool accept no responsibility for any infrastructure changes, costs, outages, or data loss that may result from using this output.",
    exportDisclaimerAction: "Download anyway",
    exportDisclaimerCancel: "Cancel",
    deleteArchitecture: "Delete",
    deleteArchitectureTooltip: "Delete project",
    deleteArchitectureDeleting: "Deleting project...",
    deleteArchitectureConfirmTitle: "Delete project?",
    deleteArchitectureConfirmDescription:
      "This will permanently delete the project and clear the current canvas. This action cannot be undone.",
    deleteArchitectureConfirmAction: "Delete project",
    deleteArchitectureConfirmCancel: "Cancel",
    deleteArchitectureDeleted: "Project deleted",
    deleteArchitectureDeletedDescription: "The project was deleted.",
    deleteArchitectureFailed: "Could not delete project",
    deleteArchitectureFailedDescription:
      "Check that you are signed in and try again.",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    authEmail: "Email",
    authPassword: "Password",
    authSignInTitle: "Sign in",
    authSignUpTitle: "Create an account",
    authGoogleSignIn: "Continue with Google",
    authSwitchToRegister: "Don't have an account? Create one",
    authSwitchToLogin: "Already have an account? Sign in",
    authSavePrompt: "Sign in to save",
    authSavePromptDescription:
      "Sign in or create an account to save your architectures.",
    authErrorInvalidCredentials: "Invalid email or password.",
    authErrorEmailInUse: "This email is already in use.",
    authErrorWeakPassword: "Password must be at least 6 characters.",
    authErrorInvalidEmail: "Please enter a valid email address.",
    authErrorProviderDisabled:
      "This sign-in method is not enabled.",
    authErrorGeneric: "Something went wrong. Please try again.",
    authSignedInAs: "Signed in as",
    savedProjects: "Saved projects",
    savedProjectsEmpty: "No saved architectures yet.",
    savedProjectsError: "Could not load projects.",
    loadProject: "Load",
  },
  es: {
    dragAndDrop: APP_TITLE,
    newTool: "Nuevo",
    newToolTooltip: "Limpiar el lienzo y empezar desde cero",
    newToolMenuTitle: "Agregar nodo",
    newToolConfirmTitle: "¿Empezar desde cero?",
    newToolConfirmDescription:
      "Esto eliminará todos los nodos y contenedores del lienzo. Esta acción no se puede deshacer.",
    newToolConfirmAction: "Limpiar lienzo",
    newToolConfirmCancel: "Cancelar",
    addTool: (toolName: string) => `Agregar ${toolName}`,
    dragOrClickToAdd:
      "Arrástralo al lienzo o haz click para agregarlo al centro.",
    clickToAdd: "Haz click para agregarlo al centro del lienzo.",
    userDescription: "Actor externo o cliente que interactúa con el sistema.",
    internet: "Internet",
    internetDescription: "Representa el internet público o una red externa.",
    regionDescription:
      "Contenedor principal de Región AWS para VPCs y alcance de red.",
    subnetDescription:
      "Segmento de red dentro de una VPC o Zona de Disponibilidad.",
    textDescription: "Anotación de texto plano para notas y etiquetas.",
    subnet: "Subred",
    text: "Texto",
    dragSubnet: "Arrastrar subred",
    dragText: "Arrastrar texto",
    region: "Región",
    dragRegion: "Arrastrar región",
    dragService: (serviceName: string) => `Arrastrar ${serviceName}`,
    closeInspector: "Cerrar inspector",
    openInspector: "Abrir inspector",
    appLogoAlt: `Logo de ${APP_TITLE}`,
    emptyCanvasTitle: APP_TITLE,
    emptyCanvasDescription:
      "Diseña una arquitectura AWS agregando una Región, VPCs, subredes y servicios desde el panel de herramientas.",
    noNodeSelected: "Ningún nodo seleccionado",
    edge: "Conexión",
    label: "Etiqueta",
    arrows: "Puntas",
    sourceArrowToggle: "Activar punta de origen",
    targetArrowToggle: "Activar punta de destino",
    type: "Tipo",
    public: "Pública",
    private: "Privada",
    subnetLabel: (subnetType: string, index: number) =>
      `Subred ${subnetType} ${index}`,
    comingSoon: "Próximamente",
    fieldsUnavailable:
      "Los campos de configuración para este servicio todavía no están disponibles.",
    inspectorNoOptionsTitle: "Sin opciones configurables",
    inspectorNoOptionsDescription:
      "Este nodo no tiene ajustes editables en el inspector.",
    position: "Posición",
    clickNodeDetails: "Selecciona un nodo o conexión para ver sus detalles.",
    user: "Usuario",
    searchPlaceholder: "Buscar servicios de AWS...",
    clearSearch: "Limpiar búsqueda",
    availabilityZone: "AZ",
    dragAz: "Arrastrar AZ",
    azDescription: "Zona de Disponibilidad dentro de una VPC o Región.",
    asg: "Auto Scaling",
    dragAsg: "Arrastrar Auto Scaling Group",
    asgDescription: "Contenedor de Auto Scaling Group para grupos de instancias EC2 que escalan automáticamente.",
    asgMinCapacity: "Instancias mínimas",
    asgDesiredCapacity: "Instancias deseadas",
    asgMaxCapacity: "Instancias máximas",
    asgScalingPolicyType: "Política de escalado",
    asgHealthCheckType: "Health check",
    asgCooldownSeconds: "Cooldown (segundos)",
    numberOfAZs: "Zonas de Disponibilidad",
    numberOfVPCs: "VPCs",
    numberOfSubnets: "Subredes",
    cidrBlock: "Rango de IPs (CIDR)",
    vpcCidrBlockPlaceholder: "10.0.0.0/16",
    subnetCidrBlockPlaceholder: "10.0.1.0/24",
    syncAzs: "Sincronizar AZs",
    syncAzsBannerDescription:
      "Cuando está activo, las subredes y servicios agregados a la primera AZ se replicarán en todas las AZs hermanas de la VPC.",
    editNodeName: "Editar nombre del nodo",
    editTextNode: "Editar texto",
    textNodePlaceholder: "Texto",
    textContent: "Texto",
    textFontSize: "Tamaño del texto",
    editProjectName: "Editar nombre del proyecto",
    defaultArchitectureName: "Arquitectura sin nombre",
    saveArchitecture: "Guardar",
    saveArchitectureTooltip: "Guardar arquitectura",
    saveArchitectureSaving: "Guardando arquitectura...",
    saveArchitectureSaved: "Listo",
    saveArchitectureSavedDescription:
      "Se guardó en tus borradores de arquitectura.",
    saveArchitectureFailed: "No se pudo guardar la arquitectura",
    saveArchitectureFailedDescription:
      "Verifica que hayas iniciado sesión e intenta de nuevo.",
    exportTooltip: "Exportar arquitectura",
    exportTerraform: "Terraform (.tf)",
    exportCloudFormation: "CloudFormation (.yaml)",
    exportDisclaimerTitle: "Antes de exportar",
    exportDisclaimerDescription:
      "Este archivo es un esqueleto generado automáticamente a partir del lienzo. Se provee como punto de partida únicamente. Debes revisar cada recurso, reemplazar todos los valores REPLACE_ME, y validar la configuración exhaustivamente antes de aplicarla a cualquier entorno. Los autores de esta herramienta no se hacen responsables de ningún cambio de infraestructura, costos, interrupciones o pérdida de datos que pueda resultar del uso de este archivo.",
    exportDisclaimerAction: "Descargar de todas formas",
    exportDisclaimerCancel: "Cancelar",
    deleteArchitecture: "Borrar",
    deleteArchitectureTooltip: "Borrar proyecto",
    deleteArchitectureDeleting: "Borrando proyecto...",
    deleteArchitectureConfirmTitle: "¿Borrar proyecto?",
    deleteArchitectureConfirmDescription:
      "Se borrará permanentemente el proyecto y limpiará el lienzo actual. Esta acción es irreversible.",
    deleteArchitectureConfirmAction: "Borrar proyecto",
    deleteArchitectureConfirmCancel: "Cancelar",
    deleteArchitectureDeleted: "Proyecto borrado",
    deleteArchitectureDeletedDescription: "El proyecto se eliminó.",
    deleteArchitectureFailed: "No se pudo borrar el proyecto",
    deleteArchitectureFailedDescription:
      "Verifica que hayas iniciado sesión e intenta de nuevo.",
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",
    authEmail: "Email",
    authPassword: "Contraseña",
    authSignInTitle: "Iniciar sesión",
    authSignUpTitle: "Crear una cuenta",
    authGoogleSignIn: "Continuar con Google",
    authSwitchToRegister: "¿No tienes cuenta? Crea una",
    authSwitchToLogin: "¿Ya tienes cuenta? Inicia sesión",
    authSavePrompt: "Inicia sesión para guardar",
    authSavePromptDescription:
      "Inicia sesión o crea una cuenta para guardar tus arquitecturas.",
    authErrorInvalidCredentials: "Email o contraseña incorrectos.",
    authErrorEmailInUse: "Este email ya está en uso.",
    authErrorWeakPassword: "La contraseña debe tener al menos 6 caracteres.",
    authErrorInvalidEmail: "Por favor ingresa un email válido.",
    authErrorProviderDisabled:
      "Este método de inicio de sesión no está habilitado.",
    authErrorGeneric: "Algo salió mal. Por favor intenta de nuevo.",
    authSignedInAs: "Sesión iniciada como",
    savedProjects: "Proyectos guardados",
    savedProjectsEmpty: "Aún no tienes arquitecturas guardadas.",
    savedProjectsError: "No se pudieron cargar los proyectos.",
    loadProject: "Cargar",
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
    Compute: "Cómputo",
    Storage: "Almacenamiento",
    Database: "Bases de datos",
    Networking: "Redes",
    Security: "Seguridad",
    Analytics: "Analítica",
    "ML/AI": "ML/IA",
    "Developer Tools": "Herramientas de desarrollo",
    Management: "Administración",
    Messaging: "Mensajería",
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
  "internet-gateway": "Enables communication between instances in a VPC and the internet.",
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

const ES_FIELD_KEY_TRANSLATIONS: FieldTranslations = {
  acceleratorName: { label: "Nombre del acelerador" },
  acceleratorType: { label: "Tipo de acelerador" },
  analysisRuleType: { label: "Tipo de regla de análisis" },
  apiName: { label: "Nombre de API", placeholder: "mi-api" },
  apiType: { label: "Tipo de API" },
  applicationName: { label: "Nombre de aplicación", placeholder: "mi-app" },
  archiveEnabled: { label: "Archivo habilitado" },
  assetType: { label: "Tipo de activo" },
  amiId: { label: "ID de AMI" },
  authType: { label: "Tipo de autenticación" },
  autoAcceptAttachments: { label: "Autoaceptar attachments" },
  autoscalingEnabled: { label: "Autoescalado" },
  backupPlanName: { label: "Nombre del plan de backup" },
  backupRetentionDays: { label: "Retención de backup (días)" },
  billingMode: {
    label: "Modo de facturación",
    options: { PAY_PER_REQUEST: "Bajo demanda", PROVISIONED: "Provisionado" },
  },
  botName: { label: "Nombre del bot" },
  brokerCount: { label: "Cantidad de brokers" },
  brokerInstanceType: { label: "Tipo de instancia del broker" },
  bucketName: { label: "Nombre del bucket", placeholder: "mi-bucket" },
  buildImage: { label: "Imagen de build" },
  bundleId: { label: "Bundle" },
  capacityMode: { label: "Modo de capacidad" },
  certificateType: { label: "Tipo de certificado" },
  channelType: { label: "Tipo de canal" },
  cidrBlock: { label: "Bloque CIDR" },
  clusterIdentifier: { label: "Identificador del cluster" },
  clusterName: { label: "Nombre del cluster", placeholder: "mi-cluster" },
  collaborationName: { label: "Nombre de colaboración" },
  computeEnvironmentName: { label: "Nombre del entorno de cómputo" },
  computePlatform: { label: "Plataforma de cómputo" },
  computeType: { label: "Tipo de cómputo" },
  connectionName: { label: "Nombre de conexión" },
  connectionSpeed: { label: "Velocidad de conexión" },
  containerImage: { label: "Imagen de contenedor" },
  continuousScanning: { label: "Escaneo continuo" },
  cpu: { label: "Unidades de CPU" },
  crossAccountSharing: { label: "Compartir entre cuentas" },
  crossRegionCopy: { label: "Copia cross-region" },
  dashboardName: { label: "Nombre del dashboard" },
  databaseName: { label: "Nombre de base de datos" },
  dataCatalogName: { label: "Nombre del catálogo de datos" },
  dataLakeName: { label: "Nombre del data lake" },
  dataSetName: { label: "Nombre del dataset" },
  datasetGroupName: { label: "Nombre del grupo de datasets" },
  deadLetterQueueEnabled: { label: "DLQ habilitada" },
  defaultAction: { label: "Acción por defecto" },
  defaultRouteTableAssociation: {
    label: "Asociación por defecto a tabla de rutas",
  },
  deletionProtection: { label: "Protección contra eliminación" },
  deploymentModel: { label: "Modelo de despliegue" },
  deploymentType: { label: "Tipo de despliegue" },
  desiredCount: { label: "Cantidad deseada" },
  dkimEnabled: { label: "DKIM habilitado" },
  documentType: { label: "Tipo de documento" },
  domainName: { label: "Nombre de dominio" },
  edition: { label: "Edición" },
  eksProtectionEnabled: { label: "Protección de EKS habilitada" },
  emailIdentityType: { label: "Tipo de identidad de email" },
  enabled: { label: "Habilitado" },
  encryptionEnabled: { label: "Cifrado habilitado" },
  endpointAccess: { label: "Acceso al endpoint" },
  endpointServiceName: { label: "Nombre del servicio de endpoint" },
  endpointType: { label: "Tipo de endpoint" },
  engine: { label: "Motor" },
  engineVersion: { label: "Versión del motor" },
  environment: {
    label: "Entorno",
    options: { dev: "Desarrollo", staging: "Staging", prod: "Producción" },
  },
  environmentName: { label: "Nombre del entorno" },
  environmentType: { label: "Tipo de entorno" },
  eventBusName: { label: "Nombre del bus de eventos" },
  eventSource: { label: "Origen de eventos" },
  feature: { label: "Característica" },
  fileSystemName: { label: "Nombre del sistema de archivos" },
  fileSystemType: { label: "Tipo de sistema de archivos" },
  findingExportEnabled: { label: "Exportación de hallazgos habilitada" },
  forecastFrequency: { label: "Frecuencia de pronóstico" },
  framework: { label: "Framework" },
  functionName: { label: "Nombre de función", placeholder: "mi-funcion" },
  gatewayName: { label: "Nombre del gateway" },
  gatewayType: { label: "Tipo de gateway" },
  governedTablesEnabled: { label: "Tablas gobernadas habilitadas" },
  groupName: { label: "Nombre del grupo" },
  guardrailsEnabled: { label: "Guardrails habilitados" },
  hostedUiEnabled: { label: "Hosted UI habilitada" },
  identityName: { label: "Nombre de identidad" },
  indexName: { label: "Nombre del índice" },
  instanceClass: { label: "Clase de instancia" },
  instanceCount: { label: "Cantidad de instancias" },
  instanceName: { label: "Nombre de instancia" },
  instanceType: { label: "Tipo de instancia" },
  iops: { label: "IOPS" },
  jobName: { label: "Nombre del job" },
  jobType: { label: "Tipo de job" },
  keyAlias: { label: "Alias de clave" },
  keyspaceName: { label: "Nombre del keyspace" },
  keySpec: { label: "Especificación de clave" },
  keyUsage: { label: "Uso de clave" },
  kubernetesVersion: { label: "Versión de Kubernetes" },
  label: { label: "Nombre", placeholder: "Usuario" },
  landingZoneName: { label: "Nombre de landing zone" },
  languageCode: { label: "Código de idioma" },
  launchType: {
    label: "Tipo de lanzamiento",
    options: { EXTERNAL: "Externo" },
  },
  ledgerName: { label: "Nombre del ledger" },
  lifecyclePolicy: { label: "Política de ciclo de vida" },
  listenerProtocol: { label: "Protocolo del listener" },
  loadBalancerName: { label: "Nombre del balanceador" },
  loadBalancerType: { label: "Tipo de balanceador" },
  logGroupName: { label: "Nombre del grupo de logs" },
  loggingEnabled: { label: "Logs habilitados" },
  magneticStoreRetentionDays: {
    label: "Retención en magnetic store (días)",
  },
  maxCapacity: { label: "Capacidad máxima" },
  maxVcpus: { label: "vCPUs máximas" },
  memoryMiB: { label: "Memoria (MiB)" },
  memoryStoreRetentionHours: {
    label: "Retención en memory store (horas)",
  },
  meshName: { label: "Nombre del mesh" },
  mfaEnabled: { label: "MFA habilitado" },
  minCapacity: { label: "Capacidad mínima" },
  modelId: { label: "ID de modelo" },
  modelProvider: { label: "Proveedor de modelo" },
  multiAz: { label: "Multi-AZ" },
  nodeCount: { label: "Cantidad de nodos" },
  nodeType: { label: "Tipo de nodo" },
  numberOfAZs: { label: "Zonas de Disponibilidad" },
  organizationalUnitName: { label: "Nombre de unidad organizacional" },
  originDomain: { label: "Dominio de origen" },
  outpostName: { label: "Nombre del Outpost" },
  outputFormat: { label: "Formato de salida" },
  outputLocation: { label: "Ubicación de salida" },
  performanceMode: { label: "Modo de performance" },
  pipelineName: { label: "Nombre del pipeline" },
  pipelineType: { label: "Tipo de pipeline" },
  platform: { label: "Plataforma" },
  pointInTimeRecovery: { label: "Recuperación point-in-time" },
  policyArn: { label: "ARN de política" },
  portfolioName: { label: "Nombre del portfolio" },
  priceClass: {
    label: "Clase de precio",
    options: {
      PriceClass_100: "Clase de precio 100 (EE.UU., Canadá, Europa)",
      PriceClass_200: "Clase de precio 200 (+ Asia, África)",
      PriceClass_All: "Todas las ubicaciones edge",
    },
  },
  productName: { label: "Nombre de producto" },
  projectName: { label: "Nombre del proyecto" },
  protectionLevel: { label: "Nivel de protección" },
  protocol: { label: "Protocolo" },
  publicAccess: { label: "Acceso público" },
  purchaseOption: {
    label: "Opción de compra",
    options: {
      "on-demand": "On-Demand",
      spot: "Spot",
      "savings-plan": "Savings Plan",
      reserved: "Reservada",
    },
  },
  queryEngine: { label: "Motor de consultas" },
  queueName: { label: "Nombre de la cola", placeholder: "mi-cola" },
  recordType: { label: "Tipo de registro" },
  recordingEnabled: { label: "Grabación habilitada" },
  region: {
    label: "Región",
    options: {
      "us-east-1": "EE.UU. Este (N. Virginia)",
      "us-east-2": "EE.UU. Este (Ohio)",
      "us-west-1": "EE.UU. Oeste (N. California)",
      "us-west-2": "EE.UU. Oeste (Oregon)",
      "eu-west-1": "Europa (Irlanda)",
      "eu-west-2": "Europa (Londres)",
      "eu-central-1": "Europa (Frankfurt)",
      "ap-southeast-1": "Asia Pacífico (Singapur)",
      "ap-southeast-2": "Asia Pacífico (Sydney)",
      "ap-northeast-1": "Asia Pacífico (Tokio)",
      "sa-east-1": "Sudamérica (São Paulo)",
    },
  },
  releaseLabel: { label: "Release" },
  repositoryName: { label: "Nombre del repositorio" },
  retentionDays: {
    label: "Retención (días)",
    options: {
      "1": "1 día",
      "3": "3 días",
      "5": "5 días",
      "7": "7 días",
      "14": "14 días",
      "30": "30 días",
      "60": "60 días",
      "90": "90 días",
      "120": "120 días",
      "180": "180 días",
      "365": "1 año",
      "400": "400 días",
      "545": "18 meses",
      "731": "2 años",
      "1827": "5 años",
      "3653": "10 años",
      "0": "No expira",
    },
  },
  retrievalTier: { label: "Nivel de recuperación" },
  roleName: { label: "Nombre del rol", placeholder: "mi-rol" },
  rotationEnabled: { label: "Rotación habilitada" },
  routingPolicy: { label: "Política de ruteo" },
  ruleType: { label: "Tipo de regla" },
  runtime: { label: "Runtime" },
  s3ProtectionEnabled: { label: "Protección de S3 habilitada" },
  scanType: { label: "Tipo de escaneo" },
  scope: { label: "Alcance" },
  scheme: {
    label: "Esquema",
    options: {
      "internet-facing": "Expuesto a internet",
      internal: "Interno",
    },
  },
  secretName: { label: "Nombre del secreto", placeholder: "mi-secreto" },
  securityStandardsEnabled: { label: "Estándares de seguridad habilitados" },
  serviceControlPoliciesEnabled: {
    label: "SCPs habilitadas",
  },
  serviceName: { label: "Nombre del servicio" },
  sensitiveDataDiscovery: { label: "Descubrimiento de datos sensibles" },
  shardCount: { label: "Cantidad de shards" },
  shellType: { label: "Tipo de shell" },
  sizeGiB: { label: "Tamaño (GiB)" },
  sourceLanguageCode: { label: "Idioma de origen" },
  sourceType: { label: "Tipo de origen" },
  stackName: { label: "Nombre del stack" },
  stage: { label: "Stage" },
  standardsEnabled: { label: "Estándares de seguridad habilitados" },
  stateMachineName: { label: "Nombre de state machine" },
  storageCapacityGiB: { label: "Capacidad de almacenamiento (GiB)" },
  storageClass: { label: "Clase de almacenamiento" },
  streamMode: { label: "Modo del stream" },
  streamName: { label: "Nombre del stream" },
  tableName: { label: "Nombre de tabla", placeholder: "mi-tabla" },
  tags: { label: "Tags", placeholder: "owner=plataforma, app=checkout" },
  targetLanguageCode: { label: "Idioma de destino" },
  templateFormat: { label: "Formato del template" },
  throughputMbps: { label: "Throughput (MB/s)" },
  throughputMode: { label: "Modo de throughput" },
  timeoutSeconds: { label: "Timeout (segundos)" },
  topicName: { label: "Nombre del tópico", placeholder: "mi-topico" },
  traceSamplingRate: { label: "Tasa de muestreo de trazas (%)" },
  trailName: { label: "Nombre del trail" },
  trailType: { label: "Tipo de trail" },
  type: { label: "Tipo" },
  userPoolName: { label: "Nombre del user pool" },
  validationMethod: { label: "Método de validación" },
  vaultName: { label: "Nombre del vault" },
  versioning: { label: "Versionado" },
  viewerProtocolPolicy: { label: "Política de protocolo del viewer" },
  virtualInterfaceType: { label: "Tipo de interfaz virtual" },
  voiceId: { label: "Voz" },
  volumeType: {
    label: "Tipo de volumen",
    options: {
      gp3: "gp3 (SSD de propósito general)",
      gp2: "gp2 (SSD de propósito general)",
      io2: "io2 (SSD con IOPS provisionadas)",
      io1: "io1 (SSD con IOPS provisionadas)",
      st1: "st1 (HDD optimizado para throughput)",
      sc1: "sc1 (HDD frío)",
    },
  },
  webAclName: { label: "Nombre de Web ACL" },
  workflowType: { label: "Tipo de workflow" },
  workloadType: { label: "Tipo de workload" },
  workgroupName: { label: "Nombre del workgroup" },
};

const ES_FIELD_TRANSLATIONS: Record<string, FieldTranslations> = {
  ec2: {
    instanceType: { label: "Tipo de instancia" },
    amiId: { label: "ID de AMI" },
  },
  lambda: {
    functionName: { label: "Nombre de función", placeholder: "mi-funcion" },
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
    kubernetesVersion: { label: "Versión de Kubernetes" },
  },
  s3: {
    bucketName: { label: "Nombre del bucket", placeholder: "mi-bucket" },
    versioning: { label: "Versionado" },
  },
  ebs: {
    volumeType: {
      label: "Tipo de volumen",
      options: {
        gp3: "gp3 (SSD de propósito general)",
        gp2: "gp2 (SSD de propósito general)",
        io2: "io2 (SSD con IOPS provisionadas)",
        io1: "io1 (SSD con IOPS provisionadas)",
        st1: "st1 (HDD optimizado para throughput)",
        sc1: "sc1 (HDD frío)",
      },
    },
    sizeGiB: { label: "Tamaño (GiB)" },
  },
  rds: {
    engine: { label: "Motor" },
    instanceClass: { label: "Clase de instancia" },
  },
  dynamodb: {
    tableName: { label: "Nombre de tabla", placeholder: "mi-tabla" },
    billingMode: {
      label: "Modo de facturación",
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
      label: "Región",
      options: {
        "us-east-1": "EE.UU. Este (N. Virginia)",
        "us-east-2": "EE.UU. Este (Ohio)",
        "us-west-1": "EE.UU. Oeste (N. California)",
        "us-west-2": "EE.UU. Oeste (Oregon)",
        "eu-west-1": "Europa (Irlanda)",
        "eu-west-2": "Europa (Londres)",
        "eu-central-1": "Europa (Frankfurt)",
        "ap-southeast-1": "Asia Pacífico (Singapur)",
        "ap-southeast-2": "Asia Pacífico (Sydney)",
        "ap-northeast-1": "Asia Pacífico (Tokio)",
        "sa-east-1": "Sudamérica (São Paulo)",
      },
    },
  },
  cloudfront: {
    originDomain: { label: "Dominio de origen" },
    priceClass: {
      label: "Clase de precio",
      options: {
        PriceClass_100: "Clase de precio 100 (EE.UU., Canadá, Europa)",
        PriceClass_200: "Clase de precio 200 (+ Asia, África)",
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
    policyArn: { label: "ARN de política" },
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
    rotationEnabled: { label: "Rotación habilitada" },
  },
  cloudwatch: {
    logGroupName: { label: "Nombre del grupo de logs" },
    retentionDays: {
      label: "Retención (días)",
      options: {
        "1": "1 día",
        "3": "3 días",
        "7": "7 días",
        "14": "14 días",
        "30": "30 días",
        "60": "60 días",
        "90": "90 días",
        "180": "180 días",
        "365": "1 año",
        "0": "No expira",
      },
    },
  },
  sns: {
    topicName: { label: "Nombre del tópico", placeholder: "mi-topico" },
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
      label: "Región",
      options: {
        "us-east-1": "EE.UU. Este (N. Virginia)",
        "us-east-2": "EE.UU. Este (Ohio)",
        "us-west-1": "EE.UU. Oeste (N. California)",
        "us-west-2": "EE.UU. Oeste (Oregon)",
        "eu-west-1": "Europa (Irlanda)",
        "eu-west-2": "Europa (Londres)",
        "eu-central-1": "Europa (Frankfurt)",
        "ap-southeast-1": "Asia Pacífico (Singapur)",
        "ap-southeast-2": "Asia Pacífico (Sydney)",
        "ap-northeast-1": "Asia Pacífico (Tokio)",
        "sa-east-1": "Sudamérica (São Paulo)",
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

  const genericTranslation = ES_FIELD_KEY_TRANSLATIONS[field.key];
  const translation = ES_FIELD_TRANSLATIONS[serviceId]?.[field.key];

  return {
    ...field,
    label: translation?.label ?? genericTranslation?.label ?? field.label,
    placeholder:
      translation?.placeholder ??
      genericTranslation?.placeholder ??
      field.placeholder,
    options: field.options?.map((option) => ({
      ...option,
      label:
        translation?.options?.[option.value] ??
        genericTranslation?.options?.[option.value] ??
        option.label,
    })),
  };
}
