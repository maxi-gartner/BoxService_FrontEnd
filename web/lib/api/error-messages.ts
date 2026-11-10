const messages: Record<string, string> = {
  "Service does not exist": "Service no encontrado en este taller.",
  "Service not found": "Service no encontrado en este taller.",
  "Service not found.": "Service no encontrado en este taller.",
  "Vehicle not found.": "Vehículo no encontrado en este taller.",
  "Budget not found": "Presupuesto no encontrado en este taller.",
  "Invoice not found": "Factura no encontrada en este taller.",
  "User not found": "Usuario no encontrado en este taller.",
  "This service already has an invoice": "Este service ya tiene una factura. Actualizá el listado para verla.",
  "Cannot modify a cancelled invoice": "No se puede modificar una factura anulada.",
  "Mileage must be greater than 0.": "El kilometraje debe ser mayor a cero.",
  "Date is required.": "Ingresá la fecha del service.",
  "Service type is required.": "Seleccioná el tipo de service.",
  "Vehicle is required.": "Seleccioná un vehículo.",
  "Brand is required.": "Ingresá la marca del vehículo.",
  "Model is required.": "Ingresá el modelo del vehículo.",
  "Plate is required.": "Ingresá la patente del vehículo.",
  "Current mileage cannot be negative.": "El kilometraje no puede ser negativo.",
  "A vehicle with that plate already exists.": "Ya existe un vehículo con esa patente.",
  "Client does not exist.": "Cliente no encontrado en este taller.",
  "Only approved budgets can be linked to a service": "El presupuesto debe estar aprobado para vincularlo a un service.",
  "Budget already has a linked service": "El presupuesto ya tiene un service vinculado.",
  "Service must exist and belong to the budget vehicle": "El service debe pertenecer al mismo vehículo y taller que el presupuesto.",
  "Referenced resource does not exist or is still in use.": "El registro relacionado no existe o todavía está en uso.",
  "Resource already exists.": "Ese registro ya existe. Actualizá el listado antes de volver a intentarlo.",
  "A value exceeds the allowed size.": "Uno de los valores supera el tamaño permitido. Revisá los datos ingresados.",
};

export function apiErrorMessage(code: number, message?: string): string {
  if (code === 401) return "Tu sesión dejó de estar vigente. Ingresá nuevamente.";
  if (code === 403) return "No tenés permiso para realizar esta acción.";
  if (code === 404) return "El registro no existe o no está disponible para tu cuenta.";
  if (code === 503) return "No pudimos conectar con el servidor. Revisá la conexión e intentá nuevamente.";
  if (code >= 500) return "Ocurrió un problema en el servidor. No pudimos confirmar la operación; revisá el listado antes de repetirla.";
  if (code === 413) return "El archivo supera el tamaño permitido.";
  if (code === 429) return "Se realizaron demasiadas solicitudes. Esperá unos segundos antes de intentar nuevamente.";
  return message ? messages[message] ?? message : "No se pudo completar la operación. Revisá los datos e intentá nuevamente.";
}
