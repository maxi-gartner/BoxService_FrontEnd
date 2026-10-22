"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePaymentsOverview } from "@/hooks/usePayments";
import { useTenants, useRecordPayment } from "@/hooks/useTenants";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatMoney } from "@/lib/utils";

const currentPeriod = new Date().toISOString().slice(0, 7);

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
  const { data: overview, isLoading } = usePaymentsOverview();
  const { data: tenants } = useTenants();
  const recordPayment = useRecordPayment();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

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
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Registrar pago"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Estado de pago — {currentPeriod}</CardTitle>
          <TableWrapper>
            <THead>
              <th>Taller</th>
              <th>Este mes</th>
              <th>Último pago</th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={3}>Cargando...</EmptyRow>}
              {!isLoading && overview?.length === 0 && <EmptyRow colSpan={3}>No hay talleres todavía.</EmptyRow>}
              {overview?.map((row) => (
                <TR key={row.tenantId}>
                  <TD>{row.tenantName}</TD>
                  <TD className={row.paidCurrentPeriod ? "text-success" : "text-danger"}>
                    {row.paidCurrentPeriod ? "Pagado" : "Pendiente"}
                  </TD>
                  <TD className="text-muted">
                    {row.lastAmount != null
                      ? `${formatMoney(row.lastAmount)} · ${row.lastPeriod} (${row.lastPaymentDate})`
                      : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}
