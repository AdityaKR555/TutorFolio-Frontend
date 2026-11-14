import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Menu } from "lucide-react";
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
    let disposed = false, renderer, frame = 0, resize, observer;
    const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    const pointerSurface = container.parentElement || container;
    const onPointer = (event) => { if (event.pointerType !== "mouse") return; const rect = pointerSurface.getBoundingClientRect(); target.x = ((event.clientX - rect.left) / rect.width - .5) * 2; target.y = ((event.clientY - rect.top) / rect.height - .5) * 2; };
    const onLeave = () => { target.x = 0; target.y = 0; };
    pointerSurface.addEventListener("pointermove", onPointer); pointerSurface.addEventListener("pointerleave", onLeave);
    import("three").then((THREE) => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, .1, 100); camera.position.z = 9;
        scene.add(new THREE.HemisphereLight(0xcad6ff, 0x090b1b, 2));
        const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(4, 6, 8); scene.add(key);
        const accent = new THREE.PointLight(0x4d5cff, 28, 25); accent.position.set(-4, 0, 3); scene.add(accent);
        const group = new THREE.Group(); scene.add(group);
        const material = new THREE.MeshStandardMaterial({ color: 0x697cff, metalness: .65, roughness: .22 });
        const white = new THREE.MeshStandardMaterial({ color: 0xf4f3ff, metalness: .3, roughness: .24 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x15182c, metalness: .7, roughness: .22 });
        const torusGeometry = new THREE.TorusKnotGeometry(1.35, .36, 180, 18, 2, 3);
        const knot = new THREE.Mesh(torusGeometry, material); group.add(knot);
        const sphereGeometry = new THREE.IcosahedronGeometry(.42, 3);
        const objects = [[-2.35,1.4,-.4,white],[2.3,-1.3,-.5,white],[2.5,1.4,-1,dark],[-2,-1.6,-1,dark]].map(([x,y,z,mat]) => { const mesh = new THREE.Mesh(sphereGeometry, mat); mesh.position.set(x,y,z); group.add(mesh); return mesh; });
        resize = () => { if (!container.clientWidth || !container.clientHeight) return; camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
        resize(); window.addEventListener("resize", resize);
        let visible = true;
        const tick = (time) => { if (disposed) return; frame = requestAnimationFrame(tick); if (!visible || document.hidden) return; pointer.x += (target.x - pointer.x) * .035; pointer.y += (target.y - pointer.y) * .035; knot.rotation.x = time * .00011 + pointer.y * .18; knot.rotation.y = time * .00017 + pointer.x * .28; group.rotation.z = pointer.x * .07; objects.forEach((mesh, i) => { mesh.rotation.x = time * .00025 * (i % 2 ? -1 : 1); mesh.position.y += Math.sin(time * .001 + i) * .0015; }); renderer.render(scene, camera); };
        if ("IntersectionObserver" in window) { observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); observer.observe(container); }
        frame = requestAnimationFrame(tick);
        container.classList.add("is-ready");
        container._disposeScene = () => { torusGeometry.dispose(); sphereGeometry.dispose(); material.dispose(); white.dispose(); dark.dispose(); };
      } catch { container.classList.remove("is-ready"); }
    }).catch(() => {});
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", resize); pointerSurface.removeEventListener("pointermove", onPointer); pointerSurface.removeEventListener("pointerleave", onLeave); container._disposeScene?.(); delete container._disposeScene; renderer?.dispose(); renderer?.domElement.remove(); };
  }, []);
  return <div ref={host} className="five-scene" aria-hidden="true"><div className="five-scene-fallback" /></div>;
}
function EntryCard({ title, text, image, meta, anchor, to, index }) {
  const card = <article id={anchor} className={`five-entry${to ? "" : " five-entry-detail"}`} style={{ "--five-entry-delay": `${Math.min(index, 5) * 80}ms` }}>{image && <img src={image} alt="" loading="lazy"/>}<div><span className="five-kicker">{meta}</span><h3>{title}</h3>{text && <p>{text}</p>}{to && <ArrowUpRight size={20} aria-hidden="true"/>}</div></article>;
  return to ? <Link className="five-entry-link" to={to} aria-label={`View ${title}`}>{card}</Link> : card;
}
export default function ThemeFive({ profile = {}, tuition = {}, batches = [], achievements = [], gallery = [], experience = [], faqs = [], username = "", previewBasePath, currentPage = "home", onContactClick }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const mainRef = useRef(null);
  const cursorRef = useRef(null);
  const base = previewBasePath || `/tutor/${encodeURIComponent(username)}`;
  const href = (page) => page === "home" ? base : `${base}/${page}`;
  const name = [value(profile,["firstName","first_name"]),value(profile,["lastName","last_name"])].filter(Boolean).join(" ") || value(profile,["username"],"Tutor");
  const brand = value(tuition,["tuitionName","tuitionClassName"],name);
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
  return <div className="five-theme">{home && <div ref={cursorRef} className="five-cursor" aria-hidden="true"><span/></div>}<header className="five-header"><Link to={base} className="five-brand"><TuitionLogo tuition={tuition} name={brand} className="five-logo" fallback={<span className="five-logo-fallback">{brand.charAt(0).toUpperCase()}</span>}/><span>{brand}</span></Link><nav className={menuOpen ? "five-nav is-open" : "five-nav"} aria-label="Tutor website navigation">{pages.map(([id,label]) => <Link key={id} to={href(id)} onClick={() => setMenuOpen(false)} aria-current={currentPage === id ? "page" : undefined}>{label}</Link>)}</nav><button type="button" className="five-contact" onClick={onContactClick}>Let's talk <ArrowUpRight size={16}/></button><button type="button" className="five-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}><Menu size={22}/></button></header>
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
    <footer className="five-footer"><Link to={base} className="five-brand"><TuitionLogo tuition={tuition} name={brand} className="five-logo" fallback={<span className="five-logo-fallback">{brand.charAt(0).toUpperCase()}</span>}/><span>{brand}</span></Link><nav aria-label="Footer navigation">{pages.map(([id,label]) => <Link key={id} to={href(id)}>{label}</Link>)}</nav><span>© {new Date().getFullYear()} {name}</span></footer></div>;
}
