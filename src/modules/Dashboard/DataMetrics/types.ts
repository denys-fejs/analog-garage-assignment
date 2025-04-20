import { DataPoint } from "@/types";

export interface DataMetricsProps {
  data: DataPoint[];
  producerName: string;
  color?: string;
  className?: string;
}
