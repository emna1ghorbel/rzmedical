"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, forgotPassword } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, fieldClass } from "@/components/ui/Field";
import { AlertCircleIcon, ShieldCheckIcon } from "@/components/ui/icons";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-16 flex justify-center">
      <div className="w-full max-w-md animate-reveal-up">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Accueil RZmedical"><Logo /></Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-navy-900">Mot de passe oublie ?</h1>
          <p className="mt-2 text-sm text-muted">
            Entrez votre email et nous vous enverrons un lien de reinitialisation.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-md shadow-navy-950/5 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-azure-100">
                <svg className="h-8 w-8 text-azure-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy-900 mb-2">Email envoye !</h2>
              <p className="text-sm text-muted mb-2">
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un email avec un lien de reinitialisation.
              </p>
              <p className="text-xs text-faint">Le lien expire dans <strong>1 heure</strong>.</p>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-light px-3.5 py-3 text-sm text-error-dark">
                  <AlertCircleIcon size={18} className="mt-0.5 shrink-0 text-error" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <Field label="Adresse e-mail" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className={fieldClass}
                  />
                </Field>
                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="!mt-6">
                  Envoyer le lien de reinitialisation
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/connexion" className="font-bold text-azure-600 hover:text-azure-700 transition-colors">
            Retour a la connexion
          </Link>
        </p>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-faint">
          <ShieldCheckIcon size={14} />
          Vos donnees sont protegees et confidentielles.
        </p>
      </div>
    </Container>
  );
}
