require('dotenv').config();
const { sequelize, TipoServico } = require('../models');
(async () => {
await sequelize.authenticate();
await TipoServico.bulkCreate([
{ nome_servico: 'Elétrica básica' },
{ nome_servico: 'Hidráulica básica' },
{ nome_servico: 'Pintura cômodo' }
], { ignoreDuplicates: true });
console.log('Seeds ok');
process.exit(0);
})();