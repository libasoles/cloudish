import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { setSeoMeta } from "@/lib/seo";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

type ChangelogEntry = {
  date: string;
  items: Record<"en" | "es", string[]>;
};

const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-09-04",
    items: {
      en: ["Added WorkOS to the service catalog."],
      es: ["Se agregó WorkOS al catálogo de servicios."],
    },
  },
  {
    date: "2026-09-02",
    items: {
      en: [
        "Added Sentry, Datadog, Cloudflare, Redis, GraphQL, Apache Kafka, and Nginx to the service catalog.",
      ],
      es: [
        "Se agregaron Sentry, Datadog, Cloudflare, Redis, GraphQL, Apache Kafka y Nginx al catálogo de servicios.",
      ],
    },
  },
];

export default function ChangelogPage() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];

  useEffect(() => {
    setSeoMeta({
      title: t.changelogSeoTitle,
      description: t.changelogSeoDescription,
      path: "/changelog",
    });
  }, [t.changelogSeoTitle, t.changelogSeoDescription]);

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
          {t.backToApp}
        </Link>

        <h1 className="text-2xl font-semibold mb-2">{t.changelogTitle}</h1>
        <p className="text-sm opacity-70 mb-10">{t.changelogDescription}</p>

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
                {entry.items[locale].map((item) => (
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
