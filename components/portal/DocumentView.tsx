"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { datumTijd, downloadPdf } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import SignaturePad from "@/components/documenten/SignaturePad";

export interface DocWeergave {
  id: string;
  titel: string;
  inhoud: string | null;
  tekenen: boolean; // true = handtekening, false = akkoord geven
  status: string;
  getekend_op: string | null;
  getekend_naam: string | null;
}

// Het document opent volledig in het dashboard. Onderaan tekent de klant (contract) of geeft
// ze akkoord (voorwaarden, privacy, welkomstgids). Pas daarna verschijnt de PDF-download.
// Met `voorbeeld` laat je in de keuken precies zien wat de klant ziet, zonder iets op te slaan.
export default function DocumentView({
  doc,
  naam: standaardNaam,
  bedrijf,
  ondertekenaar,
  studioHandtekening,
  eigenHandtekening,
  voorbeeld = false,
  terugHref = "/documenten",
}: {
  doc: DocWeergave;
  naam: string;
  bedrijf: string | null;
  ondertekenaar: string;
  studioHandtekening: string | null;
  eigenHandtekening: string | null;
  voorbeeld?: boolean;
  terugHref?: string | null;
}) {
  const router = useRouter();
  const [naam, setNaam] = useState(standaardNaam);
  const [akkoord, setAkkoord] = useState(false);
  const [handtekening, setHandtekening] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");

  useEffect(() => {
    if (!voorbeeld) createClient().rpc("log_document_open", { p_doc: doc.id }).then(() => {});
  }, [doc.id, voorbeeld]);

  const getekend = doc.status === "getekend";
  const heeftTekst = !!doc.inhoud?.trim();
  const kanTekenen = !getekend && heeftTekst;
  const klaar = naam.trim().length >= 2 && akkoord && (!doc.tekenen || !!handtekening);
  const klantLabel = bedrijf ? `Namens ${bedrijf}` : "Klant";

  async function teken() {
    if (!klaar) return;
    if (voorbeeld) {
      setMelding(`Voorbeeld: hier zou ${doc.tekenen ? "het document getekend worden" : "akkoord worden gegeven"}, waarna de klant de PDF kan downloaden.`);
      return;
    }
    setBezig(true);
    setFout("");
    const { data, error } = await createClient().functions.invoke("teken-document", {
      body: { actie: "teken", document_id: doc.id, naam: naam.trim(), akkoord, handtekening },
    });
    setBezig(false);
    if (error || !data?.getekend) {
      let bericht = "Dat lukte niet. Probeer het opnieuw.";
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
    if (voorbeeld) return;
    setBezig(true);
    setFout("");
    try {
      await downloadPdf(createClient(), doc.id, doc.titel);
    } catch {
      setFout("Downloaden lukte niet. Probeer het opnieuw.");
    }
    setBezig(false);
  }

  const kopStijl = "font-body font-bold uppercase tracking-[0.06em] text-[1.05rem] text-ink";

  return (
    <div className="max-w-3xl">
      {terugHref && (
        <Link href={terugHref} className="small muted hover:text-burgundy">
          ← Alle documenten
        </Link>
      )}

      <article className="mt-4 rounded-md border border-line bg-surface p-6 md:p-12">
        <header className="mb-8">
          <h1 className="wordmark text-4xl md:text-5xl text-midnight">{doc.titel}</h1>
          <p className="small muted mt-2">
            {getekend
              ? `${doc.tekenen ? "Getekend" : "Akkoord gegeven"} op ${datumTijd(doc.getekend_op)}`
              : doc.tekenen
                ? "Lees het document rustig door en teken onderaan"
                : "Lees het document rustig door en geef onderaan akkoord"}
          </p>
        </header>

        {heeftTekst ? (
          <DocTekst inhoud={doc.inhoud!} verbergEersteKop />
        ) : (
          <p className="muted">Jasmijn zet de tekst van dit document nog voor je klaar.</p>
        )}

        {heeftTekst && doc.tekenen && (
          <section className="mt-12" aria-labelledby="ondertekening">
            <h3 id="ondertekening" className={kopStijl}>
              Ondertekening
            </h3>
            <div className="grid sm:grid-cols-2 gap-8 mt-5">
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
              <div>
                <p className="text-xs uppercase tracking-[0.08em] muted">{klantLabel}</p>
                {getekend ? (
                  <>
                    <div className="h-28 flex items-end border-b border-ink/60 mt-2 pb-1">
                      {eigenHandtekening && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={eigenHandtekening} alt="Handtekening klant" className="max-h-24 w-auto dark:invert" />
                      )}
                    </div>
                    <p className="mt-2 text-sm">{doc.getekend_naam ?? standaardNaam}</p>
                    <p className="small muted">{datumTijd(doc.getekend_op)}</p>
                  </>
                ) : (
                  <div className="mt-2 grid gap-3">
                    <SignaturePad onChange={setHandtekening} />
                    <label className="field">
                      Je volledige naam
                      <input value={naam} onChange={(e) => setNaam(e.target.value)} autoComplete="name" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {heeftTekst && !doc.tekenen && (
          <section className="mt-12" aria-labelledby="akkoord">
            <h3 id="akkoord" className={kopStijl}>
              Akkoord
            </h3>
            {getekend ? (
              <p className="mt-3 text-sm">
                Akkoord gegeven door {doc.getekend_naam ?? standaardNaam} op {datumTijd(doc.getekend_op)}.
              </p>
            ) : (
              <label className="field max-w-sm mt-4">
                Je volledige naam
                <input value={naam} onChange={(e) => setNaam(e.target.value)} autoComplete="name" />
              </label>
            )}
          </section>
        )}

        {kanTekenen && (
          <div className="mt-6 grid gap-4">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} className="mt-1" />
              Ik heb &ldquo;{doc.titel}&rdquo; gelezen en ga ermee akkoord.
            </label>
            <div>
              <button className="btn gold" disabled={!klaar || bezig} onClick={teken}>
                {bezig ? "Bezig..." : doc.tekenen ? "Teken document" : "Akkoord geven"}
              </button>
            </div>
            <p className="small muted">Daarna wordt het document vastgelegd zoals het hier staat, en kun je het als PDF downloaden.</p>
          </div>
        )}

        {getekend && (
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center gap-3">
            <button className="btn" onClick={download} disabled={bezig || voorbeeld}>
              {bezig ? "Bezig..." : "Download als PDF"}
            </button>
            <span className="small muted">{doc.tekenen ? "Met beide handtekeningen en het ondertekeningsbewijs." : "Met het bewijs van je akkoord."}</span>
          </div>
        )}

        {melding && <p className="small rounded-md border border-gold/60 px-4 py-3 mt-5">{melding}</p>}
        {fout && <p className="text-sm text-pepper mt-4">{fout}</p>}
      </article>
    </div>
  );
}
