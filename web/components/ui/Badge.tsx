const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[#8b949e26] text-muted",
  sent: "bg-[#58a6ff26] text-info",
  approved: "bg-[#3fb95026] text-success",
  completed: "bg-[#a371f726] text-completed",
  rejected: "bg-[#f8514926] text-danger",
  issued: "bg-[#f59e0b26] text-accent",
  paid: "bg-[#3fb95026] text-success",
  cancelled: "bg-[#8b949e26] text-muted",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  completed: "Finalizado",
  rejected: "Rechazado",
  issued: "Emitida",
  paid: "Cobrada",
  cancelled: "Anulada",
};

export function Badge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-[#8b949e26] text-muted";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
