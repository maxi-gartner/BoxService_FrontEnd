"use client";

import { useState } from "react";
import { useResetPassword } from "@/hooks/useUsers";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Message = { type: "ok" | "error"; text: string };

// Soporte: el dueño/empleado se olvidó la contraseña. Mismo alcance que
// el backend ya garantiza (dueño solo sus propios empleados, superadmin
// cualquiera) — este botón no decide nada de eso, solo pide la acción.
export function ResetPasswordButton({ userId, onDone }: { userId: number; onDone: (msg: Message) => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const resetPassword = useResetPassword();

  async function handleSubmit() {
    if (password.length < 6) {
      onDone({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    try {
      await resetPassword.mutateAsync({ id: userId, data: { newPassword: password } });
      onDone({ type: "ok", text: "Contraseña actualizada." });
      setOpen(false);
      setPassword("");
    } catch (err) {
      onDone({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar la contraseña." });
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Resetear contraseña
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="max-w-40"
      />
      <Button size="sm" disabled={resetPassword.isPending} onClick={handleSubmit}>
        Guardar
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setOpen(false);
          setPassword("");
        }}
      >
        Cancelar
      </Button>
    </div>
  );
}
