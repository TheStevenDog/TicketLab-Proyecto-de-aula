import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { llamarApi } from '../config/api';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';

function obtenerIniciales(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'TL';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// Pantalla de Inicio, Equipos de Soporte y Gestión de Roles con diseño Stitch
export default function EquiposScreen({
  usuario,
  alSalir,
  alIrATickets,
  alIrAReportes,
}) {
  const [nombre, setNombre] = useState('');
  const [integrantes, setIntegrantes] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [verRolesAdmin, setVerRolesAdmin] = useState(false);
  const [recargando, setRecargando] = useState(false);

  const puedeCrearEquipo = usuario.rol === 'lider' || usuario.rol === 'admin';

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    await cargarEquipos();
    if (usuario.rol === 'admin') {
      await cargarUsuarios();
    }
  };

  // Gesto Android Pull-to-Refresh (deslizar hacia abajo para actualizar)
  const alDeslizarAbajo = async () => {
    setRecargando(true);
    await cargarTodo();
    setRecargando(false);
  };

  const cargarEquipos = async () => {
    try {
      const datos = await llamarApi('/api/equipos');
      setEquipos(datos.equipos || []);
    } catch (e) {}
  };

  const cargarUsuarios = async () => {
    try {
      const datos = await llamarApi('/api/usuarios');
      setUsuariosSistema(datos.usuarios || []);
    } catch (e) {}
  };

  const crearEquipo = async () => {
    if (!nombre.trim() || !integrantes.trim()) {
      return Alert.alert('Faltan datos', 'Escribe el nombre y los correos del equipo.');
    }
    try {
      await llamarApi('/api/equipos', 'POST', {
        nombre: nombre.trim(),
        integrantes: integrantes.trim(),
      });
      setNombre('');
      setIntegrantes('');
      cargarEquipos();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const cambiarRolDeUsuario = async (uid, nuevoRol) => {
    try {
      await llamarApi(`/api/usuarios/${uid}/rol`, 'PUT', { rol: nuevoRol });
      cargarUsuarios();
      Alert.alert('Rol actualizado', `El usuario ahora tiene el rol: ${nuevoRol.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={verRolesAdmin && usuario.rol === 'admin' ? usuariosSistema : equipos}
        keyExtractor={(item) => item.uid || item.id}
        refreshControl={
          <RefreshControl
            refreshing={recargando}
            onRefresh={alDeslizarAbajo}
            colors={['#006a63']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* 1. Tarjeta de Perfil Institucional Stitch */}
            <View style={estilos.tarjetaPerfil}>
              <View style={estilos.filaPerfilSup}>
                <View style={estilos.filaUsuarioInfo}>
                  <View style={estilos.circuloIniciales}>
                    <Text style={estilos.txtIniciales}>{obtenerIniciales(usuario.nombre)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.nombreUsuario}>{usuario.nombre}</Text>
                    <Text style={estilos.correoUsuario}>{usuario.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={estilos.btnSalirChip} onPress={alSalir}>
                  <Text style={estilos.txtSalirChip}>Salir</Text>
                </TouchableOpacity>
              </View>

              <View style={estilos.filaBadgesPerfil}>
                <View style={estilos.pillRolAmbar}>
                  <Text style={estilos.txtPillRolAmbar}>★ ROL: {usuario.rol.toUpperCase()}</Text>
                </View>
                <View style={estilos.pillGuardia}>
                  <View style={estilos.puntoGuardia} />
                  <Text style={estilos.txtPillGuardia}>Guardia Activa</Text>
                </View>
              </View>
            </View>

            {/* 2. Tarjetas Gemelas de Acción Stitch (Tickets y Cámara + Reportes de Daños) */}
            <View style={estilos.filaAccionesGemelas}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={estilos.cardAccionPrimaria}
                onPress={() => alIrATickets(null)}
              >
                <Text style={estilos.iconoCardAccion}>📷</Text>
                <Text style={estilos.tituloCardPrimaria}>Ir a Tickets y Cámara</Text>
                <Text style={estilos.subCardPrimaria}>
                  Reportar daño con evidencia o gestionar triaje
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={estilos.cardAccionSecundaria}
                onPress={alIrAReportes}
              >
                <Text style={estilos.iconoCardAccion}>📊</Text>
                <Text style={estilos.tituloCardSecundaria}>Ver Reportes de Daños</Text>
                <Text style={estilos.subCardSecundaria}>
                  Filtros por sala, bloque, fechas y equipo
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Botón de Administración de Roles (Solo Admin Nivel 4) */}
            {usuario.rol === 'admin' && (
              <TouchableOpacity
                style={estilos.btnAdminRoles}
                onPress={() => setVerRolesAdmin(!verRolesAdmin)}
              >
                <Text style={estilos.txtAdminRoles}>
                  {verRolesAdmin
                    ? '▲ Volver a Cuadrillas de Soporte'
                    : '👑 Gestionar Jerarquía de Roles de Usuarios (Nivel 4 Admin)'}
                </Text>
              </TouchableOpacity>
            )}

            {/* 4. Formulario de Creación de Equipo (Líder / Admin) */}
            {!verRolesAdmin && puedeCrearEquipo && (
              <View style={estilos.tarjetaFormulario}>
                <View style={estilos.filaTituloSeccion}>
                  <Text style={estilos.tituloSeccion}>Crear Equipo de Soporte</Text>
                  <View style={estilos.pillNivel}>
                    <Text style={estilos.txtPillNivel}>LÍDER / ADMIN</Text>
                  </View>
                </View>

                <CampoTexto
                  etiqueta="Nombre de la cuadrilla o laboratorio"
                  valor={nombre}
                  alCambiar={setNombre}
                  placeholder="Ej: Soporte Técnico Bloque 3"
                />
                <CampoTexto
                  etiqueta="Integrantes (correos o nombres separados por coma)"
                  valor={integrantes}
                  alCambiar={setIntegrantes}
                  placeholder="soporte@ticketlab.com, diana@ticketlab.com"
                  autoCapitalize="none"
                />
                <Boton
                  texto="+ Guardar Equipo de Soporte"
                  color="#064e3b"
                  alPresionar={crearEquipo}
                />
              </View>
            )}

            <View style={estilos.cabeceraLista}>
              <Text style={estilos.tituloLista}>
                {verRolesAdmin && usuario.rol === 'admin'
                  ? `Gestión de Roles de Usuarios (${usuariosSistema.length})`
                  : `Equipos de Soporte Activos (${equipos.length})`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (verRolesAdmin && usuario.rol === 'admin') {
            return (
              <View style={estilos.tarjetaItem}>
                <View style={estilos.filaUsuarioAdmin}>
                  <View style={estilos.avatarAdmin}>
                    <Text style={estilos.txtAvatarAdmin}>{obtenerIniciales(item.nombre)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.nombreEquipo}>{item.nombre}</Text>
                    <Text style={estilos.integrantes}>{item.email}</Text>
                  </View>
                  <View style={estilos.pillRolActual}>
                    <Text style={estilos.txtPillRolActual}>{item.rol.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={estilos.filaRoles}>
                  {['estudiante', 'soporte', 'lider', 'admin'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[estilos.chipRol, item.rol === r && estilos.chipRolActivo]}
                      onPress={() => cambiarRolDeUsuario(item.uid, r)}
                    >
                      <Text style={[estilos.txtChipRol, item.rol === r && estilos.txtChipActivo]}>
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }

          const listaMiembros = String(item.integrantes || '')
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean);

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={estilos.tarjetaItem}
              onPress={() => alIrATickets(item)}
            >
              <View style={estilos.filaCabeceraEquipo}>
                <Text style={estilos.nombreEquipo}>{item.nombre}</Text>
                <View style={estilos.pillActiva}>
                  <Text style={estilos.txtPillActiva}>OPERATIVO</Text>
                </View>
              </View>
              <Text style={estilos.integrantes}>Integrantes: {item.integrantes}</Text>

              <View style={estilos.filaAvataresEquipo}>
                <View style={estilos.grupoAvatares}>
                  {listaMiembros.slice(0, 4).map((m, idx) => (
                    <View
                      key={idx}
                      style={[estilos.miniAvatar, idx > 0 && { marginLeft: -6 }]}
                    >
                      <Text style={estilos.txtMiniAvatar}>{obtenerIniciales(m)}</Text>
                    </View>
                  ))}
                </View>
                <Text style={estilos.irTicketsLink}>Ver tickets →</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8f9fb', paddingHorizontal: 16, paddingTop: 10 },
  tarjetaPerfil: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaPerfilSup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaUsuarioInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  circuloIniciales: {
    width: 46,
    height: 46,
    borderRadius: 99,
    backgroundColor: '#99efe5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtIniciales: { fontSize: 16, fontWeight: '900', color: '#00504a' },
  nombreUsuario: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  correoUsuario: { fontSize: 12, color: '#64748b', marginTop: 1 },
  btnSalirChip: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  txtSalirChip: { color: '#93000a', fontSize: 11, fontWeight: '800' },
  filaBadgesPerfil: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pillRolAmbar: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  txtPillRolAmbar: { fontSize: 10, fontWeight: '900', color: '#92400e' },
  pillGuardia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  puntoGuardia: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#16a34a' },
  txtPillGuardia: { fontSize: 10, fontWeight: '800', color: '#334155' },
  filaAccionesGemelas: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cardAccionPrimaria: {
    flex: 1,
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 14,
  },
  cardAccionSecundaria: {
    flex: 1,
    backgroundColor: '#99efe5',
    borderRadius: 16,
    padding: 14,
  },
  iconoCardAccion: { fontSize: 20, marginBottom: 6 },
  tituloCardPrimaria: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  subCardPrimaria: { fontSize: 10, color: '#d1fae5', marginTop: 3, lineHeight: 14 },
  tituloCardSecundaria: { fontSize: 14, fontWeight: '900', color: '#00211e' },
  subCardSecundaria: { fontSize: 10, color: '#00504a', marginTop: 3, lineHeight: 14 },
  btnAdminRoles: {
    backgroundColor: '#dce1ff',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  txtAdminRoles: { color: '#00236f', fontWeight: '900', fontSize: 12 },
  tarjetaFormulario: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaTituloSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloSeccion: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  pillNivel: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  txtPillNivel: { fontSize: 9, fontWeight: '900', color: '#64748b' },
  cabeceraLista: { marginVertical: 8 },
  tituloLista: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  tarjetaItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaCabeceraEquipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreEquipo: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  pillActiva: {
    backgroundColor: '#9cf2e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  txtPillActiva: { fontSize: 9, fontWeight: '900', color: '#00504a' },
  integrantes: { fontSize: 12, color: '#64748b', marginTop: 3 },
  filaAvataresEquipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  grupoAvatares: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 99,
    backgroundColor: '#dce1ff',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtMiniAvatar: { fontSize: 9, fontWeight: '900', color: '#00236f' },
  irTicketsLink: { fontSize: 11, fontWeight: '800', color: '#006a63' },
  filaUsuarioAdmin: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarAdmin: {
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: '#dce1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtAvatarAdmin: { fontSize: 12, fontWeight: '900', color: '#00236f' },
  pillRolActual: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  txtPillRolActual: { fontSize: 9, fontWeight: '900', color: '#92400e' },
  filaRoles: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  chipRol: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  chipRolActivo: { backgroundColor: '#00236f' },
  txtChipRol: { fontSize: 10, color: '#334155', fontWeight: '800' },
  txtChipActivo: { color: '#ffffff' },
});
