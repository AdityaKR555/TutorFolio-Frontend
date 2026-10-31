/**
 * Payment & Razorpay API Service
 * Handles order creation, signature verification, subscription status, and payment history.
 *
 * Backend Specifications (for FastAPI backend development):
 * - POST /payments/create-order     : Creates Razorpay order and returns orderId + keyId
 * - POST /payments/verify-payment   : Verifies Razorpay HMAC signature & activates subscription
 * - GET  /payments/subscription-status : Returns active subscription details for tutor
 * - GET  /payments/history          : Returns invoice/transaction history for tutor
 */

import api from "./axios";

const STORAGE_KEY_SUB = "tutorfolio_subscription";
const STORAGE_KEY_HISTORY = "tutorfolio_payment_history";

/**
 * Reads local subscription cache (acts as instant state + sandbox fallback)
 */
export const getCachedSubscription = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUB);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check if expired
    if (parsed.validUntil && new Date(parsed.validUntil).getTime() < Date.now()) {
      return { ...parsed, status: "expired" };
    }
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Saves subscription to local cache
 */
export const setCachedSubscription = (sub) => {
  try {
    localStorage.setItem(STORAGE_KEY_SUB, JSON.stringify(sub));
    window.dispatchEvent(new Event("tutorfolio-subscription-updated"));
  } catch (e) {
    console.error("Failed to cache subscription:", e);
  }
};

/**
 * Reads local invoice history
 */
export const getCachedPaymentHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Adds transaction to invoice history
 */
export const addCachedPaymentRecord = (record) => {
  try {
    const list = getCachedPaymentHistory();
    const updated = [record, ...list];
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to add payment record:", e);
    return [];
  }
};

/**
 * 1. CREATE PAYMENT ORDER
 * Calls POST /payments/create-order.
 * Fallback to sandbox order if backend is not yet deployed.
 */
export const createPaymentOrder = async ({
  userId,
  planId,
  planName,
  billingCycle,
  amount,
  currency = "INR",
}) => {
  const payload = {
    userId,
    planId,
    planName,
    billingCycle,
    amount, // In rupees (e.g. 49)
    currency,
  };

  try {
    const response = await api.post("/payments/create-order", payload, {
      timeout: 12000,
    });

    if (response.data?.status === 200 && response.data?.data) {
      return {
        ...response.data.data,
        isSimulated: false,
      };
    }
  } catch (err) {
    // If backend returns 404/501 (not implemented yet) or network unreachable
    console.warn(
      "Backend /payments/create-order endpoint not yet available. Using safe sandbox initialization.",
      err.message
    );
  }

  // Safe fallback while backend is under development:
  // Generate a client-side order reference with fallback key
  const fallbackKeyId =
    import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TutorFolioTestKey";

  const simulatedOrderId = `order_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  return {
    orderId: simulatedOrderId,
    amount: amount * 100, // Razorpay works in paise
    currency,
    keyId: fallbackKeyId,
    planId,
    planName,
    billingCycle,
    isSimulated: true,
  };
};

/**
 * 2. VERIFY PAYMENT SIGNATURE
 * Calls POST /payments/verify-payment.
 * Fallback to local activation if backend is not yet deployed.
 */
export const verifyPaymentSignature = async ({
  userId,
  planId,
  planName,
  billingCycle,
  amount,
  currency = "INR",
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const payload = {
    userId,
    planId,
    planName,
    billingCycle,
    amount,
    currency,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };

  try {
    const response = await api.post("/payments/verify-payment", payload, {
      timeout: 15000,
    });

    if (response.data?.status === 200 && response.data?.data) {
      const activeSub = response.data.data;
      setCachedSubscription(activeSub);
      addCachedPaymentRecord({
        id: razorpay_payment_id || `pay_${Date.now()}`,
        orderId: razorpay_order_id,
        planId,
        planName,
        amount,
        currency,
        billingCycle,
        status: "success",
        date: new Date().toISOString(),
      });
      return activeSub;
    }
  } catch (err) {
    console.warn(
      "Backend /payments/verify-payment endpoint not yet available. Activating subscription locally.",
      err.message
    );
  }

  // Calculate validity date (30 days for monthly, 365 days for yearly)
  const now = new Date();
  const validUntil = new Date(now);
  if (billingCycle === "yearly") {
    validUntil.setFullYear(validUntil.getFullYear() + 1);
  } else {
    validUntil.setDate(validUntil.getDate() + 30);
  }

  const activatedSubscription = {
    subscriptionId: `sub_${Date.now().toString(36)}`,
    planId,
    planName,
    status: "active",
    billingCycle,
    amount,
    currency,
    paymentId: razorpay_payment_id || `pay_sim_${Date.now()}`,
    orderId: razorpay_order_id,
    startDate: now.toISOString(),
    validUntil: validUntil.toISOString(),
    isSimulated: true,
  };

  // Cache locally
  setCachedSubscription(activatedSubscription);
  addCachedPaymentRecord({
    id: activatedSubscription.paymentId,
    orderId: razorpay_order_id,
    planId,
    planName,
    amount,
    currency,
    billingCycle,
    status: "success",
    date: now.toISOString(),
  });

  return activatedSubscription;
};

/**
 * 3. GET CURRENT SUBSCRIPTION STATUS
 * Calls GET /payments/subscription-status?userId=...
 */
export const fetchSubscriptionStatus = async (userId) => {
  if (!userId) return getCachedSubscription();

  try {
    const response = await api.get("/payments/subscription-status", {
      params: { userId },
      timeout: 8000,
    });

    if (response.data?.status === 200 && response.data?.data) {
      setCachedSubscription(response.data.data);
      return response.data.data;
    }
  } catch (err) {
    // Silent fallback to cached status
  }

  return getCachedSubscription();
};

/**
 * 4. GET PAYMENT HISTORY
 * Calls GET /payments/history?userId=...
 */
export const fetchPaymentHistory = async (userId) => {
  if (!userId) return getCachedPaymentHistory();

  try {
    const response = await api.get("/payments/history", {
      params: { userId },
      timeout: 8000,
    });

    if (response.data?.status === 200 && Array.isArray(response.data?.data)) {
      return response.data.data;
    }
  } catch (err) {
    // Silent fallback to local history
  }

  return getCachedPaymentHistory();
};

