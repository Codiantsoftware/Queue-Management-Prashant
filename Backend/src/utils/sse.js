const { sendWebhookNotification } = require("./webhook");

const sseConnections = new Map();

async function broadcastSSE(jobId, data, webhookUrl = null) {
  const connections = sseConnections.get(jobId) || [];

  if (connections.length > 0) {
    const validConnections = [];

    connections.forEach((res) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        validConnections.push(res);
      } catch (error) {
        console.error("Connection broken:", error);
      }
    });

    if (validConnections.length > 0) {
      sseConnections.set(jobId, validConnections);
    } else {
      sseConnections.delete(jobId);
    }
  }

  if (webhookUrl) {
    await sendWebhookNotification(webhookUrl, data);
  }
}

module.exports = { sseConnections, broadcastSSE };
