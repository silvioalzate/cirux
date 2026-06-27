"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Loader2, User, Mail, Shield, Save, Sun, Moon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { useAuthStore } from "@/lib/stores/authStore";
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
import { Switch } from "@/components/ui/switch";
import type { Staff } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function UserProfileModal() {
  const supabase = useMemo(() => createClient(), []);
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const { theme, setTheme } = useTheme();
  const isOpen = activeModal === "editProfile";

  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadStaff = async () => {
      setIsLoadingProfile(true);
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("id", user.id)
        .single();

      const staffData = (data ?? null) as Staff | null;

      // Prefer staff name, fallback to auth display_name, then to auth email prefix
      const displayName =
        staffData?.name ||
        (user.user_metadata as Record<string, string> | undefined)?.display_name ||
        user.email?.split("@")[0] ||
        "";

      setStaff(staffData);
      form.reset({ name: displayName });
      setIsLoadingProfile(false);
    };

    void loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const onSubmit = async (values: ProfileValues) => {
    if (!user) return;

    const trimmedName = values.name.trim();
    const { error } = await supabase
      .from("staff")
      .update({ name: trimmedName })
      .eq("id", user.id);

    if (error) {
      toast.error("Error al actualizar el perfil.");
      return;
    }

    // Sync display name to Supabase Auth user metadata
    await supabase.auth.updateUser({
      data: { display_name: trimmedName },
    });

    toast.success("Perfil actualizado.");
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-sm rounded-[18px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Editar perfil
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Actualiza tus datos personales
          </DialogDescription>
        </DialogHeader>

        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3" />
                Email
              </Label>
              <Input
                value={staff?.email ?? user?.email ?? ""}
                disabled
                className="rounded-[12px] h-9 text-sm bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Role (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3" />
                Rol
              </Label>
              <Input
                value={role ?? ""}
                disabled
                className="rounded-[12px] h-9 text-sm bg-muted/50 cursor-not-allowed capitalize"
              />
            </div>

            {/* Name (editable) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="size-3" />
                Nombre
              </Label>
              <Input
                {...form.register("name")}
                placeholder="Tu nombre completo"
                className="rounded-[12px] h-9 text-sm"
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Theme toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-muted/30">
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="size-3.5 text-muted-foreground" />
                ) : (
                  <Sun className="size-3.5 text-muted-foreground" />
                )}
                <Label className="text-xs cursor-pointer" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  Tema oscuro
                </Label>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Cambiar tema"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-[12px]"
                onClick={closeModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Save className="size-3.5 mr-1.5" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
