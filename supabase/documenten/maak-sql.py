#!/usr/bin/env python3
"""Maakt supabase/05-documenten-standaard.sql uit de teksten in deze map.

Pas je een standaardtekst hier aan (voor nieuwe installaties), draai dan:
    python3 supabase/documenten/maak-sql.py
In een draaiend portaal pas je teksten gewoon aan in Keuken -> Documenten.
"""
from pathlib import Path

MAP = Path(__file__).parent
ALLE = ["dwy", "audit", "templates", "identity", "zelf"]

# id, titel, type, tekenen (handtekening; anders akkoord), pakketten, extras, automatisch
SJABLONEN = [
    ("algemene-voorwaarden", "Algemene voorwaarden", "Algemene voorwaarden", False, ALLE, [], True),
    ("privacyverklaring", "Privacyverklaring", "Privacyverklaring", False, ALLE, [], True),
    ("overeenkomst", "Overeenkomst van opdracht", "Overeenkomst", True, ["dwy", "audit", "templates", "identity"], [], True),
    ("intellectueel-eigendom", "Intellectueel eigendom en licentie", "Intellectueel eigendom", True,
     ["dwy", "templates", "identity"], ["Branded templates", "Craveable Identity"], True),
    ("beeldrechten-shoot", "Beeldrechten en licentie brand shoot", "Beeldrechten & licentie", True, ["dwy"], ["Brand shoot"], True),
    ("modelrelease", "Modelrelease", "Modelrelease", True, ["dwy"], ["Brand shoot"], True),
    ("welkomstgids", "Welkomstgids", "Welkomstgids", False, ALLE, [], True),
    ("toestemming-klantcase", "Toestemming klantcase en review", "Toestemming", True, [], [], False),
    ("verwerkersovereenkomst", "Verwerkersovereenkomst", "Verwerkersovereenkomst", True, [], [], False),
]


def lijst(xs):
    return "array[" + ",".join("'" + x.replace("'", "''") + "'" for x in xs) + "]::text[]" if xs else "'{}'::text[]"


regels = [
    "-- =====================================================================",
    "-- Standaardteksten voor alle documenten. Gemaakt door supabase/documenten/maak-sql.py",
    "-- Draai dit NA 04-documenten.sql. Bestaande sjablonen (die je al hebt aangepast) blijven staan.",
    "-- =====================================================================",
    "insert into public.document_templates (id, titel, type, tekenen, pakketten, extras, automatisch, volgorde, inhoud) values",
]
waarden = []
for i, (sid, titel, typ, tekenen, pakketten, extras, auto) in enumerate(SJABLONEN, start=1):
    tekst = (MAP / f"{sid}.md").read_text(encoding="utf-8").strip()
    assert "$doc$" not in tekst
    waarden.append(
        f"  ('{sid}', '{titel}', '{typ}', {str(tekenen).lower()}, {lijst(pakketten)}, {lijst(extras)}, {str(auto).lower()}, {i},\n"
        f"$doc${tekst}$doc$)"
    )
regels.append(",\n".join(waarden))
regels.append("on conflict (id) do nothing;")
(MAP.parent / "05-documenten-standaard.sql").write_text("\n".join(regels) + "\n", encoding="utf-8")
print("05-documenten-standaard.sql bijgewerkt")
