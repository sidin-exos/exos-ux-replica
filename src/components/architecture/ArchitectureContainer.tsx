import React from "react";

interface ArchitectureContainerProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "dashed" | "solid" | "security";
  badge?: string;
  badgeIcon?: React.ReactNode;
}

const ArchitectureContainer: React.FC<ArchitectureContainerProps> = ({
  title,
  titleColor = "#f59e0b",
  children,
  className = "",
  variant = "dashed",
  badge,
  badgeIcon,
}) => {
  const isSecurityVariant = variant === "security";
  const borderStyle = isSecurityVariant
    ? `3px solid ${titleColor}`
    : `2px ${variant === "solid" ? "solid" : "dashed"} ${titleColor}40`;

  return (
    <div
      className={`relative rounded-xl p-6 pt-8 ${className}`}
      style={{
        border: borderStyle,
        backgroundColor: isSecurityVariant ? "rgba(254, 242, 242, 0.5)" : "rgba(255, 255, 255, 0.5)",
      }}
    >
      <div
        className="absolute -top-3 left-4 px-3 py-1 text-sm font-semibold rounded flex items-center gap-2"
        style={{ 
          color: titleColor, 
          backgroundColor: isSecurityVariant ? "#fef2f2" : "#fefce8" 
        }}
      >
        {badgeIcon}
        {title}
      </div>
      {badge && (
        <div
          className="absolute -top-3 right-4 px-2 py-1 text-[10px] font-bold uppercase rounded"
          style={{ 
            color: "#fff", 
            backgroundColor: titleColor 
          }}
        >
          {badge}
        </div>
      )}
      {children}
    </div>
  );
};

export default ArchitectureContainer;
