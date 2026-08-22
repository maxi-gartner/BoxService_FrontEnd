// serviceHistory.js — historial de services por vehículo
import { getServices } from "../api.js";
import { formatearFecha } from "./serviceUI.js";

// Carga y muestra el historial de services de un vehículo específico.
export async function cargarHistorialVehiculo(vehicleId) {
  // Mensaje que aparece arriba de la tabla.
  const mensaje = document.getElementById("historialMensaje");

  // Cuerpo de la tabla donde se van a insertar las filas del historial.
  const servicesTableBody = document.querySelector("#servicesTable tbody");

  // Si no existe la tabla en el HTML, corta la función.
  if (!servicesTableBody) return;

  // Limpia la tabla antes de cargar nuevo historial.
  servicesTableBody.innerHTML = "";

  // Muestra mensaje mientras se cargan los datos.
  if (mensaje) {
    mensaje.textContent = "Cargando historial...";
  }

  // Trae todos los services desde el backend.
  const res = await getServices();

  // Si la respuesta falla, muestra error en pantalla.
  if (!res.success || !Array.isArray(res.data)) {
    if (mensaje) {
      mensaje.textContent = "No se pudo cargar el historial de services.";
    }

    // Mensaje dentro de la tabla.
    servicesTableBody.innerHTML = `
      <tr>
        <td colspan="5">Error al cargar historial.</td>
      </tr>
    `;

    return;
  }

  // Filtra todos los services y deja solo los del vehículo seleccionado.
  const historialVehiculo = res.data.filter((service) => {
    return Number(service.vehicleId) === Number(vehicleId);
  });

  // Si el vehículo no tiene historial, muestra mensaje.
  if (historialVehiculo.length === 0) {
    if (mensaje) {
      mensaje.textContent = "Este vehículo todavía no tiene services registrados.";
    }

    // Mensaje dentro de la tabla.
    servicesTableBody.innerHTML = `
      <tr>
        <td colspan="5">Sin historial.</td>
      </tr>
    `;

    return;
  }

  // Mensaje de éxito arriba de la tabla.
  if (mensaje) {
    mensaje.textContent = "Historial cargado para el vehículo seleccionado.";
  }

  // Recorre el historial filtrado y crea una fila por cada service.
  historialVehiculo.forEach((service) => {
    const row = document.createElement("tr");

    // Carga los datos del service en la fila.
    row.innerHTML = `
      <td>${formatearFecha(service.date)}</td>
      <td>${service.mileage ?? "-"}</td>
      <td>${service.serviceType ?? "-"}</td>
      <td>${service.nextMileage ?? "-"}</td>
      <td>${formatearFecha(service.nextDate)}</td>
    `;

    // Agrega la fila a la tabla.
    servicesTableBody.appendChild(row);
  });
}