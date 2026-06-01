import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";

export default function App() {
  return (
    <div
      className="bg-background text-foreground"
      style={{ display: "flex", width: "100vw", height: "100vh" }}
    >
      <Canvas />
      <Inspector />
    </div>
  );
}
