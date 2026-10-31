import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { cambiarUrlApi, guardarTokenJwt, llamarApi, obtenerUrlApi } from '../config/api';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';

const ROLES_DEMO = [
  { clave: 'estudiante', nivel: 'NIVEL 1', titulo: 'Estudiante', icono: '🎓', correo: 'estudiante@ticketlab.com' },
  { clave: 'soporte', nivel: 'NIVEL 2', titulo: 'Soporte', icono: '🛠️', correo: 'soporte@ticketlab.com' },
  { clave: 'lider', nivel: 'NIVEL 3', titulo: 'Líder', icono: '📋', correo: 'lider@ticketlab.com' },
  { clave: 'admin', nivel: 'NIVEL 4', titulo: 'Admin', icono: '👑', correo: 'admin@ticketlab.com' },
];

// Pantalla de Login y Registro con diseño Stitch ("Academic Operations & Technical Triage")
export default function LoginScreen({ alAutenticar }) {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('estudiante@ticketlab.com');
  const [clave, setClave] = useState('123456');
  const [rolElegido, setRolElegido] = useState('estudiante');
  const [urlApi, setUrlApi] = useState(obtenerUrlApi());
  const [mostrarConfigRed, setMostrarConfigRed] = useState(false);

  // 1. Valida los datos antes de consultar la API
  const validar = (correo = email, pass = clave) => {
    if (!correo.includes('@') || !correo.includes('.')) {
      Alert.alert('Revisa el correo', 'Escribe un correo válido.');
      return false;
    }
    if (pass.length < 6) {
      Alert.alert('Revisa la clave', 'La clave debe tener mínimo 6 caracteres.');
      return false;
    }
    return true;
  };

  // 2. Envía credenciales a la API Node.js y guarda el JSON Web Token (JWT)
  const autenticarConApi = async (correoUsar, claveUsar, esRegistro = modoRegistro) => {
    cambiarUrlApi(urlApi);
    if (!validar(correoUsar, claveUsar)) return;

    try {
      const ruta = esRegistro ? '/api/auth/registro' : '/api/auth/login';
      const datos = await llamarApi(ruta, 'POST', {
        email: correoUsar.trim(),
        clave: claveUsar,
        nombre: nombre.trim(),
        rol: rolElegido,
      });

      guardarTokenJwt(datos.token);
      alAutenticar(datos.usuario, datos.token);
    } catch (error) {
      Alert.alert(
        'Error de acceso',
        error.message + '\nVerifica que el servidor Node.js esté activo (npm run api).'
      );
    }
  };

  // 3. Acceso directo de prueba para los 4 roles jerárquicos
  const ingresarDemoRol = (itemRol) => {
    setRolElegido(itemRol.clave);
    setEmail(itemRol.correo);
    setClave('123456');
    setModoRegistro(false);
    autenticarConApi(itemRol.correo, '123456', false);
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Barra superior Stitch: API Gateway Status */}
      <View style={estilos.barraGateway}>
        <View style={estilos.filaGateway}>
          <View style={estilos.puntoOnline} />
          <Text style={estilos.txtGateway}>API GATEWAY: ONLINE</Text>
        </View>
        <Text style={estilos.txtJwtSpec}>JWT HS256 · FIREBASE</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        {/* Cabecera Institucional Stitch */}
        <View style={estilos.cabeceraMarca}>
          <View style={estilos.iconoEscudo}>
            <Text style={estilos.iconoEscudoTxt}>🏛️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={estilos.filaNombreApp}>
              <Text style={estilos.titulo}>TicketLab</Text>
              <View style={estilos.badgeCampus}>
                <Text style={estilos.badgeCampusTxt}>CAMPUS IT</Text>
              </View>
            </View>
            <Text style={estilos.subtitulo}>
              Academic Operations & Technical Triage · API Node.js + JWT
            </Text>
          </View>
        </View>

        {/* Matriz de 4 Roles Jerárquicos (DEMO / EVAL) */}
        <View style={estilos.cajaDemos}>
          <View style={estilos.cabeceraDemos}>
            <Text style={estilos.tituloDemos}>⚡ ACCESO RÁPIDO POR JERARQUÍA (CLAVE: 123456)</Text>
            <View style={estilos.pillDemo}>
              <Text style={estilos.pillDemoTxt}>DEMO / EVAL</Text>
            </View>
          </View>

          <View style={estilos.gridRolesDemo}>
            {ROLES_DEMO.map((item) => {
              const activo = rolElegido === item.clave;
              return (
                <TouchableOpacity
                  key={item.clave}
                  style={[estilos.tarjetaRolDemo, activo && estilos.tarjetaRolDemoActiva]}
                  onPress={() => ingresarDemoRol(item)}
                >
                  <Text style={estilos.iconoRolDemo}>{item.icono}</Text>
                  <Text style={[estilos.nivelRolDemo, activo && estilos.txtBlanco]}>
                    {item.nivel}
                  </Text>
                  <Text style={[estilos.nombreRolDemo, activo && estilos.txtBlanco]}>
                    {item.titulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tarjeta Principal de Autenticación JWT */}
        <View style={estilos.tarjetaAuth}>
          {/* Selector segmentado Iniciar Sesión / Crear Cuenta */}
          <View style={estilos.selectorModo}>
            <TouchableOpacity
              style={[estilos.tabModo, !modoRegistro && estilos.tabModoActivo]}
              onPress={() => setModoRegistro(false)}
            >
              <Text style={[estilos.txtTabModo, !modoRegistro && estilos.txtTabModoActivo]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.tabModo, modoRegistro && estilos.tabModoActivo]}
              onPress={() => setModoRegistro(true)}
            >
              <Text style={[estilos.txtTabModo, modoRegistro && estilos.txtTabModoActivo]}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Banner contextual de Rol */}
          <View style={estilos.bannerContextoRol}>
            <Text style={estilos.txtContextoRol}>
              🔐 Perfil seleccionado: {rolElegido.toUpperCase()} · Emisión de token firmado por API
            </Text>
          </View>

          {modoRegistro && (
            <CampoTexto
              etiqueta="Nombre completo"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Ana Gómez"
            />
          )}

          <CampoTexto
            etiqueta="Correo institucional"
            valor={email}
            alCambiar={setEmail}
            placeholder="usuario@ticketlab.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CampoTexto
            etiqueta="Clave de acceso (mínimo 6 caracteres)"
            valor={clave}
            alCambiar={setClave}
            placeholder="••••••••"
            secureTextEntry
          />

          {modoRegistro && (
            <View style={estilos.bloqueRoles}>
              <Text style={estilos.etiquetaRol}>ROL JERÁRQUICO PARA LA CUENTA:</Text>
              <View style={estilos.filaRoles}>
                {['estudiante', 'soporte', 'lider', 'admin'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[estilos.btnRol, rolElegido === r && estilos.btnRolActivo]}
                    onPress={() => setRolElegido(r)}
                  >
                    <Text style={[estilos.txtRol, rolElegido === r && estilos.txtRolActivo]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Boton
            texto={modoRegistro ? 'Crear Cuenta y Obtener Token JWT →' : 'Ingresar y Obtener Token JWT →'}
            color="#006a63"
            alPresionar={() => autenticarConApi(email, clave, modoRegistro)}
          />
        </View>

        {/* Tarjetas inferiores de soporte y configuración de red */}
        <View style={estilos.filaFooterCards}>
          <View style={estilos.cardFooter}>
            <Text style={estilos.cardFooterLabel}>MESA DE AYUDA PRESENCIAL</Text>
            <Text style={estilos.cardFooterVal}>Bloque 3 · Lab 102</Text>
          </View>
          <TouchableOpacity
            style={estilos.cardFooter}
            onPress={() => setMostrarConfigRed(!mostrarConfigRed)}
          >
            <Text style={estilos.cardFooterLabel}>SERVIDOR API BACKEND ⚙️</Text>
            <Text style={estilos.cardFooterVal} numberOfLines={1}>
              {urlApi}
            </Text>
          </TouchableOpacity>
        </View>

        {mostrarConfigRed && (
          <View style={estilos.cajaConfigRed}>
            <CampoTexto
              etiqueta="URL del Servidor API Node.js (IP local de tu PC)"
              valor={urlApi}
              alCambiar={setUrlApi}
              placeholder="http://192.168.1.7:3000"
              autoCapitalize="none"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8f9fb', paddingTop: 34 },
  barraGateway: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaGateway: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  puntoOnline: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#16a34a' },
  txtGateway: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  txtJwtSpec: { color: '#9cf2e8', fontSize: 10, fontWeight: '800' },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 18 },
  cabeceraMarca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconoEscudo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoEscudoTxt: { fontSize: 22 },
  filaNombreApp: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 24, fontWeight: '900', color: '#00236f' },
  badgeCampus: {
    backgroundColor: '#99efe5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeCampusTxt: { fontSize: 9, fontWeight: '900', color: '#00504a' },
  subtitulo: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  cajaDemos: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cabeceraDemos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloDemos: { fontSize: 9, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  pillDemo: {
    backgroundColor: '#dce1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  pillDemoTxt: { fontSize: 8, fontWeight: '900', color: '#00236f' },
  gridRolesDemo: { flexDirection: 'row', gap: 6 },
  tarjetaRolDemo: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tarjetaRolDemoActiva: {
    backgroundColor: '#006a63',
  },
  iconoRolDemo: { fontSize: 16, marginBottom: 2 },
  nivelRolDemo: { fontSize: 8, fontWeight: '800', color: '#64748b' },
  nombreRolDemo: { fontSize: 11, fontWeight: '800', color: '#0f172a', marginTop: 1 },
  txtBlanco: { color: '#ffffff' },
  tarjetaAuth: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  selectorModo: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabModo: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabModoActivo: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  txtTabModo: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  txtTabModoActivo: { color: '#00236f', fontWeight: '900' },
  bannerContextoRol: {
    backgroundColor: '#e6f9f6',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  txtContextoRol: { fontSize: 11, fontWeight: '800', color: '#00504a' },
  bloqueRoles: { marginBottom: 12 },
  etiquetaRol: { fontSize: 10, fontWeight: '800', color: '#64748b', marginBottom: 6 },
  filaRoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btnRol: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  btnRolActivo: { backgroundColor: '#00236f' },
  txtRol: { fontSize: 11, fontWeight: '800', color: '#334155' },
  txtRolActivo: { color: '#ffffff' },
  filaFooterCards: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cardFooter: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardFooterLabel: { fontSize: 8, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  cardFooterVal: { fontSize: 11, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  cajaConfigRed: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
