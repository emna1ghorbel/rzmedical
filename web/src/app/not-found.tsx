import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { buttonVariants } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-1 flex-col items-center justify-center py-20 text-center">
      <Link href="/" aria-label="Accueil RZmedical" className="inline-flex">
        <Logo />
      </Link>
      <p className="mt-10 font-display text-7xl font-bold leading-none text-navy-100">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-navy-900">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-muted">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/catalogue"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Voir le catalogue
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </Container>
  );
}
