const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const config = require("./config");
const redis = require("./services/redis");
const { jobQueue } = require("./services/jobQueue");

const PORT = config.PORT;

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");

  await redis.quit();

  await jobQueue.close();

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");

  await redis.quit();

  await jobQueue.close();

  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security mode: ${config.NODE_ENV}`);
  console.log(
    `🔑 API Key required in production: ${config.NODE_ENV === "production"}`
  );
});

module.exports = app;
