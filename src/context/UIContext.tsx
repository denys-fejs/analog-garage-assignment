import React, { createContext, useContext, useState, useCallback } from "react";

import { Timeframe, TimeframeUnit } from "../types";

interface UIContextProps {
  sidebarOpen: boolean;
  availableTimeframes: Timeframe[];
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

// Predefined timeframes for the UI
export const DEFAULT_TIMEFRAMES: Timeframe[] = [
  { value: 10, unit: TimeframeUnit.Seconds, label: "10 seconds" },
  { value: 30, unit: TimeframeUnit.Seconds, label: "30 seconds" },
  { value: 1, unit: TimeframeUnit.Minutes, label: "1 minute" },
  { value: 5, unit: TimeframeUnit.Minutes, label: "5 minutes" },
  { value: 15, unit: TimeframeUnit.Minutes, label: "15 minutes" },
  { value: 30, unit: TimeframeUnit.Minutes, label: "30 minutes" }
];

// Default context value
const UIContext = createContext<UIContextProps | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Context value
  const value = {
    sidebarOpen,
    availableTimeframes: DEFAULT_TIMEFRAMES,
    toggleSidebar,
    activeTab,
    setActiveTab
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextProps => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
