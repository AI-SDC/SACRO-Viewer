module.exports = {
  packagerConfig: {
    ignore: [
      /node_modules.*/,
      /forge\.config\.js/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        extraResources: [
          {
            "from": "build/x86_64-pc-windows-msvc/release/install/sacro/",
            "to": "sacro/",
            "filter": ["**/*"],
          }
        ],
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        extraResources: [
          {
            "from": "build/x86_64-unknown-linux-gcc/release/install/sacro/",
            "to": "sacro/",
            "filter": ["**/*"],
          },
        ],
      },
    },
  ],
};
