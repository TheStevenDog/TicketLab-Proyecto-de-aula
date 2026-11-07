import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Tarjeta de Ticket con diseño Stitch ("Academic Operations & Technical Triage") y animación de entrada
export default function TarjetaTicket({
  ticket,
  rolUsuario,
  tecnicos = [],
  alAsignar,
  alGestionar,
}) {
  const [respuesta, setRespuesta] = useState(ticket.respuestaTecnica || '');
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const animEntrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animEntrada, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, []);

  const puedeAsignar = rolUsuario === 'lider' || rolUsuario === 'admin';
  const puedeGestionar =
    rolUsuario === 'soporte' || rolUsuario === 'lider' || rolUsuario === 'admin';

  const codigoCorto = '#TK-' + String(ticket.id || '0000').slice(-4).toUpperCase();
  const estadoClave = ticket.estado || 'pendiente';

  return (
    <Animated.View
      style={[
        estilos.tarjeta,
        {
          opacity: animEntrada,
          transform: [
            {
              translateY: animEntrada.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onLongPress={() => {
          if (puedeAsignar || puedeGestionar) setMostrarGestion(!mostrarGestion);
        }}
      >
      {/* Cabecera de Tarjeta Stitch: Código + Prioridad + Estado */}
      <View style={estilos.filaSuperior}>
        <View style={estilos.bloqueCodigo}>
          <Text style={estilos.codigoTxt}>{codigoCorto}</Text>
          <Text style={estilos.fechaTxt}>• Falla: {ticket.fechaFalla || ticket.fechaReporte || 'Hoy'}</Text>
        </View>
        <View style={estilos.filaBadges}>
          <View style={[estilos.badge, estilos['prio_' + (ticket.prioridad || 'media')]]}>
            <Text style={[estilos.badgeTxt, estilos['prioTxt_' + (ticket.prioridad || 'media')]]}>
              {ticket.prioridad || 'media'}
            </Text>
          </View>
          <View style={[estilos.badge, estilos['est_' + estadoClave]]}>
            <Text style={[estilos.badgeTxt, estilos['estTxt_' + estadoClave]]}>
              {estadoClave.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={estilos.titulo}>{ticket.titulo}</Text>
      <Text style={estilos.descripcion}>{ticket.descripcion}</Text>

      {ticket.sincronizado === false ? (
        <View style={estilos.bannerOffline}>
          <Text style={estilos.offlineTag}>⏳ Guardado en cola Offline · Pendiente de sincronizar</Text>
        </View>
      ) : null}

      {/* Cuerpo Stitch: Miniatura de Evidencia + Cuadrícula 2x2 de Metadatos */}
      <View style={estilos.cuerpoMeta}>
        {ticket.fotoBase64 ? (
          <Image source={{ uri: ticket.fotoBase64 }} style={estilos.miniaturaFoto} resizeMode="cover" />
        ) : (
          <View style={estilos.sinFotoCaja}>
            <Text style={estilos.sinFotoIcono}>📷</Text>
            <Text style={estilos.sinFotoTxt}>SIN FOTO</Text>
          </View>
        )}

        <View style={estilos.gridDatos}>
          <View style={estilos.itemDato}>
            <Text style={estilos.etiquetaDato}>📍 UBICACIÓN</Text>
            <Text style={estilos.valorDato}>
              {ticket.bloque} · {ticket.sala}
            </Text>
          </View>
          <View style={estilos.itemDato}>
            <Text style={estilos.etiquetaDato}>💻 EQUIPO CON FALLA</Text>
            <Text style={estilos.valorDato}>{ticket.tipoEquipo || 'Computador'}</Text>
          </View>
          <View style={estilos.itemDato}>
            <Text style={estilos.etiquetaDato}>👤 REPORTADO POR</Text>
            <Text style={estilos.valorDato} numberOfLines={1}>
              {ticket.creadorNombre || ticket.creadorEmail}
            </Text>
          </View>
          <View style={estilos.itemDato}>
            <Text style={estilos.etiquetaDato}>🛠️ TÉCNICO ASIGNADO</Text>
            <Text style={estilos.valorDato} numberOfLines={1}>
              {ticket.tecnicoNombre || 'Sin asignar'}
            </Text>
          </View>
        </View>
      </View>

      {/* Burbuja de Respuesta de Soporte Técnico (Stitch Secondary Container #99EFE5) */}
      <View
        style={[
          estilos.cajaRespuesta,
          !ticket.respuestaTecnica && estilos.cajaRespuestaPendiente,
        ]}
      >
        <Text style={estilos.tituloRespuesta}>💬 RESPUESTA DE SOPORTE TÉCNICO</Text>
        <Text style={estilos.textoRespuesta}>
          {ticket.respuestaTecnica
            ? ticket.respuestaTecnica
            : 'Pendiente de diagnóstico o respuesta del técnico asignado.'}
        </Text>
      </View>

      {/* Botón de Acción según Jerarquía */}
      {(puedeAsignar || puedeGestionar) && (
        <TouchableOpacity
          style={estilos.btnAccionToggle}
          onPress={() => setMostrarGestion(!mostrarGestion)}
        >
          <Text style={estilos.txtAccionToggle}>
            {mostrarGestion
              ? '▲ Ocultar panel de triaje'
              : '⚙️ Gestionar / Asignar'}
          </Text>
        </TouchableOpacity>
      )}

      {mostrarGestion && (
        <View style={estilos.panelGestion}>
          {puedeAsignar && tecnicos.length > 0 && (
            <View style={estilos.bloqueRol}>
              <Text style={estilos.subtituloRol}>ASIGNAR TÉCNICO DE SOPORTE (LÍDER / ADMIN)</Text>
              <View style={estilos.filaBotones}>
                {tecnicos.map((tec) => (
                  <TouchableOpacity
                    key={tec.uid}
                    style={[
                      estilos.btnChip,
                      ticket.tecnicoUid === tec.uid && estilos.btnChipActivo,
                    ]}
                    onPress={() => alAsignar(ticket.id, tec)}
                  >
                    <Text
                      style={[
                        estilos.txtChip,
                        ticket.tecnicoUid === tec.uid && estilos.txtChipActivo,
                      ]}
                    >
                      {tec.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {puedeGestionar && (
            <View style={estilos.bloqueRol}>
              <Text style={estilos.subtituloRol}>DIAGNÓSTICO Y CAMBIO DE ESTADO (SOPORTE)</Text>
              <TextInput
                style={estilos.inputRespuesta}
                value={respuesta}
                onChangeText={setRespuesta}
                placeholder="Escribe la solución o diagnóstico para el estudiante..."
                placeholderTextColor="#94a3b8"
              />
              <View style={estilos.filaBotones}>
                {['en_proceso', 'resuelto'].map((est) => (
                  <TouchableOpacity
                    key={est}
                    style={[
                      estilos.btnEstado,
                      est === 'resuelto' ? estilos.btnVerde : estilos.btnAmbar,
                    ]}
                    onPress={() => alGestionar(ticket.id, est, respuesta)}
                  >
                    <Text style={estilos.txtBtnEstado}>
                      {est === 'resuelto' ? '✓ Marcar Resuelto' : '🔧 En Proceso'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bloqueCodigo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codigoTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  fechaTxt: { fontSize: 11, color: '#94a3b8' },
  filaBadges: { flexDirection: 'row', gap: 6 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prio_baja: { backgroundColor: '#dcfce7' },
  prioTxt_baja: { color: '#166534' },
  prio_media: { backgroundColor: '#fef3c7' },
  prioTxt_media: { color: '#b45309' },
  prio_alta: { backgroundColor: '#ffdad6' },
  prioTxt_alta: { color: '#93000a' },
  est_pendiente: { backgroundColor: '#f3f4f6' },
  estTxt_pendiente: { color: '#475569' },
  est_asignado: { backgroundColor: '#dce1ff' },
  estTxt_asignado: { color: '#00236f' },
  est_en_proceso: { backgroundColor: '#fef3c7' },
  estTxt_en_proceso: { color: '#92400e' },
  est_resuelto: { backgroundColor: '#9cf2e8' },
  estTxt_resuelto: { color: '#00504a' },
  titulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  bannerOffline: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  offlineTag: { fontSize: 11, color: '#b45309', fontWeight: '700' },
  cuerpoMeta: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  miniaturaFoto: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  sinFotoCaja: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinFotoIcono: { fontSize: 18 },
  sinFotoTxt: { fontSize: 8, fontWeight: '800', color: '#64748b', marginTop: 2 },
  gridDatos: { flex: 1, gap: 4 },
  itemDato: { marginBottom: 2 },
  etiquetaDato: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  valorDato: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  cajaRespuesta: {
    backgroundColor: '#e6f9f6',
    borderLeftWidth: 4,
    borderLeftColor: '#006a63',
    padding: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  cajaRespuestaPendiente: {
    backgroundColor: '#f8fafc',
    borderLeftColor: '#cbd5e1',
  },
  tituloRespuesta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00504a',
    letterSpacing: 0.5,
  },
  textoRespuesta: { fontSize: 12, color: '#1e293b', marginTop: 3 },
  btnAccionToggle: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  txtAccionToggle: { color: '#00236f', fontSize: 11, fontWeight: '800' },
  panelGestion: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  bloqueRol: { marginBottom: 10 },
  subtituloRol: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  filaBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btnChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  btnChipActivo: { backgroundColor: '#00236f' },
  txtChip: { fontSize: 12, color: '#334155', fontWeight: '700' },
  txtChipActivo: { color: '#ffffff', fontWeight: '800' },
  inputRespuesta: {
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#f3f4f6',
    color: '#0f172a',
    marginBottom: 8,
  },
  btnEstado: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnAmbar: { backgroundColor: '#d97706' },
  btnVerde: { backgroundColor: '#006a63' },
  txtBtnEstado: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
});
