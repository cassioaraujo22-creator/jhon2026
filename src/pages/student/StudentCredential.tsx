import { ArrowLeft, QrCode, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyCredential, useMyMembership } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";

export default function StudentCredential() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: credential, isLoading } = useMyCredential();
  const { data: membership } = useMyMembership();

  const credentialCode = credential ? `FP-${credential.id.slice(0, 8).toUpperCase()}` : null;

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Credencial de Acesso</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <>
          {/* QR Code */}
          <div className="rounded-2xl border border-primary/20 bg-card p-8 text-center space-y-4 glow-purple">
            {credential?.token_hash ? (
              <div className="inline-block p-4 bg-white rounded-2xl">
                <QRCodeSVG
                  value={credential.token_hash}
                  size={180}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            ) : (
              <QrCode className="w-32 h-32 mx-auto text-primary" />
            )}
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            {credentialCode ? (
              <div className="space-y-2">
                <p className="text-xl font-mono font-bold text-primary tracking-wider">{credentialCode}</p>
                <p className="text-xs text-muted-foreground">Apresente na catraca para entrar</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma credencial ativa</p>
            )}
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Status</p>
                <p className="text-xs text-muted-foreground">
                  {credential?.status === "active" ? "Credencial ativa" : "Credencial inativa"}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                credential?.status === "active"
                  ? "bg-success/15 text-success border-success/20"
                  : "bg-destructive/15 text-destructive border-destructive/20"
              }`}>
                {credential?.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Tipo</p>
                <p className="text-xs text-muted-foreground">{credential?.type === "qr" ? "QR Code" : credential?.type ?? "—"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">Plano vinculado</p>
              <p className="text-xs text-muted-foreground mt-1">{membership?.plans?.name ?? "Nenhum plano vinculado"}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
