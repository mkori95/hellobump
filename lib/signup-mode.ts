// Single env var controls whether /signup requires an invite code.
//
// Set NEXT_PUBLIC_SIGNUP_MODE=open (in Vercel's project env vars) and
// redeploy to make signup public — no code changes needed. Any other value
// (including unset) keeps signup invite-only, which is the safer default:
// a fresh deploy with no env var set should never accidentally be wide open.
//
// The NEXT_PUBLIC_ prefix means Next.js inlines this into the client bundle
// at build time (so the signup form knows whether to show the invite-code
// field) — but the actual secret, SIGNUP_INVITE_CODE, is a separate
// server-only var and is never exposed to the client.
export function isSignupOpen(): boolean {
  return process.env.NEXT_PUBLIC_SIGNUP_MODE === "open";
}
