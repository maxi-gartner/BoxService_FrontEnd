// serviceBudgets.js — presupuestos aprobados y creación de service desde presupuesto

import {
  assignServiceToBudget,
  createService,
  createServiceDetail,
  getBudgetById,
  getBudgets
} from "../api.js";

import { state } from "./serviceState.js";
import { cargarHistorialVehiculo } from "./serviceHistory.js";
import {
  formatearFecha,
  mostrarAlerta,
  mostrarMensajeFormulario,
  mostrarMensajePresupuestos
} from "./serviceUI.js";
import { escapeHtml } from "../utils.js";

export function configurarModoCreacion() {
  const modoCreacion = document.getElementById("modoCreacion");
  const bloqueServiceManual = document.getElementById("bloqueServiceManual");
  const bloquePresupuestoAprobado = document.getElementById("bloquePresupuestoAprobado");

  if (!modoCreacion) return;

  modoCreacion.addEventListener("change", () => {
    const modo = modoCreacion.value;

    if (modo === "manual") {
      if (bloqueServiceManual) bloqueServiceManual.style.display = "block";
      if (bloquePresupuestoAprobado) bloquePresupuestoAprobado.style.display = "none";
    }

    if (modo === "presupuesto") {
      if (bloqueServiceManual) bloqueServiceManual.style.display = "none";

      if (bloquePresupuestoAprobado) {
        bloquePresupuestoAprobado.style.display = "block";

        bloquePresupuestoAprobado.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (!state.vehiculoSeleccionadoId) {
        mostrarPresupuestosSinVehiculo();
        return;
      }

      cargarPresupuestosAprobadosVehiculo(state.vehiculoSeleccionadoId);
    }
  });
}

export function mostrarPresupuestosSinVehiculo() {
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");
  if (!presupuestosTableBody) return;

  presupuestosTableBody.innerHTML = `
    <tr>
      <td colspan="5">Seleccioná un vehículo para ver sus presupuestos aprobados.</td>
    </tr>
  `;

  mostrarMensajePresupuestos(
    "Primero seleccioná un vehículo. Después se mostrarán sus presupuestos aprobados pendientes de service."
  );
}

export async function cargarPresupuestosAprobadosVehiculo(vehicleId) {
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");
  if (!presupuestosTableBody) return;

  presupuestosTableBody.innerHTML = `
    <tr>
      <td colspan="5">Cargando presupuestos aprobados del vehículo...</td>
    </tr>
  `;

  mostrarMensajePresupuestos(
    "Buscando presupuestos aprobados para el vehículo seleccionado..."
  );

  const resPresupuestos = await getBudgets();

  if (!resPresupuestos.success || !Array.isArray(resPresupuestos.data)) {
    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">No se pudieron cargar los presupuestos.</td>
      </tr>
    `;

    mostrarMensajePresupuestos("No se pudieron cargar los presupuestos.", "error");
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
      !state.presupuestosGeneradosLocal.has(String(p.budgetId));

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

    mostrarMensajePresupuestos(
      "No hay presupuestos aprobados disponibles para este vehículo."
    );

    return;
  }

  presupuestosTableBody.innerHTML = "";

  mostrarMensajePresupuestos(
    "Presupuestos aprobados disponibles para generar un service."
  );

  presupuestosAprobadosVehiculo.forEach((p) => {
    const numero = p.number ?? `#${p.budgetId}`;
    const trabajoAprobado = getTrabajoAprobadoPresupuesto(p);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(numero)}</td>
      <td>${escapeHtml(formatearFecha(p.date))}</td>
      <td><span class="badge badge-aprobado">${escapeHtml(p.status ?? "-")}</span></td>
      <td>${escapeHtml(trabajoAprobado)}</td>
      <td>
        <button class="btn btn-primary btn-sm">
          Crear service
        </button>
      </td>
    `;

    const boton = row.querySelector("button");

    boton.addEventListener("click", () => {
      crearServiceDesdePresupuesto(p, boton);
    });

    presupuestosTableBody.appendChild(row);
  });
}

export async function crearServiceDesdePresupuesto(presupuesto, boton = null) {
  const numero = presupuesto.number ?? `#${presupuesto.budgetId}`;
  const vehiculo = getVehiculoPorId(presupuesto.vehicleId);
  const textoOriginalBoton = boton ? boton.textContent : "Crear service";

  function bloquearBoton() {
    if (!boton) return;

    boton.disabled = true;
    boton.textContent = "Creando...";
  }

  function liberarBoton() {
    if (!boton) return;

    boton.disabled = false;
    boton.textContent = textoOriginalBoton;
  }

  async function mostrarErrorCreacion(mensaje, recargarHistorial = false) {
    mostrarAlerta(mensaje, "error");
    mostrarMensajeFormulario(mensaje, "error");
    mostrarMensajePresupuestos(mensaje, "error");

    if (recargarHistorial) {
      await cargarHistorialVehiculo(presupuesto.vehicleId);
    }

    liberarBoton();
  }

  bloquearBoton();

  mostrarMensajePresupuestos(`Creando service desde el presupuesto ${numero}...`);

  let kilometraje = vehiculo ? vehiculo.currentMileage : null;

  if (!kilometraje || Number(kilometraje) <= 0) {
    const kmIngresado = prompt(
      `Ingresá el kilometraje actual para generar el service del presupuesto ${numero}:`
    );

    if (!kmIngresado) {
      await mostrarErrorCreacion("Se canceló la creación del service.");
      return;
    }

    kilometraje = Number(kmIngresado);
  }

  if (!kilometraje || Number(kilometraje) <= 0) {
    await mostrarErrorCreacion("El kilometraje debe ser mayor a 0.");
    return;
  }

  const resBudgetDetalle = await getBudgetById(presupuesto.budgetId);

  if (!resBudgetDetalle.success) {
    await mostrarErrorCreacion("No se pudieron cargar los detalles del presupuesto.");
    return;
  }

  const detallesPresupuesto = getDetallesPresupuesto(resBudgetDetalle.data);

  const descripcionesDetalle = detallesPresupuesto
    .map(getDescripcionDetallePresupuesto)
    .filter((descripcion) => descripcion.length > 0);

  if (descripcionesDetalle.length === 0) {
    const respaldo = getTrabajoAprobadoPresupuesto(presupuesto);

    if (respaldo && respaldo !== "Trabajo aprobado sin descripción.") {
      descripcionesDetalle.push(respaldo);
    }
  }

  if (descripcionesDetalle.length === 0) {
    await mostrarErrorCreacion(
      "El presupuesto no tiene detalles para cargar en detalle_service."
    );
    return;
  }

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

    await mostrarErrorCreacion(mensajeError);
    return;
  }

  const serviceIdCreado = res.data?.serviceId;

  if (!serviceIdCreado) {
    await mostrarErrorCreacion(
      "El service se creó, pero no se recibió el id_service.",
      true
    );
    return;
  }

  for (const descripcion of descripcionesDetalle) {
    const detalleData = {
      description: descripcion,
      done: true
    };

    const resDetalle = await createServiceDetail(serviceIdCreado, detalleData);

    if (!resDetalle.success) {
      const mensajeErrorDetalle =
        resDetalle.error?.message ||
        "El service se creó, pero no se pudo guardar uno de los detalles.";

      await mostrarErrorCreacion(mensajeErrorDetalle, true);
      return;
    }
  }

  const resVinculo = await assignServiceToBudget(
    presupuesto.budgetId,
    serviceIdCreado
  );

  if (!resVinculo.success) {
    const mensajeErrorVinculo =
      resVinculo.error?.message ||
      "El service se creó, pero no se pudo vincular al presupuesto.";

    await mostrarErrorCreacion(mensajeErrorVinculo, true);
    return;
  }

  state.presupuestosGeneradosLocal.add(String(presupuesto.budgetId));

  mostrarAlerta("Service creado correctamente desde presupuesto aprobado.", "ok");
  mostrarMensajeFormulario(
    "Service creado correctamente desde presupuesto aprobado.",
    "ok"
  );

  mostrarMensajePresupuestos(
    "Service creado correctamente. El presupuesto ya fue vinculado al service.",
    "ok"
  );

  await cargarHistorialVehiculo(presupuesto.vehicleId);
  await cargarPresupuestosAprobadosVehiculo(presupuesto.vehicleId);

  mostrarMensajePresupuestos(
    "Service creado correctamente. El presupuesto ya fue vinculado al service.",
    "ok"
  );

  const historialMensaje = document.getElementById("historial-msg");

  if (historialMensaje) {
    historialMensaje.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function getVehiculoPorId(vehicleId) {
  return state.vehiculos.find((v) => Number(v.vehicleId) === Number(vehicleId));
}

function getTrabajoAprobadoPresupuesto(presupuesto) {
  return (
    presupuesto.description ||
    presupuesto.notes ||
    presupuesto.observaciones ||
    "Trabajo aprobado sin descripción."
  );
}

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

function getDescripcionDetallePresupuesto(detalle) {
  return (
    detalle.description ||
    detalle.Description ||
    detalle.descripcion ||
    detalle.Descripcion ||
    ""
  ).trim();
}