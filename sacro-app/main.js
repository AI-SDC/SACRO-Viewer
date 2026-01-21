const { app, BrowserWindow } = require("electron");
const process = require("node:process");
const createWindow = require("./src/create-window");

app
  .whenReady()
  .then(async () => {
    try {
      await createWindow();
    } catch (error) {
      console.error("Failed to create window:", error);
    }

    app.on("activate", async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        try {
          await createWindow();
        } catch (error) {
          console.error("Failed to create window on activate:", error);
        }
      }
    });
  })
  .catch((error) => {
    console.error("App initialization failed:", error);
  });

app.on("window-all-closed", () => {
  // convention on macos is to leave the app running when you close the window
  if (process.platform !== "darwin") app.quit();
});
