// Utilidad de JSON Web Token (JWT estándar RFC 7519 con HMAC-SHA256) y Jerarquía de Roles
const crypto = require('crypto');

const CLAVE_SECRETA = process.env.JWT_SECRET || 'ticketlab_clave_secreta_universidad_2026';

// Jerarquía de roles: a mayor número, mayor nivel de autoridad
const JERARQUIA_ROLES = {
  estudiante: 1, // Usuario / Estudiante: reporta tickets y ve respuesta
  soporte: 2,    // Técnico de soporte: gestiona tickets asignados y responde
  lider: 3,      // Líder de soporte: asigna tickets a técnicos y ve reportes
  admin: 4,      // Administrador: control total y gestión de roles
};

// Codifica un objeto o buffer en Base64URL estándar de JWT
function base64UrlEncode(datos) {
  const texto = typeof datos === 'string' ? datos : JSON.stringify(datos);
  return Buffer.from(texto)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Decodifica una cadena Base64URL a objeto JSON
function base64UrlDecode(cadena) {
  let base64 = cadena.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

// 1. Firma un token JWT válido por 24 horas con los datos y el rol del usuario
function generarToken(usuario) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const ahora = Math.floor(Date.now() / 1000);
  const payload = {
    uid: usuario.uid,
    email: usuario.email,
    nombre: usuario.nombre || usuario.email.split('@')[0],
    rol: usuario.rol || 'estudiante',
    iat: ahora,
    exp: ahora + 60 * 60 * 24, // Expira en 24 horas
  };

  const segmentoHeader = base64UrlEncode(header);
  const segmentoPayload = base64UrlEncode(payload);
  const firma = crypto
    .createHmac('sha256', CLAVE_SECRETA)
    .update(`${segmentoHeader}.${segmentoPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${segmentoHeader}.${segmentoPayload}.${firma}`;
}

// 2. Verifica la firma y expiración del JWT recibido en Authorization: Bearer <token>
function verificarToken(token) {
  if (!token || typeof token !== 'string') return null;
  const partes = token.replace(/^Bearer\s+/i, '').trim().split('.');
  if (partes.length !== 3) return null;

  const [segmentoHeader, segmentoPayload, firmaRecibida] = partes;
  const firmaEsperada = crypto
    .createHmac('sha256', CLAVE_SECRETA)
    .update(`${segmentoHeader}.${segmentoPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (firmaRecibida !== firmaEsperada) return null;

  try {
    const payload = base64UrlDecode(segmentoPayload);
    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < ahora) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// 3. Comprueba si el rol del usuario cumple con el nivel mínimo requerido o está en la lista
function tienePermisoJerarquico(rolUsuario, rolMinimoRequerido) {
  const nivelUsuario = JERARQUIA_ROLES[rolUsuario] || 0;
  const nivelMinimo = JERARQUIA_ROLES[rolMinimoRequerido] || 99;
  return nivelUsuario >= nivelMinimo;
}

module.exports = {
  JERARQUIA_ROLES,
  generarToken,
  verificarToken,
  tienePermisoJerarquico,
};
