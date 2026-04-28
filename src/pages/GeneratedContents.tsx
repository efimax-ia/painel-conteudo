import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Sparkles, Clock, CheckCircle2, XCircle, FileText, Star,
  Film, MessageSquare, Image as ImageIcon, Copy, Check, Hash, Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";
type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "facebook" | "other";

interface CoverIdea {
  titulo?: string;
  prompt?: string;
}

interface ParsedGeneratedContent {
  roteiro: string;
  legenda: string;
  hashtags: string;
  covers: CoverIdea[];
}

interface Generated {
  id: string;
  titulo: string;
  tema: string | null;
  platform: Platform | null;
  roteiro: string;
  legenda: string | null;
  hashtags: string | null;
  cover_ideas: CoverIdea[] | any;
  status: Status;
  rating: number | null;
  observations: string | null;
  agent_name: string | null;
  generated_at: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  twitter: "Twitter/X", linkedin: "LinkedIn", facebook: "Facebook", other: "Outro",
};

export default function GeneratedContents() {
  const [items, setItems] = useState<Generated[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Generated | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel("generated-contents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "generated_contents" }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Abre o modal automaticamente quando vier ?id=xxx (link do WhatsApp)
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || items.length === 0) return;
    const found = items.find((i) => i.id === id);
    if (found) setSelected(found);
  }, [items, searchParams]);

  const closeDialog = () => {
    setSelected(null);
    if (searchParams.get("id")) {
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("generated_contents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar", { description: error.message });
    else setItems((data ?? []) as Generated[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        c.titulo.toLowerCase().includes(s) ||
        c.roteiro.toLowerCase().includes(s) ||
        c.tema?.toLowerCase().includes(s);
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [items, search, filterStatus]);

  const stats = useMemo(() => {
    const rated = items.filter((i) => i.rating !== null);
    const avg = rated.length ? rated.reduce((s, i) => s + (i.rating || 0), 0) / rated.length : 0;
    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      avg: avg.toFixed(1),
    };
  }, [items]);

  return (
    <DashboardLayout>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Gerados" value={stats.total} tone="default" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovados" value={stats.approved} tone="success" />
        <StatCard icon={<Star className="h-4 w-4" />} label="Nota média" value={stats.avg} tone="default" />
      </section>

      <section className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, tema ou roteiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="h-72 animate-pulse bg-muted/40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasItems={items.length > 0} />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GeneratedCard key={g.id} item={g} onOpen={() => setSelected(g)} />
          ))}
        </section>
      )}

      <ReviewDialog
        item={selected}
        onClose={closeDialog}
        onSaved={() => { closeDialog(); fetchItems(); }}
      />
    </DashboardLayout>
  );
}

function statusBadge(status: Status) {
  const map = {
    pending: { cls: "bg-warning/15 text-warning", icon: <Clock className="h-3 w-3 mr-1" />, label: "Pendente" },
    approved: { cls: "bg-success/15 text-success", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, label: "Aprovado" },
    rejected: { cls: "bg-destructive/15 text-destructive", icon: <XCircle className="h-3 w-3 mr-1" />, label: "Rejeitado" },
  }[status];
  return (
    <Badge variant="secondary" className={`${map.cls} hover:${map.cls} border-0`}>
      {map.icon}{map.label}
    </Badge>
  );
}

function GeneratedCard({ item, onOpen }: { item: Generated; onOpen: () => void }) {
  const date = new Date(item.generated_at || item.created_at);
  const parsed = parseGeneratedContent(item);

  return (
    <Card className="overflow-hidden flex flex-col border-border/60 hover:shadow-brand transition-all animate-fade-in cursor-pointer group" onClick={onOpen}>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {item.platform && (
              <Badge variant="outline" className="text-xs font-medium">
                {platformLabels[item.platform]}
              </Badge>
            )}
            {item.tema && (
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                {item.tema}
              </Badge>
            )}
          </div>
          {statusBadge(item.status)}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {item.titulo}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{parsed.roteiro || item.roteiro}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {parsed.legenda && (
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />Legenda</span>
          )}
          {parsed.hashtags && (
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />Hashtags</span>
          )}
          {parsed.covers.length > 0 && (
            <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />{parsed.covers.length} {parsed.covers.length === 1 ? "capa" : "capas"}</span>
          )}
          {item.agent_name && (
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{item.agent_name}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-auto">
          <span>{formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}</span>
          {item.rating !== null && (
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Star className="h-3 w-3 fill-current" />
              {item.rating}/10
            </span>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <Eye className="h-4 w-4 mr-1" /> Ver e avaliar
        </Button>
      </div>
    </Card>
  );
}

function ReviewDialog({
  item, onClose, onSaved,
}: {
  item: Generated | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState<number>(10);
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setRating(item.rating ?? 10);
      setObservations(item.observations ?? "");
    }
  }, [item]);

  if (!item) return null;

  const parsed = parseGeneratedContent(item);
  const roteiroText = parsed.roteiro || item.roteiro;
  const legendaText = parsed.legenda;
  const hashtagsText = parsed.hashtags;
  const covers = parsed.covers;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Copiado!");
  };

  const save = async (newStatus: Status) => {
    if (newStatus === "approved" && rating < 10 && !observations.trim()) {
      toast.error("Adicione observações", { description: "Para nota abaixo de 10, descreva o que pode melhorar." });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("generated_contents")
      .update({
        status: newStatus,
        rating,
        observations: observations.trim() || null,
      })
      .eq("id", item.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return;
    }
    toast.success(newStatus === "approved" ? "Conteúdo aprovado" : "Conteúdo rejeitado");
    onSaved();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-xl leading-tight">{item.titulo}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                {item.platform && <Badge variant="outline">{platformLabels[item.platform]}</Badge>}
                {item.tema && <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{item.tema}</Badge>}
                {statusBadge(item.status)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Roteiro */}
          <Section icon={<Film className="h-4 w-4" />} title="ROTEIRO PARA VÍDEO" onCopy={() => copy(roteiroText, "roteiro")} copied={copied === "roteiro"}>
            <div className="bg-muted/40 border rounded-lg p-4 text-sm whitespace-pre-line leading-relaxed">
              {roteiroText}
            </div>
          </Section>

          {/* Legenda */}
          {legendaText && (
            <Section icon={<MessageSquare className="h-4 w-4" />} title="DICA DE LEGENDA" onCopy={() => copy(legendaText, "legenda")} copied={copied === "legenda"}>
              <div className="bg-muted/40 border rounded-lg p-4 text-sm whitespace-pre-line leading-relaxed">
                {legendaText}
              </div>
            </Section>
          )}

          {/* Hashtags */}
          {hashtagsText && (
            <Section icon={<Hash className="h-4 w-4" />} title="Hashtags" onCopy={() => copy(hashtagsText, "hashtags")} copied={copied === "hashtags"}>
              <div className="bg-muted/40 border rounded-lg p-4 text-sm text-primary">
                {hashtagsText}
              </div>
            </Section>
          )}

          {/* Capas */}
          {covers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> IDEIAS DE CAPA — {covers.length} {covers.length === 1 ? "OPÇÃO" : "OPÇÕES"}
                </h4>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copy(formatCoversForCopy(covers), "all-covers")}>
                  {copied === "all-covers" ? <><Check className="h-3 w-3 mr-1" />Copiado</> : <><Copy className="h-3 w-3 mr-1" />Copiar tudo</>}
                </Button>
              </div>
              <div className="grid gap-3">
                {covers.map((c, i) => (
                  <Card key={i} className="p-4 border-border/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm flex-1">
                        <span className="text-primary mr-2">Opção {i + 1}:</span>
                        {c.titulo}
                      </p>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copy(formatSingleCover(c, i), `cover-${i}`)}>
                        {copied === `cover-${i}` ? <><Check className="h-3 w-3 mr-1" />Copiado</> : <><Copy className="h-3 w-3 mr-1" />Copiar</>}
                      </Button>
                    </div>
                    {c.prompt && (
                      <p className="text-xs text-muted-foreground bg-muted/40 border rounded p-2">
                        <span className="font-medium text-foreground">Prompt IA:</span> {c.prompt}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Avaliação */}
          <div className="space-y-4 border-t pt-5">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" /> Avaliação
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Nota</Label>
                <span className={cn(
                  "text-2xl font-bold",
                  rating >= 8 ? "text-success" : rating >= 5 ? "text-warning" : "text-destructive"
                )}>
                  {rating.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span>
                </span>
              </div>
              <Slider
                value={[rating]}
                onValueChange={([v]) => setRating(v)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">
                Observações {rating < 10 && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="obs"
                placeholder={rating < 10
                  ? "O que pode ser melhorado? (obrigatório para nota abaixo de 10)"
                  : "Comentários adicionais (opcional)"}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Os agentes do n8n usarão estas observações e notas para melhorar futuras gerações.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            variant="outline"
            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => save("rejected")}
            disabled={saving}
          >
            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
          </Button>
          <Button
            className="bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => save("approved")}
            disabled={saving}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon, title, children, onCopy, copied }: {
  icon: ReactNode; title: string; children: ReactNode; onCopy: () => void; copied: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">{icon}{title}</h4>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCopy}>
          {copied ? <><Check className="h-3 w-3 mr-1" />Copiado</> : <><Copy className="h-3 w-3 mr-1" />Copiar</>}
        </Button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {hasItems ? "Nenhum conteúdo encontrado" : "Aguardando o primeiro conteúdo gerado"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {hasItems
          ? "Tente ajustar os filtros ou a busca."
          : "Configure o agente n8n para enviar os conteúdos gerados via Supabase REST API."}
      </p>
    </Card>
  );
}

/**
 * Parser que extrai seções de um texto bruto vindo do n8n no formato:
 *   [ROTEIRO PARA VÍDEO] ... [DICA DE LEGENDA] ... [IDEIAS DE CAPA — N OPÇÕES]
 * Os separadores `---` são opcionais. Tolerante a variações (Roteiro, Legenda, etc).
 */
function parseRawContent(raw: string): { roteiro: string; legenda: string; covers: CoverIdea[] } {
  const empty = { roteiro: "", legenda: "", covers: [] as CoverIdea[] };
  if (!raw) return empty;

  // Detecta rótulos de seção (com ou sem colchetes)
  const sectionRegex = /\[?\s*(ROTEIRO[^\]\n]*|DICA DE LEGENDA[^\]\n]*|LEGENDA[^\]\n]*|IDEIAS? DE CAPA[^\]\n]*|HASHTAGS?[^\]\n]*)\s*\]?/gi;
  const matches = [...raw.matchAll(sectionRegex)];
  if (matches.length === 0) return empty;

  const sections: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const label = m[1].toUpperCase().trim();
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : raw.length;
    let body = raw.slice(start, end).trim();
    // remove separadores --- no começo/fim
    body = body.replace(/^[-–—\s]+/, "").replace(/[-–—\s]+$/, "").trim();

    let key = "";
    if (label.startsWith("ROTEIRO")) key = "roteiro";
    else if (label.startsWith("DICA DE LEGENDA") || label.startsWith("LEGENDA")) key = "legenda";
    else if (label.startsWith("IDEIA")) key = "covers";
    else if (label.startsWith("HASHTAG")) key = "hashtags";
    if (key) sections[key] = body;
  }

  const covers: CoverIdea[] = [];
  if (sections.covers) {
    // Divide por "Opção N:" e parseia "Título | Prompt IA: ..."
    const parts = sections.covers.split(/\n?\s*Op[çc][ãa]o\s*\d+\s*:\s*/i).filter((p) => p.trim());
    for (const part of parts) {
      const cleaned = part.trim();
      if (!cleaned) continue;
      const promptMatch = cleaned.match(/\|\s*Prompt\s*IA\s*:\s*([\s\S]*)/i);
      if (promptMatch) {
        const titulo = cleaned.slice(0, promptMatch.index).replace(/\|$/, "").trim();
        covers.push({ titulo, prompt: promptMatch[1].trim() });
      } else {
        covers.push({ titulo: cleaned });
      }
    }
  }

  return {
    roteiro: sections.roteiro || "",
    legenda: sections.legenda || "",
    covers,
  };
}

function formatSingleCover(c: CoverIdea, i: number): string {
  const titulo = c.titulo ? `Opção ${i + 1}: ${c.titulo}` : `Opção ${i + 1}`;
  return c.prompt ? `${titulo}\n\nPrompt IA: ${c.prompt}` : titulo;
}

function formatCoversForCopy(covers: CoverIdea[]): string {
  return covers.map((c, i) => formatSingleCover(c, i)).join("\n\n---\n\n");
}


