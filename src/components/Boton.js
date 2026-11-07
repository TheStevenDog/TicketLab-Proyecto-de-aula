import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';

// Botón animado interactivo con micro-efecto de pulsación elástica (Stitch Campus IT)
export default function Boton({ texto, alPresionar, color = '#006a63' }) {
  const escala = useRef(new Animated.Value(1)).current;

  const presionarDentro = () => {
    Animated.spring(escala, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const presionarFuera = () => {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={presionarDentro}
      onPressOut={presionarFuera}
      onPress={alPresionar}
    >
      <Animated.View
        style={[
          estilos.boton,
          { backgroundColor: color, transform: [{ scale: escala }] },
        ]}
      >
        <Text style={estilos.texto}>{texto}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
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
