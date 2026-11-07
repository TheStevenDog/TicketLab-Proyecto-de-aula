// Serverless function endpoint para Vercel
// Importamos explícitamente los paquetes para que el bundler de Vercel los empaquete
try { require('@firebase/app'); } catch(e){}
try { require('@firebase/auth'); } catch(e){}
try { require('@firebase/firestore'); } catch(e){}

const handler = require('../backend/server.js');

module.exports = (req, res) => {
  return handler(req, res);
};
