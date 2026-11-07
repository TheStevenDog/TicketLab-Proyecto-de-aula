// Serverless function endpoint para Vercel
const handler = require('../backend/server.js');

module.exports = (req, res) => {
  return handler(req, res);
};
