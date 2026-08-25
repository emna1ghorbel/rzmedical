"use client";

import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ProduitError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState
        title="Impossible d'afficher ce produit"
        description={
          error.message ||
          "Une erreur est survenue lors du chargement du produit. Veuillez réessayer."
        }
        retry={retry}
      />
    </Container>
  );
}
