// backend/src/services/smsProviders/index.js
//
// Registry of SMS providers, ordered by priority. The router iterates
// this list top-to-bottom. Any provider whose isConfigured() returns
// false is skipped automatically — so you can enable a provider just
// by setting its env vars in Render, no code change needed.

const easySendSms = require("./easySendSms");
const africasTalking = require("./africasTalking");
const smsTo = require("./smsTo");

// Priority order: put the provider you most want to be primary first.
// Reorder these lines to change the fallback chain.
const PROVIDERS = [
  easySendSms, // 1st choice
  africasTalking, // 2nd choice
  smsTo, // 3rd choice
];

module.exports = { PROVIDERS };
