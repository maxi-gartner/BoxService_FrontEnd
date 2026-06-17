// vehiculos.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.
import { getVehiculos, createVehiculo, deleteVehiculo } from "./api.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");

function showAlert(msg, type = "error") {
  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;
  setTimeout(() => (alertBox.className = "alert"), 4000);
}

function obtenerKilometraje(vehiculo) {
  return (
    vehiculo.kilometraje ||
    vehiculo.Kilometraje ||
    vehiculo.km ||
    vehiculo.KM ||
    vehiculo.kms ||
    vehiculo.KMs ||
    vehiculo.kilometros ||
    vehiculo.Kilometros ||
    "-"
  );
}

function crearFilaVehiculo(vehiculo) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${vehiculo.placa || vehiculo.Placa || vehiculo.plate || vehiculo.Plate || "-"}</td>
    <td>${vehiculo.marca || vehiculo.Marca || vehiculo.brand || vehiculo.Brand || "-"}</td>
    <td>${vehiculo.modelo || vehiculo.Modelo || vehiculo.model || vehiculo.Model || "-"}</td>
    <td>${vehiculo.ano || vehiculo.Ano || vehiculo.year || vehiculo.Year || "-"}</td>
    <td>${vehiculo.clienteId || vehiculo.ClienteId || vehiculo.clientId || vehiculo.ClientId || "-"}</td>
    <td>${obtenerKilometraje(vehiculo)}</td>
    <td>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${vehiculo.vehiculoId || vehiculo.VehiculoId || vehiculo.id || vehiculo._id || vehiculo.vehicleId || vehiculo.VehicleId || ""}">Eliminar</button>
    </td>
  `;
  return tr;
}

function renderVehiculos(vehiculos) {
  tablaBody.innerHTML = "";

  if (!vehiculos || vehiculos.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-muted">No hay vehículos registrados.</td>
      </tr>
    `;
    return;
  }

  vehiculos.forEach((vehiculo) => {
    tablaBody.appendChild(crearFilaVehiculo(vehiculo));
  });
}

function extraerListaVehiculos(resData) {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.data)) return resData.data;
  if (Array.isArray(resData.vehiculos)) return resData.vehiculos;
  if (Array.isArray(resData.data?.vehiculos)) return resData.data.vehiculos;
  return [];
}

async function cargarVehiculos() {
  tablaBody.innerHTML =
    '<tr><td colspan="7" class="text-muted">Cargando...</td></tr>';

  const res = await getVehiculos();
  if (!res.success) {
    showAlert(res.error.message || "Error al cargar vehículos.");
    tablaBody.innerHTML =
      '<tr><td colspan="7" class="text-muted">Error al cargar.</td></tr>';
    return;
  }

  const lista = extraerListaVehiculos(res.data);
  renderVehiculos(lista);
}

async function manejarEnvioFormulario(event) {
  event.preventDefault();
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
    showAlert(res.error.message || "No se pudo crear el vehículo.");
    return;
  }

  formVehiculo.reset();
  showAlert("Vehículo creado correctamente.", "ok");
  cargarVehiculos();
}

async function manejarClickTabla(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;

  const id = button.dataset.id;
  if (!id) return;

  const confirmacion = window.confirm("¿Eliminar este vehículo?");
  if (!confirmacion) return;

  const res = await deleteVehiculo(id);
  if (!res.success) {
    showAlert(res.error.message || "No se pudo eliminar el vehículo.");
    return;
  }

  showAlert("Vehículo eliminado correctamente.", "ok");
  cargarVehiculos();
}

formVehiculo.addEventListener("submit", manejarEnvioFormulario);
tablaBody.addEventListener("click", manejarClickTabla);

document.addEventListener("DOMContentLoaded", cargarVehiculos);
