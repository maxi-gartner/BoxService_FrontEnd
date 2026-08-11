// invoice.js — lógica de presentación de facturas
// Solo fetch y mostrar. Sin lógica de negocio.
import { getInvoices, createInvoice, updateInvoiceStatus } from "./api.js";
import { escapeHtml, showAlert, setLoading, formatMoney, badgeHtml } from "./utils.js";

const tableBody = document.getElementById("table-body");
const alertBox = document.getElementById("alert-box");

// ── Cargar tabla ───────────────────────────────────────
async function loadInvoices() {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';
  const res = await getInvoices();

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
    .map(
      (inv) => `
    <tr>
      <td class="text-accent">${escapeHtml(inv.number)}</td>
      <td class="text-muted">${escapeHtml(inv.date)}</td>
      <td style="font-weight:700">${formatMoney(inv.total)}</td>
      <td>${badgeHtml(inv.status)}</td>
      <td class="flex gap-2">
        ${
          inv.status === "issued"
            ? `
          <button class="btn btn-primary btn-sm" id="btn-paid-${inv.invoiceId}"   onclick="markPaid(${inv.invoiceId})">Cobrada</button>
          <button class="btn btn-danger btn-sm"  id="btn-cancel-${inv.invoiceId}" onclick="cancelInvoice(${inv.invoiceId})">Anular</button>
        `
            : "—"
        }
      </td>
    </tr>
  `,
    )
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

// ── Emitir ─────────────────────────────────────────────
document.getElementById("btn-emit").addEventListener("click", async () => {
  const btn = document.getElementById("btn-emit");
  const serviceId = parseInt(document.getElementById("inp-service").value);
  const budgetId =
    parseInt(document.getElementById("inp-budget").value) || null;

  if (!serviceId) {
    showAlert(alertBox, "Ingresá el ID del service");
    return;
  }

  setLoading(btn, true);

  const res = await createInvoice({
    serviceId,
    budgetId,
  });

  setLoading(btn, false);

  if (!res.success) {
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(
    alertBox,
    `Factura ${res.data.number} emitida por ${formatMoney(res.data.total)}`,
    "ok",
  );
  document.getElementById("inp-service").value = "";
  document.getElementById("inp-budget").value = "";
  loadInvoices();
});

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadInvoices);
