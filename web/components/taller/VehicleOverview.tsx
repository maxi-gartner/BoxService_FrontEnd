"use client";

import { useBudgets } from "@/hooks/useBudgets";
import { useServices } from "@/hooks/useServices";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Vehicle } from "@/types/entities";

type Section = "presupuestos" | "historial" | "facturacion" | "nuevo-presupuesto" | "nuevo-service";

export function VehicleOverview({ vehicle, onOpen }: { vehicle: Vehicle; onOpen: (section: Section) => void }) {
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const vehicleBudgets = budgets.filter((item) => item.vehicleId === vehicle.vehicleId);
  const vehicleServices = services.filter((item) => item.vehicleId === vehicle.vehicleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const serviceIds = new Set(vehicleServices.map((item) => item.serviceId));
  const vehicleInvoices = invoices.filter((item) => serviceIds.has(item.serviceId));
  const pendingBudgets = vehicleBudgets.filter((item) => item.status === "draft" || item.status === "sent").length;
  const pendingInvoices = vehicleInvoices.filter((item) => item.status === "issued").length;
  const latestService = vehicleServices[0];
  const activity = [
    ...vehicleBudgets.map((item) => ({ key: `budget-${item.budgetId}`, date: item.date, title: `Presupuesto ${item.number}`, detail: item.status, section: "presupuestos" as const })),
    ...vehicleServices.map((item) => ({ key: `service-${item.serviceId}`, date: item.date, title: item.serviceType, detail: `${item.mileage.toLocaleString("es-AR")} km`, section: "historial" as const })),
    ...vehicleInvoices.map((item) => ({ key: `invoice-${item.invoiceId}`, date: item.date, title: `Factura ${item.number}`, detail: `${formatMoney(item.total)} · ${item.status}`, section: "facturacion" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const loading = loadingBudgets || loadingServices || loadingInvoices;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><p className="text-xs uppercase text-muted mb-1">Presupuestos pendientes</p><p className="text-2xl font-bold text-accent">{pendingBudgets}</p></Card>
        <Card><p className="text-xs uppercase text-muted mb-1">Services realizados</p><p className="text-2xl font-bold">{vehicleServices.length}</p></Card>
        <Card><p className="text-xs uppercase text-muted mb-1">Facturas por cobrar</p><p className="text-2xl font-bold">{pendingInvoices}</p></Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <Card>
          <CardTitle>Actividad reciente</CardTitle>
          {loading && <p className="text-sm text-muted">Cargando actividad...</p>}
          {!loading && activity.length === 0 && <div className="py-8 text-center"><p className="text-sm text-muted mb-3">Todavía no hay actividad registrada para este vehículo.</p><Button size="sm" onClick={() => onOpen("nuevo-presupuesto")}>Crear primer presupuesto</Button></div>}
          {!loading && activity.map((item) => <div key={item.key} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center py-3 border-b border-border last:border-0"><span className="text-xs text-muted">{formatDate(item.date)}</span><div><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-muted mt-1">{item.detail}</p></div><Button size="sm" variant="secondary" onClick={() => onOpen(item.section)}>Ver</Button></div>)}
        </Card>
        <Card>
          <CardTitle>Próximo mantenimiento</CardTitle>
          {latestService ? <div className="space-y-4"><div><p className="text-xs text-muted">Próximo kilometraje</p><p className="text-xl font-bold text-accent">{latestService.nextMileage?.toLocaleString("es-AR") ?? "Sin definir"}{latestService.nextMileage ? " km" : ""}</p></div><div><p className="text-xs text-muted">Próxima fecha</p><p className="font-semibold">{formatDate(latestService.nextDate)}</p></div><Button className="w-full" variant="secondary" onClick={() => onOpen("historial")}>Ver historial</Button></div> : <div className="py-5"><p className="text-sm text-muted mb-4">Registrá el primer service para calcular el próximo mantenimiento.</p><Button className="w-full" onClick={() => onOpen("nuevo-service")}>Registrar service</Button></div>}
        </Card>
      </div>
    </div>
  );
}
