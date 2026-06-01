import DragDropSidebar from "@/components/DragDropSidebar";
import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

export default function App() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];

  return (
    <div
      className="bg-background text-foreground"
      style={{ display: "flex", width: "100vw", height: "100vh" }}
    >
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragSubnet: t.dragSubnet,
          subnet: t.subnet,
          user: t.user,
          dragService: t.dragService,
        }}
      />
      <Canvas />
      <Inspector />
    </div>
  );
}
