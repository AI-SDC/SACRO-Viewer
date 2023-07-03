const { Menu, app } = require("electron");

// const isMac = process.platform === 'darwin'
const menuTemplate = [
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

module.exports.mainMenu = Menu.buildFromTemplate(menuTemplate);
