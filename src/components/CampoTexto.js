import { StyleSheet, Text, TextInput, View } from 'react-native';

// Campo de texto sin bordes duros con estilo Stitch (recessed surface-container-low #F3F4F6)
export default function CampoTexto({ etiqueta, valor, alCambiar, ...props }) {
  return (
    <View style={estilos.bloque}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      <TextInput
        style={estilos.campo}
        value={valor}
        onChangeText={alCambiar}
        placeholderTextColor="#94a3b8"
        {...props}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { width: '100%', marginBottom: 12 },
  etiqueta: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    color: '#64748b',
  },
  campo: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f3f4f6',
  },
});
