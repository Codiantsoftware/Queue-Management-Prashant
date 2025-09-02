const config = {
  PORT: process.env.PORT || 5000,
  API_KEY: process.env.API_KEY || "default-dev-key-change-in-production",
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "",
};

module.exports = config;
