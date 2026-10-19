"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COURSES, COURSE_ORDER, type CourseId } from "@/lib/content/courses";
import { PAKKETTEN, STANDAARD_WELKOM } from "@/lib/content/packages";
import { checkItems } from "@/lib/content/checklist";
import { datumTijd, downloadPdf } from "@/lib/content/documenten";
import DocTekst from "@/components/documenten/DocTekst";
import type { Client, ClientCourse, CourseStatus, DocumentRow, ActivityRow } from "@/lib/supabase/types";
import type { Profiel } from "@/lib/content/profiel";

type Tab = "checklist" | "menu" | "profiel" | "documenten" | "activiteit" | "gegevens";
const TABS: { id: Tab; label: string }[] = [
  { id: "checklist", label: "Checklist" },
  { id: "menu", label: "Menu" },
  { id: "profiel", label: "Brand Foundation" },
  { id: "documenten", label: "Documenten" },
  { id: "activiteit", label: "Activiteit" },
  { id: "gegevens", label: "Gegevens" },
];

interface SjabloonMeta {
  id: string;
  titel: string;
}

interface SkillMeta {
  id: string;
  naam: string;
  course: string;
}

export default function ClientDetail({
  client,
  courses,
  documents,
  activiteit,
  liveSkills,
  allSkills,
  sjablonen = [],
}: {
  client: Client;
  courses: ClientCourse[];
  documents: DocumentRow[];
  activiteit: ActivityRow[];
  liveSkills: SkillMeta[];
  allSkills: SkillMeta[];
  sjablonen?: SjabloonMeta[];
}) {
  const [tab, setTab] = useState<Tab>("checklist");
  const voornaam = (client.naam || "").split(" ")[0];

  return (
    <div>
      <div className="pagehead flex flex-wrap justify-between gap-4 items-end border-b border-line pb-5 mb-6">
        <div>
          <h1 className="wordmark text-4xl text-midnight">{client.naam}</h1>
          <p className="muted small mt-1">
            {client.bedrijf} · {client.email} · {PAKKETTEN[client.pakket]?.naam}
          </p>
        </div>
      </div>

      <div className="tabs flex gap-5 -mt-2 mb-7 border-b border-line overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2.5 -mb-px border-b-2 whitespace-nowrap text-sm font-medium ${
              tab === t.id ? "border-pepper text-ink" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "checklist" && <ChecklistTab client={client} courses={courses} documents={documents} />}
      {tab === "menu" && <MenuTab clientId={client.id} courses={courses} liveSkills={liveSkills} allSkills={allSkills} />}
      {tab === "profiel" && <ProfielTab client={client} />}
      {tab === "documenten" && <DocumentenTab clientId={client.id} documents={documents} sjablonen={sjablonen} />}
      {tab === "activiteit" && <ActiviteitTab activiteit={activiteit} />}
      {tab === "gegevens" && <GegevensTab client={client} voornaam={voornaam} />}
    </div>
  );
}

function ChecklistTab({ client, courses, documents }: { client: Client; courses: ClientCourse[]; documents: DocumentRow[] }) {
  const router = useRouter();
  const handmatig = (client.checklist as Record<string, boolean>) || {};
  const [lokaal, setLokaal] = useState(handmatig);
  const fases = checkItems({ client, courses, files: [], documents, handmatig: lokaal });

  async function vink(id: string, waarde: boolean) {
    const nieuw = { ...lokaal, [id]: waarde };
    setLokaal(nieuw);
    const supabase = createClient();
    await supabase.from("clients").update({ checklist: nieuw }).eq("id", client.id);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      {fases.map((f) => (
        <div key={f.fase}>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted mb-2">{f.fase}</h3>
          <ul className="grid gap-1.5">
            {f.items.map((i) => (
              <li key={i.id}>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={i.klaar} disabled={!!i.auto} onChange={(e) => vink(i.id, e.target.checked)} className="mt-0.5" />
                  <span className={i.klaar ? "line-through muted" : ""}>{i.t}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const STATUS_OPTIES: CourseStatus[] = ["dicht", "open", "bezig", "klaar"];

function MenuTab({
  clientId,
  courses,
  liveSkills,
  allSkills,
  sjablonen = [],
}: {
  clientId: string;
  courses: ClientCourse[];
  liveSkills: SkillMeta[];
  allSkills: SkillMeta[];
  sjablonen?: SjabloonMeta[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<CourseId | null>(null);

  async function updateCourse(course: string, patch: Partial<ClientCourse>) {
    const supabase = createClient();
    await supabase.from("client_courses").update(patch).eq("client_id", clientId).eq("course", course);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      {COURSE_ORDER.filter((id) => id !== "finale").map((id) => {
        const row = courses.find((c) => c.course === id);
        if (!row) return null;
        const content = COURSES[id];
        const skillsHier = allSkills.filter((s) => s.course === id);
        return (
          <div key={id} className="rounded-md border border-line bg-surface">
            <button onClick={() => setOpen(open === id ? null : id)} className="w-full flex items-center justify-between px-5 py-3 text-left">
              <span className="wordmark text-xl text-midnight">
                {content.nr} {content.naam}
              </span>
              <span className={`pill ${row.status}`}>{row.status}</span>
            </button>
            {open === id && (
              <div className="px-5 pb-5 grid gap-4">
                <label className="field">
                  Status
                  <select value={row.status} onChange={(e) => updateCourse(id, { status: e.target.value as CourseStatus })}>
                    {STATUS_OPTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Notitie voor de klant
                  <textarea defaultValue={row.notitie ?? ""} onBlur={(e) => updateCourse(id, { notitie: e.target.value })} />
                </label>
                {!!skillsHier.length && (
                  <div>
                    <p className="small muted mb-1">Skills aan voor deze klant</p>
                    <div className="flex flex-wrap gap-2">
                      {skillsHier.map((s) => {
                        const aan = (row.skills || []).includes(s.id);
                        const live = liveSkills.some((ls) => ls.id === s.id);
                        return (
                          <button
                            key={s.id}
                            disabled={!live}
                            onClick={() => updateCourse(id, { skills: aan ? row.skills.filter((x) => x !== s.id) : [...row.skills, s.id] })}
                            className={`text-xs px-3 py-1.5 rounded-full border ${aan ? "bg-burgundy text-creme border-burgundy" : "border-line"} ${!live ? "opacity-40" : ""}`}
                            title={live ? "" : "Nog niet live"}
                          >
                            {s.naam}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfielTab({ client }: { client: Client }) {
  const router = useRouter();
  const p = (client.profiel as Profiel) || {};
  const [velden, setVelden] = useState<Profiel>(p);
  const [pijlersTekst, setPijlersTekst] = useState((p.pijlers || []).join("\n"));
  const [bezig, setBezig] = useState(false);

  async function opslaan() {
    setBezig(true);
    const supabase = createClient();
    const nieuw: Profiel = {
      ...velden,
      pijlers: pijlersTekst
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 4),
    };
    await supabase
      .from("clients")
      .update({ profiel: nieuw as unknown as Record<string, string | string[]> })
      .eq("id", client.id);
    setBezig(false);
    router.refresh();
  }

  const veld = (key: keyof Profiel) => velden[key] as string | undefined;
  const set = (key: keyof Profiel, value: string) => setVelden((v) => ({ ...v, [key]: value }));

  return (
    <div className="max-w-xl grid gap-4">
      <p className="small muted">
        Dit kaartje gaat mee in elke skill die {client.naam} gebruikt. Archetype uit de quiz:{" "}
        <strong>{p.archetype || "nog geen quiz gedaan"}</strong>.
      </p>
      <label className="field">
        Kernbelofte
        <textarea value={veld("kernbelofte") || ""} onChange={(e) => set("kernbelofte", e.target.value)} />
      </label>
      <label className="field">
        Doelgroep
        <input value={veld("doelgroep") || ""} onChange={(e) => set("doelgroep", e.target.value)} />
      </label>
      <label className="field">
        Waar haar klant vastloopt
        <textarea value={veld("pijn") || ""} onChange={(e) => set("pijn", e.target.value)} />
      </label>
      <label className="field">
        Resultaat dat ze levert
        <textarea value={veld("resultaat") || ""} onChange={(e) => set("resultaat", e.target.value)} />
      </label>
      <label className="field">
        Positionering (wat dit NIET is)
        <textarea value={veld("positionering") || ""} onChange={(e) => set("positionering", e.target.value)} />
      </label>
      <label className="field">
        Content-pijlers (één per regel, max 4)
        <textarea value={pijlersTekst} onChange={(e) => setPijlersTekst(e.target.value)} />
      </label>
      <label className="field">
        Toon
        <input value={veld("toon") || ""} onChange={(e) => set("toon", e.target.value)} />
      </label>
      <label className="field">
        Nooit
        <input value={veld("nooit") || ""} onChange={(e) => set("nooit", e.target.value)} />
      </label>
      <button onClick={opslaan} disabled={bezig} className="btn gold justify-center">
        {bezig ? "Bezig..." : "Opslaan"}
      </button>
    </div>
  );
}

function DocumentenTab({ clientId, documents, sjablonen }: { clientId: string; documents: DocumentRow[]; sjablonen: SjabloonMeta[] }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [kies, setKies] = useState("");
  const aanwezig = new Set(documents.map((d) => d.template_id));
  const beschikbaar = sjablonen.filter((s) => !aanwezig.has(s.id));

  async function klaarzetten(template?: string) {
    setBezig(true);
    setMelding("");
    const { data, error } = await createClient().rpc("documenten_klaarzetten", { p_client: clientId, p_template: template ?? null });
    setBezig(false);
    setKies("");
    setMelding(error ? "Dat lukte niet." : data ? `${data} document${data === 1 ? "" : "en"} klaargezet.` : "Alles staat al klaar en is bijgewerkt.");
    router.refresh();
  }

  async function verwijderen(d: DocumentRow) {
    if (!confirm(`"${d.titel}" weghalen bij deze klant?`)) return;
    await createClient().from("documents").delete().eq("id", d.id);
    router.refresh();
  }

  async function download(d: DocumentRow) {
    setBezig(true);
    try {
      await downloadPdf(createClient(), d.id, d.titel);
    } catch {
      setMelding("Downloaden lukte niet.");
    }
    setBezig(false);
  }

  return (
    <div className="grid gap-6">
      <ul className="grid gap-2">
        {documents.map((d) => (
          <li key={d.id} className="rounded-md border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
              <span>
                <span className="block">{d.titel}</span>
                <span className="small muted">
                  {d.status === "getekend"
                    ? `Getekend door ${d.getekend_naam ?? "klant"} op ${datumTijd(d.getekend_op)}`
                    : d.status === "info"
                      ? "Ter informatie"
                      : "Wacht op handtekening"}
                  {d.versie ? ` · versie ${d.versie}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={`pill ${d.status === "getekend" ? "klaar" : "open"}`}>{d.status === "getekend" ? "Getekend" : d.status === "info" ? "Info" : "Te tekenen"}</span>
                <button className="small underline muted" onClick={() => setOpen(open === d.id ? null : d.id)}>
                  {open === d.id ? "Sluiten" : "Bekijken"}
                </button>
                <button className="btn sm ghost" disabled={bezig} onClick={() => download(d)}>
                  PDF
                </button>
                {d.status !== "getekend" && (
                  <button className="small underline muted" onClick={() => verwijderen(d)}>
                    Weghalen
                  </button>
                )}
              </span>
            </div>
            {open === d.id && (
              <div className="border-t border-line p-5 bg-bg">
                {d.inhoud?.trim() ? <DocTekst inhoud={d.inhoud} /> : <p className="muted small">Nog geen tekst.</p>}
                {d.status === "getekend" && d.getekend_hash && (
                  <p className="small muted mt-4 break-all">
                    IP {d.getekend_ip ?? "onbekend"} · vingerafdruk {d.getekend_hash}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
        {!documents.length && <p className="muted small">Nog geen documenten voor deze klant.</p>}
      </ul>

      <div className="flex flex-wrap items-end gap-3">
        <button onClick={() => klaarzetten()} disabled={bezig} className="btn ghost">
          Klaarzetten volgens pakket en extra&apos;s
        </button>
        {beschikbaar.length > 0 && (
          <div className="flex items-end gap-2">
            <label className="field">
              Handmatig toevoegen
              <select value={kies} onChange={(e) => setKies(e.target.value)}>
                <option value="">Kies een document</option>
                {beschikbaar.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titel}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn sm" disabled={!kies || bezig} onClick={() => klaarzetten(kies)}>
              Toevoegen
            </button>
          </div>
        )}
      </div>
      {melding && <p className="small muted">{melding}</p>}
      <p className="small muted">
        De teksten pas je aan onder Keuken → Documenten. Bij een nieuwe klant en bij een bijgeboekte extra gebeurt het klaarzetten vanzelf.
      </p>
    </div>
  );
}

function ActiviteitTab({ activiteit }: { activiteit: ActivityRow[] }) {
  return (
    <ul className="grid gap-2">
      {activiteit.map((a) => (
        <li key={a.id} className="small rounded-md border border-line bg-surface px-3 py-2">
          {a.tekst} <span className="muted">· {new Date(a.created_at).toLocaleString("nl-NL")}</span>
        </li>
      ))}
      {!activiteit.length && <p className="muted small">Nog geen activiteit.</p>}
    </ul>
  );
}

function GegevensTab({ client, voornaam }: { client: Client; voornaam: string }) {
  const router = useRouter();
  const [naam, setNaam] = useState(client.naam);
  const [bedrijf, setBedrijf] = useState(client.bedrijf ?? "");
  const [welkom, setWelkom] = useState(client.welkom ?? STANDAARD_WELKOM);
  const [bezig, setBezig] = useState(false);

  async function opslaan() {
    setBezig(true);
    const supabase = createClient();
    await supabase.from("clients").update({ naam, bedrijf, welkom }).eq("id", client.id);
    setBezig(false);
    router.refresh();
  }

  async function uitnodigen() {
    setBezig(true);
    const supabase = createClient();
    await supabase.functions.invoke("uitnodigen", { body: { client_id: client.id } });
    setBezig(false);
    router.refresh();
  }

  return (
    <div className="max-w-md grid gap-4">
      <label className="field">
        Naam
        <input value={naam} onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="field">
        Bedrijf
        <input value={bedrijf} onChange={(e) => setBedrijf(e.target.value)} />
      </label>
      <label className="field">
        Welkomstbericht ({voornaam} ziet dit op haar homepagina)
        <textarea value={welkom} onChange={(e) => setWelkom(e.target.value)} />
      </label>
      <div className="flex gap-3">
        <button onClick={opslaan} disabled={bezig} className="btn gold">
          Opslaan
        </button>
        <button onClick={uitnodigen} disabled={bezig} className="btn ghost">
          {client.uitgenodigd ? "Uitnodiging opnieuw sturen" : "Uitnodigen"}
        </button>
      </div>
      {client.uitgenodigd && <p className="small muted">Uitnodiging verstuurd.</p>}
    </div>
  );
}
