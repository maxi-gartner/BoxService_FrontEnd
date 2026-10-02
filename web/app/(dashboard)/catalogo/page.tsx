"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
} from "@/hooks/useCatalog";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatMoney } from "@/lib/utils";
import type { CatalogItem } from "@/types/entities";

const schema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  type: z.enum(["labor", "part"]),
  price: z
    .string()
    .min(1, "Ingresá el precio")
    .refine((v) => Number(v) >= 0, "El precio no puede ser negativo"),
});
type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<string, string> = { labor: "Mano de obra", part: "Repuesto" };

function EditRow({
  item,
  onDone,
}: {
  item: CatalogItem;
  onDone: (msg: { type: "ok" | "error"; text: string } | null) => void;
}) {
  const update = useUpdateCatalogItem();
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(item.type);
  const [price, setPrice] = useState(String(item.price));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await update.mutateAsync({ id: item.catalogId, data: { name, type, price: Number(price) } });
      onDone({ type: "ok", text: `"${name}" actualizado.` });
    } catch (err) {
      onDone({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <TR className="bg-surface-2">
      <TD>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TD>
      <TD>
        <Select value={type} onChange={(e) => setType(e.target.value as CatalogItem["type"])}>
          <option value="labor">Mano de obra</option>
          <option value="part">Repuesto</option>
        </Select>
      </TD>
      <TD>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="max-w-32" />
      </TD>
      <TD className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={save}>
          Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDone(null)}>
          Cancelar
        </Button>
      </TD>
    </TR>
  );
}

export default function CatalogoPage() {
  const { data: items, isLoading } = useCatalog();
  const createItem = useCreateCatalogItem();
  const deleteItem = useDeleteCatalogItem();

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "labor", name: "", price: "" },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    try {
      await createItem.mutateAsync({ name: values.name, type: values.type, price: Number(values.price) });
      setMessage({ type: "ok", text: `"${values.name}" agregado al catálogo.` });
      reset({ type: "labor", name: "", price: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo agregar." });
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (!confirm(`¿Borrar "${item.name}" del catálogo?`)) return;
    setWorkingId(item.catalogId);
    setMessage(null);
    try {
      await deleteItem.mutateAsync(item.catalogId);
      setMessage({ type: "ok", text: `"${item.name}" borrado.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo borrar." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Catálogo de precios</h1>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card>
          <CardTitle>Nuevo ítem</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input placeholder="Cambio de aceite" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Tipo</Label>
              <Select {...register("type")}>
                <option value="labor">Mano de obra</option>
                <option value="part">Repuesto</option>
              </Select>
            </div>
            <div>
              <Label>Precio</Label>
              <Input type="number" placeholder="16000" {...register("price")} />
              {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Agregar al catálogo"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Ítems del catálogo</CardTitle>
          <TableWrapper>
            <THead>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={4}>Cargando...</EmptyRow>}
              {!isLoading && items?.length === 0 && <EmptyRow colSpan={4}>El catálogo está vacío.</EmptyRow>}
              {items?.map((item) =>
                editingId === item.catalogId ? (
                  <EditRow
                    key={item.catalogId}
                    item={item}
                    onDone={(msg) => {
                      setEditingId(null);
                      if (msg) setMessage(msg);
                    }}
                  />
                ) : (
                  <TR key={item.catalogId}>
                    <TD>{item.name}</TD>
                    <TD className="text-muted">{TYPE_LABEL[item.type] ?? item.type}</TD>
                    <TD>{formatMoney(item.price)}</TD>
                    <TD className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(item.catalogId)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={workingId === item.catalogId}
                        onClick={() => handleDelete(item)}
                      >
                        Borrar
                      </Button>
                    </TD>
                  </TR>
                ),
              )}
            </TBody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}
