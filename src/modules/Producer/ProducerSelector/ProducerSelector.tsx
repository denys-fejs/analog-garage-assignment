import { FC } from "react";

import { Card } from "@/components";
import { useData } from "@/context/DataContext";

//ProducerSelector component for toggling data producers
const ProducerSelector: FC = () => {
  const { producers, activeProducers, toggleProducer } = useData();

  return (
    <Card title="Data Producers">
      <div className="space-y-2">
        {producers.map(producer => (
          <div key={producer.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`producer-${producer.id}`}
              checked={activeProducers.includes(producer.id)}
              onChange={() => toggleProducer(producer.id)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor={`producer-${producer.id}`} className="ml-2 text-sm flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: producer.color }}
              />
              {producer.name}
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          className="text-sm text-blue-500 hover:text-blue-700"
          onClick={() =>
            producers.forEach(p => {
              if (!activeProducers.includes(p.id)) {
                toggleProducer(p.id);
              }
            })
          }
        >
          Select All
        </button>

        <button
          className="text-sm text-blue-500 hover:text-blue-700"
          onClick={() =>
            producers.forEach(p => {
              if (activeProducers.includes(p.id)) {
                toggleProducer(p.id);
              }
            })
          }
        >
          Deselect All
        </button>
      </div>
    </Card>
  );
};

export default ProducerSelector;
