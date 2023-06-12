const { BrowserWindow } = require("electron");
const { dialog } = require("electron");
const querystring = require("querystring");
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

  const result = await dialog.showOpenDialog({
    title: "Choose ACRO outputs json file",
    properties: ["openFile"],
    filters: [
      { name: "ACRO Outputs", extensions: ["json", "acro"] },
      { name: "All files", extensions: ["*"] },
    ],
  });

  const qs = querystring.stringify({ path: result.filePaths[0] });
  const url = `${serverUrl}?${qs}`;

  if (serverProcess === null) {
    win.loadURL(url);
  } else {
    waitThenLoad(url, 4000, win);
  }
};

module.exports = createWindow;
