import fs from "fs/promises";
import { writeFileSync } from "fs";
import path from "path";
import { app } from "electron";
import {
  Course,
  Video,
  VideoProgress,
  CourseWithVideos,
  DailyLearningTime,
} from "./schema";

class JsonDatabase {
  private dataPath: string;
  private courses: Course[] = [];
  private videos: Video[] = [];
  private videoProgress: VideoProgress[] = [];
  private dailyLearningTime: DailyLearningTime[] = [];
  private idCounter: number = Date.now();

  constructor() {
    const userDataPath = app.getPath("userData");
    this.dataPath = path.join(userDataPath, "video-player-data.json");
    this.loadData();
  }

  private async loadData() {
    try {
      const data = await fs.readFile(this.dataPath, "utf-8");
      const parsed = JSON.parse(data);
      this.courses = parsed.courses || [];
      this.videos = parsed.videos || [];
      this.videoProgress = parsed.videoProgress || [];
      this.dailyLearningTime = parsed.dailyLearningTime || [];

      // Update idCounter to be higher than any existing ID
      const allIds = [
        ...this.courses.map((c) => c.id),
        ...this.videos.map((v) => v.id),
        ...this.videoProgress.map((vp) => vp.id),
        ...this.dailyLearningTime.map((dlt) => dlt.id),
      ];
      if (allIds.length > 0) {
        this.idCounter = Math.max(...allIds);
      }
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty data
      this.courses = [];
      this.videos = [];
      this.videoProgress = [];
      this.dailyLearningTime = [];
    }
  }

  private saveThrottleTimer: NodeJS.Timeout | null = null;
  private pendingSave = false;

  private async saveData() {
    // Throttle saves to reduce disk I/O for battery optimization
    if (this.saveThrottleTimer) {
      this.pendingSave = true;
      return;
    }

    this.saveThrottleTimer = setTimeout(async () => {
      try {
        const data = {
          courses: this.courses,
          videos: this.videos,
          videoProgress: this.videoProgress,
          dailyLearningTime: this.dailyLearningTime,
        };
        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));

        this.saveThrottleTimer = null;

        // If there's a pending save, execute it
        if (this.pendingSave) {
          this.pendingSave = false;
          this.saveData();
        }
      } catch (error) {
        console.error("Error saving data:", error);
        this.saveThrottleTimer = null;
      }
    }, 1000); // Throttle saves to once per second for battery optimization
  }

  // Course operations
  async createCourse(name: string, folderPath: string): Promise<Course> {
    const course: Course = {
      id: ++this.idCounter,
      name,
      folderPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.courses.push(course);
    await this.saveData();
    return course;
  }

  getCourseById(id: number): Course | null {
    return this.courses.find((c) => c.id === id) || null;
  }

  getCourseByPath(folderPath: string): Course | null {
    return this.courses.find((c) => c.folderPath === folderPath) || null;
  }

  getAllCourses(): Course[] {
    return [...this.courses];
  }

  async updateCourse(
    id: number,
    updates: Partial<Course> | string
  ): Promise<Course> {
    const course = this.courses.find((c) => c.id === id);
    if (!course) {
      throw new Error(`Course with id ${id} not found`);
    }

    // Handle backward compatibility - if updates is a string, treat it as name
    if (typeof updates === "string") {
      course.name = updates;
    } else {
      // Apply partial updates
      Object.assign(course, updates);
    }

    course.updatedAt = new Date().toISOString();
    await this.saveData();
    return course;
  }

  async updateCourseAccessTime(id: number): Promise<void> {
    const course = this.courses.find((c) => c.id === id);
    if (course) {
      course.lastAccessedAt = new Date().toISOString();
      await this.saveData();
    }
  }

  courseExistsByPath(folderPath: string): boolean {
    return this.courses.some((course) => course.folderPath === folderPath);
  }

  courseExistsByName(name: string): boolean {
    return this.courses.some(
      (course) => course.name.toLowerCase() === name.toLowerCase()
    );
  }

  async deleteCourse(id: number): Promise<void> {
    this.courses = this.courses.filter((c) => c.id !== id);
    this.videos = this.videos.filter((v) => v.courseId !== id);
    this.videoProgress = this.videoProgress.filter(
      (vp) => !this.videos.some((v) => v.id === vp.videoId)
    );
    await this.saveData();
  }

  // Video operations
  async createVideo(
    video: Omit<Video, "id" | "createdAt" | "updatedAt">
  ): Promise<Video> {
    const newVideo: Video = {
      ...video,
      id: ++this.idCounter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.videos.push(newVideo);
    await this.saveData();
    return newVideo;
  }

  getVideoById(id: number): Video | null {
    return this.videos.find((v) => v.id === id) || null;
  }

  getVideosByCourseId(courseId: number): Video[] {
    return this.videos
      .filter((v) => v.courseId === courseId)
      .sort((a, b) => {
        // Natural sorting that handles numbers in filenames properly
        const aName = a.fileName.toLowerCase();
        const bName = b.fileName.toLowerCase();

        // Split filename into parts (text and numbers)
        const aParts = aName.split(/(\d+)/).filter((part) => part.length > 0);
        const bParts = bName.split(/(\d+)/).filter((part) => part.length > 0);

        const maxLength = Math.max(aParts.length, bParts.length);

        for (let i = 0; i < maxLength; i++) {
          const aPart = aParts[i] || "";
          const bPart = bParts[i] || "";

          // If both parts are numbers, compare numerically
          const aIsNum = /^\d+$/.test(aPart);
          const bIsNum = /^\d+$/.test(bPart);

          if (aIsNum && bIsNum) {
            const aNum = parseInt(aPart);
            const bNum = parseInt(bPart);
            if (aNum !== bNum) {
              return aNum - bNum;
            }
          } else {
            // Compare as strings
            const comparison = aPart.localeCompare(bPart);
            if (comparison !== 0) {
              return comparison;
            }
          }
        }

        // If all parts are equal, compare by creation date as fallback
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }

  async updateVideo(id: number, updates: Partial<Video>): Promise<Video> {
    const video = this.videos.find((v) => v.id === id);
    if (!video) {
      throw new Error(`Video with id ${id} not found`);
    }
    Object.assign(video, updates);
    video.updatedAt = new Date().toISOString();
    await this.saveData();
    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    this.videos = this.videos.filter((v) => v.id !== id);
    this.videoProgress = this.videoProgress.filter((vp) => vp.videoId !== id);
    await this.saveData();
  }

  // Progress operations
  async updateVideoProgress(
    videoId: number,
    currentTime: number,
    duration: number,
    progressPercentage: number
  ): Promise<VideoProgress> {
    const completed = progressPercentage >= 95;

    const existingIndex = this.videoProgress.findIndex(
      (vp) => vp.videoId === videoId
    );
    const progress: VideoProgress = {
      id:
        existingIndex >= 0
          ? this.videoProgress[existingIndex].id
          : ++this.idCounter,
      videoId,
      currentTime,
      duration,
      progressPercentage,
      lastWatchedAt: new Date().toISOString(),
      completed,
    };

    if (existingIndex >= 0) {
      this.videoProgress[existingIndex] = progress;
    } else {
      this.videoProgress.push(progress);
    }

    await this.saveData();
    return progress;
  }

  getVideoProgress(videoId: number): VideoProgress | null {
    return this.videoProgress.find((vp) => vp.videoId === videoId) || null;
  }

  getAllVideoProgress(): VideoProgress[] {
    return [...this.videoProgress];
  }

  async resetVideoProgress(videoId: number): Promise<void> {
    this.videoProgress = this.videoProgress.filter(
      (vp) => vp.videoId !== videoId
    );
    await this.saveData();
  }

  async resetCourseProgress(courseId: number): Promise<void> {
    // Get all videos for this course
    const courseVideos = this.videos.filter((v) => v.courseId === courseId);
    const videoIds = courseVideos.map((v) => v.id);

    // Remove progress for all videos in this course
    this.videoProgress = this.videoProgress.filter(
      (vp) => !videoIds.includes(vp.videoId)
    );
    await this.saveData();
  }

  // Combined operations
  getCourseWithVideos(courseId: number): CourseWithVideos | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;

    const videos = this.getVideosByCourseId(courseId);
    const progressData = this.videoProgress.filter((vp) =>
      videos.some((v) => v.id === vp.videoId)
    );

    const completedVideos = progressData.filter((p) => p.completed).length;
    const totalProgress =
      progressData.length > 0
        ? progressData.reduce((sum, p) => sum + p.progressPercentage, 0) /
          progressData.length
        : 0;

    return {
      ...course,
      videos,
      totalVideos: videos.length,
      completedVideos,
      totalProgress: Math.round(totalProgress * 100) / 100,
    };
  }

  getAllCoursesWithVideos(): CourseWithVideos[] {
    const coursesWithVideos = this.courses
      .map((course) => this.getCourseWithVideos(course.id))
      .filter(Boolean) as CourseWithVideos[];

    // Sort by recently accessed, with fallback to creation date
    return coursesWithVideos.sort((a, b) => {
      const aTime = a.lastAccessedAt || a.createdAt;
      const bTime = b.lastAccessedAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  // Daily Learning Time operations
  async addLearningTime(timeSpent: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    console.log(`Adding ${timeSpent} seconds to learning time for ${today}`);

    const existingEntry = this.dailyLearningTime.find(
      (entry) => entry.date === today
    );

    if (existingEntry) {
      const oldTime = existingEntry.totalTimeSpent;
      existingEntry.totalTimeSpent += timeSpent;
      existingEntry.sessionsCount += 1;
      existingEntry.updatedAt = new Date().toISOString();
      console.log(
        `Updated existing entry: ${oldTime}s -> ${existingEntry.totalTimeSpent}s (sessions: ${existingEntry.sessionsCount})`
      );
    } else {
      const newEntry: DailyLearningTime = {
        id: ++this.idCounter,
        date: today,
        totalTimeSpent: timeSpent,
        sessionsCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.dailyLearningTime.push(newEntry);
      console.log(
        `Created new learning time entry: ${timeSpent}s for ${today}`
      );
    }

    await this.saveData();
  }

  getDailyLearningTime(date: string): DailyLearningTime | null {
    const result =
      this.dailyLearningTime.find((entry) => entry.date === date) || null;
    console.log(
      `Getting learning time for ${date}:`,
      result ? `${result.totalTimeSpent}s` : "No data"
    );
    return result;
  }

  getWeeklyLearningTime(): DailyLearningTime[] {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    return this.dailyLearningTime
      .filter((entry) => entry.date >= weekAgoStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getTotalLearningTime(): number {
    return this.dailyLearningTime.reduce(
      (total, entry) => total + entry.totalTimeSpent,
      0
    );
  }

  close(): void {
    // Clean up throttle timer for battery optimization
    if (this.saveThrottleTimer) {
      clearTimeout(this.saveThrottleTimer);
      this.saveThrottleTimer = null;
    }

    // Force save any pending data before closing
    if (this.pendingSave) {
      const data = {
        courses: this.courses,
        videos: this.videos,
        videoProgress: this.videoProgress,
        dailyLearningTime: this.dailyLearningTime,
      };
      // Synchronous write for final save
      writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    }
  }
}

export default JsonDatabase;
