import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// Botón simple reutilizable (color por defecto azul)
export default function Boton({ texto, alPresionar, color = '#1d4ed8' }) {
  return (
    <TouchableOpacity style={[estilos.boton, { backgroundColor: color }]} onPress={alPresionar}>
      <Text style={estilos.texto}>{texto}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  texto: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
