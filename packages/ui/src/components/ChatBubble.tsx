export interface ChatBubbleProps {
  message: string;
  author: "me" | "agency";
  timestamp?: string;
}

export function ChatBubble({ message, author, timestamp }: ChatBubbleProps) {
  const isMe = author === "me";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 10
      }}
    >
      <div
        style={{
          maxWidth: 320,
          borderRadius: 16,
          padding: "10px 14px",
          color: isMe ? "#FFFFFF" : "#1A2B40",
          background: isMe ? "linear-gradient(135deg,#1A6FC4,#2582DB)" : "#FFFFFF",
          border: isMe ? "none" : "1px solid #D6E4F2"
        }}
      >
        <div>{message}</div>
        {timestamp ? (
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>{timestamp}</div>
        ) : null}
      </div>
    </div>
  );
}
