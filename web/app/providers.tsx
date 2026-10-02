"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // Default a false: evita una tanda de refetches cada vez que
            // alguien vuelve a la pestaña sin que haya pasado nada. Los
            // hooks de Taller (presupuestos/services/facturas) lo
            // reactivan puntualmente porque ahí sí importa enterarse
            // rápido de un cambio hecho desde otro puesto.
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
