"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientFormSchema } from "@/lib/validations/schemas";
import type { Patient } from "@/lib/types";

type PatientFormValues = z.infer<typeof PatientFormSchema>;

const statusVariant: Record<string, string> = {
  activo: "text-emerald-700 bg-emerald-50 border-emerald-200",
  prospecto: "text-yellow-700 bg-yellow-50 border-yellow-200",
  inactivo: "text-gray-600 bg-gray-50 border-gray-200",
};

const statusLabel: Record<string, string> = {
  activo: "Activo",
  prospecto: "Prospecto",
  inactivo: "Inactivo",
};

interface PatientEditorProps {
  patient: Patient;
}

export function PatientEditor({ patient }: PatientEditorProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      status: patient.status,
    },
    mode: "onChange",
  });

  const { errors, isDirty } = form.formState;
  const watchedStatus = useWatch({ control: form.control, name: "status" });

  const onSubmit = useCallback(async (values: PatientFormValues) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from("patients")
      .update({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim().toLowerCase() ?? null,
        status: values.status,
      })
      .eq("id", patient.id);

    if (error) {
      toast.error("Error al guardar los cambios.");
      console.error("Patient update error:", (error as Error)?.message ?? "unknown");
    } else {
      toast.success("Datos del paciente actualizados.");
      router.refresh();
    }
    setIsSubmitting(false);
  }, [patient.id, router, supabase]);

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="patient-name" className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id="patient-name"
              {...form.register("name")}
              placeholder="Nombre del paciente"
              className="rounded-[12px]"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-phone" className="text-sm font-medium">
                Teléfono
              </Label>
              <Input
                id="patient-phone"
                {...form.register("phone")}
                placeholder="+57 300 000 0000"
                className="rounded-[12px]"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="patient-email"
                type="email"
                {...form.register("email")}
                placeholder="paciente@email.com"
                className="rounded-[12px]"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Estado del paciente</Label>
            <div className="flex items-center gap-4">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v: string | null) => {
                      if (v) field.onChange(v);
                    }}
                  >
                    <SelectTrigger className="rounded-[12px] w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="prospecto">Prospecto</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Badge
                variant="outline"
                className={`capitalize text-xs ${statusVariant[watchedStatus] ?? ""}`}
              >
                {statusLabel[watchedStatus] ?? patient.status}
              </Badge>
            </div>
          </div>

          {/* Fechas (readonly) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Creado
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(patient.created_at).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Actualizado
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(patient.updated_at ?? patient.created_at).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
