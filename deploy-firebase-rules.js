#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Deploying Firebase Security Rules...\n");

// Check if firebase.json exists
if (!fs.existsSync("firebase.json")) {
  console.error(
    '❌ firebase.json not found. Please run "firebase init firestore" first.'
  );
  process.exit(1);
}

// Check if firestore.rules exists
if (!fs.existsSync("firestore.rules")) {
  console.error("❌ firestore.rules not found.");
  process.exit(1);
}

try {
  // Deploy Firestore rules
  console.log("📝 Deploying Firestore security rules...");
  execSync("firebase deploy --only firestore:rules", { stdio: "inherit" });
  console.log("✅ Firestore rules deployed successfully!\n");

  // Deploy Firestore indexes
  console.log("📊 Deploying Firestore indexes...");
  execSync("firebase deploy --only firestore:indexes", { stdio: "inherit" });
  console.log("✅ Firestore indexes deployed successfully!\n");

  // Deploy Storage rules if they exist
  if (fs.existsSync("storage.rules")) {
    console.log("🗄️ Deploying Storage security rules...");
    execSync("firebase deploy --only storage", { stdio: "inherit" });
    console.log("✅ Storage rules deployed successfully!\n");
  }

  console.log("🎉 All Firebase security rules deployed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Test your app functionality");
  console.log("2. Check for any remaining permission errors");
  console.log("3. Monitor the Firebase Console for any issues");
  console.log(
    "4. If you still have issues, check the FIRESTORE_SETUP_GUIDE.md file"
  );
} catch (error) {
  console.error("❌ Error deploying Firebase rules:", error.message);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Make sure you are logged in: firebase login");
  console.log(
    "2. Make sure you have the correct project selected: firebase use fir-saathi-e3c0c"
  );
  console.log("3. Check your Firebase project permissions");
  process.exit(1);
}
