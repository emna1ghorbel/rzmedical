"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { ApiError, loginClient, registerClient } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, fieldClass } from "@/components/ui/Field";
import { AlertCircleIcon, EyeIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Valide une cible de redirection interne (évite les redirections ouvertes). */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/compte";
}

export function AuthView({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { login, isAuthenticated, ready } = useAuth();
  const { items, ready: cartReady } = useCart();
  const toast = useToast();

  const nextRaw = params.get("next") ?? params.get("redirect");
  const next = safeNext(nextRaw ?? (cartReady && items.length > 0 ? "/commande" : null));

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "",
    telephone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectingAfterSubmit = useRef(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Déjà connecté → redirection.
  useEffect(() => {
    if (ready && isAuthenticated && !redirectingAfterSubmit.current) {
      router.replace(next);
    }
  }, [ready, isAuthenticated, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    redirectingAfterSubmit.current = true;
    try {
      const res =
        mode === "login"
          ? await loginClient({
              email: form.email.trim(),
              motDePasse: form.motDePasse,
            })
          : await registerClient({
              email: form.email.trim(),
              motDePasse: form.motDePasse,
              prenom: form.prenom.trim(),
              nom: form.nom.trim(),
              telephone: form.telephone.trim() || undefined,
            });
      login(res);
      toast.success(
        mode === "login"
          ? "Connexion réussie."
          : "Compte créé. Votre panier est conservé.",
      );
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";
  const switchHref =
    (isLogin ? "/inscription" : "/connexion") +
    (nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : "");

  return (
    <Container className="py-8 lg:py-16 flex justify-center">
      <div className="w-full max-w-md lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-12 lg:items-stretch">
        {/* Left panel for desktop */}
        <div className="hidden lg:flex flex-col justify-between bg-navy-960 p-12 rounded-3xl text-white relative overflow-hidden select-none min-h-[580px] shadow-[0_20px_60px_rgba(0,0,0,0.15),_0_1px_0_rgba(255,255,255,0.1)_inset] border border-white/[0.05]">
          {/* Ambient Glows */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-azure-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 grid-pattern opacity-[0.15] pointer-events-none" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex transition-transform hover:scale-105" aria-label="Accueil RZmedical">
              <Logo tone="light" className="h-10 w-auto" />
            </Link>
            <h2 className="mt-14 text-4xl font-black font-display leading-[1.15] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-navy-200">
              La référence de l&apos;équipement médico-dentaire en Tunisie.
            </h2>
            <p className="mt-6 text-[15px] text-navy-200/80 leading-relaxed max-w-md">
              Accédez à notre catalogue professionnel, suivez vos commandes en temps réel et profitez de vos remises exclusives.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-8 mt-12">
            {[
              "Jusqu'à 15% de remise fidélité automatique",
              "Suivi complet de vos commandes & facturations",
              "Assistance prioritaire par nos conseillers techniques"
            ].map((feature, i) => (
              <div key={i} className="group flex gap-4 items-center rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3.5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1] hover:-translate-y-0.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-azure-500/30 to-azure-500/10 border border-azure-400/20 text-azure-300 shadow-[0_0_15px_rgba(14,165,233,0.15)] group-hover:scale-110 group-hover:text-white transition-all duration-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
                <p className="text-[13px] font-semibold text-navy-100 group-hover:text-white transition-colors">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form container (right side) */}
        <div className="flex flex-col justify-center w-full max-w-md mx-auto py-4 animate-reveal-up">
          <div className="mb-6 lg:hidden text-center">
            <Link href="/" className="inline-flex" aria-label="Accueil RZmedical">
              <Logo />
            </Link>
          </div>
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-navy-900">
              {isLogin ? "Connexion à votre compte" : "Créer un compte"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isLogin
                ? "Accédez à vos commandes et à vos tarifs personnalisés."
                : "Commandez en quelques clics et suivez vos livraisons."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-md shadow-navy-950/5 sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-light px-3.5 py-3 text-sm text-error-dark"
              >
                <AlertCircleIcon size={18} className="mt-0.5 shrink-0 text-error" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" htmlFor="prenom">
                    <input
                      id="prenom"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={form.prenom}
                      onChange={set("prenom")}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Nom" htmlFor="nom">
                    <input
                      id="nom"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={form.nom}
                      onChange={set("nom")}
                      className={fieldClass}
                    />
                  </Field>
                </div>
              )}

              <Field label="Adresse e-mail" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="vous@exemple.com"
                  className={fieldClass}
                />
              </Field>

              <Field
                label="Mot de passe"
                htmlFor="password"
                hint={!isLogin ? "6 car. min." : undefined}
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isLogin ? undefined : 6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={form.motDePasse}
                    onChange={set("motDePasse")}
                    className={cn(fieldClass, "pr-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-navy-50 hover:text-navy-700 cursor-pointer"
                  >
                    <EyeIcon size={18} />
                  </button>
                </div>
              </Field>

              {!isLogin && (
                <Field label="Téléphone" htmlFor="telephone" optional>
                  <input
                    id="telephone"
                    type="tel"
                    autoComplete="tel"
                    value={form.telephone}
                    onChange={set("telephone")}
                    placeholder="+216 …"
                    className={fieldClass}
                  />
                </Field>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="!mt-6"
              >
                {isLogin 
                  ? "Se connecter" 
                  : (nextRaw?.includes("/commande") ? "Confirmer la commande" : "Créer mon compte")
                }
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted lg:text-left lg:px-2">
            {isLogin ? "Pas encore de compte ? " : "Vous avez déjà un compte ? "}
            <Link
              href={switchHref}
              className="font-bold text-azure-600 transition-colors hover:text-azure-700"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </Link>
          </p>

          <p className="mt-5 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-faint lg:px-2">
            <ShieldCheckIcon size={14} />
            Vos données sont protégées et confidentielles.
          </p>
        </div>
      </div>
    </Container>
  );
}
