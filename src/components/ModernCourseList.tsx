import React, { useState } from "react";
import { CourseWithVideos } from "../database/schema";
import FolderSelector from "./FolderSelector";

interface ModernCourseListProps {
  courses: CourseWithVideos[];
  onCourseSelect: (course: CourseWithVideos) => void;
  onCourseDeleted: () => void;
  onCourseAdded: () => void;
}

const ModernCourseList: React.FC<ModernCourseListProps> = ({
  courses,
  onCourseSelect,
  onCourseDeleted,
  onCourseAdded,
}) => {
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleDeleteCourse = async (
    courseId: number,
    courseName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${courseName}"?`)) {
      try {
        await window.electronAPI.deleteCourse(courseId);
        onCourseDeleted();
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const handleResetCourseProgress = async (
    courseId: number,
    courseName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to reset all progress for "${courseName}"? This will mark all videos as unwatched.`
      )
    ) {
      try {
        await window.electronAPI.resetCourseProgress(courseId);
        onCourseDeleted(); // Refresh the course list
      } catch (error) {
        console.error("Error resetting course progress:", error);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalDuration = (course: CourseWithVideos): number => {
    return course.videos.reduce((total, video) => total + video.duration, 0);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Courses</h1>
          <p className="text-gray-300">
            {courses.length} courses •{" "}
            {courses.reduce((acc, c) => acc + c.totalVideos, 0)} videos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="text-lg">⊞</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="text-lg">☰</span>
            </button>
          </div>

          {/* Add Course Button */}
          <button
            onClick={() => setShowAddCourse(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
          >
            <span className="mr-2">➕</span>
            Add Course
          </button>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Course</h2>
              <button
                onClick={() => setShowAddCourse(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <FolderSelector
              onCourseAdded={() => {
                onCourseAdded();
                setShowAddCourse(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Course Grid/List */}
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white mb-2">No courses yet</h2>
          <p className="text-gray-400 mb-8">
            Start by adding your first course
          </p>
          <button
            onClick={() => setShowAddCourse(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200"
          >
            Add Your First Course
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onCourseSelect(course)}
              className="group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              {/* Course Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="text-6xl">🎓</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={(e) =>
                      handleResetCourseProgress(course.id, course.name, e)
                    }
                    className="w-8 h-8 bg-yellow-500/80 hover:bg-yellow-500 rounded-full flex items-center justify-center"
                    title="Reset Progress"
                  >
                    <span className="text-white text-sm">↻</span>
                  </button>
                  <button
                    onClick={(e) =>
                      handleDeleteCourse(course.id, course.name, e)
                    }
                    className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center"
                    title="Delete Course"
                  >
                    <span className="text-white text-sm">✕</span>
                  </button>
                </div>

                {/* Progress Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300"
                    style={{ width: `${course.totalProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 truncate">
                  {course.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Videos</span>
                    <span className="text-white">{course.totalVideos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-green-400">
                      {course.completedVideos}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">
                      {formatDuration(getTotalDuration(course))}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.totalProgress}%` }}
                  ></div>
                </div>

                <div className="text-center text-sm text-gray-300">
                  {course.totalProgress.toFixed(1)}% Complete
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onCourseSelect(course)}
              className="flex items-center p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mr-6">
                <span className="text-2xl">🎓</span>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {course.name}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {course.completedVideos}/{course.totalVideos} videos •{" "}
                  {formatDuration(getTotalDuration(course))}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.totalProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-right ml-6">
                <div className="text-2xl font-bold text-white">
                  {course.totalProgress.toFixed(0)}%
                </div>
                <div className="text-gray-400 text-sm">Complete</div>
              </div>

              <div className="ml-4 flex space-x-2">
                <button
                  onClick={(e) =>
                    handleResetCourseProgress(course.id, course.name, e)
                  }
                  className="w-8 h-8 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-full flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-all duration-200"
                  title="Reset Progress"
                >
                  ↻
                </button>
                <button
                  onClick={(e) => handleDeleteCourse(course.id, course.name, e)}
                  className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                  title="Delete Course"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModernCourseList;
