import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitJob, clearError } from "../store/jobSlice";

const JOB_TYPES = [
  { value: "text-generation", label: "Text Generation" },
  { value: "image-generation", label: "Image Generation" },
  { value: "video-generation", label: "Video Generation" },
  { value: "model-fine-tuning", label: "Model Fine-tuning" },
];

const BRANDS = ["Brand1", "Brand2", "Brand3"];

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const JobForm = () => {
  const dispatch = useDispatch();
  const { submitting, error } = useSelector((state) => state.jobs);

  const [formData, setFormData] = useState({
    type: "text-generation",
    brand: "Brand1",
    prompt: "",
    webhookUrl: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.prompt.trim()) {
      return;
    }

    if (formData.webhookUrl.trim() && !isValidUrl(formData.webhookUrl.trim())) {
      dispatch(clearError());
      return;
    }

    dispatch(clearError());

    const submissionData = {
      type: formData.type,
      brand: formData.brand,
      prompt: formData.prompt.trim(),
    };

    if (formData.webhookUrl.trim()) {
      submissionData.webhookUrl = formData.webhookUrl.trim();
    }

    dispatch(submitJob(submissionData));
    setFormData({ ...formData, prompt: "", webhookUrl: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit AI Job</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {JOB_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            placeholder="Enter your AI prompt here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL (Optional)
          </label>
          <input
            type="url"
            name="webhookUrl"
            value={formData.webhookUrl}
            onChange={handleChange}
            placeholder="https://your-webhook-endpoint.com/webhook"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Receive job status updates at this URL when the job status changes
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !formData.prompt.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Job"}
        </button>
      </form>
    </div>
  );
};

export default JobForm;
