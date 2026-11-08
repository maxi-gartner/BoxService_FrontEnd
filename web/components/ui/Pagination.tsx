import { Button } from "@/components/ui/Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

// Paginador numerado simple para los listados grandes (Clientes,
// Vehículos, Presupuestos, Facturas) — reemplaza el scroll infinito de
// bajar la tabla entera. Ver plan de paginado server-side.
export function Pagination({ page, totalPages, totalCount, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted">
        {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
      </p>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ‹ Anterior
        </Button>
        <span className="text-xs text-muted">
          Página {page} de {totalPages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Siguiente ›
        </Button>
      </div>
    </div>
  );
}
