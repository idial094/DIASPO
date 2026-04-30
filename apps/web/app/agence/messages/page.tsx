"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, ChatBubble } from "@diaspo/ui";
import { InputField } from "@diaspo/ui/src/components/FormField";
import { useAgenceConversations } from "@diaspo/api";
import { getToken } from "@diaspo/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

type Message = { id: string; projectId: string; author: string; text: string; timestamp: string };
type Conversation = { projectId: string; projectTitle: string; clientName: string };

export default function AgenceMessagesPage() {
  const router = useRouter();
  const { data: conversations } = useAgenceConversations();
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Set initial active conversation
  useEffect(() => {
    if (!activeProjectId && conversations.length > 0) {
      setActiveProjectId((conversations[0] as Conversation).projectId);
    }
  }, [conversations, activeProjectId]);

  // Reconnect WebSocket when active project changes
  useEffect(() => {
    if (!activeProjectId) return;
    wsRef.current?.close();
    setMessages([]);
    setConnected(false);

    const token = getToken() ?? "";
    const ws = new WebSocket(`${WS_BASE}/ws/messages/${activeProjectId}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch { /* ignore */ }
    };

    return () => ws.close();
  }, [activeProjectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const activeConversation = useMemo(
    () => (conversations as Conversation[]).find((item) => item.projectId === activeProjectId),
    [conversations, activeProjectId]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text }));
    setInput("");
  }, [input]);

  return (
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/agence/projets")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Retour aux projets
      </button>
      <div className="flex items-center gap-2">
        <div>
          <h2>Messagerie clients</h2>
          <p className="mt-1 text-sm text-textMuted">Échanges avec la diaspora</p>
        </div>
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: connected ? "#1B7A45" : "#CBD5E1" }}
          title={connected ? "Connecté" : "Déconnecté"}
        />
      </div>
      <div className="grid gap-4 min-[981px]:grid-cols-[280px_1fr]">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue" />
            <h3>Conversations</h3>
          </div>
          <p className="mb-1 text-xs text-textMuted">Clients actifs</p>
          {(conversations as Conversation[]).map((item) => (
            <button
              key={item.projectId}
              type="button"
              onClick={() => setActiveProjectId(item.projectId)}
              className={`mt-2 flex w-full items-center justify-between rounded-[10px] border border-border px-2.5 py-2 text-left ${activeProjectId === item.projectId ? "bg-[#eaf4ff]" : "bg-white"}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF4FF] text-[11px] font-bold text-blue">
                  {initials(item.clientName)}
                </span>
                <p className="font-semibold">{item.clientName}</p>
                <p className="truncate text-xs text-slate-400">{item.projectTitle}</p>
              </div>
              <Badge tone="blue">{activeProjectId === item.projectId ? "Actif" : "Fil"}</Badge>
            </button>
          ))}
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green" />
            <h3>
            {activeConversation
              ? `${activeConversation.clientName}`
              : "Sélectionner une conversation"}
            </h3>
          </div>
          <div className="mt-2.5 max-h-[360px] overflow-y-auto">
            {messages.length === 0 ? <p className="text-sm text-slate-400">Aucun message.</p> : null}
            {messages.map((item) => (
              <ChatBubble
                key={item.id}
                message={item.text}
                author={item.author === "agency" ? "me" : "agency"}
                timestamp={item.timestamp}
              />
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="mt-3 flex gap-2.5">
            <InputField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Répondre au client..."
              disabled={!connected}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!connected || !input.trim()}
              className="rounded-xl border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-50"
            >
              ✉️
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}
