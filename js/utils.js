// utils.js — helpers compartidos por todas las páginas.
// Antes estaban duplicados (con pequeñas diferencias) en budget.js, invoice.js
// e index.html. Cualquier página que muestre datos que vengan del backend
// tiene que pasar por escapeHtml antes de meterlos en innerHTML.

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function showAlert(alertBox, msg, type = "error") {
  if (!alertBox) return;
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;
  setTimeout(() => (alertBox.className = "alert"), 5000);
}

export function setLoading(btn, loading, loadingText = "Cargando...") {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.textContent = loadingText;
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original;
    btn.style.opacity = "1";
  }
}

export function formatMoney(amount) {
  return `$${parseFloat(amount || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

const STATUS_LABELS = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  completed: "Finalizado",
  rejected: "Rechazado",
  issued: "Emitida",
  paid: "Cobrada",
  cancelled: "Anulada",
};

export function badgeHtml(status) {
  const label = STATUS_LABELS[status] ?? status;
  return `<span class="badge badge-${status}">${escapeHtml(label)}</span>`;
}
