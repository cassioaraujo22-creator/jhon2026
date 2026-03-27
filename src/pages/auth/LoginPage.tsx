import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import onboarding1 from "@/assets/onboarding-1.jpg";
import onboarding2 from "@/assets/onboarding-2.jpg";
import onboarding3 from "@/assets/onboarding-3.jpg";

const gridImages = [onboarding1, onboarding2, onboarding3, onboarding1, onboarding2, onboarding3];
const APP_NAME_STORAGE_KEY = "app_display_name";
const GYM_NAME_STORAGE_KEY = "gym_display_name";
const DEFAULT_APP_NAME = "App";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const navigate = useNavigate();
  const { signIn, signUp, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session) navigate("/app", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    let mounted = true;
    try {
      const storedName =
        localStorage.getItem(GYM_NAME_STORAGE_KEY)?.trim() ||
        localStorage.getItem(APP_NAME_STORAGE_KEY)?.trim();
      if (storedName) {
        setAppName(storedName);
        return;
      }
    } catch (_error) {
      // Ignore localStorage access issues.
    }

    const loadPublicGymName = async () => {
      const { data, error } = await supabase.rpc("get_public_onboarding_config");
      if (error || !data || !mounted) return;
      const gymName = String((data as any)?.gym_name ?? "").trim();
      if (!gymName) return;
      setAppName(gymName);
      try {
        localStorage.setItem(GYM_NAME_STORAGE_KEY, gymName);
      } catch (_cacheError) {
        // Ignore localStorage access issues.
      }
    };

    void loadPublicGymName();
    return () => {
      mounted = false;
    };
  }, []);

  if (session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      if (!name.trim()) {
        toast({ title: "Erro", description: "Informe seu nome.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: "Erro no cadastro", description: error, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro no login", description: error, variant: "destructive" });
      } else {
        navigate("/app", { replace: true });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Photo Grid Background */}
      <div className="w-full pt-12 px-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden opacity-60">
          {gridImages.map((img, idx) => (
            <div key={idx} className={`aspect-square overflow-hidden ${idx === 0 ? 'rounded-tl-2xl' : ''} ${idx === 2 ? 'rounded-tr-2xl' : ''} ${idx === 3 ? 'rounded-bl-2xl' : ''} ${idx === 5 ? 'rounded-br-2xl' : ''}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {/* Gradient fade */}
        <div className="h-24 -mt-24 relative z-10 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 max-w-lg mx-auto w-full -mt-4 relative z-10">
        {/* Logo & Title */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center glow-purple">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? `Crie sua conta na ${appName}` : `Bem-vindo ao ${appName}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? `Preencha seus dados para começar na ${appName}` : `${appName} para sua jornada fitness`}
          </p>
        </div>

        {/* Auth Buttons - Sign Up mode */}
        {!isSignUp ? (
          <div className="space-y-3 mb-6">
            <Button
              variant="glow"
              size="lg"
              className="w-full"
              onClick={() => setIsSignUp(true)}
            >
              <Mail className="w-4 h-4" />
              Entrar com email
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              disabled
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </Button>
          </div>
        ) : null}

        {/* Email/Password Form */}
        {isSignUp || email || password ? null : (
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou entre com email</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                className="w-full h-12 rounded-xl bg-secondary border border-border pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-12 rounded-xl bg-secondary border border-border pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              minLength={6}
              className="w-full h-12 rounded-xl bg-secondary border border-border pl-11 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button type="button" className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
            </div>
          )}

          <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? "Criar conta" : "Entrar"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6 pb-8">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? "Já tem conta? " : "Não tem conta? "}
            <span className="text-primary font-medium">{isSignUp ? "Entrar" : "Criar conta"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
