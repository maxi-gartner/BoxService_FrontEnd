"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useClients, useClientVehicles, useCreateClient, useInvitePortal } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const schema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function ClientesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data: clientsPage, isLoading } = useClients({ page, pageSize: 25, search: debouncedSearch || undefined });
  const clients = clientsPage?.items;
  const createClient = useCreateClient();
  const invitePortal = useInvitePortal();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const { data: vehicles, isLoading: loadingVehicles } = useClientVehicles(selectedClientId);
  const [inviteError, setInviteError] = useState("");
  const [invitingClientId, setInvitingClientId] = useState<number | null>(null);

  // Reset de página al cambiar el buscador — ajuste de estado durante el
  // render (patrón recomendado por React), no un efecto.
  const [searchForPage, setSearchForPage] = useState(debouncedSearch);
  if (debouncedSearch !== searchForPage) {
    setSearchForPage(debouncedSearch);
    setPage(1);
  }

  async function handleInvite(clientId: number) {
    setInviteError("");
    setInvitingClientId(clientId);
    try {
      const invite = await invitePortal.mutateAsync(clientId);
      // Un solo click: generamos el link y abrimos WhatsApp con el
      // mensaje ya armado, listo para mandar.
      window.open(invite.whatsappUrl, "_blank");
    } catch (err) {
      setInviteError(err instanceof ApiClientError ? err.message : "No se pudo generar la invitación.");
    } finally {
      setInvitingClientId(null);
    }
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 mb-6">
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Clientes activos</CardTitle>
            <Input
              placeholder="Buscar por nombre, teléfono o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          <Alert type="error">{inviteError}</Alert>
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
              {!isLoading && clients?.length === 0 && (
                <EmptyRow colSpan={5}>
                  {debouncedSearch ? "Ningún cliente coincide con la búsqueda." : "No hay clientes cargados."}
                </EmptyRow>
              )}
              {clients?.map((client) => (
                <TR key={client.clientId}>
                  <TD>{client.clientId}</TD>
                  <TD>{client.name}</TD>
                  <TD>{client.phone}</TD>
                  <TD>{client.email}</TD>
                  <TD>
                    <div className="flex flex-col items-start gap-1.5 whitespace-nowrap sm:flex-row sm:items-center sm:gap-3">
                      <button
                        onClick={() => {
                          setSelectedClientId(client.clientId);
                          setSelectedClientName(client.name);
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Ver vehículos
                      </button>
                      <button
                        onClick={() => handleInvite(client.clientId)}
                        disabled={invitingClientId === client.clientId}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                        title="Genera un link para que el cliente vea el estado de su auto y abre WhatsApp para mandárselo"
                      >
                        {invitingClientId === client.clientId ? "Generando..." : "Invitar al portal"}
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
          {clientsPage && (
            <Pagination
              page={clientsPage.page}
              totalPages={clientsPage.totalPages}
              totalCount={clientsPage.totalCount}
              onPageChange={setPage}
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="mb-0">Vehículos del cliente</CardTitle>
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
