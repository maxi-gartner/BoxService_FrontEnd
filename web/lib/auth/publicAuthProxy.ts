import { NextResponse, type NextRequest } from "next/server";
import { isResourceReal } from "@/lib/backend-mode";

type RecoveryEndpoint = "forgot-password" | "reset-password";

function errorResponse(status: number, message: string) {
  return NextResponse.json(
    { success: false, data: null, error: { code: status, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function forwardPasswordRecovery(request: NextRequest, endpoint: RecoveryEndpoint) {
  if (!isResourceReal("auth")) {
    return errorResponse(503, "La recuperación por email requiere conectar un backend real.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse(400, "Solicitud inválida.");
    throw error;
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return errorResponse(503, "El servicio de recuperación no está disponible.");

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(`/auth/${endpoint}`, backendUrl);
  } catch {
    console.error("La URL del backend para recuperación de contraseña no es válida.");
    return errorResponse(500, "El servicio de recuperación no está configurado correctamente.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error("No se pudo contactar al backend para recuperación de contraseña.", error);
    return errorResponse(503, "No se pudo conectar con el servidor.");
  }

  const responseBody = await upstream.text();
  if (!responseBody) {
    return errorResponse(upstream.status || 502, "El servidor respondió sin contenido.");
  }

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
