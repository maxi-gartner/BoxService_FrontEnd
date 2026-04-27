const clientesTbody = document.querySelector("#clientes-tbody");
const vehiculosTbody = document.querySelector("#vehiculos-tbody");
const vehiculosSubtitle = document.querySelector("#vehiculos-subtitle");
const clienteForm = document.querySelector("#cliente-form");
const formFeedback = document.querySelector("#form-feedback");
const refreshButton = document.querySelector("#refresh-clientes");

async function cargarClientes() {
  try {
    const clientes = await api.get("/api/clientes");

    if (!clientes.length) {
      clientesTbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">No hay clientes cargados.</td>
        </tr>
      `;
      return;
    }

    clientesTbody.innerHTML = clientes
      .map(
        (cliente) => `
          <tr>
            <td>${cliente.id_cliente}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.email}</td>
            <td>
              <button class="button-secondary table-action" data-cliente-id="${cliente.id_cliente}" data-cliente-nombre="${cliente.nombre}">
                Ver vehiculos
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    clientesTbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">${error.message}</td>
      </tr>
    `;
  }
}

async function cargarVehiculos(clienteId, clienteNombre) {
  vehiculosSubtitle.textContent = `Vehiculos asociados a ${clienteNombre}`;

  try {
    const vehiculos = await api.get(`/api/clientes/${clienteId}/vehiculos`);

    if (!vehiculos.length) {
      vehiculosTbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">Este cliente no tiene vehiculos asociados todavia.</td>
        </tr>
      `;
      return;
    }

    vehiculosTbody.innerHTML = vehiculos
      .map(
        (vehiculo) => `
          <tr>
            <td>${vehiculo.id_vehiculo}</td>
            <td>${vehiculo.patente}</td>
            <td>${vehiculo.marca}</td>
            <td>${vehiculo.modelo}</td>
            <td>${vehiculo.anio}</td>
            <td>${vehiculo.kilometraje_actual}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    vehiculosTbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">${error.message}</td>
      </tr>
    `;
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
    const cliente = await api.post("/api/clientes", payload);
    formFeedback.textContent = `Cliente creado con ID ${cliente.id_cliente}`;
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

cargarClientes();
