# Zprovoznění zdarma na Renderu

Postup trvá zhruba 20–30 minut a nepotřebuješ kartu ani příkazovou řádku. Názvy tlačítek v Renderu a na GitHubu se mohou mírně lišit, jak rozhraní průběžně mění. Výsledek bude na adrese typu `https://trend-game.onrender.com`.

## Proč Render a co to obnáší

Stav free hostingů k 16. 9. 2026:

| Hosting | Stav free tarifu | Použitelné? |
|---|---|---|
| **Render** | free web služba + free Postgres, bez karty | **ano** |
| Koyeb | od února 2026 nové účty jen na placených tarifech | ne |
| Fly.io | free tarif pro nové účty zrušen | ne |
| Railway | jednorázový trial (5 USD na 30 dní), pak 1 USD kreditu měsíčně | jen jako trial |
| Cloudflare Quick Tunnel z notebooku | limit asi 200 souběžných spojení, žádná garance | ne, 200 hráčů je přesně na limitu |

### Omezení Renderu Free a jak je hra řeší

**Výkon: 0,1 CPU a 512 MB RAM.**
Při testu s 200 hráči server spotřeboval průměrně 1,3 % jednoho jádra a 77 MB paměti. Rezerva je velká.

**Uspávání po 15 minutách bez provozu.** Probuzení trvá asi minutu.
Stačí mít otevřenou LED obrazovku. Její spojení posílá serveru signál každých 25 sekund, a to Render počítá jako provoz. Obrazovku proto otevři aspoň 10 minut před začátkem a nezavírej ji.

**Render může free službu kdykoli restartovat a přitom smaže lokální disk.**
Stav hry se proto ukládá do free Postgresu. Otestováno: po restartu i po tvrdém pádu serveru zůstaly všechny hlasy.

**Free Postgres vyprší 30 dní po vytvoření.** Po dalších 14 dnech ho Render smaže.
Databázi vytvoř nejdřív asi 3 týdny před akcí. Výsledky si hned po akci stáhni jako CSV.

**750 free hodin měsíčně.**
Jedna služba běžící celý měsíc se do limitu vejde.

**Měsíční limit přenesených dat.**
Hra spotřebuje řádově desítky MB, limitu se ani nepřiblíží.

Render sám free instance označuje za nevhodné pro produkční provoz. Na jednorázovou hru to podle mých testů stačí (jistota: střední). Hlavní zbývající riziko je nečekaný restart Renderu přímo během hlasování: data přežijí, ale telefony se asi na minutu odpojí. Pokud to nesmíš riskovat, přepni den před akcí web službu na nejlevnější placený tarif. Podle srovnávacích webů stojí kolem 7 USD měsíčně, cenu si ověř na render.com/pricing. Po akci ho zase vypni.

---

## 1. Nahrání kódu na GitHub (asi 5 minut)

Render nasazuje kód z GitHubu.

1. Založ si účet na [github.com](https://github.com) (pokud ho nemáš).
2. Vpravo nahoře klikni na **+** a vyber **New repository**.
3. Vyplň:
   - **Repository name:** `trend-game`
   - **Viditelnost:** klidně **Private**, Render k soukromým repozitářům přístup má.
   - **Nezaškrtávej** „Add a README file“.
4. Klikni na **Create repository**.
5. Na stránce prázdného repozitáře klikni na odkaz **uploading an existing file**.
6. Rozbal `trend-game.zip`, otevři složku `trend-game` a **přetáhni její obsah** do okna prohlížeče: soubory `server.js`, `package.json`, `package-lock.json`, `config.js`, `render.yaml` a složky `public`, `lib`, `test`, `docs`.
   - Nepřetahuj celou složku `trend-game`. Soubor `package.json` musí být v kořeni repozitáře, jinak ho Render nenajde.
7. Dole klikni na **Commit changes**.
8. Zkontroluj, že v repozitáři vidíš přímo `server.js` a složku `public`.

## 2. Účet na Renderu (2 minuty)

1. Otevři [dashboard.render.com/register](https://dashboard.render.com/register).
2. Zvol **GitHub**, tím se účty rovnou propojí.

## 3. Databáze (3 minuty + čekání)

1. V Render Dashboardu klikni na **New** a vyber **Postgres**.
2. Vyplň:
   - **Name:** `trend-game-db`
   - **Region:** **Frankfurt (EU Central)**, nejblíž Česku.
   - **Instance Type / Plan:** **Free**
   - Ostatní pole nech výchozí.
3. Klikni na **Create Database** a počkej, až se stav změní na **Available** (obvykle pár minut).
4. Na stránce databáze najdi sekci **Connections** a zkopíruj **Internal Database URL**.
   - Musí to být interní URL, ne externí. Interní funguje jen uvnitř Renderu a nevyžaduje šifrování.

## 4. Web služba (5 minut)

1. Klikni na **New** a vyber **Web Service**.
2. Vyber repozitář `trend-game`. Pokud ho nevidíš, klikni na **Configure GitHub** a Renderu k repozitáři povol přístup.
3. Vyplň:

| Pole | Hodnota |
|---|---|
| Name | `trend-game` (určuje adresu; když je obsazená, Render přidá příponu) |
| Language | **Node** |
| Branch | `main` |
| Region | **Frankfurt**, musí být stejný jako u databáze |
| Build Command | `npm ci --omit=dev` |
| Start Command | `node server.js` |
| Instance Type | **Free** |

4. V sekci **Environment Variables** přidej dvě proměnné:

| Key | Value |
|---|---|
| `ADMIN_KEY` | dlouhé náhodné heslo do administrace, např. `trendy-7Kq2-mXv9-2026` |
| `DATABASE_URL` | Internal Database URL zkopírovaná v kroku 3 |

   Veřejnou adresu (`PUBLIC_URL`) nastavovat nemusíš, server si ji od Renderu převezme sám.

5. Rozbal **Advanced** a nastav:
   - **Health Check Path:** `/healthz`
   - **Auto-Deploy:** **Off**. Úprava na GitHubu tak nespustí nové nasazení uprostřed akce.
6. Klikni na **Deploy Web Service**.

## 5. Kontrola, že vše běží

1. Na stránce služby otevři záložku **Logs**. Po několika minutách buildu musíš vidět:
   ```
   Úložiště: PostgreSQL (dpg-…), zatím prázdné
     Trendová hra běží
   ```
   Pokud místo `PostgreSQL` vidíš `soubor …`, proměnná `DATABASE_URL` chybí nebo je špatně napsaná.
2. Nahoře na stránce služby je adresa `https://<název>.onrender.com`. Otevři:
   - `https://<název>.onrender.com/screen`: pod QR kódem musí být právě tahle adresa.
   - `https://<název>.onrender.com/admin#<ADMIN_KEY>`: administrace.
   - `https://<název>.onrender.com/` na telefonu **přes mobilní data**, ne přes Wi-Fi.

## 6. Generálka (doporučeno, 15 minut)

1. V administraci klikni na **Přidat testovací hráče** (200) a pak na **2. Spustit hlasování** s 1 minutou.
2. Na obrazovce sleduj tečky. Jeden tip pošli ze svého telefonu.
3. **Otestuj restart:** v Render Dashboardu klikni na **Manual Deploy** a vyber **Deploy latest commit**. Po doběhnutí musí administrace ukázat stejný počet hráčů a tipů jako předtím a telefon se sám znovu připojí.
4. Projdi fáze **Uzavřít**, **Odhalit výsledky** a **Vyhlásit vítěze** a stáhni CSV.
5. Nakonec zadej **RESET** a klikni na **Smazat všechna data**.

## 7. Den akce

- **Nejméně 10 minut předem:**
  - Na LED počítači otevři `/screen` v Chromu na celou obrazovku (F11) a tab už nezavírej.
  - V administraci zkontroluj, že je hra ve fázi **Lobby** a hráčů je 0.
  - Naskenuj QR kód vlastním telefonem.
- **Během akce nic nenasazuj** a neměň proměnné prostředí. Obojí restartuje server.
- **Hned po vyhlášení** stáhni CSV. Free databáze za pár týdnů zmizí.

## Když se něco pokazí

**Build selže.** Otevři log buildu.
- Nejčastější příčina: `package.json` není v kořeni repozitáře (viz krok 1.6).
- Druhá nejčastější: chybí `package-lock.json`, bez něj `npm ci` nefunguje.

**V logu je „Úložiště je nedostupné“.**
- Ověř, že `DATABASE_URL` je **interní** URL a že databáze i služba jsou ve **stejném regionu**.
- Ověř, že databáze je ve stavu Available.

**Prohlížeč ukazuje načítací stránku Renderu.** Služba spala. Počkej asi minutu.

**Pod QR kódem je jiná adresa, než kterou chceš** (třeba vlastní doména). Nastav proměnnou `PUBLIC_URL` na požadovanou adresu, např. `https://hra.firma.cz`.

**Telefony ukazují „Obnovuji spojení…“.**
- Server se restartoval. Spojení se obnoví samo a hlasy zůstanou.
- Při tvrdém pádu může zmizet jen akce z posledních 0,4 sekundy.

**Databáze vypršela.** Vytvoř novou (krok 3) a v nastavení služby vlož do `DATABASE_URL` její novou interní URL.

## Zkratka: Blueprint

V repozitáři je soubor `render.yaml`, který vytvoří databázi i web službu najednou:

1. V Render Dashboardu klikni na **New**, vyber **Blueprint** a zvol repozitář.
2. Render se zeptá na hodnotu `ADMIN_KEY`.

Podle starších hlášení uživatelů Render u Blueprintů někdy chtěl platební kartu i pro free služby; ruční postup výše ji podle dokumentace nevyžaduje. Pokud Blueprint kartu chce, použij ruční postup.
