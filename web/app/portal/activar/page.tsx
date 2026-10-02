"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PortalGoogleLogin } from "@/components/portal/GoogleLoginButton";

function ActivarContent() {
  const token = useSearchParams().get("token");

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-2xl text-accent mb-1">⚙ BoxService</p>
        <h1 className="text-lg font-semibold text-light mb-2">Activá tu acceso</h1>

        {token ? (
          <>
            <p className="text-sm text-muted mb-6">
              Entrá con Google para ver el estado de tu vehículo en el taller.
            </p>
            <PortalGoogleLogin inviteToken={token} />
          </>
        ) : (
          <p className="text-sm text-danger">
            Este link de invitación no es válido — pedile a tu taller que te mande uno nuevo.
          </p>
        )}
      </div>
    </main>
  );
}

export default function ActivarPage() {
  return (
    <Suspense>
      <ActivarContent />
    </Suspense>
  );
}
