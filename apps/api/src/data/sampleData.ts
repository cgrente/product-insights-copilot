export const SAMPLE_DATA = {
  period: "last_14_days",
  metrics: {
    totalSessions: 120340,
    conversionRate: 0.034,
    avgSessionDurationSec: 142,
  },
  pages: [
    { path: "/", views: 32000, bounceRate: 0.52 },
    { path: "/pricing", views: 18000, bounceRate: 0.41 },
    { path: "/signup", views: 9000, bounceRate: 0.28 },
    { path: "/docs", views: 14000, bounceRate: 0.62 },
    { path: "/blog", views: 21000, bounceRate: 0.70 },
  ],
  notes: [
    "Pricing page traffic increased after campaign A.",
    "Docs bounce rate is high; likely mismatch between intent and landing content.",
    "Signup conversion improved after reducing form fields.",
  ],
};