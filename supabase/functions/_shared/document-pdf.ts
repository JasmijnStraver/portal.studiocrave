// =====================================================================
// PDF in Studio Crave-huisstijl voor documenten en contracten.
// Gebruikt alleen standaardlettertypen (Times voor koppen, net als het
// portaal, Helvetica voor tekst), dus geen extra bestanden of diensten.
// =====================================================================
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "npm:pdf-lib@1.17.1";

export interface DocumentPdfInput {
  titel: string;
  inhoud: string;
  documentId: string;
  versie?: number | null;
  klant: { naam: string; bedrijf?: string | null; email: string };
  tekenen: boolean;
  logoPng?: Uint8Array | null;
  ondertekenaar: string;                 // jij, als opdrachtnemer
  bedrijfsgegevens: string;
  handtekeningStudio?: Uint8Array | null;
  ondertekening?: {
    naam: string;
    handtekeningPng: Uint8Array;
    op: Date;
    ip?: string | null;
    apparaat?: string | null;
    hash: string;
  } | null;
}

const KLEUR = {
  midnight: rgb(0x3d / 255, 0x14 / 255, 0x19 / 255),
  burgundy: rgb(0x6b / 255, 0x1a / 255, 0x2a / 255),
  gold: rgb(0xc9 / 255, 0xa0 / 255, 0x60 / 255),
  pepper: rgb(0xc8 / 255, 0x00 / 255, 0x1a / 255),
  muted: rgb(0x8a / 255, 0x72 / 255, 0x74 / 255),
  creme: rgb(0xf5 / 255, 0xf0 / 255, 0xeb / 255),
};
const A4 = { w: 595.28, h: 841.89 };
const MARGE = { l: 64, r: 64, t: 72, b: 72 };
const BREEDTE = A4.w - MARGE.l - MARGE.r;

// "1. TAKEN" of "OVERIGE AFSPRAKEN": een korte regel helemaal in hoofdletters telt als kop
export function isHoofdletterKop(r: string) {
  const zonderNr = r.replace(/^\d+[.)]\s*/, "");
  return zonderNr.length >= 3 && zonderNr.length <= 60 && /[A-Z]{3}/.test(zonderNr) && zonderNr === zonderNr.toUpperCase() && !/[.:;]$/.test(zonderNr);
}

export function nlDatumTijd(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}
export function nlDatum(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric" }).format(d);
}

export async function maakDocumentPdf(input: DocumentPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(input.titel);
  pdf.setAuthor("Studio Crave");
  pdf.setSubject(`${input.titel} · ${input.klant.naam}`);
  pdf.setCreator("The Branding Kitchen™ portaal");

  const f = {
    tekst: await pdf.embedFont(StandardFonts.Helvetica),
    vet: await pdf.embedFont(StandardFonts.HelveticaBold),
    kop: await pdf.embedFont(StandardFonts.TimesRoman),
    kopCursief: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  const logo = input.logoPng ? await pdf.embedPng(input.logoPng).catch(() => null) : null;

  // Tekens die de standaardlettertypen niet kennen (bijv. emoji) netjes vervangen
  const veilig = (s: string, font: PDFFont) => {
    const vervang: Record<string, string> = { "→": "->", "←": "<-", "✓": "v", "✕": "x", " ": " " };
    let uit = "";
    for (const ch of s.normalize("NFC")) {
      const c = vervang[ch] ?? ch;
      try { font.encodeText(c); uit += c; } catch { /* overslaan */ }
    }
    return uit;
  };

  let page!: PDFPage;
  let y = 0;
  const paginas: PDFPage[] = [];
  const nieuwePagina = () => {
    page = pdf.addPage([A4.w, A4.h]);
    paginas.push(page);
    y = A4.h - MARGE.t;
    // kopregel
    if (logo) {
      const h = 22, w = (logo.width / logo.height) * h;
      page.drawImage(logo, { x: MARGE.l, y: A4.h - 46 - h / 2, width: w, height: h });
    } else {
      page.drawText("Studio Crave", { x: MARGE.l, y: A4.h - 50, size: 14, font: f.kop, color: KLEUR.midnight });
    }
    const merk = veilig("The Branding Kitchen™", f.kopCursief);
    page.drawText(merk, { x: A4.w - MARGE.r - f.kopCursief.widthOfTextAtSize(merk, 10), y: A4.h - 50, size: 10, font: f.kopCursief, color: KLEUR.burgundy });
    page.drawLine({ start: { x: MARGE.l, y: A4.h - 62 }, end: { x: A4.w - MARGE.r, y: A4.h - 62 }, thickness: 0.6, color: KLEUR.gold });
    y = A4.h - MARGE.t - 22;
  };
  const ruimte = (h: number) => { if (y - h < MARGE.b) nieuwePagina(); };

  // Zin met **vet** opknippen in woorden met hun lettertype
  type Woord = { t: string; font: PDFFont };
  const woorden = (regel: string): Woord[] => {
    const uit: Woord[] = [];
    regel.split(/(\*\*[^*]+\*\*)/).forEach((deel) => {
      const vet = /^\*\*[^*]+\*\*$/.test(deel);
      const font = vet ? f.vet : f.tekst;
      const tekst = vet ? deel.slice(2, -2) : deel;
      tekst.split(/(\s+)/).filter(Boolean).forEach((w) => uit.push({ t: veilig(w, font), font }));
    });
    return uit;
  };
  const alinea = (regel: string, opts: { size?: number; inspring?: number; kleur?: ReturnType<typeof rgb>; regelafstand?: number } = {}) => {
    const size = opts.size ?? 10.5, lh = opts.regelafstand ?? size * 1.5, x0 = MARGE.l + (opts.inspring ?? 0);
    const max = BREEDTE - (opts.inspring ?? 0);
    let regelWoorden: Woord[] = [], breedte = 0;
    const schrijf = () => {
      while (regelWoorden.length && /^\s+$/.test(regelWoorden[regelWoorden.length - 1].t)) regelWoorden.pop();
      ruimte(lh);
      let x = x0;
      for (const w of regelWoorden) {
        if (!/^\s+$/.test(w.t)) page.drawText(w.t, { x, y: y - size, size, font: w.font, color: opts.kleur ?? KLEUR.midnight });
        x += w.font.widthOfTextAtSize(/^\s+$/.test(w.t) ? " " : w.t, size);
      }
      y -= lh; regelWoorden = []; breedte = 0;
    };
    for (const w of woorden(regel)) {
      const spatie = /^\s+$/.test(w.t);
      const wb = w.font.widthOfTextAtSize(spatie ? " " : w.t, size);
      if (spatie && !regelWoorden.length) continue;
      if (!spatie && breedte + wb > max && regelWoorden.length) schrijf();
      if (!spatie && wb > max) { // extreem lang woord: hard afbreken
        let rest = w.t;
        while (rest) {
          let i = rest.length;
          while (i > 1 && w.font.widthOfTextAtSize(rest.slice(0, i), size) > max) i--;
          regelWoorden.push({ t: rest.slice(0, i), font: w.font }); schrijf(); rest = rest.slice(i);
        }
        continue;
      }
      regelWoorden.push(w); breedte += wb;
    }
    if (regelWoorden.length) schrijf();
  };

  // ---------- Inhoud ----------
  nieuwePagina();
  const regels = input.inhoud.replace(/\r\n/g, "\n").split("\n");
  // Titel: eerste '# ' in de tekst, anders de documenttitel
  let titel = input.titel;
  if (regels.length && /^#\s+/.test(regels[0].trim())) titel = regels.shift()!.trim().replace(/^#\s+/, "");
  const titelVeilig = veilig(titel, f.kop);
  // titel kan lang zijn: over meerdere regels
  const titelRegels: string[] = [];
  let huidig = "";
  for (const w of titelVeilig.split(" ")) {
    const test = huidig ? huidig + " " + w : w;
    if (f.kop.widthOfTextAtSize(test, 26) > BREEDTE && huidig) { titelRegels.push(huidig); huidig = w; } else huidig = test;
  }
  if (huidig) titelRegels.push(huidig);
  for (const r of titelRegels) { page.drawText(r, { x: MARGE.l, y: y - 26, size: 26, font: f.kop, color: KLEUR.midnight }); y -= 32; }
  y -= 2;
  const status = input.ondertekening ? `Ondertekend op ${nlDatum(input.ondertekening.op)}`
    : input.tekenen ? "Nog niet ondertekend" : "Ter informatie";
  alinea(`Voor ${input.klant.naam}${input.klant.bedrijf ? " · " + input.klant.bedrijf : ""} · ${status}`, { size: 9.5, kleur: KLEUR.muted });
  y -= 14;

  let lijst = false;
  for (const ruw of regels) {
    const r = ruw.trim();
    if (!r) { y -= lijst ? 10 : 6; lijst = false; continue; }
    // Tussenkop: "## 1. Taken", of een regel in hoofdletters zoals "1. TAKEN"
    if (/^#{1,2}\s+/.test(r) || isHoofdletterKop(r)) {
      const tekst = r.replace(/^#{1,2}\s+/, "");
      const m = tekst.match(/^(\d+[.)])\s*(.*)$/);
      const nr = m ? m[1] : "";
      const kop = veilig((m ? m[2] : tekst).toUpperCase(), f.vet);
      y -= 10; ruimte(44);
      let x = MARGE.l;
      if (nr) {
        page.drawText(nr, { x, y: y - 12, size: 12.5, font: f.vet, color: KLEUR.pepper });
        x += f.vet.widthOfTextAtSize(nr, 12.5) + 7;
      }
      page.drawText(kop, { x, y: y - 12, size: 12.5, font: f.vet, color: KLEUR.midnight });
      y -= 22; lijst = false; continue;
    }
    if (/^###\s+/.test(r)) { y -= 4; alinea(`**${r.replace(/^###\s+/, "")}**`); continue; }
    if (/^[-*•]\s+/.test(r)) {
      ruimte(16);
      page.drawCircle({ x: MARGE.l + 4, y: y - 7.2, size: 1.8, color: KLEUR.gold });
      alinea(r.replace(/^[-*•]\s+/, ""), { inspring: 14 }); lijst = true; continue;
    }
    const nummer = r.match(/^(\d+[.)])\s+(.*)$/);
    if (nummer) {
      ruimte(16);
      page.drawText(nummer[1], { x: MARGE.l, y: y - 10.5, size: 10.5, font: f.vet, color: KLEUR.burgundy });
      alinea(nummer[2], { inspring: 20 }); lijst = true; continue;
    }
    alinea(r); y -= 4; lijst = false;
  }

  // ---------- Ondertekening ----------
  if (input.tekenen) {
    y -= 22; ruimte(190);
    page.drawText("ONDERTEKENING", { x: MARGE.l, y: y - 12, size: 12.5, font: f.vet, color: KLEUR.midnight });
    y -= 30;
    const kolom = (BREEDTE - 24) / 2;
    const vak = async (x: number, rol: string, naam: string, png?: Uint8Array | null, datum?: string) => {
      const top = y;
      page.drawText(veilig(rol.toUpperCase(), f.vet), { x, y: top - 8, size: 7.5, font: f.vet, color: KLEUR.muted });
      const hoog = 70;
      let img: PDFImage | null = null;
      if (png) img = await pdf.embedPng(png).catch(() => null);
      if (img) {
        const schaal = Math.min(kolom / img.width, hoog / img.height);
        page.drawImage(img, { x, y: top - 16 - hoog + (hoog - img.height * schaal) / 2, width: img.width * schaal, height: img.height * schaal });
      }
      page.drawLine({ start: { x, y: top - 16 - hoog - 4 }, end: { x: x + kolom, y: top - 16 - hoog - 4 }, thickness: 0.6, color: KLEUR.midnight });
      page.drawText(veilig(naam, f.tekst), { x, y: top - 16 - hoog - 18, size: 10, font: f.tekst, color: KLEUR.midnight });
      if (datum) page.drawText(veilig(datum, f.tekst), { x, y: top - 16 - hoog - 31, size: 8.5, font: f.tekst, color: KLEUR.muted });
    };
    const o = input.ondertekening;
    await vak(MARGE.l, "Namens Studio Crave", input.ondertekenaar, input.handtekeningStudio, o ? nlDatum(o.op) : undefined);
    await vak(MARGE.l + kolom + 24, input.klant.bedrijf ? `Namens ${input.klant.bedrijf}` : "Klant", o?.naam ?? input.klant.naam, o?.handtekeningPng, o ? nlDatumTijd(o.op) : "Nog niet getekend");
    y -= 16 + 70 + 44;
  }

  // ---------- Ondertekeningsbewijs ----------
  if (input.ondertekening) {
    const o = input.ondertekening;
    const rijen: [string, string][] = [
      ["Document", input.titel + (input.versie ? ` (versie ${input.versie})` : "")],
      ["Document-ID", input.documentId],
      ["Getekend door", `${o.naam} · ${input.klant.email}`],
      ["Datum en tijd", nlDatumTijd(o.op) + " (Amsterdam)"],
      ["IP-adres", o.ip || "onbekend"],
      ["Apparaat", (o.apparaat || "onbekend").slice(0, 110)],
      ["Vingerafdruk tekst (SHA-256)", o.hash],
    ];
    const hoogte = 34 + rijen.length * 26;
    y -= 10; ruimte(hoogte + 10);
    page.drawRectangle({ x: MARGE.l, y: y - hoogte, width: BREEDTE, height: hoogte, color: KLEUR.creme, borderColor: KLEUR.gold, borderWidth: 0.6 });
    page.drawText("Ondertekeningsbewijs", { x: MARGE.l + 14, y: y - 22, size: 12, font: f.kop, color: KLEUR.midnight });
    let ry = y - 40;
    for (const [k, v] of rijen) {
      page.drawText(veilig(k.toUpperCase(), f.vet), { x: MARGE.l + 14, y: ry, size: 6.5, font: f.vet, color: KLEUR.muted });
      const tekst = veilig(v, f.tekst);
      let size = 8.5;
      while (size > 5.5 && f.tekst.widthOfTextAtSize(tekst, size) > BREEDTE - 28) size -= 0.25;
      page.drawText(tekst, { x: MARGE.l + 14, y: ry - 11, size, font: f.tekst, color: KLEUR.midnight });
      ry -= 26;
    }
    y -= hoogte;
  }

  // ---------- Voetregel op elke pagina ----------
  const totaal = paginas.length;
  paginas.forEach((p, i) => {
    const links = veilig(input.bedrijfsgegevens, f.tekst);
    p.drawText(links, { x: MARGE.l, y: 40, size: 7.5, font: f.tekst, color: KLEUR.muted });
    const rechts = `Pagina ${i + 1} van ${totaal}`;
    p.drawText(rechts, { x: A4.w - MARGE.r - f.tekst.widthOfTextAtSize(rechts, 7.5), y: 40, size: 7.5, font: f.tekst, color: KLEUR.muted });
    const id = `ID ${input.documentId}`;
    p.drawText(id, { x: MARGE.l, y: 29, size: 6, font: f.tekst, color: KLEUR.muted });
  });

  return await pdf.save();
}

export async function sha256Hex(tekst: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
