import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { setSeoMeta } from "@/lib/seo";

type ChangelogEntry = {
  date: string;
  items: string[];
};

const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-09-04",
    items: ["Se agregó WorkOS al catálogo de servicios."],
  },
  {
    date: "2026-09-02",
    items: [
      "Se agregó Sentry al catálogo de servicios.",
      "Se agregó Datadog al catálogo de servicios.",
      "Se agregó Cloudflare al catálogo de servicios.",
      "Se agregó Redis al catálogo de servicios.",
      "Se agregó GraphQL al catálogo de servicios.",
      "Se agregó Apache Kafka al catálogo de servicios.",
      "Se agregó Nginx al catálogo de servicios.",
    ],
  },
];

export default function ChangelogPage() {
  useEffect(() => {
    setSeoMeta({
      title: "Novedades | Cloudish",
      description:
        "Registro de cambios de Cloudish: nuevos servicios y mejoras recientes.",
      path: "/changelog",
    });
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--sans)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium mb-8 opacity-60 hover:opacity-100 transition-opacity w-fit"
          style={{ color: "var(--text)" }}
        >
          <ChevronLeftIcon width="16" height="16" />
          Volver a la app
        </Link>

        <h1 className="text-2xl font-semibold mb-2">Novedades</h1>
        <p className="text-sm opacity-70 mb-10">
          Cambios recientes en Cloudish.
        </p>

        <div className="space-y-8">
          {ENTRIES.map((entry) => (
            <section key={entry.date}>
              <h2
                className="text-sm font-medium mb-3 opacity-60"
                style={{ color: "var(--text)" }}
              >
                {entry.date}
              </h2>
              <ul className="space-y-1.5 list-disc list-inside text-sm">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
