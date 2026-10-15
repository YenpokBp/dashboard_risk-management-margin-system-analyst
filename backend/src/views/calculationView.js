// "View" untuk API: menyusun bentuk JSON yang diterima frontend.
exports.instruments = (rules) => ({ instruments: rules.instruments });

exports.calculation = (input, result, rules) => ({
  instrument: { key: input.instrument, label: rules.instruments[input.instrument].label },
  side: input.side,
  result,
  rules: { callMarginPct: rules.callMarginPct, autoLiquidationPct: rules.autoLiquidationPct }
});
