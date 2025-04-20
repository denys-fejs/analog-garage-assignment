import { Timeframe } from "@/types";

export interface UIContextProps {
  sidebarOpen: boolean;
  availableTimeframes: Timeframe[];
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
}
