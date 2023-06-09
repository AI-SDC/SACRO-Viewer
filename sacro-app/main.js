const { app, BrowserWindow } = require("electron");
const { dialog } = require("electron");
const process = require("node:process");
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
