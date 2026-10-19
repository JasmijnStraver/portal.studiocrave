# Studio Crave — Klantportaal (The Branding Kitchen™)

Next.js + Supabase-app voor het klantportaal van Studio Crave: de 7-Course
Brand Method als menu, met persoonlijke login, skills die via Claude
schrijven in de taal van de klant, en een admin-"keuken" om klanten,
documenten en skills te beheren.

Dit is de live-opvolger van `prototype-reference/` — de werkende HTML/JS-demo
die als ontwerp en logica diende. Zie [`STATUS.md`](./STATUS.md) voor precies
wat al 1:1 is overgezet en wat nog in de demo staat.

## Starten

```
npm install
cp .env.example .env.local   # vul in met je Supabase-project
npm run dev
```

Zonder een Supabase-project opstart de app gewoon (je ziet het inlogscherm),
maar elke pagina die data nodig heeft werkt pas zodra stap 1-3 hieronder zijn
gedaan.

## Supabase opzetten (eenmalig)

1. **Project aanmaken** op [supabase.com](https://supabase.com), regio
   **Frankfurt (EU)**.
2. **Schema uitvoeren**, in de SQL-editor, in deze volgorde:
   - `supabase/01-schema.sql`
   - `supabase/02-skills.sql`
   - `supabase/03-vragenlijst.sql`
   - `supabase/04-documenten.sql` (contracten: sjablonen, ondertekenen, PDF)
3. **Jezelf admin maken**: registreer een account (via `/login` nadat je de
   env-variabelen hieronder hebt gezet, of via het Supabase-dashboard), en
   zet in tabel `profiles` jouw rol op `admin`:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'jouw@email.nl');
   ```
4. **Env-variabelen**: kopieer `.env.example` naar `.env.local` en vul
   `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
   (Project-instellingen → API).
5. **Edge Functions deployen** (met de [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```
   supabase functions deploy run-skill
   supabase functions deploy platform-update
   supabase functions deploy uitnodigen
   supabase functions deploy teken-document
   ```
6. **Secrets zetten** voor de Edge Functions:
   ```
   supabase secrets set ANTHROPIC_API_KEY=... PORTAAL_URL=https://jouw-domein.nl
   ```
7. **Mail**: plak `supabase/email-uitnodiging.html` en
   `supabase/email-wachtwoord.html` in Authentication → Email Templates, en
   koppel een maildienst (bijv. Resend) met afzender @studiocrave.nl.
8. **Cron** voor `platform-update`: Supabase → Integrations → Cron, dagelijks
   om 06:00.

## Documenten en contracten

De teksten staan als sjabloon in de database (`document_templates`) en beheer je
onder **Keuken → Documenten**. Per sjabloon kies je bij welk pakket en welke extra
hij hoort; bij een nieuwe klant en bij een bijgeboekte extra zet het portaal ze
automatisch klaar, met naam, bedrijf en pakket ingevuld. De klant leest het
document in haar portaal en tekent in het tekenvak. De Edge Function
`teken-document` maakt dan de PDF (tekst, beide handtekeningen en een
ondertekeningsbewijs met datum, tijd, IP en een SHA-256-vingerafdruk) en zet die
in `klanten/<client_id>/documenten/`. Een getekend document is daarna vergrendeld.
Jouw eigen handtekening zet je één keer in de keuken.

## Skills

Alle 28 skills (`supabase/02-skills.sql`) staan al in de database, inclusief
hun volledige instructie als eerste versie. Een skill bewerken of een nieuwe
versie publiceren doe je in de app zelf, onder **Keuken → Skills beheer** —
dat schrijft weg naar de tabellen `skills` en `skill_versions`, niet naar
bestanden. De brondocumenten staan ook in `skills/plugins/` en `skills/eigen/`
als referentie en als basis voor nieuwe skills.

## Deployen

Push naar GitHub, koppel de repo aan Vercel, zet dezelfde env-variabelen
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in de
Vercel-projectinstellingen.

## Merkstijl

Midnight (`#3D1419`), burgundy (`#6B1A2A`), pepper (`#C8001A`) en gold
(`#C9A060`) op een warme crème-achtergrond. Koppen in serif (Times New
Roman), body in Be Vietnam Pro, korte accenten in het ingebedde lettertype
Karumbi — zie `app/globals.css` en `public/fonts/`.
