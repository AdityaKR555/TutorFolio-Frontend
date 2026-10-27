// import axios from "axios";

// const REFOX_BASE_URL =
//   import.meta.env.VITE_REFOX_API_BASE_URL || "https://refox.onrender.com";

// /**
//  * Extracts structured tutor details from a hosted PDF resume using the Refox AI worker.
//  * @param {string} resumeUrl - Public HTTPS URL pointing to the resume PDF
//  * @returns {Promise<{ data: Object, metadata: Object }>}
//  */
// export const extractResumeDetails = async (resumeUrl) => {
//   const cleanUrl = (resumeUrl || "").trim();
//   if (!cleanUrl) {
//     throw new Error("Please enter a valid resume URL.");
//   }

//   const endpoint = `${REFOX_BASE_URL.replace(/\/+$/, "")}/v1/extract`;

//   const response = await axios.post(
//     endpoint,
//     { resume_url: cleanUrl },
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//       timeout: 60000, // AI processing on Render can take 10-30s
//     }
//   );

//   return response.data;
// };

import axios from "axios";

const REFOX_BASE_URL = (
  import.meta.env.VITE_REFOX_API_BASE_URL ||
  "https://refox.onrender.com"
).replace(/\/+$/, "");

export const extractResumeDetails = async (resumeUrl) => {
  const cleanUrl = (resumeUrl || "").trim();

  if (!cleanUrl) {
    throw new Error("Please enter a valid resume URL.");
  }

  const response = await axios.post(
    `${REFOX_BASE_URL}/v1/extract`,
    { resume_url: cleanUrl },
    { timeout: 60000 }
  );

  return response.data;
};
