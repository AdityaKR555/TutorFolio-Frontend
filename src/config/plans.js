/**
 * TutorFolio Subscription Plans Configuration
 * Placeholder pricing: Starter (₹39), Pro (₹49), Ultimate (₹59)
 * Easily customizable when production pricing is finalized.
 */

export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: "Basic",
    description: "Essential tools to build your professional tutoring web presence.",
    popular: false,
    monthlyPrice: 39,
    yearlyPrice: 390, // ~17% off (2 months free)
    currency: "INR",
    currencySymbol: "₹",
    features: [
      { text: "1 Custom Tutor Portfolio Website", included: true },
      { text: "Up to 3 Active Batches showcase", included: true },
      { text: "Student Inquiries via Contact Form", included: true },
      { text: "Standard Dark & Light Portfolio Themes", included: true },
      { text: "SEO Meta Tags & Social Share Previews", included: true },
      { text: "Basic Profile Analytics (Views)", included: true },
      { text: "Verified Tutor Trust Badge", included: false },
      { text: "Unlimited Batches & Subjects", included: false },
      { text: "AI Resume Auto-fill", included: false },
      { text: "Custom Domain Support", included: false },
    ],
    highlightFeature: "3 Batches + Public Website",
    ctaText: "Get Started",
    accentColor: "blue",
  },
  {
    id: "pro",
    name: "Pro Tutor",
    badge: "Most Popular",
    description: "The complete toolkit to grow your student base and automate inquiries.",
    popular: true,
    monthlyPrice: 49,
    yearlyPrice: 490, // ~17% off (2 months free)
    currency: "INR",
    currencySymbol: "₹",
    features: [
      { text: "1 Custom Tutor Portfolio Website", included: true },
      { text: "Unlimited Active Batches showcase", included: true },
      { text: "Instant WhatsApp & Email Inquiries", included: true },
      { text: "All Premium Themes + Custom Brand Accent", included: true },
      { text: "Verified Tutor Trust Badge on Directory", included: true },
      { text: "Unlimited AI Resume Auto-Fill", included: true },
      { text: "Student Testimonials & Achievements Showcase", included: true },
      { text: "Priority Search Ranking on Discover Tutors", included: true },
      { text: "Priority 24/7 Email & Chat Support", included: true },
      { text: "Custom Domain Support", included: false },
    ],
    highlightFeature: "Unlimited Batches + Verified Badge + AI Auto-fill",
    ctaText: "Upgrade to Pro",
    accentColor: "indigo",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    badge: "Best Value",
    description: "For top educators, coaching institutes, and growing teaching brands.",
    popular: false,
    monthlyPrice: 59,
    yearlyPrice: 590, // ~17% off (2 months free)
    currency: "INR",
    currencySymbol: "₹",
    features: [
      { text: "Everything in Pro Tutor Plan", included: true },
      { text: "Custom Domain Mapping (yourdomain.com)", included: true },
      { text: "Remove TutorFolio Footer Branding", included: true },
      { text: "Multiple Branch / Assistant Accounts", included: true },
      { text: "Automated Fee Receipts & Payment Links", included: true },
      { text: "Advanced Visitor & Conversion Analytics", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Early Access to Beta Features", included: true },
    ],
    highlightFeature: "Custom Domain + Zero Branding + White-label",
    ctaText: "Go Ultimate",
    accentColor: "purple",
  },
];

export const PAYMENT_FAQS = [
  {
    q: "What payment methods are supported via Razorpay?",
    a: "Razorpay supports all major payment modes across India, including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay, Maestro), NetBanking (50+ banks), and popular Wallets.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. All transactions are securely processed through Razorpay's PCI-DSS Level 1 compliant infrastructure with 256-bit SSL encryption. TutorFolio never stores your card or banking credentials.",
  },
  {
    q: "Can I upgrade or downgrade my plan later?",
    a: "Yes, you can change your subscription tier anytime. When upgrading, the prorated remainder of your previous payment will be credited toward your new plan.",
  },
  {
    q: "Will I receive an invoice / tax receipt for my purchase?",
    a: "Yes! As soon as payment is confirmed, an official GST-compliant tax receipt is generated and available to download directly from your billing history.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel whenever you wish. You will retain access to all plan features until the end of your current paid billing period.",
  },
];

