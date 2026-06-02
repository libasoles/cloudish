import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export default function App() {
  return (
    <div className="bg-background text-foreground flex w-dvw h-dvh">
      <KeyboardShortcuts />
      <Canvas />
      <Inspector />
    </div>
  );
}
