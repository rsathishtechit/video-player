import React from "react";
import { CourseWithVideos } from "../database/schema";

interface CourseListProps {
  courses: CourseWithVideos[];
  onCourseSelect: (course: CourseWithVideos) => void;
  onCourseDeleted: () => void;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  onCourseSelect,
  onCourseDeleted,
}) => {
  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the course "${courseName}"? This will also delete all associated videos and progress.`
      )
    ) {
      try {
        await window.electronAPI.deleteCourse(courseId);
        onCourseDeleted();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Error deleting course. Please try again.");
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No courses yet
        </h3>
        <p className="text-gray-500">
          Select a folder above to create your first course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {course.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id, course.name);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete course"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Videos:</span>
                  <span>{course.totalVideos}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completed:</span>
                  <span>{course.completedVideos}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress:</span>
                  <span>{course.totalProgress.toFixed(1)}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${course.totalProgress}%` }}
                ></div>
              </div>

              <button
                onClick={() => onCourseSelect(course)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Open Course
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;
