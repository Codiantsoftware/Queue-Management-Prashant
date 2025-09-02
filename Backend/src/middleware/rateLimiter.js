const rateLimit = require("express-rate-limit");
const config = require("../config");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === "production" ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const jobSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.NODE_ENV === "production" ? 5 : 50, // Limit job submissions
  message: {
    error:
      "Too many job submissions, please wait before submitting another job.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { limiter, jobSubmissionLimiter };
