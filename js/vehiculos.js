import { getVehiculos, createVehiculo, deleteVehiculo } from "./api.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");

function mostrarAlerta(mensaje, tipo = "error") {
  alertBox.textContent = mensaje;
  alertBox.className = `alert ${tipo === "ok" ? "alert-ok" : "alert-error"} show`;
}

function ocultarAlerta() {
  alertBox.textContent = "";
  alertBox.className = "alert";
}

function crearFilaVehiculo(vehiculo) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${vehiculo.placa || vehiculo.Placa || "-"}</td>
    <td>${vehiculo.marca || vehiculo.Marca || "-"}</td>
    <td>${vehiculo.modelo || vehiculo.Modelo || "-"}</td>
    <td>${vehiculo.ano || vehiculo.Ano || "-"}</td>
    <td>${vehiculo.clienteId || vehiculo.ClienteId || "-"}</td>
    <td>
      <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${vehiculo.vehiculoId || vehiculo.VehiculoId}">Eliminar</button>
    </td>
  `;
  return tr;
}

let vehiculosCache = [];

function renderVehiculos(vehiculos) {
  tablaBody.innerHTML = "";

  if (!vehiculos || vehiculos.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">No hay vehículos registrados.</td>
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

function extraerVehiculoCreado(resData) {
  if (!resData) return null;
  if (resData.vehiculoId || resData.VehiculoId) return resData;
  if (resData.id || resData._id) return resData;
  if (resData.vehiculo) return resData.vehiculo;
  if (resData.data && (resData.data.vehiculoId || resData.data.VehiculoId)) return resData.data;
  if (resData.data && (resData.data.id || resData.data._id)) return resData.data;
  return null;
}

async function cargarVehiculos() {
  ocultarAlerta();
  const res = await getVehiculos();

  if (!res.success) {
    vehiculosCache = [];
    renderVehiculos([]);
    mostrarAlerta(res.error.message || "Error al cargar vehículos.");
    return;
  }

  const vehiculos = extraerListaVehiculos(res.data);

  if (!vehiculos.length && res.data && !Array.isArray(res.data)) {
    console.warn("Vehículos: formato de respuesta inesperado", res.data);
  }

  vehiculosCache = vehiculos;
  renderVehiculos(vehiculosCache);
}

async function manejarEnvioFormulario(event) {
  event.preventDefault();
  ocultarAlerta();

  const formData = new FormData(formVehiculo);
  const vehiculo = {
    clienteId: parseInt(formData.get("cliente").trim()) || 0,
    marca: formData.get("marca").trim(),
    modelo: formData.get("modelo").trim(),
    ano: formData.get("anio").trim() ? parseInt(formData.get("anio").trim()) : null,
    placa: formData.get("patente").trim(),
  };

  const res = await createVehiculo(vehiculo);

  if (!res.success) {
    mostrarAlerta(res.error.message || "No se pudo crear el vehículo.");
    return;
  }

  formVehiculo.reset();
  mostrarAlerta("Vehículo creado correctamente.", "ok");

  const nuevoVehiculo = extraerVehiculoCreado(res.data);
  if (nuevoVehiculo) {
    vehiculosCache = [...vehiculosCache, nuevoVehiculo];
    renderVehiculos(vehiculosCache);
    return;
  }

  await cargarVehiculos();
}

async function manejarClickTabla(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;

  const id = button.dataset.id;
  const confirmacion = window.confirm("¿Eliminar este vehículo?");
  if (!confirmacion) return;

  const res = await deleteVehiculo(id);

  if (!res.success) {
    mostrarAlerta(res.error.message || "No se pudo eliminar el vehículo.");
    return;
  }

  mostrarAlerta("Vehículo eliminado correctamente.", "ok");
  await cargarVehiculos();
}

formVehiculo.addEventListener("submit", manejarEnvioFormulario);
tablaBody.addEventListener("click", manejarClickTabla);

window.addEventListener("DOMContentLoaded", cargarVehiculos);
