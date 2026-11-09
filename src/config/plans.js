/** TutorFolio subscription tiers and displayed pricing. */
export const BILLING_CYCLES = { MONTHLY: "monthly", YEARLY: "yearly" };

const sharedFeatures = [
  { text: "Website Management", included: true },
  { text: "Website Visitors Tracker", included: true },
  { text: "Platform Messenger", included: true },
  { text: "All-in-One Dashboard", included: true },
  { text: "Conversations", included: true },
];

export const PLANS = [
  {
    id: "free", name: "Free (Lifetime)", badge: "Free", description: "The essentials to create and manage your tutor website.", popular: false,
    monthlyPrice: 1, yearlyPrice: 1, currency: "INR", currencySymbol: "₹",
    features: [
      ...sharedFeatures,
      { text: "Batches Management: 1 image", included: true },
      { text: "Student Achievements & Reviews: 1 image", included: true },
      { text: "Tuition Classes Gallery: up to 10 images", included: true },
      { text: "Multiple Website Themes", included: false },
      { text: "Dashboard Refresh Rate: 1 day", included: true },
    ],
    highlightFeature: "Free lifetime access", ctaText: "Get Started", accentColor: "blue",
  },
  {
    id: "pro", name: "Pro", badge: "Popular", description: "More room to showcase your batches, achievements, and brand.", popular: true,
    monthlyPrice: 2, yearlyPrice: 2, currency: "INR", currencySymbol: "₹",
    features: [
      ...sharedFeatures,
      { text: "Batches Management: up to 5 images", included: true },
      { text: "Student Achievements & Reviews: up to 5 images", included: true },
      { text: "Tuition Classes Gallery: up to 20 images", included: true },
      { text: "Multiple Website Themes", included: true },
      { text: "Dashboard Refresh Rate: 1 day", included: true },
    ],
    highlightFeature: "More images and multiple themes", ctaText: "Choose Pro", accentColor: "indigo",
  },
  {
    id: "elite", name: "Elite", badge: "Best Value", description: "Maximum image capacity and live dashboard updates.", popular: false,
    monthlyPrice: 3, yearlyPrice: 3, currency: "INR", currencySymbol: "₹",
    features: [
      ...sharedFeatures,
      { text: "Batches Management: up to 20 images", included: true },
      { text: "Student Achievements & Reviews: up to 20 images", included: true },
      { text: "Tuition Classes Gallery: up to 200 images", included: true },
      { text: "Multiple Website Themes", included: true },
      { text: "Dashboard Refresh Rate: Live", included: true },
    ],
    highlightFeature: "Highest limits with live dashboard", ctaText: "Choose Elite", accentColor: "purple",
  },
];

export const PAYMENT_FAQS = [
  { q: "What payment methods are supported via Razorpay?", a: "Razorpay supports UPI, cards, net banking, and popular wallets." },
  { q: "Is my payment secure?", a: "Payments are processed securely by Razorpay. TutorFolio does not store your card or banking credentials." },
  { q: "Can I change my plan later?", a: "You can change your subscription plan at any time." },
  { q: "Will I receive a receipt?", a: "Your payment record is available in Billing History after the payment is verified." },
  { q: "Can I cancel my subscription?", a: "Contact TutorFolio support for help with your subscription." },
];
