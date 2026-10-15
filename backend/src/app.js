const path = require('path');
const express = require('express');
const routes = require('./routes/calculatorRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api', routes);
app.use('/api', notFound);
app.use(express.static(path.join(__dirname, '../../frontend'))); // frontend disajikan dari folder /frontend
app.use(errorHandler);

module.exports = app;
