import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Check, X, Heart, MessageCircle, Eye,
  ExternalLink, Clock, FileText, CheckCircle2, XCircle, Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatNum } from "@/lib/format";

type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "facebook" | "other";
type Status = "pending" | "approved" | "rejected";

interface Content {
  id: string;
  titulo: string;
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

const platformColors: Record<Platform, string> = {
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  tiktok: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  youtube: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  twitter: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  linkedin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  facebook: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  other: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchContents();

    const channel = supabase
      .channel("contents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contents" }, () => {
        fetchContents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar conteúdos", { description: error.message });
    } else {
      setContents((data ?? []) as Content[]);
    }
    setLoading(false);
  };

  const handleApprove = (id: string) => {
    toast.success("Aprovado (demonstração)", {
      description: "Botão de aprovação será funcional em breve.",
    });
  };

  const handleReject = (id: string) => {
    toast("Rejeitado (demonstração)", {
      description: "Botão de rejeição será funcional em breve.",
    });
  };

  const filtered = useMemo(() => {
    return contents.filter((c) => {
      const matchSearch =
        !search ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.conteudo.toLowerCase().includes(search.toLowerCase()) ||
        c.source_profile?.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = filterPlatform === "all" || c.platform === filterPlatform;
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchPlatform && matchStatus;
    });
  }, [contents, search, filterPlatform, filterStatus]);

  const stats = useMemo(() => ({
    total: contents.length,
    pending: contents.filter((c) => c.status === "pending").length,
    approved: contents.filter((c) => c.status === "approved").length,
    rejected: contents.filter((c) => c.status === "rejected").length,
  }), [contents]);

  return (
    <DashboardLayout>
      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Total" value={stats.total} tone="default" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovados" value={stats.approved} tone="success" />
        <StatCard icon={<XCircle className="h-4 w-4" />} label="Rejeitados" value={stats.rejected} tone="destructive" />
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, conteúdo ou perfil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            {Object.entries(platformLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Content grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasContents={contents.length > 0} />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContentCard key={c.id} content={c} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </section>
      )}
    </DashboardLayout>
  );
}


function ContentCard({ content, onApprove, onReject }: {
  content: Content;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const date = new Date(content.captured_at || content.created_at);
  const statusBadge = {
    pending: <Badge variant="secondary" className="bg-warning/15 text-warning hover:bg-warning/20 border-0"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>,
    approved: <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/20 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>,
    rejected: <Badge variant="secondary" className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-0"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>,
  }[content.status];

  return (
    <Card className="overflow-hidden flex flex-col border-border/60 hover:shadow-brand transition-shadow animate-fade-in">
      {content.thumbnail_url && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={content.thumbnail_url}
            alt={content.titulo}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={`${platformColors[content.platform]} border-0 text-xs font-medium`}>
            {platformLabels[content.platform]}
          </Badge>
          {statusBadge}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">
            {content.titulo}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{content.conteudo}</p>
        </div>

        {content.source_profile && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {content.source_profile}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatNum(content.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNum(content.comments)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNum(content.views)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-auto">
          <span title={format(date, "PPpp", { locale: ptBR })}>
            {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}
          </span>
          {content.source_url && (
            <a href={content.source_url} target="_blank" rel="noopener noreferrer"
               className="text-primary hover:underline flex items-center gap-1">
              Ver post <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 hover:bg-success/10 hover:text-success hover:border-success/30"
                  onClick={() => onApprove(content.id)}>
            <Check className="h-4 w-4 mr-1" /> Aprovar
          </Button>
          <Button variant="outline" size="sm" className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  onClick={() => onReject(content.id)}>
            <X className="h-4 w-4 mr-1" /> Rejeitar
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ hasContents }: { hasContents: boolean }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {hasContents ? "Nenhum conteúdo encontrado" : "Aguardando o primeiro conteúdo"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {hasContents
          ? "Tente ajustar os filtros ou a busca."
          : "Configure o n8n para enviar conteúdos via Supabase REST API. Os conteúdos aparecerão aqui automaticamente."}
      </p>
    </Card>
  );
}

