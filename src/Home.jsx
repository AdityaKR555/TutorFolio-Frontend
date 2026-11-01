// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";

// function Home() {
//   return (
//     <div>
//       <section
//         id="navbar"
//         className="bg-[#0a1628] border-b border-blue-500/10 px-5 md:px-35 sm:px-8 flex justify-between items-center py-3 md:gap-24"
//       >
//         <div>
//           <img src="/tf-logo.png" alt="Logo" className="w-28 sm:w-49" />
//         </div>

//         <div className="hidden md:flex gap-8">
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

//         <div className="flex gap-2 sm:gap-4">
//           <Link
//             to="/login"
//             className="text-sm sm:text-lg text-[#94a8c7] border-2 border-blue-400/30 hover:text-white hover:border-blue-400/60 px-3 sm:px-4 py-1.5 rounded-md transition-all duration-150"
//           >
//             Login
//           </Link>
//           <Link
//             to="/signup"
//             className="text-sm sm:text-lg text-white bg-blue-700 hover:bg-blue-600 px-3 sm:px-4 py-1.5 rounded-md transition-colors duration-150"
//           >
//             Sign Up
//           </Link>
//         </div>
//       </section>

//       <section
//         id="home"
//         className="relative bg-[#0a1628] px-5 sm:px-8 md:px-35 py-16 md:py-24 overflow-hidden"
//       >
//         {/* <div
//           className="absolute inset-0 pointer-events-none transition-all duration-200"
//           style={{
//             background: `radial-gradient(
//       350px circle at ${mousePosition.x}px ${mousePosition.y}px,
//       rgba(59,130,246,0.12),
//       transparent 70%
//     )`,
//           }}
//         /> */}
//         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-14">
//           {/* LEFT CONTENT */}
//           <div className="max-w-2xl text-center lg:text-left">
//             <span className="inline-flex items-center border border-blue-500/20 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
//               India's Tutor Portfolio Platform
//             </span>

//             <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
//               Build Your
//               <span className="text-blue-500"> Teaching Portfolio</span>
//               <br />
//               Get Discovered By Students.
//             </h1>

//             <p className="mt-6 text-lg text-[#94a8c7] leading-relaxed max-w-xl mx-auto lg:mx-0">
//               Create a professional tutor profile, showcase your expertise,
//               teaching experience, qualifications and connect directly with
//               students looking for the right tutor.
//             </p>

//             {/* CTA */}
//             <div
//               className="
//           mt-8
//           flex
//           flex-col
//           sm:flex-row
//           justify-center
//           lg:justify-start
//           gap-4
//         "
//             >
//               <Link
//                 to="/signup"
//                 className="
//             bg-blue-600
//             hover:bg-blue-500
//             text-white
//             font-medium
//             px-7
//             py-3
//             rounded-lg
//             transition-colors
//           "
//               >
//                 Get Started Free
//               </Link>

//               <a
//                 href="#how-it-works"
//                 className="
//             border
//             border-blue-400/20
//             hover:border-blue-400/50
//             text-[#dce8ff]
//             px-7
//             py-3
//             rounded-lg
//             font-medium
//             transition-all
//           "
//               >
//                 See How It Works
//               </a>
//             </div>

//             {/* TRUST PILLS */}
//             <div
//               className="
//           mt-8
//           flex
//           flex-wrap
//           justify-center
//           lg:justify-start
//           gap-3
//         "
//             >
//               <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
//                 Portfolio-Based Profiles
//               </div>

//               <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
//                 Direct Student Connections
//               </div>

//               <div className="bg-[#11213c] border border-blue-500/10 px-4 py-2 rounded-full text-sm text-[#c7d8f5]">
//                 Built For Indian Tutors
//               </div>
//             </div>
//           </div>

//           {/* RIGHT PREVIEW */}
//           <div className="hidden md:block w-full max-w-lg">
//             <div
//               className="
//           bg-[#0f1f36]
//           border
//           border-blue-500/10
//           rounded-3xl
//           p-5
//           shadow-2xl
//         "
//             >
//               {/* browser dots */}
//               <div className="flex gap-2 mb-5">
//                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
//                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
//               </div>

//               <div className="bg-[#132846] rounded-2xl p-5">
//                 <div className="flex items-center gap-3 mb-5">
//                   <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
//                     <span className="text-2xl">🎓</span>
//                   </div>

//                   <div>
//                     <h3 className="text-white font-semibold text-lg">
//                       Tutor Portfolio
//                     </h3>

//                     <p className="text-[#94a8c7] text-sm">
//                       Professional profile preview
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="bg-[#0a1628] rounded-xl p-4">
//                     <p className="text-blue-400 text-sm mb-1">Subjects</p>

//                     <p className="text-white">
//                       Mathematics • Physics • Chemistry
//                     </p>
//                   </div>

//                   <div className="bg-[#0a1628] rounded-xl p-4">
//                     <p className="text-blue-400 text-sm mb-1">Showcase</p>

//                     <p className="text-white">
//                       Experience, Qualifications & Achievements
//                     </p>
//                   </div>

//                   <div className="bg-[#0a1628] rounded-xl p-4">
//                     <p className="text-blue-400 text-sm mb-1">Connect</p>

//                     <p className="text-white">
//                       Receive enquiries from students directly
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   className="
//               mt-5
//               w-full
//               bg-blue-600
//               hover:bg-blue-500
//               text-white
//               py-3
//               rounded-xl
//               transition-colors
//             "
//                 >
//                   View Portfolio
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section
//         id="services"
//         className="bg-[#0a1628] px-5 sm:px-8 md:px-35 py-20"
//       >
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-14">
//             <span className="text-blue-400 text-sm font-medium">
//               WHY TUTORFOLIO
//             </span>

//             <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
//               Everything A Tutor Needs To Stand Out
//             </h2>

//             <p className="text-[#94a8c7] mt-4 max-w-2xl mx-auto">
//               Built to help tutors present themselves professionally, get
//               discovered by students, and manage enquiries effortlessly.
//             </p>
//           </div>

//           <div className="grid lg:grid-cols-3 gap-5">
//             {/* Large Card */}

//             <div
//               className="
//           lg:col-span-3
//           bg-[#0f1f36]
//           border border-blue-500/10
//           rounded-3xl
//           p-8
//           hover:border-blue-500/20
//           transition-all
//         "
//             >
//               <div className="max-w-2xl">
//                 <span className="text-blue-400 text-sm">PORTFOLIO FIRST</span>

//                 <h3 className="text-white text-2xl font-semibold mt-2">
//                   Create a profile that speaks for you.
//                 </h3>

//                 <p className="text-[#94a8c7] mt-4 leading-relaxed">
//                   Showcase your qualifications, teaching experience, subjects,
//                   achievements and teaching style in one professional portfolio.
//                 </p>
//               </div>
//             </div>

//             {/* Card 2 */}

//             <div
//               className="
//           bg-[#0f1f36]
//           border border-blue-500/10
//           rounded-3xl
//           p-7
//           hover:border-blue-500/20
//           transition-all
//         "
//             >
//               <div className="text-4xl mb-5">🔍</div>

//               <h3 className="text-white text-xl font-semibold">
//                 Get Discovered
//               </h3>

//               <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                 Students can browse and compare tutors based on expertise,
//                 subjects and experience.
//               </p>
//             </div>

//             {/* Card 3 */}

//             <div
//               className="
//           bg-[#0f1f36]
//           border border-blue-500/10
//           rounded-3xl
//           p-7
//           hover:border-blue-500/20
//           transition-all
//         "
//             >
//               <div className="text-4xl mb-5">💬</div>

//               <h3 className="text-white text-xl font-semibold">
//                 Direct Enquiries
//               </h3>

//               <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                 Receive student enquiries directly and start conversations
//                 without unnecessary steps.
//               </p>
//             </div>

//             {/* Card 4 */}

//             <div
//               className="
//           bg-[#0f1f36]
//           border border-blue-500/10
//           rounded-3xl
//           p-7
//           hover:border-blue-500/20
//           transition-all
//         "
//             >
//               <div className="text-4xl mb-5">📍</div>

//               <h3 className="text-white text-xl font-semibold">
//                 Local Discovery
//               </h3>

//               <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                 Help nearby students find tutors in their city or preferred
//                 learning mode.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>
//       <section
//         id="how-it-works"
//         className="bg-[#0a1628] px-5 sm:px-8 md:px-35 py-24"
//       >
//         <div className="max-w-6xl mx-auto">
//           {/* Heading */}

//           <div className="text-center mb-20">
//             <span className="text-blue-400 text-sm font-medium">
//               HOW IT WORKS
//             </span>

//             <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
//               From Profile To Student Connection
//             </h2>

//             <p className="text-[#94a8c7] mt-4 max-w-2xl mx-auto">
//               TutorFolio keeps the process simple so tutors can focus on
//               teaching instead of marketing themselves.
//             </p>
//           </div>

//           {/* Desktop Timeline */}

//           <div className="hidden lg:block relative">
//             <div className="absolute top-6 left-0 w-full h-[2px] bg-blue-500/10"></div>

//             <div className="grid grid-cols-3 gap-10 relative">
//               {/* Step 1 */}

//               <div>
//                 <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-6">
//                   1
//                 </div>

//                 <h3 className="text-white text-xl font-semibold">
//                   Create Your Portfolio
//                 </h3>

//                 <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                   Add your subjects, qualifications, experience and teaching
//                   approach in a professional portfolio.
//                 </p>
//               </div>

//               {/* Step 2 */}

//               <div>
//                 <div className="w-12 h-12 rounded-full bg-[#11213c] border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-6">
//                   2
//                 </div>

//                 <h3 className="text-white text-xl font-semibold">
//                   Get Discovered
//                 </h3>

//                 <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                   Students explore tutor portfolios and find educators that
//                   match their learning needs.
//                 </p>
//               </div>

//               {/* Step 3 */}

//               <div>
//                 <div className="w-12 h-12 rounded-full bg-[#11213c] border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-6">
//                   3
//                 </div>

//                 <h3 className="text-white text-xl font-semibold">
//                   Start Connecting
//                 </h3>

//                 <p className="text-[#94a8c7] mt-3 leading-relaxed">
//                   Receive enquiries and continue the conversation directly with
//                   interested students.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Mobile Timeline */}

//           <div className="lg:hidden flex flex-col gap-10">
//             {[
//               {
//                 step: "1",
//                 title: "Create Your Portfolio",
//                 desc: "Add your subjects, qualifications, experience and teaching approach.",
//               },
//               {
//                 step: "2",
//                 title: "Get Discovered",
//                 desc: "Students browse portfolios and find suitable tutors.",
//               },
//               {
//                 step: "3",
//                 title: "Start Connecting",
//                 desc: "Receive enquiries and connect with interested students.",
//               },
//             ].map((item) => (
//               <div key={item.step} className="flex gap-4">
//                 <div className="flex flex-col items-center">
//                   <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
//                     {item.step}
//                   </div>

//                   {item.step !== "3" && (
//                     <div className="w-[2px] h-full bg-blue-500/10 mt-2"></div>
//                   )}
//                 </div>

//                 <div className="pb-6">
//                   <h3 className="text-white text-lg font-semibold">
//                     {item.title}
//                   </h3>

//                   <p className="text-[#94a8c7] mt-2 leading-relaxed">
//                     {item.desc}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section>
//         <footer className="bg-[#0a1628] border-t border-blue-500/10 px-5 sm:px-8 py-10 sm:py-12">
//           <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-8">
//             <div>
//               <img src="/tf-logo.png" alt="Logo" className="w-38 sm:w-50" />
//               <p className="text-sm text-[#94a8c7] max-w-xs leading-relaxed mt-2">
//                 The tuition marketplace for India - local, verified,
//                 portfolio-first.
//               </p>
//             </div>

//             <div className="grid grid-cols-3 sm:flex sm:flex-row gap-6 sm:gap-8 text-[#94a8c7] w-full sm:w-auto">
//               <div className="flex flex-col gap-2 text-sm">
//                 <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
//                   Platform
//                 </span>
//                 <a
//                   href="#how-it-works"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   How it works
//                 </a>
//                 <a
//                   href="#tutors"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Find tutors
//                 </a>
//                 <a
//                   href="#services"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Services
//                 </a>
//               </div>

//               <div className="flex flex-col gap-2 text-sm">
//                 <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
//                   Account
//                 </span>
//                 <Link
//                   to="/login"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Log in
//                 </Link>
//                 <Link
//                   to="/signup"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Sign up
//                 </Link>
//                 <Link
//                   to="/signup?role=tutor"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Join as tutor
//                 </Link>
//               </div>

//               <div className="flex flex-col gap-2 text-sm">
//                 <span className="font-bold text-[#e2eaf7] mb-1 uppercase tracking-wider text-[11px] sm:text-[12px]">
//                   Company
//                 </span>
//                 <a
//                   href="#about"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   About
//                 </a>
//                 <a
//                   href="#blog"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Blog
//                 </a>
//                 <a
//                   href="#privacy"
//                   className="hover:text-white transition-colors duration-150"
//                 >
//                   Privacy
//                 </a>
//               </div>
//             </div>
//           </div>

//           <div className="max-w-6xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-blue-500/10 text-xs text-[#4a6080]">
//             © 2025 TutorFolio. Made in India 🇮🇳
//           </div>
//         </footer>
//       </section>
//     </div>
//   );
// }

// export default Home;

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ---------- styles (fonts, hero entrance, reveal, reduced motion) ---------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,600&display=swap');
html{scroll-behavior:smooth}
.tf{font-family:'Instrument Sans',system-ui,sans-serif}
.tf-d{font-family:'Bricolage Grotesque','Instrument Sans',sans-serif;letter-spacing:-.025em}
.tf-s{font-family:'Fraunces',Georgia,serif}
.tf [id]{scroll-margin-top:84px}
.tf-grid{background-image:linear-gradient(rgba(148,168,199,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(148,168,199,.05) 1px,transparent 1px),linear-gradient(rgba(148,168,199,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(148,168,199,.09) 1px,transparent 1px);background-size:28px 28px,28px 28px,140px 140px,140px 140px;background-position:-1px -1px;-webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 25%,#000 20%,transparent 100%);mask-image:radial-gradient(ellipse 85% 75% at 50% 25%,#000 20%,transparent 100%)}
@keyframes tfUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes tfWin{from{opacity:0;transform:translateY(40px) rotate(1.5deg)}to{opacity:1;transform:none}}
.hero-in{opacity:0;animation:tfUp .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--i)*110ms + 80ms)}
.hero-win{opacity:0;animation:tfWin 1.1s cubic-bezier(.2,.7,.2,1) .3s forwards}
.rv{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0ms)}
.rv.in{opacity:1;transform:none}
.line-x{transform:scaleX(0);transform-origin:left;transition:transform 1.4s cubic-bezier(.6,0,.2,1) .2s}
.in .line-x,.line-x.in{transform:none}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .hero-in,.hero-win{opacity:1;animation:none}
  .rv{opacity:1;transform:none;transition:none}
  .line-x{transform:none;transition:none}
  .tf *{transition-duration:0s!important}
}
`;

/* ---------- hooks ---------- */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function useScrollFrame(fn) {
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      fn();
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line
  }, []);
}

function Rv({ children, d = 0, className = "" }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`rv ${className}`} style={{ "--d": `${d}ms` }}>
      {children}
    </div>
  );
}

/* ---------- icons (inline SVG) ---------- */
const P = {
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  check: "M5 12.5l4.5 4.5L19 7.5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  award: "M12 14a6 6 0 100-12 6 6 0 000 12zM8.5 13l-1.5 8 5-3 5 3-1.5-8",
  pin: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};
const Ic = ({ n, c = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={c} aria-hidden="true">
    <path d={P[n]} />
  </svg>
);

const Grid = () => <div aria-hidden="true" className="tf-grid pointer-events-none absolute inset-0" />;

/* ---------- buttons ---------- */
const BtnPrimary = ({ to, children }) => (
  <Link to={to} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
    {children}
    <Ic n="arrow" c="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
  </Link>
);
const BtnGhost = ({ href, children }) => (
  <a href={href} className="inline-flex items-center justify-center rounded-lg border border-blue-400/25 px-6 py-3.5 font-semibold text-[#dce8ff] transition hover:border-blue-400/60 hover:bg-white/[.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
    {children}
  </a>
);

/* ---------- illustrative teacher website ---------- */
function Frame({ children, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 bg-[#0f1f36] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] ${className}`}>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/15" />
          ))}
        </div>
        <div className="mx-auto truncate rounded-md bg-[#0a1628] px-4 py-1 text-xs text-[#94a8c7]">Ananya Sharma · TutorFolio</div>
        <span className="w-10" />
      </div>
      {children}
    </div>
  );
}

const Blk = ({ k, a, children, c = "" }) => (
  <div
    className={`rounded-lg border bg-white p-3 transition-all duration-500 ${
      a === k ? "border-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,.2)]" : "border-slate-200"
    } ${a && a !== k ? "opacity-45" : ""} ${c}`}
  >
    {children}
  </div>
);
const Lbl = ({ children }) => <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{children}</p>;

function TeacherSite({ a = null }) {
  return (
    <Frame>
      <div className="space-y-3 bg-[#eef2f9] p-3 text-[#0f1f36] sm:p-5">
        <Blk k="profile" a={a}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">AS</div>
            <div className="min-w-0 flex-1">
              <p className="tf-s text-lg leading-tight">Ananya Sharma</p>
              <p className="text-xs text-slate-500">Mathematics Educator</p>
            </div>
            <span className="rounded-md bg-[#0f1f36] px-3 py-1.5 text-xs font-medium text-white">Message</span>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">I help school students build strong foundations and confidence in maths and physics, one concept at a time.</p>
        </Blk>
        <div className="grid gap-3 sm:grid-cols-2">
          <Blk k="subjects" a={a}>
            <Lbl>Subjects</Lbl>
            <div className="flex flex-wrap gap-1.5">
              {["Mathematics", "Physics"].map((s) => (
                <span key={s} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{s}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Classes 9–12</p>
          </Blk>
          <Blk k="credentials" a={a}>
            <Lbl>Experience & qualifications</Lbl>
            <ul className="space-y-1 text-xs text-slate-700">
              <li>6+ years of teaching</li>
              <li>M.Sc. Mathematics, B.Ed.</li>
              <li>Certified in online teaching</li>
            </ul>
          </Blk>
        </div>
        <Blk k="batches" a={a}>
          <Lbl>Current batches</Lbl>
          <div className="divide-y divide-slate-100 text-xs">
            {[
              ["Class 10 Mathematics", "Mon · Wed · Fri, 5:00 PM"],
              ["Class 12 Physics", "Tue · Thu, 6:30 PM"],
            ].map(([t, s]) => (
              <div key={t} className="flex items-center justify-between gap-3 py-1.5">
                <span className="font-medium">{t}</span>
                <span className="text-slate-500">{s}</span>
              </div>
            ))}
          </div>
        </Blk>
        <Blk k="contact" a={a} c="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">Interested in joining a batch?</p>
          <span className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">Send an enquiry</span>
        </Blk>
      </div>
    </Frame>
  );
}

/* ---------- nav ---------- */
const LINKS = [
  ["problem", "Why TutorFolio"],
  ["website", "Your website"],
  ["discover", "Discovery"],
  ["how-it-works", "How it works"],
];

function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [cur, setCur] = useState("");
  useScrollFrame(() => {
    setSolid(window.scrollY > 12);
    let id = "";
    for (const [h] of LINKS) {
      const el = document.getElementById(h);
      if (el && el.getBoundingClientRect().top < 140) id = h;
    }
    setCur(id);
  });
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const k = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${solid || open ? "border-white/10 bg-[#0a1628]/90 backdrop-blur-md" : "border-transparent"}`}>
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
          <a href="#top" onClick={() => setOpen(false)} className="justify-self-start" aria-label="TutorFolio home">
            <img src="/tf-logo.png" alt="TutorFolio" className="w-14 sm:w-22" />
          </a>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[.03] p-1 md:flex" aria-label="Primary">
            {LINKS.map(([h, t]) => (
              <a key={h} href={`#${h}`} aria-current={cur === h ? "true" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${cur === h ? "bg-white/10 text-white" : "text-[#9cb2d2] hover:text-white"}`}>{t}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end sm:gap-3">
            <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-medium text-[#c7d8f5] transition hover:text-white sm:block">Log in</Link>
            <Link to="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">Sign up</Link>
            <button onClick={() => setOpen(!open)} className="rounded-lg border border-white/10 p-2 text-[#c7d8f5] md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              <Ic n={open ? "x" : "menu"} c="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-[#0a1628] px-5 pb-8 pt-2 md:hidden">
          <nav aria-label="Mobile" className="flex-1">
            {LINKS.map(([h, t]) => (
              <a key={h} href={`#${h}`} onClick={() => setOpen(false)} className="tf-d flex items-center justify-between border-b border-white/10 py-5 text-2xl font-semibold text-white">
                {t}
                <Ic n="arrow" c="w-5 h-5 text-[#5f7aa0]" />
              </a>
            ))}
          </nav>
          <div className="grid gap-3">
            <BtnPrimary to="/signup">Get Started Free</BtnPrimary>
            <Link to="/login" className="rounded-lg border border-white/15 py-3.5 text-center font-semibold text-[#dce8ff]">Log in</Link>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- hero ---------- */
function Hero() {
  const ref = useRef(null);
  useScrollFrame(() => {
    const y = window.scrollY;
    if (ref.current && y < 1000) ref.current.style.setProperty("--sy", y);
  });
  return (
    <section id="top" ref={ref} className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 sm:pt-32 lg:pb-28 lg:pt-40" style={{ "--sy": 0 }}>
      <Grid />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h1 className="tf-d hero-in text-[2.6rem] font-bold leading-[1.04] text-white sm:text-6xl" style={{ "--i": 0 }}>
            Your teaching deserves a website of its own.
          </h1>
          <p className="hero-in mt-6 max-w-lg text-lg leading-relaxed text-[#94a8c7]" style={{ "--i": 1 }}>
            TutorFolio gives you a professional page for your subjects, qualifications, batches and contact details, so students can find you and write to you in one place.
          </p>
          <div className="hero-in mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--i": 2 }}>
            <BtnPrimary to="/signup">Get Started Free</BtnPrimary>
            <BtnGhost href="#how-it-works">Explore How It Works</BtnGhost>
          </div>
        </div>

        <div>
          <div className="relative">
            <div className="hero-win" style={{ transform: "translateY(calc(var(--sy) * -0.04px))" }}>
              <TeacherSite />
            </div>
            <div className="hero-win absolute -bottom-8 right-3 w-56 sm:-right-4 sm:bottom-8 sm:w-60" style={{ animationDelay: ".7s" }}>
              <div style={{ transform: "translateY(calc(var(--sy) * -0.1px))" }} className="rounded-xl border border-white/10 bg-[#11213c]/95 p-3.5 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-[#9cb2d2]"><Ic n="mail" c="w-4 h-4 text-blue-400" />New enquiry</div>
                <p className="mt-1.5 text-[13px] leading-snug text-white">“Do you have a seat in the Class 10 maths batch?”</p>
              </div>
            </div>
          </div>
          <p className="mt-12 text-xs text-[#6d86aa] sm:mt-4">Illustrative example of a teacher’s TutorFolio page.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- problem ---------- */
const PROBLEMS = [
  ["user", "No page of your own", "Students can’t look you up and see who you are as a teacher."],
  ["layers", "Details live everywhere", "Qualifications in one place, results in another, contact details in a chat."],
  ["eye", "Experience stays invisible", "Years of teaching don’t show unless someone already knows you."],
  ["link", "Referrals set the limit", "Your next student usually comes from whoever already knows you."],
];

function Problem() {
  return (
    <section id="problem" className="border-t border-blue-500/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.1fr]">
        <Rv>
          <h2 className="tf-d text-4xl font-bold leading-[1.08] text-white sm:text-5xl">Good teachers are hard to find online.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#94a8c7]">Not because they aren’t good. Because there’s nowhere for a student to see what they offer.</p>
        </Rv>
        <div>
          {PROBLEMS.map(([ic, t, d], i) => (
            <Rv key={t} d={i * 90}>
              <div className="flex gap-5 border-t border-blue-500/15 py-6">
                <span className="mt-1 text-blue-400"><Ic n={ic} c="w-6 h-6" /></span>
                <div>
                  <h3 className="tf-d text-xl font-semibold text-white">{t}</h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-[#94a8c7]">{d}</p>
                </div>
              </div>
            </Rv>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- transformation ---------- */
function Transformation() {
  const scattered = ["Qualifications, in a drawer", "Contact details, in a chat", "Experience, by word of mouth", "Achievements, in a folder"];
  const together = ["Profile and introduction", "Subjects and classes", "Experience and qualifications", "Achievements", "Tuition and batches", "Contact and enquiries"];
  return (
    <section className="relative overflow-hidden bg-[#0f1f36] px-5 py-24 sm:px-8 lg:py-32">
      <Grid />
      <div className="relative mx-auto max-w-6xl">
        <Rv>
          <h2 className="tf-d max-w-2xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl">Everything a student wants to know, in one place.</h2>
        </Rv>
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1.1fr]">
          <Rv className="rounded-2xl border border-dashed border-blue-400/20 p-7">
            <p className="text-sm font-semibold text-[#94a8c7]">Today</p>
            <ul className="mt-5 space-y-3">
              {scattered.map((s, i) => (
                <li key={s} className="rounded-lg border border-white/5 bg-[#0a1628] px-4 py-3 text-[#9cb2d2]" style={{ marginLeft: `${(i % 2) * 20}px` }}>{s}</li>
              ))}
            </ul>
          </Rv>
          <div className="flex items-center justify-center text-blue-500" aria-hidden="true">
            <Ic n="arrow" c="w-8 h-8 rotate-90 lg:rotate-0" />
          </div>
          <Rv d={150} className="rounded-2xl border border-blue-500/40 bg-[#11213c] p-7">
            <p className="text-sm font-semibold text-blue-300">With TutorFolio</p>
            <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {together.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-white"><Ic n="check" c="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />{s}</li>
              ))}
            </ul>
          </Rv>
        </div>
      </div>
    </section>
  );
}

/* ---------- sticky website showcase ---------- */
const FEATS = [
  ["profile", "user", "Introduce yourself", "A photo, a short introduction and what you do, right at the top of your page."],
  ["subjects", "book", "Subjects and classes", "Say exactly what you teach and which classes you teach it to."],
  ["credentials", "award", "Experience, qualifications and achievements", "Your background, degrees and certifications, together instead of scattered."],
  ["batches", "cal", "Tuition and batches", "List your batches with days and timings so students see what’s on offer."],
  ["contact", "mail", "Contact and enquiries", "A clear way for interested students to reach you."],
];

function Showcase() {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  useScrollFrame(() => {
    const el = ref.current;
    if (!el || window.innerWidth < 1024) return;
    const r = el.getBoundingClientRect();
    const p = Math.min(0.999, Math.max(0, -r.top / (r.height - window.innerHeight)));
    setI(Math.floor(p * FEATS.length));
  });
  return (
    <section id="website" ref={ref} className="border-t border-blue-500/10 lg:h-[380vh]">
      <div className="px-5 py-24 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:py-0">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr] lg:pt-12">
          <div>
            <h2 className="tf-d text-4xl font-bold leading-[1.08] text-white sm:text-5xl">A website that is unmistakably yours.</h2>
            <ul className="mt-9" role="list">
              {FEATS.map(([k, ic, t, d], n) => (
                <li key={k}>
                  <button
                    onClick={() => setI(n)}
                    aria-pressed={i === n}
                    className={`flex w-full gap-4 border-l-2 py-3 pl-5 text-left transition-all duration-300 ${i === n ? "border-blue-500" : "border-blue-500/10 hover:border-blue-500/40"}`}
                  >
                    <span className={`mt-0.5 transition-colors ${i === n ? "text-blue-400" : "text-[#5f7aa0]"}`}><Ic n={ic} /></span>
                    <span>
                      <span className={`block font-semibold transition-colors ${i === n ? "text-white" : "text-[#7f97bb]"}`}>{t}</span>
                      <span className={`grid transition-all duration-300 ${i === n ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 lg:opacity-0"}`}>
                        <span className="overflow-hidden"><span className="mt-1 block text-[15px] leading-relaxed text-[#94a8c7]">{d}</span></span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <TeacherSite a={FEATS[i][0]} />
            <p className="mt-4 text-xs text-[#6d86aa]">Illustrative example. Your page uses your own details.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- discovery ---------- */
function Discovery() {
  return (
    <section id="discover" className="border-t border-blue-500/10 bg-[#0f1f36] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <Rv>
          <h2 className="tf-d text-4xl font-bold leading-[1.08] text-white sm:text-5xl">Be where students are looking.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#94a8c7]">Students browse tutors by what they need, then open full profiles before getting in touch. A complete page gives you more chances to be found and a stronger first impression when you are.</p>
        </Rv>
        <Rv d={120}>
          <div className="rounded-2xl border border-white/10 bg-[#0a1628] p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-[#94a8c7]">
              <Ic n="search" c="w-4 h-4" /> Class 10 Mathematics
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {["Subject", "City", "Online or in person"].map((f) => (
                <span key={f} className="rounded-full border border-blue-400/25 px-3 py-1 text-[#9cb2d2]">{f}</span>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-blue-500/40 bg-blue-600/10 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">AS</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Ananya Sharma</p>
                  <p className="text-sm text-[#94a8c7]">Mathematics Educator · Classes 9–12</p>
                </div>
                <span className="hidden text-sm font-medium text-blue-300 sm:block">View profile</span>
              </div>
              {[0, 1].map((n) => (
                <div key={n} className="flex items-center gap-4 rounded-xl border border-white/5 p-4 opacity-60" aria-hidden="true">
                  <div className="h-11 w-11 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-1/2 rounded bg-white/10" /><div className="h-2.5 w-3/4 rounded bg-white/5" /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6d86aa]">Illustrative example.</p>
        </Rv>
      </div>
    </section>
  );
}

/* ---------- enquiries ---------- */
function Enquiries() {
  return (
    <section className="px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <Rv className="order-2 lg:order-1">
          <div className="max-w-md rounded-2xl bg-[#eef2f9] p-5 text-[#0f1f36] shadow-2xl lg:ml-auto">
            <p className="tf-s text-lg">Write to Ananya</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-slate-500">Rohan’s parent</div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5 leading-relaxed text-slate-700">Hello, my son is in Class 10. Is there a seat in your evening maths batch?</div>
              <div className="rounded-md bg-blue-600 px-3 py-2.5 text-center font-medium text-white">Send enquiry</div>
            </div>
          </div>
          <p className="mt-3 max-w-md text-xs text-[#6d86aa] lg:ml-auto">Illustrative example.</p>
        </Rv>
        <Rv d={120} className="order-1 lg:order-2">
          <h2 className="tf-d text-4xl font-bold leading-[1.08] text-white sm:text-5xl">Students write to you directly.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#94a8c7]">When someone likes what they see, they can send you an enquiry from your page. You see their message and take the conversation from there.</p>
        </Rv>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */
const STEPS = [
  ["Create your account", "Sign up for free. It takes a minute."],
  ["Build your teaching portfolio", "Add your subjects, experience, qualifications, achievements and batches."],
  ["Share, get discovered, connect", "Share your page, appear to students looking for tutors, and receive their enquiries."],
];

function How() {
  const ref = useReveal();
  return (
    <section id="how-it-works" className="relative overflow-hidden border-t border-blue-500/10 bg-[#0f1f36] px-5 py-24 sm:px-8 lg:py-32">
      <Grid />
      <div className="relative mx-auto max-w-6xl">
        <Rv><h2 className="tf-d max-w-xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl">From account to enquiries in three steps.</h2></Rv>
        <div ref={ref} className="rv relative mt-16 grid gap-10 lg:grid-cols-3 lg:gap-8">
          <div aria-hidden="true" className="line-x absolute left-0 right-0 top-[19px] hidden h-px bg-blue-500/30 lg:block" />
          {STEPS.map(([t, d], n) => (
            <div key={t} className="relative flex gap-5 lg:block" style={{ transitionDelay: `${n * 150}ms` }}>
              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${n === 0 ? "bg-blue-600 text-white" : "border border-blue-500/40 bg-[#0f1f36] text-blue-300"}`}>{n + 1}</div>
              <div className="lg:mt-6">
                <h3 className="tf-d text-xl font-semibold text-white">{t}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-[#94a8c7]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- final CTA ---------- */
function Final() {
  return (
    <section className="relative overflow-hidden px-5 py-28 sm:px-8 lg:py-40">
      <Grid />
      <Rv className="relative mx-auto max-w-3xl text-center">
        <h2 className="tf-d text-4xl font-bold leading-[1.06] text-white sm:text-6xl">Your teaching journey deserves more visibility.</h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-[#94a8c7]">Create your professional presence today.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BtnPrimary to="/signup">Get Started Free</BtnPrimary>
          <Link to="/login" className="text-[#9cb2d2] underline-offset-4 transition hover:text-white hover:underline">Already have an account? Log in</Link>
        </div>
      </Rv>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer() {
  const col = (title, items) => (
    <div className="flex flex-col gap-2.5 text-sm">
      <span className="mb-1 font-semibold text-[#e2eaf7]">{title}</span>
      {items.map(([to, t, internal]) =>
        internal ? (
          <Link key={t} to={to} className="text-[#94a8c7] transition-colors hover:text-white">{t}</Link>
        ) : (
          <a key={t} href={to} className="text-[#94a8c7] transition-colors hover:text-white">{t}</a>
        )
      )}
    </div>
  );
  return (
    <footer className="border-t border-blue-500/10 px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 sm:flex-row">
        <div>
          <img src="/tf-logo.png" alt="TutorFolio" className="w-40" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#94a8c7]">A professional online presence for every teacher in India.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16">
          {col("Product", [["#website", "Your website"], ["#discover", "Discovery"], ["#how-it-works", "How it works"]])}
          {col("Account", [["/login", "Log in", true], ["/signup", "Sign up", true], ["/signup?role=tutor", "Join as a tutor", true]])}
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-blue-500/10 pt-6 text-xs text-[#5f7aa0]">© {new Date().getFullYear()} TutorFolio. Made in India.</div>
    </footer>
  );
}

/* ---------- page ---------- */
export default function Home() {
  return (
    <div className="tf min-h-screen overflow-x-clip bg-[#0a1628] text-white antialiased">
      <style>{CSS}</style>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Transformation />
        <Showcase />
        <Discovery />
        <Enquiries />
        <How />
        <Final />
      </main>
      <Footer />
    </div>
  );
}