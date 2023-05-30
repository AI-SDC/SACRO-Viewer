const { spawn } = require("child_process");
const crypto = require("crypto");
const { app, BrowserWindow, session } = require("electron");
const fs = require("fs");
const http = require("http");
const path = require("path");
const portfinder = require("portfinder");
const process = require("process");

const RANDOM_SECRET = crypto.randomBytes(32).toString("hex");

function findAppPath() {
  let exe = "sacro";
  if (process.platform === "win32") {
    exe = "sacro.exe";
  }

  const possibilities = [
    // in packaged app
    path.join(process.resourcesPath, "sacro", exe),
    // in development
    path.join(
      __dirname,
      "../build/x86_64-pc-windows-msvc/debug/install/sacro/",
      exe
    ),
    path.join(
      __dirname,
      "../build/x86_64-unknown-linux-gnu/debug/install/sacro/",
      exe
    ),
    path.join(
      __dirname,
      "../build/x86_64-pc-windows-msvc/release/install/sacro/",
      exe
    ),
    path.join(
      __dirname,
      "../build/x86_64-unknown-linux-gnu/release/install/sacro/",
      exe
    ),
  ];
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      console.log(`using path ${path}`);
      return path;
    }
  }
  console.error("Could not find sacro, checked", possibilities);
  app.quit();
  return null;
}

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
  p = findAppPath();
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

// Wait for HTTP server to be ready with a maximum duration
const waitThenLoad = (serverUrl, maxWaitTime, win) => {
  const startTime = Date.now();

  const checkInterval = setInterval(() => {
    http
      .get(serverUrl, (res) => {
        clearInterval(checkInterval);
        win.loadURL(serverUrl);
      })
      .on("error", (err) => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxWaitTime) {
          clearInterval(checkInterval);
          console.error("Server took too long to start.");
          app.quit(); // TODO: show error page
        }
      });
  }, 250);
};

async function createWindow() {
  var serverUrl = (serverUrl = process.env.SACRO_URL ?? null);
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
