// Controlador de Autenticación (JWT), Usuarios, Roles y Equipos de Soporte
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const {
  auth,
  leerDatosLocales,
  guardarDatosLocales,
  replicarEnFirestore,
} = require('../config/firebase');
const { generarToken, tienePermisoJerarquico, JERARQUIA_ROLES } = require('../utils/jwt');

// Ejecuta una promesa de Firebase con límite de 2.5 segundos para no bloquear si el firewall filtra
function conTiempoLimite(promesa, ms = 2500) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// 1. Iniciar sesión y emitir JSON Web Token (JWT)
async function login(cuerpo) {
  const email = (cuerpo.email || '').trim().toLowerCase();
  const clave = cuerpo.clave || '';

  if (!email || !clave) {
    return { status: 400, data: { error: 'Debes ingresar correo y clave.' } };
  }

  const datos = leerDatosLocales();
  let usuario = datos.usuarios.find((u) => u.email.toLowerCase() === email);

  // Si existe en el registro local, verificamos su clave de inmediato
  if (usuario) {
    if (usuario.clave && usuario.clave !== clave) {
      return { status: 401, data: { error: 'Correo o clave incorrectos.' } };
    }
  } else {
    // Si fue creado antes en Firebase Auth directamente, validamos con límite de tiempo
    try {
      const cred = await conTiempoLimite(signInWithEmailAndPassword(auth, email, clave));
      usuario = {
        uid: cred.user.uid,
        nombre: email.split('@')[0],
        email,
        clave,
        rol: 'estudiante',
        creadoEn: new Date().toISOString().slice(0, 10),
      };
      datos.usuarios.push(usuario);
      guardarDatosLocales(datos);
      replicarEnFirestore('usuarios', usuario.uid, usuario);
    } catch (e) {
      return { status: 401, data: { error: 'Correo o clave incorrectos.' } };
    }
  }

  // Firmamos el JWT con uid, email, nombre y rol
  const token = generarToken(usuario);
  const { clave: _, ...usuarioPublico } = usuario;

  return {
    status: 200,
    data: {
      mensaje: 'Sesión iniciada correctamente con JWT',
      token,
      usuario: usuarioPublico,
    },
  };
}

// 2. Registrar nuevo usuario en Firebase y emitir su JWT
async function registro(cuerpo) {
  const email = (cuerpo.email || '').trim().toLowerCase();
  const clave = cuerpo.clave || '';
  const nombre = (cuerpo.nombre || email.split('@')[0] || 'Usuario').trim();
  const rolSolicitado = JERARQUIA_ROLES[cuerpo.rol] ? cuerpo.rol : 'estudiante';

  if (!email.includes('@') || !email.includes('.')) {
    return { status: 400, data: { error: 'Escribe un correo válido.' } };
  }
  if (clave.length < 6) {
    return { status: 400, data: { error: 'La clave debe tener mínimo 6 caracteres.' } };
  }

  const datos = leerDatosLocales();
  if (datos.usuarios.some((u) => u.email.toLowerCase() === email)) {
    return { status: 409, data: { error: 'Ese correo ya tiene una cuenta registrada.' } };
  }

  let uid = 'usr_' + Date.now();
  try {
    const cred = await conTiempoLimite(createUserWithEmailAndPassword(auth, email, clave));
    uid = cred.user.uid;
  } catch (e) {
    // Si demora la red, continúa con el UID generado y replica en segundo plano
  }

  const nuevoUsuario = {
    uid,
    nombre,
    email,
    clave,
    rol: rolSolicitado,
    creadoEn: new Date().toISOString().slice(0, 10),
  };

  datos.usuarios.push(nuevoUsuario);
  guardarDatosLocales(datos);
  replicarEnFirestore('usuarios', nuevoUsuario.uid, nuevoUsuario);

  const token = generarToken(nuevoUsuario);
  const { clave: _, ...usuarioPublico } = nuevoUsuario;

  return {
    status: 201,
    data: {
      mensaje: 'Cuenta creada correctamente',
      token,
      usuario: usuarioPublico,
    },
  };
}

// 3. Listar usuarios (Líder y Admin) y lista de técnicos de soporte
function listarUsuarios(usuarioToken, soloTecnicos = false) {
  const datos = leerDatosLocales();
  let lista = datos.usuarios.map(({ clave, ...u }) => u);
  if (soloTecnicos) {
    lista = lista.filter((u) => u.rol === 'soporte' || u.rol === 'lider');
  }
  return { status: 200, data: { usuarios: lista } };
}

// 4. Cambiar el rol de un usuario (Solo Administrador)
function cambiarRolUsuario(usuarioToken, uidObjetivo, nuevoRol) {
  if (!tienePermisoJerarquico(usuarioToken.rol, 'admin')) {
    return { status: 403, data: { error: 'Solo el Administrador puede cambiar roles de usuarios.' } };
  }
  if (!JERARQUIA_ROLES[nuevoRol]) {
    return { status: 400, data: { error: 'Rol inválido. Usa: estudiante, soporte, lider o admin.' } };
  }

  const datos = leerDatosLocales();
  const usuario = datos.usuarios.find((u) => u.uid === uidObjetivo);
  if (!usuario) {
    return { status: 404, data: { error: 'Usuario no encontrado.' } };
  }

  usuario.rol = nuevoRol;
  guardarDatosLocales(datos);
  replicarEnFirestore('usuarios', usuario.uid, usuario);

  const { clave: _, ...usuarioPublico } = usuario;
  return {
    status: 200,
    data: { mensaje: 'Rol actualizado correctamente.', usuario: usuarioPublico },
  };
}

// 5. Listar y crear Equipos de Soporte (colección "equipos")
function listarEquipos() {
  const datos = leerDatosLocales();
  return { status: 200, data: { equipos: datos.equipos } };
}

function crearEquipo(usuarioToken, cuerpo) {
  if (!tienePermisoJerarquico(usuarioToken.rol, 'lider')) {
    return {
      status: 403,
      data: { error: 'Solo el Líder de Soporte o Administrador pueden crear equipos.' },
    };
  }
  const nombre = (cuerpo.nombre || '').trim();
  const integrantes = (cuerpo.integrantes || '').trim();
  if (!nombre || !integrantes) {
    return { status: 400, data: { error: 'Falta el nombre o los integrantes del equipo.' } };
  }

  const datos = leerDatosLocales();
  const nuevoEquipo = {
    id: 'eq_' + Date.now(),
    nombre,
    integrantes,
    liderEmail: usuarioToken.email,
    creadoEn: new Date().toISOString().slice(0, 10),
  };

  datos.equipos.unshift(nuevoEquipo);
  guardarDatosLocales(datos);
  replicarEnFirestore('equipos', nuevoEquipo.id, nuevoEquipo);

  return { status: 201, data: { mensaje: 'Equipo creado.', equipo: nuevoEquipo } };
}

module.exports = {
  login,
  registro,
  listarUsuarios,
  cambiarRolUsuario,
  listarEquipos,
  crearEquipo,
};
