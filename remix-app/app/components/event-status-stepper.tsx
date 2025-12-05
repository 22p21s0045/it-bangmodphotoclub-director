import { Check, Circle, Clock, Loader2 } from "lucide-react";
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
      label: "กำลังหาคน",
      icon: Circle,
    },
    {
      id: EventStatus.PENDING_RAW,
      label: "รออัปโหลดไฟล์ RAW",
      icon: Clock,
    },
    {
      id: EventStatus.PENDING_EDIT,
      label: "รอแต่งรูป",
      icon: Loader2,
    },
    {
      id: EventStatus.COMPLETED,
      label: "เสร็จสิ้น",
      icon: Check,
    },
  ];

  const getCurrentStepIndex = (status: string) => {
    return steps.findIndex((step) => step.id === status);
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);

  return (
    <div className={cn("w-full py-6", className)}>
      <div className="flex flex-col md:flex-row md:items-center w-full px-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node Wrapper */}
              <div className={cn(
                  "relative flex flex-row md:flex-col items-center md:flex-none", 
                  isLast ? "" : "pb-8 md:pb-0"
              )}>
                
                {/* Mobile Vertical Connector Line */}
                {!isLast && (
                  <div className="md:hidden absolute left-6 top-12 bottom-0 w-1 -ml-0.5 bg-gray-100">
                      <div 
                        className={cn(
                            "w-full bg-primary transition-all duration-700 ease-in-out origin-top",
                            index + 1 <= currentStepIndex ? "h-full" : "h-0"
                        )} 
                      />
                  </div>
                )}

                {/* Icon Circle */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-500 ease-in-out bg-background z-10 shrink-0",
                    isCompleted 
                      ? "border-primary text-primary scale-100" 
                      : isCurrent
                          ? "border-primary text-primary scale-110 shadow-lg shadow-primary/20"
                          : "border-gray-200 text-gray-300"
                  )}
                >
                  {/* Pulse Animation for Current Step */}
                  {isCurrent && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping" />
                  )}

                  {isCompleted ? (
                      <Check className="w-6 h-6 transition-transform duration-300 scale-100" />
                  ) : (
                      <Icon className={cn(
                          "w-5 h-5 transition-all duration-300",
                          isCurrent ? "animate-pulse" : ""
                      )} />
                  )}
                </div>
                
                {/* Label */}
                <div className={cn(
                    "flex flex-col ml-4 md:ml-0 md:absolute md:top-14 md:left-1/2 md:-translate-x-1/2 md:items-center transition-all duration-500 md:w-40",
                    isCurrent ? "opacity-100 md:translate-y-0" : "opacity-70 md:translate-y-1"
                )}>
                    <span
                      className={cn(
                        "text-sm md:text-xs font-bold md:text-center transition-colors duration-300 px-2 py-1 rounded-full whitespace-nowrap",
                        isCompleted ? "text-primary" : isCurrent ? "text-primary md:bg-primary/5" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                        <span className="text-xs md:text-[10px] text-muted-foreground font-medium mt-0.5 animate-pulse whitespace-nowrap px-2">
                            กำลังดำเนินการ
                        </span>
                    )}
                </div>
              </div>

              {/* Desktop Horizontal Connector Line */}
              {!isLast && (
                <div className="hidden md:block flex-1 mx-2 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                    <div 
                        className={cn(
                            "absolute inset-0 bg-primary transition-all duration-700 ease-in-out",
                            index + 1 <= currentStepIndex ? "w-full" : "w-0"
                        )}
                    />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
