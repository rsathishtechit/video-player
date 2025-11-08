import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error"
  >("checking");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdateStatus = (
      _event: Electron.IpcRendererEvent,
      status: string,
      info?: UpdateInfo | ProgressInfo | { message?: string }
    ) => {
      switch (status) {
        case "checking":
          setUpdateStatus("checking");
          break;
        case "available":
          setUpdateStatus("available");
          setUpdateInfo(info as UpdateInfo);
          break;
        case "not-available":
          setUpdateStatus("not-available");
          break;
        case "progress":
          setUpdateStatus("downloading");
          setDownloadProgress(info as ProgressInfo);
          break;
        case "downloaded":
          setUpdateStatus("downloaded");
          setUpdateInfo(info);
          break;
        case "error":
          setUpdateStatus("error");
          setError(info?.message || "Unknown error");
          break;
      }
    };

    ipcRenderer.on("update-status", handleUpdateStatus);
    return () => {
      ipcRenderer.removeListener("update-status", handleUpdateStatus);
    };
  }, []);

  const startUpdate = () => {
    ipcRenderer.send("start-update");
  };

  const installUpdate = () => {
    ipcRenderer.send("install-update");
  };

  const checkForUpdates = () => {
    ipcRenderer.send("check-for-updates");
  };

  if (updateStatus === "not-available") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm">
      {updateStatus === "checking" && (
        <p className="text-gray-600 dark:text-gray-300">
          Checking for updates...
        </p>
      )}

      {updateStatus === "available" && updateInfo && (
        <div>
          <h3 className="font-bold text-lg">Update Available</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Version {updateInfo.version} is available.
          </p>
          {updateInfo.releaseNotes && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <p>Release Notes:</p>
              <p>{updateInfo.releaseNotes}</p>
            </div>
          )}
          <button
            onClick={startUpdate}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Download Update
          </button>
        </div>
      )}

      {updateStatus === "downloading" && downloadProgress && (
        <div>
          <h3 className="font-bold text-lg">Downloading Update</h3>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${downloadProgress.percent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {Math.round(downloadProgress.percent)}% complete
            </p>
          </div>
        </div>
      )}

      {updateStatus === "downloaded" && (
        <div>
          <h3 className="font-bold text-lg">Update Ready</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Update has been downloaded. Restart the application to apply the
            update.
          </p>
          <button
            onClick={installUpdate}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Restart and Install
          </button>
        </div>
      )}

      {updateStatus === "error" && (
        <div>
          <h3 className="font-bold text-lg text-red-500">Update Error</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{error}</p>
          <button
            onClick={checkForUpdates}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
