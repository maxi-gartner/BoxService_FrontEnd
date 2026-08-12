import { createClient, getClientVehicles, getClients } from "./api.js";
import { escapeHtml } from "./utils.js";

const clientesTbody = document.querySelector("#clientes-tbody");
const vehiculosTbody = document.querySelector("#vehiculos-tbody");
const vehiculosSubtitle = document.querySelector("#vehiculos-subtitle");
const clienteForm = document.querySelector("#cliente-form");
const formFeedback = document.querySelector("#form-feedback");
const refreshButton = document.querySelector("#refresh-clientes");

function getField(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return "";
}

function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
}

function showError(tbody, colspan, message) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-muted">${escapeHtml(message)}</td>
    </tr>
  `;
}

async function cargarClientes() {
  clientesTbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-muted">Cargando clientes...</td>
    </tr>
  `;

  try {
    const res = await getClients();
    if (!res.success) {
      throw new Error(res.error?.message || "No se pudieron cargar los clientes.");
    }

    const clientes = normalizeList(res.data, "clients");

    if (!clientes.length) {
      clientesTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-muted">No hay clientes cargados.</td>
        </tr>
      `;
      return;
    }

    clientesTbody.innerHTML = clientes
      .map(
        (cliente) => `
          <tr>
            <td>${escapeHtml(getField(cliente, "id_cliente", "clienteId", "clientId", "id", "ClientId"))}</td>
            <td>${escapeHtml(getField(cliente, "nombre", "name", "fullName", "Name"))}</td>
            <td>${escapeHtml(getField(cliente, "telefono", "phone", "Phone"))}</td>
            <td>${escapeHtml(getField(cliente, "email", "Email"))}</td>
            <td>
              <button
                class="btn btn-secondary btn-sm"
                data-cliente-id="${escapeHtml(getField(cliente, "id_cliente", "clienteId", "clientId", "id", "ClientId"))}"
                data-cliente-nombre="${escapeHtml(getField(cliente, "nombre", "name", "fullName", "Name"))}"
              >
                Ver vehiculos
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    showError(clientesTbody, 5, error.message);
  }
}

async function cargarVehiculos(clienteId, clienteNombre) {
  vehiculosSubtitle.textContent = `Vehiculos asociados a ${clienteNombre}`;
  vehiculosTbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-muted">Cargando vehiculos...</td>
    </tr>
  `;

  try {
    const res = await getClientVehicles(clienteId);
    if (!res.success) {
      throw new Error(res.error?.message || "No se pudieron cargar los vehiculos.");
    }

    const vehiculos = normalizeList(res.data, "vehicles");

    if (!vehiculos.length) {
      vehiculosTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted">Este cliente no tiene vehiculos asociados todavia.</td>
        </tr>
      `;
      return;
    }

    vehiculosTbody.innerHTML = vehiculos
      .map((vehiculo) => {
        const id = getField(vehiculo, "id_vehiculo", "vehiculoId", "vehicleId", "id");
        return `
          <tr data-vehicle-id="${escapeHtml(id)}" class="clickable-row">
            <td>${escapeHtml(id)}</td>
            <td>${escapeHtml(getField(vehiculo, "patente", "placa", "plate", "Plate"))}</td>
            <td>${escapeHtml(getField(vehiculo, "marca", "brand", "Brand"))}</td>
            <td>${escapeHtml(getField(vehiculo, "modelo", "model", "Model"))}</td>
            <td>${escapeHtml(getField(vehiculo, "anio", "ano", "year", "Year"))}</td>
            <td>${escapeHtml(getField(vehiculo, "kilometraje_actual", "kilometraje", "kilometrajeActual", "mileage"))}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    showError(vehiculosTbody, 6, error.message);
  }
}

clienteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(clienteForm);
  const payload = {
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
  };

  formFeedback.textContent = "Guardando cliente...";
  formFeedback.dataset.state = "loading";

  try {
    const res = await createClient(payload);
    if (!res.success) {
      throw new Error(res.error?.message || "No se pudo crear el cliente.");
    }

    const cliente = res.data;
    const id = getField(cliente, "id_cliente", "clienteId", "clientId", "id", "ClientId");
    formFeedback.textContent = id ? `Cliente creado con ID ${id}` : "Cliente creado correctamente.";
    formFeedback.dataset.state = "success";
    clienteForm.reset();
    await cargarClientes();
  } catch (error) {
    formFeedback.textContent = error.message;
    formFeedback.dataset.state = "error";
  }
});

refreshButton.addEventListener("click", () => {
  cargarClientes();
});

clientesTbody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cliente-id]");
  if (!button) {
    return;
  }

  cargarVehiculos(button.dataset.clienteId, button.dataset.clienteNombre);
});

vehiculosTbody.addEventListener("click", (event) => {
  const row = event.target.closest("[data-vehicle-id]");
  if (!row) return;

  window.location.href = `taller.html?id=${row.dataset.vehicleId}`;
});

cargarClientes();