// Serverless function endpoint para Vercel
// Importamos explícitamente firebase/app, firebase/auth y firebase/firestore para que el bundler de Vercel los incluya en el despliegue
require('firebase/app');
require('firebase/auth');
require('firebase/firestore');

const handler = require('../backend/server.js');

module.exports = (req, res) => {
  return handler(req, res);
};
