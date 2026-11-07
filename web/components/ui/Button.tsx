"use client";
import { type ButtonHTMLAttributes, forwardRef, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger";
type Size = "md" | "sm";
const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-[#0d1117] hover:bg-accent-hover",
  secondary: "bg-transparent text-light border border-border hover:border-accent hover:text-accent",
  danger: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-light",
};
const sizeClasses: Record<Size, string> = { md: "px-4 py-2.5 text-sm min-h-11", sm: "px-3 py-2 text-xs min-h-9" };
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; loadingText?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, loading = false, loadingText, children, onClick, ...props }, ref) => {
    const [running, setRunning] = useState(false);
    const [actionError, setActionError] = useState(false);
    const locked = useRef(false);
    const busy = loading || running;
    return <>
      <button {...props} ref={ref} disabled={disabled || busy} aria-busy={busy || undefined}
        className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", variantClasses[variant], sizeClasses[size], className)}
        onClick={event => {
          if (disabled || busy || locked.current) { event.preventDefault(); return; }
          setActionError(false);
          const result: unknown = onClick?.(event);
          if (result && typeof (result as PromiseLike<unknown>).then === "function") {
            locked.current = true;
            setRunning(true);
            void Promise.resolve(result).then(
              () => { locked.current = false; setRunning(false); },
              () => { locked.current = false; setRunning(false); setActionError(true); },
            );
          }
        }}>
        {busy && <Spinner />}
        {busy && loadingText ? loadingText : children}
        {busy && <span className="sr-only">Procesando, esperá un momento.</span>}
      </button>
      {actionError && <span role="alert" className="text-xs text-danger">No se pudo completar la acción. Intentá nuevamente.</span>}
    </>;
  },
);
Button.displayName = "Button";
