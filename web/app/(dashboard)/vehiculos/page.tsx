"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVehicles, useCreateVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useVehicleBrands, useVehicleModels, useVehicleVersions } from "@/hooks/useVehicleCatalog";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import type { Vehicle } from "@/types/entities";

const OTHER_BRAND = "__otra__";
const OTHER_MODEL = "__otro__";
const OTHER_VERSION = "__otra_version__";

function EditVehicleRow({
  vehicle,
  onDone,
}: {
  vehicle: Vehicle;
  onDone: (msg: { type: "ok" | "error"; text: string } | null) => void;
}) {
  const updateVehicle = useUpdateVehicle();
  const [plate, setPlate] = useState(vehicle.plate);
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model);
  const [version, setVersion] = useState(vehicle.version ?? "");
  const [year, setYear] = useState(vehicle.year?.toString() ?? "");
  const [mileage, setMileage] = useState(String(vehicle.currentMileage));

  async function save() {
    try {
      await updateVehicle.mutateAsync({
        id: vehicle.vehicleId,
        data: {
          plate: plate.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          version: version.trim() || undefined,
          year: year ? Number(year) : null,
          currentMileage: mileage ? Number(mileage) : 0,
        },
      });
      onDone({ type: "ok", text: `"${plate}" actualizado.` });
    } catch (err) {
      onDone({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar el vehículo." });
    }
  }

  return (
    <TR className="bg-surface-2">
      <TD><Input value={plate} onChange={(e) => setPlate(e.target.value)} className="max-w-28" /></TD>
      <TD>
        <div className="flex gap-1">
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marca" />
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo" />
        </div>
        <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Versión (opcional)" className="mt-1" />
      </TD>
      <TD><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="max-w-20" /></TD>
      <TD><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="max-w-24" /></TD>
      <TD className="text-muted">{vehicle.clientName ?? `Cliente #${vehicle.clientId}`}</TD>
      <TD className="flex gap-2">
        <Button size="sm" loading={updateVehicle.isPending} disabled={updateVehicle.isPending} onClick={save}>
          Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDone(null)}>
          Cancelar
        </Button>
      </TD>
    </TR>
  );
}

const schema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
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
type FormValues = z.infer<typeof schema>;

export default function VehiculosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data: vehiclesPage, isLoading, error: vehiclesLoadError, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles({ page, pageSize: 25, search: debouncedSearch || undefined });
  const vehicles = vehiclesPage?.items;
  // El picker de "Cliente" del alta necesita la lista completa (combo),
  // no una página — ver comentario en ClientService.ListPaged.
  const { data: clientsPage, error: clientsLoadError, isLoading: clientsLoading, refetch: refetchClients } = useClients({ pageSize: 200 });
  const clients = clientsPage?.items;
  const createVehicle = useCreateVehicle();
  const { data: brands, error: brandsError, isFetching: loadingBrands } = useVehicleBrands();

  // Reset de página al cambiar el buscador — ajuste de estado durante el
  // render (patrón recomendado por React), no un efecto.
  const [searchForPage, setSearchForPage] = useState(debouncedSearch);
  if (debouncedSearch !== searchForPage) {
    setSearchForPage(debouncedSearch);
    setPage(1);
  }

  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [customVersion, setCustomVersion] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Modelo y versión dependen en cascada de la marca/modelo elegidos —
  // se resuelven por nombre contra el catálogo de ArgAutos (los <select>
  // solo manejan el nombre, no el ID interno).
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

  async function onSubmit(values: FormValues) {
    setFormError("");
    setFormOk("");
    try {
      const created = await createVehicle.mutateAsync({
        clientId: Number(values.clientId),
        plate: values.plate.trim().toUpperCase(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        version: values.version?.trim() || undefined,
        year: values.year ? Number(values.year) : null,
        currentMileage: values.currentMileage ? Number(values.currentMileage) : 0,
      });
      setFormOk(`Vehículo ${created.plate} registrado.`);
      reset();
      setCustomBrand(false);
      setCustomModel(false);
      setCustomVersion(false);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "No se pudo registrar el vehículo.");
    }
  }

  const loadError = vehiclesLoadError ?? clientsLoadError;
  if (loadError) return <ErrorState error={loadError} resource="los vehículos" onRetry={() => { if (vehiclesLoadError) void refetchVehicles(); if (clientsLoadError) void refetchClients(); }} />;
  if (vehiclesLoading || clientsLoading) return <LoadingState label="Cargando los vehículos..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vehículos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <Card>
          <CardTitle>Registrar vehículo</CardTitle>
          {(loadingBrands || loadingModels || loadingVersions) && <LoadingState label="Cargando opciones de vehículos..." />}
          {(brandsError || modelsError || versionsError) && <p role="alert" className="mb-3 text-sm text-danger">No se pudieron cargar algunas opciones. Podés elegir Otra marca / Otro modelo para ingresarlos manualmente.</p>}
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
            <Alert type="ok">{formOk}</Alert>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Guardar vehículo"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Vehículos registrados</CardTitle>
            <Input
              placeholder="Buscar por patente, marca, modelo o cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          {editMessage && <div className="mb-3"><Alert type={editMessage.type}>{editMessage.text}</Alert></div>}
          <TableWrapper>
            <THead>
              <th>Patente</th>
              <th>Marca / Modelo</th>
              <th>Año</th>
              <th>KM</th>
              <th>Cliente</th>
              <th></th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={6}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
              {!isLoading && vehicles?.length === 0 && (
                <EmptyRow colSpan={6}>
                  {debouncedSearch ? "Ningún vehículo coincide con la búsqueda." : "No hay vehículos registrados."}
                </EmptyRow>
              )}
              {vehicles?.map((v) =>
                editingVehicleId === v.vehicleId ? (
                  <EditVehicleRow
                    key={v.vehicleId}
                    vehicle={v}
                    onDone={(msg) => {
                      setEditingVehicleId(null);
                      if (msg) setEditMessage(msg);
                    }}
                  />
                ) : (
                <TR key={v.vehicleId}>
                  <TD className="text-accent">{v.plate}</TD>
                  <TD>
                    {v.brand} {v.model}
                    {v.version && <p className="text-xs text-muted">{v.version}</p>}
                  </TD>
                  <TD>{v.year ?? "-"}</TD>
                  <TD>{v.currentMileage.toLocaleString("es-AR")}</TD>
                  <TD>{v.clientName ?? `Cliente #${v.clientId}`}</TD>
                  <TD>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditMessage(null);
                        setEditingVehicleId(v.vehicleId);
                      }}
                    >
                      Editar
                    </Button>
                  </TD>
                </TR>
                ),
              )}
            </TBody>
          </TableWrapper>
          {vehiclesPage && (
            <Pagination
              page={vehiclesPage.page}
              totalPages={vehiclesPage.totalPages}
              totalCount={vehiclesPage.totalCount}
              onPageChange={setPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
