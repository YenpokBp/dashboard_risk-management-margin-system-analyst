const rules = require('../config/businessRules');
const FundCondition = require('../models/FundCondition');
const view = require('../views/calculationView');

exports.instruments = (req, res) => res.json(view.instruments(rules));

exports.calculate = (req, res) => {
  const model = new FundCondition(req.input);
  res.json(view.calculation(req.input, model.calculate(rules), rules));
};
