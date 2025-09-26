import React, { useState, useEffect } from "react";
import CourseList from "./CourseList";
import VideoPlayer from "./VideoPlayer";
import FolderSelector from "./FolderSelector";
import { CourseWithVideos, Video } from "../database/schema";

const App: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithVideos[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithVideos | null>(
    null
  );
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await window.electronAPI.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course: CourseWithVideos) => {
    setSelectedCourse(course);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedVideo(null);
  };

  const handleBackToVideos = () => {
    setSelectedVideo(null);
  };

  const handleCourseAdded = () => {
    loadCourses();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Video Player</h1>
            {selectedCourse && (
              <button
                onClick={handleBackToCourses}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ← Back to Courses
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCourse ? (
          <div className="space-y-8">
            <FolderSelector onCourseAdded={handleCourseAdded} />
            <CourseList
              courses={courses}
              onCourseSelect={handleCourseSelect}
              onCourseDeleted={loadCourses}
            />
          </div>
        ) : !selectedVideo ? (
          <VideoPlayer
            course={selectedCourse}
            onVideoSelect={handleVideoSelect}
            onBack={handleBackToCourses}
          />
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleBackToVideos}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ← Back to Videos
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedVideo.fileName}
              </h2>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  key={selectedVideo.id}
                  controls
                  className="w-full h-full"
                  onLoadedMetadata={async (e) => {
                    const video = e.target as HTMLVideoElement;
                    try {
                      // Get the last watched progress for this video
                      const progress =
                        await window.electronAPI.getVideoProgress(
                          selectedVideo.id
                        );
                      if (
                        progress &&
                        progress.currentTime > 0 &&
                        !progress.completed
                      ) {
                        // Resume from last position if not completed and has progress
                        video.currentTime = progress.currentTime;
                        console.log(
                          `Resumed video at ${progress.currentTime} seconds`
                        );
                      }
                    } catch (error) {
                      console.error("Error loading video progress:", error);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const currentTime = video.currentTime;
                    const duration = video.duration;
                    const progressPercentage = (currentTime / duration) * 100;

                    // Update progress every 5 seconds
                    if (Math.floor(currentTime) % 5 === 0) {
                      window.electronAPI.updateVideoProgress(
                        selectedVideo.id,
                        currentTime,
                        duration,
                        progressPercentage
                      );
                    }
                  }}
                  onError={(e) => {
                    console.error("Video loading error:", e);
                    console.error("Failed to load:", selectedVideo.filePath);
                  }}
                  onLoadStart={() => {
                    console.log(
                      "Video loading started for:",
                      selectedVideo.fileName
                    );
                  }}
                  onCanPlay={() => {
                    console.log("Video can play:", selectedVideo.fileName);
                  }}
                >
                  <source
                    src={`http://localhost:3001/${encodeURIComponent(selectedVideo.filePath)}`}
                    type="video/mp4"
                  />
                  <p className="text-white p-4">
                    Unable to load video: {selectedVideo.fileName}
                    <br />
                    Path: {selectedVideo.filePath}
                  </p>
                </video>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
