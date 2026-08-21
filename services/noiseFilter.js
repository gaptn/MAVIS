/**
 * NoiseFilter Service
 * 
 * Applies Moving Average filtering (n=5 by default, configurable via MA_WINDOW_SIZE)
 * to accel_x, accel_y, and accel_z telemetry data per device.
 */
export class NoiseFilter {
  /**
   * @param {number} [windowSize]
   */
  constructor(windowSize) {
    this.windowSize = windowSize || parseInt(process.env.MA_WINDOW_SIZE || '5', 10);
    /** @type {Map<string, { x: number[], y: number[], z: number[] }>} */
    this.buffers = new Map();
  }

  /**
   * Filter telemetry payload for a specific device
   * 
   * @param {Object} payload 
   * @param {string} payload.device_id
   * @param {number} payload.accel_x
   * @param {number} payload.accel_y
   * @param {number} payload.accel_z
   * @returns {Object} Filtered telemetry sample with updated accel_x, accel_y, accel_z
   */
  filter(payload) {
    const deviceId = payload.device_id;

    if (!this.buffers.has(deviceId)) {
      this.buffers.set(deviceId, { x: [], y: [], z: [] });
    }

    const buf = this.buffers.get(deviceId);

    // Push new samples
    buf.x.push(payload.accel_x);
    buf.y.push(payload.accel_y);
    buf.z.push(payload.accel_z);

    // Maintain window size
    if (buf.x.length > this.windowSize) buf.x.shift();
    if (buf.y.length > this.windowSize) buf.y.shift();
    if (buf.z.length > this.windowSize) buf.z.shift();

    // Calculate moving average
    const filteredX = this.average(buf.x);
    const filteredY = this.average(buf.y);
    const filteredZ = this.average(buf.z);

    return {
      ...payload,
      accel_x: parseFloat(filteredX.toFixed(4)),
      accel_y: parseFloat(filteredY.toFixed(4)),
      accel_z: parseFloat(filteredZ.toFixed(4)),
    };
  }

  /**
   * Helper to compute average of array numbers
   * @param {number[]} arr 
   * @returns {number}
   */
  average(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  /**
   * Clear buffer for a device or all devices
   * @param {string} [deviceId] 
   */
  clear(deviceId) {
    if (deviceId) {
      this.buffers.delete(deviceId);
    } else {
      this.buffers.clear();
    }
  }
}
