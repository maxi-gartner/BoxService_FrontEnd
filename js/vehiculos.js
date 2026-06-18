// vehiculos.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.
import { getVehiculos, createVehiculo } from "./api.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");

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

// ── Render ─────────────────────────────────────────────
function crearFila(v) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="text-accent">${v.plate ?? "-"}</td>
    <td>${v.brand ?? "-"}</td>
    <td>${v.model ?? "-"}</td>
    <td>${v.year ?? "-"}</td>
    <td>${v.clientId ?? "-"}</td>
    <td class="text-muted">—</td>
    <td></td>
  `;
  return tr;
}

function renderVehiculos(lista) {
  tablaBody.innerHTML = "";
  if (!lista.length) {
    tablaBody.innerHTML =
      '<tr><td colspan="7" class="text-muted">No hay vehículos registrados.</td></tr>';
    return;
  }
  lista.forEach((v) => tablaBody.appendChild(crearFila(v)));
}

// ── Cargar ─────────────────────────────────────────────
async function cargarVehiculos() {
  tablaBody.innerHTML =
    '<tr><td colspan="7" class="text-muted">Cargando...</td></tr>';

  const res = await getVehiculos();
  if (!res.success) {
    showAlert(res.error?.message || "Error al cargar vehículos.");
    tablaBody.innerHTML =
      '<tr><td colspan="7" class="text-muted">Error al cargar.</td></tr>';
    return;
  }

  renderVehiculos(res.data ?? []);
}

// ── Formulario ─────────────────────────────────────────
formVehiculo.addEventListener("submit", async (event) => {
  event.preventDefault();

  const btn = formVehiculo.querySelector('button[type="submit"]');
  const fd = new FormData(formVehiculo);

  const payload = {
    clientId: parseInt(fd.get("cliente")) || 0,
    brand: fd.get("marca").trim(),
    model: fd.get("modelo").trim(),
    year: fd.get("anio") ? parseInt(fd.get("anio")) : null,
    plate: fd.get("patente").trim(),
  };

  setLoading(btn, true);
  const res = await createVehiculo(payload);
  setLoading(btn, false);

  if (!res.success) {
    showAlert(res.error?.message || "No se pudo crear el vehículo.");
    return;
  }

  formVehiculo.reset();
  showAlert("Vehículo creado correctamente.", "ok");
  cargarVehiculos();
});

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarVehiculos);
