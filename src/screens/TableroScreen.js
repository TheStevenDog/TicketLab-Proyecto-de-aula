import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Tablero de tickets del equipo (la M3 lo completa con Firestore)
export default function TableroScreen({ equipo, alVolver }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Tablero: {equipo.nombre}</Text>
      <Text style={estilos.texto}>Aquí se mostrarán los tickets del equipo (M3).</Text>
      <TouchableOpacity onPress={alVolver}>
        <Text style={estilos.volver}>← Volver a equipos</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  texto: { color: '#4b5563', marginBottom: 16, textAlign: 'center' },
  volver: { color: '#1d4ed8', fontSize: 16 },
});
