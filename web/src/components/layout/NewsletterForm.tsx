"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, MailIcon } from "@/components/ui/icons";
import { API_URL } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      alert('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        <CheckCircleIcon size={20} className="shrink-0 text-green-600" />
        Merci pour votre inscription !
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <MailIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre adresse e-mail"
          aria-label="Votre adresse e-mail"
          className="h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-azure-500 focus:ring-1 focus:ring-azure-500"
        />
      </div>
      <Button type="submit" variant="primary" disabled={loading} className="h-11 shrink-0 rounded-md px-6 shadow-sm">
        S'inscrire
      </Button>
    </form>
  );
}
