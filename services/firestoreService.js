import firebaseAdmin from 'firebase-admin';

/**
 * Firestore Service
 * 
 * Manages dual-storage document writes to Google Cloud Firestore:
 * 1. Collection `incidents` (written when kategori != 'aman')
 * 2. Collection `trip_summaries` (aggregated trip stats written periodically or on trip end)
 */
export class FirestoreService {
  constructor() {
    this.db = null;
    this.isConfigured = false;
    /** @type {Map<string, Object>} */
    this.activeTrips = new Map();

    this.initFirebase();
  }

  initFirebase() {
    try {
      const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (rawServiceAccount) {
        let serviceAccount;
        if (rawServiceAccount.startsWith('{')) {
          serviceAccount = JSON.parse(rawServiceAccount);
        } else {
          // Assume base64 encoded or path
          const decoded = Buffer.from(rawServiceAccount, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        }

        if (!firebaseAdmin.apps.length) {
          firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
          });
        }
        this.db = firebaseAdmin.firestore();
        this.isConfigured = true;
        console.log('[FirestoreService] Firebase Admin SDK initialized successfully.');
      } else {
        console.warn('[FirestoreService] FIREBASE_SERVICE_ACCOUNT_JSON env var missing. Operating in mock mode.');
      }
    } catch (err) {
      console.error('[FirestoreService] Failed to initialize Firebase Admin SDK:', err.message);
      this.isConfigured = false;
    }
  }

  /**
   * Save an anomaly event to Firestore collection `incidents`
   * 
   * @param {Object} sample Evaluated sample from Stream Processing Engine
   */
  async saveIncident(sample) {
    if (sample.kategori === 'aman') return;

    const incidentData = {
      device_id: sample.device_id,
      timestamp: sample.timestamp || new Date().toISOString(),
      trigger: sample.trigger || 'manual_alert',
      severity: sample.kategori, // 'waspada' | 'bahaya'
      accel_snapshot: {
        x: sample.accel_x,
        y: sample.accel_y,
        z: sample.accel_z,
      },
      gps: {
        lat: sample.gps_lat,
        long: sample.gps_long,
      },
      speed: sample.speed,
      created_at: firebaseAdmin.firestore.FieldValue.serverTimestamp
        ? firebaseAdmin.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString(),
    };

    if (this.isConfigured && this.db) {
      try {
        // Deduplikasi: gunakan composite key device_id + timestamp sebagai document ID
        // sehingga duplikat dari QoS 1 akan overwrite, bukan membuat dokumen baru
        const docId = `${sample.device_id}_${sample.timestamp || new Date().toISOString()}`;
        const sanitizedDocId = docId.replace(/[\/\\.:]/g, '_');
        await this.db.collection('incidents').doc(sanitizedDocId).set(incidentData, { merge: true });
        console.log(`[FirestoreService] Saved incident (${sample.kategori}) for device ${sample.device_id}`);
      } catch (err) {
        console.error('[FirestoreService] Failed to write incident to Firestore:', err.message);
      }
    } else {
      console.log(`[FirestoreService Mock] Saved incident (${sample.kategori}) for device ${sample.device_id}`);
    }
  }

  /**
   * Track telemetry sample into in-memory trip statistics
   * 
   * @param {Object} sample Evaluated sample from Stream Processing Engine
   */
  trackTrip(sample) {
    const deviceId = sample.device_id;
    const now = new Date(sample.timestamp || Date.now());

    if (!this.activeTrips.has(deviceId)) {
      this.activeTrips.set(deviceId, {
        device_id: deviceId,
        trip_start: now.toISOString(),
        trip_end: now.toISOString(),
        last_updated: Date.now(),
        sample_count: 0,
        max_speed: sample.speed || 0,
        total_speed_sum: 0,
        total_accel_sum: 0,
        incident_count: { waspada: 0, bahaya: 0 },
        last_gps: { lat: sample.gps_lat, long: sample.gps_long },
        distance_km: 0,
      });
    }

    const trip = this.activeTrips.get(deviceId);
    trip.trip_end = now.toISOString();
    trip.last_updated = Date.now();
    trip.sample_count += 1;
    trip.max_speed = Math.max(trip.max_speed, sample.speed || 0);
    trip.total_speed_sum += sample.speed || 0;

    const resultantAcc = Math.sqrt(
      sample.accel_x ** 2 + sample.accel_y ** 2 + sample.accel_z ** 2
    );
    trip.total_accel_sum += resultantAcc;

    if (sample.kategori === 'waspada') trip.incident_count.waspada += 1;
    if (sample.kategori === 'bahaya') trip.incident_count.bahaya += 1;

    // Calculate distance incrementally via Haversine
    if (trip.last_gps && sample.gps_lat && sample.gps_long) {
      const distDelta = this.haversineDistance(
        trip.last_gps.lat,
        trip.last_gps.long,
        sample.gps_lat,
        sample.gps_long
      );
      // Filter out unreasonable GPS jumps (> 200m per second)
      if (distDelta < 0.2) {
        trip.distance_km += distDelta;
      }
    }
    trip.last_gps = { lat: sample.gps_lat, long: sample.gps_long };
  }

  /**
   * Flush active trip summary for a device (or all devices) to Firestore collection `trip_summaries`
   * 
   * @param {string} [deviceId] 
   */
  async flushTripSummary(deviceId) {
    const devicesToFlush = deviceId ? [deviceId] : Array.from(this.activeTrips.keys());

    for (const devId of devicesToFlush) {
      const trip = this.activeTrips.get(devId);
      if (!trip || trip.sample_count === 0) continue;

      const summaryDoc = {
        device_id: trip.device_id,
        trip_start: trip.trip_start,
        trip_end: trip.trip_end,
        distance_km: parseFloat(trip.distance_km.toFixed(2)),
        max_speed: parseFloat(trip.max_speed.toFixed(1)),
        avg_speed: parseFloat((trip.total_speed_sum / trip.sample_count).toFixed(1)),
        avg_accel_resultant: parseFloat((trip.total_accel_sum / trip.sample_count).toFixed(2)),
        sample_count: trip.sample_count,
        incident_count: { ...trip.incident_count },
        created_at: firebaseAdmin.firestore.FieldValue.serverTimestamp
          ? firebaseAdmin.firestore.FieldValue.serverTimestamp()
          : new Date().toISOString(),
      };

      if (this.isConfigured && this.db) {
        try {
          await this.db.collection('trip_summaries').add(summaryDoc);
          console.log(`[FirestoreService] Flushed trip_summary for ${devId} (${summaryDoc.distance_km} km)`);
        } catch (err) {
          console.error(`[FirestoreService] Failed to flush trip summary for ${devId}:`, err.message);
        }
      } else {
        console.log(`[FirestoreService Mock] Flushed trip_summary for ${devId}:`, summaryDoc);
      }

      this.activeTrips.delete(devId);
    }
  }

  /**
   * Haversine formula to compute distance between 2 GPS coordinates in km
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
