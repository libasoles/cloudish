import { Suspense, useEffect, useState } from "react";
import { useParams, Link, NavLink } from "react-router-dom";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import {
  getTutorial,
  TUTORIALS,
  TUTORIAL_LAZY_MAP,
} from "../docs/tutorial-registry";

export default function DocsPage() {
  const { tutorialId = "" } = useParams<{ tutorialId: string }>();
  const tutorial = getTutorial(tutorialId);
  const TutorialContent = TUTORIAL_LAZY_MAP[tutorialId] ?? null;
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!tutorial) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    const headings = document.querySelectorAll("h2[id]");
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tutorial, TutorialContent]);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--sans)",
      }}
    >
      {/* Left sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r sticky top-0 h-screen overflow-y-auto"
        style={{
          borderColor: "hsl(var(--border))",
          background: "hsl(var(--card))",
        }}
      >
        <div
          className="p-5 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium mb-4 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text)" }}
          >
            <ChevronLeftIcon width="16" height="16" />
            Volver a la app
          </Link>
          <div className="flex items-center gap-2">
            <img
              src="/cloudish-logo.png"
              alt="Cloudish"
              className="h-6 w-auto"
            />
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--text-h)" }}
            >
              Cloudish Docs
            </span>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-50">
            Tutoriales
          </p>
          <ul className="space-y-1">
            {TUTORIALS.map((t) => (
              <li key={t.id}>
                <NavLink
                  to={`/docs/${t.id}`}
                  className={({ isActive }) =>
                    [
                      "block px-3 py-2 rounded-md text-sm transition-colors",
                      isActive ? "font-medium" : "opacity-70 hover:opacity-100",
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    background: isActive ? "hsl(var(--accent))" : "transparent",
                    color: isActive
                      ? "hsl(var(--accent-foreground))"
                      : "var(--text)",
                  })}
                >
                  {t.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {!tutorial ? (
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <p
              className="text-4xl font-bold"
              style={{ color: "var(--text-h)" }}
            >
              404
            </p>
            <p className="opacity-60">Tutorial no encontrado.</p>
            <Link
              to="/docs/getting-started"
              className="text-sm underline underline-offset-4"
              style={{ color: "hsl(var(--primary))" }}
            >
              Ver primeros pasos
            </Link>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Mobile back link */}
            <Link
              to="/"
              className="lg:hidden flex items-center gap-1 text-sm mb-6 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text)" }}
            >
              <ChevronLeftIcon width="14" height="14" />
              Volver a la app
            </Link>

            <header className="mb-10">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "hsl(var(--primary))" }}
              >
                Tutorial
              </p>
              <h1
                className="text-4xl font-bold mb-3"
                style={{ color: "var(--text-h)", lineHeight: 1.15 }}
              >
                {tutorial.title}
              </h1>
              <p className="text-lg opacity-70">{tutorial.description}</p>
            </header>

            {/* Inline ToC */}
            <nav
              className="xl:hidden mb-10 p-4 rounded-lg border text-sm"
              style={{
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
              }}
            >
              <p
                className="font-semibold mb-3"
                style={{ color: "var(--text-h)" }}
              >
                En esta página
              </p>
              <ul className="space-y-1.5">
                {tutorial.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text)" }}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Tutorial content */}
            <div className="docs-content">
              {TutorialContent ? (
                <Suspense
                  fallback={
                    <div className="py-20 text-center opacity-40">
                      Cargando…
                    </div>
                  }
                >
                  <TutorialContent />
                </Suspense>
              ) : (
                <div className="py-20 text-center opacity-40">Cargando…</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Right ToC sidebar */}
      {tutorial && (
        <aside className="hidden xl:block w-52 shrink-0 sticky top-0 h-screen overflow-y-auto py-12 pr-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-50">
            En esta página
          </p>
          <ul className="space-y-2 text-sm">
            {tutorial.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block transition-colors"
                  style={{
                    color:
                      activeSection === s.id
                        ? "hsl(var(--primary))"
                        : "var(--text)",
                    opacity: activeSection === s.id ? 1 : 0.6,
                    fontWeight: activeSection === s.id ? 600 : 400,
                  }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
