const { app, BrowserWindow, session } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const process = require('process');
const fs = require("fs");
const crypto = require("crypto");
const portfinder = require("portfinder");

const RANDOM_SECRET = crypto.randomBytes(32).toString("hex");

function findAppPath() {
  var exe = "sacro"
  if (process.platform === "win32") {
    exe = "sacro.exe";
  }

  const possibilities = [
    // in packaged app
    path.join(process.resourcesPath, "sacro", exe),
    // in development
    path.join(__dirname, "../build/x86_64-pc-windows-msvc/debug/install/sacro/", exe),
    path.join(__dirname, "../build/x86_64-unknown-linux-gnu/debug/install/sacro/", exe),
    path.join(__dirname, "../build/x86_64-pc-windows-msvc/release/install/sacro/", exe),
    path.join(__dirname, "../build/x86_64-unknown-linux-gnu/release/install/sacro/", exe),
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


async function createWindow() {
 
  let freePort = null;
  try {
    freePort = await portfinder.getPortPromise({ port: 11011 });
  } catch (err) {
    console.error("Failed to obtain a port", err);
    app.quit();
  }
  const serverUrl = `http://127.0.0.1:${freePort}/`;

  // Spawn the server process
  p = findAppPath()
  const serverProcess = spawn(p, {env: {
    SACRO_APP_TOKEN: RANDOM_SECRET,
    PORT: freePort,
  }})

  // set a cookie with the random token in
  const cookie = { url: serverUrl, name: 'sacro_app_token', value: RANDOM_SECRET }
  await session.defaultSession.cookies.set(cookie);

  // Forward server's stdout to Electron's stdout
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  // Forward server's stderr to Electron's stderr
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  // Handle server process exit
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    app.quit(); // Exit Electron app when server process exits
  });

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
  });
  //win.maximize();
  
  // Wait for HTTP server to be ready with a maximum duration
  const checkServerReady = (serverUrl, maxWaitTime) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      http.get(serverUrl, (res) => {
        clearInterval(checkInterval); // Stop the interval
        win.loadURL(serverUrl); // Load the URL of the local server
      }).on('error', (err) => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxWaitTime) {
          clearInterval(checkInterval); // Stop the interval
          console.error('Server took too long to start.');
          app.quit(); // Quit the Electron app
        }
      });
    }, 200); // Retry every 0.2 second
  };

  const maxWaitTime = 5000;
  checkServerReady(serverUrl, maxWaitTime);

  // Event handler for Electron app window close
  win.on('close', () => {
    serverProcess.kill(); // Kill the server process when Electron app closes
  });
}


app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', function () {
  // convention on macos is to leave the app running when you close the window
  if (process.platform !== 'darwin') app.quit();
});

