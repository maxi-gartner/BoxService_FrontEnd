// budget.js — lógica de presentación de presupuestos
// Solo fetch y mostrar. Sin lógica de negocio.
import { getBudgets, createBudget, approveBudget, updateBudgetStatus } from './api.js';

const tableBody     = document.getElementById('table-body');
const formContainer = document.getElementById('form-container');
const alertBox      = document.getElementById('alert-box');
const itemsContainer= document.getElementById('items-container');
const totalDisplay  = document.getElementById('total-display');

// ── Helpers ────────────────────────────────────────────
function showAlert(msg, type = 'error') {
  alertBox.textContent = msg;
  alertBox.className   = `alert show alert-${type}`;
  setTimeout(() => alertBox.className = 'alert', 5000);
}

function badgeHtml(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function formatMoney(amount) {
  return `$${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// ── Cargar tabla ───────────────────────────────────────
async function loadBudgets() {
  tableBody.innerHTML = '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';
  const res = await getBudgets();

  if (!res.success) { showAlert(res.error.message); return; }

  const list = res.data ?? [];
  if (!list.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-muted">No hay presupuestos registrados.</td></tr>';
    return;
  }

  tableBody.innerHTML = list.map(b => `
    <tr>
      <td class="text-accent">${b.number}</td>
      <td>${b.date}</td>
      <td>${b.vehicleId}</td>
      <td>${badgeHtml(b.status)}</td>
      <td class="flex gap-2">
        ${b.status !== 'approved' && b.status !== 'rejected' ? `
          <button class="btn btn-primary btn-sm" onclick="approveBudgetAction(${b.budgetId})">Aprobar</button>
          <button class="btn btn-danger btn-sm"  onclick="rejectBudgetAction(${b.budgetId})">Rechazar</button>
        ` : '—'}
      </td>
    </tr>
  `).join('');
}

// ── Acciones ───────────────────────────────────────────
window.approveBudgetAction = async (id) => {
  const res = await approveBudget(id);
  if (!res.success) { showAlert(res.error.message); return; }
  showAlert(`Service generado: #${res.data.service_id_created}`, 'ok');
  loadBudgets();
};

window.rejectBudgetAction = async (id) => {
  const res = await updateBudgetStatus(id, 'rejected');
  if (!res.success) { showAlert(res.error.message); return; }
  showAlert('Presupuesto rechazado', 'ok');
  loadBudgets();
};

// ── Ítems dinámicos ────────────────────────────────────
let itemCount = 0;

function recalcTotal() {
  let total = 0;
  document.querySelectorAll('[data-item-id]').forEach(row => {
    const qty   = parseFloat(row.querySelector('.item-qty').value)   || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const sub   = qty * price;
    row.querySelector('.item-subtotal').textContent = formatMoney(sub);
    total += sub;
  });
  totalDisplay.textContent = formatMoney(total);
}

document.getElementById('btn-add-item').addEventListener('click', () => {
  itemCount++;
  const div = document.createElement('div');
  div.className = 'item-row';
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
    <button class="btn btn-danger btn-sm" onclick="removeItem(${itemCount})">✕</button>
  `;
  div.querySelector('.item-qty').addEventListener('input',   recalcTotal);
  div.querySelector('.item-price').addEventListener('input', recalcTotal);
  itemsContainer.appendChild(div);
});

window.removeItem = (id) => {
  document.querySelector(`[data-item-id="${id}"]`)?.remove();
  recalcTotal();
};

// ── Guardar ────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const vehicleId = parseInt(document.getElementById('inp-vehicle').value);
  if (!vehicleId) { showAlert('Ingresá el ID del vehículo'); return; }

  const details = [];
  document.querySelectorAll('[data-item-id]').forEach(row => {
    const qty   = parseFloat(row.querySelector('.item-qty').value)   || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    details.push({
      type:        row.querySelector('.item-type').value,
      description: row.querySelector('.item-desc').value,
      quantity:    qty,
      unit_price:  price
    });
  });

  if (!details.length) { showAlert('Agregá al menos un ítem'); return; }

  const res = await createBudget({
    vehicle_id: vehicleId,
    notes:      document.getElementById('inp-notes').value || null,
    details
  });

  if (!res.success) { showAlert(res.error.message); return; }

  showAlert(`Presupuesto ${res.data.number} creado`, 'ok');
  formContainer.classList.add('hidden');
  itemsContainer.innerHTML = '';
  itemCount = 0;
  totalDisplay.textContent = '$0';
  document.getElementById('inp-vehicle').value = '';
  document.getElementById('inp-notes').value   = '';
  loadBudgets();
});

// ── Form toggle ────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click',
  () => formContainer.classList.toggle('hidden'));
document.getElementById('btn-cancel').addEventListener('click',
  () => formContainer.classList.add('hidden'));

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadBudgets);
