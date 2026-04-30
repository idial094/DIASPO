import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAgenceConversations } from "@diaspo/api";
import { getToken } from "@diaspo/store";
import { mobileTheme } from "../../theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

type Message = { id: string; projectId: string; author: string; text: string; timestamp: string };

export default function AgenceMessagesScreen() {
  const { data: conversations } = useAgenceConversations();
  const [activeProjectId, setActiveProjectId] = useState("p-001");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.projectId === activeProjectId),
    [conversations, activeProjectId]
  );

  // Reconnect WebSocket whenever the active project changes
  useEffect(() => {
    wsRef.current?.close();
    setMessages([]);
    setConnected(false);

    const token = getToken() ?? "";
    const ws = new WebSocket(`${WS_BASE}/ws/messages/${activeProjectId}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch {
        // ignore malformed frames
      }
    };

    return () => { ws.close(); };
  }, [activeProjectId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text }));
    setInput("");
  }, [input]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages agence</Text>
        <View style={[styles.dot, connected ? styles.dotGreen : styles.dotGrey]} />
      </View>
      <Text style={styles.subtitle}>
        {activeConversation ? `${activeConversation.clientName} — ${activeConversation.projectTitle}` : "Sélectionner une conversation"}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {conversations.map((item) => (
          <Pressable
            key={item.projectId}
            accessibilityLabel={`Ouvrir conversation ${item.clientName}`}
            onPress={() => setActiveProjectId(item.projectId)}
            style={[styles.chip, activeProjectId === item.projectId ? styles.chipActive : null]}
          >
            <Text style={[styles.chipText, activeProjectId === item.projectId ? styles.chipTextActive : null]}>
              {item.clientName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView ref={scrollRef} style={styles.chatCard} contentContainerStyle={{ gap: 10 }}>
        {messages.length === 0 ? <Text style={styles.info}>Aucun message.</Text> : null}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={msg.author === "agency" ? styles.bubbleMe : styles.bubbleClient}
          >
            <Text style={msg.author === "agency" ? styles.textMe : styles.textClient}>
              {msg.text}
            </Text>
            <Text style={[styles.ts, msg.author === "agency" ? styles.tsMeColor : styles.tsClientColor]}>
              {msg.timestamp}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Répondre au client..."
          style={styles.input}
          onSubmitEditing={handleSend}
          editable={connected}
        />
        <Pressable
          accessibilityLabel="Envoyer le message agence"
          style={[styles.sendBtn, !connected ? styles.sendBtnDisabled : null]}
          onPress={handleSend}
          disabled={!connected}
        >
          <Text style={styles.sendText}>Envoyer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.bg, padding: 16, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: mobileTheme.colors.text },
  dot: { width: 8, height: 8, borderRadius: 99 },
  dotGreen: { backgroundColor: "#1B7A45" },
  dotGrey: { backgroundColor: mobileTheme.colors.border },
  subtitle: { color: mobileTheme.colors.textMid, marginTop: -4 },
  tabs: { gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: mobileTheme.colors.white
  },
  chipActive: { backgroundColor: "#EAF4FF", borderColor: "#A9CFF4" },
  chipText: { color: mobileTheme.colors.text },
  chipTextActive: { color: mobileTheme.colors.blue, fontWeight: "700" },
  chatCard: {
    flex: 1,
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 10
  },
  bubbleClient: {
    alignSelf: "flex-start",
    maxWidth: "84%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 10
  },
  bubbleMe: {
    alignSelf: "flex-end",
    maxWidth: "84%",
    borderRadius: 16,
    backgroundColor: "#1B7A45",
    padding: 10
  },
  textClient: { color: mobileTheme.colors.text },
  textMe: { color: "#FFFFFF" },
  ts: { fontSize: 10, marginTop: 4 },
  tsMeColor: { color: "rgba(255,255,255,0.7)" },
  tsClientColor: { color: mobileTheme.colors.textMid },
  info: { color: mobileTheme.colors.textMid },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  sendBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#1B7A45" },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#FFFFFF", fontWeight: "700" }
});
