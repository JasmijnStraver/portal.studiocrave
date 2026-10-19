// =====================================================================
// Edge Function: teken-document
// Acties (body: { actie, ... }):
//   'teken'               klant tekent of geeft akkoord: { document_id, naam, akkoord, handtekening? }
//                         -> PDF in haar map én in het archief, document vergrendeld
//   'pdf'                 PDF downloaden: { document_id }. Alleen als het getekend of akkoord is.
//   'archief-pdf'         jij downloadt uit het archief: { document_id } (ook als de klant verwijderd is)
//   'studio-handtekening' jij zet je eigen handtekening: { handtekening }
// 'handtekening' is een PNG als data-URL uit het tekenvak.
// Deploy: supabase functions deploy teken-document
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { maakDocumentPdf, sha256Hex } from "../_shared/document-pdf.ts";

const SITE = Deno.env.get("PORTAAL_URL") ?? "https://portaal.studiocrave.nl";
const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("PORTAAL_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};
const antwoord = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MAX_PNG = 400_000;

function pngUitDataUrl(s: unknown): Uint8Array | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bin = atob(m[1]);
  if (bin.length > MAX_PNG || bin.length < 200) return null;
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return sig.every((b, i) => bytes[i] === b) ? bytes : null;
}

async function haalLogo(): Promise<Uint8Array | null> {
  try {
    const r = await fetch(`${SITE}/brand/studio-crave-logo-bordeaux.png`);
    return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
  } catch { return null; }
}

const bestandsnaam = (titel: string, naam?: string) =>
  [titel, naam].filter(Boolean).join(" ").replace(/[^\p{L}\p{N} -]/gu, "").trim().replace(/\s+/g, "-") + ".pdf";

const pdfAntwoord = (bytes: Uint8Array, naam: string) =>
  new Response(bytes, {
    headers: { ...cors, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${naam}"` },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return antwoord({ fout: "Niet ingelogd" }, 401);
  const { data: isAdmin } = await asUser.rpc("is_admin");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const opslag = admin.storage.from("klanten");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return antwoord({ fout: "Ongeldig verzoek" }, 400); }
  const actie = String(body.actie ?? "");
  const documentId = String(body.document_id ?? "");
  const geldigId = /^[0-9a-f-]{36}$/.test(documentId);

  // ---------- Jouw eigen handtekening ----------
  if (actie === "studio-handtekening") {
    if (!isAdmin) return antwoord({ fout: "Niet toegestaan" }, 403);
    const png = pngUitDataUrl(body.handtekening);
    if (!png) return antwoord({ fout: "Geen geldige handtekening" }, 400);
    const pad = "_studio/handtekening.png";
    const { error } = await opslag.upload(pad, png, { contentType: "image/png", upsert: true });
    if (error) return antwoord({ fout: "Opslaan lukte niet" }, 500);
    await admin.from("portal_settings").update({ handtekening_path: pad }).eq("id", 1);
    return antwoord({ opgeslagen: true });
  }

  // ---------- Archief (alleen jij) ----------
  if (actie === "archief-pdf") {
    if (!isAdmin) return antwoord({ fout: "Niet toegestaan" }, 403);
    if (!geldigId) return antwoord({ fout: "Niet gevonden" }, 404);
    const { data: a } = await admin.from("document_archief").select("*").eq("document_id", documentId).single();
    if (!a) return antwoord({ fout: "Niet gevonden" }, 404);
    const { data } = await opslag.download(a.pdf_path);
    if (!data) return antwoord({ fout: "PDF niet gevonden in het archief" }, 404);
    await admin.from("document_archief").update({ studio_download_op: new Date().toISOString() }).eq("document_id", documentId);
    return pdfAntwoord(new Uint8Array(await data.arrayBuffer()), bestandsnaam(a.titel, a.klant_naam));
  }

  // ---------- Document ophalen (klant: alleen haar eigen) ----------
  if (!geldigId) return antwoord({ fout: "Document niet gevonden" }, 404);
  const { data: doc } = await admin.from("documents").select("*").eq("id", documentId).single();
  if (!doc) return antwoord({ fout: "Document niet gevonden" }, 404);
  const { data: klant } = await admin.from("clients").select("id, user_id, naam, bedrijf, email").eq("id", doc.client_id).single();
  if (!klant) return antwoord({ fout: "Document niet gevonden" }, 404);
  const isEigen = klant.user_id === user.id;
  if (!isEigen && !isAdmin) return antwoord({ fout: "Document niet gevonden" }, 404);

  // ---------- PDF downloaden: pas na tekenen of akkoord ----------
  if (actie === "pdf") {
    if (doc.status !== "getekend" || !doc.pdf_path) {
      return antwoord({ fout: "De PDF is beschikbaar zodra het document is getekend of akkoord is gegeven." }, 409);
    }
    const { data } = await opslag.download(doc.pdf_path);
    if (!data) return antwoord({ fout: "PDF niet gevonden" }, 404);
    if (isEigen) await admin.from("activity").insert({ client_id: klant.id, type: "download", tekst: "downloadde " + doc.titel });
    if (isAdmin) await admin.from("document_archief").update({ studio_download_op: new Date().toISOString() }).eq("document_id", doc.id);
    return pdfAntwoord(new Uint8Array(await data.arrayBuffer()), bestandsnaam(doc.titel, isAdmin ? klant.naam : undefined));
  }

  // ---------- Tekenen of akkoord geven (alleen de klant zelf) ----------
  if (actie === "teken") {
    if (!isEigen) return antwoord({ fout: "Alleen de klant zelf kan dit document tekenen" }, 403);
    if (doc.status !== "te-tekenen") return antwoord({ fout: "Dit document is al getekend" }, 409);
    if (!doc.inhoud?.trim()) return antwoord({ fout: "Dit document heeft nog geen tekst. Neem contact op met Jasmijn." }, 409);
    const naam = String(body.naam ?? "").trim().slice(0, 120);
    if (naam.length < 2) return antwoord({ fout: "Vul je volledige naam in" }, 400);
    if (body.akkoord !== true) return antwoord({ fout: "Geef aan dat je het document hebt gelezen en akkoord gaat" }, 400);
    const png = doc.tekenen ? pngUitDataUrl(body.handtekening) : null;
    if (doc.tekenen && !png) return antwoord({ fout: "Zet je handtekening in het vak" }, 400);

    const { data: inst } = await admin.from("portal_settings").select("handtekening_path, ondertekenaar, document_velden").eq("id", 1).single();
    let studioPng: Uint8Array | null = null;
    if (doc.tekenen && inst?.handtekening_path) {
      const { data } = await opslag.download(inst.handtekening_path);
      if (data) studioPng = new Uint8Array(await data.arrayBuffer());
    }
    const studio = inst?.document_velden?.studio ?? {};
    const voet = [studio.naam ?? "Studio Crave", studio.kvk && !String(studio.kvk).startsWith("[") ? `KvK ${studio.kvk}` : null, studio.email ?? "info@studiocrave.nl"]
      .filter(Boolean).join(" · ");

    const op = new Date();
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const apparaat = req.headers.get("user-agent");
    const hash = await sha256Hex([doc.id, doc.versie ?? "", doc.titel, doc.inhoud, naam, klant.email, op.toISOString()].join("\n"));

    const pdf = await maakDocumentPdf({
      titel: doc.titel, inhoud: doc.inhoud, documentId: doc.id, versie: doc.versie,
      klant: { naam: klant.naam, bedrijf: klant.bedrijf, email: klant.email }, tekenen: doc.tekenen,
      logoPng: await haalLogo(), ondertekenaar: inst?.ondertekenaar ?? "Jasmijn Straver", bedrijfsgegevens: voet,
      handtekeningStudio: studioPng, ondertekening: { naam, handtekeningPng: png, op, ip, apparaat, hash },
    });

    const map = `${klant.id}/documenten`;
    const pdfPath = `${map}/${doc.id}.pdf`;
    const archiefPath = `_archief/${doc.id}.pdf`;
    const handtekeningPath = png ? `${map}/${doc.id}-handtekening.png` : null;
    const geschreven: string[] = [];
    const schrijf = async (pad: string, data: Uint8Array, type: string) => {
      const { error } = await opslag.upload(pad, data, { contentType: type, upsert: false });
      if (!error) geschreven.push(pad);
      return !error;
    };
    const ok = (await schrijf(pdfPath, pdf, "application/pdf"))
      && (await schrijf(archiefPath, pdf, "application/pdf"))
      && (!handtekeningPath || await schrijf(handtekeningPath, png!, "image/png"));
    if (!ok) {
      if (geschreven.length) await opslag.remove(geschreven);
      return antwoord({ fout: "Opslaan lukte niet. Probeer het opnieuw." }, 500);
    }
    // Alleen bijwerken als het nog steeds te tekenen is (twee keer tegelijk klikken)
    const { data: bijgewerkt, error } = await admin.from("documents").update({
      status: "getekend", getekend_op: op.toISOString(), getekend_ip: ip, getekend_naam: naam,
      getekend_agent: apparaat?.slice(0, 300) ?? null, getekend_hash: hash,
      handtekening_path: handtekeningPath, pdf_path: pdfPath, storage_path: pdfPath,
    }).eq("id", doc.id).eq("status", "te-tekenen").select("id");
    if (error || !bijgewerkt?.length) {
      await opslag.remove(geschreven);
      return antwoord({ fout: "Dit document is al getekend" }, 409);
    }
    await admin.from("activity").insert({ client_id: klant.id, type: "getekend", tekst: (doc.tekenen ? "tekende " : "gaf akkoord op ") + doc.titel });
    return antwoord({ getekend: true, getekend_op: op.toISOString() });
  }

  return antwoord({ fout: "Onbekende actie" }, 400);
});
