import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';

// Pantalla de equipos de soporte: crear y listar (colección "equipos")
export default function EquiposScreen({ usuario, alSalir, alElegirEquipo }) {
  const [nombre, setNombre] = useState('');
  const [integrantes, setIntegrantes] = useState('');
  const [lista, setLista] = useState([]);

  // 1. Cargo los equipos de Firestore una vez al abrir la pantalla
  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      const consulta = query(collection(db, 'equipos'), orderBy('creadoEn', 'desc'));
      const snapshot = await getDocs(consulta);
      // 2. Guardo solo los datos necesarios (con el id del documento)
      setLista(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los equipos. (' + error.code + ')');
    }
  };

  // 3. Valido los campos antes de tocar Firestore
  const validar = () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del equipo.');
      return false;
    }
    const correos = integrantes.split(',').map((c) => c.trim()).filter(Boolean);
    if (correos.length === 0 || correos.some((c) => !c.includes('@'))) {
      Alert.alert('Revisa los integrantes', 'Separa los correos con coma: ana@correo.com, luis@correo.com');
      return false;
    }
    return true;
  };

  // 4. Guardo el equipo en Firestore, limpio el formulario y recargo la lista
  const crearEquipo = async () => {
    if (!validar()) return;
    try {
      await addDoc(collection(db, 'equipos'), {
        nombre: nombre.trim(),
        integrantes: integrantes.trim(),
        creadorUid: usuario.uid,
        creadoEn: serverTimestamp(),
      });
      setNombre('');
      setIntegrantes('');
      cargarEquipos();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el equipo. (' + error.code + ')');
    }
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>TicketLab</Text>
        <Text style={estilos.correo}>{usuario.email}</Text>
        <TouchableOpacity onPress={alSalir}>
          <Text style={estilos.salir}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.seccion}>Crear equipo</Text>
      <CampoTexto
        etiqueta="Nombre del equipo"
        valor={nombre}
        alCambiar={setNombre}
        placeholder="Equipo soporte TIC"
      />
      <CampoTexto
        etiqueta="Integrantes (correos separados por coma)"
        valor={integrantes}
        alCambiar={setIntegrantes}
        placeholder="ana@correo.com, luis@correo.com"
        autoCapitalize="none"
      />
      <Boton texto="Crear equipo" alPresionar={crearEquipo} />

      <Text style={estilos.seccion}>Equipos ({lista.length})</Text>
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.tarjeta} onPress={() => alElegirEquipo(item)}>
            <Text style={estilos.nombreEquipo}>{item.nombre}</Text>
            <Text style={estilos.integrantes}>{item.integrantes}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={estilos.vacio}>Aún no hay equipos. Crea el primero arriba.</Text>}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f3f4f6', paddingHorizontal: 20, paddingTop: 48 },
  encabezado: { alignItems: 'center', marginBottom: 12 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#1d4ed8' },
  correo: { color: '#4b5563', marginTop: 2 },
  salir: { color: '#dc2626', marginTop: 4 },
  seccion: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 12, marginBottom: 8 },
  tarjeta: { backgroundColor: '#ffffff', borderRadius: 8, padding: 14, marginBottom: 8 },
  nombreEquipo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  integrantes: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  vacio: { color: '#6b7280', textAlign: 'center', marginTop: 10 },
});
