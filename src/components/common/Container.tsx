import React from "react";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
}

const maxWidthMap: Record<NonNullable<ContainerProps["maxWidth"]>, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

export const Container: React.FC<ContainerProps> = React.memo(({
  children,
  className = "",
  maxWidth = "6xl",
}) => {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthMap[maxWidth]} ${className}`}>
      {children}
    </div>
  );
});

Container.displayName = "Container";
