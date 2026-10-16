# TicketLab — Proyecto 8 · Desarrollo Móvil (Tecnológico de Antioquia)

Aplicación móvil para **reportar y dar seguimiento a fallas técnicas del campus** (aulas, salas de cómputo, equipos): los usuarios crean tickets con ubicación y prioridad, y el equipo de soporte los atiende desde su tablero.

**Equipo:** _[nombre de los integrantes]_

---

## Stack tecnológico

| Tecnología | Versión | Para qué |
|---|---|---|
| Expo | SDK 54 | Estructura y ejecución de la app en Expo Go |
| React Native | 0.81.5 | Interfaz de la app (con React 19.1.0) |
| Firebase Authentication | SDK JS web | Registro e inicio de sesión con correo y clave |
| Firebase Firestore | SDK JS web | Base de datos en la nube (equipos y tickets) |
| @react-native-community/netinfo | compatible SDK 54 | Detección de conexión (modo offline, 2do entregable) |

Sin librerías de navegación ni de UI: la navegación usa un estado `pantalla` en `App.js` y los estilos son `StyleSheet` puro.

## Requisitos

- Node.js 20.19 o superior
- Celular con la app **Expo Go** instalada (Play Store / App Store)
- PC y celular con acceso a internet

## Cómo ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor de desarrollo (elegir UNO)
npm run start:tunel   # recomendado: funciona por internet, sin problemas de red
npm run start:lan     # alternativa: detecta sola la IP de tu red local

# 3. Escanear el QR con Expo Go (o ingresar la dirección exp://... manualmente)
```

> Si el celular queda cargando en modo LAN, usa el modo túnel (`npm run start:tunel`).

## Estructura del proyecto

```
App.js                        // Sesión de Firebase + estado "pantalla" (login | equipos | tablero)
index.js                      // Registro de la app (no se modifica)
scripts/iniciar-lan.js        // Arranca Expo detectando la IP local automáticamente
src/
  config/firebase.js          // Configuración y exportación de auth y db
  components/
    CampoTexto.js             // Campo de texto con etiqueta (reutilizable)
    Boton.js                  // Botón simple (reutilizable)
  screens/
    LoginScreen.js            // Registro e inicio de sesión (M1)
    EquiposScreen.js          // Crear y listar equipos de soporte (M2)
    TableroScreen.js          // Tablero de tickets del equipo (M3, en construcción)
docs/investigacion/           // Evidencias del trabajo de campo (Parte A)
```

## Módulos

| Módulo | Estado | Descripción |
|---|---|---|
| M1 · Autenticación | ✅ | Registro, inicio y cierre de sesión con Firebase Authentication |
| M2 · Equipos | ✅ | Crear equipos de soporte y listarlos (Firestore, colección `equipos`) |
| M3 · Tickets y tablero | ⏳ En construcción | Crear tickets y verlos en el tablero del equipo con estado "pendiente" |
| Segundo entregable | ⏳ | Asignar responsable, estados del ticket, "Mis tickets", filtros, modo offline y FE-01 |

## Configuración de Firebase

1. Crear proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Métodos de acceso → habilitar "Correo y contraseña"**.
3. **Firestore Database → Crear base de datos** (modo prueba, solo para la clase).
4. Copiar la configuración de la app web en `src/config/firebase.js`.

> La clave (`apiKey`) que aparece en el código es pública por diseño en las apps web de Firebase; la protección real la dan Authentication y las reglas de Firestore.

## Investigación de campo (Parte A)

El trabajo de campo en el campus (entrevistas, observación, hallazgos y matriz de trazabilidad) vive en la carpeta `docs/investigacion/`, con el informe de hallazgos y la matriz que define las funcionalidades emergentes FE-01 y FE-02.

---

Proyecto del taller de Desarrollo Móvil — [Virtual TDEA](https://virtual.tdea.edu.co)
