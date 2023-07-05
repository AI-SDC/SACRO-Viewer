const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const process = require("node:process");
const nodePath = require("path");
const createWindow = require("./src/create-window");

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

let buildDate = "Not defined";
const buildDateFile = nodePath.join(__dirname, "build_date.txt");
if (fs.existsSync(buildDateFile)) {
  buildDate = fs.readFileSync(buildDateFile);
  buildDate = `${buildDate}`.trim();
}

app.setAboutPanelOptions({
  applicationName: "SACRO",
  applicationVersion: `Version ${app.getVersion()} (Build ${buildDate})`,
  credits: "By OpenSAFELY",
  iconPath: "build/icon.png",
});
