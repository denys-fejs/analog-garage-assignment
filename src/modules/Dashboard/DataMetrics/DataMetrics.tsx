import { FC, useMemo } from "react";

import { DataPoint } from "../../../types";
import { Card } from "../../../components";
import { calculateMetrics, formatDuration } from "../../../utils";

interface DataMetricsProps {
  data: DataPoint[];
  producerName: string;
  color?: string;
  className?: string;
}

// DataMetrics component for displaying statistical metrics
const DataMetrics: FC<DataMetricsProps> = ({ data, producerName, className = "" }) => {
  // Calculate metrics from data
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  return (
    <Card
      title={`${producerName} Metrics`}
      className={className}
      headerActions={
        <span className="text-sm text-gray-500">{metrics.count.toLocaleString()} points</span>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm text-gray-500">Min Value</h4>
          <p className="text-lg font-semibold">{metrics.min.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="text-sm text-gray-500">Max Value</h4>
          <p className="text-lg font-semibold">{metrics.max.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="text-sm text-gray-500">Average</h4>
          <p className="text-lg font-semibold">{metrics.average.toFixed(2)}</p>
        </div>

        <div>
          <h4 className="text-sm text-gray-500">Standard Deviation</h4>
          <p className="text-lg font-semibold">{metrics.standardDeviation.toFixed(2)}</p>
        </div>

        <div className="col-span-2">
          <h4 className="text-sm text-gray-500">Duration</h4>
          <p className="text-lg font-semibold">{formatDuration(metrics.duration)}</p>
        </div>
      </div>
    </Card>
  );
};

export default DataMetrics;
