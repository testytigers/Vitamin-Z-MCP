import * as React from "react";
import { cn } from "@/lib/utils";

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  src?: string;
  alt?: string;
  fallback?: string;
}

function Avatar({ className, size = "md", src, alt, fallback, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-pill",
        "border-2 border-border-default bg-bg-secondary",
        avatarSizes[size],
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-text-secondary">
          {fallback || alt?.slice(0, 2).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}

export { Avatar };
export type { AvatarProps };
