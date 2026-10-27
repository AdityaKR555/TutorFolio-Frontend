import React, { useRef, useState } from "react";
import api from "../api/axios";
import { extractResumeDetails } from "../api/refox";

/**
 * ResumeExtractorModal
 *
 * Flow:
 *   1. User picks a PDF / DOC / DOCX file
 *   2. We POST it to /personalDetails/resume (multipart, JWT auto-attached)
 *      → backend stores it in R2 and returns { data: { fileUrl } }
 *   3. We POST { resume_url: fileUrl } to refox /v1/extract
 *      → Gemini AI returns structured tutor details
 *   4. We show a preview; user clicks "Auto-fill Form"
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   onApply  {(data, metadata) => void}
 *   mode     {"all" | "profile" | "tuition"}  (not used currently, kept for future)
 */
function ResumeExtractorModal({ isOpen, onClose, onApply, mode = "all" }) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // "uploading" | "extracting"
  const [error, setError] = useState("");
  const [extractedResult, setExtractedResult] = useState(null);

  if (!isOpen) return null;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setError("Please select a PDF, DOC, or DOCX file.");
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Please upload a file under 10 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError("");
    setExtractedResult(null);
  };

  const handleExtract = async (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      setError("Please select a resume file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setExtractedResult(null);

      // ── Step 1: Upload to backend → get hosted URL ──────────────────────
      setLoadingStep("uploading");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await api.post("/personalDetails/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      const fileUrl = uploadRes.data?.data?.fileUrl;
      if (!fileUrl) {
        throw new Error("Resume upload succeeded but no file URL was returned.");
      }

      // ── Step 2: Extract with Refox AI ───────────────────────────────────
      setLoadingStep("extracting");
      const result = await extractResumeDetails(fileUrl);

      if (result?.data) {
        setExtractedResult(result);
      } else {
        setError("AI could not extract details from this resume. Please try a clearer PDF.");
      }
    } catch (err) {
      console.error("Resume extraction error:", err);

      if (err.code === "ECONNABORTED") {
        setError("The request timed out. The AI server may be waking up — please try again.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 413) {
        setError("File is too large for the server. Please try a smaller file.");
      } else if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg || d).join(", "));
        } else {
          setError(String(detail || "Invalid request. Please check your file."));
        }
      } else if (err.message && err.message.includes("Network Error")) {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleApply = () => {
    if (extractedResult?.data && onApply) {
      onApply(extractedResult.data, extractedResult.metadata);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ─── Loading step label ───────────────────────────────────────────────────
  const loadingLabel =
    loadingStep === "uploading"
      ? "Uploading resume…"
      : loadingStep === "extracting"
      ? "Extracting details with AI…"
      : "Processing…";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0f1f36] border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-blue-500/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">✨</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Auto-fill from Resume
              </h3>
            </div>
            <p className="text-[#94a8c7] text-xs sm:text-sm">
              Upload your resume and let AI fill in your profile details.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-[#94a8c7] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.5m0 3h.01M10.3 4.9L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.9a2 2 0 00-3.4 0z" />
            </svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* ── Step 1: File picker ─────────────────────────────────────────── */}
        {!extractedResult && !loading && (
          <form onSubmit={handleExtract} className="mt-6 space-y-5">
            {/* Drop / Click area */}
            <div>
              <label className="block text-sm text-[#c7d8f5] mb-2 font-medium">
                Resume File
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-blue-500/25 hover:border-blue-500/50 rounded-2xl px-6 py-10 cursor-pointer transition-colors bg-[#0a1628]/60 hover:bg-[#0a1628]"
              >
                {selectedFile ? (
                  <>
                    {/* File selected state */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                        📄
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-[#94a8c7] text-xs mt-0.5">
                          {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Empty state */}
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">
                      ⬆️
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-medium">Click to upload your resume</p>
                      <p className="text-[#6b7f9f] text-xs mt-1">PDF, DOC, or DOCX · Max 10 MB</p>
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Info note */}
            <p className="text-[#6b7f9f] text-xs">
              Your file is uploaded securely and used only to extract profile details.
              Powered by <span className="text-blue-400 font-medium">Gemini AI</span>.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-blue-500/10 text-[#94a8c7] hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedFile}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg shadow-blue-600/20 cursor-pointer text-sm flex items-center gap-2"
              >
                <span>Extract Details</span>
                <span>✨</span>
              </button>
            </div>
          </form>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-5 py-6">
            {/* Animated gradient ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 border-r-purple-400 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-[#0f1f36] flex items-center justify-center text-xl">
                {loadingStep === "uploading" ? "⬆️" : "🤖"}
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-semibold">{loadingLabel}</p>
              <p className="text-[#6b7f9f] text-xs mt-1">
                {loadingStep === "uploading"
                  ? "Securely uploading your file…"
                  : "Gemini AI is reading your resume. This may take 10–30 seconds."}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-[#94a8c7]">
              <span className={loadingStep === "uploading" ? "text-blue-400 font-semibold" : "text-green-400"}>
                {loadingStep === "uploading" ? "● Uploading" : "✓ Uploaded"}
              </span>
              <span className="text-[#374f72]">→</span>
              <span className={loadingStep === "extracting" ? "text-blue-400 font-semibold" : "text-[#374f72]"}>
                {loadingStep === "extracting" ? "● AI Extraction" : "○ AI Extraction"}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview extracted data ─────────────────────────────── */}
        {!loading && extractedResult && (
          <div className="mt-6 space-y-5">
            {/* Success banner */}
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                Details extracted from{" "}
                <strong>{extractedResult.metadata?.source_filename || selectedFile?.name}</strong>
                {extractedResult.metadata?.fields_extracted != null && (
                  <> · <strong>{extractedResult.metadata.fields_extracted}</strong> fields found</>
                )}
              </span>
            </div>

            {/* Extracted fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0a1628]/60 rounded-2xl border border-blue-500/10">

              <div>
                <span className="text-xs text-[#94a8c7] block">Name</span>
                <span className="text-sm font-semibold text-white">
                  {extractedResult.data.tutor_name || <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#94a8c7] block">Email</span>
                <span className="text-sm font-semibold text-white">
                  {extractedResult.data.email || <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#94a8c7] block">Phone</span>
                <span className="text-sm font-semibold text-white">
                  {extractedResult.data.phone || <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#94a8c7] block">Location</span>
                <span className="text-sm font-semibold text-white">
                  {extractedResult.data.location || <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#94a8c7] block">Experience</span>
                <span className="text-sm font-semibold text-white">
                  {extractedResult.data.years_of_experience != null
                    ? `${extractedResult.data.years_of_experience} years`
                    : <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#94a8c7] block">Qualifications</span>
                <span className="text-sm font-semibold text-white">
                  {Array.isArray(extractedResult.data.qualifications) && extractedResult.data.qualifications.length > 0
                    ? extractedResult.data.qualifications.join(", ")
                    : <span className="text-[#6b7f9f]">—</span>}
                </span>
              </div>

              {/* Teaching Subjects */}
              <div className="sm:col-span-2">
                <span className="text-xs text-[#94a8c7] block mb-1">Teaching Subjects</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(extractedResult.data.teaching_subjects) && extractedResult.data.teaching_subjects.length > 0 ? (
                    extractedResult.data.teaching_subjects.map((s, idx) => (
                      <span key={idx} className="text-xs bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-md">{s}</span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6b7f9f]">None listed</span>
                  )}
                </div>
              </div>

              {/* Eligible Classes */}
              <div className="sm:col-span-2">
                <span className="text-xs text-[#94a8c7] block mb-1">Eligible Classes</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(extractedResult.data.eligible_classes) && extractedResult.data.eligible_classes.length > 0 ? (
                    extractedResult.data.eligible_classes.map((c, idx) => (
                      <span key={idx} className="text-xs bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-md">{c}</span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6b7f9f]">None listed</span>
                  )}
                </div>
              </div>

              {/* Teaching Languages */}
              <div className="sm:col-span-2">
                <span className="text-xs text-[#94a8c7] block mb-1">Teaching Languages</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(extractedResult.data.teaching_languages) && extractedResult.data.teaching_languages.length > 0 ? (
                    extractedResult.data.teaching_languages.map((l, idx) => (
                      <span key={idx} className="text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">{l}</span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6b7f9f]">None listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-blue-500/10 text-[#94a8c7] hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium"
              >
                Try Another File
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-blue-500/10 text-[#94a8c7] hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-all shadow-lg shadow-green-600/20 cursor-pointer text-sm flex items-center gap-2"
                >
                  <span>Auto-fill Form</span>
                  <span>✅</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ResumeExtractorModal;
