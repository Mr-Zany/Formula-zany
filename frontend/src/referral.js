// Section 8, step 2: "Link click stores the referrer's code (session/cookie)".
const REF_KEY = "fz_referral_code";

export function captureReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) localStorage.setItem(REF_KEY, ref);
}

export function getStoredReferralCode() {
  return localStorage.getItem(REF_KEY) || "";
}
