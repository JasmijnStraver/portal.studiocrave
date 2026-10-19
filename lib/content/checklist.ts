import type { Client, ClientCourse, DocumentRow, FileRow } from "@/lib/supabase/types";

// Vereenvoudigde, Supabase-vormige versie van CHECKLIST uit prototype/config.js.
// De Brand shoot-fase (Pixieset-galerijen, beeldrechten) is nog niet geport — zie STATUS.md.
export interface ChecklistItem {
  id: string;
  t: string;
  auto?: (ctx: ChecklistCtx) => boolean;
}
export interface ChecklistFase {
  fase: string;
  items: ChecklistItem[];
}
export interface ChecklistCtx {
  client: Client;
  courses: ClientCourse[];
  files: FileRow[];
  documents: DocumentRow[];
  handmatig: Record<string, boolean>;
}

export const CHECKLIST: ChecklistFase[] = [
  {
    fase: "Vóór de start",
    items: [
      { id: "voorstel", t: "Voorstel verstuurd en akkoord" },
      { id: "aanbetaling", t: "Aanbetaling of eerste factuur voldaan" },
      {
        id: "contracten",
        t: "Overeenkomst, voorwaarden en andere documenten getekend",
        auto: (c) => {
          const teTekenen = c.documents.filter((d) => d.tekenen);
          return teTekenen.length > 0 && teTekenen.every((d) => d.status === "getekend");
        },
      },
      { id: "uitnodiging", t: "Portaal-uitnodiging verstuurd", auto: (c) => c.client.uitgenodigd },
    ],
  },
  {
    fase: "Onboarding",
    items: [
      { id: "aanlevering", t: "Eerste aanlevering ontvangen (foto's, teksten, voice memo's)", auto: (c) => c.files.some((f) => f.soort === "upload") },
    ],
  },
  {
    fase: "Tijdens het traject",
    items: [
      {
        id: "deliverables",
        t: "Bij elke afgeronde course een deliverable geplaatst",
        auto: (c) => {
          const klaar = c.courses.filter((x) => x.status === "klaar");
          return klaar.length > 0 && klaar.every((cc) => c.files.some((f) => f.course === cc.course && f.soort === "opgediend"));
        },
      },
      {
        id: "geheugen",
        t: "Merkgeheugen bijgewerkt: Brand Foundation, stem en kerninhoud",
        auto: (c) => {
          const p = (c.client.profiel as { kernbelofte?: string }) || {};
          const g = (c.client.geheugen as { stem?: unknown[] }) || {};
          return !!p.kernbelofte && (g.stem?.length ?? 0) > 0;
        },
      },
      { id: "checkin", t: "Tussentijdse check-in gedaan" },
    ],
  },
  {
    fase: "Afronding",
    items: [
      { id: "evaluatie", t: "Evaluatie verstuurd" },
      { id: "testimonial", t: "Toestemming voor testimonial gevraagd" },
      { id: "nazorg", t: "Toegang en nazorg na het traject afgesproken (looptijd + 3 maanden, daarna verlengen)" },
      {
        id: "merkopen",
        t: "Dessert geserveerd: Signature Dish open voor de klant",
        auto: (c) => {
          const merk = (c.client.merk as { open?: boolean }) || {};
          return !!merk.open || (c.courses.length > 0 && c.courses.every((x) => x.status === "klaar"));
        },
      },
      { id: "eindfactuur", t: "Eindfactuur voldaan" },
    ],
  },
];

export function checkItems(ctx: ChecklistCtx) {
  return CHECKLIST.map((f) => ({
    ...f,
    items: f.items.map((i) => ({ ...i, klaar: i.auto ? i.auto(ctx) || !!ctx.handmatig[i.id] : !!ctx.handmatig[i.id] })),
  }));
}
export function openChecks(ctx: ChecklistCtx) {
  return checkItems(ctx).reduce((n, f) => n + f.items.filter((i) => !i.klaar).length, 0);
}

// De standaarddocumenten staan nu als sjablonen in de database (supabase/04-documenten.sql)
// en worden per pakket en extra automatisch klaargezet.
