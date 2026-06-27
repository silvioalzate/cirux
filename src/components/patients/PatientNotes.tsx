"use client";

import { useState, useMemo, memo } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PatientNotesProps {
  profileId: string;
  initialNotes: string | null;
}

export const PatientNotes = memo(function PatientNotes({ profileId, initialNotes }: PatientNotesProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [draft, setDraft] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setDraft(notes);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(notes);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const trimmed = draft.trim();
    const { error } = await supabase
      .from("patient_profiles")
      .update({ notes: trimmed || null })
      .eq("id", profileId);

    if (error) {
      toast.error("Error al guardar las notas.");
    } else {
      setNotes(trimmed);
      setIsEditing(false);
      toast.success("Notas guardadas.");
    }
    setIsSaving(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Notas Clínicas
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-[8px] text-xs gap-1"
            onClick={handleEdit}
          >
            <Pencil className="size-3" />
            Editar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px]">
          {notes || "No hay notas clínicas registradas."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Editando notas
      </p>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Escribe las notas clínicas del paciente…"
        className="min-h-[120px] rounded-[12px] text-sm resize-y"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-[10px] text-xs gap-1"
          onClick={handleCancel}
        >
          <X className="size-3" />
          Cancelar
        </Button>
        <Button
          size="sm"
          className="h-8 rounded-[10px] text-xs gap-1 bg-primary text-[#0D141D] font-semibold hover:bg-primary/90"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Save className="size-3" />
          )}
          Guardar
        </Button>
      </div>
    </div>
  );
});
