import { WebSocketServer, WebSocket } from 'ws';

/**
 * WebSocket Server Service
 * 
 * Provides real-time event pushing to connected web dashboard clients without polling.
 */
export class DashboardWebSocketServer {
  /**
   * @param {import('http').Server} httpServer
   * @param {string} [path]
   */
  constructor(httpServer, path = '/api/stream/alerts') {
    this.wss = new WebSocketServer({ server: httpServer, path });
    this.clients = new Set();

    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      console.log(`[WebSocketServer] Client connected from ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      // Send initial welcome/connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to MAVIS Real-Time Alert Stream',
        timestamp: new Date().toISOString(),
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      });

      ws.on('close', () => {
        console.log('[WebSocketServer] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('[WebSocketServer] Client socket error:', err.message);
        this.clients.delete(ws);
      });
    });

    console.log(`[WebSocketServer] WebSocket server initialized on path ${this.wss.options.path}`);
  }

  /**
   * Broadcast alert event to all active dashboard clients
   * 
   * @param {Object} alertPayload 
   * @param {string} alertPayload.device_id
   * @param {string} alertPayload.level 'waspada' | 'bahaya'
   * @param {string} alertPayload.trigger 'hard_braking' | 'aggressive_cornering'
   * @param {string} [alertPayload.timestamp]
   * @param {Object} [alertPayload.gps]
   * @param {number} [alertPayload.speed]
   */
  broadcastAlert(alertPayload) {
    const payloadString = JSON.stringify({
      type: 'alert',
      data: alertPayload,
      timestamp: alertPayload.timestamp || new Date().toISOString(),
    });

    let count = 0;
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadString);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[WebSocketServer] Broadcasted alert (${alertPayload.level}) to ${count} active clients.`);
    }
  }

  /**
   * Close all active socket connections
   */
  close() {
    for (const client of this.clients) {
      client.close(1001, 'Server shutting down');
    }
    this.wss.close();
    console.log('[WebSocketServer] WebSocket server closed.');
  }
}
