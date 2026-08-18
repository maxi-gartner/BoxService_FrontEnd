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

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
