"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, MailIcon } from "@/components/ui/icons";

/**
 * Inscription newsletter — présentation front-end. Aucun endpoint dédié côté
 * backend pour l'instant : la confirmation est locale (à brancher ultérieurement).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm text-white">
        <CheckCircleIcon size={20} className="shrink-0 text-azure-300" />
        Merci ! Vous recevrez bientôt nos actualités.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <MailIcon
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre adresse e-mail"
          aria-label="Votre adresse e-mail"
          className="h-11 w-full rounded-lg border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-navy-300 focus:border-azure-400 focus:bg-white/10"
        />
      </div>
      <Button type="submit" variant="accent" className="shrink-0">
        S'inscrire
      </Button>
    </form>
  );
}
