// ticket.js — comprobante de trabajo imprimible (no válido como factura)
// Se abre en una pestaña nueva desde Taller: ticket.html?serviceId=X
import { getServiceById, getServiceDetails, getVehiculoById, getClientById } from "./api.js";
import { escapeHtml } from "./utils.js";

const root = document.getElementById("ticket-root");

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString("es-AR");
}

async function cargarTicket() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("serviceId");

  if (!serviceId) {
    root.innerHTML = '<p class="text-muted">Falta el ID del service.</p>';
    return;
  }

  const [resService, resDetails] = await Promise.all([
    getServiceById(serviceId),
    getServiceDetails(serviceId),
  ]);

  if (!resService.success) {
    root.innerHTML = `<p class="text-muted">No se pudo cargar el service: ${escapeHtml(resService.error?.message)}</p>`;
    return;
  }

  const service = resService.data;
  const detalles = resDetails.success ? resDetails.data : [];

  const resVehiculo = await getVehiculoById(service.vehicleId);
  const vehiculo = resVehiculo.success ? resVehiculo.data : null;

  let cliente = null;
  if (vehiculo) {
    const resCliente = await getClientById(vehiculo.clientId);
    cliente = resCliente.success ? resCliente.data : null;
  }

  const nombreCliente = cliente ? (cliente.nombre ?? cliente.name ?? "-") : "-";
  const vehiculoLabel = vehiculo ? `${vehiculo.brand ?? "-"} ${vehiculo.model ?? ""}` : "-";
  const patente = vehiculo ? (vehiculo.plate ?? "-") : "-";

  const detalleHtml = detalles.length
    ? detalles.map((d) => `<div class="ticket-detalle-item">${escapeHtml(d.description)}</div>`).join("")
    : '<div class="text-muted">Sin detalle cargado.</div>';

  root.innerHTML = `
    <div class="ticket-header">
      <h1>BoxService</h1>
      <p class="ticket-disclaimer">Comprobante de trabajo — no válido como factura</p>
    </div>

    <div class="ticket-row"><span>Fecha</span><span>${escapeHtml(formatearFecha(service.date))}</span></div>
    <div class="ticket-row"><span>Cliente</span><span>${escapeHtml(nombreCliente)}</span></div>
    <div class="ticket-row"><span>Vehículo</span><span>${escapeHtml(vehiculoLabel)}</span></div>
    <div class="ticket-row"><span>Patente</span><span>${escapeHtml(patente)}</span></div>
    <div class="ticket-row"><span>Kilometraje</span><span>${escapeHtml(service.mileage ?? "-")}</span></div>
    <div class="ticket-row"><span>Tipo de service</span><span>${escapeHtml(service.serviceType ?? "-")}</span></div>

    <p class="ticket-detalle-titulo">Detalle del trabajo</p>
    ${detalleHtml}

    <div class="ticket-footer">
      Service #${escapeHtml(service.serviceId)} — generado desde BoxService
    </div>
  `;
}

document.getElementById("btn-imprimir").addEventListener("click", () => window.print());
document.getElementById("btn-cerrar").addEventListener("click", () => window.close());

document.addEventListener("DOMContentLoaded", cargarTicket);
