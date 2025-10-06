import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumb items based on current path if not provided
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items;

    const path = location.pathname;
    const breadcrumbItems: BreadcrumbItem[] = [
      { label: "Dashboard", path: "/" }
    ];

    if (path === "/courses") {
      breadcrumbItems.push({ label: "Courses" });
    } else if (path.startsWith("/course/")) {
      breadcrumbItems.push({ label: "Courses", path: "/courses" });
      breadcrumbItems.push({ label: "Course Details" });
    } else if (path === "/library") {
      breadcrumbItems.push({ label: "Library" });
    } else if (path === "/settings") {
      breadcrumbItems.push({ label: "Settings" });
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = getBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb for single items
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-500 mx-2">
              <svg
                className="w-4 h-4"
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
            </span>
          )}
          {item.path ? (
            <button
              onClick={() => navigate(item.path!)}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-300">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
