// backend/src/services/smsProviders/africasTalking.js
//
// Africa's Talking adapter.
// Docs: https://developers.africastalking.com/docs/sms/sending
// REST API: POST https://api.africastalking.com/version1/messaging
//
// Auth: `apiKey` header (NOT Bearer).
// Body: form-urlencoded with `username` and `to` (comma-separated) and `message`.

const AT_API_KEY = process.env.AT_API_KEY || "";
const AT_USERNAME = process.env.AT_USERNAME || "sandbox"; // "sandbox" for testing
const AT_SENDER_ID = process.env.AT_SENDER_ID || ""; // optional alphanumeric sender
// const AT_API_URL = "https://api.africastalking.com/version1/messaging";
const AT_API_URL =
  AT_USERNAME === "sandbox"
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

// Africa's Talking returns per-recipient status. Permanent failures:
// "InvalidPhoneNumber", "InsufficientBalance" is retryable (top up).
const PERMANENT_STATUS = new Set(["InvalidPhoneNumber", "InvalidSenderId"]);

const isConfigured = () => Boolean(AT_API_KEY && AT_USERNAME);

async function send(to, message) {
  if (!isConfigured()) {
    return {
      success: false,
      retryable: false,
      error: "Africa's Talking not configured",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const params = new URLSearchParams({
      username: AT_USERNAME,
      to: to.startsWith("+") ? to : `+${to}`,
      message,
    });
    if (AT_SENDER_ID) params.append("from", AT_SENDER_ID);

    const response = await fetch(AT_API_URL, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    // AT wraps results in SMSMessageData.Recipients[]
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    const status = recipient?.status || "";
    const success = response.ok && status === "Success";

    if (success) {
      return { success: true, provider: "africastalking" };
    }

    const retryable = !PERMANENT_STATUS.has(status);

    console.warn(
      `⚠️ [africasTalking] send failed: ${status || data?.SMSMessageData?.Message} (retryable=${retryable})`,
    );

    return {
      success: false,
      retryable,
      error:
        status || data?.SMSMessageData?.Message || `HTTP ${response.status}`,
      provider: "africastalking",
    };
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    console.error(
      `❌ [africasTalking] ${isTimeout ? "timeout" : "error"}:`,
      error.message,
    );
    return {
      success: false,
      retryable: true,
      error: isTimeout ? "Request timed out" : error.message,
      provider: "africastalking",
    };
  }
}

module.exports = { name: "africastalking", isConfigured, send };
