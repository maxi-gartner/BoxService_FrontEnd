// clientes.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.
import { getClients, getClientVehicles, createClient } from "./api.js";

const clientesTbody = document.getElementById("clientes-tbody");
const vehiculosTbody = document.getElementById("vehiculos-tbody");
const vehiculosSubtitle = document.getElementById("vehiculos-subtitle");
const clienteForm = document.getElementById("cliente-form");
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
    btn.textContent = "Guardando...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original;
    btn.style.opacity = "1";
  }
}

// ── Cargar clientes ────────────────────────────────────
async function cargarClientes() {
  clientesTbody.innerHTML =
    '<tr><td colspan="5" class="text-muted">Cargando...</td></tr>';

  const res = await getClients();

  if (!res.success) {
    clientesTbody.innerHTML = `<tr><td colspan="5" class="text-muted">Error: ${res.error.message}</td></tr>`;
    return;
  }

  const lista = res.data ?? [];
  if (!lista.length) {
    clientesTbody.innerHTML =
      '<tr><td colspan="5" class="text-muted">No hay clientes registrados.</td></tr>';
    return;
  }

  clientesTbody.innerHTML = lista
    .map(
      (c) => `
    <tr>
      <td>${c.clientId}</td>
      <td>${c.name}</td>
      <td>${c.phone ?? "-"}</td>
      <td>${c.email ?? "-"}</td>
      <td>
        <button class="btn btn-secondary btn-sm"
          data-client-id="${c.clientId}"
          data-client-name="${c.name}">
          Ver vehículos
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

// ── Cargar vehículos del cliente ───────────────────────
async function cargarVehiculos(clientId, clientName) {
  vehiculosSubtitle.textContent = `Vehículos de ${clientName}`;
  vehiculosTbody.innerHTML =
    '<tr><td colspan="6" class="text-muted">Cargando...</td></tr>';

  const res = await getClientVehicles(clientId);

  if (!res.success) {
    vehiculosTbody.innerHTML = `<tr><td colspan="6" class="text-muted">Error: ${res.error.message}</td></tr>`;
    return;
  }

  const lista = res.data ?? [];
  if (!lista.length) {
    vehiculosTbody.innerHTML =
      '<tr><td colspan="6" class="text-muted">Este cliente no tiene vehículos registrados.</td></tr>';
    return;
  }

  vehiculosTbody.innerHTML = lista
    .map(
      (v) => `
    <tr>
      <td>${v.vehicleId}</td>
      <td class="text-accent">${v.plate}</td>
      <td>${v.brand}</td>
      <td>${v.model}</td>
      <td>${v.year ?? "-"}</td>
      <td>${v.mileage ?? "-"}</td>
    </tr>
  `,
    )
    .join("");
}

// ── Formulario nuevo cliente ───────────────────────────
clienteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const btn = clienteForm.querySelector('button[type="submit"]');
  const fd = new FormData(clienteForm);

  const payload = {
    name: fd.get("nombre").trim(),
    phone: fd.get("telefono").trim(),
    email: fd.get("email").trim(),
  };

  setLoading(btn, true);
  const res = await createClient(payload);
  setLoading(btn, false);

  if (!res.success) {
    showAlert(res.error.message);
    return;
  }

  showAlert(`Cliente creado con ID ${res.data.clientId}`, "ok");
  clienteForm.reset();
  cargarClientes();
});

// ── Botón ver vehículos ────────────────────────────────
clientesTbody.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-client-id]");
  if (!btn) return;
  cargarVehiculos(btn.dataset.clientId, btn.dataset.clientName);
});

// ── Botón actualizar ───────────────────────────────────
document
  .getElementById("refresh-clientes")
  ?.addEventListener("click", cargarClientes);

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarClientes);
