import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSnap } from "@electron-forge/maker-snap";
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
    new MakerSquirrel({
      setupIcon: "assets/icons/icon.ico",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({
      options: {
        icon: "assets/icons/linux/256x256.png",
      },
    }),
    new MakerDeb({
      options: {
        icon: "assets/icons/linux/256x256.png",
      },
    }),
    new MakerSnap({
      options: {
        summary: "A modern desktop video player for offline course management",
        description: "Nilaa Player is a desktop video player designed for managing offline courses with progress tracking, section navigation, and a modern interface.",
        grade: "stable",
        confinement: "strict",
        icon: "assets/icons/linux/512x512.png",
        categories: ["AudioVideo", "Player"],
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "rsathishtechit", // Replace with your GitHub username
        name: "video-player", // Replace with your repository name
      },
      prerelease: true, // Set to false for stable releases
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
