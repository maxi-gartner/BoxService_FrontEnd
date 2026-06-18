// invoice.js — lógica de presentación de facturas
// Solo fetch y mostrar. Sin lógica de negocio.
import { getInvoices, createInvoice, updateInvoiceStatus } from "./api.js";

const tableBody = document.getElementById("table-body");
const alertBox = document.getElementById("alert-box");

// ── Helpers ────────────────────────────────────────────
function showAlert(msg, type = "error") {
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;
  setTimeout(() => (alertBox.className = "alert"), 5000);
}

function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.textContent = "Cargando...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original;
    btn.style.opacity = "1";
  }
}

function badgeHtml(status) {
  const labels = {
    issued: "Emitida",
    paid: "Cobrada",
    cancelled: "Anulada",
  };
  const label = labels[status] ?? status;
  return `<span class="badge badge-${status}">${label}</span>`;
}

function formatMoney(amount) {
  return `$${parseFloat(amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

// ── Cargar tabla ───────────────────────────────────────
async function loadInvoices() {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';
  const res = await getInvoices();

  if (!res.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${res.error.message}</td></tr>`;
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
      <td class="text-accent">${inv.number}</td>
      <td class="text-muted">${inv.date}</td>
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
    showAlert(res.error.message);
    return;
  }

  showAlert("Factura marcada como cobrada", "ok");
  loadInvoices();
};

window.cancelInvoice = async (id) => {
  if (!confirm("¿Seguro que querés anular esta factura?")) return;

  const btn = document.getElementById(`btn-cancel-${id}`);
  setLoading(btn, true);

  const res = await updateInvoiceStatus(id, "cancelled");

  if (!res.success) {
    setLoading(btn, false);
    showAlert(res.error.message);
    return;
  }

  showAlert("Factura anulada", "ok");
  loadInvoices();
};

// ── Emitir ─────────────────────────────────────────────
document.getElementById("btn-emit").addEventListener("click", async () => {
  const btn = document.getElementById("btn-emit");
  const serviceId = parseInt(document.getElementById("inp-service").value);
  const budgetId =
    parseInt(document.getElementById("inp-budget").value) || null;

  if (!serviceId) {
    showAlert("Ingresá el ID del service");
    return;
  }

  setLoading(btn, true);

  const res = await createInvoice({
    service_id: serviceId,
    budget_id: budgetId,
  });

  setLoading(btn, false);

  if (!res.success) {
    showAlert(res.error.message);
    return;
  }

  showAlert(
    `Factura ${res.data.number} emitida por ${formatMoney(res.data.total)}`,
    "ok",
  );
  document.getElementById("inp-service").value = "";
  document.getElementById("inp-budget").value = "";
  loadInvoices();
});

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadInvoices);
