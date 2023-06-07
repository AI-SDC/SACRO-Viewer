/* eslint-disable no-console */
const { app, BrowserWindow, session } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const process = require("node:process");
const portfinder = require("portfinder");
const findAppPath = require("./src/app-path");
const { waitThenLoad } = require("./src/utils");

const RANDOM_SECRET = crypto.randomBytes(32).toString("hex");

async function startServer() {
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
}

async function createWindow() {
  let serverUrl = process.env.SACRO_URL ?? null;
  let serverProcess = null;

  if (serverUrl === null) {
    const { url, server } = await startServer();
    serverUrl = url;
    serverProcess = server;
  }

  console.log(`Using ${serverUrl} as backend`);

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
  });

  win.on("close", () => {
    if (serverProcess !== null) serverProcess.kill();
  });

  if (serverProcess === null) {
    win.loadURL(serverUrl);
  } else {
    waitThenLoad(serverUrl, 4000, win);
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on("window-all-closed", () => {
  // convention on macos is to leave the app running when you close the window
  if (process.platform !== "darwin") app.quit();
});
