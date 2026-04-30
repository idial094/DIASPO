import { useEffect, useRef, useState, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useProjectMessages } from "@diaspo/api";
import { getToken } from "@diaspo/store";
import { mobileTheme } from "../../theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

type Message = { id: string; projectId: string; author: string; text: string; timestamp: string };

const PROJECT_ID = "p-001";

export default function DiasporaMessagesScreen() {
  const { data: initialMessages } = useProjectMessages(PROJECT_ID);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
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
  }, []);

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
        <Text style={styles.title}>Messages</Text>
        <View style={[styles.dot, connected ? styles.dotGreen : styles.dotGrey]} />
      </View>

      <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={{ gap: 10 }}>
        {messages.length === 0 ? <Text style={styles.info}>Aucun message.</Text> : null}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={msg.author === "me" ? styles.bubbleMe : styles.bubbleAgency}
          >
            <Text style={msg.author === "me" ? styles.textMe : styles.textAgency}>
              {msg.text}
            </Text>
            <Text style={[styles.ts, msg.author === "me" ? styles.tsMeColor : styles.tsAgencyColor]}>
              {msg.timestamp}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Écrivez votre message..."
          style={styles.input}
          onSubmitEditing={handleSend}
          editable={connected}
        />
        <Pressable
          accessibilityLabel="Envoyer le message"
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
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: mobileTheme.colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: mobileTheme.colors.text },
  dot: { width: 8, height: 8, borderRadius: 99 },
  dotGreen: { backgroundColor: "#1B7A45" },
  dotGrey: { backgroundColor: mobileTheme.colors.border },
  list: { flex: 1 },
  info: { color: mobileTheme.colors.textMid },
  bubbleAgency: {
    alignSelf: "flex-start",
    maxWidth: "84%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.white,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  bubbleMe: {
    alignSelf: "flex-end",
    maxWidth: "84%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: mobileTheme.colors.blue
  },
  textAgency: { color: mobileTheme.colors.text },
  textMe: { color: "#FFFFFF" },
  ts: { fontSize: 10, marginTop: 4 },
  tsMeColor: { color: "rgba(255,255,255,0.7)" },
  tsAgencyColor: { color: mobileTheme.colors.textMid },
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
  sendBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: mobileTheme.colors.blue
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#FFFFFF", fontWeight: "700" }
});
