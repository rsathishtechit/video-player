import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { Course, Video, VideoProgress, CourseWithVideos } from './schema';

class VideoDatabase {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'video-player.db');
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Create courses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        folderPath TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create videos table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL UNIQUE,
        duration REAL NOT NULL,
        fileSize INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES courses (id) ON DELETE CASCADE
      )
    `);

    // Create video_progress table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS video_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId INTEGER NOT NULL,
        currentTime REAL NOT NULL DEFAULT 0,
        duration REAL NOT NULL,
        progressPercentage REAL NOT NULL DEFAULT 0,
        lastWatchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        manuallyCompleted BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (videoId) REFERENCES videos (id) ON DELETE CASCADE,
        UNIQUE(videoId)
      )
    `);
    
    // Add manuallyCompleted column if it doesn't exist (migration)
    try {
      this.db.exec(`ALTER TABLE video_progress ADD COLUMN manuallyCompleted BOOLEAN NOT NULL DEFAULT FALSE`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_courseId ON videos(courseId);
      CREATE INDEX IF NOT EXISTS idx_video_progress_videoId ON video_progress(videoId);
      CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON video_progress(completed);
    `);
  }

  // Course operations
  createCourse(name: string, folderPath: string): Course {
    const stmt = this.db.prepare(`
      INSERT INTO courses (name, folderPath) 
      VALUES (?, ?)
    `);
    const result = stmt.run(name, folderPath);
    return this.getCourseById(result.lastInsertRowid as number);
  }

  getCourseById(id: number): Course {
    const stmt = this.db.prepare('SELECT * FROM courses WHERE id = ?');
    return stmt.get(id) as Course;
  }

  getCourseByPath(folderPath: string): Course | null {
    const stmt = this.db.prepare('SELECT * FROM courses WHERE folderPath = ?');
    return stmt.get(folderPath) as Course | null;
  }

  getAllCourses(): Course[] {
    const stmt = this.db.prepare('SELECT * FROM courses ORDER BY createdAt DESC');
    return stmt.all() as Course[];
  }

  updateCourse(id: number, name: string): Course {
    const stmt = this.db.prepare(`
      UPDATE courses 
      SET name = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(name, id);
    return this.getCourseById(id);
  }

  deleteCourse(id: number): void {
    const stmt = this.db.prepare('DELETE FROM courses WHERE id = ?');
    stmt.run(id);
  }

  // Video operations
  createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Video {
    const stmt = this.db.prepare(`
      INSERT INTO videos (courseId, fileName, filePath, duration, fileSize) 
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      video.courseId,
      video.fileName,
      video.filePath,
      video.duration,
      video.fileSize
    );
    return this.getVideoById(result.lastInsertRowid as number);
  }

  getVideoById(id: number): Video | null {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE id = ?');
    return stmt.get(id) as Video || null;
  }

  // Alias for consistency
  getVideo(id: number): Video | null {
    return this.getVideoById(id);
  }

  getVideosByCourseId(courseId: number): Video[] {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE courseId = ? ORDER BY fileName');
    return stmt.all(courseId) as Video[];
  }

  updateVideo(id: number, updates: Partial<Video>): Video {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Video]);
    
    const stmt = this.db.prepare(`
      UPDATE videos 
      SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(...values, id);
    return this.getVideoById(id);
  }

  deleteVideo(id: number): void {
    const stmt = this.db.prepare('DELETE FROM videos WHERE id = ?');
    stmt.run(id);
  }

  // Progress operations
  updateVideoProgress(
    videoId: number, 
    currentTime: number, 
    duration: number, 
    progressPercentage: number
  ): VideoProgress {
    // Get existing progress to preserve manual completion status
    const existingProgress = this.getVideoProgress(videoId);
    const wasManuallyCompleted = existingProgress?.manuallyCompleted || false;
    
    // Auto-complete at 90% (consistent with UI), but don't override manual completion
    const autoCompleted = progressPercentage >= 90;
    const completed = wasManuallyCompleted || autoCompleted;
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO video_progress 
      (videoId, currentTime, duration, progressPercentage, lastWatchedAt, completed, manuallyCompleted)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);
    
    stmt.run(videoId, currentTime, duration, progressPercentage, completed, wasManuallyCompleted);
    
    return this.getVideoProgress(videoId);
  }

  // Mark video as manually completed
  markVideoAsCompleted(videoId: number): VideoProgress {
    const existingProgress = this.getVideoProgress(videoId);
    
    if (existingProgress) {
      // Update existing progress
      const stmt = this.db.prepare(`
        UPDATE video_progress 
        SET completed = TRUE, manuallyCompleted = TRUE, lastWatchedAt = CURRENT_TIMESTAMP
        WHERE videoId = ?
      `);
      stmt.run(videoId);
    } else {
      // Create new progress entry
      const video = this.getVideo(videoId);
      if (video) {
        const stmt = this.db.prepare(`
          INSERT INTO video_progress 
          (videoId, currentTime, duration, progressPercentage, lastWatchedAt, completed, manuallyCompleted)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, TRUE, TRUE)
        `);
        stmt.run(videoId, video.duration, video.duration, 100);
      }
    }
    
    return this.getVideoProgress(videoId);
  }

  // Mark video as incomplete (reset completion)
  markVideoAsIncomplete(videoId: number): VideoProgress {
    const stmt = this.db.prepare(`
      UPDATE video_progress 
      SET completed = FALSE, manuallyCompleted = FALSE, lastWatchedAt = CURRENT_TIMESTAMP
      WHERE videoId = ?
    `);
    stmt.run(videoId);
    
    return this.getVideoProgress(videoId);
  }

  getVideoProgress(videoId: number): VideoProgress {
    const stmt = this.db.prepare('SELECT * FROM video_progress WHERE videoId = ?');
    return stmt.get(videoId) as VideoProgress;
  }

  getAllVideoProgress(): VideoProgress[] {
    const stmt = this.db.prepare('SELECT * FROM video_progress ORDER BY lastWatchedAt DESC');
    return stmt.all() as VideoProgress[];
  }

  // Combined operations
  getCourseWithVideos(courseId: number): CourseWithVideos | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;

    const videos = this.getVideosByCourseId(courseId);
    const progressData = this.db.prepare(`
      SELECT vp.completed, vp.progressPercentage 
      FROM video_progress vp 
      WHERE vp.videoId IN (${videos.map(() => '?').join(',')})
    `).all(...videos.map(v => v.id));

    const completedVideos = progressData.filter(p => p.completed).length;
    const totalProgress = progressData.length > 0 
      ? progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / progressData.length 
      : 0;

    return {
      ...course,
      videos,
      totalVideos: videos.length,
      completedVideos,
      totalProgress: Math.round(totalProgress * 100) / 100
    };
  }

  getAllCoursesWithVideos(): CourseWithVideos[] {
    const courses = this.getAllCourses();
    return courses.map(course => this.getCourseWithVideos(course.id)).filter(Boolean) as CourseWithVideos[];
  }

  close(): void {
    this.db.close();
  }
}

export default VideoDatabase;

