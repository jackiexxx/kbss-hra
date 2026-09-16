// Vyhodnocení hry.
//
// Referenční rozložení pro hráče = rozložení VŠECH OSTATNÍCH hráčů (leave-one-out),
// aby hráč nesoutěžil sám se sebou. U 200 hráčů je vliv malý (~0,5 %), ale u menších
// skupin a při testech je to rozdíl.
//
// 1) Shoda (hlavní skóre, 0–100 %): Σ min(hráč_i %, dav_i %)
//    = kolik procent hráčova rozložení "překrývá" rozložení sálu. Totožné s 100 − ½·L1.
// 2) Při rovnosti shody rozhoduje menší kvadratická odchylka (L2) – trestá velké
//    jednotlivé chyby víc než rozprostřené malé.
// 3) Při rovnosti i L2 rozhoduje dřívější odeslání.

function evaluate(players, trends, TOKENS) {
  const ids = trends.map(t => t.id);
  const voters = players.filter(p => p.submittedAt && p.allocation);
  const totals = Object.fromEntries(ids.map(id => [id, 0]));
  for (const p of voters) for (const id of ids) totals[id] += p.allocation[id] || 0;
  const grand = voters.length * TOKENS;

  const crowdPct = Object.fromEntries(ids.map(id => [id, grand ? (totals[id] / grand) * 100 : 0]));

  const rows = voters.map(p => {
    let overlap = 0, l2 = 0;
    const othersGrand = grand - TOKENS;
    for (const id of ids) {
      const mine = ((p.allocation[id] || 0) / TOKENS) * 100;
      const ref = othersGrand > 0
        ? ((totals[id] - (p.allocation[id] || 0)) / othersGrand) * 100
        : crowdPct[id];
      overlap += Math.min(mine, ref);
      l2 += (mine - ref) ** 2;
    }
    return {
      deviceId: p.deviceId,
      nick: p.nick,
      bot: !!p.bot,
      score: Math.round(overlap * 100) / 100,
      l2: Math.round(l2 * 1000) / 1000,
      submittedAt: p.submittedAt,
    };
  });

  rows.sort((a, b) => (b.score - a.score) || (a.l2 - b.l2) || (a.submittedAt - b.submittedAt));
  rows.forEach((r, i) => { r.rank = i + 1; });

  return { totals, crowdPct, voters: voters.length, grand, ranking: rows };
}

function validateAllocation(raw, trends, TOKENS, MAX_TRENDS) {
  if (!raw || typeof raw !== 'object') return { error: 'Chybí rozdělení tokenů.' };
  const clean = {};
  let sum = 0, used = 0;
  for (const t of trends) {
    const v = raw[t.id] ?? 0;
    if (!Number.isInteger(v) || v < 0 || v > TOKENS) return { error: 'Neplatný počet tokenů.' };
    if (v > 0) { clean[t.id] = v; sum += v; used++; }
  }
  for (const k of Object.keys(raw)) {
    if (!trends.some(t => t.id === k)) return { error: 'Neznámý trend.' };
  }
  if (sum !== TOKENS) return { error: `Rozděl přesně ${TOKENS} tokenů (máš ${sum}).` };
  if (used > MAX_TRENDS) return { error: `Tokeny smíš dát nejvýše ${MAX_TRENDS} trendům.` };
  return { allocation: clean };
}

module.exports = { evaluate, validateAllocation };
