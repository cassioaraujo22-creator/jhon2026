import { useState } from "react";
import { Loader2, Plus, Trash2, User, UserPlus, Edit2, Instagram, MessageCircle, Award, Clock, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGymCoaches, type CoachWithProfile } from "@/hooks/use-gym-coaches";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CoachForm {
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string;
  certifications: string;
  experience_years: number;
  instagram: string;
  whatsapp: string;
}

const emptyForm: CoachForm = {
  name: "", email: "", phone: "", bio: "",
  specialties: "", certifications: "",
  experience_years: 0, instagram: "", whatsapp: "",
};

export default function AdminPersonalTrainers() {
  const { data: coaches, isLoading } = useGymCoaches();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachWithProfile | null>(null);
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [detailCoach, setDetailCoach] = useState<CoachWithProfile | null>(null);

  const openNew = () => {
    setEditingCoach(null);
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (coach: CoachWithProfile) => {
    setEditingCoach(coach);
    setForm({
      name: coach.name ?? "",
      email: coach.email ?? "",
      phone: coach.phone ?? "",
      bio: coach.bio ?? "",
      specialties: (coach.specialties ?? []).join(", "),
      certifications: (coach.certifications ?? []).join(", "),
      experience_years: coach.experience_years ?? 0,
      instagram: coach.instagram ?? "",
      whatsapp: coach.whatsapp ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(coach.avatar_url);
    setDialogOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (coachUserId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    if (!profile?.id) throw new Error("Sessão inválida para upload de avatar");

    const ext = avatarFile.name.split(".").pop();
    const path = `${profile.id}/${coachUserId}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Preencha nome e email", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const gymId = profile!.gym_id!;
      let userId = editingCoach?.user_id;

      if (!editingCoach) {
        // Find or error - coach must already have an account
        const { data: found, error: fErr } = await supabase.rpc("find_profile_by_email", { _email: form.email.trim().toLowerCase() });
        if (fErr) throw fErr;

        if (!found || found.length === 0) {
          toast({ title: "Usuário não encontrado", description: "O email informado precisa ter uma conta cadastrada na plataforma.", variant: "destructive" });
          setSaving(false);
          return;
        }

        userId = found[0].id;

        // Add coach role
        const { error: rErr } = await supabase.from("user_roles").insert({
          user_id: userId,
          gym_id: gymId,
          role: "coach",
        } as any);
        if (rErr && !rErr.message.includes("duplicate")) throw rErr;
      }

      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile && userId) {
        avatarUrl = await uploadAvatar(userId);
      }

      // Update profile name/phone/avatar
      const profileUpdate: Record<string, any> = {};
      if (form.name.trim()) profileUpdate.name = form.name.trim();
      if (form.phone.trim()) profileUpdate.phone = form.phone.trim();
      if (avatarUrl) profileUpdate.avatar_url = avatarUrl;

      if (Object.keys(profileUpdate).length > 0 && userId) {
        const { error: profileErr } = await supabase.from("profiles").update(profileUpdate).eq("id", userId);
        if (profileErr) throw profileErr;
      }

      // Upsert coach_profiles
      const specialties = form.specialties.split(",").map(s => s.trim()).filter(Boolean);
      const certifications = form.certifications.split(",").map(s => s.trim()).filter(Boolean);

      const coachData = {
        user_id: userId!,
        gym_id: gymId,
        bio: form.bio.trim() || null,
        specialties,
        certifications,
        experience_years: form.experience_years,
        instagram: form.instagram.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      };

      if (editingCoach?.coach_profile_id) {
        const { error: coachErr } = await supabase
          .from("coach_profiles")
          .update(coachData)
          .eq("id", editingCoach.coach_profile_id);
        if (coachErr) throw coachErr;
      } else {
        const { error: coachErr } = await supabase.from("coach_profiles").insert(coachData as any);
        if (coachErr) throw coachErr;
      }

      qc.invalidateQueries({ queryKey: ["gym-coaches"] });
      toast({ title: editingCoach ? "Personal atualizado!" : "Personal cadastrado!" });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (coach: CoachWithProfile) => {
    if (!confirm("Remover este personal trainer?")) return;
    try {
      // Remove role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", coach.user_id)
        .eq("gym_id", profile!.gym_id!)
        .eq("role", "coach");
      // Remove coach_profile
      if (coach.coach_profile_id) {
        await supabase.from("coach_profiles").delete().eq("id", coach.coach_profile_id);
      }
      qc.invalidateQueries({ queryKey: ["gym-coaches"] });
      toast({ title: "Personal removido!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Personal Trainers</h2>
          <p className="text-sm text-muted-foreground">{coaches?.length ?? 0} profissionais cadastrados</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <UserPlus className="w-4 h-4" /> Cadastrar Personal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(coaches ?? []).map((coach) => (
          <div
            key={coach.id}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => setDetailCoach(coach)}
          >
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary/30">
                <AvatarImage src={coach.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {coach.name?.charAt(0) ?? "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{coach.name}</p>
                <p className="text-xs text-muted-foreground truncate">{coach.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                    {coach.role === "owner" ? "Proprietário" : "Coach"}
                  </span>
                  {coach.experience_years > 0 && (
                    <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {coach.experience_years} anos
                    </span>
                  )}
                </div>
              </div>
            </div>
            {coach.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{coach.bio}</p>
            )}
            {coach.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {coach.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {coach.specialties.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{coach.specialties.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
        {(coaches ?? []).length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center space-y-2">
            <User className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum personal cadastrado</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailCoach} onOpenChange={(o) => !o && setDetailCoach(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Perfil do Personal Trainer</DialogTitle>
          {detailCoach && (
            <>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Avatar className="w-20 h-20 border-2 border-primary/30">
                  <AvatarImage src={detailCoach.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                    {detailCoach.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold text-foreground">{detailCoach.name}</h3>
                <p className="text-sm text-muted-foreground">{detailCoach.email}</p>
              </div>
              <div className="space-y-4 py-3">
                {detailCoach.bio && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Biografia</p>
                    <p className="text-sm text-foreground">{detailCoach.bio}</p>
                  </div>
                )}
                {detailCoach.specialties.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Especialidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailCoach.specialties.map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detailCoach.certifications.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Certificações</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailCoach.certifications.map((c) => (
                        <span key={c} className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Award className="w-3 h-3" /> {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {detailCoach.experience_years > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" /> {detailCoach.experience_years} anos de experiência
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {detailCoach.instagram && (
                    <a href={`https://instagram.com/${detailCoach.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <Instagram className="w-4 h-4" /> @{detailCoach.instagram.replace("@", "")}
                    </a>
                  )}
                  {detailCoach.whatsapp && (
                    <a href={`https://wa.me/${detailCoach.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-success hover:underline">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setDetailCoach(null); openEdit(detailCoach); }}>
                  <Edit2 className="w-4 h-4" /> Editar
                </Button>
                {detailCoach.role !== "owner" && (
                  <Button variant="destructive" size="icon" onClick={() => { setDetailCoach(null); handleRemove(detailCoach); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoach ? "Editar Personal Trainer" : "Cadastrar Personal Trainer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-primary/30">
                  <AvatarImage src={avatarPreview ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                    {form.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-primary-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Foto do Personal</p>
                <p className="text-xs">JPG, PNG até 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" disabled={!!editingCoach} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Anos de experiência</Label>
                <Input type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Biografia</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Conte sobre a experiência e abordagem do personal..." rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label>Especialidades</Label>
              <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Musculação, Funcional, CrossFit (separados por vírgula)" />
            </div>

            <div className="space-y-1.5">
              <Label>Certificações</Label>
              <Input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} placeholder="CREF, Curso X (separados por vírgula)" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" />
              </div>
            </div>

            {!editingCoach && (
              <p className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3">
                ⚠️ O email informado deve pertencer a um usuário já cadastrado na plataforma.
              </p>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingCoach ? "Salvar Alterações" : "Cadastrar Personal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
