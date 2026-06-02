import ChildCountSlider from "@/components/ChildCountSlider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UI_TEXT } from "@/i18n";
import type { FieldValue } from "@/lib/node-utils";

export type AzInspectorPanelProps = {
  childCount: number;
  containerFields: Record<string, FieldValue>;
  onChildCountChange: (count: number) => void;
  onContainerFieldChange: (fieldKey: string, value: FieldValue) => void;
  onToggleAzSync: (synced: boolean) => void;
  azHasSiblings: boolean;
  azSynced: boolean;
  t: typeof UI_TEXT["en"];
};

export function AzInspectorPanel({
  childCount,
  onChildCountChange,
  onToggleAzSync,
  azHasSiblings,
  azSynced,
  t,
}: AzInspectorPanelProps) {
  return (
    <div className="space-y-4 text-sm">
      <ChildCountSlider
        label={t.numberOfSubnets}
        value={childCount}
        onChange={onChildCountChange}
      />
      {azHasSiblings && (
        <>
          <label className="flex items-center gap-3 px-1 py-2 font-medium text-foreground mb-0">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={azSynced}
              onChange={(e) => onToggleAzSync(e.target.checked)}
            />
            <span>{t.syncAzs}</span>
          </label>
          <Alert>
            <AlertDescription>{t.syncAzsBannerDescription}</AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
