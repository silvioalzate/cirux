"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Message, Conversation, Patient } from "@/lib/types";

interface ConversationChatProps {
  conversation: Conversation;
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

export function ConversationChat({ conversation, patient, open, onClose }: ConversationChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, patient_id, conversation_id, channel, direction, type, content, transcript, created_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data as Message[]);
    setIsLoading(false);
  }, [patient.id, supabase]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      void loadMessages();

      const channel = supabase
        .channel(`chat-${conversation.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `patient_id=eq.${patient.id}` },
          () => void loadMessages()
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
        abortRef.current?.abort();
      };
    }
  }, [open, conversation.id, loadMessages, patient.id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    const phone = patient.phone.replace(/^\+/, "");

    // Optimistic: add message to list immediately
    const optimisticMsg: Message = {
      id: `opt-${Date.now()}`,
      patient_id: patient.id,
      conversation_id: conversation.id,
      channel: conversation.channel,
      direction: "out",
      type: "text",
      content: trimmed,
      audio_url: null,
      transcript: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const res = await fetch("/api/v1/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          number: phone,
          text: trimmed,
          patientId: patient.id,
          conversationId: conversation.id,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Error al enviar mensaje");
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setText(trimmed);
      }
    } catch {
      toast.error("Error de conexión al enviar mensaje");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  }, [conversation.channel, conversation.id, patient.id, patient.phone, text]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <p className="font-heading font-semibold text-sm text-foreground">
            {patient.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {patient.phone} · {conversation.channel}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-[10px]"
          aria-label="Cerrar chat"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={`h-12 rounded-[12px] ${i % 2 === 0 ? "w-3/4" : "w-2/3 ml-auto"}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground text-center">
              Sin mensajes aún. <br /> Envía el primer mensaje.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-[12px] px-3 py-2 text-sm ${
                  msg.direction === "out"
                    ? "bg-primary/15 text-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1 text-right">
                  {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="rounded-[12px] text-sm flex-1"
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={() => void handleSend()}
            disabled={!text.trim() || isSending}
            className="rounded-[12px] bg-primary text-[#0D141D] hover:bg-primary/80 shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
