// backend/src/services/smsProviders/easySendSms.js
//
// EasySendSMS adapter (corrected).
// Docs: https://www.easysendsms.com/rest-api
// Endpoint: POST https://restapi.easysendsms.app/v1/rest/sms/send
// Auth: apikey header (NOT Bearer)
// Body: JSON

const EASYSENDSMS_API_KEY = process.env.EASYSENDSMS_API_KEY || "";
const EASYSENDSMS_API_URL =
  process.env.EASYSENDSMS_API_URL ||
  "https://restapi.easysendsms.app/v1/rest/sms/send";
const EASYSENDSMS_SENDER_ID = process.env.EASYSENDSMS_SENDER_ID || "AddisMESOB";

const isConfigured = () => Boolean(EASYSENDSMS_API_KEY);

async function send(to, message) {
  if (!isConfigured()) {
    return {
      success: false,
      retryable: false,
      error: "EasySendSMS not configured",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(EASYSENDSMS_API_URL, {
      method: "POST",
      headers: {
        apikey: EASYSENDSMS_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: EASYSENDSMS_SENDER_ID,
        to: to.replace(/\D/g, ""), // digits-only, no + or 00 [citation:13]
        text: message,
        type: "0", // 0 = plain text, 1 = Unicode
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);
    const success = response.ok && data?.status === "OK";

    if (success) {
      return { success: true, provider: "easysendsms" };
    }

    const errMsg = data?.message || data?.status || `HTTP ${response.status}`;
    console.warn(`⚠️ [easySendSms] send failed: ${errMsg}`);

    return {
      success: false,
      retryable: response.status >= 500,
      error: errMsg,
      provider: "easysendsms",
    };
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    console.error(
      `❌ [easySendSms] ${isTimeout ? "timeout" : "error"}:`,
      error.message,
    );
    return {
      success: false,
      retryable: true,
      error: isTimeout ? "Request timed out" : error.message,
      provider: "easysendsms",
    };
  }
}

module.exports = { name: "easysendsms", isConfigured, send };
