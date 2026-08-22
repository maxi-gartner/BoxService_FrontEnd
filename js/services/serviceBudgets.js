// serviceBudgets.js — presupuestos aprobados y creación de service desde presupuesto

// Funciones del api.js que llaman al backend.
import {
  assignServiceToBudget,
  createService,
  createServiceDetail,
  getBudgetById,
  getBudgets
} from "../api.js";

// Estado compartido del módulo de services.
import { state } from "./serviceState.js";

// Función para recargar el historial del vehículo.
import { cargarHistorialVehiculo } from "./serviceHistory.js";

// Funciones auxiliares de UI: fechas y mensajes.
import {
  formatearFecha,
  mostrarAlerta,
  mostrarMensajeFormulario,
  mostrarMensajePresupuestos
} from "./serviceUI.js";


// Configura el selector donde elegís si crear service manual
// o crear service desde presupuesto aprobado.
export function configurarModoCreacion() {
  const modoCreacion = document.getElementById("modoCreacion");
  const bloqueServiceManual = document.getElementById("bloqueServiceManual");
  const bloquePresupuestoAprobado = document.getElementById("bloquePresupuestoAprobado");

  // Si no existe el select en el HTML, corta.
  if (!modoCreacion) return;

  // Cuando cambia el modo, muestra u oculta bloques.
  modoCreacion.addEventListener("change", () => {
    const modo = modoCreacion.value;

    // Si elige manual, muestra el formulario manual
    // y oculta el bloque de presupuestos.
    if (modo === "manual") {
      if (bloqueServiceManual) bloqueServiceManual.style.display = "block";
      if (bloquePresupuestoAprobado) bloquePresupuestoAprobado.style.display = "none";
    }

    // Si elige presupuesto, oculta el formulario manual
    // y muestra el bloque de presupuestos aprobados.
    if (modo === "presupuesto") {
      if (bloqueServiceManual) bloqueServiceManual.style.display = "none";

      if (bloquePresupuestoAprobado) {
        bloquePresupuestoAprobado.style.display = "block";

        // Baja la pantalla hasta el bloque de presupuestos.
        bloquePresupuestoAprobado.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      // Si todavía no hay vehículo seleccionado, muestra mensaje.
      if (!state.vehiculoSeleccionadoId) {
        mostrarPresupuestosSinVehiculo();
        return;
      }

      // Si ya hay vehículo seleccionado, carga sus presupuestos aprobados.
      cargarPresupuestosAprobadosVehiculo(state.vehiculoSeleccionadoId);
    }
  });
}


// Muestra mensaje cuando el usuario quiere ver presupuestos
// pero todavía no seleccionó un vehículo.
export function mostrarPresupuestosSinVehiculo() {
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");
  if (!presupuestosTableBody) return;

  // Mensaje dentro de la tabla.
  presupuestosTableBody.innerHTML = `
    <tr>
      <td colspan="5">Seleccioná un vehículo para ver sus presupuestos aprobados.</td>
    </tr>
  `;

  // Mensaje arriba o cerca del bloque de presupuestos.
  mostrarMensajePresupuestos(
    "Primero seleccioná un vehículo. Después se mostrarán sus presupuestos aprobados pendientes de service."
  );
}


// Carga los presupuestos aprobados del vehículo seleccionado.
export async function cargarPresupuestosAprobadosVehiculo(vehicleId) {
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");
  if (!presupuestosTableBody) return;

  // Muestra estado de carga en la tabla.
  presupuestosTableBody.innerHTML = `
    <tr>
      <td colspan="5">Cargando presupuestos aprobados del vehículo...</td>
    </tr>
  `;

  mostrarMensajePresupuestos(
    "Buscando presupuestos aprobados para el vehículo seleccionado..."
  );

  // Trae todos los presupuestos desde el backend.
  const resPresupuestos = await getBudgets();

  // Si falla la respuesta, muestra error.
  if (!resPresupuestos.success || !Array.isArray(resPresupuestos.data)) {
    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">No se pudieron cargar los presupuestos.</td>
      </tr>
    `;

    mostrarMensajePresupuestos("No se pudieron cargar los presupuestos.", "error");
    return;
  }

  // Filtra presupuestos:
  // - del vehículo seleccionado
  // - aprobados
  // - sin service vinculado
  // - no generados ya en esta sesión
  const presupuestosAprobadosVehiculo = resPresupuestos.data.filter((p) => {
    const esDelVehiculo = Number(p.vehicleId) === Number(vehicleId);

    const estaAprobado =
      String(p.status).toLowerCase() === "approved" ||
      String(p.status).toLowerCase() === "aprobado";

    const noTieneService =
      p.serviceId === null ||
      p.serviceId === undefined ||
      p.serviceId === "";

// Verifica que este presupuesto no se haya usado ya en esta sesión.
// Evita que aparezca de nuevo y se genere un service duplicado.
    const noFueGeneradoLocal =
      !state.presupuestosGeneradosLocal.has(String(p.budgetId));

      // Deja pasar solo los presupuestos que cumplen todas las condiciones.
    return esDelVehiculo && estaAprobado && noTieneService && noFueGeneradoLocal;
  });

  // Si no encontró presupuestos aprobados disponibles, muestra mensaje.
  if (presupuestosAprobadosVehiculo.length === 0) {
    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          Este vehículo no tiene presupuestos aprobados pendientes de service.
          Si el cliente ya autorizó un trabajo simple, podés cargar un service manual.
        </td>
      </tr>
    `;

    mostrarMensajePresupuestos(
      "No hay presupuestos aprobados disponibles para este vehículo."
    );

    return;
  }

  // Limpia la tabla antes de cargar los presupuestos.
  presupuestosTableBody.innerHTML = "";

  mostrarMensajePresupuestos(
    "Presupuestos aprobados disponibles para generar un service."
  );

  // Crea una fila por cada presupuesto aprobado.
  presupuestosAprobadosVehiculo.forEach((p) => {
    const numero = p.number ?? `#${p.budgetId}`;
    const trabajoAprobado = getTrabajoAprobadoPresupuesto(p);

    const row = document.createElement("tr");

    // Acá se crea el botón "Crear service".
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

    // Busca el botón creado en la fila.
    const boton = row.querySelector("button");

    // Cuando se toca el botón, crea un service desde ese presupuesto.
    boton.addEventListener("click", () => {
      crearServiceDesdePresupuesto(p, boton);
    });

    // Agrega la fila a la tabla.
    presupuestosTableBody.appendChild(row);
  });
}


// Crea un service tomando los datos de un presupuesto aprobado.
export async function crearServiceDesdePresupuesto(presupuesto, boton = null) {
  const numero = presupuesto.number ?? `#${presupuesto.budgetId}`;
  const vehiculo = getVehiculoPorId(presupuesto.vehicleId);

  // Guarda el texto original del botón para poder restaurarlo.
  const textoOriginalBoton = boton ? boton.textContent : "Crear service";

  // Desactiva el botón mientras se crea el service.
  function bloquearBoton() {
    if (!boton) return;

    boton.disabled = true;
    boton.textContent = "Creando...";
  }

  // Vuelve a activar el botón si hubo error.
  function liberarBoton() {
    if (!boton) return;

    boton.disabled = false;
    boton.textContent = textoOriginalBoton;
  }

  // Muestra errores en varios lugares de la pantalla.
  async function mostrarErrorCreacion(mensaje, recargarHistorial = false) {
    mostrarAlerta(mensaje, "error");
    mostrarMensajeFormulario(mensaje, "error");
    mostrarMensajePresupuestos(mensaje, "error");

    // Si hace falta, recarga el historial.
    if (recargarHistorial) {
      await cargarHistorialVehiculo(presupuesto.vehicleId);
    }

    liberarBoton();
  }

  bloquearBoton();

  mostrarMensajePresupuestos(`Creando service desde el presupuesto ${numero}...`);

  // Intenta tomar el kilometraje actual del vehículo.
  let kilometraje = vehiculo ? vehiculo.currentMileage : null;

  // Si no hay kilometraje cargado, lo pide manualmente con prompt.
  if (!kilometraje || Number(kilometraje) <= 0) {
    const kmIngresado = prompt(
      `Ingresá el kilometraje actual para generar el service del presupuesto ${numero}:`
    );

    // Si cancela el prompt, corta la creación.
    if (!kmIngresado) {
      await mostrarErrorCreacion("Se canceló la creación del service.");
      return;
    }

    kilometraje = Number(kmIngresado);
  }

  // Valida que el kilometraje sea mayor a 0.
  if (!kilometraje || Number(kilometraje) <= 0) {
    await mostrarErrorCreacion("El kilometraje debe ser mayor a 0.");
    return;
  }

  // Trae el presupuesto completo con sus detalles.
  const resBudgetDetalle = await getBudgetById(presupuesto.budgetId);

  if (!resBudgetDetalle.success) {
    await mostrarErrorCreacion("No se pudieron cargar los detalles del presupuesto.");
    return;
  }

  // Obtiene la lista de detalles del presupuesto.
  const detallesPresupuesto = getDetallesPresupuesto(resBudgetDetalle.data);

  // Extrae las descripciones de los detalles.
  const descripcionesDetalle = detallesPresupuesto
    .map(getDescripcionDetallePresupuesto)
    .filter((descripcion) => descripcion.length > 0);

  // Si no hay detalles, usa como respaldo la descripción general del presupuesto.
  if (descripcionesDetalle.length === 0) {
    const respaldo = getTrabajoAprobadoPresupuesto(presupuesto);

    if (respaldo && respaldo !== "Trabajo aprobado sin descripción.") {
      descripcionesDetalle.push(respaldo);
    }
  }

  // Si no hay ninguna descripción, no se puede crear detalle_service.
  if (descripcionesDetalle.length === 0) {
    await mostrarErrorCreacion(
      "El presupuesto no tiene detalles para cargar en detalle_service."
    );
    return;
  }

  // Arma el objeto para crear el service.
  const serviceData = {
    date: new Date().toISOString().split("T")[0],
    mileage: Number(kilometraje),
    serviceType: "Service desde presupuesto",
    notes: `Generado desde presupuesto ${numero}.`,
    vehicleId: Number(presupuesto.vehicleId)
  };

  // Crea el service en el backend.
  const res = await createService(serviceData);

  // Si falla la creación del service, muestra error.
  if (!res.success) {
    const mensajeError =
      res.error?.message || "No se pudo crear el service desde presupuesto.";

    await mostrarErrorCreacion(mensajeError);
    return;
  }

  // Toma el ID del service recién creado.
  const serviceIdCreado = res.data?.serviceId;

  // Si no volvió el ID, no puede crear detalles ni vincular presupuesto.
  if (!serviceIdCreado) {
    await mostrarErrorCreacion(
      "El service se creó, pero no se recibió el id_service.",
      true
    );
    return;
  }

  // Crea un detalle_service por cada descripción del presupuesto.
  for (const descripcion of descripcionesDetalle) {
    const detalleData = {
      description: descripcion,
      done: true
    };

    const resDetalle = await createServiceDetail(serviceIdCreado, detalleData);

    // Si falla un detalle, avisa y recarga historial.
    if (!resDetalle.success) {
      const mensajeErrorDetalle =
        resDetalle.error?.message ||
        "El service se creó, pero no se pudo guardar uno de los detalles.";

      await mostrarErrorCreacion(mensajeErrorDetalle, true);
      return;
    }
  }

  // Vincula el presupuesto con el service creado.
  const resVinculo = await assignServiceToBudget(
    presupuesto.budgetId,
    serviceIdCreado
  );

  // Si falla el vínculo, el service ya existe pero el presupuesto no quedó asociado.
  if (!resVinculo.success) {
    const mensajeErrorVinculo =
      resVinculo.error?.message ||
      "El service se creó, pero no se pudo vincular al presupuesto.";

    await mostrarErrorCreacion(mensajeErrorVinculo, true);
    return;
  }

  // Guarda localmente que este presupuesto ya fue usado.
  // Así no vuelve a aparecer en la lista en esta sesión.
  state.presupuestosGeneradosLocal.add(String(presupuesto.budgetId));

  // Mensajes de éxito.
  mostrarAlerta("Service creado correctamente desde presupuesto aprobado.", "ok");
  mostrarMensajeFormulario(
    "Service creado correctamente desde presupuesto aprobado.",
    "ok"
  );

  mostrarMensajePresupuestos(
    "Service creado correctamente. El presupuesto ya fue vinculado al service.",
    "ok"
  );

  // Recarga historial y presupuestos para actualizar la pantalla.
  await cargarHistorialVehiculo(presupuesto.vehicleId);
  await cargarPresupuestosAprobadosVehiculo(presupuesto.vehicleId);

  mostrarMensajePresupuestos(
    "Service creado correctamente. El presupuesto ya fue vinculado al service.",
    "ok"
  );

  // Baja hasta el historial para mostrar el service recién creado.
  const historialMensaje = document.getElementById("historialMensaje");

  if (historialMensaje) {
    historialMensaje.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}


// Busca en state.vehiculos el vehículo por ID.
function getVehiculoPorId(vehicleId) {
  return state.vehiculos.find((v) => Number(v.vehicleId) === Number(vehicleId));
}


// Devuelve una descripción general del trabajo aprobado.
function getTrabajoAprobadoPresupuesto(presupuesto) {
  return (
    presupuesto.description ||
    presupuesto.notes ||
    presupuesto.observaciones ||
    "Trabajo aprobado sin descripción."
  );
}


// Obtiene los detalles del presupuesto.
// Revisa varias propiedades posibles por si el backend devuelve nombres distintos.
function getDetallesPresupuesto(data) {
  const detalles =
    data?.details ||
    data?.Details ||
    data?.budgetDetails ||
    data?.BudgetDetails ||
    data?.budget?.details ||
    data?.Budget?.Details ||
    [];

  return Array.isArray(detalles) ? detalles : [];
}


// Devuelve la descripción de un detalle de presupuesto.
function getDescripcionDetallePresupuesto(detalle) {
  return (
    detalle.description ||
    detalle.Description ||
    detalle.descripcion ||
    detalle.Descripcion ||
    ""
  ).trim();
}