import React from "react";

export const Speedometer = ({
  value,
  min,
  max,
  label,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
}) => {
  const percentage = (value - min) / (max - min);
  const rotation = percentage * 180 - 90;

  return (
    <div className="relative w-64 h-32 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* Speedometer background */}
        <path
          d="M 5 50 A 45 45 0 1 1 95 50"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
        />
        {/* Speedometer value */}
        <path
          d="M 5 50 A 45 45 0 1 1 95 50"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeDasharray={`${percentage * 141.37} 141.37`}
        />
        {/* Needle */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="5"
          stroke="#1f2937"
          strokeWidth="2"
          transform={`rotate(${rotation}, 50, 50)`}
        />
        <circle cx="50" cy="50" r="3" fill="#1f2937" />
      </svg>
      <div className="absolute left-0 right-0 text-center text-sm font-bold truncate px-2 pt-2">
        {label} - {value} tokens/s
      </div>
    </div>
  );
};
