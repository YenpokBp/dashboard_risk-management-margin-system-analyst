const rules = require('../config/businessRules');
const NUM = /^\d+(\.\d+)?$/;
const blank = (v) => v === undefined || v === null || v === '';
const pick = (v, d) => (blank(v) ? d : v);

// Validasi input dan isi parameter kontrak dari konfigurasi bila tidak dikirim.
module.exports = function validateCalculate(req, res, next) {
  const b = req.body || {};
  const inst = rules.instruments[b.instrument];
  const errors = [];
  if (!inst) errors.push('instrument tidak dikenal');
  if (!['buy', 'sell'].includes(b.side)) errors.push('side harus buy atau sell');

  const input = {
    instrument: b.instrument,
    side: b.side,
    balance: String(pick(b.balance, '')),
    lot: String(pick(b.lot, '')),
    entryPrice: String(pick(b.entryPrice, '')),
    currentPrice: String(pick(b.currentPrice, '')),
    pointValue: String(pick(b.pointValue, inst ? inst.pointValue : null) ?? ''),
    marginPerLot: String(pick(b.marginPerLot, inst ? inst.marginPerLot : null) ?? '')
  };
  const mustPositive = ['lot', 'entryPrice', 'currentPrice', 'pointValue', 'marginPerLot'];
  for (const k of ['balance', ...mustPositive]) {
    if (!NUM.test(input[k])) errors.push(`${k} harus berupa angka (contoh 4137.45)`);
    else if (mustPositive.includes(k) && Number(input[k]) <= 0) errors.push(`${k} harus lebih dari 0`);
  }
  if (errors.length) return res.status(400).json({ error: 'Input tidak valid', details: errors });
  req.input = input;
  next();
};
