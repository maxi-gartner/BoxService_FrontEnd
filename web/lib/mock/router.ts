/**
 * Router del backend simulado. Misma forma de respuesta que tendría el
 * backend real (envelope {success,data,error}), mismas rutas del contrato.
 * Ver docs/API_CONTRACT.md.
 */
import { db, nextBudgetNumber, nextInvoiceNumber } from "./db";
import { signAccessToken, signRefreshToken, verifyMockToken } from "./tokens";
import type {
  Budget,
  BudgetCreateRequest,
  BudgetStatusRequest,
  CatalogItem,
  CatalogItemCreateRequest,
  CatalogItemUpdateRequest,
  Client,
  ClientCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  InvoiceStatusRequest,
  Service,
  ServiceCreateRequest,
  ServiceDetailCreateRequest,
  Vehicle,
  VehicleCreateRequest,
} from "@/types/entities";
import type { LoginRequest, Role } from "@/types/auth";

export type MockResult = { status: number; body: unknown };

function ok(data: unknown, status = 200): MockResult {
  return { status, body: { success: true, data, error: null } };
}
function fail(status: number, message: string): MockResult {
  return { status, body: { success: false, data: null, error: { code: status, message } } };
}

type Claims = { userId: string; role: Role; tenantId: string | null };

async function getClaims(authHeader: string | null): Promise<Claims | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyMockToken(authHeader.slice(7));
    return {
      userId: String(payload.sub),
      role: payload.role as Role,
      tenantId: (payload.tenantId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function handleMockRequest(
  method: string,
  path: string,
  searchParams: URLSearchParams,
  body: unknown,
  authHeader: string | null,
): Promise<MockResult> {
  const segments = path.split("/").filter(Boolean);

  // ── AUTH (públicas) ─────────────────────────────────
  if (segments[0] === "auth") {
    if (method === "POST" && segments[1] === "login") return handleLogin(body as LoginRequest);
    if (method === "POST" && segments[1] === "refresh") return handleRefresh(body as { refreshToken: string });
    if (method === "POST" && segments[1] === "logout") return ok({ message: "logged out" });
    return fail(404, "Auth route not found");
  }

  // ── Todo lo demás requiere sesión ───────────────────
  const claims = await getClaims(authHeader);
  if (!claims) return fail(401, "Missing or invalid token");

  const tenantId = claims.tenantId;
  if (!tenantId) return fail(403, "No tenant selected");

  if (segments[0] === "users") return handleUsers(method, segments, claims);
  if (segments[0] === "clients") return handleClients(method, segments, body, tenantId);
  if (segments[0] === "vehicles") return handleVehicles(method, segments, searchParams, body, tenantId);
  if (segments[0] === "budgets") return handleBudgets(method, segments, body, tenantId);
  if (segments[0] === "services") return handleServices(method, segments, body, tenantId);
  if (segments[0] === "invoices") return handleInvoices(method, segments, body, tenantId);
  if (segments[0] === "catalog") return handleCatalog(method, segments, body, tenantId);

  return fail(404, "Route not found");
}

// ── Auth ────────────────────────────────────────────
async function handleLogin(body: LoginRequest): Promise<MockResult> {
  const user = db.users.find((u) => u.email === body?.email && u.password === body?.password);
  if (!user) return fail(401, "Invalid credentials");

  const accessToken = await signAccessToken(user);
  const refreshToken = await signRefreshToken(user);
  db.refreshTokens.add(refreshToken);

  return ok({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
  });
}

async function handleRefresh(body: { refreshToken: string }): Promise<MockResult> {
  if (!body?.refreshToken || !db.refreshTokens.has(body.refreshToken)) {
    return fail(401, "Invalid refresh token");
  }
  try {
    const payload = await verifyMockToken(body.refreshToken);
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user) return fail(401, "Invalid refresh token");

    db.refreshTokens.delete(body.refreshToken);
    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user);
    db.refreshTokens.add(refreshToken);
    return ok({ accessToken, refreshToken });
  } catch {
    return fail(401, "Invalid refresh token");
  }
}

// ── Usuarios ────────────────────────────────────────
function handleUsers(method: string, segments: string[], claims: Claims): MockResult {
  if (method === "GET" && segments[1] === "me") {
    const user = db.users.find((u) => u.id === claims.userId);
    if (!user) return fail(404, "User not found");
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId });
  }
  return fail(404, "User route not found");
}

// ── Clientes ────────────────────────────────────────
function handleClients(method: string, segments: string[], body: unknown, tenantId: string): MockResult {
  const mine = () => db.clients.filter((c) => c.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) return ok(mine());

  if (method === "POST" && segments.length === 1) {
    const req = body as ClientCreateRequest;
    if (!req?.name) return fail(400, "name is required");
    const client: Client = {
      clientId: Math.max(0, ...db.clients.map((c) => c.clientId)) + 1,
      tenantId,
      name: req.name,
      phone: req.phone ?? "",
      email: req.email ?? "",
      createdAt: new Date().toISOString(),
    };
    db.clients.push(client);
    return ok(client, 201);
  }

  const id = Number(segments[1]);
  const client = mine().find((c) => c.clientId === id);
  if (!client) return fail(404, "Client not found");

  if (method === "GET" && segments.length === 2) return ok(client);

  if (method === "GET" && segments[2] === "vehicles") {
    return ok(db.vehicles.filter((v) => v.tenantId === tenantId && v.clientId === id));
  }

  return fail(404, "Client route not found");
}

// ── Vehículos ───────────────────────────────────────
function handleVehicles(
  method: string,
  segments: string[],
  searchParams: URLSearchParams,
  body: unknown,
  tenantId: string,
): MockResult {
  const mine = () => db.vehicles.filter((v) => v.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) {
    const plate = searchParams.get("plate");
    if (plate) {
      const found = mine().find((v) => v.plate.toLowerCase() === plate.toLowerCase());
      return found ? ok(found) : fail(404, "Vehicle not found");
    }
    return ok(mine());
  }

  if (method === "POST" && segments.length === 1) {
    const req = body as VehicleCreateRequest;
    if (!req?.clientId || !req?.brand || !req?.model || !req?.plate) {
      return fail(400, "clientId, brand, model and plate are required");
    }
    if (mine().some((v) => v.plate.toLowerCase() === req.plate.toLowerCase())) {
      return fail(400, "A vehicle with that plate already exists");
    }
    const vehicle: Vehicle = {
      vehicleId: Math.max(0, ...db.vehicles.map((v) => v.vehicleId)) + 1,
      tenantId,
      clientId: req.clientId,
      brand: req.brand,
      model: req.model,
      year: req.year ?? null,
      plate: req.plate.toUpperCase(),
      currentMileage: req.currentMileage ?? 0,
      createdAt: new Date().toISOString(),
    };
    db.vehicles.push(vehicle);
    return ok(vehicle, 201);
  }

  const id = Number(segments[1]);
  const vehicle = mine().find((v) => v.vehicleId === id);
  if (!vehicle) return fail(404, "Vehicle not found");

  if (method === "GET" && segments.length === 2) return ok(vehicle);

  if (method === "GET" && segments[2] === "history") {
    return ok(db.services.filter((s) => s.tenantId === tenantId && s.vehicleId === id));
  }

  return fail(404, "Vehicle route not found");
}

// ── Presupuestos ────────────────────────────────────
function handleBudgets(method: string, segments: string[], body: unknown, tenantId: string): MockResult {
  const mine = () => db.budgets.filter((b) => b.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) return ok(mine());

  if (method === "POST" && segments.length === 1) {
    const req = body as BudgetCreateRequest;
    if (!req?.vehicleId) return fail(400, "vehicleId is required");
    if (!req?.details?.length) return fail(400, "details is required and must have at least one item");

    const { id, number } = nextBudgetNumber();
    const budget: Budget = {
      budgetId: id,
      tenantId,
      number,
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
      notes: req.notes ?? null,
      vehicleId: req.vehicleId,
      serviceId: null,
    };
    db.budgets.push(budget);

    for (const d of req.details) {
      db.seq.budgetDetail += 1;
      db.budgetDetails.push({
        detailId: db.seq.budgetDetail,
        budgetId: id,
        type: d.type,
        description: d.description,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.quantity * d.unitPrice,
      });
    }

    return ok(budget, 201);
  }

  const id = Number(segments[1]);
  const budget = mine().find((b) => b.budgetId === id);
  if (!budget) return fail(404, "Budget not found");

  if (method === "GET" && segments.length === 2) {
    const details = db.budgetDetails.filter((d) => d.budgetId === id);
    const total = details.reduce((sum, d) => sum + d.subtotal, 0);
    return ok({ budget, details, total });
  }

  if (method === "PATCH" && segments.length === 2) {
    const req = body as BudgetStatusRequest;
    const valid = ["sent", "rejected", "approved"];
    if (!valid.includes(req?.status)) return fail(400, "Invalid status. Use: sent | rejected | approved");

    if (req.status === "approved") {
      if (budget.status === "approved" || budget.status === "completed") return fail(400, "Budget already approved");
      if (budget.status === "rejected") return fail(400, "Cannot approve a rejected budget");
    }

    budget.status = req.status;
    return ok({ budgetId: budget.budgetId, status: budget.status });
  }

  if (method === "PUT" && segments[2] === "service") {
    const req = body as { serviceId: number };
    if (!req?.serviceId) return fail(400, "Invalid service ID");
    if (budget.status !== "approved") return fail(400, "Only approved budgets can be linked to a service");
    if (budget.serviceId) return fail(400, "Budget already has a linked service");

    budget.serviceId = req.serviceId;
    budget.status = "completed";
    return ok({ message: "Budget linked to service" });
  }

  return fail(404, "Budget route not found");
}

// ── Services ────────────────────────────────────────
function handleServices(method: string, segments: string[], body: unknown, tenantId: string): MockResult {
  const mine = () => db.services.filter((s) => s.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) return ok(mine());

  if (method === "POST" && segments.length === 1) {
    const req = body as ServiceCreateRequest;
    if (!req?.vehicleId || !req?.date || !req?.mileage || !req?.serviceType) {
      return fail(400, "vehicleId, date, mileage and serviceType are required");
    }
    db.seq.service += 1;
    const service: Service = {
      serviceId: db.seq.service,
      tenantId,
      vehicleId: req.vehicleId,
      date: req.date,
      mileage: req.mileage,
      serviceType: req.serviceType,
      notes: req.notes ?? "",
      nextMileage: req.mileage + 10000,
      nextDate: addMonths(req.date, 6),
    };
    db.services.push(service);

    const vehicle = db.vehicles.find((v) => v.vehicleId === req.vehicleId);
    if (vehicle) vehicle.currentMileage = Math.max(vehicle.currentMileage, req.mileage);

    return ok(service, 201);
  }

  const id = Number(segments[1]);
  const service = mine().find((s) => s.serviceId === id);
  if (!service) return fail(404, "Service not found");

  if (method === "GET" && segments.length === 2) return ok(service);

  if (segments[2] === "details") {
    if (method === "GET") return ok(db.serviceDetails.filter((d) => d.serviceId === id));

    if (method === "POST") {
      const req = body as ServiceDetailCreateRequest;
      if (!req?.description) return fail(400, "description is required");
      db.seq.serviceDetail += 1;
      const detail = { detailId: db.seq.serviceDetail, serviceId: id, description: req.description, done: req.done ?? true };
      db.serviceDetails.push(detail);
      return ok(detail, 201);
    }
  }

  return fail(404, "Service route not found");
}

function addMonths(isoDate: string, months: number) {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ── Facturas ────────────────────────────────────────
function handleInvoices(method: string, segments: string[], body: unknown, tenantId: string): MockResult {
  const mine = () => db.invoices.filter((i) => i.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) return ok(mine());

  if (method === "POST" && segments.length === 1) {
    const req = body as InvoiceCreateRequest;
    if (!req?.serviceId) return fail(400, "serviceId is required");
    if (mine().some((i) => i.serviceId === req.serviceId)) return fail(400, "This service already has an invoice");

    let total = 0;
    if (req.budgetId) {
      const budget = db.budgets.find((b) => b.budgetId === req.budgetId && b.tenantId === tenantId);
      if (!budget) return fail(400, "budgetId does not match an existing budget");
      total = db.budgetDetails.filter((d) => d.budgetId === req.budgetId).reduce((sum, d) => sum + d.subtotal, 0);
    }

    const { id, number } = nextInvoiceNumber();
    const invoice: Invoice = {
      invoiceId: id,
      tenantId,
      number,
      date: new Date().toISOString().slice(0, 10),
      total,
      status: "issued",
      serviceId: req.serviceId,
      budgetId: req.budgetId ?? null,
    };
    db.invoices.push(invoice);
    return ok(invoice, 201);
  }

  const id = Number(segments[1]);
  const invoice = mine().find((i) => i.invoiceId === id);
  if (!invoice) return fail(404, "Invoice not found");

  if (method === "GET" && segments.length === 2) return ok(invoice);

  if (method === "PATCH" && segments.length === 2) {
    const req = body as InvoiceStatusRequest;
    if (invoice.status === "cancelled") return fail(400, "Cannot modify a cancelled invoice");
    if (!["paid", "cancelled"].includes(req?.status)) return fail(400, "Invalid status. Use: paid | cancelled");
    invoice.status = req.status;
    return ok({ invoiceId: invoice.invoiceId, status: invoice.status });
  }

  return fail(404, "Invoice route not found");
}

// ── Catálogo ────────────────────────────────────────
function handleCatalog(method: string, segments: string[], body: unknown, tenantId: string): MockResult {
  const mine = () => db.catalog.filter((c) => c.tenantId === tenantId);

  if (method === "GET" && segments.length === 1) return ok(mine());

  if (method === "POST" && segments.length === 1) {
    const req = body as CatalogItemCreateRequest;
    if (!req?.name || req.price == null || req.price < 0) return fail(400, "name and a non-negative price are required");
    db.seq.catalog += 1;
    const item: CatalogItem = { catalogId: db.seq.catalog, tenantId, name: req.name, type: req.type ?? "labor", price: req.price };
    db.catalog.push(item);
    return ok(item, 201);
  }

  const id = Number(segments[1]);
  const item = mine().find((c) => c.catalogId === id);
  if (!item) return fail(404, "Catalog item not found");

  if (method === "PATCH") {
    const req = body as CatalogItemUpdateRequest;
    if (req.name !== undefined) item.name = req.name;
    if (req.type !== undefined) item.type = req.type;
    if (req.price !== undefined) item.price = req.price;
    return ok({ message: "Catalog item updated" });
  }

  if (method === "DELETE") {
    db.catalog = db.catalog.filter((c) => c.catalogId !== id);
    return ok({ message: "Catalog item deleted" });
  }

  return fail(404, "Catalog route not found");
}
