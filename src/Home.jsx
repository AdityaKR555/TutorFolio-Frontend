// import { Link } from "react-router-dom";
// import { useEffect, useRef, useState } from "react";

// const CITIES = [
//   "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai",
//   "Kolkata", "Jaipur", "Lucknow", "Noida", "Gurgaon", "Ahmedabad",
//   "Indore", "Chandigarh", "Bhopal", "Surat", "Nagpur", "Patna",
// ];

// const TEACHERS = [
//   {
//     init: "RK", name: "Rajesh Kumar", subject: "Mathematics & Physics",
//     loc: "Sector 21, Noida", rating: "4.9", reviews: 142,
//     fee: "₹800/hr", tags: ["JEE", "CBSE 11–12", "IIT Foundation"],
//     exp: "9 yrs",
//   },
//   {
//     init: "PS", name: "Priya Sharma", subject: "English & Social Studies",
//     loc: "Indiranagar, Bangalore", rating: "4.8", reviews: 98,
//     fee: "₹600/hr", tags: ["Class 6–10", "ICSE", "Creative Writing"],
//     exp: "6 yrs",
//   },
//   {
//     init: "AM", name: "Amit Mishra", subject: "Chemistry & Biology",
//     loc: "Koregaon Park, Pune", rating: "4.7", reviews: 76,
//     fee: "₹750/hr", tags: ["NEET Prep", "Class 11–12"],
//     exp: "11 yrs",
//   },
//   {
//     init: "SR", name: "Sunita Rao", subject: "Computer Science",
//     loc: "Anna Nagar, Chennai", rating: "5.0", reviews: 201,
//     fee: "₹900/hr", tags: ["Python", "Coding Basics", "Class 10–12"],
//     exp: "8 yrs",
//   },
// ];

// const FEATURES = [
//   {
//     for: "Tutors",
//     items: [
//       { title: "Portfolio page that's actually yours", desc: "Upload your qualifications, teaching approach, and past results. Students see you before they meet you." },
//       { title: "Session scheduling without the chaos", desc: "Set your slots. Students book. You get notified. No WhatsApp ping-pong." },
//       { title: "Progress reports parents actually read", desc: "Log session notes and milestones. Share reports with one click." },
//     ],
//   },
//   {
//     for: "Students",
//     items: [
//       { title: "Tutors who live near you", desc: "Search by area, not just city. Find someone 10 minutes away, not 10 km." },
//       { title: "Reviews tied to real sessions", desc: "Every rating comes from a completed class. No fake five-stars." },
//       { title: "Filter by what actually matters", desc: "Subject, board, fee, gender preference, timing. Not just a list of names." },
//     ],
//   },
// ];

// const TESTIMONIALS = [
//   {
//     text: "My daughter's math marks went from 58 to 89 in one term. The tutor was 1.2 km from our house. I found her in under 10 minutes.",
//     name: "Kavita Mehta", role: "Parent, Andheri West", init: "KM",
//   },
//   {
//     text: "I used to get students only through word of mouth. Now I wake up to 4–5 enquiries a week from people in my area.",
//     name: "Vikram Singh", role: "Tutor, Physics & Chemistry", init: "VS",
//   },
//   {
//     text: "I needed CBSE Biology coaching near my locality. Found exactly that — with demo videos, clear timing, and no hidden fees.",
//     name: "Aditya Nair", role: "Student, Class 12", init: "AN",
//   },
// ];

// function useInView(threshold = 0.15) {
//   const ref = useRef(null);
//   const [inView, setInView] = useState(false);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const obs = new IntersectionObserver(([e]) => {
//       if (e.isIntersecting) { setInView(true); obs.disconnect(); }
//     }, { threshold });
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, [threshold]);
//   return [ref, inView];
// }

// function Reveal({ children, delay = 0, className = "" }) {
//   const [ref, inView] = useInView();
//   return (
//     <div
//       ref={ref}
//       className={className}
//       style={{
//         opacity: inView ? 1 : 0,
//         transform: inView ? "translateY(0)" : "translateY(22px)",
//         transition: `opacity 0.55s ${delay}s ease, transform 0.55s ${delay}s ease`,
//       }}
//     >
//       {children}
//     </div>
//   );
// }

// export default function Home() {
//   const [scrolled, setScrolled] = useState(false);
//   const tickerRef = useRef(null);

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 30);
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   // Ticker auto-scroll
//   useEffect(() => {
//     const el = tickerRef.current;
//     if (!el) return;
//     let x = 0;
//     let raf;
//     const speed = 0.6;
//     const half = el.scrollWidth / 2;
//     const tick = () => {
//       x += speed;
//       if (x >= half) x = 0;
//       el.style.transform = `translateX(-${x}px)`;
//       raf = requestAnimationFrame(tick);
//     };
//     raf = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   const scrollTo = (id) =>
//     document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

//   return (
//     <div className="bg-[#0D0D0D] text-[#F5F0E8] font-sans min-h-screen overflow-x-hidden">

//       {/* ── NAV ── */}
//       <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-white/[0.06]" : "bg-transparent"}`}>
//         <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
//           <a href="#" className="text-[#F5F0E8] font-black text-xl tracking-tight flex items-center gap-2">
//             <span className="inline-block w-2 h-2 rounded-full bg-[#E8210A]" />
//             TutorFolio
//           </a>
//           <div className="hidden md:flex items-center gap-8">
//             {[["how", "How it works"], ["tutors", "Find tutors"], ["features", "Features"]].map(([id, label]) => (
//               <button
//                 key={id}
//                 onClick={() => scrollTo(id)}
//                 className="text-[#6B6B6B] hover:text-[#F5F0E8] text-sm font-medium transition-colors"
//               >
//                 {label}
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center gap-3">
//             <Link
//               to="/login"
//               className="text-[#6B6B6B] hover:text-[#F5F0E8] text-sm font-medium transition-colors px-1"
//             >
//               Log in
//             </Link>
//             <Link
//               to="/signup"
//               className="bg-[#E8210A] hover:bg-[#cc1c08] text-white text-sm font-bold px-5 py-2 transition-colors"
//             >
//               Get started
//             </Link>
//           </div>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section className="min-h-screen flex flex-col justify-center pt-16 px-5 sm:px-8 md:px-12 relative overflow-hidden">
//         {/* big red vertical bar — the signature */}
//         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E8210A]" />

//         <div className="max-w-6xl mx-auto w-full py-24 md:py-32 grid md:grid-cols-[1fr_auto] gap-12 items-end">
//           <div>
//             <p className="text-[#E8210A] text-xs font-bold tracking-[0.18em] uppercase mb-8">
//               Live in 40+ Indian cities
//             </p>
//             <h1
//               className="font-black leading-[0.92] tracking-tight text-[#F5F0E8]"
//               style={{ fontSize: "clamp(3.2rem, 9vw, 7.5rem)" }}
//             >
//               Find a tutor<br />
//               <span
//                 className="relative inline-block"
//                 style={{ color: "#F5F0E8" }}
//               >
//                 two streets
//                 {/* chalk underline */}
//                 <span
//                   className="absolute left-0 -bottom-1 h-[5px] bg-[#E8210A] block"
//                   style={{
//                     width: "100%",
//                     animation: "drawLine 0.7s 0.4s cubic-bezier(.4,0,.2,1) both",
//                   }}
//                 />
//               </span>
//               <br />away.
//             </h1>
//             <p className="mt-10 text-[#6B6B6B] text-base sm:text-lg leading-relaxed max-w-md">
//               TutorFolio is where tuition teachers build their portfolio and students find
//               the right match — by subject, by locality, by fit.
//             </p>
//             <div className="mt-10 flex flex-wrap gap-4 items-center">
//               <Link
//                 to="/signup"
//                 className="bg-[#E8210A] hover:bg-[#cc1c08] text-white font-bold text-base px-7 py-3.5 transition-colors inline-block"
//               >
//                 Find a tutor near me →
//               </Link>
//               <Link
//                 to="/signup?role=tutor"
//                 className="border border-white/20 hover:border-white/50 text-[#F5F0E8] font-semibold text-base px-7 py-3.5 transition-colors inline-block"
//               >
//                 I'm a tutor
//               </Link>
//             </div>
//           </div>

//           {/* stat block — right column, bottom-aligned */}
//           <div className="hidden md:flex flex-col gap-6 pb-1">
//             {[["18K+", "tutors on platform"], ["2.4L+", "students matched"], ["4.9", "average rating"]].map(([n, l]) => (
//               <div key={l} className="border-l-2 border-[#E8210A] pl-4">
//                 <div className="font-black text-3xl text-[#F5F0E8] leading-none">{n}</div>
//                 <div className="text-[#6B6B6B] text-xs mt-1 tracking-wide">{l}</div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* city ticker */}
//         <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] py-3 overflow-hidden bg-[#111111]">
//           <div ref={tickerRef} className="flex gap-12 whitespace-nowrap w-max">
//             {[...CITIES, ...CITIES].map((city, i) => (
//               <span key={i} className="text-xs font-semibold tracking-[0.15em] uppercase text-[#3a3a3a]">
//                 {city}
//               </span>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ── */}
//       <section id="how" className="bg-[#F5F0E8] text-[#0D0D0D] px-5 sm:px-8 py-24 md:py-32">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <h2 className="font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-16">
//               How it<br />
//               <span className="text-[#E8210A]">works</span>
//             </h2>
//           </Reveal>
//           <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-0 border border-black/10">
//             {[
//               { step: "1", title: "Tell us what you need", desc: "Subject, class, board, area. Takes 30 seconds." },
//               { step: "2", title: "Browse real profiles", desc: "Every tutor has a portfolio — not just a name and number." },
//               { step: "3", title: "Book a trial session", desc: "Send a request. Most tutors reply within 2 hours." },
//               { step: "4", title: "Learn and track progress", desc: "Session notes, milestones, and reports in one place." },
//             ].map((s, i) => (
//               <Reveal key={i} delay={i * 0.07}>
//                 <div className="p-8 border-r border-b border-black/10 last:border-r-0 h-full">
//                   <div className="font-black text-6xl text-[#E8210A] leading-none mb-6 opacity-30">{s.step}</div>
//                   <div className="font-bold text-lg mb-3">{s.title}</div>
//                   <div className="text-sm text-[#6B6B6B] leading-relaxed">{s.desc}</div>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── TUTORS SHOWCASE ── */}
//       <section id="tutors" className="px-5 sm:px-8 py-24 md:py-32">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
//             <Reveal>
//               <h2 className="font-black text-4xl sm:text-5xl tracking-tight leading-tight">
//                 Top-rated<br />near you
//               </h2>
//             </Reveal>
//             <Reveal delay={0.1}>
//               <Link
//                 to="/signup"
//                 className="text-sm font-bold text-[#E8210A] hover:underline underline-offset-4 whitespace-nowrap"
//               >
//                 Browse all tutors →
//               </Link>
//             </Reveal>
//           </div>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">
//             {TEACHERS.map((t, i) => (
//               <Reveal key={i} delay={i * 0.08}>
//                 <div className="bg-[#0D0D0D] p-6 hover:bg-[#141414] transition-colors group cursor-pointer h-full flex flex-col">
//                   {/* avatar */}
//                   <div className="w-11 h-11 rounded bg-[#E8210A] flex items-center justify-center font-black text-white text-sm mb-5 group-hover:scale-105 transition-transform">
//                     {t.init}
//                   </div>
//                   <div className="font-bold text-[#F5F0E8] mb-0.5">{t.name}</div>
//                   <div className="text-xs text-[#6B6B6B] mb-1">{t.subject}</div>
//                   <div className="text-xs text-[#6B6B6B] mb-4">📍 {t.loc}</div>

//                   <div className="flex flex-wrap gap-1.5 mb-5">
//                     {t.tags.map(tag => (
//                       <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 border border-white/10 text-[#6B6B6B] tracking-wide">
//                         {tag}
//                       </span>
//                     ))}
//                   </div>

//                   <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between">
//                     <div>
//                       <span className="text-[#E8210A] font-black">{t.rating}</span>
//                       <span className="text-[#6B6B6B] text-xs ml-1">({t.reviews})</span>
//                     </div>
//                     <div className="text-[#F5F0E8] font-bold text-sm">{t.fee}</div>
//                   </div>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── FEATURES ── */}
//       <section id="features" className="bg-[#111111] px-5 sm:px-8 py-24 md:py-32">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <h2 className="font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-16">
//               Built around<br />real people
//             </h2>
//           </Reveal>

//           <div className="grid md:grid-cols-2 gap-px bg-white/[0.06]">
//             {FEATURES.map((group, gi) => (
//               <div key={gi} className="bg-[#111111] p-8 md:p-12">
//                 <div className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8210A] mb-8">
//                   {group.for}
//                 </div>
//                 <div className="flex flex-col gap-8">
//                   {group.items.map((item, ii) => (
//                     <Reveal key={ii} delay={ii * 0.08}>
//                       <div className="border-l border-[#E8210A]/40 pl-5 hover:border-[#E8210A] transition-colors">
//                         <div className="font-bold text-[#F5F0E8] mb-1.5">{item.title}</div>
//                         <div className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</div>
//                       </div>
//                     </Reveal>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── TESTIMONIALS ── */}
//       <section className="px-5 sm:px-8 py-24 md:py-32">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#E8210A] mb-4">
//               What people say
//             </p>
//             <h2 className="font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-14">
//               Real classes.<br />Real results.
//             </h2>
//           </Reveal>

//           <div className="grid sm:grid-cols-3 gap-px bg-white/[0.06]">
//             {TESTIMONIALS.map((t, i) => (
//               <Reveal key={i} delay={i * 0.09}>
//                 <div className="bg-[#0D0D0D] p-8 flex flex-col h-full hover:bg-[#111111] transition-colors">
//                   <p className="text-[#F5F0E8]/80 text-sm leading-[1.8] flex-1">
//                     "{t.text}"
//                   </p>
//                   <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/[0.06]">
//                     <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-[#6B6B6B]">
//                       {t.init}
//                     </div>
//                     <div>
//                       <div className="text-xs font-bold text-[#F5F0E8]">{t.name}</div>
//                       <div className="text-xs text-[#6B6B6B] mt-0.5">{t.role}</div>
//                     </div>
//                   </div>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA BAND ── */}
//       <section className="bg-[#E8210A] px-5 sm:px-8 py-20 md:py-28">
//         <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_auto] gap-10 items-center">
//           <Reveal>
//             <h2 className="font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight text-white">
//               Your next tutor<br />is 2 km away.
//             </h2>
//             <p className="text-white/70 mt-4 text-base max-w-sm leading-relaxed">
//               Stop searching on Facebook groups. Stop calling tutors who never pick up.
//               Start here.
//             </p>
//           </Reveal>
//           <Reveal delay={0.1}>
//             <div className="flex flex-col sm:flex-row md:flex-col gap-3">
//               <Link
//                 to="/signup"
//                 className="bg-white text-[#E8210A] font-black text-base px-8 py-4 hover:bg-[#F5F0E8] transition-colors text-center whitespace-nowrap"
//               >
//                 Find tutors near me
//               </Link>
//               <Link
//                 to="/signup?role=tutor"
//                 className="border-2 border-white text-white font-bold text-base px-8 py-4 hover:bg-white/10 transition-colors text-center whitespace-nowrap"
//               >
//                 Create my portfolio
//               </Link>
//             </div>
//           </Reveal>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="bg-[#0D0D0D] border-t border-white/[0.06] px-5 sm:px-8 py-12">
//         <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
//           <div>
//             <div className="font-black text-lg text-[#F5F0E8] flex items-center gap-2 mb-2">
//               <span className="w-2 h-2 rounded-full bg-[#E8210A] inline-block" />
//               TutorFolio
//             </div>
//             <p className="text-xs text-[#6B6B6B] max-w-xs leading-relaxed">
//               The tuition marketplace for India — local, verified, portfolio-first.
//             </p>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-8 text-xs text-[#6B6B6B]">
//             <div className="flex flex-col gap-2">
//               <span className="font-bold text-[#F5F0E8] mb-1 uppercase tracking-wider text-[10px]">Platform</span>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left" onClick={() => scrollTo("how")}>How it works</button>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left" onClick={() => scrollTo("tutors")}>Find tutors</button>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left" onClick={() => scrollTo("features")}>Features</button>
//             </div>
//             <div className="flex flex-col gap-2">
//               <span className="font-bold text-[#F5F0E8] mb-1 uppercase tracking-wider text-[10px]">Account</span>
//               <Link to="/login" className="hover:text-[#F5F0E8] transition-colors">Log in</Link>
//               <Link to="/signup" className="hover:text-[#F5F0E8] transition-colors">Sign up</Link>
//               <Link to="/signup?role=tutor" className="hover:text-[#F5F0E8] transition-colors">Join as tutor</Link>
//             </div>
//             <div className="flex flex-col gap-2">
//               <span className="font-bold text-[#F5F0E8] mb-1 uppercase tracking-wider text-[10px]">Company</span>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left">About</button>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left">Blog</button>
//               <button className="hover:text-[#F5F0E8] transition-colors text-left">Privacy</button>
//             </div>
//           </div>
//         </div>
//         <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/[0.06] text-xs text-[#3a3a3a]">
//           © 2025 TutorFolio. Made in India 🇮🇳
//         </div>
//       </footer>

//       {/* chalk underline keyframe */}
//       <style>{`
//         @keyframes drawLine {
//           from { width: 0; }
//           to { width: 100%; }
//         }
//       `}</style>
//     </div>
//   );
// }

// import React from 'react'

// function Home() {
//   return (
//     <div>
//       <section id="navbar" className="bg-[#0D0D0D] border-b border-white/6 px-5 sm:px-8 flex justify-around items-center py-25">
//        <div>
//         <img src="/tf-logo.png" alt="Logo" className="w-40" />
//        </div>

//        <div>
//           <button>Home</button>
//           <button>Services</button>
//           <button>How it Works</button>
//        </div>

//        <div>
//         <button>Login</button>
//         <button>Sign Up</button>
//       </div>
//       </section>
//     </div>
//   )
// }

// export default Home

// import React from "react";
// import { Link } from "react-router-dom";

// function Home() {
//   return (
//     <div>
//       <section
//         id="navbar"
//         className="bg-[#0a1628] border-b border-blue-500/10 px-5 sm:px-8 flex justify-around items-center py-2 md:gap-24"
//       >
//         <div>
//           <img src="/tf-logo.png" alt="Logo" className="w-40" />
//         </div>

//         <div className="flex gap-8">
//           <a
//             href="#home"
//             className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
//           >
//             Home
//           </a>
//           <a
//             href="#services"
//             className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
//           >
//             Services
//           </a>
//           <a
//             href="#how-it-works"
//             className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
//           >
//             How it Works
//           </a>
//         </div>

//         <div className="flex gap-4">
//           <Link
//             to="/login"
//             className="text-lg text-[#94a8c7] border-2 border-blue-400/30 hover:text-white hover:border-blue-400/60 px-4 py-1.5 rounded-md hover:rounded-lg transition-all duration-150"
//           >
//             Login
//           </Link>
//           <Link
//             to="/signup"
//             className="text-lg text-white bg-blue-700 hover:bg-blue-600 px-4 py-1.5 rounded-md hover:rounded-lg transition-colors duration-150"
//           >
//             Sign Up
//           </Link>
//         </div>
//       </section>
//       <section id="home"></section>
//       <section id="services"></section>
//       <section id="how-it-works"></section>

//      <section>
//   <footer className="bg-[#0a1628] border-t border-blue-500/10 px-5 sm:px-8 py-12">
//     <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

//       <div>
//         <img src="/tf-logo.png" alt="Logo" className="w-40" />
//         <p className="text-sm text-[#94a8c7] max-w-xs leading-relaxed mt-2">
//           The tuition marketplace for India - local, verified, portfolio-first.
//         </p>
//       </div>

//       <div className="flex flex-col sm:flex-row gap-8 text-xs text-[#94a8c7]">

//         <div className="flex flex-col gap-2 text-sm">
//           <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[12px]">Platform</span>
//           <a href="#how" className="hover:text-white transition-colors duration-150">How it works</a>
//           <a href="#tutors" className="hover:text-white transition-colors duration-150">Find tutors</a>
//           <a href="#features" className="hover:text-white transition-colors duration-150">Features</a>
//         </div>

//         <div className="flex flex-col gap-2 text-sm">
//           <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[12px]">Account</span>
//           <Link to="/login" className="hover:text-white transition-colors duration-150">Log in</Link>
//           <Link to="/signup" className="hover:text-white transition-colors duration-150">Sign up</Link>
//           <Link to="/signup?role=tutor" className="hover:text-white transition-colors duration-150">Join as tutor</Link>
//         </div>

//         <div className="flex flex-col gap-2 text-sm">
//           <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[12px]">Company</span>
//           <a href="#about" className="hover:text-white transition-colors duration-150">About</a>
//           <a href="#blog" className="hover:text-white transition-colors duration-150">Blog</a>
//           <a href="#privacy" className="hover:text-white transition-colors duration-150">Privacy</a>
//         </div>

//       </div>
//     </div>

//     <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-blue-500/10 text-xs text-[#4a6080]">
//       © 2025 TutorFolio. Made in India 🇮🇳
//     </div>

//   </footer>
// </section>
//     </div>
//   );
// }

// export default Home;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <section
        id="navbar"
        className="bg-[#0a1628] border-b border-blue-500/10 px-5 md:px-35 sm:px-8 flex justify-between items-center py-3 md:gap-24"
      >
        <div>
          <img src="/tf-logo.png" alt="Logo" className="w-28 sm:w-49" />
        </div>

        <div className="hidden md:flex gap-8">
          <a
            href="#home"
            className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
          >
            Home
          </a>
          <a
            href="#services"
            className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
          >
            Services
          </a>
          <a
            href="#how-it-works"
            className="text-[#9cb2d2] font-semibold hover:text-white text-lg transition-colors duration-150"
          >
            How it Works
          </a>
        </div>

        <div className="flex gap-2 sm:gap-4">
          <Link
            to="/login"
            className="text-sm sm:text-lg text-[#94a8c7] border-2 border-blue-400/30 hover:text-white hover:border-blue-400/60 px-3 sm:px-4 py-1.5 rounded-md transition-all duration-150"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm sm:text-lg text-white bg-blue-700 hover:bg-blue-600 px-3 sm:px-4 py-1.5 rounded-md transition-colors duration-150"
          >
            Sign Up
          </Link>
        </div>
      </section>

      <section
        id="home"
        className="relative bg-[#0a1628] px-5 sm:px-8 md:px-35 py-16 md:py-24 overflow-hidden"
      >
        {/* <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            background: `radial-gradient(
      350px circle at ${mousePosition.x}px ${mousePosition.y}px,
      rgba(59,130,246,0.12),
      transparent 70%
    )`,
          }}
        /> */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-14">
          {/* LEFT CONTENT */}
          <div className="max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center border border-blue-500/20 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
              India's Tutor Portfolio Platform
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Build Your
              <span className="text-blue-500"> Teaching Portfolio</span>
              <br />
              Get Discovered By Students.
            </h1>

            <p className="mt-6 text-lg text-[#94a8c7] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Create a professional tutor profile, showcase your expertise,
              teaching experience, qualifications and connect directly with
              students looking for the right tutor.
            </p>

            {/* CTA */}
            <div
              className="
          mt-8
          flex
          flex-col
          sm:flex-row
          justify-center
          lg:justify-start
          gap-4
        "
            >
              <Link
                to="/signup"
                className="
            bg-blue-600
            hover:bg-blue-500
            text-white
            font-medium
            px-7
            py-3
            rounded-lg
            transition-colors
          "
              >
                Get Started Free
              </Link>

              <a
                href="#how-it-works"
                className="
            border
            border-blue-400/20
            hover:border-blue-400/50
            text-[#dce8ff]
            px-7
            py-3
            rounded-lg
            font-medium
            transition-all
          "
              >
                See How It Works
              </a>
            </div>

            {/* TRUST PILLS */}
            <div
              className="
          mt-8
          flex
          flex-wrap
          justify-center
          lg:justify-start
          gap-3
        "
            >
              <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
                Portfolio-Based Profiles
              </div>

              <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
                Direct Student Connections
              </div>

              <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
                Built For Indian Tutors
              </div>
            </div>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="hidden md:block w-full max-w-lg">
            <div
              className="
          bg-[#0f1f36]
          border
          border-blue-500/10
          rounded-3xl
          p-5
          shadow-2xl
        "
            >
              {/* browser dots */}
              <div className="flex gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>

              <div className="bg-[#132846] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Tutor Portfolio
                    </h3>

                    <p className="text-[#94a8c7] text-sm">
                      Professional profile preview
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#0a1628] rounded-xl p-4">
                    <p className="text-blue-400 text-sm mb-1">Subjects</p>

                    <p className="text-white">
                      Mathematics • Physics • Chemistry
                    </p>
                  </div>

                  <div className="bg-[#0a1628] rounded-xl p-4">
                    <p className="text-blue-400 text-sm mb-1">Showcase</p>

                    <p className="text-white">
                      Experience, Qualifications & Achievements
                    </p>
                  </div>

                  <div className="bg-[#0a1628] rounded-xl p-4">
                    <p className="text-blue-400 text-sm mb-1">Connect</p>

                    <p className="text-white">
                      Receive enquiries from students directly
                    </p>
                  </div>
                </div>

                <button
                  className="
              mt-5
              w-full
              bg-blue-600
              hover:bg-blue-500
              text-white
              py-3
              rounded-xl
              transition-colors
            "
                >
                  View Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="bg-[#0a1628] px-5 sm:px-8 md:px-35 py-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-400 text-sm font-medium">
              WHY TUTORFOLIO
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Everything A Tutor Needs To Stand Out
            </h2>

            <p className="text-[#94a8c7] mt-4 max-w-2xl mx-auto">
              Built to help tutors present themselves professionally, get
              discovered by students, and manage enquiries effortlessly.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Large Card */}

            <div
              className="
          lg:col-span-3
          bg-[#0f1f36]
          border border-blue-500/10
          rounded-3xl
          p-8
          hover:border-blue-500/20
          transition-all
        "
            >
              <div className="max-w-2xl">
                <span className="text-blue-400 text-sm">PORTFOLIO FIRST</span>

                <h3 className="text-white text-2xl font-semibold mt-2">
                  Create a profile that speaks for you.
                </h3>

                <p className="text-[#94a8c7] mt-4 leading-relaxed">
                  Showcase your qualifications, teaching experience, subjects,
                  achievements and teaching style in one professional portfolio.
                </p>
              </div>
            </div>

            {/* Card 2 */}

            <div
              className="
          bg-[#0f1f36]
          border border-blue-500/10
          rounded-3xl
          p-7
          hover:border-blue-500/20
          transition-all
        "
            >
              <div className="text-4xl mb-5">🔍</div>

              <h3 className="text-white text-xl font-semibold">
                Get Discovered
              </h3>

              <p className="text-[#94a8c7] mt-3 leading-relaxed">
                Students can browse and compare tutors based on expertise,
                subjects and experience.
              </p>
            </div>

            {/* Card 3 */}

            <div
              className="
          bg-[#0f1f36]
          border border-blue-500/10
          rounded-3xl
          p-7
          hover:border-blue-500/20
          transition-all
        "
            >
              <div className="text-4xl mb-5">💬</div>

              <h3 className="text-white text-xl font-semibold">
                Direct Enquiries
              </h3>

              <p className="text-[#94a8c7] mt-3 leading-relaxed">
                Receive student enquiries directly and start conversations
                without unnecessary steps.
              </p>
            </div>

            {/* Card 4 */}

            <div
              className="
          bg-[#0f1f36]
          border border-blue-500/10
          rounded-3xl
          p-7
          hover:border-blue-500/20
          transition-all
        "
            >
              <div className="text-4xl mb-5">📍</div>

              <h3 className="text-white text-xl font-semibold">
                Local Discovery
              </h3>

              <p className="text-[#94a8c7] mt-3 leading-relaxed">
                Help nearby students find tutors in their city or preferred
                learning mode.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="bg-[#0a1628] px-5 sm:px-8 md:px-35 py-24"
      >
        <div className="max-w-6xl mx-auto">
          {/* Heading */}

          <div className="text-center mb-20">
            <span className="text-blue-400 text-sm font-medium">
              HOW IT WORKS
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              From Profile To Student Connection
            </h2>

            <p className="text-[#94a8c7] mt-4 max-w-2xl mx-auto">
              TutorFolio keeps the process simple so tutors can focus on
              teaching instead of marketing themselves.
            </p>
          </div>

          {/* Desktop Timeline */}

          <div className="hidden lg:block relative">
            <div className="absolute top-6 left-0 w-full h-[2px] bg-blue-500/10"></div>

            <div className="grid grid-cols-3 gap-10 relative">
              {/* Step 1 */}

              <div>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-6">
                  1
                </div>

                <h3 className="text-white text-xl font-semibold">
                  Create Your Portfolio
                </h3>

                <p className="text-[#94a8c7] mt-3 leading-relaxed">
                  Add your subjects, qualifications, experience and teaching
                  approach in a professional portfolio.
                </p>
              </div>

              {/* Step 2 */}

              <div>
                <div className="w-12 h-12 rounded-full bg-[#11213c] border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-6">
                  2
                </div>

                <h3 className="text-white text-xl font-semibold">
                  Get Discovered
                </h3>

                <p className="text-[#94a8c7] mt-3 leading-relaxed">
                  Students explore tutor portfolios and find educators that
                  match their learning needs.
                </p>
              </div>

              {/* Step 3 */}

              <div>
                <div className="w-12 h-12 rounded-full bg-[#11213c] border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-6">
                  3
                </div>

                <h3 className="text-white text-xl font-semibold">
                  Start Connecting
                </h3>

                <p className="text-[#94a8c7] mt-3 leading-relaxed">
                  Receive enquiries and continue the conversation directly with
                  interested students.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Timeline */}

          <div className="lg:hidden flex flex-col gap-10">
            {[
              {
                step: "1",
                title: "Create Your Portfolio",
                desc: "Add your subjects, qualifications, experience and teaching approach.",
              },
              {
                step: "2",
                title: "Get Discovered",
                desc: "Students browse portfolios and find suitable tutors.",
              },
              {
                step: "3",
                title: "Start Connecting",
                desc: "Receive enquiries and connect with interested students.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {item.step}
                  </div>

                  {item.step !== "3" && (
                    <div className="w-[2px] h-full bg-blue-500/10 mt-2"></div>
                  )}
                </div>

                <div className="pb-6">
                  <h3 className="text-white text-lg font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-[#94a8c7] mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <footer className="bg-[#0a1628] border-t border-blue-500/10 px-5 sm:px-8 py-10 sm:py-12">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-8">
            <div>
              <img src="/tf-logo.png" alt="Logo" className="w-38 sm:w-50" />
              <p className="text-sm text-[#94a8c7] max-w-xs leading-relaxed mt-2">
                The tuition marketplace for India - local, verified,
                portfolio-first.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:flex-row gap-6 sm:gap-8 text-[#94a8c7] w-full sm:w-auto">
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
                  Platform
                </span>
                <a
                  href="#how-it-works"
                  className="hover:text-white transition-colors duration-150"
                >
                  How it works
                </a>
                <a
                  href="#tutors"
                  className="hover:text-white transition-colors duration-150"
                >
                  Find tutors
                </a>
                <a
                  href="#services"
                  className="hover:text-white transition-colors duration-150"
                >
                  Services
                </a>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
                  Account
                </span>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors duration-150"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="hover:text-white transition-colors duration-150"
                >
                  Sign up
                </Link>
                <Link
                  to="/signup?role=tutor"
                  className="hover:text-white transition-colors duration-150"
                >
                  Join as tutor
                </Link>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
                  Company
                </span>
                <a
                  href="#about"
                  className="hover:text-white transition-colors duration-150"
                >
                  About
                </a>
                <a
                  href="#blog"
                  className="hover:text-white transition-colors duration-150"
                >
                  Blog
                </a>
                <a
                  href="#privacy"
                  className="hover:text-white transition-colors duration-150"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-blue-500/10 text-xs text-[#4a6080]">
            © 2025 TutorFolio. Made in India 🇮🇳
          </div>
        </footer>
      </section>
    </div>
  );
}

export default Home;
