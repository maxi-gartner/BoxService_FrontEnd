// budget.js — lógica de presentación de presupuestos
// Solo fetch y mostrar. Sin lógica de negocio.
import {
  getBudgets,
  createBudget,
  approveBudget,
  updateBudgetStatus,
} from "./api.js";
import { escapeHtml, showAlert, setLoading, formatMoney, badgeHtml } from "./utils.js";

const tableBody = document.getElementById("table-body");
const formContainer = document.getElementById("form-container");
const alertBox = document.getElementById("alert-box");
const itemsContainer = document.getElementById("items-container");
const totalDisplay = document.getElementById("total-display");

// ── Cargar tabla ───────────────────────────────────────
async function loadBudgets() {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';
  const res = await getBudgets();

  if (!res.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${escapeHtml(res.error?.message)}</td></tr>`;
    return;
  }

  const list = res.data ?? [];
  if (!list.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-muted">No hay presupuestos registrados.</td></tr>';
    return;
  }

  const canAct = (status) => status !== "approved" && status !== "rejected";

  tableBody.innerHTML = list
    .map(
      (b) => `
    <tr>
      <td class="text-accent">${escapeHtml(b.number)}</td>
      <td class="text-muted">${escapeHtml(b.date)}</td>
      <td>${escapeHtml(b.vehicleId)}</td>
      <td>${badgeHtml(b.status)}</td>
      <td class="flex gap-2">
        ${
          canAct(b.status)
            ? `
          <button class="btn btn-primary btn-sm" id="btn-approve-${b.budgetId}" onclick="approveBudgetAction(${b.budgetId})">Aprobar</button>
          <button class="btn btn-danger btn-sm"  id="btn-reject-${b.budgetId}"  onclick="rejectBudgetAction(${b.budgetId})">Rechazar</button>
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
window.approveBudgetAction = async (id) => {
  const btn = document.getElementById(`btn-approve-${id}`);
  setLoading(btn, true);

  const res = await approveBudget(id);

  if (!res.success) {
    setLoading(btn, false);
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(alertBox, res.data?.message ?? "Presupuesto aprobado", "ok");
  loadBudgets();
};

window.rejectBudgetAction = async (id) => {
  const btn = document.getElementById(`btn-reject-${id}`);
  setLoading(btn, true);

  const res = await updateBudgetStatus(id, "rejected");

  if (!res.success) {
    setLoading(btn, false);
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(alertBox, "Presupuesto rechazado", "ok");
  loadBudgets();
};

// ── Ítems dinámicos ────────────────────────────────────
let itemCount = 0;

function recalcTotal() {
  let total = 0;
  document.querySelectorAll("[data-item-id]").forEach((row) => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    const sub = qty * price;
    row.querySelector(".item-subtotal").textContent = formatMoney(sub);
    total += sub;
  });
  totalDisplay.textContent = formatMoney(total);
}

document.getElementById("btn-add-item").addEventListener("click", () => {
  itemCount++;
  const div = document.createElement("div");
  div.className = "item-row";
  div.dataset.itemId = itemCount;
  div.innerHTML = `
    <select class="form-control item-type">
      <option value="labor">Mano de obra</option>
      <option value="part">Repuesto</option>
    </select>
    <input type="text"   class="form-control item-desc"  placeholder="Descripción">
    <input type="number" class="form-control item-qty"   placeholder="Cant." value="1" min="1">
    <input type="number" class="form-control item-price" placeholder="Precio" min="0" step="0.01">
    <span class="item-subtotal">$0</span>
    <button class="btn btn-danger btn-sm" aria-label="Eliminar ítem" onclick="removeItem(${itemCount})">✕</button>
  `;
  div.querySelector(".item-qty").addEventListener("input", recalcTotal);
  div.querySelector(".item-price").addEventListener("input", recalcTotal);
  itemsContainer.appendChild(div);
});

window.removeItem = (id) => {
  document.querySelector(`[data-item-id="${id}"]`)?.remove();
  recalcTotal();
};

// ── Guardar ────────────────────────────────────────────
document.getElementById("btn-save").addEventListener("click", async () => {
  const btn = document.getElementById("btn-save");
  const vehicleId = parseInt(document.getElementById("inp-vehicle").value);
  if (!vehicleId) {
    showAlert(alertBox, "Ingresá el ID del vehículo");
    return;
  }

  const details = [];
  document.querySelectorAll("[data-item-id]").forEach((row) => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    details.push({
      type: row.querySelector(".item-type").value,
      description: row.querySelector(".item-desc").value,
      quantity: qty,
      unitPrice: price,
    });
  });

  if (!details.length) {
    showAlert(alertBox, "Agregá al menos un ítem");
    return;
  }

  setLoading(btn, true);

  const res = await createBudget({
    vehicleId,
    notes: document.getElementById("inp-notes").value || null,
    details,
  });

  setLoading(btn, false);

  if (!res.success) {
    showAlert(alertBox, res.error?.message);
    return;
  }

  showAlert(alertBox, `Presupuesto ${res.data.number} creado`, "ok");
  formContainer.classList.add("hidden");
  itemsContainer.innerHTML = "";
  itemCount = 0;
  totalDisplay.textContent = "$0";
  document.getElementById("inp-vehicle").value = "";
  document.getElementById("inp-notes").value = "";
  loadBudgets();
});

// ── Form toggle ────────────────────────────────────────
document
  .getElementById("btn-new")
  .addEventListener("click", () => formContainer.classList.toggle("hidden"));
document
  .getElementById("btn-cancel")
  .addEventListener("click", () => formContainer.classList.add("hidden"));

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadBudgets);
