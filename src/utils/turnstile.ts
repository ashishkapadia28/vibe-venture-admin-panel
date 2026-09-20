/**
 * Cloudflare Turnstile server-side verification. Keys already exist in
 * this project's env (added for the Inquiries form, currently unused —
 * this reconnects them for the careers application form).
 *
 * Fails open only on our own network/config trouble (no secret configured,
 * or Cloudflare's endpoint unreachable) — never let Turnstile's own outage
 * take down real applications. Fails closed on a missing or rejected
 * token, which is the actual spam check doing its job.
 */
export async function verifyTurnstile(token: string | null, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — verification is disabled.");
    return true;
  }

  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });

    if (!res.ok) {
      console.error("[turnstile] siteverify request failed with status", res.status);
      return true; // Cloudflare having a bad day shouldn't block real applicants
    }

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] siteverify request errored:", err);
    return true;
  }
}
