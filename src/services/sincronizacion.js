// Servicio de Cola Offline y Sincronización Automática al reconectarse a Internet
import NetInfo from '@react-native-community/netinfo';
import { llamarApi, obtenerTokenJwt } from '../config/api';

let colaPendientes = [];
let conectadoReal = true;
let modoOfflineManual = false; // Permite demostrar en clase sin desconectar Expo Go
let suscriptores = [];

function notificarCambio(mensajeSync = '') {
  const estado = {
    conectado: conectadoReal && !modoOfflineManual,
    pendientes: [...colaPendientes],
    mensajeSync,
  };
  suscriptores.forEach((fn) => fn(estado));
}

// 1. Escucha automáticamente los cambios de red del celular con NetInfo
export function iniciarMonitorConexion(alCambiarEstado) {
  suscriptores.push(alCambiarEstado);
  notificarCambio();

  const desuscribir = NetInfo.addEventListener(async (state) => {
    const estabaConectado = conectadoReal && !modoOfflineManual;
    conectadoReal = Boolean(state.isConnected);
    const ahoraConectado = conectadoReal && !modoOfflineManual;

    notificarCambio();

    // Si acaba de recuperar internet y hay operaciones pendientes, sincroniza sola
    if (!estabaConectado && ahoraConectado && colaPendientes.length > 0) {
      await sincronizarPendientesAhora();
    }
  });

  return () => {
    suscriptores = suscriptores.filter((fn) => fn !== alCambiarEstado);
    desuscribir();
  };
}

// 2. Permite activar/desactivar simulación de corte de internet para pruebas en clase
export async function alternarModoOfflineManual() {
  modoOfflineManual = !modoOfflineManual;
  notificarCambio();

  // Al volver a conectarse, dispara la sincronización automática hacia la API
  if (!modoOfflineManual && conectadoReal && colaPendientes.length > 0) {
    return await sincronizarPendientesAhora();
  }
  return null;
}

export function hayConexionActiva() {
  return conectadoReal && !modoOfflineManual;
}

// 3. Guarda una operación (crear, asignar o gestionar ticket) en la cola local cuando no hay red
export function guardarOperacionOffline(tipo, datos, ticketId = null) {
  const item = {
    idCola: 'off_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    tipo, // 'CREAR_TICKET' | 'ASIGNAR_TICKET' | 'GESTIONAR_TICKET'
    datos,
    ticketId,
    fechaCola: new Date().toISOString(),
  };
  colaPendientes.push(item);
  notificarCambio();
  return item;
}

export function obtenerColaPendientes() {
  return [...colaPendientes];
}

// 4. Envía automáticamente todas las operaciones encoladas al endpoint /api/tickets/sincronizar
export async function sincronizarPendientesAhora() {
  if (!obtenerTokenJwt() || colaPendientes.length === 0 || !hayConexionActiva()) {
    return null;
  }

  const lote = [...colaPendientes];
  try {
    const respuesta = await llamarApi('/api/tickets/sincronizar', 'POST', {
      operaciones: lote,
    });
    colaPendientes = [];
    notificarCambio(`✓ ${lote.length} operación(es) sincronizada(s) con el servidor`);
    return respuesta;
  } catch (error) {
    return null;
  }
}
