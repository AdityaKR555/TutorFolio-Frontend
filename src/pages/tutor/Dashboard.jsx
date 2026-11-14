import PlatformLoader from "../../components/PlatformLoader";
import KpiState from "../../components/KpiState";
import "./dashboard-redesign.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";
import { MessageCircle, Bell, Eye, Database, Users, Star, Layers3, Award, Gauge } from "lucide-react";
import { getStoredUser } from "../../utils/auth";

function DashboardMetricCard({ label, value, suffix = "", detail, Icon, helpId, help, helpClassName = "", helpOpen = false, helpRef, onHelpClick }) {
  return (
    <article className="dashboard-kpi rounded-2xl border border-tf-line bg-tf-surface p-5">
      <span ref={helpRef} className={`dashboard-kpi-help${helpOpen ? " is-open" : ""}`}>
        <button type="button" aria-label={`About ${label}`} aria-expanded={helpOpen} aria-describedby={helpId} onClick={onHelpClick}>ⓘ</button>
        <span role="tooltip" id={helpId} className={helpClassName}>{help}</span>
      </span>
      <div className="dashboard-kpi-heading">
        <p className="dashboard-kpi-label">{label}</p>
        <span className="dashboard-kpi-icon"><Icon size={19} aria-hidden="true" /></span>
      </div>
      <p className="dashboard-kpi-value"><strong>{value}</strong>{suffix && <span>{suffix}</span>}</p>
      <p className="dashboard-kpi-detail">{detail}</p>
    </article>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [activeBatchSegment, setActiveBatchSegment] = useState(null);
  const [occupancyHelpOpen, setOccupancyHelpOpen] = useState(false);
  const occupancyHelpRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const getUserId = () => {
    const user = getStoredUser();
    return user?.userId ?? user?.userid ?? user?.user_id ?? user?.id ?? user?.user?.userId ?? user?.user?.id ?? null;
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
    if (!occupancyHelpOpen) return undefined;
    const dismissOnOutsideClick = (event) => {
      if (!occupancyHelpRef.current?.contains(event.target)) setOccupancyHelpOpen(false);
    };
    const dismissOnEscape = (event) => {
      if (event.key === "Escape") setOccupancyHelpOpen(false);
    };
    document.addEventListener("pointerdown", dismissOnOutsideClick);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsideClick);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [occupancyHelpOpen]);

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
            <PlatformLoader showLabel={false} />

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
  const occupancyRate = Number(occupancyData.overallOccupancyRate || 0);
  const allottedSeats = Number(occupancyData.totalAllottedSeats || 0);
  const maximumSeats = Number(occupancyData.totalMaximumSeats || 0);
  const remainingSeats = Number(occupancyData.totalRemainingSeats || 0);

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
    <div className="mobile-page mobile-dashboard p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mobile-dashboard-heading mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>

            <h1 className="tf-page-title">
              Hello, {user?.username || "Tutor"}
            </h1>

            <p className="text-tf-copy mt-2 text-sm sm:text-base">
              Your tutoring activity at a glance.
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
        <div className="mobile-dashboard-summary dashboard-kpis grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <DashboardMetricCard label="Public review rating" value={Number(kpis.averageRating || 0).toFixed(1)} suffix="/5" detail={Number(kpis.totalReviews || 0) ? `${formatNumber(kpis.totalReviews)} total reviews` : "No public reviews yet"} Icon={Star} helpId="metric-help-public-review-rating" help="Average rating from public tutor reviews. Ratings attached to student achievements are not included." />
          <DashboardMetricCard label="Total Batches" value={formatNumber(kpis.totalBatches)} detail="Current, upcoming, and completed batches" Icon={Layers3} helpId="metric-help-total-batches" help="Count of all your batches across every status." />
          <DashboardMetricCard label="Achievements" value={formatNumber(kpis.totalAchievements)} detail="Student success stories" Icon={Award} helpId="metric-help-achievements" help="Number of student achievements recorded on your profile." />
          <DashboardMetricCard label="Student Capacity" value={formatNumber(kpis.totalStudentsCapacity)} detail="Maximum seats across batches" Icon={Users} helpId="metric-help-student-capacity" help="The maximum number of students your batches can accommodate." />
          <DashboardMetricCard label="Enrolled Students" value={formatNumber(kpis.totalEnrolledStudents)} detail="Students currently enrolled" Icon={Users} helpId="metric-help-enrolled-students" help="Total enrolled students across your batches." />
          <DashboardMetricCard label="Overall Occupancy" value={occupancyRate.toFixed(1)} suffix="%" detail={`${formatNumber(remainingSeats)} seats remaining`} Icon={Gauge} helpId="metric-help-percentage-of-batch-capacity-currently-allotted" helpClassName="dashboard-occupancy-help-copy" help={<><strong>How occupancy is calculated</strong><span>Overall occupancy: {occupancyRate.toFixed(1)}% of all batch seats are allotted.</span><span>Calculation: {formatNumber(allottedSeats)} allotted ÷ {formatNumber(maximumSeats)} total seats.</span><span>{formatNumber(remainingSeats)} seats remain available (total seats minus allotted seats).</span>{maximumSeats === 0 && <span>No batch seat capacity is set yet, so the percentage is not meaningful.</span>}</>} helpOpen={occupancyHelpOpen} helpRef={occupancyHelpRef} onHelpClick={(event) => { if (occupancyHelpOpen) event.currentTarget.blur(); setOccupancyHelpOpen((open) => !open); }} />
          <DashboardMetricCard label="Projected revenue" value={revenueData.totalProjectedRevenue == null ? "Unavailable" : formatCurrency(revenueData.totalProjectedRevenue)} detail="Based on batch enrolments" Icon={Database} helpId="metric-help-projected-revenue" help="Projected revenue based on batch enrolments and configured fees; this is not actual revenue." />
        </div>

        <section aria-labelledby="dashboard-activity-heading" className="mb-6">
          <div className="mb-3"><h2 id="dashboard-activity-heading" className="text-lg font-bold text-tf-ink">Your website activity</h2><p className="mt-1 text-sm text-tf-copy">Follow up on enquiries and see how visitors engage with your website.</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Open enquiries", entry: dashboard?.activitySummary?.openEnquiries, value: dashboard?.activitySummary?.openEnquiries?.total, description: "Conversations awaiting follow-up", to: "/conversations", action: "Open inbox", Icon: MessageCircle },
              { title: "Unread notifications", entry: dashboard?.activitySummary?.unreadActivity, value: dashboard?.activitySummary?.unreadActivity?.totalUnread, description: "New activity on your website", to: "/notifications", action: "View notifications", Icon: Bell },
              { title: "Profile visits", entry: dashboard?.activitySummary?.recentVisits, value: dashboard?.activitySummary?.recentVisits?.total, description: "Total recorded website visits", to: "/notifications?tab=visits", action: "View visits", Icon: Eye },
            ].map(({ title, entry, value, description, to, action, Icon }) => {
              const available = entry?.status === 200 && value != null;
              return <div key={title} className="dashboard-kpi rounded-2xl border border-tf-line bg-tf-surface"><span className="dashboard-kpi-help"><button type="button" aria-label={`About ${title}`} aria-describedby={`activity-help-${title.replaceAll(" ", "-")}`}>ⓘ</button><span role="tooltip" id={`activity-help-${title.replaceAll(" ", "-")}`}>{description}</span></span><Link to={to} className="group flex min-w-0 h-full items-center gap-3 rounded-2xl p-4 transition hover:border-tf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tf-blue)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tf-sky text-tf-blue"><Icon size={21} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-tf-copy">{title}</span><strong className="mt-0.5 block text-2xl leading-tight text-tf-ink">{available ? formatNumber(value) : "Unavailable"}</strong><span className="mt-1 block text-xs leading-4 text-tf-muted">{available ? description : "Currently unavailable"}</span><span className="mt-2 block text-xs font-semibold text-tf-blue">{action} →</span></span>
              </Link></div>;
            })}
          </div>
        </section>

        <section className="dashboard-enrolment bg-tf-surface border border-tf-line rounded-2xl p-4 mb-6" aria-labelledby="dashboard-enrolment-title">
          <h2 id="dashboard-enrolment-title" className="text-lg font-bold text-tf-ink">Batch enrolment</h2>
          <p className="mt-1 mb-3 text-xs text-tf-muted">Batch capacity and occupancy details</p>
          {occupancyBatches.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-tf-surface-soft text-tf-copy"><tr><th className="p-2">Batch</th><th className="p-2">Status</th><th className="p-2">Enrolled / capacity</th><th className="p-2">Occupancy</th><th className="p-2">Seats available</th></tr></thead><tbody>{occupancyBatches.map((batch, index) => <tr key={batch.batchId ?? index} className="border-b border-tf-line"><td className="p-2 font-medium">{batch.title}</td><td className="p-2 capitalize">{batch.batchType || "Unknown"}</td><td className="p-2">{formatNumber(batch.allottedSeats)} / {formatNumber(batch.maximumSeats)}</td><td className="p-2">{Number(batch.maximumSeats) > 0 ? `${Number(batch.occupancyRate || 0).toFixed(1)}%` : "No capacity"}</td><td className="p-2">{formatNumber(batch.remainingSeats)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-tf-muted">No batch enrolments yet.</p>}
        </section>

        {/* Row: Batch Distribution + Ratings */}
        <div className="dashboard-batch-rating grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
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
              {/* Interactive status segments */}
              <div className="dashboard-batch-donut relative shrink-0" onMouseLeave={() => setActiveBatchSegment(null)}>
                <svg viewBox="0 0 200 200" className="h-44 w-44" aria-label="Batch status distribution">
                  <circle cx="100" cy="100" r="78" fill="none" stroke="var(--tf-line)" strokeWidth="24" />
                  {batchBreakdown.map((item, index) => {
                    const total = batchBreakdown.reduce((sum, part) => sum + Number(part.value || 0), 0);
                    const fraction = total ? Number(item.value || 0) / total : 0;
                    const offset = total ? batchBreakdown.slice(0, index).reduce((sum, part) => sum + Number(part.value || 0), 0) / total : 0;
                    const color = ({ upcoming: "#3b82f6", current: "#22c55e", old: "#64748b" })[item.categoryKey] || "#a855f7";
                    return fraction > 0 && <circle key={item.categoryKey || index} cx="100" cy="100" r="78" fill="none" stroke={color} strokeWidth={activeBatchSegment === index ? 32 : 24} pathLength="100" strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`} strokeDashoffset={-offset * 100} transform="rotate(-90 100 100)" tabIndex="0" role="img" aria-label={`${item.label}: ${formatNumber(item.value)} batches, ${Number(item.percentage || 0).toFixed(0)}%`} onMouseEnter={() => setActiveBatchSegment(index)} onFocus={() => setActiveBatchSegment(index)} onBlur={() => setActiveBatchSegment(null)} className="dashboard-donut-segment" />;
                  })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
                  {activeBatchSegment === null ? <><strong className="text-3xl text-tf-ink">{formatNumber(batchData.total)}</strong><span className="text-xs text-tf-muted">Total batches</span></> : <><strong className="text-lg text-tf-ink">{formatNumber(batchBreakdown[activeBatchSegment]?.value)} · {Number(batchBreakdown[activeBatchSegment]?.percentage || 0).toFixed(0)}%</strong><span className="text-xs text-tf-muted">{({upcoming:"Upcoming", current:"Current", old:"Completed"})[batchBreakdown[activeBatchSegment]?.categoryKey] || batchBreakdown[activeBatchSegment]?.label}</span></>}
                </div>
              </div>
              <div className="w-full space-y-4">
                {batchBreakdown.map((item, index) => <div key={item.categoryKey || index} className="flex items-center gap-3 text-sm text-tf-copy"><span className="h-3 w-3 shrink-0 rounded-full" style={{backgroundColor: ({upcoming:"#3b82f6", current:"#22c55e", old:"#64748b"})[item.categoryKey] || "#a855f7"}}/>{({upcoming:"Upcoming", current:"Current", old:"Completed"})[item.categoryKey] || item.label}</div>)}
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
        <section className="dashboard-occupancy bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7 mb-6">
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

                </div>
              ))}
            </div>
          )}
        </section>

        {/* Revenue + Achievement Performance */}
        <div className="dashboard-revenue-achievements grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
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
              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(kpis.totalBatches) > 0) || revenueData.totalProjectedRevenue == null} label="Projected Revenue" message="Add batch fees to see a projection" kind="records">
                <p className="text-tf-muted text-xs">Projected Revenue</p>

                <p className="text-tf-ink text-xl font-semibold mt-2">
                  {formatCurrency(revenueData.totalProjectedRevenue)}
                </p>
              </KpiState></div>

              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(kpis.totalBatches) > 0) || revenueData.averageFeePerBatch == null} label="Avg Fee / Batch" message="Add batch fees to see an average" kind="records">
                <p className="text-tf-muted text-xs">Avg Fee / Batch</p>

                <p className="text-tf-ink text-xl font-semibold mt-2">
                  {formatCurrency(revenueData.averageFeePerBatch)}
                </p>
              </KpiState></div>

              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(kpis.totalBatches) > 0) || revenueData.minFee == null} label="Minimum Fee" message="No batch fees recorded yet" kind="records">
                <p className="text-tf-muted text-xs">Minimum Fee</p>

                <p className="text-tf-ink text-lg font-semibold mt-2">
                  {formatCurrency(revenueData.minFee)}
                </p>
              </KpiState></div>

              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(kpis.totalBatches) > 0) || revenueData.maxFee == null} label="Maximum Fee" message="No batch fees recorded yet" kind="records">
                <p className="text-tf-muted text-xs">Maximum Fee</p>

                <p className="text-tf-ink text-lg font-semibold mt-2">
                  {formatCurrency(revenueData.maxFee)}
                </p>
              </KpiState></div>
            </div>

            {/* Payment Types */}
            {paymentBreakdown.length > 0 && (
              <div className="mb-6">
                <p className="text-tf-copy text-sm mb-4">Payment Type</p>

                <div className="dashboard-payment-layout"><div className="dashboard-payment-donut" role="img" aria-label="Distribution of batches by payment type" style={{ background: buildDonutGradient(paymentBreakdown) }}><span><strong>{formatNumber(kpis.totalBatches)}</strong><small>Batches</small></span></div>
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
                </div></div>
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
              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(achievementData.totalAchievements) > 0)} label="Total Achievements" message="Your next success story belongs here" kind="rating">
                <p className="text-tf-muted text-xs">Total Achievements</p>

                <p className="text-tf-ink text-2xl font-semibold mt-2">
                  {formatNumber(achievementData.totalAchievements)}
                </p>
              </KpiState></div>

              <div className="bg-tf-surface-soft rounded-2xl p-4"><KpiState empty={!(Number(achievementData.averageStudentRating) > 0)} label="Avg Student Rating" message="No student ratings yet" kind="rating">
                <p className="text-tf-muted text-xs">Avg Student Rating</p>

                <p className="text-tf-ink text-2xl font-semibold mt-2">
                  {Number(achievementData.averageStudentRating || 0).toFixed(1)}
                  <span className="text-tf-muted text-sm">/5</span>
                </p>
              </KpiState></div>
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
        <section className="dashboard-classes bg-tf-surface border border-tf-line rounded-3xl p-5 sm:p-7 mb-6">
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

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Dashboard;
