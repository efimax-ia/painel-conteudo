const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_NUMBER = "5551984150800";
const APP_URL = "https://painel-conteudo-efimax.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE");

    if (!evolutionUrl || !evolutionKey || !instance) {
      throw new Error("Evolution API secrets not configured");
    }

    const payload = await req.json().catch(() => ({}));
    console.log("notify-new-generated payload:", payload);

    const titulo = payload?.titulo ?? "Novo conteúdo";
    const tema = payload?.tema ? `\n🏷 Tema: ${payload.tema}` : "";
    const link = payload?.id ? `${APP_URL}/gerados?id=${payload.id}` : `${APP_URL}/gerados`;

    const text =
      `✨ *NOVO CONTEÚDO GERADO*\n\n` +
      `📝 ${titulo}${tema}\n\n` +
      `Abre direto pra revisar e avaliar 👇\n${link}`;

    const url = `${evolutionUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({ number: TARGET_NUMBER, text }),
    });

    const body = await res.text();
    console.log("Evolution response:", res.status, body);

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("notify-new-generated error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});