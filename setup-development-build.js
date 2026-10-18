const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Setting up Development Build for Push Notifications...\n");

async function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} completed successfully!\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function checkCommand(command, description) {
  try {
    execSync(command, { stdio: "pipe" });
    console.log(`✅ ${description} is available`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} is not available`);
    return false;
  }
}

async function setupDevelopmentBuild() {
  console.log("🔍 Checking prerequisites...\n");

  // Check if EAS CLI is installed
  const easInstalled = await checkCommand("eas --version", "EAS CLI");
  if (!easInstalled) {
    console.log("📦 Installing EAS CLI...");
    await runCommand("npm install -g @expo/eas-cli", "Install EAS CLI");
  }

  // Check if logged in to Expo
  const loggedIn = await checkCommand("eas whoami", "Expo login status");
  if (!loggedIn) {
    console.log("🔐 Please login to Expo...");
    await runCommand("eas login", "Login to Expo");
  }

  // Configure EAS Build
  console.log("⚙️ Configuring EAS Build...");
  await runCommand("eas build:configure", "Configure EAS Build");

  console.log("\n🎉 Setup completed!");
  console.log("\n📱 Next steps:");
  console.log("1. Build development version: npm run build:android:dev");
  console.log("2. Download and install the APK on your device");
  console.log("3. Start development server: npm run start:dev");
  console.log("4. Test push notifications in the app");
  console.log(
    "\n📚 For detailed instructions, see: DEVELOPMENT_BUILD_SETUP.md"
  );
}

// Run the setup
setupDevelopmentBuild().catch(console.error);
