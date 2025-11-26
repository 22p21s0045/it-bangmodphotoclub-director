import * as React from "react"
import { Check } from "lucide-react"
import axios from "axios"

import { cn } from "~/lib/utils"
import { Input } from "~/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"

interface LocationAutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  name?: string
}

export function LocationAutocomplete({ value, onChange, placeholder = "เลือกสถานที่...", className, name }: LocationAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [locations, setLocations] = React.useState<string[]>([])
  const [inputValue, setInputValue] = React.useState(value || "")

  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get("/api/locations");
        setLocations(res.data);
      } catch (error) {
        console.error("Failed to fetch locations", error);
      }
    }
    fetchLocations()
  }, [])

  const filteredLocations = locations.filter((location) =>
    location.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className={className}>
      <Popover open={open && filteredLocations.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              name={name}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                onChange?.(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={(e) => {
                // Use setTimeout to allow click events to complete
                setTimeout(() => setOpen(false), 150);
              }}
              placeholder={placeholder}
              autoComplete="off"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredLocations.map((location) => (
              <div
                key={location}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  inputValue === location && "bg-accent"
                )}
                onClick={() => {
                  setInputValue(location)
                  onChange?.(location)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    inputValue === location ? "opacity-100" : "opacity-0"
                  )}
                />
                {location}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
