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
  const [currentVideoProgress, setCurrentVideoProgress] = useState<{
    currentTime: number;
    duration: number;
    progressPercentage: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [powerInfo, setPowerInfo] = useState<{
    isOnBattery: boolean;
    systemIdleTime: number;
    thermalState: string;
  } | null>(null);
  const videoContainerRef = React.useRef<HTMLDivElement>(null);
  const timeUpdateThrottleRef = React.useRef(0);

  useEffect(() => {
    loadVideoProgress();
    loadPowerInfo();
  }, [course.id]);

  // Load power information for battery optimization
  const loadPowerInfo = async () => {
    try {
      const info = await window.electronAPI.getPowerInfo();
      setPowerInfo(info);
    } catch (error) {
      console.error("Error loading power info:", error);
    }
  };

  // Track if we've already initialized the video selection
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Auto-select the last watched video when course loads (only once)
    if (course.videos.length > 0 && !selectedVideo && !hasInitialized) {
      const lastWatchedVideo = findLastWatchedVideo();
      if (lastWatchedVideo) {
        onVideoSelect(lastWatchedVideo);
      }
      setHasInitialized(true);
    }
  }, [course, videoProgress, selectedVideo, onVideoSelect, hasInitialized]);

  // Clear current video progress when video selection changes
  useEffect(() => {
    setCurrentVideoProgress(null);
  }, [selectedVideo]);

  // Save progress when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (selectedVideo && currentVideoProgress) {
        window.electronAPI
          .updateVideoProgress(
            selectedVideo.id,
            currentVideoProgress.currentTime,
            currentVideoProgress.duration,
            currentVideoProgress.progressPercentage
          )
          .catch((error) => {
            console.error("Error saving progress on unmount:", error);
          });
      }

      // Save learning time when component unmounts
      saveCurrentSessionTime("component unmount");
    };
  }, [selectedVideo, currentVideoProgress, sessionStartTime]);

  // Track session start time and reset when video changes
  useEffect(() => {
    if (selectedVideo) {
      // Save previous session time if there was one
      saveCurrentSessionTime("video change");

      // Don't start timing until video actually plays
      console.log(
        "Ready to start learning session for:",
        selectedVideo.fileName
      );
    }
  }, [selectedVideo?.id]); // Only trigger when video ID changes

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }
      if (event.key === "Escape" && isFullscreen) {
        event.preventDefault();
        exitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
    if (seconds === 0 || isNaN(seconds)) {
      return "--:--";
    }

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
    // Use current progress if it's the selected video, otherwise use stored progress
    if (selectedVideo && selectedVideo.id === videoId && currentVideoProgress) {
      return currentVideoProgress.progressPercentage;
    }
    const progress = getVideoProgress(videoId);
    return progress ? progress.progressPercentage : 0;
  };

  const isVideoCompleted = (videoId: number): boolean => {
    // Use current progress if it's the selected video, otherwise use stored progress
    if (selectedVideo && selectedVideo.id === videoId && currentVideoProgress) {
      return currentVideoProgress.progressPercentage >= 90;
    }
    const progress = getVideoProgress(videoId);
    return progress ? progress.completed : false;
  };

  const getRealTimeCompletedVideos = (): number => {
    return course.videos.filter((video) => isVideoCompleted(video.id)).length;
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
    const isCurrentlyPlaying =
      selectedVideo && selectedVideo.id === video.id && currentVideoProgress;

    if (isCompleted) {
      return <span className="text-green-400 text-xl">✅</span>;
    } else if (isCurrentlyPlaying) {
      return <span className="text-blue-400 text-xl animate-pulse">▶️</span>;
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
        // Clear current video progress if it's the same video
        if (selectedVideo && selectedVideo.id === videoId) {
          setCurrentVideoProgress(null);
        }
      } catch (error) {
        console.error("Error resetting video progress:", error);
      }
    }
  };

  // Throttle database updates to avoid excessive calls - increased for battery optimization
  const lastSaveTime = React.useRef(0);
  const saveThrottleMs = 5000; // Save to database every 5 seconds (reduced frequency for battery)

  // Helper function to save current session time
  const saveCurrentSessionTime = async (reason: string) => {
    if (sessionStartTime) {
      const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      if (sessionTime > 5) {
        // Only save sessions longer than 5 seconds
        try {
          await window.electronAPI.addLearningTime(sessionTime);
          console.log(
            `Saved ${sessionTime} seconds of learning time (${reason})`
          );
        } catch (error) {
          console.error(`Error saving learning time on ${reason}:`, error);
        }
      }
      setSessionStartTime(null); // Reset session
    }
  };

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  const updateInstantProgress = async (
    currentTime: number,
    duration: number
  ) => {
    if (!selectedVideo) return;

    const progressPercentage = (currentTime / duration) * 100;
    const isCompleted = progressPercentage >= 90; // Mark as completed at 90%

    // Update local state immediately for instant UI feedback
    setCurrentVideoProgress({
      currentTime,
      duration,
      progressPercentage,
    });

    // Update the progress map for the sidebar
    const updatedProgress = new Map(videoProgress);
    const existingProgress = updatedProgress.get(selectedVideo.id);

    updatedProgress.set(selectedVideo.id, {
      id: existingProgress?.id || Date.now(),
      videoId: selectedVideo.id,
      currentTime,
      duration,
      progressPercentage,
      completed: isCompleted,
      lastWatchedAt: new Date().toISOString(),
    });

    setVideoProgress(updatedProgress);

    // Save to database (throttled to avoid too many calls)
    const now = Date.now();
    if (now - lastSaveTime.current >= saveThrottleMs) {
      lastSaveTime.current = now;
      try {
        await window.electronAPI.updateVideoProgress(
          selectedVideo.id,
          currentTime,
          duration,
          progressPercentage
        );
      } catch (error) {
        console.error("Error updating video progress:", error);
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
                {getRealTimeCompletedVideos()}/{course.totalVideos} videos
                completed
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
        <div className="flex-1 flex">
          {selectedVideo ? (
            <div className="w-full h-full">
              <div
                ref={videoContainerRef}
                className={`w-full h-full bg-black relative group ${
                  isFullscreen ? "rounded-none" : ""
                }`}
              >
                <video
                  key={selectedVideo.id}
                  controls
                  className="w-full h-full object-contain"
                  onLoadedMetadata={async (e) => {
                    if (!selectedVideo) return;
                    const video = e.target as HTMLVideoElement;

                    try {
                      // Update video duration if it's 0 (fallback from ffprobe failure)
                      if (
                        selectedVideo.duration === 0 &&
                        video.duration &&
                        !isNaN(video.duration)
                      ) {
                        await window.electronAPI.updateVideoDuration(
                          selectedVideo.id,
                          video.duration
                        );
                        // Update the local selectedVideo object
                        selectedVideo.duration = video.duration;
                        console.log(
                          `Updated video ${selectedVideo.fileName} duration to ${video.duration}s`
                        );

                        // Refresh course data to show updated duration in sidebar
                        try {
                          const updatedCourse =
                            await window.electronAPI.getCourseWithVideos(
                              course.id
                            );
                          // Find and update the video in the course
                          const videoIndex = course.videos.findIndex(
                            (v) => v.id === selectedVideo.id
                          );
                          if (videoIndex !== -1) {
                            course.videos[videoIndex].duration = video.duration;
                          }
                        } catch (refreshError) {
                          console.warn(
                            "Could not refresh course data:",
                            refreshError
                          );
                        }
                      }

                      // Load and set video progress
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
                      console.error("Error loading video metadata:", error);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (video.duration && !isNaN(video.duration)) {
                      // Adaptive throttling based on battery status
                      const now = Date.now();
                      const throttleInterval = powerInfo?.isOnBattery
                        ? 2000
                        : 1000; // Less frequent updates on battery

                      if (
                        now - timeUpdateThrottleRef.current >=
                        throttleInterval
                      ) {
                        timeUpdateThrottleRef.current = now;
                        updateInstantProgress(
                          video.currentTime,
                          video.duration
                        );
                      }
                    }
                  }}
                  onPlay={() => {
                    // Start timing when video plays
                    if (!sessionStartTime) {
                      setSessionStartTime(Date.now());
                      console.log("Started learning session - video playing");
                    }
                    // Notify main process about video playing for power management
                    window.electronAPI.videoPlaying(true).catch(console.error);
                  }}
                  onPause={() => {
                    // Save current session time when paused
                    saveCurrentSessionTime("video paused");
                    // Notify main process about video paused for power management
                    window.electronAPI.videoPlaying(false).catch(console.error);
                  }}
                  onEnded={() => {
                    // Save session time when video completes
                    saveCurrentSessionTime("video completed");
                    // Notify main process about video ended for power management
                    window.electronAPI.videoPlaying(false).catch(console.error);
                  }}
                  onSeeking={() => {
                    // Don't count seeking time, pause current session
                    if (sessionStartTime) {
                      saveCurrentSessionTime("video seeking");
                    }
                  }}
                  onSeeked={() => {
                    // Resume timing after seeking
                    setSessionStartTime(Date.now());
                    console.log("Resumed learning session after seeking");
                  }}
                >
                  <source
                    src={`http://localhost:3000/${encodeURIComponent(selectedVideo.filePath)}`}
                    type="video/mp4"
                  />
                </video>

                {/* Fullscreen Button Overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={toggleFullscreen}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200"
                    title="Fullscreen (F)"
                  >
                    {isFullscreen ? "⛶" : "⛶"}
                  </button>
                </div>

                {/* Fullscreen Hint */}
                {!isFullscreen && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Press F for fullscreen
                    </div>
                  </div>
                )}
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
                            <div>{formatDuration(video.duration)}</div>
                            {video.width && video.height && (
                              <div className="text-xs text-gray-500">
                                {video.width}x{video.height}
                                {video.codec &&
                                  ` • ${video.codec.toUpperCase()}`}
                              </div>
                            )}
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
                                  {selectedVideo &&
                                  selectedVideo.id === video.id &&
                                  currentVideoProgress
                                    ? `${formatDuration(currentVideoProgress.currentTime)} / ${formatDuration(currentVideoProgress.duration)}`
                                    : `${formatDuration(progress.currentTime)} / ${formatDuration(progress.duration)}`}
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
