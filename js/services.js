// service.js
import {
  getHealth,
  createService,
  createServiceDetail,
  getVehiculos,
  getServices,
  getClients,
  getBudgets
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const modoCreacion = document.getElementById("modoCreacion");
  const bloqueServiceManual = document.getElementById("bloqueServiceManual");
  const bloquePresupuestoAprobado = document.getElementById("bloquePresupuestoAprobado");

  const serviceForm = document.getElementById("serviceForm");

  const searchInput = document.getElementById("searchInput");
  const searchResultsBody = document.querySelector("#searchResults tbody");
  const servicesTableBody = document.querySelector("#servicesTable tbody");

  const presupuestosMensaje = document.getElementById("presupuestosMensaje");
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");

  let vehiculos = [];
  let clientesPorId = {};
  let vehiculoSeleccionadoId = null;
  let filaVehiculoSeleccionada = null;

  const presupuestosGeneradosLocal = new Set();

  // =========================
  // HEALTH
  // =========================
  async function checkHealth() {
    const indicator = document.getElementById("health-indicator");

    if (!indicator) return;

    const res = await getHealth();

    if (res.success) {
      indicator.textContent = "● Online";
      indicator.style.color = "#6EE7B7";
    } else {
      indicator.textContent = "● Offline";
      indicator.style.color = "#EF4444";
    }
  }

  // =========================
  // MODO CREACIÓN
  // =========================
  if (modoCreacion) {
    modoCreacion.addEventListener("change", () => {
      const modo = modoCreacion.value;

      if (modo === "manual") {
        bloqueServiceManual.style.display = "block";

        if (bloquePresupuestoAprobado) {
          bloquePresupuestoAprobado.style.display = "none";
        }
      }

      if (modo === "presupuesto") {
        bloqueServiceManual.style.display = "none";

        if (bloquePresupuestoAprobado) {
          bloquePresupuestoAprobado.style.display = "block";

          bloquePresupuestoAprobado.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }

        if (!vehiculoSeleccionadoId) {
          mostrarPresupuestosSinVehiculo();
          return;
        }

        cargarPresupuestosAprobadosVehiculo(vehiculoSeleccionadoId);
      }
    });
  }

  // =========================
  // HELPERS VEHÍCULOS
  // =========================
  function getClienteVehiculo(v) {
    if (v.clientName) return v.clientName;

    if (v.clientId && clientesPorId[v.clientId]) {
      return clientesPorId[v.clientId];
    }

    return `Cliente ID: ${v.clientId ?? "-"}`;
  }

  function getVehiculoPorId(vehicleId) {
    return vehiculos.find((v) => Number(v.vehicleId) === Number(vehicleId));
  }

  // =========================
  // CARGAR VEHÍCULOS + CLIENTES
  // =========================
  async function cargarVehiculos() {
    const resClientes = await getClients();

    clientesPorId = {};

    if (resClientes.success && Array.isArray(resClientes.data)) {
      resClientes.data.forEach((c) => {
        if (c.clientId) {
          clientesPorId[c.clientId] = c.fullName;
        }
      });
    }

    const resVehiculos = await getVehiculos();

    if (!resVehiculos.success || !Array.isArray(resVehiculos.data)) {
      vehiculos = [];
      renderVehiculos([]);
      return;
    }

    vehiculos = resVehiculos.data;
    renderVehiculos(vehiculos);
  }

  function renderVehiculos(lista) {
    searchResultsBody.innerHTML = "";

    if (lista.length === 0) {
      searchResultsBody.innerHTML = `
        <tr>
          <td colspan="5">No se encontraron vehículos.</td>
        </tr>
      `;
      return;
    }

    lista.forEach((v) => {
      const estaSeleccionado =
        vehiculoSeleccionadoId !== null &&
        Number(v.vehicleId) === Number(vehiculoSeleccionadoId);

      const row = document.createElement("tr");

      if (estaSeleccionado) {
        row.classList.add("selected-vehicle-row");
        filaVehiculoSeleccionada = row;
      }

      row.innerHTML = `
        <td>${getClienteVehiculo(v)}</td>
        <td>${v.brand ?? "-"} ${v.model ?? ""}</td>
        <td>${v.plate ?? "-"}</td>
        <td>${v.currentMileage ?? "-"}</td>
        <td>
          <button class="btn ${estaSeleccionado ? "btn-selected" : "btn-secondary"} btn-sm" data-id="${v.vehicleId}">
            ${estaSeleccionado ? "Seleccionado" : "Elegir"}
          </button>
        </td>
      `;

      row.querySelector("button").addEventListener("click", () => {
        seleccionarVehiculo(v, row);
      });

      searchResultsBody.appendChild(row);
    });
  }

  function seleccionarVehiculo(v, rowSeleccionada = null) {
    if (filaVehiculoSeleccionada) {
      filaVehiculoSeleccionada.classList.remove("selected-vehicle-row");

      const botonAnterior = filaVehiculoSeleccionada.querySelector("button");
      if (botonAnterior) {
        botonAnterior.textContent = "Elegir";
        botonAnterior.classList.remove("btn-selected");
        botonAnterior.classList.add("btn-secondary");
      }
    }

    if (rowSeleccionada) {
      rowSeleccionada.classList.add("selected-vehicle-row");

      const botonActual = rowSeleccionada.querySelector("button");
      if (botonActual) {
        botonActual.textContent = "Seleccionado";
        botonActual.classList.remove("btn-secondary");
        botonActual.classList.add("btn-selected");
      }

      filaVehiculoSeleccionada = rowSeleccionada;
    }

    vehiculoSeleccionadoId = v.vehicleId;

    document.getElementById("idVehiculo").value = v.vehicleId;
    document.getElementById("clienteNombre").textContent = getClienteVehiculo(v);
    document.getElementById("vehiculoNombre").textContent = `${v.brand ?? "-"} ${v.model ?? ""}`;
    document.getElementById("patente").textContent = v.plate ?? "-";
    document.getElementById("kmActual").textContent = v.currentMileage ?? "-";

    const bloqueSeleccionado = document.getElementById("vehiculoSeleccionado");
    bloqueSeleccionado.style.display = "block";

    bloqueSeleccionado.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    cargarHistorialVehiculo(v.vehicleId);

    if (modoCreacion && modoCreacion.value === "presupuesto") {
      cargarPresupuestosAprobadosVehiculo(v.vehicleId);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const texto = searchInput.value.toLowerCase().trim();
      const palabras = texto.split(/\s+/).filter(Boolean);

      const filtrados = vehiculos.filter((v) => {
        const textoVehiculo = `
          ${getClienteVehiculo(v)}
          ${v.phone ?? ""}
          ${v.plate ?? ""}
          ${v.brand ?? ""}
          ${v.model ?? ""}
          ${v.brand ?? ""} ${v.model ?? ""}
        `.toLowerCase();

        return palabras.every((palabra) =>
          textoVehiculo.includes(palabra)
        );
      });

      renderVehiculos(filtrados);
    });
  }

  // =========================
  // HISTORIAL POR VEHÍCULO
  // =========================
  async function cargarHistorialVehiculo(vehicleId) {
    const mensaje = document.getElementById("historialMensaje");

    servicesTableBody.innerHTML = "";

    if (mensaje) {
      mensaje.textContent = "Cargando historial...";
    }

    const res = await getServices();

    if (!res.success || !Array.isArray(res.data)) {
      if (mensaje) {
        mensaje.textContent = "No se pudo cargar el historial de services.";
      }

      servicesTableBody.innerHTML = `
        <tr>
          <td colspan="5">Error al cargar historial.</td>
        </tr>
      `;

      return;
    }

    const historialVehiculo = res.data.filter((service) => {
      return Number(service.vehicleId) === Number(vehicleId);
    });

    if (historialVehiculo.length === 0) {
      if (mensaje) {
        mensaje.textContent =
          "Este vehículo todavía no tiene services registrados.";
      }

      servicesTableBody.innerHTML = `
        <tr>
          <td colspan="5">Sin historial.</td>
        </tr>
      `;

      return;
    }

    if (mensaje) {
      mensaje.textContent = "Historial cargado para el vehículo seleccionado.";
    }

    historialVehiculo.forEach((service) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${formatearFecha(service.date)}</td>
        <td>${service.mileage ?? "-"}</td>
        <td>${service.serviceType ?? "-"}</td>
        <td>${service.nextMileage ?? "-"}</td>
        <td>${formatearFecha(service.nextDate)}</td>
      `;

      servicesTableBody.appendChild(row);
    });
  }

  // =========================
  // PRESUPUESTOS APROBADOS DEL VEHÍCULO
  // =========================
  function mostrarPresupuestosSinVehiculo() {
    if (!presupuestosTableBody) return;

    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">Seleccioná un vehículo para ver sus presupuestos aprobados.</td>
      </tr>
    `;

    if (presupuestosMensaje) {
      presupuestosMensaje.textContent =
        "Primero seleccioná un vehículo. Después se mostrarán sus presupuestos aprobados pendientes de service.";
    }
  }

  async function cargarPresupuestosAprobadosVehiculo(vehicleId) {
    if (!presupuestosTableBody) return;

    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">Cargando presupuestos aprobados del vehículo...</td>
      </tr>
    `;

    if (presupuestosMensaje) {
      presupuestosMensaje.textContent =
        "Buscando presupuestos aprobados para el vehículo seleccionado...";
    }

    const resPresupuestos = await getBudgets();

    if (!resPresupuestos.success || !Array.isArray(resPresupuestos.data)) {
      presupuestosTableBody.innerHTML = `
        <tr>
          <td colspan="5">No se pudieron cargar los presupuestos.</td>
        </tr>
      `;

      if (presupuestosMensaje) {
        presupuestosMensaje.textContent =
          "No se pudieron cargar los presupuestos.";
      }

      return;
    }

    const presupuestosAprobadosVehiculo = resPresupuestos.data.filter((p) => {
      const esDelVehiculo = Number(p.vehicleId) === Number(vehicleId);

      const estaAprobado =
        String(p.status).toLowerCase() === "approved" ||
        String(p.status).toLowerCase() === "aprobado";

      const noTieneService =
        p.serviceId === null ||
        p.serviceId === undefined ||
        p.serviceId === "";

      const noFueGeneradoLocal =
        !presupuestosGeneradosLocal.has(String(p.budgetId));

      return esDelVehiculo && estaAprobado && noTieneService && noFueGeneradoLocal;
    });

    if (presupuestosAprobadosVehiculo.length === 0) {
      presupuestosTableBody.innerHTML = `
        <tr>
          <td colspan="5">
            Este vehículo no tiene presupuestos aprobados pendientes de service.
            Si el cliente ya autorizó un trabajo simple, podés cargar un service manual.
          </td>
        </tr>
      `;

      if (presupuestosMensaje) {
        presupuestosMensaje.textContent =
          "No hay presupuestos aprobados disponibles para este vehículo.";
      }

      return;
    }

    presupuestosTableBody.innerHTML = "";

    if (presupuestosMensaje) {
      presupuestosMensaje.textContent =
        "Presupuestos aprobados disponibles para generar un service.";
    }

    presupuestosAprobadosVehiculo.forEach((p) => {
      const numero = p.number ?? `#${p.budgetId}`;
      const trabajoAprobado = p.description ?? "Trabajo aprobado sin descripción.";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${numero}</td>
        <td>${formatearFecha(p.date)}</td>
        <td><span class="badge badge-aprobado">${p.status ?? "-"}</span></td>
        <td>${trabajoAprobado}</td>
        <td>
          <button class="btn btn-primary btn-sm">
            Crear service
          </button>
        </td>
      `;

      const boton = row.querySelector("button");

      boton.addEventListener("click", () => {
        crearServiceDesdePresupuesto(p);
      });

      presupuestosTableBody.appendChild(row);
    });
  }

  async function crearServiceDesdePresupuesto(presupuesto) {
    const numero = presupuesto.number ?? `#${presupuesto.budgetId}`;
    const vehiculo = getVehiculoPorId(presupuesto.vehicleId);

    let kilometraje = vehiculo ? vehiculo.currentMileage : null;

    if (!kilometraje || Number(kilometraje) <= 0) {
      const kmIngresado = prompt(
        `Ingresá el kilometraje actual para generar el service del presupuesto ${numero}:`
      );

      if (!kmIngresado) {
        mostrarAlerta("Se canceló la creación del service.", "error");
        return;
      }

      kilometraje = Number(kmIngresado);
    }

    if (!kilometraje || Number(kilometraje) <= 0) {
      mostrarAlerta("El kilometraje debe ser mayor a 0.", "error");
      return;
    }

    const trabajoAprobado = presupuesto.description ?? "";

    const serviceData = {
      date: new Date().toISOString().split("T")[0],
      mileage: Number(kilometraje),
      serviceType: "Service desde presupuesto",
      notes: `Generado desde presupuesto ${numero}.`,
      vehicleId: Number(presupuesto.vehicleId)
    };

    const res = await createService(serviceData);

    if (!res.success) {
      const mensajeError =
        res.error?.message || "No se pudo crear el service desde presupuesto.";

      mostrarAlerta(mensajeError, "error");
      mostrarMensajeFormulario(mensajeError, "error");

      return;
    }

    const serviceIdCreado = res.data?.serviceId;

    if (serviceIdCreado && trabajoAprobado) {
      const detalleData = {
        description: trabajoAprobado,
        done: true
      };

      const resDetalle = await createServiceDetail(serviceIdCreado, detalleData);

      if (!resDetalle.success) {
        const mensajeErrorDetalle =
          resDetalle.error?.message || "El service se creó, pero no se pudo guardar el detalle.";

        mostrarAlerta(mensajeErrorDetalle, "error");
        mostrarMensajeFormulario(mensajeErrorDetalle, "error");

        cargarHistorialVehiculo(presupuesto.vehicleId);
        return;
      }
    }

    presupuestosGeneradosLocal.add(String(presupuesto.budgetId));

    mostrarAlerta("Service y detalle creados desde presupuesto aprobado.", "ok");
    mostrarMensajeFormulario("Service y detalle creados desde presupuesto aprobado.", "ok");

    cargarHistorialVehiculo(presupuesto.vehicleId);
    cargarPresupuestosAprobadosVehiculo(presupuesto.vehicleId);
  }

  // =========================
  // CREAR SERVICE MANUAL
  // =========================
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const vehicleId = document.getElementById("idVehiculo").value;

    if (!vehicleId) {
      mostrarAlerta("Primero tenés que seleccionar un vehículo.", "error");
      mostrarMensajeFormulario("Primero tenés que seleccionar un vehículo.", "error");
      return;
    }

    const observaciones = document.getElementById("observaciones").value.trim();
    const detalleService = document.getElementById("detalleService").value.trim();

    if (!detalleService) {
      mostrarAlerta("Tenés que completar el detalle del trabajo realizado.", "error");
      mostrarMensajeFormulario("Tenés que completar el detalle del trabajo realizado.", "error");
      return;
    }

    const serviceData = {
      date: document.getElementById("fecha").value,
      mileage: Number(document.getElementById("kilometraje").value),
      serviceType: document.getElementById("tipoService").value,
      notes: observaciones,
      vehicleId: Number(vehicleId)
    };

    const res = await createService(serviceData);

    if (!res.success) {
      const mensajeError =
        res.error?.message || "No se pudo crear el service.";

      mostrarAlerta(mensajeError, "error");
      mostrarMensajeFormulario(mensajeError, "error");

      return;
    }

    const serviceIdCreado = res.data?.serviceId;

    if (serviceIdCreado) {
      const detalleData = {
        description: detalleService,
        done: true
      };

      const resDetalle = await createServiceDetail(serviceIdCreado, detalleData);

      if (!resDetalle.success) {
        const mensajeErrorDetalle =
          resDetalle.error?.message || "El service se creó, pero no se pudo guardar el detalle.";

        mostrarAlerta(mensajeErrorDetalle, "error");
        mostrarMensajeFormulario(mensajeErrorDetalle, "error");

        cargarHistorialVehiculo(vehicleId);
        return;
      }
    }

    mostrarAlerta("Service y detalle creados correctamente.", "ok");
    mostrarMensajeFormulario("Service y detalle creados correctamente.", "ok");

    serviceForm.reset();

    document.getElementById("idVehiculo").value = vehicleId;

    cargarHistorialVehiculo(vehicleId);
  });

  // =========================
  // HELPERS GENERALES
  // =========================
  function formatearFecha(fecha) {
    if (!fecha) return "-";

    const date = new Date(fecha);

    if (isNaN(date.getTime())) return fecha;

    return date.toLocaleDateString("es-AR");
  }

  function mostrarAlerta(mensaje, tipo) {
    const alertBox = document.getElementById("alert-box");

    if (!alertBox) {
      alert(mensaje);
      return;
    }

    alertBox.textContent = mensaje;

    alertBox.className =
      `alert show alert-${tipo === "ok" ? "ok" : "error"}`;

    setTimeout(() => {
      alertBox.className = "alert";
      alertBox.textContent = "";
    }, 3000);
  }

  function mostrarMensajeFormulario(mensaje, tipo) {
    const formMensaje = document.getElementById("serviceFormMensaje");

    if (!formMensaje) return;

    formMensaje.textContent = mensaje;

    formMensaje.className =
      `alert show alert-${tipo === "ok" ? "ok" : "error"}`;

    formMensaje.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => {
      formMensaje.className = "alert";
      formMensaje.textContent = "";
    }, 4000);
  }

  // =========================
  // INIT
  // =========================
  checkHealth();
  cargarVehiculos();

  servicesTableBody.innerHTML = `
    <tr>
      <td colspan="5">Seleccioná un vehículo para ver su historial.</td>
    </tr>
  `;

  if (presupuestosTableBody) {
    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">Seleccioná un vehículo para ver sus presupuestos aprobados.</td>
      </tr>
    `;
  }
});