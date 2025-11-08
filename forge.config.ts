import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerDMG } from "@electron-forge/maker-dmg";
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
      iconUrl:
        "https://raw.githubusercontent.com/rsathishtechit/video-player/master/assets/icons/windows/256x256.png",
      loadingGif: "assets/icons/windows/installer.gif",
    }),
    new MakerDMG({
      format: "ULFO",
      icon: "assets/icons/icon.icns",
      background: "assets/icons/dmg-background.png",
      contents: [
        { x: 448, y: 344, type: "link", path: "/Applications" },
        { x: 192, y: 344, type: "file", path: "Nilaa Player.app" },
      ],
    }),
    new MakerRpm({
      options: {
        icon: "assets/icons/linux/256x256.png",
        categories: ["AudioVideo", "Video"],
        description:
          "A modern desktop video player for offline course management and progress tracking",
        homepage: "https://github.com/rsathishtechit/video-player",
      },
    }),
    new MakerDeb({
      options: {
        icon: "assets/icons/linux/256x256.png",
        categories: ["AudioVideo", "Video"],
        description:
          "A modern desktop video player for offline course management and progress tracking",
        homepage: "https://github.com/rsathishtechit/video-player",
      },
    }),
    new MakerSnap({
      options: {
        summary: "A desktop video player for managing offline courses",
        description:
          "Nilaa Player is a desktop video player designed for managing offline courses with progress tracking, section navigation, and a modern interface.",
        grade: "stable",
        confinement: "strict",
        icon: "assets/icons/linux/512x512.png",
        categories: ["AudioVideo", "Player"],
        plugs: ["audio-playback", "desktop", "home", "removable-media"],
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "rsathishtechit",
        name: "video-player",
      },
      prerelease: false,
      draft: true,
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
