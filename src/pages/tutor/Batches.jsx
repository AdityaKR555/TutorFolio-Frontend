import { confirmAction } from "../../components/PlatformDialog";
import PlatformLoader from "../../components/PlatformLoader";
import KpiState from "../../components/KpiState";
import React, { useCallback, useEffect, useState } from "react";
import BatchSummaryArt from "./BatchSummaryArt";
import "./batches-mobile.css";
import { Search, Plus, Info } from "lucide-react";
import api from "../../api/axios";
import ExpandableText from "../../components/ExpandableText";
import { UPLOAD_LIMITS } from "../../api/uploadLimits";

const { maxSizeBytes: MAX_BATCH_IMAGE_SIZE, label: MAX_BATCH_IMAGE_LABEL } = UPLOAD_LIMITS["batch-image"];

const pageStyles = {
  page: "tf-batches min-h-full bg-tf-bg px-4 py-6 text-sm leading-relaxed text-tf-ink sm:px-6 lg:px-8",
  content: "mx-auto max-w-[1120px]",
  heading: "batch-heading mb-8 flex items-start justify-between gap-5",
  headingTitle: "mb-2 text-3xl font-bold tracking-tight text-tf-ink sm:text-4xl",
  headingCopy: "m-0 text-sm leading-6 text-tf-copy sm:text-base",
  button: "tf-button-secondary cursor-pointer",
  buttonPrimary: "tf-button-primary cursor-pointer",
  buttonSmall: "inline-flex min-h-[31px] cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[9px] py-1.5 text-[11px] font-semibold text-[var(--tf-copy)] transition-colors duration-[160ms] hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.58] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  buttonDanger: "inline-flex min-h-[31px] cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[9px] py-1.5 text-[11px] font-semibold text-[var(--tf-danger)] transition-colors duration-[160ms] hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.58] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  summary: "batch-summary mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5",
  stat: "batch-stat relative min-h-[174px] min-w-0 overflow-hidden rounded-2xl border bg-tf-surface p-4 shadow-[0_4px_15px_-10px_rgb(15_23_42_/_15%)] sm:p-5",
  statGreen: "",
  statGold: "",
  statLabel: "relative z-10 block text-sm font-medium text-tf-copy",
  statValue: "relative z-10 mt-3 block text-3xl font-bold tracking-tight text-tf-ink",
  statNote: "relative z-10 mt-1 block text-[11px] text-tf-muted",
  alert: "mb-[14px] rounded-[9px] border border-[var(--tf-line)] px-[14px] py-[11px] text-xs",
  errorAlert: "border-red-200 bg-red-50 text-red-700 [[data-theme=dark]_&]:border-red-500/25 [[data-theme=dark]_&]:bg-red-500/10 [[data-theme=dark]_&]:text-red-300",
  successAlert: "border-green-200 bg-green-50 text-green-700 [[data-theme=dark]_&]:border-green-500/25 [[data-theme=dark]_&]:bg-green-500/10 [[data-theme=dark]_&]:text-green-300",
  toolbar: "mb-[17px] flex items-center justify-between gap-[14px] max-[760px]:items-stretch max-[760px]:flex-col",
  tabs: "flex items-center gap-1 rounded-2xl border border-tf-line bg-tf-surface-soft p-1 max-[520px]:justify-between",
  tab: "cursor-pointer rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-tf-copy max-[520px]:px-2 max-[520px]:text-xs",
  tabActive: "bg-tf-sky text-tf-blue shadow-sm",
  toolbarRight: "ml-auto flex items-center gap-[10px] max-[760px]:w-full max-[760px]:ml-0 max-[520px]:flex-wrap",
  search: "min-h-11 w-full rounded-xl border border-tf-line bg-tf-surface py-2.5 pr-3 pl-10 text-sm text-tf-ink focus:border-tf-blue focus:outline-2 focus:outline-[var(--tf-blue)]",
  viewToggle: "flex shrink-0 items-center gap-1 rounded-2xl border border-tf-line bg-tf-surface-soft p-1",
  viewButton: "grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-tf-muted transition-colors hover:text-tf-ink",
  grid: "grid grid-cols-2 gap-[15px] max-[760px]:grid-cols-1",
  card: "tf-card min-w-0 p-5 shadow-sm",
  cardTop: "batch-card-top flex items-start justify-between gap-[10px]",
  cardHeading: "min-w-0",
  cardTitle: "mb-[7px] break-words text-[15px] font-bold leading-[1.35] text-[var(--tf-ink)]",
  session: "text-[11px] text-[var(--tf-muted)]",
  cardActions: "batch-card-actions flex flex-none items-center justify-end gap-[6px]",
  status: "inline-flex items-center whitespace-nowrap rounded-[20px] bg-[var(--tf-sky)] px-2 py-1 text-[10px] font-semibold text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-sky)]",
  statusCurrent: "bg-[var(--tf-success-soft)] text-[var(--tf-success)] [[data-theme=dark]_&]:bg-[var(--tf-success-soft)]",
  statusOld: "bg-[var(--tf-surface-soft)] text-[var(--tf-muted)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]",
  description: "my-[13px] text-xs leading-[1.55] text-[var(--tf-copy)] whitespace-pre-line",
  details: "mt-[13px] grid grid-cols-2 gap-[10px]",
  detail: "flex min-w-0 items-start gap-[9px] text-[11px] text-[var(--tf-copy)]",
  detailIcon: "grid h-[27px] w-[27px] flex-none place-items-center rounded-lg bg-[var(--tf-sky)] text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-sky)]",
  detailCopy: "block min-w-0 break-words",
  detailValue: "block text-[11px] font-semibold text-[var(--tf-ink)]",
  detailLabel: "block text-[10px] text-[var(--tf-muted)]",
  seats: "mt-[15px] rounded-lg bg-[var(--tf-surface-soft)] p-[10px_11px] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]",
  seatline: "mb-[6px] flex justify-between gap-[10px] text-[10px] text-[var(--tf-copy)]",
  seatValue: "font-semibold text-[var(--tf-ink)]",
  progress: "mt-1 block h-[5px] overflow-hidden rounded-md bg-[var(--tf-line)]",
  progressBar: "block h-full rounded-[inherit] bg-gradient-to-r from-[#59b4e9] to-[#267cdb]",
  cardFooter: "mt-[14px] flex items-center justify-between gap-3 border-t border-[var(--tf-line)] pt-3",
  visibilityControl: "flex cursor-pointer items-center gap-2 text-[11px] text-[var(--tf-copy)]",
  publishStatus: "text-[10px] text-[var(--tf-muted)]",
  tableWrap: "max-h-[66vh] overflow-auto overscroll-contain rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface)] shadow-[0_3px_12px_rgb(28_63_101_/_4%)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  table: "w-full min-w-[760px] border-separate border-spacing-0 text-[11px]",
  tableBody: "[&_tr:hover]:bg-[var(--tf-surface-soft)] [&_tr:last-child_td]:border-b-0",
  tableHead: "sticky top-0 z-[1] whitespace-nowrap border-b border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-[11px] py-3 text-left text-[10px] font-bold uppercase tracking-[.04em] text-[var(--tf-muted)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]",
  tableCell: "border-b border-[var(--tf-line)] px-[11px] py-3 align-middle text-[var(--tf-copy)] last:border-b-0",
  tableTitle: "min-w-[180px]",
  tableTitleStrong: "block text-xs font-semibold text-[var(--tf-ink)]",
  tableTitleCopy: "mt-[3px] block text-[10px] leading-[1.6] text-[var(--tf-muted)]",
  tableDates: "mt-[3px] text-[10px] leading-[1.6] text-[var(--tf-muted)]",
  rowActions: "flex gap-[6px]",
  switch: "relative h-[19px] w-[34px] cursor-pointer rounded-[20px] border-0 p-0 transition-colors duration-200 after:absolute after:top-[3px] after:left-[3px] after:h-[13px] after:w-[13px] after:rounded-full after:bg-[var(--tf-surface)] after:transition-[left] after:duration-200 after:content-[''] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60",
  switchOn: "after:left-[18px]",
  empty: "rounded-[13px] border border-dashed border-[var(--tf-line)] bg-[var(--tf-surface)] px-5 py-[42px] text-center text-[var(--tf-copy)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  emptyTitle: "tf-section-title mt-2 mb-1",
  emptyCopy: "mb-4 text-xs text-[var(--tf-muted)]",
  loading: "grid min-h-[320px] place-content-center gap-3 rounded-[13px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-5 py-[42px] text-center text-[var(--tf-copy)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  spinner: "mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--tf-line)] border-t-[var(--tf-blue)]",
  loadingCopy: "m-0",
  backdrop: "tf-modal-backdrop batch-backdrop fixed inset-0 z-[1000] flex items-center justify-center bg-[rgb(10_25_45_/_45%)] p-5 max-[520px]:p-[10px]",
  modal: "tf-modal-panel batch-modal max-h-[92vh] w-full max-w-[720px] overflow-auto rounded-[15px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-[var(--tf-ink)] shadow-[0_12px_32px_rgb(26_67_112_/_16%)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  modalHead: "tf-modal-heading tf-modal-heading-padded flex items-start justify-between gap-4 border-b border-[var(--tf-line)] px-[22px] py-[18px] max-[520px]:px-4 max-[520px]:py-[15px]",
  modalTitle: "mb-1 text-[17px] font-semibold text-[var(--tf-ink)]",
  modalCopy: "text-xs text-[var(--tf-copy)]",
  close: "cursor-pointer border-0 bg-transparent text-2xl leading-none text-[var(--tf-muted)] focus-visible:outline-3 focus-visible:outline-[var(--tf-blue)] focus-visible:outline-offset-2",
  form: "tf-modal-body grid gap-[15px] px-[22px] py-5 max-[520px]:p-4",
  formGrid: "grid grid-cols-2 gap-[13px] max-[520px]:grid-cols-1",
  field: "grid min-w-0 content-start gap-[6px]",
  fieldFull: "col-span-full max-[520px]:col-auto",
  label: "tf-label mb-0",
  input: "tf-field",
  uploadField: "col-span-full max-[520px]:col-auto",
  upload: "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-[6px] overflow-hidden rounded-[10px] border border-dashed border-[var(--tf-blue)] bg-gradient-to-br from-[var(--tf-surface-soft)] to-[var(--tf-sky)] p-3 text-center text-[var(--tf-copy)] hover:border-[var(--tf-blue)] [[data-theme=dark]_&]:from-[var(--tf-surface-soft)] [[data-theme=dark]_&]:to-[var(--tf-sky)]",
  uploadImage: "max-h-[90px] max-w-full rounded-[7px] object-contain",
  uploadTitle: "text-xs text-[var(--tf-ink)]",
  uploadCopy: "text-[10px] text-[var(--tf-muted)]",
  uploadIcon: "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-[21px] text-[var(--tf-blue)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]",
  fileInput: "sr-only",
  checkbox: "flex items-center gap-[9px] text-xs text-[var(--tf-copy)]",
  checkboxInput: "h-4 w-4 accent-[var(--tf-blue)]",
  formActions: "flex justify-end gap-[9px] pt-[3px]",
};

function BatchDetail({ icon, value, label }) {
  const iconPaths = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    money: (
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    ),
    class: (
      <path d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5" />
    ),
  };

  return (
    <div className={pageStyles.detail}>
      <span className={pageStyles.detailIcon} aria-hidden="true">
        <svg
          className="h-[14px] w-[14px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {iconPaths[icon]}
        </svg>
      </span>
      <span className={pageStyles.detailCopy}>
        <strong className={pageStyles.detailValue}>{value}</strong>
        <span className={pageStyles.detailLabel}>{label}</span>
      </span>
    </div>
  );
}

const initialForm = {
  title: "",
  batchType: "upcoming",
  description: "",
  fee: "",
  paymentType: "",
  startOn: "",
  endOn: "",
  eligibleClasses: "",
  maximumSeats: "",
  allottedSeats: "",
  session: "",
  visibleOnWebsite: true,
};

function Batches() {
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [batchImageUrl, setBatchImageUrl] = useState("");
  const [batchImageFile, setBatchImageFile] = useState(null);
  const [batchImagePreview, setBatchImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getUserId = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id;
    } catch {
      return null;
    }
  }, []);

  /*
    Backend currently returns some DB fields in lowercase
    because it uses SELECT * with RealDictCursor.

    Example:
    paymenttype
    starton
    endon
    eligibleclasses
    maximumseats
    allottedseats

    This function supports both the current backend response
    and the cleaner camelCase response if backend is changed later.
  */
  const normalizeBatch = useCallback((batch) => ({
    batchId: batch?.batchId ?? batch?.batchid ?? batch?.id ?? null,

    userId:
      batch?.userId ??
      batch?.userid ??
      null,

    title: batch?.title ?? "",

    batchType:
      batch?.batchType ??
      batch?.batchtype ??
      batch?.type ??
      "upcoming",

    description:
      batch?.description ?? "",

    fee:
      batch?.fee !== null && batch?.fee !== undefined
        ? String(batch.fee)
        : "",

    paymentType:
      batch?.paymentType ??
      batch?.paymenttype ??
      "",

    startOn:
      batch?.startOn ??
      batch?.starton ??
      "",

    endOn:
      batch?.endOn ??
      batch?.endon ??
      "",

    eligibleClasses:
      batch?.eligibleClasses ??
      batch?.eligibleclasses ??
      "",

    maximumSeats:
      batch?.maximumSeats ??
      batch?.maximumseats ??
      "",

    allottedSeats:
      batch?.allottedSeats ??
      batch?.allottedseats ??
      "",

    session:
      batch?.session ?? "",

    imageUrl:
      batch?.imageUrl ??
      batch?.imageurl ??
      batch?.image_url ??
      batch?.batchImage ??
      batch?.batchimage ??
      batch?.batch_image ??
      batch?.batchImageUrl ??
      batch?.batch_image_url ??
      batch?.image ??
      "",

    visibleOnWebsite:
      batch?.visibleOnWebsite ??
      batch?.visibleonwebsite,
  }), []);

  const fetchBatches = useCallback(async (filter = "all") => {
    const userId = getUserId();

    if (!userId) {
      return Promise.resolve().then(() => {
        setError("Your login session could not be found. Please login again.");
        setLoading(false);
      });
    }

    try {
      const response = await api.get(
        `/batches/getAll/${filter}`,
        {
          params: {
            user_id: userId,
          },
          timeout: 15000,
        }
      );

      const data = response.data;
      setError("");

      if (data?.status === 200) {
        /*
          Current backend response:

          {
            status: 200,
            message: "...",
            details: [...]
          }
        */

        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        const normalizedList = rawList.map(normalizeBatch);

        setBatches(normalizedList);
      } else if (data?.status === 404) {
        setBatches([]);
      } else {
        setError(
          data?.message ||
            "Unable to load batches. Please try again."
        );
      }
    } catch (err) {
      console.error("Fetch batches error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError("The batches request was invalid.");
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
          "Something went wrong while loading batches."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [getUserId, normalizeBatch]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchBatches("all"));
  }, [fetchBatches]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = e.target.type === "checkbox" ? e.target.checked : value;


    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setBatchImageUrl("");
    setBatchImageFile(null);
    setBatchImagePreview("");
    setIsFormOpen(false);
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setEditingId(null);
    setBatchImageUrl("");
    setBatchImageFile(null);
    setBatchImagePreview("");
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleEdit = (batch) => {
    setFormData({
      title: batch.title ?? "",
      batchType: batch.batchType ?? "upcoming",
      description: batch.description ?? "",
      fee: batch.fee ?? "",
      paymentType: batch.paymentType ?? "",
      startOn: batch.startOn ?? "",
      endOn: batch.endOn ?? "",
      eligibleClasses: batch.eligibleClasses ?? "",
      maximumSeats:
        batch.maximumSeats !== null &&
        batch.maximumSeats !== undefined
          ? String(batch.maximumSeats)
          : "",
      allottedSeats:
        batch.allottedSeats !== null &&
        batch.allottedSeats !== undefined
          ? String(batch.allottedSeats)
          : "",
      session: batch.session ?? "",
      visibleOnWebsite: batch.visibleOnWebsite ?? true,
    });

    setBatchImageUrl(batch.imageUrl ?? "");
    setBatchImageFile(null);
    setBatchImagePreview(batch.imageUrl ?? "");
    setEditingId(batch.batchId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image for the batch.");
      return;
    }

    if (file.size > MAX_BATCH_IMAGE_SIZE) {
      setError(`Batch image is too large. Maximum allowed size is ${MAX_BATCH_IMAGE_LABEL}.`);
      return;
    }

    setBatchImageFile(file);
    setBatchImagePreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
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
      setError("Batch title is required.");
      return;
    }

    if (
      !["current", "upcoming", "old"].includes(
        formData.batchType
      )
    ) {
      setError("Please select a valid batch type.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Batch description is required.");
      return;
    }

    if (
      formData.startOn &&
      formData.endOn &&
      formData.startOn > formData.endOn
    ) {
      setError("End date must be on or after the start date.");
      return;
    }

    if (
      formData.paymentType &&
      !["monthly", "installment"].includes(
        formData.paymentType
      )
    ) {
      setError("Please select a valid payment type.");
      return;
    }

    if (formData.fee.trim() && !/^\d+(?:\.\d{1,2})?$/.test(formData.fee.trim())) {
      setError("Fee must be a non-negative amount with up to two decimal places.");
      return;
    }

    const maximumSeats =
      formData.maximumSeats === ""
        ? null
        : Number(formData.maximumSeats);

    const allottedSeats =
      formData.allottedSeats === ""
        ? null
        : Number(formData.allottedSeats);

    if (
      maximumSeats !== null &&
      (!Number.isInteger(maximumSeats) ||
        maximumSeats < 0 ||
        maximumSeats > 100000)
    ) {
      setError("Maximum seats must be a valid number.");
      return;
    }

    if (
      allottedSeats !== null &&
      (!Number.isInteger(allottedSeats) ||
        allottedSeats < 0 ||
        allottedSeats > 100000)
    ) {
      setError("Allotted seats must be a valid number.");
      return;
    }

    if (
      maximumSeats !== null &&
      allottedSeats !== null &&
      allottedSeats > maximumSeats
    ) {
      setError(
        "Allotted seats cannot be greater than maximum seats."
      );
      return;
    }

    const payload = {
      userId,
      title: formData.title.trim(),
      visibleOnWebsite: formData.visibleOnWebsite,
      batchType: formData.batchType,
      description: formData.description.trim(),

      // Backend DB is accepting the fee as a numeric string.
      fee: formData.fee.trim() || null,

      paymentType: formData.paymentType || null,
      startOn: formData.startOn || null,
      endOn: formData.endOn || null,
      eligibleClasses:
        formData.eligibleClasses.trim() || null,
      maximumSeats,
      allottedSeats,
      session: formData.session.trim() || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let imageUrl = batchImageUrl;
      if (batchImageFile) {
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("file", batchImageFile);
        const uploadResponse = await api.post("/batches/image", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });
        const uploadResult = uploadResponse.data?.data;
        imageUrl =
          (typeof uploadResult === "string" ? uploadResult : null) ??
          uploadResult?.fileUrl ??
          uploadResponse.data?.fileUrl ??
          "";
        if (
          ![200, 201].includes(uploadResponse.data?.status) ||
          !imageUrl
        ) {
          throw new Error(
            uploadResponse.data?.message ||
              "The batch image upload did not return an image URL."
          );
        }
      }

      const batchPayload = {
        ...payload,
        ...(imageUrl ? { imageUrl } : {}),
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/batches/${editingId}`,
          batchPayload,
          {
            timeout: 15000,
          }
        );
      } else {
        response = await api.post(
          "/batches/new",
          batchPayload,
          {
            timeout: 15000,
          }
        );
      }

      const data = response.data;

      if (
        data?.status === 200 ||
        data?.status === 201
      ) {
        setSuccess(
          editingId
            ? "Batch updated successfully."
            : "Batch added successfully."
        );

        resetForm();

        // Always reload latest data from backend.
        await fetchBatches("all");
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User or batch was not found."
        );
      } else if (data?.status === 422) {
        setError(
          "Please check the information entered."
        );
      } else {
        setError(
          data?.message ||
            "Unable to save batch. Please try again."
        );
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 413) {
        setError("The batch image is too large to upload. Choose a smaller image.");
      } else if (err.response?.status === 415) {
        setError("Choose a valid JPEG, PNG, or WebP image.");
      } else if (err.response?.status === 422) {
        setError(
          "Some batch information is invalid. Please check the form."
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
          "Something went wrong while saving the batch."
        );
      }
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (batchId) => {
    const confirmed = await confirmAction(
      "Are you sure you want to delete this batch?"
    );

    if (!confirmed || deletingId) {
      return;
    }

    try {
      setDeletingId(batchId);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/batches/${batchId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess("Batch deleted successfully.");

        await fetchBatches("all");
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "Batch was not found."
        );
      } else {
        setError(
          data?.message ||
            "Unable to delete batch. Please try again."
        );
      }
    } catch (err) {
      console.error("Delete batch error:", err);

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
          "Something went wrong while deleting the batch."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (
    batchId,
    visible
  ) => {
    const nextVisibility = !visible;

    try {
      setVisibilityId(batchId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/batches/visibility/${batchId}`,
        null,
        {
          params: {
            visible_on_website: nextVisibility,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess(
          nextVisibility
            ? "Batch is now visible on your website."
            : "Batch has been hidden from your website."
        );

        setBatches((prev) =>
          prev.map((item) =>
            item.batchId === batchId
              ? {
                  ...item,
                  visibleOnWebsite: nextVisibility,
                }
              : item
          )
        );
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "Batch was not found."
        );
      } else {
        setError(
          data?.message ||
            "Unable to update website visibility."
        );
      }
    } catch (err) {
      console.error(
        "Batch visibility error:",
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

  const formatDate = (value) => {
    if (!value) {
      return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTypeLabel = (type) => {
    if (type === "current") return "Current";
    if (type === "upcoming") return "Upcoming";
    if (type === "old") return "Completed";

    return type;
  };

  const getTypeClass = (type) =>
    type === "current"
      ? pageStyles.statusCurrent
      : type === "old"
      ? pageStyles.statusOld
      : "";

  const filterItems = [
    { key: "all", label: "All batches" },
    { key: "upcoming", label: "Upcoming" },
    { key: "current", label: "Running" },
    { key: "old", label: "Past" },
  ];

  const visibleBatches = batches.filter((batch) =>
    activeFilter === "all" || batch.batchType === activeFilter
  );
  const filteredBatches = visibleBatches.filter((batch) =>
    [
      batch.title,
      batch.session,
      batch.eligibleClasses,
      batch.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );
  const upcomingCount = batches.filter((batch) => batch.batchType === "upcoming").length;
  const currentCount = batches.filter((batch) => batch.batchType === "current").length;
  const availableSeats = batches
    .filter((batch) => batch.batchType !== "old")
    .reduce((total, batch) => {
      const maximum = Number(batch.maximumSeats);
      const filled = Number(batch.allottedSeats) || 0;
      return total + (Number.isFinite(maximum) ? Math.max(0, maximum - filled) : 0);
    }, 0);
  const estimatedRevenue = batches
    .reduce((total, batch) => {
      const fee = Number(String(batch.fee ?? "").replace(/[^\d.]/g, ""));
      const filled = Number(batch.allottedSeats) || 0;
      return total + (Number.isFinite(fee) ? fee * filled : 0);
    }, 0);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loading}>
          <PlatformLoader showLabel={false} />
          <p className={pageStyles.loadingCopy}>Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.content}>
        <header className={pageStyles.heading}>
          <div>
            <h1 className={pageStyles.headingTitle}>Batches</h1>
            <p className={pageStyles.headingCopy}>Organize your classes, track seats, and manage what students can see.</p>
          </div>
          <button type="button" onClick={handleAdd} className="batch-new inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
            <Plus size={21} aria-hidden="true"/> New batch
          </button>
        </header>

        <section aria-label="Batch statistics" className={pageStyles.summary}>
          {[["Total batches", batches.length, "total", "#8b5cf6"], ["Upcoming batches", upcomingCount, "upcoming", "#f59e0b"], ["Running batches", currentCount, "running", "#14b8a6"], ["Seats available", availableSeats, "seats", "#38bdf8"], ["Estimated revenue", formatCurrency(estimatedRevenue), "revenue", "#fb7185"]].map(([label,value,type,color]) => <div key={type} className={`${pageStyles.stat} batch-stat-${type}`} style={{ color, borderColor: `${color}45` }}>
            <KpiState unavailable={Boolean(error) && batches.length === 0} empty={type === "revenue" ? batches.length === 0 : type === "seats" ? batches.length === 0 : value === 0} label={label} message={type === "upcoming" ? "No upcoming batches yet" : type === "running" ? "No running batches yet" : "Your first batch starts here"} kind="records"><span className={`${pageStyles.statLabel} ${type === "revenue" ? "pr-5" : ""}`}>{label}</span>
            {type === "revenue" && (
              <>
                <button
                  type="button"
                  popoverTarget="estimated-revenue-tooltip"
                  aria-label="How estimated revenue is calculated"
                  title="Sum of (enrolled students × batch fee) across all batches, including past batches."
                  className="batch-revenue-info"
                >
                  <Info size={16} strokeWidth={2} aria-hidden="true" />
                </button>
                <div id="estimated-revenue-tooltip" popover="auto" className="batch-revenue-tooltip">
                  <strong>Estimated revenue</strong>
                  <p>For each batch, multiply its enrolled students by its batch fee, then add the results across all batches, including past batches.</p>
                  <p className="batch-revenue-formula">Total = Σ (enrolled students × batch fee)</p>
                </div>
              </>
            )}
            <strong className={`${pageStyles.statValue} ${type === "revenue" ? "text-[clamp(1.2rem,1.8vw,1.875rem)]!" : ""}`}>{value}</strong>
            {type === "revenue" && <small className={pageStyles.statNote}>Across all batches</small>}
            <BatchSummaryArt type={type}/></KpiState>
          </div>)}
        </section>

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

        {/* Add / Edit Form */}
        {isFormOpen && (
          <div className={pageStyles.backdrop} onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) resetForm();
          }}>
          <section className={pageStyles.modal} role="dialog" aria-modal="true" aria-labelledby="batchFormTitle">

            <div className={pageStyles.modalHead}>
              <div>
                <h2 id="batchFormTitle" className={pageStyles.modalTitle}>
                  {editingId ? "Edit Batch" : "Add Batch"}
                </h2>

                <p className={pageStyles.modalCopy}>
                  Add the details of your tuition batch.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className={pageStyles.close}
                aria-label="Close form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className={pageStyles.form}
            >
              <div className={pageStyles.formGrid}>

                {/* Title */}
                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>
                    Batch Title{" "}
                    <span className="text-[var(--tf-danger)]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Class 10 Mathematics Batch"
                    maxLength={200}
                    className={pageStyles.input}
                  />
                </div>

                {/* Batch Type */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Batch Type{" "}
                    <span className="text-[var(--tf-danger)]">
                      *
                    </span>
                  </label>

                  <select
                    name="batchType"
                    value={formData.batchType}
                    onChange={handleChange}
                    className={`${pageStyles.input} appearance-none`}
                  >
                    <option value="upcoming">
                      Upcoming
                    </option>

                    <option value="current">
                      Current
                    </option>

                    <option value="old">
                      Completed
                    </option>
                  </select>
                </div>

                {/* Session */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Session
                  </label>

                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    placeholder="e.g. 2026-27"
                    className={pageStyles.input}
                  />
                </div>

                {/* Fee */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Fee
                  </label>

                  <input
                    type="text"
                    name="fee"
                    inputMode="decimal"
                    value={formData.fee}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    className={pageStyles.input}
                  />

                  <p className="mt-2 text-xs text-[var(--tf-copy)]">
                    Enter amount only, e.g. 500.
                  </p>
                </div>

                {/* Payment Type */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Payment Type
                  </label>

                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleChange}
                    className={`${pageStyles.input} appearance-none`}
                  >
                    <option value="">
                      Select payment type
                    </option>

                    <option value="monthly">
                      Monthly
                    </option>

                    <option value="installment">
                      Installment
                    </option>
                  </select>
                </div>

                {/* Start */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startOn"
                    value={formData.startOn}
                    onChange={handleChange}
                    className={`${pageStyles.input} [color-scheme:light] [[data-theme=dark]_&]:[color-scheme:dark]`}
                  />
                </div>

                {/* End */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    End Date
                  </label>

                  <input
                    type="date"
                    name="endOn"
                    value={formData.endOn}
                    onChange={handleChange}
                    className={`${pageStyles.input} [color-scheme:light] [[data-theme=dark]_&]:[color-scheme:dark]`}
                  />
                </div>

                {/* Eligible Classes */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Eligible Classes
                  </label>

                  <input
                    type="text"
                    name="eligibleClasses"
                    value={formData.eligibleClasses}
                    onChange={handleChange}
                    placeholder="e.g. Class 8-10"
                    className={pageStyles.input}
                  />
                </div>

                {/* Maximum Seats */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Maximum Seats
                  </label>

                  <input
                    type="number"
                    name="maximumSeats"
                    value={formData.maximumSeats}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    min="0"
                    className={pageStyles.input}
                  />
                </div>

                {/* Allotted Seats */}
                <div className={pageStyles.field}>
                  <label className={pageStyles.label}>
                    Allotted Seats
                  </label>

                  <input
                    type="number"
                    name="allottedSeats"
                    value={formData.allottedSeats}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    min="0"
                    className={pageStyles.input}
                  />
                </div>

                {/* Description */}
                <div className={`${pageStyles.field} ${pageStyles.fieldFull}`}>
                  <label className={pageStyles.label}>
                    Description{" "}
                    <span className="text-[var(--tf-danger)]">
                      *
                    </span>
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe this batch..."
                    rows={5}
                    maxLength={2000}
                    className={`${pageStyles.input} resize-y`}
                  />
                </div>

                <div className={pageStyles.uploadField}>
                  <label className={pageStyles.label}>Batch image</label>
                  <label className={pageStyles.upload}>
                    {batchImagePreview ? (
                      <img className={pageStyles.uploadImage} src={batchImagePreview} alt="Batch preview" />
                    ) : (
                      <span className={pageStyles.uploadIcon} aria-hidden="true">↑</span>
                    )}
                    <strong className={pageStyles.uploadTitle}>{uploadingImage ? "Uploading image…" : batchImagePreview ? "Change batch image" : "Choose an image for this batch"}</strong>
                    <span className={pageStyles.uploadCopy}>JPG, PNG or WebP</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                      className={pageStyles.fileInput}
                    />
                  </label>
                </div>
              </div>

              <label className={pageStyles.checkbox}>
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={formData.visibleOnWebsite}
                  onChange={handleChange}
                  className={pageStyles.checkboxInput}
                />
                <span>Visible on website</span>
              </label>
              <div className={pageStyles.formActions}>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className={pageStyles.button}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={pageStyles.buttonPrimary}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--tf-on-primary)]/30 border-t-[var(--tf-on-primary)]" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Add Batch"
                  )}
                </button>
              </div>
            </form>
          </section>
          </div>
        )}

        {/* Filters */}
        <div className={pageStyles.toolbar}>
          <div className={pageStyles.tabs} role="tablist" aria-label="Filter batches">
          {filterItems.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={`${pageStyles.tab} ${activeFilter === filter.key ? pageStyles.tabActive : ""}`}
            >
              {filter.label}
            </button>
          ))}
          </div>
          <div className={pageStyles.toolbarRight}>
            <div className="relative min-w-0 flex-1 sm:w-64"><Search size={19} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tf-muted"/><input
              type="search"
              className={pageStyles.search}
              placeholder="Search batches"
              aria-label="Search batches"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            /></div>
            <div className={pageStyles.viewToggle} aria-label="Batch layout">
              <button type="button" aria-label="List view" title="List view" aria-pressed={viewMode === "list"} className={`${pageStyles.viewButton} ${viewMode === "list" ? pageStyles.tabActive : ""}`} onClick={() => setViewMode("list")}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 3h2v2H2zM6 3h12v2H6zM2 9h2v2H2zM6 9h12v2H6zM2 15h2v2H2zM6 15h12v2H6z"/></svg></button>
              <button type="button" aria-label="Grid view" title="Grid view" aria-pressed={viewMode === "grid"} className={`${pageStyles.viewButton} ${viewMode === "grid" ? pageStyles.tabActive : ""}`} onClick={() => setViewMode("grid")}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 2h7v7H2zM11 2h7v7h-7zM2 11h7v7H2zM11 11h7v7h-7z"/></svg></button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredBatches.length === 0 ? (
          <div className={pageStyles.empty}>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tf-sky)]">
              <svg
                className="h-8 w-8 text-[var(--tf-blue)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                />
              </svg>
            </div>

            <h2 className={pageStyles.emptyTitle}>{batches.length === 0 ? "No batches yet" : "No matching batches"}</h2>

            <p className={pageStyles.emptyCopy}>{batches.length === 0 ? "Create your first batch to start managing your tuition classes." : "Try another search or choose a different batch type."}</p>

            {!isFormOpen && (
              <button
                type="button"
                onClick={handleAdd}
                className="mt-6 rounded-xl bg-[var(--tf-blue)] px-5 py-3 text-sm font-medium text-[var(--tf-on-primary)] transition-colors hover:bg-[var(--tf-blue-pressed)]"
              >
                Add Your First Batch
              </button>
            )}
          </div>
        ) : (
          <>
          {viewMode === "list" && <div className={`${pageStyles.tableWrap} batch-desktop-table`} role="region" aria-label="Batch list" tabIndex="0">
            <table className={pageStyles.table}>
              <thead>
                <tr>
                  <th className={pageStyles.tableHead} scope="col">Batch</th>
                  <th className={pageStyles.tableHead} scope="col">Type</th>
                  <th className={pageStyles.tableHead} scope="col">Dates</th>
                  <th className={pageStyles.tableHead} scope="col">Fee</th>
                  <th className={pageStyles.tableHead} scope="col">Seats</th>
                  <th className={pageStyles.tableHead} scope="col">Website</th>
                  <th className={pageStyles.tableHead} scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className={pageStyles.tableBody}>
                {filteredBatches.map((batch) => {
                  const visible = batch.visibleOnWebsite !== undefined
                    ? Boolean(batch.visibleOnWebsite)
                    : true;

                  return (
                    <tr key={batch.batchId}>
                      <td className={`${pageStyles.tableCell} ${pageStyles.tableTitle}`}>
                        <div className="flex items-center gap-2.5">
                          {batch.imageUrl && (
                            <img
                              src={batch.imageUrl}
                              alt=""
                              className="h-9 w-12 shrink-0 rounded-md border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] object-cover"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          )}
                          <div className="min-w-0">
                            <strong className={pageStyles.tableTitleStrong}>{batch.title}</strong>
                            <span className={pageStyles.tableTitleCopy}>{batch.session ? `Session ${batch.session}` : batch.eligibleClasses || "No session specified"}</span>
                          </div>
                        </div>
                      </td>
                      <td className={pageStyles.tableCell}><span className={`${pageStyles.status} ${getTypeClass(batch.batchType)}`}>{getTypeLabel(batch.batchType)}</span></td>
                      <td className={`${pageStyles.tableCell} ${pageStyles.tableDates}`}>{formatDate(batch.startOn)}<br />{formatDate(batch.endOn)}</td>
                      <td className={pageStyles.tableCell}>{batch.fee ? `₹${batch.fee}` : "—"}</td>
                      <td className={pageStyles.tableCell}>{batch.allottedSeats ?? 0} / {batch.maximumSeats ?? "—"}</td>
                      <td className={pageStyles.tableCell}>
                        <button
                          type="button"
                          className={`${pageStyles.switch} batch-visibility-switch ${visible ? pageStyles.switchOn : ""}`}
                          aria-label={`${visible ? "Hide" : "Show"} ${batch.title} on website`}
                          aria-pressed={visible}
                          onClick={() => handleVisibility(batch.batchId, visible)}
                          disabled={visibilityId === batch.batchId}
                        />
                      </td>
                      <td className={pageStyles.tableCell}>
                        <div className={pageStyles.rowActions}>
                          <button type="button" className={`${pageStyles.buttonSmall} batch-icon-action`} aria-label={`Edit ${batch.title}`} title="Edit batch" onClick={() => handleEdit(batch)}><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13.5 3.5 3 3M3 17l3.8-.8L16 7a2.1 2.1 0 0 0-3-3L3.8 13.2 3 17Z"/></svg><span className="sr-only">Edit</span></button>
                          <button
                            type="button"
                            className={`${pageStyles.buttonDanger} batch-icon-action`}
                            aria-label={deletingId === batch.batchId ? `Deleting ${batch.title}` : `Delete ${batch.title}`}
                            title="Delete batch"
                            onClick={() => handleDelete(batch.batchId)}
                            disabled={deletingId === batch.batchId}
                          >
                            {deletingId === batch.batchId ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true"/><span className="sr-only">Deleting…</span></> : <><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h14M7 5V3h6v2m-8 0 1 12h8l1-12M8 8v6m4-6v6"/></svg><span className="sr-only">Delete</span></>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
          <div className={`${pageStyles.grid} ${viewMode === "list" ? "batch-mobile-list" : ""}`}>

            {filteredBatches.map((batch) => {
              const visible =
                batch.visibleOnWebsite !== undefined
                  ? Boolean(batch.visibleOnWebsite)
                  : true;

              return (
                <article
                  key={batch.batchId}
                  className={pageStyles.card}
                >
                  <div className={pageStyles.cardTop}>
                    <div className={pageStyles.cardHeading}>
                      <h2 className={`${pageStyles.cardTitle} [overflow-wrap:anywhere]`}>{batch.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`${pageStyles.status} ${getTypeClass(batch.batchType)}`}>{getTypeLabel(batch.batchType)}</span>
                        {batch.session && <span className={pageStyles.session}>Session {batch.session}</span>}
                      </div>
                    </div>
                    <div className={pageStyles.cardActions}>
                      <button
                        type="button"
                        className={`${pageStyles.buttonSmall} batch-icon-action`}
                        aria-label={`Edit ${batch.title}`}
                        title="Edit batch"
                        onClick={() => handleEdit(batch)}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13.5 3.5 3 3M3 17l3.8-.8L16 7a2.1 2.1 0 0 0-3-3L3.8 13.2 3 17Z"/></svg>
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        type="button"
                        className={`${pageStyles.buttonDanger} batch-icon-action`}
                        aria-label={deletingId === batch.batchId ? `Deleting ${batch.title}` : `Delete ${batch.title}`}
                        title="Delete batch"
                        onClick={() => handleDelete(batch.batchId)}
                        disabled={deletingId === batch.batchId}
                      >
                        {deletingId === batch.batchId ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true"/><span className="sr-only">Deleting…</span></> : <><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h14M7 5V3h6v2m-8 0 1 12h8l1-12M8 8v6m4-6v6"/></svg><span className="sr-only">Delete</span></>}
                      </button>
                    </div>
                  </div>

                  {batch.imageUrl ? (
                    <div className="batch-preview mt-3 mb-3.5 flex items-start gap-3.5">
                      <img
                        className="h-20 w-32 shrink-0 rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] object-cover shadow-sm sm:h-24 sm:w-36"
                        src={batch.imageUrl}
                        alt={`Batch: ${batch.title}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                      {batch.description && (
                        <ExpandableText lines={3} className={`${pageStyles.description} mt-0 leading-relaxed`} containerClassName="flex-1" preserveWhitespace>{batch.description}</ExpandableText>
                      )}
                    </div>
                  ) : batch.description ? (
                    <ExpandableText lines={3} className={pageStyles.description} preserveWhitespace>{batch.description}</ExpandableText>
                  ) : null}

                  <div className={pageStyles.details}>
                    <BatchDetail
                      icon="calendar"
                      value={formatDate(batch.startOn)}
                      label="Start date"
                    />
                    <BatchDetail
                      icon="calendar"
                      value={formatDate(batch.endOn)}
                      label="End date"
                    />
                    <BatchDetail
                      icon="money"
                      value={`${batch.fee ? `₹${batch.fee}` : "Not specified"}${batch.paymentType ? ` / ${batch.paymentType === "monthly" ? "month" : batch.paymentType}` : ""}`}
                      label="Course fee"
                    />
                    <BatchDetail
                      icon="class"
                      value={batch.eligibleClasses || "Not specified"}
                      label="Eligible classes"
                    />
                  </div>

                  <div className={pageStyles.seats}>
                    <div className={pageStyles.seatline}>
                      <span>Seats filled</span>
                      <strong className={pageStyles.seatValue}>{batch.allottedSeats ?? 0} of {batch.maximumSeats ?? "—"}</strong>
                    </div>
                    <div
                      className={pageStyles.progress}
                      role="progressbar"
                      aria-label={`${batch.title} seats filled`}
                      aria-valuemin={0}
                      aria-valuemax={Number(batch.maximumSeats) || 0}
                      aria-valuenow={Math.min(Number(batch.allottedSeats) || 0, Number(batch.maximumSeats) || 0)}
                    >
                      <i className={pageStyles.progressBar} style={{ width: `${batch.maximumSeats ? Math.min(100, (Number(batch.allottedSeats || 0) / Number(batch.maximumSeats)) * 100) : 0}%` }} />
                    </div>
                  </div>

                  <div className={pageStyles.cardFooter}>
                    <label className={pageStyles.visibilityControl}>
                      <button
                        type="button"
                        className={`${pageStyles.switch} batch-visibility-switch ${visible ? pageStyles.switchOn : ""}`}
                        aria-label={`${visible ? "Hide" : "Show"} ${batch.title} on website`}
                        aria-pressed={visible}
                        onClick={() => handleVisibility(batch.batchId, visible)}
                        disabled={visibilityId === batch.batchId}
                      />
                      <span>Visible on website</span>
                    </label>
                    <span className={pageStyles.publishStatus}>
                      {visibilityId === batch.batchId
                        ? "Updating…"
                        : visible ? "Published" : "Hidden"}
                    </span>
                  </div>
                </article>
              );
            })}

          </div>
          </>
        )}

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Batches;
