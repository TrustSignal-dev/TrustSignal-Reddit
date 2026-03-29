interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
        N/A
      </span>
    );
  }

  const getColor = (s: number) => {
    if (s >= 70) return "bg-green-900/50 text-green-400 border-green-700";
    if (s >= 40) return "bg-amber-900/50 text-amber-400 border-amber-700";
    return "bg-red-900/50 text-red-400 border-red-700";
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${getColor(score)} ${sizeClasses[size]}`}
    >
      {score}
    </span>
  );
}
