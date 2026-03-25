import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  onBack?: () => void;
  canProceed?: boolean;
  children: React.ReactNode;
  nextLabel?: string;
}

export default function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  onNext,
  onBack,
  canProceed = true,
  children,
  nextLabel = "Next",
}: OnboardingShellProps) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Progress dots */}
      <div className="px-6 pt-12 pb-2">
        <div className="flex gap-1.5 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i <= step ? "bg-primary w-6" : "bg-muted w-4"
              )}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-6 pb-2 text-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-2 max-w-[260px] mx-auto leading-relaxed">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-6" key={step}>
        <div className="animate-fade-in">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 pt-4 flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 h-12 rounded-full border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "h-12 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-1 transition-all",
            "hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed",
            onBack ? "flex-1" : "w-full"
          )}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
