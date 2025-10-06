import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModernVideoPlayer from "../components/ModernVideoPlayer";
import { CourseWithVideos, Video } from "../database/schema";

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        navigate("/courses");
        return;
      }

      try {
        const courseData = await window.electronAPI.getCourseWithVideos(
          parseInt(courseId)
        );
        setCourse(courseData);

        // Set the last watched video if available
        if (courseData.lastWatchedVideoId) {
          const lastVideo = courseData.videos.find(
            (v) => v.id === courseData.lastWatchedVideoId
          );
          if (lastVideo) {
            setSelectedVideo(lastVideo);
          }
        }

        // Update course access time
        try {
          await window.electronAPI.updateCourseAccessTime(parseInt(courseId));
        } catch (accessError) {
          console.warn("Could not update course access time:", accessError);
          // Continue loading course even if access time update fails
        }
      } catch (error) {
        console.error("Error loading course:", error);
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, navigate]);

  const handleBack = () => {
    navigate("/courses");
  };

  const handleVideoSelect = async (video: Video) => {
    setSelectedVideo(video);
    
    // Update the course's current video in the database
    if (course) {
      try {
        await window.electronAPI.updateCourseCurrentVideo(course.id, video.id);
      } catch (error) {
        console.error("Error updating course current video:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Course not found</div>
      </div>
    );
  }

  return (
    <ModernVideoPlayer
      course={course}
      selectedVideo={selectedVideo}
      onVideoSelect={handleVideoSelect}
      onBack={handleBack}
    />
  );
};

export default CourseDetailPage;
