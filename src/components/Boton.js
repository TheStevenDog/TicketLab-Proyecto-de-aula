import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// Botón reutilizable con estilo Stitch Campus IT (Esmeralda Institucional por defecto)
export default function Boton({ texto, alPresionar, color = '#006a63' }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[estilos.boton, { backgroundColor: color }]}
      onPress={alPresionar}
    >
      <Text style={estilos.texto}>{texto}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  texto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
