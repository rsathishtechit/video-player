import React from "react";

const LibraryPage: React.FC = () => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📚</div>
      <h1 className="text-3xl font-bold text-white mb-4">Library</h1>
      <p className="text-gray-400 text-lg">
        Browse and manage your video library
      </p>
      <div className="mt-8 text-gray-500">
        <p>This feature is coming soon!</p>
        <p className="text-sm mt-2">
          You'll be able to browse all your videos across all courses here.
        </p>
      </div>
    </div>
  );
};

export default LibraryPage;
