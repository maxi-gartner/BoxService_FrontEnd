"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState } from "react";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import { useAdminClients } from "@/hooks/useAdminClients";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";

const ROLE_LABEL: Record<string, string> = { dueno: "Dueño", empleado: "Empleado", superadmin: "Superadmin" };

function matches(term: string, ...values: (string | null | undefined)[]) {
  if (!term) return true;
  const needle = term.trim().toLowerCase();
  return values.some((v) => v?.toLowerCase().includes(needle));
}

export default function UsuariosPage() {
  const { data: users, isLoading: usersLoading, error: usersLoadError, refetch: refetchUsers } = useUsers();
  const { data: clientRows, isLoading: clientsLoading, error: adminClientsLoadError, isLoading: adminClientsLoading, refetch: refetchAdminClients } = useAdminClients();
  const updateUser = useUpdateUser();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  async function toggleActive(id: number, active: boolean) {
    setWorkingId(id);
    setMessage(null);
    try {
      await updateUser.mutateAsync({ id, data: { active: !active } });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  const loadError = usersLoadError ?? adminClientsLoadError;
  if (loadError) return <ErrorState error={loadError} resource="la información" onRetry={() => { if (usersLoadError) void refetchUsers(); if (adminClientsLoadError) void refetchAdminClients(); }} />;
  if (usersLoading || adminClientsLoading) return <LoadingState label="Cargando la información..." />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Usuarios</h1>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-light">Dueños y empleados</h2>
          <Input
            placeholder="Buscar por nombre, usuario o taller…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>
        <Card>
          <TableWrapper>
            <THead>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Taller</th>
              <th>Estado</th>
              <th></th>
            </THead>
            <TBody>
              {usersLoading && <EmptyRow colSpan={6}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
              {!usersLoading && users?.filter((u) => u.role !== "superadmin").length === 0 && (
                <EmptyRow colSpan={6}>No hay usuarios todavía.</EmptyRow>
              )}
              {!usersLoading && !!users?.filter((u) => u.role !== "superadmin").length && users.filter((u) => u.role !== "superadmin" && matches(userSearch, u.name, u.username, u.tenantName)).length === 0 && (
                <EmptyRow colSpan={6}>Ningún usuario coincide con la búsqueda.</EmptyRow>
              )}
              {users
                ?.filter((u) => u.role !== "superadmin" && matches(userSearch, u.name, u.username, u.tenantName))
                .map((u) => (
                  <TR key={u.userId}>
                    <TD>{u.name}</TD>
                    <TD className="text-muted">{u.username}</TD>
                    <TD className="text-muted">{ROLE_LABEL[u.role] ?? u.role}</TD>
                    <TD className="text-accent">{u.tenantName ?? "—"}</TD>
                    <TD className={u.active ? "text-success" : "text-danger"}>{u.active ? "Activo" : "Inactivo"}</TD>
                    <TD className="flex gap-2">
                      <Button
                        size="sm"
                        variant={u.active ? "danger" : "secondary"}
                        disabled={workingId === u.userId}
                        onClick={() => toggleActive(u.userId, u.active)}
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </Button>
                      <ResetPasswordButton userId={u.userId} onDone={(msg) => msg && setMessage(msg)} />
                    </TD>
                  </TR>
                ))}
            </TBody>
          </TableWrapper>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-light">Clientes</h2>
          <Input
            placeholder="Buscar por nombre, teléfono, email o taller…"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>
        <Card>
          <TableWrapper>
            <THead>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Taller</th>
            </THead>
            <TBody>
              {clientsLoading && <EmptyRow colSpan={4}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
              {!clientsLoading && clientRows?.length === 0 && <EmptyRow colSpan={4}>No hay clientes todavía.</EmptyRow>}
              {!clientsLoading && !!clientRows?.length && clientRows.filter((row) => matches(clientSearch, row.client.name, row.client.phone, row.client.email, row.tenantName)).length === 0 && (
                <EmptyRow colSpan={4}>Ningún cliente coincide con la búsqueda.</EmptyRow>
              )}
              {clientRows
                ?.filter((row) => matches(clientSearch, row.client.name, row.client.phone, row.client.email, row.tenantName))
                .map((row) => (
                <TR key={row.client.clientId}>
                  <TD>{row.client.name}</TD>
                  <TD className="text-muted">{row.client.phone}</TD>
                  <TD className="text-muted">{row.client.email}</TD>
                  <TD className="text-accent">{row.tenantName}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </section>
    </div>
  );
}
