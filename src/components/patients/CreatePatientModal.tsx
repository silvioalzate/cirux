"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientFormSchema } from "@/lib/validations/schemas";

type CreatePatientFormValues = z.infer<typeof PatientFormSchema>;

interface CreatePatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePatientModal({ open, onOpenChange, onSuccess }: CreatePatientModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: null,
      status: "prospecto",
    },
    mode: "onChange",
  });

  const { errors, isDirty } = form.formState;

  const onSubmit = useCallback(
    async (values: CreatePatientFormValues) => {
      setIsSubmitting(true);

      const { error } = await supabase.from("patients").insert({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim().toLowerCase() ?? null,
        status: values.status,
      });

      if (error) {
        toast.error("Error al crear el paciente.");
        console.error("Patient insert error:", (error as Error)?.message ?? "unknown");
      } else {
        toast.success("Paciente creado correctamente.");
        form.reset();
        onOpenChange(false);
        onSuccess();
      }

      setIsSubmitting(false);
    },
    [supabase, form, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[18px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
            <UserPlus className="size-5" />
            Nuevo paciente
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Completa los datos para registrar un paciente nuevo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="new-patient-name" className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id="new-patient-name"
              {...form.register("name")}
              placeholder="Nombre del paciente"
              className="rounded-[12px]"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="new-patient-phone" className="text-sm font-medium">
                Teléfono
              </Label>
              <Input
                id="new-patient-phone"
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
              <Label htmlFor="new-patient-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="new-patient-email"
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
            <Label className="text-sm font-medium">Estado</Label>
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
                    <SelectItem value="prospecto">Prospecto</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-[12px]"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4 mr-1.5" />
                  Crear
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
