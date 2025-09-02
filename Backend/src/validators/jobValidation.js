const Joi = require("joi");

const jobSubmissionSchema = Joi.object({
  type: Joi.string()
    .valid(
      ...[
        "text-generation",
        "image-generation",
        "video-generation",
        "model-fine-tuning",
      ]
    )
    .required(),
  brand: Joi.string()
    .valid(...["Brand1", "Brand2", "Brand3"])
    .required(),
  prompt: Joi.string().trim().min(1).max(2000).required(),
  webhookUrl: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .optional()
    .allow(""),
});

module.exports = { jobSubmissionSchema };
