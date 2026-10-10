"use client";

import { useEffect, useRef, useState } from "react";
import {
  useDeleteInspectionPhoto,
  useSaveServiceInspection,
  useServiceInspection,
  useUploadInspectionPhoto,
} from "@/hooks/useServices";
import { servicesApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import type {
  InspectionItemStatus,
  Service,
  ServiceInspection,
  ServiceInspectionItemRequest,
} from "@/types/entities";

const CHECKLIST_ITEMS = [
  { code: "front_bumper", name: "Paragolpes delantero" },
  { code: "rear_bumper", name: "Paragolpes trasero" },
  { code: "doors", name: "Puertas" },
  { code: "hood", name: "Capó" },
  { code: "trunk", name: "Baúl" },
  { code: "windshield_windows", name: "Parabrisas y vidrios" },
  { code: "mirrors", name: "Espejos" },
  { code: "lights", name: "Luces" },
  { code: "tires", name: "Neumáticos" },
  { code: "interior_upholstery", name: "Interior y tapizados" },
  { code: "dashboard", name: "Tablero" },
  { code: "spare_tire_tools", name: "Rueda de auxilio y herramientas" },
  { code: "personal_items", name: "Objetos personales" },
] as const;

const STATUS_LABELS: Record<InspectionItemStatus, string> = {
  ok: "Sin daños",
  damaged: "Con daño",
  not_checked: "Sin revisar",
};

type EditableItem = ServiceInspectionItemRequest & { itemName: string };

function initialItems(inspection?: ServiceInspection): EditableItem[] {
  return CHECKLIST_ITEMS.map((definition) => {
    const saved = inspection?.items.find((item) => item.itemCode === definition.code);
    return {
      itemCode: definition.code,
      itemName: saved?.itemName ?? definition.name,
      status: saved?.status ?? "not_checked",
      observation: saved?.observation ?? "",
    };
  });
}

export function ServiceInspectionModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const inspectionQuery = useServiceInspection(service.serviceId);
  const isNotFound =
    inspectionQuery.error instanceof ApiClientError && inspectionQuery.error.code === 404;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-5xl rounded-xl border border-border bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div>
            <p id="inspection-title" className="text-xl font-bold text-light">
              Inspección de ingreso
            </p>
            <p className="mt-1 text-sm text-muted">
              Service #{service.serviceId} · {service.serviceType}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} aria-label="Cerrar inspección">
            Cerrar
          </Button>
        </header>

        <div className="p-4 sm:p-6">
          {inspectionQuery.isLoading && <p className="py-12 text-center text-muted">Cargando inspección...</p>}

          {inspectionQuery.isError && !isNotFound && (
            <div className="space-y-4">
              <Alert type="error">
                {inspectionQuery.error instanceof ApiClientError
                  ? inspectionQuery.error.message
                  : "No se pudo cargar la inspección."}
              </Alert>
              <Button type="button" variant="secondary" onClick={() => inspectionQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {isNotFound && (
            <InspectionEditor key={`new-${service.serviceId}`} service={service} />
          )}

          {inspectionQuery.data && (
            <InspectionEditor
              key={inspectionQuery.data.inspectionId}
              service={service}
              inspection={inspectionQuery.data}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InspectionEditor({
  service,
  inspection,
}: {
  service: Service;
  inspection?: ServiceInspection;
}) {
  const [fuelLevel, setFuelLevel] = useState(
    inspection?.fuelLevel === null || inspection?.fuelLevel === undefined
      ? ""
      : String(inspection.fuelLevel),
  );
  const [generalObservations, setGeneralObservations] = useState(
    inspection?.generalObservations ?? "",
  );
  const [items, setItems] = useState<EditableItem[]>(() => initialItems(inspection));
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const saveInspection = useSaveServiceInspection(service.serviceId, Boolean(inspection));

  function updateItem(
    itemCode: string,
    changes: Partial<Pick<EditableItem, "status" | "observation">>,
  ) {
    setItems((current) =>
      current.map((item) => (item.itemCode === itemCode ? { ...item, ...changes } : item)),
    );
  }

  async function handleSave() {
    const parsedFuelLevel = fuelLevel === "" ? null : Number(fuelLevel);
    if (parsedFuelLevel !== null && (!Number.isInteger(parsedFuelLevel) || parsedFuelLevel < 0 || parsedFuelLevel > 100)) {
      setMessage({ type: "error", text: "El nivel de combustible debe estar entre 0 y 100%." });
      return;
    }

    setMessage(null);
    try {
      await saveInspection.mutateAsync({
        fuelLevel: parsedFuelLevel,
        generalObservations: generalObservations.trim() || null,
        items: items.map(({ itemCode, status, observation }) => ({
          itemCode,
          status,
          observation: observation?.trim() || null,
        })),
      });
      setMessage({
        type: "ok",
        text: inspection ? "Inspección actualizada correctamente." : "Inspección registrada correctamente.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiClientError ? error.message : "No se pudo guardar la inspección.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {!inspection && (
        <Alert type="ok">
          Este service todavía no tiene inspección. Completá el estado en que ingresó el vehículo.
        </Alert>
      )}
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <section className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div>
          <Label htmlFor="inspection-fuel">Nivel de combustible (%)</Label>
          <Input
            id="inspection-fuel"
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder="Ej. 50"
            value={fuelLevel}
            onChange={(event) => setFuelLevel(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="inspection-observations">Observaciones generales</Label>
          <textarea
            id="inspection-observations"
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none"
            placeholder="Ej. El vehículo ingresó con un rayón en la puerta derecha."
            value={generalObservations}
            onChange={(event) => setGeneralObservations(event.target.value)}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-semibold text-light">Checklist del vehículo</h3>
            <p className="text-sm text-muted">Marcá el estado y agregá una observación cuando sea necesario.</p>
          </div>
          <span className="text-xs text-muted">
            {items.filter((item) => item.status !== "not_checked").length} de {items.length} revisados
          </span>
        </div>

        <div className="divide-y divide-border-light overflow-hidden rounded-lg border border-border">
          {items.map((item) => (
            <div key={item.itemCode} className="grid gap-3 bg-surface-2 p-3 md:grid-cols-[1fr_180px_1.4fr] md:items-center">
              <p className="text-sm font-medium text-light">{item.itemName}</p>
              <Select
                aria-label={`Estado de ${item.itemName}`}
                value={item.status}
                onChange={(event) =>
                  updateItem(item.itemCode, { status: event.target.value as InspectionItemStatus })
                }
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                aria-label={`Observación de ${item.itemName}`}
                placeholder="Observación opcional"
                value={item.observation ?? ""}
                onChange={(event) => updateItem(item.itemCode, { observation: event.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" disabled={saveInspection.isPending} onClick={handleSave}>
          {saveInspection.isPending ? "Guardando..." : inspection ? "Guardar cambios" : "Crear inspección"}
        </Button>
      </div>

      {inspection && <InspectionPhotos serviceId={service.serviceId} inspection={inspection} />}

      {inspection && (
        <p className="border-t border-border pt-4 text-xs text-muted">
          Inspeccionado por {inspection.inspectedBy} el {new Date(inspection.inspectedAt).toLocaleString("es-AR")}.
        </p>
      )}
    </div>
  );
}

function InspectionPhotos({
  serviceId,
  inspection,
}: {
  serviceId: number;
  inspection: ServiceInspection;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState("other");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [viewingPhotoId, setViewingPhotoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadInspectionPhoto(serviceId);
  const deletePhoto = useDeleteInspectionPhoto(serviceId);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Seleccioná una foto antes de subirla." });
      return;
    }

    try {
      await uploadPhoto.mutateAsync({ file, photoType, description: description.trim() });
      setFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({ type: "ok", text: "Foto subida correctamente." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiClientError ? error.message : "No se pudo subir la foto.",
      });
    }
  }

  async function handleView(photoId: number) {
    setViewingPhotoId(photoId);
    setMessage(null);
    const openedWindow = window.open("", "_blank");

    try {
      const result = await servicesApi.getInspectionPhotoUrl(serviceId, photoId);
      if (openedWindow) {
        openedWindow.location.href = result.url;
      } else {
        const link = document.createElement("a");
        link.href = result.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
    } catch (error) {
      openedWindow?.close();
      setMessage({
        type: "error",
        text: error instanceof ApiClientError ? error.message : "No se pudo abrir la foto.",
      });
    } finally {
      setViewingPhotoId(null);
    }
  }

  async function handleDelete(photoId: number) {
    if (!confirm("¿Seguro que querés eliminar esta foto?")) return;

    setMessage(null);
    try {
      await deletePhoto.mutateAsync(photoId);
      setMessage({ type: "ok", text: "Foto eliminada." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiClientError ? error.message : "No se pudo eliminar la foto.",
      });
    }
  }

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <h3 className="font-semibold text-light">Fotos del ingreso</h3>
        <p className="text-sm text-muted">Las imágenes quedan guardadas de forma privada y vinculadas a este service.</p>
      </div>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      {inspection.photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted">
          Todavía no hay fotos cargadas.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inspection.photos.map((photo) => (
            <article key={photo.photoId} className="rounded-lg border border-border bg-surface-2 p-4">
              <p className="truncate text-sm font-semibold text-light" title={photo.originalFileName}>
                {photo.originalFileName}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">{photo.photoType}</p>
              {photo.description && <p className="mt-2 text-sm text-muted">{photo.description}</p>}
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={viewingPhotoId === photo.photoId}
                  onClick={() => handleView(photo.photoId)}
                >
                  {viewingPhotoId === photo.photoId ? "Abriendo..." : "Ver foto"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={deletePhoto.isPending}
                  onClick={() => handleDelete(photo.photoId)}
                >
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <form onSubmit={handleUpload} className="grid gap-3 rounded-lg border border-border bg-surface-2 p-4 md:grid-cols-2">
        <div>
          <Label htmlFor="inspection-photo">Archivo</Label>
          <Input
            ref={fileInputRef}
            id="inspection-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-muted">JPG, PNG o WebP. Máximo 8 MB.</p>
        </div>
        <div>
          <Label htmlFor="inspection-photo-type">Tipo de foto</Label>
          <Select id="inspection-photo-type" value={photoType} onChange={(event) => setPhotoType(event.target.value)}>
            <option value="other">Vista general / otra</option>
            <option value="damage">Daño</option>
            <option value="front">Frente</option>
            <option value="rear">Parte trasera</option>
            <option value="left_side">Lateral izquierdo</option>
            <option value="right_side">Lateral derecho</option>
            <option value="dashboard">Tablero</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="inspection-photo-description">Descripción</Label>
          <Input
            id="inspection-photo-description"
            placeholder="Ej. Rayón visible en la puerta derecha"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={!file || uploadPhoto.isPending}>
            {uploadPhoto.isPending ? "Subiendo..." : "Subir foto"}
          </Button>
        </div>
      </form>
    </section>
  );
}
