
'use client';

import * as React from "react"
import { Check, ChevronsUpDown, LoaderCircle, Building, Plus } from "lucide-react"

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
import { Client } from "@/lib/data"

interface ClientSelectorProps {
    clientList: Client[];
    selectedClient?: Client | null;
    onSelectClient: (client: Client | null) => void;
    placeholder?: string;
    disabledIds?: string[];
}

export function ClientSelector({ clientList, selectedClient, onSelectClient, placeholder = "Select client...", disabledIds = []}: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  
  const handleSelect = (currentValue: string) => {
    const client = clientList.find(
      (c) => c.name.toLowerCase() === currentValue.toLowerCase()
    );
    onSelectClient(client || null);
    setOpen(false);
    setSearchValue("");
  }

  const handleCreateCustom = () => {
    if (searchValue.trim()) {
      // Create a temporary client object with the custom name
      onSelectClient({
        id: '',
        tenantId: '',
        name: searchValue.trim(),
        status: 'Active'
      });
      setOpen(false);
      setSearchValue("");
    }
  }

  const isLoading = !clientList;
  const hasExactMatch = clientList.some(c => c.name.toLowerCase() === searchValue.toLowerCase());
  const showCreateOption = searchValue.trim() && !hasExactMatch;

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
                <span>Loading Clients...</span>
            </div>
          ) : selectedClient ? (
            <div className="flex items-center gap-2">
                 <Building className="h-4 w-4" />
                {selectedClient.name}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Search or type a client name..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-sm text-muted-foreground">
                {searchValue ? "No existing clients found." : "No clients found."}
              </div>
            </CommandEmpty>
            {showCreateOption && (
              <CommandGroup heading="Create New">
                <CommandItem onSelect={handleCreateCustom} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Use &quot;{searchValue}&quot; as client name</span>
                </CommandItem>
              </CommandGroup>
            )}
            {clientList.length > 0 && (
              <CommandGroup heading="Existing Clients">
                {clientList.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={handleSelect}
                    disabled={disabledIds.includes(client.id)}
                  >
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{client.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

