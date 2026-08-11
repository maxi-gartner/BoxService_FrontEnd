// serviceInvoicing.js — facturación de los services de un vehículo (tab Resumen)
// No hay endpoint "facturas por vehículo": se cruza getServices() + getInvoices()
// + getBudgets() (para calcular el total cuando el service viene de un presupuesto).

import { getServices, getInvoices, getBudgets, createInvoice, updateInvoiceStatus } from "../api.js";
import { escapeHtml, setLoading, formatMoney, badgeHtml } from "../utils.js";
import { mostrarAlerta, formatearFecha } from "./serviceUI.js";

let vehiculoActual = null;

export async function cargarFacturacionVehiculo(vehicleId) {
  vehiculoActual = vehicleId;

  const mensaje = document.getElementById("facturacionVehiculoMensaje");
  const tbody = document.getElementById("facturacion-vehiculo-body");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Cargando facturación...</td></tr>';
  if (mensaje) mensaje.className = "alert";

  const [resServices, resInvoices, resBudgets] = await Promise.all([
    getServices(),
    getInvoices(),
    getBudgets(),
  ]);

  if (!resServices.success || !resInvoices.success) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No se pudo cargar la facturación.</td></tr>';
    return;
  }

  const services = resServices.data.filter((s) => Number(s.vehicleId) === Number(vehicleId));

  if (!services.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Este vehículo todavía no tiene services cargados.</td></tr>';
    return;
  }

  const invoices = resInvoices.data ?? [];
  const budgets = resBudgets.success ? resBudgets.data : [];

  // Ordena por fecha descendente, igual que el historial.
  services.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = services
    .map((service) => {
      const invoice = invoices.find((inv) => Number(inv.serviceId) === Number(service.serviceId));

      const estadoHtml = invoice ? badgeHtml(invoice.status) : `<span class="badge badge-draft">Sin facturar</span>`;
      const totalHtml = invoice ? formatMoney(invoice.total) : "—";

      let accionesHtml = "—";
      if (!invoice) {
        accionesHtml = `<button class="btn btn-primary btn-sm btn-facturar" data-service-id="${service.serviceId}">Facturar</button>`;
      } else if (invoice.status === "issued") {
        accionesHtml = `
          <button class="btn btn-primary btn-sm btn-cobrar" data-invoice-id="${invoice.invoiceId}">Cobrar</button>
          <button class="btn btn-danger btn-sm btn-anular" data-invoice-id="${invoice.invoiceId}">Anular</button>
        `;
      }

      return `
        <tr>
          <td>${escapeHtml(service.serviceType ?? "-")}</td>
          <td class="text-muted">${escapeHtml(formatearFecha(service.date))}</td>
          <td style="font-weight:700">${totalHtml}</td>
          <td>${estadoHtml}</td>
          <td class="flex gap-2">${accionesHtml}</td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".btn-facturar").forEach((btn) => {
    btn.addEventListener("click", () => facturarService(btn, budgets));
  });
  tbody.querySelectorAll(".btn-cobrar").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstadoFactura(btn, "paid"));
  });
  tbody.querySelectorAll(".btn-anular").forEach((btn) => {
    btn.addEventListener("click", () => cambiarEstadoFactura(btn, "cancelled"));
  });
}

async function facturarService(btn, budgets) {
  const serviceId = Number(btn.dataset.serviceId);
  const budgetVinculado = budgets.find((b) => Number(b.serviceId) === serviceId);

  setLoading(btn, true, "Facturando...");

  const res = await createInvoice({
    serviceId,
    budgetId: budgetVinculado ? budgetVinculado.budgetId : null,
  });

  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo emitir la factura.", "error");
    return;
  }

  if (!budgetVinculado) {
    mostrarAlerta(
      "Factura emitida por $0 — este service no viene de un presupuesto, así que hoy no hay forma de cargarle un monto. Avisale a Maxi.",
      "error",
    );
  } else {
    mostrarAlerta(`Factura ${res.data.number} emitida por ${formatMoney(res.data.total)}.`, "ok");
  }

  if (vehiculoActual !== null) cargarFacturacionVehiculo(vehiculoActual);
}

async function cambiarEstadoFactura(btn, status) {
  if (status === "cancelled" && !confirm("¿Seguro que querés anular esta factura?")) return;

  const invoiceId = Number(btn.dataset.invoiceId);
  setLoading(btn, true);

  const res = await updateInvoiceStatus(invoiceId, status);

  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo actualizar la factura.", "error");
    return;
  }

  mostrarAlerta(status === "paid" ? "Factura marcada como cobrada." : "Factura anulada.", "ok");

  if (vehiculoActual !== null) cargarFacturacionVehiculo(vehiculoActual);
}
