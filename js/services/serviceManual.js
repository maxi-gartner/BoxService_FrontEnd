// serviceManual.js — alta manual de services y detalle_service

import { createService, createServiceDetail } from "../api.js";
import { cargarHistorialVehiculo } from "./serviceHistory.js";
import { mostrarAlerta, mostrarMensajeFormulario } from "./serviceUI.js";

// Configura el formulario de service manual.
// Busca el form en el HTML y le agrega el evento submit.
export function configurarFormularioManual() {
  const serviceForm = document.getElementById("serviceForm");

  // Si no existe el formulario en esta pantalla, corta.
  if (!serviceForm) return;

  // Cuando se envía el formulario, ejecuta crearServiceManual.
  serviceForm.addEventListener("submit", crearServiceManual);
}


// Crea un service manual cuando se envía el formulario.
async function crearServiceManual(event) {
  // Evita que el formulario recargue la página.
  event.preventDefault();

  // Toma el ID del vehículo seleccionado desde el input oculto.
  const vehicleId = document.getElementById("idVehiculo").value;

  // Si no hay vehículo seleccionado, muestra error y corta.
  if (!vehicleId) {
    mostrarAlerta("Primero tenés que seleccionar un vehículo.", "error");
    mostrarMensajeFormulario("Primero tenés que seleccionar un vehículo.", "error");
    return;
  }

  // Toma los valores escritos en el formulario.
  const observaciones = document.getElementById("observaciones").value.trim();
  const detalleService = document.getElementById("detalleService").value.trim();

  // El detalle del trabajo es obligatorio.
  if (!detalleService) {
    mostrarAlerta("Tenés que completar el detalle del trabajo realizado.", "error");
    mostrarMensajeFormulario(
      "Tenés que completar el detalle del trabajo realizado.",
      "error"
    );
    return;
  }

  // Arma el objeto que se va a mandar al backend para crear el service.
  const serviceData = {
    date: document.getElementById("fecha").value,
    mileage: Number(document.getElementById("kilometraje").value),
    serviceType: document.getElementById("tipoService").value,
    notes: observaciones,
    vehicleId: Number(vehicleId)
  };

  // Llama al backend para crear el service.
  const res = await createService(serviceData);

  // Si el backend responde con error, muestra el mensaje y corta.
  if (!res.success) {
    const mensajeError = res.error?.message || "No se pudo crear el service.";

    mostrarAlerta(mensajeError, "error");
    mostrarMensajeFormulario(mensajeError, "error");
    return;
  }

  // Toma el ID del service recién creado. de la respuesta del backend, que es la data, dale el servide ID.
  const serviceIdCreado = res.data?.serviceId;

  // Si se creó el service, ahora crea el detalle_service.
  if (serviceIdCreado) {
    const detalleData = {
      description: detalleService,
      done: true
    };

    // Llama al backend para guardar el detalle del service.
    const resDetalle = await createServiceDetail(serviceIdCreado, detalleData);

    // Si falla el detalle, avisa.
    // El service ya quedó creado, por eso también recarga el historial.
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

  // Si salió todo bien, muestra mensaje de éxito.
  mostrarAlerta("Service y detalle creados correctamente.", "ok");
  mostrarMensajeFormulario("Service y detalle creados correctamente.", "ok");

  // Limpia el formulario.
  const serviceForm = document.getElementById("serviceForm");
  serviceForm.reset();

  // Vuelve a guardar el ID del vehículo,
  // porque reset() limpia también el input oculto.
  document.getElementById("idVehiculo").value = vehicleId;

  // Recarga el historial para que aparezca el nuevo service en la tabla.
  cargarHistorialVehiculo(vehicleId);
}