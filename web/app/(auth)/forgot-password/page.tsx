"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Ingresá un email válido"),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormValues) {
    setMessage("");
    setError("");
    try {
      await requestPasswordReset(email);
      setMessage("Si existe una cuenta asociada a ese email, recibirás instrucciones para recuperar la contraseña.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo solicitar la recuperación.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-lg rounded-xl border border-border bg-background px-6 py-8 sm:px-10">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-2 mb-6 text-sm text-muted">
          Ingresá el email asociado a tu cuenta y te enviaremos un enlace si existe.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          {error && <Alert type="error">{error}</Alert>}
          {message && <Alert type="ok">{message}</Alert>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>

        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
