import { AWS_SERVICES, type AwsService } from "@/data/aws-services";

export const ALL_SERVICES: AwsService[] = AWS_SERVICES;
import { type ServiceField } from "@/data/aws-service-fields";
import {
  type AwsServiceNodeType,
  type AwsServiceNodeData,
} from "@/components/nodes/AwsServiceNode";
import { type MiscellaneousNodeData } from "@/components/nodes/MiscellaneousNode";
import {
  UI_TEXT,
  getBrowserLocale,
  getServiceDescription as getLocalizedServiceDescription,
} from "@/i18n";
import { getServicePlacementScope } from "@/lib/placement";

export type FieldValue = string | boolean | number;

export const GATEWAY_SERVICE_IDS = new Set([
  "internet-gateway",
  "nat-gateway",
  "vpn-gateway",
  "customer-gateway",
]);

export type MiscellaneousServiceId =
  | "user"
  | "internet"
  | "web"
  | "mobile"
  | "database";

export const MISCELLANEOUS_SERVICE_IDS = new Set<string>([
  "user",
  "internet",
  "web",
  "mobile",
  "database",
] satisfies MiscellaneousServiceId[]);

export function isMiscellaneousServiceId(
  id: string,
): id is MiscellaneousServiceId {
  return MISCELLANEOUS_SERVICE_IDS.has(id);
}

export function getMiscNodeData(
  serviceId: MiscellaneousServiceId,
): MiscellaneousNodeData {
  const label = UI_TEXT[getBrowserLocale()][serviceId];
  return { label, fields: { label } };
}

export const CIRCULAR_SERVICE_IDS = new Set(["elb", "nacl", "gateway-endpoint"]);

export function getServiceId(node: AwsServiceNodeType) {
  return node.data.serviceId ?? node.id;
}

export function getServiceDescription(
  node: AwsServiceNodeType,
  locale: ReturnType<typeof getBrowserLocale>,
) {
  const serviceId = getServiceId(node);
  const service = AWS_SERVICES.find(
    (service) => service.id === serviceId || service.slug === node.data.slug,
  );

  return getLocalizedServiceDescription(service, locale, node.data.description);
}

export function getFieldValue(
  data: AwsServiceNodeData,
  field: ServiceField,
): FieldValue {
  return data.fields?.[field.key] ?? field.defaultValue ?? "";
}

export function getAwsServiceNodeData(service: AwsService): AwsServiceNodeData {
  const scope = service.placementScope ?? getServicePlacementScope(service.id);
  return {
    name: service.name,
    slug: service.slug,
    category: service.category,
    serviceId: service.id,
    ...(scope !== "subnet" && { placementScope: scope }),
    ...(CIRCULAR_SERVICE_IDS.has(service.id) && { meta: { shape: "circular" as const } }),
  };
}

export function getServiceNodeType(serviceId: string): string {
  if (GATEWAY_SERVICE_IDS.has(serviceId)) return "gatewayService";
  if (MISCELLANEOUS_SERVICE_IDS.has(serviceId)) return serviceId;
  return "awsService";
}

export function getNodePlacementScope(node: AwsServiceNodeType) {
  if (node.data.placementScope) return node.data.placementScope;
  return getServicePlacementScope(getServiceId(node));
}
