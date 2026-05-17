import React from "react";
import { cn } from "@/lib/utils";

interface OrbProps {
  dimension?: string;
  className?: string;
  tones?: {
    base?: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
  };
  spinDuration?: number;
}

const ColorOrb: React.FC<OrbProps> = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = {
    base: "oklch(95% 0.02 264.695)",
    accent1: "oklch(75% 0.15 350)",
    accent2: "oklch(80% 0.12 200)",
    accent3: "oklch(78% 0.14 280)",
  };

  const palette = { ...fallbackTones, ...tones };

  const dimValue = parseInt(dimension.replace("px", ""), 10);

  const blurStrength =
    dimValue < 50
      ? Math.max(dimValue * 0.008, 1)
      : Math.max(dimValue * 0.015, 4);

  const contrastStrength =
    dimValue < 50
      ? Math.max(dimValue * 0.004, 1.2)
      : Math.max(dimValue * 0.008, 1.5);

  const pixelDot =
    dimValue < 50
      ? Math.max(dimValue * 0.004, 0.05)
      : Math.max(dimValue * 0.008, 0.1);

  const shadowRange =
    dimValue < 50
      ? Math.max(dimValue * 0.004, 0.5)
      : Math.max(dimValue * 0.008, 2);

  const maskRadius =
    dimValue < 30
      ? "0%"
      : dimValue < 50
        ? "5%"
        : dimValue < 100
          ? "15%"
          : "25%";

  const adjustedContrast =
    dimValue < 30
      ? 1.1
      : dimValue < 50
        ? Math.max(contrastStrength * 1.2, 1.3)
        : contrastStrength;

  return (
    <div
      className={cn("color-orb", className)}
      style={
        {
          width: dimension,
          height: dimension,
          "--orb-base": palette.base,
          "--orb-accent1": palette.accent1,
          "--orb-accent2": palette.accent2,
          "--orb-accent3": palette.accent3,
          "--orb-spin-duration": `${spinDuration}s`,
          "--orb-blur": `${blurStrength}px`,
          "--orb-contrast": adjustedContrast,
          "--orb-dot": `${pixelDot}px`,
          "--orb-shadow": `${shadowRange}px`,
          "--orb-mask": maskRadius,
        } as React.CSSProperties
      }
    >
      <style>{`
        @property --orb-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .color-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          transform: scale(1.1);
        }

        .color-orb::before,
        .color-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform: translateZ(0);
        }

        .color-orb::before {
          background:
            conic-gradient(
              from calc(var(--orb-angle) * 2) at 25% 70%,
              var(--orb-accent3),
              transparent 20% 80%,
              var(--orb-accent3)
            ),
            conic-gradient(
              from calc(var(--orb-angle) * 2) at 45% 75%,
              var(--orb-accent2),
              transparent 30% 60%,
              var(--orb-accent2)
            ),
            conic-gradient(
              from calc(var(--orb-angle) * -3) at 80% 20%,
              var(--orb-accent1),
              transparent 40% 60%,
              var(--orb-accent1)
            ),
            conic-gradient(
              from calc(var(--orb-angle) * 2) at 15% 5%,
              var(--orb-accent2),
              transparent 10% 90%,
              var(--orb-accent2)
            ),
            conic-gradient(
              from calc(var(--orb-angle) * 1) at 20% 80%,
              var(--orb-accent1),
              transparent 10% 90%,
              var(--orb-accent1)
            ),
            conic-gradient(
              from calc(var(--orb-angle) * -2) at 85% 10%,
              var(--orb-accent3),
              transparent 20% 80%,
              var(--orb-accent3)
            );
          box-shadow: inset var(--orb-base) 0 0 var(--orb-shadow) calc(var(--orb-shadow) * 0.2);
          filter: blur(var(--orb-blur)) contrast(var(--orb-contrast));
          animation: orb-spin var(--orb-spin-duration) linear infinite;
        }

        .color-orb::after {
          background-image: radial-gradient(
            circle at center,
            var(--orb-base) var(--orb-dot),
            transparent var(--orb-dot)
          );
          background-size: calc(var(--orb-dot) * 2) calc(var(--orb-dot) * 2);
          backdrop-filter: blur(calc(var(--orb-blur) * 2)) contrast(calc(var(--orb-contrast) * 2));
          mix-blend-mode: overlay;
        }

        .color-orb[style*="--orb-mask: 0%"]::after {
          mask-image: none;
        }

        .color-orb:not([style*="--orb-mask: 0%"])::after {
          mask-image: radial-gradient(black var(--orb-mask), transparent 75%);
        }

        @keyframes orb-spin {
          to {
            --orb-angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .color-orb::before {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export { ColorOrb };
export default ColorOrb;
