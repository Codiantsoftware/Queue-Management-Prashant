const config = require("./index");

const corsOptions = {
  origin:
    config.NODE_ENV === "production"
      ? (config.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3000",
          true,
        ], // Allow common dev ports in development
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  credentials: false,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

module.exports = corsOptions;
