"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { useSucursales, useCreateSucursal, useUpdateSucursal } from "@/hooks/useSucursales";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const ROLE_LABEL: Record<string, string> = { dueno: "Dueño", empleado: "Empleado" };

const userSchema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  username: z.string().min(1, "Ingresá el usuario"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  email: z.string().optional(),
});
type UserFormValues = z.infer<typeof userSchema>;

const sucursalSchema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  address: z.string().optional(),
});
type SucursalFormValues = z.infer<typeof sucursalSchema>;

type Message = { type: "ok" | "error"; text: string } | null;

function EmpleadosCard() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [message, setMessage] = useState<Message>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: "", username: "", password: "", email: "" } });

  async function onSubmit(values: UserFormValues) {
    setMessage(null);
    try {
      await createUser.mutateAsync({ ...values, email: values.email || undefined });
      setMessage({ type: "ok", text: `Empleado "${values.name}" creado.` });
      reset({ name: "", username: "", password: "", email: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo crear el empleado." });
    }
  }

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
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <Card>
        <CardTitle>Nuevo empleado</CardTitle>
        {message && <div className="mb-4"><Alert type={message.type}>{message.text}</Alert></div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input placeholder="Carlos López" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Usuario</Label>
            <Input placeholder="carlos.lopez" {...register("username")} />
            {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div>
            <Label>Email (opcional)</Label>
            <Input type="email" placeholder="carlos@taller.com" {...register("email")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando..." : "Crear empleado"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Empleados del taller</CardTitle>
        <TableWrapper>
          <THead>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </THead>
          <TBody>
            {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
            {!isLoading && users?.length === 0 && <EmptyRow colSpan={5}>Todavía no hay empleados.</EmptyRow>}
            {users?.map((u) => (
              <TR key={u.userId}>
                <TD>{u.name}</TD>
                <TD className="text-muted">{u.username}</TD>
                <TD className="text-muted">{ROLE_LABEL[u.role] ?? u.role}</TD>
                <TD className={u.active ? "text-success" : "text-danger"}>{u.active ? "Activo" : "Inactivo"}</TD>
                <TD>
                  {u.role !== "dueno" && (
                    <Button
                      size="sm"
                      variant={u.active ? "danger" : "secondary"}
                      disabled={workingId === u.userId}
                      onClick={() => toggleActive(u.userId, u.active)}
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}

function SucursalesCard() {
  const { data: sucursales, isLoading } = useSucursales();
  const createSucursal = useCreateSucursal();
  const updateSucursal = useUpdateSucursal();
  const [message, setMessage] = useState<Message>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SucursalFormValues>({ resolver: zodResolver(sucursalSchema), defaultValues: { name: "", address: "" } });

  async function onSubmit(values: SucursalFormValues) {
    setMessage(null);
    try {
      await createSucursal.mutateAsync({ name: values.name, address: values.address || undefined });
      setMessage({ type: "ok", text: `Sucursal "${values.name}" creada.` });
      reset({ name: "", address: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo crear la sucursal." });
    }
  }

  async function toggleActive(id: number, active: boolean) {
    setWorkingId(id);
    setMessage(null);
    try {
      await updateSucursal.mutateAsync({ id, data: { active: !active } });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <Card>
        <CardTitle>Nueva sucursal</CardTitle>
        {message && <div className="mb-4"><Alert type={message.type}>{message.text}</Alert></div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input placeholder="Casa Central" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Dirección (opcional)</Label>
            <Input placeholder="Av. Siempre Viva 123" {...register("address")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando..." : "Crear sucursal"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Sucursales</CardTitle>
        <TableWrapper>
          <THead>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th></th>
          </THead>
          <TBody>
            {isLoading && <EmptyRow colSpan={4}>Cargando...</EmptyRow>}
            {!isLoading && sucursales?.length === 0 && <EmptyRow colSpan={4}>Todavía no hay sucursales.</EmptyRow>}
            {sucursales?.map((s) => (
              <TR key={s.sucursalId}>
                <TD>{s.name}</TD>
                <TD className="text-muted">{s.address ?? "—"}</TD>
                <TD className={s.active ? "text-success" : "text-danger"}>{s.active ? "Activa" : "Inactiva"}</TD>
                <TD>
                  <Button
                    size="sm"
                    variant={s.active ? "danger" : "secondary"}
                    disabled={workingId === s.sucursalId}
                    onClick={() => toggleActive(s.sucursalId, s.active)}
                  >
                    {s.active ? "Desactivar" : "Activar"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}

export function AdminOwnerPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Administración del taller</h1>
      </div>
      <section>
        <h2 className="text-lg font-semibold text-light mb-3">Empleados</h2>
        <EmpleadosCard />
      </section>
      <section>
        <h2 className="text-lg font-semibold text-light mb-3">Sucursales</h2>
        <SucursalesCard />
      </section>
    </div>
  );
}
