// Cliente HTTP centralizado para consumir la API Node.js usando JSON Web Token (JWT)
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SERVIDOR_API_URL } from './servidorUrl';

function detectarUrlInicial() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.hostname.includes('vercel.app')) {
      return window.location.origin;
    }
  }
  // En celular (Expo Go o APK) conectamos directamente al servidor desplegado en Vercel
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (SERVIDOR_API_URL) {
    return SERVIDOR_API_URL.replace(/\/+$/, '');
  }
  return 'https://ticket-lab-git-main-thestevendogs-projects.vercel.app';
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
