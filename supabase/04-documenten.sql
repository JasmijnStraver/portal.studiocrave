-- =====================================================================
-- Documenten en contracten: standaardteksten, ondertekenen, PDF, archief
-- Draai dit NA 01, 02 en 03, en daarna 05-documenten-standaard.sql.
--
-- Hoe het werkt
--  1. Elk document is een standaardtekst (sjabloon) die je in Keuken →
--     Documenten aanpast. Per sjabloon staat bij welk aanbod en welke
--     extra hij hoort.
--  2. Bij een nieuwe klant, en als je een extra bijboekt, zet het portaal
--     de juiste documenten klaar, met haar naam, bedrijf, aanbod, prijs,
--     looptijd en jouw bedrijfsgegevens al ingevuld.
--  3. De klant opent het document in haar portaal en tekent onderaan
--     (contracten) of geeft akkoord (voorwaarden, privacy, welkomstgids).
--     Pas daarna kan zij, en kun jij, de PDF downloaden.
--  4. Elk getekend document gaat ook naar het archief. Dat bewaart het
--     7 jaar (fiscale bewaarplicht), ook als je de klant later verwijdert.
-- =====================================================================

-- ---------- Sjablonen ------------------------------------------------
create table if not exists public.document_templates (
  id          text primary key,                       -- bijv. 'overeenkomst'
  titel       text not null,
  type        text not null,
  tekenen     boolean not null default true,          -- true = handtekening, false = akkoord geven
  inhoud      text not null default '',               -- de tekst, met invulvelden zoals {naam} en {prijs}
  pakketten   text[] not null default '{}',           -- automatisch bij deze pakketten
  extras      text[] not null default '{}',           -- en/of zodra een van deze extra's geboekt is
  automatisch boolean not null default true,          -- false = alleen handmatig toevoegen
  volgorde    int not null default 0,
  versie      int not null default 1,
  updated_at  timestamptz not null default now()
);
alter table public.document_templates enable row level security;
create policy admin_all on public.document_templates for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Extra velden ---------------------------------------------
alter table public.documents
  add column if not exists template_id       text references public.document_templates on delete set null,
  add column if not exists versie            int,
  add column if not exists inhoud            text,
  add column if not exists getekend_naam     text,
  add column if not exists getekend_agent    text,
  add column if not exists getekend_hash     text,
  add column if not exists handtekening_path text,
  add column if not exists pdf_path          text,
  add column if not exists volgorde          int not null default 0;

-- Prijs zoals die in de overeenkomst van deze klant komt (leeg = standaardprijs van het aanbod)
alter table public.clients add column if not exists prijs text;

-- Jouw handtekening en de gegevens die in de documenten worden ingevuld
alter table public.portal_settings
  add column if not exists handtekening_path text,
  add column if not exists ondertekenaar     text not null default 'Jasmijn Straver',
  add column if not exists document_velden   jsonb not null default '{}';

update public.portal_settings set document_velden = $dv${
  "studio": {
    "naam": "Studio Crave",
    "adres": "[adres]",
    "kvk": "[KvK-nummer]",
    "btw": "[btw-nummer]",
    "email": "info@studiocrave.nl"
  },
  "pakketten": {
    "dwy": {
      "prijs": "€ 3.500 excl. btw",
      "looptijd": "3 maanden",
      "toegang": "tijdens het traject en 3 maanden daarna",
      "werkwijze": "We hebben een 1:1 call aan het begin, halverwege en aan het einde. Na elke course geef je akkoord of feedback, zodat we verder gaan op een basis die klopt.",
      "inhoud": "- De 7 courses van The Branding Kitchen™: Raw Ingredients, Flavor Profile, Signature Sauce, Positioning Cut, Plating, Pairing en The Experience\n- Een brand shoot, voorbereid vanuit je positionering\n- Je visuele identiteit: logo-set, kleuren, lettertypen en beeldstijl, in een brandbook en Canva Brand Kit\n- Branded Templates in je eigen huisstijl, gemaakt met de foto's van je shoot\n- Drie 1:1 calls: aan het begin, halverwege en aan het einde\n- Feedback en akkoord na elke course\n- Je Signature Dish: je hele merk op één pagina\n- Het portaal met tools die schrijven in jouw toon, en contact via het portaal, de app of e-mail"
    },
    "audit": {
      "prijs": "€ 77 excl. btw",
      "looptijd": "2 weken",
      "toegang": "4 weken vanaf de start",
      "werkwijze": "Je audit maak ik op basis van je quiz en je onboarding. Je krijgt je scores en advies in het portaal, met een video waarin ik je merk doorloop.",
      "inhoud": "- Een audit van je merk op drie courses: Raw Ingredients, Flavor Profile en Positioning Cut\n- Op basis van je quiz en je onboarding\n- Je scores, wat ik zie, je top 3 en je eerste stappen, in het portaal\n- Een video-walkthrough (Loom) van je merk\n- Toegang tot het portaal en de bijbehorende tools"
    },
    "templates": {
      "prijs": "€ 550 excl. btw",
      "looptijd": "1 maand",
      "toegang": "tijdens het traject en 1 maand na oplevering",
      "werkwijze": "Jij levert je logo, kleuren en professionele foto's aan. Ik maak eerst een kort brandbook in Canva voor je akkoord, daarna bouw ik je templates.",
      "inhoud": "- 100+ social templates in je eigen huisstijl, afgestemd op je doel\n- Een kort brandbook en een Brand Kit in Canva, eerst ter akkoord\n- 1:1 brand sessies\n- Chatsupport tijdens het traject\n- Toegang tot het portaal\n\nVoor Branded Templates zijn professionele foto's nodig: je levert ze zelf aan, of je combineert de templates met een brand shoot bij Studio Crave (met € 50 korting op de shoot)."
    },
    "identity": {
      "prijs": "€ 450 excl. btw",
      "looptijd": "1 maand",
      "toegang": "tijdens het traject en 1 maand na oplevering",
      "werkwijze": "We beginnen met een korte merkbasis: je verhaal en het gevoel dat je wilt oproepen. Per onderdeel krijg je een voorstel ter akkoord of feedback.",
      "inhoud": "- Full basic branding: je merk in de basis neergezet, zonder templates en shoot\n- Een korte merkbasis vooraf: je verhaal en je gewenste gevoel\n- Een custom logo-set: hoofdlogo, variant en beeldmerk of monogram, in licht en donker\n- Kleurpalet met alle codes, en lettertypen voor koppen, tekst en accenten\n- Beeldstijl en grafische elementen\n- Brandbook en een ingerichte Brand Kit in Canva\n- Basistoepassingen: e-mailhandtekening, favicon en profielfoto's voor social media\n- Toegang tot het portaal"
    },
    "zelf": {
      "prijs": "€ 25 per maand excl. btw",
      "looptijd": "per maand, maandelijks opzegbaar",
      "toegang": "zolang je lidmaatschap loopt",
      "werkwijze": "Je werkt zelf, in je eigen tempo, door alle courses. Vragen kun je altijd stellen via het portaal of e-mail.",
      "inhoud": "- Toegang tot alle 7 courses van The Branding Kitchen™, in je eigen tempo\n- De tools in het portaal, die schrijven in jouw toon\n- Je Signature Dish: je hele merk op één pagina"
    }
  },
  "extras": {
    "Brand shoot": "Brand shoot: Kick Off shoot (1 uur, minimaal 15 foto's, € 347, of € 297 met Branded Templates) of Full Shoot Day (3 tot 4 uur, 60 tot 80 foto's, € 847, of € 797 met Branded Templates), excl. reiskosten en btw. Buitenlocatie kosteloos, studio voor eigen rekening.",
    "Branded templates": "Branded Templates: 100+ social templates in je huisstijl, met kort brandbook en Canva Brand Kit. Prijs volgens je bevestiging.",
    "Craveable Identity": "Craveable Identity: je visuele identiteit met logo-set, kleuren, lettertypen, beeldstijl en brandbook. Prijs volgens je bevestiging.",
    "Website": "Website: opzet, ontwerp en teksten in je merk. Prijs in overleg, afhankelijk van de omvang."
  }
}$dv$::jsonb where id = 1;

-- ---------- Opslag ---------------------------------------------------
-- Je klanten zien jouw handtekening al onder het document in hun portaal (hij staat ook op elke PDF)
create policy studio_handtekening_lezen on storage.objects for select to authenticated
  using (bucket_id = 'klanten' and name = '_studio/handtekening.png');
-- Het archief van getekende stukken kan via het portaal niet worden gewist
create policy archief_niet_wissen on storage.objects as restrictive for delete
  using (not (bucket_id = 'klanten' and name like '\_archief/%'));

-- ---------- Archief: 7 jaar bewaren ----------------------------------
-- Los van de klant opgeslagen, dus blijft staan als je een klant verwijdert.
create table if not exists public.document_archief (
  document_id       uuid primary key,
  client_id         uuid,                         -- geen koppeling: blijft staan na verwijderen van de klant
  klant_naam        text not null,
  klant_email       text not null,
  klant_bedrijf     text,
  titel             text not null,
  versie            int,
  inhoud            text,
  handtekening      boolean not null,             -- true = getekend, false = akkoord gegeven
  getekend_naam     text,
  getekend_op       timestamptz not null,
  getekend_ip       text,
  getekend_hash     text,
  pdf_path          text not null,                -- in de opslag 'klanten', map _archief
  bewaren_tot       date not null,
  studio_download_op timestamptz,                 -- wanneer jij hem voor je eigen administratie downloadde
  created_at        timestamptz not null default now()
);
alter table public.document_archief enable row level security;
create policy admin_lezen on public.document_archief for select using (public.is_admin());

create or replace function public.trg_archief_bewaren() returns trigger
language plpgsql as $$
begin
  if old.bewaren_tot > current_date then
    raise exception 'Dit getekende document moet tot % bewaard blijven (fiscale bewaarplicht).', to_char(old.bewaren_tot, 'DD-MM-YYYY');
  end if;
  return old;
end $$;
drop trigger if exists archief_bewaren on public.document_archief;
create trigger archief_bewaren before delete on public.document_archief for each row execute function public.trg_archief_bewaren();

-- ---------- Getekende documenten vergrendelen ------------------------
create or replace function public.trg_document_slot() returns trigger
language plpgsql as $$
begin
  if old.status = 'getekend' and (
       new.inhoud is distinct from old.inhoud or new.titel is distinct from old.titel
    or new.status is distinct from old.status or new.getekend_op is distinct from old.getekend_op
    or new.getekend_naam is distinct from old.getekend_naam or new.getekend_hash is distinct from old.getekend_hash
    or new.handtekening_path is distinct from old.handtekening_path or new.pdf_path is distinct from old.pdf_path) then
    raise exception 'Dit document is getekend en kan niet meer worden aangepast.';
  end if;
  return new;
end $$;
drop trigger if exists document_slot on public.documents;
create trigger document_slot before update on public.documents for each row execute function public.trg_document_slot();

-- Een getekend document los weghalen kan niet. (Verwijder je de hele klant op haar verzoek,
-- dan gaat het mee, maar de kopie in het archief blijft 7 jaar bewaard.)
create or replace function public.trg_document_niet_weg() returns trigger
language plpgsql as $$
begin
  if old.status = 'getekend' and pg_trigger_depth() <= 1 then
    raise exception 'Een getekend document kun je niet weghalen.';
  end if;
  return old;
end $$;
drop trigger if exists document_niet_weg on public.documents;
create trigger document_niet_weg before delete on public.documents for each row execute function public.trg_document_niet_weg();

-- Bij tekenen: kopie naar het archief
create or replace function public.trg_document_archiveren() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.clients;
begin
  if new.status = 'getekend' and old.status <> 'getekend' then
    select * into c from public.clients where id = new.client_id;
    insert into public.document_archief (document_id, client_id, klant_naam, klant_email, klant_bedrijf, titel, versie, inhoud,
      handtekening, getekend_naam, getekend_op, getekend_ip, getekend_hash, pdf_path, bewaren_tot)
    values (new.id, new.client_id, c.naam, c.email, c.bedrijf, new.titel, new.versie, new.inhoud,
      new.tekenen, new.getekend_naam, new.getekend_op, new.getekend_ip, new.getekend_hash,
      '_archief/' || new.id || '.pdf', (new.getekend_op + interval '7 years')::date)
    on conflict (document_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists document_archiveren on public.documents;
create trigger document_archiveren after update on public.documents for each row execute function public.trg_document_archiveren();

-- Ondertekenen loopt alleen via de Edge Function (die de handtekening en PDF vastlegt)
revoke execute on function public.sign_document(uuid) from public, anon, authenticated;

-- ---------- Tekst invullen voor één klant ----------------------------
create or replace function public._document_tekst(p_tekst text, c public.clients) returns text
language plpgsql stable security definer set search_path = public as $$
declare v jsonb; p jsonb; s jsonb; uit text; ex text := ''; e text;
begin
  select document_velden into v from public.portal_settings where id = 1;
  p := coalesce(v -> 'pakketten' -> c.pakket, '{}'::jsonb);
  s := coalesce(v -> 'studio', '{}'::jsonb);
  -- Bijgeboekte extra's (bij de 7-Course zijn shoot, templates en identity al inbegrepen)
  foreach e in array coalesce(c.extras, '{}') loop
    if not (c.pakket = 'dwy' and e in ('Brand shoot', 'Branded templates', 'Craveable Identity')) and v -> 'extras' ->> e is not null then
      ex := ex || E'\n- ' || (v -> 'extras' ->> e);
    end if;
  end loop;
  if ex <> '' then ex := E'Bijgeboekt:\n' || ex; end if;

  uit := coalesce(p_tekst, '');
  uit := replace(uit, '{inhoud}', coalesce(p ->> 'inhoud', ''));
  uit := replace(uit, '{extras}', ex);
  uit := replace(uit, '{werkwijze}', coalesce(p ->> 'werkwijze', ''));
  uit := replace(uit, '{prijs}', coalesce(nullif(c.prijs, ''), p ->> 'prijs', 'volgens je bevestiging'));
  uit := replace(uit, '{looptijd}', coalesce(p ->> 'looptijd', ''));
  uit := replace(uit, '{toegang}', coalesce(p ->> 'toegang', ''));
  uit := replace(uit, '{pakket}', case c.pakket when 'dwy' then '7-Course Brand Experience' when 'audit' then 'Brand Audit'
                  when 'templates' then 'Branded Templates' when 'identity' then 'Craveable Identity' else 'Be Your Own Chef' end);
  uit := replace(uit, '{studio_naam}', coalesce(s ->> 'naam', 'Studio Crave'));
  uit := replace(uit, '{studio_adres}', coalesce(s ->> 'adres', ''));
  uit := replace(uit, '{studio_kvk}', coalesce(s ->> 'kvk', ''));
  uit := replace(uit, '{studio_btw}', coalesce(s ->> 'btw', ''));
  uit := replace(uit, '{studio_email}', coalesce(s ->> 'email', 'info@studiocrave.nl'));
  uit := replace(uit, '{naam}', c.naam);
  uit := replace(uit, '{bedrijf}', coalesce(nullif(c.bedrijf, ''), c.naam));
  uit := replace(uit, '{email}', c.email);
  uit := replace(uit, '{startdatum}', to_char(c.start, 'DD-MM-YYYY'));
  uit := replace(uit, '{datum}', to_char(current_date, 'DD-MM-YYYY'));
  -- lege regels die overblijven als er geen extra's zijn, netjes houden
  uit := regexp_replace(uit, E'\n{3,}', E'\n\n', 'g');
  return uit;
end $$;
revoke execute on function public._document_tekst(text, public.clients) from public, anon, authenticated;

-- ---------- Klaarzetten volgens pakket en extra's --------------------
-- Zet ontbrekende documenten klaar en werkt nog niet getekende documenten bij naar de
-- nieuwste tekst en gegevens. Getekende documenten blijven altijd zoals ze zijn.
create or replace function public._documenten_klaarzetten(p_client uuid, p_template text default null) returns int
language plpgsql security definer set search_path = public as $$
declare c public.clients; t public.document_templates; n int := 0;
begin
  select * into c from public.clients where id = p_client;
  if not found then return 0; end if;
  for t in
    select * from public.document_templates dt
    where (p_template is not null and dt.id = p_template)
       or (p_template is null and (
            (dt.automatisch and (c.pakket = any(dt.pakketten) or exists (select 1 from unnest(dt.extras) e where e = any(c.extras))))
         or exists (select 1 from public.documents d where d.client_id = c.id and d.template_id = dt.id)))
    order by dt.volgorde
  loop
    if exists (select 1 from public.documents d where d.client_id = c.id and d.template_id = t.id) then
      update public.documents
         set titel = t.titel, type = t.type, tekenen = t.tekenen, versie = t.versie, volgorde = t.volgorde,
             inhoud = public._document_tekst(t.inhoud, c), status = 'te-tekenen'
       where client_id = c.id and template_id = t.id and status <> 'getekend';
    else
      insert into public.documents (client_id, template_id, versie, titel, type, tekenen, status, inhoud, volgorde)
      values (c.id, t.id, t.versie, t.titel, t.type, t.tekenen, 'te-tekenen', public._document_tekst(t.inhoud, c), t.volgorde);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public._documenten_klaarzetten(uuid, text) from public, anon, authenticated;

-- Voor jou in de keuken: alles klaarzetten, of één sjabloon handmatig toevoegen (bijv. klantcase)
create or replace function public.documenten_klaarzetten(p_client uuid, p_template text default null) returns int
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Alleen voor de keuken'; end if;
  return public._documenten_klaarzetten(p_client, p_template);
end $$;

-- Na het aanpassen van teksten of gegevens: alle nog niet getekende documenten bij alle klanten bijwerken
create or replace function public.documenten_alles_bijwerken() returns int
language plpgsql security definer set search_path = public as $$
declare cid uuid; n int := 0;
begin
  if not public.is_admin() then raise exception 'Alleen voor de keuken'; end if;
  for cid in select distinct client_id from public.documents where status <> 'getekend' loop
    perform public._documenten_klaarzetten(cid);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Na het aanpassen van één sjabloon: alleen de nog niet getekende kopieën daarvan bijwerken
create or replace function public.sjabloon_doorvoeren(p_template text) returns int
language plpgsql security definer set search_path = public as $$
declare cid uuid; n int := 0;
begin
  if not public.is_admin() then raise exception 'Alleen voor de keuken'; end if;
  for cid in select distinct client_id from public.documents where template_id = p_template and status <> 'getekend' loop
    perform public._documenten_klaarzetten(cid, p_template);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Voorbeeld zoals een klant met dit aanbod het ziet (niets wordt opgeslagen)
create or replace function public.document_voorbeeld(p_template text, p_pakket text, p_extras text[] default '{}') returns text
language plpgsql stable security definer set search_path = public as $$
declare c public.clients; t public.document_templates;
begin
  if not public.is_admin() then raise exception 'Alleen voor de keuken'; end if;
  select * into t from public.document_templates where id = p_template;
  c.naam := 'Sanne de Vries'; c.bedrijf := 'Bloei Coaching'; c.email := 'sanne@bloeicoaching.nl';
  c.pakket := p_pakket; c.extras := coalesce(p_extras, '{}'); c.start := current_date;
  return public._document_tekst(t.inhoud, c);
end $$;

-- Automatisch: bij een nieuwe klant, en zodra je een extra bijboekt of iets aan haar gegevens verandert
create or replace function public.trg_client_documenten() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.extras is distinct from old.extras or new.pakket is distinct from old.pakket
     or new.prijs is distinct from old.prijs or new.naam is distinct from old.naam
     or new.bedrijf is distinct from old.bedrijf or new.start is distinct from old.start then
    perform public._documenten_klaarzetten(new.id);
  end if;
  return new;
end $$;
drop trigger if exists na_klant_documenten on public.clients;
create trigger na_klant_documenten after insert or update of extras, pakket, prijs, naam, bedrijf, start on public.clients
  for each row execute function public.trg_client_documenten();

-- Melding als een klant een document opent
create or replace function public.log_document_open(p_doc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_doc and client_id = public.my_client_id();
  if not found then raise exception 'Document niet gevonden'; end if;
  perform public.log_activity(d.client_id, 'document', 'opende ' || d.titel);
end $$;

-- De standaardteksten staan in 05-documenten-standaard.sql (gemaakt uit supabase/documenten/*.md).
