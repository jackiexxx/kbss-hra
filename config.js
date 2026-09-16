// Herní konfigurace. Po změně restartuj server.
// Pozor: měnit TOKENS / MAX_TRENDS / trendy během běžící hry nelze – udělej reset v administraci.

module.exports = {
  // Texty na obrazovce
  title: 'Kam poteče budoucnost financí?',
  subtitle: 'Rozděl své tokeny mezi trendy, které podle tebe ovládnou příští roky.',

  // Kolik tokenů dostane každý hráč. Musí je utratit všechny.
  // 20 tokenů = rozlišení 5 %. Simulace ukázala, že jemnější krok (100 tokenů po 5)
  // nesnižuje počet remíz, jen zdržuje hráče na telefonu.
  TOKENS: 20,

  // Maximální počet trendů, na které smí hráč tokeny rozdělit.
  // Bez limitu vyhrává "rozprostři všechno rovnoměrně" (porazí ~79 % poctivých hráčů).
  // S limitem 5 je rovnoměrné rozprostření podprůměrné; s limitem 3 je příliš mnoho remíz.
  MAX_TRENDS: 5,

  // Maximální délka přezdívky
  NICK_MAX: 18,

  // Trendy. id se nesmí měnit během hry. color = barva sloupce na LED.
  trends: [
    { id: 'ai-agents',  name: 'AI Agents',                        color: '#5B8CFF' },
    { id: 'stablecoins', name: 'Stablecoins',                     color: '#2FD4A7' },
    { id: 'tokenization', name: 'Tokenizace',                     color: '#FFB547' },
    { id: 'digital-euro', name: 'Digital Euro',                   color: '#4FC3F7' },
    { id: 'open-finance', name: 'Open Finance',                   color: '#B98CFF' },
    { id: 'embedded-finance', name: 'Embedded Finance',           color: '#FF7A9A' },
    { id: 'defi',       name: 'DeFi',                             color: '#9BE15D' },
    { id: 'biometrics', name: 'Biometrics',                       color: '#FF8A4C' },
    { id: 'quantum',    name: 'Quantum',                          color: '#E4E7FF' },
    { id: 'unknown',    name: 'Something we haven’t invented yet', color: '#FFE36E' },
  ],
};
