import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { setSeoMeta } from "@/lib/seo";

export default function NotFoundPage() {
  useEffect(() => {
    setSeoMeta({
      title: "404 | Cloudish",
      description: "Página no encontrada.",
      path: "/404",
    });
  }, []);

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: "var(--bg)",
        fontFamily: "var(--sans)",
        backgroundImage:
          "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <img
          src="/cloudish-logo.png"
          alt="Cloudish"
          className="mb-7 h-6 w-auto opacity-70"
        />

        <div
          className="relative rounded-2xl border border-dashed px-12 py-10 text-center"
          style={{
            borderColor: "rgba(161,161,170,0.45)",
            background: "rgba(161,161,170,0.05)",
          }}
        >
          <span
            className="absolute -top-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2"
            style={{ background: "var(--bg)", borderColor: "#38bdf8" }}
            aria-hidden="true"
          />
          <p
            className="text-7xl font-bold tracking-tight"
            style={{ color: "var(--text-h)" }}
          >
            404
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--text)" }}>
            Página no encontrada.
          </p>
        </div>

        <Link
          to="/"
          className="mt-9 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: "#38bdf8",
            color: "#0f1117",
            outlineColor: "#38bdf8",
          }}
        >
          <ChevronLeftIcon width="16" height="16" />
          Volver al canvas
        </Link>
      </div>
    </div>
  );
}
