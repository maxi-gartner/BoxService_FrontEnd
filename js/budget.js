// budget.js — panel de gestión de presupuestos
// Solo lectura + aprobar/rechazar. La creación y la generación de service
// viven en Taller, donde el vehículo ya está elegido (sin tipear IDs).
import { getBudgets, getVehiculos, approveBudget, updateBudgetStatus } from "./api.js";
import { escapeHtml, showAlert, setLoading, badgeHtml } from "./utils.js";

const tableBody = document.getElementById("table-body");
const alertBox = document.getElementById("alert-box");

let vehiculosPorId = {};

// ── Cargar tabla ───────────────────────────────────────
async function loadBudgets() {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';

  const [resVehiculos, res] = await Promise.all([getVehiculos(), getBudgets()]);

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
      '<tr><td colspan="5" class="text-muted">No hay presupuestos registrados.</td></tr>';
    return;
  }

  const canAct = (status) => status !== "approved" && status !== "rejected";

  tableBody.innerHTML = list
    .map((b) => {
      const vehiculo = vehiculosPorId[String(b.vehicleId)];
      const vehiculoLabel = vehiculo
        ? `${vehiculo.plate ?? "-"} — ${vehiculo.brand ?? ""} ${vehiculo.model ?? ""}`
        : `Vehículo #${b.vehicleId}`;

      return `
    <tr>
      <td class="text-accent">${escapeHtml(b.number)}</td>
      <td class="text-muted">${escapeHtml(b.date)}</td>
      <td><a href="taller.html?id=${b.vehicleId}">${escapeHtml(vehiculoLabel)}</a></td>
      <td>${badgeHtml(b.status)}</td>
      <td class="flex gap-2">
        ${
          canAct(b.status)
            ? `
          <button class="btn btn-primary btn-sm" id="btn-approve-${b.budgetId}" onclick="approveBudgetAction(${b.budgetId})">Aprobar</button>
          <button class="btn btn-danger btn-sm"  id="btn-reject-${b.budgetId}"  onclick="rejectBudgetAction(${b.budgetId})">Rechazar</button>
        `
            : `<a href="taller.html?id=${b.vehicleId}" class="text-muted">Ver vehículo</a>`
        }
      </td>
    </tr>
  `;
    })
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

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadBudgets);
