/** Vite base path for GitHub Pages, e.g. `/All-in-One-fitness-App/`. Undefined for local `/`. */
export function githubPagesBasePath(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/" || base === "./") return undefined;
  return base.endsWith("/") ? base : `${base}/`;
}

export function publicAsset(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${file.replace(/^\//, "")}`;
}

/** React Router basename (no trailing slash). */
export function routerBasename(): string | undefined {
  const base = githubPagesBasePath();
  if (!base) return undefined;
  const trimmed = base.replace(/\/$/, "");
  return trimmed || undefined;
}

/**
 * iOS "Add to Home Screen" on GitHub project pages can open at `/` or `/run`
 * instead of `/All-in-One-fitness-App/...`. Redirect before React boots.
 */
export function ensureGithubPagesPath() {
  if (typeof window === "undefined") return;

  const basePath = githubPagesBasePath();
  if (!basePath) return;

  const baseNoSlash = basePath.replace(/\/$/, "");
  const { hostname, pathname, search, hash } = window.location;
  if (!hostname.endsWith("github.io")) return;
  if (pathname === basePath || pathname.startsWith(`${baseNoSlash}/`)) return;

  const suffix =
    pathname === "/" || pathname === ""
      ? basePath
      : `${baseNoSlash}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

  window.location.replace(`${suffix}${search}${hash}`);
}
