// Configuración de Firebase en el Backend (Node.js) con respaldo local automático
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Permite conexión tras proxy/firewall universitario

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require('firebase/auth');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAsfkeHXYKCeQRt-v7G39pPD_kYY2KDGe4',
  authDomain: 'ticketlab-f4d2a.firebaseapp.com',
  projectId: 'ticketlab-f4d2a',
  storageBucket: 'ticketlab-f4d2a.firebasestorage.app',
  messagingSenderId: '195941715567',
  appId: '1:195941715567:web:7e52bc95cee550ecad079a',
};

// 1. Inicializo Firebase en el servidor Node.js
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Archivo de respaldo local para garantizar disponibilidad y rapidez en clase
// En Vercel (Serverless / AWS Lambda) el sistema de archivos principal es de solo lectura, por lo que usamos /tmp
const RUTA_RESPALDO = process.env.VERCEL
  ? path.join(require('os').tmpdir(), 'respaldo.json')
  : path.join(__dirname, '..', 'datos', 'respaldo.json');

const DATOS_INICIALES = {
  usuarios: [
    {
      uid: 'usr_admin_1',
      nombre: 'Carlos Administrador',
      email: 'admin@ticketlab.com',
      clave: '123456',
      rol: 'admin',
      creadoEn: '2026-10-20',
    },
    {
      uid: 'usr_lider_1',
      nombre: 'Laura Líder Soporte',
      email: 'lider@ticketlab.com',
      clave: '123456',
      rol: 'lider',
      creadoEn: '2026-10-20',
    },
    {
      uid: 'usr_soporte_1',
      nombre: 'Andrés Técnico',
      email: 'soporte@ticketlab.com',
      clave: '123456',
      rol: 'soporte',
      creadoEn: '2026-10-20',
    },
    {
      uid: 'usr_soporte_2',
      nombre: 'Diana Técnica Red',
      email: 'diana@ticketlab.com',
      clave: '123456',
      rol: 'soporte',
      creadoEn: '2026-10-20',
    },
    {
      uid: 'usr_estudiante_1',
      nombre: 'Mateo Estudiante',
      email: 'estudiante@ticketlab.com',
      clave: '123456',
      rol: 'estudiante',
      creadoEn: '2026-10-20',
    },
  ],
  equipos: [
    {
      id: 'eq_tic_1',
      nombre: 'Soporte Laboratorios Cómputo',
      integrantes: 'soporte@ticketlab.com, diana@ticketlab.com',
      liderEmail: 'lider@ticketlab.com',
      creadoEn: '2026-10-20',
    },
    {
      id: 'eq_audiovisual_2',
      nombre: 'Soporte Audiovisuales y Redes',
      integrantes: 'diana@ticketlab.com',
      liderEmail: 'lider@ticketlab.com',
      creadoEn: '2026-10-21',
    },
  ],
  tickets: [
    {
      id: 'tkt_demo_1',
      titulo: 'Computador 08 no enciende pantalla',
      descripcion: 'La torre enciende el ventilador pero el monitor dice sin señal HDMI.',
      bloque: 'Bloque 3',
      sala: 'Sala 204',
      tipoEquipo: 'Computador',
      prioridad: 'alta',
      estado: 'en_proceso',
      fechaReporte: '2026-10-22',
      fechaLimite: '2026-10-25',
      creadorUid: 'usr_estudiante_1',
      creadorNombre: 'Mateo Estudiante',
      creadorEmail: 'estudiante@ticketlab.com',
      tecnicoUid: 'usr_soporte_1',
      tecnicoNombre: 'Andrés Técnico',
      tecnicoEmail: 'soporte@ticketlab.com',
      asignadoPor: 'lider@ticketlab.com',
      respuestaTecnica: 'Se revisó la memoria RAM y se está cambiando el cable HDMI.',
      fotoBase64: '',
      creadoEn: 1761130000000,
    },
    {
      id: 'tkt_demo_2',
      titulo: 'Proyector con imagen borrosa y lámpara parpadeando',
      descripcion: 'El video beam del aula se apaga a los 10 minutos de encendido.',
      bloque: 'Bloque 1',
      sala: 'Aula 105',
      tipoEquipo: 'Proyector',
      prioridad: 'media',
      estado: 'pendiente',
      fechaReporte: '2026-10-24',
      fechaLimite: '2026-10-28',
      creadorUid: 'usr_estudiante_1',
      creadorNombre: 'Mateo Estudiante',
      creadorEmail: 'estudiante@ticketlab.com',
      tecnicoUid: null,
      tecnicoNombre: null,
      tecnicoEmail: null,
      asignadoPor: null,
      respuestaTecnica: '',
      fotoBase64: '',
      creadoEn: 1761300000000,
    },
  ],
};

// 2. Lee o inicializa el almacenamiento local sincronizado con Firebase
function leerDatosLocales() {
  try {
    if (!fs.existsSync(RUTA_RESPALDO)) {
      fs.mkdirSync(path.dirname(RUTA_RESPALDO), { recursive: true });
      fs.writeFileSync(RUTA_RESPALDO, JSON.stringify(DATOS_INICIALES, null, 2), 'utf8');
      return JSON.parse(JSON.stringify(DATOS_INICIALES));
    }
    return JSON.parse(fs.readFileSync(RUTA_RESPALDO, 'utf8'));
  } catch (e) {
    return JSON.parse(JSON.stringify(DATOS_INICIALES));
  }
}

function guardarDatosLocales(datos) {
  try {
    fs.mkdirSync(path.dirname(RUTA_RESPALDO), { recursive: true });
    fs.writeFileSync(RUTA_RESPALDO, JSON.stringify(datos, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando respaldo local:', e.message);
  }
}

// 3. Autentica el servicio backend con Firebase para tener permiso en Firestore
let firebaseConectado = false;
async function conectarServicioFirebase() {
  try {
    await signInWithEmailAndPassword(auth, 'admin@ticketlab.com', '123456').catch(() =>
      createUserWithEmailAndPassword(auth, 'admin@ticketlab.com', '123456')
    );
    firebaseConectado = true;
    console.log('✓ Backend autenticado con Firebase Auth y Firestore');
    await sincronizarDesdeFirestore();
  } catch (error) {
    console.log('ℹ Modo híbrido activo (usando caché local + Firebase cuando esté disponible):', error.code || error.message);
  }
}

// 4. Sincroniza colecciones entre Firestore y el servidor
async function sincronizarDesdeFirestore() {
  if (!firebaseConectado) return;
  try {
    const datos = leerDatosLocales();
    // Subir usuarios iniciales a Firestore si aún no están
    for (const u of datos.usuarios) {
      const { clave, ...usuarioPublico } = u;
      await setDoc(doc(db, 'usuarios', u.uid), usuarioPublico, { merge: true }).catch(() => {});
    }
    // Leer tickets existentes en Firestore y combinarlos
    const snapTickets = await getDocs(collection(db, 'tickets'));
    const idsLocales = new Set(datos.tickets.map((t) => t.id));
    snapTickets.forEach((docSnap) => {
      const d = docSnap.data();
      if (!idsLocales.has(docSnap.id)) {
        datos.tickets.push({
          id: docSnap.id,
          titulo: d.titulo || 'Ticket sin título',
          descripcion: d.descripcion || '',
          bloque: d.bloque || d.ubicacion || 'Bloque 1',
          sala: d.sala || d.ubicacion || 'Sala General',
          tipoEquipo: d.tipoEquipo || 'Computador',
          prioridad: d.prioridad || 'media',
          estado: d.estado || 'pendiente',
          fechaReporte: d.fechaReporte || new Date().toISOString().slice(0, 10),
          fechaLimite: d.fechaLimite || '',
          creadorUid: d.creadorUid || 'usr_estudiante_1',
          creadorNombre: d.creadorNombre || 'Estudiante',
          creadorEmail: d.creadorEmail || 'estudiante@ticketlab.com',
          tecnicoUid: d.tecnicoUid || null,
          tecnicoNombre: d.tecnicoNombre || null,
          tecnicoEmail: d.tecnicoEmail || null,
          respuestaTecnica: d.respuestaTecnica || '',
          fotoBase64: d.fotoBase64 || '',
          creadoEn: typeof d.creadoEn === 'number' ? d.creadoEn : Date.now(),
        });
      }
    });
    guardarDatosLocales(datos);
  } catch (e) {
    // Continuar con respaldo local si Firestore demora
  }
}

// 5. Guarda o actualiza un documento en Firestore en segundo plano sin bloquear la respuesta HTTP
async function replicarEnFirestore(nombreColeccion, idDoc, datosDoc) {
  if (!firebaseConectado) return;
  try {
    const copia = { ...datosDoc };
    delete copia.clave; // Nunca guardar clave en texto plano en Firestore
    await setDoc(doc(db, nombreColeccion, idDoc), copia, { merge: true });
  } catch (e) {
    // Si falla la red momentáneamente, queda en el respaldo local del backend
  }
}

module.exports = {
  auth,
  db,
  leerDatosLocales,
  guardarDatosLocales,
  conectarServicioFirebase,
  replicarEnFirestore,
};
