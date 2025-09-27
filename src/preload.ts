import { contextBridge, ipcRenderer } from "electron";

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Folder selection
  selectFolder: () => Promise<string | null>;

  // Course operations
  createCourse: (name: string, folderPath: string) => Promise<any>;
  getAllCourses: () => Promise<any[]>;
  getCourseWithVideos: (courseId: number) => Promise<any>;
  deleteCourse: (courseId: number) => Promise<void>;

  // Video operations
  getVideosByCourseId: (courseId: number) => Promise<any[]>;

  // Progress operations
  updateVideoProgress: (
    videoId: number,
    currentTime: number,
    duration: number,
    progressPercentage: number
  ) => Promise<any>;
  getVideoProgress: (videoId: number) => Promise<any>;
  resetVideoProgress: (videoId: number) => Promise<void>;
  resetCourseProgress: (courseId: number) => Promise<void>;

  // File operations
  crawlFolder: (folderPath: string) => Promise<any[]>;
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

  // File operations
  crawlFolder: (folderPath: string) =>
    ipcRenderer.invoke("crawl-folder", folderPath),
} as ElectronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
