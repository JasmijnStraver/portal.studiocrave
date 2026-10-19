-- =====================================================================
-- Documenten en contracten: sjablonen, ondertekenen met handtekening, PDF
-- Draai dit NA 01, 02 en 03. Eén keer uitvoeren.
--
-- Hoe het werkt
--  1. Jij beheert de teksten als sjabloon (Keuken → Documenten).
--     Per sjabloon kies je voor welk pakket en bij welke extra hij hoort.
--  2. Bij een nieuwe klant (en als je later een extra bijboekt) zet het
--     portaal automatisch de juiste documenten klaar, met haar naam,
--     bedrijf en pakket al ingevuld. Die tekst is een vaste kopie.
--  3. De klant opent het document in haar portaal, tekent in het tekenvak
--     en de Edge Function 'teken-document' maakt de PDF: tekst, beide
--     handtekeningen en een ondertekeningsbewijs (datum, tijd, IP,
--     vingerafdruk van de tekst). Daarna is het document vergrendeld.
--  4. Jij en de klant downloaden dezelfde PDF.
-- =====================================================================

-- ---------- Sjablonen ------------------------------------------------
create table if not exists public.document_templates (
  id          text primary key,                       -- bijv. 'overeenkomst'
  titel       text not null,
  type        text not null,
  tekenen     boolean not null default true,          -- true = handtekening nodig, false = ter info
  inhoud      text not null default '',               -- de tekst, met {naam}, {bedrijf}, {pakket} enz.
  pakketten   text[] not null default '{}',           -- automatisch bij deze pakketten
  extras      text[] not null default '{}',           -- en/of automatisch zodra een van deze extra's geboekt is
  automatisch boolean not null default true,          -- false = alleen handmatig toevoegen
  volgorde    int not null default 0,
  versie      int not null default 1,
  updated_at  timestamptz not null default now()
);
alter table public.document_templates enable row level security;
create policy admin_all on public.document_templates for all using (public.is_admin()) with check (public.is_admin());
-- Klanten lezen sjablonen nooit direct; ze zien alleen hun eigen kopie in 'documents'.

-- ---------- Extra velden op documenten -------------------------------
alter table public.documents
  add column if not exists template_id      text references public.document_templates on delete set null,
  add column if not exists versie           int,
  add column if not exists inhoud           text,
  add column if not exists getekend_naam    text,
  add column if not exists getekend_agent   text,
  add column if not exists getekend_hash    text,
  add column if not exists handtekening_path text,
  add column if not exists pdf_path         text,
  add column if not exists volgorde         int not null default 0;

-- Jouw eigen handtekening (opdrachtnemer), komt op elke PDF met handtekening
alter table public.portal_settings
  add column if not exists handtekening_path text,
  add column if not exists ondertekenaar     text not null default 'Jasmijn Straver',
  add column if not exists bedrijfsgegevens  text not null default 'Studio Crave · info@studiocrave.nl';

-- Je klanten zien jouw handtekening al onder het document in hun portaal (hij staat ook op elke PDF)
create policy studio_handtekening_lezen on storage.objects for select to authenticated
  using (bucket_id = 'klanten' and name = '_studio/handtekening.png');

-- Een getekend document kan niemand meer wijzigen (ook jij niet): de PDF en de tekst blijven gelijk
create or replace function public.trg_document_slot() returns trigger
language plpgsql as $$
begin
  if old.status = 'getekend' and (
       new.inhoud is distinct from old.inhoud or new.titel is distinct from old.titel
    or new.status is distinct from old.status or new.getekend_op is distinct from old.getekend_op
    or new.getekend_naam is distinct from old.getekend_naam or new.getekend_hash is distinct from old.getekend_hash
    or new.handtekening_path is distinct from old.handtekening_path or new.pdf_path is distinct from old.pdf_path) then
    raise exception 'Dit document is getekend en kan niet meer worden aangepast. Zet een nieuwe versie klaar.';
  end if;
  return new;
end $$;
drop trigger if exists document_slot on public.documents;
create trigger document_slot before update on public.documents for each row execute function public.trg_document_slot();

-- Ondertekenen loopt voortaan alleen via de Edge Function (die de handtekening en PDF vastlegt)
revoke execute on function public.sign_document(uuid) from public, anon, authenticated;

-- ---------- Tekst invullen voor één klant ----------------------------
create or replace function public._document_tekst(p_tekst text, c public.clients) returns text
language sql stable as $$
  select replace(replace(replace(replace(replace(replace(coalesce(p_tekst, ''),
    '{naam}', c.naam),
    '{bedrijf}', coalesce(nullif(c.bedrijf, ''), c.naam)),
    '{email}', c.email),
    '{pakket}', case c.pakket when 'dwy' then '7-Course Brand Experience' when 'audit' then 'Brand Audit'
                  when 'templates' then 'Branded Templates' when 'identity' then 'Craveable Identity' else 'Be Your Own Chef' end),
    '{startdatum}', to_char(c.start, 'DD-MM-YYYY')),
    '{datum}', to_char(current_date, 'DD-MM-YYYY'));
$$;

-- ---------- Klaarzetten volgens pakket en extra's --------------------
-- Zet ontbrekende documenten klaar en werkt ongetekende documenten bij naar de nieuwste tekst.
-- Getekende documenten blijven altijd zoals ze zijn.
create or replace function public._documenten_klaarzetten(p_client uuid, p_template text default null) returns int
language plpgsql security definer set search_path = public as $$
declare c public.clients; t public.document_templates; n int := 0;
begin
  select * into c from public.clients where id = p_client;
  if not found then return 0; end if;
  -- De 7-Course Brand Experience heeft brand shoot, templates en identity altijd inbegrepen
  for t in
    select * from public.document_templates dt
    where (p_template is not null and dt.id = p_template)
       or (p_template is null and dt.automatisch and (
            c.pakket = any(dt.pakketten)
         or exists (select 1 from unnest(dt.extras) e where e = any(c.extras))))
    order by dt.volgorde
  loop
    if exists (select 1 from public.documents d where d.client_id = c.id and d.template_id = t.id) then
      update public.documents
         set titel = t.titel, type = t.type, tekenen = t.tekenen, versie = t.versie, volgorde = t.volgorde,
             inhoud = public._document_tekst(t.inhoud, c),
             status = case when t.tekenen then 'te-tekenen' else 'info' end
       where client_id = c.id and template_id = t.id and status <> 'getekend' and coalesce(versie, 0) < t.versie;
    else
      insert into public.documents (client_id, template_id, versie, titel, type, tekenen, status, inhoud, volgorde)
      values (c.id, t.id, t.versie, t.titel, t.type, t.tekenen, case when t.tekenen then 'te-tekenen' else 'info' end,
              public._document_tekst(t.inhoud, c), t.volgorde);
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

-- Na het aanpassen van een sjabloon: alle nog niet getekende kopieën bij klanten bijwerken
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

-- Automatisch: bij een nieuwe klant, en zodra je een extra bijboekt
create or replace function public.trg_client_documenten() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.extras is distinct from old.extras or new.pakket is distinct from old.pakket then
    perform public._documenten_klaarzetten(new.id);
  end if;
  return new;
end $$;
drop trigger if exists na_klant_documenten on public.clients;
create trigger na_klant_documenten after insert or update of extras, pakket on public.clients
  for each row execute function public.trg_client_documenten();

-- Melding als een klant een document opent (gelezen)
create or replace function public.log_document_open(p_doc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_doc and client_id = public.my_client_id();
  if not found then raise exception 'Document niet gevonden'; end if;
  perform public.log_activity(d.client_id, 'document', 'opende ' || d.titel);
end $$;

-- ---------- Startset sjablonen ---------------------------------------
-- Plak de echte tekst per sjabloon in Keuken → Documenten. Opmaak in de tekst:
--   # Kop            ## Tussenkop           - opsommingspunt
--   een lege regel = nieuwe alinea          **vet** binnen een zin
-- Invulvelden: {naam} {bedrijf} {email} {pakket} {startdatum} {datum}
insert into public.document_templates (id, titel, type, tekenen, pakketten, extras, automatisch, volgorde, inhoud) values
  ('algemene-voorwaarden', 'Algemene voorwaarden', 'Algemene voorwaarden', true,
     array['dwy','audit','templates','identity','zelf'], '{}', true, 1,
     E'# Algemene voorwaarden\n\nPlak hier de tekst van je algemene voorwaarden.'),
  ('privacyverklaring', 'Privacyverklaring', 'Privacyverklaring', false,
     array['dwy','audit','templates','identity','zelf'], '{}', true, 2,
     E'# Privacyverklaring\n\nPlak hier de tekst van je privacyverklaring.'),
  ('overeenkomst', 'Overeenkomst van opdracht', 'Overeenkomst', true,
     array['dwy','audit','templates','identity'], '{}', true, 3,
     E'# Overeenkomst van opdracht\n\n## Partijen\n\nStudio Crave, hierna opdrachtnemer, en {naam} ({bedrijf}), hierna opdrachtgever.\n\n## Opdracht\n\n{pakket}, start op {startdatum}.\n\nPlak hier de rest van je overeenkomst.'),
  ('intellectueel-eigendom', 'Intellectueel eigendom en licentie', 'Intellectueel eigendom', true,
     array['dwy','templates','identity'], array['Branded templates','Craveable Identity'], true, 4,
     E'# Intellectueel eigendom en licentie\n\nPlak hier de tekst over intellectueel eigendom en licentie.'),
  ('beeldrechten-shoot', 'Beeldrechten en licentie brand shoot', 'Beeldrechten & licentie', true,
     array['dwy'], array['Brand shoot'], true, 5,
     E'# Beeldrechten en licentie brand shoot\n\nPlak hier de tekst over beeldrechten en licentie.'),
  ('modelrelease', 'Modelrelease', 'Modelrelease', true,
     array['dwy'], array['Brand shoot'], true, 6,
     E'# Modelrelease\n\nPlak hier de tekst van je modelrelease.'),
  ('welkomstgids', 'Welkomstgids', 'Welkomstgids', false,
     array['dwy','audit','templates','identity','zelf'], '{}', true, 7,
     E'# Welkom, {naam}\n\nPlak hier je welkomstgids.'),
  ('toestemming-klantcase', 'Toestemming klantcase en review', 'Toestemming', true,
     '{}', '{}', false, 8,
     E'# Toestemming klantcase en review\n\nPlak hier de tekst waarmee {naam} toestemming geeft.'),
  ('verwerkersovereenkomst', 'Verwerkersovereenkomst', 'Verwerkersovereenkomst', true,
     '{}', '{}', false, 9,
     E'# Verwerkersovereenkomst\n\nPlak hier de tekst van je verwerkersovereenkomst.')
on conflict (id) do nothing;
