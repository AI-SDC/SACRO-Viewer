const { app, session } = require("electron");
const { spawn } = require("node:child_process");
const portfinder = require("portfinder");
const findAppPath = require("./find-app-path");
const { RANDOM_SECRET } = require("./utils");

const startServer = async () => {
  let freePort = null;
  try {
    // Workaround 1 for the lack of unix sockets on windows
    // We use a fixed port in order to minimise firewall pop ups
    // However, portfinder will ensure we do get a port, even if the chosen one
    // is not free
    freePort = await portfinder.getPortPromise({ port: 11011 });
  } catch (err) {
    console.error("Failed to obtain a port", err);
    app.quit();
  }

  const serverUrl = `http://127.0.0.1:${freePort}/`;

  // Spawn the server process
  const p = findAppPath();
  const serverProcess = spawn(p, {
    env: {
      SACRO_APP_TOKEN: RANDOM_SECRET,
      PORT: freePort,
    },
  });

  // set a cookie with the random token in
  const cookie = {
    url: serverUrl,
    name: "sacro_app_token",
    value: RANDOM_SECRET,
  };
  await session.defaultSession.cookies.set(cookie);

  // Forward server's stdout to Electron's stdout
  serverProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  // Forward server's stderr to Electron's stderr
  serverProcess.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  // Handle server process exit
  serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    app.quit(); // Exit Electron app when server process exits
  });

  return {
    url: serverUrl,
    server: serverProcess,
  };
};

module.exports = startServer;
