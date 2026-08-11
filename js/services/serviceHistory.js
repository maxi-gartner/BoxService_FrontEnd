// serviceHistory.js — historial de services por vehículo

import { getServices } from "../api.js";
import { formatearFecha } from "./serviceUI.js";
import { escapeHtml } from "../utils.js";

export async function cargarHistorialVehiculo(vehicleId) {
  const mensaje = document.getElementById("historial-msg");
  const wrapper = document.getElementById("historial-table-wrapper");
  const servicesTableBody = document.getElementById("historial-body");

  if (!servicesTableBody) return;

  if (wrapper) wrapper.style.display = "block";

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
        <td colspan="6">Error al cargar historial.</td>
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
        <td colspan="6">Sin historial.</td>
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
      <td>${escapeHtml(formatearFecha(service.date))}</td>
      <td>${escapeHtml(service.mileage ?? "-")}</td>
      <td>${escapeHtml(service.serviceType ?? "-")}</td>
      <td>${escapeHtml(service.notes ?? "-")}</td>
      <td>${escapeHtml(service.nextMileage ?? "-")}</td>
      <td>${escapeHtml(formatearFecha(service.nextDate))}</td>
    `;

    servicesTableBody.appendChild(row);
  });
}
