# AGENTS.md - Proyecto Universidad (Nivel Principiante)

> Somos principiantes en desarrollo móvil. Es para una clase de universidad.
> Prioridad: código SENCILLO, fácil de explicar en clase. Nada avanzado.

## 1. Stack exacto (no cambiar sin avisar)

- Expo SDK 54 (`expo ~54.0.36`) — Docs obligatorias: https://docs.expo.dev/versions/v54.0.0/
- React 19.1.0 + React Native 0.81.5
- Node.js >= 20.19
- Backend: Firebase (Authentication + Firestore) con SDK JS web (`firebase`), NO `react-native-firebase` (evita configuración nativa compleja).
- Sin TypeScript, sin Expo Router, sin Redux/Context complejo. Solo `useState`.

Antes de escribir código, leer la doc versionada v54.0.0. Instalar paquetes Expo solo con: `npx expo install <paquete>`.

## 2. Reglas para código sencillo

1. Componentes funcionales + `useState` únicamente. Nada de `useReducer`, custom hooks complejos o HOCs.
2. Un archivo por pantalla en `src/screens/`: `LoginScreen.js`, `EquiposScreen.js`, `TicketsScreen.js`.
3. Navegación SIN librerías: un estado `pantalla` en `App.js` (`login | equipos | tickets`) con render condicional. Así se explica en 2 minutos.
4. Estilos solo con `StyleSheet`, estilos simples centrados. Sin librerías UI.
5. Comentarios en español, una línea por bloque importante: `// 1. Leo email y clave`, etc.
6. Validaciones básicas con `if` + `Alert.alert()`. Sin Formik/Yup.
7. Firebase en un solo archivo: `src/config/firebase.js`. Exporta `auth` y `db`.
8. Nombres en español para variables de negocio: `equipo`, `ticket`, `titulo`, `prioridad`.
9. No tocar carpetas nativas (`android/`, `ios/`). Probar siempre en Expo Go: `npx expo start`.
10. Máximo 100 líneas por archivo. Si crece, dividir en un componente en `src/components/`.

## 3. Estructura del proyecto

```
App.js                    // estado "pantalla" + cambio entre Login/Equipos/Tickets
index.js                  // no tocar (registerRootComponent)
src/config/firebase.js    // initializeApp + getAuth + getFirestore
src/screens/LoginScreen.js
src/screens/EquiposScreen.js
src/screens/TicketsScreen.js
```

## 4. Los 3 módulos a implementar (alcance actual)

### M1. Auth con Firebase Authentication
- `createUserWithEmailAndPassword(auth, email, password)` para registro.
- `signInWithEmailAndPassword(auth, email, password)` para login.
- `signOut(auth)` para salir.
- Activar en consola Firebase: Authentication > Método de acceso > Correo/contraseña.

### M2. Equipos de soporte (Firestore colección `equipos`)
- Campos: `{ nombre: string, integrantes: string, creadoEn: Date }`.
- `integrantes` como texto simple separado por comas ("Ana, Luis"). No subcolecciones.
- Operaciones: `addDoc(collection(db,"equipos"), ...)` y `getDocs()` para listar.

### M3. Tickets (Firestore colección `tickets`)
- Campos: `{ titulo, descripcion, ubicacion, prioridad: "baja|media|alta", fechaLimite: "YYYY-MM-DD", creadoEn }`.
- `prioridad` con 3 botones simples. `fechaLimite` como `TextInput` con placeholder `YYYY-MM-DD` (sin date-picker para mantenerlo simple).
- Operaciones: `addDoc` + `getDocs` + `FlatList` para mostrar.

## 5. Configuración Firebase (pasos que debe seguir el alumno)

1. `npx expo install firebase`
2. Crear proyecto en console.firebase.google.com > agregar app Web > copiar `firebaseConfig`.
3. Pegar config en `src/config/firebase.js`.
4. Activar Authentication (Email/Password) y Firestore (modo prueba para la clase).
5. Probar: `npx expo start` > escanear QR con Expo Go.

## 6. Comandos útiles

- `npx expo start` — iniciar (Expo Go)
- `npx expo install firebase` — instalar Firebase
- `npm list expo react react-native` — verificar versiones

## 7. Qué NO hacer

- No usar `expo-router`, `@react-navigation`, `react-native-firebase`, `AsyncStorage`, ni persistencia custom (fuera del alcance de clase).
- No usar TypeScript ni archivos `.tsx`.
- No agregar notificaciones, mapas, cámara ni permisos (Expo SDK extra) en esta fase.
