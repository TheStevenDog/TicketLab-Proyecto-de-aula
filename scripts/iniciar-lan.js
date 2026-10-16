// Arranca Expo detectando solo la IP de red local actual.
// Uso: npm run start:lan
// Si el celular no conecta, usa en su lugar: npm run start:tunel
const os = require('os');
const { spawn } = require('child_process');

// 1. Busco las direcciones IPv4 reales del PC (excluyo las virtuales)
function buscarIp() {
  const interfaces = os.networkInterfaces();
  const candidatas = [];
  for (const nombre of Object.keys(interfaces)) {
    if (nombre.toLowerCase().includes('veth')) continue; // ignoro la virtual de WSL/Hyper-V
    for (const dir of interfaces[nombre]) {
      if (dir.family === 'IPv4' && !dir.internal && dir.address.startsWith('192.168.')) {
        // 2. Prefiero la Ethernet porque es más estable que la Wi-Fi
        const esEthernet = nombre.toLowerCase().includes('ethernet');
        candidatas.push({ nombre, ip: dir.address, prioridad: esEthernet ? 0 : 1 });
      }
    }
  }
  candidatas.sort((a, b) => a.prioridad - b.prioridad);
  return candidatas[0];
}

const elegida = buscarIp();
if (!elegida) {
  console.log('No encontré una IP de red local (¿el PC está conectado a una red?).');
  console.log('Usa en su lugar: npm run start:tunel');
  process.exit(1);
}

console.log('IP elegida: ' + elegida.ip + ' (interfaz ' + elegida.nombre + ')');
console.log('En el celular usa la URL: exp://' + elegida.ip + ':8081');
console.log('Si el celular no conecta, usa: npm run start:tunel');
console.log('---');

// 3. Arranco Expo con esa IP forzada como la que se le anuncia al celular
const hijo = spawn('npx expo start --port 8081', {
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: elegida.ip },
  stdio: 'inherit',
  shell: true,
});

hijo.on('exit', (codigo) => process.exit(codigo || 0));
