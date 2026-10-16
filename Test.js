import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Steven es una maquina feliz</Text>
      <Text>Steven es una demasiado feliz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#ca1a1a',
    alignItems: 'right',
    justifyContent: 'right',
  },
});