"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-heading font-bold text-foreground">Error al cargar</h2>
        <p className="text-sm text-muted-foreground">No se pudo cargar esta sección.</p>
        <Button onClick={reset} className="rounded-[12px]">Reintentar</Button>
      </div>
    </div>
  );
}
