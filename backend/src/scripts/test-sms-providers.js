// backend/scripts/test-sms-providers.js
//
// Tests each configured SMS provider in isolation, then runs the
// full fallback chain. Uses your real env vars. Run with:
//   node scripts/test-sms-providers.js +251961305788
//
// If no phone number is passed, defaults to your verified test number.

require("dotenv").config();

const TEST_TO = process.argv[2] || "+251961305788";
const TEST_MESSAGE = `[Addis MESOB] Test message at ${new Date().toLocaleTimeString()}`;

const providers = {
  easysendsms: require("../services/smsProviders/easySendSms"),
  africastalking: require("../services/smsProviders/africasTalking"),
  smsto: require("../services/smsProviders/smsTo"),
};

async function testProvider(name, provider) {
  console.log("\n═══════════════════════════════════════════════");
  console.log(`📡 Testing provider: ${name}`);
  console.log("═══════════════════════════════════════════════");

  if (!provider.isConfigured()) {
    console.log(`⏭️  ${name} is NOT configured (missing env vars). Skipping.`);
    return { name, configured: false, success: false, skipped: true };
  }

  console.log(`✅ ${name} is configured. Sending to ${TEST_TO}...`);

  try {
    const startedAt = Date.now();
    const result = await provider.send(TEST_TO, TEST_MESSAGE);
    const elapsed = Date.now() - startedAt;

    if (result.success) {
      console.log(`✅ SUCCESS via ${name} (${elapsed}ms)`);
    } else {
      console.log(`❌ FAILED via ${name} (${elapsed}ms)`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Retryable: ${result.retryable}`);
    }

    return {
      name,
      configured: true,
      success: result.success,
      error: result.error,
      retryable: result.retryable,
      elapsedMs: elapsed,
    };
  } catch (err) {
    console.log(`❌ ${name} threw an exception: ${err.message}`);
    return {
      name,
      configured: true,
      success: false,
      error: err.message,
      retryable: true,
    };
  }
}

async function main() {
  console.log(`\n🧪 SMS Provider Test Suite`);
  console.log(`📱 Target: ${TEST_TO}`);
  console.log(`💬 Message: "${TEST_MESSAGE}"`);

  const results = [];

  // Test each provider in isolation
  for (const [name, provider] of Object.entries(providers)) {
    results.push(await testProvider(name, provider));
  }

  // Summary table
  console.log("\n\n═══════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════\n");

  for (const r of results) {
    const status = r.skipped
      ? "⏭️  SKIPPED (not configured)"
      : r.success
        ? "✅ WORKS"
        : `❌ FAILED — ${r.error}`;
    console.log(`  ${r.name.padEnd(16)} ${status}`);
  }

  // Now test the full fallback chain
  console.log("\n\n═══════════════════════════════════════════════");
  console.log("🔀 Testing full fallback chain (smsRouter)");
  console.log("═══════════════════════════════════════════════\n");

  const smsRouter = require("../src/services/smsRouter");
  const fallbackResult = await smsRouter.sendWithFallback(
    TEST_TO,
    TEST_MESSAGE,
  );

  console.log("Result:");
  console.log(JSON.stringify(fallbackResult, null, 2));

  console.log("\n═══════════════════════════════════════════════");
  console.log("🏁 DONE");
  console.log("═══════════════════════════════════════════════");
  console.log(
    "Check your phone — the SMS should arrive from one of the working providers.\n",
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n💥 Test script crashed:", err);
  process.exit(1);
});
