"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, ChatBubble } from "@diaspo/ui";
import { InputField } from "@diaspo/ui/src/components/FormField";
import { useProjectMessages } from "@diaspo/api";
import { getToken } from "@diaspo/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");
const PROJECT_ID = "p-001";

type Message = { id: string; projectId: string; author: "me" | "agency" | "client"; text: string; timestamp: string };

export default function DiasporaMessagesPage() {
  const router = useRouter();
  const { data: initialMessages } = useProjectMessages(PROJECT_ID);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Seed from REST history on first load
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length]);

  // Open WebSocket
  useEffect(() => {
    const token = getToken() ?? "";
    const ws = new WebSocket(`${WS_BASE}/ws/messages/${PROJECT_ID}?token=${encodeURIComponent(token)}`);
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
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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
        onClick={() => router.push("/diaspora/dashboard")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Tableau de bord
      </button>
      <div className="flex items-center gap-2">
        <div>
          <h2>Messagerie</h2>
          <p className="mt-1 text-sm text-textMuted">Échanges sécurisés avec l'agence</p>
        </div>
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: connected ? "#1B7A45" : "#CBD5E1" }}
          title={connected ? "Connecté" : "Déconnecté"}
        />
      </div>
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <div className="text-sm font-semibold text-textMid">Agence Diaspo App - Conakry</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto pr-1">
          {messages.length === 0 ? <p className="text-sm text-slate-400">Aucun message.</p> : null}
          {messages.map((item) => (
            <ChatBubble
              key={item.id}
              message={item.text}
              author={item.author === "me" ? "me" : "agency"}
              timestamp={item.timestamp}
            />
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex gap-2.5">
          <InputField
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSend();
            }}
            placeholder="Écrivez votre message..."
            disabled={!connected}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="rounded-xl border-none bg-gradient-to-br from-blue to-blue-mid px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✉️
          </button>
        </div>
      </Card>
    </section>
  );
}
