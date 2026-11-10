"use client";

import type { ApiResponse } from "@/types/api";
import type { LoginRequest, User } from "@/types/auth";
import { ApiClientError } from "./client";

export async function login(credentials: LoginRequest): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const json = (await res.json()) as ApiResponse<{ user: User }>;

  if (!json.success) {
    throw new ApiClientError(json.error.message, json.error.code);
  }

  return json.data.user;
}

async function postPublicAuth<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiClientError(json.error.message, json.error.code);
  }

  return json.data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await postPublicAuth<{ message: string }>("forgot-password", { email });
}

export async function completePasswordReset(token: string, newPassword: string): Promise<void> {
  await postPublicAuth<{ message: string }>("reset-password", { token, newPassword });
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
