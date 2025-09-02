const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const config = require("./config");
const corsOptions = require("./config/corsConfig");
const { helmetConfig } = require("./config/securityConfig");

const { limiter } = require("./middleware/rateLimiter");
const { authenticateApiKey } = require("./middleware/auth");
const { sanitizeInput } = require("./middleware/sanitizer");
const { staticFileMiddleware, staticFileOptions } = require("./middleware/staticFiles");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const jobRoutes = require("./routes/jobs");

require("./services/jobWorker");

const app = express();

app.use(helmet(helmetConfig));

app.use(limiter);

app.use(cors(corsOptions));
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(sanitizeInput);
app.use(
  "/assets",
  staticFileMiddleware,
  express.static(path.join(__dirname, "../assets"), staticFileOptions)
);

app.use("/jobs", authenticateApiKey);

app.use("/jobs", jobRoutes);

app.use(errorHandler);

app.use("*", notFoundHandler);

module.exports = app;
