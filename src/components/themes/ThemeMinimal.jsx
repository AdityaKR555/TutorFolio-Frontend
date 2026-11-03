
import React, { useState } from "react";

// ── Inline helpers ──────────────────────────────────────────────

function fd(src, keys, fb = "") {
  for (const k of keys) {
    if (src?.[k] != null && src?.[k] !== "") return src[k];
  }
  return fb;
}

function chips(value) {
  if (!value) return [];
  return Array.isArray(value)
    ? value
    : String(value).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

function Avatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "T").trim().charAt(0).toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Tutor"}
        onError={() => setFailed(true)}
        className="h-24 w-24 rounded-full border border-stone-200 bg-stone-100 object-cover"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-stone-300 bg-stone-100 font-serif text-3xl text-stone-800">
      {initial}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-normal tracking-tight text-stone-900 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  if (!value && value !== 0) return null;

  return (
    <div className="border-b border-stone-200 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-stone-800">
        {String(value)}
      </p>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span className="border border-stone-300 px-3 py-1.5 text-xs text-stone-600">
      {label}
    </span>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="border-y border-stone-200 px-5 py-12 text-center">
      <p className="font-serif text-xl text-stone-700">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-400">
        {body}
      </p>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tuition", label: "Tuition" },
  { id: "batches", label: "Batches" },
  { id: "achievements", label: "Achievements" },
];

// ── Overview section ────────────────────────────────────────────

function OverviewSection({
  profile,
  tuition,
  achievements,
  batches,
  onTabChange,
}) {
  const subjects = fd(tuition, ["teachingSubjects", "teaching_subjects"]);
  const services = fd(tuition, ["services"]);
  const location = [
    fd(tuition, ["city"]),
    fd(tuition, ["district"]),
    fd(tuition, ["state"]),
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <SectionHeading
            eyebrow="Introduction"
            title="A little about me"
            description="My background, experience and approach to teaching."
          />
          <p className="whitespace-pre-line text-sm leading-8 text-stone-600">
            {fd(
              profile,
              ["about", "description"],
              "This tutor hasn't added an introduction yet."
            )}
          </p>

          {fd(profile, ["webURL", "webUrl", "website"]) && (
            <a
              href={fd(profile, ["webURL", "webUrl", "website"])}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block border-b border-stone-400 pb-1 text-xs uppercase tracking-widest text-stone-700 hover:border-stone-900"
            >
              Personal website ↗
            </a>
          )}
        </div>

        <div className="border-t border-stone-200 pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0">
          <p className="mb-5 text-[10px] uppercase tracking-[0.2em] text-stone-400">
            At a glance
          </p>
          <Detail
            label="Tuition"
            value={fd(tuition, ["tuitionName", "tuitionClassName", "name"], "Not provided")}
          />
          <Detail label="Location" value={location} />
          <Detail label="Subjects" value={subjects} />
          <Detail label="Languages" value={fd(tuition, ["languages"])} />
          <Detail
            label="Eligible classes"
            value={fd(tuition, ["eligibleClasses", "eligible_classes"])}
          />
          <Detail
            label="Established"
            value={fd(tuition, ["establishedYear", "established_year"])}
          />
        </div>
      </section>

      <section className="border-t border-stone-200 pt-10">
        <SectionHeading
          eyebrow="What I offer"
          title="Teaching & services"
          description="Subjects and services offered by this tutor."
        />

        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="mb-4 font-serif text-lg text-stone-800">
              Subjects
            </h3>
            {chips(subjects).length ? (
              <div className="flex flex-wrap gap-2">
                {chips(subjects).map((s, i) => (
                  <Chip key={i} label={s} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No subjects listed yet.</p>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg text-stone-800">
              Services
            </h3>
            {chips(services).length ? (
              <div className="flex flex-wrap gap-2">
                {chips(services).map((s, i) => (
                  <Chip key={i} label={s} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No services listed yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-10">
        <SectionHeading
          eyebrow="Portfolio"
          title="Selected achievements"
          description="A glimpse of achievements and student experiences."
        />

        {achievements.length ? (
          <div className="divide-y divide-stone-200">
            {achievements.slice(0, 3).map((item, i) => (
              <article
                key={item.achievementId ?? item.id ?? i}
                className="py-5"
              >
                <h3 className="font-serif text-lg text-stone-800">
                  {fd(item, ["title"], "Achievement")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-stone-500">
                  {fd(item, ["description", "studentReview"], "")}
                </p>
              </article>
            ))}
            <button
              type="button"
              onClick={() => onTabChange("achievements")}
              className="pt-5 text-xs uppercase tracking-widest text-stone-700 hover:text-black"
            >
              View all achievements →
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            No public achievements added yet.
          </p>
        )}
      </section>

      <section className="border-t border-stone-200 pt-10">
        <SectionHeading
          eyebrow="Classes"
          title="Available batches"
          description="Explore the batches currently offered."
        />

        {batches.length ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {batches.slice(0, 3).map((batch, i) => (
              <article
                key={batch.batchId ?? batch.id ?? i}
                className="border-b border-stone-200 pb-5"
              >
                <h3 className="font-serif text-lg text-stone-800">
                  {fd(batch, ["title", "batchName"], "Batch")}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-widest text-stone-400">
                  {fd(batch, ["batchType", "session"], "Class")}
                </p>
                {fd(batch, ["eligibleClasses"]) && (
                  <p className="mt-2 text-sm text-stone-500">
                    {batch.eligibleClasses}
                  </p>
                )}
              </article>
            ))}
            <button
              type="button"
              onClick={() => onTabChange("batches")}
              className="text-left text-xs uppercase tracking-widest text-stone-700 hover:text-black"
            >
              Explore all batches →
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            No public batches available right now.
          </p>
        )}
      </section>
    </div>
  );
}

// ── Tuition section ─────────────────────────────────────────────

function TuitionSection({ tuition }) {
  const subjects = fd(tuition, ["teachingSubjects", "teaching_subjects"]);
  const services = fd(tuition, ["services"]);

  return (
    <section>
      <SectionHeading
        eyebrow="Teaching details"
        title={fd(tuition, ["tuitionName", "tuitionClassName", "name"], "Tuition information")}
        description="More about this tutor's teaching practice."
      />

      <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Owner / tutor" value={fd(tuition, ["owners", "owner"])} />
        <Detail
          label="Established year"
          value={fd(tuition, ["establishedYear", "established_year"])}
        />
        <Detail label="Languages" value={fd(tuition, ["languages"])} />
        <Detail label="Subjects" value={subjects} />
        <Detail
          label="Eligible classes"
          value={fd(tuition, ["eligibleClasses", "eligible_classes"])}
        />
        <Detail label="Services" value={services} />
        <Detail label="City" value={fd(tuition, ["city"])} />
        <Detail label="District" value={fd(tuition, ["district"])} />
        <Detail label="State" value={fd(tuition, ["state"])} />
      </div>

      {fd(tuition, ["description"]) && (
        <div className="mt-10 border-t border-stone-200 pt-8">
          <h3 className="mb-3 font-serif text-xl text-stone-800">
            About this tuition
          </h3>
          <p className="whitespace-pre-line text-sm leading-8 text-stone-600">
            {fd(tuition, ["description"])}
          </p>
        </div>
      )}

      {chips(fd(tuition, ["tags"])).length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {chips(fd(tuition, ["tags"])).map((tag, i) => (
            <Chip key={i} label={tag} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Batches section ─────────────────────────────────────────────

function BatchesSection({ batches }) {
  if (!batches.length) {
    return (
      <section>
        <SectionHeading eyebrow="Classes" title="Available batches" />
        <EmptyState
          title="No public batches yet"
          body="This tutor hasn't published any batches on their website."
        />
      </section>
    );
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Classes"
        title="Available batches"
        description="Explore the classes and learning opportunities offered."
      />

      <div className="divide-y divide-stone-200">
        {batches.map((batch, i) => (
          <article
            key={batch.batchId ?? batch.id ?? i}
            className="grid gap-5 py-7 sm:grid-cols-3"
          >
            <div>
              <h3 className="font-serif text-xl text-stone-900">
                {fd(batch, ["title", "batchName"], "Batch")}
              </h3>
              <p className="mt-2 text-xs uppercase tracking-widest text-stone-400">
                {fd(batch, ["batchType", "session"], "Class")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-5 sm:col-span-2">
              <Detail
                label="Eligible classes"
                value={fd(batch, ["eligibleClasses", "eligible_classes"])}
              />
              <Detail
                label="Fee"
                value={fd(batch, ["fee"]) ? `₹${fd(batch, ["fee"])}` : "Not listed"}
              />
              <Detail
                label="Payment"
                value={fd(batch, ["paymentType", "payment_type"])}
              />
              <Detail label="Session" value={fd(batch, ["session"])} />
              <Detail label="Starts" value={fd(batch, ["startOn", "start_on"])} />
              <Detail label="Ends" value={fd(batch, ["endOn", "end_on"])} />
            </div>

            {fd(batch, ["description"]) && (
              <p className="text-sm leading-7 text-stone-500 sm:col-span-3">
                {fd(batch, ["description"])}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Achievements section ────────────────────────────────────────

function AchievementsSection({ achievements }) {
  if (!achievements.length) {
    return (
      <section>
        <SectionHeading
          eyebrow="Portfolio"
          title="Achievements & student stories"
        />
        <EmptyState
          title="No public achievements yet"
          body="Achievements will appear here when the tutor publishes them."
        />
      </section>
    );
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Portfolio"
        title="Achievements & student stories"
        description="A collection of milestones and student experiences."
      />

      <div className="divide-y divide-stone-200">
        {achievements.map((item, i) => (
          <article
            key={item.achievementId ?? item.id ?? i}
            className="py-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h3 className="font-serif text-xl text-stone-900">
                {fd(item, ["title"], "Achievement")}
              </h3>

              {fd(item, ["studentRating", "rating"]) && (
                <span className="text-sm text-stone-600">
                  ★ {fd(item, ["studentRating", "rating"])}
                </span>
              )}
            </div>

            {fd(item, ["description"]) && (
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-stone-600">
                {fd(item, ["description"])}
              </p>
            )}

            {fd(item, ["studentReview"]) && (
              <blockquote className="mt-5 border-l-2 border-stone-400 pl-5">
                <p className="font-serif text-lg italic leading-8 text-stone-600">
                  "{fd(item, ["studentReview"])}"
                </p>
                {fd(item, ["studentName"]) && (
                  <footer className="mt-3 text-[10px] uppercase tracking-widest text-stone-400">
                    — {fd(item, ["studentName"])}
                  </footer>
                )}
              </blockquote>
            )}

            {chips(fd(item, ["tags"])).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {chips(fd(item, ["tags"])).map((tag, j) => (
                  <Chip key={j} label={tag} />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Main ThemeMinimal component ─────────────────────────────────

export default function ThemeMinimal({
  profile = {},
  tuition = {},
  achievements = [],
  batches = [],
  activeTab = "overview",
  onTabChange,
  onContactClick,
  onCopyLink,
  copyMessage,
  sectionLoading,
  sectionErrors = {},
}) {
  const name =
    [
      fd(profile, ["firstName", "first_name"]),
      fd(profile, ["lastName", "last_name"]),
    ].filter(Boolean).join(" ") ||
    fd(profile, ["username"], "Tutor");

  const avatarSrc = fd(profile, [
    "profilePicture",
    "profile_picture",
    "profilepicture",
    "profilePhoto",
    "profile_photo",
    "avatar",
  ]);

  const location = [
    fd(tuition, ["city"]),
    fd(tuition, ["district"]),
    fd(tuition, ["state"]),
  ].filter(Boolean).join(", ");

  const yoe = fd(profile, ["teachingYOE", "teaching_yoe"]);
  const rating = fd(profile, ["averageRating", "average_rating"]);
  const reviews = fd(profile, ["totalReviews", "total_reviews"]);

  const renderSection = () => {
    if (activeTab === "tuition") {
      return <TuitionSection tuition={tuition} />;
    }

    if (activeTab === "batches") {
      return <BatchesSection batches={batches} />;
    }

    if (activeTab === "achievements") {
      return <AchievementsSection achievements={achievements} />;
    }

    return (
      <OverviewSection
        profile={profile}
        tuition={tuition}
        achievements={achievements}
        batches={batches}
        onTabChange={onTabChange}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#111827]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#FAFAFA]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="/" className="font-serif text-xl tracking-tight text-stone-900">
            TutorFolio<span className="text-stone-400">.</span>
          </a>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onContactClick}
              className="bg-stone-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-stone-700 sm:px-5"
            >
              Contact tutor
            </button>

            <button
              type="button"
              onClick={onCopyLink}
              className="border border-stone-300 px-4 py-2.5 text-xs font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
            >
              <span className="hidden sm:inline">Share profile</span>
              <span className="sm:hidden">Share</span>
            </button>
          </div>
        </div>

        {copyMessage && (
          <div className="mx-auto max-w-6xl px-5 pb-3 text-right text-xs text-stone-500 sm:px-8">
            {copyMessage}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        {/* Hero */}
        <section className="border-b border-stone-300 pb-12 sm:pb-16">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
            <Avatar src={avatarSrc} name={name} />

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-stone-400">
                Tutor portfolio
              </p>

              <h1 className="mt-4 break-words font-serif text-4xl font-normal tracking-tight text-stone-900 sm:text-6xl">
                {name}
              </h1>

              <p className="mt-3 text-sm text-stone-400">
                @{fd(profile, ["username"], "tutor")}
              </p>

              {fd(profile, ["qualification"]) && (
                <p className="mt-3 text-sm text-stone-600">
                  {fd(profile, ["qualification"])}
                </p>
              )}

              {location && (
                <p className="mt-3 text-xs tracking-wide text-stone-500">
                  {location}
                </p>
              )}
            </div>

            <div className="flex gap-8 border-t border-stone-200 pt-5 sm:min-w-[180px] sm:flex-col sm:gap-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              {yoe !== "" && yoe != null && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400">
                    Experience
                  </p>
                  <p className="mt-2 font-serif text-2xl text-stone-900">
                    {yoe} years
                  </p>
                </div>
              )}

              {rating !== "" && rating != null && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400">
                    Average rating
                  </p>
                  <p className="mt-2 font-serif text-2xl text-stone-900">
                    ★ {Number(rating).toFixed(1)}
                  </p>
                  {reviews ? (
                    <p className="mt-1 text-xs text-stone-400">
                      {reviews} reviews
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <nav
          aria-label="Tutor website sections"
          className="sticky top-[65px] z-10 -mx-2 my-8 flex gap-6 overflow-x-auto border-b border-stone-200 bg-[#FAFAFA]/95 px-2 backdrop-blur-xl sm:top-[73px] sm:my-10 sm:gap-10"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative shrink-0 pb-4 text-xs font-medium uppercase tracking-widest transition ${
                activeTab === tab.id
                  ? "text-stone-900 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-stone-900"
                  : "text-stone-400 hover:text-stone-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {sectionLoading && (
          <p className="mb-5 text-xs text-stone-500">
            Refreshing {activeTab} section…
          </p>
        )}

        {sectionErrors[activeTab] && (
          <p className="mb-5 border border-stone-200 bg-stone-100 p-4 text-xs leading-6 text-stone-600">
            {sectionErrors[activeTab]} Showing the available public data.
          </p>
        )}

        {/* Active section */}
        <div className="min-h-[300px]">
          {renderSection()}
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-stone-200 pt-8 text-center">
          <p className="font-serif text-lg text-stone-800">
            TutorFolio<span className="text-stone-400">.</span>
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-stone-400">
            A portfolio for tutors and educators
          </p>
        </footer>
      </main>
    </div>
  );
}
