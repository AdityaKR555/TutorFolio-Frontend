import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Globe2, GraduationCap, Layers3, Menu, MessageSquare, Mouse, Search, Sparkles, X } from "lucide-react";
import FeaturedTutors from "./components/FeaturedTutors";
import LandingScene from "./components/LandingScene";
import HeroTutor from "./components/HeroTutor";
import LiquidCursor from "./components/LiquidCursor";
import useLandingChoreography from "./components/useLandingChoreography";
import "./landing.css";
import "./landing-motion.css";

const FEATURES = [
  { icon: GraduationCap, title: "Your story, beautifully told.", text: "Bring your qualifications, experience and achievements together in a portfolio that feels like you.", label: "01 / YOUR IDENTITY" },
  { icon: Layers3, title: "A little more organised.", text: "Give your subjects, classes and batches a home. Help students see what you teach and when you teach it.", label: "02 / YOUR CLASSROOM" },
  { icon: MessageSquare, title: "Make the first hello easy.", text: "Let students and parents send enquiries straight from your page. Keep the conversation going in one place.", label: "03 / YOUR CONNECTIONS" },
];
const TABS = [
  { name: "Your profile", title: "A first impression that feels like you.", text: "Introduce your teaching approach, highlight your experience and let your qualifications speak for themselves.", focus: "profile" },
  { name: "Your classroom", title: "Everything you teach. One clear view.", text: "Show your subjects, class levels and batch timings, so students can find the right fit before reaching out.", focus: "batches" },
  { name: "Your connections", title: "From a shared link to a conversation.", text: "Give interested students and parents a direct way to enquire. Manage the next steps from your TutorFolio dashboard.", focus: "contact" },
];
const NAV = [["website", "Your website"], ["discover", "For students"], ["how-it-works", "How it works"]];

function useLandingMotion(ref, paused) {
  useLandingChoreography(ref, paused);

  useEffect(() => {
    const root = ref.current;
    const elements = root?.querySelectorAll("[data-reveal]");
    if (!elements?.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          if (entry.target.dataset.reveal !== "card") observer.unobserve(entry.target);
        } else if (entry.target.dataset.reveal === "card") {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.12 });
    const observe = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("[data-reveal]")) observer.observe(node);
      node.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    };
    root.classList.add("motion-ready");
    elements.forEach((element) => observer.observe(element));
    // Tutor cards arrive asynchronously; give them the same scroll entrance.
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(observe));
    });
    mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); root.classList.remove("motion-ready"); };
  }, [ref]);
}

function Brand() {
  return <a href="#top" className="lp-brand lp-brand-original" aria-label="TutorFolio home"><img src="/tf-logo.png" alt="" width="1375" height="1144" /><span>TutorFolio</span></a>;
}
function PrimaryLink({ children = "Create your free website", className = "" }) {
  return <Link className={`lp-button lp-button-primary ${className}`} to="/signup">{children}<ArrowUpRight size={18} /></Link>;
}
function Eyebrow({ children, light = false }) {
  return <p className={`lp-eyebrow${light ? " lp-eyebrow-light" : ""}`}><span />{children}</p>;
}
function Navigation() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector("a")?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
      if (event.key === "Tab") {
        const links = [...menuRef.current.querySelectorAll("a")];
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); toggleRef.current?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); toggleRef.current?.focus(); }
        else if (document.activeElement === toggleRef.current) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      }
    };
    const resize = () => { if (innerWidth > 800) setOpen(false); };
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", keydown); window.removeEventListener("resize", resize); };
  }, [open]);
  return <header className="lp-header"><div className="lp-nav lp-container"><Brand /><nav aria-label="Primary navigation">{NAV.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav><div className="lp-nav-actions"><Link to="/login" className="lp-login">Log in</Link><PrimaryLink className="lp-nav-cta">Get started <span className="lp-free">it’s free</span></PrimaryLink><button ref={toggleRef} className="lp-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="landing-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></div>{open && <nav ref={menuRef} id="landing-menu" className="lp-mobile-menu" aria-label="Mobile navigation">{NAV.map(([id, title]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{title}<ArrowUpRight /></a>)}<Link to="/login">Log in<ArrowUpRight /></Link><PrimaryLink /></nav>}</header>;
}

function PortfolioPreview({ focus, compact = false, theme = "sage" }) {
  return <div className={`lp-portfolio ${compact ? "lp-portfolio-compact" : ""}`} data-preview-theme={theme} aria-label="Illustrative tutor website preview">
    <div className="lp-browser-bar"><span className="lp-browser-dots"><i /><i /><i /></span><span><Globe2 size={11} /> tutorfolio · ananya-sharma</span><ArrowUpRight size={12} /></div>
    <div className="lp-site-nav"><span>ananya<span>sharma.</span></span><span>About <span>Classes</span> Contact</span></div>
    <div className={`lp-demo-intro ${focus === "profile" ? "lp-highlight" : ""}`}><div><span className="lp-demo-kicker">MATHEMATICS EDUCATOR</span><h3>A little curiosity.<br />A world of <em>possibility.</em></h3><p>Helping students find confidence in every concept, one lesson at a time.</p><span className="lp-demo-button">Let’s learn together <ArrowUpRight size={11} /></span></div><div className="lp-demo-art" aria-hidden="true"><div className="lp-art-orbit" /><span className="lp-art-equation">x² + y²</span><span className="lp-art-pi">π</span><div className="lp-art-sphere" /><span className="lp-art-plus">+</span><span className="lp-art-name">ANANYA SHARMA</span></div></div>
    <div className="lp-demo-stats"><span><strong>Mathematics</strong>Subject expertise</span><span><strong>Classes 9–12</strong>Build your foundations</span><span><strong>Online & in person</strong>Learn your way</span></div>
    <div className={`lp-demo-batches ${focus === "batches" ? "lp-highlight" : ""}`}><div><span className="lp-demo-kicker">A SPACE TO GROW</span><h4>Find your next class.</h4></div><div className="lp-demo-class"><span className="lp-class-icon"><BookOpen size={17} /></span><span><strong>Class 10 Mathematics</strong><small>Mon · Wed · Fri / 5:00 PM</small></span><ArrowUpRight size={15} /></div></div>
    <div className={`lp-demo-contact ${focus === "contact" ? "lp-highlight" : ""}`}><span>Big questions start with a simple hello.</span><span>Get in touch <ArrowUpRight size={11} /></span></div>
  </div>;
}
const PREVIEW_THEMES = [
  { id: "sage", name: "Sage", color: "#819b7b" },
  { id: "midnight", name: "Midnight", color: "#233d66" },
  { id: "studio", name: "Studio", color: "#c47a56" },
];

function ThemePreview({ paused, active, setActive }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const ref = useRef(null);
  const autoplay = !paused && !reduced && !hovered && visible && pageVisible;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % PREVIEW_THEMES.length), 6500);
    return () => window.clearTimeout(timer);
  }, [active, autoplay, setActive]);

  return (
    <div ref={ref} className="lp-theme-demo" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}>
      <div className="lp-preview-tilt">
        <div className="lp-theme-stack">
          {PREVIEW_THEMES.map((theme, index) => (
            <div key={theme.id} className={`lp-theme-layer ${active === index ? "is-active" : ""}`} aria-hidden={active !== index}>
              <PortfolioPreview theme={theme.id} />
            </div>
          ))}
        </div>
      </div>
      <div className="lp-theme-controls" data-autoplay={autoplay} role="group" aria-label="Choose a website preview theme">
        <span className="lp-theme-label"><Layers3 size={12} /> A style for your story</span>
        <div className="lp-theme-options">
          {PREVIEW_THEMES.map((theme, index) => (
            <button key={theme.id} type="button" aria-label={`Preview ${theme.name} theme`} aria-pressed={active === index} onClick={() => setActive(index)} style={{ "--theme-swatch": theme.color }}>
              <span className="lp-theme-swatch">{active === index && <Check size={9} />}</span>{theme.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ paused }) {
  const [activeTheme, setActiveTheme] = useState(0);
  return <section className="lp-hero" id="top"><div className="lp-hero-grid" aria-hidden="true" /><div className="lp-container lp-hero-layout"><div className="lp-hero-copy"><div className="lp-enter" style={{ "--delay": "0ms" }}><Eyebrow>FOR THE TEACHERS WHO MAKE A DIFFERENCE</Eyebrow></div><h1 aria-label="Great teaching. Meet your next chapter."><span className="lp-title-mask"><span className="lp-title-line" style={{ "--line": 0 }}>Great teaching.</span></span><span className="lp-title-mask"><span className="lp-title-line" style={{ "--line": 1 }}>Meet your</span></span><span className="lp-title-mask lp-title-mask-last"><span className="lp-title-line" style={{ "--line": 2 }}><span className="lp-heading-blue">next chapter<svg viewBox="0 0 440 20" fill="none" aria-hidden="true"><path d="M3 13C103 1 289 1 436 10M42 18C183 6 316 8 400 14" /></svg></span><span className="lp-period">.</span></span></span></h1><p className="lp-hero-description lp-enter" style={{ "--delay": "200ms" }}>You bring the knowledge. We give it a home.<br className="lp-desktop-break" /> Create your own teaching website, get discovered,<br className="lp-desktop-break" /> and turn first impressions into new connections.</p><div className="lp-hero-buttons lp-enter" style={{ "--delay": "300ms" }}><PrimaryLink /><a href="#website" className="lp-text-link">Take a look around <ArrowRight size={16} /></a></div><div className="lp-hero-notes lp-enter" style={{ "--delay": "400ms" }}><span><Check size={14} /> Free to get started</span><span><Check size={14} /> No coding needed</span><span><Check size={14} /> Made for educators</span></div></div><div className="lp-hero-visual lp-enter" style={{ "--delay": "250ms" }}><LandingScene paused={paused} theme={PREVIEW_THEMES[activeTheme].id} /><HeroTutor paused={paused} /><div className="lp-orbit-line" aria-hidden="true" /><div className="lp-preview-float"><ThemePreview paused={paused} active={activeTheme} setActive={setActiveTheme} /></div><div className="lp-enquiry"><span className="lp-enquiry-icon"><MessageSquare size={21} /></span><div><span className="lp-enquiry-title">A new connection begins</span><p>“Hello! Is your maths batch open?”</p><small>ILLUSTRATIVE ENQUIRY</small></div><span className="lp-enquiry-dot" /></div><div className="lp-visual-caption"><span /> A little preview of what could be yours.</div></div></div><div className="lp-container lp-hero-bottom"><span>A WEBSITE OF YOUR OWN. A WORLD OF POSSIBILITIES.</span><a href="#possibilities">Scroll to explore <Mouse size={16} /><ChevronDown size={12} /></a></div></section>;
}
function FeatureArtwork({ index }) {
  return <div className={`lp-feature-visual lp-feature-visual-${index}`} aria-hidden="true"><div className="lp-feature-art-grid" /><div className="lp-art-ground" />{index === 0 ? <div className="lp-identity-art"><div className="lp-mini-profile lp-art-depth-back"><span className="lp-mini-avatar">AS</span><div><i /><i /><i /></div></div><div className="lp-mini-certificate lp-art-depth-front"><GraduationCap size={22} /><span>Made of experience.</span><div className="lp-mini-seal"><Check size={11} /></div></div><span className="lp-art-chip">Your story, in focus.</span></div> : index === 1 ? <div className="lp-classroom-art"><div className="lp-art-book lp-art-book-one"><span>Mathematics</span><i /></div><div className="lp-art-book lp-art-book-two"><span>A little curiosity.</span><BookOpen size={24} /></div><div className="lp-art-book lp-art-book-three"><span>Room to grow.</span><i /></div><span className="lp-art-orbit-dot" /></div> : <div className="lp-connection-art"><div className="lp-art-message lp-art-message-back"><span className="lp-mini-avatar">AS</span><i /><i /></div><div className="lp-art-message lp-art-message-front"><MessageSquare size={20} /><span>It starts with hello.</span><span className="lp-art-message-dot" /></div><span className="lp-art-notification"><Check size={12} /></span><div className="lp-art-message-orbit" /></div>}</div>;
}
function Possibilities() {
  return <section className="lp-section lp-container" id="possibilities"><div className="lp-section-heading" data-reveal><div><Eyebrow>MORE THAN A PROFILE</Eyebrow><h2>Your teaching has a story.<br /><span className="lp-muted-heading">Give it a place to shine.</span></h2></div><p>From the first introduction to the next enquiry,<br className="lp-desktop-break" /> make every part of your teaching easier to find.</p></div><div className="lp-feature-grid">{FEATURES.map(({ icon: Icon, title, text, label }, i) => <div className="lp-card-stage" data-motion-card key={title} style={{ "--reveal-delay": `${i * 110}ms` }}><article className="lp-feature-card" data-reveal="card"><FeatureArtwork index={i} /><div className="lp-feature-copy"><div className={`lp-feature-icon lp-feature-icon-${i}`}><Icon size={20} strokeWidth={1.5} /></div><p className="lp-card-label">{label}</p><h3>{title}</h3><p>{text}</p><a href={i === 2 ? "#discover" : "#website"} aria-label={`Explore ${title.toLowerCase()}`} className="lp-card-arrow"><ArrowUpRight size={20} /></a></div></article></div>)}</div></section>;
}
function Website() {
  const [active, setActive] = useState(0);
  return <section className="lp-showcase" id="website"><div className="lp-container lp-showcase-layout"><div className="lp-showcase-copy" data-reveal><Eyebrow>YOUR OWN LITTLE CORNER</Eyebrow><h2>Made for your craft.<br /><span className="lp-muted-heading">Designed to be yours.</span></h2><p>A professional website that brings your teaching to life. Your story, your classes, your way.</p><div className="lp-tabs" role="tablist" aria-label="Explore your tutor website">{TABS.map((tab, i) => <button type="button" role="tab" id={`website-tab-${i}`} aria-selected={active === i} aria-controls={`website-panel-${i}`} tabIndex={active === i ? 0 : -1} key={tab.name} onClick={() => setActive(i)} onKeyDown={(event) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (active + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length; setActive(next); document.getElementById(`website-tab-${next}`)?.focus(); } }}>{tab.name}</button>)}</div>{TABS.map((tab, i) => <div key={tab.name} id={`website-panel-${i}`} role="tabpanel" aria-labelledby={`website-tab-${i}`} hidden={active !== i} className="lp-tab-panel"><h3>{tab.title}</h3><p>{tab.text}</p></div>)}<PrimaryLink>Make it yours</PrimaryLink></div><div className="lp-showcase-stage" data-motion-panel><div className="lp-showcase-visual" data-reveal><div className="lp-showcase-backdrop" /><PortfolioPreview focus={TABS[active].focus} compact /><span className="lp-preview-caption">Illustrative website · Your page uses your own details</span></div></div></div></section>;
}
function Discovery() {
  return <section id="discover" className="lp-section lp-container lp-discovery-layout"><div className="lp-discovery-art" data-motion-panel data-reveal><div className="lp-search-demo"><div className="lp-search-input"><Search size={18} /><span>Find your next maths mentor</span><span className="lp-search-enter"><ArrowRight size={14} /></span></div><div className="lp-search-tags"><span>Mathematics</span><span>Class 10</span><span>Online</span></div><div className="lp-search-profile"><span className="lp-search-avatar">AS</span><div><h3>Ananya Sharma</h3><p>Mathematics educator</p><span>Classes 9–12 · Online & in person</span></div><span className="lp-search-profile-arrow"><ArrowUpRight size={20} /></span></div><div className="lp-search-placeholder" aria-hidden="true"><span /><div><i /><i /></div></div><span className="lp-demo-label">ILLUSTRATIVE DISCOVERY PREVIEW</span></div><div className="lp-discovery-sticker"><Sparkles size={20} /><span>The right teacher.<br /><strong>A new possibility.</strong></span></div></div><div className="lp-discovery-copy" data-reveal><Eyebrow>GOOD TEACHING DESERVES TO BE FOUND</Eyebrow><h2>Someone’s next<br /><span className="lp-heading-blue">“I finally get it.”</span><br />could start with you.</h2><p>Students search for subjects. Parents look for confidence. Your TutorFolio page helps them discover the teacher behind both.</p><a href="#meet-tutors" className="lp-text-link">Meet the educators <ArrowRight size={17} /></a></div></section>;
}
function HowItWorks() {
  return <section id="how-it-works" className="lp-how"><div className="lp-container"><div className="lp-how-heading" data-reveal><Eyebrow light>SMALL STEPS. NEW POSSIBILITIES.</Eyebrow><h2>Your next chapter,<br /><span>in three simple steps.</span></h2><p>Less time figuring out websites. More time doing what you love.</p></div><div className="lp-steps">{[["01", "Make yourself at home.", "Create your free account and introduce the educator behind the lessons.", GraduationCap], ["02", "Bring your story to life.", "Add your subjects, experience, achievements and the classes you offer.", BookOpen], ["03", "Put yourself out there.", "Share your website, get discovered and start conversations with students.", Globe2]].map(([number, title, text, Icon], i) => <article key={number} data-motion-card data-reveal="card" style={{ "--reveal-delay": `${i * 160}ms` }}><div className="lp-step-top"><span>{number}</span><Icon size={26} strokeWidth={1.3} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}
function Faq() {
  return <section className="lp-section lp-container lp-faq"><div data-reveal><Eyebrow>A LITTLE CLARITY</Eyebrow><h2>Good questions.<br /><span className="lp-muted-heading">Simple answers.</span></h2><div className="lp-faq-graphic"><img src="/illustrations/landing-questions.svg" alt="An open book surrounded by floating questions and ideas" width="440" height="265" loading="lazy" /><span className="lp-faq-spark lp-faq-spark-one" aria-hidden="true">✦</span><span className="lp-faq-spark lp-faq-spark-two" aria-hidden="true">✧</span><p>A little curiosity opens a lot of doors.</p></div></div><div className="lp-faq-items" data-reveal>{[["Do I need to know how to code?", "No. Add your teaching details through your TutorFolio dashboard. Your website brings them together for you."], ["Can I start for free?", "Yes. TutorFolio offers a lifetime free plan with the essentials to create and manage your tutor website. You can explore additional features in your dashboard."], ["How do students get in touch?", "Students and parents can send an enquiry from your tutor page. You can view and respond to conversations from your dashboard."], ["Can I update my website later?", "Yes. Update your profile, experience, subjects, batches and achievements as your teaching journey grows."]].map(([question, answer]) => <details key={question}><summary>{question}<span><ChevronDown size={18} /></span></summary><p>{answer}</p></details>)}</div></section>;
}
function Closing() {
  return <section className="lp-closing"><div className="lp-closing-orbit" aria-hidden="true" /><div className="lp-container" data-reveal><Eyebrow>YOUR KNOWLEDGE CAN GO FURTHER</Eyebrow><h2>You inspire possibilities.<br /><span className="lp-heading-blue">Let’s open a few for you.</span></h2><p>A website of your own. A fresh start for what’s next.</p><PrimaryLink /><span className="lp-closing-note">Free to start. Yours to make.</span></div></section>;
}
export default function Home() {
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);
  useLandingMotion(ref, paused);
  return <div ref={ref} className={`lp ${paused ? "lp-motion-paused" : ""}`}><a href="#main-content" className="lp-skip">Skip to content</a><LiquidCursor paused={paused} /><div className="lp-scroll-progress" aria-hidden="true" /><Navigation /><main id="main-content"><Hero paused={paused} /><Possibilities /><Website /><Discovery /><div className="lp-featured-wrap" data-reveal><FeaturedTutors /></div><HowItWorks /><Faq /><Closing /></main><footer className="lp-footer lp-container"><div><Brand /><p>A home for your knowledge.<br />Made for educators. Made in India.</p></div><nav aria-label="Footer navigation"><a href="#website">Your website</a><a href="#discover">For students</a><Link to="/login">Log in</Link><Link to="/signup">Get started <ArrowUpRight size={14} /></Link></nav><div className="lp-footer-bottom"><span>© {new Date().getFullYear()} TutorFolio. All rights reserved.</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}><span className={`lp-motion-indicator ${paused ? "is-paused" : ""}`} />{paused ? "Motion paused" : "Motion on"}</button><a href="#top">Back to top ↑</a></div></footer></div>;
}
