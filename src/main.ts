import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  powerSaveBlocker,
  powerMonitor,
} from "electron";
import path from "node:path";
import fs from "fs/promises";
import { promisify } from "util";
import { exec } from "child_process";
import { createServer, Server } from "http";
import { createReadStream, statSync, existsSync } from "fs";
import started from "electron-squirrel-startup";
import JsonDatabase from "./database/jsonDatabase";
import { Course } from "./database/schema";

// Interface for video file information
interface VideoFileInfo {
  fileName: string;
  filePath: string;
  duration: number;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
  frameRate?: number;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize database and HTTP server
let db: JsonDatabase;
let videoServer: Server;
const VIDEO_SERVER_PORT = 3000;

// Power management
let powerSaveBlockerId: number | null = null;
let isVideoPlaying = false;
let backgroundThrottleTimer: NodeJS.Timeout | null = null;

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

// Check if ffprobe is available
let ffprobeAvailable: boolean | null = null;

const checkFFProbeAvailability = async (): Promise<boolean> => {
  if (ffprobeAvailable !== null) {
    return ffprobeAvailable;
  }

  try {
    const execAsync = promisify(exec);
    await execAsync("ffprobe -version");
    ffprobeAvailable = true;
    console.log("FFProbe is available");
    return true;
  } catch (error) {
    ffprobeAvailable = false;
    console.warn("FFProbe is not available, will use fallback duration method");
    return false;
  }
};

// Interface for video metadata from FFProbe
interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
  frameRate?: number;
}

// Safe fraction parser to replace eval()
const parseFraction = (fractionString: string): number => {
  try {
    const parts = fractionString.split("/");
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (denominator !== 0) {
        return numerator / denominator;
      }
    }
    return parseFloat(fractionString) || 0;
  } catch (error) {
    return 0;
  }
};

// Utility function to get comprehensive video metadata using ffprobe
const getVideoMetadata = async (filePath: string): Promise<VideoMetadata> => {
  // First check if ffprobe is available
  const hasFFProbe = await checkFFProbeAvailability();

  if (hasFFProbe) {
    try {
      const execAsync = promisify(exec);

      // Get comprehensive metadata using JSON output
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );

      const metadata = JSON.parse(stdout);
      const videoStream = metadata.streams?.find(
        (stream: {
          codec_type: string;
          width?: number;
          height?: number;
          codec_name?: string;
          r_frame_rate?: string;
        }) => stream.codec_type === "video"
      );
      const format = metadata.format;

      const result: VideoMetadata = {
        duration: parseFloat(format?.duration) || 0,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
        bitrate: parseInt(format?.bit_rate) || undefined,
        frameRate: videoStream?.r_frame_rate
          ? parseFraction(videoStream.r_frame_rate)
          : undefined,
      };

      console.log(`Metadata for ${path.basename(filePath)}:`, {
        duration: `${result.duration}s`,
        resolution:
          result.width && result.height
            ? `${result.width}x${result.height}`
            : "Unknown",
        codec: result.codec || "Unknown",
        bitrate: result.bitrate
          ? `${Math.round(result.bitrate / 1000)}kbps`
          : "Unknown",
        frameRate: result.frameRate
          ? `${result.frameRate.toFixed(2)}fps`
          : "Unknown",
      });

      return result;
    } catch (error) {
      console.error(
        `Error getting video metadata with ffprobe for ${filePath}:`,
        error
      );
    }
  }

  // Fallback: return minimal metadata
  console.log(`Using fallback metadata for ${path.basename(filePath)}`);
  return { duration: 0 }; // Will be updated when video is loaded in the player
};

// Legacy function for backward compatibility

// Recursively crawl directory for video files
const crawlDirectory = async (dirPath: string): Promise<VideoFileInfo[]> => {
  const videos: VideoFileInfo[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // Sort entries to ensure consistent ordering
    entries.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Split filename into parts (text and numbers) for natural sorting
      const aParts = aName.split(/(\d+)/).filter((part) => part.length > 0);
      const bParts = bName.split(/(\d+)/).filter((part) => part.length > 0);

      const maxLength = Math.max(aParts.length, bParts.length);

      for (let i = 0; i < maxLength; i++) {
        const aPart = aParts[i] || "";
        const bPart = bParts[i] || "";

        const aIsNum = /^\d+$/.test(aPart);
        const bIsNum = /^\d+$/.test(bPart);

        if (aIsNum && bIsNum) {
          const aNum = parseInt(aPart);
          const bNum = parseInt(bPart);
          if (aNum !== bNum) {
            return aNum - bNum;
          }
        } else {
          const comparison = aPart.localeCompare(bPart);
          if (comparison !== 0) {
            return comparison;
          }
        }
      }

      return 0;
    });

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
            const metadata = await getVideoMetadata(fullPath);

            videos.push({
              fileName: entry.name,
              filePath: fullPath,
              duration: metadata.duration,
              fileSize: stats.size,
              createdAt: stats.birthtime.toISOString(),
              updatedAt: stats.mtime.toISOString(),
              width: metadata.width,
              height: metadata.height,
              codec: metadata.codec,
              bitrate: metadata.bitrate,
              frameRate: metadata.frameRate,
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
      // Battery optimization: reduce background throttling
      backgroundThrottling: true,
    },
    // Battery optimization: start with efficient settings
    show: false, // Don't show until ready
  });

  // Battery optimization: show window only when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Power management: handle window focus/blur for battery optimization
  mainWindow.on("focus", () => {
    if (backgroundThrottleTimer) {
      clearTimeout(backgroundThrottleTimer);
      backgroundThrottleTimer = null;
    }
  });

  mainWindow.on("blur", () => {
    // Throttle background operations when window loses focus
    backgroundThrottleTimer = setTimeout(() => {
      if (!isVideoPlaying) {
        // Reduce update frequency when not actively watching
        console.log("Window unfocused - reducing background activity");
      }
    }, 5000); // Wait 5 seconds before throttling
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools only in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
};

// Create HTTP server for serving video files
const createVideoServer = () => {
  videoServer = createServer((req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request: No URL provided");
        return;
      }
      const url = new URL(req.url, `http://localhost:${VIDEO_SERVER_PORT}`);
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

        // Validate input parameters
        if (!name || !name.trim()) {
          throw new Error("Course name is required");
        }

        if (!folderPath || !folderPath.trim()) {
          throw new Error("Folder path is required");
        }

        // Check if course with same folder path already exists
        const existingCourse = db.getCourseByPath(folderPath);
        if (existingCourse) {
          // Update existing course with new videos
          const videos = await crawlDirectory(folderPath);
          const existingVideos = db.getVideosByCourseId(existingCourse.id);
          const existingFilePaths = new Set(
            existingVideos.map((v) => v.filePath)
          );

          // Add only new videos
          let newVideosCount = 0;
          for (const video of videos) {
            if (!existingFilePaths.has(video.filePath)) {
              await db.createVideo({
                courseId: existingCourse.id,
                fileName: video.fileName,
                filePath: video.filePath,
                duration: video.duration,
                fileSize: video.fileSize,
              });
              newVideosCount++;
            }
          }

          // Update course timestamp
          await db.updateCourse(existingCourse.id, {
            updatedAt: new Date().toISOString(),
          });

          console.log(
            `Updated course "${existingCourse.name}" with ${newVideosCount} new videos`
          );
          return db.getCourseWithVideos(existingCourse.id);
        }

        // Check if course with same name already exists
        if (db.courseExistsByName(name.trim())) {
          throw new Error("A course with this name already exists");
        }

        // Crawl the folder first to check for videos
        const videos = await crawlDirectory(folderPath);

        // Check if folder contains any video files
        if (videos.length === 0) {
          throw new Error("No video files found in the selected folder");
        }

        // Create the course
        const course = await db.createCourse(name, folderPath);

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

  // Mark video as completed manually
  ipcMain.handle("mark-video-completed", async (event, videoId: number) => {
    try {
      if (!db) {
        return null;
      }
      return await db.markVideoAsCompleted(videoId);
    } catch (error) {
      console.error("Error marking video as completed:", error);
      return null;
    }
  });

  // Mark video as incomplete
  ipcMain.handle("mark-video-incomplete", async (event, videoId: number) => {
    try {
      if (!db) {
        return null;
      }
      return await db.markVideoAsIncomplete(videoId);
    } catch (error) {
      console.error("Error marking video as incomplete:", error);
      return null;
    }
  });

  ipcMain.handle(
    "update-course-access-time",
    async (event, courseId: number) => {
      try {
        if (!db) {
          return;
        }
        await db.updateCourseAccessTime(courseId);
      } catch (error) {
        console.error("Error updating course access time:", error);
      }
    }
  );

  ipcMain.handle(
    "update-video-duration",
    async (event, videoId: number, duration: number) => {
      try {
        if (!db) {
          return;
        }
        await db.updateVideo(videoId, { duration });
        console.log(`Updated video ${videoId} duration to ${duration}s`);
      } catch (error) {
        console.error("Error updating video duration:", error);
      }
    }
  );

  ipcMain.handle("refresh-video-metadata", async (event, videoId: number) => {
    try {
      if (!db) {
        return null;
      }

      const video = db.getVideoById(videoId);
      if (!video) {
        throw new Error(`Video with id ${videoId} not found`);
      }

      // Get fresh metadata from the video file
      const metadata = await getVideoMetadata(video.filePath);

      // Update the video with new metadata
      const updatedVideo = await db.updateVideo(videoId, {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        bitrate: metadata.bitrate,
        frameRate: metadata.frameRate,
      });

      console.log(`Refreshed metadata for video ${videoId}: ${video.fileName}`);
      return updatedVideo;
    } catch (error) {
      console.error("Error refreshing video metadata:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "update-course-current-video",
    async (event, courseId: number, videoId: number) => {
      try {
        if (!db) {
          return;
        }

        await db.updateCourse(courseId, {
          lastWatchedVideoId: videoId,
        } as Partial<Course>);
        console.log(`Updated course ${courseId} current video to ${videoId}`);
      } catch (error) {
        console.error("Error updating course current video:", error);
        throw error;
      }
    }
  );

  // Learning time tracking
  ipcMain.handle("add-learning-time", async (event, timeSpent: number) => {
    try {
      if (!db) {
        return;
      }
      await db.addLearningTime(timeSpent);
      console.log(`Added ${timeSpent} seconds to today's learning time`);
    } catch (error) {
      console.error("Error adding learning time:", error);
      throw error;
    }
  });

  ipcMain.handle("get-daily-learning-time", async (event, date: string) => {
    try {
      if (!db) {
        return null;
      }
      return db.getDailyLearningTime(date);
    } catch (error) {
      console.error("Error getting daily learning time:", error);
      return null;
    }
  });

  ipcMain.handle("get-weekly-learning-time", async () => {
    try {
      if (!db) {
        return [];
      }
      return db.getWeeklyLearningTime();
    } catch (error) {
      console.error("Error getting weekly learning time:", error);
      return [];
    }
  });

  ipcMain.handle("get-total-learning-time", async () => {
    try {
      if (!db) {
        return 0;
      }
      return db.getTotalLearningTime();
    } catch (error) {
      console.error("Error getting total learning time:", error);
      return 0;
    }
  });

  // Power management handlers
  ipcMain.handle("video-playing", async (event, playing: boolean) => {
    isVideoPlaying = playing;

    if (playing) {
      // Prevent system sleep during video playback
      if (powerSaveBlockerId === null) {
        powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
        console.log("Preventing display sleep during video playback");
      }
    } else {
      // Allow system sleep when video is paused/stopped
      if (powerSaveBlockerId !== null) {
        powerSaveBlocker.stop(powerSaveBlockerId);
        powerSaveBlockerId = null;
        console.log("Allowing display sleep - video paused/stopped");
      }
    }
  });

  ipcMain.handle("get-power-info", async () => {
    try {
      return {
        isOnBattery: powerMonitor.isOnBatteryPower(),
        systemIdleTime: powerMonitor.getSystemIdleTime(),
        thermalState: "normal", // getThermalState is not available in all Electron versions
      };
    } catch (error) {
      console.error("Error getting power info:", error);
      return {
        isOnBattery: false,
        systemIdleTime: 0,
        thermalState: "unknown",
      };
    }
  });
};

// Initialize IPC handlers
setupIpcHandlers();

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

  // Power management: monitor system events
  powerMonitor.on("on-battery", () => {
    console.log(
      "System switched to battery power - enabling power saving mode"
    );
    // Notify renderer about battery status change
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("power-status-changed", { isOnBattery: true });
    });
  });

  powerMonitor.on("on-ac", () => {
    console.log("System connected to AC power - disabling power saving mode");
    // Notify renderer about power status change
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("power-status-changed", { isOnBattery: false });
    });
  });

  // Note: thermal-state-change event may not be available in all Electron versions
  try {
    powerMonitor.on("thermal-state-change", () => {
      console.log(`Thermal state changed`);
      // Reduce performance when system is overheating
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("thermal-state-changed", { state: "changed" });
      });
    });
  } catch (error) {
    console.log(
      "Thermal state monitoring not available in this Electron version"
    );
  }

  createWindow();
});

// Clean up database and server when app is closing
app.on("before-quit", () => {
  if (db) {
    db.close();
  }
  if (videoServer) {
    videoServer.close();
  }
  // Clean up power management
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
    powerSaveBlockerId = null;
  }
  if (backgroundThrottleTimer) {
    clearTimeout(backgroundThrottleTimer);
    backgroundThrottleTimer = null;
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
