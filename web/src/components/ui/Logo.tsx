import Image from "next/image";
import { cn } from "@/lib/cn";

type Tone = "dark" | "light";
type Variant = "full" | "mark" | "word";

/**
 * Logo RZMedical
 * Utilise l'image réelle (logo-rzmedical.png)
 */
export function Logo({
  variant = "full",
  tone = "dark",
  className,
}: {
  variant?: Variant;
  tone?: Tone;
  className?: string;
}) {
  const isLight = tone === "light";

  // On utilise le même logo partout puisqu'il s'agit du logo officiel fourni.
  // Ratio de l'image approximatif : 4:3
  return (
    <div className={cn(
      "relative flex items-center h-12 w-[80px] shrink-0 sm:h-14 sm:w-[100px]",
      isLight && "bg-white rounded-xl px-2 py-1 shadow-sm", // Add a white pill background for dark themes
      className
    )}>
      <Image
        src="/images/logo/logo-rzmedical.png"
        alt="RZmedical"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );
}
