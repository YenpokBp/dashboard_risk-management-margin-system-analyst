// Frontend hanya mengirim input ke backend dan menampilkan hasilnya.
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
let mode = 'daytrade', side = 'buy', inst = 'gold', instruments = {}, timer, reqId = 0, first = true;

const F = { eq: 'Modal', lot: 'Lot', entry: 'Price entry', cur: 'Current price' };
const norm = v => { v = String(v).trim().replace(/\s/g, ''); if (!v) return ''; if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(v) ? v : 'x'; };
const nf = (s, d = 2) => Number(s).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
let PD = 2;
const pf = s => nf(s, PD);
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
    <g class="needle${first ? ' sweep' : ''}" style="--a:${f * 180}deg"><line x1="${cx}" y1="${cy}" x2="${cx - (r - 16)}" y2="${cy}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/></g><circle cx="${cx}" cy="${cy}" r="6" fill="var(--text)"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="var(--s1)"/></svg>`;
}

function hero(d, v) {
  const r = d.result, lb = d.instrument.label, cur = Number(v.cur), pc = r.callMarginPrice, pl = r.autoLiquidationPrice;
  const dc = pc === null ? null : Math.abs(Number(pc) - cur), dl = pl === null ? null : Math.abs(Number(pl) - cur), mx = Math.max(dc || 0, dl || 0) || 1;
  const pcard = (title, ico, price, dist, eqv, pctv) => `<div class="card2 hl"><div class="t">${ic(ICON[ico]).replace('class="ico"', 'class="ico o"')}${title} (${lb})</div>
    <div class="big" style="color:var(--ot)">${price === null ? 'Tidak tercapai' : pf(price)}</div>
    <div class="bar mt-4"><i style="width:${dist === null ? 0 : Math.max(4, dist / mx * 100)}%"></i></div>
    <div class="flex justify-between text-sm mt-2"><span class="muted">Jarak dari current</span><b>${dist === null ? '-' : pf(dist) + ' poin'}</b></div>
    <div class="flex justify-between text-sm mt-1"><span class="muted">Equity di harga ini (${pctv}% MR)</span><b>${usd(eqv)}</b></div></div>`;
  return `<div class="card2"><div class="t">${ic(ICON.gauge)}Equity Ratio</div>${gauge(Number(r.equityRatio))}
      <div class="big text-center mt-1" style="color:var(--gt)">${nf(r.equityRatio)}%</div>
      <div class="lg justify-center"><span><i style="background:var(--o)"></i>30% Auto Liquidation</span><span><i style="background:var(--o);opacity:.55"></i>70% Call Margin</span></div></div>
    ${pcard('Call Margin Price', 'bell', pc, dc, r.callMarginEquity, d.rules.callMarginPct)}
    ${pcard('Auto Liquidation Price', 'warn', pl, dl, r.autoLiquidationEquity, d.rules.autoLiquidationPct)}`;
}

function tiles(r) {
  const neg = Number(r.floatingPL) < 0;
  const T = [['New Balance', r.newBalance, 'wallet', 'var(--g)', 'col-span-2 sm:col-span-2'], ['Floating P/L', r.floatingPL, 'trend', neg ? 'var(--o)' : 'var(--g)', 'sm:col-span-2'], ['Equity', r.equity, 'layers', 'var(--g)', 'sm:col-span-2'],
    ['Margin Required', r.marginRequired, 'coins', 'var(--o)', 'sm:col-span-3'], ['Effective Margin', r.effectiveMargin, 'shield', 'var(--g)', 'sm:col-span-3']];
  return T.map(([k, v, i, c, cls]) => `<div class="kpi ${cls}" style="--c:${c}"><div class="k"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[i]}"/></svg>${k}</div>
    <div class="v" style="${k === 'Floating P/L' ? 'color:var(--' + (neg ? 'ot' : 'gt') + ')' : ''}">${usd(v)}</div></div>`).join('');
}

function ladder(d, v) {
  const r = d.result, cur = Number(v.cur);
  const rows = [['Entry', v.entry, 'var(--muted)'], ['Current price', v.cur, 'var(--o)', 1], ['Call Margin Price', r.callMarginPrice, 'var(--o)'], ['Auto Liquidation Price', r.autoLiquidationPrice, 'var(--ot)']].filter(x => x[1] !== null).sort((a, b) => b[1] - a[1]);
  const mx = Math.max(...rows.map(x => Math.abs(x[1] - cur))) || 1;
  return rows.map(([k, p, col, now]) => { const dl = p - cur;
    return `<div class="lrow ${now ? 'now' : ''}"><span class="dot" style="background:${col}"></span><span class="font-medium">${k}</span><span class="text-right"><b>${pf(p)}</b> <span class="muted text-sm">${now ? 'posisi sekarang' : (dl > 0 ? '+' : '-') + pf(Math.abs(dl)) + ' poin'}</span></span>${now ? '' : `<div class="bar"><i style="width:${Math.max(3, Math.abs(dl) / mx * 100)}%;background:${col}"></i></div>`}</div>`; }).join('');
}

const int = n => Number(n).toLocaleString('id-ID');
function pos(d, v) {
  const r = d.result, buy = d.side === 'buy', mv = (buy ? 1 : -1) * (Number(v.cur) - Number(v.entry)), gain = mv >= 0, ins = instruments[d.instrument.key] || {};
  const st = (k, val, col) => `<div class="stat"><span>${k}</span><b ${col ? `style="color:var(--${col})"` : ''}>${val}</b></div>`;
  return `<div class="pos"><div class="flex items-center gap-3 min-w-0"><span class="badge ${buy ? 'buy' : 'sell'}">${buy ? 'Buy' : 'Sell'}</span><div class="min-w-0"><div class="font-semibold truncate disp">${d.instrument.label}</div><div class="text-xs muted">Posisi terbuka</div></div></div>
    <div class="stats">${st('Lot', int(v.lot))}${st('Price entry', pf(v.entry))}${st('Current price', pf(v.cur))}${st('Selisih poin', (mv > 0 ? '+' : mv < 0 ? '-' : '') + pf(Math.abs(mv)) + ' poin', gain ? 'gt' : 'ot')}</div>
    ${ins.pointValue ? `<div class="tags"><span class="tag"><i></i>$${int(ins.pointValue)} per poin per lot</span><span class="tag"><i></i>Jaminan ${d.mode === 'overnight' ? 'overnight' : 'daytrade'} $${int(d.mode === 'overnight' ? ins.marginOvernight : ins.marginDaytrade)} per lot</span><span class="tag"><i></i>Call Margin ${d.rules.callMarginPct}%</span><span class="tag"><i></i>Auto Liquidation ${d.rules.autoLiquidationPct}%</span></div>` : ''}</div>`;
}

function comp(d) {
  const r = d.result, eq = Number(r.equity), mr = Number(r.marginRequired), nb = Number(r.newBalance), fl = Number(r.floatingPL);
  const C = 2 * Math.PI * 46, share = eq > 0 ? Math.min(mr / eq, 1) : 1, chg = nb > 0 ? fl / nb * 100 : 0;
  return `<svg viewBox="0 0 120 120" style="max-width:190px;margin:0 auto;display:block" role="img" aria-label="Margin Required ${nf(share * 100, 1)} persen dari Equity">
    <circle cx="60" cy="60" r="46" fill="none" stroke="var(--gt)" stroke-opacity=".85" stroke-width="14"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="var(--o)" stroke-width="14" stroke-dasharray="${share * C} ${C}" transform="rotate(-90 60 60)"/>
    <text x="60" y="61" text-anchor="middle" font-size="17" font-weight="700" fill="var(--text)" style="font-family:Sora,sans-serif">${nf(eq > 0 ? mr / eq * 100 : 100, 1)}%</text>
    <text x="60" y="76" text-anchor="middle" font-size="8.5" fill="var(--muted)">MR dari Equity</text></svg>
    <div class="legend"><div><i style="background:var(--o)"></i>Margin Required<b>${usd(r.marginRequired)}</b></div><div><i style="background:var(--gt)"></i>Effective Margin<b>${usd(r.effectiveMargin)}</b></div>
    <div><i style="background:var(--muted)"></i>Perubahan dana<b style="color:var(--${chg < 0 ? 'ot' : 'gt'})">${chg > 0 ? '+' : ''}${nf(chg)}%</b></div></div>`;
}

function show(d, v) {
  PD = d.instrument.priceDecimals ?? 2;
  $('#alert').classList.add('hidden'); $('#out').classList.remove('dim');
  $('#pos').innerHTML = pos(d, v); $('#hero').innerHTML = hero(d, v); $('#tiles').innerHTML = tiles(d.result);
  $('#comp').innerHTML = comp(d); $('#ladder').innerHTML = ladder(d, v); first = false;
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
      body: JSON.stringify({ instrument: inst, side, mode, balance: v.eq, lot: v.lot, entryPrice: v.entry, currentPrice: v.cur }) });
    const data = await res.json();
    if (id !== reqId) return;
    if (!res.ok) return fail((data.details || [data.error]).join('<br>'));
    show(data, v);
  } catch { fail('Tidak dapat terhubung ke backend. Jalankan <b>npm start</b> di folder backend, lalu buka http://localhost:3000'); }
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(calculate, 250); };

$$('.seg').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
  if (b.dataset.side) side = b.dataset.side; else mode = b.dataset.mode;
  g.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
  calculate();
}));
$$('.chip').forEach(b => b.onclick = () => { inst = b.dataset.inst; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#hdrInst').textContent = b.textContent; calculate(); });
$$('input').forEach(i => i.addEventListener('input', schedule));
$('#theme').onclick = () => { const r = document.documentElement, d = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); r.dataset.theme = d === 'dark' ? 'light' : 'dark'; };
(async () => { try { instruments = (await (await fetch('/api/instruments')).json()).instruments; } catch {} calculate(); })();
