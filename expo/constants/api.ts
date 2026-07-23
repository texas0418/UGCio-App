// UGCio Web API Configuration
// Update these values with your Vercel deployment URL and API key

export const API_CONFIG = {
  // Your Vercel deployment URL (no trailing slash). Use the www host: the
  // apex ugcio.app 307-redirects to www, and fetch drops the x-api-key header
  // on that redirect, so POSTs to /api/publish and /api/upload fail.
  BASE_URL: "https://www.ugcio.app",

  // Must match the API_SECRET_KEY env var in Vercel
  API_KEY: "ugcio_sk_a8f3k2m9x7",
};
