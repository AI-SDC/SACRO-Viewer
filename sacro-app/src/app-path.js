const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");

const findAppPath = () => {
  const appExt = `sacro${process.platform === "win32" ? ".exe" : ""}`;

  const platformDirs = [
    "aarch64-apple-darwin/release",
    "x86_64-pc-windows-msvc/debug",
    "x86_64-pc-windows-msvc/release",
    "x86_64-unknown-linux-gnu/debug",
    "x86_64-unknown-linux-gnu/release",
  ];

  const fileLocations = [
    path.join(process.resourcesPath, "sacro", appExt),
    ...platformDirs.map((dir) =>
      path.join(__dirname, `../../build/${dir}/install/sacro`, appExt)
    ),
  ];

  const getPath = fileLocations.filter((location) =>
    fs.existsSync(location)
  )[0];

  if (!getPath) {
    console.error("Could not find sacro build, checked:", fileLocations);
    return app.quit();
  }

  return getPath;
};

module.exports = findAppPath;
