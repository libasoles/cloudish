import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

export function NoOptionsInspectorPanel() {
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <Alert>
        <AlertTitle>{t.inspectorNoOptionsTitle}</AlertTitle>
        <AlertDescription>{t.inspectorNoOptionsDescription}</AlertDescription>
      </Alert>
    </div>
  );
}
