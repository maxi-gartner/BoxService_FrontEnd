// vehiculos.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.
import { getVehiculos, createVehiculo } from "./api.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");

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

// NUEVO:
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

// ── Render ─────────────────────────────────────────────
function crearFila(v) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="text-accent">${v.plate ?? "-"}</td>
    <td>${v.brand ?? "-"}</td>
    <td>${v.model ?? "-"}</td>
    <td>${v.year ?? "-"}</td>
    <td>${v.clientId ?? "-"}</td>
    <td>${getKilometrajeActual(v)}</td>
  `;

  return tr;
}

function renderVehiculos(lista) {
  tablaBody.innerHTML = "";

  if (!lista.length) {
    tablaBody.innerHTML =
      '<tr><td colspan="6" class="text-muted">No hay vehículos registrados.</td></tr>';
    return;
  }

  lista.forEach((v) => tablaBody.appendChild(crearFila(v)));
}

// ── Cargar ─────────────────────────────────────────────
async function cargarVehiculos() {
  tablaBody.innerHTML =
    '<tr><td colspan="6" class="text-muted">Cargando...</td></tr>';

  const res = await getVehiculos();

  if (!res.success) {
    showAlert(res.error.message);
    tablaBody.innerHTML =
      '<tr><td colspan="6" class="text-muted">Error al cargar.</td></tr>';
    return;
  }

  const lista = res.data ?? [];
  if (!lista.length) {
    tablaBody.innerHTML =
      '<tr><td colspan="6" class="text-muted">No hay vehículos registrados.</td></tr>';
    return;
  }

  tablaBody.innerHTML = "";
  lista.forEach((v) => tablaBody.appendChild(renderRow(v)));
}

formVehiculo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(formVehiculo);

  const kilometrajeActual = fd.get("kilometrajeActual");

  const payload = {
    clientId: parseInt(fd.get("cliente")) || 0,
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
    showAlert(res.error.message);
    return;
  }

  showAlert("Vehículo creado correctamente.", "ok");
  formVehiculo.reset();
  cargarVehiculos();
});

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarVehiculos);
