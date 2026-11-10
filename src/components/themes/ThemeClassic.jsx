import React, { useEffect, useMemo, useRef, useState } from "react";
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
  return <div className="relative mx-auto max-w-7xl px-3 pb-2 sm:px-5 lg:pb-3">
    <nav ref={navRef} aria-label="Tutor website pages" className="flex min-w-0 items-center justify-center gap-1 overflow-visible">
      {visiblePages.map((page) => <Link key={page.id} to={page.id === "home" ? basePath : `${basePath}/${page.id}`} aria-current={currentPage === page.id ? "page" : undefined} className={navClass(page)}>{page.label}</Link>)}
      {overflowPages.length > 0 && <div className="relative shrink-0" ref={menuRef}>
        <button type="button" aria-label="More pages" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Icon name="more"/></button>
        {menuOpen && <div role="menu" aria-label="More pages" className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">{overflowPages.map((page) => <Link key={page.id} role="menuitem" to={page.id === "home" ? basePath : `${basePath}/${page.id}`} onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2.5 text-sm ${currentPage === page.id ? "bg-sky-100 font-semibold text-sky-900 dark:bg-sky-950 dark:text-sky-100" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"}`}>{page.label}</Link>)}</div>}
      </div>}
    </nav>
    <div ref={measureRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 -z-10 flex w-max gap-1 whitespace-nowrap opacity-0">{pageLinks.map((page) => <span key={page.id} className={navClass("")}>{page.label}</span>)}</div>
  </div>;
}

function Avatar({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt={name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
  return <div aria-label={name} className={`flex items-center justify-center bg-sky-100 font-semibold text-sky-800 dark:bg-sky-900 dark:text-sky-200 ${className}`}>{name?.trim()?.[0]?.toUpperCase() || "T"}</div>;
}

function PageHeading({ eyebrow, title, description }) {
  return <div className="mb-10 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>{description && <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>}</div>;
}

function Chip({ children }) {
  return <span className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-sm font-medium text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">{children}</span>;
}

function BatchCard({ batch }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">{fd(batch, ["title", "batchName"], "Learning group")}</h2><p className="mt-1 text-sm text-sky-700 dark:text-sky-300">{fd(batch, ["batchType", "type", "session"], "Class")}</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{fd(batch, ["session"], "Classes")}</span></div>
    {fd(batch, ["description"]) && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{fd(batch, ["description"])}</p>}
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">{fd(batch, ["eligibleClasses", "eligible_classes"]) && <div><dt className="text-xs text-slate-500 dark:text-slate-400">For classes</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{fd(batch, ["eligibleClasses", "eligible_classes"])}</dd></div>}{fd(batch, ["fee"]) && <div><dt className="text-xs text-slate-500 dark:text-slate-400">Fee</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">₹{fd(batch, ["fee"])}{fd(batch, ["paymentType"]) ? ` / ${batch.paymentType}` : ""}</dd></div>}<div><dt className="text-xs text-slate-500 dark:text-slate-400">Schedule</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{dateLabel(fd(batch, ["startOn"])) || "Ask the tutor"}{fd(batch, ["endOn"]) ? ` to ${dateLabel(batch.endOn)}` : ""}</dd></div>{batch.maximumSeats != null && <div><dt className="text-xs text-slate-500 dark:text-slate-400">Places available</dt><dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{Math.max(0, Number(batch.maximumSeats) - Number(batch.allottedSeats || 0))}</dd></div>}</dl>
  </article>;
}

function HomePage({ name, profile, tuition, subjects, batches, achievements, location, onContactClick, basePath }) {
  const intro = fd(profile, ["about", "description"], "Personal guidance and focused classes to help learners build confidence and make steady progress.");
  const experience = fd(profile, ["teachingYOE", "teaching_yoe"]);
  return <>
    <section className="overflow-hidden rounded-[2rem] bg-sky-800 text-white dark:bg-sky-950"><div className="grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_.85fr] lg:px-14 lg:py-16"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-200">A thoughtful approach to learning</p><h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Strong foundations for the goals ahead.</h1><p className="mt-5 max-w-xl line-clamp-3 text-base leading-7 text-sky-50/85">{intro}</p><p className="mt-4 text-sm font-medium text-sky-100">{fd(profile, ["qualification"], "Educator")} {location ? ` · ${location}` : ""}</p><div className="mt-7 flex flex-wrap gap-3"><Link to={`${basePath}/classes`} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-950 hover:bg-sky-50">Explore classes <Icon name="arrow" className="h-4 w-4"/></Link><button type="button" onClick={onContactClick} className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><Icon name="message" className="h-4 w-4"/>Message tutor</button></div></div><div className="relative mx-auto w-full max-w-sm"><div className="absolute -inset-3 rounded-[1.8rem] border border-white/20"/><div className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10 p-2 shadow-2xl"><Avatar src={fd(profile, ["profilePicture", "profile_picture", "profilePhoto", "avatar"])} name={name} className="aspect-[4/4] w-full rounded-[1.1rem] bg-sky-100 text-6xl text-sky-800 dark:bg-sky-900 dark:text-sky-200"/><div className="absolute inset-x-2 bottom-2 rounded-b-[1.1rem] bg-gradient-to-t from-slate-950/90 to-transparent px-5 pb-5 pt-16"><p className="text-xl font-semibold">{name}</p><p className="mt-1 text-sm text-sky-100">{fd(profile, ["qualification"], "Tutor")}</p></div></div></div></div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-2xl font-semibold text-sky-800 dark:text-sky-200">{subjects.length || "Personal"}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Subjects offered</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-2xl font-semibold text-sky-800 dark:text-sky-200">{experience ? `${experience} years` : batches.length}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{experience ? "Teaching experience" : "Published batches"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-2xl font-semibold text-sky-800 dark:text-sky-200">{achievements.length}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Student stories</p></div></section>
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Student progress</p><h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Achievements</h2></div><Link to={`${basePath}/achievements`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950">More <Icon name="arrow" className="ml-1 inline h-4 w-4"/></Link></div>
        {achievements.length ? <div className="space-y-3">{achievements.slice(0, 2).map((item, index) => <article key={item.achievementId ?? item.id ?? index} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{fd(item, ["title"], "Student achievement")}</h3>{fd(item, ["studentRating", "rating"]) && <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-950 dark:text-sky-200">{fd(item, ["studentRating", "rating"])} / 5</span>}</div>{fd(item, ["description"]) && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>}{fd(item, ["studentReview"]) && <p className="mt-2 line-clamp-2 text-sm italic leading-5 text-slate-500 dark:text-slate-400">“{item.studentReview}” <span className="not-italic">{fd(item, ["studentName"])}</span></p>}</article>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Published achievements and student reviews will appear here.</p>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Learning groups</p><h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Batches</h2></div><Link to={`${basePath}/batches`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950">More <Icon name="arrow" className="ml-1 inline h-4 w-4"/></Link></div>
        {batches.length ? <div className="space-y-3">{batches.slice(0, 2).map((batch, index) => <article key={batch.batchId ?? batch.id ?? index} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{fd(batch, ["title", "batchName"], "Learning group")}</h3><span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium capitalize text-sky-900 dark:bg-sky-950 dark:text-sky-200">{fd(batch, ["batchType", "type", "session"], "Class")}</span></div>{fd(batch, ["description"]) && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{batch.description}</p>}<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{fd(batch, ["eligibleClasses"]) ? `For ${batch.eligibleClasses}` : "Contact the tutor for details"}{fd(batch, ["startOn"]) ? ` · Starts ${dateLabel(batch.startOn)}` : ""}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Published batches will appear here when available.</p>}
      </div>
    </section>
    <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-6 dark:border-sky-950 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">Looking for a class?</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Browse subjects and published batches to find a good fit.</p></div><Link to={`${basePath}/batches`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-300">View batches <Icon name="arrow" className="h-4 w-4"/></Link></section>
    {tuition.tuitionName && <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">{tuition.tuitionName}</p>}
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
    <PageHeading eyebrow="About the tutor" title="Teaching built around each learner." description="Learn about the tutor, their background, and the learning environment."/>
    <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-xl font-semibold text-slate-950 dark:text-white">A little about {fd(profile, ["firstName", "first_name"], "the tutor")}</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">{about || "The tutor has not added an introduction yet."}</p></article>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{value}{label === "Years teaching" ? " years" : ""}</dd></div>)}</dl>
    </div>
    {socialLinks.length > 0 && <div className="mt-7 flex flex-wrap gap-3">{socialLinks.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium capitalize text-slate-700 hover:border-sky-400 dark:border-slate-700 dark:text-slate-200">{label}</a>)}</div>}
    <section className="mt-16 border-t border-slate-200 pt-12 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">FAQs</p><h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Common questions.</h2>{faqs.length ? <div className="mt-5 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">{faqs.map((faq, i) => <details key={faq.faqId ?? faq.id ?? i} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white">{fd(faq, ["title", "question"], "Question")}<span className="text-xl font-normal text-sky-700 group-open:rotate-45 dark:text-sky-300">+</span></summary><p className="mt-3 whitespace-pre-line pr-8 text-sm leading-7 text-slate-600 dark:text-slate-300">{fd(faq, ["description", "answer"])}</p></details>)}</div> : <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Questions and answers will appear here when shared by the tutor.</p>}</section>
    <section id="about-contact" className="mt-14 grid scroll-mt-28 gap-6 rounded-3xl bg-sky-800 p-6 text-white dark:bg-sky-950 sm:p-9 lg:grid-cols-[1fr_.8fr]">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Get in touch</p><h2 className="mt-3 text-2xl font-semibold">Connect with {name}.</h2><p className="mt-3 max-w-lg text-sm leading-7 text-sky-50/80">Send an enquiry through the TutorFolio messenger or use the contact details shared by the tutor.</p><button type="button" onClick={onContactClick} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-950 hover:bg-sky-50"><Icon name="message" className="h-4 w-4"/>Open messenger</button>{onCopyLink && <button type="button" onClick={onCopyLink} className="ml-3 mt-6 rounded-xl border border-white/35 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">{copyMessage || "Copy website link"}</button>}</div>
      <div className="flex flex-col justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-sky-50">{email && <a className="hover:text-white" href={`mailto:${email}`}>{email}</a>}{phone && <a className="hover:text-white" href={`tel:${phone}`}>{phone}</a>}{whatsapp && <a className="hover:text-white" href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}{location && <p className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4"/>{location}</p>}</div>
    </section>
  </>;
}

function ClassesPage({ tuition, subjects, services }) {
  return <><PageHeading eyebrow="Classes" title="Subjects and learning options." description="Explore the subjects, class levels, and teaching formats shared by the tutor."/><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Subjects</h2>{subjects.length ? <div className="mt-5 flex flex-wrap gap-2.5">{subjects.map((subject, i) => <Chip key={`${subject}-${i}`}>{subject}</Chip>)}</div> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Subject information will be added here.</p>}<h2 className="mt-8 text-lg font-semibold text-slate-950 dark:text-white">Classes for</h2><p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{fd(tuition, ["eligibleClasses", "eligible_classes"], "Contact the tutor to discuss suitable class levels.")}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Learning format</h2>{services.length ? <div className="mt-5 flex flex-wrap gap-2.5">{services.map((service, i) => <Chip key={`${service}-${i}`}>{service}</Chip>)}</div> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Contact the tutor to discuss class formats.</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Languages</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{fd(tuition, ["languages"], "Ask the tutor")}</p></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tuition centre</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{fd(tuition, ["tuitionName", "tuitionClassName"], "Independent tutor")}</p></div></div></section></div></>;
}

function BatchesPage({ batches }) {
  const now = new Date();
  const sorted = [...batches].sort((a, b) => new Date(a.startOn || 0) - new Date(b.startOn || 0));
  const groups = [
    ["Current batches", sorted.filter((b) => (!b.startOn || new Date(b.startOn) <= now) && (!b.endOn || new Date(b.endOn) >= now))],
    ["Upcoming batches", sorted.filter((b) => b.startOn && new Date(b.startOn) > now)],
    ["Previous batches", sorted.filter((b) => b.endOn && new Date(b.endOn) < now)],
  ].filter(([, items]) => items.length);
  return <><PageHeading eyebrow="Batches" title="Choose where to start." description="Current, upcoming, and previous batches published by the tutor."/>{groups.length ? <div className="space-y-10">{groups.map(([title, items]) => <section key={title}><h2 className="mb-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2><div className="grid gap-5 md:grid-cols-2">{items.map((batch, i) => <BatchCard key={batch.batchId ?? batch.id ?? `${title}-${i}`} batch={batch}/>)}</div></section>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">There are no public batches at the moment. Contact the tutor to discuss a schedule.</p>}</>;
}

function GalleryPage({ gallery }) {
  return <><PageHeading eyebrow="Gallery" title="A look inside the learning space." description="Photos shared by the tutor from classes and the tuition centre."/>{gallery.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{gallery.map((image, i) => { const src = fd(image, ["fileUrl", "url", "imageUrl", "src"]); return src ? <figure key={image.fileId ?? image.id ?? src} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><img src={src} alt={fd(image, ["originalFilename", "title"], `Tuition gallery image ${i + 1}`)} loading="lazy" className="aspect-[4/3] w-full object-cover"/><figcaption className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{fd(image, ["title", "originalFilename"], "Learning space")}</figcaption></figure> : null; })}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Gallery photos will appear here when the tutor adds them.</p>}</>;
}

function AchievementsPage({ achievements }) {
  return <><PageHeading eyebrow="Achievements" title="Progress worth celebrating." description="Student achievements and feedback published by the tutor."/>{achievements.length ? <div className="grid gap-5 md:grid-cols-2">{achievements.map((item, i) => <article key={item.achievementId ?? item.id ?? i} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">{fd(item, ["title"], "Student achievement")}</h2>{fd(item, ["studentRating", "rating"]) && <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-900 dark:bg-sky-950 dark:text-sky-200">{fd(item, ["studentRating", "rating"])} / 5</span>}</div>{fd(item, ["description"]) && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>}{fd(item, ["studentReview"]) && <blockquote className="mt-5 border-l-2 border-sky-400 pl-4 text-sm italic leading-6 text-slate-700 dark:text-slate-200">“{item.studentReview}”<footer className="mt-2 text-xs not-italic text-slate-500 dark:text-slate-400">{fd(item, ["studentName"], "Student")}</footer></blockquote>}{list(item.tags).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{list(item.tags).map((tag, j) => <Chip key={j}>{tag}</Chip>)}</div>}</article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Published achievements and student reviews will appear here.</p>}</>;
}

function ExperiencePage({ experience }) {
  return <><PageHeading eyebrow="Experience" title="A teaching journey grounded in practice." description="Professional experience shared by the tutor."/>{experience.length ? <div className="relative ml-2 space-y-8 border-l border-sky-200 pl-7 dark:border-sky-900">{experience.map((item, i) => <article key={item.experienceId ?? item.id ?? i} className="relative"><span className="absolute -left-[2.1rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-600 ring-4 ring-sky-100 dark:border-slate-950 dark:bg-sky-300 dark:ring-sky-950"/><p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">{dateLabel(item.startDate)}{item.isCurrent ? " to Present" : item.endDate ? ` to ${dateLabel(item.endDate)}` : ""}</p><h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{fd(item, ["title"], "Teaching experience")}</h2>{item.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>}</article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Professional experience will appear here when published.</p>}</>;
}

export default function ThemeClassic({ profile = {}, tuition = {}, achievements = [], batches = [], experience = [], faqs = [], gallery = [], username = "", currentPage = "home", onContactClick, onCopyLink, copyMessage = "" }) {
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
  const socialLinks = useMemo(() => Object.entries(social || {}).map(([label, value]) => [label, asUrl(value)]).filter(([, url]) => url), [social]);
  const basePath = `/tutor/${encodeURIComponent(username)}`;
  const isDark = mode === "dark";

  let content;
  if (currentPage === "about") content = <AboutPage name={name} profile={profile} tuition={tuition} socialLinks={socialLinks} faqs={faqs} onContactClick={onContactClick} onCopyLink={onCopyLink} copyMessage={copyMessage}/>;
  else if (currentPage === "classes") content = <ClassesPage tuition={tuition} subjects={subjects} services={services}/>;
  else if (currentPage === "batches") content = <BatchesPage batches={batches}/>;
  else if (currentPage === "gallery") content = <GalleryPage gallery={gallery}/>;
  else if (currentPage === "achievements") content = <AchievementsPage achievements={achievements}/>;
  else if (currentPage === "experience") content = <ExperiencePage experience={experience}/>;
  else content = <HomePage name={name} profile={profile} tuition={tuition} subjects={subjects} batches={batches} achievements={achievements} location={location} onContactClick={onContactClick} basePath={basePath}/>;

  return <div data-theme={mode}>
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8"><Link to={basePath} className="flex min-w-0 items-center gap-3 max-[420px]:basis-full"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100"><Icon name="book"/></span><span className="min-w-0 leading-tight"><span className="block truncate text-sm font-bold text-slate-950 dark:text-white">{fd(tuition, ["tuitionName", "tuitionClassName"], name)}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Tutor and learning profile</span></span></Link><div className="flex shrink-0 items-center gap-2 max-[420px]:basis-full max-[420px]:justify-end"><button type="button" onClick={() => setMode(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Icon name={isDark ? "sun" : "moon"}/></button><button type="button" onClick={onContactClick} aria-label="Open TutorFolio messenger" className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-700 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"><Icon name="message" className="h-4 w-4"/><span className="hidden sm:inline">Message</span></button></div></div>
        <AdaptiveNav basePath={basePath} currentPage={currentPage}/>
      </header>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">{content}</main>
      <footer className="mt-10 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8"><div><Link to={basePath} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100"><Icon name="book" className="h-4 w-4"/></span><span className="text-sm font-bold text-slate-950 dark:text-white">{fd(tuition, ["tuitionName", "tuitionClassName"], name)}</span></Link><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">Learning support and tutor information for families and students.</p></div><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Explore</h2><div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">{pageLinks.filter((page) => page.id !== "home").map((page) => <Link key={page.id} to={`${basePath}/${page.id}`} className="text-slate-600 hover:text-sky-800 dark:text-slate-400 dark:hover:text-sky-300">{page.label}</Link>)}</div></div><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Contact</h2><div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">{fd(profile, ["email"]) && <a className="block hover:text-sky-800 dark:hover:text-sky-300" href={`mailto:${profile.email}`}>{profile.email}</a>}{fd(profile, ["mobileNo", "mobile_no"]) && <a className="block hover:text-sky-800 dark:hover:text-sky-300" href={`tel:${fd(profile, ["mobileNo", "mobile_no"])}`}>{fd(profile, ["mobileNo", "mobile_no"])}</a>}<Link to={`${basePath}/about#about-contact`} className="inline-flex items-center gap-2 font-semibold text-sky-800 hover:text-sky-950 dark:text-sky-300">Message the tutor <Icon name="arrow" className="h-4 w-4"/></Link></div></div></div><div className="border-t border-slate-200 dark:border-slate-800"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© {new Date().getFullYear()} {name}. All rights reserved.</p><p>Published with <span className="font-semibold text-sky-700 dark:text-sky-300">TutorFolio</span></p></div></div></footer>
    </div>
  </div>;
}
