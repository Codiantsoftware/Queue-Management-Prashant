const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let receivedWebhooks = [];

app.post("/webhook", (req, res) => {
  const timestamp = new Date().toISOString();
  const webhookData = {
    id: receivedWebhooks.length + 1,
    timestamp,
    payload: req.body,
    headers: req.headers,
  };

  receivedWebhooks.unshift(webhookData);

  if (receivedWebhooks.length > 50) {
    receivedWebhooks = receivedWebhooks.slice(0, 50);
  }

  console.log("\n🔔 WEBHOOK RECEIVED:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📅 Timestamp:", timestamp);
  console.log("🆔 Job ID:", req.body.jobId || "N/A");
  console.log("📊 Status:", req.body.status || "N/A");
  console.log(
    "⚡ Progress:",
    req.body.progress !== undefined ? `${req.body.progress}%` : "N/A"
  );
  console.log("🏷️  Type:", req.body.type || "N/A");
  console.log("🏢 Brand:", req.body.brand || "N/A");
  if (req.body.result) {
    console.log("✅ Result:", req.body.result);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  res.status(200).json({
    message: "Webhook received successfully",
    id: webhookData.id,
    timestamp,
  });
});

app.listen(PORT, () => {
  console.log("\n🚀 Webhook Test Server Started!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📊 View webhooks: http://localhost:${PORT}/webhooks`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✨ Ready to receive webhook notifications!");
  console.log(
    "💡 Use this URL in your job form: http://localhost:3001/webhook\n"
  );
});

process.on("SIGTERM", () => {
  console.log("\n👋 Webhook Test Server shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 Webhook Test Server shutting down gracefully...");
  process.exit(0);
});
