import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNodeFields } from "@/data/aws-service-fields";
import { getLocalizedField, type Locale, type UI_TEXT } from "@/i18n";
import { getFieldValue, getServiceId, type FieldValue } from "@/lib/node-utils";
import type { AwsServiceNodeData, AwsServiceNodeType } from "@/components/AwsServiceNode";

type AwsServiceInspectorPanelProps = {
  node: AwsServiceNodeType;
  locale: Locale;
  onFieldChange: (fieldKey: string, value: FieldValue) => void;
  t: typeof UI_TEXT["en"];
};

export function AwsServiceInspectorPanel({
  node,
  locale,
  onFieldChange,
  t,
}: AwsServiceInspectorPanelProps) {
  const serviceId = getServiceId(node);
  const fields = getNodeFields(serviceId);

  if (fields.length === 0) {
    return (
      <div className="space-y-4 text-sm text-muted-foreground">
        <Alert>
          <AlertTitle>{t.comingSoon}</AlertTitle>
          <AlertDescription>{t.fieldsUnavailable}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const localizedField = getLocalizedField(serviceId, field, locale);
        const value = getFieldValue(node.data as AwsServiceNodeData, field);

        if (field.type === "select") {
          return (
            <label
              key={field.key}
              className="grid gap-2 text-sm font-medium text-foreground"
            >
              {localizedField.label}
              <Select
                value={String(value)}
                onValueChange={(nextValue) =>
                  onFieldChange(field.key, nextValue)
                }
              >
                <SelectTrigger className="font-normal">
                  <SelectValue placeholder={localizedField.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {(localizedField.options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          );
        }

        if (field.type === "boolean") {
          return (
            <label
              key={field.key}
              className="flex items-center gap-3 px-1 py-2 text-sm font-medium text-foreground"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={Boolean(value)}
                onChange={(event) =>
                  onFieldChange(field.key, event.target.checked)
                }
              />
              <span>{localizedField.label}</span>
            </label>
          );
        }

        return (
          <label
            key={field.key}
            className="grid gap-2 text-sm font-medium text-foreground"
          >
            {localizedField.label}
            <Input
              type={field.type === "number" ? "number" : "text"}
              value={String(value)}
              placeholder={localizedField.placeholder}
              onChange={(event) => {
                const nextValue =
                  field.type === "number"
                    ? event.target.value === ""
                      ? ""
                      : Number(event.target.value)
                    : event.target.value;
                onFieldChange(field.key, nextValue);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
