# Status: wat is er klaar

Deze app is de Next.js + Supabase-opvolger van `prototype-reference/`
(de werkende HTML/JS-demo die als ontwerp en logica diende). Dit document
houdt bij wat al echt live-klaar is, en wat nog in de demo staat.

## Klaar en werkend

- **Login & accounts**: Supabase Auth (e-mail/wachtwoord), uitnodigingsflow
  via de `uitnodigen` Edge Function, wachtwoord instellen op `/wachtwoord`.
- **Klantportaal**: home met voortgang, quiz ("welk gerecht ben jij?"),
  vragenlijst/intake (met voorwaardelijke delen per pakket), 7-course menu +
  course-detail (jasmijn/jij-teksten, bestanden, upload), documenten
  (bekijken + akkoord geven), Signature Dish (`/merk`, simpele versie).
- **Skills**: alle 28 skills staan live in de database (`supabase/02-skills.sql`),
  met hun volledige instructie. De chat in elke course roept de `run-skill`
  Edge Function aan — exact dezelfde merkgeheugen-opbouw als het origineel.
- **Admin-keuken**: klantoverzicht + activiteitenfeed, nieuwe klant aanmaken
  (triggert automatisch het traject via `trg_new_client`), klantdetail met
  tabs (checklist, menu/courses + skills aan/uit, Brand Foundation-profiel,
  documenten, activiteit, gegevens + uitnodigen), skills beheren met
  versiebeheer.
- **Documenten en contracten** (`supabase/04-documenten.sql`, Edge Function
  `teken-document`): sjablonen per pakket en extra, automatisch klaarzetten,
  tekenvak, PDF in huisstijl met ondertekeningsbewijs, vergrendeling na tekenen,
  eigen handtekening van Jasmijn, beheer in Keuken → Documenten.
- **Database**: het volledige schema (20 tabellen, RLS-policies, triggers,
  RPC-functies) staat ongewijzigd in `supabase/01-schema.sql` — dat is de
  bron van waarheid, niet iets dat deze app zelf aanpast.

## Nog niet geport (staat wel in `prototype-reference/`)

Deze features werken in de HTML-demo, maar hebben nog geen Next.js-pagina.
Ze zijn bewust overgeslagen om eerst een werkend fundament neer te zetten —
zie het als een vervolgstap, niet als vergeten:

- **Human Design** (`hd.js`, `hd-ui.js`): geboortechart-berekening en de
  werkplek-toon-van-stem-lens.
- **90-dagenplan** (`plan90.js`) en **Workflow/focusblokken** (`workflow.js`).
- **Brand Audit-UI** (`audit.js`): scores en advies per course — de
  database-kolom `clients.audit` bestaat al, de beheerpagina nog niet.
- **Brand shoot-workflow** (`klant.js: shootFlow/shootPrep`): shotlist,
  Pixieset-galerijen, beeldrechten. De RPC's (`selectie_klaar`,
  `log_pixieset`) en de `shoot`-kolom bestaan al.
- **Thema-customizer** (`thema.js`): klant kiest eigen kleuren/fonts/foto's
  voor haar portaal, met contrastcheck.
- **Eigen tools** (`eigentools.js`): klant bouwt haar eigen agent naast
  Jasmijns skills. Tabel `client_tools` en de `eigen_tools`-policy bestaan
  al; de `run-skill`-functie ondersteunt `eigen-`-ids al.
- **Sous-chef chat** (`extras.js: chatPaneel`): losse Q&A-chat met het
  merkgeheugen en de kennisbank. De README noemt dit zelf ook als
  "nog te bouwen" — er is nog geen Edge Function voor.
- **Identiteit-feedback** (`identiteit.js`): akkoord/feedback op logo en
  kleuren bij Craveable Identity.
- **Mollie-betalingen en verlengen**: `clients.verlengd`/`toegang_tot`
  bestaan al in het schema; de betaalkoppeling zelf niet.
- **Platform-knowledge-goedkeuring**: de `platform-update` Edge Function
  (wekelijks onderzoek) staat klaar, maar er is nog geen keuken-pagina om
  voorstellen te bekijken/goedkeuren.

## Bekende aandachtspunten

- `next@14.2.35` trekt nog een kwetsbare `postcss`-versie mee via zijn eigen
  `node_modules` (`npm audit`). Een upgrade naar Next 15 lost dit op, maar is
  een grotere stap die ik bewust niet stilzwijgend heb gedaan — plan die
  upgrade apart in.
- De checklist-logica in `lib/content/checklist.ts` is een vereenvoudigde,
  Supabase-vormige versie van `CHECKLIST` uit het prototype (de
  brand-shoot-fase ontbreekt, zie hierboven).
