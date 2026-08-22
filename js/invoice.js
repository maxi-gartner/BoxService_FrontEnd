// invoice.js — lógica de presentación de facturas
// Este archivo maneja la pantalla de facturas:
// 1. Carga las facturas desde el backend.
// 2. Las muestra en la tabla.
// 3. Permite marcar facturas como cobradas.
// 4. Permite anular facturas.
// 5. Permite emitir una factura nueva.

// Funciones importadas desde api.js.
// Estas funciones hacen fetch al backend.
import { getInvoices, createInvoice, updateInvoiceStatus } from "./api.js";

// Elementos del HTML que se van a usar desde JS.
const tableBody = document.getElementById("table-body");
const alertBox = document.getElementById("alert-box");


// ── Helpers ────────────────────────────────────────────

// Muestra mensajes en pantalla.
// type puede ser "error" u "ok".
function showAlert(msg, type = "error") {
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;

  // Después de 5 segundos oculta la alerta.
  setTimeout(() => (alertBox.className = "alert"), 5000);
}


// Cambia visualmente un botón mientras espera respuesta del backend.
// Se usa en botones como "Cobrada", "Anular" y "Emitir".
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


// Arma el badge visual según el estado de la factura.
function badgeHtml(status) {
  const labels = {
    issued: "Emitida",
    paid: "Cobrada",
    cancelled: "Anulada",
  };

  const label = labels[status] ?? status;

  return `<span class="badge badge-${status}">${label}</span>`;
}


// Formatea un número como plata.
function formatMoney(amount) {
  return `$${parseFloat(amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}


// ── Cargar tabla ───────────────────────────────────────

// Carga las facturas desde el backend y las muestra en la tabla.
async function loadInvoices() {
  // Mensaje mientras espera la respuesta del backend.
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';

  // Llama al backend usando getInvoices() de api.js.
  const res = await getInvoices();

  // Si el backend responde error, muestra error en la tabla.
  if (!res.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${res.error.message}</td></tr>`;
    return;
  }

  // res.data trae la lista de facturas.
  const list = res.data ?? [];

  // Si no hay facturas, muestra mensaje.
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-muted">No hay facturas registradas.</td></tr>';
    return;
  }

  // Inserta en la tabla las facturas que vinieron del backend.
  // inv representa cada factura de la lista.
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
          <!-- 
            BOTÓN "Cobrada".
            Se crea desde JS dentro de cada fila de factura.
            Solo aparece si la factura está en estado "issued".
            Al tocarlo, llama a markPaid() y le pasa el invoiceId.
          -->
          <button 
            class="btn btn-primary btn-sm" 
            id="btn-paid-${inv.invoiceId}"   
            onclick="markPaid(${inv.invoiceId})">
            Cobrada
          </button>

          <!-- 
            BOTÓN "Anular".
            Se crea desde JS dentro de cada fila de factura.
            Solo aparece si la factura está en estado "issued".
            Al tocarlo, llama a cancelInvoice() y le pasa el invoiceId.
          -->
          <button 
            class="btn btn-danger btn-sm"  
            id="btn-cancel-${inv.invoiceId}" 
            onclick="cancelInvoice(${inv.invoiceId})">
            Anular
          </button>
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

// Acción del BOTÓN "Cobrada".
// id es el invoiceId de la factura seleccionada.
window.markPaid = async (id) => {
  // Busca el botón "Cobrada" de esa factura.
  const btn = document.getElementById(`btn-paid-${id}`);

  // Lo pone en estado cargando.
  setLoading(btn, true);

  // Llama al backend para cambiar el estado a "paid".
  const res = await updateInvoiceStatus(id, "paid");

  // Si falla, restaura el botón y muestra error.
  if (!res.success) {
    setLoading(btn, false);
    showAlert(res.error.message);
    return;
  }

  // Si sale bien, muestra mensaje y recarga la tabla.
  showAlert("Factura marcada como cobrada", "ok");
  loadInvoices();
};


// Acción del BOTÓN "Anular".
// id es el invoiceId de la factura seleccionada.
window.cancelInvoice = async (id) => {
  // Pide confirmación antes de anular.
  if (!confirm("¿Seguro que querés anular esta factura?")) return;

  // Busca el botón "Anular" de esa factura.
  const btn = document.getElementById(`btn-cancel-${id}`);

  // Lo pone en estado cargando.
  setLoading(btn, true);

  // Llama al backend para cambiar el estado a "cancelled".
  const res = await updateInvoiceStatus(id, "cancelled");

  // Si falla, restaura el botón y muestra error.
  if (!res.success) {
    setLoading(btn, false);
    showAlert(res.error.message);
    return;
  }

  // Si sale bien, muestra mensaje y recarga la tabla.
  showAlert("Factura anulada", "ok");
  loadInvoices();
};


// ── Emitir ─────────────────────────────────────────────

// BOTÓN "Emitir factura".
// Este botón viene del HTML con id="btn-emit".
// Al tocarlo, toma el serviceId y budgetId del formulario,
// arma el objeto y lo manda al backend para crear una factura.
document.getElementById("btn-emit").addEventListener("click", async () => {
  const btn = document.getElementById("btn-emit");

  // Toma el ID del service desde el input del HTML.
  const serviceId = parseInt(document.getElementById("inp-service").value);

  // Toma el ID del presupuesto desde el input del HTML.
  // Si está vacío, manda null.
  const budgetId =
    parseInt(document.getElementById("inp-budget").value) || null;

  // Valida que haya serviceId, porque es obligatorio.
  if (!serviceId) {
    showAlert("Ingresá el ID del service");
    return;
  }

  // Pone el botón Emitir en estado cargando.
  setLoading(btn, true);

  // Manda al backend la data para crear la factura.
  // createInvoice viene de api.js.
  const res = await createInvoice({
    service_id: serviceId,
    budget_id: budgetId,
  });

  // Restaura el botón.
  setLoading(btn, false);

  // Si falla, muestra error.
  if (!res.success) {
    showAlert(res.error.message);
    return;
  }

  // Si salió bien, muestra número y total de la factura creada.
  showAlert(
    `Factura ${res.data.number} emitida por ${formatMoney(res.data.total)}`,
    "ok",
  );

  // Limpia los inputs del formulario.
  document.getElementById("inp-service").value = "";
  document.getElementById("inp-budget").value = "";

  // Recarga la tabla para que aparezca la factura nueva.
  loadInvoices();
});


// ── Init ───────────────────────────────────────────────

// Cuando el HTML terminó de cargar,
// trae las facturas del backend y carga la tabla inicial.
document.addEventListener("DOMContentLoaded", loadInvoices);