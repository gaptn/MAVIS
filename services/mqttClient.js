import mqtt from 'mqtt';
import { z } from 'zod';

// Zod Schema for strict payload validation
export const telemetrySchema = z.object({
  device_id: z.string({ required_error: 'device_id is required' }),
  timestamp: z.string({ required_error: 'timestamp is required' }),
  gps_lat: z.number({ required_error: 'gps_lat must be a number' }),
  gps_long: z.number({ required_error: 'gps_long must be a number' }),
  accel_x: z.number({ required_error: 'accel_x must be a number' }),
  accel_y: z.number({ required_error: 'accel_y must be a number' }),
  accel_z: z.number({ required_error: 'accel_z must be a number' }),
  speed: z.number({ required_error: 'speed must be a number' }),
  kategori: z.enum(['aman', 'waspada', 'bahaya']).optional(),
});

/**
 * MQTT Client Manager for HiveMQ Cloud
 */
export class MQTTClientManager {
  /**
   * @param {Object} options
   * @param {import('./noiseFilter.js').NoiseFilter} options.noiseFilter
   * @param {import('./streamEngine.js').StreamProcessingEngine} options.streamEngine
   * @param {import('./timeseriesAdapter.js').TimeSeriesAdapter} options.timeseriesAdapter
   * @param {import('./firestoreService.js').FirestoreService} options.firestoreService
   * @param {import('./websocketServer.js').DashboardWebSocketServer} options.websocketServer
   */
  constructor(options) {
    this.noiseFilter = options.noiseFilter;
    this.streamEngine = options.streamEngine;
    this.timeseriesAdapter = options.timeseriesAdapter;
    this.firestoreService = options.firestoreService;
    this.websocketServer = options.websocketServer;

    this.client = null;
    this.isConnected = false;
  }

  connect() {
    const host = process.env.HIVEMQ_HOST;
    const port = process.env.HIVEMQ_PORT || '8883';
    const username = process.env.HIVEMQ_USERNAME;
    const password = process.env.HIVEMQ_PASSWORD;

    if (!host) {
      console.warn('[MQTTClient] HIVEMQ_HOST missing. Skipping MQTT connection.');
      return;
    }

    const connectUrl = `mqtts://${host}:${port}`;
    console.log(`[MQTTClient] Connecting to HiveMQ Cloud at ${connectUrl}...`);

    this.client = mqtt.connect(connectUrl, {
      username,
      password,
      clean: false, // Persistent session
      clientId: 'mavis_bridge_v2',
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      rejectUnauthorized: true,
    });

    this.client.on('connect', (connack) => {
      this.isConnected = true;
      console.log('[MQTTClient] Successfully connected to HiveMQ Cloud. SessionPresent:', connack.sessionPresent);

      // Subscribe to telemetry and status topics (QoS 1)
      this.client.subscribe(['mavis/+/telemetry', 'mavis/+/status'], { qos: 1 }, (err, granted) => {
        if (err) {
          console.error('[MQTTClient] Subscription error:', err.message);
        } else {
          console.log('[MQTTClient] Subscribed to topics:', granted.map((g) => g.topic).join(', '));
        }
      });
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.client.on('reconnect', () => {
      console.log('[MQTTClient] Reconnecting to HiveMQ Cloud...');
    });

    this.client.on('error', (err) => {
      console.error('[MQTTClient] Connection error:', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.warn('[MQTTClient] Connection closed.');
    });
  }

  /**
   * Parse topic and route incoming MQTT payload
   * 
   * @param {string} topic 
   * @param {Buffer} payloadBuffer 
   */
  async handleMessage(topic, payloadBuffer) {
    try {
      const topicParts = topic.split('/');
      // Topic structure: mavis/{device_id}/{telemetry|status}
      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      const rawString = payloadBuffer.toString('utf8');
      const jsonPayload = JSON.parse(rawString);

      if (messageType === 'telemetry') {
        await this.processTelemetry(jsonPayload);
      } else if (messageType === 'status') {
        await this.processStatus(deviceId, jsonPayload);
      }
    } catch (err) {
      console.error(`[MQTTClient] Error handling message on topic ${topic}:`, err.message);
    }
  }

  /**
   * Process telemetry message through the bridge pipeline
   * 
   * @param {Object} rawPayload 
   */
  async processTelemetry(rawPayload) {
    // 1. Validate payload schema with Zod
    const validationResult = telemetrySchema.safeParse(rawPayload);
    if (!validationResult.success) {
      console.warn(
        `[MQTTClient] Payload validation warning for device "${rawPayload?.device_id || 'unknown'}":`,
        validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      );
      // DO NOT crash process — continue with valid fields or return
      if (!rawPayload?.device_id) return;
    }

    const payload = validationResult.success ? validationResult.data : rawPayload;

    // 2. Apply Noise Filtering (Moving Average)
    const filteredSample = this.noiseFilter.filter(payload);

    // 3. Evaluate in Stream Processing Engine (Anomaly Detection)
    const evaluatedSample = this.streamEngine.process(filteredSample);

    // 4. Write to Time-Series DB (InfluxDB Cloud)
    await this.timeseriesAdapter.writePoint(evaluatedSample);

    // 5. Track in-memory trip statistics for Firestore
    this.firestoreService.trackTrip(evaluatedSample);

    // 6. Handle Non-Aman incidents & Feedback loop
    if (evaluatedSample.kategori !== 'aman') {
      // Write incident document to Firestore
      await this.firestoreService.saveIncident(evaluatedSample);

      // Publish Feedback Alert back to ESP32 via MQTT
      const alertTopic = `mavis/${evaluatedSample.device_id}/alert`;
      const alertPayload = JSON.stringify({
        level: evaluatedSample.kategori, // 'waspada' | 'bahaya'
        trigger: evaluatedSample.trigger,
        timestamp: evaluatedSample.timestamp,
      });

      if (this.client && this.isConnected) {
        this.client.publish(alertTopic, alertPayload, { qos: 1 }, (err) => {
          if (err) {
            console.error(`[MQTTClient] Failed to publish alert feedback to ${alertTopic}:`, err.message);
          } else {
            console.log(`[MQTTClient] Published feedback alert to ${alertTopic}: ${alertPayload}`);
          }
        });
      }

      // Broadcast alert event to Web Dashboard clients via WebSocket
      this.websocketServer.broadcastAlert({
        device_id: evaluatedSample.device_id,
        level: evaluatedSample.kategori,
        trigger: evaluatedSample.trigger,
        timestamp: evaluatedSample.timestamp,
        gps: { lat: evaluatedSample.gps_lat, long: evaluatedSample.gps_long },
        speed: evaluatedSample.speed,
        metrics: evaluatedSample.metrics,
      });
    }
  }

  /**
   * Process status message (e.g. online/offline)
   * 
   * @param {string} deviceId 
   * @param {Object} statusPayload 
   */
  async processStatus(deviceId, statusPayload) {
    console.log(`[MQTTClient] Device status update [${deviceId}]:`, statusPayload);
    // If device goes offline (online: false), flush its trip summary
    if (statusPayload.online === false) {
      console.log(`[MQTTClient] Device ${deviceId} offline. Triggering trip summary flush...`);
      await this.firestoreService.flushTripSummary(deviceId);
    }
  }

  /**
   * Close MQTT client connection gracefully
   */
  disconnect() {
    if (this.client) {
      console.log('[MQTTClient] Disconnecting from HiveMQ Cloud...');
      this.client.end(false, () => {
        console.log('[MQTTClient] MQTT client disconnected.');
      });
    }
  }
}
