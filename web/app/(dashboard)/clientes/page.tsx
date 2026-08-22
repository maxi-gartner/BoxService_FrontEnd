"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useClients, useClientVehicles, useCreateClient } from "@/hooks/useClients";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const schema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function ClientesPage() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const { data: vehicles, isLoading: loadingVehicles } = useClientVehicles(selectedClientId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  async function onSubmit(values: FormValues) {
    setFormError("");
    setFormOk("");
    try {
      const created = await createClient.mutateAsync(values);
      setFormOk(`Cliente ${created.name} creado.`);
      reset();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "No se pudo crear el cliente.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mb-6">
        <Card>
          <CardTitle>Nuevo cliente</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input placeholder="Juan Pérez" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input placeholder="3431234567" {...register("phone")} />
            </div>
            <div>
              <Label>Email</Label>
              <Input placeholder="juan@email.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <Alert type="error">{formError}</Alert>
            <Alert type="ok">{formOk}</Alert>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Guardar cliente"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Clientes activos</CardTitle>
          <TableWrapper>
            <THead>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
              {!isLoading && clients?.length === 0 && <EmptyRow colSpan={5}>No hay clientes cargados.</EmptyRow>}
              {clients?.map((client) => (
                <TR key={client.clientId}>
                  <TD>{client.clientId}</TD>
                  <TD>{client.name}</TD>
                  <TD>{client.phone}</TD>
                  <TD>{client.email}</TD>
                  <TD>
                    <button
                      onClick={() => {
                        setSelectedClientId(client.clientId);
                        setSelectedClientName(client.name);
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Ver vehículos
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Vehículos del cliente</CardTitle>
          <p className="text-sm text-muted">
            {selectedClientId ? `Vehículos de ${selectedClientName}` : "Seleccioná un cliente para ver sus vehículos."}
          </p>
        </div>
        <TableWrapper>
          <THead>
            <th>Patente</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Año</th>
            <th>KM</th>
          </THead>
          <TBody>
            {!selectedClientId && <EmptyRow colSpan={5}>Sin datos para mostrar.</EmptyRow>}
            {selectedClientId && loadingVehicles && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
            {selectedClientId && !loadingVehicles && vehicles?.length === 0 && (
              <EmptyRow colSpan={5}>Este cliente no tiene vehículos asociados todavía.</EmptyRow>
            )}
            {vehicles?.map((v) => (
              <TR key={v.vehicleId}>
                <TD className="text-accent">{v.plate}</TD>
                <TD>{v.brand}</TD>
                <TD>{v.model}</TD>
                <TD>{v.year ?? "-"}</TD>
                <TD>{v.currentMileage}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}
