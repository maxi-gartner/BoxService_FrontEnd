"use client";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Spinner } from "./Spinner";

export function NetworkActivity() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  if (!fetching && !mutating) return null;
  return <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-light shadow-lg print:hidden">
    <Spinner className="text-accent" /><span>{mutating ? "Procesando acción..." : "Actualizando datos..."}</span>
  </div>;
}
