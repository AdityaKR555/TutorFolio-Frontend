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