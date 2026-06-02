import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <div className="mobile-landscape-shell bg-background text-foreground flex w-dvw h-dvh">
      <KeyboardShortcuts />
      <Canvas />
      <Inspector />
      <Toaster />
    </div>
  );
}
