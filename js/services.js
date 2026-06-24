// service.js — archivo principal del módulo de services
// La lógica está separada en /services para que sea más fácil de leer y mantener.

import { checkHealth, inicializarMensajes } from "./services/serviceUI.js";
import { cargarVehiculos, configurarBuscador } from "./services/serviceVehicles.js";
import { configurarModoCreacion } from "./services/serviceBudgets.js";
import { configurarFormularioManual } from "./services/serviceManual.js";

document.addEventListener("DOMContentLoaded", () => {
  checkHealth();

  configurarBuscador();
  configurarModoCreacion();
  configurarFormularioManual();

  cargarVehiculos();
  inicializarMensajes();
});