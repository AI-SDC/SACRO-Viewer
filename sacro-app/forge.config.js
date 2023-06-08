const dotenv = require("dotenv");
const fs = require("node:fs");
const path = require("node:path");

dotenv.config();

module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  hooks: {
    packageAfterCopy: async (
      config,
      buildPath,
      electronVersion,
      platform,
      arch
    ) => {
      const src = path.join(__dirname, process.env.BUILD_DIR);
      const dst = buildPath;
      console.log({ src, dst, config, platform, arch, electronVersion });
      fs.cpSync(src, dst, { recursive: true });
    },
  },
};
