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

function renderRow(v) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="text-accent">${v.plate ?? "-"}</td>
    <td>${v.brand ?? "-"}</td>
    <td>${v.model ?? "-"}</td>
    <td>${v.year ?? "-"}</td>
    <td>${v.clientId ?? "-"}</td>
    <td>
      <button class="btn btn-danger btn-sm" data-id="${v.vehicleId}">Eliminar</button>
    </td>
  `;
  return tr;
}

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

  const payload = {
    clientId: parseInt(fd.get("cliente")) || 0,
    brand: fd.get("marca").trim(),
    model: fd.get("modelo").trim(),
    year: fd.get("anio") ? parseInt(fd.get("anio")) : null,
    plate: fd.get("patente").trim(),
  };

  const res = await createVehiculo(payload);
  if (!res.success) {
    showAlert(res.error.message);
    return;
  }

  showAlert("Vehículo creado correctamente.", "ok");
  formVehiculo.reset();
  cargarVehiculos();
});

document.addEventListener("DOMContentLoaded", cargarVehiculos);
