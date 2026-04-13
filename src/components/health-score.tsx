"use client";

import { type HealthStatus } from "@/lib/types";
import { getHealthColor } from "@/lib/scoring";

interface HealthScoreProps {
  score: number;
  status: HealthStatus;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { outer: 48, stroke: 4, fontSize: "text-xs" },
  md: { outer: 72, stroke: 5, fontSize: "text-lg" },
  lg: { outer: 120, stroke: 6, fontSize: "text-3xl" },
};

export function HealthScore({ score, status, size = "md" }: HealthScoreProps) {
  const { outer, stroke, fontSize } = sizeMap[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getHealthColor(status);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={outer} height={outer} className="-rotate-90">
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="rgba(34,34,34,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span
        className={`absolute font-bold ${fontSize}`}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const color = getHealthColor(status);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `${color}20`,
        color,
      }}
    >
      {status}
    </span>
  );
}
