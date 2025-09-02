const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ],
      mediaSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow serving media files
  crossOriginResourcePolicy: { policy: "cross-origin" },
};

module.exports = { helmetConfig };
