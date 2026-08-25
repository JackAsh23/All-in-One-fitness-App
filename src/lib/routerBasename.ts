/** React Router basename for GitHub Pages; undefined for web root and Capacitor. */
export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/" || base === "./") return undefined;
  const trimmed = base.replace(/\/$/, "");
  return trimmed || undefined;
}
