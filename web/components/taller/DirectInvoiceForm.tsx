"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { formatMoney } from "@/lib/utils";
import type { InvoiceDetailRequest } from "@/types/entities";

type Row = { key: number; type: "labor" | "part"; description: string; quantity: string; unitPrice: string };
const initialRow = (key: number, description = ""): Row => ({ key, type: "labor", description, quantity: "1", unitPrice: "" });

export function DirectInvoiceForm({ serviceType, onSubmit, onCancel }: {
  serviceType: string; onSubmit: (details: InvoiceDetailRequest[]) => Promise<void>; onCancel: () => void;
}) {
  const { data: catalog , error: catalogError, isLoading: loadingCatalog } = useCatalog();
  const [rows, setRows] = useState<Row[]>([initialRow(1, serviceType)]);
  const [nextKey, setNextKey] = useState(2);
  const [catalogId, setCatalogId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const subtotal = (row: Row) => Math.round((Number(row.quantity) * Number(row.unitPrice) + Number.EPSILON) * 100) / 100;
  const total = Math.round(rows.reduce((sum, row) => sum + subtotal(row), 0) * 100) / 100;
  const valid = rows.length > 0 && rows.length <= 100 && rows.every(row => row.description.trim().length > 0
    && row.description.trim().length <= 200 && row.unitPrice.trim() !== "" && Number(row.quantity) > 0
    && Number.isFinite(Number(row.quantity)) && Number.isFinite(Number(row.unitPrice)) && Number(row.unitPrice) >= 0)
    && Number.isFinite(total) && total > 0 && total <= 99999999.99;

  function update(key: number, patch: Partial<Row>) {
    setRows(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
  }
  function add(fromCatalog = false) {
    const item = fromCatalog ? catalog?.find(c => String(c.catalogId) === catalogId) : undefined;
    if (fromCatalog && !item) return;
    setRows(current => [...current, item ? { key: nextKey, type: item.type, description: item.name, quantity: "1", unitPrice: String(item.price) } : initialRow(nextKey)]);
    setNextKey(key => key + 1); setCatalogId("");
  }
  async function emit() {
    if (busy || !valid) return;
    setBusy(true); setError("");
    try { await onSubmit(rows.map(row => ({ type: row.type, description: row.description.trim(), quantity: Number(row.quantity), unitPrice: Number(row.unitPrice) }))); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo emitir la factura."); }
    finally { setBusy(false); }
  }

  return <form className="space-y-4 rounded-lg border border-border bg-surface-2 p-4" onSubmit={event => { event.preventDefault(); void emit(); }}>
    <h3 className="font-semibold">Facturar service sin presupuesto</h3>
    <p className="text-sm text-muted">Cargá los conceptos y precios del trabajo realizado. No es necesario crear un presupuesto.</p>
    {error && <Alert type="error">{error}</Alert>}
    <fieldset disabled={busy} className="space-y-3">
      {loadingCatalog && <LoadingState label="Cargando catálogo..." />}
      {catalogError && <p role="alert" className="text-sm text-danger">No se pudo cargar el catálogo. Podés cargar los conceptos manualmente.</p>}
      <div className="flex flex-wrap gap-2">
        <Select aria-label="Concepto del catálogo" value={catalogId} onChange={event => setCatalogId(event.target.value)}>
          <option value="">Elegir del catálogo...</option>
          {catalog?.map(item => <option key={item.catalogId} value={item.catalogId}>{item.name} — {formatMoney(item.price)}</option>)}
        </Select>
        <Button type="button" size="sm" variant="secondary" disabled={!catalogId || rows.length >= 100} onClick={() => add(true)}>Agregar del catálogo</Button>
        <Button type="button" size="sm" variant="secondary" disabled={rows.length >= 100} onClick={() => add()}>+ Concepto manual</Button>
      </div>
      {rows.map((row, index) => <div key={row.key} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div><Label htmlFor={`type-${row.key}`}>Tipo</Label><Select id={`type-${row.key}`} value={row.type} onChange={event => update(row.key, { type: event.target.value as Row["type"] })}><option value="labor">Mano de obra</option><option value="part">Repuesto</option></Select></div>
        <div className="lg:col-span-2"><Label htmlFor={`description-${row.key}`}>Descripción</Label><Input id={`description-${row.key}`} value={row.description} maxLength={200} required onChange={event => update(row.key, { description: event.target.value })} /></div>
        <div><Label htmlFor={`quantity-${row.key}`}>Cantidad</Label><Input id={`quantity-${row.key}`} type="number" min="0.01" max="99999999.99" step="0.01" required value={row.quantity} onChange={event => update(row.key, { quantity: event.target.value })} /></div>
        <div><Label htmlFor={`price-${row.key}`}>Precio unitario</Label><Input id={`price-${row.key}`} type="number" min="0" max="99999999.99" step="0.01" required value={row.unitPrice} onChange={event => update(row.key, { unitPrice: event.target.value })} /></div>
        <div className="space-y-2"><p className="text-xs text-muted">Subtotal</p><p>{formatMoney(Number.isFinite(subtotal(row)) ? subtotal(row) : 0)}</p><Button type="button" size="sm" variant="danger" aria-label={`Quitar concepto ${index + 1}`} onClick={() => setRows(current => current.filter(item => item.key !== row.key))}>Quitar</Button></div>
      </div>)}
      <p className="text-right font-semibold">Total: {formatMoney(Number.isFinite(total) ? total : 0)}</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" loading={busy} disabled={!valid}>{busy ? "Emitiendo..." : "Emitir factura"}</Button></div>
    </fieldset>
  </form>;
}
