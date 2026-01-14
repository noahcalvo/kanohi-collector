interface SpotlightWrapProps {
  children: React.ReactNode;
  className?: string;
  on: boolean;
}

export default function SpotlightWrap({ children, className = "", on }: SpotlightWrapProps) {
  if (!on) {
    return <>{children}</>;
  }
  return (
    <div className={`relative isolate ${className}`}>
      {/* Simple subtle spotlight */}
      <div
        className="pointer-events-none absolute inset-10 flex items-center justify-center -z-10 translate-y-16"
        aria-hidden="true"
      >
        <div className="spotlight" aria-hidden="true" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        .spotlight {
          width: clamp(30rem, 50vw, 70rem);
          height: clamp(30rem, 50vw, 70rem);
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.15) 25%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 80%
          );
          border-radius: 50%;
          filter: blur(40px);
          mix-blend-mode: screen;
          animation: spotlightSwell 4s ease-in-out infinite;
        }

        @keyframes spotlightSwell {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }

        /* accessibility */
        @media (prefers-reduced-motion: reduce) {
          .spotlight {
            animation: none;
          }
        }

        /* small-screen tune-down */
        @media (max-width: 640px) {
          .spotlight {
            filter: blur(30px);
          }
        }
      `}</style>
    </div>
  );
}
