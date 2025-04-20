import { DataPoint, Producer } from "@/types";

export interface MultiSeriesChartProps {
  dataSeries: Record<string, DataPoint[]>;
  producers: Producer[];
  height?: number;
  className?: string;
  showBrush?: boolean;
}
