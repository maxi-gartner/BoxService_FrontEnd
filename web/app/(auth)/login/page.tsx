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
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  email: z
    .string()
    .min(1, "Ingresá tu email")
    .email("Email inválido"),

  password: z
    .string()
    .min(1, "Ingresá tu contraseña"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError("");

    try {
      await login(values);

      router.push(
        searchParams.get("next") ?? "/dashboard",
      );

      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiClientError
          ? err.message
          : "No se pudo iniciar sesión.",
      );
    }
  }

  function handleForgotPassword() {
    setServerError(
      "La recuperación de contraseña todavía no está disponible.",
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr]">

          {/* Panel de identidad */}
          <section className="bg-surface px-8 py-8 md:min-h-[540px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-accent">
              <span
                className="text-2xl"
                aria-hidden="true"
              >
                ⚙
              </span>

              <p className="text-2xl font-bold">
                BoxService
              </p>
            </div>
          </section>

          {/* Formulario */}
          <section className="px-6 py-8 sm:px-10 md:px-12 md:py-12 flex items-center">
            <div className="w-full max-w-lg mx-auto">

              <div className="mb-8">
                <h1 className="text-2xl font-bold">
                  Iniciar sesión
                </h1>

                <p className="text-sm text-muted mt-2">
                  Ingresá tus datos para continuar.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Correo electrónico */}
                <div>
                  <Label
                    htmlFor="email"
                    className="cursor-text"
                  >
                    Email
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@taller.com"
                    autoComplete="email"
                    className="cursor-text"
                    {...register("email")}
                  />

                  {errors.email && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <Label
                    htmlFor="password"
                    className="cursor-text"
                  >
                    Contraseña
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="cursor-text"
                      {...register("password")}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="shrink-0 cursor-pointer"
                    >
                      {showPassword
                        ? "Ocultar"
                        : "Mostrar"}
                    </Button>
                  </div>

                  {errors.password && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.password.message}
                    </p>
                  )}

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-accent hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <Alert type="error">
                  {serverError}
                </Alert>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Ingresando..."
                    : "Ingresar"}
                </Button>
              </form>

              <div className="mt-8 border-t border-border pt-5">
                <p className="text-center text-xs text-muted">
                  Mock de desarrollo:
                  {" "}
                  maxi@boxservice.com /
                  boxservice123
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}