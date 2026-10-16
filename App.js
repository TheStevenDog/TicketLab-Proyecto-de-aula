import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/config/firebase';
import LoginScreen from './src/screens/LoginScreen';
import EquiposScreen from './src/screens/EquiposScreen';
import TableroScreen from './src/screens/TableroScreen';

// App de TicketLab: controla la sesión y qué pantalla se ve
export default function App() {
  // 1. usuario = sesión de Firebase; pantalla = qué se muestra; cargando = espera inicial
  const [usuario, setUsuario] = useState(null);
  const [pantalla, setPantalla] = useState('login');
  const [cargando, setCargando] = useState(true);
  const [equipo, setEquipo] = useState(null); // equipo elegido para ver su tablero

  // 2. Escucho la sesión de Firebase (una sola vez al abrir la app)
  useEffect(() => {
    const cerrar = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuario(usuarioFirebase);
      setPantalla(usuarioFirebase ? 'equipos' : 'login');
      setCargando(false);
    });
    return cerrar; // limpio el listener al desmontar
  }, []);

  // 3. Pantalla de espera mientras Firebase responde (evita parpadeos)
  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={estilos.textoCarga}>Cargando TicketLab…</Text>
      </View>
    );
  }

  // 4. Sin sesión muestro el login
  if (!usuario) return <LoginScreen />;

  // 5. Con sesión: si el usuario eligió equipo voy al tablero, si no, a la lista de equipos
  if (pantalla === 'tablero' && equipo) {
    return (
      <TableroScreen
        equipo={equipo}
        alVolver={() => setPantalla('equipos')}
      />
    );
  }

  return (
    <EquiposScreen
      usuario={usuario}
      alSalir={() => signOut(auth)}
      alElegirEquipo={(e) => {
        setEquipo(e);
        setPantalla('tablero');
      }}
    />
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  textoCarga: { color: '#4b5563', marginTop: 8, marginBottom: 16, textAlign: 'center' },
});
