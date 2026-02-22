import { useState } from "react";
import inboxIllustration from "./assets/undraw_inbox-cleanup.svg";

type EmailItem = {
  id: number;
  subject?: string;
  from?: string;
  content: string;
  summary: string;
  urgency: string;
  intent?: string;
  reason: string;
  actions?: string[];
};

type SentItem = {
  email_id: number;
  intent: string;
  draft: string;
  status: string;
  sent_at: string;
};

type FollowUp = {
  normal_emails_count: number;
  suggested_time: string;
  message: string;
};

function App() {
  const [rawText, setRawText] = useState("");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approveStatus, setApproveStatus] = useState<string | null>(null);
  const [modalDraft, setModalDraft] = useState("");
  const [modalEmailId, setModalEmailId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const urgentEmails = emails.filter((e) => e.urgency === "urgent");
  const normalEmails = emails.filter((e) => e.urgency === "normal");
  const lowEmails = emails.filter((e) => e.urgency === "low");

  const [sentLog, setSentLog] = useState<SentItem[]>([]);
  const [sentLogOpen, setSentLogOpen] = useState(false);
  const [sentLogLoading, setSentLogLoading] = useState(false);
  const [sentJustNow, setSentJustNow] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");
  const [analyzeHover, setAnalyzeHover] = useState(false);

  const API_BASE = "http://127.0.0.1:8000";
  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 16,
    backdropFilter: "blur(6px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.75)",
  };
  const innerCardStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 14,
    border: "1px solid rgba(0, 0, 0, 0.06)",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
  };

  async function loadDemo() {
    setError(null);

    try {
      const clearRes = await fetch(`${API_BASE}/emails/sent/clear`, {
        method: "POST",
      });
      if (!clearRes.ok) throw new Error("Clear failed");
      setSentLog([]);

      const res = await fetch(`${API_BASE}/emails/demo`);
      const data = await res.json();
      setRawText(data.raw_text);
    } catch {
      setError("Failed to load demo emails.");
    }
  }

  async function analyzeEmails() {
    setLoading(true);
    setError(null);
    if (rawText !== lastAnalyzedText) {
      const clearRes = await fetch(`${API_BASE}/emails/sent/clear`, {
        method: "POST",
      });
      if (!clearRes.ok) throw new Error("Clear failed");
      setSentLog([]);
      setLastAnalyzedText(rawText);
    }

    setSentLogOpen(false);
    setSentLog([]);

    try {
      const res = await fetch(`${API_BASE}/emails/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawText }),
      });

      const data = await res.json();
      setEmails(data.emails);
      setFollowUp(data.follow_up ?? null);
    } catch {
      setError("Failed to analyze emails.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSentLog() {
    setSentLogLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/emails/sent`);
      const data = await res.json();
      setSentLog(data.items ?? []);
      setSentLogOpen(true);
    } catch {
      setError("Failed to load sent log.");
    } finally {
      setSentLogLoading(false);
    }
  }

  async function clearSentLog() {
    setError(null);
    setSentLogLoading(true);
    setSentLogOpen(false);

    try {
      const res = await fetch(`${API_BASE}/emails/sent/clear`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Clear failed");
      }

      setSentLog([]);
    } catch {
      setError("Failed to clear outbox.");
    } finally {
      setSentLogLoading(false);
    }
  }

  async function suggestReply(email: EmailItem) {
    setModalOpen(true);
    setApproveStatus(null);
    setSentJustNow(false);
    setModalEmailId(email.id);
    setModalDraft("");
    setModalLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/emails/reply/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_content: email.content,
          urgency: email.urgency,
          intent: email.intent,
        }),
      });

      const data = await res.json();

      if (data.draft) {
        setModalDraft(data.draft);
      } else {
        setModalDraft(data.message ?? "No draft available.");
      }
    } catch {
      setModalDraft("Failed to get reply suggestion.");
    } finally {
      setModalLoading(false);
    }
  }
  function cleanFormatting() {
    const cleaned = rawText
      .replace(/\n{2,}/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    setRawText(cleaned);
  }

  async function approveAndSend() {
    if (modalEmailId == null) return;

    setApproveStatus("Sending...");
    try {
      const email = emails.find((e) => e.id === modalEmailId);
      const intent = email?.intent ?? "default";

      const res = await fetch(`${API_BASE}/emails/reply/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_id: modalEmailId,
          intent,
          draft: modalDraft,
        }),
      });

      const data = await res.json();
      setApproveStatus(data.message ?? "Marked as sent (simulated).");
      setEmails((prev) => prev.filter((e) => e.id !== modalEmailId));
      setTimeout(() => setModalOpen(false), 800);
      setSentJustNow(true);
      if (sentLogOpen) {
        await loadSentLog();
      }
    } catch {
      setApproveStatus("Failed to approve/send.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: `
          linear-gradient(
            165deg,
           #e9eef1 0%,
           #cfdde2 35%,
           #b8cfd3 65%,
           #a8c1c6 100%
          )
        `,
        padding: "32px 24px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "40px",
          width: "min(520px, 42vw)",
          height: "100vh",
          opacity: 0.48,
          mixBlendMode: "multiply",
          pointerEvents: "none",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={inboxIllustration}
          alt="Inbox cleanup illustration"
          style={{
            width: "100%",
            maxWidth: 640,
            filter: "brightness(0.85) contrast(1.45)",
          }}
        />
      </div>
      <div
        style={{
          maxWidth: 900,
          padding: 32,
          flex: "0 1 900px",
          transform: "translateX(clamp(0px, 12vw, 220px))",
        }}
      >
        <h1>Email AI Assistant</h1>

        <div
          style={{
            ...cardStyle,
            padding: 12,
            marginBottom: 8,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <textarea
            rows={10}
            style={{
              width: "100%",
              marginBottom: 4,
              background: "transparent",
              border: "none",
              outline: "none",
            }}
            placeholder="Paste your emails here or load demo data..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <p
          style={{
            fontSize: 18,
            marginTop: 6,
            color: "#1f2933",
          }}
        >
          <span style={{ color: "#b00020", fontWeight: 600 }}>Important:</span>{" "}
          Always use{" "}
          <span style={{ color: "#b00020", fontWeight: 600 }}>
            Clean formatting
          </span>{" "}
          after pasting emails. You can separate multiple emails with{" "}
          <code>---</code>.
        </p>

        <div style={{ marginBottom: 16 }}>
          <button onClick={loadDemo} style={{ marginRight: 8 }}>
            Load demo
          </button>

          <button onClick={cleanFormatting} style={{ marginRight: 8 }}>
            Clean formatting
          </button>

          <button
            onClick={analyzeEmails}
            disabled={loading}
            onMouseEnter={() => setAnalyzeHover(true)}
            onMouseLeave={() => setAnalyzeHover(false)}
            style={{
              marginRight: 8,
              padding: "0.6em 1.4em",
              borderRadius: 10,
              border: "none",
              color: "#fff",
              fontWeight: 600,
              background: "linear-gradient(90deg, #2ecc71, #3498db)",
              cursor: "pointer",
              transition: "filter 0.2s ease, transform 0.15s ease",
              filter: analyzeHover ? "brightness(1.18)" : "none",
              transform: analyzeHover ? "translateY(-1px)" : "none",
              boxShadow: analyzeHover
                ? "0 10px 26px rgba(46, 204, 113, 0.25)"
                : "none",
            }}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button onClick={loadSentLog} disabled={sentLogLoading}>
            {sentLogLoading ? "Loading log..." : "Outbox"}
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <hr />

        <h2>Results</h2>

        {sentLogOpen && (
          <div
            style={{
              ...cardStyle,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <strong>Outbox (simulated)</strong>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSentLogOpen(false)}>Close</button>

                <button
                  onClick={clearSentLog}
                  disabled={sentLog.length === 0}
                  style={{ color: "#b00020" }}
                  title="Demo helper: clears the simulated outbox"
                >
                  Clear (demo)
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              This is a demo-only outbox. No real emails are sent.
            </p>

            {sentLog.length === 0 ? (
              <p style={{ marginTop: 8 }}>No sent items yet.</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {sentLog.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <div>
                      <strong>Email:</strong> {item.email_id}
                    </div>
                    <div>
                      <strong>Intent:</strong> {item.intent}
                    </div>
                    <div>
                      <strong>Sent at:</strong> {item.sent_at}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {emails.length === 0 && <p>No emails analyzed yet.</p>}

        {urgentEmails.map((email) => (
          <div
            key={email.id}
            style={{ ...cardStyle, padding: 12, marginBottom: 12 }}
          >
            <h3 style={{ margin: "0 0 4px 0" }}>
              {email.subject ?? "No subject"}
            </h3>

            {email.from && (
              <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 13 }}>
                <strong>From:</strong> {email.from}
              </p>
            )}

            <p style={{ margin: "4px 0", color: "#555", fontSize: 14 }}>
              <strong>Summary:</strong> {email.summary}
            </p>

            <p style={{ margin: "4px 0" }}>
              <strong>Urgency:</strong> {email.urgency}
            </p>

            <p style={{ margin: "4px 0", color: "#444" }}>{email.reason}</p>

            {email.actions?.includes("suggest_reply_now") && (
              <button onClick={() => suggestReply(email)}>Suggest reply</button>
            )}
          </div>
        ))}

        {followUp && followUp.normal_emails_count > 0 && (
          <div
            style={{
              ...cardStyle,
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
            }}
          >
            <strong>Follow-up</strong>
            <p style={{ margin: "6px 0" }}>{followUp.message}</p>
            <p style={{ margin: 0, color: "#444" }}>
              Suggested time: {followUp.suggested_time}
            </p>
          </div>
        )}

        {normalEmails.map((email) => (
          <div
            key={email.id}
            style={{ ...cardStyle, padding: 12, marginBottom: 12 }}
          >
            <h3 style={{ margin: "0 0 4px 0" }}>
              {email.subject ?? "No subject"}
            </h3>

            {email.from && (
              <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 13 }}>
                <strong>From:</strong> {email.from}
              </p>
            )}

            <p style={{ margin: "4px 0", color: "#555", fontSize: 14 }}>
              <strong>Summary:</strong> {email.summary}
            </p>

            <p style={{ margin: "4px 0" }}>
              <strong>Urgency:</strong> {email.urgency}
            </p>

            <p style={{ margin: "4px 0", color: "#444" }}>{email.reason}</p>
          </div>
        ))}

        {lowEmails.map((email) => (
          <div
            key={email.id}
            style={{ ...cardStyle, padding: 12, marginBottom: 12 }}
          >
            <h3 style={{ margin: "0 0 4px 0" }}>
              {email.subject ?? "No subject"}
            </h3>

            {email.from && (
              <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 13 }}>
                <strong>From:</strong> {email.from}
              </p>
            )}

            <p style={{ margin: "4px 0", color: "#555", fontSize: 14 }}>
              <strong>Summary:</strong> {email.summary}
            </p>

            <p style={{ margin: "4px 0" }}>
              <strong>Urgency:</strong> {email.urgency}
            </p>

            <p style={{ margin: "4px 0", color: "#444" }}>{email.reason}</p>
          </div>
        ))}

        {modalOpen && (
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 700,
                backgroundColor: "rgba(255, 255, 255, 0.78)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>Reply draft</h3>
              </div>

              <p style={{ marginTop: 8, color: "#444" }}>
                Email: {modalEmailId ?? "-"}
              </p>

              {modalLoading ? (
                <p>Generating draft...</p>
              ) : (
                <div
                  style={{ ...innerCardStyle, padding: 12, overflow: "hidden" }}
                >
                  <textarea
                    rows={10}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      fontSize: "14px",
                    }}
                    value={modalDraft}
                    onChange={(e) => setModalDraft(e.target.value)}
                  />
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button onClick={() => setModalOpen(false)}>Close</button>
                <button
                  onClick={approveAndSend}
                  disabled={modalLoading || !modalDraft.trim() || sentJustNow}
                >
                  {sentJustNow ? "Sent ✓" : "Approve & send"}
                </button>
              </div>
              {approveStatus && (
                <p style={{ marginTop: 8, color: "#444" }}>{approveStatus}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
