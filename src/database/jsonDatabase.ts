import fs from "fs/promises";
import path from "path";
import { app } from "electron";
import { Course, Video, VideoProgress, CourseWithVideos } from "./schema";

class JsonDatabase {
  private dataPath: string;
  private courses: Course[] = [];
  private videos: Video[] = [];
  private videoProgress: VideoProgress[] = [];
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

      // Update idCounter to be higher than any existing ID
      const allIds = [
        ...this.courses.map((c) => c.id),
        ...this.videos.map((v) => v.id),
        ...this.videoProgress.map((vp) => vp.id),
      ];
      if (allIds.length > 0) {
        this.idCounter = Math.max(...allIds);
      }
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty data
      this.courses = [];
      this.videos = [];
      this.videoProgress = [];
    }
  }

  private async saveData() {
    try {
      const data = {
        courses: this.courses,
        videos: this.videos,
        videoProgress: this.videoProgress,
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
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

  async updateCourse(id: number, name: string): Promise<Course> {
    const course = this.courses.find((c) => c.id === id);
    if (course) {
      course.name = name;
      course.updatedAt = new Date().toISOString();
      await this.saveData();
    }
    return course!;
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
    return this.videos.filter((v) => v.courseId === courseId);
  }

  async updateVideo(id: number, updates: Partial<Video>): Promise<Video> {
    const video = this.videos.find((v) => v.id === id);
    if (video) {
      Object.assign(video, updates);
      video.updatedAt = new Date().toISOString();
      await this.saveData();
    }
    return video!;
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
    return this.courses
      .map((course) => this.getCourseWithVideos(course.id))
      .filter(Boolean) as CourseWithVideos[];
  }

  close(): void {
    // No cleanup needed for JSON database
  }
}

export default JsonDatabase;
