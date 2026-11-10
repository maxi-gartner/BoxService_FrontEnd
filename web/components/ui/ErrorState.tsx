"use client";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "./Button";

export function ErrorState({ error, code, resource = "la información", notFoundTitle, onRetry, href = "/", backLabel = "Volver al inicio", fullPage = false }: {
  error?: unknown; code?: number; resource?: string; notFoundTitle?: string; onRetry?: () => void;
  href?: string; backLabel?: string; fullPage?: boolean;
}) {
  const status = code ?? (error instanceof ApiClientError ? error.code : undefined);
  const unavailable = status === 403 || status === 404;
  const title = status === 404 ? notFoundTitle ?? "Información no encontrada o sin acceso"
    : status === 403 ? "No tenés permiso para acceder"
    : status === 401 ? "Tu sesión dejó de estar vigente"
    : status === 400 ? "El enlace o los datos no son válidos"
    : status === 503 ? "No pudimos conectar con el servidor"
    : "No se pudo completar la consulta";
  const description = unavailable ? "El contenido no está disponible para tu cuenta."
    : status === 401 ? "Iniciá sesión nuevamente para continuar."
    : status === 400 ? "Volvé al listado y seleccioná un registro válido."
    : `No pudimos cargar ${resource}. Podés volver a intentarlo.`;
  return <div className={fullPage ? "min-h-screen flex items-center justify-center bg-bg p-4" : "py-4"}>
    <div role="alert" className="mx-auto w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6 text-center sm:p-8">
      {status && <p className="font-semibold text-accent">{status}</p>}
      <h2 className="text-lg font-bold text-light">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={status === 401 ? "/login" : href} className="text-sm text-accent underline">{status === 401 ? "Iniciar sesión" : backLabel}</Link>
        {!unavailable && status !== 400 && status !== 401 && <Button type="button" variant="secondary" onClick={onRetry ?? (() => window.location.reload())}>Reintentar</Button>}
      </div>
    </div>
  </div>;
}
