"use client";

import { useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCreateBudget } from "@/hooks/useBudgets";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { formatMoney } from "@/lib/utils";
import type { BudgetDetailRequest, Vehicle } from "@/types/entities";

type ItemRow = BudgetDetailRequest & { key: number };

let keySeq = 0;

export function NewBudgetTab({ vehicle, onCreated }: { vehicle: Vehicle; onCreated: () => void }) {
  const { data: catalog } = useCatalog();
  const createBudget = useCreateBudget();

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [catalogChoice, setCatalogChoice] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  function addItem(preset?: { type: "labor" | "part"; description: string; unitPrice: number }) {
    keySeq += 1;
    setItems((prev) => [
      ...prev,
      {
        key: keySeq,
        type: preset?.type ?? "labor",
        description: preset?.description ?? "",
        quantity: 1,
        unitPrice: preset?.unitPrice ?? 0,
      },
    ]);
  }

  function addFromCatalog() {
    const item = catalog?.find((c) => String(c.catalogId) === catalogChoice);
    if (!item) return;
    addItem({ type: item.type, description: item.name, unitPrice: item.price });
    setCatalogChoice("");
  }

  function updateItem(key: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function handleSave() {
    setMessage(null);
    if (!items.length) {
      setMessage({ type: "error", text: "Agregá al menos un ítem." });
      return;
    }

    try {
      const created = await createBudget.mutateAsync({
        vehicleId: vehicle.vehicleId,
        notes: notes || null,
        details: items.map(({ key: _key, ...rest }) => rest),
      });
      setMessage({ type: "ok", text: `Presupuesto ${created.number} creado.` });
      setItems([]);
      setNotes("");
      onCreated();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo crear el presupuesto." });
    }
  }

  return (
    <Card>
      <CardTitle>Nuevo presupuesto</CardTitle>
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="mb-4 mt-4">
        <Label>Notas (opcional)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Cliente pide revisar suspensión también" />
      </div>

      <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
        <span className="text-xs font-semibold uppercase text-muted">Ítems del presupuesto</span>
        <div className="flex gap-2">
          <Select value={catalogChoice} onChange={(e) => setCatalogChoice(e.target.value)} className="max-w-[240px]">
            <option value="">Elegir del catálogo...</option>
            {catalog?.map((c) => (
              <option key={c.catalogId} value={c.catalogId}>
                {c.name} — {formatMoney(c.price)}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" type="button" onClick={addFromCatalog}>
            Agregar
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={() => addItem()}>
            + Ítem manual
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[110px_1fr_72px_110px_100px_auto] gap-2 items-center">
            <Select value={item.type} onChange={(e) => updateItem(item.key, { type: e.target.value as "labor" | "part" })}>
              <option value="labor">Mano de obra</option>
              <option value="part">Repuesto</option>
            </Select>
            <Input
              placeholder="Descripción"
              value={item.description}
              onChange={(e) => updateItem(item.key, { description: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
            />
            <span className="text-sm font-bold text-accent text-right">{formatMoney(item.quantity * item.unitPrice)}</span>
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              aria-label="Eliminar ítem"
              className="text-danger text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center gap-4 pt-4 border-t border-border">
        <span className="text-xs font-bold uppercase text-muted">Total estimado</span>
        <span className="text-2xl font-bold text-accent">{formatMoney(total)}</span>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={createBudget.isPending}>
          {createBudget.isPending ? "Guardando..." : "Guardar presupuesto"}
        </Button>
      </div>
    </Card>
  );
}
