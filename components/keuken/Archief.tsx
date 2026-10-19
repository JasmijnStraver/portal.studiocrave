"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { datumTijd } from "@/lib/content/documenten";
import type { ArchiefRow } from "@/lib/supabase/types";

async function downloadUitArchief(id: string, bestand: string) {
  const { data, error } = await createClient().functions.invoke("teken-document", { body: { actie: "archief-pdf", document_id: id } });
  if (error || !(data instanceof Blob)) throw new Error("Downloaden lukte niet");
  const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = bestand;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const naam = (r: ArchiefRow) =>
  `${r.titel} ${r.klant_naam}`.replace(/[^\p{L}\p{N} -]/gu, "").trim().replace(/\s+/g, "-") + ".pdf";

export default function Archief({ rijen }: { rijen: ArchiefRow[] }) {
  const router = useRouter();
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState("");
  const nieuw = rijen.filter((r) => !r.studio_download_op);

  async function een(r: ArchiefRow) {
    setBezig(r.document_id);
    setFout("");
    try {
      await downloadUitArchief(r.document_id, naam(r));
    } catch {
      setFout("Downloaden lukte niet. Probeer het opnieuw.");
    }
    setBezig(null);
    router.refresh();
  }

  async function alleNieuwe() {
    setBezig("alle");
    setFout("");
    for (const r of nieuw) {
      try {
        await downloadUitArchief(r.document_id, naam(r));
        await new Promise((ok) => setTimeout(ok, 600)); // browsers houden niet van tien downloads tegelijk
      } catch {
        setFout(`Niet gelukt: ${r.titel} van ${r.klant_naam}. De rest is wel gedownload.`);
      }
    }
    setBezig(null);
    router.refresh();
  }

  return (
    <div className="max-w-5xl">
      <h1 className="wordmark text-4xl text-midnight mb-2">Archief</h1>
      <p className="muted mb-6 max-w-2xl">
        Elk getekend document en elk gegeven akkoord, als vaste PDF. Het archief bewaart ze 7 jaar (fiscale bewaarplicht), ook als je een klant op haar
        verzoek verwijdert, en ze kunnen niet worden gewist. Download ze ook zelf voor je eigen administratie.
      </p>

      {nieuw.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-gold/60 bg-surface px-4 py-3 mb-5">
          <span className="text-sm">
            {nieuw.length === 1 ? "1 document heb je" : `${nieuw.length} documenten heb je`} nog niet zelf opgeslagen.
          </span>
          <button className="btn sm gold" disabled={!!bezig} onClick={alleNieuwe}>
            {bezig === "alle" ? "Bezig..." : "Alles downloaden"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2.5 font-medium">Document</th>
              <th className="px-3 py-2.5 font-medium">Klant</th>
              <th className="px-3 py-2.5 font-medium">Getekend</th>
              <th className="px-3 py-2.5 font-medium">Bewaren tot</th>
              <th className="px-3 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rijen.map((r) => (
              <tr key={r.document_id} className="border-b border-line last:border-0 align-top">
                <td className="px-3 py-2.5">
                  <span className="block">{r.titel}</span>
                  <span className="small muted">{r.handtekening ? "Handtekening" : "Akkoord"}{r.versie ? ` · versie ${r.versie}` : ""}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="block">{r.klant_naam}</span>
                  <span className="small muted">
                    {r.klant_bedrijf ? `${r.klant_bedrijf} · ` : ""}
                    {r.klant_email}
                    {!r.client_id ? " · verwijderd" : ""}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{datumTijd(r.getekend_op)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{new Date(r.bewaren_tot).toLocaleDateString("nl-NL")}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {!r.studio_download_op && <span className="pill open mr-2">Nog niet opgeslagen</span>}
                  <button className="btn sm ghost" disabled={!!bezig} onClick={() => een(r)}>
                    {bezig === r.document_id ? "Bezig..." : "PDF"}
                  </button>
                </td>
              </tr>
            ))}
            {!rijen.length && (
              <tr>
                <td colSpan={5} className="px-3 py-6 muted small">
                  Nog niets getekend. Zodra een klant tekent of akkoord geeft, staat het hier.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {fout && <p className="text-sm text-pepper mt-3">{fout}</p>}
    </div>
  );
}
