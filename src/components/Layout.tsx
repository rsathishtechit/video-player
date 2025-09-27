import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "courses", label: "Courses", icon: "🎓" },
    { id: "library", label: "Library", icon: "📚" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

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
                    onClick={() => onNavigate(item.id)}
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
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
