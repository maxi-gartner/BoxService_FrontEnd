// api.js — todas las llamadas al backend pasan por acá
// NO duplicar fetch en otros archivos.
// Solo Maxi agrega funciones acá.

const API_URL = "http://localhost:5001";

import { clearSession, getToken } from "./auth.js";

async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = getToken();
  if (token) options.headers.Authorization = `Bearer ${token}`;

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const responseText = await res.text();
    let json;

    if (!responseText.trim()) {
      json = {
        success: false,
        data: null,
        error: {
          code: res.status,
          message: `La API respondió sin contenido (${res.status}) para ${endpoint}.`,
        },
      };
    } else {
      try {
        json = JSON.parse(responseText);
      } catch {
        json = {
          success: false,
          data: null,
          error: {
            code: res.status,
            message: `La API devolvió una respuesta inválida (${res.status}) para ${endpoint}.`,
          },
        };
      }
    }

    if (res.status === 401 && endpoint !== "/auth/login") clearSession();

    return json; // siempre devuelve { success, data, error }
  } catch (err) {
    const isNetworkError = err instanceof TypeError && err.message.toLowerCase().includes("fetch");
    return {
      success: false,
      data: null,
      error: {
        code: 0,
        message: isNetworkError
          ? "No se pudo conectar con la API. Iniciá el backend en http://localhost:5001."
          : err.message || "No se pudo conectar con el servidor",
      },
    };
  }
}

export const login = (credentials) => request("POST", "/auth/login", credentials);

// ── Health ──────────────────────────────────────────
export const getHealth = () =>
  request("GET", "/health");

// ── Clients (Cristhian) ─────────────────────────────
export const getClients = () =>
  request("GET", "/clients");

export const getClientById = (id) =>
  request("GET", `/clients/${id}`);

export const getClientVehicles = (id) =>
  request("GET", `/clients/${id}/vehicles`);

export const createClient = (data) =>
  request("POST", "/clients", data);

// ── Vehicles (Leo) ──────────────────────────────────
export const getVehiculos = () =>
  request("GET", "/api/vehiculos");

export const getVehiculoById = (id) =>
  request("GET", `/api/vehiculos/${id}`);

// Antes era GET /api/vehiculos/buscar?plate=X (verbo en la URL).
// Ahora es un filtro sobre la misma colección: GET /api/vehiculos?plate=X.
export const searchVehiculoByPlate = (plate) =>
  request("GET", `/api/vehiculos?plate=${encodeURIComponent(plate)}`);

export const getVehiculoHistory = (id) =>
  request("GET", `/api/vehiculos/${id}/historial`);

export const createVehiculo = (data) =>
  request("POST", "/api/vehiculos", data);

// ── Services (Oscar) ────────────────────────────────
export const getServices = () =>
  request("GET", "/api/services");

export const getServiceById = (id) =>
  request("GET", `/api/services/${id}`);

export const createService = (data) =>
  request("POST", "/api/services", data);

export const createServiceDetail = (serviceId, data) =>
  request("POST", `/api/services/${serviceId}/details`, data);

export const getServiceDetails = (serviceId) =>
  request("GET", `/api/services/${serviceId}/details`);

// ── Budgets / Presupuestos (Maxi) ───────────────────
export const getBudgets = () =>
  request("GET", "/api/budgets");

// NUEVO:
// Trae un presupuesto puntual con sus detalles.
// Esto se usa en Services para copiar detalle_presupuesto a detalle_service.
export const getBudgetById = (id) =>
  request("GET", `/api/budgets/${id}`);

export const createBudget = (data) =>
  request("POST", "/api/budgets", data);

// Antes eran dos endpoints (PUT .../status y POST .../approve) con un verbo
// en la URL. Ahora es una sola transición de estado sobre el recurso.
export const updateBudgetStatus = (id, status) =>
  request("PATCH", `/api/budgets/${id}`, { status });

export const approveBudget = (id) => updateBudgetStatus(id, "approved");

// NUEVO:
// Vincula el presupuesto aprobado con el service creado.
// Actualiza presupuestos.id_service.
export const assignServiceToBudget = (budgetId, serviceId) =>
  request("PUT", `/api/budgets/${budgetId}/service`, { serviceId });

// ── Invoices / Facturas (Maxi) ──────────────────────
export const getInvoices = () =>
  request("GET", "/api/invoices");

export const getInvoiceById = (id) =>
  request("GET", `/api/invoices/${id}`);

export const createInvoice = (data) =>
  request("POST", "/api/invoices", data);

export const updateInvoiceStatus = (id, status) =>
  request("PATCH", `/api/invoices/${id}`, { status });

// ── Catálogo de precios (Maxi) ──────────────────────
export const getCatalog = () =>
  request("GET", "/api/catalogo");

export const createCatalogItem = (data) =>
  request("POST", "/api/catalogo", data);

export const updateCatalogItem = (id, data) =>
  request("PATCH", `/api/catalogo/${id}`, data);

export const deleteCatalogItem = (id) =>
  request("DELETE", `/api/catalogo/${id}`);
