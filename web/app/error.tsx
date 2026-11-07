"use client";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState resource="esta pantalla" onRetry={reset} fullPage />;
}
