// Lógica del Cliente Web TicketLab Campus IT — Diseño Stitch + API Node.js con JWT
let tokenJwt = localStorage.getItem('ticketlab_jwt') || '';
let usuarioActual = JSON.parse(localStorage.getItem('ticketlab_usuario') || 'null');
let modoRegistro = false;
let listaTecnicosCache = [];
let fotoCapturadaBase64 = '';
let streamCamara = null;

const ETIQUETAS_ROL = {
  estudiante: 'Estudiante / Usuario',
  soporte: 'Soporte Técnico',
  lider: 'Líder de Soporte',
  admin: 'Administrador',
};

const NIVELES_ROL = {
  estudiante: 'Nivel 1 · Estudiante',
  soporte: 'Nivel 2 · Soporte',
  lider: 'Nivel 3 · Líder',
  admin: 'Nivel 4 · Admin',
};

function obtenerIniciales(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'TL';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// 1. Petición centralizada a la API con JSON Web Token (JWT)
async function peticionApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(tokenJwt ? { Authorization: 'Bearer ' + tokenJwt } : {}),
    },
  };
  if (cuerpo) opciones.body = JSON.stringify(cuerpo);

  const respuesta = await fetch(ruta, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la petición a la API');
  }
  return datos;
}

// 2. Autenticación rápida de demostración por rol (clave 123456)
async function loginDemo(emailDemo, rolKey = 'estudiante') {
  document.querySelectorAll('.demo-rol-btn').forEach((btn) => {
    btn.classList.remove('rol-seleccionado');
  });
  const btnActivo = document.getElementById('demoBtn_' + rolKey);
  if (btnActivo) btnActivo.classList.add('rol-seleccionado');

  document.getElementById('inputEmail').value = emailDemo;
  document.getElementById('inputClave').value = '123456';
  establecerModoAuth(false);
  await procesarAuth();
}

function establecerModoAuth(esRegistro) {
  modoRegistro = Boolean(esRegistro);
  document.getElementById('bloqueNombreRegistro').classList.toggle('oculto', !modoRegistro);
  document.getElementById('bloqueRolRegistro').classList.toggle('oculto', !modoRegistro);

  const tabLogin = document.getElementById('tabLoginMode');
  const tabRegister = document.getElementById('tabRegisterMode');
  if (tabLogin && tabRegister) {
    if (modoRegistro) {
      tabRegister.className =
        'flex-1 py-2.5 text-xs font-bold rounded-lg bg-white text-primary shadow-sm transition-all';
      tabLogin.className =
        'flex-1 py-2.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 transition-all';
    } else {
      tabLogin.className =
        'flex-1 py-2.5 text-xs font-bold rounded-lg bg-white text-primary shadow-sm transition-all';
      tabRegister.className =
        'flex-1 py-2.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 transition-all';
    }
  }

  const txtBtn = document.getElementById('txtSubmitAuth');
  if (txtBtn) {
    txtBtn.textContent = modoRegistro
      ? 'Crear cuenta y obtener JWT'
      : 'Ingresar y Obtener Token JWT';
  }
  const btnToggle = document.getElementById('btnToggleModo');
  if (btnToggle) {
    btnToggle.textContent = modoRegistro
      ? '¿Ya tienes cuenta? Inicia sesión'
      : '¿No tienes cuenta? Regístrate';
  }
}

function alternarModoAuth() {
  establecerModoAuth(!modoRegistro);
}

async function procesarAuth() {
  const email = document.getElementById('inputEmail').value.trim();
  const clave = document.getElementById('inputClave').value;
  const nombre = document.getElementById('inputNombre').value.trim();
  const rol = document.getElementById('inputRolRegistro').value;

  try {
    const ruta = modoRegistro ? '/api/auth/registro' : '/api/auth/login';
    const datos = await peticionApi(ruta, 'POST', { email, clave, nombre, rol });
    tokenJwt = datos.token;
    usuarioActual = datos.usuario;
    localStorage.setItem('ticketlab_jwt', tokenJwt);
    localStorage.setItem('ticketlab_usuario', JSON.stringify(usuarioActual));
    iniciarVistaAutenticada();
  } catch (error) {
    alert(error.message);
  }
}

function cerrarSesion() {
  detenerCamaraWeb();
  tokenJwt = '';
  usuarioActual = null;
  localStorage.removeItem('ticketlab_jwt');
  localStorage.removeItem('ticketlab_usuario');
  document.getElementById('vistaApp').classList.add('oculto');
  document.getElementById('vistaLogin').classList.remove('oculto');
}

// 3. Configura la interfaz Stitch según la jerarquía del rol del usuario en el JWT
async function iniciarVistaAutenticada() {
  if (!tokenJwt || !usuarioActual) return;

  document.getElementById('vistaLogin').classList.add('oculto');
  document.getElementById('vistaApp').classList.remove('oculto');

  document.getElementById('txtUsuarioActual').textContent =
    `${usuarioActual.nombre} (${usuarioActual.email})`;
  document.getElementById('badgeRolActual').textContent =
    NIVELES_ROL[usuarioActual.rol] || ETIQUETAS_ROL[usuarioActual.rol] || usuarioActual.rol;

  const avatar = document.getElementById('avatarInicialesHeader');
  if (avatar) {
    avatar.textContent = obtenerIniciales(usuarioActual.nombre);
  }

  // Mostrar pestaña de administración de roles solo al Administrador
  document
    .getElementById('tabBtn_usuarios')
    .classList.toggle('oculto', usuarioActual.rol !== 'admin');

  // Explicación contextual según el rol
  const textosAyuda = {
    estudiante:
      'Vista Estudiante (Nivel 1): Reporta daños con evidencia fotográfica y recibe en tiempo real la respuesta técnica del equipo de soporte.',
    soporte:
      'Vista Soporte Técnico (Nivel 2): Gestiona el estado de los tickets asignados por el Líder y registra el diagnóstico y solución técnica.',
    lider:
      'Vista Líder de Soporte (Nivel 3): Supervisa todos los incidentes del campus, asigna técnicos de soporte y gestiona diagnósticos.',
    admin:
      'Vista Administrador (Nivel 4): Control total de asignaciones, reportes analíticos de daños, equipos de soporte y jerarquía de roles.',
  };
  document.getElementById('ayudaJerarquia').textContent =
    textosAyuda[usuarioActual.rol] || '';

  // Si es Líder o Admin, precargamos la lista de técnicos para el selector de asignación
  if (usuarioActual.rol === 'lider' || usuarioActual.rol === 'admin') {
    try {
      const resTec = await peticionApi('/api/usuarios/tecnicos');
      listaTecnicosCache = resTec.usuarios || [];
    } catch (e) {
      listaTecnicosCache = [];
    }
  }

  await cargarTicketsWeb();
}

function cambiarTab(nombreTab) {
  ['tickets', 'reportes', 'equipos', 'usuarios'].forEach((t) => {
    const sec = document.getElementById('seccion_' + t);
    const btn = document.getElementById('tabBtn_' + t);
    if (sec) sec.classList.toggle('oculto', t !== nombreTab);
    if (btn) btn.classList.toggle('activo', t === nombreTab);
  });

  if (nombreTab === 'tickets') cargarTicketsWeb();
  if (nombreTab === 'reportes') consultarReportesWeb();
  if (nombreTab === 'equipos') cargarEquiposWeb();
  if (nombreTab === 'usuarios') cargarUsuariosAdminWeb();
}

// 4. Integración con la Cámara desde la Web (MediaDevices + compresión en Canvas)
async function iniciarCamaraWeb() {
  const video = document.getElementById('videoCamara');
  const btnFoto = document.getElementById('btnTomarFotoWeb');
  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = streamCamara;
    video.classList.remove('oculto');
    btnFoto.classList.remove('oculto');
  } catch (error) {
    alert('No se pudo abrir la cámara web directamente. Usa el botón "Galería / Archivo".');
  }
}

function capturarFotoCamaraWeb() {
  const video = document.getElementById('videoCamara');
  const canvas = document.getElementById('canvasCamara');
  const preview = document.getElementById('previewFoto');
  const contenedorPrev = document.getElementById('contenedorPreviewWeb');

  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  fotoCapturadaBase64 = canvas.toDataURL('image/jpeg', 0.5);
  preview.src = fotoCapturadaBase64;
  if (contenedorPrev) contenedorPrev.classList.remove('oculto');
  detenerCamaraWeb();
}

function detenerCamaraWeb() {
  if (streamCamara) {
    streamCamara.getTracks().forEach((t) => t.stop());
    streamCamara = null;
  }
  const video = document.getElementById('videoCamara');
  const btnFoto = document.getElementById('btnTomarFotoWeb');
  if (video) video.classList.add('oculto');
  if (btnFoto) btnFoto.classList.add('oculto');
}

function cargarFotoArchivo(evento) {
  const archivo = evento.target.files && evento.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('canvasCamara');
      canvas.width = 480;
      canvas.height = Math.round((img.height / img.width) * 480) || 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      fotoCapturadaBase64 = canvas.toDataURL('image/jpeg', 0.5);
      const preview = document.getElementById('previewFoto');
      const contenedorPrev = document.getElementById('contenedorPreviewWeb');
      preview.src = fotoCapturadaBase64;
      if (contenedorPrev) contenedorPrev.classList.remove('oculto');
    };
    img.src = e.target.result;
  };
  lector.readAsDataURL(archivo);
}

function quitarFotoWeb() {
  fotoCapturadaBase64 = '';
  const preview = document.getElementById('previewFoto');
  const contenedorPrev = document.getElementById('contenedorPreviewWeb');
  if (preview) preview.src = '';
  if (contenedorPrev) contenedorPrev.classList.add('oculto');
}

// 5. Crear Ticket desde la Web
async function crearTicketWeb() {
  const titulo = document.getElementById('tktTitulo').value.trim();
  const bloque = document.getElementById('tktBloque').value;
  const sala = document.getElementById('tktSala').value.trim();
  const tipoEquipo = document.getElementById('tktTipoEquipo').value;
  const prioridad = document.getElementById('tktPrioridad').value;
  const descripcion = document.getElementById('tktDescripcion').value.trim();
  const fechaLimite = document.getElementById('tktFechaLimite').value;

  try {
    await peticionApi('/api/tickets', 'POST', {
      titulo,
      bloque,
      sala,
      tipoEquipo,
      prioridad,
      descripcion,
      fechaLimite,
      fotoBase64: fotoCapturadaBase64,
    });

    document.getElementById('tktTitulo').value = '';
    document.getElementById('tktSala').value = '';
    document.getElementById('tktDescripcion').value = '';
    document.getElementById('tktFechaLimite').value = '';
    quitarFotoWeb();

    await cargarTicketsWeb();
    alert('Reporte de daño creado correctamente.');
  } catch (error) {
    alert(error.message);
  }
}

function actualizarKpisGlobales(lista) {
  const totalEl = document.getElementById('kpiTotalTickets');
  const b1El = document.getElementById('kpiBloque1');
  const b2El = document.getElementById('kpiBloque2');
  const b3El = document.getElementById('kpiBloque3');
  const b4El = document.getElementById('kpiBloque4');
  const badgeSidebar = document.getElementById('badgeSidebarTickets');

  const conteoBloque = { 'Bloque 1': 0, 'Bloque 2': 0, 'Bloque 3': 0, 'Bloque 4': 0 };
  (lista || []).forEach((t) => {
    if (conteoBloque[t.bloque] !== undefined) {
      conteoBloque[t.bloque] += 1;
    }
  });

  if (totalEl) totalEl.textContent = (lista || []).length;
  if (b1El) b1El.textContent = conteoBloque['Bloque 1'];
  if (b2El) b2El.textContent = conteoBloque['Bloque 2'];
  if (b3El) b3El.textContent = conteoBloque['Bloque 3'];
  if (b4El) b4El.textContent = conteoBloque['Bloque 4'];
  if (badgeSidebar) badgeSidebar.textContent = (lista || []).length;
}

// 6. Cargar y renderizar Tickets con el diseño Stitch y controles según Jerarquía de Rol
async function cargarTicketsWeb() {
  try {
    const datos = await peticionApi('/api/tickets');
    const lista = datos.tickets || [];
    document.getElementById('tituloListaTickets').textContent = `Tickets Registrados (${lista.length})`;
    actualizarKpisGlobales(lista);
    renderizarListaTickets(lista, document.getElementById('contenedorListaTickets'), true);
  } catch (error) {
    alert(error.message);
  }
}

function renderizarListaTickets(lista, contenedor, mostrarControles = true) {
  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="bg-surface-container-low rounded-xl p-8 text-center border border-dashed border-slate-200">
        <span class="material-symbols-outlined text-slate-400 text-3xl mb-2">inbox</span>
        <p class="text-sm font-semibold text-slate-500">No hay tickets registrados para mostrar en esta vista.</p>
      </div>
    `;
    return;
  }

  const puedeAsignar = usuarioActual.rol === 'lider' || usuarioActual.rol === 'admin';
  const puedeGestionar =
    usuarioActual.rol === 'soporte' ||
    usuarioActual.rol === 'lider' ||
    usuarioActual.rol === 'admin';

  contenedor.innerHTML = lista
    .map((t) => {
      const codigoCorto = '#TK-' + String(t.id || '0000').slice(-4).toUpperCase();
      const opcionesTecnicos = listaTecnicosCache
        .map(
          (tec) =>
            `<option value="${tec.uid}" ${t.tecnicoUid === tec.uid ? 'selected' : ''}>${tec.nombre} (${tec.email})</option>`
        )
        .join('');

      return `
        <article class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <!-- Cabecera de tarjeta Stitch -->
          <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">${codigoCorto}</span>
                <span class="text-[11px] text-slate-400">• ${t.fechaReporte || 'Hoy'}</span>
                ${
                  t.fechaLimite
                    ? `<span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Límite: ${t.fechaLimite}</span>`
                    : ''
                }
              </div>
              <h4 class="font-headline text-base font-extrabold text-slate-900 leading-snug">${t.titulo}</h4>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="badge-stitch prio-${t.prioridad}">${t.prioridad}</span>
              <span class="badge-stitch est-${t.estado}">${(t.estado || 'pendiente').replace('_', ' ')}</span>
            </div>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed mb-4">${t.descripcion}</p>

          <!-- Cuerpo: Miniatura + Cuadrícula de Metadatos 2x2 -->
          <div class="flex flex-col sm:flex-row gap-4 items-start bg-surface-container-low p-3.5 rounded-xl mb-3">
            ${
              t.fotoBase64
                ? `<img src="${t.fotoBase64}" class="w-full sm:w-28 h-24 object-cover rounded-lg border border-slate-200 shrink-0" alt="Evidencia del daño" />`
                : `<div class="w-full sm:w-24 h-20 rounded-lg bg-slate-200/70 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <span class="material-symbols-outlined text-xl">image</span>
                    <span class="text-[9px] font-bold uppercase mt-0.5">Sin Foto</span>
                  </div>`
            }
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 w-full text-xs">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-base">location_on</span>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Ubicación</p>
                  <p class="font-bold text-slate-800">${t.bloque} · ${t.sala}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">devices</span>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Tipo de Equipo</p>
                  <p class="font-bold text-slate-800">${t.tipoEquipo}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-500 text-base">person</span>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Reportado por</p>
                  <p class="font-semibold text-slate-700 truncate">${t.creadorNombre} (${t.creadorEmail})</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600 text-base">engineering</span>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Técnico Asignado</p>
                  <p class="font-bold text-slate-800">${t.tecnicoNombre ? `${t.tecnicoNombre}` : 'Sin asignar'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Burbuja de Respuesta de Soporte Técnico (Stitch Secondary Container) -->
          ${
            t.respuestaTecnica
              ? `<div class="bg-secondary-container/45 border-l-4 border-secondary rounded-r-xl p-3.5 mb-3">
                  <div class="flex items-center gap-1.5 text-[11px] font-extrabold text-on-secondary-container uppercase tracking-wider mb-1">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    Respuesta de Soporte Técnico
                  </div>
                  <p class="text-xs text-slate-800 font-medium leading-relaxed">${t.respuestaTecnica}</p>
                </div>`
              : `<div class="flex items-center gap-1.5 text-[11px] text-slate-400 italic mb-2">
                  <span class="material-symbols-outlined text-sm">schedule</span>
                  Pendiente de diagnóstico o respuesta técnica.
                </div>`
          }

          <!-- Controles de Jerarquía (Líder asigna / Técnico gestiona) -->
          ${
            mostrarControles && (puedeAsignar || puedeGestionar)
              ? `<div class="pt-3 mt-2 border-t border-slate-100 space-y-2.5">
                  ${
                    puedeAsignar
                      ? `<div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <div class="flex items-center gap-1.5 text-[11px] font-bold text-primary min-w-[130px]">
                            <span class="material-symbols-outlined text-sm">supervisor_account</span>
                            Asignar Técnico:
                          </div>
                          <select id="selTec_${t.id}" class="flex-1 bg-surface-container-low border-none rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                            <option value="">-- Seleccionar Técnico de Soporte --</option>
                            ${opcionesTecnicos}
                          </select>
                          <button onclick="asignarTecnicoWeb('${t.id}')" class="bg-primary hover:bg-primary-container text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                            Asignar Técnico
                          </button>
                        </div>`
                      : ''
                  }

                  ${
                    puedeGestionar
                      ? `<div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <select id="selEst_${t.id}" class="bg-surface-container-low border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-800">
                            <option value="pendiente" ${t.estado === 'pendiente' ? 'selected' : ''}>Estado: Pendiente</option>
                            <option value="asignado" ${t.estado === 'asignado' ? 'selected' : ''}>Estado: Asignado</option>
                            <option value="en_proceso" ${t.estado === 'en_proceso' ? 'selected' : ''}>Estado: En Proceso</option>
                            <option value="resuelto" ${t.estado === 'resuelto' ? 'selected' : ''}>Estado: Resuelto</option>
                          </select>
                          <input type="text" id="txtResp_${t.id}" value="${(t.respuestaTecnica || '').replace(/"/g, '&quot;')}" placeholder="Escribe diagnóstico o solución para el usuario..." class="flex-1 bg-surface-container-low border-none rounded-lg px-3 py-2 text-xs text-slate-800" />
                          <button onclick="gestionarTicketWeb('${t.id}')" class="bg-secondary hover:bg-campus-emerald-dark text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                            Guardar Gestión
                          </button>
                        </div>`
                      : ''
                  }
                </div>`
              : ''
          }
        </article>
      `;
    })
    .join('');
}

// 7. Acciones de Líder (Asignar) y Técnico (Gestionar / Responder)
async function asignarTecnicoWeb(ticketId) {
  const select = document.getElementById('selTec_' + ticketId);
  const tecnicoUid = select ? select.value : '';
  if (!tecnicoUid) return alert('Selecciona un técnico de soporte.');

  try {
    await peticionApi(`/api/tickets/${ticketId}/asignar`, 'PUT', { tecnicoUid });
    await cargarTicketsWeb();
  } catch (error) {
    alert(error.message);
  }
}

async function gestionarTicketWeb(ticketId) {
  const estado = document.getElementById('selEst_' + ticketId).value;
  const respuestaTecnica = document.getElementById('txtResp_' + ticketId).value;

  try {
    await peticionApi(`/api/tickets/${ticketId}/gestionar`, 'PUT', {
      estado,
      respuestaTecnica,
    });
    await cargarTicketsWeb();
    alert('Ticket actualizado y respuesta enviada al usuario.');
  } catch (error) {
    alert(error.message);
  }
}

// 8. Reportes de Daños con filtros (Usuario, Sala, Bloque, Rango de fechas, Tipo de equipo)
async function consultarReportesWeb() {
  const params = new URLSearchParams({
    usuario: document.getElementById('repUsuario').value.trim(),
    bloque: document.getElementById('repBloque').value,
    sala: document.getElementById('repSala').value.trim(),
    tipoEquipo: document.getElementById('repTipoEquipo').value,
    fechaInicio: document.getElementById('repFechaInicio').value,
    fechaFin: document.getElementById('repFechaFin').value,
  });

  try {
    const datos = await peticionApi('/api/reportes?' + params.toString());
    document.getElementById('contadorReporte').textContent = datos.resumen.total;
    renderizarResumenReporte(datos.resumen);
    renderizarListaTickets(
      datos.tickets || [],
      document.getElementById('contenedorResultadosReporte'),
      false
    );
  } catch (error) {
    alert(error.message);
  }
}

function limpiarFiltrosReporte() {
  document.getElementById('repUsuario').value = '';
  document.getElementById('repBloque').value = '';
  document.getElementById('repSala').value = '';
  document.getElementById('repTipoEquipo').value = '';
  document.getElementById('repFechaInicio').value = '';
  document.getElementById('repFechaFin').value = '';
  consultarReportesWeb();
}

function renderizarResumenReporte(resumen) {
  const bloqueHtml = (titulo, icono, mapa) => {
    const entradas = Object.entries(mapa || {});
    const filas = entradas
      .map(
        ([k, v]) => `
        <div class="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-none text-xs">
          <span class="font-medium text-slate-600 truncate pr-2">${k}</span>
          <span class="font-extrabold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">${v}</span>
        </div>`
      )
      .join('');
    return `
      <div class="bg-surface-container-low rounded-xl p-4 border border-slate-200/70">
        <div class="flex items-center gap-1.5 mb-2.5">
          <span class="material-symbols-outlined text-secondary text-base">${icono}</span>
          <h4 class="font-headline text-xs font-extrabold uppercase tracking-wider text-slate-700">${titulo}</h4>
        </div>
        ${filas || '<p class="text-xs text-slate-400 italic">Sin datos registrados</p>'}
      </div>
    `;
  };

  document.getElementById('contenedorResumenReportes').innerHTML =
    bloqueHtml('Daños por Bloque', 'domain', resumen.porBloque) +
    bloqueHtml('Daños por Sala / Lab', 'meeting_room', resumen.porSala) +
    bloqueHtml('Por Tipo de Equipo', 'devices', resumen.porTipoEquipo) +
    bloqueHtml('Por Usuario Reportante', 'group', resumen.porUsuario);
}

// 9. Equipos de Soporte y Gestión de Roles (Administrador) con estilo Stitch
async function cargarEquiposWeb() {
  try {
    const datos = await peticionApi('/api/equipos');
    const contenedor = document.getElementById('contenedorEquipos');
    const equipos = datos.equipos || [];
    if (!equipos.length) {
      contenedor.innerHTML =
        '<p class="text-xs text-slate-400 italic p-4">No hay cuadrillas de soporte registradas aún.</p>';
      return;
    }

    contenedor.innerHTML = equipos
      .map((eq) => {
        const miembros = String(eq.integrantes || '')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);
        const avatares = miembros
          .slice(0, 4)
          .map(
            (m) =>
              `<span class="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[10px] inline-flex items-center justify-center border-2 border-white -ml-1.5 first:ml-0" title="${m}">${obtenerIniciales(m)}</span>`
          )
          .join('');

        return `
          <div class="bg-surface-container-low rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/60 px-2 py-0.5 rounded-full">Guardia Activa</span>
                <span class="text-[10px] text-slate-400">${eq.creadoEn || 'Activo'}</span>
              </div>
              <h4 class="font-headline text-sm font-extrabold text-slate-900 mt-1">${eq.nombre}</h4>
              <p class="text-xs text-slate-600 mt-1">${eq.integrantes}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div class="flex items-center">${avatares}</div>
              <span class="text-[11px] font-bold text-slate-500">${miembros.length} integrante(s)</span>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    alert(error.message);
  }
}

async function crearEquipoWeb() {
  const nombre = document.getElementById('eqNombre').value.trim();
  const integrantes = document.getElementById('eqIntegrantes').value.trim();
  try {
    await peticionApi('/api/equipos', 'POST', { nombre, integrantes });
    document.getElementById('eqNombre').value = '';
    document.getElementById('eqIntegrantes').value = '';
    await cargarEquiposWeb();
  } catch (error) {
    alert(error.message);
  }
}

async function cargarUsuariosAdminWeb() {
  try {
    const datos = await peticionApi('/api/usuarios');
    const contenedor = document.getElementById('contenedorUsuariosAdmin');
    contenedor.innerHTML = (datos.usuarios || [])
      .map(
        (u) => `
        <div class="bg-surface-container-low rounded-xl p-4 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
              ${obtenerIniciales(u.nombre)}
            </div>
            <div>
              <h4 class="font-headline text-sm font-extrabold text-slate-900">${u.nombre}</h4>
              <p class="text-xs text-slate-500">${u.email}</p>
              <span class="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                ${NIVELES_ROL[u.rol] || u.rol}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <select id="rolUsr_${u.uid}" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
              <option value="estudiante" ${u.rol === 'estudiante' ? 'selected' : ''}>Nivel 1 · Estudiante</option>
              <option value="soporte" ${u.rol === 'soporte' ? 'selected' : ''}>Nivel 2 · Soporte Técnico</option>
              <option value="lider" ${u.rol === 'lider' ? 'selected' : ''}>Nivel 3 · Líder de Soporte</option>
              <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Nivel 4 · Administrador</option>
            </select>
            <button onclick="cambiarRolWeb('${u.uid}')" class="bg-primary hover:bg-primary-container text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">
              Actualizar Rol
            </button>
          </div>
        </div>
      `
      )
      .join('');
  } catch (error) {
    alert(error.message);
  }
}

async function cambiarRolWeb(uid) {
  const nuevoRol = document.getElementById('rolUsr_' + uid).value;
  try {
    await peticionApi(`/api/usuarios/${uid}/rol`, 'PUT', { rol: nuevoRol });
    await cargarUsuariosAdminWeb();
    alert('Rol actualizado correctamente.');
  } catch (error) {
    alert(error.message);
  }
}

// Si ya había un JWT guardado en el navegador, restauramos la sesión al abrir la página
if (tokenJwt && usuarioActual) {
  iniciarVistaAutenticada();
}
