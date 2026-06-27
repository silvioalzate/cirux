"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, UserX, Clock, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreatePatientModal } from "@/components/patients/CreatePatientModal";
import type { Patient } from "@/lib/types";

const statusConfig = {
  prospecto: { label: "Prospecto", icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  activo: { label: "Activo", icon: UserCheck, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactivo: { label: "Inactivo", icon: UserX, className: "bg-gray-50 text-gray-600 border-gray-200" },
};

/**
 * Listado de pacientes con búsqueda full-text y navegación a ficha (RF-09.2).
 */
export default function PatientsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPatients = useCallback(
    async (search: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      const trimmed = search.trim();
      let q = supabase
        .from("patients")
        .select("id, phone, name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (trimmed) {
        const escaped = trimmed.replace(/[%_]/g, "\\$&");
        q = q.or(
          `name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`
        );
      }

      const { data } = await q;

      if (!controller.signal.aborted) {
        setPatients((data ?? []) as Patient[]);
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // Initial load
  useEffect(() => {
    void fetchPatients("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void fetchPatients(value);
    }, 300);
  }, [fetchPatients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Pacientes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los perfiles y el historial clínico
          </p>
        </div>
        <Button
          className="bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="size-4 mr-1.5" />
          Nuevo paciente
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          id="patient-search"
          type="search"
          placeholder="Buscar por nombre, teléfono o email…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[18px]" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-sm">
              {query ? "No se encontraron pacientes con ese criterio." : "No hay pacientes registrados aún."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const cfg = statusConfig[patient.status] ?? statusConfig.prospecto;
            const Icon = cfg.icon;
            return (
              <button
                key={patient.id}
                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                className="text-left"
              >
                <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer rounded-[18px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-heading text-base font-semibold truncate">
                        {patient.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${cfg.className}`}
                      >
                        <Icon className="size-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                    {patient.email && (
                      <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && patients.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {patients.length} paciente{patients.length !== 1 ? "s" : ""} mostrados
        </p>
      )}

      <CreatePatientModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => fetchPatients("")}
      />
    </div>
  );
}
