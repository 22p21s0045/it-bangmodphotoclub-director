import * as React from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"

interface MultiDatePickerProps {
  dates?: Date[]
  onDatesChange?: (dates: Date[]) => void
  className?: string
}

export function MultiDatePicker({ dates = [], onDatesChange, className }: MultiDatePickerProps) {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(dates)

  React.useEffect(() => {
    setSelectedDates(dates)
  }, [dates])

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    
    // Check if date already selected
    const isSelected = selectedDates.some(
      d => d.toDateString() === date.toDateString()
    )
    
    let newDates: Date[]
    if (isSelected) {
      // Remove date
      newDates = selectedDates.filter(
        d => d.toDateString() !== date.toDateString()
      )
    } else {
      // Add date
      newDates = [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime())
    }
    
    setSelectedDates(newDates)
    onDatesChange?.(newDates)
  }

  const removeDate = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(
      d => d.toDateString() !== dateToRemove.toDateString()
    )
    setSelectedDates(newDates)
    onDatesChange?.(newDates)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              selectedDates.length === 0 && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length > 0
              ? `เลือกแล้ว ${selectedDates.length} วัน`
              : "เลือกวันที่จัดกิจกรรม"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDates[0]}
            onSelect={handleSelect}
            initialFocus
            locale={th}
          />
        </PopoverContent>
      </Popover>
      
      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">วันที่เลือก ({selectedDates.length} วัน):</div>
          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
              >
                <span>{format(date, "d MMM yyyy", { locale: th })}</span>
                <button
                  type="button"
                  onClick={() => removeDate(date)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
