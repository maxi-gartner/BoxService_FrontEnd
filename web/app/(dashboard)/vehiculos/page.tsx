"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVehicles, useCreateVehicle } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const schema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  plate: z.string().min(1, "Ingresá la patente"),
  brand: z.string().min(1, "Ingresá la marca"),
  model: z.string().min(1, "Ingresá el modelo"),
  year: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 1900 && Number(v) <= 2100), "Año inválido"),
  currentMileage: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, "Kilometraje inválido"),
});
type FormValues = z.infer<typeof schema>;

export default function VehiculosPage() {
  const { data: vehicles, isLoading } = useVehicles();
  const { data: clients } = useClients();
  const createVehicle = useCreateVehicle();

  const clientsById = useMemo(
    () => new Map((clients ?? []).map((c) => [c.clientId, c.name])),
    [clients],
  );

  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError("");
    setFormOk("");
    try {
      const created = await createVehicle.mutateAsync({
        clientId: Number(values.clientId),
        plate: values.plate.trim().toUpperCase(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: values.year ? Number(values.year) : null,
        currentMileage: values.currentMileage ? Number(values.currentMileage) : 0,
      });
      setFormOk(`Vehículo ${created.plate} registrado.`);
      reset();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "No se pudo registrar el vehículo.");
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = (vehicles ?? []).filter((v) => {
    if (!term) return true;
    const clientName = clientsById.get(v.clientId) ?? "";
    return [v.plate, v.brand, v.model, clientName].join(" ").toLowerCase().includes(term);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vehículos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <Card>
          <CardTitle>Registrar vehículo</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select {...register("clientId")} defaultValue="">
                <option value="" disabled>
                  Elegí un cliente…
                </option>
                {clients?.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.clientId && <p className="mt-1 text-xs text-danger">{errors.clientId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Patente</Label>
                <Input placeholder="AB123CD" {...register("plate")} />
                {errors.plate && <p className="mt-1 text-xs text-danger">{errors.plate.message}</p>}
              </div>
              <div>
                <Label>Año</Label>
                <Input type="number" placeholder="2020" {...register("year")} />
                {errors.year && <p className="mt-1 text-xs text-danger">{errors.year.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Marca</Label>
                <Input placeholder="Toyota" {...register("brand")} />
                {errors.brand && <p className="mt-1 text-xs text-danger">{errors.brand.message}</p>}
              </div>
              <div>
                <Label>Modelo</Label>
                <Input placeholder="Corolla" {...register("model")} />
                {errors.model && <p className="mt-1 text-xs text-danger">{errors.model.message}</p>}
              </div>
            </div>
            <div>
              <Label>Kilometraje actual</Label>
              <Input type="number" placeholder="55000" {...register("currentMileage")} />
            </div>
            <Alert type="error">{formError}</Alert>
            <Alert type="ok">{formOk}</Alert>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Guardar vehículo"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <CardTitle className="mb-0">Vehículos registrados</CardTitle>
            <Input
              placeholder="Buscar por patente, marca, modelo o cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <TableWrapper>
            <THead>
              <th>Patente</th>
              <th>Marca / Modelo</th>
              <th>Año</th>
              <th>KM</th>
              <th>Cliente</th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
              {!isLoading && filtered.length === 0 && (
                <EmptyRow colSpan={5}>
                  {term ? "Ningún vehículo coincide con la búsqueda." : "No hay vehículos registrados."}
                </EmptyRow>
              )}
              {filtered.map((v) => (
                <TR key={v.vehicleId}>
                  <TD className="text-accent">{v.plate}</TD>
                  <TD>
                    {v.brand} {v.model}
                  </TD>
                  <TD>{v.year ?? "-"}</TD>
                  <TD>{v.currentMileage.toLocaleString("es-AR")}</TD>
                  <TD>{clientsById.get(v.clientId) ?? `Cliente #${v.clientId}`}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}
