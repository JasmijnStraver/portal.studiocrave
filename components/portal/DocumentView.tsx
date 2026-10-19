"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { datumTijd, downloadPdf } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import SignaturePad from "@/components/documenten/SignaturePad";
import type { DocumentRow } from "@/lib/supabase/types";

// Het document opent volledig in het dashboard. Onderaan staat het ondertekenblok
// (Studio Crave en de klant naast elkaar). Pas na het tekenen verschijnt de PDF-download.
export default function DocumentView({
  doc,
  naam: standaardNaam,
  bedrijf,
  ondertekenaar,
  studioHandtekening,
  eigenHandtekening,
}: {
  doc: DocumentRow;
  naam: string;
  bedrijf: string | null;
  ondertekenaar: string;
  studioHandtekening: string | null;
  eigenHandtekening: string | null;
}) {
  const router = useRouter();
  const [naam, setNaam] = useState(standaardNaam);
  const [akkoord, setAkkoord] = useState(false);
  const [handtekening, setHandtekening] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  // Jasmijn ziet in haar meldingen dat het document geopend is
  useEffect(() => {
    createClient().rpc("log_document_open", { p_doc: doc.id }).then(() => {});
  }, [doc.id]);

  const getekend = doc.status === "getekend";
  const kanTekenen = doc.status === "te-tekenen" && doc.tekenen && !!doc.inhoud?.trim();
  const klaar = naam.trim().length >= 2 && akkoord && !!handtekening;
  const klantLabel = bedrijf ? `Namens ${bedrijf}` : "Klant";

  async function teken() {
    if (!klaar) return;
    setBezig(true);
    setFout("");
    const { data, error } = await createClient().functions.invoke("teken-document", {
      body: { actie: "teken", document_id: doc.id, naam: naam.trim(), akkoord, handtekening },
    });
    setBezig(false);
    if (error || !data?.getekend) {
      let bericht = "Tekenen lukte niet. Probeer het opnieuw.";
      try {
        const body = await (error as { context?: Response })?.context?.json();
        if (body?.fout) bericht = body.fout;
      } catch {}
      setFout(bericht);
      return;
    }
    router.refresh();
  }

  async function download() {
    setBezig(true);
    setFout("");
    try {
      await downloadPdf(createClient(), doc.id, doc.titel);
    } catch {
      setFout("Downloaden lukte niet. Probeer het opnieuw.");
    }
    setBezig(false);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/documenten" className="small muted hover:text-burgundy">
        ← Alle documenten
      </Link>

      <article className="mt-4 rounded-md border border-line bg-surface p-6 md:p-12">
        <header className="mb-8">
          <h1 className="wordmark text-4xl md:text-5xl text-midnight">{doc.titel}</h1>
          <p className="small muted mt-2">
            {getekend
              ? `Getekend op ${datumTijd(doc.getekend_op)}`
              : doc.status === "info"
                ? "Ter informatie"
                : "Lees het document rustig door en teken onderaan"}
          </p>
        </header>

        {doc.inhoud?.trim() ? (
          <DocTekst inhoud={doc.inhoud} verbergEersteKop />
        ) : (
          <p className="muted">Jasmijn zet de tekst van dit document nog voor je klaar.</p>
        )}

        {doc.tekenen && doc.inhoud?.trim() && (
          <section className="mt-12" aria-labelledby="ondertekening">
            <h3 id="ondertekening" className="font-body font-bold uppercase tracking-[0.06em] text-[1.05rem] text-ink">
              Ondertekening
            </h3>

            <div className="grid sm:grid-cols-2 gap-8 mt-5">
              {/* Studio Crave */}
              <div>
                <p className="text-xs uppercase tracking-[0.08em] muted">Namens Studio Crave</p>
                <div className="h-28 flex items-end border-b border-ink/60 mt-2 pb-1">
                  {studioHandtekening && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={studioHandtekening} alt={`Handtekening ${ondertekenaar}`} className="max-h-24 w-auto dark:invert" />
                  )}
                </div>
                <p className="mt-2 text-sm">{ondertekenaar}</p>
              </div>

              {/* Klant */}
              <div>
                <p className="text-xs uppercase tracking-[0.08em] muted">{klantLabel}</p>
                {getekend ? (
                  <>
                    <div className="h-28 flex items-end border-b border-ink/60 mt-2 pb-1">
                      {eigenHandtekening && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={eigenHandtekening} alt="Jouw handtekening" className="max-h-24 w-auto dark:invert" />
                      )}
                    </div>
                    <p className="mt-2 text-sm">{doc.getekend_naam ?? standaardNaam}</p>
                    <p className="small muted">{datumTijd(doc.getekend_op)}</p>
                  </>
                ) : kanTekenen ? (
                  <div className="mt-2 grid gap-3">
                    <SignaturePad onChange={setHandtekening} />
                    <label className="field">
                      Je volledige naam
                      <input value={naam} onChange={(e) => setNaam(e.target.value)} autoComplete="name" />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>

            {kanTekenen && (
              <div className="mt-8 grid gap-4">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} className="mt-1" />
                  Ik heb &ldquo;{doc.titel}&rdquo; gelezen en ga ermee akkoord.
                </label>
                <div>
                  <button className="btn gold" disabled={!klaar || bezig} onClick={teken}>
                    {bezig ? "Bezig met tekenen..." : "Teken document"}
                  </button>
                </div>
                <p className="small muted">Na het tekenen wordt het document vastgelegd zoals het hier staat, en kun je het als PDF downloaden.</p>
              </div>
            )}
          </section>
        )}

        {(getekend || doc.status === "info") && (
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center gap-3">
            <button className="btn" onClick={download} disabled={bezig}>
              {bezig ? "Bezig..." : "Download als PDF"}
            </button>
            {getekend && <span className="small muted">Met beide handtekeningen en het ondertekeningsbewijs.</span>}
          </div>
        )}

        {fout && <p className="text-sm text-pepper mt-4">{fout}</p>}
      </article>
    </div>
  );
}
