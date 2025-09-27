import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import ModernCourseList from "./ModernCourseList";
import ModernVideoPlayer from "./ModernVideoPlayer";
import { CourseWithVideos, Video } from "../database/schema";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
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

  const handleNavigation = (page: string, data?: any) => {
    setCurrentPage(page);
    if (page === "course-detail" && data) {
      setSelectedCourse(data);
      setSelectedVideo(null);
    } else if (page === "dashboard" || page === "courses") {
      setSelectedCourse(null);
      setSelectedVideo(null);
    }
  };

  const handleCourseSelect = (course: CourseWithVideos) => {
    setSelectedCourse(course);
    setSelectedVideo(null);
    setCurrentPage("course-detail");
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedVideo(null);
    setCurrentPage("courses");
  };

  const handleCourseAdded = () => {
    loadCourses();
  };

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigation} />;

      case "courses":
        return (
          <ModernCourseList
            courses={courses}
            onCourseSelect={handleCourseSelect}
            onCourseDeleted={loadCourses}
            onCourseAdded={handleCourseAdded}
          />
        );

      case "course-detail":
        return selectedCourse ? (
          <ModernVideoPlayer
            course={selectedCourse}
            onVideoSelect={handleVideoSelect}
            onBack={handleBackToCourses}
            selectedVideo={selectedVideo}
          />
        ) : null;

      case "library":
        return (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-white mb-4">Library</h1>
            <p className="text-gray-300">Coming soon...</p>
          </div>
        );

      case "settings":
        return (
          <div className="p-8">
            <h1 className="text-4xl font-bold text-white mb-4">Settings</h1>
            <p className="text-gray-300">Coming soon...</p>
          </div>
        );

      default:
        return <Dashboard onNavigate={handleNavigation} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigation}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default App;
