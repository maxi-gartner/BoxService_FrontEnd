// serviceHistory.js — historial de services por vehículo

import { getServices } from "../api.js";
import { formatearFecha } from "./serviceUI.js";

export async function cargarHistorialVehiculo(vehicleId) {
  const mensaje = document.getElementById("historialMensaje");
  const servicesTableBody = document.querySelector("#servicesTable tbody");

  if (!servicesTableBody) return;

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
      mensaje.textContent = "Este vehículo todavía no tiene services registrados.";
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