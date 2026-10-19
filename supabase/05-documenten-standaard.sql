-- =====================================================================
-- Standaardteksten voor alle documenten. Gemaakt door supabase/documenten/maak-sql.py
-- Draai dit NA 04-documenten.sql. Bestaande sjablonen (die je al hebt aangepast) blijven staan.
-- =====================================================================
insert into public.document_templates (id, titel, type, tekenen, pakketten, extras, automatisch, volgorde, inhoud) values
  ('algemene-voorwaarden', 'Algemene voorwaarden', 'Algemene voorwaarden', false, array['dwy','audit','templates','identity','zelf']::text[], '{}'::text[], true, 1,
$doc$# Algemene voorwaarden

## 1. Wie en wat

- Deze voorwaarden gelden voor alle opdrachten, trajecten, producten en het portaal van **{studio_naam}** (KvK {studio_kvk}), hierna: Studio Crave.
- De klant is de ondernemer die met Studio Crave samenwerkt of het portaal gebruikt. Studio Crave werkt alleen voor ondernemers, niet voor consumenten.
- Afwijken van deze voorwaarden kan alleen als beide partijen dat schriftelijk of in het portaal afspreken.

## 2. Aanbod en overeenkomst

- Een aanbod van Studio Crave is 14 dagen geldig, tenzij er een andere termijn in staat.
- Een overeenkomst komt tot stand zodra de klant akkoord geeft of tekent in het portaal, of zodra de eerste betaling binnen is.
- Prijzen zijn exclusief btw, en exclusief reiskosten en eventuele studiohuur, tenzij anders vermeld.

## 3. Uitvoering

- Studio Crave voert de opdracht zorgvuldig uit, naar beste kunnen. Het is een inspanningsverplichting: Studio Crave belooft geen bepaald resultaat in omzet, bereik of aantal klanten.
- De klant zorgt dat alles wat Studio Crave nodig heeft op tijd, compleet en juist wordt aangeleverd, en dat zij het recht heeft om aangeleverd materiaal (zoals foto's, logo's en teksten) te laten gebruiken.
- Studio Crave mag voor onderdelen van de opdracht anderen inschakelen, zoals een tweede fotograaf of een vormgever. Studio Crave blijft dan het aanspreekpunt.
- Genoemde termijnen zijn een richtlijn. Bij vertraging spreken partijen samen een nieuwe planning af.

## 4. Feedback en akkoord

- Per opgeleverd onderdeel zijn twee feedbackrondes inbegrepen. Meer rondes of grote koerswijzigingen kunnen extra kosten met zich meebrengen, altijd na overleg.
- Geeft de klant binnen 14 dagen na oplevering geen reactie, dan geldt het onderdeel als goedgekeurd.

## 5. Betaling

- De betaaltermijn is 14 dagen na de factuurdatum.
- Bij te late betaling stuurt Studio Crave een herinnering. Blijft betaling daarna uit, dan mag Studio Crave het werk en de toegang tot het portaal opschorten, en wettelijke handelsrente en incassokosten in rekening brengen.
- Een lidmaatschap per maand (zoals Be Your Own Chef) wordt vooraf per maand betaald en is maandelijks opzegbaar, met ingang van de volgende maand.

## 6. Annuleren

- Annuleren vóór de start: 25% van de vergoeding is verschuldigd.
- Stoppen tijdens een traject: de volledige vergoeding blijft verschuldigd.
- Een brand shoot verzetten kan tot 7 dagen vooraf kosteloos. Daarna is 50% van het shoottarief verschuldigd. Bij slecht weer bij een buitenlocatie zoeken we samen een nieuwe datum, zonder kosten.

## 7. Het portaal

- De klant krijgt een persoonlijke login. Zij houdt haar inloggegevens geheim en deelt haar account niet met anderen.
- De toegang tot de tools geldt voor de afgesproken periode. De Signature Dish en de documenten van de klant blijven daarna beschikbaar.
- De schrijftools in het portaal gebruiken AI. Wat zij maken is een voorstel; de klant controleert het zelf voordat ze het publiceert.
- Studio Crave mag het portaal verbeteren en aanpassen. Onderhoud of storingen kunnen het portaal tijdelijk onbereikbaar maken; dat geeft geen recht op terugbetaling.
- Misbruik van het portaal, zoals het kopiëren van de skills of de methode, is niet toegestaan en kan leiden tot het afsluiten van de toegang.

## 8. Intellectueel eigendom

- De methode The Branding Kitchen™, de skills, het portaal, werkbladen en templates-opzetten blijven eigendom van Studio Crave.
- Wat Studio Crave speciaal voor de klant maakt, mag de klant na volledige betaling gebruiken zoals beschreven in "Intellectueel eigendom en licentie" en, bij een brand shoot, in "Beeldrechten en licentie brand shoot".
- Studio Crave mag werk voor de klant laten zien in haar portfolio en op social media, tenzij de klant aangeeft dat liever niet te willen. Een klantcase of review met naam gebruikt Studio Crave alleen met aparte toestemming.

## 9. Aansprakelijkheid

- De aansprakelijkheid van Studio Crave is beperkt tot het bedrag dat voor de betreffende opdracht is gefactureerd en betaald, met een maximum van het bedrag dat de verzekering van Studio Crave in dat geval uitkeert.
- Studio Crave is niet aansprakelijk voor indirecte schade, zoals gemiste omzet, of voor schade door onjuiste of onvolledige informatie van de klant.
- De klant is zelf verantwoordelijk voor wat zij publiceert, ook als het met hulp van het portaal of de AI-tools is gemaakt.
- Bij overmacht, zoals ziekte of een storing bij een leverancier, mag Studio Crave de uitvoering uitstellen. Duurt overmacht langer dan 2 maanden, dan mogen beide partijen de opdracht beëindigen.

## 10. Klachten

Is de klant niet tevreden, dan meldt zij dat binnen 14 dagen via info@studiocrave.nl. Studio Crave reageert binnen 5 werkdagen en zoekt samen met de klant naar een oplossing.

## 11. Recht en geschillen

Op alle overeenkomsten is Nederlands recht van toepassing. Komen we er samen niet uit, dan beslist de bevoegde rechter in het arrondissement waar Studio Crave gevestigd is.$doc$),
  ('privacyverklaring', 'Privacyverklaring', 'Privacyverklaring', false, array['dwy','audit','templates','identity','zelf']::text[], '{}'::text[], true, 2,
$doc$# Privacyverklaring

## 1. Wie is verantwoordelijk

**{studio_naam}**, {studio_adres}, KvK {studio_kvk}, is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze verklaring. Vragen over privacy stel je aan Jasmijn Straver via {studio_email}.

## 2. Welke gegevens Studio Crave verwerkt

- **Contact- en bedrijfsgegevens:** naam, e-mailadres, telefoonnummer, bedrijfsnaam, adres, KvK- en btw-nummer.
- **Financiële gegevens:** facturen, betalingen en betaalgegevens.
- **Je account in het portaal:** naam, e-mailadres, inloggegevens, je aanbod en tot welke onderdelen je toegang hebt.
- **Je merk:** je antwoorden op de quiz en de onboarding, je Brand Foundation en merkgeheugen (zoals je toon, je doelgroep en je aanbod), je kleuren, lettertypen en logo's.
- **Wat je in het portaal maakt en deelt:** de teksten die je in de tools invult en wat de tools teruggeven, je chatberichten, to-do's, aanvragen en de bestanden die je uploadt.
- **Human Design (alleen als je dat zelf invult):** geboortedatum, geboortetijd en geboorteplaats, en de chart die daaruit berekend wordt. Dit is altijd vrijwillig.
- **Beeldmateriaal:** foto's van de brand shoot en foto's die je zelf aanlevert.
- **Ondertekening:** de naam waarmee je tekent, je handtekening, en de datum, tijd, het IP-adres en het apparaat waarmee je tekende of akkoord gaf.
- **Gebruik van het portaal:** wanneer je inlogt, een document opent of tekent, iets downloadt of uploadt, en welke tools je gebruikt.

Studio Crave vraagt niet om bijzondere persoonsgegevens (zoals gezondheid). Deel je die zelf, bijvoorbeeld in je verhaal, dan gebruikt Studio Crave ze alleen voor jouw traject.

## 3. Waarvoor

- Je traject uitvoeren: je merk ontwikkelen, de brand shoot, templates en je Signature Dish.
- Je toegang geven tot het portaal, en de tools laten schrijven in jouw toon en taal.
- Contact met je houden over je traject, en je documenten bewaren en laten ondertekenen.
- Facturen versturen en de administratie bijhouden.
- Het portaal veilig houden en verbeteren.

## 4. Grondslag

Studio Crave verwerkt je gegevens omdat dat nodig is om de overeenkomst met je uit te voeren, omdat de wet dat vraagt (zoals de fiscale bewaarplicht), omdat Studio Crave daar een gerechtvaardigd belang bij heeft (zoals beveiliging en een goede administratie), of omdat je toestemming hebt gegeven (zoals voor Human Design of een klantcase). Toestemming kun je altijd intrekken.

## 5. Meldingen aan Studio Crave

Studio Crave krijgt een melding als je in het portaal iets doet dat bij je traject hoort: een course afronden, een bestand uploaden, een document openen, tekenen of downloaden, of een tool gebruiken. Dat is om je goed en op tijd te kunnen begeleiden. Studio Crave leest je ingevulde teksten alleen als dat nodig is voor je begeleiding, voor een technisch probleem of op jouw verzoek.

## 6. AI in het portaal

- De tools en de chat in het portaal schrijven met het taalmodel Claude van Anthropic.
- Naar de AI gaat: wat je in een tool invult, samen met een samenvatting van je merk (zoals je toon, je doelgroep en je aanbod), zodat de tekst klinkt als jou.
- Anthropic gebruikt gegevens die via haar zakelijke API binnenkomen niet om haar modellen te trainen, en bewaart ze maar korte tijd.
- De AI neemt geen besluiten over jou. Wat de AI schrijft is een voorstel dat je zelf beoordeelt.

## 7. Met wie gegevens gedeeld worden

Studio Crave verkoopt je gegevens nooit. Ze worden alleen gedeeld met partijen die nodig zijn om het werk te doen:

- **Supabase:** database, inloggen en opslag van bestanden en documenten. Locatie: EU (Frankfurt).
- **Vercel:** hosting van het portaal. Locatie: Verenigde Staten.
- **Anthropic:** het taalmodel achter de tools en de chat. Locatie: Verenigde Staten.
- **Maildienst** voor uitnodigingen en wachtwoordmails. Locatie: volgens de leverancier.
- **Pixieset:** online galerij van je shootfoto's. Locatie: volgens de leverancier.
- **Canva:** je brandbook en templates, via een gedeelde link.
- **Boekhouder en boekhoudpakket:** voor facturen en administratie.

Met deze partijen gelden afspraken over beveiliging en geheimhouding (een verwerkersovereenkomst). Als gegevens buiten de Europese Economische Ruimte worden verwerkt, gebeurt dat met passende waarborgen, zoals het EU-VS Data Privacy Framework of standaardcontractbepalingen van de Europese Commissie.

## 8. Hoe lang

- **Je portaal:** je account, je Signature Dish en je documenten blijven bewaard zolang je klant bent, ook na je traject. Je houdt toegang tot je Signature Dish en je documenten.
- **Verwijderen op verzoek:** wil je dat je gegevens worden verwijderd, mail dan naar {studio_email}. Studio Crave controleert eerst of het verzoek echt van jou komt en of er nog iets bewaard moet worden, en verwijdert daarna je account en je gegevens.
- **Getekende documenten en facturen:** die bewaart Studio Crave 7 jaar, omdat de wet dat vraagt (de fiscale bewaarplicht) en als bewijs van de afspraken. Ook als je account is verwijderd.
- **Aanvragen zonder vervolg:** worden uiterlijk 2 jaar na het laatste contact verwijderd.

## 9. Beveiliging

- Toegang tot het portaal gaat alleen op uitnodiging, met een persoonlijke login.
- Elke pagina en elke tool controleert wie je bent. Je ziet nooit gegevens van een andere klant.
- Bestanden en documenten staan in afgeschermde opslag en worden alleen via tijdelijke links geopend.
- Getekende documenten worden vastgelegd en kunnen niet meer worden aangepast.
- Verbindingen zijn versleuteld, en sleutels van gekoppelde systemen staan niet in de broncode.

Vermoed je een datalek, mail dan direct naar {studio_email}.

## 10. Je rechten

Je mag je gegevens inzien, laten corrigeren, laten verwijderen, de verwerking laten beperken, bezwaar maken, en je gegevens in een gangbaar formaat ontvangen (zoals je documenten als PDF). Stuur je verzoek naar {studio_email}. Studio Crave reageert binnen een maand, en meestal veel sneller.

## 11. Klachten

Ben je niet tevreden over hoe Studio Crave met je gegevens omgaat, laat het dan weten via {studio_email}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).

## 12. Wijzigingen

Studio Crave kan deze verklaring aanpassen, bijvoorbeeld als er een nieuw systeem bij komt. De nieuwste versie staat altijd in je portaal.$doc$),
  ('overeenkomst', 'Overeenkomst van opdracht', 'Overeenkomst', true, array['dwy','audit','templates','identity']::text[], '{}'::text[], true, 3,
$doc$# Overeenkomst van opdracht

## 1. Partijen

**{studio_naam}**, {studio_adres}, ingeschreven bij de KvK onder nummer {studio_kvk}, vertegenwoordigd door Jasmijn Straver, hierna: Studio Crave.

**{bedrijf}**, vertegenwoordigd door {naam} ({email}), hierna: de klant.

## 2. De opdracht

De klant neemt deel aan **{pakket}**, volgens The Branding Kitchen™ van Studio Crave. Het traject start op {startdatum}.

Dit is inbegrepen:

{inhoud}

{extras}

## 3. Looptijd en toegang tot het portaal

- Het traject duurt {looptijd}.
- De klant heeft toegang tot het portaal en de tools: {toegang}.
- Haar Signature Dish (haar merk op één pagina) en haar documenten blijven daarna altijd beschikbaar, ook als de toegang tot de tools is afgelopen.
- Verlengen van de toegang tot de tools is mogelijk zodra Studio Crave dit aanbiedt, tegen het dan geldende maandtarief.

## 4. Vergoeding en betaling

- De vergoeding is **{prijs}**.
- Studio Crave stuurt de factuur bij de start, tenzij anders afgesproken (bijvoorbeeld in termijnen). De betaaltermijn is 14 dagen.
- Studio Crave start met de werkzaamheden zodra de (eerste) betaling binnen is.
- Extra werk buiten deze opdracht doet Studio Crave alleen na akkoord van de klant op een prijsopgave.

## 5. Samenwerken

- De klant levert op tijd aan wat nodig is: de quiz, de onboarding, en bestanden zoals logo, foto's en teksten via het portaal.
- Na elke course geeft de klant akkoord of feedback, voordat de volgende course begint. Per onderdeel zijn twee feedbackrondes inbegrepen.
- Reageert de klant langer dan 14 dagen niet, dan mag Studio Crave de planning aanpassen. De looptijd van de toegang loopt gewoon door.
- Vragen kunnen altijd via het portaal, de app of info@studiocrave.nl. Studio Crave reageert op werkdagen binnen 2 werkdagen.

## 6. AI-tools in het portaal

Het portaal bevat schrijftools die werken met het taalmodel Claude van Anthropic. Wat zij maken is een voorstel. De klant controleert en past teksten zelf aan voordat ze die publiceert, en blijft daar zelf verantwoordelijk voor. Voor eerlijk gebruik geldt een daglimiet.

## 7. Intellectueel eigendom

Wat Studio Crave maakt, en hoe de klant het mag gebruiken, staat in het document "Intellectueel eigendom en licentie" (als dat bij deze opdracht hoort) en in de algemene voorwaarden. De methode The Branding Kitchen™, de skills en het portaal blijven van Studio Crave.

## 8. Annuleren en tussentijds stoppen

- Annuleert de klant vóór de start, dan is 25% van de vergoeding verschuldigd.
- Stopt de klant tijdens het traject, dan blijft de volledige vergoeding verschuldigd. Wat al is gemaakt en betaald, mag ze houden en gebruiken.
- Een geplande brand shoot kan tot 7 dagen vooraf kosteloos worden verzet. Daarna rekent Studio Crave 50% van het shoottarief.

## 9. Vertrouwelijkheid en privacy

Beide partijen houden vertrouwelijke informatie van de ander voor zich. Hoe Studio Crave met persoonsgegevens omgaat, staat in de privacyverklaring.

## 10. Overig

- Op deze overeenkomst zijn de algemene voorwaarden van Studio Crave van toepassing.
- Wijzigingen gelden alleen als beide partijen ze schriftelijk of in het portaal hebben bevestigd.
- Op deze overeenkomst is Nederlands recht van toepassing.$doc$),
  ('intellectueel-eigendom', 'Intellectueel eigendom en licentie', 'Intellectueel eigendom', true, array['dwy','templates','identity']::text[], array['Branded templates','Craveable Identity']::text[], true, 4,
$doc$# Intellectueel eigendom en licentie

## 1. Waar dit over gaat

Dit document regelt wie eigenaar is van wat Studio Crave voor **{bedrijf}** maakt binnen **{pakket}**, en hoe de klant het mag gebruiken. Het hoort bij de overeenkomst van opdracht en de algemene voorwaarden.

## 2. Wat de klant krijgt

Na volledige betaling krijgt de klant een **onbeperkte, eeuwigdurende licentie** om dit voor haar eigen onderneming te gebruiken:

- Haar logo-set, beeldmerk of monogram, kleurpalet en typografie.
- Haar brandbook en haar Brand Kit in Canva.
- Haar templates (zoals posts, stories, carrousels, reel covers en highlights).
- Teksten die speciaal voor haar zijn geschreven, en wat zij zelf met de tools in het portaal maakt.

Ze mag dit aanpassen, laten drukken, en laten gebruiken door mensen die voor haar werken (zoals een VA of drukker).

## 3. Logo en beeldmerk

- Het logo dat Studio Crave voor de klant ontwerpt, draagt Studio Crave na volledige betaling over aan de klant. De klant mag het als merk laten registreren.
- Studio Crave levert het logo aan in de afgesproken formaten (licht en donker).

## 4. Wat van Studio Crave blijft

- De methode The Branding Kitchen™, het portaal, de skills en de werkwijze.
- De opzet van de templates (het raamwerk waarmee ze gemaakt zijn), zodat Studio Crave vergelijkbare opbouw voor andere klanten kan blijven gebruiken. De vormgeving in de huisstijl van de klant gebruikt Studio Crave nooit voor een ander.
- Ontwerpen of voorstellen die de klant niet heeft gekozen.

## 5. Wat niet mag

- Templates of het brandbook doorverkopen of weggeven aan andere ondernemers.
- De methode, skills of tools uit het portaal kopiëren of namaken.

## 6. Wat de klant aanlevert

De klant zorgt ervoor dat ze het recht heeft om aangeleverde foto's, logo's, lettertypen en teksten te laten gebruiken. Lettertypen waarvoor een licentie nodig is, koopt de klant zelf.

## 7. Portfolio

Studio Crave mag het werk laten zien in haar portfolio, op haar website en social media, met vermelding van het merk van de klant. Wil de klant dat liever niet, of pas na de lancering, dan geeft ze dat aan en houdt Studio Crave zich daaraan.

## 8. Voor wanneer

De licentie en de overdracht van het logo gaan in zodra alle facturen voor deze opdracht zijn betaald. Tot die tijd mag de klant het werk alleen gebruiken om het te beoordelen.$doc$),
  ('beeldrechten-shoot', 'Beeldrechten en licentie brand shoot', 'Beeldrechten & licentie', true, array['dwy']::text[], array['Brand shoot']::text[], true, 5,
$doc$# Beeldrechten en licentie brand shoot

## 1. De shoot

Studio Crave verzorgt voor **{bedrijf}** een brand shoot, als onderdeel van {pakket}. Dat kan een **Kick Off shoot** zijn (1 uur, minimaal 15 bewerkte foto's) of een **Full Shoot Day** (3 tot 4 uur, 60 tot 80 bewerkte foto's), zoals in je bevestiging staat.

## 2. Voorbereiding en locatie

- De shoot wordt voorbereid vanuit je positionering: shotlist, locatie, outfits en regie.
- Een buitenlocatie is kosteloos. Een studio of betaalde locatie is voor rekening van de klant, net als reiskosten buiten de regio, tenzij anders afgesproken.
- Bij slecht weer op een buitenlocatie zoeken we samen een nieuwe datum, zonder kosten.

## 3. Selectie en oplevering

- Na de shoot krijgt de klant een online galerij (Pixieset) om haar favorieten te kiezen.
- Studio Crave bewerkt de selectie in de Studio Crave-stijl en levert de foto's binnen 14 dagen na de selectie op, in hoge resolutie en webformaat.
- Ruwe, onbewerkte bestanden worden niet geleverd. Studio Crave bewerkt geen foto's na in een andere stijl, en de klant past de bewerking zelf niet ingrijpend aan (zoals filters die de stijl veranderen).

## 4. Wie eigenaar is

Studio Crave is de maker van de foto's en blijft eigenaar van het auteursrecht.

## 5. Wat de klant mag

Na volledige betaling krijgt de klant een **onbeperkte, eeuwigdurende licentie** om de bewerkte foto's te gebruiken voor haar eigen onderneming:

- Op haar website, social media, nieuwsbrief en in haar templates.
- In drukwerk, presentaties en betaalde advertenties.
- In persberichten en publicaties over haar onderneming, met de naamsvermelding "Foto: Studio Crave" waar dat kan.

## 6. Wat niet mag

- De foto's doorverkopen of in licentie geven aan anderen.
- De foto's gebruiken voor een ander bedrijf dan dat van de klant, zonder overleg.
- De foto's insturen voor een fotowedstrijd of claimen als eigen werk.

## 7. Wat Studio Crave mag

Studio Crave mag de foto's gebruiken voor haar portfolio, website en social media, en om haar eigen werk te promoten. Hoe dat gaat voor de mensen op de foto, staat in de modelrelease.

## 8. Bewaren

Studio Crave bewaart de bewerkte foto's minimaal 1 jaar na oplevering. Download ze zelf ook en bewaar ze op een veilige plek.$doc$),
  ('modelrelease', 'Modelrelease', 'Modelrelease', true, array['dwy']::text[], array['Brand shoot']::text[], true, 6,
$doc$# Modelrelease

## 1. Wie

Ik, **{naam}**, sta op de foto's van de brand shoot voor **{bedrijf}**, gemaakt door Studio Crave.

## 2. Toestemming voor mijn eigen merk

Ik geef toestemming om de foto's waarop ik herkenbaar sta te gebruiken voor mijn eigen onderneming, zoals beschreven in "Beeldrechten en licentie brand shoot".

## 3. Toestemming voor Studio Crave

Ik geef Studio Crave toestemming om een selectie van de foto's te gebruiken:

- In haar portfolio en op haar website.
- Op haar social media, met een tag of vermelding van mijn merk.
- In presentaties en lesmateriaal over haar werk.

Studio Crave gebruikt de foto's niet in betaalde advertenties en geeft ze niet aan derden, tenzij ik daar apart toestemming voor geef.

## 4. Respectvol gebruik

Studio Crave gebruikt de foto's alleen op een manier die mij en mijn merk recht doet, en plaatst ze niet in een context die schadelijk of misleidend is.

## 5. Andere mensen op de foto

Staan er anderen op de foto's (zoals een partner, kind, collega of klant), dan zorg ik dat zij weten waarvoor de foto's gebruikt worden en daar toestemming voor geven. Voor kinderen onder de 16 geef ik die toestemming als ouder of verzorger, of regel ik die bij hun ouder of verzorger.

## 6. Intrekken

Ik kan de toestemming voor gebruik door Studio Crave (punt 3) altijd intrekken via info@studiocrave.nl. Studio Crave haalt de foto's dan binnen 30 dagen weg van haar website en social media, voor zover dat redelijkerwijs kan. Wat al gedrukt of verspreid is, kan niet meer worden teruggehaald.

## 7. Vergoeding

Voor deze toestemming ontvang ik geen aparte vergoeding. De shoot zelf is onderdeel van mijn opdracht.$doc$),
  ('welkomstgids', 'Welkomstgids', 'Welkomstgids', false, array['dwy','audit','templates','identity','zelf']::text[], '{}'::text[], true, 7,
$doc$# Welkom, {naam}

Fijn dat je er bent. Dit is je eigen keuken bij Studio Crave: hier vind je alles van je traject **{pakket}**, op één plek.

## 1. Zo begin je

1. Doe de quiz "Welk gerecht ben jij?". Dan weet ik meteen een beetje hoe jouw merk smaakt.
2. Vul de onboarding in. Hoe eerlijker je antwoorden, hoe meer alles in het portaal klinkt als jou.
3. Lees en teken je documenten, dan kunnen we beginnen.

## 2. Wat je in het portaal vindt

- **Menu:** je courses van The Branding Kitchen™. Per course zie je wat ik doe, wat jij doet, je bestanden, je tools en een plek om aan te leveren.
- **Tools:** schrijftools die je merk kennen, voor captions, hooks, stories, e-mails en meer. Ze schrijven in jouw toon; jij beoordeelt en past aan.
- **Workflow:** je focusblokken, je weekfocus en je eigen tools.
- **Documenten:** je overeenkomst en voorwaarden. Getekend kun je ze altijd als PDF downloaden.
- **Signature Dish:** aan het einde staat je hele merk op één pagina: je belofte, toon, kleuren, lettertypen, logo's, beelden en templates. Die blijft altijd van jou.

## 3. Hoe we samenwerken

- Looptijd: {looptijd}. Toegang tot het portaal en de tools: {toegang}. Je Signature Dish en je documenten blijven daarna altijd van jou.
- {werkwijze}
- Lever op tijd aan: foto's, logo's, teksten of voice memo's kun je in elke course uploaden.

## 4. Contact

Vragen? Stuur een bericht via het portaal of de app, of mail naar info@studiocrave.nl. Op werkdagen reageer ik binnen 2 werkdagen.

Ready to create some cravings?

Jasmijn$doc$),
  ('toestemming-klantcase', 'Toestemming klantcase en review', 'Toestemming', true, '{}'::text[], '{}'::text[], false, 8,
$doc$# Toestemming klantcase en review

## 1. Waarvoor

Ik, **{naam}** van **{bedrijf}**, geef Studio Crave toestemming om mijn ervaring met {pakket} te delen als review of klantcase.

## 2. Wat Studio Crave mag gebruiken

- Mijn review of quote, eventueel licht ingekort, zonder de betekenis te veranderen.
- Mijn naam, bedrijfsnaam en functie.
- Mijn logo en het werk dat Studio Crave voor mij heeft gemaakt.
- Foto's van mijn brand shoot, en een voor- en na-vergelijking van mijn merk.
- Een korte beschrijving van mijn traject en resultaat, die ik eerst te zien krijg.

## 3. Waar

Op de website van Studio Crave, op social media (zoals Instagram en LinkedIn), in nieuwsbrieven, salespagina's, presentaties en in advertenties van Studio Crave.

## 4. Vooraf meelezen

Een uitgewerkte klantcase stuurt Studio Crave mij eerst toe. Ik heb 7 dagen om aanpassingen door te geven. Reageer ik niet, dan mag Studio Crave de case gebruiken zoals hij is.

## 5. Intrekken

Ik kan deze toestemming altijd intrekken via info@studiocrave.nl. Studio Crave haalt de review of case dan binnen 30 dagen weg van haar website en social media, voor zover dat redelijkerwijs kan. Wat al gedrukt of verspreid is, kan niet worden teruggehaald.

## 6. Vergoeding

Voor deze toestemming ontvang ik geen vergoeding.$doc$),
  ('verwerkersovereenkomst', 'Verwerkersovereenkomst', 'Verwerkersovereenkomst', true, '{}'::text[], '{}'::text[], false, 9,
$doc$# Verwerkersovereenkomst

Gebruik dit document alleen als Studio Crave voor jou persoonsgegevens van jóuw klanten of contacten verwerkt, bijvoorbeeld een e-maillijst, klantgegevens voor een klantcase, of reviews met namen. Voor je eigen gegevens in het portaal is deze overeenkomst niet nodig: daarvoor geldt de privacyverklaring.

## 1. Partijen

**{bedrijf}**, vertegenwoordigd door {naam}, is de verwerkingsverantwoordelijke: zij bepaalt waarvoor de gegevens gebruikt worden.

**{studio_naam}** (KvK {studio_kvk}) is de verwerker: zij verwerkt de gegevens alleen in opdracht van de klant.

## 2. Welke gegevens en waarvoor

Studio Crave verwerkt alleen de persoonsgegevens die de klant aanlevert voor de opdracht {pakket}, zoals namen, e-mailadressen, reviews en foto's van haar klanten, en alleen voor die opdracht.

## 3. Afspraken

- Studio Crave verwerkt de gegevens alleen volgens de instructies van de klant, en niet voor eigen doeleinden.
- Iedereen die bij Studio Crave met de gegevens werkt, houdt ze geheim.
- Studio Crave beveiligt de gegevens passend: afgeschermde opslag, persoonlijke logins en versleutelde verbindingen.
- Studio Crave mag subverwerkers inschakelen die nodig zijn voor het werk (zoals Supabase, Vercel en Anthropic). Zij zijn aan dezelfde verplichtingen gebonden. Komt er een nieuwe subverwerker bij, dan laat Studio Crave dat vooraf weten.
- Studio Crave helpt de klant als iemand zijn privacyrechten wil gebruiken, en bij een datalek.

## 4. Datalekken

Ontdekt Studio Crave een datalek waarbij gegevens van de klant betrokken zijn, dan meldt zij dat binnen 48 uur aan de klant, met wat er bekend is. De klant beslist of het lek gemeld moet worden bij de Autoriteit Persoonsgegevens.

## 5. Einde

Na afloop van de opdracht verwijdert Studio Crave de gegevens, of geeft ze terug als de klant dat wil, tenzij de wet langer bewaren verplicht.

## 6. Aansprakelijkheid

Voor aansprakelijkheid geldt wat in de algemene voorwaarden van Studio Crave staat.$doc$)
on conflict (id) do nothing;
