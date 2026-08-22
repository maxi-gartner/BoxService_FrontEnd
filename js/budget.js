// budget.js — lógica visual de la pantalla de presupuestos.
// Este archivo se encarga de:
// 1. Traer presupuestos del backend.
// 2. Mostrar presupuestos en la tabla.
// 3. Crear presupuestos nuevos desde el formulario.
// 4. Aprobar o rechazar presupuestos.

// Importa funciones de api.js.
// Estas funciones son las que hacen fetch al backend.
import {
  getBudgets,
  createBudget,
  approveBudget,
  updateBudgetStatus,
} from "./api.js";


// Busca elementos fijos del HTML y los guarda en constantes.
// Estos elementos ya existen en budget.html.
const tableBody = document.getElementById("table-body");
const formContainer = document.getElementById("form-container");
const alertBox = document.getElementById("alert-box");
const itemsContainer = document.getElementById("items-container");
const totalDisplay = document.getElementById("total-display");


// ── Helpers ────────────────────────────────────────────

// Muestra una alerta en pantalla.
// msg = texto del mensaje.
// type = puede ser "error" u "ok".
function showAlert(msg, type = "error") {
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;

  // Después de 5 segundos oculta la alerta.
  setTimeout(() => (alertBox.className = "alert"), 5000);
}


// Cambia visualmente un botón mientras espera respuesta del backend.
// Se usa en botones como Aprobar, Rechazar o Guardar.
function setLoading(btn, loading) {
  if (loading) {
    // Desactiva el botón para que no lo toquen dos veces.
    btn.disabled = true;

    // Guarda el texto original del botón.
    btn.dataset.original = btn.textContent;

    // Cambia el texto mientras carga.
    btn.textContent = "Cargando...";
    btn.style.opacity = "0.6";
  } else {
    // Restaura el botón.
    btn.disabled = false;
    btn.textContent = btn.dataset.original;
    btn.style.opacity = "1";
  }
}


// Devuelve el HTML del badge según el estado del presupuesto.
function badgeHtml(status) {
  const labels = {
    draft: "Borrador",
    sent: "Enviado",
    approved: "Aprobado",
    rejected: "Rechazado",
  };

  // Si el status existe en labels, usa la traducción.
  // Si no, muestra el valor original.
  const label = labels[status] ?? status;

  return `<span class="badge badge-${status}">${label}</span>`;
}


// Formatea un número como plata en formato argentino.
function formatMoney(amount) {
  return `$${parseFloat(amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}


// ── Cargar tabla ───────────────────────────────────────

// Carga los presupuestos desde el backend y los muestra en la tabla.
async function loadBudgets() {
  // Mensaje mientras espera la respuesta del backend.
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';

  // Llama al backend usando getBudgets() de api.js.
  const res = await getBudgets();

  // Si el backend respondió error, lo muestra en la tabla.
  if (!res.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${res.error.message}</td></tr>`;
    return;
  }

  // res.data trae la lista de presupuestos.
  // Si no viene nada, usa array vacío.
  const list = res.data ?? [];

  // Si no hay presupuestos, muestra mensaje.
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-muted">No hay presupuestos registrados.</td></tr>';
    return;
  }

  // Log de ayuda para ver qué estados vienen desde el backend.
  console.log(
    "[budget] estados:",
    list.map((b) => ({ id: b.budgetId, status: b.status })),
  );

  // Define si un presupuesto puede tener botones de acción.
  // Si ya está approved o rejected, no debería poder tocarse.
  const canAct = (status) => status !== "approved" && status !== "rejected";

  // Inserta en la tabla los presupuestos que vinieron del backend.
  // b representa cada presupuesto de la lista.
  tableBody.innerHTML = list
    .map(
      (b) => `
    <tr>
      <td class="text-accent">${b.number}</td>
      <td class="text-muted">${b.date}</td>
      <td>${b.vehicleId}</td>
      <td>${badgeHtml(b.status)}</td>
      <td class="flex gap-2">
        ${
          canAct(b.status)
            ? `
          <!-- 
            BOTÓN "Aprobar".
            Se crea desde JS dentro de cada fila de presupuesto.
            Al tocarlo, ejecuta approveBudgetAction() y le pasa el budgetId.
          -->
          <button 
            class="btn btn-primary btn-sm" 
            id="btn-approve-${b.budgetId}" 
            onclick="approveBudgetAction(${b.budgetId})">
            Aprobar
          </button>

          <!-- 
            BOTÓN "Rechazar".
            Se crea desde JS dentro de cada fila de presupuesto.
            Al tocarlo, ejecuta rejectBudgetAction() y le pasa el budgetId.
          -->
          <button 
            class="btn btn-danger btn-sm"  
            id="btn-reject-${b.budgetId}"  
            onclick="rejectBudgetAction(${b.budgetId})">
            Rechazar
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

// Acción del BOTÓN "Aprobar".
// id es el budgetId del presupuesto seleccionado.
window.approveBudgetAction = async (id) => {
  // Busca el botón Aprobar de ese presupuesto.
  const btn = document.getElementById(`btn-approve-${id}`);

  // Lo pone en estado cargando.
  setLoading(btn, true);

  // Llama al backend para aprobar el presupuesto.
  const res = await approveBudget(id);

  // Si falla, restaura el botón y muestra error.
  if (!res.success) {
    setLoading(btn, false);
    showAlert(res.error.message);
    return;
  }

  // Si sale bien, muestra mensaje y recarga la tabla.
  showAlert(`Service generado: #${res.data.service_id_created}`, "ok");
  loadBudgets();
};


// Acción del BOTÓN "Rechazar".
// id es el budgetId del presupuesto seleccionado.
window.rejectBudgetAction = async (id) => {
  // Busca el botón Rechazar de ese presupuesto.
  const btn = document.getElementById(`btn-reject-${id}`);

  // Lo pone en estado cargando.
  setLoading(btn, true);

  // Llama al backend para cambiar el estado a rejected.
  const res = await updateBudgetStatus(id, "rejected");

  // Si falla, restaura el botón y muestra error.
  if (!res.success) {
    setLoading(btn, false);
    showAlert(res.error.message);
    return;
  }

  // Si sale bien, muestra mensaje y recarga la tabla.
  showAlert("Presupuesto rechazado", "ok");
  loadBudgets();
};


// ── Ítems dinámicos ────────────────────────────────────

// Contador para identificar cada ítem agregado al formulario.
let itemCount = 0;


// Recalcula el total del presupuesto.
// Se ejecuta cuando cambia cantidad o precio.
function recalcTotal() {
  let total = 0;

  // Busca todas las filas de ítems agregadas al formulario.
  document.querySelectorAll("[data-item-id]").forEach((row) => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;

    const sub = qty * price;

    // Muestra subtotal del ítem.
    row.querySelector(".item-subtotal").textContent = formatMoney(sub);

    // Acumula total general.
    total += sub;
  });

  // Muestra el total estimado.
  totalDisplay.textContent = formatMoney(total);
}


// BOTÓN "Agregar ítem".
// Este botón viene del HTML con id="btn-add-item".
// Al tocarlo, agrega una nueva fila de detalle al formulario.
document.getElementById("btn-add-item").addEventListener("click", () => {
  itemCount++;

  // Crea un div nuevo para el ítem.
  const div = document.createElement("div");
  div.className = "item-row";

  // Guarda un id interno para poder eliminarlo después.
  div.dataset.itemId = itemCount;

  // Inserta los inputs del ítem dentro del formulario.
  div.innerHTML = `
    <select class="form-control item-type">
      <option value="labor">Mano de obra</option>
      <option value="part">Repuesto</option>
    </select>

    <input type="text"   class="form-control item-desc"  placeholder="Descripción">
    <input type="number" class="form-control item-qty"   placeholder="Cant." value="1" min="1">
    <input type="number" class="form-control item-price" placeholder="Precio" min="0" step="0.01">

    <span class="item-subtotal">$0</span>

    <!-- 
      BOTÓN "✕".
      Se crea desde JS dentro de cada ítem agregado.
      Al tocarlo, elimina ese ítem del formulario.
    -->
    <button class="btn btn-danger btn-sm" onclick="removeItem(${itemCount})">✕</button>
  `;

  // Cuando cambia cantidad o precio, recalcula el total.
  div.querySelector(".item-qty").addEventListener("input", recalcTotal);
  div.querySelector(".item-price").addEventListener("input", recalcTotal);

  // Inserta el ítem nuevo dentro del formulario.
  itemsContainer.appendChild(div);
});


// Acción del BOTÓN "✕".
// id es el data-item-id de la fila del ítem.
window.removeItem = (id) => {
  // Busca el ítem por data-item-id y lo elimina.
  document.querySelector(`[data-item-id="${id}"]`)?.remove();

  // Recalcula el total después de eliminar.
  recalcTotal();
};


// ── Guardar ────────────────────────────────────────────

// BOTÓN "Guardar presupuesto".
// Este botón viene del HTML con id="btn-save".
// Al tocarlo, toma la info del formulario, arma el objeto y lo manda al backend.
document.getElementById("btn-save").addEventListener("click", async () => {
  const btn = document.getElementById("btn-save");

  // Toma el ID del vehículo escrito en el formulario.
  const vehicleId = parseInt(document.getElementById("inp-vehicle").value);

  // Valida que haya vehículo.
  if (!vehicleId) {
    showAlert("Ingresá el ID del vehículo");
    return;
  }

  // Acá se van a guardar los ítems del presupuesto.
  const details = [];

  // Recorre todos los ítems agregados al formulario.
  document.querySelectorAll("[data-item-id]").forEach((row) => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;

    // Agrega cada ítem al array details.
    details.push({
      type: row.querySelector(".item-type").value,
      description: row.querySelector(".item-desc").value,
      quantity: qty,
      unit_price: price,
    });
  });

  // Valida que haya al menos un ítem.
  if (!details.length) {
    showAlert("Agregá al menos un ítem");
    return;
  }

  // Pone el botón Guardar en estado cargando.
  setLoading(btn, true);

  // Arma el objeto del presupuesto y lo manda al backend.
  // createBudget viene de api.js.
  const res = await createBudget({
    vehicle_id: vehicleId,
    notes: document.getElementById("inp-notes").value || null,
    details,
  });

  // Restaura el botón Guardar.
  setLoading(btn, false);

  // Si el backend responde error, muestra alerta.
  if (!res.success) {
    showAlert(res.error.message);
    return;
  }

  // Si salió bien, muestra el número del presupuesto creado.
  showAlert(`Presupuesto ${res.data.number} creado`, "ok");

  // Limpia y oculta el formulario.
  formContainer.classList.add("hidden");
  itemsContainer.innerHTML = "";
  itemCount = 0;
  totalDisplay.textContent = "$0";
  document.getElementById("inp-vehicle").value = "";
  document.getElementById("inp-notes").value = "";

  // Vuelve a pedir los presupuestos al backend
  // para que el nuevo aparezca en la tabla de Listado.
  loadBudgets();
});


// ── Form toggle ────────────────────────────────────────

// BOTÓN "+ Nuevo presupuesto".
// Este es el botón naranja de la pantalla.
// Viene del HTML con id="btn-new".
// Al tocarlo, muestra u oculta el formulario de nuevo presupuesto.
document
  .getElementById("btn-new")
  .addEventListener("click", () => formContainer.classList.toggle("hidden"));


// BOTÓN "Cancelar".
// Este botón está dentro del formulario.
// Viene del HTML con id="btn-cancel".
// Al tocarlo, oculta el formulario sin guardar nada.
document
  .getElementById("btn-cancel")
  .addEventListener("click", () => formContainer.classList.add("hidden"));


// ── Init ───────────────────────────────────────────────

// Cuando el HTML terminó de cargar, trae los presupuestos del backend
// y carga la tabla inicial.
document.addEventListener("DOMContentLoaded", loadBudgets);