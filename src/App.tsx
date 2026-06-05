import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="mobile-landscape-shell flex h-dvh w-full bg-background text-foreground">
        <KeyboardShortcuts />
        <Canvas />
        <Inspector />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
