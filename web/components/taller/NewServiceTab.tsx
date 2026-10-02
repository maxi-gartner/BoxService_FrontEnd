"use client";

import { useState } from "react";
import { useCreateService, useCreateServiceDetail } from "@/hooks/useServices";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { Vehicle } from "@/types/entities";

const SERVICE_TYPES = [
  "Service completo",
  "Cambio de aceite",
  "Revisión general",
  "Pre-viaje",
  "Mantenimiento preventivo",
  "Otro",
];

export function NewServiceTab({ vehicle }: { vehicle: Vehicle }) {
  const createService = useCreateService();
  const createServiceDetail = useCreateServiceDetail();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    setMessage(null);

    if (!detail.trim()) {
      setMessage({ type: "error", text: "Tenés que completar el detalle del trabajo realizado." });
      return;
    }

    try {
      const service = await createService.mutateAsync({
        vehicleId: vehicle.vehicleId,
        date,
        mileage: Number(mileage),
        serviceType,
        notes,
      });

      const detailResult = await createServiceDetail.mutateAsync({
        serviceId: service.serviceId,
        data: { description: detail.trim(), done: true },
      });

      if (!detailResult) throw new Error("El service se creó, pero no se pudo guardar el detalle.");

      setMessage({ type: "ok", text: "Service y detalle creados correctamente." });
      setMileage("");
      setServiceType("");
      setNotes("");
      setDetail("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "No se pudo crear el service.",
      });
    }
  }

  return (
    <Card>
      <CardTitle>Registrar nuevo service</CardTitle>
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Kilometraje</Label>
          <Input type="number" placeholder="Ej: 85000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <Label>Tipo de service</Label>
        <Select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          <option value="">Seleccionar tipo</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <Label>Observaciones</Label>
        <Input
          placeholder="Ej: Cliente viaja a Córdoba, revisar antes de salir"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Label>Detalle del trabajo realizado</Label>
        <Input
          placeholder="Ej: Cambio de aceite, filtro de aire, revisión de frenos"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit} disabled={createService.isPending}>
          {createService.isPending ? "Guardando..." : "Crear service"}
        </Button>
      </div>
    </Card>
  );
}
