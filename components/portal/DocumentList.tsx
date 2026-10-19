"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downloadPdf } from "@/lib/content/documenten";
import type { DocumentRow } from "@/lib/supabase/types";

function datum(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export default function DocumentList({ documents }: { documents: DocumentRow[] }) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState("");

  async function download(d: DocumentRow) {
    setBezig(d.id);
    setFout("");
    try {
      await downloadPdf(createClient(), d.id, d.titel);
    } catch {
      setFout("Downloaden lukte niet. Probeer het opnieuw.");
    }
    setBezig(null);
  }

  if (!documents.length) return <p className="muted small">Hier staat nog niets voor je klaar.</p>;

  const teTekenen = documents.filter((d) => d.status === "te-tekenen");

  return (
    <div className="grid gap-4">
      {teTekenen.length > 0 && (
        <p className="small rounded-md border border-gold/60 bg-surface px-4 py-3">
          {teTekenen.length === 1 ? "Er staat 1 document" : `Er staan ${teTekenen.length} documenten`} voor je klaar om te tekenen.
        </p>
      )}
      <ul className="grid gap-2">
        {documents.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
            <Link href={`/documenten/${d.id}`} className="min-w-0 hover:text-burgundy">
              <span className="block">{d.titel}</span>
              <span className="small muted">
                {d.status === "getekend" && d.getekend_op ? `Getekend op ${datum(d.getekend_op)}` : d.status === "info" ? "Ter informatie" : "Nog te tekenen"}
              </span>
            </Link>
            <span className="flex items-center gap-2 shrink-0">
              {d.status === "te-tekenen" ? (
                <Link href={`/documenten/${d.id}`} className="btn sm gold">
                  Lezen en tekenen
                </Link>
              ) : (
                <>
                  <span className="pill klaar">{d.status === "getekend" ? "Getekend" : "Info"}</span>
                  <button className="btn sm ghost" disabled={bezig === d.id} onClick={() => download(d)}>
                    {bezig === d.id ? "Bezig..." : "Download PDF"}
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {fout && <p className="text-sm text-pepper">{fout}</p>}
    </div>
  );
}
