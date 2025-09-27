import React, { useState, useEffect } from "react";
import { CourseWithVideos } from "../database/schema";

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<CourseWithVideos[]>([]);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalVideos: 0,
    completedVideos: 0,
    totalWatchTime: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const coursesData = await window.electronAPI.getAllCourses();
      setCourses(coursesData);

      // Calculate stats
      const totalCourses = coursesData.length;
      const totalVideos = coursesData.reduce(
        (acc, course) => acc + course.totalVideos,
        0
      );
      const completedVideos = coursesData.reduce(
        (acc, course) => acc + course.completedVideos,
        0
      );
      const totalWatchTime = coursesData.reduce(
        (acc, course) =>
          acc +
          course.videos.reduce(
            (videoAcc, video) => videoAcc + video.duration,
            0
          ),
        0
      );

      setStats({
        totalCourses,
        totalVideos,
        completedVideos,
        totalWatchTime,
      });

      // Get recent videos with progress (for continue watching)
      const videosWithProgress = [];
      for (const course of coursesData) {
        for (const video of course.videos) {
          try {
            const progress = await window.electronAPI.getVideoProgress(video.id);
            if (progress && progress.currentTime > 0 && !progress.completed) {
              videosWithProgress.push({
                ...video,
                courseName: course.name,
                courseId: course.id,
                progress,
                lastWatchedAt: progress.lastWatchedAt,
              });
            }
          } catch (error) {
            console.error(`Error loading progress for video ${video.id}:`, error);
          }
        }
      }
      
      // Sort by most recently watched
      videosWithProgress.sort((a, b) => 
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      );
      
      setRecentVideos(videosWithProgress.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const StatCard = ({ title, value, subtitle, icon, gradient }: any) => (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-white/60 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-4xl opacity-20">{icon}</div>
        </div>
      </div>
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome back! 👋</h1>
        <p className="text-gray-300 text-lg">
          Here's what's happening with your learning journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon="🎓"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          icon="🎬"
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Completed"
          value={stats.completedVideos}
          subtitle={`${stats.totalVideos > 0 ? Math.round((stats.completedVideos / stats.totalVideos) * 100) : 0}% complete`}
          icon="✅"
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Watch Time"
          value={formatTime(stats.totalWatchTime)}
          icon="⏱️"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Courses */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Courses</h2>
            <button
              onClick={() => onNavigate("courses")}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                onClick={() => onNavigate("course-detail", course)}
                className="flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-bold">🎓</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{course.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {course.completedVideos}/{course.totalVideos} videos
                    completed
                  </p>
                </div>
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300"
                    style={{ width: `${course.totalProgress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Quick Actions
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => onNavigate("courses")}
              className="w-full flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              <span className="text-2xl mr-4">➕</span>
              <div className="text-left">
                <div className="text-white font-medium">Add New Course</div>
                <div className="text-white/80 text-sm">
                  Import videos from a folder
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("library")}
              className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
            >
              <span className="text-2xl mr-4">📚</span>
              <div className="text-left">
                <div className="text-white font-medium">Browse Library</div>
                <div className="text-gray-400 text-sm">
                  Explore all your content
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("settings")}
              className="w-full flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
            >
              <span className="text-2xl mr-4">⚙️</span>
              <div className="text-left">
                <div className="text-white font-medium">Settings</div>
                <div className="text-gray-400 text-sm">
                  Customize your experience
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Continue Watching */}
      {recentVideos.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Continue Watching
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mb-1 truncate">
                    {video.fileName}
                  </h3>
                  <p className="text-gray-400 text-xs">{video.courseName}</p>
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">▶️</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
