// Konfigurasi bisnis terpusat. Ubah angka di sini, jangan di tempat lain.
// null = belum dikonfirmasi, pengguna harus mengisi manual.
module.exports = {
  callMarginPct: 70,       // Call Margin Price: Equity = 70% x MR
  autoLiquidationPct: 30,  // Auto Liquidation Price: Equity = 30% x MR
  instruments: {
    gold:     { label: 'Gold',      pointValue: '100', marginPerLot: '1000' },
    nikkei:   { label: 'Nikkei',    pointValue: null,  marginPerLot: null },
    hangseng: { label: 'Hang Seng', pointValue: null,  marginPerLot: null }
  }
};
