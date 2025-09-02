const axios = require("axios");

async function sendWebhookNotification(webhookUrl, jobData) {
  if (!webhookUrl) return;

  try {
    await axios.post(
      webhookUrl,
      {
        jobId: jobData.jobId,
        status: jobData.status,
        progress: jobData.progress,
        type: jobData.type,
        brand: jobData.brand,
        result: jobData.result,
        timestamp: new Date().toISOString(),
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AI-Workflow-Manager/1.0",
        },
      }
    );
  } catch (error) {
    console.error(
      `Webhook notification failed for job ${jobData.jobId}:`,
      error.message
    );
  }
}

module.exports = { sendWebhookNotification };
