// serviceState.js — estado compartido del módulo de services

// Este objeto guarda información que varios archivos necesitan usar.
// Es como una "memoria temporal" mientras la página está abierta.
export const state = {
  // Lista de vehículos que se cargaron desde el backend.
  // La usa serviceVehicles.js para renderizar y filtrar.
  vehiculos: [],

  // Diccionario para relacionar clientId con nombre del cliente.
  // Ejemplo:
  // {
  //   "1": "Juan Pérez",
  //   "2": "María Gómez"
  // }
  clientesPorId: {},

  telefonosClientesPorId: {},

  // Guarda el ID del vehículo que el usuario seleccionó.
  // Sirve para saber a qué vehículo cargarle historial, presupuestos o services.
  vehiculoSeleccionadoId: null,

  // Guarda la fila HTML seleccionada en la tabla de vehículos.
  // Sirve para marcar visualmente qué vehículo quedó seleccionado.
  filaVehiculoSeleccionada: null,

  // Guarda presupuestos que ya fueron usados para crear un service
  // durante esta sesión de pantalla.
  // Evita que aparezca de nuevo un presupuesto que ya se usó.
  presupuestosGeneradosLocal: new Set()
};