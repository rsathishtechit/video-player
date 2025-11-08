import { contextBridge, ipcRenderer } from "electron";
import {
  CourseWithVideos,
  Video,
  VideoProgress,
  DailyLearningTime,
} from "./database/schema";

// VideoFileInfo interface (matches the one in main.ts)
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

// Define the API that will be exposed to the renderer process
// Update info interface
interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  // Folder selection
  selectFolder: () => Promise<string | null>;

  // Course operations
  createCourse: (name: string, folderPath: string) => Promise<CourseWithVideos>;
  getAllCourses: () => Promise<CourseWithVideos[]>;
  getCourseWithVideos: (courseId: number) => Promise<CourseWithVideos | null>;
  deleteCourse: (courseId: number) => Promise<void>;

  // Video operations
  getVideosByCourseId: (courseId: number) => Promise<Video[]>;

  // Progress operations
  updateVideoProgress: (
    videoId: number,
    currentTime: number,
    duration: number,
    progressPercentage: number
  ) => Promise<VideoProgress | null>;
  getVideoProgress: (videoId: number) => Promise<VideoProgress | null>;
  resetVideoProgress: (videoId: number) => Promise<void>;
  resetCourseProgress: (courseId: number) => Promise<void>;
  markVideoCompleted: (videoId: number) => Promise<VideoProgress | null>;
  markVideoIncomplete: (videoId: number) => Promise<VideoProgress | null>;
  updateCourseAccessTime: (courseId: number) => Promise<void>;
  updateVideoDuration: (videoId: number, duration: number) => Promise<void>;
  updateCourseCurrentVideo: (
    courseId: number,
    videoId: number
  ) => Promise<void>;

  // Learning time tracking
  addLearningTime: (timeSpent: number) => Promise<void>;
  getDailyLearningTime: (date: string) => Promise<DailyLearningTime | null>;
  getWeeklyLearningTime: () => Promise<DailyLearningTime[]>;
  getTotalLearningTime: () => Promise<number>;

  // File operations
  crawlFolder: (folderPath: string) => Promise<VideoFileInfo[]>;

  // Power management
  videoPlaying: (playing: boolean) => Promise<void>;
  getPowerInfo: () => Promise<{
    isOnBattery: boolean;
    systemIdleTime: number;
    thermalState: string;
  }>;

  // Auto-update handlers
  checkForUpdates: () => void;
  startUpdate: () => void;
  installUpdate: () => void;
  onUpdateStatus: (
    callback: (status: string, info?: UpdateInfo | ProgressInfo | Error) => void
  ) => () => void;

  // Subtitle operations
  generateSubtitles: (
    videoId: number,
    options?: { model?: string; language?: string }
  ) => Promise<{ success: boolean; subtitlePath?: string; error?: string }>;
  hasSubtitles: (videoId: number) => Promise<boolean>;
  getSubtitlePath: (videoId: number) => Promise<string | null>;
  deleteSubtitles: (videoId: number) => Promise<void>;
  getAvailableWhisperModels: () => Promise<string[]>;
  getWhisperModelInfo: (modelName: string) => Promise<{
    name: string;
    size: string;
    description: string;
  } | null>;
  checkWhisperAvailability: () => Promise<boolean>;
  downloadWhisperModel: (
    modelName: string
  ) => Promise<{ success: boolean; modelPath?: string; error?: string }>;
  onSubtitleGenerationProgress: (
    callback: (progress: any) => void
  ) => () => void;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Folder selection
  selectFolder: () => ipcRenderer.invoke("select-folder"),

  // Course operations
  createCourse: (name: string, folderPath: string) =>
    ipcRenderer.invoke("create-course", name, folderPath),
  getAllCourses: () => ipcRenderer.invoke("get-all-courses"),
  getCourseWithVideos: (courseId: number) =>
    ipcRenderer.invoke("get-course-with-videos", courseId),
  deleteCourse: (courseId: number) =>
    ipcRenderer.invoke("delete-course", courseId),

  // Video operations
  getVideosByCourseId: (courseId: number) =>
    ipcRenderer.invoke("get-videos-by-course-id", courseId),

  // Progress operations
  updateVideoProgress: (
    videoId: number,
    currentTime: number,
    duration: number,
    progressPercentage: number
  ) =>
    ipcRenderer.invoke(
      "update-video-progress",
      videoId,
      currentTime,
      duration,
      progressPercentage
    ),
  getVideoProgress: (videoId: number) =>
    ipcRenderer.invoke("get-video-progress", videoId),
  resetVideoProgress: (videoId: number) =>
    ipcRenderer.invoke("reset-video-progress", videoId),
  resetCourseProgress: (courseId: number) =>
    ipcRenderer.invoke("reset-course-progress", courseId),
  markVideoCompleted: (videoId: number) =>
    ipcRenderer.invoke("mark-video-completed", videoId),
  markVideoIncomplete: (videoId: number) =>
    ipcRenderer.invoke("mark-video-incomplete", videoId),
  updateCourseAccessTime: (courseId: number) =>
    ipcRenderer.invoke("update-course-access-time", courseId),
  updateVideoDuration: (videoId: number, duration: number) =>
    ipcRenderer.invoke("update-video-duration", videoId, duration),
  updateCourseCurrentVideo: (courseId: number, videoId: number) =>
    ipcRenderer.invoke("update-course-current-video", courseId, videoId),

  // Learning time tracking
  addLearningTime: (timeSpent: number) =>
    ipcRenderer.invoke("add-learning-time", timeSpent),
  getDailyLearningTime: (date: string) =>
    ipcRenderer.invoke("get-daily-learning-time", date),
  getWeeklyLearningTime: () => ipcRenderer.invoke("get-weekly-learning-time"),
  getTotalLearningTime: () => ipcRenderer.invoke("get-total-learning-time"),

  // File operations
  crawlFolder: (folderPath: string) =>
    ipcRenderer.invoke("crawl-folder", folderPath),

  // Power management
  videoPlaying: (playing: boolean) =>
    ipcRenderer.invoke("video-playing", playing),
  getPowerInfo: () => ipcRenderer.invoke("get-power-info"),

  // Auto-update handlers
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  startUpdate: () => ipcRenderer.send("start-update"),
  installUpdate: () => ipcRenderer.send("install-update"),
  onUpdateStatus: (callback: (status: string, info?: any) => void) => {
    const listener = (_event: any, status: string, info?: any) =>
      callback(status, info);
    ipcRenderer.on("update-status", listener);
    return () => ipcRenderer.removeListener("update-status", listener);
  },

  // Subtitle operations
  generateSubtitles: (
    videoId: number,
    options?: { model?: string; language?: string }
  ) => ipcRenderer.invoke("generate-subtitles", videoId, options),
  hasSubtitles: (videoId: number) =>
    ipcRenderer.invoke("has-subtitles", videoId),
  getSubtitlePath: (videoId: number) =>
    ipcRenderer.invoke("get-subtitle-path", videoId),
  deleteSubtitles: (videoId: number) =>
    ipcRenderer.invoke("delete-subtitles", videoId),
  getAvailableWhisperModels: () =>
    ipcRenderer.invoke("get-available-whisper-models"),
  getWhisperModelInfo: (modelName: string) =>
    ipcRenderer.invoke("get-whisper-model-info", modelName),
  checkWhisperAvailability: () =>
    ipcRenderer.invoke("check-whisper-availability"),
  downloadWhisperModel: (modelName: string) =>
    ipcRenderer.invoke("download-whisper-model", modelName),
  onSubtitleGenerationProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on("subtitle-generation-progress", listener);
    return () =>
      ipcRenderer.removeListener("subtitle-generation-progress", listener);
  },
} as ElectronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
