import React, { useState } from "react";

interface FolderSelectorProps {
  onCourseAdded: () => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({ onCourseAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    try {
      setError(null);
      setSuccess(null);
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        setSelectedFolder(folderPath);
        // Auto-generate course name from folder name
        const folderName = folderPath.split("/").pop() || "New Course";
        setCourseName(folderName);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      setError("Failed to select folder. Please try again.");
    }
  };

  const handleCreateCourse = async () => {
    if (!selectedFolder || !courseName.trim()) {
      setError("Please select a folder and enter a course name");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Create the course (this will also crawl the folder and add videos)
      const course = await window.electronAPI.createCourse(
        courseName.trim(),
        selectedFolder
      );

      // Reset form
      setCourseName("");
      setSelectedFolder(null);

      // Show success message
      setSuccess(
        `Course "${courseName}" created successfully with ${course.totalVideos} videos!`
      );

      // Notify parent component
      onCourseAdded();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error creating course:", error);

      // Show specific error messages based on the error
      const errorMessage =
        error.message || "Error creating course. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-400 text-xl mr-3">⚠️</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center">
            <span className="text-green-400 text-xl mr-3">✅</span>
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Course Name
        </label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => {
            setCourseName(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          placeholder="Enter course name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Course Folder
        </label>
        <div className="space-y-3">
          <button
            onClick={handleSelectFolder}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedFolder ? "📁 Change Folder" : "📁 Select Folder"}
          </button>
          {selectedFolder && (
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 break-all">
              {selectedFolder}
            </div>
          )}
        </div>
      </div>

      {selectedFolder && courseName && (
        <button
          onClick={handleCreateCourse}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Course...
            </span>
          ) : (
            "✨ Create Course"
          )}
        </button>
      )}
    </div>
  );
};

export default FolderSelector;
