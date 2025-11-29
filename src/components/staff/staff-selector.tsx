
'use client';

import * as React from "react"
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react"

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
import { Staff } from "@/lib/data"

interface StaffSelectorProps {
    staffList: Staff[];
    selectedStaff?: Staff | null;
    onSelectStaff: (staff: Staff | null) => void;
    placeholder?: string;
    disabledIds?: string[];
    disabled?: boolean;
}

export function StaffSelector({ staffList, selectedStaff, onSelectStaff, placeholder = "Select staff...", disabledIds = [], disabled = false }: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(() => selectedStaff?.name || "");

  React.useEffect(() => {
    if (selectedStaff) {
      setValue(selectedStaff.name);
    } else {
      setValue("");
    }
  }, [selectedStaff]);

  const handleSelect = (currentValue: string) => {
    const staff = staffList.find(
      (s) => s.name.toLowerCase() === currentValue.toLowerCase()
    );
    onSelectStaff(staff || null);
    setOpen(false);
  }

  const isLoading = !staffList || staffList.length === 0;

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
                <span>Loading Staff...</span>
            </div>
          ) : selectedStaff ? (
            <div className="flex items-center gap-2">
                {selectedStaff.name}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search staff..." />
          <CommandList>
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {staffList.map((staff) => (
                <CommandItem
                  key={staff.id}
                  value={staff.name}
                  onSelect={handleSelect}
                  disabled={disabledIds.includes(staff.id)}
                >
                  <div className="flex items-center gap-2">
                      <span>{staff.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedStaff?.id === staff.id ? "opacity-100" : "opacity-0"
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
