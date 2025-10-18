const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use('/api', routes);
app.get('/', (_, res) => res.json({ ok: true }));
module.exports = app;