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
  }

  // Floating P/L = (Current - Entry) x Lot x Nilai per poin (dibalik untuk Sell)
  floatingPL() {
    return this.current.minus(this.entry).times(this.lot).times(this.pointValue).times(this.dir);
  }

  // MR satu arah: Sigma Lot = Lot, Pair = 0
  marginRequired() {
    return this.lot.times(this.marginPerLot);
  }

  // Harga saat Equity = pct% x MR, dibulatkan ke bawah 2 desimal. null bila harga <= 0.
  levelPrice(pct, mr) {
    const gap = mr.times(pct).div(100).minus(this.balance);
    const p = this.entry.plus(gap.div(this.lot.times(this.pointValue)).times(this.dir));
    return p.gt(0) ? p.toDecimalPlaces(2, Decimal.ROUND_DOWN).toFixed(2) : null;
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
      equityRatio: money(equity.div(mr).times(100))
    };
  }
}

module.exports = FundCondition;
