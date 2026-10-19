"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { datumTijd, downloadPdf } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import SignaturePad from "@/components/documenten/SignaturePad";
import type { DocumentRow } from "@/lib/supabase/types";

export default function DocumentView({ doc, naam: standaardNaam }: { doc: DocumentRow; naam: string }) {
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

  const kanTekenen = doc.status === "te-tekenen" && doc.tekenen && !!doc.inhoud?.trim();
  const klaar = naam.trim().length >= 2 && akkoord && !!handtekening;

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

      <div className="flex flex-wrap items-end justify-between gap-4 mt-3 mb-6 border-b border-line pb-5">
        <div>
          <h1 className="wordmark text-4xl text-midnight">{doc.titel}</h1>
          <p className="small muted mt-1">
            {doc.status === "getekend"
              ? `Getekend door ${doc.getekend_naam ?? standaardNaam} op ${datumTijd(doc.getekend_op)}`
              : doc.status === "info"
                ? "Ter informatie"
                : "Lees het document en teken onderaan"}
          </p>
        </div>
        {doc.status !== "te-tekenen" && (
          <button className="btn ghost" onClick={download} disabled={bezig}>
            {bezig ? "Bezig..." : "Download PDF"}
          </button>
        )}
      </div>

      <article className="rounded-md border border-line bg-surface p-6 md:p-10">
        {doc.inhoud?.trim() ? (
          <DocTekst inhoud={doc.inhoud} verbergEersteKop />
        ) : (
          <p className="muted">Jasmijn zet de tekst van dit document nog voor je klaar.</p>
        )}
      </article>

      {kanTekenen && (
        <section className="mt-8 rounded-md border border-line bg-surface p-6 md:p-8 grid gap-5">
          <div>
            <h2 className="wordmark text-2xl text-midnight">Ondertekenen</h2>
            <p className="small muted mt-1">
              Je handtekening komt samen met de datum en tijd in de PDF. Daarna kun je het document altijd downloaden, en is het vastgelegd zoals het hier staat.
            </p>
          </div>
          <label className="field max-w-sm">
            Je volledige naam
            <input value={naam} onChange={(e) => setNaam(e.target.value)} autoComplete="name" />
          </label>
          <div className="field">
            Je handtekening
            <SignaturePad onChange={setHandtekening} />
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} className="mt-1" />
            Ik heb &ldquo;{doc.titel}&rdquo; gelezen en ga ermee akkoord.
          </label>
          {fout && <p className="text-sm text-pepper">{fout}</p>}
          <div>
            <button className="btn gold" disabled={!klaar || bezig} onClick={teken}>
              {bezig ? "Bezig met tekenen..." : "Teken document"}
            </button>
          </div>
        </section>
      )}

      {doc.status !== "te-tekenen" && fout && <p className="text-sm text-pepper mt-4">{fout}</p>}
    </div>
  );
}
