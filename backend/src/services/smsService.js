// backend/src/services/smsService.js
//
// Generic, provider-agnostic SMS sender. Addis MESOB doesn't have an SMS
// gateway wired up yet, and there are several reasonable choices for
// Ethiopia specifically (Afromessage, Geez SMS, Africa's Talking, etc.),
// each with its own API shape. Rather than hard-coding one vendor, this
// sends a plain POST to whatever URL you configure, with a bearer token
// and a small JSON body — most gateways accept something close to this,
// or can sit behind a tiny adapter/webhook that translates it.
//
// If SMS_API_URL isn't set, this quietly no-ops (logs a warning) instead
// of throwing — SMS is a nice-to-have on top of Telegram DMs, not a hard
// requirement, so a missing/unconfigured gateway should never break the
// presenter-assignment flow that calls this.

const SMS_API_URL = process.env.SMS_API_URL || "";
const SMS_API_KEY = process.env.SMS_API_KEY || "";
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "AddisMESOB";

const isConfigured = () => Boolean(SMS_API_URL && SMS_API_KEY);

/**
 * Send a single SMS.
 * @param {string} to - Phone number, ideally in international format (e.g. +2519XXXXXXXX).
 * @param {string} message - Message body.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const sendSms = async (to, message) => {
  if (!to) {
    return { success: false, error: "No phone number provided" };
  }

  if (!isConfigured()) {
    console.warn(
      `⚠️ [smsService] SMS_API_URL/SMS_API_KEY not configured — skipping SMS to ${to}. ` +
        `Set these env vars to enable SMS notifications.`,
    );
    return { success: false, error: "SMS gateway not configured" };
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        message,
        sender_id: SMS_SENDER_ID,
        from: SMS_SENDER_ID, // some gateways use `from` instead of `sender_id`
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `❌ [smsService] SMS send failed (${response.status}): ${text}`,
      );
      return { success: false, error: `HTTP ${response.status}` };
    }

    console.log(`✅ [smsService] SMS sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [smsService] SMS send error:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSms, isConfigured };
