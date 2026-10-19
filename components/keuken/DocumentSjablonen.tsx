"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOC_EXTRAS, INVULVELDEN, PAKKET_LABELS, type DocumentVelden } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import SignaturePad from "@/components/documenten/SignaturePad";
import DocumentView from "@/components/portal/DocumentView";
import type { DocumentTemplate } from "@/lib/supabase/types";

type Tab = "aanbod" | "sjablonen" | "gegevens" | "handtekening";
const TABS: { id: Tab; label: string }[] = [
  { id: "aanbod", label: "Per aanbod" },
  { id: "sjablonen", label: "Teksten" },
  { id: "gegevens", label: "Gegevens en prijzen" },
  { id: "handtekening", label: "Jouw handtekening" },
];
const PAKKETTEN = Object.keys(PAKKET_LABELS);

// Welke documenten krijgt een klant met dit aanbod (en deze extra's)? Zelfde regel als in de database.
function documentenVoor(sjablonen: DocumentTemplate[], pakket: string, extras: string[]) {
  return sjablonen.filter((s) => s.automatisch && (s.pakketten.includes(pakket) || s.extras.some((e) => extras.includes(e))));
}

export default function DocumentSjablonen({
  sjablonen,
  ondertekenaar,
  handtekeningUrl,
  velden,
}: {
  sjablonen: DocumentTemplate[];
  ondertekenaar: string;
  handtekeningUrl: string | null;
  velden: DocumentVelden;
}) {
  const [tab, setTab] = useState<Tab>("aanbod");

  return (
    <div className="max-w-5xl">
      <h1 className="wordmark text-4xl text-midnight mb-2">Documenten</h1>
      <p className="muted mb-6 max-w-2xl">
        Je standaarddocumenten voor klanten. Bij een nieuwe klant, en zodra je een extra bijboekt, zet het portaal de juiste documenten klaar met haar
        gegevens ingevuld. Zij leest ze in haar dashboard en tekent of geeft akkoord; pas daarna kunnen jullie de PDF downloaden.
      </p>

      <div className="tabs flex gap-5 mb-7 border-b border-line overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2.5 -mb-px text-sm whitespace-nowrap border-b-2 ${tab === t.id ? "border-gold text-ink" : "border-transparent muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "aanbod" && <PerAanbod sjablonen={sjablonen} ondertekenaar={ondertekenaar} handtekeningUrl={handtekeningUrl} />}
      {tab === "sjablonen" && <Sjablonen sjablonen={sjablonen} />}
      {tab === "gegevens" && <Gegevens velden={velden} />}
      {tab === "handtekening" && <Handtekening ondertekenaar={ondertekenaar} handtekeningUrl={handtekeningUrl} />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Per aanbod: overzicht + voorbeeld precies zoals de klant het ziet
// ---------------------------------------------------------------------
function PerAanbod({ sjablonen, ondertekenaar, handtekeningUrl }: { sjablonen: DocumentTemplate[]; ondertekenaar: string; handtekeningUrl: string | null }) {
  const [pakket, setPakket] = useState("dwy");
  const [extras, setExtras] = useState<string[]>([]);
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [na, setNa] = useState(false);
  const [tekst, setTekst] = useState<string | null>(null);
  const lijst = useMemo(() => documentenVoor(sjablonen, pakket, extras), [sjablonen, pakket, extras]);
  const handmatig = sjablonen.filter((s) => !s.automatisch);
  const sjabloon = sjablonen.find((s) => s.id === gekozen) ?? null;

  useEffect(() => {
    if (!gekozen) return;
    setTekst(null);
    createClient()
      .rpc("document_voorbeeld", { p_template: gekozen, p_pakket: pakket, p_extras: extras })
      .then(({ data }) => setTekst((data as string) ?? ""));
  }, [gekozen, pakket, extras]);

  const teken = (s: DocumentTemplate) => (s.tekenen ? "Handtekening" : "Akkoord");

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="wordmark text-2xl text-midnight mb-3">Welk aanbod krijgt welke documenten</h2>
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-3 py-2.5 font-medium">Document</th>
                {PAKKETTEN.map((p) => (
                  <th key={p} className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {PAKKET_LABELS[p]}
                  </th>
                ))}
                <th className="px-3 py-2.5 font-medium">Ook bij bijboeken</th>
              </tr>
            </thead>
            <tbody>
              {sjablonen.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="block">{s.titel}</span>
                    <span className="small muted">{teken(s)}</span>
                  </td>
                  {PAKKETTEN.map((p) => (
                    <td key={p} className="px-3 py-2.5 text-center">
                      {s.automatisch && s.pakketten.includes(p) ? <span className="text-burgundy" aria-label="ja">●</span> : <span className="muted" aria-label="nee">·</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 small">
                    {s.automatisch ? s.extras.join(", ") || "—" : <span className="muted">Handmatig toevoegen</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted mt-2">Aanpassen per document kan onder Teksten.</p>
      </section>

      <section className="grid gap-4">
        <h2 className="wordmark text-2xl text-midnight">Bekijk als klant</h2>
        <div className="flex flex-wrap gap-2">
          {PAKKETTEN.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPakket(p);
                setGekozen(null);
              }}
              className={`btn sm ${pakket === p ? "" : "ghost"}`}
            >
              {PAKKET_LABELS[p]}
            </button>
          ))}
        </div>
        {pakket !== "dwy" && (
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="muted">Bijgeboekt:</span>
            {DOC_EXTRAS.filter((e) => !(pakket === "templates" && e === "Branded templates") && !(pakket === "identity" && e === "Craveable Identity")).map((e) => (
              <label key={e} className="flex items-center gap-1.5">
                <input type="checkbox" checked={extras.includes(e)} onChange={() => setExtras(extras.includes(e) ? extras.filter((x) => x !== e) : [...extras, e])} />
                {e}
              </label>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
          <div className="grid gap-2">
            <p className="small muted">Zo ziet haar lijst Documenten eruit:</p>
            {lijst.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setGekozen(s.id);
                  setNa(false);
                }}
                className={`text-left rounded-md border px-3 py-2.5 bg-surface ${gekozen === s.id ? "border-gold" : "border-line"}`}
              >
                <span className="block text-sm">{s.titel}</span>
                <span className="small muted">{s.tekenen ? "Lezen en tekenen" : "Lezen en akkoord geven"}</span>
              </button>
            ))}
            {handmatig.length > 0 && (
              <>
                <p className="small muted mt-3">Voeg je per klant toe:</p>
                {handmatig.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setGekozen(s.id);
                      setNa(false);
                    }}
                    className={`text-left rounded-md border border-dashed px-3 py-2 ${gekozen === s.id ? "border-gold" : "border-line"}`}
                  >
                    <span className="block text-sm">{s.titel}</span>
                  </button>
                ))}
              </>
            )}
          </div>

          <div>
            {!sjabloon && <p className="muted small mt-6">Kies een document om te zien wat je klant ziet, met een voorbeeldklant (Sanne de Vries, Bloei Coaching).</p>}
            {sjabloon && (
              <>
                <div className="flex gap-2 mb-1">
                  <button className={`btn sm ${!na ? "" : "ghost"}`} onClick={() => setNa(false)}>
                    Vóór {sjabloon.tekenen ? "tekenen" : "akkoord"}
                  </button>
                  <button className={`btn sm ${na ? "" : "ghost"}`} onClick={() => setNa(true)}>
                    Na {sjabloon.tekenen ? "tekenen" : "akkoord"}
                  </button>
                </div>
                {tekst === null ? (
                  <p className="muted small mt-6">Voorbeeld laden...</p>
                ) : (
                  <DocumentView
                    key={`${sjabloon.id}-${pakket}-${na}`}
                    voorbeeld
                    terugHref={null}
                    doc={{
                      id: "voorbeeld",
                      titel: sjabloon.titel,
                      inhoud: tekst,
                      tekenen: sjabloon.tekenen,
                      status: na ? "getekend" : "te-tekenen",
                      getekend_op: na ? new Date().toISOString() : null,
                      getekend_naam: na ? "Sanne de Vries" : null,
                    }}
                    naam="Sanne de Vries"
                    bedrijf="Bloei Coaching"
                    ondertekenaar={ondertekenaar}
                    studioHandtekening={handtekeningUrl}
                    eigenHandtekening={null}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------
// Teksten bewerken
// ---------------------------------------------------------------------
function Sjablonen({ sjablonen }: { sjablonen: DocumentTemplate[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [nieuw, setNieuw] = useState("");

  async function toevoegen() {
    const titel = nieuw.trim();
    if (!titel) return;
    const id = titel.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await createClient().from("document_templates").insert({
      id, titel, type: "Overig", tekenen: true, automatisch: false, volgorde: sjablonen.length + 1, inhoud: `# ${titel}\n\n## 1. Onderwerp\n\n`,
    });
    if (!error) {
      setNieuw("");
      setOpen(id);
      router.refresh();
    }
  }

  return (
    <div>
      <ul className="grid gap-2">
        {sjablonen.map((s) => (
          <li key={s.id} className="rounded-md border border-line bg-surface">
            <button className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
              <span>
                <span className="block">{s.titel}</span>
                <span className="small muted">
                  {s.tekenen ? "Handtekening" : "Akkoord"} · versie {s.versie} · bijgewerkt {new Date(s.updated_at).toLocaleDateString("nl-NL")}
                </span>
              </span>
              <span className="small muted">{open === s.id ? "Sluiten" : "Bewerken"}</span>
            </button>
            {open === s.id && <SjabloonEditor sjabloon={s} onOpgeslagen={() => router.refresh()} />}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-4 max-w-md">
        <label className="field flex-1">
          Nieuw document
          <input value={nieuw} onChange={(e) => setNieuw(e.target.value)} placeholder="Bijv. Akkoord offerte website" />
        </label>
        <button className="btn sm self-end" disabled={!nieuw.trim()} onClick={toevoegen}>
          Toevoegen
        </button>
      </div>
    </div>
  );
}

function SjabloonEditor({ sjabloon, onOpgeslagen }: { sjabloon: DocumentTemplate; onOpgeslagen: () => void }) {
  const [s, setS] = useState(sjabloon);
  const [voorbeeld, setVoorbeeld] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");
  const gewijzigd = JSON.stringify(s) !== JSON.stringify(sjabloon);
  const wissel = (lijst: string[], waarde: string) => (lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde]);

  async function opslaan() {
    setBezig(true);
    setMelding("");
    const supabase = createClient();
    const tekstAnders = s.inhoud !== sjabloon.inhoud || s.titel !== sjabloon.titel || s.tekenen !== sjabloon.tekenen;
    const { error } = await supabase
      .from("document_templates")
      .update({
        titel: s.titel, type: s.type, tekenen: s.tekenen, automatisch: s.automatisch, pakketten: s.pakketten, extras: s.extras, inhoud: s.inhoud,
        versie: tekstAnders ? sjabloon.versie + 1 : sjabloon.versie, updated_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) {
      setBezig(false);
      setMelding("Opslaan lukte niet.");
      return;
    }
    const { data: n } = await supabase.rpc("sjabloon_doorvoeren", { p_template: s.id });
    setBezig(false);
    setMelding(n ? `Opgeslagen, en bijgewerkt bij ${n} ${n === 1 ? "klant" : "klanten"} die nog niet getekend had${n === 1 ? "" : "den"}.` : "Opgeslagen.");
    onOpgeslagen();
  }

  return (
    <div className="border-t border-line p-4 grid gap-4">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="field">
          Titel
          <input value={s.titel} onChange={(e) => setS({ ...s, titel: e.target.value })} />
        </label>
        <label className="field">
          Soort document
          <input value={s.type} onChange={(e) => setS({ ...s, type: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={s.tekenen} onChange={() => setS({ ...s, tekenen: true })} />
          Klant tekent met handtekening
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!s.tekenen} onChange={() => setS({ ...s, tekenen: false })} />
          Klant geeft akkoord
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.automatisch} onChange={(e) => setS({ ...s, automatisch: e.target.checked })} />
          Automatisch klaarzetten
        </label>
      </div>
      {s.automatisch && (
        <div className="grid md:grid-cols-2 gap-4">
          <fieldset className="grid gap-1.5 text-sm">
            <legend className="small muted mb-1">Bij deze aanbiedingen</legend>
            {PAKKETTEN.map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={s.pakketten.includes(k)} onChange={() => setS({ ...s, pakketten: wissel(s.pakketten, k) })} />
                {PAKKET_LABELS[k]}
              </label>
            ))}
          </fieldset>
          <fieldset className="grid gap-1.5 text-sm content-start">
            <legend className="small muted mb-1">En zodra deze extra bijgeboekt is</legend>
            {DOC_EXTRAS.map((e) => (
              <label key={e} className="flex items-center gap-2">
                <input type="checkbox" checked={s.extras.includes(e)} onChange={() => setS({ ...s, extras: wissel(s.extras, e) })} />
                {e}
              </label>
            ))}
          </fieldset>
        </div>
      )}
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="small muted">Tekst</span>
          <button className="small underline muted" onClick={() => setVoorbeeld(!voorbeeld)}>
            {voorbeeld ? "Terug naar bewerken" : "Bekijk opgemaakt"}
          </button>
        </div>
        {voorbeeld ? (
          <div className="rounded-md border border-line p-5 bg-bg">
            <DocTekst inhoud={s.inhoud} />
          </div>
        ) : (
          <label className="field">
            <span className="sr-only">Tekst</span>
            <textarea value={s.inhoud} onChange={(e) => setS({ ...s, inhoud: e.target.value })} style={{ minHeight: "26rem", fontFamily: "ui-monospace, Menlo, monospace", fontSize: ".82rem" }} />
          </label>
        )}
        <p className="small muted">
          Opmaak: <code># Titel</code>, <code>## 1. Kop</code> (of een regel in hoofdletters, zoals <code>2. LEVERTERMIJN</code>), <code>- punt</code>, <code>1. punt</code>,{" "}
          <code>**vet**</code>, lege regel voor een nieuwe alinea. Invulvelden: {INVULVELDEN.map((v) => <code key={v} className="mr-1">{v}</code>)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn sm" disabled={!gewijzigd || bezig || !s.titel.trim()} onClick={opslaan}>
          {bezig ? "Bezig..." : "Opslaan"}
        </button>
        {melding && <span className="small muted">{melding}</span>}
      </div>
      <p className="small muted">Getekende documenten veranderen nooit mee: die blijven precies zoals ze getekend zijn.</p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Jouw gegevens en de gegevens per aanbod (worden ingevuld in de teksten)
// ---------------------------------------------------------------------
function Gegevens({ velden }: { velden: DocumentVelden }) {
  const router = useRouter();
  const [v, setV] = useState<DocumentVelden>({ studio: velden.studio ?? {}, pakketten: velden.pakketten ?? {}, extras: velden.extras ?? {} });
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");
  const gewijzigd = JSON.stringify(v) !== JSON.stringify(velden);
  const studio = (k: keyof DocumentVelden["studio"], label: string) => (
    <label className="field">
      {label}
      <input value={v.studio[k] ?? ""} onChange={(e) => setV({ ...v, studio: { ...v.studio, [k]: e.target.value } })} />
    </label>
  );
  const pakVeld = (p: string, k: "prijs" | "looptijd" | "toegang" | "werkwijze" | "inhoud", label: string, area = false) => (
    <label className="field">
      {label}
      {area ? (
        <textarea value={v.pakketten[p]?.[k] ?? ""} onChange={(e) => setV({ ...v, pakketten: { ...v.pakketten, [p]: { ...v.pakketten[p], [k]: e.target.value } } })} />
      ) : (
        <input value={v.pakketten[p]?.[k] ?? ""} onChange={(e) => setV({ ...v, pakketten: { ...v.pakketten, [p]: { ...v.pakketten[p], [k]: e.target.value } } })} />
      )}
    </label>
  );

  async function opslaan() {
    setBezig(true);
    setMelding("");
    const supabase = createClient();
    const { error } = await supabase.from("portal_settings").update({ document_velden: v as never }).eq("id", 1);
    if (error) {
      setBezig(false);
      setMelding("Opslaan lukte niet.");
      return;
    }
    const { data: n } = await supabase.rpc("documenten_alles_bijwerken");
    setBezig(false);
    setMelding(n ? `Opgeslagen, en bijgewerkt in de nog niet getekende documenten van ${n} ${n === 1 ? "klant" : "klanten"}.` : "Opgeslagen.");
    router.refresh();
  }

  const leeg = Object.values(v.studio).some((x) => !x || String(x).startsWith("["));

  return (
    <div className="grid gap-8">
      <section className="rounded-md border border-line bg-surface p-5 grid gap-3">
        <h2 className="wordmark text-2xl text-midnight">Jouw bedrijfsgegevens</h2>
        <p className="small muted">Staan in de overeenkomst, voorwaarden en privacyverklaring.</p>
        {leeg && <p className="small rounded-md border border-gold/60 px-3 py-2">Vul je adres, KvK- en btw-nummer in, dan staan ze goed in alle documenten.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {studio("naam", "Bedrijfsnaam")}
          {studio("email", "E-mailadres")}
          {studio("adres", "Adres")}
          {studio("kvk", "KvK-nummer")}
          {studio("btw", "Btw-nummer")}
        </div>
      </section>

      {PAKKETTEN.map((p) => (
        <section key={p} className="rounded-md border border-line bg-surface p-5 grid gap-3">
          <h2 className="wordmark text-2xl text-midnight">{PAKKET_LABELS[p]}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {pakVeld(p, "prijs", "Prijs {prijs}")}
            {pakVeld(p, "looptijd", "Looptijd {looptijd}")}
            {pakVeld(p, "toegang", "Toegang tot het portaal {toegang}")}
          </div>
          {pakVeld(p, "inhoud", "Wat is inbegrepen {inhoud} (één punt per regel, met - ervoor)", true)}
          {pakVeld(p, "werkwijze", "Hoe jullie samenwerken {werkwijze}", true)}
        </section>
      ))}

      <section className="rounded-md border border-line bg-surface p-5 grid gap-3">
        <h2 className="wordmark text-2xl text-midnight">Extra&apos;s</h2>
        <p className="small muted">Komt onder &ldquo;Bijgeboekt&rdquo; in de overeenkomst {"{extras}"}, als de klant dit heeft bijgeboekt.</p>
        {Object.keys(v.extras).map((e) => (
          <label key={e} className="field">
            {e}
            <textarea value={v.extras[e]} onChange={(ev) => setV({ ...v, extras: { ...v.extras, [e]: ev.target.value } })} style={{ minHeight: "4rem" }} />
          </label>
        ))}
      </section>

      <div className="flex items-center gap-3 sticky bottom-4">
        <button className="btn gold" disabled={!gewijzigd || bezig} onClick={opslaan}>
          {bezig ? "Bezig..." : "Opslaan en documenten bijwerken"}
        </button>
        {melding && <span className="small muted">{melding}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Jouw handtekening
// ---------------------------------------------------------------------
function Handtekening({ ondertekenaar, handtekeningUrl }: { ondertekenaar: string; handtekeningUrl: string | null }) {
  const router = useRouter();
  const [naam, setNaam] = useState(ondertekenaar);
  const [png, setPng] = useState<string | null>(null);
  const [wijzigen, setWijzigen] = useState(!handtekeningUrl);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  async function opslaan() {
    setBezig(true);
    setMelding("");
    const supabase = createClient();
    const { error } = await supabase.from("portal_settings").update({ ondertekenaar: naam.trim() }).eq("id", 1);
    let ok = !error;
    if (ok && png) {
      const { data, error: e2 } = await supabase.functions.invoke("teken-document", { body: { actie: "studio-handtekening", handtekening: png } });
      ok = !e2 && !!data?.opgeslagen;
    }
    setBezig(false);
    setMelding(ok ? "Opgeslagen. Je handtekening staat nu onder elk document met handtekening." : "Opslaan lukte niet.");
    if (ok) {
      setWijzigen(false);
      setPng(null);
      router.refresh();
    }
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5 grid gap-4 max-w-xl">
      <div>
        <h2 className="wordmark text-2xl text-midnight">Jouw handtekening</h2>
        <p className="small muted mt-1">Je klant ziet hem al onder het document, naast haar eigen tekenvak, en hij staat op elke PDF.</p>
      </div>
      <label className="field">
        Naam onder je handtekening
        <input value={naam} onChange={(e) => setNaam(e.target.value)} />
      </label>
      {wijzigen ? (
        <SignaturePad onChange={setPng} label="Teken hier je eigen handtekening" />
      ) : (
        <div className="flex items-end gap-4">
          {handtekeningUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={handtekeningUrl} alt="Jouw handtekening" className="h-20 w-auto rounded border border-line" style={{ background: "#fff" }} />
          )}
          <button className="small underline muted" onClick={() => setWijzigen(true)}>
            Opnieuw tekenen
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button className="btn sm" disabled={bezig || (!png && naam === ondertekenaar)} onClick={opslaan}>
          {bezig ? "Bezig..." : "Opslaan"}
        </button>
        {melding && <span className="small muted">{melding}</span>}
      </div>
    </section>
  );
}
