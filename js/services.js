import {
  getHealth,
  crearService,
  crearDetalleService,
  getVehiculos,
  getServices,
  getClientes,
  getPresupuestos
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
  function getIdVehiculo(v) {
    return (
      v.VehicleId ??
      v.vehicleId ??
      v.idVehiculo ??
      v.id_vehiculo
    );
  }

  function getIdCliente(v) {
    return (
      v.ClientId ??
      v.clientId ??
      v.IdCliente ??
      v.idCliente ??
      v.id_cliente
    );
  }

  function getClienteVehiculo(v) {
    const idCliente = getIdCliente(v);

    return (
      v.ClientName ??
      v.clientName ??
      v.clienteNombre ??
      v.nombreCliente ??
      v.cliente ??
      clientesPorId[idCliente] ??
      `Cliente ID: ${idCliente ?? "-"}`
    );
  }

  function getMarcaVehiculo(v) {
    return (
      v.Brand ??
      v.brand ??
      v.marca ??
      ""
    );
  }

  function getModeloVehiculo(v) {
    return (
      v.Model ??
      v.model ??
      v.modelo ??
      ""
    );
  }

  function getPatenteVehiculo(v) {
    return (
      v.Plate ??
      v.plate ??
      v.patente ??
      "-"
    );
  }

  function getKmVehiculo(v) {
    return (
      v.CurrentMileage ??
      v.currentMileage ??
      v.kilometrajeActual ??
      v.kilometraje_actual ??
      v.Mileage ??
      v.mileage ??
      v.kilometraje ??
      null
    );
  }

  function getVehiculoPorId(idVehiculo) {
    return vehiculos.find((v) => {
      const id = getIdVehiculo(v);
      return Number(id) === Number(idVehiculo);
    });
  }

  // =========================
  // CARGAR VEHÍCULOS + CLIENTES
  // =========================
  async function cargarVehiculos() {
    const resClientes = await getClientes();

    clientesPorId = {};

    if (resClientes.success && Array.isArray(resClientes.data)) {
      resClientes.data.forEach((c) => {
        const idCliente =
          c.ClientId ??
          c.clientId ??
          c.IdCliente ??
          c.idCliente ??
          c.id_cliente;

        const nombreCliente =
          c.FullName ??
          c.fullName ??
          c.Name ??
          c.name ??
          c.Nombre ??
          c.nombre ??
          c.apellidoNombre ??
          c.clienteNombre ??
          "-";

        if (idCliente) {
          clientesPorId[idCliente] = nombreCliente;
        }
      });
    }

    const res = await getVehiculos();

    if (!res.success || !Array.isArray(res.data)) {
      vehiculos = [];
      renderVehiculos([]);
      return;
    }

    vehiculos = res.data;
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
      const idVehiculo = getIdVehiculo(v);
      const cliente = getClienteVehiculo(v);
      const marca = getMarcaVehiculo(v);
      const modelo = getModeloVehiculo(v);
      const patente = getPatenteVehiculo(v);
      const km = getKmVehiculo(v) ?? "-";

      const estaSeleccionado =
        vehiculoSeleccionadoId !== null &&
        Number(idVehiculo) === Number(vehiculoSeleccionadoId);

      const row = document.createElement("tr");

      if (estaSeleccionado) {
        row.classList.add("selected-vehicle-row");
        filaVehiculoSeleccionada = row;
      }

      row.innerHTML = `
        <td>${cliente}</td>
        <td>${marca} ${modelo}</td>
        <td>${patente}</td>
        <td>${km}</td>
        <td>
          <button class="btn ${estaSeleccionado ? "btn-selected" : "btn-secondary"} btn-sm" data-id="${idVehiculo}">
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
    const idVehiculo = getIdVehiculo(v);
    const cliente = getClienteVehiculo(v);

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

    vehiculoSeleccionadoId = idVehiculo;

    document.getElementById("idVehiculo").value = idVehiculo;
    document.getElementById("clienteNombre").textContent = cliente;

    const marca = getMarcaVehiculo(v);
    const modelo = getModeloVehiculo(v);

    document.getElementById("vehiculoNombre").textContent =
      `${marca} ${modelo}`;

    document.getElementById("patente").textContent = getPatenteVehiculo(v);

    document.getElementById("kmActual").textContent =
      getKmVehiculo(v) ?? "-";

    const bloqueSeleccionado = document.getElementById("vehiculoSeleccionado");
    bloqueSeleccionado.style.display = "block";

    bloqueSeleccionado.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    cargarHistorialVehiculo(idVehiculo);

    if (modoCreacion && modoCreacion.value === "presupuesto") {
      cargarPresupuestosAprobadosVehiculo(idVehiculo);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const texto = searchInput.value.toLowerCase().trim();
      const palabras = texto.split(/\s+/).filter(Boolean);

      const filtrados = vehiculos.filter((v) => {
        const cliente = getClienteVehiculo(v);
        const telefono = v.Phone ?? v.phone ?? v.telefono ?? "";
        const patente = getPatenteVehiculo(v);
        const marca = getMarcaVehiculo(v);
        const modelo = getModeloVehiculo(v);

        const textoVehiculo = `
          ${cliente}
          ${telefono}
          ${patente}
          ${marca}
          ${modelo}
          ${marca} ${modelo}
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
  async function cargarHistorialVehiculo(idVehiculo) {
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
      const serviceVehicleId =
        service.VehicleId ??
        service.vehicleId ??
        service.idVehiculo ??
        service.id_vehiculo;

      return Number(serviceVehicleId) === Number(idVehiculo);
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
        <td>${formatearFecha(service.Date ?? service.date ?? service.fecha)}</td>
        <td>${service.Mileage ?? service.mileage ?? service.kilometraje ?? "-"}</td>
        <td>${service.ServiceType ?? service.serviceType ?? service.tipoService ?? service.tipo_service ?? "-"}</td>
        <td>${service.NextMileage ?? service.nextMileage ?? service.proximoKm ?? service.proximo_km ?? "-"}</td>
        <td>${formatearFecha(service.NextDate ?? service.nextDate ?? service.proximaFecha ?? service.proxima_fecha)}</td>
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

  async function cargarPresupuestosAprobadosVehiculo(idVehiculoSeleccionado) {
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

    const resPresupuestos = await getPresupuestos();

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
      const idVehiculoPresupuesto =
        p.VehicleId ??
        p.vehicleId ??
        p.IdVehiculo ??
        p.idVehiculo ??
        p.id_vehiculo;

      const estado = String(
        p.Status ??
        p.status ??
        p.Estado ??
        p.estado ??
        ""
      ).toLowerCase();

      const idServicePresupuesto =
        p.ServiceId ??
        p.serviceId ??
        p.IdService ??
        p.idService ??
        p.id_service;

      const idPresupuesto =
        p.BudgetId ??
        p.budgetId ??
        p.IdPresupuesto ??
        p.idPresupuesto ??
        p.id_presupuesto;

      const esDelVehiculo =
        Number(idVehiculoPresupuesto) === Number(idVehiculoSeleccionado);

      const estaAprobado =
        estado === "approved" ||
        estado === "aprobado";

      const noTieneService =
        idServicePresupuesto === null ||
        idServicePresupuesto === undefined ||
        idServicePresupuesto === "";

      const noFueGeneradoLocal =
        !presupuestosGeneradosLocal.has(String(idPresupuesto));

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
      const idPresupuesto =
        p.BudgetId ??
        p.budgetId ??
        p.IdPresupuesto ??
        p.idPresupuesto ??
        p.id_presupuesto;

      const numero =
        p.Number ??
        p.number ??
        p.Numero ??
        p.numero ??
        `#${idPresupuesto}`;

      const fecha =
        p.Date ??
        p.date ??
        p.Fecha ??
        p.fecha;

      const estado =
        p.Status ??
        p.status ??
        p.Estado ??
        p.estado ??
        "-";

      const trabajoAprobado =
        p.Description ??
        p.description ??
        p.Descripcion ??
        p.descripcion ??
        p.Notes ??
        p.notes ??
        p.Observaciones ??
        p.observaciones ??
        "Trabajo aprobado sin descripción.";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${numero}</td>
        <td>${formatearFecha(fecha)}</td>
        <td><span class="badge badge-aprobado">${estado}</span></td>
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
    const idPresupuesto =
      presupuesto.BudgetId ??
      presupuesto.budgetId ??
      presupuesto.IdPresupuesto ??
      presupuesto.idPresupuesto ??
      presupuesto.id_presupuesto;

    const numero =
      presupuesto.Number ??
      presupuesto.number ??
      presupuesto.Numero ??
      presupuesto.numero ??
      `#${idPresupuesto}`;

    const idVehiculo =
      presupuesto.VehicleId ??
      presupuesto.vehicleId ??
      presupuesto.IdVehiculo ??
      presupuesto.idVehiculo ??
      presupuesto.id_vehiculo;

    const vehiculo = getVehiculoPorId(idVehiculo);

    let kilometraje = vehiculo ? getKmVehiculo(vehiculo) : null;

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

    const trabajoAprobado =
      presupuesto.Description ??
      presupuesto.description ??
      presupuesto.Descripcion ??
      presupuesto.descripcion ??
      presupuesto.Notes ??
      presupuesto.notes ??
      presupuesto.Observaciones ??
      presupuesto.observaciones ??
      "";

    const serviceData = {
      Date: new Date().toISOString().split("T")[0],
      Mileage: Number(kilometraje),
      ServiceType: "Service desde presupuesto",
      Notes: `Generado desde presupuesto ${numero}.`,
      VehicleId: Number(idVehiculo)
    };

    const res = await crearService(serviceData);

    if (!res.success) {
      const mensajeError =
        res.error?.message || "No se pudo crear el service desde presupuesto.";

      mostrarAlerta(mensajeError, "error");
      mostrarMensajeFormulario(mensajeError, "error");

      return;
    }

    const idServiceCreado = getIdServiceCreado(res);

    if (idServiceCreado && trabajoAprobado) {
      const detalleData = {
        Description: trabajoAprobado,
        Done: true
      };

      const resDetalle = await crearDetalleService(idServiceCreado, detalleData);

      if (!resDetalle.success) {
        const mensajeErrorDetalle =
          resDetalle.error?.message || "El service se creó, pero no se pudo guardar el detalle.";

        mostrarAlerta(mensajeErrorDetalle, "error");
        mostrarMensajeFormulario(mensajeErrorDetalle, "error");

        cargarHistorialVehiculo(idVehiculo);
        return;
      }
    }

    presupuestosGeneradosLocal.add(String(idPresupuesto));

    mostrarAlerta("Service y detalle creados desde presupuesto aprobado.", "ok");
    mostrarMensajeFormulario("Service y detalle creados desde presupuesto aprobado.", "ok");

    cargarHistorialVehiculo(idVehiculo);
    cargarPresupuestosAprobadosVehiculo(idVehiculo);
  }

  // =========================
  // HELPERS SERVICES
  // =========================
  function getIdServiceCreado(res) {
    const data = res.data ?? res.Data ?? res;

    return (
      data.ServiceId ??
      data.serviceId ??
      data.IdService ??
      data.idService ??
      data.id_service
    );
  }

  // =========================
  // CREAR SERVICE MANUAL
  // =========================
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idVehiculo = document.getElementById("idVehiculo").value;

    if (!idVehiculo) {
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
      Date: document.getElementById("fecha").value,
      Mileage: Number(document.getElementById("kilometraje").value),
      ServiceType: document.getElementById("tipoService").value,
      Notes: observaciones,
      VehicleId: Number(idVehiculo)
    };

    const res = await crearService(serviceData);

    if (!res.success) {
      const mensajeError =
        res.error?.message || "No se pudo crear el service.";

      mostrarAlerta(mensajeError, "error");
      mostrarMensajeFormulario(mensajeError, "error");

      return;
    }

    const idServiceCreado = getIdServiceCreado(res);

    if (idServiceCreado) {
      const detalleData = {
        Description: detalleService,
        Done: true
      };

      const resDetalle = await crearDetalleService(idServiceCreado, detalleData);

      if (!resDetalle.success) {
        const mensajeErrorDetalle =
          resDetalle.error?.message || "El service se creó, pero no se pudo guardar el detalle.";

        mostrarAlerta(mensajeErrorDetalle, "error");
        mostrarMensajeFormulario(mensajeErrorDetalle, "error");

        cargarHistorialVehiculo(idVehiculo);
        return;
      }
    }

    mostrarAlerta("Service y detalle creados correctamente.", "ok");
    mostrarMensajeFormulario("Service y detalle creados correctamente.", "ok");

    serviceForm.reset();

    document.getElementById("idVehiculo").value = idVehiculo;

    cargarHistorialVehiculo(idVehiculo);
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