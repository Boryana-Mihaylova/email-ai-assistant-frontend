import type { CSSProperties } from "react";

export const cardStyle: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.65)",
  borderRadius: 16,
  backdropFilter: "blur(6px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.75)",
};

export const innerCardStyle: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  borderRadius: 14,
  border: "1px solid rgba(0, 0, 0, 0.06)",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
};

export const primaryButtonBase: CSSProperties = {
  padding: "0.6em 1.4em",
  borderRadius: 10,
  border: "none",
  color: "#fff",
  outline: "none",
  fontWeight: 600,
  background: "linear-gradient(90deg, #2ecc71, #3498db)",
  cursor: "pointer",
  transition: "filter 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
};

export const secondaryButtonBase: CSSProperties = {
  padding: "0.55em 1.3em",
  borderRadius: 10,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(235,240,242,0.92))",
  border: "1px solid rgba(0,0,0,0.14)",
  color: "#1f2933",
  fontWeight: 500,
  cursor: "pointer",
  transition: "filter 0.2s ease",
};
