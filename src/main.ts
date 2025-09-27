import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "fs/promises";
import { promisify } from "util";
import { exec } from "child_process";
import { createServer } from "http";
import { createReadStream, statSync, existsSync } from "fs";
import started from "electron-squirrel-startup";
import JsonDatabase from "./database/jsonDatabase";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize database and HTTP server
let db: JsonDatabase;
let videoServer: any;
const VIDEO_SERVER_PORT = 3001;

// Video file extensions
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".avi",
  ".mkv",
  ".webm",
  ".mov",
  ".wmv",
  ".flv",
  ".m4v",
];

// Utility function to get video duration using ffprobe
const getVideoDuration = async (filePath: string): Promise<number> => {
  try {
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.error("Error getting video duration:", error);
    return 0;
  }
};

// Recursively crawl directory for video files
const crawlDirectory = async (dirPath: string): Promise<any[]> => {
  const videos: any[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively crawl subdirectories
        const subVideos = await crawlDirectory(fullPath);
        videos.push(...subVideos);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.includes(ext)) {
          try {
            const stats = await fs.stat(fullPath);
            const duration = await getVideoDuration(fullPath);

            videos.push({
              fileName: entry.name,
              filePath: fullPath,
              duration,
              fileSize: stats.size,
              createdAt: stats.birthtime.toISOString(),
              updatedAt: stats.mtime.toISOString(),
            });
          } catch (error) {
            console.error(`Error processing video file ${fullPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return videos;
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local files
      allowRunningInsecureContent: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Create HTTP server for serving video files
const createVideoServer = () => {
  videoServer = createServer((req, res) => {
    try {
      const url = new URL(req.url!, `http://localhost:${VIDEO_SERVER_PORT}`);
      const filePath = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash

      console.log("Video server request for:", filePath);

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }

      const stat = statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Determine content type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "video/mp4";
      switch (ext) {
        case ".mp4":
        case ".m4v":
          contentType = "video/mp4";
          break;
        case ".webm":
          contentType = "video/webm";
          break;
        case ".avi":
          contentType = "video/x-msvideo";
          break;
        case ".mkv":
          contentType = "video/x-matroska";
          break;
        case ".mov":
          contentType = "video/quicktime";
          break;
        case ".wmv":
          contentType = "video/x-ms-wmv";
          break;
      }

      if (range) {
        // Handle range requests for video seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = createReadStream(filePath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Serve entire file
        const head = {
          "Content-Length": fileSize,
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
        };
        res.writeHead(200, head);
        createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error("Video server error:", error);
      res.writeHead(500);
      res.end("Internal server error");
    }
  });

  videoServer.listen(VIDEO_SERVER_PORT, "localhost", () => {
    console.log(
      `Video server running on http://localhost:${VIDEO_SERVER_PORT}`
    );
  });
};

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    db = new JsonDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue without database for now
  }

  // Start video server
  createVideoServer();

  // Set up IPC handlers
  setupIpcHandlers();

  createWindow();
});

// Set up IPC handlers
const setupIpcHandlers = () => {
  // Folder selection
  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Course Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Crawl folder for video files
  ipcMain.handle("crawl-folder", async (event, folderPath: string) => {
    try {
      return await crawlDirectory(folderPath);
    } catch (error) {
      console.error("Error crawling folder:", error);
      throw error;
    }
  });

  // Course operations
  ipcMain.handle(
    "create-course",
    async (event, name: string, folderPath: string) => {
      try {
        if (!db) {
          throw new Error("Database not initialized");
        }

        // Create the course first
        const course = await db.createCourse(name, folderPath);

        // Crawl the folder and add videos
        const videos = await crawlDirectory(folderPath);

        // Add each video to the course
        for (const video of videos) {
          await db.createVideo({
            courseId: course.id,
            fileName: video.fileName,
            filePath: video.filePath,
            duration: video.duration,
            fileSize: video.fileSize,
          });
        }

        // Return the course with videos
        return db.getCourseWithVideos(course.id);
      } catch (error) {
        console.error("Error creating course:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("get-all-courses", async () => {
    try {
      if (!db) {
        return [];
      }
      return db.getAllCoursesWithVideos();
    } catch (error) {
      console.error("Error getting all courses:", error);
      return [];
    }
  });

  ipcMain.handle("get-course-with-videos", async (event, courseId: number) => {
    try {
      if (!db) {
        return null;
      }
      return db.getCourseWithVideos(courseId);
    } catch (error) {
      console.error("Error getting course with videos:", error);
      return null;
    }
  });

  ipcMain.handle("delete-course", async (event, courseId: number) => {
    try {
      if (!db) {
        return;
      }
      await db.deleteCourse(courseId);
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  });

  // Video operations
  ipcMain.handle("get-videos-by-course-id", async (event, courseId: number) => {
    try {
      if (!db) {
        return [];
      }
      return db.getVideosByCourseId(courseId);
    } catch (error) {
      console.error("Error getting videos by course ID:", error);
      return [];
    }
  });

  // Progress operations
  ipcMain.handle(
    "update-video-progress",
    async (
      event,
      videoId: number,
      currentTime: number,
      duration: number,
      progressPercentage: number
    ) => {
      try {
        if (!db) {
          return null;
        }
        return await db.updateVideoProgress(
          videoId,
          currentTime,
          duration,
          progressPercentage
        );
      } catch (error) {
        console.error("Error updating video progress:", error);
        return null;
      }
    }
  );

  ipcMain.handle("get-video-progress", async (event, videoId: number) => {
    try {
      if (!db) {
        return null;
      }
      return db.getVideoProgress(videoId);
    } catch (error) {
      console.error("Error getting video progress:", error);
      return null;
    }
  });

  ipcMain.handle("reset-video-progress", async (event, videoId: number) => {
    try {
      if (!db) {
        return;
      }
      await db.resetVideoProgress(videoId);
    } catch (error) {
      console.error("Error resetting video progress:", error);
    }
  });

  ipcMain.handle("reset-course-progress", async (event, courseId: number) => {
    try {
      if (!db) {
        return;
      }
      await db.resetCourseProgress(courseId);
    } catch (error) {
      console.error("Error resetting course progress:", error);
    }
  });
};

// Clean up database and server when app is closing
app.on("before-quit", () => {
  if (db) {
    db.close();
  }
  if (videoServer) {
    videoServer.close();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
