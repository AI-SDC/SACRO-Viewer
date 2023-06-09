const { BrowserWindow } = require("electron");
const startServer = require("./start-server");
const { waitThenLoad } = require("./utils");

const createWindow = async () => {
  let serverUrl = process.env.SACRO_URL;
  let serverProcess = null;

  if (!serverUrl) {
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
};

module.exports = createWindow;
