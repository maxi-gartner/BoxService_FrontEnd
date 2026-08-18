"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      await login(values);
      router.push(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "No se pudo iniciar sesión.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold text-accent">BoxService</p>
          <p className="text-sm text-muted mt-1">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="vos@taller.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>

          <Alert type="error">{serverError}</Alert>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Mock de desarrollo: maxi@boxservice.com / boxservice123
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
