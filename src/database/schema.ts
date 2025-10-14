export interface Course {
  id: number;
  name: string;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  lastWatchedVideoId?: number; // Track the last watched video for the course
}

export interface Video {
  id: number;
  courseId: number;
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
  subtitlePath?: string; // Path to generated subtitle file
  hasSubtitles?: boolean; // Whether subtitles are generated
  subtitleLanguage?: string; // Language of subtitles
}

export interface VideoProgress {
  id: number;
  videoId: number;
  currentTime: number;
  duration: number;
  progressPercentage: number;
  lastWatchedAt: string;
  completed: boolean;
  manuallyCompleted?: boolean; // Track if user manually marked as complete
}

export interface CourseWithVideos extends Course {
  videos: Video[];
  totalVideos: number;
  completedVideos: number;
  totalProgress: number;
}

export interface DailyLearningTime {
  id: number;
  date: string; // YYYY-MM-DD format
  totalTimeSpent: number; // in seconds
  sessionsCount: number;
  createdAt: string;
  updatedAt: string;
}
