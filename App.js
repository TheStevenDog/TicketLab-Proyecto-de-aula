import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { guardarTokenJwt } from './src/config/api';
import {
  alternarModoOfflineManual,
  iniciarMonitorConexion,
} from './src/services/sincronizacion';
import LoginScreen from './src/screens/LoginScreen';
import EquiposScreen from './src/screens/EquiposScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import ReportesScreen from './src/screens/ReportesScreen';

const ORDEN_PANTALLAS = ['equipos', 'tickets', 'reportes'];

function obtenerIniciales(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'TL';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// App Principal TicketLab Campus IT — Diseño Stitch + Gestos Android + Sincronización Offline
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pantalla, setPantalla] = useState('login');
  const [conectado, setConectado] = useState(true);
  const [pendientesOffline, setPendientesOffline] = useState([]);
  const [avisoSync, setAvisoSync] = useState('');

  // Referencia actualizada para usar dentro de los listeners de gestos de Android
  const estadoRef = useRef({ usuario, pantalla });
  estadoRef.current = { usuario, pantalla };

  // 1. Escucho el estado de conexión a internet para sincronizar automáticamente al reconectar
  useEffect(() => {
    const detener = iniciarMonitorConexion((estado) => {
      setConectado(estado.conectado);
      setPendientesOffline(estado.pendientes);
      if (estado.mensajeSync) {
        setAvisoSync(estado.mensajeSync);
        Alert.alert('Sincronización Automática', estado.mensajeSync);
      }
    });
    return detener;
  }, []);

  // 2. Gesto Nativo "Atrás" de Android (deslizar desde el borde de la pantalla o botón físico)
  useEffect(() => {
    const alHacerGestoAtrasAndroid = () => {
      const { usuario: usr, pantalla: pant } = estadoRef.current;
      if (!usr) return false;

      if (pant === 'tickets' || pant === 'reportes') {
        setPantalla('equipos');
        return true;
      }

      Alert.alert('Salir de TicketLab', '¿Qué deseas hacer?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: () => {
            guardarTokenJwt('');
            setUsuario(null);
            setPantalla('login');
          },
        },
        {
          text: 'Salir de la App',
          style: 'destructive',
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true;
    };

    const suscripcion = BackHandler.addEventListener(
      'hardwareBackPress',
      alHacerGestoAtrasAndroid
    );
    return () => suscripcion.remove();
  }, []);

  // 3. Gesto táctil de deslizar horizontalmente (Swipe Izquierda / Derecha) entre pantallas
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 2;
      },
      onPanResponderRelease: (_, gestureState) => {
        const pant = estadoRef.current.pantalla;
        const indiceActual = ORDEN_PANTALLAS.indexOf(pant);
        if (indiceActual === -1) return;

        if (gestureState.dx < -65 && indiceActual < ORDEN_PANTALLAS.length - 1) {
          setPantalla(ORDEN_PANTALLAS[indiceActual + 1]);
        } else if (gestureState.dx > 65 && indiceActual > 0) {
          setPantalla(ORDEN_PANTALLAS[indiceActual - 1]);
        }
      },
    })
  ).current;

  const cambiarEstadoConexion = async () => {
    await alternarModoOfflineManual();
  };

  const cerrarSesion = () => {
    guardarTokenJwt('');
    setUsuario(null);
    setPantalla('login');
  };

  // 4. Sin usuario autenticado con JWT, muestro el Login Stitch
  if (!usuario) {
    return (
      <LoginScreen
        alAutenticar={(usr) => {
          setUsuario(usr);
          setPantalla('equipos');
        }}
      />
    );
  }

  return (
    <View style={estilos.contenedorGlobal} {...panResponder.panHandlers}>
      {/* 1. Barra Superior de Estado de Red / Cola Offline (Stitch Status Strip) */}
      <View style={[estilos.barraRed, conectado ? estilos.barraOnline : estilos.barraOffline]}>
        <View style={estilos.filaIndicadorRed}>
          <View style={[estilos.puntoEstado, conectado ? estilos.puntoVerde : estilos.puntoAmbar]} />
          <Text style={estilos.txtRed} numberOfLines={1}>
            {conectado
              ? `Conectado (API JWT) · Cola (${pendientesOffline.length})`
              : `MODO OFFLINE · En cola: ${pendientesOffline.length} pendiente(s)`}
          </Text>
        </View>
        <TouchableOpacity style={estilos.btnSimularRed} onPress={cambiarEstadoConexion}>
          <Text style={estilos.txtBtnRed}>
            {conectado ? 'Probar Offline' : 'Sincronizar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Barra de Marca Stitch Campus IT */}
      <View style={estilos.barraMarca}>
        <View style={estilos.filaMarcaIzq}>
          <View style={estilos.iconoMarca}>
            <Text style={estilos.iconoMarcaTxt}>🏛️</Text>
          </View>
          <View>
            <View style={estilos.filaTituloMarca}>
              <Text style={estilos.tituloMarca}>TicketLab</Text>
              <View style={estilos.pillCampus}>
                <Text style={estilos.pillCampusTxt}>CAMPUS IT</Text>
              </View>
            </View>
            <Text style={estilos.subtituloMarca}>Academic Operations & Technical Triage</Text>
          </View>
        </View>
        <View style={estilos.avatarCirculo}>
          <Text style={estilos.avatarTxt}>{obtenerIniciales(usuario.nombre)}</Text>
        </View>
      </View>

      {/* 3. Barra de Pestañas Stitch con indicador Esmeralda (#006A63) */}
      <View style={estilos.barraTabs}>
        <TouchableOpacity
          style={[estilos.tabItem, pantalla === 'equipos' && estilos.tabItemActivo]}
          onPress={() => setPantalla('equipos')}
        >
          <Text style={[estilos.txtTab, pantalla === 'equipos' && estilos.txtTabActivo]}>
            👥 Inicio / Equipos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.tabItem, pantalla === 'tickets' && estilos.tabItemActivo]}
          onPress={() => setPantalla('tickets')}
        >
          <Text style={[estilos.txtTab, pantalla === 'tickets' && estilos.txtTabActivo]}>
            📷 Tickets y Cámara
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.tabItem, pantalla === 'reportes' && estilos.tabItemActivo]}
          onPress={() => setPantalla('reportes')}
        >
          <Text style={[estilos.txtTab, pantalla === 'reportes' && estilos.txtTabActivo]}>
            📊 Reportes
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.ayudaGestos}>
        👆 Gestos Android: Desliza a los lados para cambiar pestaña · Hacia abajo para recargar · Botón Atrás
      </Text>

      {avisoSync ? (
        <TouchableOpacity style={estilos.bannerExito} onPress={() => setAvisoSync('')}>
          <Text style={estilos.txtExito}>{avisoSync} (Toca para cerrar)</Text>
        </TouchableOpacity>
      ) : null}

      {/* 4. Contenido de la Pantalla Activa */}
      <View style={estilos.areaContenido}>
        {pantalla === 'tickets' && (
          <TicketsScreen
            usuario={usuario}
            conectado={conectado}
            alVolver={() => setPantalla('equipos')}
          />
        )}

        {pantalla === 'reportes' && (
          <ReportesScreen
            usuario={usuario}
            alVolver={() => setPantalla('equipos')}
          />
        )}

        {pantalla === 'equipos' && (
          <EquiposScreen
            usuario={usuario}
            alSalir={cerrarSesion}
            alIrATickets={() => setPantalla('tickets')}
            alIrAReportes={() => setPantalla('reportes')}
          />
        )}
      </View>

      {/* 5. Barra de Navegación Inferior Stitch (Bottom Nav Shell) */}
      <View style={estilos.barraInferior}>
        <TouchableOpacity style={estilos.navInfItem} onPress={() => setPantalla('equipos')}>
          <Text style={[estilos.navInfIcono, pantalla === 'equipos' && estilos.navInfActivo]}>👥</Text>
          <Text style={[estilos.navInfTxt, pantalla === 'equipos' && estilos.navInfActivo]}>
            Equipos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.navInfItem} onPress={() => setPantalla('tickets')}>
          <Text style={[estilos.navInfIcono, pantalla === 'tickets' && estilos.navInfActivo]}>📷</Text>
          <Text style={[estilos.navInfTxt, pantalla === 'tickets' && estilos.navInfActivo]}>
            Captura
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.navInfItem} onPress={() => setPantalla('reportes')}>
          <Text style={[estilos.navInfIcono, pantalla === 'reportes' && estilos.navInfActivo]}>📊</Text>
          <Text style={[estilos.navInfTxt, pantalla === 'reportes' && estilos.navInfActivo]}>
            Métricas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.navInfItem} onPress={cerrarSesion}>
          <Text style={estilos.navInfIconoSalir}>🚪</Text>
          <Text style={estilos.navInfTxtSalir}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorGlobal: { flex: 1, backgroundColor: '#f8f9fb', paddingTop: 34 },
  barraRed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  barraOnline: { backgroundColor: '#1e3a8a' },
  barraOffline: { backgroundColor: '#b45309' },
  filaIndicadorRed: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  puntoEstado: { width: 8, height: 8, borderRadius: 99 },
  puntoVerde: { backgroundColor: '#16a34a' },
  puntoAmbar: { backgroundColor: '#fde68a' },
  txtRed: { color: '#ffffff', fontSize: 11, fontWeight: '700', flex: 1 },
  btnSimularRed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  txtBtnRed: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  barraMarca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filaMarcaIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconoMarca: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00236f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoMarcaTxt: { fontSize: 17 },
  filaTituloMarca: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tituloMarca: { fontSize: 17, fontWeight: '900', color: '#00236f' },
  pillCampus: {
    backgroundColor: '#99efe5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  pillCampusTxt: { fontSize: 9, fontWeight: '900', color: '#00504a' },
  subtituloMarca: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  avatarCirculo: {
    width: 34,
    height: 34,
    borderRadius: 99,
    backgroundColor: '#dce1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 12, fontWeight: '900', color: '#00236f' },
  barraTabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActivo: {
    borderBottomColor: '#006a63',
    backgroundColor: '#f8fafc',
  },
  txtTab: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  txtTabActivo: { color: '#006a63' },
  ayudaGestos: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    backgroundColor: '#edeef0',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  bannerExito: { backgroundColor: '#9cf2e8', paddingVertical: 6, paddingHorizontal: 14 },
  txtExito: { color: '#00504a', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  areaContenido: { flex: 1 },
  barraInferior: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navInfItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navInfIcono: { fontSize: 15, color: '#64748b' },
  navInfTxt: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 1 },
  navInfActivo: { color: '#006a63', fontWeight: '900' },
  navInfIconoSalir: { fontSize: 15, color: '#dc2626' },
  navInfTxtSalir: { fontSize: 10, fontWeight: '700', color: '#dc2626', marginTop: 1 },
});
