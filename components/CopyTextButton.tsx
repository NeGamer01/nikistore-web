"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="icon-button ghost wide" type="button" onClick={copy}>
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? "Tersalin" : label}
    </button>
  );
}
