import type { createClient } from "@/lib/supabase/client";

type Supa = ReturnType<typeof createClient>;

// PDF ophalen via de Edge Function en als bestand laten downloaden.
// Getekend: de vastgelegde PDF met handtekeningen. Anders: een actuele versie.
export async function downloadPdf(supabase: Supa, documentId: string, titel: string) {
  const { data, error } = await supabase.functions.invoke("teken-document", { body: { actie: "pdf", document_id: documentId } });
  if (error || !(data instanceof Blob)) throw new Error("Downloaden lukte niet");
  const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${titel.replace(/[^\p{L}\p{N} -]/gu, "").trim().replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function datumTijd(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Labels voor de keuken (sleutels zoals in clients.pakket en clients.extras)
export const PAKKET_LABELS: Record<string, string> = {
  dwy: "7-Course",
  audit: "Brand Audit",
  templates: "Branded Templates",
  identity: "Craveable Identity",
  zelf: "Be Your Own Chef",
};
export const DOC_EXTRAS = ["Brand shoot", "Branded templates", "Craveable Identity"] as const;
export const INVULVELDEN = [
  "{naam}", "{bedrijf}", "{email}", "{pakket}", "{prijs}", "{looptijd}", "{toegang}", "{inhoud}", "{extras}", "{werkwijze}",
  "{startdatum}", "{datum}", "{studio_naam}", "{studio_adres}", "{studio_kvk}", "{studio_btw}", "{studio_email}",
];

export interface PakketVelden {
  prijs?: string;
  looptijd?: string;
  toegang?: string;
  werkwijze?: string;
  inhoud?: string;
}
export interface DocumentVelden {
  studio: { naam?: string; adres?: string; kvk?: string; btw?: string; email?: string };
  pakketten: Record<string, PakketVelden>;
  extras: Record<string, string>;
}
