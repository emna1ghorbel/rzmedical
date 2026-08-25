"use client";

import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";

export default function CatalogueError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState
        title="Impossible de charger le catalogue"
        description={
          error.message ||
          "Une erreur est survenue lors du chargement des produits. Veuillez réessayer."
        }
        retry={retry}
      />
    </Container>
  );
}
