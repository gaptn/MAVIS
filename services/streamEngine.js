/**
 * StreamProcessingEngine Service
 * 
 * Analyzes real-time filtered IoT telemetry to detect driving anomalies:
 * 1. Hard Braking / Aggressive Acceleration (|Δa| > THRESHOLD_ACC)
 * 2. Aggressive Cornering (tilt angle θ > THRESHOLD_ANGLE)
 * 
 * Outputs authoritative driving status: 'aman', 'waspada', or 'bahaya'.
 */
export class StreamProcessingEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.thresholdAcc]
   * @param {number} [options.thresholdAngle]
   */
  constructor(options = {}) {
    this.thresholdAcc = options.thresholdAcc || parseFloat(process.env.THRESHOLD_ACC || '3.5');
    this.thresholdAngle = options.thresholdAngle || parseFloat(process.env.THRESHOLD_ANGLE || '35');

    /** @type {Map<string, { accel_x: number, accel_y: number, accel_z: number, resultant: number, timestamp: string }>} */
    this.previousSamples = new Map();
  }

  /**
   * Process a single filtered telemetry payload
   * 
   * @param {Object} sample Filtered sample from NoiseFilter
   * @returns {Object} Evaluation result with category, trigger, and details
   */
  process(sample) {
    const deviceId = sample.device_id;
    const { accel_x, accel_y, accel_z } = sample;

    // Calculate resultant acceleration: sqrt(x^2 + y^2 + z^2)
    const currentResultant = Math.sqrt(
      accel_x * accel_x + accel_y * accel_y + accel_z * accel_z
    );

    // Calculate roll/tilt angle θ = arctan(|accel_x| / |accel_z|) in degrees
    const absZ = Math.abs(accel_z) < 0.001 ? 0.001 : Math.abs(accel_z);
    const tiltAngleDegrees = Math.atan(Math.abs(accel_x) / absZ) * (180 / Math.PI);

    let deltaAcc = 0;
    const prev = this.previousSamples.get(deviceId);
    if (prev) {
      deltaAcc = Math.abs(currentResultant - prev.resultant);
    }

    // Save current sample state for next delta calculation
    this.previousSamples.set(deviceId, {
      accel_x,
      accel_y,
      accel_z,
      resultant: currentResultant,
      timestamp: sample.timestamp,
    });

    const triggers = [];

    // Check Hard Braking / Aggressive Acceleration
    if (deltaAcc > this.thresholdAcc) {
      triggers.push('hard_braking');
    }

    // Check Aggressive Cornering
    if (tiltAngleDegrees > this.thresholdAngle) {
      triggers.push('aggressive_cornering');
    }

    // Determine authoritative category
    let category = 'aman';
    let primaryTrigger = null;

    if (triggers.length > 0) {
      primaryTrigger = triggers[0];
      // If deltaAcc or tiltAngle exceed 1.5x threshold OR multiple triggers, classify as 'bahaya'
      const isSevereAcc = deltaAcc > this.thresholdAcc * 1.5;
      const isSevereAngle = tiltAngleDegrees > this.thresholdAngle * 1.5;

      if (triggers.length > 1 || isSevereAcc || isSevereAngle) {
        category = 'bahaya';
      } else {
        category = 'waspada';
      }
    }

    return {
      ...sample,
      kategori: category,
      authoritative_kategori: category,
      trigger: primaryTrigger,
      triggers,
      metrics: {
        delta_acc: parseFloat(deltaAcc.toFixed(2)),
        tilt_angle: parseFloat(tiltAngleDegrees.toFixed(2)),
        resultant_acc: parseFloat(currentResultant.toFixed(2)),
      },
    };
  }

  /**
   * Reset internal previous states
   * @param {string} [deviceId] 
   */
  reset(deviceId) {
    if (deviceId) {
      this.previousSamples.delete(deviceId);
    } else {
      this.previousSamples.clear();
    }
  }
}
