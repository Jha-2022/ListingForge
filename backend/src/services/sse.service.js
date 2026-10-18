const logger = require('../utils/logger');

/**
 * Simple SSE (Server-Sent Events) broadcaster.
 * Manages connected clients per channel and broadcasts events.
 */
class SSEBroadcaster {
  constructor() {
    /** @type {Map<string, Set<import('express').Response>>} */
    this.channels = new Map();
  }

  /**
   * Add a client to a channel.
   * @param {string} channel
   * @param {import('express').Response} res
   */
  addClient(channel, res) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(res);

    res.on('close', () => {
      this.removeClient(channel, res);
    });

    logger.debug({ channel, clients: this.channels.get(channel).size }, 'SSE client connected');
  }

  /**
   * Remove a client from a channel.
   * @param {string} channel
   * @param {import('express').Response} res
   */
  removeClient(channel, res) {
    const clients = this.channels.get(channel);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Broadcast an event to all clients on a channel.
   * @param {string} channel
   * @param {string} event - event name
   * @param {object} data - JSON-serializable data
   */
  broadcast(channel, event, data) {
    const clients = this.channels.get(channel);
    if (!clients || clients.size === 0) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) {
      try {
        client.write(message);
      } catch (err) {
        logger.warn({ error: err.message }, 'Failed to write SSE message');
        this.removeClient(channel, client);
      }
    }
  }
}

// Singleton instance
const sseBroadcaster = new SSEBroadcaster();

module.exports = { sseBroadcaster };
