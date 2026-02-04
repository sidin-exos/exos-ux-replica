import React from "react";

interface ArchitectureContainerProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "dashed" | "solid";
}

const ArchitectureContainer: React.FC<ArchitectureContainerProps> = ({
  title,
  titleColor = "#f59e0b",
  children,
  className = "",
  variant = "dashed",
}) => {
  return (
    <div
      className={`relative rounded-xl p-6 pt-8 ${className}`}
      style={{
        border: `2px ${variant} ${titleColor}40`,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
      }}
    >
      <div
        className="absolute -top-3 left-4 px-3 py-1 text-sm font-semibold rounded"
        style={{ color: titleColor, backgroundColor: "#fefce8" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

export default ArchitectureContainer;
