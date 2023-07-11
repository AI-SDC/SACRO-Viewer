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
  session.defaultSession.on("will-download", (_, item) => {
    // note: the DownloadItem API does not give us access to arbitrary request headers.
    // so we add an additional field onto the Content-Disposition to trigger the native open behaviour
    const splitDisposition = item.getContentDisposition().split(";");
    if (splitDisposition.at(-1).trim() !== "native=true") {
      // normal download (i.e. pop a save dialog)
      return;
    }

    // native open allowed, download and open in native application

    // create download dir if needed
    if (TEMPDIR === null) {
      try {
        TEMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), "sacro-"));
        // TODO clean up tmpdir on exit?
      } catch (err) {
        // Note: this means if we fail to create the TMPDIR, we'll default to downloading the file normally.
        console.error(err);
        return;
      }
    }

    const tmpPath = path.join(TEMPDIR, item.getFilename());
    item.setSavePath(tmpPath);

    item.once("done", (__, state) => {
      if (state === "completed") {
        // open in native application for this file type
        shell.openPath(tmpPath);
      } else {
        console.error(
          `Download of ${item.getFilename()} from ${item.getURL()} failed: ${state}`
        );
      }
    });
  });

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
  });
  win.loadFile("splash.html");

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

    const timeout = serverProcess === null ? 0 : 4000;
    waitThenLoad(url, timeout).then(() => {
      // load the server now we know it's serving
      win.loadURL(url);
    });
  }

  if (process.env.DEBUG) {
    win.webContents.openDevTools();
  }

  Menu.setApplicationMenu(mainMenu(serverUrl));
};

module.exports = createWindow;
