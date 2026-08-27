"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { ApiError, resetPassword } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, fieldClass } from "@/components/ui/Field";
import { AlertCircleIcon, EyeIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function ResetPasswordView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const token = params.get("token") ?? "";

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien de reinitialisation invalide. Veuillez refaire une demande.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caracteres.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
      toast.success("Mot de passe reinitialise !");
      setTimeout(() => router.push("/connexion"), 2500);
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
          <h1 className="text-2xl font-bold text-navy-900">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted">
            Choisissez un nouveau mot de passe securise pour votre compte.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-md shadow-navy-950/5 sm:p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy-900 mb-2">Mot de passe mis a jour !</h2>
              <p className="text-sm text-muted">Redirection vers la page de connexion...</p>
            </div>
          ) : (
            <>
              {!token && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-light px-3.5 py-3 text-sm text-error-dark">
                  <AlertCircleIcon size={18} className="mt-0.5 shrink-0 text-error" />
                  <span>Lien invalide. Veuillez faire une nouvelle demande de reinitialisation.</span>
                </div>
              )}

              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-light px-3.5 py-3 text-sm text-error-dark">
                  <AlertCircleIcon size={18} className="mt-0.5 shrink-0 text-error" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <Field label="Nouveau mot de passe" htmlFor="new-password" hint="6 car. min.">
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={form.newPassword}
                      onChange={set("newPassword")}
                      className={cn(fieldClass, "pr-11")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Masquer" : "Afficher"}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-navy-50 hover:text-navy-700 cursor-pointer"
                    >
                      <EyeIcon size={18} />
                    </button>
                  </div>
                </Field>

                <Field label="Confirmer le mot de passe" htmlFor="confirm-password">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={set("confirm")}
                    className={fieldClass}
                  />
                </Field>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={!token}
                  className="!mt-6"
                >
                  Enregistrer le nouveau mot de passe
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/mot-de-passe-oublie" className="font-medium text-azure-600 hover:text-azure-700 transition-colors">
            Renvoyer un email de reinitialisation
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
