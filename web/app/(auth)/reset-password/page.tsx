"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { completePasswordReset } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const schema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resetToken = searchParams.get("token");
  const [token, setToken] = useState(() => resetToken ?? "");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (resetToken) {
      router.replace("/reset-password", { scroll: false });
    }
  }, [resetToken, router]);

  async function onSubmit({ password }: FormValues) {
    setServerError("");
    try {
      await completePasswordReset(token, password);
      setDone(true);
      setToken("");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "No se pudo actualizar la contraseña.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-lg rounded-xl border border-border bg-background px-6 py-8 sm:px-10">
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        {done ? (
          <>
            <div className="my-6"><Alert type="ok">Contraseña actualizada. Ya podés iniciar sesión.</Alert></div>
            <Link href="/login?passwordReset=1" className="text-sm text-accent hover:underline">
              Ir al inicio de sesión
            </Link>
          </>
        ) : token ? (
          <>
            <p className="mt-2 mb-6 text-sm text-muted">Elegí una contraseña nueva para tu cuenta.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input id="password" type="password" autoComplete="new-password" required {...register("password")} />
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" required {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>}
              </div>
              {serverError && <Alert type="error">{serverError}</Alert>}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="my-6">
              <Alert type="error">El enlace no contiene un token válido. Solicitá uno nuevo.</Alert>
            </div>
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">
              Solicitar otro enlace
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
