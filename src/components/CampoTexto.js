import { StyleSheet, Text, TextInput, View } from 'react-native';

// Campo de texto con etiqueta, reutilizable en todas las pantallas
export default function CampoTexto({ etiqueta, valor, alCambiar, ...props }) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={estilos.campo}
        value={valor}
        onChangeText={alCambiar}
        {...props}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { width: '100%', marginBottom: 12 },
  etiqueta: { fontSize: 14, marginBottom: 4, color: '#374151' },
  campo: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
});
