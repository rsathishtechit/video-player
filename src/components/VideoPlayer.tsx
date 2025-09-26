import React, { useState, useEffect } from "react";
import { CourseWithVideos, Video, VideoProgress } from "../database/schema";

interface VideoPlayerProps {
  course: CourseWithVideos;
  onVideoSelect: (video: Video) => void;
  onBack: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  course,
  onVideoSelect,
  onBack,
}) => {
  const [videoProgress, setVideoProgress] = useState<
    Map<number, VideoProgress>
  >(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVideoProgress();
  }, [course.id]);

  const loadVideoProgress = async () => {
    setLoading(true);
    try {
      const progressMap = new Map<number, VideoProgress>();

      for (const video of course.videos) {
        try {
          const progress = await window.electronAPI.getVideoProgress(video.id);
          if (progress) {
            progressMap.set(video.id, progress);
          }
        } catch (error) {
          console.error(`Error loading progress for video ${video.id}:`, error);
        }
      }

      setVideoProgress(progressMap);
    } catch (error) {
      console.error("Error loading video progress:", error);
    } finally {
      setLoading(false);
    }
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVideoProgress = (videoId: number): VideoProgress | null => {
    return videoProgress.get(videoId) || null;
  };

  const getProgressPercentage = (videoId: number): number => {
    const progress = getVideoProgress(videoId);
    return progress ? progress.progressPercentage : 0;
  };

  const isVideoCompleted = (videoId: number): boolean => {
    const progress = getVideoProgress(videoId);
    return progress ? progress.completed : false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
            <p className="text-gray-600 mt-1">
              {course.completedVideos} of {course.totalVideos} videos completed
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ← Back to Courses
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${course.totalProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          Overall Progress: {course.totalProgress.toFixed(1)}%
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Videos</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {course.videos.map((video, index) => {
            const progress = getVideoProgress(video.id);
            const progressPercentage = getProgressPercentage(video.id);
            const isCompleted = isVideoCompleted(video.id);

            return (
              <div
                key={video.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onVideoSelect(video)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      {isCompleted ? (
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : progress && progress.currentTime > 0 ? (
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {index + 1}. {video.fileName}
                        {progress &&
                          progress.currentTime > 0 &&
                          !progress.completed && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Resume
                            </span>
                          )}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDuration(video.duration)}</span>
                        <span>{formatFileSize(video.fileSize)}</span>
                      </div>
                    </div>

                    {progress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>
                            {progress.completed
                              ? "Completed"
                              : `${progressPercentage.toFixed(1)}% watched`}
                          </span>
                          <span>
                            {formatDuration(progress.currentTime)} /{" "}
                            {formatDuration(progress.duration)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.completed
                                ? "bg-green-600"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
