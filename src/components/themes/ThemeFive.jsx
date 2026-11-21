import { getWebsiteTitle } from "../../utils/websiteIdentity";
import SocialIcon from "../SocialIcon";
import { getTutorNavigationBase } from "../../utils/websiteUrls";
import { getContactActions } from "../../utils/contactIcons";
import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, ArrowDown, ArrowRight, ArrowUpRight, Menu } from "lucide-react";
import TuitionLogo from "./TuitionLogo";
import "./theme-five.css";

const value = (obj, keys, fallback = "") => keys.map((key) => obj?.[key]).find((v) => v !== undefined && v !== null && v !== "") ?? fallback;
const array = (v) => Array.isArray(v) ? v : v ? String(v).split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : [];
const pages = [["home", "Home"], ["about", "About"], ["classes", "Classes"], ["batches", "Batches"], ["achievements", "Achievements"], ["experience", "Experience"], ["gallery", "Gallery"]];

function MotionScene() {
  const host = useRef(null);
  useEffect(() => {
    const container = host.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let disposed = false, frame = 0;
    const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    const pointerSurface = container.parentElement || container;
    const onPointer = (event) => {
      if (event.pointerType !== "mouse") return;
      const rect = pointerSurface.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { target.x = 0; target.y = 0; };
    pointerSurface.addEventListener("pointermove", onPointer);
    pointerSurface.addEventListener("pointerleave", onLeave);

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let width = 0, height = 0;
    const resize = () => {
      if (!container.clientWidth || !container.clientHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Precompute 3D points for kinetic torus knot
    const numPoints = 140;
    const knotPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const u = (i / numPoints) * Math.PI * 4;
      const r = 0.8 + 0.35 * Math.cos(3 * u);
      const x = r * Math.cos(2 * u);
      const y = r * Math.sin(2 * u);
      const z = 0.35 * Math.sin(3 * u);
      knotPoints.push({ x, y, z });
    }

    // Floating orbital satellite spheres
    const satellites = [
      { x: -1.8, y: 1.1, z: 0.2, r: 16, color: "#9da7ff" },
      { x: 1.9, y: -1.2, z: -0.3, r: 14, color: "#d6ff63" },
      { x: 1.6, y: 1.3, z: -0.5, r: 10, color: "#414dff" },
      { x: -1.4, y: -1.4, z: -0.4, r: 12, color: "#ffffff" },
    ];

    container.classList.add("is-ready");

    let angleX = 0, angleY = 0;
    const render = (time) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden) return;

      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;

      angleX = time * 0.0004 + pointer.y * 0.25;
      angleY = time * 0.0006 + pointer.x * 0.35;

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.58;
      const cy = height * 0.48;
      const scale = Math.min(width, height) * 0.32;

      // Project 3D to 2D
      const project = (p) => {
        const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const fov = 3.5;
        const pz = fov / (fov + z2);
        return {
          x: cx + x1 * scale * pz,
          y: cy + y2 * scale * pz,
          z: z2,
          pz,
        };
      };

      // Draw knot ribbon / path with dynamic gradient
      const projected = knotPoints.map(project);

      for (let i = 0; i < projected.length; i++) {
        const next = projected[(i + 1) % projected.length];
        const p = projected[i];
        const alpha = Math.max(0.15, Math.min(0.9, 0.5 + p.z * 0.3));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(next.y ? next.x : p.x, next.y ? next.y : p.y);
        ctx.strokeStyle = `rgba(105, 124, 255, ${alpha})`;
        ctx.lineWidth = Math.max(1.5, 3.5 * p.pz);
        ctx.lineCap = "round";
        ctx.stroke();

        // Shimmering node highlight
        if (i % 6 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(2, 4.5 * p.pz), 0, Math.PI * 2);
          ctx.fillStyle = i % 12 === 0 ? "#d6ff63" : "#ffffff";
          ctx.fill();
        }
      }

      // Draw satellites
      satellites.forEach((sat, idx) => {
        const wobble = Math.sin(time * 0.0015 + idx) * 0.15;
        const p = project({ x: sat.x, y: sat.y + wobble, z: sat.z });
        ctx.beginPath();
        const rad = sat.r * p.pz;
        ctx.arc(p.x, p.y, Math.max(3, rad), 0, Math.PI * 2);
        ctx.fillStyle = sat.color;
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      pointerSurface.removeEventListener("pointermove", onPointer);
      pointerSurface.removeEventListener("pointerleave", onLeave);
      canvas.remove();
    };
  }, []);
  return <div ref={host} className="five-scene" aria-hidden="true"><div className="five-scene-fallback" /></div>;
}
function EntryCard({ title, text, image, meta, anchor, to, index }) {
  const card = <article id={anchor} className={`five-entry${to ? "" : " five-entry-detail"}`} style={{ "--five-entry-delay": `${Math.min(index, 5) * 80}ms` }}>{image && <img src={image} alt="" loading="lazy"/>}<div><span className="five-kicker">{meta}</span><h3>{title}</h3>{text && <p>{text}</p>}{to && <ArrowUpRight size={20} aria-hidden="true"/>}</div></article>;
  return to ? <Link className="five-entry-link" to={to} aria-label={`View ${title}`}>{card}</Link> : card;
}
export default function ThemeFive({ profile = {}, tuition = {}, batches = [], achievements = [], gallery = [], experience = [], faqs = [], username = "", previewBasePath, currentPage = "home", onContactClick }) {
  const contactActions = getContactActions(profile);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const mainRef = useRef(null);
  const cursorRef = useRef(null);
  const base = previewBasePath || getTutorNavigationBase(username);
  const href = (page) => page === "home" ? base : `${base}/${page}`;
  const name = [value(profile,["firstName","first_name"]),value(profile,["lastName","last_name"])].filter(Boolean).join(" ") || value(profile,["username"],"Tutor");
  const brand = getWebsiteTitle(tuition, profile);
  const subjects = array(value(tuition,["teachingSubjects","teaching_subjects"]));
  const intro = value(profile,["about","description"]);
  const picture = value(profile,["profilePicture","profile_picture","profilePhoto","avatar"]);
  const home = currentPage === "home";
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = decodeURIComponent(location.hash.slice(1));
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash, currentPage, batches, achievements]);
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!home || !cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame = 0, active = false, x = 0, y = 0, targetX = 0, targetY = 0;
    const animate = () => { x += (targetX - x) * .14; y += (targetY - y) * .14; cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`; frame = active ? requestAnimationFrame(animate) : 0; };
    const move = (event) => { if (event.pointerType !== "mouse") return; targetX = event.clientX; targetY = event.clientY; if (!active) { x = targetX; y = targetY; active = true; cursor.classList.add("is-visible"); frame = requestAnimationFrame(animate); } cursor.classList.toggle("is-interactive", Boolean(event.target.closest?.("a, button, summary"))); };
    const hide = () => { active = false; cancelAnimationFrame(frame); frame = 0; cursor.classList.remove("is-visible", "is-interactive"); };
    window.addEventListener("pointermove", move); window.addEventListener("blur", hide); document.addEventListener("pointerleave", hide);
    return () => { hide(); window.removeEventListener("pointermove", move); window.removeEventListener("blur", hide); document.removeEventListener("pointerleave", hide); };
  }, [home]);
  useEffect(() => {
    if (!home || !mainRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const root = mainRef.current;
    const hero = root.querySelector(".five-hero");
    const moveCardLight = (event) => {
      if (event.pointerType !== "mouse") return;
      const card = event.target.closest?.(".five-entry");
      if (!card || !root.contains(card)) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--five-card-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--five-card-y", `${event.clientY - rect.top}px`);
    };
    const updateScroll = () => { if (hero) hero.style.setProperty("--five-scroll-y", `${Math.min(120, Math.max(0, -hero.getBoundingClientRect().top) * .15)}px`); };
    window.addEventListener("scroll", updateScroll, { passive: true });
    root.addEventListener("pointermove", moveCardLight, { passive: true });
    let observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .08 });
      root.querySelectorAll(".five-section, .five-cta").forEach((element) => { element.classList.add("five-reveal"); observer.observe(element); });
    }
    return () => { window.removeEventListener("scroll", updateScroll); root.removeEventListener("pointermove", moveCardLight); observer?.disconnect(); };
  }, [home]);
  const batchCards = (items) => items.map((item,i) => { const id = item.batchId ?? item.id ?? i; const anchor = `batch-${id}`; return <EntryCard key={id} index={i} anchor={home ? undefined : anchor} to={home ? `${href("batches")}#${anchor}` : undefined} title={value(item,["title","batchName"],"Learning group")} text={item.description} image={value(item,["imageUrl","image_url","batchImageUrl","batchImage"])} meta={value(item,["batchType","type"],"Batch")}/>; });
  const achievementCards = (items) => items.map((item,i) => { const id = item.achievementId ?? item.id ?? i; const anchor = `achievement-${id}`; return <EntryCard key={id} index={i} anchor={home ? undefined : anchor} to={home ? `${href("achievements")}#${anchor}` : undefined} title={value(item,["title","achievementTitle"],"Student achievement")} text={item.studentReview || item.description} image={value(item,["achievementImageUrl","achievement_image_url","imageUrl","image_url"])} meta={item.studentName || "Student story"}/>; });
  return <div className="five-theme">{home && <div ref={cursorRef} className="five-cursor" aria-hidden="true"><span/></div>}<header className="five-header"><Link to={base} className="five-brand"><TuitionLogo tuition={tuition} name={brand} className="five-logo" /><span>{brand}</span></Link><nav className={menuOpen ? "five-nav is-open" : "five-nav"} aria-label="Tutor website navigation"><Link to={base} onClick={() => setMenuOpen(false)} className="five-mobile-identity"><TuitionLogo tuition={tuition} name={brand} className="h-9 w-9"/><span>{brand}</span></Link>{pages.map(([id,label]) => <Link key={id} to={href(id)} onClick={() => setMenuOpen(false)} aria-current={currentPage === id ? "page" : undefined}>{label}</Link>)}</nav><button type="button" className="five-contact" onClick={onContactClick}>Let's talk <ArrowUpRight size={16}/></button><button type="button" className="five-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}><Menu size={22}/></button></header>
    <main ref={mainRef}>{home ? <><section className="five-hero"><MotionScene/><div className="five-hero-content"><p className="five-kicker">A SPACE TO LEARN & GROW <span>✳</span></p><h1>Ideas become<br/><em>possibilities.</em></h1><p className="five-intro">{intro || `Discover a new way to learn with ${name}.`}</p><div className="five-hero-actions"><Link to={href("classes")} className="five-button">Explore classes <ArrowUpRight size={18}/></Link><Link to={href("about")} className="five-link-button">Meet your tutor <ArrowRight size={18}/></Link></div></div><a href="#five-learning" className="five-scroll">SCROLL TO EXPLORE <ArrowDown size={15}/></a><span className="five-hero-index" aria-hidden="true">01 / LEARN</span></section>
      <section id="five-learning" className="five-marquee" aria-label="Subjects offered"><div>{[...subjects,...subjects].map((subject,i) => <span key={`${subject}-${i}`}>{subject} <b>✳</b></span>)}{subjects.length === 0 && <span>LEARN <b>✳</b> GROW <b>✳</b> DISCOVER <b>✳</b></span>}</div></section>
      <section className="five-section five-about"><div className="five-section-label"><span>01 / THE EDUCATOR</span><span>THE PERSON BEHIND THE LESSONS</span></div><div className="five-about-layout"><div><h2>Good teaching.<br/><em>Real progress.</em></h2><p>{intro || `Get to know ${name} and explore the classes they offer.`}</p><Link to={href("about")} className="five-outline">About {name.split(" ")[0]} <ArrowUpRight size={18}/></Link></div><div className="five-portrait">{picture ? <img src={picture} alt={name} loading="lazy"/> : <span>{name.charAt(0).toUpperCase()}</span>}<div><small>YOUR EDUCATOR</small><strong>{name}</strong>{value(profile,["qualification"]) && <span>{value(profile,["qualification"])}</span>}</div></div></div></section>
      <section className="five-section five-dark"><div className="five-section-label"><span>02 / LEARNING</span><span>FIND YOUR NEXT STEP</span></div><div className="five-section-heading"><div><h2>Find your<br/><em>next chapter.</em></h2><p>Explore the learning groups published by your tutor.</p></div><Link className="five-outline" to={href("batches")}>All batches <ArrowUpRight size={18}/></Link></div><div className="five-grid">{batches.length ? batchCards(batches.slice(0,2)) : <p>New batches will appear here when available.</p>}</div></section>
      {achievements.length > 0 && <section className="five-section"><div className="five-section-label"><span>03 / STUDENT STORIES</span><span>PROGRESS, CELEBRATED</span></div><div className="five-section-heading"><h2>Small steps.<br/><em>Big moments.</em></h2><Link className="five-outline" to={href("achievements")}>View achievements <ArrowUpRight size={18}/></Link></div><div className="five-grid">{achievementCards(achievements.slice(0,2))}</div></section>}
      <section className="five-cta"><p className="five-kicker">READY WHEN YOU ARE</p><h2>Let's learn<br/><em>something new.</em></h2><button type="button" onClick={onContactClick}>Start a conversation <ArrowUpRight size={24}/></button></section></> : <section className="five-section five-inner"><p className="five-kicker">{brand} / {currentPage.toUpperCase()}</p><h1>{({about:"Meet your educator.",classes:"Explore your subjects.",batches:"Find your next chapter.",achievements:"Progress worth celebrating.",experience:"Experience in practice.",gallery:"A closer look."})[currentPage] || "Discover more."}</h1>
        {currentPage === "about" && <div className="five-inner-about"><div><h2>{name}</h2><p>{intro || "More about this tutor will appear here soon."}</p>{value(profile,["qualification"]) && <p>{value(profile,["qualification"])}</p>}{value(profile,["email"]) && <a href={`mailto:${profile.email}`}>{profile.email}</a>}<button className="five-outline" type="button" onClick={onContactClick}>Message tutor <ArrowUpRight size={18}/></button></div><div>{faqs.map((faq,i) => <details key={faq.faqId ?? faq.id ?? i}><summary>{value(faq,["title","question"],"Question")}</summary><p>{value(faq,["description","answer"])}</p></details>)}</div></div>}
        {currentPage === "classes" && <><div className="five-subjects">{subjects.length ? subjects.map((subject,i) => <div key={`${subject}-${i}`}><span>{String(i+1).padStart(2,"0")}</span><h2>{subject}</h2></div>) : <p>Subjects will appear here when shared.</p>}</div>{value(tuition,["eligibleClasses","eligible_classes"]) && <p>Classes: {value(tuition,["eligibleClasses","eligible_classes"])}</p>}<Link to={href("batches")} className="five-outline">Explore batches <ArrowUpRight size={18}/></Link></>}
        {currentPage === "batches" && <div className="five-grid">{batches.length ? batchCards(batches) : <p>No batches have been published yet.</p>}</div>}
        {currentPage === "achievements" && <div className="five-grid">{achievements.length ? achievementCards(achievements) : <p>Achievements will appear here when shared.</p>}</div>}
        {currentPage === "experience" && <div className="five-timeline">{experience.length ? experience.map((item,i) => <article key={item.experienceId ?? item.id ?? i}><span>{item.startDate || ""} {item.isCurrent ? "— Present" : item.endDate ? `— ${item.endDate}` : ""}</span><h2>{value(item,["title"],"Experience")}</h2><p>{item.description}</p></article>) : <p>Experience will appear here when shared.</p>}</div>}
        {currentPage === "gallery" && <div className="five-gallery">{gallery.filter((item) => value(item,["fileUrl","url","imageUrl","src"])).length ? gallery.filter((item) => value(item,["fileUrl","url","imageUrl","src"])).map((item,i) => <img key={item.fileId ?? item.id ?? i} src={value(item,["fileUrl","url","imageUrl","src"])} alt={value(item,["title","originalFilename"],`Gallery photo ${i+1}`)} loading="lazy"/>) : <p>Photos will appear here when shared.</p>}</div>}</section>}</main>
    {contactActions.length > 0 && <aside aria-label="Contact tutor" className="five-contact-icons">
      {contactActions.map((action) => <a key={action.field} href={action.href}
        target={action.type === "whatsapp" ? "_blank" : undefined}
        rel={action.type === "whatsapp" ? "noopener noreferrer" : undefined}
        className={`five-contact-icon ${action.type === "whatsapp" ? "is-whatsapp" : "is-phone"}`}
        aria-label={action.actionLabel} title={action.actionLabel}>
        {action.type === "whatsapp" ? <SocialIcon platform="whatsapp" className="h-6 w-6" /> : <Phone size={22} aria-hidden="true" />}
      </a>)}
    </aside>}
    <footer className="five-footer"><Link to={base} className="five-brand"><TuitionLogo tuition={tuition} name={brand} className="five-logo" /><span>{brand}</span></Link><nav aria-label="Footer navigation">{pages.map(([id,label]) => <Link key={id} to={href(id)}>{label}</Link>)}</nav><span>© {new Date().getFullYear()} {name}</span></footer></div>;
}
