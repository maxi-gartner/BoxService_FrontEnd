"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function PortalGoogleLogin({ inviteToken }: { inviteToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const locked = useRef(false);

  if (!clientId) return <Alert type="error">El ingreso con Google no está disponible en este momento. Consultá al taller.</Alert>;

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (locked.current) return;
    setError("");
    if (!credentialResponse.credential) { setError("No se pudo completar el ingreso con Google. Intentá nuevamente."); return; }
    locked.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/portal-auth/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential, inviteToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error?.message ?? "No se pudo iniciar sesión."); return; }
      startNavigation(() => { router.push("/portal/mi-vehiculo"); router.refresh(); });
    } catch {
      setError("No pudimos conectar para iniciar sesión. Intentá nuevamente.");
    } finally { locked.current = false; setBusy(false); }
  }

  return <GoogleOAuthProvider clientId={clientId}>
    <div className="flex flex-col items-center gap-3" aria-busy={busy || navigating}>
      <div className={busy || navigating ? "pointer-events-none opacity-60" : undefined}>
        <GoogleLogin onSuccess={handleSuccess} onError={() => setError("No se pudo iniciar sesión con Google.")} />
      </div>
      {(busy || navigating) && <LoadingState label="Ingresando al portal..." className="py-2" />}
      {error && <Alert type="error">{error}</Alert>}
    </div>
  </GoogleOAuthProvider>;
}
