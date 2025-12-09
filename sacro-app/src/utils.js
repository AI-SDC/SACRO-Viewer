const crypto = require("node:crypto");
const http = require("node:http");

/**
 * Wait for HTTP server to be ready
 *
 * Use setInterval and clearInterval to check if the given url is resolving
 * every 250ms until the given timeout is reached.  This is wrapped in a
 * promise so we can handle success and failure modes at the call site.
 *
 * We can't use node stdlib's http.get with a timeout because it doesn't apply
 * that to the connection refused error case.
 *
 * @param {string} url
 * @param {number} timeout
 */
function waitThenLoad(url, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      http
        .get(url, () => {
          clearInterval(checkInterval);
          resolve("success");
        })
        .on("error", () => {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= timeout) {
            clearInterval(checkInterval);
            reject(new Error("Server took too long to start."));
          }
        });
    }, 250);
  });
}

const RANDOM_SECRET = crypto.randomBytes(32).toString("hex");

module.exports = {
  RANDOM_SECRET,
  waitThenLoad,
};
