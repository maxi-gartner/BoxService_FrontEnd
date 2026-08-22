// taller.js — archivo principal de la pantalla Taller (antes "services.js")
// Acá vive la ficha completa de un vehículo: buscarlo, ver su resumen
// (presupuestos, historial, facturación), presupuestarlo y cargarle un service.

import { checkHealth, inicializarMensajes } from "./services/serviceUI.js";
import { cargarVehiculos, configurarBuscador, seleccionarVehiculo } from "./services/serviceVehicles.js";
import { configurarModoCreacion } from "./services/serviceBudgets.js";
import { configurarFormularioManual } from "./services/serviceManual.js";
import { configurarNuevoPresupuestoForm } from "./services/serviceBudgetForm.js";
import { state } from "./services/serviceState.js";

// Activa una pestaña sin depender de que components.js ya haya terminado de
// inicializar sus propios listeners de tabs (pueden correr en paralelo).
function activarTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
}

// Si se entra con ?id=123 (desde Vehículos, Clientes, Presupuestos o
// Facturas), saltea la búsqueda y va directo al resumen de ese vehículo.
async function aplicarDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  if (!idParam) return;

  const vehicleId = Number(idParam);
  const vehiculo = state.vehiculos.find((v) => Number(v.vehicleId) === vehicleId);

  if (!vehiculo) return;

  seleccionarVehiculo(vehiculo);
  activarTab("resumen");
}

document.addEventListener("DOMContentLoaded", async () => {
  checkHealth();

  configurarBuscador();
  configurarModoCreacion();
  configurarFormularioManual();
  configurarNuevoPresupuestoForm();

  await cargarVehiculos();
  inicializarMensajes();

  await aplicarDeepLink();
});
