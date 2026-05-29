import React from "react";
import clsx from "clsx";

interface EntityAvatarProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const EntityAvatar = ({ name, color, size = "md", className }: EntityAvatarProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };

  return (
    <div
      className={clsx(
        "flex shrink-0 aspect-square items-center justify-center rounded-xl font-bold text-white shadow-inner ring-1 ring-white/20",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color || "#3C50E0" }}
    >
      {initials}
    </div>
  );
};

export default EntityAvatar;
