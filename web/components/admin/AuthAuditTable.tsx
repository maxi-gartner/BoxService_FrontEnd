"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmptyRow, TableWrapper, TBody, TD, THead, TR } from "@/components/ui/Table";
import { adminApi } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";

const EVENT_LABELS: Record<string, string> = {
  login: "Inicio de sesión",
  logout: "Cierre de sesión",
  password_reset_requested: "Solicitud de recuperación",
  password_reset_email: "Envío de email de recuperación",
  password_reset_completed: "Cambio de contraseña",
  admin_password_reset: "Reseteo administrativo",
  user_change: "Cambio de usuario o permisos",
  business_change: "Cambio de datos del negocio",
};

export function AuthAuditTable() {
  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "auth-audit"],
    queryFn: adminApi.listAuthAudit,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="mt-1 text-sm text-muted">Eventos de acceso, recuperación de cuenta y cambios realizados.</p>
      </div>

      {isError && (
        <Alert type="error">
          {error instanceof ApiClientError ? error.message : "No se pudo cargar la auditoría."}
        </Alert>
      )}

      <Card>
        <TableWrapper>
          <THead>
            <th>Fecha</th>
            <th>Evento</th>
            <th>Resultado</th>
            <th>Usuario</th>
            <th>Recurso</th>
            <th>IP</th>
          </THead>
          <TBody>
            {isLoading && <EmptyRow colSpan={6}>Cargando auditoría...</EmptyRow>}
            {!isLoading && !isError && events?.length === 0 && <EmptyRow colSpan={6}>Todavía no hay eventos registrados.</EmptyRow>}
            {events?.map((event, index) => (
              <TR key={`${event.createdAt}-${event.eventType}-${index}`}>
                <TD className="whitespace-nowrap">{new Date(event.createdAt).toLocaleString("es-AR")}</TD>
                <TD>{EVENT_LABELS[event.eventType] ?? event.eventType}</TD>
                <TD>{event.outcome.replaceAll("_", " ")}</TD>
                <TD className="text-muted">
                  {event.actorUserId ? `#${event.actorUserId}` : "Anónimo"}
                  {event.targetUserId && event.targetUserId !== event.actorUserId ? ` → #${event.targetUserId}` : ""}
                </TD>
                <TD className="font-mono text-xs">
                  {event.httpMethod && event.resourcePath ? `${event.httpMethod} ${event.resourcePath}` : "—"}
                </TD>
                <TD className="text-muted">{event.sourceIp ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}
