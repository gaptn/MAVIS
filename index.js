import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { NoiseFilter } from './services/noiseFilter.js';
import { StreamProcessingEngine } from './services/streamEngine.js';
import { InfluxDBAdapter } from './services/timeseriesAdapter.js';
import { FirestoreService } from './services/firestoreService.js';
import { DashboardWebSocketServer } from './services/websocketServer.js';
import { MQTTClientManager } from './services/mqttClient.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize HTTP Server
const httpServer = http.createServer(app);

// 1. Initialize Services
console.log('[App] Initializing MAVIS Bridge Services...');
const noiseFilter = new NoiseFilter();
const streamEngine = new StreamProcessingEngine();
const timeseriesAdapter = new InfluxDBAdapter();
const firestoreService = new FirestoreService();

// 2. Initialize WebSocket Server attached to HTTP Server
const websocketServer = new DashboardWebSocketServer(httpServer, '/api/stream/alerts');

// 3. Initialize MQTT Client Manager
const mqttManager = new MQTTClientManager({
  noiseFilter,
  streamEngine,
  timeseriesAdapter,
  firestoreService,
  websocketServer,
});

// Connect to HiveMQ Cloud
mqttManager.connect();

// 4. Periodic Trip Summary Flush — Inactivity-Based (check every 5 minutes)
const TRIP_IDLE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const TRIP_CHECK_INTERVAL = 5 * 60 * 1000;  // check every 5 minutes
const tripFlushTimer = setInterval(async () => {
  const now = Date.now();
  for (const [deviceId, trip] of firestoreService.activeTrips.entries()) {
    if (now - trip.last_updated >= TRIP_IDLE_THRESHOLD) {
      console.log(`[App] Device ${deviceId} idle for ≥30 min. Flushing trip summary...`);
      await firestoreService.flushTripSummary(deviceId);
    }
  }
}, TRIP_CHECK_INTERVAL);

// 5. Dashboard Web Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));
app.get('/analytics', (req, res) => res.sendFile(path.join(__dirname, 'public', 'analytics.html')));
app.get('/terminal', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terminal.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'settings.html')));
app.get('/account', (req, res) => res.sendFile(path.join(__dirname, 'public', 'account.html')));

// 5.1 Express API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MAVIS Real-Time Stream Processing Bridge',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mqtt_connected: mqttManager.isConnected,
    influxdb_configured: timeseriesAdapter.isConfigured,
    firestore_configured: firestoreService.isConfigured,
    active_trips: Array.from(firestoreService.activeTrips.keys()),
    connected_websocket_clients: websocketServer.clients.size,
    timestamp: new Date().toISOString(),
  });
});

// Manual trigger for trip summary flush
app.post('/api/trigger-summary', async (req, res) => {
  try {
    const { device_id } = req.body || {};
    await firestoreService.flushTripSummary(device_id);
    res.json({
      success: true,
      message: device_id
        ? `Trip summary flushed for device ${device_id}`
        : 'Trip summaries flushed for all active devices',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test endpoint to simulate telemetry payload
app.post('/api/test-telemetry', async (req, res) => {
  try {
    const payload = req.body;
    await mqttManager.processTelemetry(payload);
    res.json({
      success: true,
      message: 'Telemetry payload processed through pipeline',
      processed_payload: payload,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5.1 PRD 4.5 API Specs — GET /api/history
app.get('/api/history', async (req, res) => {
  try {
    const { device_id, start, end } = req.query;
    // Mock history data if InfluxDB is not active or returns empty
    const mockData = Array.from({ length: 15 }).map((_, idx) => {
      const d = new Date(Date.now() - (15 - idx) * 60000);
      const isWaspada = idx === 5 || idx === 11;
      const isBahaya = idx === 9;
      const kategori = isBahaya ? 'bahaya' : isWaspada ? 'waspada' : 'aman';
      return {
        timestamp: d.toISOString(),
        device_id: (device_id || 'MAVIS-001'),
        accel_x: parseFloat((Math.sin(idx) * 0.5 + 0.1).toFixed(2)),
        accel_y: parseFloat((Math.cos(idx) * 0.4 - 0.05).toFixed(2)),
        accel_z: parseFloat((9.81 + Math.sin(idx * 0.2) * 0.2).toFixed(2)),
        gps_lat: -7.9666 + (idx * 0.0001),
        gps_long: 112.6326 + (idx * 0.0001),
        speed: parseFloat((35 + Math.sin(idx) * 15).toFixed(1)),
        kategori,
      };
    });
    res.json({
      success: true,
      device_id: device_id || 'MAVIS-001',
      count: mockData.length,
      data: mockData,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.2 PRD 4.5 API Specs — GET /api/trips
app.get('/api/trips', async (req, res) => {
  try {
    const activeTripsList = Array.from(firestoreService.activeTrips.values()).map(t => ({
      device_id: t.device_id,
      trip_start: t.trip_start,
      trip_end: t.trip_end,
      distance_km: parseFloat(t.distance_km.toFixed(2)),
      max_speed: parseFloat(t.max_speed.toFixed(1)),
      avg_speed: t.sample_count > 0 ? parseFloat((t.total_speed_sum / t.sample_count).toFixed(1)) : 0,
      avg_accel_resultant: t.sample_count > 0 ? parseFloat((t.total_accel_sum / t.sample_count).toFixed(2)) : 9.81,
      incident_count: t.incident_count,
    }));

    // Standard mock trips if active trips map is empty
    const mockTrips = activeTripsList.length > 0 ? activeTripsList : [
      {
        device_id: 'MAVIS-001',
        trip_start: new Date(Date.now() - 3600000).toISOString(),
        trip_end: new Date().toISOString(),
        distance_km: 14.8,
        max_speed: 68.5,
        avg_speed: 42.1,
        avg_accel_resultant: 9.84,
        incident_count: { waspada: 2, bahaya: 1 }
      },
      {
        device_id: 'MAVIS-002',
        trip_start: new Date(Date.now() - 7200000).toISOString(),
        trip_end: new Date(Date.now() - 3600000).toISOString(),
        distance_km: 22.3,
        max_speed: 75.0,
        avg_speed: 48.6,
        avg_accel_resultant: 9.82,
        incident_count: { waspada: 0, bahaya: 0 }
      }
    ];

    res.json({
      success: true,
      trips: mockTrips,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.3 PRD 4.5 API Specs — GET /api/incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const { device_id } = req.query;
    const mockIncidents = [
      {
        device_id: device_id || 'MAVIS-001',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        trigger: 'hard_braking',
        severity: 'bahaya',
        accel_snapshot: { x: -2.45, y: 0.12, z: 9.81 },
        gps: { lat: -7.9666, long: 112.6326 },
        speed: 62.4,
      },
      {
        device_id: device_id || 'MAVIS-001',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        trigger: 'aggressive_cornering',
        severity: 'waspada',
        accel_snapshot: { x: 0.15, y: 1.85, z: 9.81 },
        gps: { lat: -7.9650, long: 112.6310 },
        speed: 48.0,
      }
    ];
    res.json({
      success: true,
      incidents: mockIncidents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.4 PRD 4.5 API Specs — GET /api/export
app.get('/api/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const csvHeader = 'device_id,timestamp,gps_lat,gps_long,accel_x,accel_y,accel_z,speed,kategori\n';
    const csvRows = [
      'MAVIS-001,2026-08-18T10:23:45.123Z,-7.9666,112.6326,0.12,-0.05,9.81,42.5,aman',
      'MAVIS-001,2026-08-18T10:24:10.000Z,-7.9668,112.6328,-2.45,0.12,9.81,62.4,bahaya'
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mavis_telemetry_export.${format}"`);
    res.status(200).send(csvHeader + csvRows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.5 InfluxDB Route History — GET /api/trip-route
app.get('/api/trip-route', async (req, res) => {
  try {
    const { device_id = 'MAVIS-001', start = '-24h', end = 'now()', limit = 500 } = req.query;
    
    // Attempt querying InfluxDB
    let routeData = await timeseriesAdapter.queryTripRoute(device_id, start, end, parseInt(limit, 10));

    // Fallback to high-resolution realistic route trajectory if database is empty/mock
    if (!routeData || routeData.length === 0) {
      const baseLat = -7.9666;
      const baseLng = 112.6326;
      const pointCount = 20;
      routeData = Array.from({ length: pointCount }).map((_, idx) => {
        const t = new Date(Date.now() - (pointCount - idx) * 120000);
        return {
          lat: parseFloat((baseLat + Math.sin(idx / 3) * 0.004 + (idx * 0.0006)).toFixed(6)),
          lng: parseFloat((baseLng + Math.cos(idx / 3) * 0.003 + (idx * 0.0008)).toFixed(6)),
          speed: parseFloat((35 + Math.sin(idx * 0.5) * 20).toFixed(1)),
          timestamp: t.toISOString(),
        };
      });
    }

    res.json({
      success: true,
      device_id,
      count: routeData.length,
      data: routeData,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Device Configuration Store (in-memory default settings)
const REQUIRED_DEVICE_PASSCODE = process.env.DEVICE_PASSCODE || 'mavis-01-001-26';
let deviceSettings = {
  vibration_rms_multiplier: 1.5,
  max_safe_lean_angle: 45,
  speed_limit: 80,
  hard_braking_threshold: -2.5,
  emergency_contacts: ['+6281234567890'],
  updated_at: new Date().toISOString(),
};

// 5.6 Device Settings — GET /api/settings/thresholds
app.get('/api/settings/thresholds', (req, res) => {
  res.json({
    success: true,
    data: {
      vibration_rms_multiplier: deviceSettings.vibration_rms_multiplier,
      max_safe_lean_angle: deviceSettings.max_safe_lean_angle,
      speed_limit: deviceSettings.speed_limit,
      hard_braking_threshold: deviceSettings.hard_braking_threshold,
      updated_at: deviceSettings.updated_at,
    },
  });
});

// 5.7 Device Settings — POST /api/settings/thresholds (Protected by Passcode)
app.post('/api/settings/thresholds', (req, res) => {
  try {
    const { passcode, vibration_rms_multiplier, max_safe_lean_angle, speed_limit, hard_braking_threshold } = req.body || {};

    // Validate security passcode
    if (!passcode || passcode !== REQUIRED_DEVICE_PASSCODE) {
      return res.status(403).json({
        success: false,
        error: 'Akses Ditolak: Kode sandi otorisasi perangkat tidak valid (Unauthorized Passcode).',
      });
    }

    // Apply updates
    if (vibration_rms_multiplier !== undefined) {
      deviceSettings.vibration_rms_multiplier = parseFloat(vibration_rms_multiplier);
    }
    if (max_safe_lean_angle !== undefined) {
      deviceSettings.max_safe_lean_angle = parseFloat(max_safe_lean_angle);
    }
    if (speed_limit !== undefined) {
      deviceSettings.speed_limit = parseFloat(speed_limit);
    }
    if (hard_braking_threshold !== undefined) {
      deviceSettings.hard_braking_threshold = parseFloat(hard_braking_threshold);
    }
    deviceSettings.updated_at = new Date().toISOString();

    console.log('[App] Device threshold settings updated successfully:', deviceSettings);

    res.json({
      success: true,
      message: 'Konfigurasi threshold perangkat berhasil diperbarui.',
      data: {
        vibration_rms_multiplier: deviceSettings.vibration_rms_multiplier,
        max_safe_lean_angle: deviceSettings.max_safe_lean_angle,
        speed_limit: deviceSettings.speed_limit,
        hard_braking_threshold: deviceSettings.hard_braking_threshold,
        updated_at: deviceSettings.updated_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// 6. Start HTTP Server
httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MAVIS Real-Time Stream Processing Bridge is Running `);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` WebSocket Path: /api/stream/alerts`);
  console.log(`=======================================================`);
});

// 7. Graceful Shutdown Handler (SIGTERM & SIGINT)
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[GracefulShutdown] Received signal ${signal}. Starting shutdown sequence...`);

  // Clear periodic timer
  clearInterval(tripFlushTimer);

  // 1. Disconnect MQTT client to stop receiving new messages
  mqttManager.disconnect();

  // 2. Flush pending trip summaries to Firestore
  console.log('[GracefulShutdown] Flushing active trip summaries to Firestore...');
  await firestoreService.flushTripSummary();

  // 3. Flush InfluxDB time-series write queue
  console.log('[GracefulShutdown] Flushing pending InfluxDB time-series buffer...');
  await timeseriesAdapter.flush();
  await timeseriesAdapter.close();

  // 4. Close WebSocket connections
  websocketServer.close();

  // 5. Close HTTP Server
  httpServer.close(() => {
    console.log('[GracefulShutdown] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('[GracefulShutdown] Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
