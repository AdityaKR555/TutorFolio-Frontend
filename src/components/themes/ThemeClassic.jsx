import React, { useState } from "react";

// ── Inline helpers ────────────────────────────────────────────────────────────
function fd(src, keys, fb = "") {
  for (const k of keys) { if (src?.[k] != null && src?.[k] !== "") return src[k]; }
  return fb;
}
function ta(src, keys) {
  for (const k of keys) { if (Array.isArray(src?.[k])) return src[k]; }
  return [];
}
function chips(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : String(value).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "T").trim().charAt(0).toUpperCase();
  if (src && !failed)
    return <img src={src} alt={name || "Tutor"} onError={() => setFailed(true)}
      className="h-24 w-24 rounded-3xl border-2 border-blue-200 bg-blue-50 object-cover shadow-xl" />;
  return <div className="h-24 w-24 flex items-center justify-center rounded-3xl border-2 border-blue-200 bg-blue-100 text-3xl font-bold text-blue-700">{initial}</div>;
}

function Chip({ label }) {
  return <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-800">{label}</span>;
}

function Detail({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-sm font-medium text-slate-800">{String(value)}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold text-slate-800 sm:text-2xl">{title}</h2>
      {description && <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-blue-200 px-5 py-10 text-center">
      <p className="font-semibold text-slate-600">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tuition", label: "Tuition" },
  { id: "batches", label: "Batches" },
  { id: "achievements", label: "Achievements" },
];

const card = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm";

// ── Overview section ──────────────────────────────────────────────────────────
function OverviewSection({ profile, tuition, achievements, batches, onTabChange }) {
  const subjects = fd(tuition, ["teachingSubjects", "teaching_subjects"]);
  const services = fd(tuition, ["services"]);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* About */}
      <section className={`${card} lg:col-span-2`}>
        <SectionHeading eyebrow="About" title="A little about the tutor" description="Get to know the teacher and their approach." />
        <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
          {fd(profile, ["about", "description"], "This tutor hasn't added an introduction yet.")}
        </p>
        {fd(profile, ["webURL", "webUrl", "website"]) && (
          <a href={fd(profile, ["webURL", "webUrl", "website"])} target="_blank" rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 break-all text-sm text-blue-600 hover:text-blue-800">
            Visit personal website ↗
          </a>
        )}
      </section>

      {/* At a glance */}
      <section className={card}>
        <SectionHeading eyebrow="Teaching" title="At a glance" />
        <div className="grid gap-3">
          <Detail label="Tuition / coaching" value={fd(tuition, ["tuitionName", "tuitionClassName", "name"], "Not provided")} />
          <Detail label="Location" value={location || undefined} />
          <Detail label="Subjects" value={subjects} />
          <Detail label="Languages" value={fd(tuition, ["languages"])} />
          <Detail label="Eligible classes" value={fd(tuition, ["eligibleClasses", "eligible_classes"])} />
          <Detail label="Established" value={fd(tuition, ["establishedYear", "established_year"])} />
        </div>
      </section>

      {/* Subjects & services */}
      <section className={`${card} lg:col-span-3`}>
        <SectionHeading eyebrow="Highlights" title="Teaching and services" description="Subjects, services and other details shared by this tutor." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Subjects</p>
            {chips(subjects).length
              ? <div className="flex flex-wrap gap-2">{chips(subjects).map((s, i) => <Chip key={i} label={s} />)}</div>
              : <p className="text-sm text-slate-400">No subjects listed yet.</p>}
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Services</p>
            {chips(services).length
              ? <div className="flex flex-wrap gap-2">{chips(services).map((s, i) => <Chip key={i} label={s} />)}</div>
              : <p className="text-sm text-slate-400">No services listed yet.</p>}
          </div>
        </div>
      </section>

      {/* Achievement previews */}
      <section className={card}>
        <SectionHeading eyebrow="Portfolio" title="Achievements" description="Public achievement stories and student feedback." />
        {achievements.length ? (
          <div className="space-y-3">
            {achievements.slice(0, 3).map((item, i) => (
              <div key={item.achievementId ?? item.id ?? i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">{fd(item, ["title"], "Achievement")}</p>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">{fd(item, ["description", "studentReview"], "")}</p>
              </div>
            ))}
            <button type="button" onClick={() => onTabChange("achievements")} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              View all achievements →
            </button>
          </div>
        ) : <p className="text-sm leading-6 text-slate-400">No public achievements added yet.</p>}
      </section>

      {/* Batch previews */}
      <section className={card}>
        <SectionHeading eyebrow="Classes" title="Available batches" description="Explore the batches the tutor has made public." />
        {batches.length ? (
          <div className="space-y-3">
            {batches.slice(0, 3).map((batch, i) => (
              <div key={batch.batchId ?? batch.id ?? i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">{fd(batch, ["title", "batchName"], "Batch")}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {fd(batch, ["batchType", "session"], "Class")}
                  {fd(batch, ["eligibleClasses"]) ? ` · ${batch.eligibleClasses}` : ""}
                </p>
              </div>
            ))}
            <button type="button" onClick={() => onTabChange("batches")} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              View all batches →
            </button>
          </div>
        ) : <p className="text-sm leading-6 text-slate-400">No public batches available right now.</p>}
      </section>
    </div>
  );
}

// ── Tuition section ───────────────────────────────────────────────────────────
function TuitionSection({ tuition }) {
  const subjects = fd(tuition, ["teachingSubjects", "teaching_subjects"]);
  const services = fd(tuition, ["services"]);
  return (
    <section className={card}>
      <SectionHeading eyebrow="Tuition details"
        title={fd(tuition, ["tuitionName", "tuitionClassName", "name"], "Tuition information")}
        description="Details and teaching information shared publicly by this tutor." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Owner / tutor" value={fd(tuition, ["owners", "owner"])} />
        <Detail label="Established year" value={fd(tuition, ["establishedYear", "established_year"])} />
        <Detail label="Languages" value={fd(tuition, ["languages"])} />
        <Detail label="Subjects" value={subjects} />
        <Detail label="Eligible classes" value={fd(tuition, ["eligibleClasses", "eligible_classes"])} />
        <Detail label="Services" value={services} />
        <Detail label="City" value={fd(tuition, ["city"])} />
        <Detail label="District" value={fd(tuition, ["district"])} />
        <Detail label="State" value={fd(tuition, ["state"])} />
      </div>
      {fd(tuition, ["description"]) && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">About this tuition</h3>
          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{fd(tuition, ["description"])}</p>
        </div>
      )}
      {chips(fd(tuition, ["tags"])).length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-slate-800">Tags</p>
          <div className="flex flex-wrap gap-2">{chips(fd(tuition, ["tags"])).map((t, i) => <Chip key={i} label={t} />)}</div>
        </div>
      )}
    </section>
  );
}

// ── Batches section ───────────────────────────────────────────────────────────
function BatchesSection({ batches }) {
  if (!batches.length) return (
    <section className={card}>
      <SectionHeading eyebrow="Classes" title="Available batches" />
      <EmptyState title="No public batches yet" body="This tutor hasn't published any batches on their website." />
    </section>
  );
  return (
    <section className={card}>
      <SectionHeading eyebrow="Classes" title="Available batches" description="Only batches returned by the public website API are shown here." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {batches.map((batch, i) => (
          <article key={batch.batchId ?? batch.id ?? i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">{fd(batch, ["title", "batchName"], "Batch")}</h3>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs text-blue-700">{fd(batch, ["batchType", "session"], "Class")}</span>
            </div>
            {fd(batch, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{fd(batch, ["description"])}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Detail label="Eligible classes" value={fd(batch, ["eligibleClasses", "eligible_classes"])} />
              <Detail label="Fee" value={fd(batch, ["fee"]) ? `₹${fd(batch, ["fee"])}` : "Not listed"} />
              <Detail label="Payment" value={fd(batch, ["paymentType", "payment_type"])} />
              <Detail label="Session" value={fd(batch, ["session"])} />
              <Detail label="Starts" value={fd(batch, ["startOn", "start_on"])} />
              <Detail label="Ends" value={fd(batch, ["endOn", "end_on"])} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Achievements section ──────────────────────────────────────────────────────
function AchievementsSection({ achievements }) {
  if (!achievements.length) return (
    <section className={card}>
      <SectionHeading eyebrow="Tutor portfolio" title="Achievements & student stories" />
      <EmptyState title="No public achievements yet" body="Achievements will appear here when the tutor publishes them to their portfolio." />
    </section>
  );
  return (
    <section className={card}>
      <SectionHeading eyebrow="Tutor portfolio" title="Achievements & student stories"
        description="Public achievements and testimonials shared by the tutor." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {achievements.map((item, i) => (
          <article key={item.achievementId ?? item.id ?? i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-800">{fd(item, ["title"], "Achievement")}</h3>
              {fd(item, ["studentRating", "rating"]) &&
                <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-sm text-amber-800">★ {fd(item, ["studentRating", "rating"])}</span>}
            </div>
            {fd(item, ["description"]) && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{fd(item, ["description"])}</p>}
            {fd(item, ["studentReview"]) && (
              <blockquote className="mt-4 rounded-xl border-l-4 border-blue-300 bg-white p-4 text-sm italic leading-6 text-slate-500">
                "{fd(item, ["studentReview"])}"
                {fd(item, ["studentName"]) && <footer className="mt-2 text-xs not-italic text-slate-400">— {fd(item, ["studentName"])}</footer>}
              </blockquote>
            )}
            {chips(fd(item, ["tags"])).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">{chips(fd(item, ["tags"])).map((t, j) => <Chip key={j} label={t} />)}</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ThemeClassic({
  profile = {}, tuition = {}, achievements = [], batches = [],
  activeTab = "overview", onTabChange, onContactClick, onCopyLink, copyMessage,
  sectionLoading, sectionErrors = {},
}) {
  const name = [fd(profile, ["firstName", "first_name"]), fd(profile, ["lastName", "last_name"])].filter(Boolean).join(" ")
    || fd(profile, ["username"], "Tutor");
  const avatarSrc = fd(profile, ["profilePicture", "profile_picture", "profilepicture", "profilePhoto", "profile_photo", "avatar"]);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const yoe = fd(profile, ["teachingYOE", "teaching_yoe"]);
  const rating = fd(profile, ["averageRating", "average_rating"]);
  const reviews = fd(profile, ["totalReviews", "total_reviews"]);

  const renderSection = () => {
    if (activeTab === "tuition") return <TuitionSection tuition={tuition} />;
    if (activeTab === "batches") return <BatchesSection batches={batches} />;
    if (activeTab === "achievements") return <AchievementsSection achievements={achievements} />;
    return <OverviewSection profile={profile} tuition={tuition} achievements={achievements} batches={batches} onTabChange={onTabChange} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">TutorFolio</span>
          </a>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onContactClick}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm">
              Contact tutor
            </button>
            <button type="button" onClick={onCopyLink}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:px-4 sm:text-sm">
              <span className="hidden sm:inline">Share profile</span>
              <span className="sm:hidden">Share</span>
            </button>
          </div>
        </div>
        {copyMessage && (
          <div className="mx-auto max-w-6xl px-5 pb-2 text-right text-xs text-blue-600 sm:px-8">{copyMessage}</div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-100 opacity-50 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Avatar src={avatarSrc} name={name} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Tutor portfolio</p>
              <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{name}</h1>
              <p className="mt-1 text-sm text-slate-500">@{fd(profile, ["username"], "tutor")}</p>
              {fd(profile, ["qualification"]) && <p className="mt-2 text-sm font-medium text-slate-600">{fd(profile, ["qualification"])}</p>}
              {location && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {location}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[200px] sm:grid-cols-1">
              {yoe !== "" && yoe != null && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs text-slate-400">Teaching experience</p>
                  <p className="mt-1 font-semibold text-slate-800">{yoe} years</p>
                </div>
              )}
              {rating !== "" && rating != null && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs text-slate-400">Average rating</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    ★ {Number(rating).toFixed(1)}
                    {reviews ? ` · ${reviews} reviews` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Tab nav ── */}
        <nav aria-label="Tutor website sections"
          className="sticky top-[65px] z-10 -mx-1 my-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur-xl sm:top-[73px] sm:my-7">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:bg-blue-50 hover:text-slate-800"}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        {sectionLoading && <p className="mb-4 text-xs text-blue-600">Refreshing {activeTab} section…</p>}
        {sectionErrors[activeTab] && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {sectionErrors[activeTab]} Showing the available public data.
          </p>
        )}

        {renderSection()}

        {/* ── Footer ── */}
        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          Published with <span className="font-semibold text-blue-600">TutorFolio</span> · A portfolio for tutors and educators
        </footer>
      </main>
    </div>
  );
}
