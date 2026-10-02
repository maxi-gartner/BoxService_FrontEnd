import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-surface border border-border rounded-xl p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xl font-bold text-light mb-4", className)}>{children}</p>;
}
