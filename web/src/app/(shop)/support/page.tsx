"use client";

import { useState } from "react";
import { createSupportTicket } from "@/lib/api";

export default function SupportPage() {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await createSupportTicket(null, form);
      setSent(true);
      setForm({ nom: "", email: "", telephone: "", sujet: "", message: "" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold text-navy-900">Support client</h1>
      <p className="mt-2 text-muted">Vous pouvez nous contacter même sans créer de compte.</p>
      {sent && <p className="mt-5 rounded-lg bg-success-light p-3 text-sm text-success-dark">Votre demande a bien été envoyée.</p>}
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <input required placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full rounded-lg border border-border p-3" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-border p-3" />
        <input placeholder="Téléphone (facultatif)" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="w-full rounded-lg border border-border p-3" />
        <input required placeholder="Sujet" value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })} className="w-full rounded-lg border border-border p-3" />
        <textarea required rows={6} placeholder="Décrivez votre problème" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-border p-3" />
        <button disabled={sending} className="rounded-lg bg-azure-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{sending ? "Envoi..." : "Envoyer au support"}</button>
      </form>
    </main>
  );
}
