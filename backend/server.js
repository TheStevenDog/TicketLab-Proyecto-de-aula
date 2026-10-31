// Servidor API REST y Plataforma Web en Node.js (Fases 1 a 4: Firebase + JWT + 4 Roles + Reportes + Web)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const { conectarServicioFirebase } = require('./config/firebase');
const { autenticarJwt, requerirRol } = require('./middlewares/auth');
const {
  login,
  registro,
  listarUsuarios,
  cambiarRolUsuario,
  listarEquipos,
  crearEquipo,
} = require('./controllers/authController');
const {
  listarTickets,
  crearTicket,
  asignarTicket,
  gestionarTicket,
  consultarReportes,
  sincronizarOperacionesOffline,
} = require('./controllers/ticketsController');

const PUERTO = process.env.PORT || 3000;

// 1. Detecta la IP local del PC para mostrarla en consola
function obtenerIpLocal() {
  const interfaces = os.networkInterfaces();
  const candidatas = [];
  for (const nombre of Object.keys(interfaces)) {
    if (nombre.toLowerCase().includes('veth') || nombre.toLowerCase().includes('wsl')) continue;
    for (const dir of interfaces[nombre]) {
      if (dir.family === 'IPv4' && !dir.internal) {
        const esPrivada =
          dir.address.startsWith('192.168.') ||
          dir.address.startsWith('10.') ||
          dir.address.startsWith('172.');
        if (esPrivada) {
          const prioridad = dir.address.startsWith('192.168.') ? 0 : 1;
          candidatas.push({ ip: dir.address, prioridad });
        }
      }
    }
  }
  candidatas.sort((a, b) => a.prioridad - b.prioridad);
  return candidatas[0] ? candidatas[0].ip : 'localhost';
}

// 2. Lee el cuerpo JSON de una petición (soporta fotos Base64 tomadas con la cámara)
function leerCuerpoJson(req) {
  return new Promise((resolve) => {
    let cuerpo = '';
    req.on('data', (trozo) => {
      cuerpo += trozo;
      if (cuerpo.length > 12 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      if (!cuerpo) return resolve({});
      try {
        resolve(JSON.parse(cuerpo));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// 3. Envía respuesta JSON con cabeceras CORS habilitadas
function responderJson(res, status, datos) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(datos));
}

// 4. Sirve los archivos estáticos de la Plataforma Web (backend/public)
function servirArchivoWeb(req, res, rutaRelativa) {
  const mapaTipos = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
  };
  const limpia = rutaRelativa === '/' ? '/index.html' : rutaRelativa;
  const rutaArchivo = path.join(__dirname, 'public', limpia);

  if (!fs.existsSync(rutaArchivo) || fs.statSync(rutaArchivo).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Archivo no encontrado');
  }

  const ext = path.extname(rutaArchivo).toLowerCase();
  res.writeHead(200, { 'Content-Type': mapaTipos[ext] || 'text/plain' });
  fs.createReadStream(rutaArchivo).pipe(res);
}

// 5. Manejador de peticiones HTTP (compatible con Node local y Serverless de Vercel)
async function manejadorPrincipal(req, res) {
  if (req.method === 'OPTIONS') {
    return responderJson(res, 200, { ok: true });
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const ruta = urlObj.pathname;
  const metodo = req.method;

  try {
    // --- FASE 1: RUTAS PÚBLICAS DE AUTENTICACIÓN (EMISIÓN DE JWT) ---
    if (ruta === '/api/salud' && metodo === 'GET') {
      return responderJson(res, 200, {
        ok: true,
        servidor: 'TicketLab API v2 (Node.js + Firebase + JWT)',
      });
    }

    if (ruta === '/api/auth/login' && metodo === 'POST') {
      const cuerpo = await leerCuerpoJson(req);
      const resultado = await login(cuerpo);
      return responderJson(res, resultado.status, resultado.data);
    }

    if (ruta === '/api/auth/registro' && metodo === 'POST') {
      const cuerpo = await leerCuerpoJson(req);
      const resultado = await registro(cuerpo);
      return responderJson(res, resultado.status, resultado.data);
    }

    // --- MIDDLEWARE DE VERIFICACIÓN JWT PARA RUTAS PROTEGIDAS (/api/*) ---
    if (ruta.startsWith('/api/')) {
      const authCheck = autenticarJwt(req);
      if (!authCheck.autorizado) {
        return responderJson(res, authCheck.status, { error: authCheck.error });
      }
      const usuarioToken = authCheck.usuario;

      // Perfil del usuario según su JWT
      if (ruta === '/api/auth/perfil' && metodo === 'GET') {
        return responderJson(res, 200, { usuario: usuarioToken });
      }

      // --- FASE 2: USUARIOS, TÉCNICOS Y EQUIPOS (CONTROL JERÁRQUICO) ---
      if (ruta === '/api/usuarios' && metodo === 'GET') {
        const permiso = requerirRol(usuarioToken, 'lider');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const resultado = listarUsuarios(usuarioToken, false);
        return responderJson(res, resultado.status, resultado.data);
      }

      if (ruta === '/api/usuarios/tecnicos' && metodo === 'GET') {
        const permiso = requerirRol(usuarioToken, 'lider');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const resultado = listarUsuarios(usuarioToken, true);
        return responderJson(res, resultado.status, resultado.data);
      }

      const matchRol = ruta.match(/^\/api\/usuarios\/([^/]+)\/rol$/);
      if (matchRol && metodo === 'PUT') {
        const permiso = requerirRol(usuarioToken, 'admin');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const cuerpo = await leerCuerpoJson(req);
        const resultado = cambiarRolUsuario(usuarioToken, matchRol[1], cuerpo.rol);
        return responderJson(res, resultado.status, resultado.data);
      }

      if (ruta === '/api/equipos' && metodo === 'GET') {
        const resultado = listarEquipos();
        return responderJson(res, resultado.status, resultado.data);
      }

      if (ruta === '/api/equipos' && metodo === 'POST') {
        const permiso = requerirRol(usuarioToken, 'lider');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const cuerpo = await leerCuerpoJson(req);
        const resultado = crearEquipo(usuarioToken, cuerpo);
        return responderJson(res, resultado.status, resultado.data);
      }

      // --- FASE 2: FLUJO DE TICKETS POR JERARQUÍA (CREAR, LISTAR, ASIGNAR, GESTIONAR) ---
      if (ruta === '/api/tickets' && metodo === 'GET') {
        const resultado = listarTickets(usuarioToken);
        return responderJson(res, resultado.status, resultado.data);
      }

      if (ruta === '/api/tickets' && metodo === 'POST') {
        const cuerpo = await leerCuerpoJson(req);
        const resultado = crearTicket(usuarioToken, cuerpo);
        return responderJson(res, resultado.status, resultado.data);
      }

      const matchAsignar = ruta.match(/^\/api\/tickets\/([^/]+)\/asignar$/);
      if (matchAsignar && metodo === 'PUT') {
        const permiso = requerirRol(usuarioToken, 'lider');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const cuerpo = await leerCuerpoJson(req);
        const resultado = asignarTicket(usuarioToken, matchAsignar[1], cuerpo);
        return responderJson(res, resultado.status, resultado.data);
      }

      const matchGestionar = ruta.match(/^\/api\/tickets\/([^/]+)\/gestionar$/);
      if (matchGestionar && metodo === 'PUT') {
        const permiso = requerirRol(usuarioToken, 'soporte');
        if (!permiso.permitido) return responderJson(res, permiso.status, { error: permiso.error });
        const cuerpo = await leerCuerpoJson(req);
        const resultado = gestionarTicket(usuarioToken, matchGestionar[1], cuerpo);
        return responderJson(res, resultado.status, resultado.data);
      }

      if (ruta === '/api/tickets/sincronizar' && metodo === 'POST') {
        const cuerpo = await leerCuerpoJson(req);
        const resultado = sincronizarOperacionesOffline(usuarioToken, cuerpo);
        return responderJson(res, resultado.status, resultado.data);
      }

      // --- FASE 3: REPORTES DE DAÑOS CON FILTROS AVANZADOS ---
      if (ruta === '/api/reportes' && metodo === 'GET') {
        const filtros = {
          usuario: urlObj.searchParams.get('usuario') || '',
          bloque: urlObj.searchParams.get('bloque') || '',
          sala: urlObj.searchParams.get('sala') || '',
          tipoEquipo: urlObj.searchParams.get('tipoEquipo') || '',
          fechaInicio: urlObj.searchParams.get('fechaInicio') || '',
          fechaFin: urlObj.searchParams.get('fechaFin') || '',
          estado: urlObj.searchParams.get('estado') || '',
        };
        const resultado = consultarReportes(usuarioToken, filtros);
        return responderJson(res, resultado.status, resultado.data);
      }

      return responderJson(res, 404, { error: 'Ruta de API no encontrada.' });
    }

    // --- FASE 4: PLATAFORMA WEB COMPLETA (backend/public) ---
    return servirArchivoWeb(req, res, ruta);
  } catch (error) {
    return responderJson(res, 500, { error: 'Error interno del servidor: ' + error.message });
  }
}

const servidor = http.createServer(manejadorPrincipal);

// 6. Arranco el servidor API + Web si se ejecuta localmente (en Vercel exportamos el handler)
if (process.env.VERCEL) {
  conectarServicioFirebase();
} else {
  servidor.listen(PUERTO, '0.0.0.0', () => {
    const ipLocal = obtenerIpLocal();
    try {
      const rutaUrlApp = path.join(__dirname, '..', 'src', 'config', 'servidorUrl.js');
      fs.writeFileSync(
        rutaUrlApp,
        `// Generado automáticamente al iniciar el servidor backend (npm run api)\nexport const SERVIDOR_API_URL = 'http://${ipLocal}:${PUERTO}';\n`,
        'utf8'
      );
    } catch (e) {}
    console.log('====================================================');
    console.log('🚀 TicketLab Servidor API + Web (Fases 1 a 6 listas)');
    console.log('💻 Plataforma Web en PC: http://localhost:' + PUERTO);
    console.log('📱 URL para App Móvil:   http://' + ipLocal + ':' + PUERTO);
    console.log('====================================================');
    conectarServicioFirebase();
  });
}

module.exports = manejadorPrincipal;
