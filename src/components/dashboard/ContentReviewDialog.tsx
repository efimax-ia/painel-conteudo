import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Eye, ExternalLink, CheckCircle2, XCircle, Clock, Trash2, Loader2,
} from "lucide-react";

type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "facebook" | "other";
type Status = "pending" | "approved" | "rejected";

export interface ContentItem {
  id: string;
  conteudo: string;
  source_profile: string | null;
  source_url: string | null;
  platform: Platform;
  likes: number;
  comments: number;
  views: number;
  thumbnail_url: string | null;
  status: Status;
  captured_at: string;
  created_at: string;
}

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  twitter: "Twitter/X", linkedin: "LinkedIn", facebook: "Facebook", other: "Outro",
};

const statusBadge = (s: Status) => {
  const map = {
    pending: { cls: "bg-warning/15 text-warning", icon: <Clock className="h-3 w-3 mr-1" />, label: "Pendente" },
    approved: { cls: "bg-success/15 text-success", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, label: "Aprovado" },
    rejected: { cls: "bg-destructive/15 text-destructive", icon: <XCircle className="h-3 w-3 mr-1" />, label: "Rejeitado" },
  }[s];
  return (
    <Badge variant="secondary" className={`${map.cls} hover:${map.cls} border-0`}>
      {map.icon}{map.label}
    </Badge>
  );
};

export function ContentReviewDialog({
  item, onClose, onSaved,
}: {
  item: ContentItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [conteudo, setConteudo] = useState("");
  const [sourceProfile, setSourceProfile] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("other");
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [views, setViews] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setConteudo(item.conteudo);
      setSourceProfile(item.source_profile ?? "");
      setSourceUrl(item.source_url ?? "");
      setPlatform(item.platform);
      setLikes(item.likes ?? 0);
      setComments(item.comments ?? 0);
      setViews(item.views ?? 0);
    }
  }, [item]);

  if (!item) return null;

  const persist = async (extra: Partial<{ status: Status }> = {}) => {
    setSaving(true);
    const { error } = await supabase
      .from("contents")
      .update({
        conteudo: conteudo.trim(),
        source_profile: sourceProfile.trim() || null,
        source_url: sourceUrl.trim() || null,
        platform,
        likes,
        comments,
        views,
        ...extra,
      })
      .eq("id", item.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!conteudo.trim()) {
      toast.error("O conteúdo não pode ficar vazio");
      return;
    }
    if (await persist()) {
      toast.success("Alterações salvas");
      onSaved();
    }
  };

  const handleApprove = async () => {
    if (await persist({ status: "approved" })) {
      toast.success("Conteúdo aprovado");
      onSaved();
    }
  };

  const handleReject = async () => {
    if (await persist({ status: "rejected" })) {
      toast("Conteúdo rejeitado");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este conteúdo permanentemente?")) return;
    setDeleting(true);
    const { error } = await supabase.from("contents").delete().eq("id", item.id);
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    toast.success("Conteúdo excluído");
    onSaved();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-1">
              <DialogTitle>Editar conteúdo coletado</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                {statusBadge(item.status)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {item.thumbnail_url && (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg border">
              <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={8}
              className="resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile">Perfil de origem</Label>
              <Input id="profile" value={sourceProfile} onChange={(e) => setSourceProfile(e.target.value)} placeholder="@usuario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger id="platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(platformLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do post</Label>
            <div className="flex gap-2">
              <Input id="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
              {sourceUrl && (
                <Button asChild variant="outline" size="icon">
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir link">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="likes" className="flex items-center gap-1 text-xs"><Heart className="h-3 w-3" /> Likes</Label>
              <Input id="likes" type="number" min={0} value={likes} onChange={(e) => setLikes(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments" className="flex items-center gap-1 text-xs"><MessageCircle className="h-3 w-3" /> Comentários</Label>
              <Input id="comments" type="number" min={0} value={comments} onChange={(e) => setComments(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="views" className="flex items-center gap-1 text-xs"><Eye className="h-3 w-3" /> Views</Label>
              <Input id="views" type="number" min={0} value={views} onChange={(e) => setViews(Number(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive mr-auto"
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
            Excluir
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Salvar
          </Button>
          <Button
            variant="outline"
            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={handleReject}
            disabled={saving}
          >
            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
          </Button>
          <Button
            className="bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleApprove}
            disabled={saving}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
