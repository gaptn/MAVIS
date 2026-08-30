import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const sampleLocations = [
  { lat: -7.9666, long: 112.6326, speed: 38.5, desc: 'Perjalanan Normal (Aman)' },
  { lat: -7.9670, long: 112.6330, speed: 42.0, desc: 'Perjalanan Normal (Aman)' },
  { lat: -7.9675, long: 112.6335, speed: 48.2, desc: 'Akselerasi (Aman)' },
  { lat: -7.9680, long: 112.6340, speed: 55.0, desc: 'Tikungan Tajam (Waspada: Bank Angle 36°)', accel_y: 2.1, lean_angle: 36.5 },
  { lat: -7.9685, long: 112.6345, speed: 35.0, desc: 'Pengereman Mendadak (Bahaya: Hard Braking)', accel_x: -3.8 },
  { lat: -7.9690, long: 112.6350, speed: 28.0, desc: 'Stabilisasi Pasca Rem (Aman)' },
];

console.log(`[Simulator] Mengirimkan simulasi telemetri ESP32-S3 ke MAVIS Bridge (http://${HOST}:${PORT}/api/test-telemetry)...`);
console.log('[Simulator] Tekan Ctrl+C untuk menghentikan simulasi.\n');

let index = 0;

function sendTelemetry() {
  const current = sampleLocations[index % sampleLocations.length];
  index++;

  const isBraking = current.accel_x !== undefined;
  const isCornering = current.accel_y !== undefined;

  const payload = {
    device_id: 'MAVIS-001',
    timestamp: new Date().toISOString(),
    gps_lat: parseFloat((current.lat + (Math.random() * 0.0001 - 0.00005)).toFixed(6)),
    gps_long: parseFloat((current.long + (Math.random() * 0.0001 - 0.00005)).toFixed(6)),
    speed: parseFloat((current.speed + (Math.random() * 2 - 1)).toFixed(1)),
    accel_x: current.accel_x || parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)),
    accel_y: current.accel_y || parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)),
    accel_z: parseFloat((9.81 + (Math.random() * 0.2 - 0.1)).toFixed(2)),
  };

  const dataString = JSON.stringify(payload);

  const req = http.request(
    {
      hostname: HOST,
      port: PORT,
      path: '/api/test-telemetry',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
      },
      timeout: 2000,
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const timeStr = new Date().toLocaleTimeString();
        console.log(
          `[${timeStr}] Simulasi Data Terkirim: Speed ${payload.speed} km/h | Lat: ${payload.gps_lat}, Lng: ${payload.gps_long} | Info: ${current.desc}`
        );
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[Simulator Error] Gagal terhubung ke Bridge: ${err.message}. Pastikan bridge berjalan di port ${PORT}!`);
  });

  req.write(dataString);
  req.end();
}

// Send every 1 second (1 Hz simulation)
sendTelemetry();
setInterval(sendTelemetry, 1000);
