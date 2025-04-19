import { FC } from "react";

import { useUI } from "@/context/UIContext";
import DataToggle from "@/components/MockData";
import ProducerSelector from "@/modules/Producer/ProducerSelector";

export const Sidebar: FC = () => {
  const { sidebarOpen, toggleSidebar } = useUI();

  const sidebarClass = sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-30 h-screen w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarClass}`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Control Panel</h2>

          <div className="mb-6">
            <ProducerSelector />
          </div>

          <div className="mb-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Settings
            </h3>
            <DataToggle className="mt-2" />
          </div>

          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Information
            </h3>

            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
              <p className="mb-2">
                <strong>About this app:</strong>
              </p>
              <p className="mb-2">
                This dashboard visualizes real-time data from multiple producers using WebSockets.
              </p>
              <p>Each producer generates random walk time series data at 1000 points per second.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
