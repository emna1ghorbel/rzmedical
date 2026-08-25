import React from "react";
import Link from "next/link";

interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  baseClassName = "",
  className = "",
  children,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  const combinedClass = `${baseClassName} ${className}`.trim();

  if (tag === "a" && href) {
    return (
      <Link href={href} onClick={handleClick} className={combinedClass}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClass}>
      {children}
    </button>
  );
};
