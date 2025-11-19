
'use client';

import * as React from "react"
import { Check, ChevronsUpDown, LoaderCircle, Truck as TruckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Truck } from "@/lib/data"

interface TruckSelectorProps {
    trucks: Truck[];
    selectedTruck?: Truck | null;
    onSelectTruck: (truck: Truck | null) => void;
    placeholder?: string;
}

export function TruckSelector({ trucks, selectedTruck, onSelectTruck, placeholder = "Select truck..."}: TruckSelectorProps) {
  const [open, setOpen] = React.useState(false)
  
  const handleSelect = (currentValue: string) => {
    const truck = trucks.find(
      (t) => t.name.toLowerCase() === currentValue.toLowerCase()
    );
    onSelectTruck(truck || null);
    setOpen(false);
  }

  const isLoading = !trucks;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading Trucks...</span>
            </div>
          ) : selectedTruck ? (
            <div className="flex items-center gap-2">
                 <TruckIcon className="h-4 w-4" />
                {selectedTruck.name} ({selectedTruck.plate})
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search trucks..." />
          <CommandList>
            <CommandEmpty>No trucks found.</CommandEmpty>
            <CommandGroup>
              {trucks.map((truck) => (
                <CommandItem
                  key={truck.id}
                  value={truck.name}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4" />
                      <span>{truck.name} ({truck.plate})</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedTruck?.id === truck.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
