export async function verifyTurnstileToken(token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY is not defined. Skipping verification.");
    return true; // Skip if not configured
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    if (!outcome.success) {
      console.error("Turnstile verification failed:", outcome['error-codes']);
    }
    return outcome.success;
  } catch (error) {
    console.error("Error verifying Turnstile token:", error);
    return false;
  }
}
