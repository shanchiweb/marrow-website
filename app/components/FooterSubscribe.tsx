"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

const HINT = "Submit your email address so we can get in touch with you.";

export function FooterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const value = email.trim();
    if (!value) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          source: window.location.pathname,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage("Thank you — we've received your email.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const note =
    status === "idle"
      ? HINT
      : status === "submitting"
        ? "Sending…"
        : message;

  return (
    <form className="site-footer__email" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="footer-email">
        Email address
      </label>
      <div className="site-footer__email-row">
        <input
          id="footer-email"
          type="email"
          name="email"
          placeholder="name@email.com"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setMessage("");
            }
          }}
          aria-invalid={status === "error"}
          disabled={status === "submitting"}
        />
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending" : "Submit"}
        </button>
      </div>
      <p className={`site-footer__note is-${status}`} role="status" aria-live="polite">
        {note}
      </p>
    </form>
  );
}
