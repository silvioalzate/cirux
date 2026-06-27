import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Crea un timestamp ISO con offset explícito de Colombia (UTC-5).
 * Útil para insertar en PostgreSQL TIMESTAMPTZ sin depender del TZ del navegador.
 */
export function toColombiaISOString(dateStr: string, hour: number, minute: number): string {
  // Construye string ISO con offset explícito de Colombia
  const iso = `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-05:00`;
  return new Date(iso).toISOString();
}

/**
 * Formatea un timestamp de PostgreSQL/Supabase sin conversiones de zona horaria.
 * Asume que el valor ya está en la zona horaria deseada.
 */
export function formatPgTime(ts: string, pattern: "HH:mm" | "dd MMM yyyy · HH:mm" | "haaa"): string {
  const clean = ts.replace(" ", "T");
  const datePart = clean.slice(0, 10); // YYYY-MM-DD
  const hour = clean.slice(11, 13);
  const minute = clean.slice(14, 16);
  const timePart = `${hour}:${minute}`;

  if (pattern === "HH:mm") return timePart;

  if (pattern === "haaa") {
    const h = parseInt(hour, 10);
    const ampm = h < 12 ? "a. m." : "p. m.";
    const h12 = h % 12 || 12;
    return `${h12} ${ampm}`;
  }

  const [year, month, day] = datePart.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const monthAbbr = months[parseInt(month, 10) - 1];
  return `${day} ${monthAbbr} ${year} · ${timePart}`;
}
