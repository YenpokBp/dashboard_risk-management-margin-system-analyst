const Decimal = require('decimal.js');

// Uang dihitung dengan Decimal (bukan float) lalu dikirim sebagai string 2 desimal.
const money = (d) => {
  const s = d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
  return s === '-0.00' ? '0.00' : s;
};

class FundCondition {
  constructor(i) {
    this.dir = i.side === 'buy' ? 1 : -1;
    this.balance = new Decimal(i.balance); // New Balance (= modal yang diinput)
    this.lot = new Decimal(i.lot);
    this.entry = new Decimal(i.entryPrice);
    this.current = new Decimal(i.currentPrice); // sudah termasuk spread (input manual)
    this.pointValue = new Decimal(i.pointValue);
    this.marginPerLot = new Decimal(i.marginPerLot);
    this.priceDecimals = i.priceDecimals ?? 2;
  }

  // Floating P/L = (Current - Entry) x Lot x Nilai per poin (dibalik untuk Sell)
  floatingPL() {
    return this.current.minus(this.entry).times(this.lot).times(this.pointValue).times(this.dir);
  }

  // MR satu arah: Sigma Lot = Lot, Pair = 0
  marginRequired() {
    return this.lot.times(this.marginPerLot);
  }

  // Harga saat Equity = pct% x MR (Decimal, belum dibulatkan)
  levelRaw(pct, mr) {
    const gap = mr.times(pct).div(100).minus(this.balance);
    return this.entry.plus(gap.div(this.lot.times(this.pointValue)).times(this.dir));
  }

  // Dibulatkan ke bawah sesuai priceDecimals instrumen. null bila harga <= 0.
  levelPrice(pct, mr) {
    const p = this.levelRaw(pct, mr);
    return p.gt(0) ? p.toDecimalPlaces(this.priceDecimals, Decimal.ROUND_DOWN).toFixed(this.priceDecimals) : null;
  }

  calculate(rules) {
    const floating = this.floatingPL();
    const equity = this.balance.plus(floating);
    const mr = this.marginRequired();
    return {
      newBalance: money(this.balance),
      floatingPL: money(floating),
      equity: money(equity),
      marginRequired: money(mr),
      effectiveMargin: money(equity.minus(mr)),
      callMarginPrice: this.levelPrice(rules.callMarginPct, mr),
      autoLiquidationPrice: this.levelPrice(rules.autoLiquidationPct, mr),
      callMarginEquity: money(mr.times(rules.callMarginPct).div(100)),
      autoLiquidationEquity: money(mr.times(rules.autoLiquidationPct).div(100)),
      equityRatio: money(equity.div(mr).times(100))
    };
  }
}

module.exports = FundCondition;
