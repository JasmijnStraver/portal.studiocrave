// =====================================================================
// Edge Function: teken-document
// Acties (body: { actie, ... }):
//   'teken'               klant tekent: { document_id, naam, handtekening }
//                         -> handtekening + PDF in de opslag, document vergrendeld
//   'pdf'                 PDF downloaden: { document_id } (klant: eigen document, of jij)
//                         -> getekend: de vastgelegde PDF; anders een actuele versie
//   'studio-handtekening' jij zet je eigen handtekening: { handtekening }
// 'handtekening' is een PNG als data-URL uit het tekenvak.
// Deploy: supabase functions deploy teken-document
// Secret (al gezet voor de andere functies): PORTAAL_URL
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
const MAX_PNG = 400_000; // bytes: ruim genoeg voor een handtekening

function pngUitDataUrl(s: unknown): Uint8Array | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bin = atob(m[1]);
  if (bin.length > MAX_PNG || bin.length < 200) return null;
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  // PNG-handtekening controleren
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return sig.every((b, i) => bytes[i] === b) ? bytes : null;
}

async function haalLogo(): Promise<Uint8Array | null> {
  try {
    const r = await fetch(`${SITE}/brand/studio-crave-logo-bordeaux.png`);
    return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return antwoord({ fout: "Niet ingelogd" }, 401);
  const { data: isAdmin } = await asUser.rpc("is_admin");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return antwoord({ fout: "Ongeldig verzoek" }, 400); }
  const actie = String(body.actie ?? "");

  const { data: inst } = await admin.from("portal_settings")
    .select("handtekening_path, ondertekenaar, bedrijfsgegevens").eq("id", 1).single();

  // ---------- Jouw eigen handtekening ----------
  if (actie === "studio-handtekening") {
    if (!isAdmin) return antwoord({ fout: "Niet toegestaan" }, 403);
    const png = pngUitDataUrl(body.handtekening);
    if (!png) return antwoord({ fout: "Geen geldige handtekening" }, 400);
    const pad = "_studio/handtekening.png";
    const { error } = await admin.storage.from("klanten").upload(pad, png, { contentType: "image/png", upsert: true });
    if (error) return antwoord({ fout: "Opslaan lukte niet" }, 500);
    await admin.from("portal_settings").update({ handtekening_path: pad }).eq("id", 1);
    return antwoord({ opgeslagen: true });
  }

  // ---------- Document ophalen (klant: alleen haar eigen) ----------
  const documentId = String(body.document_id ?? "");
  if (!/^[0-9a-f-]{36}$/.test(documentId)) return antwoord({ fout: "Document niet gevonden" }, 404);
  const { data: doc } = await admin.from("documents").select("*").eq("id", documentId).single();
  if (!doc) return antwoord({ fout: "Document niet gevonden" }, 404);
  const { data: klant } = await admin.from("clients").select("id, user_id, naam, bedrijf, email").eq("id", doc.client_id).single();
  if (!klant) return antwoord({ fout: "Document niet gevonden" }, 404);
  const isEigen = klant.user_id === user.id;
  if (!isEigen && !isAdmin) return antwoord({ fout: "Document niet gevonden" }, 404);

  const studioHandtekening = async () => {
    if (!inst?.handtekening_path) return null;
    const { data } = await admin.storage.from("klanten").download(inst.handtekening_path);
    return data ? new Uint8Array(await data.arrayBuffer()) : null;
  };
  const basis = async () => ({
    titel: doc.titel,
    inhoud: doc.inhoud ?? "",
    documentId: doc.id,
    versie: doc.versie,
    klant: { naam: klant.naam, bedrijf: klant.bedrijf, email: klant.email },
    tekenen: doc.tekenen,
    logoPng: await haalLogo(),
    ondertekenaar: inst?.ondertekenaar ?? "Jasmijn Straver",
    bedrijfsgegevens: inst?.bedrijfsgegevens ?? "Studio Crave · info@studiocrave.nl",
    handtekeningStudio: await studioHandtekening(),
  });

  // ---------- PDF downloaden ----------
  if (actie === "pdf") {
    let bytes: Uint8Array | null = null;
    if (doc.status === "getekend" && doc.pdf_path) {
      const { data } = await admin.storage.from("klanten").download(doc.pdf_path);
      if (data) bytes = new Uint8Array(await data.arrayBuffer());
    }
    if (!bytes) bytes = await maakDocumentPdf({ ...(await basis()), ondertekening: null });
    if (isEigen) await admin.from("activity").insert({ client_id: klant.id, type: "download", tekst: "downloadde " + doc.titel });
    const bestand = doc.titel.replace(/[^\p{L}\p{N} -]/gu, "").trim().replace(/\s+/g, "-") + ".pdf";
    return new Response(bytes, {
      headers: { ...cors, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${bestand}"` },
    });
  }

  // ---------- Tekenen (alleen de klant zelf) ----------
  if (actie === "teken") {
    if (!isEigen) return antwoord({ fout: "Alleen de klant zelf kan dit document tekenen" }, 403);
    if (!doc.tekenen || doc.status !== "te-tekenen") return antwoord({ fout: "Dit document is al getekend of hoeft niet getekend te worden" }, 409);
    if (!doc.inhoud?.trim()) return antwoord({ fout: "Dit document heeft nog geen tekst. Neem contact op met Jasmijn." }, 409);
    const naam = String(body.naam ?? "").trim().slice(0, 120);
    if (naam.length < 2) return antwoord({ fout: "Vul je volledige naam in" }, 400);
    if (body.akkoord !== true) return antwoord({ fout: "Geef aan dat je het document hebt gelezen" }, 400);
    const png = pngUitDataUrl(body.handtekening);
    if (!png) return antwoord({ fout: "Zet je handtekening in het vak" }, 400);

    const op = new Date();
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const apparaat = req.headers.get("user-agent");
    // Vingerafdruk van precies deze tekst, deze ondertekenaar en dit moment
    const hash = await sha256Hex([doc.id, doc.versie ?? "", doc.titel, doc.inhoud, naam, klant.email, op.toISOString()].join("\n"));

    const pdf = await maakDocumentPdf({ ...(await basis()), ondertekening: { naam, handtekeningPng: png, op, ip, apparaat, hash } });
    const map = `${klant.id}/documenten`;
    const handtekeningPath = `${map}/${doc.id}-handtekening.png`;
    const pdfPath = `${map}/${doc.id}.pdf`;
    const up1 = await admin.storage.from("klanten").upload(handtekeningPath, png, { contentType: "image/png", upsert: false });
    const up2 = await admin.storage.from("klanten").upload(pdfPath, pdf, { contentType: "application/pdf", upsert: false });
    if (up1.error || up2.error) {
      await admin.storage.from("klanten").remove([handtekeningPath, pdfPath]);
      return antwoord({ fout: "Opslaan lukte niet. Probeer het opnieuw." }, 500);
    }
    // Alleen bijwerken als het nog steeds te tekenen is (twee keer tegelijk klikken)
    const { data: bijgewerkt, error } = await admin.from("documents").update({
      status: "getekend", getekend_op: op.toISOString(), getekend_ip: ip, getekend_naam: naam,
      getekend_agent: apparaat?.slice(0, 300) ?? null, getekend_hash: hash,
      handtekening_path: handtekeningPath, pdf_path: pdfPath, storage_path: pdfPath,
    }).eq("id", doc.id).eq("status", "te-tekenen").select("id");
    if (error || !bijgewerkt?.length) {
      await admin.storage.from("klanten").remove([handtekeningPath, pdfPath]);
      return antwoord({ fout: "Dit document is al getekend" }, 409);
    }
    await admin.from("activity").insert({ client_id: klant.id, type: "getekend", tekst: "tekende " + doc.titel });
    return antwoord({ getekend: true, getekend_op: op.toISOString() });
  }

  return antwoord({ fout: "Onbekende actie" }, 400);
});
