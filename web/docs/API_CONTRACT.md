# BoxService — Contrato de API (backend ASP.NET Core)

Este documento es la fuente de verdad para lo que el frontend (Next.js) espera del
backend nuevo. Los tipos TypeScript en [`types/`](../types/) son el reflejo exacto
de este contrato — si algo cambia acá, cambia ahí también.

## Convenciones generales

- **JSON en camelCase**, siempre. Mismo criterio que ya usaba el backend anterior.
- **Envelope de respuesta único**, en todas las rutas, éxito o error:
  ```json
  { "success": true,  "data": { ... }, "error": null }
  { "success": false, "data": null,    "error": { "code": 400, "message": "..." } }
  ```
- **Códigos HTTP con significado real**: 200 (ok), 201 (creado), 400 (validación),
  401 (no autenticado), 403 (autenticado pero sin permiso), 404 (no existe), 500
  (error del servidor — nunca exponer el detalle de la excepción en `message`).
- **Fechas en ISO 8601** (`yyyy-MM-dd` o `yyyy-MM-ddTHH:mm:ssZ`).
- **IDs de negocio** (`clientId`, `vehicleId`, etc.) son `int`. El `tenantId` es un
  `string` (GUID) — ver sección Multi-tenant.

## Autenticación

**El frontend nunca maneja el token directamente** — hay un proxy en Next.js en el
medio (BFF) que guarda los tokens en cookies `httpOnly`. Para el backend esto es
transparente: reciben un `Authorization: Bearer <token>` normal en cada request, como
cualquier API JWT estándar.

### `POST /auth/login`
Body: `{ "email": string, "password": string }`
Respuesta 200:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@taller.com",
    "role": "owner",
    "tenantId": "uuid | null"
  }
}
```
- `role` es uno de: `"owner" | "employee" | "superadmin"`.
- `tenantId` es `null` únicamente para `superadmin` sin taller seleccionado.
- Credenciales inválidas → 401 con el envelope de error estándar (no 200 con
  `success: false` — esto es login, no una operación de negocio).
- El `accessToken` es un JWT de vida corta (sugerido: 15 min) con claims mínimos:
  `sub` (userId), `role`, `tenantId`, `exp`. **No poner datos sensibles en el
  payload** — cualquiera puede decodificarlo (no verificarlo, pero sí leerlo).
- El `refreshToken` es de vida más larga (sugerido: 7 días), opaco o JWT, a
  criterio del backend — el frontend lo trata como un string opaco.

### `POST /auth/refresh`
Body: `{ "refreshToken": string }`
Respuesta 200: `{ "accessToken": string, "refreshToken": string }` (refresh token
rotation: cada uso invalida el anterior y devuelve uno nuevo).
Refresh token inválido/expirado → 401.

### `POST /auth/logout`
Invalida el refresh token del lado del backend (deny-list o borrado de sesión).
Respuesta 200: `{ "message": "logged out" }`.

### Todas las demás rutas
Requieren `Authorization: Bearer <accessToken>`. Sin header o token inválido/vencido
→ 401. Rol insuficiente para la operación → 403. **El rol y el tenant se validan
siempre server-side** — nunca confiar en lo que mande el cliente más allá del JWT.

## Multi-tenant

- Cada fila de cada tabla de negocio (clientes, vehículos, presupuestos, services,
  facturas, catálogo) tiene un `tenant_id`.
- El `tenantId` para filtrar/insertar **sale siempre del JWT del request**, nunca de
  un parámetro que mande el cliente — excepto `superadmin`, que puede pasar un
  `X-Tenant-Id` opcional para operar sobre un taller puntual (a definir si hace
  falta antes de implementarlo; no todos los endpoints lo necesitan de entrada).
- Ningún usuario `owner`/`employee` puede ver ni modificar datos de otro tenant, ni
  aunque adivine un ID — el filtro por tenant va en la query, no es un chequeo
  aparte que se pueda olvidar.

## Roles y permisos (primera versión, se afina con el uso)

| Acción | owner | employee | superadmin |
|---|---|---|---|
| CRUD Clientes/Vehículos/Presupuestos/Services/Facturas/Catálogo | ✅ | ✅ | ✅ (con tenant seleccionado) |
| Gestionar empleados del propio taller | ✅ | ❌ | — |
| Ver reportes/dashboard financiero del taller | ✅ | ❌ | ✅ |
| Alta de talleres nuevos | ❌ | ❌ | ✅ |
| Operar sobre cualquier tenant | ❌ | ❌ | ✅ |

## Usuarios y talleres (nuevo)

### `GET /users/me` — cualquier usuario autenticado
Devuelve el usuario actual (`{ id, name, email, role, tenantId }`), resuelto a partir
del `sub` del JWT. Lo usa el frontend para mostrar el nombre en el sidebar sin tener
que guardarlo en ningún lado del lado del cliente.

### `GET /tenants` — solo `superadmin`
Lista todos los talleres.

### `POST /tenants` — solo `superadmin`
Body: `{ "name": string, "ownerEmail": string, "ownerName": string }` — crea el
tenant y su primer usuario `owner` (genera invitación/contraseña temporal, a
definir el mecanismo con el equipo).

### `GET /users` — `owner` (su propio tenant) o `superadmin`
Lista usuarios del tenant activo.

### `POST /users` — `owner`
Body: `{ "name": string, "email": string, "role": "employee" }` — invita un
empleado a su taller. `owner` no puede crear otro `owner` ni `superadmin`.

### `PATCH /users/{id}` / `DELETE /users/{id}` — `owner` (de su tenant)
Editar rol o dar de baja un empleado.

## Módulos existentes (mismo contrato que el backend anterior, ahora con tenant)

Todos siguen el mismo patrón CRUD ya usado en la v1. Se listan acá los tipos
completos — el detalle de cada campo está en [`types/entities.ts`](../types/entities.ts).

### Clientes
- `GET /clients` · `GET /clients/{id}` · `GET /clients/{id}/vehicles` · `POST /clients`
- Tipos: `Client`, `ClientCreateRequest`

### Vehículos
- `GET /vehicles` (soporta `?plate=` para filtrar) · `GET /vehicles/{id}` ·
  `GET /vehicles/{id}/history` · `POST /vehicles`
- Tipos: `Vehicle`, `VehicleCreateRequest`

### Presupuestos
- `GET /budgets` · `GET /budgets/{id}` (con `details` y `total`) · `POST /budgets` ·
  `PATCH /budgets/{id}` (cambia `status`: `sent | rejected | approved`) ·
  `PUT /budgets/{id}/service` (vincula un service ya creado — pasa el estado a
  `completed` automáticamente del lado del backend)
- Tipos: `Budget`, `BudgetDetail`, `BudgetWithDetails`, `BudgetCreateRequest`,
  `BudgetStatusRequest`

### Services
- `GET /services` · `GET /services/{id}` · `GET /services/{id}/details` ·
  `POST /services` · `POST /services/{id}/details`
- Tipos: `Service`, `ServiceDetail`, `ServiceCreateRequest`, `ServiceDetailCreateRequest`

### Facturas
- `GET /invoices` · `GET /invoices/{id}` · `POST /invoices` ·
  `PATCH /invoices/{id}` (cambia `status`: `paid | cancelled`)
- Tipos: `Invoice`, `InvoiceCreateRequest`, `InvoiceStatusRequest`
- **Pendiente de definir** (no bloqueante para el MVP): facturar un service que no
  viene de un presupuesto hoy da total $0 porque no hay de dónde sacar el monto. Si
  se resuelve, probablemente `InvoiceCreateRequest` sume una lista de ítems ad-hoc
  opcional, similar a `BudgetDetailRequest`.

### Catálogo de precios
- `GET /catalog` · `POST /catalog` · `PATCH /catalog/{id}` · `DELETE /catalog/{id}`
- Tipos: `CatalogItem`, `CatalogItemCreateRequest`, `CatalogItemUpdateRequest`

## Seguridad — checklist para el backend

- [ ] Hashear contraseñas (BCrypt/Argon2), nunca texto plano ni siquiera en dev.
- [ ] `accessToken` de vida corta + `refreshToken` con rotation.
- [ ] CORS: si el backend queda en otro origen del que despliega Next.js, restringir
  a ese origen puntual — el navegador nunca le habla directo al backend real (todo
  pasa por el proxy de Next.js), así que en teoría ni siquiera necesita CORS abierto.
- [ ] Rate limiting en `/auth/login` (fuerza bruta).
- [ ] Nunca devolver el hash de la contraseña ni datos de otros tenants en ninguna
  respuesta, ni por error.
- [ ] Todo endpoint de escritura valida el rol Y el tenant server-side, no solo
  autenticación.
