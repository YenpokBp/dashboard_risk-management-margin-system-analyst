const test = require('node:test');
const assert = require('node:assert');
const FundCondition = require('../src/models/FundCondition');
const rules = require('../src/config/businessRules');

const base = { pointValue: '100', marginPerLot: '1000', lot: '1' };

test('Buy: cocok dengan temporary statement (XUL10)', () => {
  const r = new FundCondition({ ...base, side: 'buy', balance: '49545.05', entryPrice: '4137.45', currentPrice: '4134.91' }).calculate(rules);
  assert.deepStrictEqual(r, {
    newBalance: '49545.05', floatingPL: '-254.00', equity: '49291.05', marginRequired: '1000.00',
    effectiveMargin: '48291.05', callMarginPrice: '3648.99', autoLiquidationPrice: '3644.99',
    callMarginEquity: '700.00', autoLiquidationEquity: '300.00', equityRatio: '4929.11'
  });
});

test('Sell: floating dibalik dan harga batas berada di atas entry', () => {
  const r = new FundCondition({ ...base, side: 'sell', balance: '10000', entryPrice: '4000', currentPrice: '4010' }).calculate(rules);
  assert.strictEqual(r.floatingPL, '-1000.00');
  assert.strictEqual(r.equity, '9000.00');
  assert.strictEqual(r.equityRatio, '900.00');
  assert.strictEqual(r.callMarginPrice, '4093.00');
});

test('Buy: harga batas <= 0 dianggap tidak tercapai', () => {
  const r = new FundCondition({ ...base, side: 'buy', balance: '9999999', entryPrice: '4000', currentPrice: '4000' }).calculate(rules);
  assert.strictEqual(r.callMarginPrice, null);
});

test('Hang Seng: cocok dengan temporary statement (HKK50_BBJ)', () => {
  const c = rules.instruments.hangseng;
  assert.strictEqual(c.marginOvernight, '2000'); // posisi menginap
  const r = new FundCondition({ side: 'buy', balance: '51003.53', lot: '1', entryPrice: '24146', currentPrice: '24104', pointValue: c.pointValue, marginPerLot: c.marginOvernight, priceDecimals: c.priceDecimals }).calculate(rules);
  assert.strictEqual(r.floatingPL, '-210.00');
  assert.strictEqual(r.equity, '50793.53');
  assert.strictEqual(r.marginRequired, '2000.00');
  assert.strictEqual(r.effectiveMargin, '48793.53');
  assert.strictEqual(r.callMarginPrice, '14225');
  assert.strictEqual(r.autoLiquidationPrice, '14065');
  assert.strictEqual(r.equityRatio, '2539.68');
});

test('Nikkei: $5 per poin dan jaminan $1.000 dari konfigurasi', () => {
  const c = rules.instruments.nikkei;
  assert.strictEqual(c.pointValue, '5');
  assert.strictEqual(c.marginDaytrade, '1000');
  const r = new FundCondition({ side: 'buy', balance: '10000', lot: '2', entryPrice: '20000', currentPrice: '19900', pointValue: c.pointValue, marginPerLot: c.marginDaytrade }).calculate(rules);
  assert.strictEqual(r.floatingPL, '-1000.00'); // -100 poin x 2 lot x $5
  assert.strictEqual(r.marginRequired, '2000.00');
  assert.strictEqual(r.equityRatio, '450.00');
});
