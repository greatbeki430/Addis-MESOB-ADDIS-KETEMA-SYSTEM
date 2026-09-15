// backend/src/services/smsProviders/smsTo.js
//
// SMS.to adapter.
// Docs: https://sms.to/docs/api
// REST API: POST https://api.sms.to/sms/send
//
// Auth: Bearer token.
// Body: JSON.

const SMSTO_API_KEY = process.env.SMSTO_API_KEY || "";
const SMSTO_API_URL = "https://api.sms.to/sms/send";
const SMSTO_SENDER_ID = process.env.SMSTO_SENDER_ID || "AddisMESOB";

const isConfigured = () => Boolean(SMSTO_API_KEY);

async function send(to, message) {
  if (!isConfigured()) {
    return { success: false, retryable: false, error: "SMS.to not configured" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(SMSTO_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SMSTO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        to: to.startsWith("+") ? to : `+${to}`,
        sender_id: SMSTO_SENDER_ID,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);
    const success = response.ok && data?.success === true;

    if (success) {
      return { success: true, provider: "smsto" };
    }

    // SMS.to has no documented permanent-code list here; treat 4xx as
    // permanent, 5xx and timeouts as retryable.
    const retryable = response.status >= 500;

    console.warn(
      `⚠️ [smsTo] send failed: ${data?.message || `HTTP ${response.status}`} (retryable=${retryable})`,
    );

    return {
      success: false,
      retryable,
      error: data?.message || `HTTP ${response.status}`,
      provider: "smsto",
    };
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    console.error(
      `❌ [smsTo] ${isTimeout ? "timeout" : "error"}:`,
      error.message,
    );
    return {
      success: false,
      retryable: true,
      error: isTimeout ? "Request timed out" : error.message,
      provider: "smsto",
    };
  }
}

module.exports = { name: "smsto", isConfigured, send };
