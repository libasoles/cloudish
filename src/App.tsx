import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export default function App() {
  return (
    <div
      className="bg-background text-foreground"
      style={{ display: "flex", width: "100vw", height: "100vh" }}
    >
      <KeyboardShortcuts />
      <Canvas />
      <Inspector />
    </div>
  );
}
