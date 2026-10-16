import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';

// Pantalla de inicio de sesión y registro (Firebase Authentication)
export default function LoginScreen() {
  // 1. Modo del formulario: false = ingresar, true = crear cuenta
  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');

  // 2. Valido los campos antes de llamar a Firebase
  const validar = () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Revisa el correo', 'Escribe un correo válido, por ejemplo ana@correo.com');
      return false;
    }
    if (clave.length < 6) {
      Alert.alert('Revisa la clave', 'La clave debe tener mínimo 6 caracteres.');
      return false;
    }
    return true;
  };

  // 3. Llamo a Firebase: crear cuenta o iniciar sesión
  const continuar = async () => {
    if (!validar()) return;
    try {
      if (modoRegistro) {
        await createUserWithEmailAndPassword(auth, email.trim(), clave);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), clave);
      }
      // Si funciona, App.js recibe el usuario por onAuthStateChanged y cambia la pantalla sola
    } catch (error) {
      // 4. Traduzco los errores comunes a mensajes en español
      let mensaje = 'No se pudo continuar. Intenta de nuevo.';
      if (error.code === 'auth/email-already-in-use') mensaje = 'Ese correo ya tiene una cuenta.';
      if (error.code === 'auth/invalid-credential') mensaje = 'Correo o clave incorrectos.';
      if (error.code === 'auth/network-request-failed') mensaje = 'Sin conexión a internet.';
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
        mensaje = 'Falta habilitar "Correo y contraseña" en Authentication (consola de Firebase).';
      }
      Alert.alert('Error', mensaje + '\n(' + error.code + ')');
    }
  };

  // 5. Cambio entre ingresar y registro (limpio la clave para no confundirme)
  const cambiarModo = () => {
    setModoRegistro(!modoRegistro);
    setClave('');
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={estilos.titulo}>TicketLab</Text>
      <Text style={estilos.subtitulo}>Soporte técnico del campus</Text>

      <CampoTexto
        etiqueta="Correo"
        valor={email}
        alCambiar={setEmail}
        placeholder="ana@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoTexto
        etiqueta="Clave (mínimo 6 caracteres)"
        valor={clave}
        alCambiar={setClave}
        placeholder="••••••••"
        secureTextEntry
      />

      <Boton texto={modoRegistro ? 'Crear cuenta' : 'Ingresar'} alPresionar={continuar} />

      <TouchableOpacity onPress={cambiarModo}>
        <Text style={estilos.enlace}>
          {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#1d4ed8', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 28 },
  enlace: { color: '#1d4ed8', textAlign: 'center', fontSize: 14, marginTop: 6 },
});
