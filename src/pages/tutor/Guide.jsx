import React from "react";
import { Link } from "react-router-dom";

const sections = [
  { id: "start", title: "Get started", steps: [
    ["Complete your profile", "Add your name, photo, qualifications, teaching experience, contact details, and a short introduction.", "/profile", "Edit profile"],
    ["Describe your tuition", "Add subjects, eligible classes, languages, services, location, logo, and search tags.", "/tuition", "Edit tuition details"],
    ["Choose a website theme", "Pick a theme in Website Settings. Open your public link to review how students see your information.", "/website", "Open website settings"],
  ]},
  { id: "content", title: "Build your public website", steps: [
    ["Create batches", "Set the title, type, dates, fee, seats, and description. Use the website visibility switch to control whether a batch is public.", "/batches", "Manage batches"],
    ["Share achievements", "Add a student success story, review, rating, and optional images. Only publish details you have permission to share.", "/achievements", "Manage achievements"],
    ["Answer common questions", "Use FAQs to explain your teaching approach, schedules, enrollment, or other questions families often ask.", "/faq", "Manage FAQs"],
    ["Review your site", "Your public website shows your published information. Use its link to check the desktop and phone layouts, then share it with students.", "/website", "View website link"],
  ]},
  { id: "daily", title: "Manage daily activity", steps: [
    ["Read conversations", "Messages from visitors appear in Conversations. Open a thread to read and reply. Visitors can return using the same browser.", "/conversations", "Open conversations"],
    ["Watch notifications", "The bell in the header shows new activity. Open it when you want to review recent updates.", "/dashboard", "Open dashboard"],
    ["Check your dashboard", "Review batch capacity, student achievements, and activity summaries. Use Refresh when you need the latest figures.", "/dashboard", "Open dashboard"],
    ["Discover tutors", "Search profiles by subject, location, experience, and other filters. Open a portfolio to learn more.", "/discover-tutors", "Discover tutors"],
  ]},
];

const howItWorks = [
  ["Your profile is the source", "Your public website uses the name, introduction, qualifications, contact details, and tuition information saved in your account. Edit those details in Profile and Tuition Details, then refresh the public page to see the latest version."],
  ["Visibility controls publication", "Batches, achievements, and FAQs can be shown or hidden on your website. Hidden items remain in your management pages but are not included in the public website content. Review the visibility setting before sharing a link."],
  ["Themes change presentation", "Website Settings controls which available design your public site uses. A theme changes the layout and appearance; it uses the same saved tutor information. Open View your website after choosing a theme to review the result."],
  ["Messages stay in Conversations", "A visitor starts a conversation from your public website. Their message appears in your Conversations page, where you can reply. The visitor needs the same browser to return to that conversation because its access token is stored there."],
  ["Dashboards summarize saved data", "Dashboard figures are calculated from your batches and achievements. They are a summary of the saved information, including seats and projected fees. Use Refresh when you need a current summary."],
  ["Updates are deliberate", "Most pages load information when opened. If you edit something in another tab or device, refresh the page to see the latest data. Notifications are checked separately."],
];

const platformFaqs = [
  ["How do I find my public website link?", "Open Website Settings. Your website URL appears near the top, with Copy link and View your website actions."],
  ["Why is a batch or achievement missing from my website?", "Check that the item is marked Visible on website. Then refresh your public website. Also confirm that the item was saved successfully."],
  ["Can I change a theme without reentering my content?", "Yes. Themes display your existing profile, tuition, batch, achievement, and FAQ information. Review the new layout after switching."],
  ["How do visitors contact me?", "Visitors can open the TutorFolio messenger from your public website. They can also use contact details you have chosen to publish in your profile."],
  ["Where do I reply to messages?", "Open Conversations from the navigation or the header shortcut. Select a thread, read the visitor's message, and send your reply there."],
  ["Why do dashboard numbers look older than my recent change?", "Refresh the Dashboard after editing a batch or achievement. The summary is loaded when the page opens and when you use Refresh."],
  ["Can I hide an item without deleting it?", "Yes. Use its website visibility control. The item remains available for editing in your management page."],
  ["What should I include in an issue report?", "Include the page name, the steps you took, what you expected, and what appeared instead. Do not include passwords or payment information."],
];

export default function Guide() {
  return <main className="mx-auto max-w-6xl space-y-8 p-4 pb-16 sm:p-6 lg:p-8">
    <header className="rounded-3xl bg-sky-800 px-6 py-9 text-white sm:px-9 sm:py-12 dark:bg-sky-950">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">TutorFolio guide</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make the most of your tutor website</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-100 sm:text-base">Follow these steps to set up your profile, publish your teaching information, and respond to visitors.</p>
    </header>
    <nav aria-label="Guide sections" className="flex flex-wrap gap-2">{sections.map((section) => <a key={section.id} href={`#${section.id}`} className="rounded-full border border-tf-line bg-tf-surface px-4 py-2 text-sm font-medium text-tf-copy hover:border-sky-400 hover:text-tf-ink">{section.title}</a>)}<a href="#how-it-works" className="rounded-full border border-tf-line bg-tf-surface px-4 py-2 text-sm font-medium text-tf-copy hover:border-sky-400 hover:text-tf-ink">How it works</a><a href="#platform-faq" className="rounded-full border border-tf-line bg-tf-surface px-4 py-2 text-sm font-medium text-tf-copy hover:border-sky-400 hover:text-tf-ink">Platform FAQ</a><a href="#help" className="rounded-full border border-tf-line bg-tf-surface px-4 py-2 text-sm font-medium text-tf-copy hover:border-sky-400 hover:text-tf-ink">Get help</a></nav>
    {sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-24"><h2 className="mb-4 text-xl font-bold text-tf-ink sm:text-2xl">{section.title}</h2><div className="grid gap-4 md:grid-cols-2">{section.steps.map(([title, description, path, action], index) => <article key={title} className="rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-6"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{index + 1}</span><div><h3 className="text-base font-semibold text-tf-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-tf-copy">{description}</p><Link to={path} className="mt-4 inline-flex text-sm font-semibold text-tf-blue hover:underline">{action}</Link></div></div></article>)}</div></section>)}
    <section id="how-it-works" className="scroll-mt-24"><h2 className="mb-2 text-xl font-bold text-tf-ink sm:text-2xl">How TutorFolio works</h2><p className="mb-5 max-w-3xl text-sm leading-6 text-tf-copy">Your management pages control the information on your public website and the conversations you have with visitors.</p><div className="grid gap-4 md:grid-cols-2">{howItWorks.map(([title, description]) => <article key={title} className="rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-6"><h3 className="font-semibold text-tf-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-tf-copy">{description}</p></article>)}</div></section>
    <section id="platform-faq" className="scroll-mt-24"><h2 className="mb-2 text-xl font-bold text-tf-ink sm:text-2xl">Platform FAQ</h2><p className="mb-5 text-sm leading-6 text-tf-copy">Quick answers about managing your account and public website.</p><div className="divide-y divide-tf-line overflow-hidden rounded-2xl border border-tf-line bg-tf-surface px-5 sm:px-7">{platformFaqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-tf-ink">{question}<span aria-hidden="true" className="text-xl font-normal text-tf-blue group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-tf-copy">{answer}</p></details>)}</div></section>
    <section id="help" className="scroll-mt-24 rounded-2xl border border-tf-line bg-tf-surface p-6 sm:p-8"><h2 className="text-xl font-bold text-tf-ink">Need help?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-tf-copy">If a page fails to load, refresh it and check your connection. For a product issue, send a report with the page name, what you expected, and what happened. Avoid including passwords or payment details.</p><Link to="/report-bug" className="mt-5 inline-flex rounded-xl bg-tf-blue px-4 py-2.5 text-sm font-semibold text-tf-on-primary hover:bg-tf-blue-pressed">Report an issue</Link></section>
  </main>;
}
