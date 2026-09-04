import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { setSeoMeta } from "@/lib/seo";

export default function NotFoundPage() {
  useEffect(() => {
    setSeoMeta({
      title: "404 | Cloudish",
      description: "Esta página no existe (todavía).",
      path: "/404",
    });
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--sans)",
      }}
    >
      <div className="max-w-md w-full text-center">
        <img
          src="/cloudish-logo.png"
          alt="Cloudish"
          className="w-16 h-16 mx-auto mb-6 opacity-90"
        />

        <h1 className="text-7xl font-bold mb-3 tracking-tight">404</h1>

        <p className="text-lg font-medium mb-2">
          Este nodo no está conectado a nada.
        </p>
        <p className="text-sm opacity-60 mb-10">
          Buscaste una ruta que no existe. En Cloudish eso pasa cuando un
          servicio queda sin VPC, sin subnet y sin ningún handle al que
          conectarse — como esta página.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-opacity opacity-90 hover:opacity-100"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          <ChevronLeftIcon width="16" height="16" />
          Volver al canvas
        </Link>
      </div>
    </div>
  );
}
