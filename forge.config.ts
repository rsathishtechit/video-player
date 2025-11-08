import type { ForgeConfig } from "@electron-forge/shared-types";
// Use object-style maker entries (by package name) rather than class instances.
// This keeps the config simple and lets Electron Forge resolve makers by name.
import { PublisherGithub } from "@electron-forge/publisher-github";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "assets/icons/icon", // Electron will automatically choose the right format (.icns for macOS, .ico for Windows, .png for Linux)
    name: "Nilaa Player",
    executableName: "nilaa-player",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32", "linux"],
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        format: "ULFO",
        icon: "assets/icons/icon.icns",
        background: "assets/icons/dmg-background.png",
        contents: [
          { x: 448, y: 344, type: "link", path: "/Applications" },
          { x: 192, y: 344, type: "file", path: "Nilaa Player.app" },
        ],
      },
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
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "rsathishtechit",
        name: "video-player",
      },
      prerelease: true,
      draft: false,
      authToken: process.env.GITHUB_TOKEN,
      tagPrefix: "v",
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
