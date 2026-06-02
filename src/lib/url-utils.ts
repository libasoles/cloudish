const PARAM = "p";

export function getUrlArchitectureId(): string | undefined {
  return new URLSearchParams(window.location.search).get(PARAM) ?? undefined;
}

export function setUrlArchitectureId(id: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, id);
  window.history.replaceState(null, "", url.toString());
}

export function clearUrlArchitectureId(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  const next = url.searchParams.size > 0 ? url.toString() : url.pathname;
  window.history.replaceState(null, "", next);
}
