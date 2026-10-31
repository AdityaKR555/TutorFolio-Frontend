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

function Subscription() {
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [currentSub, setCurrentSub] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState("");
  const [successModalData, setSuccessModalData] = useState(null);
  const [sandboxPromptOrder, setSandboxPromptOrder] = useState(null);

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
      // Already on this plan
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
        // If CDN script blocked or failed, trigger sandbox testing flow
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
        order_id: orderData.orderId,
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
          color: "#2563eb",
          backdrop_color: "rgba(10, 22, 40, 0.85)",
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
        // Key might be placeholder or invalid during backend development
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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👑</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Plans &amp; Billing
              </h1>
            </div>
            <p className="text-[#94a8c7] text-sm sm:text-base max-w-2xl">
              Supercharge your tutoring presence. Accept inquiries, display
              unlimited batches, and build credibility with instant Razorpay
              checkout.
            </p>
          </div>

          {/* Secure Badge */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl text-xs text-blue-300">
            <svg
              className="w-4 h-4 text-blue-400 shrink-0"
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
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
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
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* ================= ACTIVE SUBSCRIPTION BANNER ================= */}
        {currentSub && currentSub.status === "active" && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#0f1f36] to-purple-900/30 border border-blue-500/30 p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE PLAN
                  </span>
                  <span className="text-white text-lg font-bold">
                    {currentSub.planName || "Pro Tutor"}
                  </span>
                </div>
                <p className="text-[#94a8c7] text-xs sm:text-sm">
                  Billing Cycle:{" "}
                  <span className="text-white capitalize">
                    {currentSub.billingCycle || "Monthly"}
                  </span>{" "}
                  &bull; Valid until:{" "}
                  <span className="text-white font-medium">
                    {formatDate(currentSub.validUntil)}
                  </span>
                </p>
                {currentSub.paymentId && (
                  <p className="text-[#64748b] text-xs font-mono">
                    Ref ID: {currentSub.paymentId}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="#pricing-cards"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  Change Plan
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= BILLING CYCLE TOGGLE ================= */}
        <div id="pricing-cards" className="flex flex-col items-center gap-4 pt-2">
          <div className="inline-flex items-center bg-[#0f1f36] border border-blue-500/20 rounded-2xl p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.MONTHLY)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === BILLING_CYCLES.MONTHLY
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-[#94a8c7] hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.YEARLY)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === BILLING_CYCLES.YEARLY
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-[#94a8c7] hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                Save ~17%
              </span>
            </button>
          </div>
          <p className="text-xs text-[#6b7f9f]">
            {billingCycle === BILLING_CYCLES.YEARLY
              ? "Billed annually. 2 months free included in each tier!"
              : "Billed monthly. Cancel or change plans anytime."}
          </p>
        </div>

        {/* ================= 3 PRICING CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
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
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-b from-[#132746] to-[#0a1628] border-2 border-blue-500/50 shadow-2xl shadow-blue-900/30 lg:-translate-y-2"
                    : "bg-[#0f1f36] border border-blue-500/15 hover:border-blue-500/30 shadow-xl"
                }`}
              >
                {/* Popular / Recommended Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    {!plan.popular && plan.badge && (
                      <span className="text-[11px] font-semibold text-[#8ba3c7] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[#94a8c7] text-xs sm:text-sm min-h-[38px] mb-5">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 pb-6 border-b border-blue-500/10 mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {plan.currencySymbol}
                      {price}
                    </span>
                    <span className="text-[#94a8c7] text-xs sm:text-sm font-medium">
                      /{billingCycle === BILLING_CYCLES.YEARLY ? "year" : "month"}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7f9f]">
                      What's Included
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm"
                        >
                          {feature.included ? (
                            <svg
                              className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
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
                              className="w-4 h-4 text-[#475569] shrink-0 mt-0.5"
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
                          <span
                            className={
                              feature.included ? "text-[#c7d8f5]" : "text-[#506380]"
                            }
                          >
                            {feature.text}
                          </span>
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
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                        : plan.popular
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    } ${isProcessing ? "opacity-75 cursor-wait" : ""}`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <svg
                          className="w-4 h-4 text-emerald-400"
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
        <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h4 className="text-white font-bold text-base mb-1">
                Accepted Payment Methods via Razorpay
              </h4>
              <p className="text-[#94a8c7] text-xs sm:text-sm">
                UPI (GPay, PhonePe, Paytm, BHIM), Cards (Visa, MasterCard, RuPay),
                NetBanking (50+ Banks) &amp; Wallets.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="bg-[#0a1628] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c7d8f5]">
                UPI / QR
              </span>
              <span className="bg-[#0a1628] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c7d8f5]">
                Debit &amp; Credit Cards
              </span>
              <span className="bg-[#0a1628] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c7d8f5]">
                NetBanking
              </span>
              <span className="bg-[#0a1628] border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c7d8f5]">
                Wallets
              </span>
            </div>
          </div>
        </div>

        {/* ================= TRANSACTION HISTORY ================= */}
        <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Billing History</h3>
              <p className="text-[#94a8c7] text-xs sm:text-sm mt-0.5">
                Past transactions and downloadable tax receipts
              </p>
            </div>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-[#6b7f9f] text-sm">
              No transactions recorded yet. When you upgrade via Razorpay, receipts will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-blue-500/10 text-[#6b7f9f] uppercase text-[11px] tracking-wider">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Billing</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Payment ID</th>
                    <th className="pb-3 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/5 text-[#c7d8f5]">
                  {paymentHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 text-white">{formatDate(item.date)}</td>
                      <td className="py-3.5 font-medium text-white">{item.planName || "Pro Tutor"}</td>
                      <td className="py-3.5 capitalize">{item.billingCycle || "Monthly"}</td>
                      <td className="py-3.5 font-semibold text-emerald-400">
                        ₹{item.amount}
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-[#94a8c7] truncate max-w-[120px]">
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
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium cursor-pointer underline"
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
        <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-2">
            Frequently Asked Questions
          </h3>
          <p className="text-[#94a8c7] text-xs sm:text-sm mb-6">
            Everything you need to know about TutorFolio subscriptions and Razorpay
            billing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PAYMENT_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0a1628]/60 border border-blue-500/10 space-y-2"
              >
                <h4 className="text-white font-semibold text-sm">{faq.q}</h4>
                <p className="text-[#94a8c7] text-xs leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SUCCESS & RECEIPT MODAL ================= */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0f1f36] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setSuccessModalData(null)}
              className="absolute top-5 right-5 text-[#94a8c7] hover:text-white p-1 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="text-center space-y-3 pb-6 border-b border-blue-500/10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-white">
                Payment Successful!
              </h3>
              <p className="text-[#94a8c7] text-xs sm:text-sm">
                Your subscription to{" "}
                <span className="text-emerald-400 font-semibold">
                  {successModalData.planName}
                </span>{" "}
                has been activated successfully.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="my-6 p-4 rounded-2xl bg-[#0a1628] border border-blue-500/10 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Amount Paid</span>
                <span className="font-bold text-white text-base">
                  {successModalData.currency}
                  {successModalData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Billing Frequency</span>
                <span className="text-white capitalize">
                  {successModalData.billingCycle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Payment Ref ID</span>
                <span className="font-mono text-blue-300 text-xs">
                  {successModalData.paymentId || "N/A"}
                </span>
              </div>
              {successModalData.orderId && (
                <div className="flex justify-between">
                  <span className="text-[#94a8c7]">Order ID</span>
                  <span className="font-mono text-[#94a8c7] text-xs">
                    {successModalData.orderId}
                  </span>
                </div>
              )}
              {successModalData.validUntil && (
                <div className="flex justify-between">
                  <span className="text-[#94a8c7]">Active Until</span>
                  <span className="text-emerald-400 font-medium">
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
                className="flex-1 py-3 px-4 rounded-xl border border-blue-500/20 text-[#c7d8f5] hover:bg-white/5 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SANDBOX DEV TESTING MODAL ================= */}
      {sandboxPromptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0f1f36] border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setSandboxPromptOrder(null)}
              className="absolute top-5 right-5 text-[#94a8c7] hover:text-white p-1 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="space-y-3 pb-5 border-b border-blue-500/10">
              <div className="flex items-center gap-2 text-blue-400">
                <span className="text-xl">⚡</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Razorpay Gateway Simulation
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Complete Sandbox Payment
              </h3>
              <p className="text-[#94a8c7] text-xs sm:text-sm">
                {sandboxPromptOrder.reason}
              </p>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-[#0a1628] border border-blue-500/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Selected Plan</span>
                <span className="text-white font-semibold">
                  {sandboxPromptOrder.plan.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Amount</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₹{sandboxPromptOrder.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a8c7]">Order ID</span>
                <span className="font-mono text-blue-300">
                  {sandboxPromptOrder.orderData.orderId}
                </span>
              </div>
              <p className="text-[#64748b] pt-1 text-[11px]">
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
                className="flex-1 py-3 px-4 rounded-xl border border-blue-500/10 text-[#94a8c7] hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
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

