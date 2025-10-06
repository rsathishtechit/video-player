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
} as ElectronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
