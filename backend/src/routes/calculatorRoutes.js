const router = require('express').Router();
const controller = require('../controllers/calculatorController');
const validateCalculate = require('../middleware/validateCalculate');

router.get('/instruments', controller.instruments);
router.post('/calculate', validateCalculate, controller.calculate);

module.exports = router;
