const { Queue } = require("bullmq");
const redis = require("./redis");

const jobQueue = new Queue("ai-jobs", { connection: redis });

const cancelledJobs = new Set();
const cancelledJobsData = new Map();

module.exports = { jobQueue, cancelledJobs, cancelledJobsData };
