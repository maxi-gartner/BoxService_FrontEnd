// serviceUI.js — funciones visuales y helpers generales

// Importa getHealth desde api.js.
// getHealth llama al backend con GET /health.
import { getHealth } from "../api.js";

// Revisa si el backend está online.
export async function checkHealth() {
  // Busca en el HTML el elemento donde se muestra Online/Offline.
  const indicator = document.getElementById("health-indicator");

  // Si no existe ese elemento en la página, no hace nada.
  if (!indicator) return;

  // Llama al backend: GET /health.
  const res = await getHealth();

  // Si el backend respondió bien, muestra Online.
  if (res.success) {
    indicator.textContent = "● Online";
    indicator.style.color = "#6EE7B7";
  } else {
    // Si falló la conexión, muestra Offline.
    indicator.textContent = "● Offline";
    indicator.style.color = "#EF4444";
  }
}

// Inicializa los mensajes de las tablas cuando todavía no se eligió vehículo.
export function inicializarMensajes() {
  // Busca el body de la tabla de historial de services.
  const servicesTableBody = document.querySelector("#servicesTable tbody");

  // Busca el body de la tabla de presupuestos aprobados.
  const presupuestosTableBody = document.querySelector("#presupuestosAprobadosTable tbody");

  // Mensaje inicial para historial.
  if (servicesTableBody) {
    servicesTableBody.innerHTML = `
      <tr>
        <td colspan="5">Seleccioná un vehículo para ver su historial.</td>
      </tr>
    `;
  }

  // Mensaje inicial para presupuestos.
  if (presupuestosTableBody) {
    presupuestosTableBody.innerHTML = `
      <tr>
        <td colspan="5">Seleccioná un vehículo para ver sus presupuestos aprobados.</td>
      </tr>
    `;
  }
}

// Formatea fechas para mostrarlas en formato argentino.
export function formatearFecha(fecha) {
  // Si no hay fecha, devuelve guion.
  if (!fecha) return "-";

  // Convierte el valor recibido a fecha JS.
  const date = new Date(fecha);

  // Si no se pudo convertir, devuelve el valor original.
  if (isNaN(date.getTime())) return fecha;

  // Devuelve la fecha como día/mes/año.
  return date.toLocaleDateString("es-AR");
}

// Muestra una alerta general arriba de la pantalla.
export function mostrarAlerta(mensaje, tipo) {
  // Busca el div de alertas en el HTML.
  const alertBox = document.getElementById("alert-box");

  // Si no existe, usa alert normal del navegador.
  if (!alertBox) {
    alert(mensaje);
    return;
  }

  // Pone el texto del mensaje.
  alertBox.textContent = mensaje;

  // Cambia la clase CSS según sea ok o error.
  alertBox.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;

  // Después de 3 segundos limpia la alerta.
  setTimeout(() => {
    alertBox.className = "alert";
    alertBox.textContent = "";
  }, 3000);
}

// Muestra mensajes específicos debajo del formulario de service.
export function mostrarMensajeFormulario(mensaje, tipo) {
  // Busca el contenedor del mensaje del formulario.
  const formMensaje = document.getElementById("serviceFormMensaje");

  // Si no existe, no hace nada.
  if (!formMensaje) return;

  // Pone el texto.
  formMensaje.textContent = mensaje;

  // Aplica estilo de éxito o error.
  formMensaje.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;

  // Lleva la pantalla hasta el mensaje.
  formMensaje.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  // Después de 4 segundos limpia el mensaje.
  setTimeout(() => {
    formMensaje.className = "alert";
    formMensaje.textContent = "";
  }, 4000);
}

// Muestra mensajes en el bloque de presupuestos aprobados.
export function mostrarMensajePresupuestos(mensaje, tipo = "info") {
  // Busca el mensaje de presupuestos en el HTML.
  const presupuestosMensaje = document.getElementById("presupuestosMensaje");

  // Si no existe, no hace nada.
  if (!presupuestosMensaje) return;

  // Pone el texto.
  presupuestosMensaje.textContent = mensaje;

  // Si es mensaje de éxito.
  if (tipo === "ok") {
    presupuestosMensaje.className = "alert show alert-ok";
    return;
  }

  // Si es mensaje de error.
  if (tipo === "error") {
    presupuestosMensaje.className = "alert show alert-error";
    return;
  }

  // Si es info normal, limpia clases especiales.
  presupuestosMensaje.className = "";
}