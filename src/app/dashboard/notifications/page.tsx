"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationChat } from "@/components/chat/ConversationChat";
import { MessageSquare, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import type { Conversation, Patient } from "@/lib/types";

const channelConfig: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "text-emerald-600" },
  messenger: { label: "Messenger", color: "text-blue-600" },
  instagram: { label: "Instagram", color: "text-pink-600" },
  tiktok: { label: "TikTok", color: "text-black" },
  web: { label: "Web Chat", color: "text-primary" },
};

const statusConfig: Record<string, { label: string; icon: typeof MessageSquare; className: string }> = {
  active: { label: "Activa", icon: MessageSquare, className: "bg-blue-50 text-blue-700 border-blue-200" },
  pending_human: { label: "Pendiente", icon: AlertTriangle, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  resolved: { label: "Resuelta", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

/**
 * Bandeja de todas las conversaciones con filtros por estado.
 */
export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const setPendingConversations = useNotificationStore((s) => s.setPendingConversations);
  const removePendingConversation = useNotificationStore((s) => s.removePendingConversation);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [activeChat, setActiveChat] = useState<{ conversation: Conversation; patient: Patient } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("*, patient:patients(id, name, phone)")
          .order("last_message_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("Conversations query error:", (error as Error).message);
        }
        if (data) {
          setConversations(data as Conversation[]);
          // Also update the store with pending ones
          const pending = data.filter((c) => c.status === "pending_human");
          setPendingConversations(pending as Conversation[]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: "status=eq.pending_human" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, setPendingConversations]);

  const markResolved = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ status: "resolved" })
      .eq("id", conversationId);

    if (error) {
      toast.error("Error al marcar como resuelto.");
      return;
    }

    removePendingConversation(conversationId);
    toast.success("Conversación marcada como resuelta.");
  }, [supabase, removePendingConversation]);

  const filtered = useMemo(() => {
    return activeTab === "all"
      ? conversations
      : conversations.filter((c) => c.status === activeTab);
  }, [activeTab, conversations]);

  const counts = useMemo(() => {
    return {
      all: conversations.length,
      active: conversations.filter((c) => c.status === "active").length,
      pending_human: conversations.filter((c) => c.status === "pending_human").length,
      resolved: conversations.filter((c) => c.status === "resolved").length,
    };
  }, [conversations]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">
          Conversaciones
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Todas las conversaciones del consultorio por canal
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 rounded-[12px] w-full sm:w-auto">
          <TabsTrigger value="all" className="text-xs">
            Todas ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Activas ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="pending_human" className="text-xs">
            Pendientes ({counts.pending_human})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">
            Resueltas ({counts.resolved})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-[18px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                <CheckCircle className="size-10 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  {activeTab === "all"
                    ? "Sin conversaciones"
                    : activeTab === "pending_human"
                    ? "Sin conversaciones pendientes"
                    : `Sin conversaciones ${statusConfig[activeTab]?.label.toLowerCase() ?? ""}`}
                </p>
                <p className="text-muted-foreground text-sm text-center max-w-xs">
                  {activeTab === "pending_human"
                    ? "Todas las conversaciones están resueltas o siendo atendidas por el agente IA."
                    : "No hay conversaciones en esta categoría aún."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((conv) => {
                const ch = channelConfig[conv.channel] ?? { label: conv.channel, color: "text-muted" };
                const st = statusConfig[conv.status] ?? statusConfig.active;
                const StatusIcon = st.icon;
                const patient = conv.patient;

                return (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (patient) {
                        setActiveChat({ conversation: conv, patient: patient as Patient });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (patient) {
                          setActiveChat({ conversation: conv, patient: patient as Patient });
                        }
                      }
                    }}
                    className="w-full text-left cursor-pointer"
                  >
                  <Card
                    className={`rounded-[18px] transition-colors hover:bg-muted/40 cursor-pointer ${
                      conv.status === "pending_human"
                        ? "border-secondary/30 bg-secondary/5"
                        : "border-border"
                    }`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MessageSquare className="size-4 text-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-foreground">
                                {patient?.name ?? "Paciente desconocido"}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${ch.color} border-current/30`}
                              >
                                {ch.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${st.className}`}
                              >
                                <StatusIcon className="size-3 mr-0.5" />
                                {st.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {patient?.phone ?? "—"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="size-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(conv.last_message_at), "dd MMM · HH:mm", {
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {conv.status === "pending_human" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              markResolved(conv.id);
                            }}
                            className="rounded-[12px] text-xs flex-shrink-0"
                          >
                            <CheckCircle className="size-3 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {activeChat && (
        <ConversationChat
          conversation={activeChat.conversation}
          patient={activeChat.patient}
          open={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
