"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVehicles, useCreateVehicle } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useVehicleBrands, useVehicleModels, useVehicleVersions } from "@/hooks/useVehicleCatalog";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";

const OTHER_BRAND = "__otra__";
const OTHER_MODEL = "__otro__";
const OTHER_VERSION = "__otra_version__";

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
  const { data: vehicles, isLoading } = useVehicles();
  const { data: clients } = useClients();
  const createVehicle = useCreateVehicle();
  const { data: brands } = useVehicleBrands();

  const clientsById = useMemo(
    () => new Map((clients ?? []).map((c) => [c.clientId, c.name])),
    [clients],
  );

  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
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
  const { data: models } = useVehicleModels(brandId);
  const modelId = models?.find((m) => m.name === watchedModel)?.id ?? null;
  const { data: versions } = useVehicleVersions(brandId, modelId);

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

  const term = search.trim().toLowerCase();
  const filtered = (vehicles ?? []).filter((v) => {
    if (!term) return true;
    const clientName = clientsById.get(v.clientId) ?? "";
    return [v.plate, v.brand, v.model, clientName].join(" ").toLowerCase().includes(term);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vehículos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <Card>
          <CardTitle>Registrar vehículo</CardTitle>
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
            <Button type="submit" disabled={isSubmitting} className="w-full">
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
          <TableWrapper>
            <THead>
              <th>Patente</th>
              <th>Marca / Modelo</th>
              <th>Año</th>
              <th>KM</th>
              <th>Cliente</th>
            </THead>
            <TBody>
              {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
              {!isLoading && filtered.length === 0 && (
                <EmptyRow colSpan={5}>
                  {term ? "Ningún vehículo coincide con la búsqueda." : "No hay vehículos registrados."}
                </EmptyRow>
              )}
              {filtered.map((v) => (
                <TR key={v.vehicleId}>
                  <TD className="text-accent">{v.plate}</TD>
                  <TD>
                    {v.brand} {v.model}
                    {v.version && <p className="text-xs text-muted">{v.version}</p>}
                  </TD>
                  <TD>{v.year ?? "-"}</TD>
                  <TD>{v.currentMileage.toLocaleString("es-AR")}</TD>
                  <TD>{clientsById.get(v.clientId) ?? `Cliente #${v.clientId}`}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}
