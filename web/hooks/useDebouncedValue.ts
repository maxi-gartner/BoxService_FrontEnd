import { useEffect, useState } from "react";

// Retrasa el valor devuelto hasta que `value` deja de cambiar por
// `delayMs` — usado en los buscadores server-side (Clientes, Vehículos,
// VehicleSearch del Taller) para no pegarle al backend en cada tecla.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
