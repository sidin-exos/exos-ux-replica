import React from "react";

interface ArchitectureArrowProps {
  direction: "right" | "down" | "left" | "up";
  length?: number;
  label?: string;
  labelPosition?: "top" | "bottom" | "left" | "right";
  className?: string;
  dashed?: boolean;
  color?: string;
}

const ArchitectureArrow: React.FC<ArchitectureArrowProps> = ({
  direction,
  length = 40,
  label,
  labelPosition = "top",
  className = "",
  dashed = false,
  color = "#64748b",
}) => {
  const isHorizontal = direction === "right" || direction === "left";
  const isReverse = direction === "left" || direction === "up";

  const getLabelPositionClasses = () => {
    switch (labelPosition) {
      case "top":
        return "-top-5 left-1/2 -translate-x-1/2";
      case "bottom":
        return "-bottom-5 left-1/2 -translate-x-1/2";
      case "left":
        return "top-1/2 -translate-y-1/2 -left-2 -translate-x-full";
      case "right":
        return "top-1/2 -translate-y-1/2 -right-2 translate-x-full";
      default:
        return "-top-5 left-1/2 -translate-x-1/2";
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: isHorizontal ? length : "auto",
        height: !isHorizontal ? length : "auto",
        flexDirection: isHorizontal ? "row" : "column",
      }}
    >
      {label && (
        <span 
          className={`absolute text-[9px] font-medium text-gray-600 whitespace-nowrap bg-white/80 px-1 rounded ${getLabelPositionClasses()}`}
        >
          {label}
        </span>
      )}
      <svg
        width={isHorizontal ? length : 20}
        height={isHorizontal ? 20 : length}
        className={isReverse ? "rotate-180" : ""}
      >
        {isHorizontal ? (
          <>
            <line
              x1="0"
              y1="10"
              x2={length - 8}
              y2="10"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={dashed ? "4,4" : "none"}
            />
            <polygon
              points={`${length - 8},5 ${length},10 ${length - 8},15`}
              fill={color}
            />
          </>
        ) : (
          <>
            <line
              x1="10"
              y1="0"
              x2="10"
              y2={length - 8}
              stroke={color}
              strokeWidth="2"
              strokeDasharray={dashed ? "4,4" : "none"}
            />
            <polygon
              points={`5,${length - 8} 10,${length} 15,${length - 8}`}
              fill={color}
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default ArchitectureArrow;
