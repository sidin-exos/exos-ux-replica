import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onValueChange: (v: string) => void;
}

const PRIORITY = [
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "FR", name: "France" },
  { code: "PL", name: "Poland" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
];

const EU_EEA = [
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IS", name: "Iceland" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NO", name: "Norway" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
];

const REST = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "CN", name: "China" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "SA", name: "Saudi Arabia" },
];

const ALL = [...PRIORITY, ...EU_EEA, ...REST];

const CountrySelect = ({ value, onValueChange }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = ALL.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 font-normal"
        >
          {selected ? selected.name : "Select country…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup heading="Popular">
              {PRIORITY.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => { onValueChange(c.code); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="EU / EEA">
              {EU_EEA.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => { onValueChange(c.code); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Rest of World">
              {REST.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => { onValueChange(c.code); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelect;
