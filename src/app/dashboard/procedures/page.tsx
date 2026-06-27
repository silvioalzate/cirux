import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import type { Procedure } from "@/lib/types";

async function getProcedures() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select("*")
    .order("name", { ascending: true });
  return (data ?? []) as Procedure[];
}

/**
 * Gestión de procedimientos e indicaciones (RF-09.3).
 */
export default async function ProceduresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/dashboard");

  const procedures = await getProcedures();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">
            Procedimientos
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Catálogo de procedimientos e indicaciones de preparación
          </p>
        </div>
        <Button className="bg-primary text-[#0D141D] font-semibold rounded-[18px] hover:bg-primary/90">
          <Plus className="size-4 mr-2" />
          Nuevo procedimiento
        </Button>
      </div>

      {procedures.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No hay procedimientos configurados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {procedures.map((proc) => (
            <Card key={proc.id} className="border-border rounded-[18px]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-heading text-base font-semibold">
                    {proc.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      proc.is_active
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]"
                        : "text-gray-600 bg-gray-50 border-gray-200 text-[10px]"
                    }
                  >
                    {proc.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {proc.description && (
                  <p className="text-sm text-muted-foreground">{proc.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{proc.duration_min} minutos</span>
                </div>
                {proc.preparation_notes && (
                  <div className="bg-muted/30 rounded-[12px] p-3">
                    <p className="text-xs font-medium text-foreground mb-1">
                      Indicaciones de preparación:
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {proc.preparation_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
