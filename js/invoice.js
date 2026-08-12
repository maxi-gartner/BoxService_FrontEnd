// invoice.js — panel de gestión de facturas
// Solo lectura + cobrar/anular. La emisión vive en Taller, donde el service
// ya está elegido (sin tipear IDs).
import { getInvoices, getServices, getVehiculos, updateInvoiceStatus } from "./api.js";
import { escapeHtml, showAlert, setLoading, formatMoney, badgeHtml } from "./utils.js";

const tableBody = document.getElementById("table-body");
const alertBox = document.getElementById("alert-box");

let vehicleIdPorService = {};
let vehiculosPorId = {};

// ── Cargar tabla ───────────────────────────────────────
async function loadInvoices() {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';

  const [resServices, resVehiculos, res] = await Promise.all([
    getServices(),
    getVehiculos(),
    getInvoices(),
  ]);

  if (resServices.success && Array.isArray(resServices.data)) {
    vehicleIdPorService = {};
    resServices.data.forEach((s) => {
      vehicleIdPorService[String(s.serviceId)] = s.vehicleId;
    });
  }

  if (resVehiculos.success && Array.isArray(resVehiculos.data)) {
    vehiculosPorId = {};
    resVehiculos.data.forEach((v) => {
      vehiculosPorId[String(v.vehicleId)] = v;
    });
  }

  if (!res.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${escapeHtml(res.error?.message)}</td></tr>`;
    return;
  }

  const list = res.data ?? [];
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-muted">No hay facturas registradas.</td></tr>';
    return;
  }

  tableBody.innerHTML = list
    .map((inv) => {
      const vehicleId = vehicleIdPorService[String(inv.serviceId)];
      const vehiculo = vehicleId ? vehiculosPorId[String(vehicleId)] : null;
      const vehiculoLabel = vehiculo
        ? `${vehiculo.plate ?? "-"} — ${vehiculo.brand ?? ""} ${vehiculo.model ?? ""}`
        : `Service #${inv.serviceId}`;
      const vehiculoLink = vehicleId
        ? `<a href="taller.html?id=${vehicleId}">${escapeHtml(vehiculoLabel)}</a>`
        : escapeHtml(vehiculoLabel);

      return `
    <tr>
      <td class="text-accent">${escapeHtml(inv.number)}</td>
      <td class="text-muted">${escapeHtml(inv.date)}</td>
      <td style="font-weight:700">${formatMoney(inv.total)}</td>
      <td>${badgeHtml(inv.status)}</td>
      <td class="flex gap-2">
        ${vehiculoLink}
        ${
          inv.status === "issued"
            ? `
          <button class="btn btn-primary btn-sm" id="btn-paid-${inv.invoiceId}"   onclick="markPaid(${inv.invoiceId})">Cobrada</button>
          <button class="btn btn-danger btn-sm"  id="btn-cancel-${inv.invoiceId}" onclick="cancelInvoice(${inv.invoiceId})">Anular</button>
        `
            : ""
        }
      </td>
    </tr>
  `;
    })
    .join("");
}

// ── Acciones ───────────────────────────────────────────
window.markPaid = async (id) => {
  const btn = document.getElementById(`btn-paid-${id}`);
  setLoading(btn, true);

  const res = await updateInvoiceStatus(id, "paid");

  if (!res.success) {
    setLoading(btn, false);
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(alertBox, "Factura marcada como cobrada", "ok");
  loadInvoices();
};

window.cancelInvoice = async (id) => {
  if (!confirm("¿Seguro que querés anular esta factura?")) return;

  const btn = document.getElementById(`btn-cancel-${id}`);
  setLoading(btn, true);

  const res = await updateInvoiceStatus(id, "cancelled");

  if (!res.success) {
    setLoading(btn, false);
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(alertBox, "Factura anulada", "ok");
  loadInvoices();
};

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadInvoices);
