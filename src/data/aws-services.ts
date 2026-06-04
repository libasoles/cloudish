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
  description: string;
  /** Hidden search terms: expanded acronyms or common aliases not present in name/description */
  aliases?: string;
}

const BASE = 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons';

export function getIconUrl(slug: string): string {
  return `${BASE}/${slug}/default.svg`;
}

export const AWS_SERVICES: AwsService[] = [
  // Compute
  { id: 'ec2', name: 'EC2', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-res-amazon-ec2-instance', description: 'Servidores virtuales escalables para ejecutar aplicaciones en la nube.', aliases: 'Elastic Compute Cloud instancia virtual' },
  { id: 'lambda', name: 'Lambda', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-lambda', description: 'Ejecuta codigo sin administrar servidores, respondiendo a eventos bajo demanda.' },
  { id: 'ecs', name: 'ECS', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-elastic-container-service', description: 'Orquesta y ejecuta contenedores Docker en infraestructura administrada o EC2.', aliases: 'Elastic Container Service' },
  { id: 'eks', name: 'EKS', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-elastic-kubernetes-service', description: 'Servicio administrado para ejecutar clusters de Kubernetes en AWS.', aliases: 'Elastic Kubernetes Service' },
  { id: 'fargate', name: 'Fargate', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-fargate', description: 'Ejecuta contenedores sin aprovisionar ni administrar servidores.' },
  { id: 'elastic-beanstalk', name: 'Elastic Beanstalk', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-elastic-beanstalk', description: 'Despliega y escala aplicaciones web administrando automaticamente la infraestructura.', aliases: 'EB PaaS' },
  { id: 'batch', name: 'Batch', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-batch', description: 'Planifica y ejecuta trabajos batch a cualquier escala en AWS.' },
  { id: 'lightsail', name: 'Lightsail', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-amazon-lightsail', description: 'Ofrece servidores virtuales, almacenamiento y redes simples con precios predecibles.' },
  { id: 'app-runner', name: 'App Runner', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-app-runner', description: 'Crea y ejecuta aplicaciones web y APIs contenerizadas sin administrar infraestructura.' },
  { id: 'outposts', name: 'Outposts', category: AWS_CATEGORIES.COMPUTE, slug: 'aws-aws-outposts', description: 'Extiende infraestructura y servicios de AWS a instalaciones locales.' },
  // Storage
  { id: 's3', name: 'S3', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-simple-storage-service', description: 'Almacenamiento de objetos escalable para datos, sitios estaticos y backups.', aliases: 'Simple Storage Service bucket objetos' },
  { id: 'ebs', name: 'EBS', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-elastic-block-store', description: 'Volumenes de almacenamiento en bloque persistente para instancias EC2.', aliases: 'Elastic Block Store volumen disco' },
  { id: 'efs', name: 'EFS', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-elastic-file-system', description: 'Sistema de archivos compartido, elastico y administrado para cargas Linux.', aliases: 'Elastic File System NFS' },
  { id: 'fsx', name: 'FSx', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-fsx', description: 'Sistemas de archivos administrados para Windows, Lustre, NetApp ONTAP y OpenZFS.', aliases: 'File System Windows Lustre' },
  { id: 'storage-gateway', name: 'Storage Gateway', category: AWS_CATEGORIES.STORAGE, slug: 'aws-aws-storage-gateway', description: 'Conecta entornos locales con almacenamiento cloud de AWS mediante gateways.', aliases: 'SGW hybrid' },
  { id: 'backup', name: 'Backup', category: AWS_CATEGORIES.STORAGE, slug: 'aws-aws-backup', description: 'Centraliza y automatiza backups de recursos y aplicaciones en AWS.' },
  { id: 's3-glacier', name: 'S3 Glacier', category: AWS_CATEGORIES.STORAGE, slug: 'aws-amazon-s3-glacier', description: 'Clases de almacenamiento S3 de bajo costo para archivo y retencion a largo plazo.', aliases: 'archivo cold storage' },
  // Database
  { id: 'rds', name: 'RDS', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-rds', description: 'Base de datos relacional administrada para motores como MySQL, PostgreSQL y SQL Server.', aliases: 'Relational Database Service MySQL PostgreSQL SQL Server' },
  { id: 'dynamodb', name: 'DynamoDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-dynamodb', description: 'Base de datos NoSQL serverless de clave-valor y documentos con baja latencia.' },
  { id: 'aurora', name: 'Aurora', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-aurora', description: 'Base relacional compatible con MySQL y PostgreSQL, optimizada para AWS.' },
  { id: 'elasticache', name: 'ElastiCache', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-elasticache', description: 'Cache en memoria administrado compatible con Redis, Valkey y Memcached.' },
  { id: 'redshift', name: 'Redshift', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-redshift', description: 'Data warehouse cloud para analitica SQL sobre grandes volumenes de datos.', aliases: 'data warehouse OLAP' },
  { id: 'documentdb', name: 'DocumentDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-documentdb', description: 'Base de datos de documentos administrada compatible con cargas de MongoDB.', aliases: 'MongoDB documento' },
  { id: 'neptune', name: 'Neptune', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-neptune', description: 'Base de datos de grafos administrada para relaciones altamente conectadas.', aliases: 'graph grafos' },
  { id: 'keyspaces', name: 'Keyspaces', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-keyspaces', description: 'Base de datos Apache Cassandra compatible, serverless y administrada.', aliases: 'Cassandra columnar' },
  { id: 'qldb', name: 'QLDB', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-quantum-ledger-database', description: 'Ledger administrado con historial criptograficamente verificable e inmutable.', aliases: 'Quantum Ledger Database ledger blockchain' },
  { id: 'timestream', name: 'Timestream', category: AWS_CATEGORIES.DATABASE, slug: 'aws-amazon-timestream', description: 'Base de datos serverless para series temporales de IoT y operaciones.', aliases: 'time series serie temporal' },
  // Networking
  { id: 'vpc', name: 'VPC', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-virtual-private-cloud', description: 'Red virtual aislada para lanzar y conectar recursos de AWS.', aliases: 'Virtual Private Cloud red virtual' },
  { id: 'cloudfront', name: 'CloudFront', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-cloudfront', description: 'CDN global que entrega contenido y APIs con baja latencia.', aliases: 'CF Content Delivery Network distribucion' },
  { id: 'route53', name: 'Route 53', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-route-53', description: 'Servicio DNS escalable con registro de dominios y enrutamiento de trafico.', aliases: 'R53 DNS dominio' },
  { id: 'api-gateway', name: 'API Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-amazon-api-gateway', description: 'Crea, publica, protege y monitorea APIs REST, HTTP y WebSocket.', aliases: 'APIGW REST HTTP WebSocket' },
  { id: 'direct-connect', name: 'Direct Connect', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-direct-connect', description: 'Conexion de red dedicada entre instalaciones propias y AWS.', aliases: 'DX conexion dedicada' },
  { id: 'transit-gateway', name: 'Transit Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-transit-gateway', description: 'Hub administrado para conectar VPCs y redes locales a escala.', aliases: 'TGW hub peering' },
  { id: 'app-mesh', name: 'App Mesh', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-app-mesh', description: 'Service mesh para controlar y observar comunicaciones entre microservicios.', aliases: 'service mesh sidecar Envoy' },
  { id: 'global-accelerator', name: 'Global Accelerator', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-global-accelerator', description: 'Mejora disponibilidad y rendimiento usando la red global de AWS.', aliases: 'GA anycast' },
  { id: 'privatelink', name: 'PrivateLink', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-aws-privatelink', description: 'Acceso privado a servicios entre VPCs sin exponer trafico a internet.', aliases: 'endpoint privado VPC endpoint' },
  { id: 'internet-gateway', name: 'Internet Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-res-amazon-vpc-internet-gateway', description: 'Permite comunicacion entre instancias en una VPC e internet.', aliases: 'IGW gateway internet' },
  { id: 'vpn-gateway', name: 'VPN Gateway', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-res-amazon-vpc-vpn-gateway', description: 'Gateway que conecta la VPC con redes locales mediante VPN sobre IPsec.', aliases: 'Virtual Private Network VPG VGW IPsec tunel' },
  { id: 'elb', name: 'ELB', category: AWS_CATEGORIES.NETWORKING, slug: 'aws-elastic-load-balancing', description: 'Distribuye trafico entrante entre multiples destinos para alta disponibilidad.', aliases: 'Elastic Load Balancing ALB NLB balanceador carga load balancer' },
  // Security
  { id: 'iam', name: 'IAM', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-identity-and-access-management', description: 'Administra identidades, permisos y acceso a recursos de AWS.', aliases: 'Identity and Access Management roles politicas permisos usuarios' },
  { id: 'cognito', name: 'Cognito', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-cognito', description: 'Agrega registro, inicio de sesion y control de acceso para usuarios de apps.', aliases: 'autenticacion usuarios login registro' },
  { id: 'acm', name: 'ACM', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-certificate-manager', description: 'Aprovisiona, administra y renueva certificados TLS para servicios de AWS.', aliases: 'Certificate Manager TLS SSL certificado HTTPS' },
  { id: 'shield', name: 'Shield', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-shield', description: 'Proteccion administrada contra ataques DDoS para aplicaciones en AWS.', aliases: 'DDoS proteccion ataque' },
  { id: 'waf', name: 'WAF', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-waf', description: 'Firewall de aplicaciones web para filtrar trafico HTTP malicioso.', aliases: 'Web Application Firewall firewall reglas HTTP' },
  { id: 'kms', name: 'KMS', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-key-management-service', description: 'Crea y controla claves criptograficas para cifrar datos en AWS.', aliases: 'Key Management Service cifrado encriptacion clave' },
  { id: 'secrets-manager', name: 'Secrets Manager', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-secrets-manager', description: 'Almacena, rota y recupera secretos como credenciales y claves de API.', aliases: 'secretos credenciales rotacion' },
  { id: 'guardduty', name: 'GuardDuty', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-guardduty', description: 'Detecta amenazas analizando actividad de cuentas, cargas y datos de AWS.', aliases: 'deteccion amenazas IDS' },
  { id: 'security-hub', name: 'Security Hub', category: AWS_CATEGORIES.SECURITY, slug: 'aws-aws-security-hub', description: 'Centraliza hallazgos y postura de seguridad de cuentas y servicios AWS.', aliases: 'SIEM hallazgos postura' },
  { id: 'inspector', name: 'Inspector', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-inspector', description: 'Escanea automaticamente vulnerabilidades en workloads, contenedores y funciones.', aliases: 'vulnerabilidades CVE escaneo' },
  { id: 'macie', name: 'Macie', category: AWS_CATEGORIES.SECURITY, slug: 'aws-amazon-macie', description: 'Descubre y protege datos sensibles, especialmente en Amazon S3.', aliases: 'datos sensibles PII DLP' },
  // Analytics
  { id: 'athena', name: 'Athena', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-athena', description: 'Consulta datos en S3 con SQL sin administrar servidores.', aliases: 'SQL serverless query S3' },
  { id: 'emr', name: 'EMR', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-emr', description: 'Ejecuta frameworks de big data como Spark, Hive y Presto administrados.', aliases: 'Elastic MapReduce Hadoop Spark big data' },
  { id: 'kinesis', name: 'Kinesis', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-kinesis', description: 'Ingiere, procesa y analiza datos de streaming en tiempo real.', aliases: 'streaming tiempo real firehose' },
  { id: 'glue', name: 'Glue', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-glue', description: 'Integracion de datos serverless para catalogar, preparar y mover datos.', aliases: 'ETL catalogo datos pipeline' },
  { id: 'quicksight', name: 'QuickSight', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-quicksight', description: 'Business intelligence administrado para dashboards, visualizaciones y analitica embebida.', aliases: 'BI Business Intelligence dashboard visualizacion' },
  { id: 'lake-formation', name: 'Lake Formation', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-lake-formation', description: 'Crea, protege y administra data lakes sobre AWS con gobierno centralizado.', aliases: 'data lake lago de datos gobierno' },
  { id: 'msk', name: 'MSK', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-managed-streaming-for-apache-kafka', description: 'Servicio administrado para ejecutar Apache Kafka compatible en AWS.', aliases: 'Managed Streaming Kafka broker' },
  { id: 'opensearch', name: 'OpenSearch', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-amazon-opensearch-service', description: 'Busqueda, analitica de logs y observabilidad usando OpenSearch administrado.', aliases: 'Elasticsearch busqueda logs Kibana' },
  { id: 'data-exchange', name: 'Data Exchange', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-data-exchange', description: 'Encuentra, suscribe y usa datos de terceros en AWS.' },
  { id: 'clean-rooms', name: 'Clean Rooms', category: AWS_CATEGORIES.ANALYTICS, slug: 'aws-aws-clean-rooms', description: 'Colabora y analiza datos entre organizaciones sin compartir datos sin procesar.', aliases: 'privacidad colaboracion datos' },
  // ML/AI
  { id: 'sagemaker', name: 'SageMaker', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-sagemaker', description: 'Plataforma para crear, entrenar y desplegar modelos de machine learning.', aliases: 'ML entrenamiento modelo AI' },
  { id: 'rekognition', name: 'Rekognition', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-rekognition', description: 'Analiza imagenes y videos para detectar objetos, texto, rostros y contenido.', aliases: 'vision por computadora reconocimiento imagen video' },
  { id: 'polly', name: 'Polly', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-polly', description: 'Convierte texto en voz natural mediante sintesis de habla.', aliases: 'TTS text to speech voz sintetizador' },
  { id: 'transcribe', name: 'Transcribe', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-transcribe', description: 'Convierte audio en texto con reconocimiento automatico del habla.', aliases: 'STT speech to text voz audio transcripcion' },
  { id: 'translate', name: 'Translate', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-translate', description: 'Traduccion automatica neuronal para texto entre idiomas.', aliases: 'traduccion idioma NLP' },
  { id: 'lex', name: 'Lex', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-lex', description: 'Construye interfaces conversacionales de voz y texto para aplicaciones.', aliases: 'chatbot NLU conversacional bot' },
  { id: 'comprehend', name: 'Comprehend', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-comprehend', description: 'Extrae entidades, sentimientos, idioma y temas desde texto con NLP.', aliases: 'NLP natural language processing sentimiento entidades texto' },
  { id: 'bedrock', name: 'Bedrock', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-bedrock', description: 'Construye aplicaciones de IA generativa usando modelos fundacionales administrados.', aliases: 'generative AI IA generativa LLM fundacional Claude GPT' },
  { id: 'kendra', name: 'Kendra', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-kendra', description: 'Busqueda empresarial inteligente sobre documentos y fuentes de datos corporativas.', aliases: 'busqueda enterprise documentos RAG' },
  { id: 'forecast', name: 'Forecast', category: AWS_CATEGORIES.ML_AI, slug: 'aws-amazon-forecast', description: 'Genera pronosticos de series temporales con machine learning administrado.', aliases: 'pronostico prediccion serie temporal' },
  // Developer Tools
  { id: 'codecommit', name: 'CodeCommit', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codecommit', description: 'Repositorio Git privado y administrado para alojar codigo fuente.', aliases: 'git repositorio source control' },
  { id: 'codebuild', name: 'CodeBuild', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codebuild', description: 'Compila, prueba y empaqueta codigo en un servicio de build administrado.', aliases: 'CI build compilar integracion continua' },
  { id: 'codedeploy', name: 'CodeDeploy', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codedeploy', description: 'Automatiza despliegues de aplicaciones en EC2, Lambda y servidores locales.', aliases: 'CD despliegue deployment continuo' },
  { id: 'codepipeline', name: 'CodePipeline', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-codepipeline', description: 'Orquesta pipelines de entrega continua para cambios de software.', aliases: 'CI/CD pipeline entrega continua' },
  { id: 'cloud9', name: 'Cloud9', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-cloud9', description: 'IDE cloud basado en navegador con terminal y herramientas de desarrollo.', aliases: 'IDE editor codigo navegador' },
  { id: 'xray', name: 'X-Ray', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-x-ray', description: 'Rastrea solicitudes distribuidas para analizar y depurar aplicaciones.', aliases: 'tracing trazado distributed observabilidad' },
  { id: 'cloudshell', name: 'CloudShell', category: AWS_CATEGORIES.DEVELOPER_TOOLS, slug: 'aws-aws-cloudshell', description: 'Shell basado en navegador con AWS CLI y credenciales preconfiguradas.', aliases: 'terminal CLI consola bash' },
  // Management
  { id: 'cloudwatch', name: 'CloudWatch', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-amazon-cloudwatch', description: 'Monitorea metricas, logs, eventos y alarmas de recursos y aplicaciones.', aliases: 'CW monitoreo metricas logs alarmas observabilidad' },
  { id: 'cloudformation', name: 'CloudFormation', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-cloudformation', description: 'Modela y aprovisiona infraestructura de AWS como codigo.', aliases: 'CFN IaC infraestructura como codigo stack template' },
  { id: 'systems-manager', name: 'Systems Manager', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-systems-manager', description: 'Administra operaciones, configuracion y automatizacion de recursos a escala.', aliases: 'SSM patch session manager parameter store' },
  { id: 'config', name: 'Config', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-config', description: 'Registra configuraciones de recursos y evalua cumplimiento contra reglas.', aliases: 'cumplimiento compliance auditoria configuracion' },
  { id: 'cloudtrail', name: 'CloudTrail', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-cloudtrail', description: 'Registra actividad de cuentas y llamadas API para auditoria y seguridad.', aliases: 'CT auditoria logs API actividad' },
  { id: 'organizations', name: 'Organizations', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-organizations', description: 'Administra multiples cuentas AWS con politicas y facturacion centralizadas.', aliases: 'multi-cuenta SCP politicas landing zone' },
  { id: 'control-tower', name: 'Control Tower', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-control-tower', description: 'Configura y gobierna entornos multi-cuenta de AWS siguiendo mejores practicas.', aliases: 'gobierno guardrails multi-cuenta' },
  { id: 'service-catalog', name: 'Service Catalog', category: AWS_CATEGORIES.MANAGEMENT, slug: 'aws-aws-service-catalog', description: 'Crea y distribuye catalogos aprobados de productos y recursos cloud.', aliases: 'catalogo productos aprobados self-service' },
  // Messaging
  { id: 'sqs', name: 'SQS', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-queue-service', description: 'Colas de mensajes administradas para desacoplar y escalar componentes.', aliases: 'Simple Queue Service cola mensajes queue' },
  { id: 'sns', name: 'SNS', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-notification-service', description: 'Mensajeria pub/sub administrada para notificaciones y fanout de eventos.', aliases: 'Simple Notification Service notificacion pub/sub fanout' },
  { id: 'eventbridge', name: 'EventBridge', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-eventbridge', description: 'Bus de eventos serverless para conectar aplicaciones, SaaS y servicios AWS.', aliases: 'event bus eventos reglas scheduler' },
  { id: 'step-functions', name: 'Step Functions', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-aws-step-functions', description: 'Orquesta flujos de trabajo visuales que coordinan servicios y tareas.', aliases: 'SFN workflow flujo estado maquina' },
  { id: 'ses', name: 'SES', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-simple-email-service', description: 'Servicio escalable para enviar y recibir correo electronico.', aliases: 'Simple Email Service email correo SMTP' },
  { id: 'pinpoint', name: 'Pinpoint', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-amazon-pinpoint', description: 'Gestiona comunicaciones multicanal y campañas dirigidas a usuarios.', aliases: 'marketing push notificaciones campana SMS' },
  { id: 'appsync', name: 'AppSync', category: AWS_CATEGORIES.MESSAGING, slug: 'aws-aws-appsync', description: 'Crea APIs GraphQL administradas con datos en tiempo real y offline.', aliases: 'GraphQL realtime subscripciones' },
];
