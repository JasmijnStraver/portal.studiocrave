"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOC_EXTRAS, INVULVELDEN, PAKKET_LABELS } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import SignaturePad from "@/components/documenten/SignaturePad";
import type { DocumentTemplate } from "@/lib/supabase/types";

interface Instellingen {
  handtekening_path: string | null;
  ondertekenaar: string;
  bedrijfsgegevens: string;
}

export default function DocumentSjablonen({ sjablonen, instellingen }: { sjablonen: DocumentTemplate[]; instellingen: Instellingen }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [nieuw, setNieuw] = useState("");

  async function toevoegen() {
    const titel = nieuw.trim();
    if (!titel) return;
    const id = titel.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await createClient().from("document_templates").insert({
      id, titel, type: "Overig", tekenen: true, automatisch: false, volgorde: sjablonen.length + 1, inhoud: `# ${titel}\n\n`,
    });
    if (!error) {
      setNieuw("");
      setOpen(id);
      router.refresh();
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="wordmark text-4xl text-midnight mb-2">Documenten</h1>
      <p className="muted mb-8 max-w-2xl">
        Je contracten en voorwaarden als sjabloon. Bij een nieuwe klant, en zodra je een extra bijboekt, zet het portaal de juiste documenten
        klaar met haar gegevens ingevuld. Zij tekent in haar portaal; jullie downloaden allebei dezelfde PDF.
      </p>

      <Handtekening instellingen={instellingen} />

      <h2 className="wordmark text-2xl text-midnight mt-10 mb-3">Sjablonen</h2>
      <ul className="grid gap-2">
        {sjablonen.map((s) => (
          <li key={s.id} className="rounded-md border border-line bg-surface">
            <button className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
              <span>
                <span className="block">{s.titel}</span>
                <span className="small muted">
                  {s.automatisch
                    ? [...s.pakketten.map((p) => PAKKET_LABELS[p] ?? p), ...s.extras.map((e) => `bij ${e.toLowerCase()}`)].join(", ") || "Nergens automatisch"
                    : "Handmatig toevoegen"}
                  {" · "}
                  {s.tekenen ? "met handtekening" : "ter info"} · versie {s.versie}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {/Plak hier/.test(s.inhoud) && <span className="pill open">Tekst nog inladen</span>}
                <span className="small muted">{open === s.id ? "Sluiten" : "Bewerken"}</span>
              </span>
            </button>
            {open === s.id && <SjabloonEditor sjabloon={s} onOpgeslagen={() => router.refresh()} />}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4 max-w-md">
        <label className="field flex-1">
          Nieuw sjabloon
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
        titel: s.titel,
        type: s.type,
        tekenen: s.tekenen,
        automatisch: s.automatisch,
        pakketten: s.pakketten,
        extras: s.extras,
        inhoud: s.inhoud,
        versie: tekstAnders ? sjabloon.versie + 1 : sjabloon.versie,
        updated_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) {
      setBezig(false);
      setMelding("Opslaan lukte niet.");
      return;
    }
    let tekst = "Opgeslagen.";
    if (tekstAnders) {
      const { data: n } = await supabase.rpc("sjabloon_doorvoeren", { p_template: s.id });
      tekst = n ? `Opgeslagen en bijgewerkt bij ${n} ${n === 1 ? "klant" : "klanten"} die nog niet getekend had${n === 1 ? "" : "den"}.` : "Opgeslagen.";
    }
    setBezig(false);
    setMelding(tekst);
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
          <input type="checkbox" checked={s.tekenen} onChange={(e) => setS({ ...s, tekenen: e.target.checked })} />
          Handtekening nodig
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.automatisch} onChange={(e) => setS({ ...s, automatisch: e.target.checked })} />
          Automatisch klaarzetten
        </label>
      </div>

      {s.automatisch && (
        <div className="grid md:grid-cols-2 gap-4">
          <fieldset className="grid gap-1.5 text-sm">
            <legend className="small muted mb-1">Bij deze pakketten</legend>
            {Object.entries(PAKKET_LABELS).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={s.pakketten.includes(k)} onChange={() => setS({ ...s, pakketten: wissel(s.pakketten, k) })} />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset className="grid gap-1.5 text-sm content-start">
            <legend className="small muted mb-1">En zodra deze extra geboekt is</legend>
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
            {voorbeeld ? "Terug naar bewerken" : "Bekijk zoals de klant het ziet"}
          </button>
        </div>
        {voorbeeld ? (
          <div className="rounded-md border border-line p-5 bg-bg">
            <DocTekst inhoud={s.inhoud} />
          </div>
        ) : (
          <label className="field">
            <span className="sr-only">Tekst</span>
            <textarea value={s.inhoud} onChange={(e) => setS({ ...s, inhoud: e.target.value })} style={{ minHeight: "22rem", fontFamily: "ui-monospace, Menlo, monospace", fontSize: ".82rem" }} />
          </label>
        )}
        <p className="small muted">
          Opmaak: <code># Kop</code>, <code>## Tussenkop</code>, <code>- punt</code>, <code>1. punt</code>, <code>**vet**</code>, lege regel voor een nieuwe alinea. Invulvelden:{" "}
          {INVULVELDEN.map((v) => <code key={v} className="mr-1">{v}</code>)}
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

function Handtekening({ instellingen }: { instellingen: Instellingen }) {
  const router = useRouter();
  const [naam, setNaam] = useState(instellingen.ondertekenaar);
  const [voet, setVoet] = useState(instellingen.bedrijfsgegevens);
  const [png, setPng] = useState<string | null>(null);
  const [huidig, setHuidig] = useState<string | null>(null);
  const [wijzigen, setWijzigen] = useState(!instellingen.handtekening_path);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  useEffect(() => {
    if (!instellingen.handtekening_path) return;
    createClient()
      .storage.from("klanten")
      .createSignedUrl(instellingen.handtekening_path, 600)
      .then(({ data }) => setHuidig(data?.signedUrl ?? null));
  }, [instellingen.handtekening_path]);

  async function opslaan() {
    setBezig(true);
    setMelding("");
    const supabase = createClient();
    const { error } = await supabase.from("portal_settings").update({ ondertekenaar: naam.trim(), bedrijfsgegevens: voet.trim() }).eq("id", 1);
    let ok = !error;
    if (ok && png) {
      const { data, error: e2 } = await supabase.functions.invoke("teken-document", { body: { actie: "studio-handtekening", handtekening: png } });
      ok = !e2 && !!data?.opgeslagen;
    }
    setBezig(false);
    setMelding(ok ? "Opgeslagen. Dit komt op elk nieuw getekend document." : "Opslaan lukte niet.");
    if (ok) {
      setWijzigen(false);
      setPng(null);
      router.refresh();
    }
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5 grid gap-4">
      <div>
        <h2 className="wordmark text-2xl text-midnight">Jouw handtekening</h2>
        <p className="small muted mt-1">Staat namens Studio Crave naast de handtekening van je klant, op elk document met handtekening.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="field">
          Naam onder je handtekening
          <input value={naam} onChange={(e) => setNaam(e.target.value)} />
        </label>
        <label className="field">
          Voetregel op elke pagina
          <input value={voet} onChange={(e) => setVoet(e.target.value)} placeholder="Studio Crave · KvK ... · info@studiocrave.nl" />
        </label>
      </div>
      {wijzigen ? (
        <div className="max-w-md">
          <SignaturePad onChange={setPng} label="Teken hier je eigen handtekening" />
        </div>
      ) : (
        <div className="flex items-end gap-4">
          {huidig ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={huidig} alt="Jouw handtekening" className="h-20 w-auto rounded border border-line" style={{ background: "#fff" }} />
          ) : (
            <span className="small muted">Handtekening opgeslagen.</span>
          )}
          <button className="small underline muted" onClick={() => setWijzigen(true)}>
            Opnieuw tekenen
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          className="btn sm"
          disabled={bezig || (!png && naam === instellingen.ondertekenaar && voet === instellingen.bedrijfsgegevens)}
          onClick={opslaan}
        >
          {bezig ? "Bezig..." : "Opslaan"}
        </button>
        {melding && <span className="small muted">{melding}</span>}
      </div>
    </section>
  );
}
