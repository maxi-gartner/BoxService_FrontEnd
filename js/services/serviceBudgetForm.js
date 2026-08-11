// serviceBudgetForm.js — tab "Nuevo presupuesto": arma un presupuesto para el
// vehículo ya seleccionado (nunca pide el ID) y permite prellenar ítems desde
// el catálogo de precios, sin perder la posibilidad de editarlos.

import { createBudget, getCatalog } from "../api.js";
import { state } from "./serviceState.js";
import { escapeHtml, setLoading, formatMoney } from "../utils.js";
import { mostrarAlerta } from "./serviceUI.js";
import { cargarPresupuestosVehiculo } from "./serviceBudgetsList.js";

const TIPO_LABELS = { labor: "Mano de obra", part: "Repuesto" };

let itemCount = 0;
let catalogo = [];

function mostrarMensajePresupuestoForm(mensaje, tipo) {
  const el = document.getElementById("nuevoPresupuestoMensaje");
  if (!el) return;
  el.textContent = mensaje;
  el.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;
  setTimeout(() => {
    el.className = "alert";
    el.textContent = "";
  }, 4000);
}

export function configurarNuevoPresupuestoForm() {
  const itemsContainer = document.getElementById("presupuesto-items-container");
  const btnAddItem = document.getElementById("presupuesto-btn-add-item");
  const btnAddCatalogo = document.getElementById("presupuesto-btn-add-catalogo");
  const btnSave = document.getElementById("presupuesto-btn-save");

  if (!itemsContainer || !btnAddItem || !btnSave) return;

  cargarCatalogoParaSelect();

  btnAddItem.addEventListener("click", () => agregarItem());

  btnAddCatalogo.addEventListener("click", () => {
    const select = document.getElementById("presupuesto-catalogo-select");
    const catalogId = select.value;
    if (!catalogId) return;

    const item = catalogo.find((c) => String(c.catalogId) === catalogId);
    if (item) agregarItem(item);

    select.value = "";
  });

  btnSave.addEventListener("click", guardarPresupuesto);
}

async function cargarCatalogoParaSelect() {
  const select = document.getElementById("presupuesto-catalogo-select");
  if (!select) return;

  const res = await getCatalog();
  if (!res.success || !Array.isArray(res.data)) return;

  catalogo = res.data;

  select.innerHTML =
    '<option value="">Elegir del catálogo...</option>' +
    catalogo
      .map(
        (item) =>
          `<option value="${item.catalogId}">${escapeHtml(item.name)} — ${formatMoney(item.price)}</option>`,
      )
      .join("");
}

function recalcTotal() {
  const totalDisplay = document.getElementById("presupuesto-total-display");
  let total = 0;

  document.querySelectorAll("#presupuesto-items-container [data-item-id]").forEach((row) => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    const sub = qty * price;
    row.querySelector(".item-subtotal").textContent = formatMoney(sub);
    total += sub;
  });

  totalDisplay.textContent = formatMoney(total);
}

function agregarItem(catalogItem = null) {
  const itemsContainer = document.getElementById("presupuesto-items-container");
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
    <button class="btn btn-danger btn-sm" aria-label="Eliminar ítem" type="button" data-remove="${itemCount}">✕</button>
  `;

  if (catalogItem) {
    div.querySelector(".item-type").value = TIPO_LABELS[catalogItem.type] ? catalogItem.type : "labor";
    div.querySelector(".item-desc").value = catalogItem.name;
    div.querySelector(".item-price").value = catalogItem.price;
  }

  div.querySelector(".item-qty").addEventListener("input", recalcTotal);
  div.querySelector(".item-price").addEventListener("input", recalcTotal);
  div.querySelector("[data-remove]").addEventListener("click", () => {
    div.remove();
    recalcTotal();
  });

  itemsContainer.appendChild(div);
  recalcTotal();
}

async function guardarPresupuesto() {
  const btn = document.getElementById("presupuesto-btn-save");
  const vehicleId = state.vehiculoSeleccionadoId;

  if (!vehicleId) {
    mostrarAlerta("Elegí un vehículo en la pestaña Buscar antes de presupuestar.", "error");
    mostrarMensajePresupuestoForm("Elegí un vehículo en la pestaña Buscar antes de presupuestar.", "error");
    return;
  }

  const details = [];
  document.querySelectorAll("#presupuesto-items-container [data-item-id]").forEach((row) => {
    details.push({
      type: row.querySelector(".item-type").value,
      description: row.querySelector(".item-desc").value,
      quantity: parseFloat(row.querySelector(".item-qty").value) || 0,
      unitPrice: parseFloat(row.querySelector(".item-price").value) || 0,
    });
  });

  if (!details.length) {
    mostrarAlerta("Agregá al menos un ítem.", "error");
    mostrarMensajePresupuestoForm("Agregá al menos un ítem.", "error");
    return;
  }

  setLoading(btn, true);

  const res = await createBudget({
    vehicleId,
    notes: document.getElementById("presupuesto-inp-notes").value || null,
    details,
  });

  setLoading(btn, false);

  if (!res.success) {
    mostrarAlerta(res.error?.message ?? "No se pudo crear el presupuesto.", "error");
    mostrarMensajePresupuestoForm(res.error?.message ?? "No se pudo crear el presupuesto.", "error");
    return;
  }

  mostrarAlerta(`Presupuesto ${res.data.number} creado.`, "ok");
  mostrarMensajePresupuestoForm(`Presupuesto ${res.data.number} creado.`, "ok");

  document.getElementById("presupuesto-items-container").innerHTML = "";
  document.getElementById("presupuesto-total-display").textContent = "$0";
  document.getElementById("presupuesto-inp-notes").value = "";
  itemCount = 0;

  cargarPresupuestosVehiculo(vehicleId);
}
