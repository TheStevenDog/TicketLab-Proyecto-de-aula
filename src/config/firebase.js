// 1. Configuración de Firebase (pegada desde la consola)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAsfkeHXYKCeQRt-v7G39pPD_kYY2KDGe4",
  authDomain: "ticketlab-f4d2a.firebaseapp.com",
  projectId: "ticketlab-f4d2a",
  storageBucket: "ticketlab-f4d2a.firebasestorage.app",
  messagingSenderId: "195941715567",
  appId: "1:195941715567:web:7e52bc95cee550ecad079a",
  measurementId: "G-8GKQ0DE4FE"
};

// 2. Inicializo la app una sola vez
const app = initializeApp(firebaseConfig);

// 3. Exporto auth y db para usarlos en todas las pantallas
export const auth = getAuth(app);
export const db = getFirestore(app);
