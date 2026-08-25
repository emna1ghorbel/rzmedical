"use client";

// Boundary de dernier recours : remplace le layout racine si celui-ci échoue.
// Doit rendre ses propres <html>/<body> et ne peut pas dépendre du CSS global
// → styles en ligne pour rester robuste. (Next 16 fournit `retry`.)

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f8fafc",
          color: "#0c2340",
        }}
      >
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#2196d2",
            }}
          >
            RZMedical
          </div>
          <h1 style={{ margin: "20px 0 0", fontSize: "26px", fontWeight: 700 }}>
            Une erreur est survenue
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#64748b",
            }}
          >
            Un problème inattendu nous empêche d&apos;afficher cette page. Veuillez
            réessayer dans un instant.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: "28px",
              height: "48px",
              padding: "0 24px",
              borderRadius: "8px",
              border: "none",
              background: "#0c2340",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
