import { Container } from "@/components/ui/Container";
import { NewsletterForm } from "./NewsletterForm";

export function NewsletterSection() {
  return (
    <section className="border-t border-gray-200 bg-gray-50 py-12">
      <Container className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Restez informé
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Recevez nos nouveautés, offres spéciales et actualités sur le matériel médical et dentaire directement dans votre boîte mail.
          </p>
        </div>
        <div className="w-full max-w-md shrink-0">
          <NewsletterForm />
        </div>
      </Container>
    </section>
  );
}
