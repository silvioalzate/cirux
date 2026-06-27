"use client";

import { useState, memo, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-100",
  completed: "bg-gray-50 text-gray-600 border-gray-200 cursor-pointer hover:bg-gray-100",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  reschedule: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  reschedule: "Reprogramar",
};

interface Props {
  slotId: string;
  status: string;
  onUpdated: () => void;
}

function AppointmentStatusBadge({ slotId, status, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const canToggle = status === "confirmed" || status === "completed";

  const handleToggle = async () => {
    if (!canToggle || loading) return;
    setLoading(true);

    const nextStatus = status === "confirmed" ? "completed" : "confirmed";
    const { error } = await supabase
      .from("slots")
      .update({ status: nextStatus })
      .eq("id", slotId);

    if (error) {
      console.error("Status update error:", error.message);
    } else {
      onUpdated();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!canToggle || loading}
      className="border-0 bg-transparent p-0"
    >
      <Badge
        variant="outline"
        className={`text-[10px] ${statusColors[status] ?? ""}`}
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          statusLabel[status] ?? status
        )}
      </Badge>
    </button>
  );
}

export default memo(AppointmentStatusBadge);
