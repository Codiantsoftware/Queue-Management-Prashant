const express = require("express");
const { jobSubmissionLimiter } = require("../middleware/rateLimiter");
const { jobSubmissionSchema } = require("../validators/jobValidation");
const { jobQueue, cancelledJobs, cancelledJobsData } = require("../services/jobQueue");
const { sseConnections, broadcastSSE } = require("../utils/sse");

const router = express.Router();

router.post("/", jobSubmissionLimiter, async (req, res) => {
  try {
    const { error, value } = jobSubmissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Invalid input data",
        details: error.details.map((detail) => detail.message),
        code: "VALIDATION_ERROR",
      });
    }

    const { type, brand, prompt, webhookUrl } = value;

    const jobData = {
      type,
      brand,
      prompt: prompt.trim(),
      submittedAt: new Date().toISOString(),
      clientIp: req.ip,
    };

    if (webhookUrl && webhookUrl.trim() !== "") {
      jobData.webhookUrl = webhookUrl.trim();
    }

    const job = await jobQueue.add("process-ai-job", jobData, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    const response = {
      jobId: job.id,
      status: "queued",
      type,
      brand,
      prompt: prompt.trim(),
      submittedAt: new Date().toISOString(),
    };

    if (jobData.webhookUrl) {
      response.webhookUrl = jobData.webhookUrl;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit job",
      code: "SUBMISSION_ERROR",
    });
  }
});

router.get("/:id/stream", async (req, res) => {
  const { id: jobId } = req.params;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  if (!sseConnections.has(jobId)) {
    sseConnections.set(jobId, []);
  }
  sseConnections.get(jobId).push(res);

  res.write(`data: ${JSON.stringify({ type: "connected", jobId })}\n\n`);

  try {
    const job = await jobQueue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      const currentStatus = {
        jobId: job.id,
        status: state,
        progress: job.progress || 0,
        brand: job.data.brand,
        type: job.data.type,
        result: job.returnvalue?.result || null,
      };
      res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
    }
  } catch (error) {
  }

  req.on("close", () => {
    const arr = sseConnections.get(jobId) || [];
    const newArr = arr.filter((r) => r !== res);
    if (newArr.length > 0) {
      sseConnections.set(jobId, newArr);
    } else {
      sseConnections.delete(jobId);
    }
  });
});

router.post("/:id/cancel", async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobState = await job.getState();

    if (jobState === "completed" || jobState === "failed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel completed or failed job" });
    }

    cancelledJobsData.set(jobId, {
      data: job.data,
      brand: job.data.brand,
      type: job.data.type
    });

    if (jobState === "active") {
      cancelledJobs.add(jobId);

      res.json({ message: "Job cancellation requested" });
      return;
    } else if (jobState === "waiting" || jobState === "delayed") {
      try {
        await job.remove();
        cancelledJobs.add(jobId);
      } catch (removeError) {
        cancelledJobs.add(jobId);
      }
    } else {
      cancelledJobs.add(jobId);
    }

    if (jobState !== "active") {
      const cancellationUpdate = {
        jobId: jobId,
        status: "cancelled",
        progress: 0,
        brand: job.data.brand,
        type: job.data.type,
      };

      await broadcastSSE(jobId, cancellationUpdate, job.data.webhookUrl);
    }

    res.json({ message: "Job cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: `Failed to cancel job: ${error.message}` });
  }
});

router.post("/:id/retry", async (req, res) => {
  try {
    const jobId = req.params.id;
    let oldJob = await jobQueue.getJob(jobId);
    const isCancelled = cancelledJobs.has(jobId) || cancelledJobs.has(parseInt(jobId));
    if (!oldJob && isCancelled) {
      const cancelledData = cancelledJobsData.get(jobId) || cancelledJobsData.get(parseInt(jobId));
      if (!cancelledData) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      oldJob = {
        data: cancelledData.data,
        getState: () => "cancelled"
      };
    } else if (!oldJob) {
      return res.status(404).json({ error: "Job not found" });
    } else {
      const jobState = await oldJob.getState();
      if (jobState !== "failed" && !isCancelled) {
        return res
          .status(400)
          .json({ error: "Can only retry failed or cancelled jobs" });
      }
    }

    if (await jobQueue.getJob(jobId)) {
      try {
        const existingJob = await jobQueue.getJob(jobId);
        await existingJob.remove();
      } catch (removeError) {
        console.error("Could not remove old job:", removeError);
      }
    }

    cancelledJobs.delete(jobId);
    cancelledJobs.delete(parseInt(jobId));
    cancelledJobsData.delete(jobId);
    cancelledJobsData.delete(parseInt(jobId));

    const newJob = await jobQueue.add("process-ai-job", oldJob.data, {
      jobId: jobId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    const retryUpdate = {
      jobId: jobId,
      status: "queued",
      progress: 0,
      brand: oldJob.data.brand,
      type: oldJob.data.type,
      result: null,
    };

    await broadcastSSE(jobId, retryUpdate, oldJob.data.webhookUrl);

    res.json({
      message: "Job retried successfully",
      jobId: jobId,
      status: "queued",
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to retry job: ${error.message}` });
  }
});

router.get("/", async (req, res) => {
  try {
    const { brand } = req.query;

    const jobs = await jobQueue.getJobs([
      "waiting",
      "active",
      "completed",
      "failed",
    ]);

    let filteredJobs = await Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        const jobData = {
          jobId: job.id,
          status: state,
          progress: job.progress || 0,
          type: job.data.type,
          brand: job.data.brand,
          prompt: job.data.prompt,
          submittedAt: job.data.submittedAt,
          result: job.returnvalue?.result || null,
          completedAt: job.returnvalue?.completedAt || null,
        };

        if (job.data.webhookUrl) {
          jobData.webhookUrl = job.data.webhookUrl;
        }

        return jobData;
      })
    );

    if (brand) {
      filteredJobs = filteredJobs.filter((job) => job.brand === brand);
    }

    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

module.exports = router;
