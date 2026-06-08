import { AWS_SERVICES, type AwsService } from "@/data/aws-services";
import { type ServiceField } from "@/data/aws-service-fields";
import {
  type AwsServiceNodeType,
  type AwsServiceNodeData,
} from "@/components/nodes/AwsServiceNode";
import {
  getBrowserLocale,
  getServiceDescription as getLocalizedServiceDescription,
} from "@/i18n";

export type FieldValue = string | boolean | number;

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
  return {
    name: service.name,
    slug: service.slug,
    category: service.category,
    serviceId: service.id,
  };
}
