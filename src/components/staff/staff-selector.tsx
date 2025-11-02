
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface StaffSelectorProps {
    staffList: Staff[];
    selectedStaff?: Staff | null;
    onSelectStaff: (staff: Staff | null) => void;
    placeholder?: string;
    loading?: boolean;
    disabledIds?: string[];
}

export function StaffSelector({ staffList, selectedStaff, onSelectStaff, placeholder = "Select staff...", loading = false, disabledIds = []}: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const staff = staffList.find(
      (staff) => staff.name.toLowerCase() === currentValue.toLowerCase()
    );
    onSelectStaff(staff || null);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading Staff...</span>
            </div>
          ) : selectedStaff ? (
            <div className="flex items-center gap-2">
                 <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://picsum.photos/seed/${selectedStaff.id}/200/200`} />
                    <AvatarFallback>{selectedStaff.name.charAt(0)}</AvatarFallback>
                </Avatar>
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
                  className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200/200`} />
                            <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{staff.name}</span>
                    </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
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
