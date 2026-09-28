# FINTECH VIZIONÁŘ: jak hra funguje

Popis je psaný tak, aby ho pochopil i někdo, kdo o hře nic neví. Dá se použít jako podklad pro moderátora, jako příloha k pozvánce nebo jako vysvětlení pro účastníky, kteří se po vyhlášení budou ptát, proč vyhrál zrovna ten člověk.

---

## Co se vlastně děje

V sále je zhruba 200 lidí. Každý z nich dostane 20 žetonů, kterým říkáme tokeny. Nejsou skutečné, existují jen v aplikaci v jeho telefonu. Každý účastník těchto 20 tokenů rozdělí mezi trendy, o kterých si myslí, že budou ve fintechu nejdůležitější.

Trendů je deset: AI Agenti, Tokenizace & Stablecoiny, Digitální Euro, Open Finance & PSD3, Embedded Finance, DeFi, EU Wallet, Quantum computing, Startupový zákon a Cybersecurity.

Když všichni odhlasují, sečtou se tokeny, které jednotlivé trendy dostaly od celého sálu. Vznikne tak žebříček: který trend má nejvíc tokenů, ten sál považuje za nejdůležitější. Ten žebříček se odhalí na velké obrazovce.

A pak se určí vítěz. Vyhrává ten účastník, jehož osobní rozdělení tokenů se nejvíc podobá výslednému rozdělení celého sálu.

## Co přesně dělá účastník

Účastník nehlasuje pro jednu možnost jako ve volbách. Rozděluje, a to je zásadní rozdíl. Může říct „AI Agenti jsou podle mě mnohem důležitější než všechno ostatní“ tím, že jim dá 12 tokenů z dvaceti. Nebo může říct „tyhle čtyři trendy jsou zhruba stejně důležité“ a dát každému pět tokenů.

Platí tři pravidla:

**Musí utratit všech 20 tokenů.** Aplikace neodešle tip, dokud nezbývá nula. Kdyby si někdo mohl nechat tokeny stranou, hrál by jinou hru než ostatní.

**Smí použít nejvýše 5 trendů z deseti.** Aspoň pět trendů tedy musí nechat na nule. Proč zrovna pět, vysvětluje kapitola o strategii níže.

**Tip jde odeslat jen jednou a pak už ho nelze změnit.** Dokud účastník nezmáčkne tlačítko, může si rozdělení libovolně přehazovat, aplikace mu ho drží, i když si stránku omylem zavře. Po odeslání je tip uzamčený.

## Co se stane po uzavření hlasování

Server sečte všechny tokeny, které dostal každý trend od všech účastníků dohromady. Při 200 hráčích je v sázce 4 000 tokenů (200 × 20).

Ty součty se přepočítají na procenta. Když AI Agenti dostali 880 tokenů ze 4 000, mají 22 procent. Součet všech deseti procent dá dohromady 100.

**Tohle je „výsledek sálu“.** Není to žádná pravda o budoucnosti fintechu. Je to zrcadlo: takhle smýšlí lidé v sále dohromady. Vznikne z něj ten hlavní graf na obrazovce.

## Jak se určí vítěz

Vítězem je ten, jehož osobní rozdělení se nejvíc shoduje s rozdělením sálu. Slovo „shoda“ tu má přesnou definici a je dobré ji chápat, protože moderátor ji na pódiu bude muset umět vysvětlit jednou větou.

**Shodu počítáme jako překryv.** U každého trendu porovnáme dvě čísla: kolik procent svých tokenů mu dal daný hráč, a kolik procent mu dal celý sál. Do skóre se započítá to menší z těch dvou čísel. Pak se to sečte přes všech deset trendů.

Příklad na jednom trendu: hráč dal Digitálnímu Euru 30 procent svých tokenů, sál mu dal 20 procent. Započítá se 20. Kdyby mu dal jen 10 procent a sál 20, započítá se 10.

Výsledek je číslo od 0 do 100, které se zobrazuje jako procento shody. Sto procent by znamenalo, že hráč trefil rozdělení sálu úplně přesně, na každý trend. V praxi u dvou set lidí vychází nejlepší výsledky někam k 60 až 75 procentům, průměr sálu bývá výrazně níž.

Dá se to představit jako dvě sady sloupečků položené přes sebe. Shoda je plocha, ve které se sloupečky překrývají.

**Vlastní tip se do „sálu“ nepočítá.** Když se počítá shoda konkrétního hráče, server nejdřív jeho vlastních 20 tokenů z celkového součtu odečte a porovnává ho s tím, co nahlasovali všichni ostatní. Jinak by hráč soutěžil sám se sebou: kdo dá všech 20 tokenů na jeden okrajový trend, ten mu tím sám zvedne procento, se kterým se pak porovnává. Při dvou stech lidech je ten vliv malý, ale je to čistší a u menších skupin by to hrálo velkou roli.

## Celý výpočet na malém příkladu

Aby to bylo vidět na konkrétních číslech, tady je hra pro pět lidí. Každý má stejných 20 tokenů jako v ostré hře. Čísla jsou ověřená přímo tím kódem, který hru počítá.

Jak hlasovali:

| Hráč | Rozdělení tokenů |
|---|---|
| Anna | AI Agenti 10, Tokenizace & Stablecoiny 5, Embedded Finance 5 |
| Bohdan | AI Agenti 8, Quantum computing 6, DeFi 6 |
| Cyril | Tokenizace & Stablecoiny 20 |
| Dana | AI Agenti 6, Embedded Finance 6, Open Finance & PSD3 4, Cybersecurity 4 |
| Emil | AI Agenti 5, Tokenizace & Stablecoiny 5, Embedded Finance 5, DeFi 5 |

Součet přes všechny hráče je 100 tokenů, takže tokeny a procenta jsou tu shodou okolností totéž:

| Trend | Tokeny | Podíl sálu |
|---|---|---|
| Tokenizace & Stablecoiny | 30 | 30 % |
| AI Agenti | 29 | 29 % |
| Embedded Finance | 16 | 16 % |
| DeFi | 11 | 11 % |
| Quantum computing | 6 | 6 % |
| Open Finance & PSD3 | 4 | 4 % |
| Cybersecurity | 4 | 4 % |

Teď spočítáme shodu pro Annu. Anna dala ze svých 20 tokenů deset AI Agentům (to je 50 procent jejího tipu), pět Tokenizaci & Stablecoinům (25 procent) a pět Embedded Finance (25 procent).

Sál bez Anny má dohromady 80 tokenů a vypadá takhle: AI Agenti 19 tokenů, což je 23,75 procenta, Tokenizace & Stablecoiny 25 tokenů, což je 31,25 procenta, a Embedded Finance 11 tokenů, tedy 13,75 procenta.

Porovnáme trend po trendu a bereme vždy menší číslo:

- AI Agenti: Anna 50 %, sál 23,75 % → započítá se 23,75
- Tokenizace & Stablecoiny: Anna 25 %, sál 31,25 % → započítá se 25
- Embedded Finance: Anna 25 %, sál 13,75 % → započítá se 13,75
- Ostatní trendy: Anna má nulu, takže se nezapočítá nic

**Annina shoda je 23,75 + 25 + 13,75 = 62,5 procenta.**

Stejným postupem vyjdou ostatní a vznikne pořadí:

| Pořadí | Hráč | Shoda |
|---|---|---|
| 1. | Emil | 71,25 % |
| 2. | Anna | 62,5 % |
| 3. | Dana | 41,25 % |
| 4. | Bohdan | 32,5 % |
| 5. | Cyril | 12,5 % |

Na tom příkladu je vidět všechno podstatné:

**Vyhrál Emil, protože rozložil tokeny přesně mezi ty čtyři trendy, které sál považoval za nejsilnější**, a v rozumném poměru. Netrefil se úplně přesně, ale nikde nebyl mimo.

**Anna byla druhá.** Vsadila na správné trendy, ale na AI Agenty dala příliš mnoho: dala jim polovinu svého tipu, sál jen necelou čtvrtinu. Přebytek se jí do skóre nezapočítal.

**Cyril skončil poslední s 12,5 procenta, i když vsadil na trend, který v sále vyhrál.** Tohle je nejdůležitější poučení z celé hry. Cyril dal všech 20 tokenů Tokenizaci & Stablecoinům, takže jeho tip byl ze sta procent tenhle jeden trend. Jenže sál mu dal jen kolem 12 procent, když nepočítáme Cyrila samotného. Trend sice skončil první, ale s velkým náskokem první nebyl, a Cyrilových zbývajících 87,5 procenta tipu nemělo v sále protějšek. Sázka všechno na jednu kartu je v téhle hře skoro vždy prohra.

**Cyril si navíc sám ten trend vytlačil nahoru.** Tokenizace & Stablecoiny skončily první hlavně jeho zásluhou. Právě proto se vlastní tip z porovnání odečítá.

## Kdo tedy vyhrává a jakou dovednost hra měří

Tohle je potřeba říct rovnou a nahlas, protože se to snadno plete: **hra neměří, kdo nejlépe předpověděl budoucnost fintechu.** Odpověď na to, jestli měl pravdu, dnes nikdo nemá a mít nebude ještě roky.

Hra měří, **kdo nejlépe odhadl, co si myslí sál**. Je to úloha na čtení publika. Vítěz je ten, kdo se dokázal odpoutat od vlastního přesvědčení a uhodnout, kam se přikloní 200 lidí kolem něj, kteří pracují v oboru.

Pro moderátora z toho plyne dobrá pointa: vítěz není ten, kdo má nejlepší názor, ale ten, kdo nejlíp rozumí tomu, jak přemýšlí jeho branže.

Vyhrává tedy typicky ten, kdo:

- vsadil na trendy, které jsou v oboru očividně nejvíc slyšet,
- rozdělil tokeny v rozumných poměrech místo jedné velké sázky,
- neplýtval tokeny na trendy, které jsou sice zajímavé, ale v sále nemají podporu.

## Proč nejvýš pět trendů

Bez tohoto omezení by hra měla nudné řešení, které by objevil každý, kdo pravidla domyslí. Stačilo by dát každému z deseti trendů dva tokeny, tedy rovnoměrně deset procent. Takový tip má totiž nějaký překryv se vším a nemůže se u žádného trendu minout.

Simulace na 200 hráčích a stovkách opakování hry ukázala: **rovnoměrné rozprostření porazilo zhruba 79 procent hráčů, kteří hlasovali podle svého skutečného názoru.** Hra by se tím zvrhla v soutěž, kdo dřív pochopil, že má nemít názor.

S limitem pěti trendů je to obrácené: hráč musí polovinu trendů obětovat, tedy si vybrat. Stejná „rovnoměrná“ strategie tím spadne pod průměr, konkrétně asi na 35. percentil.

Přísnější limit tří trendů by vedl k tomu, že možných tipů je málo a v průměru má 15 lidí úplně stejné nejvyšší skóre. O vítězi by pak rozhodovalo losování v podobě času odeslání.

## Proč se výsledky během hlasování neukazují

Obrazovka během hlasování schválně neukazuje, jak si trendy stojí. Vidí se jen počet odevzdaných tipů, odpočet a jména lidí, kteří právě hlasovali.

Důvod je jednoduchý: kdyby graf běžel živě, ten, kdo hlasuje jako poslední, opíše aktuální rozdělení a vyhraje. V simulaci takový hráč porazil 99 procent ostatních. Hra by se změnila v soutěž, kdo se nejdéle nudí.

Živý graf jde v administraci zapnout, když jde jen o vizuální efekt a na férovosti soutěže nezáleží. Pak ale nemá smysl vyhlašovat vítěze.

## Když má víc lidí stejné skóre

Při dvou stech hráčích se občas stane, že dva lidé mají shodu na setinu stejnou. Rozhodují proto dvě další pravidla, v tomto pořadí.

**Nejdřív menší celková odchylka.** Ze dvou stejně dobrých tipů vyhrává ten, který se u žádného jednotlivého trendu neminul o moc. Technicky se sčítají druhé mocniny odchylek, což velké chyby trestá víc než sadu malých. Prakticky to znamená: kdo byl vyrovnaně blízko, má přednost před tím, kdo jeden trend trefil přesně a u jiného byl úplně vedle.

**Potom čas odeslání.** Když jsou dva tipy naprosto totožné, vyhrává ten, kdo odeslal dřív. Rozhodnout se rychle je taky rozhodnutí.

Tohle není teoretická poznámka. Při testu se dva lidé se stejným rozdělením skutečně sešli a pořadí určil až čas.

## Průběh na obrazovce krok za krokem

Hra má pět fází, mezi kterými přepíná moderátor nebo obsluha v administraci.

**1. Lobby.** Velký QR kód, název hry, tři kroky návodu a seznam deseti trendů. Naskakuje počet připojených lidí. Hlasovat ještě nejde, ale kdo chce, může si tokeny předem rozmyslet a připravit.

**2. Hlasování.** Obrazovka zůstává stejná jako v lobby, tedy velký QR kód a návod, aby se mohl kdykoli přidat i ten, kdo přijde později. V hlavičce běží odpočet do konce hlasování, který standardně startuje na 60 minutách, a dole je vidět, kolik lidí je připojených a kolik tipů už dorazilo. Rozdělení tokenů zůstává skryté. Po vypršení času se hlasování uzavře samo. Stejný odpočet vidí každý účastník na telefonu, a to jak před zadáním přezdívky, tak během rozdělování tokenů.

**3. Uzavřeno.** Krátká mezihra s počtem odevzdaných tipů. Hlasy jsou zmrazené, opozdilci už se dovnitř nedostanou.

**4. Výsledky.** Sloupce naskakují od desátého místa k prvnímu, poslední tři s pauzou. Celé odhalení trvá asi čtrnáct sekund, což je prostor pro komentář moderátora. U každého trendu je procento i počet tokenů.

**5. Vítězové.** Stupně vítězů s prvními třemi jmény a jejich procenty shody, vedle nich místa 4 až 10 a průměrná shoda celého sálu. V tu chvíli se každému účastníkovi na telefonu objeví jeho vlastní pořadí a shoda.

## Co vidí účastník na telefonu

Naskenuje QR kód a otevře se mu stránka. Zadá přezdívku, pod kterou ho uvidí sál. Přezdívky musí být unikátní, takže druhý Petr dostane hlášku, ať zkusí jinou.

Pak vidí seznam deseti trendů, u každého tlačítka plus a minus. Nahoře mu svítí, kolik tokenů ještě zbývá a kolik trendů už použil z povolených pěti. Když zkusí přidat token šestému trendu, aplikace mu vysvětlí, že nejdřív musí nějaký jiný trend úplně vynulovat.

Když rozdělí všech 20 tokenů, tlačítko odeslání se odemkne a ukáže se shrnutí s dotazem, jestli to takhle opravdu chce. Po potvrzení už změna není možná.

Po odeslání vidí svůj tip a informaci, ať sleduje velkou obrazovku. Po vyhlášení vítězů se mu tam objeví jeho výsledek.

## Drobnosti, na které se lidé ptají

**Musím hlasovat, abych mohl vyhrát?** Ano. Kdo tip neodešle, nemá co porovnávat a v žebříčku se neobjeví.

**Co když přijdu pozdě?** Připojit se jde kdykoli během hlasování. Po jeho uzavření už ne.

**Můžu tip změnit, když si to rozmyslím?** Ne. Před odesláním ano, potom ne. Kdyby to šlo, lidé by čekali do poslední chvíle a hra by se protáhla.

**Věřím trendu, o kterém se v oboru moc nemluví. Mám na něj vsadit?** Můžeš, všech deset trendů se počítá stejně. Skóre si tím ale nejspíš pokazíš: co sál nezvolí, to ti do překryvu nic nepřinese. Hra se ptá, co si myslí sál, ne co si myslíš ty.

**Můžu hlasovat dvakrát z jednoho telefonu?** Aplikace si zařízení pamatuje a druhý tip odmítne. Kdo úmyslně vymaže data prohlížeče nebo použije anonymní okno, obejde to. Pro firemní akci je to přijatelné, skutečná ochrana by znamenala přihlašování a to by lidi odradilo.

**Je vítězství náhoda?** Zčásti ano. Hra je zábava, ne měření inteligence. Dobrý odhad nálady v sále ale posouvá šance výrazně, jak ukazuje rozdíl mezi Emilem a Cyrilem v příkladu výše.

---

## Shrnutí do tří vět pro moderátora

Každý dostal 20 tokenů a rozdělil je nejvýš mezi 5 z deseti trendů. Sečetli jsme všechny tokeny a takhle vidí budoucnost celý sál. Vyhrává ten, jehož osobní rozdělení se s tím sálem nejvíc překrývá, takže vítěz není ten, kdo má nejlepší názor, ale ten, kdo nejlíp odhadl, jak přemýšlí jeho branže.
