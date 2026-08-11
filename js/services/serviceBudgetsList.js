// serviceBudgetsList.js — presupuestos de un vehículo, con sus acciones (tab Resumen)
// Muestra TODOS los presupuestos del vehículo (no solo los aprobados, a diferencia
// de serviceBudgets.js que alimenta la pestaña "Nuevo service → desde presupuesto").

import { getBudgets, updateBudgetStatus, approveBudget } from "../api.js";
import { escapeHtml, setLoading, badgeHtml } from "../utils.js";
import { mostrarAlerta, formatearFecha } from "./serviceUI.js";
import { crearServiceDesdePresupuesto } from "./serviceBudgets.js";
import { cargarFacturacionVehiculo } from "./serviceInvoicing.js";

let vehiculoActual = null;

export async function cargarPresupuestosVehiculo(vehicleId) {
  vehiculoActual = vehicleId;

  const tbody = document.getElementById("presupuestos-vehiculo-body");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Cargando presupuestos...</td></tr>';

  const res = await getBudgets();

  if (!res.success || !Array.isArray(res.data)) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No se pudieron cargar los presupuestos.</td></tr>';
    return;
  }

  const presupuestos = res.data
    .filter((p) => Number(p.vehicleId) === Number(vehicleId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!presupuestos.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Este vehículo todavía no tiene presupuestos.</td></tr>';
    return;
  }

  tbody.innerHTML = presupuestos
    .map((p) => {
      let acciones = "—";

      if (p.status === "draft" || p.status === "sent") {
        acciones = `
          <button class="btn btn-primary btn-sm btn-aprobar" data-id="${p.budgetId}">Aprobar</button>
          <button class="btn btn-danger btn-sm btn-rechazar" data-id="${p.budgetId}">Rechazar</button>
        `;
      } else if (p.status === "approved" && !p.serviceId) {
        acciones = `<button class="btn btn-primary btn-sm btn-generar-service" data-id="${p.budgetId}">Generar service</button>`;
      } else if (p.status === "approved" && p.serviceId) {
        acciones = `<span class="text-muted">Vinculado a service #${escapeHtml(p.serviceId)}</span>`;
      }

      return `
        <tr>
          <td class="text-accent">${escapeHtml(p.number)}</td>
          <td class="text-muted">${escapeHtml(formatearFecha(p.date))}</td>
          <td>${badgeHtml(p.status)}</td>
          <td class="flex gap-2">${acciones}</td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".btn-aprobar").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstadoPresupuesto(btn, "aprobar"));
  });
  tbody.querySelectorAll(".btn-rechazar").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstadoPresupuesto(btn, "rechazar"));
  });
  tbody.querySelectorAll(".btn-generar-service").forEach((btn) => {
    btn.addEventListener("click", () => generarServiceDesdeLista(btn, presupuestos));
  });
}

async function cambiarEstadoPresupuesto(btn, accion) {
  const id = Number(btn.dataset.id);
  setLoading(btn, true);

  const res =
    accion === "aprobar" ? await approveBudget(id) : await updateBudgetStatus(id, "rejected");

  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo actualizar el presupuesto.", "error");
    return;
  }

  mostrarAlerta(
    accion === "aprobar" ? (res.data?.message ?? "Presupuesto aprobado.") : "Presupuesto rechazado.",
    "ok",
  );

  if (vehiculoActual !== null) cargarPresupuestosVehiculo(vehiculoActual);
}

async function generarServiceDesdeLista(btn, presupuestos) {
  const id = Number(btn.dataset.id);
  const presupuesto = presupuestos.find((p) => p.budgetId === id);
  if (!presupuesto) return;

  await crearServiceDesdePresupuesto(presupuesto, btn);

  // crearServiceDesdePresupuesto ya refresca el historial y la lista de
  // presupuestos aprobados de la pestaña "Nuevo service". Acá refrescamos
  // además esta misma lista y la facturación, que también cambiaron.
  if (vehiculoActual !== null) {
    cargarPresupuestosVehiculo(vehiculoActual);
    cargarFacturacionVehiculo(vehiculoActual);
  }
}
