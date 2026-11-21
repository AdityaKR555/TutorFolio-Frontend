import SocialIcon from "../SocialIcon";
import { getTutorNavigationBase } from "../../utils/websiteUrls";
import { getContactActions } from "../../utils/contactIcons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./glass-visuals.css";
import ExpandableText from "../ExpandableText";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ helpers */
const fd = (src, keys, fallback = "") => {
  for (const key of keys) if (src?.[key] !== undefined && src?.[key] !== null && src[key] !== "") return src[key];
  return fallback;
};
const list = (value) => Array.isArray(value) ? value : value ? String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean) : [];
const dateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};
const asUrl = (value) => /^https?:\/\//i.test(String(value || "")) ? value : value ? `https://${value}` : "";
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

const pageLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "classes", label: "Classes" },
  { id: "batches", label: "Batches" },
  { id: "gallery", label: "Gallery" },
  { id: "achievements", label: "Achievements" },
  { id: "experience", label: "Experience" },
];
const hrefFor = (basePath, id) => (id === "home" ? basePath : `${basePath}/${id}`);

const IMAGE_KEYS = ["fileUrl", "url", "imageUrl", "src"];
const BATCH_IMAGE_KEYS = ["imageUrl", "image_url", "batchImageUrl", "batchImage"];
const LOGO_KEYS = ["logo", "logoUrl", "logo_url", "tuitionLogo", "tuition_logo"];

const batchState = (batch) => {
  const now = new Date();
  const start = batch.startOn ? new Date(batch.startOn) : null;
  const end = batch.endOn ? new Date(batch.endOn) : null;
  if (start && start > now) return "Upcoming";
  if (end && end < now) return "Previous";
  return "Current";
};

/* -------------------------------------------------------------------- icons */
const ICONS = {
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  chevR: <path d="m9 6 6 6-6 6" />,
  chevL: <path d="m15 6-6 6 6 6" />,
  chevD: <path d="m6 9 6 6 6-6" />,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.7 9.7a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 11h8m-8 4h5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14.5-1.5 6.5 5-3 5 3-1.5-6.5" /></>,
  grad: <path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v7" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4m8-4v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" /></>,
  rupee: <path d="M6 4h12M6 9h12M6 4c6 0 8 2 8 5s-3 5-8 5l8 6" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></>,
  quote: <path d="M10 7H6.5A2.5 2.5 0 0 0 4 9.5V14h6V9.5H6.5M20 7h-3.5A2.5 2.5 0 0 0 14 9.5V14h6V9.5h-3.5" />,
  external: <path d="M7 17 17 7M8 7h9v9" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
};
const SOCIAL_ICON = { youtube: "youtube", instagram: "instagram", facebook: "facebook", linkedin: "linkedin", telegram: "telegram", whatsapp: "whatsapp", x: "x", twitter: "x" };
const SOCIAL_NAME = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", telegram: "Telegram", whatsapp: "WhatsApp", x: "X", twitter: "X" };

function Icon({ name, className = "h-5 w-5", fill = "none" }) {
  if (["youtube", "instagram", "facebook", "linkedin", "telegram", "whatsapp", "x", "twitter"].includes(name)) return <SocialIcon platform={name} className={className} />;
  return <svg className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[name] || ICONS.globe}</svg>;
}

/* ---------------------------------------------------------------- primitives */
// Glass surface. `shine` adds a specular highlight that follows the mouse (ignored on touch).
// Avoid position utilities (absolute/fixed/sticky) on a Glass element; wrap it instead.
function Glass({ as: Tag = "div", shine = false, className = "", children, ...rest }) {
  const move = (event) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };
  return <Tag className={`gl-glass ${className}`} data-shine={shine ? "" : undefined} onPointerMove={shine ? move : undefined} {...rest}>{children}</Tag>;
}

function Pill({ children, accent = false, icon }) {
  return <span className={`gl-pill ${accent ? "gl-pill-accent" : ""}`}>{icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}{children}</span>;
}

function Stars({ value }) {
  return <span className="gl-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" className="h-4 w-4" fill={i < Math.round(value) ? "currentColor" : "none"} />)}</span>;
}

function Avatar({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt={name} onError={() => setFailed(true)} className={`gl-avatar ${className}`} />;
  return <div role="img" aria-label={name} className={`gl-avatar gl-avatar-fallback ${className}`}>{name?.trim()?.[0]?.toUpperCase() || "T"}</div>;
}

function SmallAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt="" onError={() => setFailed(true)} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />;
  return <span aria-hidden="true" className="gl-chip-icon h-11 w-11 text-base font-semibold">{name?.trim()?.[0]?.toUpperCase() || "S"}</span>;
}

function TuitionLogo({ tuition, name, className = "h-9 w-9" }) {
  const src = fd(tuition, LOGO_KEYS);
  const [failedSrc, setFailedSrc] = useState("");
  if (src && failedSrc !== src) {
    return <img src={src} alt={`${name || "Tuition"} logo`} onError={() => setFailedSrc(src)} className={`${className} shrink-0 rounded-full bg-white/70 object-contain p-0.5`} />;
  }
  return <span aria-hidden="true" className={`gl-chip-icon ${className} shrink-0`}><Icon name="book" className="h-5 w-5" /></span>;
}

function PageHeading({ title, description }) {
  return <div className="mb-8 max-w-3xl sm:mb-10"><h1 className="gl-page-title">{title}</h1>{description && <p className="gl-muted mt-3 text-base leading-7 sm:text-lg">{description}</p>}</div>;
}

function SectionHead({ title, description, to, label = "View all" }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
    <div className="min-w-0"><h2 className="gl-h2">{title}</h2>{description && <p className="gl-muted mt-1.5 text-base">{description}</p>}</div>
    {to && <Link to={to} aria-label={`${label}: ${title}`} className="gl-link">{label}<Icon name="chevR" className="h-4 w-4" /></Link>}
  </div>;
}

function EmptyNote({ children }) {
  return <Glass className="rounded-3xl p-8 text-center text-sm gl-muted sm:p-12">{children}</Glass>;
}

/* ------------------------------------------------------------------- header */
function GlassHeader({ basePath, currentPage, brand, tuition, mode, onToggleMode, onContactClick }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const isDark = mode === "dark";

  useEffect(() => { setOpen(false); }, [currentPage]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!wrapRef.current?.contains(event.target)) setOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
    <div ref={wrapRef} className="mx-auto max-w-6xl">
      <Glass className="flex items-center gap-2 rounded-full py-2 pl-3 pr-2 sm:pl-4">
        <Link to={basePath} className="flex min-w-0 flex-1 items-center gap-2.5 no-underline lg:w-64 lg:flex-none lg:shrink-0" style={{ color: "inherit" }}>
          <TuitionLogo tuition={tuition} name={brand} />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">{brand}</span>
        </Link>
        <nav aria-label="Tutor website pages" className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {pageLinks.map((page) => <Link key={page.id} to={hrefFor(basePath, page.id)} aria-current={currentPage === page.id ? "page" : undefined} className="gl-navlink">{page.label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2 lg:w-64 lg:justify-end">
          <button type="button" onClick={onToggleMode} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} className="gl-icon-btn">
            <span key={mode} className="gl-spin"><Icon name={isDark ? "sun" : "moon"} className="h-[1.15rem] w-[1.15rem]" /></span>
          </button>
          <span className="hidden sm:block"><button type="button" onClick={onContactClick} aria-label="Open TutorFolio messenger" className="gl-btn gl-btn-solid gl-btn-sm"><Icon name="message" className="h-4 w-4" />Message</button></span>
          <span className="lg:hidden"><button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="gl-menu" className="gl-icon-btn"><Icon name={open ? "close" : "menu"} className="h-5 w-5" /></button></span>
        </div>
      </Glass>
      {open && <Glass as="nav" id="gl-menu" aria-label="Pages" className="gl-sheet mt-2 rounded-[1.75rem] p-2 lg:hidden">
        {pageLinks.map((page) => <Link key={page.id} to={hrefFor(basePath, page.id)} onClick={() => setOpen(false)} aria-current={currentPage === page.id ? "page" : undefined} className="gl-sheetlink">{page.label}<Icon name="chevR" className="h-4 w-4 gl-faint" /></Link>)}
        <div className="p-2 pt-3 sm:hidden"><button type="button" onClick={() => { setOpen(false); onContactClick?.(); }} className="gl-btn gl-btn-solid w-full"><Icon name="message" className="h-4 w-4" />Message tutor</button></div>
      </Glass>}
    </div>
  </header>;
}

/* ------------------------------------------------------------- contact fab */
function FloatingContact({ profile }) {
  const actions = getContactActions(profile);
  if (!actions.length) return null;
  return <aside aria-label="Contact tutor" className="fixed right-3 z-40 sm:right-6" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}><Glass className="flex flex-col gap-1.5 rounded-full p-1.5">
    {actions.map((action) => <a key={action.field} href={action.href}
      target={action.type === "whatsapp" ? "_blank" : undefined}
      rel={action.type === "whatsapp" ? "noopener noreferrer" : undefined}
      aria-label={action.actionLabel} title={action.actionLabel}
      className={`relative gl-fab ${action.type === "whatsapp" ? "gl-fab-wa" : "gl-fab-call"}`}>
      <Icon name={action.type === "whatsapp" ? "whatsapp" : "phone"} className="h-6 w-6" />
    </a>)}
  </Glass></aside>;
}

/* --------------------------------------------------------- achievements UI */
function AchievementCard({ item, previewTo = "", flip = false }) {
  const studentSrc = fd(item, ["studentImageUrl", "student_image_url", "studentImage", "student_image", "studentimage", "studentPhoto"]);
  const achievementSrc = fd(item, ["achievementImageUrl", "achievement_image_url", "imageUrl", "image_url", "achievementImage", "achievement_image", "image"]);
  const [failedAchievement, setFailedAchievement] = useState("");
  const [failedStudent, setFailedStudent] = useState("");
  const hasAchievement = Boolean(achievementSrc && failedAchievement !== achievementSrc);
  const hasStudent = Boolean(studentSrc && failedStudent !== studentSrc);
  const studentName = fd(item, ["studentName"], "Student");
  const title = fd(item, ["title"], "Student achievement");
  const rating = Number(fd(item, ["studentRating", "rating"], 0));
  const achievementId = `achievement-${item.achievementId ?? item.id ?? "story"}`;
  const tags = list(item.tags);
  return <Glass as="article" id={achievementId} className="grid scroll-mt-28 overflow-hidden rounded-[1.75rem] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
    <div className={`gl-media min-h-56 ${flip ? "md:order-2" : ""}`}>
      {hasAchievement
        ? <img src={achievementSrc} alt={title} onError={() => setFailedAchievement(achievementSrc)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        : hasStudent
          ? <img src={studentSrc} alt={studentName} onError={() => setFailedStudent(studentSrc)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          : <Icon name="award" className="h-16 w-16" />}
    </div>
    <div className="flex min-w-0 flex-col gap-4 p-5 [overflow-wrap:anywhere] sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <Pill accent icon={item.studentReview ? "users" : "award"}>{item.studentReview ? "Student success" : "Academic milestone"}</Pill>
        {rating > 0 && <span className="inline-flex items-center gap-2 text-sm font-semibold gl-num" aria-label={`Student rating: ${rating} out of 5`}><Stars value={rating} />{rating} / 5</span>}
      </div>
      <h3 className="gl-h3">{title}</h3>
      {item.description && <ExpandableText lines={3} className="gl-muted text-base leading-7" buttonClassName="gl-more" preserveWhitespace>{item.description}</ExpandableText>}
      {item.studentReview && <blockquote className="gl-quote m-0"><Icon name="quote" className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--gl-accent)]" /><ExpandableText lines={3} className="min-w-0 text-base italic leading-7" buttonClassName="gl-more">{item.studentReview}</ExpandableText></blockquote>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {item.studentName && <div className="flex items-center gap-3"><SmallAvatar src={studentSrc} name={studentName} /><div><p className="m-0 font-semibold">{studentName}</p><p className="gl-faint m-0 text-sm">Student</p></div></div>}
          {tags.map((tag, i) => <Pill key={i}>{tag}</Pill>)}
        </div>
        {previewTo && <Link to={`${previewTo}#${achievementId}`} aria-label={`View achievement: ${title}`} className="gl-link">View achievement<Icon name="chevR" className="h-4 w-4" /></Link>}
      </div>
    </div>
  </Glass>;
}

/* ---------------------------------------------------------------- batches */
function BatchCard({ batch }) {
  const src = fd(batch, BATCH_IMAGE_KEYS);
  const [failed, setFailed] = useState("");
  const showImage = Boolean(src && failed !== src);
  const title = fd(batch, ["title", "batchName"], "Learning group");
  const state = batchState(batch);
  const type = fd(batch, ["batchType", "type", "session"], "");
  const classes = fd(batch, ["eligibleClasses", "eligible_classes"]);
  const fee = fd(batch, ["fee"]);
  const seatsLeft = batch.maximumSeats != null ? Math.max(0, Number(batch.maximumSeats) - Number(batch.allottedSeats || 0)) : null;
  const schedule = `${dateLabel(fd(batch, ["startOn"])) || "Ask the tutor"}${batch.endOn ? ` to ${dateLabel(batch.endOn)}` : ""}`;
  const facts = [
    classes && ["grad", "For classes", classes],
    fee && ["rupee", "Fee", `₹${fee}${fd(batch, ["paymentType"]) ? ` / ${batch.paymentType}` : ""}`],
    ["calendar", "Schedule", schedule],
    seatsLeft !== null && ["users", "Places left", String(seatsLeft)],
  ].filter(Boolean);
  return <Glass as="article" className="flex flex-col overflow-hidden rounded-[1.75rem] p-3 sm:p-4">
    <div className="gl-media h-48 rounded-[1.3rem] sm:h-56">
      {showImage ? <img src={src} alt={title} loading="lazy" onError={() => setFailed(src)} className="absolute inset-0 h-full w-full object-cover" /> : <Icon name="book" className="h-12 w-12" />}
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-2 pt-5 [overflow-wrap:anywhere] sm:p-3 sm:pt-5">
      <div className="flex flex-wrap gap-2"><Pill accent>{state}</Pill>{type && type !== state && <Pill>{type}</Pill>}</div>
      <h3 className="gl-h3">{title}</h3>
      {batch.description && <ExpandableText lines={3} className="gl-muted text-base leading-7" buttonClassName="gl-more" preserveWhitespace>{batch.description}</ExpandableText>}
      <dl className="m-0 mt-auto grid grid-cols-2 gap-x-4 gap-y-4 pt-3">
        {facts.map(([icon, label, value]) => <div key={label} className="flex min-w-0 items-start gap-2.5"><span className="gl-fact-icon"><Icon name={icon} className="h-4 w-4" /></span><div className="min-w-0"><dt className="gl-faint text-xs">{label}</dt><dd className="m-0 text-sm font-semibold">{value}</dd></div></div>)}
      </dl>
    </div>
  </Glass>;
}

/* ---------------------------------------------------------------- gallery */
function GalleryTile({ image, index, to }) {
  const [failed, setFailed] = useState(false);
  const src = fd(image, IMAGE_KEYS);
  return <Link to={to} aria-label="Open gallery" className="gl-tile gl-glass group relative block aspect-[4/3] overflow-hidden rounded-[1.6rem] sm:aspect-auto">
    {failed
      ? <span className="gl-media absolute inset-0"><Icon name="image" className="h-10 w-10" /><span className="sr-only">Photo unavailable</span></span>
      : <img src={src} alt={fd(image, ["title", "originalFilename"], `Tuition gallery image ${index + 1}`)} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />}
  </Link>;
}

function GlassGallery({ gallery }) {
  const items = gallery.filter((image) => fd(image, IMAGE_KEYS));
  const [failed, setFailed] = useState({});
  const [active, setActive] = useState(null);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const visible = items.map((image, index) => ({ image, index })).filter(({ index }) => !failed[index]);

  const step = (dir) => setActive((current) => {
    if (current === null || !visible.length) return current;
    const pos = visible.findIndex((v) => v.index === current);
    return visible[(pos + dir + visible.length) % visible.length].index;
  });

  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setActive(null);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active === null]);

  if (!items.length) return <EmptyNote>Gallery photos will appear here when the tutor adds them.</EmptyNote>;
  const current = active !== null ? items[active] : null;
  return <>
    <div className="columns-2 gap-3 sm:gap-4 lg:columns-3">
      {items.map((image, index) => failed[index] ? null : <button key={image.fileId ?? image.id ?? index} type="button" onClick={(e) => { lastFocus.current = e.currentTarget; setActive(index); }} aria-label={`Open photo ${index + 1}`} className="gl-shot gl-glass mb-3 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-[1.4rem] p-0 sm:mb-4">
        <img src={fd(image, IMAGE_KEYS)} alt={fd(image, ["title", "originalFilename"], `Tuition gallery image ${index + 1}`)} loading="lazy" onError={() => setFailed((f) => ({ ...f, [index]: true }))} className="block h-auto w-full" />
      </button>)}
    </div>
    {current && <div className="gl-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setActive(null)}>
      <button ref={closeRef} type="button" onClick={() => setActive(null)} aria-label="Close photo" className="gl-icon-btn absolute right-4 top-4"><Icon name="close" /></button>
      {visible.length > 1 && <>
        <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo" className="gl-icon-btn absolute left-3 top-1/2 -translate-y-1/2 sm:left-6"><Icon name="chevL" /></button>
        <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo" className="gl-icon-btn absolute right-3 top-1/2 -translate-y-1/2 sm:right-6"><Icon name="chevR" /></button>
      </>}
      <img src={fd(current, IMAGE_KEYS)} alt={fd(current, ["title", "originalFilename"], "Tuition gallery photo")} onClick={(e) => e.stopPropagation()} />
    </div>}
  </>;
}

/* ------------------------------------------------------------------ social */
function SocialSection({ links }) {
  if (!links.length) return null;
  return <section aria-labelledby="gl-social-heading">
    <h2 id="gl-social-heading" className="gl-h2 mb-6">Stay connected.</h2>
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {links.map(([key, url]) => {
        const k = key.toLowerCase();
        return <Glass as="a" shine key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-4 rounded-[1.5rem] p-4 no-underline sm:p-5" style={{ color: "inherit" }}>
          <span className="gl-chip-icon h-12 w-12 rounded-2xl"><Icon name={SOCIAL_ICON[k] || "globe"} className="h-6 w-6" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold capitalize">{SOCIAL_NAME[k] || key}</span><span className="gl-faint block truncate text-sm">{hostOf(url)}</span></span>
          <Icon name="external" className="h-5 w-5 shrink-0 gl-faint" /><span className="sr-only">Opens in a new tab</span>
        </Glass>;
      })}
    </div>
  </section>;
}

/* -------------------------------------------------------------------- home */
function HomePage({ socialLinks, name, profile, tuition, subjects, batches, achievements, gallery, location, onContactClick, basePath }) {
  const firstName = fd(profile, ["firstName", "first_name"], name);
  const intro = fd(profile, ["about", "description"], "Personal guidance and focused classes to help learners build confidence and make steady progress.");
  const experience = fd(profile, ["teachingYOE", "teaching_yoe"]);
  const qualification = fd(profile, ["qualification"]);
  const previewImages = gallery.filter((image) => fd(image, IMAGE_KEYS)).slice(0, 3);
  const stats = [
    [subjects.length, "Subjects"],
    [experience, "Years teaching"],
    [batches.length, "Batches"],
    [achievements.length, "Student stories"],
  ].filter(([value]) => value);
  const galleryGrid = previewImages.length === 3 ? "sm:h-[30rem] sm:grid-cols-3 sm:grid-rows-2" : previewImages.length === 2 ? "sm:h-80 sm:grid-cols-2" : "sm:h-80";

  return <div className="space-y-14 sm:space-y-20">
    <Glass shine className="gl-hero overflow-hidden rounded-[2rem] p-5 sm:p-8 lg:rounded-[2.75rem] lg:p-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
        <div className="min-w-0">
          <h1 className="gl-h1 [overflow-wrap:anywhere]">Learn with {name}.</h1>
          <ExpandableText lines={4} className="gl-muted mt-5 max-w-xl text-base leading-7 sm:text-lg sm:leading-8" buttonClassName="gl-more">{intro}</ExpandableText>
          {(qualification || location) && <div className="mt-5 flex flex-wrap gap-2">{qualification && <Pill icon="grad">{qualification}</Pill>}{location && <Pill icon="pin">{location}</Pill>}</div>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`${basePath}/batches`} className="gl-btn gl-btn-solid">Explore batches<Icon name="arrow" className="h-4 w-4" /></Link>
            <button type="button" onClick={onContactClick} className="gl-btn gl-btn-glass"><Icon name="message" className="h-4 w-4" />Message {firstName}</button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <div className="gl-portrait relative">
            <Avatar src={fd(profile, ["profilePicture", "profile_picture", "profilePhoto", "avatar"])} name={name} />
            {experience && <div className="absolute bottom-4 left-4"><Glass className="flex items-center gap-3 rounded-full py-2 pl-2 pr-5"><span className="gl-chip-icon"><Icon name="award" className="h-5 w-5" /></span><span><span className="block text-sm font-semibold leading-tight">{experience} years</span><span className="gl-muted block text-xs leading-tight">of teaching</span></span></Glass></div>}
            {subjects.length > 0 && <div className="absolute right-4 top-4"><Glass className="flex items-center gap-3 rounded-full py-2 pl-2 pr-5"><span className="gl-chip-icon"><Icon name="book" className="h-5 w-5" /></span><span><span className="block text-sm font-semibold leading-tight">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</span><span className="gl-muted block text-xs leading-tight">on offer</span></span></Glass></div>}
          </div>
        </div>
      </div>
    </Glass>

    {stats.length > 0 && <Glass aria-label="Teaching at a glance" className="-mt-6 rounded-[1.75rem] py-6 sm:-mt-10 sm:py-8">
      <div className="gl-stats" style={{ "--n": stats.length }}>
        {stats.map(([value, label]) => <div key={label} className="gl-stat"><p className="gl-stat-value m-0">{value}</p><p className="gl-muted m-0 mt-2 text-sm">{label}</p></div>)}
      </div>
    </Glass>}

    <section aria-labelledby="gl-home-achievements">
      <SectionHead title="Achievements" description="Small steps. Remarkable progress." to={`${basePath}/achievements`} />
      <h2 id="gl-home-achievements" className="sr-only">Achievements</h2>
      {achievements.length ? <div className="grid gap-5 sm:gap-6">{achievements.slice(0, 2).map((item, index) => <AchievementCard key={item.achievementId ?? item.id ?? index} item={item} previewTo={`${basePath}/achievements`} flip={index % 2 === 1} />)}</div> : <EmptyNote>Published achievements and student reviews will appear here.</EmptyNote>}
    </section>

    <section>
      <SectionHead title="Batches" description="Find a batch that fits your learning goals." to={`${basePath}/batches`} />
      {batches.length ? <div className="grid gap-5 sm:gap-6 md:grid-cols-2">{batches.slice(0, 2).map((batch, index) => <BatchCard key={batch.batchId ?? batch.id ?? index} batch={batch} />)}</div> : <EmptyNote>Published batches will appear here when available.</EmptyNote>}
    </section>

    <section>
      <SectionHead title="Gallery" description="A look inside the classroom." to={`${basePath}/gallery`} />
      {previewImages.length ? <div className={`grid gap-3 sm:gap-4 ${galleryGrid}`}>{previewImages.map((image, index) => <div key={image.fileId ?? image.id ?? index} className={`contents`}><GalleryTile image={image} index={index} to={`${basePath}/gallery`} /></div>)}</div> : <EmptyNote>Gallery photos will appear here when the tutor adds them.</EmptyNote>}
    </section>

    <SocialSection links={socialLinks} />

    <Glass shine className="rounded-[2rem] p-6 text-center sm:p-12 lg:rounded-[2.75rem]">
      <h2 className="gl-h2 mx-auto max-w-2xl">Ready to find the right batch?</h2>
      <p className="gl-muted mx-auto mt-3 max-w-md text-base leading-7">Browse what is running now, or send a message and ask about a schedule that suits you.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to={`${basePath}/batches`} className="gl-btn gl-btn-solid">Browse batches<Icon name="arrow" className="h-4 w-4" /></Link>
        <button type="button" onClick={onContactClick} className="gl-btn gl-btn-glass"><Icon name="message" className="h-4 w-4" />Send a message</button>
      </div>
    </Glass>
  </div>;
}

/* ------------------------------------------------------------------- about */
function AboutPage({ name, profile, tuition, socialLinks, faqs, onContactClick, onCopyLink, copyMessage }) {
  const about = fd(profile, ["about", "description"]);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const email = fd(profile, ["email"]);
  const phone = fd(profile, ["mobileNo", "mobile_no"]);
  const whatsapp = fd(profile, ["whatsappNo", "whatsapp_no"]);
  const details = [["grad", "Qualification", fd(profile, ["qualification"])], ["clock", "Years teaching", fd(profile, ["teachingYOE", "teaching_yoe"])], ["book", "Tuition", fd(tuition, ["tuitionName", "tuitionClassName"])], ["calendar", "Established", fd(tuition, ["establishedYear"])], ["globe", "Languages", fd(tuition, ["languages"])], ["pin", "Location", location]].filter(([, , value]) => value);
  return <>
    <PageHeading title="Teaching built around each learner." description="Learn about the tutor, their background, and the learning environment." />
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Glass as="article" className="rounded-[1.75rem] p-6 sm:p-9"><h2 className="gl-h3">A little about {fd(profile, ["firstName", "first_name"], "the tutor")}</h2><ExpandableText lines={6} className="gl-muted mt-4 text-base leading-8" buttonClassName="gl-more" preserveWhitespace>{about || "The tutor has not added an introduction yet."}</ExpandableText></Glass>
      <Glass as="dl" className="m-0 grid content-start gap-2 rounded-[1.75rem] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-1">
        {details.map(([icon, label, value]) => <div key={label} className="gl-row"><span className="gl-fact-icon"><Icon name={icon} className="h-4 w-4" /></span><div className="min-w-0"><dt className="gl-faint text-xs">{label}</dt><dd className="m-0 text-sm font-semibold [overflow-wrap:anywhere]">{value}{label === "Years teaching" ? " years" : ""}</dd></div></div>)}
      </Glass>
    </div>

    <section className="mx-auto mt-16 max-w-3xl sm:mt-20">
      <h2 className="gl-h2 mb-6 text-center">Common questions.</h2>
      {faqs.length
        ? <Glass className="divide-y rounded-[1.75rem] px-5 sm:px-7" style={{ "--tw-divide-opacity": 1 }}>
          {faqs.map((faq, i) => <details key={faq.faqId ?? faq.id ?? i} className="gl-faq py-5" style={i ? { borderTop: "1px solid var(--gl-line)" } : undefined}>
            <summary className="flex items-start justify-between gap-4 text-base font-semibold"><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{fd(faq, ["title", "question"], "Question")}</span><Icon name="chevD" className="gl-chev mt-0.5 h-5 w-5 shrink-0 text-[color:var(--gl-accent)]" /></summary>
            <ExpandableText lines={4} className="gl-muted mt-3 pr-8 text-sm leading-7" buttonClassName="gl-more" preserveWhitespace>{fd(faq, ["description", "answer"])}</ExpandableText>
          </details>)}
        </Glass>
        : <p className="gl-muted text-center text-sm">Questions and answers will appear here when shared by the tutor.</p>}
    </section>

    <Glass as="section" id="about-contact" className="mt-14 grid scroll-mt-28 gap-6 rounded-[2rem] p-6 sm:mt-20 sm:p-10 lg:grid-cols-[1fr_.9fr]">
      <div className="min-w-0">
        <h2 className="gl-h2">Connect with {name}.</h2>
        <p className="gl-muted mt-3 max-w-md text-base leading-7">Send an enquiry through the TutorFolio messenger or use the contact details shared by the tutor.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onContactClick} className="gl-btn gl-btn-solid"><Icon name="message" className="h-4 w-4" />Open messenger</button>
          {onCopyLink && <button type="button" onClick={onCopyLink} className="gl-btn gl-btn-glass"><Icon name="link" className="h-4 w-4" />{copyMessage || "Copy website link"}</button>}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        {email && <a className="gl-row text-sm" href={`mailto:${email}`}><span className="gl-fact-icon"><Icon name="mail" className="h-4 w-4" /></span><span className="min-w-0 [overflow-wrap:anywhere]">{email}</span></a>}
        {phone && <a className="gl-row text-sm" href={`tel:${phone}`}><span className="gl-fact-icon"><Icon name="phone" className="h-4 w-4" /></span>{phone}</a>}
        {whatsapp && <a className="gl-row text-sm" href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><span className="gl-fact-icon"><Icon name="whatsapp" className="h-4 w-4" /></span>WhatsApp</a>}
        {location && <p className="gl-row m-0 text-sm"><span className="gl-fact-icon"><Icon name="pin" className="h-4 w-4" /></span>{location}</p>}
        {socialLinks.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="gl-row text-sm"><span className="gl-fact-icon"><Icon name={SOCIAL_ICON[label.toLowerCase()] || "globe"} className="h-4 w-4" /></span><span className="min-w-0"><span className="block font-semibold capitalize">{SOCIAL_NAME[label.toLowerCase()] || label}</span><span className="gl-faint block truncate text-xs">{hostOf(url)}</span></span></a>)}
      </div>
    </Glass>
  </>;
}

/* ----------------------------------------------------------------- classes */
function ClassesPage({ tuition, subjects, services }) {
  const tuitionName = fd(tuition, ["tuitionName", "tuitionClassName"], "this tutor");
  const eligibleClasses = fd(tuition, ["eligibleClasses", "eligible_classes"]);
  return <>
    <PageHeading title="Subjects and learning options." description="Explore the subjects, class levels, and teaching formats shared by the tutor." />
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
      <Glass as="section" className="rounded-[1.75rem] p-6 sm:p-9">
        <div className="flex items-center gap-3"><span className="gl-fact-icon"><Icon name="book" className="h-4 w-4" /></span><h2 className="gl-h3">Subjects</h2></div>
        {subjects.length ? <div className="mt-5 flex flex-wrap gap-2.5">{subjects.map((subject, i) => <Pill key={`${subject}-${i}`} accent>{subject}</Pill>)}</div> : <p className="gl-muted mt-4 text-sm">Subject information will be added here.</p>}
        <h3 className="gl-h3 mt-8 text-lg">Classes for</h3>
        <p className="gl-muted m-0 mt-3 text-base leading-7">{eligibleClasses || "Contact the tutor to discuss suitable class levels."}</p>
      </Glass>
      <Glass as="section" className="rounded-[1.75rem] p-6 sm:p-9">
        <div className="flex items-center gap-3"><span className="gl-fact-icon"><Icon name="message" className="h-4 w-4" /></span><h2 className="gl-h3">Learning format</h2></div>
        {services.length ? <div className="mt-5 flex flex-wrap gap-2.5">{services.map((service, i) => <Pill key={`${service}-${i}`}>{service}</Pill>)}</div> : <p className="gl-muted mt-4 text-sm">Contact the tutor to discuss class formats.</p>}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="gl-row"><span className="gl-fact-icon"><Icon name="globe" className="h-4 w-4" /></span><div className="min-w-0"><p className="gl-faint m-0 text-xs">Languages</p><p className="m-0 text-sm font-semibold">{fd(tuition, ["languages"], "Ask the tutor")}</p></div></div>
          <div className="gl-row"><span className="gl-fact-icon"><Icon name="grad" className="h-4 w-4" /></span><div className="min-w-0"><p className="gl-faint m-0 text-xs">Tuition centre</p><p className="m-0 text-sm font-semibold [overflow-wrap:anywhere]">{tuitionName === "this tutor" ? "Independent tutor" : tuitionName}</p></div></div>
        </div>
      </Glass>
    </div>
    {(subjects.length > 0 || eligibleClasses) && <Glass className="mt-6 rounded-[1.75rem] p-6 sm:p-8">
      <p className="m-0 text-lg font-semibold tracking-tight sm:text-xl">{subjects.length ? `Explore ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}${eligibleClasses ? ` for ${eligibleClasses}` : ""} with ${tuitionName}.` : `Explore the subjects and class formats available at ${tuitionName}.`}</p>
    </Glass>}
  </>;
}

/* ----------------------------------------------------------------- batches */
function BatchesPage({ batches }) {
  const sorted = [...batches].sort((a, b) => new Date(a.startOn || 0) - new Date(b.startOn || 0));
  const groups = [
    ["Current batches", sorted.filter((b) => batchState(b) === "Current")],
    ["Upcoming batches", sorted.filter((b) => batchState(b) === "Upcoming")],
    ["Previous batches", sorted.filter((b) => batchState(b) === "Previous").reverse()],
  ].filter(([, items]) => items.length);
  return <>
    <PageHeading title="Choose where to start." description="Current, upcoming, and previous batches published by the tutor." />
    {groups.length
      ? <div className="space-y-12">{groups.map(([title, items]) => <section key={title}><h2 className="gl-h3 mb-5">{title}</h2><div className="grid gap-5 sm:gap-6 md:grid-cols-2">{items.map((batch, i) => <BatchCard key={batch.batchId ?? batch.id ?? `${title}-${i}`} batch={batch} />)}</div></section>)}</div>
      : <EmptyNote>There are no public batches at the moment. Contact the tutor to discuss a schedule.</EmptyNote>}
  </>;
}

/* --------------------------------------------------------- other pages */
function GalleryPage({ gallery }) {
  return <><PageHeading title="A look inside the learning space." description="Photos shared by the tutor from classes and the tuition centre." /><GlassGallery gallery={gallery} /></>;
}

function AchievementsPage({ achievements, basePath }) {
  return <>
    <PageHeading title="Progress worth celebrating." description="Student achievements and feedback published by the tutor." />
    {achievements.length ? <div className="grid gap-5 sm:gap-6">{achievements.map((item, index) => <AchievementCard key={item.achievementId ?? item.id ?? index} item={item} flip={index % 2 === 1} />)}</div> : <EmptyNote>Published achievements and student reviews will appear here.</EmptyNote>}
  </>;
}

function ExperiencePage({ experience }) {
  return <>
    <PageHeading title="A teaching journey grounded in practice." description="Professional experience shared by the tutor." />
    {experience.length
      ? <div className="gl-timeline space-y-4 sm:space-y-5">{experience.map((item, i) => <div key={item.experienceId ?? item.id ?? i} className="relative">
        <span className="gl-dot" aria-hidden="true" />
        <Glass as="article" className="rounded-[1.5rem] p-5 sm:p-7">
          <Pill accent icon="calendar">{dateLabel(item.startDate)}{item.isCurrent ? " to Present" : item.endDate ? ` to ${dateLabel(item.endDate)}` : ""}</Pill>
          <h2 className="gl-h3 mt-3 [overflow-wrap:anywhere]">{fd(item, ["title"], "Teaching experience")}</h2>
          {item.description && <ExpandableText lines={3} className="gl-muted mt-2 max-w-3xl text-base leading-7" buttonClassName="gl-more" preserveWhitespace>{item.description}</ExpandableText>}
        </Glass>
      </div>)}</div>
      : <EmptyNote>Professional experience will appear here when published.</EmptyNote>}
  </>;
}

/* -------------------------------------------------------------------- root */
export default function ThemeGlass({ profile = {}, tuition = {}, achievements = [], batches = [], experience = [], faqs = [], gallery = [], username = "", previewBasePath, currentPage = "home", onContactClick, onCopyLink, copyMessage = "" }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem("tutorfolio:glass-mode");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => { try { localStorage.setItem("tutorfolio:glass-mode", mode); } catch {} }, [mode]);

  // keep the page-level data-theme in sync (same behaviour as the Classic theme) and restore it on leave
  const previousDocumentTheme = useRef(null);
  useEffect(() => {
    const root = document.documentElement;
    previousDocumentTheme.current = root.getAttribute("data-theme");
    return () => {
      if (previousDocumentTheme.current == null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previousDocumentTheme.current);
    };
  }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", mode); }, [mode]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [currentPage]);

  const name = [fd(profile, ["firstName", "first_name"]), fd(profile, ["lastName", "last_name"])].filter(Boolean).join(" ") || fd(profile, ["username"], "Tutor");
  const brand = fd(tuition, ["tuitionName", "tuitionClassName"], name);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const subjects = list(fd(tuition, ["teachingSubjects", "teaching_subjects"]));
  const services = list(fd(tuition, ["services"]));
  const social = fd(profile, ["socialMedia"], {});
  const socialLinks = useMemo(() => Object.entries(social || {}).filter(([, value]) => typeof value === "string" && value.trim()).map(([label, value]) => [label, asUrl(value.trim())]).filter(([, url]) => { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("."); } catch { return false; } }), [social]);
  const basePath = previewBasePath || getTutorNavigationBase(username);
  const toggleMode = () => setMode((current) => (current === "dark" ? "light" : "dark"));

  let content;
  if (currentPage === "about") content = <AboutPage name={name} profile={profile} tuition={tuition} socialLinks={socialLinks} faqs={faqs} onContactClick={onContactClick} onCopyLink={onCopyLink} copyMessage={copyMessage} />;
  else if (currentPage === "classes") content = <ClassesPage tuition={tuition} subjects={subjects} services={services} />;
  else if (currentPage === "batches") content = <BatchesPage batches={batches} />;
  else if (currentPage === "gallery") content = <GalleryPage gallery={gallery} />;
  else if (currentPage === "achievements") content = <AchievementsPage achievements={achievements} basePath={basePath} />;
  else if (currentPage === "experience") content = <ExperiencePage experience={experience} />;
  else content = <HomePage socialLinks={socialLinks} name={name} profile={profile} tuition={tuition} subjects={subjects} batches={batches} achievements={achievements} gallery={gallery} location={location} onContactClick={onContactClick} basePath={basePath} />;

  return <div data-theme={mode} data-glass={mode} className="gl-root">
    <div className="gl-backdrop" aria-hidden="true"><span className="gl-orb gl-orb-a" /><span className="gl-orb gl-orb-b" /><span className="gl-orb gl-orb-c" /><span className="gl-grain" /></div>
    <GlassHeader basePath={basePath} currentPage={currentPage} brand={brand} tuition={tuition} mode={mode} onToggleMode={toggleMode} onContactClick={onContactClick} />
    <main className="mx-auto min-h-[70vh] max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:pt-14">{content}</main>
    <FloatingContact profile={profile} />
    <footer className="px-3 pb-4 sm:px-5 sm:pb-6">
      <Glass className="mx-auto max-w-6xl rounded-[2rem] p-6 sm:p-9">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr]">
          <div className="min-w-0">
            <Link to={basePath} className="inline-flex items-center gap-3 no-underline" style={{ color: "inherit" }}><TuitionLogo tuition={tuition} name={brand} /><span className="text-lg font-bold tracking-tight [overflow-wrap:anywhere]">{brand}</span></Link>
            {location && <p className="gl-muted m-0 mt-3 flex items-center gap-2 text-sm"><Icon name="pin" className="h-4 w-4 shrink-0" />{location}</p>}
          </div>
          <nav aria-label="Footer pages"><h2 className="m-0 text-sm font-semibold">Explore</h2><ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0">{pageLinks.filter((page) => page.id !== "home").map((page) => <li key={page.id}><Link to={hrefFor(basePath, page.id)} className="gl-footer-link">{page.label}</Link></li>)}</ul></nav>
          <div className="min-w-0"><h2 className="m-0 text-sm font-semibold">Contact</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {fd(profile, ["email"]) && <a className="gl-footer-link flex items-center gap-2 [overflow-wrap:anywhere]" href={`mailto:${profile.email}`}><Icon name="mail" className="h-4 w-4 shrink-0" />{profile.email}</a>}
              {fd(profile, ["mobileNo", "mobile_no"]) && <a className="gl-footer-link flex items-center gap-2" href={`tel:${fd(profile, ["mobileNo", "mobile_no"])}`}><Icon name="phone" className="h-4 w-4 shrink-0" />{fd(profile, ["mobileNo", "mobile_no"])}</a>}
              <button type="button" onClick={onContactClick} className="gl-link self-start px-0">Message the tutor<Icon name="chevR" className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
        <p className="gl-faint m-0 mt-8 border-t pt-5 text-xs" style={{ borderColor: "var(--gl-line)" }}>© {new Date().getFullYear()} {name}. All rights reserved.</p>
      </Glass>
    </footer>
  </div>;
}