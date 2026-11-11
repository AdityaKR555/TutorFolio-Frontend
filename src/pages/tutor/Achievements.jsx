import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import ExpandableText from "../../components/ExpandableText";
import { UPLOAD_LIMITS } from "../../api/uploadLimits";

const { maxSizeBytes: MAX_ACHIEVEMENT_IMAGE_SIZE, label: MAX_ACHIEVEMENT_IMAGE_LABEL } = UPLOAD_LIMITS["achievement-image"];
const { maxSizeBytes: MAX_STUDENT_IMAGE_SIZE, label: MAX_STUDENT_IMAGE_LABEL } = UPLOAD_LIMITS["student-image"];

const pageStyles = {
  page: "min-h-[calc(100vh-72px)] bg-tf-bg px-4 py-6 text-sm leading-relaxed text-tf-ink sm:px-6 lg:px-8",
  content: "mx-auto w-full max-w-[1120px]",
  loading: "flex min-h-[400px] flex-col items-center justify-center text-[var(--tf-copy)]",
  loadingCopy: "mt-[14px] text-[13px]",
  spinner: "h-[38px] w-[38px] animate-spin rounded-full border-4 border-[var(--tf-line)] border-t-[var(--tf-blue)]",
  smallSpinner: "h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-[var(--tf-on-primary)]",
  heading: "mb-6 flex items-start justify-between gap-[18px] max-[520px]:flex-col max-[520px]:items-stretch",
  headingTitle: "tf-page-title mb-2",
  headingCopy: "m-0 text-[var(--tf-copy)]",
  headingButton: "max-[520px]:self-end",
  button: "tf-button-secondary cursor-pointer whitespace-nowrap",
  buttonPrimary: "tf-button-primary cursor-pointer whitespace-nowrap",
  buttonSmall: "inline-flex min-h-[31px] cursor-pointer items-center justify-center gap-[7px] whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[9px] py-1.5 text-[11px] font-semibold text-[var(--tf-copy)] transition-colors duration-[140ms] hover:border-[var(--tf-blue)] hover:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  buttonDanger: "inline-flex min-h-[31px] cursor-pointer items-center justify-center gap-[7px] whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[9px] py-1.5 text-[11px] font-semibold text-[var(--tf-danger)] transition-colors duration-[140ms] hover:border-[var(--tf-blue)] hover:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  summary: "mb-[30px] grid grid-cols-3 gap-[13px] max-[520px]:grid-cols-2 max-[520px]:gap-2",
  stat: "relative overflow-hidden rounded-[11px] border border-[var(--tf-line)] bg-[var(--tf-surface)] bg-[radial-gradient(ellipse_at_100%_0%,rgb(117_202_245_/_20%),transparent_53%),radial-gradient(ellipse_at_0%_100%,rgb(121_176_255_/_12%),transparent_45%)] p-[15px_17px] [[data-theme=dark]_&]:bg-[var(--tf-surface)] max-[520px]:p-3",
  statGreen: "bg-[radial-gradient(ellipse_at_100%_0%,rgb(112_220_186_/_20%),transparent_53%),radial-gradient(ellipse_at_0%_100%,rgb(117_202_245_/_12%),transparent_45%)]",
  statGold: "bg-[radial-gradient(ellipse_at_100%_0%,rgb(247_198_121_/_20%),transparent_53%),radial-gradient(ellipse_at_0%_100%,rgb(193_160_246_/_12%),transparent_45%)]",
  statLabel: "mb-1 block text-[11px] text-[var(--tf-muted)]",
  statValue: "text-xl tracking-[-0.3px]",
  hiddenStat: "max-[520px]:hidden",
  alert: "mb-4 rounded-[10px] border border-[var(--tf-line)] px-[14px] py-3 text-[13px]",
  errorAlert: "bg-[var(--tf-danger-soft)] text-[var(--tf-danger)] [[data-theme=dark]_&]:bg-[var(--tf-danger-soft)]",
  successAlert: "bg-[var(--tf-success-soft)] text-[var(--tf-success)] [[data-theme=dark]_&]:bg-[var(--tf-success-soft)]",
  listHeading: "mb-[14px] flex items-center justify-between gap-[18px] max-[760px]:items-start max-[760px]:flex-col",
  listTitle: "tf-section-title m-0",
  listCopy: "mt-[3px] text-xs text-[var(--tf-muted)]",
  search: "flex items-center gap-2 max-[760px]:w-full max-[760px]:max-w-[430px]",
  searchInput: "min-h-[38px] w-[275px] rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[11px] py-2 font-[inherit] text-[var(--tf-ink)] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 max-[760px]:w-auto max-[760px]:flex-1 [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  cards: "grid grid-cols-2 items-start gap-[15px] max-[760px]:grid-cols-1",
  card: "tf-card min-w-0 p-5 shadow-sm",
  cardTop: "flex items-start justify-between gap-3",
  person: "flex min-w-0 items-center gap-[10px]",
  avatar: "grid h-[46px] w-[46px] flex-none place-items-center overflow-hidden rounded-full border border-[var(--tf-line)] bg-[var(--tf-sky)] text-[var(--tf-blue-pressed)]",
  personCopy: "min-w-0",
  cardTitle: "mb-1 break-words text-[15px] font-bold leading-[1.35]",
  studentName: "m-0 text-xs text-[var(--tf-copy)]",
  stars: "text-xs tracking-[1px] text-[var(--tf-warning)]",
  visibility: "flex-none rounded-[20px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--tf-muted)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]",
  visible: "border-[var(--tf-line)] bg-[var(--tf-success-soft)] text-[var(--tf-success)] [[data-theme=dark]_&]:bg-[var(--tf-success-soft)]",
  cardImage: "mt-[14px] max-h-[220px] w-full rounded-[9px] bg-[var(--tf-surface-soft)] object-cover [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]",
  description: "my-[14px] mb-3 whitespace-pre-line text-xs text-[var(--tf-copy)]",
  batch: "inline-flex rounded-[7px] border border-[var(--tf-line)] px-[9px] py-1 text-[10px] text-[var(--tf-copy)]",
  review: "mt-3 mb-0 border-l-2 border-[var(--tf-line)] py-[7px] pl-[11px] text-[11px] italic whitespace-pre-line text-[var(--tf-copy)]",
  video: "mt-3 inline-block text-[11px] font-semibold text-[var(--tf-blue)] no-underline hover:underline",
  tags: "mt-3 flex flex-wrap gap-[6px]",
  tag: "rounded-[20px] border border-[var(--tf-line)] bg-[var(--tf-sky)] px-2 py-[3px] text-[10px] text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-sky)]",
  cardFooter: "mt-[15px] flex items-center gap-[7px] border-t border-[var(--tf-line)] pt-3",
  visibilityToggle: "relative mr-auto inline-flex min-h-[31px] cursor-pointer items-center rounded-[7px] bg-transparent py-1 pr-2 pl-11 text-[11px] text-[var(--tf-copy)] before:absolute before:top-[7px] before:left-2 before:block before:h-[17px] before:w-[30px] before:rounded-[20px] before:bg-slate-300 before:content-[''] after:absolute after:top-[10px] after:left-[11px] after:h-[11px] after:w-[11px] after:rounded-full after:bg-[var(--tf-surface)] after:transition-transform after:content-[''] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2",
  visibilityToggleOn: "before:bg-sky-400 after:translate-x-[13px] [[data-theme=dark]_&]:before:bg-sky-300",
  empty: "rounded-[13px] border border-dashed border-[var(--tf-line)] bg-[var(--tf-surface)] px-5 py-[42px] text-center text-[var(--tf-copy)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  emptyIcon: "mx-auto grid h-[58px] w-[58px] place-items-center rounded-2xl bg-[var(--tf-sky)] text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-sky)]",
  emptyTitle: "tf-section-title mt-3 mb-1",
  emptyCopy: "mb-4 text-xs text-[var(--tf-muted)]",
  backdrop: "fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(10_25_45_/_48%)] p-5 max-[520px]:p-[10px]",
  modal: "max-h-[min(92vh,900px)] w-full max-w-[690px] overflow-auto rounded-[15px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-[var(--tf-ink)] shadow-[0_12px_32px_rgb(26_67_112_/_15%)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  modalHeading: "sticky top-0 z-[2] flex items-start justify-between gap-[15px] border-b border-[var(--tf-line)] bg-[var(--tf-surface)] px-[22px] py-[18px] max-[520px]:px-4 max-[520px]:py-[15px] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  modalTitle: "m-0 text-[17px] font-semibold",
  modalCopy: "mt-1 text-xs text-[var(--tf-muted)]",
  modalError: "mt-[14px] mx-[22px] rounded-lg border border-[var(--tf-line)] bg-[var(--tf-danger-soft)] px-3 py-[10px] text-xs text-[var(--tf-danger)] [[data-theme=dark]_&]:bg-[var(--tf-danger-soft)]",
  close: "cursor-pointer border-0 bg-transparent px-1 text-[25px] leading-none text-[var(--tf-muted)] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2",
  form: "grid gap-4 px-[22px] py-5 max-[520px]:p-4",
  formGrid: "grid grid-cols-2 items-start gap-[13px] max-[520px]:grid-cols-1",
  field: "grid min-w-0 content-start gap-[6px]",
  fieldFull: "col-span-full max-[520px]:col-auto",
  label: "m-0 text-xs font-semibold text-[var(--tf-copy)]",
  required: "text-[var(--tf-blue)]",
  input: "tf-field",
  helper: "text-[10px] text-[var(--tf-muted)]",
  addBatch: "justify-self-start text-[11px] font-semibold text-[var(--tf-blue)] no-underline hover:underline",
  uploadGrid: "col-span-full grid grid-cols-2 gap-[13px] max-[520px]:grid-cols-1",
  upload: "relative flex min-h-[194px] flex-col gap-2 rounded-[10px] border border-dashed border-[var(--tf-blue)] bg-gradient-to-br from-[var(--tf-surface-soft)] to-[var(--tf-sky)] px-3 py-[10px] transition-shadow hover:shadow-[0_4px_14px_rgb(24_117_209_/_8%)] focus-within:shadow-[0_4px_14px_rgb(24_117_209_/_8%)] [[data-theme=dark]_&]:from-[var(--tf-surface-soft)] [[data-theme=dark]_&]:to-[var(--tf-sky)]",
  uploadLabel: "flex flex-1 cursor-pointer flex-col items-center justify-center gap-[5px] text-center text-[var(--tf-muted)]",
  uploadTitle: "text-xs text-[var(--tf-ink)]",
  uploadIcon: "mb-0.5 grid h-11 w-11 place-items-center rounded-[13px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  uploadImage: "max-h-[92px] w-full rounded-md object-cover",
  fileInput: "sr-only",
  uploadFormats: "text-[10px] text-[var(--tf-muted)]",
  formActions: "flex justify-end gap-[9px] pt-[3px] max-[520px]:flex-col-reverse",
  fullAction: "max-[520px]:w-full",
};

const initialForm = {
  title: "",
  description: "",
  studentName: "",
  studentReview: "",
  studentRating: "",
  batchId: "",
  tags: "",
  youtubeVideoLink: "",
  achievementImageUrl: "",
  studentImageUrl: "",
};

function UploadIcon() {
  return (
    <svg className="h-[21px] w-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudentIcon({ className = "h-[27px] w-[27px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.user_id;
  } catch {
    return null;
  }
};

const normalizeBatch = (batch) => ({
  batchId: batch?.batchId ?? batch?.batchid ?? batch?.id ?? null,
  userId: batch?.userId ?? batch?.userid ?? null,
  title: batch?.title ?? "",
  batchType:
    batch?.batchType ?? batch?.batchtype ?? batch?.type ?? "upcoming",
  description: batch?.description ?? "",
  fee:
    batch?.fee !== null && batch?.fee !== undefined
      ? String(batch.fee)
      : "",
  paymentType: batch?.paymentType ?? batch?.paymenttype ?? "",
  startOn: batch?.startOn ?? batch?.starton ?? "",
  endOn: batch?.endOn ?? batch?.endon ?? "",
  eligibleClasses: batch?.eligibleClasses ?? batch?.eligibleclasses ?? "",
  maximumSeats: batch?.maximumSeats ?? batch?.maximumseats ?? "",
  allottedSeats: batch?.allottedSeats ?? batch?.allottedseats ?? "",
  session: batch?.session ?? "",
});

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [achievementImagePreview, setAchievementImagePreview] = useState("");
  const [studentImageFile, setStudentImageFile] = useState(null);
  const [studentImagePreview, setStudentImagePreview] = useState("");
  const [uploadingAchievementImage, setUploadingAchievementImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAchievements = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      setError(
        "Your login session could not be found. Please login again."
      );
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await api.get(
        `/achievements/getAll/${userId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        // Newest achievement first
        const sortedList = [...rawList].sort(
          (a, b) =>
            Number(b?.achievementId ?? 0) -
            Number(a?.achievementId ?? 0)
        );

        setAchievements(sortedList);
        return sortedList;
      } else if (data?.status === 404) {
        setAchievements([]);
        return [];
      } else {
        setError(
          data?.message ||
            "Unable to load achievements. Please try again."
        );
      }
    } catch (err) {
      console.error("Fetch achievements error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError("The achievements request was invalid.");
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while loading achievements."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    try {
      setBatchesLoading(true);

      const response = await api.get(
        "/batches/getAll/all",
        {
          params: {
            user_id: userId,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        const normalizedList = rawList
          .map(normalizeBatch)
          .filter(
            (batch) => batch.batchId !== null
          );

        setBatches(normalizedList);
      } else if (data?.status === 404) {
        setBatches([]);
      } else {
        console.error(
          "Unable to load batches:",
          data
        );
      }
    } catch (err) {
      console.error("Fetch batches error:", err);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchAchievements();
        fetchBatches();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchAchievements, fetchBatches]);

  useEffect(() => {
    return () => {
      if (studentImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(studentImagePreview);
      }
    };
  }, [studentImagePreview]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setAchievementImagePreview("");
    setStudentImageFile(null);
    setStudentImagePreview("");
    setIsFormOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setEditingId(null);
    setAchievementImagePreview("");
    setStudentImageFile(null);
    setStudentImagePreview("");
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleEdit = (achievement) => {
    setFormData({
      title: achievement.title ?? "",
      description: achievement.description ?? "",
      studentName: achievement.studentName ?? "",
      studentReview: achievement.studentReview ?? "",
      studentRating:
        achievement.studentRating ?? "",
      batchId:
        achievement.batchId !== null &&
        achievement.batchId !== undefined
          ? String(achievement.batchId)
          : "",
      tags: achievement.tags ?? "",
      youtubeVideoLink: achievement.youtubeVideoLink ?? "",
      achievementImageUrl:
        achievement.achievementImageUrl ??
        achievement.imageUrl ??
        achievement.achievementImage ??
        "",
      studentImageUrl:
        achievement.studentImageUrl ??
        achievement.studentImage ??
        achievement.studentimage ??
        "",
    });
    setAchievementImagePreview(
      achievement.achievementImageUrl ??
      achievement.imageUrl ??
      achievement.achievementImage ??
      ""
    );
    setStudentImageFile(null);
    setStudentImagePreview(
      achievement.studentImageUrl ??
      achievement.studentImage ??
      achievement.studentimage ??
      ""
    );

    setEditingId(achievement.achievementId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleImageChange = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (type === "student") {
      if (file.size > MAX_STUDENT_IMAGE_SIZE) {
        setError(`Student photo is too large. Maximum allowed size is ${MAX_STUDENT_IMAGE_LABEL}.`);
        return;
      }
      setStudentImageFile(file);
      setStudentImagePreview(URL.createObjectURL(file));
      setError("");
      return;
    }

    if (file.size > MAX_ACHIEVEMENT_IMAGE_SIZE) {
      setError(`Image is too large. Maximum allowed size is ${MAX_ACHIEVEMENT_IMAGE_LABEL}.`);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      setUploadingAchievementImage(true);
      setError("");
      const response = await api.post("/achievements/image", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      const data = response.data;
      const uploadResult = data?.data;
      const imageUrl =
        (typeof uploadResult === "string" ? uploadResult : null) ??
        uploadResult?.fileUrl ??
        data?.fileUrl;

      if ((data?.status === 200 || data?.status === 201) && imageUrl) {
        setFormData((previous) => ({
          ...previous,
          achievementImageUrl: imageUrl,
        }));
        setAchievementImagePreview(imageUrl);
      } else {
        setError(data?.message || "The image upload did not return an image URL.");
      }
    } catch (err) {
      if (err.response?.status === 413) {
        setError("This image is too large to upload. Choose a smaller image.");
      } else if (err.response?.status === 422 || err.response?.status === 415) {
        setError("Choose a valid JPEG, PNG, or WebP image.");
      } else if (err.response?.status >= 500) {
        setError("The server is currently unavailable. Please try again in a moment.");
      } else if (err.request) {
        setError("Could not connect to the server. Please check your internet connection.");
      } else {
        setError("Something went wrong while uploading the achievement image.");
      }
    } finally {
      setUploadingAchievementImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    const userId = getUserId();

    if (!userId) {
      setError(
        "Your login session has expired. Please login again."
      );
      return;
    }

    if (!formData.title.trim()) {
      setError("Achievement title is required.");
      return;
    }

    if (uploadingAchievementImage) {
      setError("Wait for the achievement image to finish uploading.");
      return;
    }

    if (
      formData.youtubeVideoLink.trim() &&
      !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
        formData.youtubeVideoLink.trim()
      )
    ) {
      setError("Enter a valid YouTube video URL.");
      return;
    }

    const studentRating =
      formData.studentRating === ""
        ? null
        : Number(formData.studentRating);

    if (
      studentRating !== null &&
      (!Number.isInteger(studentRating) ||
        studentRating < 1 ||
        studentRating > 5)
    ) {
      setError("Student rating must be between 1 and 5.");
      return;
    }

    const batchId =
      formData.batchId === ""
        ? null
        : Number(formData.batchId);

    if (
      batchId !== null &&
      !batches.some(
        (batch) => Number(batch.batchId) === batchId
      )
    ) {
      setError("Please select a valid batch.");
      return;
    }

    const payload = {
      userId,
      title: formData.title.trim(),
      description:
        formData.description.trim() || null,
      studentName:
        formData.studentName.trim() || null,
      studentReview:
        formData.studentReview.trim() || null,
      studentRating,
      batchId,
      createdBy: userId,
      tags: formData.tags.trim() || null,
      youtubeVideoLink: formData.youtubeVideoLink.trim() || null,
      imageUrl: formData.achievementImageUrl || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let response;

      if (editingId) {
        response = await api.put(
          `/achievements/${editingId}`,
          payload,
          {
            timeout: 15000,
          }
        );
      } else {
        response = await api.post(
          "/achievements/new",
          payload,
          {
            timeout: 15000,
          }
        );
      }

      const data = response.data;

      console.log("Achievement API response:", data);

      if (
        data?.status === 200 ||
        data?.status === 201
      ) {
        let photoError = "";
        if (studentImageFile) {
          let achievementId = editingId;
          if (!achievementId) {
            const result = data?.data ?? data?.details ?? {};
            achievementId =
              result?.achievementId ??
              result?.achievement_id ??
              result?.id ??
              null;
          }
          if (!achievementId) {
            const latestAchievements = await fetchAchievements();
            const matchingAchievement = latestAchievements?.find(
              (item) =>
                item.title === payload.title &&
                (item.studentName ?? "") === (payload.studentName ?? "") &&
                Number(item.batchId ?? 0) === Number(payload.batchId ?? 0)
            );
            achievementId = matchingAchievement?.achievementId ?? null;
          }

          if (achievementId) {
            const photoData = new FormData();
            photoData.append("achievementId", String(achievementId));
            photoData.append("file", studentImageFile);
            try {
              const photoResponse = await api.post(
                "/achievements/studentImage",
                photoData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                  timeout: 30000,
                }
              );
              if (photoResponse.data?.status !== 200) {
                photoError = photoResponse.data?.message || "Student photo could not be uploaded.";
              }
            } catch (photoUploadError) {
              photoError =
                photoUploadError.response?.data?.message ||
                "Achievement saved, but the student photo could not be uploaded.";
            }
          } else {
            photoError = "Achievement saved, but its ID was unavailable for uploading the student photo.";
          }
        }

        setSuccess(
          `${editingId ? "Achievement updated" : "Achievement added"} successfully.${photoError ? ` ${photoError}` : ""}`
        );
        resetForm();
        await fetchAchievements();
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User or achievement was not found."
        );
      } else if (data?.status === 422) {
        setError(
          "Please check the information entered."
        );
      } else {
        setError(
          data?.message ||
            "Unable to save achievement. Please try again."
        );
      }
    } catch (err) {
      console.error("Achievement API error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError(
          "Some achievement information is invalid."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while saving the achievement."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (achievementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this achievement?"
    );

    if (!confirmed || deletingId) {
      return;
    }

    try {
      setDeletingId(achievementId);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/achievements/${achievementId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess(
          "Achievement deleted successfully."
        );

        await fetchAchievements();
      } else {
        setError(
          data?.message ||
            "Unable to delete achievement. Please try again."
        );
      }
    } catch (err) {
      console.error(
        "Delete achievement error:",
        err
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while deleting the achievement."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (achievement) => {
    const achievementId =
      achievement.achievementId;

    const currentVisibility = Boolean(
      achievement.visibleOnWeb
    );

    const nextVisibility = !currentVisibility;

    try {
      setVisibilityId(achievementId);
      setError("");
      setSuccess("");

      const response = await api.get(
        "/achievements/visibleOnWeb",
        {
          params: {
            achievementId,
            visibleOnWebsite: nextVisibility,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setAchievements((prev) =>
          prev.map((item) =>
            item.achievementId === achievementId
              ? {
                  ...item,
                  visibleOnWeb: nextVisibility,
                }
              : item
          )
        );

        setSuccess(
          nextVisibility
            ? "Achievement is now visible on your website."
            : "Achievement has been hidden from your website."
        );
      } else {
        setError(
          data?.message ||
            "Unable to update website visibility."
        );
      }
    } catch (err) {
      console.error(
        "Achievement visibility error:",
        err
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while updating visibility."
        );
      }
    } finally {
      setVisibilityId(null);
    }
  };

  const getBatchLabel = (batch) => {
    const type =
      batch.batchType === "current"
        ? "Current"
        : batch.batchType === "upcoming"
        ? "Upcoming"
        : batch.batchType === "old"
        ? "Completed"
        : "";

    const session = batch.session
      ? ` • ${batch.session}`
      : "";

    return `${batch.title}${
      type ? ` (${type})` : ""
    }${session}`;
  };

  const filteredAchievements = achievements.filter((achievement) =>
    [
      achievement.title,
      achievement.studentName,
      achievement.description,
      achievement.tags,
      achievement.studentReview,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const visibleCount = achievements.filter(
    (achievement) => Boolean(achievement.visibleOnWeb)
  ).length;
  const hiddenCount = achievements.length - visibleCount;

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loading}>
          <span className={pageStyles.spinner} />
          <p className={pageStyles.loadingCopy}>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.content}>
        <header className={pageStyles.heading}>
          <div>
            <h1 className={pageStyles.headingTitle}>Student achievements</h1>
            <p className={pageStyles.headingCopy}>Celebrate student progress and manage what appears on your website.</p>
          </div>
          {!isFormOpen && (
            <button type="button" onClick={handleAdd} className={`${pageStyles.buttonPrimary} ${pageStyles.headingButton}`}>
              <span aria-hidden="true">＋</span> Add achievement
            </button>
          )}
        </header>

        <div className={pageStyles.summary}>
          <div className={pageStyles.stat}><span className={pageStyles.statLabel}>Total achievements</span><strong className={pageStyles.statValue}>{achievements.length}</strong></div>
          <div className={`${pageStyles.stat} ${pageStyles.statGreen}`}><span className={pageStyles.statLabel}>Visible on website</span><strong className={pageStyles.statValue}>{visibleCount}</strong></div>
          <div className={`${pageStyles.stat} ${pageStyles.statGold} ${pageStyles.hiddenStat}`}><span className={pageStyles.statLabel}>Hidden</span><strong className={pageStyles.statValue}>{hiddenCount}</strong></div>
        </div>

        {/* Error */}
        {error && (
          <div className={`${pageStyles.alert} ${pageStyles.errorAlert}`} role="alert">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={`${pageStyles.alert} ${pageStyles.successAlert}`} role="status">
            {success}
          </div>
        )}

        <div className={pageStyles.listHeading}>
          <div>
            <h2 className={pageStyles.listTitle}>Your achievements</h2>
            <p className={pageStyles.listCopy}>Turn website visibility on or off for each item.</p>
          </div>
          <div className={pageStyles.search}>
            <input
              type="search"
              className={pageStyles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search achievements"
              aria-label="Search achievements"
            />
            <button type="button" className={pageStyles.button} onClick={() => setSearch(search.trim())}>Search</button>
          </div>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div
            className={pageStyles.backdrop}
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving &&
                !uploadingAchievementImage
              ) {
                resetForm();
              }
            }}
          >
          <section className={pageStyles.modal} role="dialog" aria-modal="true" aria-labelledby="achievementFormTitle">

            <div className={pageStyles.modalHeading}>
              <div>
                <h2 id="achievementFormTitle" className={pageStyles.modalTitle}>
                  {editingId
                    ? "Edit achievement"
                    : "Add achievement"}
                </h2>

                <p className={pageStyles.modalCopy}>
                  Add a student success story to your tutor profile.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className={pageStyles.close}
                aria-label="Close form"
                disabled={saving || uploadingAchievementImage}
              >
                ×
              </button>
            </div>

            {error && (
              <div className={pageStyles.modalError} role="alert">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={pageStyles.form}
            >
              <div className={pageStyles.formGrid}>

                {/* Title */}
                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>
                    Achievement title <span className={pageStyles.required}>*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Scored 95% in Class 10"
                    maxLength={255}
                    required
                    className={pageStyles.input}
                  />
                </div>

                {/* Student Name */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Student name
                  </label>

                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    maxLength={200}
                    className={pageStyles.input}
                  />
                </div>

                {/* Rating */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Student rating
                  </label>

                  <select
                    name="studentRating"
                    value={formData.studentRating}
                    onChange={handleChange}
                    className={pageStyles.input}
                  >
                    <option value="">No rating</option>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>
                    ))}
                  </select>
                </div>

                {/* Batch */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Batch
                  </label>

                  <select
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    disabled={batchesLoading}
                    className={`${pageStyles.input} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {batchesLoading
                        ? "Loading batches..."
                        : batches.length === 0
                        ? "No batches available"
                        : "Select a batch (optional)"}
                    </option>

                    {batches.map((batch) => (
                      <option
                        key={batch.batchId}
                        value={batch.batchId}
                      >
                        {getBatchLabel(batch)}
                      </option>
                    ))}
                  </select>

                  <p className={pageStyles.helper}>
                    Leave empty if this achievement is not linked to a batch.
                  </p>
                  <a className={pageStyles.addBatch} href="/batches">Add new batch <span aria-hidden="true">↗</span></a>
                </div>

                {/* Tags */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Tags
                  </label>

                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. board exam, maths, cbse"
                    maxLength={1000}
                    className={pageStyles.input}
                  />
                  {!!formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).length && (
                    <div className={pageStyles.tags} aria-live="polite">
                      {formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, index) => (
                        <span className={pageStyles.tag} key={`${tag}-${index}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <span className={pageStyles.helper}>Type a comma after each tag to add it.</span>
                </div>

                {/* Description */}
                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>
                    Achievement Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the student's achievement..."
                    rows={4}
                    maxLength={5000}
                    className={`${pageStyles.input} resize-y`}
                  />
                </div>

                {/* Review */}
                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>
                    Student Review
                  </label>

                  <textarea
                    name="studentReview"
                    value={formData.studentReview}
                    onChange={handleChange}
                    placeholder="What did the student say about your teaching?"
                    rows={4}
                    maxLength={5000}
                    className={`${pageStyles.input} resize-y`}
                  />
                </div>

                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>YouTube video link</label>
                  <input
                    type="url"
                    name="youtubeVideoLink"
                    value={formData.youtubeVideoLink}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    maxLength={2048}
                    className={pageStyles.input}
                  />
                  <span className={pageStyles.helper}>Optional. Add a video related to this achievement.</span>
                </div>

                <div className={pageStyles.uploadGrid}>
                  <div className={pageStyles.upload}>
                    <label className={pageStyles.uploadLabel} htmlFor="achievementImageFile">
                      {achievementImagePreview ? (
                        <img className={pageStyles.uploadImage} src={achievementImagePreview} alt="Achievement preview" />
                      ) : (
                        <span className={pageStyles.uploadIcon} aria-hidden="true">
                          <UploadIcon />
                        </span>
                      )}
                      <strong className={pageStyles.uploadTitle}>{uploadingAchievementImage ? "Uploading image..." : "Achievement image"}</strong>
                      <span className={pageStyles.helper}>Choose an image for this achievement</span>
                    </label>
                    <input
                      id="achievementImageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleImageChange(event, "achievement")}
                      disabled={uploadingAchievementImage || saving}
                      className={pageStyles.fileInput}
                    />
                    <span                     className={pageStyles.uploadFormats}>JPG, PNG or WebP</span>
                  </div>
                  <div className={pageStyles.upload}>
                    <label className={pageStyles.uploadLabel} htmlFor="studentImageFile">
                      {studentImagePreview ? (
                        <img className={pageStyles.uploadImage} src={studentImagePreview} alt="Student preview" />
                      ) : (
                        <span className={pageStyles.uploadIcon} aria-hidden="true">
                          <StudentIcon className="h-[21px] w-[21px]" />
                        </span>
                      )}
                      <strong className={pageStyles.uploadTitle}>Student photo</strong>
                      <span className={pageStyles.helper}>Add a photo of the student</span>
                    </label>
                    <input
                      id="studentImageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleImageChange(event, "student")}
                      disabled={saving}
                      className={pageStyles.fileInput}
                    />
                    <span className={pageStyles.uploadFormats}>JPG, PNG or WebP</span>
                  </div>
                </div>

              </div>

              <div className={pageStyles.formActions}>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving || uploadingAchievementImage}
                  className={`${pageStyles.button} ${pageStyles.fullAction}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingAchievementImage}
                  className={`${pageStyles.buttonPrimary} ${pageStyles.fullAction}`}
                >
                  {saving ? (
                    <>
                      <span className={pageStyles.smallSpinner} />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Add Achievement"
                  )}
                </button>

              </div>
            </form>
          </section>
          </div>
        )}

        {/* Achievement List */}
        {filteredAchievements.length === 0 ? (
          <div className={pageStyles.empty}>

            <div className={pageStyles.emptyIcon}>
              <svg
                className="h-[30px] w-[30px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 3l2.4 4.9L20 8.7l-4 3.9.9 5.5L12 15.5l-4.9 2.6.9-5.5 5.6-.8L12 3z"
                />
              </svg>
            </div>

            <h2 className={pageStyles.emptyTitle}>
              {search ? "No matching achievements" : "No achievements yet"}
            </h2>

            <p className={pageStyles.emptyCopy}>
              {search
                ? "Try another search or add a new achievement."
                : "Add your first student achievement to start building your profile."}
            </p>

            {!isFormOpen && (
              <button
                type="button"
                onClick={handleAdd}
                className={pageStyles.buttonPrimary}
              >
                Add Your First Achievement
              </button>
            )}

          </div>
        ) : (
          <div className={pageStyles.cards}>

            {filteredAchievements.map((achievement) => {
              const visible = Boolean(
                achievement.visibleOnWeb
              );
              const studentPhoto =
                achievement.studentImageUrl ??
                achievement.student_image_url ??
                achievement.studentImage ??
                achievement.student_image ??
                achievement.studentimage;
              const achievementPhoto =
                achievement.achievementImageUrl ??
                achievement.achievement_image_url ??
                achievement.imageUrl ??
                achievement.image_url ??
                achievement.achievementImage ??
                achievement.achievement_image ??
                achievement.image;
              const rating = Number(achievement.studentRating);
              const batch = batches.find(
                (item) => Number(item.batchId) === Number(achievement.batchId)
              );

              return (
                <article
                  key={achievement.achievementId}
                  className={pageStyles.card}
                >

                  {/* Header */}
                  <div className={pageStyles.cardTop}>

                    <div className={pageStyles.person}>
                      <span className={pageStyles.avatar}>
                        {studentPhoto ? (
                          <img className="h-full w-full object-cover" src={studentPhoto} alt={achievement.studentName || "Student"} />
                        ) : (
                          <StudentIcon />
                        )}
                      </span>
                      <div className={pageStyles.personCopy}>
                      <h2 className={pageStyles.cardTitle}>
                        {achievement.title}
                      </h2>

                      {achievement.studentName && (
                        <p className={`${pageStyles.studentName} [overflow-wrap:anywhere]`}>
                          {achievement.studentName}
                        </p>
                      )}
                      {rating > 0 && (
                        <span className={pageStyles.stars} aria-label={`${rating} out of 5 stars`}>
                          {"★".repeat(Math.min(rating, 5))}{"☆".repeat(Math.max(0, 5 - rating))}
                        </span>
                      )}
                      </div>
                    </div>

                    <span
                      className={`${pageStyles.visibility} ${visible ? pageStyles.visible : ""}`}
                    >
                      {visible
                        ? "Published"
                        : "Hidden"}
                    </span>

                  </div>

                  {/* Description */}
                  {achievementPhoto && (
                    <img className={pageStyles.cardImage} src={achievementPhoto} alt={`Achievement: ${achievement.title}`} />
                  )}
                  <ExpandableText lines={3} className={`${pageStyles.description} mt-0`} preserveWhitespace>{achievement.description || "No description added."}</ExpandableText>

                  {/* Batch */}
                  {achievement.batchId !== null &&
                    achievement.batchId !== undefined && (
                      <div className={pageStyles.batch}>
                        {batch?.title || `Batch ${achievement.batchId}`}
                      </div>
                    )}

                  {/* Review */}
                  {achievement.studentReview && (
                    <blockquote className={pageStyles.review}><ExpandableText lines={2} className="m-0" preserveWhitespace>“{achievement.studentReview}”</ExpandableText></blockquote>
                  )}

                  {achievement.youtubeVideoLink && (
                    <a className={pageStyles.video} href={achievement.youtubeVideoLink} target="_blank" rel="noreferrer">
                      Watch achievement video ↗
                    </a>
                  )}

                  {/* Tags */}
                  {achievement.tags && (
                    <div className={pageStyles.tags}>
                      {achievement.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className={pageStyles.tag}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className={pageStyles.cardFooter}>

                    <button
                      type="button"
                      onClick={() =>
                        handleVisibility(
                          achievement
                        )
                      }
                      disabled={
                        visibilityId ===
                        achievement.achievementId
                      }
                      className={`${pageStyles.visibilityToggle} ${visible ? pageStyles.visibilityToggleOn : ""}`}
                    >
                      {visibilityId ===
                      achievement.achievementId
                        ? "Updating..."
                        : visible
                        ? "Visible on website"
                        : "Hidden from website"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(achievement)
                      }
                      className={pageStyles.buttonSmall}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          achievement.achievementId
                        )
                      }
                      disabled={
                        deletingId ===
                        achievement.achievementId
                      }
                      className={pageStyles.buttonDanger}
                    >
                      {deletingId ===
                      achievement.achievementId
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>
                </article>
              );
            })}

          </div>
        )}

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Achievements;