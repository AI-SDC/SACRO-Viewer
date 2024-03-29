const { Menu, dialog, app, shell, BrowserWindow } = require("electron");
const log = require("electron-log");
const fs = require("fs");
const os = require("node:os");
const nodePath = require("path");
const querystring = require("querystring");
const findAppPath = require("./find-app-path");

const mainMenu = (serverUrl) => {
  const menuItems = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Directory",
          accelerator: "CommandOrControl+O",
          click: async () => {
            dialog
              .showOpenDialog({
                title: "Choose directory containing outputs you wish to review",
                properties: ["openDirectory"],
                defaultPath: os.homedir(),
              })
              .then((result) => {
                if (!result.canceled) {
                  const qs = querystring.stringify({
                    dirpath: result.filePaths[0],
                  });
                  const url = `${serverUrl}/load?${qs}`;
                  BrowserWindow.getFocusedWindow().loadURL(url);
                }
              })
              .catch((err) => {
                log.error(err);
              });
          },
        },
        {
          type: "separator",
        },
        {
          role: "close",
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          role: "reload",
        },
        {
          type: "separator",
        },
        {
          role: "resetzoom",
        },
        {
          role: "zoomin",
        },
        {
          role: "zoomout",
        },
        {
          type: "separator",
        },
        {
          role: "togglefullscreen",
        },
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "View Audit Log",
          click: async () => {
            const auditFile = `${app.getPath("appData")}/SACRO/audit.log`;
            const tempFile = `${app.getPath("temp")}/sacro-audit.log`;
            fs.copyFileSync(auditFile, tempFile);
            shell.openPath(tempFile);
          },
        },
        {
          role: "about",
        },
      ],
    },
  ];

  if (process.platform === "darwin") {
    menuItems.unshift({
      label: "SACRO",
      submenu: [
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    });
  }

  let buildDate = "Not defined";
  const buildDateFile = nodePath.join(
    nodePath.dirname(findAppPath()),
    "build_date.txt"
  );
  log.info(buildDateFile);
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

  return Menu.buildFromTemplate(menuItems);
};

module.exports.mainMenu = mainMenu;
