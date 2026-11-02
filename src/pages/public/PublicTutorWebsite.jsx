// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import api from "../../api/axios";

// const pageClass = "min-h-screen bg-tf-surface-soft text-tf-ink";
// const sectionClass = "rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-7";
// const tabs = [
//   { id: "overview", label: "Overview" },
//   { id: "tuition", label: "Tuition" },
//   { id: "batches", label: "Batches" },
//   { id: "achievements", label: "Achievements" },
// ];

// function unwrap(body) {
//   let value = body?.data ?? body?.details ?? body ?? {};
//   // Some API responses wrap details inside another data/details object.
//   for (let i = 0; i < 2; i += 1) {
//     if (value && !Array.isArray(value) && typeof value === "object" && (value.data || value.details)) {
//       value = value.data ?? value.details;
//     } else break;
//   }
//   return value;
// }

// function firstDefined(source, keys, fallback = "") {
//   for (const key of keys) {
//     if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "") return source[key];
//   }
//   return fallback;
// }

// function firstObject(source, keys) {
//   for (const key of keys) {
//     const value = source?.[key];
//     if (value && typeof value === "object" && !Array.isArray(value)) return value;
//   }
//   return {};
// }

// function firstArray(source, keys) {
//   for (const key of keys) {
//     if (Array.isArray(source?.[key])) return source[key];
//   }
//   return [];
// }

// function normalizeWebsite(root) {
//   const profile = firstObject(root, ["profile", "tutor", "tutorProfile", "personalDetails", "personal_details", "profileDetails"]) || {};
//   const tuition = firstObject(root, ["tuition", "tuitionDetails", "tuition_details", "tuitionInformation"]) || {};
//   const achievements = firstArray(root, ["achievements", "studentAchievements", "visibleAchievements"]);
//   const batches = firstArray(root, ["batches", "tuitionBatches", "visibleBatches"]);
//   return { profile, tuition, achievements, batches };
// }

// function Avatar({ src, name, size = "h-24 w-24" }) {
//   const [failed, setFailed] = useState(false);
//   const initial = (name || "T").trim().charAt(0).toUpperCase() || "T";
//   if (src && !failed) return <img src={src} alt={name || "Tutor"} onError={() => setFailed(true)} className={`${size} rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-tf-surface-soft object-cover shadow-xl shadow-black/20`} />;
//   return <div className={`${size} flex items-center justify-center rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-3xl font-bold text-blue-700 dark:text-blue-300`}>{initial}</div>;
// }

// function SectionHeading({ eyebrow, title, description }) {
//   return <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">{eyebrow}</p><h2 className="mt-2 text-xl font-bold text-tf-ink sm:text-2xl">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-tf-copy">{description}</p>}</div>;
// }

// function Detail({ label, value }) {
//   if (value === undefined || value === null || value === "") return null;
//   return <div className="rounded-xl border border-tf-line bg-tf-surface-soft p-3.5"><p className="text-xs text-tf-muted">{label}</p><p className="mt-1.5 whitespace-pre-line break-words text-sm font-medium text-tf-ink">{String(value)}</p></div>;
// }

// function TextList({ value }) {
//   if (!value) return null;
//   const items = Array.isArray(value) ? value : String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
//   return <div className="flex flex-wrap gap-2">{items.map((item, index) => <span key={`${item}-${index}`} className="rounded-full border border-blue-200 dark:border-blue-500/15 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs text-blue-800 dark:text-blue-100">{typeof item === "string" || typeof item === "number" ? item : item.name || item.title || JSON.stringify(item)}</span>)}</div>;
// }

// function EmptyState({ title, body }) {
//   return <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-500/15 px-5 py-10 text-center"><p className="font-semibold text-tf-copy">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-tf-muted">{body}</p></div>;
// }

// export default function PublicTutorWebsite() {
//   const { username = "" } = useParams();
//   const [website, setWebsite] = useState(null);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [loading, setLoading] = useState(true);
//   const [sectionLoading, setSectionLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [sectionErrors, setSectionErrors] = useState({});
//   const [copyMessage, setCopyMessage] = useState("");

//   const fetchWebsite = useCallback(async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const response = await api.get(`/website/u/${encodeURIComponent(username)}`, { timeout: 20000 });
//       const body = response?.data ?? {};
//       if (body.status !== undefined && body.status !== 200) throw new Error(body.message || "Tutor website could not be found.");
//       const root = unwrap(body);
//       const normalized = normalizeWebsite(root);
//       // Handle APIs that return the tutor fields at the root instead of under profile.
//       if (!Object.keys(normalized.profile).length && (root.username || root.firstName || root.profilePicture)) normalized.profile = root;
//       setWebsite({ ...normalized, raw: root });
//     } catch (err) {
//       setWebsite(null);
//       setError(err?.response?.data?.message || err.message || "Unable to load this tutor website.");
//     } finally {
//       setLoading(false);
//     }
//   }, [username]);

//   useEffect(() => {
//     if (username) fetchWebsite();
//   }, [fetchWebsite, username]);

//   const fetchSection = useCallback(async (sectionId) => {
//     if (!username || sectionId === "overview") return;
//     setSectionLoading(true);
//     setSectionErrors((previous) => ({ ...previous, [sectionId]: "" }));
//     try {
//       const response = await api.get(`/website/u/${encodeURIComponent(username)}/${sectionId}`, { timeout: 15000 });
//       const body = response?.data ?? {};
//       if (body.status !== undefined && body.status !== 200) throw new Error(body.message || `Unable to load ${sectionId}.`);
//       const result = unwrap(body);
//       setWebsite((previous) => {
//         if (!previous) return previous;
//         const next = { ...previous };
//         if (sectionId === "tuition") {
//           const sectionObject = firstObject(result, ["tuition", "tuitionDetails", "tuition_details"]);
//           next.tuition = Object.keys(sectionObject).length ? sectionObject : result;
//         } else if (sectionId === "batches") {
//           next.batches = Array.isArray(result) ? result : firstArray(result, ["batches", "tuitionBatches", "visibleBatches", "details"]);
//         } else if (sectionId === "achievements") {
//           next.achievements = Array.isArray(result) ? result : firstArray(result, ["achievements", "studentAchievements", "visibleAchievements", "details"]);
//         }
//         return next;
//       });
//     } catch (err) {
//       // Keep the complete website payload visible as a fallback if a section endpoint fails.
//       setSectionErrors((previous) => ({ ...previous, [sectionId]: err?.response?.data?.message || err.message || `Unable to refresh ${sectionId}.` }));
//     } finally {
//       setSectionLoading(false);
//     }
//   }, [username]);

//   const profile = website?.profile ?? {};
//   const tuition = website?.tuition ?? {};
//   const achievements = website?.achievements ?? [];
//   const batches = website?.batches ?? [];
//   const name = [firstDefined(profile, ["firstName", "first_name"]), firstDefined(profile, ["lastName", "last_name"])].filter(Boolean).join(" ") || firstDefined(profile, ["username"], username);
//   const location = [firstDefined(tuition, ["city"]), firstDefined(tuition, ["district"]), firstDefined(tuition, ["state"])].filter(Boolean).join(", ");
//   const subjects = firstDefined(tuition, ["teachingSubjects", "teaching_subjects"]);
//   const languages = firstDefined(tuition, ["languages"]);
//   const shareUrl = typeof window !== "undefined" ? window.location.href : "";

//   const setTab = (tab) => {
//     setActiveTab(tab);
//     fetchSection(tab);
//   };

//   const copyLink = async () => {
//     try {
//       await navigator.clipboard.writeText(shareUrl);
//       setCopyMessage("Link copied");
//     } catch {
//       setCopyMessage(shareUrl);
//     }
//     setTimeout(() => setCopyMessage(""), 2500);
//   };

//   const sectionContent = useMemo(() => {
//     if (activeTab === "tuition") return "tuition";
//     if (activeTab === "batches") return "batches";
//     if (activeTab === "achievements") return "achievements";
//     return "overview";
//   }, [activeTab]);

//   if (loading) {
//     return <div className={`${pageClass} flex items-center justify-center px-5`}><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-500"/><p className="mt-4 text-sm text-tf-copy">Loading tutor website…</p></div></div>;
//   }

//   if (error || !website) {
//     return <main className={`${pageClass} flex items-center justify-center px-5 py-16`}><div className="w-full max-w-lg rounded-2xl border border-blue-200 dark:border-blue-500/15 bg-tf-surface p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-2xl text-red-700 dark:text-red-300">!</div><h1 className="mt-4 text-xl font-bold">Tutor website unavailable</h1><p className="mt-2 text-sm leading-6 text-tf-copy">{error || "This tutor profile may not exist or may not be public."}</p><button type="button" onClick={fetchWebsite} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Try again</button><div><Link to="/" className="mt-4 inline-block text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">Go to TutorFolio</Link></div></div></main>;
//   }

//   return (
//     <div className={pageClass}>
//       <header className="sticky top-0 z-20 border-b border-tf-line bg-tf-surface-soft/90 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
//           <Link to="/" className="flex items-center gap-3"><img src="/tf-logo.png" alt="TutorFolio" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span className="font-semibold tracking-tight">TutorFolio</span></Link>
//           <div className="flex items-center gap-2"><button type="button" onClick={copyLink} className="rounded-xl border border-blue-200 dark:border-blue-500/20 px-3 py-2 text-xs font-semibold text-tf-copy hover:bg-blue-50 dark:hover:bg-blue-500/10 sm:px-4 sm:text-sm"><span className="hidden sm:inline">Share profile</span><span className="sm:hidden">Share</span></button><Link to="/signup?role=tutor" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white text-tf-ink hover:bg-blue-500 sm:px-4 sm:text-sm">Join TutorFolio</Link></div>
//         </div>
//         {copyMessage && <div className="mx-auto max-w-6xl px-5 pb-2 text-right text-xs text-blue-700 dark:text-blue-300 sm:px-8">{copyMessage}</div>}
//       </header>

//       <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
//         <section className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-500/15 bg-gradient-to-br from-tf-sky via-tf-surface to-tf-surface p-5 sm:p-9">
//           <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-50 dark:bg-blue-500/10 blur-3xl"/>
//           <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
//             <Avatar src={firstDefined(profile, ["profilePicture", "profile_picture", "profilepicture", "profilePhoto", "profile_photo", "avatar"])} name={name} />
//             <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Tutor portfolio</p><h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1><p className="mt-2 break-words text-sm text-tf-copy">@{firstDefined(profile, ["username"], username)}</p>{firstDefined(profile, ["qualification"]) && <p className="mt-3 text-sm font-medium text-tf-copy">{firstDefined(profile, ["qualification"])}</p>}{location && <p className="mt-2 flex items-center gap-2 text-sm text-tf-copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{location}</p>}</div>
//             <div className="grid grid-cols-2 gap-3 sm:min-w-[200px] sm:grid-cols-1">{firstDefined(profile, ["teachingYOE", "teaching_yoe"]) !== "" && <div className="rounded-xl border border-tf-line bg-tf-surface-soft/70 p-3"><p className="text-xs text-tf-muted">Teaching experience</p><p className="mt-1 font-semibold text-tf-ink">{firstDefined(profile, ["teachingYOE", "teaching_yoe"])} years</p></div>}{firstDefined(profile, ["averageRating", "average_rating"]) !== "" && <div className="rounded-xl border border-tf-line bg-tf-surface-soft/70 p-3"><p className="text-xs text-tf-muted">Average rating</p><p className="mt-1 font-semibold text-tf-ink">★ {Number(firstDefined(profile, ["averageRating", "average_rating"], 0)).toFixed(1)}{firstDefined(profile, ["totalReviews", "total_reviews"]) !== "" ? ` · ${firstDefined(profile, ["totalReviews", "total_reviews"])} reviews` : ""}</p></div>}</div>
//           </div>
//         </section>

//         <nav aria-label="Tutor website sections" className="sticky top-[65px] z-10 -mx-1 my-5 flex gap-1 overflow-x-auto rounded-2xl border border-tf-line bg-tf-surface/95 p-1.5 backdrop-blur-xl sm:top-[73px] sm:my-7">
//           {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setTab(tab.id)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20" : "text-tf-copy hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-tf-ink"}`}>{tab.label}</button>)}
//         </nav>
//         {sectionLoading && <p className="mb-4 text-xs text-blue-700 dark:text-blue-300">Refreshing {activeTab} section…</p>}
//         {sectionErrors[activeTab] && <p className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/15 bg-amber-50 dark:bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">{sectionErrors[activeTab]} Showing the available public data.</p>}

//         {sectionContent === "overview" && <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
//           <section className={`${sectionClass} lg:col-span-2`}><SectionHeading eyebrow="About" title="A little about the tutor" description="Get to know the teacher and their approach."/><p className="whitespace-pre-line text-sm leading-7 text-tf-copy">{firstDefined(profile, ["about", "description"], "This tutor hasn't added an introduction yet.")}</p>{firstDefined(profile, ["webURL", "webUrl", "website"]) && <a href={firstDefined(profile, ["webURL", "webUrl", "website"])} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 break-all text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">Visit personal website ↗</a>}</section>
//           <section className={sectionClass}><SectionHeading eyebrow="Teaching" title="At a glance"/><div className="grid grid-cols-1 gap-3"><Detail label="Tuition / coaching" value={firstDefined(tuition, ["tuitionName", "tuitionClassName", "name"], "Not provided")}/><Detail label="Subjects" value={subjects}/><Detail label="Languages" value={languages}/><Detail label="Eligible classes" value={firstDefined(tuition, ["eligibleClasses", "eligible_classes"])}/><Detail label="Established" value={firstDefined(tuition, ["establishedYear", "established_year"])}/></div></section>
//           <section className={`${sectionClass} lg:col-span-3`}><SectionHeading eyebrow="Highlights" title="Teaching and services" description="Subjects, services and other details shared by this tutor."/><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><div><p className="mb-3 text-sm font-semibold text-tf-copy">Subjects</p>{subjects ? <TextList value={subjects}/> : <p className="text-sm text-tf-muted">No subjects listed yet.</p>}</div><div><p className="mb-3 text-sm font-semibold text-tf-copy">Services</p>{firstDefined(tuition, ["services"]) ? <TextList value={firstDefined(tuition, ["services"])}/> : <p className="text-sm text-tf-muted">No services listed yet.</p>}</div></div></section>
//           <section className={sectionClass}><SectionHeading eyebrow="Portfolio" title="Achievements" description="Public achievement stories and student feedback."/>{achievements.length ? <div className="space-y-3">{achievements.slice(0, 3).map((item, index) => <div key={item.achievementId ?? item.id ?? index} className="rounded-xl border border-tf-line bg-tf-surface-soft p-4"><p className="font-semibold text-tf-ink">{firstDefined(item, ["title"], "Achievement")}</p><p className="mt-1 line-clamp-3 text-sm leading-6 text-tf-copy">{firstDefined(item, ["description", "studentReview"], "")}</p></div>)}<button type="button" onClick={() => setTab("achievements")} className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">View all achievements →</button></div> : <p className="text-sm leading-6 text-tf-muted">No public achievements have been added yet.</p>}</section>
//           <section className={sectionClass}><SectionHeading eyebrow="Classes" title="Available batches" description="Explore the batches the tutor has made public."/>{batches.length ? <div className="space-y-3">{batches.slice(0, 3).map((batch, index) => <div key={batch.batchId ?? batch.id ?? index} className="rounded-xl border border-tf-line bg-tf-surface-soft p-4"><p className="font-semibold text-tf-ink">{firstDefined(batch, ["title", "batchName"], "Batch")}</p><p className="mt-1 text-xs text-tf-copy">{firstDefined(batch, ["batchType", "session"], "Class")}{firstDefined(batch, ["eligibleClasses"]) ? ` · ${batch.eligibleClasses}` : ""}</p></div>)}<button type="button" onClick={() => setTab("batches")} className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">View all batches →</button></div> : <p className="text-sm leading-6 text-tf-muted">No public batches are available right now.</p>}</section>
//         </div>}

//         {sectionContent === "tuition" && <section className={sectionClass}><SectionHeading eyebrow="Tuition details" title={firstDefined(tuition, ["tuitionName", "tuitionClassName", "name"], "Tuition information")} description="Details and teaching information shared publicly by this tutor."/><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Owner / tutor" value={firstDefined(tuition, ["owners", "owner"])}/><Detail label="Established year" value={firstDefined(tuition, ["establishedYear", "established_year"])}/><Detail label="Languages" value={languages}/><Detail label="Subjects" value={subjects}/><Detail label="Eligible classes" value={firstDefined(tuition, ["eligibleClasses", "eligible_classes"])}/><Detail label="Services" value={firstDefined(tuition, ["services"])}/><Detail label="City" value={firstDefined(tuition, ["city"])}/><Detail label="District" value={firstDefined(tuition, ["district"])}/><Detail label="State" value={firstDefined(tuition, ["state"])}/></div>{firstDefined(tuition, ["description"]) && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold text-tf-ink">About this tuition</h3><p className="whitespace-pre-line text-sm leading-7 text-tf-copy">{firstDefined(tuition, ["description"])}</p></div>}{firstDefined(tuition, ["tags"]) && <div className="mt-5"><p className="mb-3 text-sm font-semibold text-tf-ink">Tags</p><TextList value={firstDefined(tuition, ["tags"])}/></div>}</section>}

//         {sectionContent === "batches" && <section className={sectionClass}><SectionHeading eyebrow="Classes" title="Available batches" description="Only batches returned by the public website API are shown here."/>{batches.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{batches.map((batch, index) => <article key={batch.batchId ?? batch.id ?? index} className="rounded-2xl border border-tf-line bg-tf-surface-soft p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-tf-ink">{firstDefined(batch, ["title", "batchName"], "Batch")}</h3><span className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs text-blue-800 dark:text-blue-200">{firstDefined(batch, ["batchType", "session"], "Class")}</span></div>{firstDefined(batch, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-tf-copy">{firstDefined(batch, ["description"])}</p>}<div className="mt-4 grid grid-cols-2 gap-3"><Detail label="Eligible classes" value={firstDefined(batch, ["eligibleClasses", "eligible_classes"])}/><Detail label="Fee" value={firstDefined(batch, ["fee"]) ? `₹${firstDefined(batch, ["fee"])}` : "Not listed"}/><Detail label="Payment" value={firstDefined(batch, ["paymentType", "payment_type"])}/><Detail label="Session" value={firstDefined(batch, ["session"])}/><Detail label="Starts" value={firstDefined(batch, ["startOn", "start_on"])}/><Detail label="Ends" value={firstDefined(batch, ["endOn", "end_on"])}/></div></article>)}</div> : <EmptyState title="No public batches yet" body="This tutor hasn't published any batches on their website."/>}</section>}

//         {sectionContent === "achievements" && <section className={sectionClass}><SectionHeading eyebrow="Tutor portfolio" title="Achievements & student stories" description="Public achievements and testimonials shared by the tutor."/>{achievements.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{achievements.map((item, index) => <article key={item.achievementId ?? item.id ?? index} className="rounded-2xl border border-tf-line bg-tf-surface-soft p-5"><div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold text-tf-ink">{firstDefined(item, ["title"], "Achievement")}</h3>{firstDefined(item, ["studentRating", "rating"]) && <span className="shrink-0 rounded-lg bg-amber-100 dark:bg-amber-400/10 px-2.5 py-1 text-sm text-amber-800 dark:text-amber-200">★ {firstDefined(item, ["studentRating", "rating"])}</span>}</div>{firstDefined(item, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-tf-copy">{firstDefined(item, ["description"])}</p>}{firstDefined(item, ["studentReview"]) && <blockquote className="mt-4 rounded-xl border-l-2 border-blue-500/50 bg-tf-surface p-4 text-sm italic leading-6 text-tf-copy">“{firstDefined(item, ["studentReview"])}”{firstDefined(item, ["studentName"]) && <footer className="mt-2 text-xs not-italic text-tf-muted">— {firstDefined(item, ["studentName"])}</footer>}</blockquote>}{firstDefined(item, ["tags"]) && <div className="mt-4"><TextList value={firstDefined(item, ["tags"])}/></div>}</article>)}</div> : <EmptyState title="No public achievements yet" body="Achievements will appear here when the tutor publishes them to their portfolio."/>}</section>}

//         <footer className="mt-8 border-t border-tf-line pt-6 text-center text-xs text-tf-muted">Published with TutorFolio <span className="mx-1">·</span> A portfolio for tutors and educators</footer>
//       </main>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import VisitorChatWidget from "../../components/VisitorChatWidget";

const pageClass = "min-h-screen bg-tf-bg text-tf-ink";
const sectionClass = "rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-7";
const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tuition", label: "Tuition" },
  { id: "batches", label: "Batches" },
  { id: "achievements", label: "Achievements" },
];

function unwrap(body) {
  let value = body?.data ?? body?.details ?? body ?? {};
  // Some API responses wrap details inside another data/details object.
  for (let i = 0; i < 2; i += 1) {
    if (value && !Array.isArray(value) && typeof value === "object" && (value.data || value.details)) {
      value = value.data ?? value.details;
    } else break;
  }
  return value;
}

function firstDefined(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "") return source[key];
  }
  return fallback;
}

function firstObject(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  }
  return {};
}

function firstArray(source, keys) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) return source[key];
  }
  return [];
}

function normalizeWebsite(root) {
  const profile = firstObject(root, ["profile", "tutor", "tutorProfile", "personalDetails", "personal_details", "profileDetails"]) || {};
  const tuition = firstObject(root, ["tuition", "tuitionDetails", "tuition_details", "tuitionInformation"]) || {};
  const achievements = firstArray(root, ["achievements", "studentAchievements", "visibleAchievements"]);
  const batches = firstArray(root, ["batches", "tuitionBatches", "visibleBatches"]);
  return { profile, tuition, achievements, batches };
}

function Avatar({ src, name, size = "h-24 w-24" }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "T").trim().charAt(0).toUpperCase() || "T";
  if (src && !failed) return <img src={src} alt={name || "Tutor"} onError={() => setFailed(true)} className={`${size} rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-tf-surface-soft object-cover shadow-xl shadow-black/20`} />;
  return <div className={`${size} flex items-center justify-center rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-3xl font-bold text-blue-700 dark:text-blue-300`}>{initial}</div>;
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">{eyebrow}</p><h2 className="mt-2 text-xl font-bold text-tf-ink sm:text-2xl">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-tf-copy">{description}</p>}</div>;
}

function Detail({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return <div className="rounded-xl border border-tf-line bg-tf-surface-soft p-3.5"><p className="text-xs text-tf-muted">{label}</p><p className="mt-1.5 whitespace-pre-line break-words text-sm font-medium text-tf-ink">{String(value)}</p></div>;
}

function TextList({ value }) {
  if (!value) return null;
  const items = Array.isArray(value) ? value : String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  return <div className="flex flex-wrap gap-2">{items.map((item, index) => <span key={`${item}-${index}`} className="rounded-full border border-blue-200 dark:border-blue-500/15 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs text-blue-800 dark:text-blue-100">{typeof item === "string" || typeof item === "number" ? item : item.name || item.title || JSON.stringify(item)}</span>)}</div>;
}

function EmptyState({ title, body }) {
  return <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-500/15 px-5 py-10 text-center"><p className="font-semibold text-tf-copy">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-tf-muted">{body}</p></div>;
}

export default function PublicTutorWebsite() {
  const { username = "" } = useParams();
  const [website, setWebsite] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [copyMessage, setCopyMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const visitRecordedRef = useRef(new Set());

  const fetchWebsite = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/website/u/${encodeURIComponent(username)}`, { timeout: 20000 });
      const body = response?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || "Tutor website could not be found.");
      const root = unwrap(body);
      const normalized = normalizeWebsite(root);
      // Handle APIs that return the tutor fields at the root instead of under profile.
      if (!Object.keys(normalized.profile).length && (root.username || root.firstName || root.profilePicture)) normalized.profile = root;
      setWebsite({ ...normalized, raw: root });
    } catch (err) {
      setWebsite(null);
      setError(err?.response?.data?.message || err.message || "Unable to load this tutor website.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) fetchWebsite();
  }, [fetchWebsite, username]);

  const fetchSection = useCallback(async (sectionId) => {
    if (!username || sectionId === "overview") return;
    setSectionLoading(true);
    setSectionErrors((previous) => ({ ...previous, [sectionId]: "" }));
    try {
      const response = await api.get(`/website/u/${encodeURIComponent(username)}/${sectionId}`, { timeout: 15000 });
      const body = response?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || `Unable to load ${sectionId}.`);
      const result = unwrap(body);
      setWebsite((previous) => {
        if (!previous) return previous;
        const next = { ...previous };
        if (sectionId === "tuition") {
          const sectionObject = firstObject(result, ["tuition", "tuitionDetails", "tuition_details"]);
          next.tuition = Object.keys(sectionObject).length ? sectionObject : result;
        } else if (sectionId === "batches") {
          next.batches = Array.isArray(result) ? result : firstArray(result, ["batches", "tuitionBatches", "visibleBatches", "details"]);
        } else if (sectionId === "achievements") {
          next.achievements = Array.isArray(result) ? result : firstArray(result, ["achievements", "studentAchievements", "visibleAchievements", "details"]);
        }
        return next;
      });
    } catch (err) {
      // Keep the complete website payload visible as a fallback if a section endpoint fails.
      setSectionErrors((previous) => ({ ...previous, [sectionId]: err?.response?.data?.message || err.message || `Unable to refresh ${sectionId}.` }));
    } finally {
      setSectionLoading(false);
    }
  }, [username]);

  const profile = website?.profile ?? {};
  const tuition = website?.tuition ?? {};
  const achievements = website?.achievements ?? [];
  const batches = website?.batches ?? [];
  const name = [firstDefined(profile, ["firstName", "first_name"]), firstDefined(profile, ["lastName", "last_name"])].filter(Boolean).join(" ") || firstDefined(profile, ["username"], username);
  const location = [firstDefined(tuition, ["city"]), firstDefined(tuition, ["district"]), firstDefined(tuition, ["state"])].filter(Boolean).join(", ");
  const subjects = firstDefined(tuition, ["teachingSubjects", "teaching_subjects"]);
  const languages = firstDefined(tuition, ["languages"]);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const tutorId = Number(firstDefined(profile, ["userId", "user_id", "userid", "tutorId", "tutor_id"], 0)) || null;

  // Record a public portfolio visit at most once every 10 minutes per tutor.
  // An in-memory ref guards against duplicate calls within the same session;
  // localStorage persists the cooldown across page reloads.
  const VISIT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
  useEffect(() => {
    if (!website || !tutorId || visitRecordedRef.current.has(tutorId)) return;
    const storageKey = `tutorfolio:visit-ts:${tutorId}`;
    try {
      const lastVisit = Number(localStorage.getItem(storageKey) || 0);
      if (Date.now() - lastVisit < VISIT_COOLDOWN_MS) return; // still within cooldown
      localStorage.setItem(storageKey, String(Date.now()));
    } catch { /* localStorage unavailable – fall through and record the visit */ }
    visitRecordedRef.current.add(tutorId);
    let referrer = null;
    try { referrer = document.referrer || null; } catch { /* non-browser renderer */ }
    api.post("/notifications/visit", { tutorId, referrer }, { timeout: 10000 })
      .catch((err) => console.warn("Could not record tutor website visit", err));
  }, [website, tutorId]);

  const setTab = (tab) => {
    setActiveTab(tab);
    fetchSection(tab);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("Link copied");
    } catch {
      setCopyMessage(shareUrl);
    }
    setTimeout(() => setCopyMessage(""), 2500);
  };

  const sectionContent = useMemo(() => {
    if (activeTab === "tuition") return "tuition";
    if (activeTab === "batches") return "batches";
    if (activeTab === "achievements") return "achievements";
    return "overview";
  }, [activeTab]);

  if (loading) {
    return <div className={`${pageClass} flex items-center justify-center px-5`}><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-500"/><p className="mt-4 text-sm text-tf-copy">Loading tutor website…</p></div></div>;
  }

  if (error || !website) {
    return <main className={`${pageClass} flex items-center justify-center px-5 py-16`}><div className="w-full max-w-lg rounded-2xl border border-blue-200 dark:border-blue-500/15 bg-tf-surface p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-2xl text-red-700 dark:text-red-300">!</div><h1 className="mt-4 text-xl font-bold">Tutor website unavailable</h1><p className="mt-2 text-sm leading-6 text-tf-copy">{error || "This tutor profile may not exist or may not be public."}</p><button type="button" onClick={fetchWebsite} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Try again</button><div><Link to="/" className="mt-4 inline-block text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">Go to TutorFolio</Link></div></div></main>;
  }

  return (
    <div className={pageClass}>
      <header className="sticky top-0 z-20 border-b border-tf-line bg-tf-surface-soft/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3"><img src="/tf-logo.png" alt="TutorFolio" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span className="font-semibold tracking-tight">TutorFolio</span></Link>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setChatOpen(true)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm">Contact tutor</button><button type="button" onClick={copyLink} className="rounded-xl border border-blue-200 dark:border-blue-500/20 px-3 py-2 text-xs font-semibold text-tf-copy hover:bg-blue-50 dark:hover:bg-blue-500/10 sm:px-4 sm:text-sm"><span className="hidden sm:inline">Share profile</span><span className="sm:hidden">Share</span></button><Link to="/signup?role=tutor" className="hidden rounded-xl border border-blue-200 dark:border-blue-500/20 px-3 py-2 text-xs font-semibold text-tf-copy hover:bg-blue-50 dark:hover:bg-blue-500/10 sm:inline-flex sm:px-4 sm:text-sm">Join TutorFolio</Link></div>
        </div>
        {copyMessage && <div className="mx-auto max-w-6xl px-5 pb-2 text-right text-xs text-blue-700 dark:text-blue-300 sm:px-8">{copyMessage}</div>}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-500/15 bg-gradient-to-br from-tf-sky via-tf-surface to-tf-surface p-5 sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-50 dark:bg-blue-500/10 blur-3xl"/>
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Avatar src={firstDefined(profile, ["profilePicture", "profile_picture", "profilepicture", "profilePhoto", "profile_photo", "avatar"])} name={name} />
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Tutor portfolio</p><h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1><p className="mt-2 break-words text-sm text-tf-copy">@{firstDefined(profile, ["username"], username)}</p>{firstDefined(profile, ["qualification"]) && <p className="mt-3 text-sm font-medium text-tf-copy">{firstDefined(profile, ["qualification"])}</p>}{location && <p className="mt-2 flex items-center gap-2 text-sm text-tf-copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{location}</p>}</div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[200px] sm:grid-cols-1">{firstDefined(profile, ["teachingYOE", "teaching_yoe"]) !== "" && <div className="rounded-xl border border-tf-line bg-tf-surface-soft/70 p-3"><p className="text-xs text-tf-muted">Teaching experience</p><p className="mt-1 font-semibold text-tf-ink">{firstDefined(profile, ["teachingYOE", "teaching_yoe"])} years</p></div>}{firstDefined(profile, ["averageRating", "average_rating"]) !== "" && <div className="rounded-xl border border-tf-line bg-tf-surface-soft/70 p-3"><p className="text-xs text-tf-muted">Average rating</p><p className="mt-1 font-semibold text-tf-ink">★ {Number(firstDefined(profile, ["averageRating", "average_rating"], 0)).toFixed(1)}{firstDefined(profile, ["totalReviews", "total_reviews"]) !== "" ? ` · ${firstDefined(profile, ["totalReviews", "total_reviews"])} reviews` : ""}</p></div>}</div>
          </div>
        </section>

        <nav aria-label="Tutor website sections" className="sticky top-[65px] z-10 -mx-1 my-5 flex gap-1 overflow-x-auto rounded-2xl border border-tf-line bg-tf-surface/95 p-1.5 backdrop-blur-xl sm:top-[73px] sm:my-7">
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setTab(tab.id)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20" : "text-tf-copy hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-tf-ink"}`}>{tab.label}</button>)}
        </nav>
        {sectionLoading && <p className="mb-4 text-xs text-blue-700 dark:text-blue-300">Refreshing {activeTab} section…</p>}
        {sectionErrors[activeTab] && <p className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/15 bg-amber-50 dark:bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">{sectionErrors[activeTab]} Showing the available public data.</p>}

        {sectionContent === "overview" && <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className={`${sectionClass} lg:col-span-2`}><SectionHeading eyebrow="About" title="A little about the tutor" description="Get to know the teacher and their approach."/><p className="whitespace-pre-line text-sm leading-7 text-tf-copy">{firstDefined(profile, ["about", "description"], "This tutor hasn't added an introduction yet.")}</p>{firstDefined(profile, ["webURL", "webUrl", "website"]) && <a href={firstDefined(profile, ["webURL", "webUrl", "website"])} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 break-all text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">Visit personal website ↗</a>}</section>
          <section className={sectionClass}><SectionHeading eyebrow="Teaching" title="At a glance"/><div className="grid grid-cols-1 gap-3"><Detail label="Tuition / coaching" value={firstDefined(tuition, ["tuitionName", "tuitionClassName", "name"], "Not provided")}/><Detail label="Subjects" value={subjects}/><Detail label="Languages" value={languages}/><Detail label="Eligible classes" value={firstDefined(tuition, ["eligibleClasses", "eligible_classes"])}/><Detail label="Established" value={firstDefined(tuition, ["establishedYear", "established_year"])}/></div></section>
          <section className={`${sectionClass} lg:col-span-3`}><SectionHeading eyebrow="Highlights" title="Teaching and services" description="Subjects, services and other details shared by this tutor."/><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><div><p className="mb-3 text-sm font-semibold text-tf-copy">Subjects</p>{subjects ? <TextList value={subjects}/> : <p className="text-sm text-tf-muted">No subjects listed yet.</p>}</div><div><p className="mb-3 text-sm font-semibold text-tf-copy">Services</p>{firstDefined(tuition, ["services"]) ? <TextList value={firstDefined(tuition, ["services"])}/> : <p className="text-sm text-tf-muted">No services listed yet.</p>}</div></div></section>
          <section className={sectionClass}><SectionHeading eyebrow="Portfolio" title="Achievements" description="Public achievement stories and student feedback."/>{achievements.length ? <div className="space-y-3">{achievements.slice(0, 3).map((item, index) => { const photo = firstDefined(item, ["achievementImageUrl", "achievement_image_url", "imageUrl", "image_url", "achievementImage", "achievementimage"]); return <div key={item.achievementId ?? item.id ?? index} className="rounded-xl border border-tf-line bg-tf-surface-soft p-4">{photo && <img src={photo} alt={`Achievement: ${firstDefined(item, ["title"], "Achievement")}`} className="mb-3 max-h-52 w-full rounded-lg object-cover" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<p className="font-semibold text-tf-ink">{firstDefined(item, ["title"], "Achievement")}</p><p className="mt-1 line-clamp-3 text-sm leading-6 text-tf-copy">{firstDefined(item, ["description", "studentReview"], "")}</p></div>;})}<button type="button" onClick={() => setTab("achievements")} className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">View all achievements →</button></div> : <p className="text-sm leading-6 text-tf-muted">No public achievements have been added yet.</p>}</section>
          <section className={sectionClass}><SectionHeading eyebrow="Classes" title="Available batches" description="Explore the batches the tutor has made public."/>{batches.length ? <div className="space-y-3">{batches.slice(0, 3).map((batch, index) => { const image = firstDefined(batch, ["imageUrl", "imageurl", "image_url", "batchImage", "batchimage", "batch_image", "batchImageUrl", "batch_image_url", "image"]); return <div key={batch.batchId ?? batch.id ?? index} className="rounded-xl border border-tf-line bg-tf-surface-soft p-4">{image && <img src={image} alt={`Batch: ${firstDefined(batch, ["title", "batchName"], "Batch")}`} className="mb-3 max-h-52 w-full rounded-lg object-cover" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<p className="font-semibold text-tf-ink">{firstDefined(batch, ["title", "batchName"], "Batch")}</p><p className="mt-1 text-xs text-tf-copy">{firstDefined(batch, ["batchType", "session"], "Class")}{firstDefined(batch, ["eligibleClasses"]) ? ` · ${batch.eligibleClasses}` : ""}</p></div>;})}<button type="button" onClick={() => setTab("batches")} className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">View all batches →</button></div> : <p className="text-sm leading-6 text-tf-muted">No public batches are available right now.</p>}</section>
        </div>}

        {sectionContent === "tuition" && <section className={sectionClass}><SectionHeading eyebrow="Tuition details" title={firstDefined(tuition, ["tuitionName", "tuitionClassName", "name"], "Tuition information")} description="Details and teaching information shared publicly by this tutor."/>{firstDefined(tuition, ["logo", "logoUrl", "logo_url"]) && <img src={firstDefined(tuition, ["logo", "logoUrl", "logo_url"])} alt={`${firstDefined(tuition, ["tuitionName", "tuitionClassName", "name"], "Tuition")} logo`} className="mb-5 max-h-36 max-w-full rounded-xl object-contain" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Owner / tutor" value={firstDefined(tuition, ["owners", "owner"])}/><Detail label="Established year" value={firstDefined(tuition, ["establishedYear", "established_year"])}/><Detail label="Languages" value={languages}/><Detail label="Subjects" value={subjects}/><Detail label="Eligible classes" value={firstDefined(tuition, ["eligibleClasses", "eligible_classes"])}/><Detail label="Services" value={firstDefined(tuition, ["services"])}/><Detail label="City" value={firstDefined(tuition, ["city"])}/><Detail label="District" value={firstDefined(tuition, ["district"])}/><Detail label="State" value={firstDefined(tuition, ["state"])}/></div>{firstDefined(tuition, ["description"]) && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold text-tf-ink">About this tuition</h3><p className="whitespace-pre-line text-sm leading-7 text-tf-copy">{firstDefined(tuition, ["description"])}</p></div>}{firstDefined(tuition, ["tags"]) && <div className="mt-5"><p className="mb-3 text-sm font-semibold text-tf-ink">Tags</p><TextList value={firstDefined(tuition, ["tags"])}/></div>}</section>}

        {sectionContent === "batches" && <section className={sectionClass}><SectionHeading eyebrow="Classes" title="Available batches" description="Only batches returned by the public website API are shown here."/>{batches.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{batches.map((batch, index) => { const image = firstDefined(batch, ["imageUrl", "imageurl", "image_url", "batchImage", "batchimage", "batch_image", "batchImageUrl", "batch_image_url", "image"]); return <article key={batch.batchId ?? batch.id ?? index} className="rounded-2xl border border-tf-line bg-tf-surface-soft p-5">{image && <img src={image} alt={`Batch: ${firstDefined(batch, ["title", "batchName"], "Batch")}`} className="mb-4 max-h-56 w-full rounded-xl object-cover" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-tf-ink">{firstDefined(batch, ["title", "batchName"], "Batch")}</h3><span className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs text-blue-800 dark:text-blue-200">{firstDefined(batch, ["batchType", "session"], "Class")}</span></div>{firstDefined(batch, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-tf-copy">{firstDefined(batch, ["description"])}</p>}<div className="mt-4 grid grid-cols-2 gap-3"><Detail label="Eligible classes" value={firstDefined(batch, ["eligibleClasses", "eligible_classes"])}/><Detail label="Fee" value={firstDefined(batch, ["fee"]) ? `₹${firstDefined(batch, ["fee"])}` : "Not listed"}/><Detail label="Payment" value={firstDefined(batch, ["paymentType", "payment_type"])}/><Detail label="Session" value={firstDefined(batch, ["session"])}/><Detail label="Starts" value={firstDefined(batch, ["startOn", "start_on"])}/><Detail label="Ends" value={firstDefined(batch, ["endOn", "end_on"])}/></div></article>;})}</div> : <EmptyState title="No public batches yet" body="This tutor hasn't published any batches on their website."/>}</section>}

        {sectionContent === "achievements" && <section className={sectionClass}><SectionHeading eyebrow="Tutor portfolio" title="Achievements & student stories" description="Public achievements and testimonials shared by the tutor."/>{achievements.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{achievements.map((item, index) => { const photo = firstDefined(item, ["achievementImageUrl", "achievement_image_url", "imageUrl", "image_url", "achievementImage", "achievementimage"]); const studentPhoto = firstDefined(item, ["studentImageUrl", "student_image_url", "studentImage", "studentimage"]); return <article key={item.achievementId ?? item.id ?? index} className="rounded-2xl border border-tf-line bg-tf-surface-soft p-5">{photo && <img src={photo} alt={`Achievement: ${firstDefined(item, ["title"], "Achievement")}`} className="mb-4 max-h-64 w-full rounded-xl object-cover" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3">{studentPhoto && <img src={studentPhoto} alt={firstDefined(item, ["studentName"], "Student")} className="h-11 w-11 shrink-0 rounded-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<h3 className="text-lg font-semibold text-tf-ink">{firstDefined(item, ["title"], "Achievement")}</h3></div>{firstDefined(item, ["studentRating", "rating"]) && <span className="shrink-0 rounded-lg bg-amber-100 dark:bg-amber-400/10 px-2.5 py-1 text-sm text-amber-800 dark:text-amber-200">★ {firstDefined(item, ["studentRating", "rating"])}</span>}</div>{firstDefined(item, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-tf-copy">{firstDefined(item, ["description"])}</p>}{firstDefined(item, ["studentReview"]) && <blockquote className="mt-4 rounded-xl border-l-2 border-tf-blue/50 bg-tf-surface p-4 text-sm italic leading-6 text-tf-copy">“{firstDefined(item, ["studentReview"])}”{firstDefined(item, ["studentName"]) && <footer className="mt-2 text-xs not-italic text-tf-muted">— {firstDefined(item, ["studentName"])}</footer>}</blockquote>}{firstDefined(item, ["tags"]) && <div className="mt-4"><TextList value={firstDefined(item, ["tags"])}/></div>}</article>;})}</div> : <EmptyState title="No public achievements yet" body="Achievements will appear here when the tutor publishes them to their portfolio."/>}</section>}

        <footer className="mt-8 border-t border-tf-line pt-6 text-center text-xs text-tf-muted">Published with TutorFolio <span className="mx-1">·</span> A portfolio for tutors and educators <span className="mx-1">·</span> <button type="button" onClick={() => setChatOpen(true)} className="font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">Contact this tutor</button></footer>
      </main>
      <VisitorChatWidget tutorId={tutorId} tutorName={name} open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
