const { Hooks } = require("@expo/eas-build-job");

Hooks.onBefore = async ({}) => {
  console.log("Setting up Node.js environment...");
  await exec(
    "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
  );
  await exec(
    'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm install 18.17.0'
  );
  console.log("Node.js environment setup complete");
};

async function exec(command) {
  const { spawn } = require("child_process");
  return new Promise((resolve, reject) => {
    const process = spawn("bash", ["-c", command], { stdio: "inherit" });
    process.on("error", reject);
    process.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

module.exports = Hooks;
