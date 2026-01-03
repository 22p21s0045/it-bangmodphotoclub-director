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

  const getStepColors = (isActive: boolean) => {
    return {
      bg: isActive ? "bg-primary" : "bg-muted",
      border: "border-primary",
      text: isActive ? "text-primary" : "text-muted-foreground",
      glow: "shadow-primary/30",
    };
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex items-start justify-between relative px-8">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-[60px] right-[60px] h-0.5 bg-muted rounded-full" />
        
        {/* Progress Line Fill */}
        <div 
          className="absolute top-6 left-[60px] h-0.5 bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${(currentStepIndex / (steps.length - 1)) * (100 - (120 / 8))}%`,
            maxWidth: 'calc(100% - 120px)'
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;
          const colors = getStepColors(isCompleted || isCurrent);

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              {/* Icon Circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ease-out border-2",
                  isCompleted || isCurrent
                    ? `${colors.bg} text-primary-foreground border-primary shadow-lg ${colors.glow}`
                    : "bg-background border-muted text-muted-foreground"
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
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
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
                    "mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full inline-block bg-primary text-primary-foreground"
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
          const colors = getStepColors(isCompleted || isCurrent);

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical Line */}
              {!isLast && (
                <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-muted">
                  <div 
                    className={cn(
                      "w-full transition-all duration-500",
                      index < currentStepIndex ? "h-full bg-primary" : "h-0"
                    )}
                  />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 transition-all duration-500 border-2",
                  isCompleted || isCurrent
                    ? `${colors.bg} text-primary-foreground border-primary shadow-md ${colors.glow}`
                    : "bg-background border-muted text-muted-foreground"
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
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {step.subLabel}
                </div>
                {isCurrent && (
                  <span className={cn(
                    "inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground"
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
