import { Card } from "@/components/ui/Card";

/**
 * Pantalla para los módulos que todavía no se migraron al backend nuevo.
 * Deja la navegación completa (todos los ítems del sidebar llevan a algo
 * que renderiza) sin tener que mockear datos ni tirar 404.
 */
export function ModulePlaceholder({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <Card className="max-w-xl">
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <span className="text-4xl" aria-hidden="true">
            {icon}
          </span>

          <div>
            <p className="text-lg font-semibold text-light">Módulo en migración</p>
            <p className="text-sm text-muted mt-2">{description}</p>
          </div>

          <span className="mt-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted">
            Próximamente
          </span>
        </div>
      </Card>
    </div>
  );
}
