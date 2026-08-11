// serviceBudgetsList.js — presupuestos de un vehículo, con sus acciones (tab Resumen)
// Muestra TODOS los presupuestos del vehículo (no solo los aprobados, a diferencia
// de serviceBudgets.js que alimenta la pestaña "Nuevo service → desde presupuesto").

import { getBudgets, getInvoices, updateBudgetStatus, approveBudget, createInvoice } from "../api.js";
import { escapeHtml, setLoading, formatMoney, badgeHtml } from "../utils.js";
import { mostrarAlerta, formatearFecha } from "./serviceUI.js";
import { crearServiceDesdePresupuesto } from "./serviceBudgets.js";
import { cargarFacturacionVehiculo } from "./serviceInvoicing.js";

let vehiculoActual = null;

// Un presupuesto queda "finalizado" cuando ya tiene un service vinculado.
// Contempla datos viejos (aprobados antes de que el backend empezara a
// mover el estado a "completed" automáticamente al vincular el service).
function estaFinalizado(p) {
  return p.status === "completed" || (p.status === "approved" && !!p.serviceId);
}

export async function cargarPresupuestosVehiculo(vehicleId) {
  vehiculoActual = vehicleId;

  const tbody = document.getElementById("presupuestos-vehiculo-body");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Cargando presupuestos...</td></tr>';

  const [resBudgets, resInvoices] = await Promise.all([getBudgets(), getInvoices()]);

  if (!resBudgets.success || !Array.isArray(resBudgets.data)) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No se pudieron cargar los presupuestos.</td></tr>';
    return;
  }

  const invoices = resInvoices.success ? resInvoices.data : [];

  const presupuestos = resBudgets.data
    .filter((p) => Number(p.vehicleId) === Number(vehicleId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!presupuestos.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Este vehículo todavía no tiene presupuestos.</td></tr>';
    return;
  }

  tbody.innerHTML = presupuestos
    .map((p) => {
      const finalizado = estaFinalizado(p);
      let acciones = "—";

      if (p.status === "draft" || p.status === "sent") {
        acciones = `
          <button class="btn btn-primary btn-sm btn-aprobar" data-id="${p.budgetId}">Aprobar</button>
          <button class="btn btn-danger btn-sm btn-rechazar" data-id="${p.budgetId}">Rechazar</button>
        `;
      } else if (p.status === "approved" && !finalizado) {
        acciones = `
          <button class="btn btn-primary btn-sm btn-generar-service" data-id="${p.budgetId}">Trabajo realizado</button>
          <button class="btn btn-danger btn-sm btn-cancelar" data-id="${p.budgetId}">Cancelar</button>
        `;
      } else if (finalizado) {
        const invoice = invoices.find((inv) => Number(inv.serviceId) === Number(p.serviceId));

        acciones = invoice
          ? `<button class="btn btn-secondary btn-sm btn-ver-factura" data-service-id="${p.serviceId}">Ver factura</button>`
          : `<button class="btn btn-primary btn-sm btn-facturar" data-id="${p.budgetId}" data-service-id="${p.serviceId}">Facturar</button>`;

        acciones += ` <button class="btn btn-secondary btn-sm btn-ticket" data-service-id="${p.serviceId}">Generar ticket</button>`;
      }

      return `
        <tr>
          <td class="text-accent">${escapeHtml(p.number)}</td>
          <td class="text-muted">${escapeHtml(formatearFecha(p.date))}</td>
          <td>${badgeHtml(finalizado ? "completed" : p.status)}</td>
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
  tbody.querySelectorAll(".btn-cancelar").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstadoPresupuesto(btn, "cancelar"));
  });
  tbody.querySelectorAll(".btn-generar-service").forEach((btn) => {
    btn.addEventListener("click", () => generarServiceDesdeLista(btn, presupuestos));
  });
  tbody.querySelectorAll(".btn-facturar").forEach((btn) => {
    btn.addEventListener("click", () => facturarDesdeLista(btn));
  });
  tbody.querySelectorAll(".btn-ver-factura").forEach((btn) => {
    btn.addEventListener("click", () => verFactura(btn.dataset.serviceId));
  });
  tbody.querySelectorAll(".btn-ticket").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.open(`ticket.html?serviceId=${btn.dataset.serviceId}`, "_blank");
    });
  });
}

async function cambiarEstadoPresupuesto(btn, accion) {
  if (accion === "cancelar" && !confirm("¿Cancelar este trabajo? El presupuesto queda como rechazado.")) {
    return;
  }

  const id = Number(btn.dataset.id);
  setLoading(btn, true);

  const res =
    accion === "aprobar" ? await approveBudget(id) : await updateBudgetStatus(id, "rejected");

  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo actualizar el presupuesto.", "error");
    return;
  }

  const mensajes = {
    aprobar: res.data?.message ?? "Presupuesto aprobado.",
    rechazar: "Presupuesto rechazado.",
    cancelar: "Trabajo cancelado.",
  };
  mostrarAlerta(mensajes[accion], "ok");

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

async function facturarDesdeLista(btn) {
  const budgetId = Number(btn.dataset.id);
  const serviceId = Number(btn.dataset.serviceId);

  setLoading(btn, true, "Facturando...");
  const res = await createInvoice({ serviceId, budgetId });
  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo emitir la factura.", "error");
    return;
  }

  mostrarAlerta(`Factura ${res.data.number} emitida por ${formatMoney(res.data.total)}.`, "ok");

  if (vehiculoActual !== null) {
    cargarPresupuestosVehiculo(vehiculoActual);
    cargarFacturacionVehiculo(vehiculoActual);
  }
}

function verFactura(serviceId) {
  const fila = document.querySelector(`#facturacion-vehiculo-body tr[data-service-id="${serviceId}"]`);
  if (!fila) {
    mostrarAlerta("No se encontró la factura en la lista de facturación.", "error");
    return;
  }

  fila.scrollIntoView({ behavior: "smooth", block: "center" });
  fila.classList.add("fila-destacada");
  setTimeout(() => fila.classList.remove("fila-destacada"), 2000);
}
