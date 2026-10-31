/**
 * Utility to load Razorpay Checkout script dynamically.
 * URL: https://checkout.razorpay.com/v1/checkout.js
 */

let razorpayScriptPromise = null;

export const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  // Already loaded
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    // Check if script tag is already in DOM
    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK from CDN");
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

