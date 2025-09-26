export interface Course {
  id: number;
  name: string;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface VideoProgress {
  id: number;
  videoId: number;
  currentTime: number;
  duration: number;
  progressPercentage: number;
  lastWatchedAt: string;
  completed: boolean;
}

export interface CourseWithVideos extends Course {
  videos: Video[];
  totalVideos: number;
  completedVideos: number;
  totalProgress: number;
}

