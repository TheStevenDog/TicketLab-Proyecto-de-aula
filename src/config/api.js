// Cliente HTTP centralizado para consumir la API Node.js usando JSON Web Token (JWT)
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SERVIDOR_API_URL } from './servidorUrl';

function detectarUrlInicial() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname || 'localhost'}:3000`;
  }
  // En Expo Go en celular, tomamos automáticamente la IP de la laptop desde hostUri
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';
  if (hostUri && hostUri.includes(':')) {
    const ipLaptop = hostUri.split(':')[0];
    if (ipLaptop && !ipLaptop.includes('exp.direct')) {
      return `http://${ipLaptop}:3000`;
    }
  }
  return SERVIDOR_API_URL || 'http://localhost:3000';
}

let urlBase = detectarUrlInicial();
let tokenActual = '';

export function obtenerUrlApi() {
  return urlBase;
}

export function cambiarUrlApi(nuevaUrl) {
  if (nuevaUrl && nuevaUrl.trim()) {
    urlBase = nuevaUrl.trim().replace(/\/+$/, '');
  }
}

export function guardarTokenJwt(token) {
  tokenActual = token || '';
}

export function obtenerTokenJwt() {
  return tokenActual;
}

// Envía peticiones a la API Node.js adjuntando el header Authorization: Bearer <JWT>
export async function llamarApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
    },
  };

  if (cuerpo) {
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(`${urlBase}${ruta}`, opciones);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Error al comunicarse con la API');
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}
