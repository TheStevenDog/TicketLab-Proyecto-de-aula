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

const BLOQUES = ['', 'Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4'];
const EQUIPOS = ['', 'Computador', 'Proyector', 'Red', 'Periférico', 'Mobiliario/Aire'];

// Pantalla de Reportes de Daños y Analítica con diseño Stitch ("Academic Operations & Technical Triage")
export default function ReportesScreen({ usuario, alVolver }) {
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [bloque, setBloque] = useState('');
  const [sala, setSala] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState({
    total: 0,
    porBloque: {},
    porSala: {},
    porTipoEquipo: {},
  });
  const [recargando, setRecargando] = useState(false);

  useEffect(() => {
    consultarReporte();
  }, []);

  const consultarReporte = async () => {
    try {
      const q = [
        `usuario=${encodeURIComponent(filtroUsuario.trim())}`,
        `bloque=${encodeURIComponent(bloque)}`,
        `sala=${encodeURIComponent(sala.trim())}`,
        `tipoEquipo=${encodeURIComponent(tipoEquipo)}`,
        `fechaInicio=${encodeURIComponent(fechaInicio.trim())}`,
        `fechaFin=${encodeURIComponent(fechaFin.trim())}`,
      ].join('&');

      const datos = await llamarApi(`/api/reportes?${q}`);
      setResultados(datos.tickets || []);
      setResumen(datos.resumen || { total: 0, porBloque: {}, porSala: {}, porTipoEquipo: {} });
    } catch (error) {
      Alert.alert('Error en reportes', error.message);
    }
  };

  const limpiarFiltros = () => {
    setFiltroUsuario('');
    setBloque('');
    setSala('');
    setTipoEquipo('');
    setFechaInicio('');
    setFechaFin('');
  };

  const alDeslizarAbajo = async () => {
    setRecargando(true);
    await consultarReporte();
    setRecargando(false);
  };

  const totalBloquesConFalla = Object.keys(resumen.porBloque || {}).length;
  const totalSalasConFalla = Object.keys(resumen.porSala || {}).length;

  return (
    <View style={estilos.contenedor}>
      <TouchableOpacity onPress={alVolver} style={estilos.btnVolver}>
        <Text style={estilos.txtVolver}>← Volver al Menú Principal</Text>
      </TouchableOpacity>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={recargando}
            onRefresh={alDeslizarAbajo}
            colors={['#006a63']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Cabecera Analítica Stitch */}
            <View style={estilos.cabeceraMetricas}>
              <Text style={estilos.overline}>MÉTRICAS & DIAGNÓSTICOS</Text>
              <Text style={estilos.tituloPrincipal}>Reportes de Daños del Campus</Text>
            </View>

            {/* 3 Tarjetas KPI Stitch (Total Daños, Bloques, Salas/Labs) */}
            <View style={estilos.filaKpis}>
              <View style={[estilos.cardKpi, estilos.kpiBordeNavy]}>
                <Text style={estilos.kpiLabel}>TOTAL DAÑOS</Text>
                <Text style={[estilos.kpiValor, { color: '#00236f' }]}>{resumen.total}</Text>
              </View>
              <View style={[estilos.cardKpi, estilos.kpiBordeTeal]}>
                <Text style={estilos.kpiLabel}>BLOQUES</Text>
                <Text style={[estilos.kpiValor, { color: '#006a63' }]}>{totalBloquesConFalla}</Text>
              </View>
              <View style={[estilos.cardKpi, estilos.kpiBordeSlate]}>
                <Text style={estilos.kpiLabel}>SALAS / LABS</Text>
                <Text style={[estilos.kpiValor, { color: '#0f172a' }]}>{totalSalasConFalla}</Text>
              </View>
            </View>

            {/* Panel de Filtros Avanzados Stitch */}
            <View style={estilos.cajaFiltros}>
              <View style={estilos.filaCabeceraFiltros}>
                <Text style={estilos.tituloFiltros}>Filtros Avanzados</Text>
                <TouchableOpacity onPress={limpiarFiltros}>
                  <Text style={estilos.txtLimpiar}>Limpiar filtros</Text>
                </TouchableOpacity>
              </View>

              <CampoTexto
                etiqueta="Filtrar por Usuario (correo o nombre)"
                valor={filtroUsuario}
                alCambiar={setFiltroUsuario}
                placeholder="Ej: estudiante@ticketlab.com"
                autoCapitalize="none"
              />

              <Text style={estilos.etiqueta}>FILTRAR POR BLOQUE</Text>
              <View style={estilos.filaChips}>
                {BLOQUES.map((b) => (
                  <TouchableOpacity
                    key={b || 'todos_b'}
                    style={[estilos.chip, bloque === b && estilos.chipActivo]}
                    onPress={() => setBloque(b)}
                  >
                    <Text style={[estilos.txtChip, bloque === b && estilos.txtChipActivo]}>
                      {b || 'Todos'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CampoTexto
                etiqueta="Filtrar por Sala o Aula"
                valor={sala}
                alCambiar={setSala}
                placeholder="Ej: Sala 204"
              />

              <Text style={estilos.etiqueta}>FILTRAR POR TIPO DE EQUIPO CON FALLA</Text>
              <View style={estilos.filaChips}>
                {EQUIPOS.map((eq) => (
                  <TouchableOpacity
                    key={eq || 'todos_eq'}
                    style={[estilos.chip, tipoEquipo === eq && estilos.chipActivo]}
                    onPress={() => setTipoEquipo(eq)}
                  >
                    <Text style={[estilos.txtChip, tipoEquipo === eq && estilos.txtChipActivo]}>
                      {eq || 'Todos'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={estilos.filaFechas}>
                <View style={estilos.mitad}>
                  <CampoTexto
                    etiqueta="Fecha Desde"
                    valor={fechaInicio}
                    alCambiar={setFechaInicio}
                    placeholder="2026-10-01"
                  />
                </View>
                <View style={estilos.mitad}>
                  <CampoTexto
                    etiqueta="Fecha Hasta"
                    valor={fechaFin}
                    alCambiar={setFechaFin}
                    placeholder="2026-10-31"
                  />
                </View>
              </View>

              <Boton
                texto="🔍 Aplicar Filtros de Reporte"
                color="#115e59"
                alPresionar={consultarReporte}
              />
            </View>

            {/* Tarjeta de Distribución por Tipo de Equipo y Bloque */}
            <View style={estilos.cajaResumen}>
              <View style={estilos.filaCabeceraResumen}>
                <Text style={estilos.txtResumenTitulo}>Distribución por Tipo de Equipo</Text>
                <View style={estilos.pillMuestra}>
                  <Text style={estilos.txtPillMuestra}>100% MUESTREADO</Text>
                </View>
              </View>

              <Text style={estilos.txtResumenDetalle}>
                🏛️ Por Bloque:{' '}
                {Object.entries(resumen.porBloque || {})
                  .map(([k, v]) => `${k} (${v})`)
                  .join(' · ') || 'Sin registros'}
              </Text>
              <Text style={estilos.txtResumenDetalle}>
                💻 Por Equipo:{' '}
                {Object.entries(resumen.porTipoEquipo || {})
                  .map(([k, v]) => `${k} (${v})`)
                  .join(' · ') || 'Sin registros'}
              </Text>
            </View>

            <Text style={estilos.subtituloResultados}>
              Incidentes Encontrados ({resultados.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <View style={estilos.filaSupItem}>
              <Text style={estilos.itemCodigo}>
                #TK-{String(item.id || '0000').slice(-4).toUpperCase()} · {item.fechaReporte}
              </Text>
              <View style={estilos.pillEstado}>
                <Text style={estilos.txtPillEstado}>
                  {(item.estado || 'pendiente').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={estilos.itemTitulo}>{item.titulo}</Text>
            <Text style={estilos.itemMeta}>
              📍 {item.bloque} · {item.sala} | 💻 {item.tipoEquipo}
            </Text>
            <Text style={estilos.itemMeta}>
              👤 Reportado por: {item.creadorNombre} ({item.creadorEmail})
            </Text>
            {item.respuestaTecnica ? (
              <View style={estilos.cajaSolucion}>
                <Text style={estilos.itemRespuesta}>💬 Solución: {item.respuestaTecnica}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <Text style={estilos.vacio}>No hay reportes que coincidan con estos filtros.</Text>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8f9fb', paddingHorizontal: 16, paddingTop: 8 },
  btnVolver: { marginBottom: 6 },
  txtVolver: { color: '#00236f', fontSize: 12, fontWeight: '800' },
  cabeceraMetricas: { marginBottom: 10 },
  overline: { fontSize: 9, fontWeight: '900', color: '#006a63', letterSpacing: 1 },
  tituloPrincipal: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  filaKpis: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  cardKpi: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  kpiBordeNavy: { borderLeftColor: '#00236f' },
  kpiBordeTeal: { borderLeftColor: '#006a63' },
  kpiBordeSlate: { borderLeftColor: '#0f172a' },
  kpiLabel: { fontSize: 8, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  kpiValor: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  cajaFiltros: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaCabeceraFiltros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloFiltros: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  txtLimpiar: { fontSize: 11, fontWeight: '800', color: '#006a63' },
  etiqueta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  chipActivo: { backgroundColor: '#006a63' },
  txtChip: { fontSize: 11, fontWeight: '800', color: '#334155' },
  txtChipActivo: { color: '#ffffff' },
  filaFechas: { flexDirection: 'row', gap: 8 },
  mitad: { flex: 1 },
  cajaResumen: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaCabeceraResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txtResumenTitulo: { fontWeight: '900', color: '#0f172a', fontSize: 13 },
  pillMuestra: {
    backgroundColor: '#9cf2e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  txtPillMuestra: { fontSize: 8, fontWeight: '900', color: '#00504a' },
  txtResumenDetalle: { color: '#334155', fontSize: 12, marginTop: 4, fontWeight: '600' },
  subtituloResultados: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  tarjeta: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filaSupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCodigo: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  pillEstado: {
    backgroundColor: '#dce1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  txtPillEstado: { fontSize: 9, fontWeight: '900', color: '#00236f' },
  itemTitulo: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  itemMeta: { fontSize: 12, color: '#475569', marginTop: 3 },
  cajaSolucion: {
    backgroundColor: '#e6f9f6',
    borderLeftWidth: 3,
    borderLeftColor: '#006a63',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  itemRespuesta: { fontSize: 12, color: '#00504a', fontWeight: '700' },
  vacio: { textAlign: 'center', color: '#64748b', marginTop: 14 },
});
