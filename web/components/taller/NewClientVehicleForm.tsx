"use client";
import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateClient } from "@/hooks/useClients";
import { useCreateVehicle, useTransferVehicle } from "@/hooks/useVehicles";
import { useVehicleBrands, useVehicleModels, useVehicleVersions } from "@/hooks/useVehicleCatalog";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Client, Vehicle, VehiclePlateConflict } from "@/types/entities";

function isPlateConflict(data: unknown): data is VehiclePlateConflict {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as VehiclePlateConflict).existingVehicleId === "number" &&
    typeof (data as VehiclePlateConflict).existingClientId === "number" &&
    typeof (data as VehiclePlateConflict).existingClientName === "string"
  );
}

const OTHER_BRAND = "__otra__";
const OTHER_MODEL = "__otro__";
const OTHER_VERSION = "__otra_version__";

const clientSchema = z.object({
  name: z.string().min(1, "Ingresá el nombre"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});
type ClientFormValues = z.infer<typeof clientSchema>;

const vehicleSchema = z.object({
  plate: z.string().min(1, "Ingresá la patente"),
  brand: z.string().min(1, "Ingresá la marca"),
  model: z.string().min(1, "Ingresá el modelo"),
  version: z.string().optional(),
  year: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 1900 && Number(v) <= 2100), "Año inválido"),
  currentMileage: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, "Kilometraje inválido"),
});
type VehicleFormValues = z.infer<typeof vehicleSchema>;

// Alta combinada para un cliente que llega de cero al taller: antes había
// que ir a Clientes, crearlo, ir a Vehículos, registrar el auto, y recién
// ahí volver a Taller a buscarlo. Mismos 2 formularios que esas páginas
// (mismos schemas, mismos endpoints vía los hooks existentes), uno después
// del otro, terminando en el vehículo recién creado listo para seleccionar.
//
// VehicleStep se exporta aparte porque VehicleSearch la reusa sola, sin
// ClientStep, para el caso "cliente ya existe, auto nuevo" (ver ahí).
export function NewClientVehicleForm({
  onCreated,
  onCancel,
}: {
  onCreated: (vehicle: Vehicle) => void;
  onCancel: () => void;
}) {
  const [client, setClient] = useState<Client | null>(null);

  if (!client) {
    return <ClientStep onCreated={setClient} onCancel={onCancel} />;
  }

  return (
    <VehicleStep
      client={client}
      onCreated={(vehicle) => onCreated({ ...vehicle, clientName: client.name })}
      onBack={() => setClient(null)}
      onCancel={onCancel}
    />
  );
}

function ClientStep({
  onCreated,
  onCancel,
}: {
  onCreated: (client: Client) => void;
  onCancel: () => void;
}) {
  const createClient = useCreateClient();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) });

  async function onSubmit(values: ClientFormValues) {
    setFormError("");
    try {
      const created = await createClient.mutateAsync(values);
      onCreated(created);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "No se pudo crear el cliente.");
    }
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">Paso 1 de 2 — Datos del cliente</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
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
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Siguiente: datos del vehículo"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function VehicleStep({
  client,
  onCreated,
  onBack,
  onCancel,
}: {
  client: Client;
  onCreated: (vehicle: Vehicle) => void;
  onBack?: () => void;
  onCancel: () => void;
}) {
  const createVehicle = useCreateVehicle();
  const transferVehicle = useTransferVehicle();
  const { data: brands, error: brandsError, isFetching: loadingBrands } = useVehicleBrands();
  const [formError, setFormError] = useState("");
  const [conflict, setConflict] = useState<VehiclePlateConflict | null>(null);
  const [transferError, setTransferError] = useState("");
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [customVersion, setCustomVersion] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleSchema) });

  const watchedBrand = watch("brand");
  const watchedModel = watch("model");
  const watchedVersion = watch("version");
  const brandId = brands?.find((b) => b.name === watchedBrand)?.id ?? null;
  const { data: models, error: modelsError, isFetching: loadingModels } = useVehicleModels(brandId);
  const modelId = models?.find((m) => m.name === watchedModel)?.id ?? null;
  const { data: versions, error: versionsError, isFetching: loadingVersions } = useVehicleVersions(brandId, modelId);

  function resetModelAndVersion() {
    setValue("model", "");
    setValue("version", "");
    setCustomModel(false);
    setCustomVersion(false);
  }

  function handleBrandSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === OTHER_BRAND) {
      setCustomBrand(true);
      setValue("brand", "");
    } else {
      setValue("brand", e.target.value, { shouldValidate: true });
    }
    resetModelAndVersion();
  }

  function handleModelSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === OTHER_MODEL) {
      setCustomModel(true);
      setValue("model", "");
    } else {
      setValue("model", e.target.value, { shouldValidate: true });
    }
    setValue("version", "");
    setCustomVersion(false);
  }

  function handleVersionSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === OTHER_VERSION) {
      setCustomVersion(true);
      setValue("version", "");
    } else {
      setValue("version", e.target.value);
    }
  }

  async function onSubmit(values: VehicleFormValues) {
    setFormError("");
    setConflict(null);
    try {
      const created = await createVehicle.mutateAsync({
        clientId: client.clientId,
        plate: values.plate.trim().toUpperCase(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        version: values.version?.trim() || undefined,
        year: values.year ? Number(values.year) : null,
        currentMileage: values.currentMileage ? Number(values.currentMileage) : 0,
      });
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 409 && isPlateConflict(err.data)) {
        setConflict(err.data);
        return;
      }
      setFormError(err instanceof ApiClientError ? err.message : "No se pudo registrar el vehículo.");
    }
  }

  // El auto ya está en el sistema a nombre de otro cliente de este mismo
  // taller (se vendió / cambió de dueño) — en vez de crear un vehículo
  // nuevo, re-apuntamos el existente al cliente actual. Conserva su
  // historial completo (services, presupuestos, facturas), que cuelga
  // del vehicleId, no del cliente.
  async function handleTransfer() {
    if (!conflict) return;
    setTransferError("");
    try {
      const vehicle = await transferVehicle.mutateAsync({
        vehicleId: conflict.existingVehicleId,
        newClientId: client.clientId,
      });
      onCreated(vehicle);
    } catch (err) {
      setTransferError(err instanceof ApiClientError ? err.message : "No se pudo transferir el vehículo.");
    }
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        {onBack ? "Paso 2 de 2 — " : ""}
        Vehículo de <span className="text-light">{client.name}</span>
        {onBack && (
          <>
            {" "}(
            <button type="button" onClick={onBack} className="text-accent hover:underline">
              cambiar cliente
            </button>
            )
          </>
        )}
      </p>
      {(loadingBrands || loadingModels || loadingVersions) && (
        <LoadingState label="Cargando opciones de vehículos..." />
      )}
      {(brandsError || modelsError || versionsError) && (
        <p role="alert" className="mb-3 text-sm text-danger">
          No se pudieron cargar algunas opciones. Podés elegir Otra marca / Otro modelo para ingresarlos manualmente.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
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
        <div>
          <Label>Marca</Label>
          {customBrand || !brands?.length ? (
            <Input placeholder="Toyota" {...register("brand")} />
          ) : (
            <Select value={watchedBrand ?? ""} onChange={handleBrandSelect}>
              <option value="" disabled>
                Elegí una marca…
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
              <option value={OTHER_BRAND}>Otra (escribir)…</option>
            </Select>
          )}
          {customBrand && (
            <button
              type="button"
              className="mt-1 text-xs text-accent hover:underline"
              onClick={() => {
                setCustomBrand(false);
                setValue("brand", "");
                resetModelAndVersion();
              }}
            >
              Elegir de la lista
            </button>
          )}
          {errors.brand && <p className="mt-1 text-xs text-danger">{errors.brand.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Modelo</Label>
            {customModel || !brandId || !models?.length ? (
              <Input placeholder="Corolla" {...register("model")} />
            ) : (
              <Select value={watchedModel ?? ""} onChange={handleModelSelect}>
                <option value="" disabled>
                  Elegí un modelo…
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
                <option value={OTHER_MODEL}>Otro (escribir)…</option>
              </Select>
            )}
            {customModel && brandId && !!models?.length && (
              <button
                type="button"
                className="mt-1 text-xs text-accent hover:underline"
                onClick={() => {
                  setCustomModel(false);
                  setValue("model", "");
                  setValue("version", "");
                  setCustomVersion(false);
                }}
              >
                Elegir de la lista
              </button>
            )}
            {errors.model && <p className="mt-1 text-xs text-danger">{errors.model.message}</p>}
          </div>
          <div>
            <Label>Versión (opcional)</Label>
            {customVersion || !modelId || !versions?.length ? (
              <Input placeholder="XEI 1.8" {...register("version")} />
            ) : (
              <Select value={watchedVersion ?? ""} onChange={handleVersionSelect}>
                <option value="">Sin especificar</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
                <option value={OTHER_VERSION}>Otra (escribir)…</option>
              </Select>
            )}
            {customVersion && modelId && !!versions?.length && (
              <button
                type="button"
                className="mt-1 text-xs text-accent hover:underline"
                onClick={() => {
                  setCustomVersion(false);
                  setValue("version", "");
                }}
              >
                Elegir de la lista
              </button>
            )}
          </div>
        </div>
        <div>
          <Label>Kilometraje actual</Label>
          <Input type="number" placeholder="55000" {...register("currentMileage")} />
        </div>
        <Alert type="error">{formError}</Alert>

        {conflict && (
          <div className="rounded-lg border border-accent/40 bg-accent-dim p-4 text-sm">
            <p>
              Esa patente ya está registrada a nombre de{" "}
              <span className="font-semibold text-light">{conflict.existingClientName}</span>.
              Podés transferir ese vehículo a <span className="font-semibold text-light">{client.name}</span>
              {" "}— se mantienen todos sus datos y el historial de services, presupuestos y facturas.
            </p>
            <Alert type="error">{transferError}</Alert>
            <div className="flex gap-2 mt-3">
              <Button
                type="button"
                loading={transferVehicle.isPending}
                disabled={transferVehicle.isPending}
                onClick={handleTransfer}
              >
                {transferVehicle.isPending ? "Transfiriendo..." : `Transferir vehículo a ${client.name}`}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConflict(null)}>
                Corregir patente
              </Button>
            </div>
          </div>
        )}

        {!conflict && (
          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar y continuar"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
