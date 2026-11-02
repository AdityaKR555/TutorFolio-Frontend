/**
 * uploadLimits.js
 *
 * Client-side mirror of the /upload-limits endpoint.
 * These values must stay in sync with the backend.
 * If limits change server-side, update this file accordingly.
 *
 * Server endpoint: GET /upload-limits
 */

export const UPLOAD_LIMITS = {
  /** Tutor profile picture */
  profile: {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "1 MB",
  },
  /** Tuition logo */
  "tuition-logo": {
    maxSizeBytes: 524_288, // 512 KB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "512 KB",
  },
  /** Achievement gallery images */
  "achievement-image": {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "1 MB",
  },
  /** Student photo attached to an achievement */
  "student-image": {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "1 MB",
  },
  /** Batch cover images */
  "batch-image": {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "1 MB",
  },
  /** Tuition gallery images */
  "tuition-gallery-image": {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "1 MB",
  },
  /** Resume (PDF / DOC / DOCX) */
  resume: {
    maxSizeBytes: 1_048_576, // 1 MB
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    label: "1 MB",
  },
};
