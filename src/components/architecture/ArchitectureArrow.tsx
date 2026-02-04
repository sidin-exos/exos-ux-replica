import React from "react";

interface ArchitectureArrowProps {
  direction: "right" | "down" | "left" | "up";
  length?: number;
  label?: string;
  className?: string;
  dashed?: boolean;
}

const ArchitectureArrow: React.FC<ArchitectureArrowProps> = ({
  direction,
  length = 40,
  label,
  className = "",
  dashed = false,
}) => {
  const isHorizontal = direction === "right" || direction === "left";
  const isReverse = direction === "left" || direction === "up";

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: isHorizontal ? length : "auto",
        height: !isHorizontal ? length : "auto",
        flexDirection: isHorizontal ? "row" : "column",
      }}
    >
      {label && (
        <span className="text-[10px] text-gray-500 absolute -top-4 whitespace-nowrap">
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
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray={dashed ? "4,4" : "none"}
            />
            <polygon
              points={`${length - 8},5 ${length},10 ${length - 8},15`}
              fill="#64748b"
            />
          </>
        ) : (
          <>
            <line
              x1="10"
              y1="0"
              x2="10"
              y2={length - 8}
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray={dashed ? "4,4" : "none"}
            />
            <polygon
              points={`5,${length - 8} 10,${length} 15,${length - 8}`}
              fill="#64748b"
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default ArchitectureArrow;
