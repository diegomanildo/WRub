/**
 * SQLite guarda CURRENT_TIMESTAMP como "YYYY-MM-DD HH:MM:SS" en UTC, sin zona.
 * Si se lo pasamos directo a new Date(), varios navegadores lo interpretan como
 * hora local y el resultado queda corrido. Normalizamos a ISO con "Z".
 */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  let s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }

  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** El backend devuelve snake_case; toleramos ambas formas. */
export function getUpdatedAt(project) {
  return parseDate(project?.updated_at ?? project?.updatedAt);
}

export function getCreatedAt(project) {
  return parseDate(project?.created_at ?? project?.createdAt);
}

/** "hace 5 min", "ayer", "12 mar 2026" */
export function formatRelative(value) {
  const date = parseDate(value);
  if (!date) return "—";

  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60000);

  if (min < 1) return "hace unos segundos";
  if (min < 60) return `hace ${min} min`;

  const hours = Math.round(min / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function formatFull(value) {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Texto plano a partir del HTML del editor, para las previsualizaciones.
 * Usa el parser del navegador en vez de regex para no romper con entidades.
 */
export function htmlToText(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}
