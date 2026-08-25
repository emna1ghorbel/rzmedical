"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { XIcon } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function AccountInvitationAlert() {
  const { isAuthenticated, ready } = useAuth();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) return;

    // Show immediately for every unauthenticated page load
    setShow(true);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [ready, isAuthenticated]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <>
      {/* Dark overlay — click to close */}
      <div
        className={cn(
          "fixed inset-0 z-[98] bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={dismiss}
      />

      {/* Centered card */}
      <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-[700px] transition-all duration-300 ease-out",
            visible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4"
          )}
        >
          <div className="flex items-center gap-4 sm:gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl ring-1 ring-black/5">

            {/* Image */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
              <Image
                src="/images/medical_invitation_icon.jpg"
                alt="RZMedical"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-navy-900 leading-tight">
                Créez votre compte RZMedical
              </h3>
              <p className="mt-1 text-sm sm:text-base text-slate-500">
                Profitez d&apos;une expérience plus personnalisée.
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/inscription"
                onClick={dismiss}
                className={cn(
                  buttonVariants({ variant: "primary", size: "md" }),
                  "whitespace-nowrap text-sm sm:text-base font-semibold rounded-xl shadow-sm"
                )}
              >
                Créer un compte
              </Link>

              <button
                type="button"
                onClick={dismiss}
                aria-label="Fermer"
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-500"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
