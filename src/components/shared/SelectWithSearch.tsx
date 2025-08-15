import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectWithSearchProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  onSearchChange?: (search: string) => void;
  popoverClassName?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

export function SelectWithSearch({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  className,
  disabled = false,
  onSearchChange,
  popoverClassName,
  renderOption,
}: SelectWithSearchProps) {
  const [open, setOpen] = useState(false);
  const commandListRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (open && commandListRef.current) {
      const listEl = commandListRef.current;
      // Debug info for development
      console.log('📐 CommandList initialized:', {
        items: options.length,
        scrollHeight: listEl.scrollHeight,
        clientHeight: listEl.clientHeight
      });
      
      // Keep current scroll position when dropdown reopens

      // Add manual scroll event handling
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        listEl.scrollTop += e.deltaY;
        // Smooth manual wheel scrolling enabled
      };

      const handleMouseDown = (e: MouseEvent) => {
        // Only handle scrollbar area clicks
        const rect = listEl.getBoundingClientRect();
        const scrollbarWidth = listEl.offsetWidth - listEl.clientWidth;
        if (e.clientX > rect.right - scrollbarWidth - 5) {
          // Native scrollbar interaction
          // Let native scrollbar handle this
          return;
        }
      };

      listEl.addEventListener('wheel', handleWheel, { passive: false });
      listEl.addEventListener('mousedown', handleMouseDown);

      return () => {
        listEl.removeEventListener('wheel', handleWheel);
        listEl.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [open, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[200px] justify-between', className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn('p-0 bg-background border shadow-md z-50', popoverClassName)} 
        style={{ width: 'var(--radix-popover-trigger-width)', maxHeight: '450px' }}
      >
        <Command className="bg-background" shouldFilter={false} loop>
          <CommandInput 
            placeholder={searchPlaceholder}
            onValueChange={(value) => {
              console.log('CommandInput onValueChange triggered:', value);
              if (onSearchChange) {
                onSearchChange(value);
              }
            }}
            className="bg-background"
          />
          <CommandList 
            ref={commandListRef}
            className="max-h-[300px] overflow-y-scroll overflow-x-hidden bg-background custom-scrollbar"
            style={{
              scrollBehavior: 'smooth',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain'
            }}
          >
            <CommandEmpty className="bg-background">{emptyText}</CommandEmpty>
            <CommandGroup className="bg-background">
              {(() => {
                // Rendering all available options with scrolling enabled
                return options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="px-3 py-3 min-h-[48px] hover:bg-accent hover:text-accent-foreground cursor-pointer bg-background flex items-center"
                  disabled={option.disabled}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {renderOption ? renderOption(option) : option.label}
                </CommandItem>
                ));
              })()}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}