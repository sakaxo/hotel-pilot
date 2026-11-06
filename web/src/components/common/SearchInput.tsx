import type { InputHTMLAttributes } from "react"
import { FiSearch } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange, className, placeholder = "Search...", ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <FiSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      />
    </div>
  )
}
