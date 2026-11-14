import React from "react";
import { Link } from "react-router-dom";

const setupSteps = [
  {
    title: "Add your details",
    text: "Set your username in Settings, then add your photo, introduction, qualifications, subjects, classes, teaching location, and public contact details.",
    links: [["Settings", "/settings"], ["Profile", "/profile"], ["Tuition details", "/tuition"]],
  },
  {
    title: "Add what you teach",
    text: "Add your experience and batches. Include clear dates, fees, seat limits, and descriptions so families know what to expect.",
    links: [["Experience", "/experience"], ["Batches", "/batches"]],
  },
  {
    title: "Prepare your website",
    text: "Upload gallery images, add student achievements, and answer common questions. Use visibility switches on batches, experience, achievements, and FAQs to choose what appears publicly.",
    links: [["Gallery", "/gallery"], ["Achievements", "/achievements"], ["FAQs", "/faq"]],
  },
  {
    title: "Preview and publish",
    text: "In Website Settings, preview themes before applying one. Using a theme updates your live website. If asked, request a six digit code there and verify your account email first. Theme availability can depend on your plan.",
    links: [["Website settings", "/website"]],
  },
];

const featureCards = [
  ["Dashboard", "See student and seat totals, occupancy, batches, projected fees, achievements, conversations, notifications, and visits. Refresh after making changes.", "/dashboard"],
  ["Conversations", "Open a visitor’s chat to read and reply. You can change its status, mark it read, or remove it.", "/conversations"],
  ["Notifications and visits", "Review new activity, filter notifications, mark items read, and see visits to your public website.", "/notifications"],
  ["Discover tutors", "Search tutor profiles, refine results with filters, and open a quick view or full portfolio.", "/discover-tutors"],
  ["Plans and billing", "Compare available plans, check your current subscription, and view or print receipts for completed payments.", "/subscription"],
  ["Report an issue", "Send the team the page name, what you did, and what you expected to happen.", "/report-bug"],
];

const questions = [
  ["How do I share my website?", "Open Website Settings and use Copy link. You need a username to get your website URL."],
  ["What is the difference between Preview and Use theme?", "Preview opens a sample of your website without changing its current theme. Use theme applies that design to your live website."],
  ["Why can’t I apply a theme?", "Verify your account email using the notice in Website Settings. Some themes may also require a plan that includes them. You can preview themes before verifying."],
  ["Why is an item missing from my website?", "Check that it was saved and, where a visibility switch is available, set it to Visible on website. Then refresh the public page."],
  ["What does occupancy mean?", "It is the number of allotted seats compared with the total seats in your batches. Remaining seats are total capacity minus allotted seats."],
  ["Are achievement ratings the same as public reviews?", "No. Student achievement ratings describe success stories. Public review ratings come from reviews on your tutor website."],
  ["Why hasn’t my dashboard changed?", "Refresh the dashboard to load the latest figures. Projected revenue is an estimate based on batch enrolments and fees."],
  ["How do I update my login email or password?", "Open Settings. Email changes require verifying the code sent to the new address; password changes are also managed there."],
];

function GuideSection({ title, children, id }) {
  return <section id={id} className="scroll-mt-24"><h2 className="mb-4 text-xl font-bold text-tf-ink sm:text-2xl">{title}</h2>{children}</section>;
}

export default function Guide() {
  return (
    <main className="mobile-guide mx-auto max-w-6xl space-y-8 p-4 pb-16 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-tf-line bg-tf-surface p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-tf-blue">TutorFolio guide</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-tf-ink sm:text-3xl">Set up and manage your tutor website</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-tf-copy">A quick guide to publishing your teaching information, helping students find you, and managing messages and billing.</p>
      </header>

      <GuideSection id="publish" title="Get your website ready">
        <ol className="grid gap-3 sm:grid-cols-2">
          {setupSteps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-tf-line bg-tf-surface p-4 sm:p-5">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-tf-sky text-sm font-bold text-tf-blue">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-tf-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-tf-copy">{step.text}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {step.links.map(([label, path]) => <Link key={path} to={path} className="text-sm font-semibold text-tf-blue hover:underline">{label} →</Link>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </GuideSection>

      <GuideSection id="features" title="What you can do">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map(([title, text, path]) => (
            <article key={title} className="flex flex-col rounded-2xl border border-tf-line bg-tf-surface p-4 sm:p-5">
              <h3 className="font-semibold text-tf-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-5 text-tf-copy">{text}</p>
              <Link to={path} className="mt-3 text-sm font-semibold text-tf-blue hover:underline">Open {title} →</Link>
            </article>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="questions" title="Common questions">
        <div className="divide-y divide-tf-line overflow-hidden rounded-2xl border border-tf-line bg-tf-surface px-4 sm:px-6">
          {questions.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-tf-ink">
                {question}<span aria-hidden="true" className="shrink-0 text-xl font-normal text-tf-blue group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-3xl text-sm leading-5 text-tf-copy">{answer}</p>
            </details>
          ))}
        </div>
      </GuideSection>

      <aside className="rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-6">
        <h2 className="text-lg font-bold text-tf-ink">Still need help?</h2>
        <p className="mt-1 text-sm leading-5 text-tf-copy">Report what happened and which page you were using. Leave out passwords and payment details.</p>
        <Link to="/report-bug" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-tf-blue px-4 py-2 text-sm font-semibold text-tf-on-primary hover:bg-tf-blue-pressed">Report an issue</Link>
      </aside>
    </main>
  );
}
