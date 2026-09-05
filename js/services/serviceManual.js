// serviceManual.js — alta manual de services y detalle_service

import { createService, createServiceDetail } from "../api.js";
import { cargarHistorialVehiculo } from "./serviceHistory.js";
import { mostrarAlerta, mostrarMensajeFormulario } from "./serviceUI.js";

export function configurarFormularioManual() {
  const serviceForm = document.getElementById("serviceForm");
  if (!serviceForm) return;

  serviceForm.addEventListener("submit", crearServiceManual);
}

async function crearServiceManual(event) {
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
    mostrarMensajeFormulario(
      "Tenés que completar el detalle del trabajo realizado.",
      "error"
    );
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
    const mensajeError = res.error?.message || "No se pudo crear el service.";

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
        resDetalle.error?.message ||
        "El service se creó, pero no se pudo guardar el detalle.";

      mostrarAlerta(mensajeErrorDetalle, "error");
      mostrarMensajeFormulario(mensajeErrorDetalle, "error");

      cargarHistorialVehiculo(vehicleId);
      return;
    }
  }

  mostrarAlerta("Service y detalle creados correctamente.", "ok");
  mostrarMensajeFormulario("Service y detalle creados correctamente.", "ok");

  const serviceForm = document.getElementById("serviceForm");
  serviceForm.reset();

  document.getElementById("idVehiculo").value = vehicleId;

  cargarHistorialVehiculo(vehicleId);
}