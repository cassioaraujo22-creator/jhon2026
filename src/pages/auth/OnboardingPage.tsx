import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dumbbell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import onboarding1 from "@/assets/onboarding-1.jpg";
import onboarding2 from "@/assets/onboarding-2.jpg";
import onboarding3 from "@/assets/onboarding-3.jpg";

const slides = [
  {
    image: onboarding1,
    title: "Treinos que evoluem com você",
    description: "Alcance seus objetivos com programas personalizados e acompanhamento profissional.",
  },
  {
    image: onboarding2,
    title: "Encontre o mentor ideal",
    description: "Conecte-se com coaches especializados que entendem suas necessidades e motivam cada passo.",
  },
  {
    image: onboarding3,
    title: "Sem limites. Sua academia sempre com você.",
    description: "Acompanhe treinos, progresso e agenda de qualquer lugar, a qualquer hora.",
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { session } = useAuth();

  const isLast = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("onboarding_done", "true");
      navigate(session ? "/onboarding" : "/login");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_done", "true");
    navigate(session ? "/onboarding" : "/login");
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-500"
          key={currentSlide}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* Skip button */}
      {!isLast && (
        <button
          onClick={handleSkip}
          className="absolute top-12 right-6 z-20 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-12 px-8 max-w-lg mx-auto w-full">
        <div className="space-y-6 animate-slide-up" key={currentSlide}>
          <h2 className="text-3xl font-bold text-foreground leading-tight">
            {slide.title}
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "w-8 bg-primary"
                  : idx < currentSlide
                  ? "w-4 bg-primary/40"
                  : "w-4 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          variant="glow"
          size="lg"
          className="w-full mt-6"
          onClick={handleNext}
        >
          {isLast ? "Começar" : "Próximo"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
