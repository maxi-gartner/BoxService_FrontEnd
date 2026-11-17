"use client";
import { Spinner } from "@/components/ui/Spinner";


import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useClients, useClientVehicles, useCreateClient, useUpdateClient, useInvitePortal } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow, CardList, CardItem } from "@/components/ui/Table";
import type { Client } from "@/types/entities";

function ClientVehiclesModal({ clientId, clientName, onClose }: { clientId: number; clientName: string; onClose: () => void }) {
  const { data: vehicles, isLoading, error: vehiclesLoadError, refetch } = useClientVehicles(clientId);

  return (
    <Modal open onClose={onClose} title={`Vehículos de ${clientName}`}>
      {vehiclesLoadError && <ErrorState error={vehiclesLoadError} resource="los vehículos" onRetry={() => void refetch()} />}
      {isLoading && <LoadingState label="Cargando..." />}
      {!isLoading && !vehiclesLoadError && (
        <TableWrapper>
          <THead>
            <th>Patente</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Año</th>
            <th>KM</th>
          </THead>
          <TBody>
            {vehicles?.length === 0 && (
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
      )}
    </Modal>
  );
}

const schema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

function EditClientRow({
  client,
  onDone,
}: {
  client: Client;
  onDone: (msg: { type: "ok" | "error"; text: string } | null) => void;
}) {
  const updateClient = useUpdateClient();
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email);

  async function save() {
    try {
      await updateClient.mutateAsync({ id: client.clientId, data: { name, phone, email } });
      onDone({ type: "ok", text: `"${name}" actualizado.` });
    } catch (err) {
      onDone({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar el cliente." });
    }
  }

  return (
    <TR className="bg-surface-2">
      <TD>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TD>
      <TD>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </TD>
      <TD>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </TD>
      <TD className="flex gap-2">
        <Button size="sm" loading={updateClient.isPending} disabled={updateClient.isPending} onClick={save}>
          Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDone(null)}>
          Cancelar
        </Button>
      </TD>
    </TR>
  );
}

function EditClientCard({
  client,
  onDone,
}: {
  client: Client;
  onDone: (msg: { type: "ok" | "error"; text: string } | null) => void;
}) {
  const updateClient = useUpdateClient();
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email);

  async function save() {
    try {
      await updateClient.mutateAsync({ id: client.clientId, data: { name, phone, email } });
      onDone({ type: "ok", text: `"${name}" actualizado.` });
    } catch (err) {
      onDone({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar el cliente." });
    }
  }

  return (
    <CardItem className="bg-surface-2">
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Teléfono</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" loading={updateClient.isPending} disabled={updateClient.isPending} onClick={save}>
          Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDone(null)}>
          Cancelar
        </Button>
      </div>
    </CardItem>
  );
}

export default function ClientesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data: clientsPage, isLoading, error: clientsLoadError, isLoading: clientsLoading, refetch: refetchClients } = useClients({ page, pageSize: 25, search: debouncedSearch || undefined });
  const clients = clientsPage?.items;
  const createClient = useCreateClient();
  const invitePortal = useInvitePortal();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [invitingClientId, setInvitingClientId] = useState<number | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

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

  if (clientsLoadError) return <ErrorState error={clientsLoadError} resource="los clientes" onRetry={() => void refetchClients()} />;
  if (clientsLoading) return <LoadingState label="Cargando los clientes..." />;

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
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
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
          {editMessage && <Alert type={editMessage.type}>{editMessage.text}</Alert>}
          <TableWrapper className="hidden lg:block">
            <THead>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={4}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
              {!isLoading && clients?.length === 0 && (
                <EmptyRow colSpan={4}>
                  {debouncedSearch ? "Ningún cliente coincide con la búsqueda." : "No hay clientes cargados."}
                </EmptyRow>
              )}
              {clients?.map((client) =>
                editingClientId === client.clientId ? (
                  <EditClientRow
                    key={client.clientId}
                    client={client}
                    onDone={(msg) => {
                      setEditingClientId(null);
                      if (msg) setEditMessage(msg);
                    }}
                  />
                ) : (
                <TR key={client.clientId}>
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
                        onClick={() => {
                          setEditMessage(null);
                          setEditingClientId(client.clientId);
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleInvite(client.clientId)}
                        disabled={invitingClientId === client.clientId}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                        title="Genera un link para que el cliente vea el estado de su auto y abre WhatsApp para mandárselo"
                      >
                        {invitingClientId === client.clientId ? <span className="inline-flex items-center gap-2"><Spinner />Generando...</span> : "Invitar al portal"}
                      </button>
                    </div>
                  </TD>
                </TR>
                ),
              )}
            </TBody>
          </TableWrapper>

          <CardList>
            {isLoading && <LoadingState label="Cargando..." />}
            {!isLoading && clients?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                {debouncedSearch ? "Ningún cliente coincide con la búsqueda." : "No hay clientes cargados."}
              </p>
            )}
            {clients?.map((client) =>
              editingClientId === client.clientId ? (
                <EditClientCard
                  key={client.clientId}
                  client={client}
                  onDone={(msg) => {
                    setEditingClientId(null);
                    if (msg) setEditMessage(msg);
                  }}
                />
              ) : (
                <CardItem key={client.clientId}>
                  <p className="font-semibold text-light">{client.name}</p>
                  {client.phone && <p className="text-sm text-muted">{client.phone}</p>}
                  {client.email && <p className="text-sm text-muted">{client.email}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
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
                      onClick={() => {
                        setEditMessage(null);
                        setEditingClientId(client.clientId);
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleInvite(client.clientId)}
                      disabled={invitingClientId === client.clientId}
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                      title="Genera un link para que el cliente vea el estado de su auto y abre WhatsApp para mandárselo"
                    >
                      {invitingClientId === client.clientId ? <span className="inline-flex items-center gap-2"><Spinner />Generando...</span> : "Invitar al portal"}
                    </button>
                  </div>
                </CardItem>
              ),
            )}
          </CardList>

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

      {selectedClientId && (
        <ClientVehiclesModal
          clientId={selectedClientId}
          clientName={selectedClientName}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
}
