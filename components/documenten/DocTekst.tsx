import { Fragment } from "react";

// Toont de tekst van een document met dezelfde eenvoudige opmaak als de PDF:
// "# Kop", "## Tussenkop", "- punt", "1. punt", lege regel = nieuwe alinea, **vet**.
function zin(tekst: string) {
  return tekst.split(/(\*\*[^*]+\*\*)/).map((deel, i) =>
    /^\*\*[^*]+\*\*$/.test(deel) ? <strong key={i}>{deel.slice(2, -2)}</strong> : <Fragment key={i}>{deel}</Fragment>,
  );
}

type Blok =
  | { soort: "kop"; tekst: string }
  | { soort: "tussenkop"; tekst: string }
  | { soort: "subkop"; tekst: string }
  | { soort: "alinea"; tekst: string }
  | { soort: "lijst"; items: string[] }
  | { soort: "nummers"; items: string[] };

// "1. TAKEN" of "OVERIGE AFSPRAKEN": een korte regel helemaal in hoofdletters telt als kop (zelfde regel als de PDF)
function isHoofdletterKop(r: string) {
  const zonderNr = r.replace(/^\d+[.)]\s*/, "");
  return zonderNr.length >= 3 && zonderNr.length <= 60 && /[A-Z]{3}/.test(zonderNr) && zonderNr === zonderNr.toUpperCase() && !/[.:;]$/.test(zonderNr);
}

export function blokken(inhoud: string): Blok[] {
  const uit: Blok[] = [];
  for (const ruw of inhoud.replace(/\r\n/g, "\n").split("\n")) {
    const r = ruw.trim();
    const laatste = uit[uit.length - 1];
    if (!r) continue;
    if (/^#\s+/.test(r)) uit.push({ soort: "kop", tekst: r.replace(/^#\s+/, "") });
    else if (/^##\s+/.test(r) || isHoofdletterKop(r)) uit.push({ soort: "tussenkop", tekst: r.replace(/^##\s+/, "") });
    else if (/^###\s+/.test(r)) uit.push({ soort: "subkop", tekst: r.replace(/^###\s+/, "") });
    else if (/^[-*•]\s+/.test(r)) {
      const item = r.replace(/^[-*•]\s+/, "");
      if (laatste?.soort === "lijst") laatste.items.push(item);
      else uit.push({ soort: "lijst", items: [item] });
    } else if (/^\d+[.)]\s+/.test(r)) {
      const item = r.replace(/^\d+[.)]\s+/, "");
      if (laatste?.soort === "nummers") laatste.items.push(item);
      else uit.push({ soort: "nummers", items: [item] });
    } else uit.push({ soort: "alinea", tekst: r });
  }
  return uit;
}

export default function DocTekst({ inhoud, verbergEersteKop = false }: { inhoud: string; verbergEersteKop?: boolean }) {
  const lijst = blokken(inhoud);
  if (verbergEersteKop && lijst[0]?.soort === "kop") lijst.shift();
  return (
    <div className="doc-tekst grid gap-3 text-[15px] leading-relaxed">
      {lijst.map((b, i) => {
        if (b.soort === "kop") return <h2 key={i} className="wordmark text-3xl text-midnight mt-2">{zin(b.tekst)}</h2>;
        if (b.soort === "tussenkop") {
          const m = b.tekst.match(/^(\d+[.)])\s*(.*)$/);
          return (
            <h3 key={i} className="font-body font-bold uppercase tracking-[0.06em] text-[1.05rem] text-ink mt-6 flex gap-2.5">
              {m && <span className="text-pepper">{m[1]}</span>}
              <span>{zin(m ? m[2] : b.tekst)}</span>
            </h3>
          );
        }
        if (b.soort === "subkop") return <h4 key={i} className="font-semibold mt-2">{zin(b.tekst)}</h4>;
        if (b.soort === "lijst")
          return (
            <ul key={i} className="list-disc pl-5 grid gap-1 marker:text-gold">
              {b.items.map((t, j) => <li key={j}>{zin(t)}</li>)}
            </ul>
          );
        if (b.soort === "nummers")
          return (
            <ol key={i} className="list-decimal pl-5 grid gap-1 marker:text-burgundy">
              {b.items.map((t, j) => <li key={j}>{zin(t)}</li>)}
            </ol>
          );
        return <p key={i}>{zin(b.tekst)}</p>;
      })}
    </div>
  );
}
