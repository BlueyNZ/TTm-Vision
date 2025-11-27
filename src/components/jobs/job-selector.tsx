
'use client';

import * as React from "react"
import { Check, ChevronsUpDown, LoaderCircle, Briefcase } from "lucide-react"

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
import { Job } from "@/lib/data"

interface JobSelectorProps {
    jobs: Job[];
    selectedJob?: Job | null;
    onSelectJob: (job: Job | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function JobSelector({ jobs, selectedJob, onSelectJob, placeholder = "Select job...", disabled = false }: JobSelectorProps) {
  const [open, setOpen] = React.useState(false)
  
  const handleSelect = (currentValue: string) => {
    // We are searching by job number here
    const job = jobs.find(
      (j) => j.jobNumber.toLowerCase() === currentValue.toLowerCase()
    );
    onSelectJob(job || null);
    setOpen(false);
  }

  const isLoading = !jobs;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <div className="flex items-center">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading Jobs...</span>
            </div>
          ) : selectedJob ? (
            <div className="flex items-center gap-2 overflow-hidden">
                 <Briefcase className="h-4 w-4 flex-shrink-0" />
                 <span className="truncate">
                    {selectedJob.jobNumber} - {selectedJob.location}
                 </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command filter={(value, search) => {
            const job = jobs.find(j => j.jobNumber.toLowerCase() === value.toLowerCase());
            if (!job) return 0;
            if (job.jobNumber.toLowerCase().includes(search.toLowerCase())) return 1;
            if (job.location.toLowerCase().includes(search.toLowerCase())) return 1;
            if (job.clientName && job.clientName.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
        }}>
          <CommandInput placeholder="Search by Job No, Location, or Client..." />
          <CommandList>
            <CommandEmpty>No jobs found.</CommandEmpty>
            <CommandGroup>
              {jobs.map((job) => (
                <CommandItem
                  key={job.id}
                  value={job.jobNumber}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <div>
                        <p>{job.jobNumber} - {job.location}</p>
                        <p className="text-xs text-muted-foreground">{job.clientName}</p>
                      </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedJob?.id === job.id ? "opacity-100" : "opacity-0"
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
