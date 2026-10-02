import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold">{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="[&>tr]:border-t [&>tr]:border-border-light [&>tr>td]:px-4 [&>tr>td]:py-3">{children}</tbody>;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-white/[0.02]", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn(className)} {...props} />;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
