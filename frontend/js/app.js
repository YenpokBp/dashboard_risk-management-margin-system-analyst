// Frontend hanya mengirim input ke backend dan menampilkan hasilnya.
const $ = s => document.querySelector(s);
let side = 'buy', instruments = {}, timer, reqId = 0;

const F = { eq: 'Modal', lot: 'Lot', entry: 'Price entry', cur: 'Current price', pv: 'Nilai per poin per lot', jm: 'Jaminan per lot' };
// "49.545,05" atau "49545.05" -> "49545.05". Hasil '' bila kosong, 'x' bila tidak valid.
const norm = v => {
  v = String(v).trim().replace(/\s/g, '');
  if (!v) return '';
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(v) ? v : 'x';
};
const nf = s => Number(s).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = s => (Number(s) < 0 ? '-' : '') + '$' + nf(Math.abs(Number(s)));
const row = (k, v) => `<div class="row"><span>${k}</span><span>${v}</span></div>`;
const key = (k, v) => `<div class="key"><span>${k}</span><span>${v}</span></div>`;
const msg = t => { $('#res').innerHTML = `<div class="p-6 text-center text-mu">${t}</div>`; };

function show(d) {
  const r = d.result, lb = d.instrument.label, price = p => (p === null ? 'Tidak tercapai' : nf(p));
  $('#res').innerHTML =
    row('New Balance', usd(r.newBalance)) +
    row('Floating P/L', `<span style="color:var(--${Number(r.floatingPL) < 0 ? 'ot' : 'g'})">${usd(r.floatingPL)}</span>`) +
    row('Equity', usd(r.equity)) +
    row('Margin Required', usd(r.marginRequired)) +
    row('Effective Margin', usd(r.effectiveMargin)) +
    key(`Call Margin Price (${lb})`, price(r.callMarginPrice)) +
    key(`Auto Liquidation Price (${lb})`, price(r.autoLiquidationPrice)) +
    key('Equity Ratio', nf(r.equityRatio) + '%');
}

async function calculate() {
  const v = {};
  for (const f in F) v[f] = norm($('#' + f).value);
  const miss = Object.keys(F).filter(f => v[f] === '' || v[f] === 'x');
  if (miss.length) return msg(`Lengkapi dulu: ${miss.map(f => F[f]).join(', ')}.`);
  const id = ++reqId;
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument: $('#inst').value, side, balance: v.eq, lot: v.lot, entryPrice: v.entry, currentPrice: v.cur, pointValue: v.pv, marginPerLot: v.jm })
    });
    const data = await res.json();
    if (id !== reqId) return; // abaikan respons lama
    if (!res.ok) return msg((data.details || [data.error]).join('<br>'));
    show(data);
  } catch {
    msg('Tidak dapat terhubung ke backend.<br>Jalankan <b>npm start</b> di folder backend, lalu buka http://localhost:3000');
  }
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(calculate, 250); };

function fillContract() {
  const c = instruments[$('#inst').value] || {};
  $('#pv').value = c.pointValue ?? '';
  $('#jm').value = c.marginPerLot ?? '';
}

document.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
  side = b.dataset.side;
  document.querySelectorAll('.seg button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  calculate();
});
$('#inst').onchange = () => { fillContract(); calculate(); };
document.querySelectorAll('input').forEach(i => i.addEventListener('input', schedule));
$('#theme').onclick = () => { const r = document.documentElement, d = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); r.dataset.theme = d === 'dark' ? 'light' : 'dark'; };

(async () => {
  try { instruments = (await (await fetch('/api/instruments')).json()).instruments; fillContract(); } catch {}
  calculate();
})();
