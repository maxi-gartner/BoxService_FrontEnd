import type { NextRequest } from "next/server";
import { forwardPasswordRecovery } from "@/lib/auth/publicAuthProxy";

export function POST(request: NextRequest) {
  return forwardPasswordRecovery(request, "reset-password");
}
