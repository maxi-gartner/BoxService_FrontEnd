// vehiculos.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.
import { getVehiculos, getClients, createVehiculo } from "./api.js";
import { escapeHtml } from "./utils.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");
const buscadorTabla = document.getElementById("vehiculos-buscador");
const clienteBuscador = document.getElementById("cliente-buscador");
const clienteIdInput = document.getElementById("cliente-id-seleccionado");
const clienteSugerencias = document.getElementById("cliente-sugerencias");

let vehiculosCargados = [];
let clientesPorId = {};
let clientesLista = [];

// ── Helpers ────────────────────────────────────────────
function showAlert(msg, type = "error") {
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;
  setTimeout(() => (alertBox.className = "alert"), 4000);
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

// El backend devuelve currentMileage.
// Dejamos varios nombres por si en algún momento cambia el nombre del campo.
function getKilometrajeActual(v) {
  return (
    v.currentMileage ??
    v.kilometrajeActual ??
    v.kilometraje_actual ??
    v.mileage ??
    "-"
  );
}

function getNombreCliente(clientId) {
  return clientesPorId[String(clientId)] ?? `Cliente #${clientId}`;
}

// ── Render tabla ───────────────────────────────────────
function crearFila(v) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="text-accent">${escapeHtml(v.plate ?? "-")}</td>
    <td>${escapeHtml(v.brand ?? "-")}</td>
    <td>${escapeHtml(v.model ?? "-")}</td>
    <td>${escapeHtml(v.year ?? "-")}</td>
    <td>${escapeHtml(getNombreCliente(v.clientId))}</td>
    <td>${escapeHtml(getKilometrajeActual(v))}</td>
  `;

  tr.addEventListener("click", () => {
    window.location.href = `taller.html?id=${v.vehicleId}`;
  });

  return tr;
}

function renderVehiculos(lista) {
  tablaBody.innerHTML = "";

  if (!lista.length) {
    tablaBody.innerHTML =
      '<tr><td colspan="6" class="text-muted">No hay vehículos que coincidan con la búsqueda.</td></tr>';
    return;
  }

  lista.forEach((v) => tablaBody.appendChild(crearFila(v)));
}

function filtrarYRenderizar() {
  const texto = buscadorTabla.value.toLowerCase().trim();

  if (!texto) {
    renderVehiculos(vehiculosCargados);
    return;
  }

  const filtrados = vehiculosCargados.filter((v) => {
    const campos = [
      v.plate,
      v.brand,
      v.model,
      getNombreCliente(v.clientId),
    ]
      .map((c) => String(c ?? "").toLowerCase())
      .join(" ");

    return campos.includes(texto);
  });

  renderVehiculos(filtrados);
}

buscadorTabla.addEventListener("input", filtrarYRenderizar);

// ── Cargar ─────────────────────────────────────────────
async function cargarVehiculos() {
  tablaBody.innerHTML =
    '<tr><td colspan="6" class="text-muted">Cargando...</td></tr>';

  const [resClientes, resVehiculos] = await Promise.all([getClients(), getVehiculos()]);

  if (resClientes.success && Array.isArray(resClientes.data)) {
    clientesLista = resClientes.data;
    clientesPorId = {};
    resClientes.data.forEach((c) => {
      clientesPorId[String(c.clientId)] = c.nombre ?? c.name ?? `Cliente #${c.clientId}`;
    });
  }

  if (!resVehiculos.success) {
    showAlert(resVehiculos.error?.message || "Error al cargar vehículos.");
    tablaBody.innerHTML =
      '<tr><td colspan="6" class="text-muted">Error al cargar.</td></tr>';
    return;
  }

  vehiculosCargados = resVehiculos.data ?? [];
  renderVehiculos(vehiculosCargados);
}

// ── Buscador de cliente para el alta de vehículo ───────
clienteBuscador.addEventListener("input", () => {
  clienteIdInput.value = "";
  const texto = clienteBuscador.value.toLowerCase().trim();

  if (!texto) {
    clienteSugerencias.classList.remove("show");
    return;
  }

  const coincidencias = clientesLista
    .filter((c) => (c.nombre ?? c.name ?? "").toLowerCase().includes(texto))
    .slice(0, 8);

  if (!coincidencias.length) {
    clienteSugerencias.innerHTML = '<div class="text-muted">Sin coincidencias.</div>';
    clienteSugerencias.classList.add("show");
    return;
  }

  clienteSugerencias.innerHTML = coincidencias
    .map(
      (c) =>
        `<div data-cliente-id="${c.clientId}">${escapeHtml(c.nombre ?? c.name)}</div>`,
    )
    .join("");
  clienteSugerencias.classList.add("show");
});

clienteSugerencias.addEventListener("click", (event) => {
  const item = event.target.closest("[data-cliente-id]");
  if (!item) return;

  clienteIdInput.value = item.dataset.clienteId;
  clienteBuscador.value = item.textContent;
  clienteSugerencias.classList.remove("show");
});

document.addEventListener("click", (event) => {
  if (!clienteSugerencias.contains(event.target) && event.target !== clienteBuscador) {
    clienteSugerencias.classList.remove("show");
  }
});

// ── Formulario ─────────────────────────────────────────
formVehiculo.addEventListener("submit", async (event) => {
  event.preventDefault();

  const btn = formVehiculo.querySelector('button[type="submit"]');
  const fd = new FormData(formVehiculo);

  if (!clienteIdInput.value) {
    showAlert("Elegí un cliente de la lista de sugerencias.");
    return;
  }

  const kilometrajeActual = fd.get("kilometrajeActual");

  const payload = {
    clientId: parseInt(clienteIdInput.value),
    brand: fd.get("marca").trim(),
    model: fd.get("modelo").trim(),
    year: fd.get("anio") ? parseInt(fd.get("anio")) : null,
    plate: fd.get("patente").trim(),
    currentMileage:
      kilometrajeActual !== null && kilometrajeActual !== ""
        ? parseInt(kilometrajeActual)
        : 0
  };

  if (payload.currentMileage < 0) {
    showAlert("El kilometraje actual no puede ser negativo.");
    return;
  }

  setLoading(btn, true);

  const res = await createVehiculo(payload);

  setLoading(btn, false);

  if (!res.success) {
    showAlert(res.error?.message || "No se pudo crear el vehículo.");
    return;
  }

  formVehiculo.reset();
  clienteIdInput.value = "";
  showAlert("Vehículo creado correctamente.", "ok");
  cargarVehiculos();
});

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarVehiculos);
