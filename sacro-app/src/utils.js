const { app } = require("electron");
const http = require("node:http");

// Wait for HTTP server to be ready with a maximum duration
const waitThenLoad = (serverUrl, maxWaitTime, win) => {
  const startTime = Date.now();

  const checkInterval = setInterval(() => {
    http
      .get(serverUrl, () => {
        clearInterval(checkInterval);
        win.loadURL(serverUrl);
      })
      .on("error", () => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxWaitTime) {
          clearInterval(checkInterval);
          console.error("Server took too long to start.");
          app.quit(); // TODO: show error page
        }
      });
  }, 250);
};

module.exports = {
  waitThenLoad,
};
