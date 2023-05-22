const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const process = require('process');
const fs = require("fs");

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
    path.join(__dirname, "../build/x86_64-pc-windows-msvc/release/install/sacro/", exe),
    path.join(__dirname, "../build/x86_64-unknown-linux-gnu/debug/install/sacro/", exe),
    path.join(__dirname, "../build/x86_64-unknown-linux-gnu/release/install/sacro/", exe),
  ];
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  console.log("Could not find sacro, checked", possibilities);
  app.quit();
}


function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
  });
  //win.maximize();

  // Spawn the server process
  p = findAppPath()
  console.log(p);
  const serverProcess = spawn(p)

  // Forward server's stdout to Electron's stdout
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });

  // Forward server's stderr to Electron's stderr
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });

  // Handle server process exit
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    app.quit(); // Exit Electron app when server process exits
  });

  // Wait for HTTP server to be ready with a maximum duration
  const checkServerReady = (serverUrl, maxWaitTime) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      console.log(`getting ${serverUrl}`);
      http.get(serverUrl, (res) => {
        clearInterval(checkInterval); // Stop the interval
        console.log('Server is ready!');
        win.loadURL(serverUrl); // Load the URL of the local server
      }).on('error', (err) => {
        console.log(err);
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxWaitTime) {
          clearInterval(checkInterval); // Stop the interval
          console.error('Server took too long to start.');
          app.quit(); // Quit the Electron app
        }
      });
    }, 200); // Retry every 0.2 second
  };

  // Start checking if server is ready with a maximum wait time of 10 seconds (adjust as needed)
  const serverUrl = 'http://127.0.0.1:8000/'; // Specify your server URL here
  const maxWaitTime = 5000; // Specify the maximum wait time in milliseconds
  checkServerReady(serverUrl, maxWaitTime);

  // Event handler for Electron app window close
  win.on('close', () => {
    serverProcess.kill(); // Kill the server process when Electron app closes
  });
}


app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // convention on macos is to leave the app running when you close the window
  if (process.platform !== 'darwin') app.quit();
});

