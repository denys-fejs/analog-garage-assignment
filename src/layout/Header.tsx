import { FC } from "react";

import { ServerStatus } from "@/modules";
import { useUI } from "@/context/UIContext";

export const Header: FC = () => {
  const { toggleSidebar } = useUI();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <h1 className="text-xl font-bold text-gray-800">Real-time Data Visualization</h1>
        </div>

        <div className="flex items-center">
          <ServerStatus />
        </div>
      </div>
    </header>
  );
};
