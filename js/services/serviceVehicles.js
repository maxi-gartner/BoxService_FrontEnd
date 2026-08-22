// serviceVehicles.js — carga, búsqueda y selección de vehículos

import { getClients, getVehiculos } from "../api.js";
import { state } from "./serviceState.js";
import { cargarHistorialVehiculo } from "./serviceHistory.js";
import { cargarPresupuestosAprobadosVehiculo } from "./serviceBudgets.js";


// Carga clientes y vehículos desde el backend.
// Guarda los datos en state y después muestra los vehículos en la tabla.
export async function cargarVehiculos() {
  const resClientes = await getClients();

  // Limpia los diccionarios antes de volver a cargarlos.
  state.clientesPorId = {};
  state.telefonosClientesPorId = {};

  // Si la respuesta de clientes viene bien, guarda nombres y teléfonos por ID.
  if (resClientes.success && Array.isArray(resClientes.data)) {
    resClientes.data.forEach((c) => {
      const clientId = c.clientId;
      const nombreCliente = getNombreCliente(c);
      const telefonoCliente = getTelefonoCliente(c);

      if (clientId !== null && clientId !== undefined) {
        if (nombreCliente) {
          state.clientesPorId[String(clientId)] = nombreCliente;
        }

        if (telefonoCliente) {
          state.telefonosClientesPorId[String(clientId)] = telefonoCliente;
        }
      }
    });
  }

  // Trae los vehículos desde el backend.
  const resVehiculos = await getVehiculos();

  // Si falla la respuesta, limpia la tabla.
  if (!resVehiculos.success || !Array.isArray(resVehiculos.data)) {
    state.vehiculos = [];
    renderVehiculos([]);
    return;
  }

  // Guarda los vehículos en state para que también los use el buscador.
  state.vehiculos = resVehiculos.data;

  // Dibuja la tabla con los vehículos cargados.
  renderVehiculos(state.vehiculos);
}


// Configura el buscador.
// Cada vez que el usuario escribe, filtra los vehículos guardados en state.
export function configurarBuscador() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const texto = searchInput.value.toLowerCase().trim();
    const palabras = texto.split(/\s+/).filter(Boolean);

    // Filtra buscando coincidencias por cliente, teléfono, patente, marca o modelo.
    const filtrados = state.vehiculos.filter((v) => {
      const textoVehiculo = `
        ${getClienteVehiculo(v)}
        ${getTelefonoClienteVehiculo(v)}
        ${v.plate ?? ""}
        ${v.brand ?? ""}
        ${v.model ?? ""}
        ${v.brand ?? ""} ${v.model ?? ""}
      `.toLowerCase();

      // También arma una versión solo con números para buscar teléfonos.
      const textoVehiculoNumerico = limpiarNumero(textoVehiculo);

      // Todas las palabras escritas tienen que coincidir con el vehículo.
      return palabras.every((palabra) => {
        const palabraNormal = palabra.toLowerCase();
        const palabraNumerica = limpiarNumero(palabra);

        return (
          textoVehiculo.includes(palabraNormal) ||
          (palabraNumerica && textoVehiculoNumerico.includes(palabraNumerica))
        );
      });
    });

    // Vuelve a mostrar la tabla, pero con los resultados filtrados.
    renderVehiculos(filtrados);
  });
}


// Dibuja la tabla de vehículos.
// Recibe una lista y crea una fila por cada vehículo.
export function renderVehiculos(lista) {
  const searchResultsBody = document.querySelector("#searchResults tbody");
  if (!searchResultsBody) return;

  // Limpia la tabla antes de volver a cargar filas.
  searchResultsBody.innerHTML = "";

  // Si no hay vehículos, muestra un mensaje.
  if (lista.length === 0) {
    searchResultsBody.innerHTML = `
      <tr>
        <td colspan="5">No se encontraron vehículos.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((v) => {
    // Revisa si este vehículo es el que ya estaba seleccionado.
    const estaSeleccionado =
      state.vehiculoSeleccionadoId !== null &&
      Number(v.vehicleId) === Number(state.vehiculoSeleccionadoId);

    // Crea una fila HTML para el vehículo.
    const row = document.createElement("tr");

    // Si ya estaba seleccionado, mantiene el estilo visual.
    if (estaSeleccionado) {
      row.classList.add("selected-vehicle-row");
      state.filaVehiculoSeleccionada = row;
    }

    // Carga los datos del vehículo en la fila.
    // Acá se crea el botón "Elegir" o "Seleccionado".
    row.innerHTML = `
      <td>${getClienteVehiculo(v)}</td>
      <td>${v.brand ?? "-"} ${v.model ?? ""}</td>
      <td>${v.plate ?? "-"}</td>
      <td>${v.currentMileage ?? "-"}</td>
      <td>
        <button class="btn ${estaSeleccionado ? "btn-selected" : "btn-secondary"} btn-sm" data-id="${v.vehicleId}">
          ${estaSeleccionado ? "Seleccionado" : "Elegir"}
        </button>
      </td>
    `;

    // Al tocar el botón, selecciona este vehículo.
    row.querySelector("button").addEventListener("click", () => {
      seleccionarVehiculo(v, row);
    });

    // Agrega la fila terminada a la tabla.
    searchResultsBody.appendChild(row);
  });
}


// Selecciona un vehículo de la tabla.
// Cambia estilos, guarda el ID y carga la información relacionada.
export function seleccionarVehiculo(v, rowSeleccionada = null) {
  // Si había otro vehículo seleccionado, lo desmarca.
  if (state.filaVehiculoSeleccionada) {
    state.filaVehiculoSeleccionada.classList.remove("selected-vehicle-row");

    const botonAnterior = state.filaVehiculoSeleccionada.querySelector("button");

    // El botón anterior vuelve a estado normal.
    if (botonAnterior) {
      botonAnterior.textContent = "Elegir";
      botonAnterior.classList.remove("btn-selected");
      botonAnterior.classList.add("btn-secondary");
    }
  }

  // Marca visualmente la nueva fila seleccionada.
  if (rowSeleccionada) {
    rowSeleccionada.classList.add("selected-vehicle-row");

    const botonActual = rowSeleccionada.querySelector("button");

    // El botón actual pasa a mostrar "Seleccionado".
    if (botonActual) {
      botonActual.textContent = "Seleccionado";
      botonActual.classList.remove("btn-secondary");
      botonActual.classList.add("btn-selected");
    }

    // Guarda la fila actual para poder desmarcarla después.
    state.filaVehiculoSeleccionada = rowSeleccionada;
  }

  // Guarda el ID del vehículo seleccionado.
  state.vehiculoSeleccionadoId = v.vehicleId;

  // Completa datos del vehículo en la pantalla.
  document.getElementById("idVehiculo").value = v.vehicleId;
  document.getElementById("clienteNombre").textContent = getClienteVehiculo(v);
  document.getElementById("vehiculoNombre").textContent = `${v.brand ?? "-"} ${v.model ?? ""}`;
  document.getElementById("patente").textContent = v.plate ?? "-";
  document.getElementById("kmActual").textContent = v.currentMileage ?? "-";

  const bloqueSeleccionado = document.getElementById("vehiculoSeleccionado");

  // Muestra el bloque con la información del vehículo elegido.
  if (bloqueSeleccionado) {
    bloqueSeleccionado.style.display = "block";

    bloqueSeleccionado.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // Carga el historial de services del vehículo.
  cargarHistorialVehiculo(v.vehicleId);

  const modoCreacion = document.getElementById("modoCreacion");

  // Si el usuario está creando desde presupuesto, carga los presupuestos aprobados.
  if (modoCreacion && modoCreacion.value === "presupuesto") {
    cargarPresupuestosAprobadosVehiculo(v.vehicleId);
  }
}


// Devuelve el nombre del cliente.
// Revisa varios nombres posibles porque el backend puede devolver distintas propiedades.
export function getNombreCliente(c) {
  return (
    c.nombre ||
    c.name ||
    c.fullName ||
    c.fullname ||
    c.nombreCompleto ||
    c.clienteNombre ||
    ""
  );
}


// Devuelve el teléfono del cliente.
export function getTelefonoCliente(c) {
  return (
    c.phone ||
    c.telefono ||
    ""
  );
}


// Devuelve el nombre del cliente asociado a un vehículo.
export function getClienteVehiculo(v) {
  // Primero intenta usar el nombre si ya viene dentro del vehículo.
  if (v.clientName) return v.clientName;
  if (v.clienteNombre) return v.clienteNombre;
  if (v.ownerName) return v.ownerName;

  const clientId = v.clientId;

  // Si el vehículo tiene clientId, busca el nombre en state.clientesPorId.
  if (clientId !== null && clientId !== undefined) {
    const nombreCliente = state.clientesPorId[String(clientId)];

    if (nombreCliente) {
      return nombreCliente;
    }

    return `Cliente ID: ${clientId}`;
  }

  return "Cliente no identificado";
}


// Devuelve el teléfono del cliente asociado al vehículo.
export function getTelefonoClienteVehiculo(v) {
  const clientId = v.clientId;

  // Busca el teléfono usando el clientId del vehículo.
  if (clientId !== null && clientId !== undefined) {
    const telefonoCliente = state.telefonosClientesPorId[String(clientId)];

    if (telefonoCliente) {
      return telefonoCliente;
    }
  }

  return "";
}


// Deja solo números.
// Se usa para buscar teléfonos aunque tengan espacios, guiones o paréntesis.
function limpiarNumero(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}