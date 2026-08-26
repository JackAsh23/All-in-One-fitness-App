/** Parse a decimal the way phone keyboards actually type it (comma or period). */
export function parseDecimal(raw: string): number | null {
  let s = String(raw).trim().replace(/[\s\u00a0\u202f\u2007\u2009]/g, "");
  if (!s) return null;
  s = s.replace(/(kg|cm|m|lbs?|#)$/i, "");
  s = s.replace(/[٫、，]/g, ",");
  s = s.replace(/[·。．]/g, ".");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized = s;
  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = s.replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Height in centimetres. Accepts cm, metres (1.50–2.50), and 5'9" style values. */
export function parseHeightCm(raw: string): number | null {
  const text = String(raw).trim();
  if (!text) return null;
  const feetInches = text.match(/^(\d+)\s*['′’]\s*(\d+(?:[.,]\d+)?)\s*["″”]?$/);
  if (feetInches) {
    const feet = Number(feetInches[1]);
    const inches = parseDecimal(feetInches[2]) ?? 0;
    const cm = feet * 30.48 + inches * 2.54;
    return Number.isFinite(cm) ? Math.round(cm * 100) / 100 : null;
  }
  const n = parseDecimal(text.replace(/cm$/i, ""));
  if (n == null || n <= 0) return null;
  if (n >= 0.5 && n <= 3 && /[.,]/.test(text)) return Math.round(n * 10000) / 100;
  return n;
}

export function finitePositive(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}
