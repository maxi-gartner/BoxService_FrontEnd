"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Mismo botón sirve para la activación (con inviteToken, primera vez) y
// para el login de vuelta (sin inviteToken) — ver Auth/PortalAuthService.cs,
// el backend decide cuál de los dos casos es.
export function PortalGoogleLogin({ inviteToken }: { inviteToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  if (!clientId) {
    return (
      <p className="text-sm text-danger">
        Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID (ver web/.env.example).
      </p>
    );
  }

  async function handleSuccess(credentialResponse: CredentialResponse) {
    setError("");

    if (!credentialResponse.credential) {
      setError("No se pudo obtener el token de Google.");
      return;
    }

    const res = await fetch("/api/portal-auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credentialResponse.credential, inviteToken }),
    });
    const json = await res.json();

    if (!json.success) {
      setError(json.error?.message ?? "No se pudo iniciar sesión.");
      return;
    }

    router.push("/portal/mi-vehiculo");
    router.refresh();
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex flex-col items-center gap-3">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("No se pudo iniciar sesión con Google.")}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </GoogleOAuthProvider>
  );
}
