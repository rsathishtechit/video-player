import React, { useState, useEffect } from "react";
import { CourseWithVideos, Video, VideoProgress } from "../database/schema";

interface ModernVideoPlayerProps {
  course: CourseWithVideos;
  onVideoSelect: (video: Video) => void;
  onBack: () => void;
  selectedVideo?: Video | null;
}

const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
  course,
  onVideoSelect,
  onBack,
  selectedVideo,
}) => {
  const [videoProgress, setVideoProgress] = useState<
    Map<number, VideoProgress>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadVideoProgress();
  }, [course.id]);

  useEffect(() => {
    // Auto-select the last watched video when course loads
    if (course.videos.length > 0 && !selectedVideo) {
      const lastWatchedVideo = findLastWatchedVideo();
      if (lastWatchedVideo) {
        onVideoSelect(lastWatchedVideo);
      }
    }
  }, [course, videoProgress, selectedVideo, onVideoSelect]);

  const loadVideoProgress = async () => {
    setLoading(true);
    try {
      const progressMap = new Map<VideoProgress>();

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

  const findLastWatchedVideo = (): Video | null => {
    if (videoProgress.size === 0) {
      // If no progress data, return the first video
      return course.videos[0] || null;
    }

    let lastWatchedVideo: Video | null = null;
    let latestTimestamp = 0;

    // Find the video with the most recent lastWatchedAt timestamp
    course.videos.forEach((video) => {
      const progress = getVideoProgress(video.id);
      if (progress && progress.lastWatchedAt) {
        const timestamp = new Date(progress.lastWatchedAt).getTime();
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          lastWatchedVideo = video;
        }
      }
    });

    // If no video has been watched, return the first incomplete video
    if (!lastWatchedVideo) {
      const firstIncompleteVideo = course.videos.find(
        (video) => !isVideoCompleted(video.id)
      );
      return firstIncompleteVideo || course.videos[0] || null;
    }

    // If the last watched video is completed, find the next incomplete video
    if (isVideoCompleted(lastWatchedVideo.id)) {
      const currentIndex = course.videos.findIndex(
        (v) => v.id === lastWatchedVideo!.id
      );
      const nextVideo = course.videos.find(
        (video, index) => index > currentIndex && !isVideoCompleted(video.id)
      );
      return nextVideo || lastWatchedVideo;
    }

    return lastWatchedVideo;
  };

  const getVideoIcon = (video: Video) => {
    const progress = getVideoProgress(video.id);
    const isCompleted = isVideoCompleted(video.id);

    if (isCompleted) {
      return <span className="text-green-400 text-xl">✅</span>;
    } else if (progress && progress.currentTime > 0) {
      return <span className="text-blue-400 text-xl">▶️</span>;
    } else {
      return <span className="text-gray-400 text-xl">⚪</span>;
    }
  };

  const handleResetVideoProgress = async (
    videoId: number,
    videoName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to reset progress for "${videoName}"?`
      )
    ) {
      try {
        await window.electronAPI.resetVideoProgress(videoId);
        await loadVideoProgress(); // Refresh progress data
      } catch (error) {
        console.error("Error resetting video progress:", error);
      }
    }
  };

  return (
    <div className="h-screen bg-black flex">
      {/* Video Player */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "mr-96" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-black/80 to-transparent backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{course.name}</h1>
              <p className="text-gray-400 text-sm">
                {course.completedVideos}/{course.totalVideos} videos completed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `Are you sure you want to reset all progress for "${course.name}"? This will mark all videos as unwatched.`
                  )
                ) {
                  window.electronAPI
                    .resetCourseProgress(course.id)
                    .then(() => {
                      loadVideoProgress();
                    })
                    .catch((error) => {
                      console.error("Error resetting course progress:", error);
                    });
                }
              }}
              className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg flex items-center space-x-1.5 text-yellow-400 hover:text-yellow-300 transition-all duration-200"
              title="Reset All Progress"
            >
              <span className="text-sm">↻</span>
              <span className="text-xs font-medium">Reset All</span>
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200"
            >
              {sidebarOpen ? "→" : "←"}
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          {selectedVideo ? (
            <div className="w-full max-w-5xl">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  key={selectedVideo.id}
                  controls
                  className="w-full h-full"
                  onLoadedMetadata={async (e) => {
                    const video = e.target as HTMLVideoElement;
                    try {
                      const progress =
                        await window.electronAPI.getVideoProgress(
                          selectedVideo.id
                        );
                      if (
                        progress &&
                        progress.currentTime > 0 &&
                        !progress.completed
                      ) {
                        video.currentTime = progress.currentTime;
                      }
                    } catch (error) {
                      console.error("Error loading video progress:", error);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const currentTime = video.currentTime;
                    const duration = video.duration;
                    const progressPercentage = (currentTime / duration) * 100;

                    if (Math.floor(currentTime) % 5 === 0) {
                      window.electronAPI.updateVideoProgress(
                        selectedVideo.id,
                        currentTime,
                        duration,
                        progressPercentage
                      );
                    }
                  }}
                >
                  <source
                    src={`http://localhost:3001/${encodeURIComponent(selectedVideo.filePath)}`}
                    type="video/mp4"
                  />
                </video>
              </div>

              {/* Video Info */}
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedVideo.fileName}
                </h2>
                <div className="flex items-center justify-center space-x-6 text-gray-400">
                  <span>
                    Duration: {formatDuration(selectedVideo.duration)}
                  </span>
                  <span>•</span>
                  <span>
                    Progress:{" "}
                    {getProgressPercentage(selectedVideo.id).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Select a video to start watching
              </h2>
              <p className="text-gray-400">
                Choose from the playlist on the right
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">
              Course Playlist
            </h3>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.totalProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {course.totalProgress.toFixed(1)}% Complete
            </p>
          </div>

          {/* Video List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {course.videos.map((video, index) => {
                  const progress = getVideoProgress(video.id);
                  const progressPercentage = getProgressPercentage(video.id);
                  const isCompleted = isVideoCompleted(video.id);
                  const isSelected = selectedVideo?.id === video.id;

                  return (
                    <div
                      key={video.id}
                      onClick={() => onVideoSelect(video)}
                      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-400/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          {getVideoIcon(video)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm mb-1 truncate">
                            {index + 1}. {video.fileName}
                            {progress &&
                              progress.currentTime > 0 &&
                              !progress.completed && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                                  Resume
                                </span>
                              )}
                          </h4>

                          <div className="text-xs text-gray-400 mb-2">
                            {formatDuration(video.duration)}
                          </div>

                          {progress && (
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>
                                  {progress.completed
                                    ? "Completed"
                                    : `${progressPercentage.toFixed(0)}% watched`}
                                </span>
                                <span>
                                  {formatDuration(progress.currentTime)} /{" "}
                                  {formatDuration(progress.duration)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full transition-all duration-300 ${
                                    progress.completed
                                      ? "bg-green-400"
                                      : "bg-blue-400"
                                  }`}
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reset Button */}
                        {progress &&
                          (progress.currentTime > 0 || progress.completed) && (
                            <button
                              onClick={(e) =>
                                handleResetVideoProgress(
                                  video.id,
                                  video.fileName,
                                  e
                                )
                              }
                              className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-full flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Reset Progress"
                            >
                              <span className="text-xs">↻</span>
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernVideoPlayer;
