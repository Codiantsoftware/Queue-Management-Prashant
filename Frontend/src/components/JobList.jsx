import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchJobs,
  cancelJob,
  retryJob,
  setSelectedBrand,
  updateJobProgress,
  clearError,
} from "../store/jobSlice";
import ProgressBar from "./ProgressBar";

const BRANDS = ["", "Brand1", "Brand2", "Brand3"];

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const JobList = () => {
  const dispatch = useDispatch();
  const { jobs, selectedBrand, loading, error } = useSelector(
    (state) => state.jobs
  );
  const sseConnectionsRef = useRef(new Map());

  const getMediaUrl = (url) => {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const fullUrl = `${API_BASE_URL}${url}`;
    return fullUrl;
  };

  const cleanupConnection = useCallback((jobId) => {
    const connection = sseConnectionsRef.current.get(jobId);
    if (connection) {
      connection.close();
      sseConnectionsRef.current.delete(jobId);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchJobs(selectedBrand || null));
  }, [dispatch, selectedBrand]);

  useEffect(() => {
    const newJobs = jobs.filter(
      (job) =>
        (job.status === "queued" || job.status === "waiting") &&
        !sseConnectionsRef.current.has(job.jobId)
    );

    newJobs.forEach((job) => {
      const eventSource = new EventSource(
        `${API_BASE_URL}/jobs/${job.jobId}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.jobId && data.type !== "connected") {
            dispatch(updateJobProgress(data));
          }
        } catch (error) {
        }
      };

      eventSource.onerror = (error) => {
        setTimeout(() => {
          if (sseConnectionsRef.current.has(job.jobId)) {
            const connection = sseConnectionsRef.current.get(job.jobId);
            if (connection.readyState === EventSource.CLOSED) {
              cleanupConnection(job.jobId);
            }
          }
        }, 1000);
      };

      eventSource.onopen = () => {
      };

      sseConnectionsRef.current.set(job.jobId, eventSource);
    });
  }, [jobs.length, dispatch, cleanupConnection]);

  useEffect(() => {
    const activeJobs = jobs.filter(
      (job) =>
        job.status === "processing" ||
        job.status === "active" ||
        job.status === "queued" ||
        job.status === "waiting"
    );

    activeJobs.forEach((job) => {
      if (!sseConnectionsRef.current.has(job.jobId)) {
        const eventSource = new EventSource(
          `${API_BASE_URL}/jobs/${job.jobId}/stream`
        );

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.jobId && data.type !== "connected") {
              dispatch(updateJobProgress(data));
            }
          } catch (error) {
          }
        };

        eventSource.onerror = (error) => {
          setTimeout(() => {
            if (sseConnectionsRef.current.has(job.jobId)) {
              const connection = sseConnectionsRef.current.get(job.jobId);
              if (connection.readyState === EventSource.CLOSED) {
                cleanupConnection(job.jobId);
              }
            }
          }, 1000);
        };

        eventSource.onopen = () => {
        };

        sseConnectionsRef.current.set(job.jobId, eventSource);
      }
    });

    const currentConnections = Array.from(sseConnectionsRef.current.keys());
    currentConnections.forEach((jobId) => {
      const job = jobs.find((j) => j.jobId === jobId);
      if (
        job &&
        (job.status === "completed" ||
          job.status === "failed" ||
          job.status === "cancelled")
      ) {
        cleanupConnection(jobId);
      }
    });

    return () => {
      sseConnectionsRef.current.forEach((eventSource) => {
        eventSource.close();
      });
      sseConnectionsRef.current.clear();
    };
  }, [jobs, dispatch, cleanupConnection]);

  const handleBrandFilter = (brand) => {
    dispatch(setSelectedBrand(brand));
  };

  const handleCancel = (jobId) => {
    dispatch(clearError()); // Clear any previous errors
    dispatch(cancelJob(jobId));
  };

  const handleRetry = (jobId) => {
    dispatch(retryJob(jobId));
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      "text-generation": "Text Generation",
      "image-generation": "Image Generation",
      "video-generation": "Video Generation",
      "model-fine-tuning": "Model Fine-tuning",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          {error}
          <button
            onClick={() => dispatch(clearError())}
            className="absolute top-2 right-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Job Dashboard</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Brand
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => handleBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {BRANDS.slice(1).map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No jobs found. Submit your first job above!
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {getJobTypeLabel(job.type)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Brand: {job.brand} 
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted: {formatDate(job.submittedAt)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {(job.status === "processing" ||
                    job.status === "active" ||
                    job.status === "queued" ||
                    job.status === "waiting") && (
                    <button
                      onClick={() => handleCancel(job.jobId)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {(job.status === "failed" || job.status === "cancelled") && (
                    <button
                      onClick={() => handleRetry(job.jobId)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Prompt:</strong> {job.prompt}
                </p>
              </div>

              <ProgressBar progress={job.progress || 0} status={job.status} />

              {job.result && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  {typeof job.result === "object" &&
                  job.result.type === "image" ? (
                    <div>
                      <p className="text-sm text-green-800 mb-3">
                        <strong>Generated Image:</strong>{" "}
                        {job.result.description}
                      </p>
                      <div className="flex flex-col items-center">
                        <img
                          src={getMediaUrl(job.result.url)}
                          alt={job.result.description}
                          className="max-w-full max-h-96 rounded-lg shadow-md object-contain"
                          crossOrigin="anonymous"
                          onLoad={(e) => {
                            const errorDiv =
                              e.target.parentElement.querySelector(
                                ".error-message"
                              );
                            if (errorDiv) errorDiv.style.display = "none";
                            e.target.style.display = "block";
                          }}
                          onError={(e) => {


                            if (e.target.crossOrigin) {
                              e.target.crossOrigin = null;
                              e.target.src = e.target.src + "?retry=1";
                              return;
                            }

                            e.target.style.display = "none";
                            const errorDiv =
                              e.target.parentElement.querySelector(
                                ".error-message"
                              );
                            if (errorDiv) {
                              errorDiv.style.display = "block";

                              const testLink =
                                errorDiv.querySelector(".test-link");
                              if (!testLink) {
                                const link = document.createElement("a");
                                link.href = e.target.src;
                                link.target = "_blank";
                                link.className =
                                  "test-link text-blue-600 underline ml-2";
                                link.textContent = "Test direct link";
                                errorDiv.appendChild(link);
                              }
                            }
                          }}
                        />
                        <div
                          className="error-message text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200 mt-2"
                          style={{ display: "none" }}
                        >
                          Failed to load image: {getMediaUrl(job.result.url)}
                        </div>
                      </div>
                    </div>
                  ) : typeof job.result === "object" &&
                    job.result.type === "video" ? (
                    <div>
                      <p className="text-sm text-green-800 mb-3">
                        <strong>Generated Video:</strong>{" "}
                        {job.result.description}
                      </p>
                      <div className="flex flex-col items-center">
                        <video
                          src={getMediaUrl(job.result.url)}
                          controls
                          className="max-w-full max-h-96 rounded-lg shadow-md"
                          crossOrigin="anonymous"
                          onLoadedData={(e) => {
                            const errorDiv =
                              e.target.parentElement.querySelector(
                                ".error-message"
                              );
                            if (errorDiv) errorDiv.style.display = "none";
                            e.target.style.display = "block";
                          }}
                          onError={(e) => {


                            if (e.target.crossOrigin) {
                              e.target.crossOrigin = null;
                              e.target.src = e.target.src + "?retry=1";
                              return;
                            }

                            e.target.style.display = "none";
                            const errorDiv =
                              e.target.parentElement.querySelector(
                                ".error-message"
                              );
                            if (errorDiv) {
                              errorDiv.style.display = "block";

                              const testLink =
                                errorDiv.querySelector(".test-link");
                              if (!testLink) {
                                const link = document.createElement("a");
                                link.href = e.target.src;
                                link.target = "_blank";
                                link.className =
                                  "test-link text-blue-600 underline ml-2";
                                link.textContent = "Test direct link";
                                errorDiv.appendChild(link);
                              }
                            }
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div
                          className="error-message text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200 mt-2"
                          style={{ display: "none" }}
                        >
                          Failed to load video: {getMediaUrl(job.result.url)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-green-800">
                      <strong>Result:</strong> {job.result}
                    </p>
                  )}
                  {job.completedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed: {formatDate(job.completedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
