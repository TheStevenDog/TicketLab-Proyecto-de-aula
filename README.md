# TicketLab Campus IT — Operaciones Académicas & Triaje Técnico

> **Proyecto de Desarrollo Móvil & Plataforma Web — Semanas 1 a 15 (Hito 4: De código a APK)**  
> Plataforma integral para la gestión, reporte con evidencia fotográfica, asignación jerárquica y diagnóstico de incidentes técnicos en infraestructura universitaria (salas de cómputo, proyectores, laboratorios y redes).

---

## 🚀 Despliegues en Vivo y Descargas

| Componente | Plataforma | Enlace / Acceso |
|---|---|---|
| **📱 APK Android Instalable** | Android (EAS Build) | [Descargar APK Directo (.apk)](https://expo.dev/artifacts/eas/QMQKYXRuWBFBQ8qt_dho9wCco0ZtFff6blly9qSHcyo.apk) · [Ver Build en Expo](https://expo.dev/accounts/slisedev/projects/StevenReact/builds/6a92d690-5589-4425-ad39-f115d6852a7b) |
| **💻 Consola Web & API Gateway** | Vercel (Producción) | [ticket-lab-git-main-thestevendogs-projects.vercel.app](https://ticket-lab-git-main-thestevendogs-projects.vercel.app/) |
| **🌐 Dominio Alternativo Web** | Vercel | [ticket-lab-phi.vercel.app](https://ticket-lab-phi.vercel.app/) |
| **⚙️ Estado de Salud API** | Endpoint REST | `GET /api/salud` |

---

## 🔐 Credenciales de Prueba (Jerarquía de 4 Roles)

El sistema opera bajo un modelo de control de acceso basado en roles jerárquicos (RBAC) validado mediante **JSON Web Tokens (JWT HS256)**:

| Nivel | Rol | Correo Institucional | Contraseña | Capacidades y Alcance |
|:---:|:---|:---|:---:|:---|
| **1** | **Estudiante** | `estudiante@ticketlab.com` | `123456` | Reportar incidentes con cámara, fecha automática de falla y seguimiento en tiempo real de soluciones técnicas. |
| **2** | **Soporte Técnico** | `soporte@ticketlab.com` | `123456` | Atender tickets asignados, registrar diagnósticos de hardware/software y marcar resolución. |
| **3** | **Líder de Soporte** | `lider@ticketlab.com` | `123456` | Crear cuadrillas de soporte, asignar tickets a técnicos y consultar reportes analíticos globales. |
| **4** | **Administrador** | `admin@ticketlab.com` | `123456` | Control total del campus, métricas avanzadas y modificación de roles de usuarios del sistema. |

---

## 🛠️ Stack Tecnológico

### Aplicación Móvil
- **Framework:** React Native `0.81.5` + React `19.1.0` sobre **Expo SDK 54** (`expo ~54.0.36`).
- **Diseño Visual:** Sistema de diseño Stitch ("Academic Operations & Technical Triage") con paleta institucional:
  - Deep Navy (`#00236F`)
  - Academic Teal (`#006A63`)
  - Mint Accent (`#99EFE5` / `#9CF2E8`)
- **Animaciones:** Motor nativo `Animated` a 60 FPS con aceleración por hardware (rebote elástico en botones, transiciones suaves de pestaña con fade + slide, y pulsos de conectividad).
- **Entrada y Teclado:** `KeyboardAvoidingView` + `automaticallyAdjustKeyboardInsets` para desplazamiento automático hacia el campo activo.
- **Cámara y Multimedia:** `expo-image-picker` para captura de evidencia con la cámara física del teléfono y selección desde galería.
- **Persistencia y Resiliencia:** Sincronización offline automática con almacenamiento local y reintentos en segundo plano al recuperar conexión.

### Backend y Consola Web
- **Entorno:** Node.js en arquitectura Serverless desplegada en **Vercel** (`@vercel/node` + `@vercel/static`).
- **Seguridad:** Tokens de sesión firmados con **JWT (RFC 7519)** con validación de cabecera `Authorization: Bearer <token>` y middleware jerárquico.
- **Base de Datos:** Motor híbrido conectado con **Firebase (Authentication + Firestore)** con respaldo local de contingencia (`respaldo.json`) que garantiza 100% de disponibilidad.
- **Consola Web:** Interfaz web completa con Tailwind CSS, Material Symbols, captura de fotos con WebCam vía `MediaDevices` y exportación visual de reportes.

---

## 📂 Estructura del Repositorio

```
├── App.js                     # Enrutador principal, gestos Android y transiciones animadas
├── app.json                   # Configuración de identidad Expo, paquete Android (com.ticketlab.campus)
├── eas.json                   # Perfil preview para compilación de APK instalable
├── vercel.json                # Configuración de despliegue Serverless en Vercel
├── backend/
│   ├── server.js              # Servidor HTTP REST y despachador de archivos estáticos
│   ├── config/
│   │   └── firebase.js        # Inicialización tolerante a fallos de Firebase + respaldo local
│   ├── controllers/
│   │   ├── authController.js  # Login, registro con JWT, gestión de roles y equipos
│   │   └── ticketsController.js # Flujo de tickets, asignación, diagnósticos y reportes
│   ├── middlewares/
│   │   └── auth.js            # Validación de token JWT y verificación de permisos jerárquicos
│   ├── utils/
│   │   └── jwt.js             # Codificación, firma HMAC-SHA256 y jerarquía de roles
│   └── public/                # Consola Web completa (HTML, CSS Stitch y JS)
└── src/
    ├── components/
    │   ├── Boton.js           # Botón con micro-animación de pulsación elástica
    │   ├── CampoTexto.js      # Campo estilizado con colores recessed Stitch
    │   └── TarjetaTicket.js   # Tarjeta de incidente con animación de entrada y panel de triaje
    ├── config/
    │   ├── api.js             # Cliente HTTP centralizado para consumo de API con JWT
    │   └── servidorUrl.js     # URL base apuntando a la API en producción en Vercel
    ├── screens/
    │   ├── LoginScreen.js     # Pantalla de acceso, registro y selector de roles con animación
    │   ├── EquiposScreen.js   # Inicio, perfil de usuario y creación de cuadrillas
    │   ├── TicketsScreen.js   # Captura con cámara, fecha automática y formulario anti-teclado
    │   └── ReportesScreen.js  # Analítica con KPIs y filtros combinados (bloque, sala, fecha, equipo)
    └── services/
        ├── camara.js          # Integración de cámara física y galería
        └── sincronizacion.js  # Monitor de red y cola de operaciones offline
```

---

## 📋 Módulos y Funcionalidades del Sistema

### M1 · Autenticación y Emisión de JWT
- Registro e inicio de sesión seguro validando contraseñas y emitiendo un JSON Web Token con duración de 24 horas.
- Persistencia de sesión segura en la aplicación y consola web.

### M2 · Cuadrillas y Equipos de Soporte
- Creación de equipos de atención clasificados por laboratorio o bloque institucional.
- Listado de integrantes y líder a cargo.

### M3 · Gestión de Tickets y Captura Fotográfica
- Reporte detallado de daños: título, bloque, sala, tipo de equipo (computador, proyector, periférico, red, mobiliario), prioridad y evidencia en foto.
- **Fecha de hallazgo automática:** Se coloca automáticamente la fecha actual (`YYYY-MM-DD`) en que se detectó la falla.
- **Manejo inteligente de teclado:** Al tocar cualquier campo, la pantalla se desplaza suavemente hacia arriba evitando que el teclado tape el texto.

### M4 · Asignación y Diagnóstico Jerárquico
- El **Líder de Soporte** o Administrador asigna el ticket a un técnico disponible.
- El **Técnico de Soporte** actualiza el estado a `En Proceso` o `Resuelto` y redacta la respuesta técnica o diagnóstico.
- El **Estudiante** visualiza en tiempo real la solución brindada a su reporte.

### M5 · Analítica y Reportes de Daños
- Filtros cruzados por bloque, aula/sala, tipo de equipo, usuario y rango de fechas.
- Indicadores numéricos (KPIs): Total de fallas, bloques afectados y salas con incidentes.

### M6 · Modo Offline y Sincronización
- Posibilidad de crear tickets o gestionar diagnósticos en modo avión o sin red Wi-Fi universitaria.
- Las acciones se guardan en la cola local del dispositivo y se transmiten automáticamente a la API al recuperar internet.

---

## 🏃 Cómo Ejecutar el Proyecto Localmente

### Opción A: Probar con Expo Go en el Teléfono
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar Expo
npx expo start

# 3. Escanear el código QR con la app Expo Go en Android o iOS
```

### Opción B: Ejecutar la API y Consola Web Local
```bash
# Arrancar servidor Node.js en puerto 3000
npm run api
# Abrir en el navegador: http://localhost:3000
```

### Opción C: Compilar el APK con EAS Build
```bash
# Iniciar sesión en Expo CLI
eas login

# Lanzar la compilación del APK en la nube
eas build -p android --profile preview
```

---

## 🎓 Criterios de Evaluación Cumplidos (Semana 15 - Hito 4)
- [x] **APK Instalable:** Generado exitosamente en formato `.apk` con EAS Build y distribuible a cualquier teléfono Android físico.
- [x] **API en la Nube:** Servidor desplegado en Vercel con HTTPS sin depender de IPs locales.
- [x] **Seguridad:** Ninguna clave privada expuesta en el APK del cliente.
- [x] **Tolerancia a Fallos:** Caché local y respaldo automático en caso de intermitencias de red.
- [x] **Diseño y Experiencia:** Sistema Stitch aplicado rigurosamente con transiciones animadas fluidas y usabilidad adaptada a teclados móviles.
