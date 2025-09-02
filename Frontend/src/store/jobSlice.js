import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const submitJob = createAsyncThunk(
  "jobs/submitJob",
  async ({ type, brand, prompt, webhookUrl }, { rejectWithValue }) => {
    try {
      const requestBody = { type, brand, prompt };
      if (webhookUrl) {
        requestBody.webhookUrl = webhookUrl;
      }
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async (brand = null, { rejectWithValue }) => {
    try {
      const url = brand
        ? `${API_BASE_URL}/jobs?brand=${brand}`
        : `${API_BASE_URL}/jobs`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelJob = createAsyncThunk(
  "jobs/cancelJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error);
      }

      return jobId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const retryJob = createAsyncThunk(
  "jobs/retryJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error);
      }

      const result = await response.json();
      return { jobId: result.jobId, status: result.status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  jobs: [],
  selectedBrand: "",
  loading: false,
  error: null,
  submitting: false,
};

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setSelectedBrand: (state, action) => {
      state.selectedBrand = action.payload;
      state.jobs = [];
    },
    updateJobProgress: (state, action) => {
      const { jobId, status, progress, result, brand } = action.payload;
      const job = state.jobs.find((j) => j.jobId === jobId);
      if (job) {
        job.status = status;
        job.progress = progress || 0;
        if (result) {
          job.result = result;
          job.completedAt = new Date().toISOString();
        }
      } else {
        if (brand && (!state.selectedBrand || state.selectedBrand === brand)) {
        } else {
        }
      }
    },
    addJob: (state, action) => {
      state.jobs.unshift(action.payload);
    },
    removeJob: (state, action) => {
      state.jobs = state.jobs.filter((job) => job.jobId !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitJob.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitJob.fulfilled, (state, action) => {
        state.submitting = false;
        const newJob = {
          ...action.payload,
          progress: 0,
        };
        if (!state.selectedBrand || state.selectedBrand === newJob.brand) {
          state.jobs.unshift(newJob);
        } else {
        }
      })
      .addCase(submitJob.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelJob.fulfilled, (state, action) => {
        const job = state.jobs.find((j) => j.jobId === action.payload);
        if (job) {
          job.status = "cancelled";
          job.progress = 0;
        }
      })
      .addCase(cancelJob.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(retryJob.fulfilled, (state, action) => {
        const { jobId, status } = action.payload;
        const job = state.jobs.find((j) => j.jobId === jobId);
        if (job) {
          job.status = status || "queued";
          job.progress = 0;
          job.result = null;
          job.completedAt = null;
          job.submittedAt = new Date().toISOString();
        }
      })
      .addCase(retryJob.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedBrand,
  updateJobProgress,
  addJob,
  removeJob,
  clearError,
} = jobSlice.actions;
export default jobSlice.reducer;
