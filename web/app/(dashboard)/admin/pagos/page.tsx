"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePaymentsOverview } from "@/hooks/usePayments";
import { useTenants, useRecordPayment, useTenantPayments } from "@/hooks/useTenants";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatMoney } from "@/lib/utils";
import type { Tenant, TenantPaymentStatus } from "@/types/entities";

const currentPeriod = new Date().toISOString().slice(0, 7);

function periodIndex(period: string): number {
  const [year, month] = period.split("-").map(Number);
  return year * 12 + (month - 1);
}

// Meses sin pagar hasta el período actual (inclusive). Si nunca pagó,
// cuenta desde el mes en que se creó el taller — no desde antes.
function monthsOwed(row: TenantPaymentStatus, tenant: Tenant | undefined): number {
  const current = periodIndex(currentPeriod);
  if (row.lastPeriod) return Math.max(0, current - periodIndex(row.lastPeriod));
  if (!tenant) return 0;
  return Math.max(0, current - periodIndex(tenant.createdAt.slice(0, 7)) + 1);
}

function PaymentHistoryModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const { data: payments, isLoading, error: paymentsLoadError, refetch } = useTenantPayments(tenant.tenantId);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = (payments ?? [])
    .filter((p) => !search || p.period.includes(search.trim()) || (p.notes ?? "").toLowerCase().includes(search.trim().toLowerCase()))
    .slice()
    .sort((a, b) => {
      const diff = sortBy === "date"
        ? new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
        : a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });

  function toggleSort(field: "date" | "amount") {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  return (
    <Modal open onClose={onClose} title={`Historial de pagos — ${tenant.name}`}>
      <Input
        placeholder="Buscar por período (AAAA-MM) o notas…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />
      {paymentsLoadError && <ErrorState error={paymentsLoadError} resource="el historial" onRetry={() => void refetch()} />}
      {isLoading && <LoadingState label="Cargando el historial..." />}
      {!isLoading && !paymentsLoadError && (
        <TableWrapper>
          <THead>
            <th>
              <button onClick={() => toggleSort("date")} className="hover:text-light">
                Fecha {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
            <th>Período</th>
            <th>
              <button onClick={() => toggleSort("amount")} className="hover:text-light">
                Monto {sortBy === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
            <th>Notas</th>
          </THead>
          <TBody>
            {rows.length === 0 && <EmptyRow colSpan={4}>{search ? "Ningún pago coincide con la búsqueda." : "Este taller todavía no tiene pagos registrados."}</EmptyRow>}
            {rows.map((p) => (
              <TR key={p.paymentId}>
                <TD className="text-muted">{p.paymentDate}</TD>
                <TD>{p.period}</TD>
                <TD className="text-accent">{formatMoney(p.amount)}</TD>
                <TD className="text-muted">{p.notes ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrapper>
      )}
    </Modal>
  );
}

const schema = z.object({
  tenantId: z.string().min(1, "Elegí un taller"),
  amount: z
    .string()
    .min(1, "Ingresá el monto")
    .refine((v) => Number(v) > 0, "El monto debe ser mayor a 0"),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato AAAA-MM"),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function PagosPage() {
  const { data: overview, isLoading, error: paymentsOverviewLoadError, isLoading: paymentsOverviewLoading, refetch: refetchPaymentsOverview } = usePaymentsOverview();
  const { data: tenants, error: tenantsLoadError, isLoading: tenantsLoading, refetch: refetchTenants } = useTenants();
  const recordPayment = useRecordPayment();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [overviewSearch, setOverviewSearch] = useState("");
  const [onlyOwing, setOnlyOwing] = useState(false);
  const [detailTenantId, setDetailTenantId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tenantId: "", amount: "", period: currentPeriod, notes: "" },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    try {
      await recordPayment.mutateAsync({
        tenantId: Number(values.tenantId),
        data: { amount: Number(values.amount), period: values.period, notes: values.notes || undefined },
      });
      setMessage({ type: "ok", text: "Pago registrado." });
      reset({ tenantId: values.tenantId, amount: "", period: currentPeriod, notes: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo registrar el pago." });
    }
  }

  const loadError = paymentsOverviewLoadError ?? tenantsLoadError;
  if (loadError) return <ErrorState error={loadError} resource="la información" onRetry={() => { if (paymentsOverviewLoadError) void refetchPaymentsOverview(); if (tenantsLoadError) void refetchTenants(); }} />;
  if (paymentsOverviewLoading || tenantsLoading) return <LoadingState label="Cargando la información..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pagos</h1>

      {message && <div className="mb-4"><Alert type={message.type}>{message.text}</Alert></div>}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card>
          <CardTitle>Registrar pago</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Taller</Label>
              <Select {...register("tenantId")}>
                <option value="">Elegí un taller</option>
                {tenants?.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.name}
                  </option>
                ))}
              </Select>
              {errors.tenantId && <p className="mt-1 text-xs text-danger">{errors.tenantId.message}</p>}
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" placeholder="15000" {...register("amount")} />
              {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
            </div>
            <div>
              <Label>Período (mes que cubre)</Label>
              <Input placeholder="2026-10" {...register("period")} />
              {errors.period && <p className="mt-1 text-xs text-danger">{errors.period.message}</p>}
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Input placeholder="Transferencia" {...register("notes")} />
            </div>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Registrar pago"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Estado de pago — {currentPeriod}</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Buscar taller…"
                value={overviewSearch}
                onChange={(e) => setOverviewSearch(e.target.value)}
                className="w-full sm:max-w-xs"
              />
              <label className="flex items-center gap-2 text-xs text-muted whitespace-nowrap">
                <input type="checkbox" checked={onlyOwing} onChange={(e) => setOnlyOwing(e.target.checked)} />
                Solo los que deben
              </label>
            </div>
          </div>
          <TableWrapper>
            <THead>
              <th>Taller</th>
              <th>Este mes</th>
              <th>Debe</th>
              <th>Último pago</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={5}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
              {!isLoading && overview?.length === 0 && <EmptyRow colSpan={5}>No hay talleres todavía.</EmptyRow>}
              {(() => {
                const rows = (overview ?? [])
                  .filter((row) => !overviewSearch || row.tenantName.toLowerCase().includes(overviewSearch.trim().toLowerCase()))
                  .map((row) => ({ row, owed: monthsOwed(row, tenants?.find((t) => t.tenantId === row.tenantId)) }))
                  .filter(({ owed }) => !onlyOwing || owed > 0);

                if (!isLoading && overview && overview.length > 0 && rows.length === 0) {
                  return <EmptyRow colSpan={5}>Ningún taller coincide con el filtro.</EmptyRow>;
                }

                return rows.map(({ row, owed }) => (
                  <TR key={row.tenantId}>
                    <TD>{row.tenantName}</TD>
                    <TD className={row.paidCurrentPeriod ? "text-success" : "text-danger"}>
                      {row.paidCurrentPeriod ? "Pagado" : "Pendiente"}
                    </TD>
                    <TD className={owed > 0 ? "text-danger" : "text-muted"}>
                      {owed > 0 ? `${owed} mes${owed > 1 ? "es" : ""}` : "Al día"}
                    </TD>
                    <TD className="text-muted">
                      {row.lastAmount != null
                        ? `${formatMoney(row.lastAmount)} · ${row.lastPeriod} (${row.lastPaymentDate})`
                        : "—"}
                    </TD>
                    <TD>
                      <Button size="sm" variant="secondary" onClick={() => setDetailTenantId(row.tenantId)}>
                        Ver detalle
                      </Button>
                    </TD>
                  </TR>
                ));
              })()}
            </TBody>
          </TableWrapper>
        </Card>
      </div>

      {detailTenantId !== null && (() => {
        const tenant = tenants?.find((t) => t.tenantId === detailTenantId);
        return tenant ? <PaymentHistoryModal tenant={tenant} onClose={() => setDetailTenantId(null)} /> : null;
      })()}
    </div>
  );
}
