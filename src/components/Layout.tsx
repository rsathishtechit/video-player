import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
    { id: "courses", label: "Courses", icon: "🎓", path: "/courses" },
    { id: "library", label: "Library", icon: "📚", path: "/library" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "dashboard";
    if (path.startsWith("/course/")) return "courses";
    if (path === "/courses") return "courses";
    if (path === "/library") return "library";
    if (path === "/settings") return "settings";
    return "dashboard";
  };

  const currentPage = getCurrentPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">VP</span>
            </div>
            <span className="ml-3 text-white font-semibold text-xl">
              Video Player
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      currentPage === item.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-xl mr-3">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              Video Player v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="min-h-screen">
          <div className="p-6">
            <Breadcrumb />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
