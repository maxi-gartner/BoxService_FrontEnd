"use client";

import { useState } from "react";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import { useAdminClients } from "@/hooks/useAdminClients";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";

const ROLE_LABEL: Record<string, string> = { dueno: "Dueño", empleado: "Empleado", superadmin: "Superadmin" };

export default function UsuariosPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: clientRows, isLoading: clientsLoading } = useAdminClients();
  const updateUser = useUpdateUser();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Usuarios</h1>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <section>
        <h2 className="text-lg font-semibold text-light mb-3">Dueños y empleados</h2>
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
              {usersLoading && <EmptyRow colSpan={6}>Cargando...</EmptyRow>}
              {!usersLoading && users?.length === 0 && <EmptyRow colSpan={6}>No hay usuarios todavía.</EmptyRow>}
              {users
                ?.filter((u) => u.role !== "superadmin")
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
        <h2 className="text-lg font-semibold text-light mb-3">Clientes</h2>
        <Card>
          <TableWrapper>
            <THead>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Taller</th>
            </THead>
            <TBody>
              {clientsLoading && <EmptyRow colSpan={4}>Cargando...</EmptyRow>}
              {!clientsLoading && clientRows?.length === 0 && <EmptyRow colSpan={4}>No hay clientes todavía.</EmptyRow>}
              {clientRows?.map((row) => (
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
