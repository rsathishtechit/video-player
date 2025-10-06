import React from "react";
import PowerSettings from "../components/PowerSettings";

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Power Management */}
        <PowerSettings />
        {/* Video Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Video Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Auto-play next video</h3>
                <p className="text-gray-400 text-sm">
                  Automatically play the next video when current one ends
                </p>
              </div>
              <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">
                  Remember playback speed
                </h3>
                <p className="text-gray-400 text-sm">
                  Save your preferred playback speed for each video
                </p>
              </div>
              <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Progress Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">
                  Mark as complete threshold
                </h3>
                <p className="text-gray-400 text-sm">
                  Percentage watched to mark video as complete
                </p>
              </div>
              <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white">
                <option value="90">90%</option>
                <option value="95">95%</option>
                <option value="100">100%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all duration-200">
              <div className="text-left">
                <h3 className="text-red-400 font-medium">Reset All Progress</h3>
                <p className="text-red-400/70 text-sm">
                  Clear all video progress and start fresh
                </p>
              </div>
              <span className="text-red-400 text-xl">⚠️</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl border border-yellow-500/20 transition-all duration-200">
              <div className="text-left">
                <h3 className="text-yellow-400 font-medium">Export Data</h3>
                <p className="text-yellow-400/70 text-sm">
                  Export your courses and progress data
                </p>
              </div>
              <span className="text-yellow-400 text-xl">📤</span>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">About</h2>
          <div className="space-y-2 text-gray-400">
            <p>
              <strong className="text-white">Video Player</strong> v1.0.0
            </p>
            <p>Built with Electron, React, and TypeScript</p>
            <p>© 2024 Video Player App</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
