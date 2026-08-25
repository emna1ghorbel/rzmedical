import { imageUrl } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { cn } from "@/lib/cn";

/** Bandeau catalogue premium avec effets 3D et ambiants. */
export function SubcategoryBanner({
  name,
  image,
  breadcrumb,
  titleAs = "h1",
}: {
  name: string;
  image?: string | null;
  breadcrumb: BreadcrumbItem[];
  titleAs?: "h1" | "p";
}) {
  const Title = titleAs;
  const bg = image ? imageUrl(image) : null;

  return (
    <>
      <section
        className={cn(
          "relative flex items-center justify-center overflow-hidden border-b border-white/[0.08]",
          bg ? "min-h-[7.5rem] sm:min-h-[8.5rem]" : "min-h-[6.5rem] sm:min-h-[7.5rem] bg-slate-900",
        )}
        style={{
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
        }}
      >
        {/* Background base & image */}
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center scale-105 blur-[2px]"
          />
        ) : (
          <div className="absolute inset-0 grid-pattern opacity-[0.15] pointer-events-none" />
        )}

        {/* Overlays and gradients */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 z-0",
            bg
              ? "bg-gradient-to-r from-navy-960/85 via-navy-960/60 to-navy-960/85"
              : "bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950"
          )}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-azure-500/30 blur-[60px] pointer-events-none z-0" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-azure-400/20 blur-[60px] pointer-events-none z-0" />

        {/* Animated scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-azure-400/30 to-transparent animate-[scanLine_5s_ease-in-out_infinite]" />
        </div>

        {/* Gloss Top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-10" />

        {/* Content */}
        <Container className="relative z-10 py-5 sm:py-6">
          <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-azure-400/30 bg-azure-500/10 px-3.5 py-1 mb-3 select-none backdrop-blur-sm shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-azure-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-azure-300">
                Sélection du catalogue
              </span>
            </div>
            
            <Title className="font-display text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-3xl">
              {name}
            </Title>
          </div>
        </Container>
      </section>

      {/* Breadcrumb section */}
      <nav className="border-b border-slate-200/80 bg-slate-50/50 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-white/50 pointer-events-none" />
        <Container className="py-2.5">
          <Breadcrumb items={breadcrumb} className="mb-0 text-[12px] sm:text-[13px]" />
        </Container>
      </nav>
    </>
  );
}
