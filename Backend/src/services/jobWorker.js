const { Worker } = require("bullmq");
const redis = require("./redis");
const { broadcastSSE } = require("../utils/sse");
const { cancelledJobs } = require("./jobQueue");

const jobWorker = new Worker(
  "ai-jobs",
  async (job) => {
    try {
      const { type, brand, prompt, webhookUrl } = job.data;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (cancelledJobs.has(job.id)) {

        
        const cancelUpdate = {
          jobId: job.id,
          status: "cancelled",
          progress: 0,
          brand,
          type,
          result: null,
        };
        await broadcastSSE(job.id, cancelUpdate, webhookUrl);

        throw new Error("Job cancelled by user");
      }

      const initialUpdate = {
        jobId: job.id,
        status: "processing",
        progress: 0,
        brand,
        type,
        result: null,
      };
      await broadcastSSE(job.id, initialUpdate, webhookUrl);

      for (let progress = 0; progress <= 100; progress += 20) {
        if (cancelledJobs.has(job.id)) {

          const cancelUpdate = {
            jobId: job.id,
            status: "cancelled",
            progress: 0,
            brand,
            type,
            result: null,
          };
          await broadcastSSE(job.id, cancelUpdate, webhookUrl);

          throw new Error("Job cancelled by user");
        }

        await job.updateProgress(progress);

        let result = null;
        if (progress === 100) {
          if (type === "image-generation") {
            result = {
              type: "image",
              url: "/assets/images/663fc2a1da49d30b9a44e793_08t53Z_u_1IlN_1024.webp",
              description: `Generated image for: ${prompt}`,
            };
          } else if (type === "video-generation") {
            result = {
              type: "video",
              url: "/assets/videos/file_example_MP4_480_1_5MG.mp4",
              description: `Generated video for: ${prompt}`,
            };
          } else {
            result = `Dummy result for ${type}: ${prompt}`;
          }
        }

        const update = {
          jobId: job.id,
          status: progress === 100 ? "completed" : "processing",
          progress,
          brand,
          type,
          result,
        };

        await broadcastSSE(job.id, update, webhookUrl);

        if (progress < 100) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      let finalResult;
      if (type === "image-generation") {
        finalResult = {
          type: "image",
          url: "/assets/images/663fc2a1da49d30b9a44e793_08t53Z_u_1IlN_1024.webp",
          description: `Generated image for: ${prompt}`,
        };
      } else if (type === "video-generation") {
        finalResult = {
          type: "video",
          url: "/assets/videos/file_example_MP4_480_1_5MG.mp4",
          description: `Generated video for: ${prompt}`,
        };
      } else {
        finalResult = `Dummy result for ${type}: ${prompt}`;
      }

      return {
        result: finalResult,
        brand,
        type,
        completedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (!err.message.includes("cancelled")) {
        const errorUpdate = {
          jobId: job.id,
          status: "failed",
          progress: 0,
          brand: job.data.brand,
          type: job.data.type,
          result: null,
        };
        await broadcastSSE(job.id, errorUpdate, job.data.webhookUrl);
      }

      throw err;
    }
  },
  { connection: redis, concurrency: 5 }
);

module.exports = jobWorker;
