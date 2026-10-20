// Konfigurasi bisnis terpusat. Ubah angka di sini, jangan di tempat lain.
// priceDecimals = jumlah desimal harga batas (Hang Seng 0, mengikuti statement).
  // marginDaytrade / marginOvernight = jaminan per lot (USD). Overnight Nikkei belum dikonfirmasi.
  // pointValue = nilai per poin per lot (USD). marginPerLot = jaminan per lot (USD).
module.exports = {
  callMarginPct: 70,       // Call Margin Price: Equity = 70% x MR
  autoLiquidationPct: 30,  // Auto Liquidation Price: Equity = 30% x MR
  instruments: {
    gold:     { label: 'Gold',      pointValue: '100', marginDaytrade: '1000', marginOvernight: '3000', priceDecimals: 2 },
    nikkei:   { label: 'Nikkei',    pointValue: '5',   marginDaytrade: '1000', marginOvernight: '2000', priceDecimals: 2 },
    hangseng: { label: 'Hang Seng', pointValue: '5',   marginDaytrade: '1000', marginOvernight: '2000', priceDecimals: 0 }
  }
};
