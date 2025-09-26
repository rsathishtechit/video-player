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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Course</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Enter course name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Folder
          </label>
          <div className="flex space-x-3">
            <button
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedFolder ? "Change Folder" : "Select Folder"}
            </button>
            {selectedFolder && (
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                {selectedFolder}
              </div>
            )}
          </div>
        </div>

        {selectedFolder && courseName && (
          <button
            onClick={handleCreateCourse}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Course..." : "Create Course"}
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderSelector;
