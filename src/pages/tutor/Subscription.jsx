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
  fetchPaymentHistory,
  fetchSubscriptionStatus,
  verifyPaymentSignature,
} from "../../api/payment";
import "./Subscription.css";

function Subscription() {
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [currentSub, setCurrentSub] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState("");
  const [successModalData, setSuccessModalData] = useState(null);
  const [sandboxPromptOrder, setSandboxPromptOrder] = useState(null);

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
        const [sub, history] = await Promise.all([
          fetchSubscriptionStatus(userId),
          fetchPaymentHistory(userId),
        ]);

        if (mounted) {
          setCurrentSub(sub);
          setPaymentHistory(history || []);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading subscription data:", err);
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

    const price =
      billingCycle === BILLING_CYCLES.YEARLY
        ? plan.yearlyPrice
        : plan.monthlyPrice;

    try {
      // Step 1: Create Order via Backend API
      const orderData = await createPaymentOrder({
        userId,
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        amount: price,
        currency: plan.currency,
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Failed to initialize payment order. Please try again.");
      }

      // Step 2: Load Razorpay Checkout SDK
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded || !window.Razorpay) {
        setSandboxPromptOrder({
          plan,
          orderData,
          price,
          reason: "Razorpay Checkout script could not be reached from your browser.",
        });
        setProcessingPlanId(null);
        return;
      }

      // Step 3: Configure Razorpay Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "TutorFolio",
        description: `${plan.name} (${billingCycle === BILLING_CYCLES.YEARLY ? "Annual" : "Monthly"})`,
        image: "https://alpha.tutorfolio.site/favicon.ico",
        ...(orderData.isSimulated ? {} : { order_id: orderData.orderId }),
        handler: async (response) => {
          await completeVerification({
            plan,
            orderData,
            price,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || orderData.orderId,
            razorpay_signature: response.razorpay_signature || "test_signature_valid",
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
            setProcessingPlanId(null);
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (failedRes) => {
          console.error("Razorpay Payment Failed:", failedRes.error);
          setError(
            failedRes.error?.description ||
              "Payment was declined or cancelled. Please try again."
          );
          setProcessingPlanId(null);
        });

        rzp.open();
      } catch (rzpInitErr) {
        console.warn("Razorpay instance initialization notice:", rzpInitErr);
        setSandboxPromptOrder({
          plan,
          orderData,
          price,
          reason:
            "Awaiting backend live Razorpay API Key. You can test the end-to-end checkout flow below:",
        });
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
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        amount: price,
        currency: plan.currency,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      setCurrentSub(activeSub);
      setPaymentHistory((prev) => [
        {
          id: razorpay_payment_id,
          orderId: razorpay_order_id,
          planId: plan.id,
          planName: plan.name,
          amount: price,
          currency: plan.currency,
          billingCycle,
          status: "success",
          date: new Date().toISOString(),
        },
        ...prev,
      ]);

      setSuccessModalData({
        planName: plan.name,
        amount: price,
        currency: plan.currencySymbol || "₹",
        billingCycle,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        validUntil: activeSub.validUntil,
      });

      setSandboxPromptOrder(null);
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
    <div className="sub-page">
      <div className="sub-container space-y-8">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl">👑</span>
              <h1 className="sub-title">Plans &amp; Billing</h1>
            </div>
            <p className="sub-subtitle max-w-2xl">
              Supercharge your tutoring presence. Accept inquiries, display
              unlimited batches, and build credibility with instant Razorpay
              checkout.
            </p>
          </div>

          {/* Secure Trust Badge */}
          <div className="sub-trust-badge self-start md:self-auto">
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
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-sm flex items-start gap-3">
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

        {/* ================= ACTIVE SUBSCRIPTION BANNER ================= */}
        {currentSub && currentSub.status === "active" && (
          <div className="sub-active-banner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE PLAN
                  </span>
                  <span className="text-lg font-bold" style={{ color: "var(--tf-ink)" }}>
                    {currentSub.planName || "Pro Tutor"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm" style={{ color: "var(--tf-copy)" }}>
                  Billing Cycle:{" "}
                  <strong className="capitalize" style={{ color: "var(--tf-ink)" }}>
                    {currentSub.billingCycle || "Monthly"}
                  </strong>{" "}
                  &bull; Valid until:{" "}
                  <strong style={{ color: "var(--tf-ink)" }}>
                    {formatDate(currentSub.validUntil)}
                  </strong>
                </p>
                {currentSub.paymentId && (
                  <p className="text-xs font-mono" style={{ color: "var(--tf-muted)" }}>
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

        {/* ================= BILLING CYCLE TOGGLE ================= */}
        <div id="pricing-cards" className="flex flex-col items-center gap-3 pt-2">
          <div className="sub-toggle-wrapper">
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.MONTHLY)}
              className={`sub-toggle-btn ${billingCycle === BILLING_CYCLES.MONTHLY ? "active" : ""}`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.YEARLY)}
              className={`sub-toggle-btn flex items-center gap-2 ${billingCycle === BILLING_CYCLES.YEARLY ? "active" : ""}`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                Save ~17%
              </span>
            </button>
          </div>
          <p className="text-xs" style={{ color: "var(--tf-muted)" }}>
            {billingCycle === BILLING_CYCLES.YEARLY
              ? "Billed annually. 2 months free included in each tier!"
              : "Billed monthly. Cancel or change plans anytime."}
          </p>
        </div>

        {/* ================= 3 PRICING CARDS ================= */}
        <div className="sub-cards-grid">
          {PLANS.map((plan) => {
            const price =
              billingCycle === BILLING_CYCLES.YEARLY
                ? plan.yearlyPrice
                : plan.monthlyPrice;
            const isCurrent = isCurrentPlan(plan.id);
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`sub-card ${plan.popular ? "sub-card--popular" : ""}`}
              >
                {/* Popular / Recommended Badge */}
                {plan.popular && (
                  <span className="sub-card-popular-badge">
                    {plan.badge}
                  </span>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="sub-card-name">{plan.name}</h3>
                    {!plan.popular && plan.badge && (
                      <span className="sub-card-badge">{plan.badge}</span>
                    )}
                  </div>

                  <p className="sub-card-desc">{plan.description}</p>

                  {/* Price */}
                  <div className="sub-card-pricing">
                    <span className="sub-card-amount">
                      {plan.currencySymbol}
                      {price}
                    </span>
                    <span className="sub-card-cycle">
                      /{billingCycle === BILLING_CYCLES.YEARLY ? "year" : "month"}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="mb-8">
                    <p className="sub-feature-title">What's Included</p>
                    <ul>
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`sub-feature-item ${
                            feature.included
                              ? "sub-feature-item--included"
                              : "sub-feature-item--excluded"
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
                              className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 mt-0.5"
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
                        ? "sub-btn-current"
                        : plan.popular
                        ? "sub-btn-primary"
                        : "sub-btn-secondary"
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
        <div className="sub-panel">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h4 className="sub-panel-title mb-1">
                Accepted Payment Methods via Razorpay
              </h4>
              <p className="sub-panel-desc">
                UPI (GPay, PhonePe, Paytm, BHIM), Cards (Visa, MasterCard, RuPay),
                NetBanking (50+ Banks) &amp; Wallets.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                UPI / QR
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                Debit &amp; Credit Cards
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                NetBanking
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                Wallets
              </span>
            </div>
          </div>
        </div>

        {/* ================= TRANSACTION HISTORY ================= */}
        <div className="sub-panel">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="sub-panel-title">Billing History</h3>
              <p className="sub-panel-desc mt-0.5">
                Past transactions and downloadable tax receipts
              </p>
            </div>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: "var(--tf-muted)" }}>
              No transactions recorded yet. When you upgrade via Razorpay, receipts will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b uppercase text-[11px] tracking-wider" style={{ borderColor: "var(--tf-line)", color: "var(--tf-muted)" }}>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Billing</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Payment ID</th>
                    <th className="pb-3 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--tf-line)" }}>
                  {paymentHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-medium" style={{ color: "var(--tf-ink)" }}>{formatDate(item.date)}</td>
                      <td className="py-3.5 font-semibold" style={{ color: "var(--tf-ink)" }}>{item.planName || "Pro Tutor"}</td>
                      <td className="py-3.5 capitalize" style={{ color: "var(--tf-copy)" }}>{item.billingCycle || "Monthly"}</td>
                      <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.amount}
                      </td>
                      <td className="py-3.5 font-mono text-[11px] truncate max-w-[120px]" style={{ color: "var(--tf-muted)" }}>
                        {item.id || "N/A"}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
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
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= BILLING FAQS ================= */}
        <div className="sub-panel">
          <h3 className="sub-panel-title mb-1.5">Frequently Asked Questions</h3>
          <p className="sub-panel-desc mb-6">
            Everything you need to know about TutorFolio subscriptions and Razorpay
            billing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAYMENT_FAQS.map((faq, idx) => (
              <div key={idx} className="sub-faq-item">
                <h4 className="sub-faq-q">{faq.q}</h4>
                <p className="sub-faq-a">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SUCCESS & RECEIPT MODAL ================= */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border" style={{ background: "var(--tf-surface)", borderColor: "var(--tf-line)", color: "var(--tf-ink)" }}>
            <button
              onClick={() => setSuccessModalData(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg cursor-pointer text-xl"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="text-center space-y-3 pb-6 border-b" style={{ borderColor: "var(--tf-line)" }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <h3 className="text-2xl font-bold" style={{ color: "var(--tf-ink)" }}>
                Payment Successful!
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--tf-copy)" }}>
                Your subscription to{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {successModalData.planName}
                </strong>{" "}
                has been activated successfully.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="my-6 p-4 rounded-2xl border space-y-3 text-xs sm:text-sm" style={{ background: "var(--tf-surface-soft)", borderColor: "var(--tf-line)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Amount Paid</span>
                <span className="font-bold text-base" style={{ color: "var(--tf-ink)" }}>
                  {successModalData.currency}
                  {successModalData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Billing Frequency</span>
                <span className="capitalize font-medium" style={{ color: "var(--tf-ink)" }}>
                  {successModalData.billingCycle}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Payment Ref ID</span>
                <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {successModalData.paymentId || "N/A"}
                </span>
              </div>
              {successModalData.orderId && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--tf-copy)" }}>Order ID</span>
                  <span className="font-mono text-xs" style={{ color: "var(--tf-muted)" }}>
                    {successModalData.orderId}
                  </span>
                </div>
              )}
              {successModalData.validUntil && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--tf-copy)" }}>Active Until</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                className="flex-1 py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                style={{ borderColor: "var(--tf-line)", color: "var(--tf-ink)", background: "var(--tf-surface-soft)" }}
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

      {/* ================= SANDBOX DEV TESTING MODAL ================= */}
      {sandboxPromptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border" style={{ background: "var(--tf-surface)", borderColor: "var(--tf-line)", color: "var(--tf-ink)" }}>
            <button
              onClick={() => setSandboxPromptOrder(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg cursor-pointer text-xl"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="space-y-2 pb-5 border-b" style={{ borderColor: "var(--tf-line)" }}>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="text-xl">⚡</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Razorpay Gateway Simulation
                </span>
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--tf-ink)" }}>
                Complete Sandbox Payment
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--tf-copy)" }}>
                {sandboxPromptOrder.reason}
              </p>
            </div>

            <div className="my-5 p-4 rounded-2xl border space-y-2 text-xs" style={{ background: "var(--tf-surface-soft)", borderColor: "var(--tf-line)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Selected Plan</span>
                <span className="font-semibold" style={{ color: "var(--tf-ink)" }}>
                  {sandboxPromptOrder.plan.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Amount</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  ₹{sandboxPromptOrder.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--tf-copy)" }}>Order ID</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {sandboxPromptOrder.orderData.orderId}
                </span>
              </div>
              <p className="pt-1 text-[11px]" style={{ color: "var(--tf-muted)" }}>
                Note for backend dev: The API will automatically call your{" "}
                <code>/payments/create-order</code> &amp;{" "}
                <code>/payments/verify-payment</code> endpoints as soon as they are
                deployed!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSandboxPromptOrder(null)}
                className="flex-1 py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                style={{ borderColor: "var(--tf-line)", color: "var(--tf-copy)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  completeVerification({
                    plan: sandboxPromptOrder.plan,
                    orderData: sandboxPromptOrder.orderData,
                    price: sandboxPromptOrder.price,
                    razorpay_payment_id: `pay_test_${Date.now().toString(36)}`,
                    razorpay_order_id: sandboxPromptOrder.orderData.orderId,
                    razorpay_signature: "simulated_sha256_signature",
                  })
                }
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                Simulate Success ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;
