import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BILLING_CYCLES,
  PAYMENT_FAQS,
  PLANS,
} from "../../config/plans";
import { loadRazorpayScript } from "../../utils/razorpay";
import {
  createPaymentOrder,
  closePaymentOrder,
  fetchPaymentHistory,
  fetchSubscriptionPlans,
  fetchSubscriptionStatus,
  verifyPaymentSignature,
} from "../../api/payment";

function Subscription() {
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [currentSub, setCurrentSub] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [plans, setPlans] = useState(PLANS);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState("");
  const [successModalData, setSuccessModalData] = useState(null);

  // Active theme tracking (light / dark)
  const [theme, setTheme] = useState(() => {
    try {
      return document.documentElement.dataset.theme === "dark" ||
        localStorage.getItem("tutorfolio-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const checkTheme = () => {
      const currentTheme =
        document.documentElement.dataset.theme === "dark" ||
        localStorage.getItem("tutorfolio-theme") === "dark"
          ? "dark"
          : "light";
      setTheme(currentTheme);
    };

    checkTheme();

    // Listen to theme changes from TutorLayout or other tabs
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const handleStorage = (e) => {
      if (e.key === "tutorfolio-theme") {
        checkTheme();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const isDark = theme === "dark";

  // Read stored user
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  };

  const user = getUser();
  const userId = user?.user_id ?? user?.userId ?? user?.id ?? null;

  // Load subscription status and transaction history on mount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [sub, history, catalog] = await Promise.all([
          fetchSubscriptionStatus(userId),
          fetchPaymentHistory(userId),
          fetchSubscriptionPlans(),
        ]);

        if (mounted) {
          setCurrentSub(sub);
          setPaymentHistory(history || []);
          setPlans(PLANS.map((uiPlan) => {
            const dbPlan = catalog.find((item) => item.planId === uiPlan.id);
            return dbPlan ? { ...uiPlan, name: dbPlan.name, description: dbPlan.description || uiPlan.description, price: Number(dbPlan.price), currency: dbPlan.currency, billingCycle: dbPlan.billingCycle } : uiPlan;
          }));
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading subscription data:", err);
          setError(
            "Unable to load your subscription details. Showing last known status. Please refresh to try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    // Listen to subscription updates across tabs
    const handleSubUpdated = () => {
      fetchSubscriptionStatus(userId).then((sub) => {
        if (mounted) setCurrentSub(sub);
      });
      fetchPaymentHistory(userId).then((hist) => {
        if (mounted) setPaymentHistory(hist || []);
      });
    };

    window.addEventListener("tutorfolio-subscription-updated", handleSubUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("tutorfolio-subscription-updated", handleSubUpdated);
    };
  }, [userId]);

  // Handle plan purchase / upgrade
  const handleSelectPlan = async (plan) => {
    if (!user) {
      setError("Please log in to upgrade your subscription.");
      return;
    }

    if (currentSub?.planId === plan.id && currentSub?.status === "active") {
      return;
    }

    setError("");
    setProcessingPlanId(plan.id);

    const price = plan.price;
    const selectedCycle = plan.billingCycle;
    if (plan.id === "free" || selectedCycle === "lifetime") {
      setError("The Free lifetime plan does not require payment checkout.");
      setProcessingPlanId(null);
      return;
    }
    if (billingCycle !== selectedCycle) {
      setError(`This plan is currently billed ${selectedCycle}. Select the matching billing option.`);
      setProcessingPlanId(null);
      return;
    }

    try {
      // Step 1: Create Order via Backend API
      const orderData = await createPaymentOrder({
        userId,
        planId: plan.id,
        planName: plan.name,
        billingCycle: selectedCycle,
        amount: price,
        currency: plan.currency,
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Failed to initialize payment order. Please try again.");
      }

      // Step 2: Load Razorpay Checkout SDK
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded || !window.Razorpay) {
        setError("Razorpay Checkout could not load. Your order was not charged; please try again.");
        setProcessingPlanId(null);
        return;
      }

      // Step 3: Configure Razorpay Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "TutorFolio",
        description: `${plan.name} (${selectedCycle})`,
        image: "https://alpha.tutorfolio.site/favicon.ico",
        order_id: orderData.orderId,
        handler: async (response) => {
          await completeVerification({
            plan,
            orderData,
            price,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || orderData.orderId,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user.username || "",
          email: user.email || "",
          contact: user.mobileNo || "",
        },
        notes: {
          planId: plan.id,
          userId: String(userId),
          billingCycle,
        },
        theme: {
          color: "#1875d1",
          backdrop_color: isDark ? "rgba(10, 22, 40, 0.85)" : "rgba(15, 23, 42, 0.6)",
        },
        modal: {
          ondismiss: () => {
            closePaymentOrder({ userId, orderId: orderData.orderId, status: "cancelled" })
              .then(() => fetchPaymentHistory(userId).then(setPaymentHistory))
              .catch((err) => console.error("Could not mark dismissed order:", err));
            setProcessingPlanId(null);
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (failedRes) => {
          console.error("Razorpay Payment Failed:", failedRes.error);
          closePaymentOrder({ userId, orderId: orderData.orderId, status: "failed" })
            .then(() => fetchPaymentHistory(userId).then(setPaymentHistory))
            .catch((err) => console.error("Could not mark failed order:", err));
          setError(
            failedRes.error?.description ||
              "Payment was declined or cancelled. Please try again."
         );
          setProcessingPlanId(null);
        });

        rzp.open();
      } catch (rzpInitErr) {
        console.warn("Razorpay instance initialization notice:", rzpInitErr);
        setError("Razorpay Checkout could not start. Please try again.");
        setProcessingPlanId(null);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.message || "Failed to initiate payment. Please try again.");
      setProcessingPlanId(null);
    }
  };

  // Complete signature verification and activate subscription
  const completeVerification = async ({
    plan,
    orderData,
    price,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  }) => {
    try {
      const activeSub = await verifyPaymentSignature({
        userId,
        planId: orderData.planId,
        planName: orderData.planName,
        billingCycle,
        amount: price,
        currency: orderData.currency || plan.currency,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      setCurrentSub(activeSub);
      const [confirmedSub, confirmedHistory] = await Promise.all([
        fetchSubscriptionStatus(userId),
        fetchPaymentHistory(userId),
      ]);
      setCurrentSub(confirmedSub);
      setPaymentHistory(confirmedHistory || []);

      setSuccessModalData({
        planName: plan.name,
        amount: price,
        currency: plan.currencySymbol || "₹",
        billingCycle,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        validUntil: activeSub.validUntil,
      });

    } catch (verErr) {
      console.error("Verification error:", verErr);
      setError(
        verErr.message ||
          "Payment was processed, but subscription activation encountered an issue. Please contact support."
     );
    } finally {
      setProcessingPlanId(null);
    }
  };

  const isCurrentPlan = (planId) => {
    return currentSub?.planId === planId && currentSub?.status === "active";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-full bg-[#f4f8fd] px-5 pt-[30px] pb-[60px] text-[#172b46] transition-colors duration-200 sm:px-8 sm:pt-9 sm:pb-[72px] [[data-theme=dark]_&]:bg-[#101b2b] [[data-theme=dark]_&]:text-[#e8f0fb]">
      <div className="mx-auto max-w-[1200px] space-y-8">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="tf-page-title">Plans &amp; Billing</h1>
            </div>
            <p className="max-w-2xl text-sm leading-[1.6] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">
              Compare Free, Pro, and Elite features and choose the plan that fits your tutoring business.
            </p>
          </div>

          {/* Secure Trust Badge */}
          <div className="inline-flex self-start items-center gap-2 rounded-xl border border-[#dfe9f3] bg-[#eaf6ff] px-3.5 py-2 text-xs font-medium text-[#1875d1] md:self-auto [[data-theme=dark]_&]:border-blue-500/25 [[data-theme=dark]_&]:bg-blue-900/25 [[data-theme=dark]_&]:text-blue-300">
            <svg
              className="w-4 h-4 shrink-0 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Razorpay 256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 [[data-theme=dark]_&]:text-red-300">
            <svg
              className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
            <div className="flex-1 font-medium">{error}</div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 cursor-pointer text-lg leading-none"
            >
              &times;
            </button>
          </div>
       )}

        {/* ================= LOADING SKELETON ================= */}
        {loading && (
          <div className="animate-pulse rounded-3xl border border-[#dfe9f3] bg-white p-6 shadow-[var(--tf-shadow)] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-3 flex-1">
                <div className="h-5 w-32 rounded-full bg-gray-200 [[data-theme=dark]_&]:bg-[#30465f]" />
                <div className="h-4 w-56 rounded-full bg-gray-200 [[data-theme=dark]_&]:bg-[#30465f]" />
              </div>
              <div className="h-9 w-28 rounded-xl bg-gray-200 [[data-theme=dark]_&]:bg-[#30465f]" />
            </div>
          </div>
        )}

        {/* ================= EXPIRED SUBSCRIPTION BANNER ================= */}
        {!loading && currentSub && currentSub.status === "expired" && (
          <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_100%)] p-6 shadow-[0_10px_25px_rgba(245,158,11,0.08)] sm:px-7 [[data-theme=dark]_&]:border-amber-500/35 [[data-theme=dark]_&]:bg-[linear-gradient(135deg,rgba(120,53,15,0.35)_0%,#0f1f36_100%)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 [[data-theme=dark]_&]:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    EXPIRED
                  </span>
                  <span className="text-lg font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                    {currentSub.planName || "Previous Plan"}
                  </span>
                </div>
                <p className="text-xs text-[#566b84] sm:text-sm [[data-theme=dark]_&]:text-[#b7c7db]">
                  Your subscription expired on{" "}
                  <strong className="text-amber-600 [[data-theme=dark]_&]:text-amber-400">
                    {formatDate(currentSub.validUntil)}
                  </strong>
                  . Renew below to restore access.
                </p>
              </div>
              <a
                href="#pricing-cards"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                Renew Plan
              </a>
            </div>
          </div>
        )}

        {/* ================= ACTIVE SUBSCRIPTION BANNER ================= */}
        {!loading && currentSub && currentSub.status === "active" && (
          <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_100%)] p-6 shadow-[0_10px_25px_rgba(24,117,209,0.08)] sm:px-7 [[data-theme=dark]_&]:border-blue-500/35 [[data-theme=dark]_&]:bg-[linear-gradient(135deg,rgba(30,58,138,0.45)_0%,#0f1f36_100%)] [[data-theme=dark]_&]:shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 [[data-theme=dark]_&]:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE PLAN
                  </span>
                  <span className="text-lg font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                    {currentSub.planName || "Pro Tutor"}
                  </span>
                </div>
                <p className="text-xs text-[#566b84] sm:text-sm [[data-theme=dark]_&]:text-[#b7c7db]">
                  Billing Cycle:{" "}
                  <strong className="capitalize text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                    {currentSub.billingCycle || "Monthly"}
                  </strong>{" "}
                  &bull; Valid until:{" "}
                  <strong className="text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                    {formatDate(currentSub.validUntil)}
                  </strong>
                </p>
                {currentSub.paymentId && (
                  <p className="font-mono text-xs text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
                    Ref ID: {currentSub.paymentId}
                  </p>
               )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="#pricing-cards"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Change Plan
                </a>
              </div>
            </div>
          </div>
       )}

        {/* ================= NO ACTIVE PLAN BANNER ================= */}
        {!loading && !currentSub && (
          <div className="rounded-3xl border border-[#dfe9f3] bg-[#f8fbff] p-5 text-sm text-[#566b84] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#b7c7db]">
            You don't have an active subscription yet. Choose a plan below to get started.
          </div>
        )}

        {/* ================= BILLING CYCLE TOGGLE ================= */}
        <div id="pricing-cards" className="flex flex-col items-center gap-3 pt-2">
          <div className="inline-flex items-center rounded-2xl border border-[#dfe9f3] bg-[#f8fbff] p-[5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44]">
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.MONTHLY)}
              className={`cursor-pointer rounded-xl border-0 px-[18px] py-[9px] text-[13px] font-semibold transition-all ${
                billingCycle === BILLING_CYCLES.MONTHLY
                  ? "bg-[#1875d1] text-white shadow-[0_4px_14px_rgba(24,117,209,0.3)]"
                  : "bg-transparent text-[#566b84] hover:text-[#172b46] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:text-[#e8f0fb]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.YEARLY)}
              disabled={!plans.some((plan) => plan.billingCycle === "yearly")}
              className={`flex cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 items-center gap-2 rounded-xl border-0 px-[18px] py-[9px] text-[13px] font-semibold transition-all ${
                billingCycle === BILLING_CYCLES.YEARLY
                  ? "bg-[#1875d1] text-white shadow-[0_4px_14px_rgba(24,117,209,0.3)]"
                  : "bg-transparent text-[#566b84] hover:text-[#172b46] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:text-[#e8f0fb]"
              }`}
            >
              <span>Annual Billing</span>
            </button>
          </div>
          <p className="text-xs text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
            {billingCycle === BILLING_CYCLES.YEARLY ? "Billed annually." : "Billed monthly."}
          </p>
        </div>

        {/* ================= 3 PRICING CARDS ================= */}
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.price;
            const isCurrent = isCurrentPlan(plan.id);
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border border-[#dfe9f3] bg-white p-[30px_26px] shadow-[var(--tf-shadow)] transition hover:border-[#1875d1] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] ${
                  plan.popular
                    ? "border-2 border-[#1875d1] bg-[linear-gradient(180deg,#f0f7ff_0%,#ffffff_100%)] shadow-[0_16px_36px_rgba(24,117,209,0.16)] lg:-translate-y-2 [[data-theme=dark]_&]:border-blue-500/55 [[data-theme=dark]_&]:bg-[linear-gradient(180deg,#132746_0%,#0a1628_100%)] [[data-theme=dark]_&]:shadow-[0_20px_42px_rgba(0,0,0,0.45)]"
                    : ""
                }`}
              >
                {/* Popular / Recommended Badge */}
                {plan.popular && (
                  <span className="absolute left-1/2 top-[-14px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,#1875d1_0%,#4f46e5_100%)] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.8px] text-white shadow-[0_6px_16px_rgba(24,117,209,0.35)]">
                    {plan.badge}
                  </span>
               )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{plan.name}</h3>
                    {!plan.popular && plan.badge && (
                      <span className="rounded-full border border-[#dfe9f3] bg-[#f8fbff] px-2.5 py-[3px] text-[11px] font-semibold text-[#566b84] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#b7c7db]">{plan.badge}</span>
                   )}
                  </div>

                  <p className="my-2 mb-[18px] min-h-10 text-[13px] leading-[1.5] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-[22px] flex items-baseline gap-1 border-b border-[#dfe9f3] pb-5 [[data-theme=dark]_&]:border-[#30465f]">
                    <span className="text-[38px] font-extrabold tracking-[-0.5px] text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                      {plan.currencySymbol}
                      {price}
                    </span>
                    <span className="text-[13px] font-medium text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
                      /{plan.billingCycle === "lifetime" ? "lifetime" : plan.billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="mb-8">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.8px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">What's Included</p>
                    <ul>
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`mb-2.5 flex items-start gap-2.5 text-[13px] leading-[1.45] ${
                            feature.included
                              ? "text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]"
                              : "text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]"
                          }`}
                        >
                          {feature.included ? (
                            <svg
                              className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                         ) : (
                            <svg
                              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 [[data-theme=dark]_&]:text-slate-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                         )}
                          <span>{feature.text}</span>
                        </li>
                     ))}
                    </ul>
                  </div>
                </div>

                {/* Call to action button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isProcessing}
                    className={`${
                      isCurrent
                        ? "flex w-full cursor-default items-center justify-center gap-2 rounded-[14px] border border-[#147d5a] bg-[#eaf8f1] px-5 py-[13px] text-sm font-semibold text-[#147d5a] [[data-theme=dark]_&]:border-[#69d4a8] [[data-theme=dark]_&]:bg-[#183d37] [[data-theme=dark]_&]:text-[#69d4a8]"
                        : plan.popular
                        ? "flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-0 bg-[#1875d1] px-5 py-[13px] text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,117,209,0.25)] transition-colors hover:bg-[#0c5fb7]"
                        : "flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[#dfe9f3] bg-[#f8fbff] px-5 py-[13px] text-sm font-semibold text-[#172b46] transition-all hover:bg-[#dfe9f3] [[data-theme=dark]_&]:border-white/10 [[data-theme=dark]_&]:bg-white/10 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:hover:bg-white/15"
                    } ${isProcessing ? "opacity-75 cursor-wait" : ""}`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                   ) : isCurrent ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Current Active Plan</span>
                      </>
                   ) : (
                      <>
                        <span>{plan.ctaText}</span>
                        <span>&rarr;</span>
                      </>
                   )}
                  </button>
                </div>
              </div>
           );
          })}
        </div>

        {/* ================= PAYMENT METHODS & ASSURANCES ================= */}
        <div className="rounded-3xl border border-[#dfe9f3] bg-white p-[26px_28px] shadow-[var(--tf-shadow)] sm:p-[30px_34px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h4 className="mb-1 text-lg font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                Accepted Payment Methods via Razorpay
              </h4>
              <p className="text-[13px] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">
                UPI (GPay, PhonePe, Paytm, BHIM), Cards (Visa, MasterCard, RuPay),
                NetBanking (50+ Banks) &amp; Wallets.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-slate-800 [[data-theme=dark]_&]:border-slate-700 [[data-theme=dark]_&]:bg-slate-800 [[data-theme=dark]_&]:text-slate-200">
                UPI / QR
              </span>
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-slate-800 [[data-theme=dark]_&]:border-slate-700 [[data-theme=dark]_&]:bg-slate-800 [[data-theme=dark]_&]:text-slate-200">
                Debit &amp; Credit Cards
              </span>
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-slate-800 [[data-theme=dark]_&]:border-slate-700 [[data-theme=dark]_&]:bg-slate-800 [[data-theme=dark]_&]:text-slate-200">
                NetBanking
              </span>
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-slate-800 [[data-theme=dark]_&]:border-slate-700 [[data-theme=dark]_&]:bg-slate-800 [[data-theme=dark]_&]:text-slate-200">
                Wallets
              </span>
            </div>
          </div>
        </div>

        {/* ================= TRANSACTION HISTORY ================= */}
        <div className="rounded-3xl border border-[#dfe9f3] bg-white p-[26px_28px] shadow-[var(--tf-shadow)] sm:p-[30px_34px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">Billing History</h3>
              <p className="mt-0.5 text-[13px] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">
                Past transactions and downloadable tax receipts
              </p>
            </div>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
              No transactions recorded yet. When you upgrade via Razorpay, receipts will appear here.
            </div>
         ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#dfe9f3] uppercase text-[11px] tracking-wider text-[#8394a9] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:text-[#91a5bf]">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Billing</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Payment ID</th>
                    <th className="pb-3 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dfe9f3] [[data-theme=dark]_&]:divide-[#30465f]">
                  {paymentHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="transition-colors hover:bg-black/5 [[data-theme=dark]_&]:hover:bg-white/5">
                      <td className="py-3.5 font-medium text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{formatDate(item.date)}</td>
                      <td className="py-3.5 font-semibold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{item.planName || "Pro Tutor"}</td>
                      <td className="py-3.5 capitalize text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">{item.billingCycle || "Monthly"}</td>
                      <td className="py-3.5 font-bold text-emerald-600 [[data-theme=dark]_&]:text-emerald-400">
                        ₹{item.amount}
                      </td>
                      <td className="py-3.5">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.status === "paid" ? "bg-emerald-100 text-emerald-700" : item.status === "created" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {item.status === "paid" ? "Completed" : item.status === "created" ? "Pending" : item.status === "cancelled" ? "Cancelled" : "Failed"}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate py-3.5 font-mono text-[11px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
                        {item.paymentId || "—"}
                      </td>
                      <td className="py-3.5 text-right">
                        {item.status === "paid" && <button
                          type="button"
                          onClick={() => {
                            setSuccessModalData({
                              planName: item.planName || "Pro Tutor",
                              amount: item.amount,
                              currency: "₹",
                              billingCycle: item.billingCycle || "monthly",
                              paymentId: item.id,
                              orderId: item.orderId,
                              validUntil: item.date,
                            });
                          }}
                          className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline [[data-theme=dark]_&]:text-blue-400"
                        >
                          View Receipt
                        </button>}
                      </td>
                    </tr>
                 ))}
                </tbody>
              </table>
            </div>
         )}
        </div>

        {/* ================= BILLING FAQS ================= */}
        <div className="rounded-3xl border border-[#dfe9f3] bg-white p-[26px_28px] shadow-[var(--tf-shadow)] sm:p-[30px_34px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]">
          <h3 className="mb-1.5 text-lg font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">Frequently Asked Questions</h3>
          <p className="mb-6 text-[13px] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">
            Everything you need to know about TutorFolio subscriptions and Razorpay
            billing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAYMENT_FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-[#dfe9f3] bg-[#f8fbff] p-[18px_20px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44]">
                <h4 className="mb-1.5 text-sm font-semibold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{faq.q}</h4>
                <p className="text-[13px] leading-[1.55] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">{faq.a}</p>
              </div>
           ))}
          </div>
        </div>
      </div>

      {/* ================= SUCCESS & RECEIPT MODAL ================= */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#dfe9f3] bg-white p-6 text-[#172b46] shadow-2xl sm:p-8 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#e8f0fb]">
            <button
              onClick={() => setSuccessModalData(null)}
              className="absolute right-5 top-5 cursor-pointer rounded-lg p-1 text-xl text-gray-400 hover:text-gray-700 [[data-theme=dark]_&]:hover:text-white"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="space-y-3 border-b border-[#dfe9f3] pb-6 text-center [[data-theme=dark]_&]:border-[#30465f]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-3xl text-emerald-600 [[data-theme=dark]_&]:text-emerald-400">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                Payment Successful!
              </h3>
              <p className="text-xs text-[#566b84] sm:text-sm [[data-theme=dark]_&]:text-[#b7c7db]">
                Your subscription to{" "}
                <strong className="text-emerald-600 [[data-theme=dark]_&]:text-emerald-400">
                  {successModalData.planName}
                </strong>{" "}
                has been activated successfully.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="my-6 space-y-3 rounded-2xl border border-[#dfe9f3] bg-[#f8fbff] p-4 text-xs sm:text-sm [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44]">
              <div className="flex justify-between">
                <span className="text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Amount Paid</span>
                <span className="text-base font-bold text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                  {successModalData.currency}
                  {successModalData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Billing Frequency</span>
                <span className="font-medium capitalize text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">
                  {successModalData.billingCycle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Payment Ref ID</span>
                <span className="font-mono text-xs font-semibold text-blue-600 [[data-theme=dark]_&]:text-blue-400">
                  {successModalData.paymentId || "N/A"}
                </span>
              </div>
              {successModalData.orderId && (
                <div className="flex justify-between">
                  <span className="text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Order ID</span>
                  <span className="font-mono text-xs text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">
                    {successModalData.orderId}
                  </span>
                </div>
             )}
              {successModalData.validUntil && (
                <div className="flex justify-between">
                  <span className="text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Active Until</span>
                  <span className="font-semibold text-emerald-600 [[data-theme=dark]_&]:text-emerald-400">
                    {formatDate(successModalData.validUntil)}
                  </span>
                </div>
             )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 cursor-pointer rounded-xl border border-[#dfe9f3] bg-[#f8fbff] px-4 py-3 text-xs font-semibold text-[#172b46] transition-colors sm:text-sm [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#e8f0fb]"
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-600/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
     )}


    </div>
 );
}

export default Subscription;
