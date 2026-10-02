import { PortalGoogleLogin } from "@/components/portal/GoogleLoginButton";

// Login de vuelta: ya existe el vínculo cuenta-de-Google <-> cliente (se
// creó la primera vez, en /portal/activar, con el link que mandó el
// taller) — acá no hace falta ningún token de invitación.
export default function PortalLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-2xl text-accent mb-1">⚙ BoxService</p>
        <h1 className="text-lg font-semibold text-light mb-6">Ver el estado de tu vehículo</h1>
        <PortalGoogleLogin />
      </div>
    </main>
  );
}
