// api.js — todas las llamadas al backend pasan por acá
// NO duplicar fetch en otros archivos.

const API_URL = "http://localhost:5001";

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
          message: "La respuesta del servidor no es JSON válido",
        },
      };
    }

    return json;
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        code: 0,
        message: err.message || "No se pudo conectar con el servidor",
      },
    };
  }
}

// ── Health ──────────────────────────────────────────
export const getHealth = () => request("GET", "/health");

// ── Clients / Clientes ──────────────────────────────
export const getClients = () => request("GET", "/api/clients");
export const getClientById = (id) => request("GET", `/api/clients/${id}`);
export const getClientVehicles = (id) =>
  request("GET", `/api/clients/${id}/vehicles`);
export const createClient = (data) => request("POST", "/api/clients", data);

// Alias en español, por si alguna página los usa
export const getClientes = getClients;
export const getClienteById = getClientById;
export const getVehiculosCliente = getClientVehicles;
export const crearCliente = createClient;

// ── Vehicles / Vehículos ─────────────────────────────
export const getVehiculos = () => request("GET", "/api/vehiculos");
export const getVehiculoById = (id) => request("GET", `/api/vehiculos/${id}`);
export const searchVehiculoByPlate = (plate) =>
  request("GET", `/api/vehiculos/buscar?plate=${plate}`);
export const getVehiculoHistory = (id) =>
  request("GET", `/api/vehiculos/${id}/historial`);
export const createVehiculo = (data) => request("POST", "/api/vehiculos", data);

// Alias en español
export const buscarVehiculoPorPatente = searchVehiculoByPlate;
export const getHistorialVehiculo = getVehiculoHistory;
export const crearVehiculo = createVehiculo;

// ── Services / Servicios ─────────────────────────────
export const getServices = () => request("GET", "/api/services");
export const getServiceById = (id) => request("GET", `/api/services/${id}`);
export const createService = (data) => request("POST", "/api/services", data);

// Alias en español
export const crearService = createService;

export const crearDetalleService = (idService, data) =>
  request("POST", `/api/services/${idService}/detalles`, data);

// ── Budgets / Presupuestos ───────────────────────────
export const getBudgets = () => request("GET", "/api/budgets");
export const getBudgetById = (id) => request("GET", `/api/budgets/${id}`);
export const createBudget = (data) => request("POST", "/api/budgets", data);
export const updateBudgetStatus = (id, status) =>
  request("PUT", `/api/budgets/${id}/status`, { status });
export const approveBudget = (id) =>
  request("POST", `/api/budgets/${id}/approve`);

// Alias en español
export const getPresupuestos = getBudgets;
export const getPresupuestoById = getBudgetById;
export const crearPresupuesto = createBudget;
export const cambiarEstadoPresp = updateBudgetStatus;
export const aprobarPresupuesto = approveBudget;

// ── Invoices / Facturas ──────────────────────────────
export const getInvoices = () => request("GET", "/api/invoices");
export const getInvoiceById = (id) => request("GET", `/api/invoices/${id}`);
export const createInvoice = (data) => request("POST", "/api/invoices", data);
export const updateInvoiceStatus = (id, status) =>
  request("PUT", `/api/invoices/${id}/status`, { status });

// Alias en español
export const getFacturas = getInvoices;
export const getFacturaById = getInvoiceById;
export const crearFactura = createInvoice;
export const cambiarEstadoFactura = updateInvoiceStatus;