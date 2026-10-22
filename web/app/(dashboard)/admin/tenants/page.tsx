"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTenants, useCreateTenant, useSetTenantActive } from "@/hooks/useTenants";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const schema = z.object({
  businessName: z.string().min(1, "Ingresá el nombre del negocio"),
  ownerName: z.string().min(1, "Ingresá el nombre del dueño"),
  username: z.string().min(1, "Ingresá el usuario"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const setActive = useSetTenantActive();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessName: "", ownerName: "", username: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    try {
      const result = await createTenant.mutateAsync(values);
      setMessage({ type: "ok", text: `"${result.name}" creado, con usuario "${result.owner.username}" como dueño.` });
      reset({ businessName: "", ownerName: "", username: "", password: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo crear el taller." });
    }
  }

  async function toggleActive(id: number, active: boolean) {
    setWorkingId(id);
    setMessage(null);
    try {
      await setActive.mutateAsync({ id, active: !active });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Talleres</h1>

      {message && <div className="mb-4"><Alert type={message.type}>{message.text}</Alert></div>}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <Card>
          <CardTitle>Nuevo taller</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nombre del negocio</Label>
              <Input placeholder="Lubricentro Sur" {...register("businessName")} />
              {errors.businessName && <p className="mt-1 text-xs text-danger">{errors.businessName.message}</p>}
            </div>
            <div>
              <Label>Nombre del dueño</Label>
              <Input placeholder="Juan Pérez" {...register("ownerName")} />
              {errors.ownerName && <p className="mt-1 text-xs text-danger">{errors.ownerName.message}</p>}
            </div>
            <div>
              <Label>Usuario</Label>
              <Input placeholder="juan.perez" {...register("username")} />
              {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creando..." : "Crear taller"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Talleres registrados</CardTitle>
          <TableWrapper>
            <THead>
              <th>Nombre</th>
              <th>Creado</th>
              <th>Estado</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={4}>Cargando...</EmptyRow>}
              {!isLoading && tenants?.length === 0 && <EmptyRow colSpan={4}>Todavía no hay talleres.</EmptyRow>}
              {tenants?.map((t) => (
                <TR key={t.tenantId}>
                  <TD>{t.name}</TD>
                  <TD className="text-muted">{new Date(t.createdAt).toLocaleDateString("es-AR")}</TD>
                  <TD className={t.active ? "text-success" : "text-danger"}>{t.active ? "Activo" : "Inactivo"}</TD>
                  <TD>
                    <Button
                      size="sm"
                      variant={t.active ? "danger" : "secondary"}
                      disabled={workingId === t.tenantId}
                      onClick={() => toggleActive(t.tenantId, t.active)}
                    >
                      {t.active ? "Desactivar" : "Activar"}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}
