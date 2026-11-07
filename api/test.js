// Endpoint de diagnóstico para aislar el error en Vercel
module.exports = (req, res) => {
  try {
    // 1. Probar carga de módulos del backend
    const fs = require('fs');
    const path = require('path');
    let firebaseError = null;
    let serverError = null;

    try {
      require('../backend/config/firebase.js');
    } catch (e) {
      firebaseError = { message: e.message, stack: e.stack };
    }

    try {
      require('../backend/server.js');
    } catch (e) {
      serverError = { message: e.message, stack: e.stack };
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      entorno: {
        nodeVersion: process.version,
        envVercel: process.env.VERCEL || 'no',
        cwd: process.cwd(),
      },
      firebaseError,
      serverError
    }, null, 2));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errorCritico: err.message, stack: err.stack }));
  }
};
