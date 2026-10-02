import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-[#0d1117] hover:bg-accent-hover",
  secondary: "bg-transparent text-light border border-border hover:border-accent hover:text-accent",
  danger: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-light",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm min-h-11",
  sm: "px-3 py-2 text-xs min-h-9",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
