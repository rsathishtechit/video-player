import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModernCourseList from "../components/ModernCourseList";
import { CourseWithVideos } from "../database/schema";

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithVideos[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await window.electronAPI.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCourseSelect = async (course: CourseWithVideos) => {
    // Update access time when selecting course from courses page
    try {
      await window.electronAPI.updateCourseAccessTime(course.id);
    } catch (error) {
      console.warn("Could not update course access time:", error);
      // Continue navigation even if access time update fails
    }
    navigate(`/course/${course.id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-white">Loading courses...</p>
      </div>
    );
  }

  return (
    <ModernCourseList
      courses={courses}
      onCourseSelect={handleCourseSelect}
      onCourseDeleted={loadCourses}
      onCourseAdded={loadCourses}
    />
  );
};

export default CoursesPage;
