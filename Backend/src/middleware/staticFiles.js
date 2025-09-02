const express = require("express");
const path = require("path");
const config = require("../config");

const staticFileMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins =
    config.NODE_ENV === "production"
      ? (config.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3000",
        ];

  if (config.NODE_ENV === "development" || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  } else if (config.NODE_ENV === "development") {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "false");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("Cache-Control", "public, max-age=3600");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  const normalizedPath = path.normalize(req.url);
  if (normalizedPath.includes("..") || normalizedPath.includes("~")) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
};

const staticFileOptions = {
  dotfiles: "deny",
  index: false,
  maxAge: "1h",
  setHeaders: (res, filePath) => {
    res.setHeader("X-Frame-Options", "DENY");
  },
};

module.exports = { staticFileMiddleware, staticFileOptions };
