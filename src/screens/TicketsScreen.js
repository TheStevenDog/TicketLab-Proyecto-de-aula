import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { llamarApi } from '../config/api';
import { elegirFotoDeGaleria, tomarFotoConCamara } from '../services/camara';
import {
  guardarOperacionOffline,
  hayConexionActiva,
  sincronizarPendientesAhora,
} from '../services/sincronizacion';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';
import TarjetaTicket from '../components/TarjetaTicket';

const BLOQUES = ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4'];
const TIPOS_EQUIPO = ['Computador', 'Proyector', 'Red', 'Periférico', 'Mobiliario/Aire'];

// Pantalla de Tickets y Cámara con diseño Stitch ("Academic Operations & Technical Triage")
export default function TicketsScreen({ usuario, conectado, alVolver }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [bloque, setBloque] = useState('Bloque 1');
  const [sala, setSala] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('Computador');
  const [prioridad, setPrioridad] = useState('media');
  // Fecha en que se encontró la falla: se calcula y coloca automáticamente al crear el reporte
  const [fechaFalla, setFechaFalla] = useState(new Date().toISOString().slice(0, 10));
  const [fotoBase64, setFotoBase64] = useState('');
  const [lista, setLista] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [recargando, setRecargando] = useState(false);

  // 1. Cargo tickets y técnicos desde la API al entrar o al reconectar internet
  useEffect(() => {
    if (conectado) {
      cargarDatosDesdeApi();
    }
  }, [conectado]);

  const cargarDatosDesdeApi = async () => {
    try {
      const resTickets = await llamarApi('/api/tickets');
      setLista(resTickets.tickets || []);

      if (usuario.rol === 'lider' || usuario.rol === 'admin') {
        const resTec = await llamarApi('/api/usuarios/tecnicos');
        setTecnicos(resTec.usuarios || []);
      }
    } catch (error) {
      // Si no hay red, mantenemos la lista en memoria
    }
  };

  // Gesto Android Pull-to-Refresh (deslizar hacia abajo para actualizar y sincronizar)
  const alDeslizarParaRecargar = async () => {
    setRecargando(true);
    await sincronizarPendientesAhora();
    await cargarDatosDesdeApi();
    setRecargando(false);
  };

  // 2. Captura foto con la cámara física del teléfono Android o desde la galería
  const abrirCamaraTelefono = async () => {
    const foto = await tomarFotoConCamara();
    if (foto) setFotoBase64(foto);
  };

  const abrirGaleriaTelefono = async () => {
    const foto = await elegirFotoDeGaleria();
    if (foto) setFotoBase64(foto);
  };

  // 3. Crea un ticket en la API o lo guarda en la cola Offline si no hay internet
  const crearTicket = async () => {
    if (!titulo.trim() || !descripcion.trim() || !sala.trim()) {
      Alert.alert('Campos incompletos', 'Completa título, descripción y sala.');
      return;
    }

    const fechaAutomatica = fechaFalla.trim() || new Date().toISOString().slice(0, 10);
    const nuevoPayload = {
      idTemporal: 'tkt_local_' + Date.now(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      bloque,
      sala: sala.trim(),
      tipoEquipo,
      prioridad,
      fechaFalla: fechaAutomatica,
      fechaReporte: fechaAutomatica,
      fotoBase64,
    };

    if (!hayConexionActiva()) {
      guardarOperacionOffline('CREAR_TICKET', nuevoPayload);
      setLista([
        {
          id: nuevoPayload.idTemporal,
          ...nuevoPayload,
          estado: 'pendiente',
          creadorNombre: usuario.nombre,
          creadorEmail: usuario.email,
          fechaReporte: fechaAutomatica,
          sincronizado: false,
        },
        ...lista,
      ]);
      Alert.alert(
        'Guardado Offline',
        'Sin internet: el ticket se guardó en el celular y se sincronizará automáticamente al reconectarte.'
      );
    } else {
      try {
        await llamarApi('/api/tickets', 'POST', nuevoPayload);
        await cargarDatosDesdeApi();
        Alert.alert('Éxito', 'Reporte de daño enviado a la API.');
      } catch (error) {
        guardarOperacionOffline('CREAR_TICKET', nuevoPayload);
        Alert.alert('Encolado', 'Se guardó en la cola para sincronizar al recuperar red.');
      }
    }

    setTitulo('');
    setDescripcion('');
    setSala('');
    setFechaFalla(new Date().toISOString().slice(0, 10));
    setFotoBase64('');
  };

  // 4. Líder de soporte o Admin asigna el ticket a un técnico
  const asignarTecnico = async (ticketId, tecnico) => {
    if (!hayConexionActiva()) {
      guardarOperacionOffline('ASIGNAR_TICKET', { tecnicoUid: tecnico.uid }, ticketId);
      setLista(
        lista.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                tecnicoUid: tecnico.uid,
                tecnicoNombre: tecnico.nombre,
                estado: 'asignado',
                sincronizado: false,
              }
            : t
        )
      );
      return Alert.alert('Asignado Offline', 'Se sincronizará automáticamente al volver internet.');
    }
    try {
      await llamarApi(`/api/tickets/${ticketId}/asignar`, 'PUT', { tecnicoUid: tecnico.uid });
      cargarDatosDesdeApi();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // 5. Técnico de soporte gestiona el ticket y envía respuesta al usuario
  const gestionarTicket = async (ticketId, nuevoEstado, respuestaTecnica) => {
    if (!hayConexionActiva()) {
      guardarOperacionOffline(
        'GESTIONAR_TICKET',
        { estado: nuevoEstado, respuestaTecnica },
        ticketId
      );
      setLista(
        lista.map((t) =>
          t.id === ticketId
            ? { ...t, estado: nuevoEstado, respuestaTecnica, sincronizado: false }
            : t
        )
      );
      return Alert.alert('Gestión Offline', 'Se enviará automáticamente al recuperar internet.');
    }
    try {
      await llamarApi(`/api/tickets/${ticketId}/gestionar`, 'PUT', {
        estado: nuevoEstado,
        respuestaTecnica,
      });
      cargarDatosDesdeApi();
      Alert.alert('Actualizado', 'Estado y respuesta técnica guardados.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      {/* Sub-barra de navegación Stitch */}
      <View style={estilos.barraSuperior}>
        <TouchableOpacity style={estilos.btnVolver} onPress={alVolver}>
          <Text style={estilos.volver}>← Volver al Menú</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.btnToggleForm}
          onPress={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <Text style={estilos.toggleForm}>
            {mostrarFormulario ? '▲ Ocultar Formulario' : '➕ Nuevo Reporte'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilos.scrollList}
        refreshControl={
          <RefreshControl
            refreshing={recargando}
            onRefresh={alDeslizarParaRecargar}
            colors={['#006a63']}
          />
        }
        ListHeaderComponent={
          mostrarFormulario ? (
            <View style={estilos.formulario}>
              <View style={estilos.cabeceraForm}>
                <View>
                  <Text style={estilos.tituloForm}>Reportar Daño</Text>
                  <Text style={estilos.subtituloForm}>
                    Rol activo: {usuario.rol.toUpperCase()}
                  </Text>
                </View>
                <View style={estilos.pillActivo}>
                  <Text style={estilos.txtPillActivo}>ACTIVO</Text>
                </View>
              </View>

              <CampoTexto
                etiqueta="Título de la falla"
                valor={titulo}
                alCambiar={setTitulo}
                placeholder="Ej: Computador 05 no da video"
              />

              <Text style={estilos.etiqueta}>BLOQUE DEL CAMPUS</Text>
              <View style={estilos.filaChips}>
                {BLOQUES.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[estilos.chip, bloque === b && estilos.chipActivo]}
                    onPress={() => setBloque(b)}
                  >
                    <Text style={[estilos.txtChip, bloque === b && estilos.txtChipActivo]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CampoTexto
                etiqueta="Sala, Laboratorio o Aula"
                valor={sala}
                alCambiar={setSala}
                placeholder="Ej: Sala 204 / Lab Redes"
              />

              <Text style={estilos.etiqueta}>TIPO DE EQUIPO QUE PRESENTA LA FALLA</Text>
              <View style={estilos.filaChips}>
                {TIPOS_EQUIPO.map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[estilos.chip, tipoEquipo === tipo && estilos.chipActivo]}
                    onPress={() => setTipoEquipo(tipo)}
                  >
                    <Text style={[estilos.txtChip, tipoEquipo === tipo && estilos.txtChipActivo]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CampoTexto
                etiqueta="Descripción técnica del daño"
                valor={descripcion}
                alCambiar={setDescripcion}
                placeholder="Detalla qué sucede con el equipo..."
              />

              <Text style={estilos.etiqueta}>PRIORIDAD DE TRIAJE</Text>
              <View style={estilos.filaChips}>
                {[
                  { id: 'baja', label: 'BAJA', color: '#16a34a' },
                  { id: 'media', label: 'MEDIA', color: '#d97706' },
                  { id: 'alta', label: 'ALTA', color: '#dc2626' },
                ].map((p) => {
                  const esActiva = prioridad === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        estilos.chipPrioridad,
                        esActiva && { backgroundColor: p.color },
                      ]}
                      onPress={() => setPrioridad(p.id)}
                    >
                      <View
                        style={[
                          estilos.puntoPrioridad,
                          { backgroundColor: esActiva ? '#ffffff' : p.color },
                        ]}
                      />
                      <Text
                        style={[
                          estilos.txtChip,
                          esActiva && estilos.txtChipActivo,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <CampoTexto
                etiqueta="Fecha en que se encontró la falla"
                valor={fechaFalla}
                alCambiar={setFechaFalla}
                placeholder="YYYY-MM-DD"
              />

              {/* Módulo de Cámara e Imagen Stitch */}
              <Text style={estilos.etiqueta}>EVIDENCIA FOTOGRÁFICA DEL DAÑO</Text>
              <View style={estilos.filaCamara}>
                <TouchableOpacity style={estilos.btnCamara} onPress={abrirCamaraTelefono}>
                  <Text style={estilos.txtBtnCamaraPrimario}>📷 Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={estilos.btnGaleria} onPress={abrirGaleriaTelefono}>
                  <Text style={estilos.txtBtnGaleria}>🖼️ Galería</Text>
                </TouchableOpacity>
              </View>

              {fotoBase64 ? (
                <View style={estilos.contenedorPreview}>
                  <Image source={{ uri: fotoBase64 }} style={estilos.previewFoto} />
                  <TouchableOpacity
                    style={estilos.btnCerrarFoto}
                    onPress={() => setFotoBase64('')}
                  >
                    <Text style={estilos.txtCerrarFoto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Boton
                texto="Enviar Reporte de Daño →"
                color="#064e3b"
                alPresionar={crearTicket}
              />

              <View style={estilos.cabeceraConteo}>
                <Text style={estilos.subtituloLista}>Tickets Registrados ({lista.length})</Text>
              </View>
            </View>
          ) : (
            <View style={estilos.cabeceraConteo}>
              <Text style={estilos.subtituloLista}>Tickets Registrados ({lista.length})</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TarjetaTicket
            ticket={item}
            rolUsuario={usuario.rol}
            tecnicos={tecnicos}
            alAsignar={asignarTecnico}
            alGestionar={gestionarTicket}
          />
        )}
        ListEmptyComponent={<Text style={estilos.vacio}>No hay tickets registrados.</Text>}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8f9fb', paddingHorizontal: 16, paddingTop: 8 },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnVolver: { paddingVertical: 4 },
  volver: { color: '#00236f', fontSize: 12, fontWeight: '800' },
  btnToggleForm: {
    backgroundColor: '#99efe5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  toggleForm: { color: '#00504a', fontSize: 11, fontWeight: '900' },
  formulario: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cabeceraForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloForm: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  subtituloForm: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  pillActivo: {
    backgroundColor: '#9cf2e8',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  txtPillActivo: { fontSize: 9, fontWeight: '900', color: '#00504a' },
  etiqueta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  chipActivo: { backgroundColor: '#006a63' },
  chipPrioridad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  puntoPrioridad: { width: 7, height: 7, borderRadius: 99 },
  txtChip: { fontSize: 11, color: '#334155', fontWeight: '800' },
  txtChipActivo: { color: '#ffffff' },
  filaCamara: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btnCamara: {
    flex: 1,
    backgroundColor: '#006a63',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGaleria: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  txtBtnCamaraPrimario: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  txtBtnGaleria: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
  contenedorPreview: {
    marginBottom: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewFoto: { width: '100%', height: 170, borderRadius: 12 },
  btnCerrarFoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtCerrarFoto: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  cabeceraConteo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  subtituloLista: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  scrollList: { paddingBottom: 60 },
  vacio: { color: '#64748b', textAlign: 'center', marginTop: 20 },
});
