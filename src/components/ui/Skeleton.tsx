import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  delayMs?: number;
}

const roundedMap = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  rounded = "md",
  delayMs = 0,
  style,
  ...props
}) => {
  return (
    <div
      className={`bg-surface-border/40 relative overflow-hidden ${roundedMap[rounded]} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    >
      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.08) 50%, transparent 100%)",
          animation: `skeleton-shimmer 1.2s ease-in-out infinite ${delayMs}ms`,
        }}
      />
    </div>
  );
};
