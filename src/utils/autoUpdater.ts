import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain } from "electron";

// Configure updater
autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = false;

export function initAutoUpdater(mainWindow: BrowserWindow) {
  // Check for updates immediately
  autoUpdater.checkForUpdates();

  // Check for updates every hour
  setInterval(
    () => {
      autoUpdater.checkForUpdates();
    },
    60 * 60 * 1000
  );

  // Handle update events
  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("update-status", "checking");
  });

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update-status", "available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    mainWindow.webContents.send("update-status", "not-available", info);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow.webContents.send("update-status", "progress", progressObj);
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("update-status", "downloaded", info);
  });

  autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("update-status", "error", err);
  });

  // Handle IPC events from renderer
  ipcMain.on("start-update", () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdates();
  });
}

// This function can be called to manually trigger an update check
export function checkForUpdates() {
  return autoUpdater.checkForUpdates();
}
