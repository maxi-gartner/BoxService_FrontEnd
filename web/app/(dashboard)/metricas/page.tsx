"use client";

import { useMetrics } from "@/hooks/useMetrics";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = { labor: "Mano de obra", part: "Repuesto" };

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <p className="mb-1 text-xs uppercase text-muted">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
    </Card>
  );
}

function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs capitalize text-muted">{monthLabel(d.month)}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-surface-2">
            <div
              className="h-full rounded bg-accent"
              style={{ width: `${Math.max(2, (d.total / max) * 100)}%` }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-xs text-muted">{formatMoney(d.total)}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-muted">Todavía no hay facturas emitidas.</p>}
    </div>
  );
}

function RankingList({ items }: { items: { description: string; type: string; count: number; total: number }[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">Todavía no hay trabajos completados.</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.description}-${item.type}`} className="flex items-center justify-between text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.description}</p>
            <p className="text-xs text-muted">
              {TYPE_LABEL[item.type] ?? item.type} · {item.count} {item.count === 1 ? "vez" : "veces"}
            </p>
          </div>
          <span className="shrink-0 text-accent">{formatMoney(item.total)}</span>
        </div>
      ))}
    </div>
  );
}

export default function MetricasPage() {
  const { data, isLoading } = useMetrics();

  if (isLoading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Métricas</h1>
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Métricas</h1>
      <p className="mb-6 text-sm text-muted">Cómo viene el taller este mes y este año.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Ingresos este mes" value={formatMoney(data.revenueThisMonth)} accent />
        <StatCard label="Ingresos este año" value={formatMoney(data.revenueThisYear)} accent />
        <StatCard label="Services este mes" value={String(data.servicesThisMonth)} />
        <StatCard label="Services este año" value={String(data.servicesThisYear)} />
        <StatCard label="Clientes nuevos este mes" value={String(data.newClientsThisMonth)} />
        <StatCard label="Ticket promedio este mes" value={formatMoney(data.averageTicketThisMonth)} />
        <StatCard
          label="Presupuestos pendientes"
          value={`${data.pendingBudgetsCount} · ${formatMoney(data.pendingBudgetsValue)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <Card>
          <CardTitle>Ingresos por mes</CardTitle>
          <RevenueChart data={data.revenueByMonth} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Lo que más plata da</CardTitle>
            <RankingList items={data.topServicesByRevenue} />
          </Card>
          <Card>
            <CardTitle>Lo que más se pide</CardTitle>
            <RankingList items={data.topServicesByFrequency} />
          </Card>
        </div>
      </div>
    </div>
  );
}
