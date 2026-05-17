import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  layout?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, layout = "vertical", size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: layout === "vertical" ? "w-8 h-8" : "w-6 h-6",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-sm",
    md: layout === "vertical" ? "text-xl mt-1" : "text-lg",
    lg: "text-2xl mt-1",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        layout === "vertical" ? "flex-col gap-1" : "flex-row gap-2.5",
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-primary", iconSizes[size])}
      >
        <path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "font-brand font-black tracking-[0.2em] text-primary leading-none select-none",
          textSizes[size],
          layout === "horizontal" && "pt-0.5"
        )}
      >
        ANCESTRO
      </span>
    </div>
  );
}
