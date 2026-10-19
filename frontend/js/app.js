// Frontend hanya mengirim input ke backend dan menampilkan hasilnya.
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
let side = 'buy', inst = 'gold', instruments = {}, timer, reqId = 0;

const F = { eq: 'Modal', lot: 'Lot', entry: 'Price entry', cur: 'Current price', pv: 'Nilai per poin per lot', jm: 'Jaminan per lot' };
const norm = v => { v = String(v).trim().replace(/\s/g, ''); if (!v) return ''; if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(v) ? v : 'x'; };
const nf = (s, d = 2) => Number(s).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = s => (Number(s) < 0 ? '-' : '') + '$' + nf(Math.abs(Number(s)));
const short = n => Math.abs(n) >= 1000 ? nf(n / 1000, 1) + ' rb' : nf(n, 0);
const ic = d => `<span class="ico"><svg viewBox="0 0 24 24"><path d="${d}"/></svg></span>`;
const ICON = {
  wallet: 'M3 7h15a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3V7zm0 0l12-3v3M17 14h.01',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  coins: 'M12 3c5 0 8 1.3 8 3s-3 3-8 3-8-1.3-8-3 3-3 8-3zM4 6v6c0 1.7 3 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3 3 8 3s8-1.3 8-3v-6',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  bell: 'M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 004 0',
  warn: 'M12 3l10 18H2L12 3zM12 10v4M12 17h.01',
  gauge: 'M12 21a9 9 0 119-9M12 12l5-4'
};

// Hiasan candlestick di header
(() => {
  let h = '';
  for (let i = 0; i < 22; i++) {
    const c = 34 - i * 0.6 + Math.sin(i * 1.3) * 9, o = c + Math.cos(i * 2.1) * 7, x = 8 + i * 12.5, up = o > c;
    h += `<line x1="${x}" x2="${x}" y1="${Math.min(o, c) - 6}" y2="${Math.max(o, c) + 6}" stroke="#fff" stroke-width="1.2"/><rect x="${x - 3.5}" y="${Math.min(o, c)}" width="7" height="${Math.abs(o - c) + 2}" rx="1" fill="${up ? '#FF980E' : '#7fd9ab'}"/>`;
  }
  $('#candles').innerHTML = h;
})();

function gauge(er) {
  const MAX = 500, cx = 110, cy = 100, r = 84, pt = (f, R = r) => { const a = Math.PI * (1 - f); return [cx + R * Math.cos(a), cy - R * Math.sin(a)]; };
  const arc = (f1, f2, col, op = 1) => { const [a, b] = pt(f1), [c, d] = pt(f2); return `<path d="M${a} ${b}A${r} ${r} 0 0 1 ${c} ${d}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="14"/>`; };
  const f = Math.max(0, Math.min(er / MAX, 1)), [nx, ny] = pt(f, r - 16), [t1x, t1y] = pt(.06, r + 12), [t2x, t2y] = pt(.14, r + 14);
  return `<svg viewBox="0 0 220 118" class="w-full" style="max-width:260px;margin:0 auto;display:block" role="img" aria-label="Pengukur Equity Ratio ${nf(er)} persen">
    ${arc(0, .06, 'var(--o)')}${arc(.06, .14, 'var(--o)', .55)}${arc(.14, 1, 'var(--gt)', .85)}
    <text x="${t1x - 4}" y="${t1y}" font-size="9" text-anchor="middle" fill="var(--muted)">30</text><text x="${t2x + 2}" y="${t2y - 2}" font-size="9" text-anchor="middle" fill="var(--muted)">70</text>
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="var(--text)"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="var(--s1)"/></svg>`;
}

function hero(d, v) {
  const r = d.result, lb = d.instrument.label, cur = Number(v.cur), pc = r.callMarginPrice, pl = r.autoLiquidationPrice;
  const dc = pc === null ? null : Math.abs(Number(pc) - cur), dl = pl === null ? null : Math.abs(Number(pl) - cur), mx = Math.max(dc || 0, dl || 0) || 1;
  const pcard = (title, ico, price, dist, eqv, pctv) => `<div class="card2 hl"><div class="t">${ic(ICON[ico]).replace('class="ico"', 'class="ico o"')}${title} (${lb})</div>
    <div class="big" style="color:var(--ot)">${price === null ? 'Tidak tercapai' : nf(price)}</div>
    <div class="bar mt-4"><i style="width:${dist === null ? 0 : Math.max(4, dist / mx * 100)}%"></i></div>
    <div class="flex justify-between text-sm mt-2"><span class="muted">Jarak dari current</span><b>${dist === null ? '-' : nf(dist) + ' poin'}</b></div>
    <div class="flex justify-between text-sm mt-1"><span class="muted">Equity di harga ini (${pctv}% MR)</span><b>${usd(eqv)}</b></div></div>`;
  return `<div class="card2"><div class="t">${ic(ICON.gauge)}Equity Ratio</div>${gauge(Number(r.equityRatio))}
      <div class="big text-center mt-1" style="color:var(--gt)">${nf(r.equityRatio)}%</div>
      <div class="lg justify-center"><span><i style="background:var(--o)"></i>30% Auto Liquidation</span><span><i style="background:var(--o);opacity:.55"></i>70% Call Margin</span></div></div>
    ${pcard('Call Margin Price', 'bell', pc, dc, d.chart.callMarginEquity, d.rules.callMarginPct)}
    ${pcard('Auto Liquidation Price', 'warn', pl, dl, d.chart.autoLiquidationEquity, d.rules.autoLiquidationPct)}`;
}

function tiles(r) {
  const neg = Number(r.floatingPL) < 0;
  const T = [['New Balance', r.newBalance, 'wallet', 'var(--g)', 'col-span-2 sm:col-span-2'], ['Floating P/L', r.floatingPL, 'trend', neg ? 'var(--o)' : 'var(--g)', 'sm:col-span-2'], ['Equity', r.equity, 'layers', 'var(--g)', 'sm:col-span-2'],
    ['Margin Required', r.marginRequired, 'coins', 'var(--o)', 'sm:col-span-3'], ['Effective Margin', r.effectiveMargin, 'shield', 'var(--g)', 'sm:col-span-3']];
  return T.map(([k, v, i, c, cls]) => `<div class="kpi ${cls}" style="--c:${c}"><div class="k"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[i]}"/></svg>${k}</div>
    <div class="v" style="${k === 'Floating P/L' ? 'color:var(--' + (neg ? 'ot' : 'gt') + ')' : ''}">${usd(v)}</div></div>`).join('');
}

function chart(c, d, v) {
  const W = 640, H = 270, L = 58, R = 16, T = 16, B = 30, P = c.points.map(p => [+p.price, +p.equity]);
  const call = +c.callMarginEquity, liq = +c.autoLiquidationEquity, ent = +v.entry, cur = +v.cur;
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]).concat([call, liq, 0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = a => L + (a - x0) / (x1 - x0 || 1) * (W - L - R), Y = a => T + (1 - (a - y0) / (y1 - y0 || 1)) * (H - T - B);
  const ln = P.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  let g = '';
  for (let i = 0; i < 4; i++) { const a = y0 + (y1 - y0) * i / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(a)}" y2="${Y(a)}" stroke="var(--line)"/><text x="${L - 8}" y="${Y(a) + 3}" font-size="10" text-anchor="end" fill="var(--muted)">$${short(a)}</text>`;
    const px = x0 + (x1 - x0) * i / 3; g += `<text x="${X(px)}" y="${H - 8}" font-size="10" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}" fill="var(--muted)">${nf(px, 0)}</text>`; }
  const hl = (a, col, op, t) => `<line x1="${L}" x2="${W - R}" y1="${Y(a)}" y2="${Y(a)}" stroke="${col}" stroke-opacity="${op}" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${W - R - 4}" y="${Y(a) - 5}" font-size="10" text-anchor="end" fill="var(--ot)">${t}</text>`;
  const vl = (a, e, t, col, dy) => `<line x1="${X(a)}" x2="${X(a)}" y1="${T}" y2="${H - B}" stroke="${col}" stroke-dasharray="3 3"/><circle cx="${X(a)}" cy="${Y(e)}" r="5" fill="${col}" stroke="var(--s1)" stroke-width="2"/><text x="${X(a) + (a > (x0 + x1) / 2 ? -6 : 6)}" y="${T + dy}" font-size="10.5" font-weight="600" text-anchor="${a > (x0 + x1) / 2 ? 'end' : 'start'}" fill="${col}">${t}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full" role="img" aria-label="Grafik Equity terhadap harga"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gt)" stop-opacity=".35"/><stop offset="1" stop-color="var(--gt)" stop-opacity="0"/></linearGradient></defs>
    ${g}<path d="${ln}L${X(x1)} ${Y(y0)}L${X(x0)} ${Y(y0)}Z" fill="url(#ar)"/><path d="${ln}" fill="none" stroke="var(--gt)" stroke-width="2.5" stroke-linejoin="round"/>
    ${hl(call, 'var(--o)', .75, 'Call Margin')}${hl(liq, 'var(--o)', 1, 'Auto Liquidation')}
    ${vl(ent, +d.result.newBalance, 'Entry', 'var(--muted)', 12)}${vl(cur, +d.result.equity, 'Current', 'var(--o)', 26)}</svg>`;
}

function ladder(d, v) {
  const r = d.result, cur = Number(v.cur);
  const rows = [['Entry', v.entry, 'var(--muted)'], ['Current price', v.cur, 'var(--o)', 1], ['Call Margin Price', r.callMarginPrice, 'var(--o)'], ['Auto Liquidation Price', r.autoLiquidationPrice, 'var(--ot)']].filter(x => x[1] !== null).sort((a, b) => b[1] - a[1]);
  const mx = Math.max(...rows.map(x => Math.abs(x[1] - cur))) || 1;
  return rows.map(([k, p, col, now]) => { const dl = p - cur;
    return `<div class="lrow ${now ? 'now' : ''}"><span class="dot" style="background:${col}"></span><span class="font-medium">${k}</span><span class="text-right"><b>${nf(p)}</b> <span class="muted text-sm">${now ? 'posisi sekarang' : (dl > 0 ? '+' : '-') + nf(Math.abs(dl)) + ' poin'}</span></span>${now ? '' : `<div class="bar"><i style="width:${Math.max(3, Math.abs(dl) / mx * 100)}%;background:${col}"></i></div>`}</div>`; }).join('');
}

function show(d, v) {
  $('#alert').classList.add('hidden'); $('#out').classList.remove('dim');
  $('#hero').innerHTML = hero(d, v); $('#tiles').innerHTML = tiles(d.result);
  $('#chart').innerHTML = chart(d.chart, d, v); $('#ladder').innerHTML = ladder(d, v);
}
function fail(t) { const a = $('#alert'); a.innerHTML = t; a.classList.remove('hidden'); $('#out').classList.add('dim'); }

async function calculate() {
  const v = {};
  for (const f in F) v[f] = norm($('#' + f).value);
  const miss = Object.keys(F).filter(f => v[f] === '' || v[f] === 'x');
  if (miss.length) return fail(`Lengkapi dulu: ${miss.map(f => F[f]).join(', ')}.`);
  const id = ++reqId;
  try {
    const res = await fetch('/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument: inst, side, balance: v.eq, lot: v.lot, entryPrice: v.entry, currentPrice: v.cur, pointValue: v.pv, marginPerLot: v.jm }) });
    const data = await res.json();
    if (id !== reqId) return;
    if (!res.ok) return fail((data.details || [data.error]).join('<br>'));
    show(data, v);
  } catch { fail('Tidak dapat terhubung ke backend. Jalankan <b>npm start</b> di folder backend, lalu buka http://localhost:3000'); }
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(calculate, 250); };
function fillContract() { const c = instruments[inst] || {}; $('#pv').value = c.pointValue ?? ''; $('#jm').value = c.marginPerLot ?? ''; }

$$('.seg button').forEach(b => b.onclick = () => { side = b.dataset.side; $$('.seg button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); calculate(); });
$$('.chip').forEach(b => b.onclick = () => { inst = b.dataset.inst; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#hdrInst').textContent = b.textContent; fillContract(); calculate(); });
$$('input').forEach(i => i.addEventListener('input', schedule));
$('#theme').onclick = () => { const r = document.documentElement, d = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); r.dataset.theme = d === 'dark' ? 'light' : 'dark'; };
(async () => { try { instruments = (await (await fetch('/api/instruments')).json()).instruments; fillContract(); } catch {} calculate(); })();
