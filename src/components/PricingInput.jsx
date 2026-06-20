import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PricingInput({ label, value, onChange, prefix = "$", placeholder, error, tooltip, description }) {
  const inputId = useId();
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground font-medium">{label}</Label>
        {tooltip && (
          <span
            title={tooltip}
            className="cursor-help text-muted-foreground/40 hover:text-muted-foreground text-xs leading-none select-none"
          >
            (?)
          </span>
        )}
      </div>
      {description && (
        <p className="text-[10px] text-muted-foreground/50 -mt-0.5">{description}</p>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {prefix}
        </span>
        <Input
          id={inputId}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
          className={`pl-7 bg-card/80 border-border/50 font-mono text-foreground placeholder:text-muted-foreground/40 focus:ring-accent transition-colors ${
            error ? 'border-red-500/60 focus:ring-red-500/40' : ''
          }`}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-400 mt-0.5 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
