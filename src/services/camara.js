// Servicio de Cámara Real para Android/iOS (expo-image-picker SDK 54) y Web
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// 1. Abre la cámara física del teléfono Android/iOS y devuelve la foto en Base64
export async function tomarFotoConCamara() {
  // Soporte para navegador Web
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const archivo = e.target.files && e.target.files[0];
        if (!archivo) return resolve(null);
        const lector = new FileReader();
        lector.onload = (ev) => resolve(ev.target.result);
        lector.readAsDataURL(archivo);
      };
      input.click();
    });
  }

  try {
    // 1. Solicitar permiso de cámara en Android / iOS
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (permiso.status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Debes permitir el acceso a la cámara en tu teléfono para tomar la foto del daño.'
      );
      return null;
    }

    // 2. Lanzar la cámara nativa de Android (en SDK 54 mediaTypes debe ser un arreglo ['images'])
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.4,
      base64: true,
    });

    if (resultado.canceled || !resultado.assets || !resultado.assets.length) {
      return null;
    }

    const foto = resultado.assets[0];
    if (foto.base64) {
      return `data:image/jpeg;base64,${foto.base64}`;
    }
    return foto.uri;
  } catch (error) {
    Alert.alert('Error al abrir la cámara', error.message || 'No se pudo iniciar la cámara.');
    return null;
  }
}

// 2. Permite seleccionar una foto existente desde la galería del teléfono Android
export async function elegirFotoDeGaleria() {
  try {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permiso.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Permite el acceso a tus fotos para adjuntar evidencia.');
      return null;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.4,
      base64: true,
    });

    if (resultado.canceled || !resultado.assets || !resultado.assets.length) {
      return null;
    }

    const foto = resultado.assets[0];
    if (foto.base64) {
      return `data:image/jpeg;base64,${foto.base64}`;
    }
    return foto.uri;
  } catch (error) {
    Alert.alert('Error al abrir galería', error.message);
    return null;
  }
}
