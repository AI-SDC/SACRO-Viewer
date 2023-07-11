const { session, BrowserWindow, Menu } = require("electron");
const { dialog, shell } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const process = require("node:process");
const querystring = require("node:querystring");
const { mainMenu } = require("./main-menu");
const startServer = require("./start-server");
const { waitThenLoad } = require("./utils");

let TEMPDIR = null;

const createWindow = async () => {
  let serverUrl = process.env.SACRO_URL;
  let serverProcess = null;

  if (!serverUrl) {
    const { url, server } = await startServer();
    serverUrl = url;
    serverProcess = server;
  }

  console.log(`Using ${serverUrl} as backend`);

  // handle downloads
  session.defaultSession.on("will-download", (event, item) => {
    const [dispositionType] = item.getContentDisposition().split(";", 1);
    // our output/feedback downloads, leave them alone.
    if (dispositionType === "attachment") {
      return;
    }

    // inline download, we want to download and open in native application

    // create download dir if needed
    if (TEMPDIR === null) {
      try {
        TEMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), "sacro-"));
      } catch (err) {
        // TODO clean up on exit
        // Note: this means if we fail to create the TMPDIR, we'll default to downloading the file normally.
        console.error(err);
        return;
      }
    }

    const tmpPath = path.join(TEMPDIR, item.getFilename());
    item.setSavePath(tmpPath);

    item.once("done", (_, state) => {
      if (state === "completed") {
        // open in native application for this file type
        shell.openPath(tmpPath);
      } else {
        console.error(`Download of ${item.getURL()} failed: ${state}`);
      }
    });
  });

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

  if (!result.canceled) {
    const qs = querystring.stringify({ path: result.filePaths[0] });
    const url = `${serverUrl}?${qs}`;

    if (serverProcess === null) {
      win.loadURL(url);
    } else {
      waitThenLoad(url, 4000, win);
    }
  }

  if (process.env.DEBUG) {
    win.webContents.openDevTools();
  }

  Menu.setApplicationMenu(mainMenu(serverUrl));
};

module.exports = createWindow;
