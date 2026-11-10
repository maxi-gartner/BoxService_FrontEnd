import { ErrorState } from "@/components/ui/ErrorState";

export default function NotFound() {
  return <ErrorState code={404} notFoundTitle="Página no encontrada" fullPage />;
}
