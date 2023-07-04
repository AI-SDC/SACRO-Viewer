const { Menu, app } = require("electron");

const menuItems = [
  {
    label: "File",
    submenu: [
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

module.exports.mainMenu = Menu.buildFromTemplate(menuItems);
