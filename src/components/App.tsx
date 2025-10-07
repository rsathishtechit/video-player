import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import DashboardPage from "../pages/DashboardPage";
import CoursesPage from "../pages/CoursesPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import LibraryPage from "../pages/LibraryPage";
import SettingsPage from "../pages/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Course detail page without layout (full screen video player) */}
        <Route path="/course/:courseId" element={<CourseDetailPage />} />

        {/* All other pages with layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          }
        />

        {/* Catch-all route for any unmatched paths */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
