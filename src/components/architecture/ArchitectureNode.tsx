import React from "react";

interface ArchitectureNodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  number?: number;
  className?: string;
}

const ArchitectureNode: React.FC<ArchitectureNodeProps> = ({
  icon,
  label,
  sublabel,
  color,
  number,
  className = "",
}) => {
  return (
    <div className={`relative flex flex-col items-center gap-1 ${className}`}>
      {number !== undefined && (
        <div 
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-10"
          style={{ backgroundColor: color }}
        >
          {number}
        </div>
      )}
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center shadow-md"
        style={{ backgroundColor: color }}
      >
        <div className="text-white text-2xl">{icon}</div>
      </div>
      <span className="text-xs font-medium text-gray-700 text-center max-w-20 leading-tight">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-gray-500 text-center max-w-20 leading-tight">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default ArchitectureNode;
