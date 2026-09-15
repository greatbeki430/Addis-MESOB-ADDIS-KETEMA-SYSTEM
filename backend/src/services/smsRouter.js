// backend/src/services/smsRouter.js
//
// Multi-provider SMS sender with automatic failover.
//
// Replaces direct calls to smsService.sendSms() in presenter
// notifications. Iterates PROVIDERS in priority order, skipping any
// that aren't configured, and stops at the first provider that
// returns success:true.
//
// Failure handling:
//   - If a provider returns { success:false, retryable:false }, we STOP
//     immediately — the number is invalid or the sender ID is bad, so
//     every other provider will reject it too. No wasted credits.
//   - If retryable:true (timeout, 5xx, insufficient credits on that
//     provider), we move on to the next provider.
//   - If all providers fail, we return a detailed breakdown so callers
//     (and the admin group notification) know exactly why.

const { PROVIDERS } = require("./smsProviders");

const anyConfigured = () => PROVIDERS.some((p) => p.isConfigured());

/**
 * Send an SMS, trying each configured provider in order.
 * @param {string} to - Recipient phone (any format; adapters normalize).
 * @param {string} message - Body text.
 * @returns {Promise<{ success: boolean, provider?: string, error?: string, attempts: Array<{provider:string, error:string, retryable:boolean}> }>}
 */
async function sendWithFallback(to, message) {
  if (!to) {
    return { success: false, error: "No phone number provided", attempts: [] };
  }

  const configured = PROVIDERS.filter((p) => p.isConfigured());

  if (configured.length === 0) {
    console.warn(
      "⚠️ [smsRouter] No SMS providers configured — skipping SMS. " +
        "Set at least one of: EASYSENDSMS_API_KEY, AT_API_KEY, SMSTO_API_KEY",
    );
    return {
      success: false,
      error: "No SMS providers configured",
      attempts: [],
    };
  }

  const attempts = [];

  for (const provider of configured) {
    const result = await provider.send(to, message);

    if (result.success) {
      console.log(`✅ [smsRouter] SMS sent via ${provider.name} to ${to}`);
      return { success: true, provider: provider.name, attempts };
    }

    attempts.push({
      provider: provider.name,
      error: result.error,
      retryable: result.retryable,
    });

    if (!result.retryable) {
      console.warn(
        `⛔ [smsRouter] ${provider.name} returned a permanent error — not trying further providers`,
      );
      return {
        success: false,
        error: result.error,
        attempts,
      };
    }

    console.warn(
      `↪️ [smsRouter] ${provider.name} failed transiently, trying next provider`,
    );
  }

  console.error(
    `❌ [smsRouter] All ${configured.length} configured providers failed for ${to}`,
  );

  return {
    success: false,
    error: attempts[attempts.length - 1]?.error || "All providers failed",
    attempts,
  };
}

module.exports = { sendWithFallback, anyConfigured };
