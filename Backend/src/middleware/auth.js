const config = require("../config");

const authenticateApiKey = (req, res, next) => {
  if (req.path.startsWith("/assets") || req.path === "/health") {
    return next();
  }

  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (config.NODE_ENV === "production" && (!apiKey || apiKey !== config.API_KEY)) {
    return res.status(401).json({
      error: "Unauthorized. Valid API key required.",
      code: "INVALID_API_KEY",
    });
  }

  next();
};

module.exports = { authenticateApiKey };
