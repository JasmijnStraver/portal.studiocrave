// =====================================================================
// Edge Function: klant-verwijderen
// Voor een verwijderverzoek van een klant, ná jouw eigen check. Alleen jij (admin).
// Verwijdert: haar login, haar bestanden en al haar gegevens in het portaal.
// Blijft bewaard: getekende documenten in het archief, 7 jaar (fiscale bewaarplicht).
// Body: { client_id, bevestiging } waarbij bevestiging het e-mailadres van de klant is.
// Deploy: supabase functions deploy klant-verwijderen
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("PORTAAL_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};
const antwoord = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: isAdmin } = await asUser.rpc("is_admin");
  if (!isAdmin) return antwoord({ fout: "Niet toegestaan" }, 403);

  const { client_id, bevestiging } = await req.json().catch(() => ({}));
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: klant } = await admin.from("clients").select("id, user_id, email, naam").eq("id", client_id).single();
  if (!klant) return antwoord({ fout: "Klant niet gevonden" }, 404);
  if (String(bevestiging ?? "").trim().toLowerCase() !== klant.email.toLowerCase()) {
    return antwoord({ fout: "Typ het e-mailadres van de klant om te bevestigen" }, 400);
  }

  // Alle bestanden in haar map (behalve het archief, dat staat apart in _archief/)
  const opslag = admin.storage.from("klanten");
  const paden: string[] = [];
  const verzamel = async (map: string) => {
    const { data } = await opslag.list(map, { limit: 1000 });
    for (const item of data ?? []) {
      const pad = `${map}/${item.name}`;
      if (item.id) paden.push(pad); else await verzamel(pad); // zonder id = map
    }
  };
  await verzamel(klant.id);
  for (let i = 0; i < paden.length; i += 100) await opslag.remove(paden.slice(i, i + 100));

  // Gegevens (documenten, uploads, chats enz. gaan mee via de database); het archief blijft staan
  const { error } = await admin.from("clients").delete().eq("id", klant.id);
  if (error) return antwoord({ fout: "Verwijderen lukte niet: " + error.message }, 500);
  if (klant.user_id) await admin.auth.admin.deleteUser(klant.user_id);

  const { count } = await admin.from("document_archief").select("document_id", { count: "exact", head: true }).eq("client_id", klant.id);
  return antwoord({ verwijderd: true, bestanden: paden.length, archief: count ?? 0 });
});
