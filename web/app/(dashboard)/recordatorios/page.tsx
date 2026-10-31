"use client";

import { useState } from "react";
import { useServiceReminders, useContactReminder, useReminderPhone } from "@/hooks/useServiceReminders";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input, Label } from "@/components/ui/Input";

export default function RecordatoriosPage() {
  const reminders = useServiceReminders();
  const contact = useContactReminder();
  const updatePhone = useReminderPhone();
  const [contacted, setContacted] = useState(false);
  const [phoneClient, setPhoneClient] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const items = reminders.data?.items.filter(r => Boolean(r.contactedAt) === contacted) ?? [];

  async function mark(id: number) {
    if (!window.confirm("¿Confirmás que ya contactaste al cliente? Abrir WhatsApp no confirma el envío.")) return;
    setError("");
    try { await contact.mutateAsync(id); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el contacto."); }
  }

  async function savePhone() {
    if (phoneClient === null) return;
    setError("");
    try { await updatePhone.mutateAsync({ id: phoneClient, phone }); setPhoneClient(null); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar el teléfono."); }
  }

  return <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-bold">Recordatorios de service</h1>
      <p className="mt-2 text-sm text-muted">Próximos en siete días y vencidos, según el último service de cada vehículo. El mensaje se envía manualmente.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant={contacted ? "secondary" : "primary"} onClick={() => setContacted(false)}>Pendientes ({reminders.data?.pendingCount ?? 0})</Button>
      <Button variant={contacted ? "primary" : "secondary"} onClick={() => setContacted(true)}>Contactados</Button>
      <Button variant="secondary" disabled={reminders.isFetching} onClick={() => reminders.refetch()}>Actualizar</Button>
    </div>
    {error && <Alert type="error">{error}</Alert>}
    {reminders.isError && <Alert type="error">{reminders.error.message}</Alert>}
    {reminders.isLoading && <p className="text-muted">Cargando recordatorios...</p>}
    {reminders.isSuccess && items.length === 0 && <p className="rounded-lg border border-border p-6 text-muted">{contacted ? "No hay contactos registrados para los recordatorios vigentes." : "No hay recordatorios pendientes."}</p>}
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map(r => <article key={r.serviceId} className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="font-semibold">{r.clientName}</h2>
          <span className={r.status === "overdue" ? "text-sm text-danger" : "text-sm text-accent"}>
            {r.status === "overdue" ? `Vencido hace ${-r.daysRemaining} día(s)` : r.status === "today" ? "Vence hoy" : `Faltan ${r.daysRemaining} día(s)`}
          </span>
        </div>
        <p>{r.vehicle} · {r.plate}</p>
        <p className="text-sm text-muted">Próximo service: {r.nextDate.split("-").reverse().join("/")}</p>
        {r.contactedAt && <p className="text-sm text-muted">Contactado el {new Date(r.contactedAt).toLocaleString("es-AR")} por {r.contactedBy}.</p>}
        <div className="flex flex-wrap gap-2">
          {r.whatsappUrl ? <a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0d1117]">Enviar WhatsApp</a>
            : <Button variant="secondary" onClick={() => { setPhoneClient(r.clientId); setPhone(r.phone); }}>Cargar teléfono</Button>}
          {!r.contactedAt && <Button variant="secondary" disabled={contact.isPending} onClick={() => mark(r.serviceId)}>Marcar como contactado</Button>}
        </div>
        {!r.whatsappUrl && <p className="text-xs text-muted">Falta un teléfono válido con código de país.</p>}
        {phoneClient === r.clientId && <form className="space-y-2 border-t border-border pt-3" onSubmit={event => { event.preventDefault(); void savePhone(); }}>
          <Label htmlFor={`phone-${r.serviceId}`}>Teléfono con código de país</Label>
          <Input id={`phone-${r.serviceId}`} type="tel" placeholder="+5493431234567" value={phone} onChange={event => setPhone(event.target.value)} required />
          <div className="flex gap-2"><Button type="submit" disabled={updatePhone.isPending}>Guardar teléfono</Button><Button type="button" variant="secondary" onClick={() => setPhoneClient(null)}>Cancelar</Button></div>
        </form>}
      </article>)}
    </div>
    <p className="text-xs text-muted">Abrir WhatsApp no marca el recordatorio como contactado. Confirmalo después de enviar el mensaje. No se envían mensajes automáticamente.</p>
  </div>;
}
