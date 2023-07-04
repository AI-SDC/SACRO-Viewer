const { BrowserWindow, Menu } = require("electron");
const { dialog } = require("electron");
const process = require("node:process");
const os = require("os");
const querystring = require("querystring");
const { mainMenu } = require("./main-menu");
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
    defaultPath: os.homedir(),
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

  if (process.env.DEBUG) {
    win.webContents.openDevTools();
  }
};

Menu.setApplicationMenu(mainMenu);

module.exports = createWindow;
