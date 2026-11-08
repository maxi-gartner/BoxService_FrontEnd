"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatMoney } from "@/lib/utils";
import type { BudgetDetail, BudgetDetailRequest } from "@/types/entities";

type EditableDetail = BudgetDetailRequest & { key: string };

function toEditable(details: BudgetDetail[]): EditableDetail[] {
  return details.map((d) => ({
    key: `d-${d.detailId}`,
    type: d.type,
    description: d.description,
    quantity: d.quantity,
    unitPrice: d.unitPrice,
  }));
}

// Editor de ítems de un presupuesto no finalizado — se usa tanto desde
// "Realizar trabajo" (Taller) como desde "Editar" en Presupuestos. Por
// si a último momento hay que sumar o sacar algo sin cancelar todo.
export function BudgetDetailsEditor({
  details,
  onSave,
  saving,
  saveLabel = "Guardar cambios",
  onFinalize,
  finalizing,
  finalizeLabel = "Finalizar trabajo",
}: {
  details: BudgetDetail[];
  onSave: (details: BudgetDetailRequest[]) => void;
  saving: boolean;
  saveLabel?: string;
  /** Si se pasa, agrega un segundo botón que recibe los mismos ítems
   * actuales — para "Realizar trabajo": guarda y genera el service en
   * un solo paso, sin tener que re-leer el servidor. */
  onFinalize?: (details: BudgetDetailRequest[]) => void;
  finalizing?: boolean;
  finalizeLabel?: string;
}) {
  const [items, setItems] = useState<EditableDetail[]>(() => toEditable(details));
  const [nextKey, setNextKey] = useState(1);

  function update(key: string, patch: Partial<EditableDetail>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function remove(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function addItem() {
    setItems((prev) => [...prev, { key: `new-${nextKey}`, type: "part", description: "", quantity: 1, unitPrice: 0 }]);
    setNextKey((n) => n + 1);
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const valid = items.length > 0 && items.every((it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface-2 p-3">
          <div className="min-w-40 flex-1">
            <Input
              placeholder="Descripción"
              value={item.description}
              onChange={(e) => update(item.key, { description: e.target.value })}
            />
          </div>
          <Select
            value={item.type}
            onChange={(e) => update(item.key, { type: e.target.value as "labor" | "part" })}
            className="w-32"
          >
            <option value="labor">Mano de obra</option>
            <option value="part">Repuesto</option>
          </Select>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => update(item.key, { quantity: Number(e.target.value) })}
            className="w-20"
            placeholder="Cant."
          />
          <Input
            type="number"
            value={item.unitPrice}
            onChange={(e) => update(item.key, { unitPrice: Number(e.target.value) })}
            className="w-28"
            placeholder="Precio"
          />
          <span className="w-24 text-right text-sm text-muted">{formatMoney(item.quantity * item.unitPrice)}</span>
          <Button size="sm" variant="danger" onClick={() => remove(item.key)}>
            Quitar
          </Button>
        </div>
      ))}

      <Button size="sm" variant="secondary" onClick={addItem}>
        + Agregar ítem
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="font-semibold">
          Total: <span className="text-accent">{formatMoney(total)}</span>
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!valid || saving}
            onClick={() => onSave(items.map(({ key, ...rest }) => rest))}
          >
            {saving ? "Guardando..." : saveLabel}
          </Button>
          {onFinalize && (
            <Button disabled={!valid || finalizing} onClick={() => onFinalize(items.map(({ key, ...rest }) => rest))}>
              {finalizing ? "Generando..." : finalizeLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
