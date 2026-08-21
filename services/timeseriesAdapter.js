import { InfluxDB, Point } from '@influxdata/influxdb-client';

/**
 * Generic Interface for Time-Series Database Adapter
 */
export class TimeSeriesAdapter {
  async writePoint(sample) {
    throw new Error('Method writePoint() must be implemented');
  }

  async flush() {
    throw new Error('Method flush() must be implemented');
  }

  async close() {
    throw new Error('Method close() must be implemented');
  }
}

/**
 * InfluxDB Cloud Adapter Implementation
 */
export class InfluxDBAdapter extends TimeSeriesAdapter {
  /**
   * @param {Object} [config]
   * @param {string} [config.url]
   * @param {string} [config.token]
   * @param {string} [config.org]
   * @param {string} [config.bucket]
   */
  constructor(config = {}) {
    super();
    this.url = config.url || process.env.INFLUXDB_URL || 'https://europe-west1-1.gcp.cloud2.influxdata.com';
    this.token = config.token || process.env.INFLUXDB_TOKEN || '';
    this.org = config.org || process.env.INFLUXDB_ORG || 'mavis-org';
    this.bucket = config.bucket || process.env.INFLUXDB_BUCKET || 'mavis_telemetry';

    this.isConfigured = Boolean(this.url && this.token);

    if (this.isConfigured) {
      this.client = new InfluxDB({ url: this.url, token: this.token });
      this.writeApi = this.client.getWriteApi(this.org, this.bucket, 'ns', {
        batchSize: 10,
        flushInterval: 5000,
        maxRetries: 3,
      });

      this.writeApi.listener = {
        error: (error) => {
          console.error('[InfluxDBAdapter] Write error:', error.message);
        },
      };
    } else {
      console.warn('[InfluxDBAdapter] InfluxDB credentials missing or incomplete. Operating in mock mode.');
    }
  }

  /**
   * Write filtered telemetry point to InfluxDB Cloud
   * 
   * @param {Object} sample Filtered telemetry point from Stream Processing Engine
   */
  async writePoint(sample) {
    if (!this.isConfigured) {
      // Mock logging if not configured
      return;
    }

    try {
      const timestampDate = sample.timestamp ? new Date(sample.timestamp) : new Date();

      const point = new Point('telemetry')
        .tag('device_id', sample.device_id || 'UNKNOWN')
        .floatField('accel_x', Number(sample.accel_x || 0))
        .floatField('accel_y', Number(sample.accel_y || 0))
        .floatField('accel_z', Number(sample.accel_z || 0))
        .floatField('gps_lat', Number(sample.gps_lat || 0))
        .floatField('gps_long', Number(sample.gps_long || 0))
        .floatField('speed', Number(sample.speed || 0))
        .stringField('kategori', String(sample.kategori || 'aman'))
        .timestamp(timestampDate);

      if (sample.metrics?.delta_acc !== undefined) {
        point.floatField('delta_acc', Number(sample.metrics.delta_acc));
      }
      if (sample.metrics?.tilt_angle !== undefined) {
        point.floatField('tilt_angle', Number(sample.metrics.tilt_angle));
      }

      this.writeApi.writePoint(point);
    } catch (err) {
      console.error('[InfluxDBAdapter] Failed to construct/queue InfluxDB point:', err.message);
    }
  }

  /**
   * Query historical GPS coordinates for Leaflet.js Polyline rendering
   * 
   * @param {string} deviceId Device identifier
   * @param {string} [start='-24h'] InfluxDB start time range
   * @param {string} [end='now()'] InfluxDB end time range
   * @param {number} [limit=500] Maximum coordinates to retrieve
   * @returns {Promise<Array<{lat: number, lng: number, speed: number, timestamp: string}>>}
   */
  async queryTripRoute(deviceId = 'MAVIS-001', start = '-24h', end = 'now()', limit = 500) {
    if (!this.isConfigured || !this.client) {
      return null;
    }

    const queryApi = this.client.getQueryApi(this.org);
    const fluxQuery = `
      from(bucket: "${this.bucket}")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.device_id == "${deviceId}")
        |> filter(fn: (r) => r._field == "gps_lat" or r._field == "gps_long" or r._field == "speed")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: false)
        |> limit(n: ${limit})
    `;

    const results = [];
    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next: (row, tableMetadata) => {
          const o = tableMetadata.toObject(row);
          if (o.gps_lat !== undefined && o.gps_long !== undefined) {
            results.push({
              lat: Number(o.gps_lat),
              lng: Number(o.gps_long),
              speed: Number(o.speed || 0),
              timestamp: o._time,
            });
          }
        },
        error: (error) => {
          console.warn('[InfluxDBAdapter] Query error, falling back:', error.message);
          resolve(null);
        },
        complete: () => {
          resolve(results);
        },
      });
    });
  }

  /**
   * Flush write queue to InfluxDB
   */
  async flush() {
    if (!this.isConfigured || !this.writeApi) return;
    try {
      await this.writeApi.flush();
      console.log('[InfluxDBAdapter] Successfully flushed pending write buffer.');
    } catch (err) {
      console.error('[InfluxDBAdapter] Error during flush:', err.message);
    }
  }

  /**
   * Graceful close of write API
   */
  async close() {
    if (!this.isConfigured || !this.writeApi) return;
    try {
      await this.writeApi.close();
      console.log('[InfluxDBAdapter] Closed InfluxDB connection.');
    } catch (err) {
      console.error('[InfluxDBAdapter] Error closing InfluxDB connection:', err.message);
    }
  }
}

