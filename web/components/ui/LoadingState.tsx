import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export function LoadingState({ label = "Cargando...", className }: { label?: string; className?: string }) {
  return <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-3 py-8 text-sm text-muted", className)}>
    <Spinner className="h-5 w-5 text-accent" /><span>{label}</span>
  </div>;
}
