const config = require("../config");

const errorHandler = (error, req, res, next) => {
  const isDev = config.NODE_ENV === "development";

  res.status(error.status || 500).json({
    error: isDev ? error.message : "Internal server error",
    code: error.code || "INTERNAL_ERROR",
    ...(isDev && { stack: error.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    path: req.originalUrl,
  });
};

module.exports = { errorHandler, notFoundHandler };
