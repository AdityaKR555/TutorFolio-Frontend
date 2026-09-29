import React from "react";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-[#94a8c7] text-sm mb-2">
            Welcome back
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Hello, {user?.username} 👋
          </h1>

          <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
            Manage your tutoring profile, students and batches from here.
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-2xl p-5">
            <p className="text-[#94a8c7] text-sm">
              Tuition Details
            </p>

            <h2 className="text-xl font-semibold text-white mt-2">
              Not added
            </h2>

            <p className="text-[#6b7f9f] text-xs mt-2">
              Add your tuition information
            </p>
          </div>

          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-2xl p-5">
            <p className="text-[#94a8c7] text-sm">
              Students
            </p>

            <h2 className="text-xl font-semibold text-white mt-2">
              0
            </h2>

            <p className="text-[#6b7f9f] text-xs mt-2">
              Your students will appear here
            </p>
          </div>

          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-2xl p-5">
            <p className="text-[#94a8c7] text-sm">
              Achievements
            </p>

            <h2 className="text-xl font-semibold text-white mt-2">
              0
            </h2>

            <p className="text-[#6b7f9f] text-xs mt-2">
              Add student achievements
            </p>
          </div>

          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-2xl p-5">
            <p className="text-[#94a8c7] text-sm">
              Batches
            </p>

            <h2 className="text-xl font-semibold text-white mt-2">
              0
            </h2>

            <p className="text-[#6b7f9f] text-xs mt-2">
              Manage your batches
            </p>
          </div>
        </div>

        {/* Getting started */}
        <div className="mt-6 bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Get started
          </h2>

          <p className="text-[#94a8c7] mt-2 text-sm">
            Complete your tutor profile to start building your TutorFolio.
          </p>

          <button
            className="mt-5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;