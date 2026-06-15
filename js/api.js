// =====================================================
// BoxService — api.js
// Archivo central de comunicación con el backend.
// TODOS los fetch pasan por acá. NO duplicar lógica de fetch en otros archivos.
// =====================================================

const API_URL = "http://localhost:5001";

// ── Función base ───────────────────────────────────────
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);

    let json;

    try {
      json = await res.json();
    } catch {
      return {
        success: false,
        data: null,
        error: {
          code: res.status,
          message: "La respuesta del servidor no es JSON válido"
        }
      };
    }

    return json;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 0,
        message: "No se pudo conectar con el servidor"
      }
    };
  }
}

// ── Health ─────────────────────────────────────────────
export const getHealth = () =>
  request("GET", "/health");

// ── Clientes ───────────────────────────────────────────
// OJO: ahora esta ruta está dando 404.
// Cuando el backend de clientes exista o te digan la ruta real,
// cambiás solamente acá.
export const getClientes = () =>
  request("GET", "/api/clientes");

export const getClienteById = (id) =>
  request("GET", `/api/clientes/${id}`);

export const getVehiculosCliente = (id) =>
  request("GET", `/api/clientes/${id}/vehiculos`);

export const crearCliente = (data) =>
  request("POST", "/api/clientes", data);

// ── Vehículos ──────────────────────────────────────────
export const getVehiculos = () =>
  request("GET", "/api/vehiculos");

export const getVehiculoById = (id) =>
  request("GET", `/api/vehiculos/${id}`);

export const buscarVehiculoPorPatente = (pat) =>
  request("GET", `/api/vehiculos/buscar?patente=${pat}`);

export const getHistorialVehiculo = (id) =>
  request("GET", `/api/vehiculos/${id}/historial`);

export const crearVehiculo = (data) =>
  request("POST", "/api/vehiculos", data);

// ── Services ───────────────────────────────────────────
// ESTA es la que vamos a usar para cargar el historial.
export const getServices = () =>
  request("GET", "/api/services");

export const getServiceById = (id) =>
  request("GET", `/api/services/${id}`);

export const crearService = (data) =>
  request("POST", "/api/services", data);

export const crearDetalleService = (idService, data) =>
  request("POST", `/api/services/${idService}/detalles`, data);

// ── Presupuestos ───────────────────────────────────────
export const getPresupuestos = () =>
  request("GET", "/api/presupuestos");

export const getPresupuestoById = (id) =>
  request("GET", `/api/presupuestos/${id}`);

export const crearPresupuesto = (data) =>
  request("POST", "/api/presupuestos", data);

export const cambiarEstadoPresp = (id, estado) =>
  request("PUT", `/api/presupuestos/${id}/estado`, { estado });

export const aprobarPresupuesto = (id) =>
  request("POST", `/api/presupuestos/${id}/aprobar`);

// ── Facturas ───────────────────────────────────────────
export const getFacturas = () =>
  request("GET", "/api/facturas");

export const getFacturaById = (id) =>
  request("GET", `/api/facturas/${id}`);

export const crearFactura = (data) =>
  request("POST", "/api/facturas", data);

export const cambiarEstadoFactura = (id, estado) =>
  request("PUT", `/api/facturas/${id}/estado`, { estado });