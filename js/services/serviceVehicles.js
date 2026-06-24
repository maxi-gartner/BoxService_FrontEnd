// serviceVehicles.js — carga, búsqueda y selección de vehículos

import { getClients, getVehiculos } from "../api.js";
import { state } from "./serviceState.js";
import { cargarHistorialVehiculo } from "./serviceHistory.js";
import { cargarPresupuestosAprobadosVehiculo } from "./serviceBudgets.js";

export async function cargarVehiculos() {
  const resClientes = await getClients();

  state.clientesPorId = {};
  state.telefonosClientesPorId = {};

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

  const resVehiculos = await getVehiculos();

  if (!resVehiculos.success || !Array.isArray(resVehiculos.data)) {
    state.vehiculos = [];
    renderVehiculos([]);
    return;
  }

  state.vehiculos = resVehiculos.data;
  renderVehiculos(state.vehiculos);
}

export function configurarBuscador() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const texto = searchInput.value.toLowerCase().trim();
    const palabras = texto.split(/\s+/).filter(Boolean);

    const filtrados = state.vehiculos.filter((v) => {
      const textoVehiculo = `
        ${getClienteVehiculo(v)}
        ${getTelefonoClienteVehiculo(v)}
        ${v.plate ?? ""}
        ${v.brand ?? ""}
        ${v.model ?? ""}
        ${v.brand ?? ""} ${v.model ?? ""}
      `.toLowerCase();

      const textoVehiculoNumerico = limpiarNumero(textoVehiculo);

      return palabras.every((palabra) => {
        const palabraNormal = palabra.toLowerCase();
        const palabraNumerica = limpiarNumero(palabra);

        return (
          textoVehiculo.includes(palabraNormal) ||
          (palabraNumerica && textoVehiculoNumerico.includes(palabraNumerica))
        );
      });
    });

    renderVehiculos(filtrados);
  });
}

export function renderVehiculos(lista) {
  const searchResultsBody = document.querySelector("#searchResults tbody");
  if (!searchResultsBody) return;

  searchResultsBody.innerHTML = "";

  if (lista.length === 0) {
    searchResultsBody.innerHTML = `
      <tr>
        <td colspan="5">No se encontraron vehículos.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((v) => {
    const estaSeleccionado =
      state.vehiculoSeleccionadoId !== null &&
      Number(v.vehicleId) === Number(state.vehiculoSeleccionadoId);

    const row = document.createElement("tr");

    if (estaSeleccionado) {
      row.classList.add("selected-vehicle-row");
      state.filaVehiculoSeleccionada = row;
    }

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

    row.querySelector("button").addEventListener("click", () => {
      seleccionarVehiculo(v, row);
    });

    searchResultsBody.appendChild(row);
  });
}

export function seleccionarVehiculo(v, rowSeleccionada = null) {
  if (state.filaVehiculoSeleccionada) {
    state.filaVehiculoSeleccionada.classList.remove("selected-vehicle-row");

    const botonAnterior = state.filaVehiculoSeleccionada.querySelector("button");

    if (botonAnterior) {
      botonAnterior.textContent = "Elegir";
      botonAnterior.classList.remove("btn-selected");
      botonAnterior.classList.add("btn-secondary");
    }
  }

  if (rowSeleccionada) {
    rowSeleccionada.classList.add("selected-vehicle-row");

    const botonActual = rowSeleccionada.querySelector("button");

    if (botonActual) {
      botonActual.textContent = "Seleccionado";
      botonActual.classList.remove("btn-secondary");
      botonActual.classList.add("btn-selected");
    }

    state.filaVehiculoSeleccionada = rowSeleccionada;
  }

  state.vehiculoSeleccionadoId = v.vehicleId;

  document.getElementById("idVehiculo").value = v.vehicleId;
  document.getElementById("clienteNombre").textContent = getClienteVehiculo(v);
  document.getElementById("vehiculoNombre").textContent = `${v.brand ?? "-"} ${v.model ?? ""}`;
  document.getElementById("patente").textContent = v.plate ?? "-";
  document.getElementById("kmActual").textContent = v.currentMileage ?? "-";

  const bloqueSeleccionado = document.getElementById("vehiculoSeleccionado");

  if (bloqueSeleccionado) {
    bloqueSeleccionado.style.display = "block";

    bloqueSeleccionado.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  cargarHistorialVehiculo(v.vehicleId);

  const modoCreacion = document.getElementById("modoCreacion");

  if (modoCreacion && modoCreacion.value === "presupuesto") {
    cargarPresupuestosAprobadosVehiculo(v.vehicleId);
  }
}

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

export function getTelefonoCliente(c) {
  return (
    c.phone ||
    c.telefono ||
    ""
  );
}

export function getClienteVehiculo(v) {
  if (v.clientName) return v.clientName;
  if (v.clienteNombre) return v.clienteNombre;
  if (v.ownerName) return v.ownerName;

  const clientId = v.clientId;

  if (clientId !== null && clientId !== undefined) {
    const nombreCliente = state.clientesPorId[String(clientId)];

    if (nombreCliente) {
      return nombreCliente;
    }

    return `Cliente ID: ${clientId}`;
  }

  return "Cliente no identificado";
}

export function getTelefonoClienteVehiculo(v) {
  const clientId = v.clientId;

  if (clientId !== null && clientId !== undefined) {
    const telefonoCliente = state.telefonosClientesPorId[String(clientId)];

    if (telefonoCliente) {
      return telefonoCliente;
    }
  }

  return "";
}

function limpiarNumero(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}