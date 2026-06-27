"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html><body className="bg-background flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-xl font-heading font-bold text-foreground">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">Ha ocurrido un error inesperado.</p>
        <Button onClick={reset} className="rounded-[12px]">Reintentar</Button>
      </div>
    </body></html>
  );
}
