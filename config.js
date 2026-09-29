// Herní konfigurace. Po změně restartuj server.
// Pozor: měnit TOKENS / MAX_TRENDS / trendy během běžící hry nelze – udělej reset v administraci.

module.exports = {
  // Texty na obrazovce
  title: 'FINTECH VIZIONÁŘ',
  subtitle: 'Vyber, co bude mít největší dopad na český fintech v příštích deseti letech.',

  // Kolik tokenů dostane každý hráč. Musí je utratit všechny.
  // 20 tokenů = rozlišení 5 %. Simulace ukázala, že jemnější krok (100 tokenů po 5)
  // nesnižuje počet remíz, jen zdržuje hráče na telefonu.
  TOKENS: 20,

  // Maximální počet trendů, na které smí hráč tokeny rozdělit.
  // Bez limitu vyhrává "rozprostři všechno rovnoměrně" (porazí ~79 % poctivých hráčů).
  // S limitem 5 je rovnoměrné rozprostření podprůměrné; s limitem 3 je příliš mnoho remíz.
  MAX_TRENDS: 5,

  // Výchozí délka hlasování v minutách, předvyplní se v administraci (0 = bez časovače).
  VOTING_MINUTES: 60,

  // Co ukazuje velká obrazovka během hlasování:
  //   'qr'    = stejný pohled jako lobby (velký QR kód a návod), aby se mohli přidávat opozdilci
  //   'stats' = tečky za odevzdané tipy a jména hlasujících
  // Rozložení tokenů zůstává skryté v obou případech, dokud se nezapne živý graf v administraci.
  VOTING_VIEW: 'qr',

  // Maximální délka přezdívky
  NICK_MAX: 18,

  // Trendy. id se nesmí měnit během hry. color = barva sloupce na LED.
  trends: [
    { id: 'ai-agenti',        name: 'AI & AI Agenti',                    color: '#5B8CFF' },
    { id: 'tokenizace-defi',  name: 'Tokenizace & DeFi',                 color: '#2FD4A7' },
    { id: 'stablecoiny-euro', name: 'Stablecoiny & Digitální Euro',      color: '#4FC3F7' },
    { id: 'open-finance',     name: 'Open Finance & PSD3',               color: '#B98CFF' },
    { id: 'startupovy-zakon', name: 'Startupový zákon v ČR',             color: '#FFE36E' },
    { id: 'embedded-finance', name: 'Embedded Finance',                  color: '#FF7A9A' },
    { id: 'jednotny-eu-trh',  name: 'Jednotný EU trh (kapitálový, EU Inc.)', color: '#9BE15D' },
    { id: 'eu-wallet',        name: 'EU Wallet',                         color: '#FFB547' },
    { id: 'quantum',          name: 'Quantum computing',                 color: '#E4E7FF' },
    { id: 'cybersecurity',    name: 'Cybersecurity (FraudTech, RegTech)', color: '#FF8A4C' },
  ],
};
;
;
