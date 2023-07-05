const { Menu, dialog, app, BrowserWindow } = require("electron");
const log = require("electron-log");
const os = require("node:os");
const querystring = require("querystring");

const mainMenu = (serverUrl) => {
  const menuItems = [
    {
      label: "File",
      submenu: [
        {
          label: "Open File",
          accelerator: "CommandOrControl+O",
          click: async () => {
            dialog
              .showOpenDialog({
                title: "Choose ACRO outputs json file",
                properties: ["openFile"],
                defaultPath: os.homedir(),
                filters: [
                  { name: "ACRO Outputs", extensions: ["json", "acro"] },
                  { name: "All files", extensions: ["*"] },
                ],
              })
              .then((result) => {
                if (!result.canceled) {
                  const qs = querystring.stringify({
                    path: result.filePaths[0],
                  });
                  const url = `${serverUrl}?${qs}`;
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

  return Menu.buildFromTemplate(menuItems);
};

module.exports.mainMenu = mainMenu;
