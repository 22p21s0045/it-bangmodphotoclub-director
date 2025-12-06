import { Check, Circle, Clock, Loader2, Upload, Camera, CheckCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import React from "react";

export enum EventStatus {
  UPCOMING = "UPCOMING",
  PENDING_RAW = "PENDING_RAW",
  PENDING_EDIT = "PENDING_EDIT",
  COMPLETED = "COMPLETED",
}

interface EventStatusStepperProps {
  currentStatus: string;
  className?: string;
}

export function EventStatusStepper({ currentStatus, className }: EventStatusStepperProps) {
  const steps = [
    {
      id: EventStatus.UPCOMING,
      label: "เปิดรับ",
      subLabel: "รับสมัครช่างภาพ",
      icon: Circle,
      color: "blue",
    },
    {
      id: EventStatus.PENDING_RAW,
      label: "รอไฟล์ RAW",
      subLabel: "อัปโหลดรูปต้นฉบับ",
      icon: Upload,
      color: "orange",
    },
    {
      id: EventStatus.PENDING_EDIT,
      label: "รอแต่งรูป",
      subLabel: "ตกแต่งและปรับแก้",
      icon: Camera,
      color: "purple",
    },
    {
      id: EventStatus.COMPLETED,
      label: "เสร็จสิ้น",
      subLabel: "ส่งมอบงานแล้ว",
      icon: CheckCircle,
      color: "green",
    },
  ];

  const getCurrentStepIndex = (status: string) => {
    return steps.findIndex((step) => step.id === status);
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);

  const getStepColors = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
      blue: {
        bg: isActive ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-500",
        text: "text-blue-600 dark:text-blue-400",
        glow: "shadow-blue-500/30",
      },
      orange: {
        bg: isActive ? "bg-orange-500" : "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-500",
        text: "text-orange-600 dark:text-orange-400",
        glow: "shadow-orange-500/30",
      },
      purple: {
        bg: isActive ? "bg-purple-500" : "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-500",
        text: "text-purple-600 dark:text-purple-400",
        glow: "shadow-purple-500/30",
      },
      green: {
        bg: isActive ? "bg-green-500" : "bg-green-100 dark:bg-green-900/30",
        border: "border-green-500",
        text: "text-green-600 dark:text-green-400",
        glow: "shadow-green-500/30",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex items-start justify-between relative px-8">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-[60px] right-[60px] h-1 bg-muted rounded-full" />
        
        {/* Progress Line Fill */}
        <div 
          className="absolute top-6 left-[60px] h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${(currentStepIndex / (steps.length - 1)) * (100 - (120 / 8))}%`,
            maxWidth: 'calc(100% - 120px)'
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;
          const colors = getStepColors(step.color, isCompleted || isCurrent);

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              {/* Icon Circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ease-out",
                  isCompleted || isCurrent
                    ? `${colors.bg} text-white shadow-lg ${colors.glow}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {/* Pulse for current */}
                {isCurrent && (
                  <span className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-30",
                    colors.bg
                  )} />
                )}
                
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                )}
              </div>

              {/* Labels */}
              <div className="mt-3 text-center">
                <div className={cn(
                  "font-semibold text-sm transition-colors duration-300",
                  isCompleted || isCurrent ? colors.text : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                <div className={cn(
                  "text-xs mt-0.5 transition-opacity duration-300",
                  isCurrent ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {step.subLabel}
                </div>
                {isCurrent && (
                  <div className={cn(
                    "mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full inline-block",
                    colors.bg,
                    "text-white"
                  )}>
                    กำลังดำเนินการ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;
          const Icon = step.icon;
          const colors = getStepColors(step.color, isCompleted || isCurrent);

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical Line */}
              {!isLast && (
                <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-muted">
                  <div 
                    className={cn(
                      "w-full transition-all duration-500",
                      index < currentStepIndex ? "h-full bg-gradient-to-b from-blue-500 to-green-500" : "h-0"
                    )}
                  />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 transition-all duration-500",
                  isCompleted || isCurrent
                    ? `${colors.bg} text-white shadow-md ${colors.glow}`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCurrent && (
                  <span className={cn("absolute inset-0 rounded-full animate-ping opacity-30", colors.bg)} />
                )}
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                <div className={cn(
                  "font-semibold transition-colors",
                  isCompleted || isCurrent ? colors.text : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {step.subLabel}
                </div>
                {isCurrent && (
                  <span className={cn(
                    "inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full",
                    colors.bg,
                    "text-white"
                  )}>
                    กำลังดำเนินการ
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
