// Controlador de Tickets, Asignación, Gestión Técnica, Reportes de Daños y Sincronización Offline
const {
  leerDatosLocales,
  guardarDatosLocales,
  replicarEnFirestore,
} = require('../config/firebase');
const { tienePermisoJerarquico } = require('../utils/jwt');

// 1. Listar tickets respetando la jerarquía de roles
function listarTickets(usuarioToken) {
  const datos = leerDatosLocales();
  let lista = [...datos.tickets].sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));

  // Estudiante: solo ve los tickets que él mismo reportó y su respuesta
  if (usuarioToken.rol === 'estudiante') {
    lista = lista.filter(
      (t) =>
        t.creadorUid === usuarioToken.uid ||
        (t.creadorEmail && t.creadorEmail.toLowerCase() === usuarioToken.email.toLowerCase())
    );
  }
  // Soporte técnico: ve los tickets que le asignó el líder (y los que él haya creado)
  else if (usuarioToken.rol === 'soporte') {
    lista = lista.filter(
      (t) =>
        t.tecnicoUid === usuarioToken.uid ||
        (t.tecnicoEmail && t.tecnicoEmail.toLowerCase() === usuarioToken.email.toLowerCase()) ||
        t.creadorUid === usuarioToken.uid
    );
  }
  // Líder de soporte y Administrador: ven todos los tickets del campus

  return { status: 200, data: { tickets: lista } };
}

// 2. Crear un nuevo ticket de reporte de daño (Todos los usuarios autenticados)
function crearTicket(usuarioToken, cuerpo) {
  const titulo = (cuerpo.titulo || '').trim();
  const descripcion = (cuerpo.descripcion || '').trim();
  const bloque = (cuerpo.bloque || '').trim();
  const sala = (cuerpo.sala || '').trim();
  const tipoEquipo = (cuerpo.tipoEquipo || 'Computador').trim();
  const prioridad = ['baja', 'media', 'alta'].includes(cuerpo.prioridad)
    ? cuerpo.prioridad
    : 'media';
  const fechaFalla =
    (cuerpo.fechaFalla || cuerpo.fechaReporte || '').trim() || new Date().toISOString().slice(0, 10);
  const fotoBase64 = cuerpo.fotoBase64 || '';

  if (!titulo || !descripcion || !bloque || !sala) {
    return {
      status: 400,
      data: { error: 'Completa título, descripción, bloque y sala del daño.' },
    };
  }

  const datos = leerDatosLocales();
  const nuevoTicket = {
    id: cuerpo.idTemporal || 'tkt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    titulo,
    descripcion,
    bloque,
    sala,
    ubicacion: `${bloque} - ${sala}`,
    tipoEquipo,
    prioridad,
    estado: 'pendiente',
    fechaFalla,
    fechaReporte: fechaFalla,
    creadorUid: usuarioToken.uid,
    creadorNombre: usuarioToken.nombre || usuarioToken.email.split('@')[0],
    creadorEmail: usuarioToken.email,
    tecnicoUid: null,
    tecnicoNombre: null,
    tecnicoEmail: null,
    asignadoPor: null,
    respuestaTecnica: '',
    fotoBase64,
    creadoEn: Date.now(),
  };

  datos.tickets.unshift(nuevoTicket);
  guardarDatosLocales(datos);
  replicarEnFirestore('tickets', nuevoTicket.id, nuevoTicket);

  return {
    status: 201,
    data: { mensaje: 'Ticket de daño reportado con éxito.', ticket: nuevoTicket },
  };
}

// 3. Asignar ticket a un técnico de soporte (Solo Líder de soporte o Administrador)
function asignarTicket(usuarioToken, ticketId, cuerpo) {
  if (!tienePermisoJerarquico(usuarioToken.rol, 'lider')) {
    return {
      status: 403,
      data: { error: 'Permiso denegado: Solo el Líder de Soporte o Administrador puede asignar tickets.' },
    };
  }

  const datos = leerDatosLocales();
  const ticket = datos.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return { status: 404, data: { error: 'Ticket no encontrado.' } };
  }

  // Buscamos al técnico por uid o email
  const tecnico = datos.usuarios.find(
    (u) => u.uid === cuerpo.tecnicoUid || u.email === cuerpo.tecnicoEmail
  );

  if (!tecnico) {
    return { status: 400, data: { error: 'Selecciona un técnico de soporte válido.' } };
  }

  ticket.tecnicoUid = tecnico.uid;
  ticket.tecnicoNombre = tecnico.nombre;
  ticket.tecnicoEmail = tecnico.email;
  ticket.asignadoPor = usuarioToken.email;
  if (ticket.estado === 'pendiente') {
    ticket.estado = 'asignado';
  }
  ticket.actualizadoEn = Date.now();

  guardarDatosLocales(datos);
  replicarEnFirestore('tickets', ticket.id, ticket);

  return {
    status: 200,
    data: { mensaje: `Ticket asignado a ${tecnico.nombre}`, ticket },
  };
}

// 4. Gestionar ticket y enviar respuesta al usuario (Técnico de soporte, Líder o Admin)
function gestionarTicket(usuarioToken, ticketId, cuerpo) {
  if (!tienePermisoJerarquico(usuarioToken.rol, 'soporte')) {
    return {
      status: 403,
      data: { error: 'Permiso denegado: Se requiere rol de Soporte Técnico o superior.' },
    };
  }

  const datos = leerDatosLocales();
  const ticket = datos.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return { status: 404, data: { error: 'Ticket no encontrado.' } };
  }

  // Si es técnico de soporte, verificamos que el ticket le pertenezca (o lo auto-toma si no tenía técnico)
  if (
    usuarioToken.rol === 'soporte' &&
    ticket.tecnicoUid &&
    ticket.tecnicoUid !== usuarioToken.uid &&
    ticket.tecnicoEmail !== usuarioToken.email
  ) {
    return {
      status: 403,
      data: { error: 'Este ticket está asignado a otro técnico de soporte.' },
    };
  }

  const estadosValidos = ['pendiente', 'asignado', 'en_proceso', 'resuelto'];
  if (cuerpo.estado && estadosValidos.includes(cuerpo.estado)) {
    ticket.estado = cuerpo.estado;
  }
  if (typeof cuerpo.respuestaTecnica === 'string') {
    ticket.respuestaTecnica = cuerpo.respuestaTecnica.trim();
  }
  if (!ticket.tecnicoUid && usuarioToken.rol === 'soporte') {
    ticket.tecnicoUid = usuarioToken.uid;
    ticket.tecnicoNombre = usuarioToken.nombre;
    ticket.tecnicoEmail = usuarioToken.email;
  }
  ticket.actualizadoEn = Date.now();

  guardarDatosLocales(datos);
  replicarEnFirestore('tickets', ticket.id, ticket);

  return {
    status: 200,
    data: { mensaje: 'Ticket actualizado y respuesta enviada al usuario.', ticket },
  };
}

// 5. Reportes de daños con filtros por Usuario, Sala, Bloque, Rango de fechas y Tipo de equipo
function consultarReportes(usuarioToken, filtros) {
  const datos = leerDatosLocales();
  let lista = [...datos.tickets].sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));

  // Si es estudiante, solo filtra sobre sus propios reportes
  if (usuarioToken.rol === 'estudiante') {
    lista = lista.filter(
      (t) =>
        t.creadorUid === usuarioToken.uid ||
        (t.creadorEmail && t.creadorEmail.toLowerCase() === usuarioToken.email.toLowerCase())
    );
  }

  // Filtro por usuario que reporta (nombre, email o uid)
  if (filtros.usuario && filtros.usuario.trim()) {
    const qUsuario = filtros.usuario.trim().toLowerCase();
    lista = lista.filter(
      (t) =>
        (t.creadorEmail && t.creadorEmail.toLowerCase().includes(qUsuario)) ||
        (t.creadorNombre && t.creadorNombre.toLowerCase().includes(qUsuario)) ||
        t.creadorUid === filtros.usuario.trim()
    );
  }

  // Filtro por Bloque
  if (filtros.bloque && filtros.bloque.trim()) {
    const qBloque = filtros.bloque.trim().toLowerCase();
    lista = lista.filter((t) => (t.bloque || '').toLowerCase().includes(qBloque));
  }

  // Filtro por Sala
  if (filtros.sala && filtros.sala.trim()) {
    const qSala = filtros.sala.trim().toLowerCase();
    lista = lista.filter((t) => (t.sala || '').toLowerCase().includes(qSala));
  }

  // Filtro por Tipo de Equipo que presenta la falla
  if (filtros.tipoEquipo && filtros.tipoEquipo.trim()) {
    const qTipo = filtros.tipoEquipo.trim().toLowerCase();
    lista = lista.filter((t) => (t.tipoEquipo || '').toLowerCase() === qTipo);
  }

  // Filtro por Estado
  if (filtros.estado && filtros.estado.trim()) {
    lista = lista.filter((t) => t.estado === filtros.estado.trim());
  }

  // Filtro por Rango de Fechas (fechaInicio y fechaFin en formato YYYY-MM-DD)
  if (filtros.fechaInicio && filtros.fechaInicio.trim()) {
    const inicio = filtros.fechaInicio.trim();
    lista = lista.filter((t) => (t.fechaReporte || '') >= inicio);
  }
  if (filtros.fechaFin && filtros.fechaFin.trim()) {
    const fin = filtros.fechaFin.trim();
    lista = lista.filter((t) => (t.fechaReporte || '') <= fin);
  }

  // Cálculo de resumen estadístico para el reporte de daños
  const resumen = {
    total: lista.length,
    porBloque: {},
    porSala: {},
    porTipoEquipo: {},
    porEstado: {},
    porUsuario: {},
  };

  for (const t of lista) {
    resumen.porBloque[t.bloque || 'Sin bloque'] = (resumen.porBloque[t.bloque || 'Sin bloque'] || 0) + 1;
    resumen.porSala[t.sala || 'Sin sala'] = (resumen.porSala[t.sala || 'Sin sala'] || 0) + 1;
    resumen.porTipoEquipo[t.tipoEquipo || 'Otro'] = (resumen.porTipoEquipo[t.tipoEquipo || 'Otro'] || 0) + 1;
    resumen.porEstado[t.estado || 'pendiente'] = (resumen.porEstado[t.estado || 'pendiente'] || 0) + 1;
    resumen.porUsuario[t.creadorEmail || 'Anónimo'] = (resumen.porUsuario[t.creadorEmail || 'Anónimo'] || 0) + 1;
  }

  return {
    status: 200,
    data: {
      filtrosAplicados: filtros,
      resumen,
      tickets: lista,
    },
  };
}

// 6. Sincronización automática en lote luego de reconectarse a internet desde la App
function sincronizarOperacionesOffline(usuarioToken, cuerpo) {
  const operaciones = Array.isArray(cuerpo.operaciones) ? cuerpo.operaciones : [];
  const resultados = [];

  for (const op of operaciones) {
    if (op.tipo === 'CREAR_TICKET') {
      const res = crearTicket(usuarioToken, op.datos || {});
      resultados.push({ idCola: op.idCola, tipo: op.tipo, status: res.status });
    } else if (op.tipo === 'ASIGNAR_TICKET' && op.ticketId) {
      const res = asignarTicket(usuarioToken, op.ticketId, op.datos || {});
      resultados.push({ idCola: op.idCola, tipo: op.tipo, status: res.status });
    } else if (op.tipo === 'GESTIONAR_TICKET' && op.ticketId) {
      const res = gestionarTicket(usuarioToken, op.ticketId, op.datos || {});
      resultados.push({ idCola: op.idCola, tipo: op.tipo, status: res.status });
    }
  }

  const actualizados = listarTickets(usuarioToken);
  return {
    status: 200,
    data: {
      mensaje: `Sincronizadas ${resultados.length} operaciones pendientes.`,
      resultados,
      tickets: actualizados.data.tickets,
    },
  };
}

module.exports = {
  listarTickets,
  crearTicket,
  asignarTicket,
  gestionarTicket,
  consultarReportes,
  sincronizarOperacionesOffline,
};
