import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = async (page: string, data?: any) => {
    switch (page) {
      case "courses":
        navigate("/courses");
        break;
      case "course-detail":
        if (data) {
          // Update access time when navigating to course from dashboard
          try {
            await window.electronAPI.updateCourseAccessTime(data.id);
          } catch (error) {
            console.warn("Could not update course access time:", error);
            // Continue navigation even if access time update fails
          }
          navigate(`/course/${data.id}`);
        }
        break;
      case "library":
        navigate("/library");
        break;
      case "settings":
        navigate("/settings");
        break;
      default:
        navigate("/");
        break;
    }
  };

  return <Dashboard onNavigate={handleNavigation} />;
};

export default DashboardPage;
