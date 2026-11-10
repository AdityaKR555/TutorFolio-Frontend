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
export const setCachedSubscription = (sub, { notify = true } = {}) => {
  try {
    const serialized = JSON.stringify(sub);
    const previous = localStorage.getItem(STORAGE_KEY_SUB);
    if (previous === serialized) return;
    localStorage.setItem(STORAGE_KEY_SUB, serialized);
    if (notify) window.dispatchEvent(new Event("tutorfolio-subscription-updated"));
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
    throw new Error(err.response?.data?.detail || err.message || "Could not create payment order.");
  }
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
    throw new Error(err.response?.data?.detail || err.message || "Payment verification failed.");
  }
};

/**
 * 3. GET CURRENT SUBSCRIPTION STATUS
 * Calls GET /payments/subscription-status?userId=...
 * Always prefers the server response; falls back to cache only on network failure.
 */
export const fetchSubscriptionStatus = async (userId) => {
  if (!userId) return getCachedSubscription();

  try {
    const response = await api.get("/payments/subscription-status", {
      params: { userId },
      timeout: 8000,
    });

    if (response.data?.status === 200 && response.data?.data) {
      // Server is authoritative — overwrite cache with fresh data
      setCachedSubscription(response.data.data, { notify: false });
      return response.data.data;
    }

    // 200 OK but no active subscription data → user has no active plan
    // Clear any stale cached subscription so the UI reflects reality
    localStorage.removeItem("tutorfolio_subscription");
    return null;
  } catch (err) {
    if (err.response?.status === 404) {
      localStorage.removeItem(STORAGE_KEY_SUB);
      return null;
    }
    throw new Error(err.response?.data?.detail || err.message || "Could not load subscription status.");
  }
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
    throw new Error(err.response?.data?.detail || err.message || "Could not load payment history.");
  }
};



export const fetchSubscriptionPlans = async () => {
  const response = await api.get("/payments/plans", { timeout: 8000 });
  if (response.data?.status !== 200 || !Array.isArray(response.data?.data)) {
    throw new Error("Could not load subscription plans.");
  }
  return response.data.data;
};

export const closePaymentOrder = async ({ userId, orderId, status = "cancelled" }) => {
  await api.post("/payments/close-order", { userId, orderId, status });
};
