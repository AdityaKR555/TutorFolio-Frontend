import React, { useEffect, useMemo, useRef, useState } from "react";
import "./classic-visuals.css";
import ClassicGallery from "./ClassicGallery";
import ExpandableText from "../ExpandableText";
import { Link } from "react-router-dom";

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
const pageLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "classes", label: "Classes" },
  { id: "batches", label: "Batches" },
  { id: "gallery", label: "Gallery" },
  { id: "achievements", label: "Achievements" },
  { id: "experience", label: "Experience" },
];

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.7 9.7a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/><path d="M8 11h8m-8 4h5"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function AdaptiveNav({ basePath, currentPage }) {
  const navRef = useRef(null);
  const measureRef = useRef(null);
  const menuRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(pageLinks.length);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const measure = () => {
      const available = nav.clientWidth;
      const items = measureRef.current?.children;
      if (!available || !items?.length) return;
      const gap = Number.parseFloat(getComputedStyle(nav).columnGap) || 4;
      const widths = Array.from(items, (item) => item.getBoundingClientRect().width);
      const total = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
      if (total <= available) {
        setVisibleCount(pageLinks.length);
        return;
      }
      let used = 0;
      let count = 0;
      const roomForLinks = Math.max(0, available - 40 - gap);
      for (const width of widths) {
        const next = used + (count ? gap : 0) + width;
        if (next > roomForLinks) break;
        used = next;
        count += 1;
      }
      setVisibleCount(count);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [currentPage]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOutside = (event) => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [menuOpen]);

  const navClass = (page) => `shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition sm:px-3.5 sm:text-sm ${currentPage === page.id ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"}`;
  const visiblePages = pageLinks.slice(0, visibleCount);
  const overflowPages = pageLinks.slice(visibleCount);
  return <div className="relative order-3 w-full min-w-0 pb-2 lg:order-none lg:w-auto lg:flex-1 lg:pb-0">
    <nav ref={navRef} aria-label="Tutor website pages" className="flex min-w-0 items-center justify-center gap-1 overflow-visible">
      {visiblePages.map((page) => <Link key={page.id} to={page.id === "home" ? basePath : `${basePath}/${page.id}`} aria-current={currentPage === page.id ? "page" : undefined} className={navClass(page)}>{page.label}</Link>)}
      {overflowPages.length > 0 && <div className="relative shrink-0" ref={menuRef}>
        <button type="button" aria-label="More pages" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Icon name="more"/></button>
        {menuOpen && <div role="menu" aria-label="More pages" className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">{overflowPages.map((page) => <Link key={page.id} role="menuitem" to={page.id === "home" ? basePath : `${basePath}/${page.id}`} onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-sm ${currentPage === page.id ? "bg-sky-100 font-semibold text-sky-900 dark:bg-sky-950 dark:text-sky-100" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"}`}>{page.label}</Link>)}</div>}
      </div>}
    </nav>
    <div ref={measureRef} aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 -z-10 flex w-max gap-1 whitespace-nowrap opacity-0">{pageLinks.map((page) => <span key={page.id} className={navClass("")}>{page.label}</span>)}</div>
  </div>;
}

function Avatar({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt={name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
  return <div aria-label={name} className={`flex items-center justify-center bg-sky-100 font-semibold text-sky-800 dark:bg-sky-900 dark:text-sky-200 ${className}`}>{name?.trim()?.[0]?.toUpperCase() || "T"}</div>;
}

function TuitionLogo({ tuition, name, className = "h-9 w-9" }) {
  const src = fd(tuition, ["logo", "logoUrl", "logo_url", "tuitionLogo", "tuition_logo"]);
  const [failedSrc, setFailedSrc] = useState("");
  if (src && failedSrc !== src) {
    return <img src={src} alt={`${name || "Tuition"} logo`} onError={() => setFailedSrc(src)} className={`${className} shrink-0 rounded-lg border border-sky-100 bg-white object-contain p-0.5 dark:border-slate-700 dark:bg-slate-900`} />;
  }
  return <span aria-hidden="true" className={`flex ${className} shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100`}><Icon name="book" className="h-5 w-5" /></span>;
}

function PageHeading({ title, description }) {
  return <div className="mb-10 max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>{description && <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>}</div>;
}

function Chip({ children }) {
  return <span className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-sm font-medium text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">{children}</span>;
}

function BatchImage({ batch, className }) {
  const src = fd(batch, ["imageUrl", "image_url", "batchImageUrl", "batchImage"]);
  const [failed, setFailed] = useState("");
  return <img src={src && failed !== src ? src : "/illustrations/online-learning-amico.png"} alt={src && failed !== src ? fd(batch, ["title", "batchName"], "Batch") : ""} loading="lazy" onError={() => setFailed(src)} className={`bg-sky-50 object-contain dark:bg-slate-800 ${className}`}/>;
}

function BatchCard({ batch }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    {fd(batch, ["imageUrl", "image_url", "batchImageUrl", "batchImage"]) && <BatchImage batch={batch} className="mb-5 h-52 w-full rounded-xl"/>}
    <div className="flex items-start justify-between gap-4"><div><h2 className="[overflow-wrap:anywhere] text-lg font-semibold text-slate-950 dark:text-white">{fd(batch, ["title", "batchName"], "Learning group")}</h2><p className="mt-1 text-sm text-sky-700 dark:text-sky-300">{fd(batch, ["batchType", "type", "session"], "Class")}</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{fd(batch, ["session"], "Classes")}</span></div>
    {fd(batch, ["description"]) && <ExpandableText lines={3} className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300" preserveWhitespace>{fd(batch, ["description"])}</ExpandableText>}
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">{fd(batch, ["eligibleClasses", "eligible_classes"]) && <div><dt className="text-xs text-slate-500 dark:text-slate-400">For classes</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{fd(batch, ["eligibleClasses", "eligible_classes"])}</dd></div>}{fd(batch, ["fee"]) && <div><dt className="text-xs text-slate-500 dark:text-slate-400">Fee</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">₹{fd(batch, ["fee"])}{fd(batch, ["paymentType"]) ? ` / ${batch.paymentType}` : ""}</dd></div>}<div><dt className="text-xs text-slate-500 dark:text-slate-400">Schedule</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{dateLabel(fd(batch, ["startOn"])) || "Ask the tutor"}{fd(batch, ["endOn"]) ? ` to ${dateLabel(batch.endOn)}` : ""}</dd></div>{batch.maximumSeats != null && <div><dt className="text-xs text-slate-500 dark:text-slate-400">Places available</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{Math.max(0, Number(batch.maximumSeats) - Number(batch.allottedSeats || 0))}</dd></div>}</dl>
  </article>;
}

function HomeSectionHeading({ title, to, label = "More" }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">{title}</h2></div><Link to={to} aria-label={`${label}: ${title}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-sky-600 dark:text-sky-300 dark:hover:bg-sky-900">{label}<Icon name="arrow" className="h-5 w-5"/></Link></div>;
}

function GalleryPreviewImage({ image, index }) {
  const [failed, setFailed] = useState(false);
  return <figure className="group h-full min-h-0 overflow-hidden rounded-2xl border border-sky-100 bg-white dark:border-slate-700 dark:bg-slate-900">
    <div className="h-full min-h-64 overflow-hidden bg-sky-50 dark:bg-slate-800">
      {failed ? <div className="flex h-full flex-col items-center justify-center gap-3 text-sky-700 dark:text-sky-300"><Icon name="book" className="h-10 w-10"/><span className="sr-only">Photo unavailable</span></div> : <img src={fd(image, ["fileUrl", "url", "imageUrl", "src"])} alt={fd(image, ["title", "originalFilename"], `Tuition gallery image ${index + 1}`)} onError={() => setFailed(true)} loading="lazy" className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105"/>}
    </div>
  </figure>;
}

function ClassicAchievementCard({ item, imageRight = false, previewTo = "" }) {
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
  if (previewTo) return <article className="grid items-stretch gap-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_-8px_rgb(15_23_42_/_16%)] dark:border-slate-700 dark:bg-slate-900 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-8">
    <div className="relative min-w-0 self-stretch">
      <div className="flex h-full min-h-56 items-center justify-center overflow-hidden rounded-[1.2rem] bg-sky-50 dark:bg-sky-950/50">
        {hasAchievement ? <img src={achievementSrc} alt={title} onError={() => setFailedAchievement(achievementSrc)} loading="lazy" className="h-full max-h-[440px] min-h-56 w-full object-cover"/> : hasStudent ? <img src={studentSrc} alt={studentName} onError={() => setFailedStudent(studentSrc)} loading="lazy" className="h-full max-h-[440px] min-h-56 w-full object-cover"/> : <KpiIllustration type="trophy"/>}
      </div>
      {item.studentReview && <span aria-hidden="true" className="absolute -bottom-3 right-5 grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-teal-100 text-teal-700 shadow-sm dark:border-slate-900 dark:bg-teal-950 dark:text-teal-300"><svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 3h10v5c0 5-2 7-5 7s-5-2-5-7V3ZM7 5H3v3c0 3 2 5 5 5m9-8h4v3c0 3-2 5-5 5m-4 2v5m-4 1h8"/></svg></span>}
    </div>
    <div className="flex min-w-0 flex-col py-1 [overflow-wrap:anywhere]">
      <span className={`self-start rounded-full border px-4 py-1.5 text-sm font-medium ${item.studentReview ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200" : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>{item.studentReview ? "Student success" : "Academic milestone"}</span>
      <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h3>
      {item.description && <ExpandableText lines={2} className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300" preserveWhitespace>{item.description}</ExpandableText>}
      {rating > 0 && <p className="mt-3 text-sm font-medium text-sky-700 dark:text-sky-300" aria-label={`Student rating: ${rating} out of 5`}>{rating} / 5 <span aria-hidden="true" className="ml-2 tracking-widest">{Array.from({length: 5}, (_, i) => <span key={i} className={i < Math.round(rating) ? "" : "text-slate-300 dark:text-slate-600"}>★</span>)}</span></p>}
      {item.studentReview && <blockquote className="mt-5 flex gap-4 rounded-2xl bg-sky-50 px-5 py-4 dark:bg-sky-950/60"><span aria-hidden="true" className="font-serif text-5xl font-bold leading-none text-sky-600">“</span><ExpandableText lines={2} className="min-w-0 text-lg italic leading-8 text-slate-900 dark:text-sky-100">{item.studentReview}</ExpandableText></blockquote>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-5">
        <div className="min-w-0">{item.studentName && <div className="flex items-center gap-3">{hasStudent && <img src={studentSrc} alt="" onError={() => setFailedStudent(studentSrc)} loading="lazy" className="h-14 w-14 shrink-0 rounded-full object-cover"/>}<div><p className="font-semibold text-slate-950 dark:text-white">{studentName}</p><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Student</p></div></div>}{list(item.tags).length > 0 && <div className={`flex flex-wrap gap-2 ${item.studentName ? "mt-3" : ""}`}>{list(item.tags).map((tag, i) => <Chip key={i}>{tag}</Chip>)}</div>}</div>
        <Link to={`${previewTo}#${achievementId}`} aria-label={`View achievement: ${title}`} className="inline-flex shrink-0 items-center gap-3 rounded-lg py-2 text-base font-semibold text-sky-600 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-600 dark:text-sky-300">View achievement<Icon name="arrow" className="h-6 w-6"/></Link>
      </div>
    </div>
  </article>;
  return <article id={achievementId} className="scroll-mt-28 grid items-center gap-6 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-slate-50 p-6 dark:border-slate-700 dark:from-sky-950/40 dark:to-slate-950 sm:p-8 md:grid-cols-[minmax(180px,.8fr)_minmax(0,2fr)] md:gap-10">
    <div className={`flex min-h-48 items-center justify-center self-stretch overflow-hidden rounded-2xl bg-sky-100/70 p-4 dark:bg-sky-900/30 ${imageRight ? "md:order-2" : ""}`}>
      {hasAchievement ? <img src={achievementSrc} alt={title} onError={() => setFailedAchievement(achievementSrc)} loading="lazy" className="max-h-80 w-full rounded-xl object-contain"/> : hasStudent ? <img src={studentSrc} alt={studentName} onError={() => setFailedStudent(studentSrc)} loading="lazy" className="h-44 w-44 rounded-full object-cover ring-4 ring-white dark:ring-slate-800"/> : <div aria-hidden="true">            <svg viewBox="0 0 240 240" className="h-48 w-48 sm:h-56 sm:w-56" fill="none">
              <circle cx="120" cy="118" r="93" fill="currentColor" className="text-white/80 dark:text-sky-950/70"/>
              <path d="M60 70H42v24c0 23 15 39 38 40M180 70h18v24c0 23-15 39-38 40" stroke="#0284c7" strokeWidth="10" strokeLinecap="round"/>
              <path d="M68 57h104v43c0 35-22 59-52 59s-52-24-52-59V57Z" fill="#0369a1"/>
              <path d="M120 57h52v43c0 35-22 59-52 59V57Z" fill="#0ea5e9"/>
              <path d="m120 76 9 18 20 3-15 14 4 20-18-9-18 9 4-20-15-14 20-3 9-18Z" fill="white"/>
              <path d="M110 157h20v27h-20z" fill="#0369a1"/>
              <path d="M94 181h52l12 20H82l12-20Z" fill="#0284c7"/>
              <rect x="78" y="200" width="84" height="10" rx="5" fill="#075985"/>
              <path d="m49 39 5 10m136-10-5 10M31 146l11-4m167 4-11-4M117 24v12" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="45" cy="180" r="5" fill="#2dd4bf"/><circle cx="196" cy="170" r="4" fill="#38bdf8"/>
            </svg></div>}
    </div>
    <div className={`min-w-0 [overflow-wrap:anywhere] ${imageRight ? "md:order-1" : ""}`}><h3 className="inline-block rounded-lg bg-teal-100 px-3 py-1.5 text-lg font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-200">{title}</h3>
      {rating > 0 && <p className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-white"><span>{rating} / 5</span><span aria-hidden="true" className="tracking-widest text-sky-600">{Array.from({ length: 5 }, (_, star) => <span key={star} className={star < Math.round(rating) ? "" : "text-slate-300 dark:text-slate-600"}>★</span>)}</span></p>}
      {item.description && <ExpandableText lines={4} className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300" preserveWhitespace>{item.description}</ExpandableText>}
      {item.studentReview && <blockquote className="mt-5 border-t border-sky-200 pt-5 dark:border-slate-700"><span aria-hidden="true" className="block h-9 font-serif text-6xl leading-none text-sky-600">“</span><ExpandableText lines={3} className="font-serif text-xl italic leading-8 text-slate-800 dark:text-slate-100">{item.studentReview}</ExpandableText></blockquote>}
      {(item.studentName || (hasStudent && hasAchievement)) && <div className="mt-4 flex items-center gap-3">{hasStudent && hasAchievement && <img src={studentSrc} alt={studentName} onError={() => setFailedStudent(studentSrc)} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"/>}<p className="text-sm font-medium text-slate-600 dark:text-slate-300">{studentName}</p></div>}
      {list(item.tags).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{list(item.tags).map((tag, index) => <Chip key={index}>{tag}</Chip>)}</div>}
    </div>
  </article>;
}

function KpiIllustration({ type }) {
  return <svg aria-hidden="true" viewBox="0 0 140 110" className="h-24 w-28 shrink-0" fill="none">
    <ellipse cx="70" cy="95" rx="56" ry="7" fill="#bae6fd"/>
    {type === "books" ? <><rect x="26" y="70" width="88" height="22" rx="5" fill="#0d9488"/><path d="M39 75h69v11H39z" fill="#f0fdfa"/><rect x="20" y="44" width="87" height="23" rx="5" fill="#fb7185"/><path d="M34 49h66v12H34z" fill="#fff1f2"/><path d="m31 27 75-10 3 22-75 10z" fill="#0284c7"/><path d="m44 30 59-8 1 11-59 8z" fill="#e0f2fe"/><path d="m48 20 5 23 8-6 8 4-5-23" fill="#fbbf24"/></> : type === "journey" ? <><path d="M22 87c42 0 0-31 40-31s7-31 47-31" stroke="#0284c7" strokeWidth="3" strokeDasharray="5 5"/><path d="M24 83V58m0 0 23 6-23 8M65 53V29m0 0 22 6-22 8" stroke="#0d9488" strokeWidth="3" fill="#5eead4"/><g transform="rotate(32 105 64)"><rect x="100" y="34" width="12" height="51" rx="2" fill="#fbbf24"/><path d="m100 85 6 13 6-13" fill="#fda4af"/><path d="m104 94 2 4 2-4" fill="#334155"/><rect x="100" y="27" width="12" height="9" rx="3" fill="#fef3c7"/></g></> : <><path d="M48 29H31v14c0 17 11 24 24 24m37-38h17v14c0 17-11 24-24 24" stroke="#f59e0b" strokeWidth="7"/><path d="M45 22h50v26c0 19-10 29-25 29S45 67 45 48z" fill="#fbbf24"/><path d="M70 22h25v26c0 19-10 29-25 29" fill="#f59e0b"/><path d="M65 75h10v13H65z" fill="#f59e0b"/><rect x="51" y="86" width="38" height="8" rx="3" fill="#0284c7"/><path d="m70 34 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="white"/></>}
    <path d="M18 25v10m-5-5h10m96 38v10m-5-5h10" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/><circle cx="118" cy="15" r="3" fill="#2dd4bf"/>
  </svg>;
}

const socialDesign = {
  youtube: ["YouTube", "#ef4444", "▶", "Watch & learn"],
  instagram: ["Instagram", "#db2777", "◎", "Moments & inspiration"],
  facebook: ["Facebook", "#2563eb", "f", "Join the community"],
  linkedin: ["LinkedIn", "#0284c7", "in", "Connect professionally"],
  telegram: ["Telegram", "#0891b2", "➤", "Stay in the loop"],
  whatsapp: ["WhatsApp", "#059669", "◉", "Keep in touch"],
  x: ["X", "#475569", "𝕏", "Follow the conversation"],
  twitter: ["X / Twitter", "#475569", "𝕏", "Follow the conversation"],
};
function SocialSection({ links }) {
  if (!links.length) return null;
  return <section aria-labelledby="classic-social-heading" className="mt-10 rounded-3xl border border-sky-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
    <h2 id="classic-social-heading" className="mb-6 text-3xl font-semibold tracking-tight">Let’s stay connected.</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{links.map(([key, url]) => {
      const [label, color, mark, description] = socialDesign[key.toLowerCase()] || [key, "#0284c7", "↗", "Explore my channel"];
      return <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ "--social-color": color }} className="classic-social-card group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-sky-600 dark:border-slate-700"><span aria-hidden="true" className="classic-social-orbit"/><span aria-hidden="true" className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl font-bold text-white shadow-sm" style={{ background: color }}>{mark}</span><div className="relative min-w-0 flex-1"><h3 className="truncate text-lg font-semibold capitalize">{label}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div><span className="relative text-slate-400"><Icon name="arrow" className="h-5 w-5 -rotate-45"/><span className="sr-only">Opens in a new tab</span></span></a>;
    })}</div>
  </section>;
}

function FloatingContact({ profile, socialLinks }) {
  const phone = String(fd(profile, ["mobileNo", "mobile_no"])).trim().replace(/[^+\d]/g, "");
  const whatsappNumber = String(fd(profile, ["whatsappNo", "whatsapp_no"])).replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : socialLinks.find(([key]) => key.toLowerCase() === "whatsapp")?.[1];
  if (!phone && !whatsappUrl) return null;
  const buttonClass = "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600";
  return <aside aria-label="Contact tutor" className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-3 sm:right-6">
    {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contact tutor on WhatsApp (opens in a new tab)" title="WhatsApp tutor" className={`${buttonClass} bg-emerald-600 hover:bg-emerald-700`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3 .8.8-2.9-.3-.5A8 8 0 1 1 12 20Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.7s-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.3.2-.5.6-1 .1-.2.1-.3 0-.5L9.7 8.8c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.6.6-.9 1.3-.8 2.1 0 1.2.9 2.4 1 2.6.2.2 1.8 2.8 4.3 3.8 1.6.6 2.3.7 3.1.5.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.8-.5Z"/></svg></a>}
    {phone && <a href={`tel:${phone}`} aria-label="Call tutor" title="Call tutor" className={`${buttonClass} bg-sky-700 hover:bg-sky-800`}><Icon name="phone" className="h-6 w-6"/></a>}
  </aside>;
}

function HomePage({ socialLinks, name, profile, tuition, subjects, batches, achievements, gallery, location, onContactClick, basePath }) {
  const intro = fd(profile, ["about", "description"], "Personal guidance and focused classes to help learners build confidence and make steady progress.");
  const experience = fd(profile, ["teachingYOE", "teaching_yoe"]);
  const previewImages = gallery.filter((image) => fd(image, ["fileUrl", "url", "imageUrl", "src"])).slice(0, 3);
  return <>
    <section className="classic-hero relative isolate overflow-hidden rounded-[2rem] bg-sky-800 text-white dark:bg-sky-950"><div aria-hidden="true" className="classic-hero-grid pointer-events-none absolute inset-0 -z-10"/><div className="grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_.85fr] lg:px-14 lg:py-16"><div><h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Strong foundations for the goals ahead.</h1><ExpandableText lines={3} className="mt-5 max-w-xl text-base leading-7 text-sky-50/85">{intro}</ExpandableText><p className="mt-4 text-sm font-medium text-sky-100">{fd(profile, ["qualification"], "Educator")} {location ? ` · ${location}` : ""}</p><div className="mt-7 flex flex-wrap gap-3"><Link to={`${basePath}/classes`} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-950 hover:bg-sky-50">Explore classes <Icon name="arrow" className="h-4 w-4"/></Link><button type="button" onClick={onContactClick} className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><Icon name="message" className="h-4 w-4"/>Message tutor</button></div></div><div className="relative mx-auto w-full max-w-sm"><div aria-hidden="true" className="classic-portrait-frame absolute inset-3 rounded-[2rem] border border-cyan-200/30 bg-cyan-200/10"/><div aria-hidden="true" className="absolute -inset-3 rounded-[1.8rem] border border-white/20"/><div className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10 p-2 shadow-2xl"><Avatar src={fd(profile, ["profilePicture", "profile_picture", "profilePhoto", "avatar"])} name={name} className="aspect-[4/4] w-full rounded-[1.1rem] bg-sky-100 text-6xl text-sky-800 dark:bg-sky-900 dark:text-sky-200"/><div className="absolute inset-x-2 bottom-2 rounded-b-[1.1rem] bg-gradient-to-t from-slate-950/90 to-transparent px-5 pb-5 pt-16"><p className="text-xl font-semibold">{name}</p><p className="mt-1 text-sm text-sky-100">{fd(profile, ["qualification"], "Tutor")}</p></div></div></div></div></section>
    <section aria-label="Teaching at a glance" className="mt-6 grid gap-4 sm:grid-cols-3">
      {[[subjects.length || "Personal", "Subjects offered", "books"], [experience ? `${experience} years` : batches.length, experience ? "Teaching experience" : "Published batches", "journey"], [achievements.length, "Student stories", "trophy"]].map(([value, label, type]) => <div key={type} className="flex items-center justify-between gap-2 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-sky-950/40"><div><p className="text-2xl font-semibold text-sky-800 dark:text-sky-200">{value}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{label}</p></div><KpiIllustration type={type}/></div>)}
    </section>
    <SocialSection links={socialLinks}/>
    <FloatingContact profile={profile} socialLinks={socialLinks}/>

    <div className="relative left-1/2 mt-12 w-[calc(100vw-2rem)] -translate-x-1/2 space-y-8 sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-4rem)]">
      <section className="rounded-3xl border border-sky-100 bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10 lg:p-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">Achievements</h2><p className="mt-2 text-base text-slate-600 dark:text-slate-300">Small steps. Remarkable progress.</p></div><Link to={`${basePath}/achievements`} className="inline-flex items-center gap-3 rounded-lg py-2 text-base font-semibold text-sky-600 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-600 dark:text-sky-300">View all achievements<Icon name="arrow" className="h-6 w-6"/></Link></div>
        {achievements.length ? <div className="grid gap-8">{achievements.slice(0, 2).map((item, index) => <ClassicAchievementCard key={item.achievementId ?? item.id ?? index} item={item} previewTo={`${basePath}/achievements`}/>)}</div> : <p className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">Published achievements and student reviews will appear here.</p>}
      </section>
      <section aria-labelledby="home-batches-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-[#082b52] px-5 py-14 text-white sm:px-10 sm:py-16 lg:px-12 lg:py-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h2 id="home-batches-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Batches</h2><p className="mt-2 text-base text-sky-100/85">Find a batch that fits your learning goals.</p></div><Link to={`${basePath}/batches`} className="inline-flex items-center gap-3 rounded-lg py-2 text-base font-semibold text-sky-200 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-600 dark:text-sky-200">View all batches<Icon name="arrow" className="h-6 w-6"/></Link></div>
        <div className="grid gap-6 md:grid-cols-2">{batches.length ? batches.slice(0, 2).map((batch, index) => {
          const status = String(fd(batch, ["batchType", "type"], "Class"));
          const isCurrent = /current|running/i.test(status);
          const classes = fd(batch, ["eligibleClasses", "eligible_classes"]);
          const languages = fd(batch, ["languages"], fd(tuition, ["languages"]));
          return <article key={batch.batchId ?? batch.id ?? index} className="grid gap-6 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_4px_12px_-5px_rgb(15_23_42_/_15%)] dark:border-slate-200 dark:bg-white sm:p-6">
            <BatchImage batch={batch} className="h-64 w-full rounded-[1.2rem] object-cover sm:h-72"/>
            <div className="flex min-w-0 flex-col [overflow-wrap:anywhere] border-t border-slate-200 pt-6">
              <span className={`inline-flex self-start rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${isCurrent ? "bg-sky-100 text-blue-800 dark:bg-sky-100 dark:text-blue-800" : "bg-teal-100 text-teal-800 dark:bg-teal-100 dark:text-teal-800"}`}>{status}</span>
              <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{fd(batch, ["title", "batchName"], "Learning group")}</h3>
              {batch.description && <ExpandableText buttonClassName="text-sky-700! dark:text-sky-700!" lines={2} className="mt-3 text-base leading-7 text-slate-600" preserveWhitespace>{batch.description}</ExpandableText>}
              <div className="mt-auto flex flex-wrap items-end justify-between gap-5 pt-6"><div className="flex flex-wrap gap-3">
                {classes && <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0"><path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v7"/></svg>{classes}</span>}
                {languages && <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"><Icon name="book" className="h-5 w-5 shrink-0"/>{languages}</span>}
              </div><Link to={`${basePath}/batches`} aria-label={`View batch: ${fd(batch, ["title", "batchName"], "Learning group")}`} className="ml-auto inline-flex shrink-0 items-center justify-center gap-4 rounded-xl bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600">View batch<Icon name="arrow" className="h-6 w-6"/></Link></div>
            </div>
          </article>;
        }) : <p className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-12 text-center text-sm text-sky-100 dark:border-white/25 dark:bg-white/5 dark:text-sky-100">Published batches will appear here when available.</p>}</div>
      </section>
      <section className="flex min-h-[80svh] flex-col rounded-3xl border border-sky-100 bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10 lg:p-12">
        <HomeSectionHeading title="Gallery" to={`${basePath}/gallery`} label="View all"/>
        {previewImages.length ? <div className={`grid min-h-[55svh] flex-1 auto-rows-fr gap-5 ${previewImages.length === 2 ? "sm:grid-cols-2" : previewImages.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>{previewImages.map((image, index) => <GalleryPreviewImage key={image.fileId ?? image.id ?? index} image={image} index={index}/>)}</div> : <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">Gallery photos will appear here when the tutor adds them.</p>}
      </section>
    </div>
    <section aria-labelledby="learning-chapter-heading" className="classic-learning-banner relative isolate mt-8 grid items-center gap-4 overflow-hidden rounded-[2rem] border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-sky-50/70 to-cyan-50 px-6 pt-9 dark:border-sky-800 dark:from-sky-950 dark:via-slate-900 dark:to-sky-950 sm:px-10 sm:pt-12 lg:min-h-[420px] lg:grid-cols-[1fr_1.05fr] lg:gap-0 lg:px-12 lg:py-10">
      <div className="relative z-10 pb-4 lg:-mr-8 lg:py-5"><h2 id="learning-chapter-heading" className="max-w-xl text-4xl font-bold leading-[1.12] tracking-tight text-sky-950 dark:text-white sm:text-5xl lg:text-[3.4rem]">Find your next<br className="hidden sm:block"/> learning chapter.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-sky-100/80">Browse subjects and published batches to find a good fit.</p><Link to={`${basePath}/batches`} className="mt-7 inline-flex items-center gap-4 rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 sm:px-7">Explore batches <Icon name="arrow" className="h-6 w-6"/></Link></div>
      <div aria-hidden="true" className="classic-learning-art relative flex min-w-0 items-center justify-center self-stretch"><div className="classic-learning-rings pointer-events-none absolute inset-0 -z-10"/><img src="/illustrations/learning-chapter.webp" alt="" width="900" height="600" loading="lazy" className="relative w-full max-w-xl object-contain lg:scale-110"/></div>
    </section>
  </>;
}

function AboutPage({ name, profile, tuition, socialLinks, faqs, onContactClick, onCopyLink, copyMessage }) {
  const about = fd(profile, ["about", "description"]);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const email = fd(profile, ["email"]);
  const phone = fd(profile, ["mobileNo", "mobile_no"]);
  const whatsapp = fd(profile, ["whatsappNo", "whatsapp_no"]);
  const details = [["Qualification", fd(profile, ["qualification"])], ["Years teaching", fd(profile, ["teachingYOE", "teaching_yoe"])], ["Tuition", fd(tuition, ["tuitionName", "tuitionClassName"])], ["Established", fd(tuition, ["establishedYear"])], ["Languages", fd(tuition, ["languages"])], ["Location", location]].filter(([, value]) => value);
  return <>
    <PageHeading title="Teaching built around each learner." description="Learn about the tutor, their background, and the learning environment."/>
    <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-xl font-semibold text-slate-950 dark:text-white">A little about {fd(profile, ["firstName", "first_name"], "the tutor")}</h2><ExpandableText lines={5} className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-300" preserveWhitespace>{about || "The tutor has not added an introduction yet."}</ExpandableText></article>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{value}{label === "Years teaching" ? " years" : ""}</dd></div>)}</dl>
    </div>
    <section className="mt-16 border-t border-slate-200 pt-12 dark:border-slate-800"><h2 className="mx-auto mt-0 max-w-3xl text-center text-2xl font-semibold text-slate-950 dark:text-white">Common questions.</h2>{faqs.length ? <div className="mx-auto mt-5 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6 text-left dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">{faqs.map((faq, i) => <details key={faq.faqId ?? faq.id ?? i} className="group py-5 [overflow-wrap:anywhere]"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white"><span className="min-w-0 flex-1 [overflow-wrap:anywhere] group-open:line-clamp-none line-clamp-2">{fd(faq, ["title", "question"], "Question")}</span><span className="shrink-0 text-xl font-normal text-sky-700 group-open:rotate-45 dark:text-sky-300">+</span></summary><ExpandableText lines={4} className="mt-3 pr-8 text-sm leading-7 text-slate-600 dark:text-slate-300" preserveWhitespace>{fd(faq, ["description", "answer"])}</ExpandableText></details>)}</div> : <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-slate-600 dark:text-slate-300">Questions and answers will appear here when shared by the tutor.</p>}</section>
    <section id="about-contact" className="mt-14 grid scroll-mt-28 gap-6 rounded-3xl bg-sky-800 p-6 text-white dark:bg-sky-950 sm:p-9 lg:grid-cols-[1fr_.8fr]">
      <div><h2 className="mt-3 text-2xl font-semibold">Connect with {name}.</h2><p className="mt-3 max-w-lg text-sm leading-7 text-sky-50/80">Send an enquiry through the TutorFolio messenger or use the contact details shared by the tutor.</p><button type="button" onClick={onContactClick} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-950 hover:bg-sky-50"><Icon name="message" className="h-4 w-4"/>Open messenger</button>{onCopyLink && <button type="button" onClick={onCopyLink} className="ml-3 mt-6 rounded-xl border border-white/35 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">{copyMessage || "Copy website link"}</button>}</div>
      <div className="flex min-w-0 flex-col justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-sky-50">{email && <a className="[overflow-wrap:anywhere] hover:text-white" href={`mailto:${email}`}>{email}</a>}{phone && <a className="hover:text-white" href={`tel:${phone}`}>{phone}</a>}{whatsapp && <a className="hover:text-white" href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}{location && <p className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4"/>{location}</p>}{socialLinks.length > 0 && <div className="border-t border-white/15 pt-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sky-100">Social media</h3><ul className="m-0 flex list-none flex-col gap-3 p-0">{socialLinks.map(([label, url]) => <li key={label} className="min-w-0"><a href={url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-col gap-0.5 hover:text-white"><span className="font-semibold capitalize">{label}</span><span className="[overflow-wrap:anywhere] text-xs text-sky-100/75 underline decoration-white/25 underline-offset-2">{url}</span></a></li>)}</ul></div>}</div>
    </section>
  </>;
}

function ClassesPage({ tuition, subjects, services }) {
  const tuitionName = fd(tuition, ["tuitionName", "tuitionClassName"], "this tutor");
  const eligibleClasses = fd(tuition, ["eligibleClasses", "eligible_classes"]);
  return <>
    <PageHeading title="Subjects and learning options." description="Explore the subjects, class levels, and teaching formats shared by the tutor."/>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Subjects</h2><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"><Icon name="book" className="h-5 w-5"/></span></div>
        {subjects.length ? <div className="mt-5 flex flex-wrap gap-2.5">{subjects.map((subject, i) => <Chip key={`${subject}-${i}`}>{subject}</Chip>)}</div> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Subject information will be added here.</p>}
        <h2 className="mt-8 text-lg font-semibold text-slate-950 dark:text-white">Classes for</h2><p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{eligibleClasses || "Contact the tutor to discuss suitable class levels."}</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Learning format</h2><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200"><Icon name="message" className="h-5 w-5"/></span></div>
        {services.length ? <div className="mt-5 flex flex-wrap gap-2.5">{services.map((service, i) => <Chip key={`${service}-${i}`}>{service}</Chip>)}</div> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Contact the tutor to discuss class formats.</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Languages</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{fd(tuition, ["languages"], "Ask the tutor")}</p></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tuition centre</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{tuitionName === "this tutor" ? "Independent tutor" : tuitionName}</p></div></div>
      </section>
    </div>
    <section className="mt-6 grid overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 dark:border-slate-800 dark:from-sky-950/60 dark:via-slate-900 dark:to-slate-900 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:px-9 sm:py-5">
      <div className="min-w-0 py-2"><h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">A clear path for learning.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{subjects.length ? `Explore ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}${eligibleClasses ? ` for ${eligibleClasses}` : ""} with ${tuitionName}.` : `Explore the subjects and class formats available at ${tuitionName}.`}</p><div className="mt-4 flex flex-wrap gap-2">{subjects.length > 0 && <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-sky-900 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</span>}{eligibleClasses && <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-sky-900 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200">{eligibleClasses}</span>}</div></div>
      <div aria-hidden="true" className="flex justify-center sm:justify-end"><img src="/illustrations/learning-amico.png" alt="" width="240" height="240" loading="lazy" className="h-32 w-32 object-contain sm:h-48 sm:w-48"/></div>
    </section>
  </>;
}

function BatchesPage({ batches }) {
  const now = new Date();
  const sorted = [...batches].sort((a, b) => new Date(a.startOn || 0) - new Date(b.startOn || 0));
  const groups = [
    ["Current batches", sorted.filter((b) => (!b.startOn || new Date(b.startOn) <= now) && (!b.endOn || new Date(b.endOn) >= now))],
    ["Upcoming batches", sorted.filter((b) => b.startOn && new Date(b.startOn) > now)],
    ["Previous batches", sorted.filter((b) => b.endOn && new Date(b.endOn) < now)],
  ].filter(([, items]) => items.length);
  return <><PageHeading title="Choose where to start." description="Current, upcoming, and previous batches published by the tutor."/>{groups.length ? <div className="space-y-10">{groups.map(([title, items]) => <section key={title}><h2 className="mb-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2><div className="grid gap-5 md:grid-cols-2">{items.map((batch, i) => <BatchCard key={batch.batchId ?? batch.id ?? `${title}-${i}`} batch={batch}/>)}</div></section>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">There are no public batches at the moment. Contact the tutor to discuss a schedule.</p>}</>;
}

function GalleryPage({ gallery }) {
  return <><PageHeading title="A look inside the learning space." description="Photos shared by the tutor from classes and the tuition centre."/><ClassicGallery gallery={gallery}/></>;
}

function AchievementsPage({ achievements }) {
  return <><PageHeading title="Progress worth celebrating." description="Student achievements and feedback published by the tutor."/>{achievements.length ? <div className="grid gap-8">{achievements.map((item, index) => <ClassicAchievementCard key={item.achievementId ?? item.id ?? index} item={item} imageRight={index % 2 === 1}/>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Published achievements and student reviews will appear here.</p>}</>;
}

function ExperiencePage({ experience }) {
  return <><PageHeading title="A teaching journey grounded in practice." description="Professional experience shared by the tutor."/>{experience.length ? <div className="relative ml-2 space-y-8 border-l border-sky-200 pl-7 dark:border-sky-900">{experience.map((item, i) => <article key={item.experienceId ?? item.id ?? i} className="relative"><span className="absolute -left-[2.1rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-600 ring-4 ring-sky-100 dark:border-slate-950 dark:bg-sky-300 dark:ring-sky-950"/><p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">{dateLabel(item.startDate)}{item.isCurrent ? " to Present" : item.endDate ? ` to ${dateLabel(item.endDate)}` : ""}</p><h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{fd(item, ["title"], "Teaching experience")}</h2>{item.description && <ExpandableText lines={3} className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300" preserveWhitespace>{item.description}</ExpandableText>}</article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Professional experience will appear here when published.</p>}</>;
}

export default function ThemeClassic({ profile = {}, tuition = {}, achievements = [], batches = [], experience = [], faqs = [], gallery = [], username = "", previewBasePath, currentPage = "home", onContactClick, onCopyLink, copyMessage = "" }) {
  const [mode, setMode] = useState(() => { try { return localStorage.getItem("tutorfolio:classic-mode") || "light"; } catch { return "light"; } });
  useEffect(() => { try { localStorage.setItem("tutorfolio:classic-mode", mode); } catch {} }, [mode]);
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
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const subjects = list(fd(tuition, ["teachingSubjects", "teaching_subjects"]));
  const services = list(fd(tuition, ["services"]));
  const social = fd(profile, ["socialMedia"], {});
  const socialLinks = useMemo(() => Object.entries(social || {}).filter(([, value]) => typeof value === "string" && value.trim()).map(([label, value]) => [label, asUrl(value.trim())]).filter(([, url]) => { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("."); } catch { return false; } }), [social]);
  const basePath = previewBasePath || `/tutor/${encodeURIComponent(username)}`;
  const isDark = mode === "dark";

  let content;
  if (currentPage === "about") content = <AboutPage name={name} profile={profile} tuition={tuition} socialLinks={socialLinks} faqs={faqs} onContactClick={onContactClick} onCopyLink={onCopyLink} copyMessage={copyMessage}/>;
  else if (currentPage === "classes") content = <ClassesPage tuition={tuition} subjects={subjects} services={services}/>;
  else if (currentPage === "batches") content = <BatchesPage batches={batches}/>;
  else if (currentPage === "gallery") content = <GalleryPage gallery={gallery}/>;
  else if (currentPage === "achievements") content = <AchievementsPage achievements={achievements}/>;
  else if (currentPage === "experience") content = <ExperiencePage experience={experience}/>;
  else content = <HomePage socialLinks={socialLinks} name={name} profile={profile} tuition={tuition} subjects={subjects} batches={batches} achievements={achievements} gallery={gallery} location={location} onContactClick={onContactClick} basePath={basePath}/>;

  return <div data-theme={mode}>
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 pt-3 sm:px-6 lg:flex-nowrap lg:px-8 lg:py-4">
          <Link to={basePath} className="flex min-w-0 max-w-[60%] shrink-0 items-center gap-2.5 lg:max-w-[25%]"><TuitionLogo tuition={tuition} name={fd(tuition, ["tuitionName", "tuitionClassName"], name)} className="h-9 w-9"/><span className="truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">{fd(tuition, ["tuitionName", "tuitionClassName"], name)}</span></Link>
          <AdaptiveNav basePath={basePath} currentPage={currentPage}/>
          <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => setMode(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"><Icon name={isDark ? "sun" : "moon"} className="h-4 w-4"/></button><button type="button" onClick={onContactClick} aria-label="Open TutorFolio messenger" className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:px-4"><Icon name="message" className="h-4 w-4"/><span className="hidden sm:inline">Message</span></button></div>
        </div>
      </header>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">{content}</main>
      <footer className="classic-footer mt-6 border-t border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="classic-footer-grid mx-auto grid max-w-[1600px] gap-7 px-5 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.1fr_1.25fr_1.2fr] lg:gap-8 lg:px-8">
          <Link to={basePath} className="classic-footer-brand flex min-w-0 items-start gap-3 text-slate-950 dark:text-white"><TuitionLogo tuition={tuition} name={fd(tuition, ["tuitionName", "tuitionClassName"], name)} className="h-9 w-9"/><span className="pt-0.5 text-xl font-bold tracking-tight">{fd(tuition, ["tuitionName", "tuitionClassName"], name)}</span></Link>
          <div className="classic-footer-explore lg:border-l lg:border-sky-100 lg:pl-7 dark:lg:border-slate-700"><h2 className="text-xs font-semibold text-slate-950 dark:text-white">Explore</h2><nav aria-label="Footer pages" className="mt-3"><ul className="m-0 flex list-none flex-col gap-2 p-0 text-xs">{pageLinks.filter((page) => page.id !== "home").map((page) => <li key={page.id}><Link to={`${basePath}/${page.id}`} className="inline-flex text-slate-600 transition hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300">{page.label}</Link></li>)}</ul></nav></div>
          <div className="min-w-0 lg:border-l lg:border-sky-100 lg:pl-7 dark:lg:border-slate-700"><h2 className="text-xs font-semibold text-slate-950 dark:text-white">Contact</h2><div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">{fd(profile, ["email"]) && <a className="flex items-center gap-2 break-all hover:text-sky-700 dark:hover:text-sky-300" href={`mailto:${profile.email}`}><Icon name="mail" className="h-4 w-4 shrink-0"/>{profile.email}</a>}{fd(profile, ["mobileNo", "mobile_no"]) && <a className="flex items-center gap-2 hover:text-sky-700 dark:hover:text-sky-300" href={`tel:${fd(profile, ["mobileNo", "mobile_no"])}`}><Icon name="phone" className="h-4 w-4 shrink-0"/>{fd(profile, ["mobileNo", "mobile_no"])}</a>}<Link to={`${basePath}/about#about-contact`} className="inline-flex items-center gap-2 font-semibold text-sky-700 dark:text-sky-300">Message the tutor<Icon name="arrow" className="h-3.5 w-3.5"/></Link></div></div>
        </div><div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800"><p className="mx-auto max-w-[1536px] text-xs text-slate-400">© {new Date().getFullYear()} {name}. All rights reserved.</p></div>
      </footer>
    </div>
  </div>;
}
