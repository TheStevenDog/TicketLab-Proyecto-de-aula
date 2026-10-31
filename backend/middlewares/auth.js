// Middlewares de Seguridad: Verificación de JSON Web Token (JWT) y Jerarquía de Roles
const { verificarToken, tienePermisoJerarquico, JERARQUIA_ROLES } = require('../utils/jwt');

// 1. Extrae y valida el JWT del header "Authorization: Bearer <token>"
function autenticarJwt(req) {
  const headerAuth = req.headers['authorization'] || '';
  const payload = verificarToken(headerAuth);
  if (!payload) {
    return {
      autorizado: false,
      status: 401,
      error: 'No autorizado. Debes iniciar sesión y enviar un JSON Web Token (JWT) válido.',
    };
  }
  req.usuario = payload;
  return { autorizado: true, usuario: payload };
}

// 2. Verifica que el usuario autenticado tenga el nivel jerárquico mínimo o uno de los roles indicados
function requerirRol(usuario, rolMinimoOLista) {
  if (!usuario || !usuario.rol) {
    return {
      permitido: false,
      status: 401,
      error: 'Sesión inválida o sin rol asignado.',
    };
  }

  // Si se pasa un arreglo de roles específicos permitidos
  if (Array.isArray(rolMinimoOLista)) {
    if (!rolMinimoOLista.includes(usuario.rol)) {
      return {
        permitido: false,
        status: 403,
        error: `Permiso denegado. Tu rol (${usuario.rol}) no tiene acceso. Se requiere: ${rolMinimoOLista.join(', ')}.`,
      };
    }
    return { permitido: true };
  }

  // Si se pasa un rol mínimo en la jerarquía (estudiante < soporte < lider < admin)
  if (!tienePermisoJerarquico(usuario.rol, rolMinimoOLista)) {
    return {
      permitido: false,
      status: 403,
      error: `Permiso jerárquico insuficiente. Tu rol es "${usuario.rol}" y se requiere mínimo "${rolMinimoOLista}".`,
    };
  }

  return { permitido: true };
}

module.exports = {
  autenticarJwt,
  requerirRol,
  JERARQUIA_ROLES,
};
