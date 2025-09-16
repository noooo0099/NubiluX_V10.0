import { Gamepad2, RefreshCcw, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  variant?: "spinner" | "pulse" | "gaming" | "dots" | "progress";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loading({ 
  variant = "gaming", 
  size = "md", 
  text,
  className 
}: LoadingProps) {
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  // Gaming-style spinner with glow effect
  if (variant === "gaming") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)} data-testid="loading-gaming">
        <div className="relative">
          {/* Outer ring with rotating glow */}
          <div className={cn(
            "absolute inset-0 rounded-full animate-spin",
            "border-2 border-transparent border-t-nxe-primary border-r-nxe-accent",
            "shadow-[0_0_20px_rgba(19,77,55,0.5)]",
            sizeClasses[size]
          )} />
          
          {/* Inner gaming icon */}
          <div className={cn(
            "relative rounded-full bg-nxe-surface/80 backdrop-blur-sm",
            "flex items-center justify-center animate-pulse-glow",
            "border border-nxe-primary/30",
            sizeClasses[size]
          )}>
            <Gamepad2 className={cn(
              "text-nxe-accent animate-pulse",
              size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"
            )} />
          </div>
          
          {/* Rotating energy rings */}
          <div className={cn(
            "absolute inset-0 rounded-full animate-spin border border-nxe-accent/20",
            "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
            sizeClasses[size]
          )} style={{ animationDirection: "reverse", animationDuration: "3s" }} />
        </div>
        
        {text && (
          <p className={cn(
            "text-center text-nxe-accent font-medium animate-pulse",
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Minimalist spinner
  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2", className)} data-testid="loading-spinner">
        <RefreshCcw className={cn(
          "animate-spin text-nxe-primary",
          sizeClasses[size]
        )} />
        {text && (
          <p className={cn("text-gray-400", textSizeClasses[size])}>{text}</p>
        )}
      </div>
    );
  }

  // Pulse animation with shield icon
  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)} data-testid="loading-pulse">
        <div className="relative">
          <Shield className={cn(
            "text-nxe-primary animate-pulse",
            sizeClasses[size]
          )} />
          
          {/* Pulsing circles */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-0 rounded-full border-2 border-nxe-accent/30 animate-ping",
                sizeClasses[size]
              )}
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: "2s"
              }}
            />
          ))}
        </div>
        
        {text && (
          <p className={cn("text-nxe-accent", textSizeClasses[size])}>{text}</p>
        )}
      </div>
    );
  }

  // Gaming dots loading
  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)} data-testid="loading-dots">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-nxe-accent animate-bounce",
                size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
              )}
              style={{ 
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1.4s"
              }}
            />
          ))}
        </div>
        
        {text && (
          <p className={cn("text-gray-400", textSizeClasses[size])}>{text}</p>
        )}
      </div>
    );
  }

  // Gaming-style progress bar
  if (variant === "progress") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 w-full max-w-xs", className)} data-testid="loading-progress">
        <Zap className={cn(
          "text-nxe-accent animate-pulse",
          sizeClasses[size]
        )} />
        
        {/* Progress bar container */}
        <div className="w-full bg-nxe-surface rounded-full border border-nxe-primary/30 overflow-hidden">
          <div 
            className="h-2 bg-gradient-to-r from-nxe-primary via-nxe-accent to-nxe-primary bg-[length:200%_100%] animate-progress-slide animate-pulse rounded-full"
          />
        </div>
        
        {text && (
          <p className={cn("text-center text-nxe-accent font-medium", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={cn("flex items-center justify-center", className)} data-testid="loading-default">
      <RefreshCcw className={cn("animate-spin text-nxe-primary", sizeClasses[size])} />
    </div>
  );
}

// Full screen loading overlay
interface LoadingOverlayProps {
  show: boolean;
  variant?: LoadingProps['variant'];
  text?: string;
  blur?: boolean;
}

export function LoadingOverlay({ 
  show, 
  variant = "gaming", 
  text = "Memuat...", 
  blur = true 
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-nxe-dark/80",
        blur && "backdrop-blur-sm"
      )}
      data-testid="loading-overlay"
    >
      <div className="text-center">
        <Loading variant={variant} size="lg" text={text} />
      </div>
    </div>
  );
}

// Loading skeleton for cards
interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)} data-testid="loading-skeleton">
      <div className="h-4 bg-nxe-surface rounded-md w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-3 bg-nxe-surface rounded-md"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}