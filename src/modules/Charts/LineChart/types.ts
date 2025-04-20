import { DataPoint } from "@/types";

export interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  name?: string;
  showLegend?: boolean;
  className?: string;
}
