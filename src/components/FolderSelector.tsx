import React, { useState } from "react";

interface FolderSelectorProps {
  onCourseAdded: () => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({ onCourseAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        setSelectedFolder(folderPath);
        // Auto-generate course name from folder name
        const folderName = folderPath.split("/").pop() || "New Course";
        setCourseName(folderName);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const handleCreateCourse = async () => {
    if (!selectedFolder || !courseName.trim()) {
      alert("Please select a folder and enter a course name");
      return;
    }

    try {
      setIsLoading(true);

      // Create the course (this will also crawl the folder and add videos)
      const course = await window.electronAPI.createCourse(
        courseName.trim(),
        selectedFolder
      );

      if (course.totalVideos === 0) {
        alert("No video files found in the selected folder");
        return;
      }

      // Reset form
      setCourseName("");
      setSelectedFolder(null);

      // Notify parent component
      onCourseAdded();

      alert(
        `Course "${courseName}" created successfully with ${course.totalVideos} videos!`
      );
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error creating course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Course Name
        </label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
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
