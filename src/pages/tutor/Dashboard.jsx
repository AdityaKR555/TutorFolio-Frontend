import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id;
    } catch {
      return null;
    }
  };

  const fetchDashboard = async (isRefresh = false) => {
    const userId = getUserId();

    if (!userId) {
      setError("Your login session could not be found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard/summary", {
        params: {
          userId,
        },
        timeout: 20000,
      });

      const result = response.data;

      if (result?.status === 200 && result?.data) {
        setDashboard(result.data);
      } else if (result?.status === 404) {
        setError(result?.message || "Dashboard data could not be found.");
      } else {
        setError(result?.message || "Unable to load dashboard data.");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      console.error("Backend response:", err.response?.data);

      if (err.code === "ECONNABORTED") {
        setError("The dashboard is taking too long to load. Please try again.");
      } else if (err.response?.status === 404) {
        setError(
          err.response?.data?.message || "Dashboard data could not be found.",
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error.",
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection.",
        );
      } else {
        setError("Something went wrong while loading the dashboard.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const getPercentage = (value, total) => {
    if (!total || total <= 0) {
      return 0;
    }

    return Math.round((Number(value || 0) / total) * 100);
  };

  const getInitials = () => {
    const username = user?.username || "Tutor";

    return username
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const buildDonutGradient = (breakdown = []) => {
    const colors = ["#3b82f6", "#22c55e", "#64748b", "#a855f7", "#f59e0b"];

    let current = 0;

    const parts = breakdown
      .map((item, index) => {
        const percentage = Number(item?.percentage || 0);

        const start = current;
        const end = current + percentage;

        current = end;

        return `${colors[index % colors.length]} ${start}% ${end}%`;
      })
      .join(", ");

    if (!parts) {
      return "conic-gradient(#1e3352 0% 100%)";
    }

    return `conic-gradient(${parts})`;
  };

  if (loading) {
    return (
      <div className="p-5 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-tf-surface border border-tf-line rounded-3xl min-h-[500px] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

            <p className="text-tf-copy mt-4 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-5 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-tf-surface border border-red-200 dark:border-red-500/20 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v3.5m0 3h.01M10.3 4.9L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.9a2 2 0 00-3.4 0z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-tf-ink mt-5">
              Unable to load dashboard
            </h2>

            <p className="text-tf-copy text-sm mt-2 max-w-md">{error}</p>

            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = dashboard?.kpis || {};

  const batchChart = dashboard?.batchesDonut || {};
  const batchData = batchChart?.data || {};

  const ratingChart = dashboard?.ratingSummary || {};
  const ratingData = ratingChart?.data || {};

  const occupancyChart = dashboard?.seatOccupancy || {};
  const occupancyData = occupancyChart?.data || {};

  const revenueChart = dashboard?.revenueAnalytics || {};
  const revenueData = revenueChart?.data || {};

  const achievementChart = dashboard?.achievementsPerformance || {};
  const achievementData = achievementChart?.data || {};

  const classChart = dashboard?.classDistribution || {};
  const classData = classChart?.data || {};

  const batchBreakdown = Array.isArray(batchData?.breakdown)
    ? batchData.breakdown
    : [];

  const ratingDistribution = Array.isArray(ratingData?.distribution)
    ? ratingData.distribution
    : [];

  const occupancyBatches = Array.isArray(occupancyData?.batchOccupancy)
    ? occupancyData.batchOccupancy
    : [];

  const paymentBreakdown = Array.isArray(revenueData?.paymentTypeBreakdown)
    ? revenueData.paymentTypeBreakdown
    : [];

  const topBatchesByFee = Array.isArray(revenueData?.topBatchesByFee)
    ? revenueData.topBatchesByFee
    : [];

  const achievementRatingDistribution = Array.isArray(
    achievementData?.ratingDistribution,
  )
    ? achievementData.ratingDistribution
    : [];

  const topTags = Array.isArray(achievementData?.topTags)
    ? achievementData.topTags
    : [];

  const classBreakdown = Array.isArray(classData?.classBreakdown)
    ? classData.classBreakdown
    : [];

  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-tf-copy text-sm mb-2">Tutor Dashboard</p>

            <h1 className="tf-page-title">
              Hello, {user?.username || "Tutor"} 👋
            </h1>

            <p className="text-tf-copy mt-2 text-sm sm:text-base">
              Here's an overview of your tutoring activity and performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="w-full sm:w-auto bg-tf-surface border border-tf-line hover:bg-tf-surface-soft text-tf-copy px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error while dashboard is already loaded */}
        {error && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl px-4 py-3">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {/* Rating */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Average Rating</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {Number(kpis.averageRating || 0).toFixed(1)}
                  <span className="text-tf-muted text-lg font-medium">/5</span>
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-700 dark:text-yellow-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.5l2.94 5.95 6.56.95-4.75 4.63 1.12 6.54L12 17.48l-5.87 3.09 1.12-6.54L2.5 9.4l6.56-.95L12 2.5z" />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              {formatNumber(kpis.totalReviews)} total reviews
            </p>
          </div>

          {/* Batches */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Total Batches</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {formatNumber(kpis.totalBatches)}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-700 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                  />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              Current + upcoming + completed
            </p>
          </div>

          {/* Achievements */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Achievements</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {formatNumber(kpis.totalAchievements)}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-700 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 3l2.4 4.9L20 8.7l-4 3.9.9 5.5L12 15.5l-4.9 2.6.9-5.5 5.6-.8L12 3z"
                  />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              Student success stories
            </p>
          </div>

          {/* Capacity */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Student Capacity</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {formatNumber(kpis.totalStudentsCapacity)}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-cyan-700 dark:text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              Maximum seats across batches
            </p>
          </div>

          {/* Enrolled */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Enrolled Students</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {formatNumber(kpis.totalEnrolledStudents)}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-700 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6"
                  />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              Currently allotted seats
            </p>
          </div>

          {/* Occupancy */}
          <div className="bg-tf-surface border border-tf-line rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-tf-copy text-sm">Overall Occupancy</p>

                <h2 className="text-3xl font-bold text-tf-ink mt-2">
                  {Number(occupancyData.overallOccupancyRate || 0).toFixed(1)}
                  <span className="text-tf-muted text-lg font-medium">%</span>
                </h2>
              </div>

              <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-700 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M4 20V10M10 20V4M16 20v-7M22 20H2"
                  />
                </svg>
              </div>
            </div>

            <p className="text-tf-muted text-xs mt-3">
              {formatNumber(occupancyData.totalRemainingSeats)} seats remaining
            </p>
          </div>
        </div>

        {/* Row: Batch Distribution + Ratings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Batch Distribution */}
          <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
                {batchChart.title || "Batch Status Distribution"}
              </h2>

              <p className="text-tf-muted text-sm mt-1">
                {batchChart.description ||
                  "Distribution of your batches by status."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0">
                <div
                  className="w-44 h-44 rounded-full"
                  style={{
                    background: buildDonutGradient(batchBreakdown),
                  }}
                />

                <div className="absolute inset-6 bg-tf-surface rounded-full flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-tf-ink">
                    {formatNumber(batchData.total)}
                  </span>

                  <span className="text-tf-muted text-xs mt-1">
                    Total Batches
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-4">
                {batchBreakdown.map((item, index) => (
                  <div
                    key={item.categoryKey || item.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: ["#3b82f6", "#22c55e", "#64748b"][
                            index % 3
                          ],
                        }}
                      />

                      <span className="text-tf-copy text-sm truncate">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-tf-ink font-medium text-sm">
                        {formatNumber(item.value)}
                      </span>

                      <span className="text-tf-muted text-xs">
                        {Number(item.percentage || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ratings */}
          <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
                  {ratingChart.title || "Review Ratings"}
                </h2>

                <p className="text-tf-muted text-sm mt-1">
                  {ratingChart.description ||
                    "Breakdown of your student reviews."}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-tf-ink">
                  {Number(ratingData.averageRating || 0).toFixed(1)}
                </p>

                <p className="text-tf-muted text-xs">
                  {formatNumber(ratingData.totalReviews)} reviews
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {ratingDistribution.map((item) => {
                const percentage = Number(item.percentage || 0);

                return (
                  <div key={item.star || item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-tf-copy text-sm">
                        {item.label}
                      </span>

                      <span className="text-tf-muted text-xs">
                        {formatNumber(item.value)} ({percentage.toFixed(0)}
                        %)
                      </span>
                    </div>

                    <div className="h-2 bg-tf-surface-soft rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Seat Occupancy */}
        <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
                {occupancyChart.title || "Seat Occupancy"}
              </h2>

              <p className="text-tf-muted text-sm mt-1">
                {occupancyChart.description ||
                  "Student intake across your batches."}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-tf-ink font-semibold">
                {formatNumber(occupancyData.totalAllottedSeats)} /{" "}
                {formatNumber(occupancyData.totalMaximumSeats)}
              </p>

              <p className="text-tf-muted text-xs mt-1">
                Overall enrolled / capacity
              </p>
            </div>
          </div>

          {occupancyBatches.length === 0 ? (
            <p className="text-tf-muted text-sm">
              No batch occupancy data available yet.
            </p>
          ) : (
            <div className="space-y-5">
              {occupancyBatches.map((batch) => (
                <div key={batch.batchId}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-tf-copy text-sm font-medium truncate">
                        {batch.title}
                      </p>

                      <p className="text-tf-muted text-xs mt-1 capitalize">
                        {batch.batchType}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-tf-copy text-xs">
                        {batch.allottedSeats} / {batch.maximumSeats}
                      </span>

                      <span className="text-tf-ink text-xs font-medium">
                        {Number(batch.occupancyRate || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 bg-tf-surface-soft rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Number(batch.occupancyRate || 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-tf-muted text-xs mt-2">
                    {formatNumber(batch.remainingSeats)} seats remaining
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Revenue + Achievement Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Revenue */}
          <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
                {revenueChart.title || "Revenue & Fee Analytics"}
              </h2>

              <p className="text-tf-muted text-sm mt-1">
                {revenueChart.description ||
                  "Projected revenue and fee structure."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Projected Revenue</p>

                <p className="text-tf-ink text-xl font-semibold mt-2">
                  {formatCurrency(revenueData.totalProjectedRevenue)}
                </p>
              </div>

              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Avg Fee / Batch</p>

                <p className="text-tf-ink text-xl font-semibold mt-2">
                  {formatCurrency(revenueData.averageFeePerBatch)}
                </p>
              </div>

              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Minimum Fee</p>

                <p className="text-tf-ink text-lg font-semibold mt-2">
                  {formatCurrency(revenueData.minFee)}
                </p>
              </div>

              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Maximum Fee</p>

                <p className="text-tf-ink text-lg font-semibold mt-2">
                  {formatCurrency(revenueData.maxFee)}
                </p>
              </div>
            </div>

            {/* Payment Types */}
            {paymentBreakdown.length > 0 && (
              <div className="mb-6">
                <p className="text-tf-copy text-sm mb-4">Payment Type</p>

                <div className="space-y-3">
                  {paymentBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-tf-copy text-sm capitalize">
                        {item.label}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="text-tf-ink text-sm">{item.value}</span>

                        <span className="text-tf-muted text-xs">
                          {Number(item.percentage || 0).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Batches */}
            {topBatchesByFee.length > 0 && (
              <div>
                <p className="text-tf-copy text-sm mb-4">
                  Top Batches by Projected Revenue
                </p>

                <div className="space-y-4">
                  {topBatchesByFee.map((batch) => {
                    const maxRevenue = Math.max(
                      ...topBatchesByFee.map((item) =>
                        Number(item.projectedRevenue || 0),
                      ),
                      1,
                    );

                    const width =
                      (Number(batch.projectedRevenue || 0) / maxRevenue) * 100;

                    return (
                      <div key={batch.batchId}>
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <span className="text-tf-copy text-sm truncate">
                            {batch.title}
                          </span>

                          <span className="text-tf-ink text-xs shrink-0">
                            {formatCurrency(batch.projectedRevenue)}
                          </span>
                        </div>

                        <div className="h-2 bg-tf-surface-soft rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(width, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Achievement Performance */}
          <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
                {achievementChart.title || "Achievement Performance"}
              </h2>

              <p className="text-tf-muted text-sm mt-1">
                {achievementChart.description ||
                  "Student achievement and rating overview."}
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Total Achievements</p>

                <p className="text-tf-ink text-2xl font-semibold mt-2">
                  {formatNumber(achievementData.totalAchievements)}
                </p>
              </div>

              <div className="bg-tf-surface-soft rounded-2xl p-4">
                <p className="text-tf-muted text-xs">Avg Student Rating</p>

                <p className="text-tf-ink text-2xl font-semibold mt-2">
                  {Number(achievementData.averageStudentRating || 0).toFixed(1)}
                  <span className="text-tf-muted text-sm">/5</span>
                </p>
              </div>
            </div>

            {/* Achievement Ratings */}
            {achievementRatingDistribution.length > 0 && (
              <div className="mb-6">
                <p className="text-tf-copy text-sm mb-4">
                  Student Rating Distribution
                </p>

                <div className="space-y-3">
                  {achievementRatingDistribution.map((item) => (
                    <div key={item.star || item.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-tf-copy text-xs">
                          {item.label}
                        </span>

                        <span className="text-tf-muted text-xs">
                          {item.value}
                        </span>
                      </div>

                      <div className="h-2 bg-tf-surface-soft rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              Number(item.percentage || 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <p className="text-tf-copy text-sm mb-4">
                Top Achievement Tags
              </p>

              {topTags.length === 0 ? (
                <p className="text-tf-muted text-sm">
                  No achievement tags yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag) => (
                    <div
                      key={tag.label}
                      className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/10 rounded-xl px-3 py-2"
                    >
                      <span className="text-purple-800 dark:text-purple-300 text-xs">
                        {tag.label}
                      </span>

                      <span className="text-tf-muted text-xs ml-2">
                        {tag.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Class Distribution */}
        <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7 mb-6">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-tf-ink">
              {classChart.title || "Batch Offerings by Class"}
            </h2>

            <p className="text-tf-muted text-sm mt-1">
              {classChart.description ||
                "Distribution of your batches across classes."}
            </p>
          </div>

          {classBreakdown.length === 0 ? (
            <div className="bg-tf-surface-soft rounded-2xl p-8 text-center">
              <p className="text-tf-muted text-sm">
                Add eligible classes to your batches to see this distribution.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-tf-copy text-sm">{item.label}</span>

                    <div className="flex items-center gap-3">
                      <span className="text-tf-ink text-xs font-medium">
                        {item.value}{" "}
                        {Number(item.value) === 1 ? "batch" : "batches"}
                      </span>

                      <span className="text-tf-muted text-xs">
                        {Number(item.percentage || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 bg-tf-surface-soft rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          Number(item.percentage || 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Summary */}
        <section className="bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
              <span className="text-tf-ink font-semibold">{getInitials()}</span>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-tf-ink">
                Keep your TutorFolio updated
              </h2>

              <p className="text-tf-muted text-sm mt-1">
                Add batches, achievements and profile details to give students a
                better picture of your teaching.
              </p>
            </div>
          </div>
        </section>

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Dashboard;
