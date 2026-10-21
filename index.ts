// Edge function "musica": busca músicas e devolve o trecho de 30 s do Deezer.
// O áudio nunca é guardado no Pulso: o app toca direto do Deezer.
// Deploy: supabase functions deploy musica
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// deixa só o que o app usa
const limpar = (t: any) => t && t.preview ? {
  id: t.id,
  titulo: String(t.title_short || t.title || ""),
  artista: String(t.artist?.name || ""),
  capa: String(t.album?.cover_medium || t.album?.cover || ""),
  preview: String(t.preview),
} : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { q, id } = await req.json().catch(() => ({}));
    if (id) {
      const r = await fetch(`https://api.deezer.com/track/${encodeURIComponent(String(id))}`);
      const t = await r.json();
      return json({ musica: limpar(t) });
    }
    const termo = String(q || "").trim().slice(0, 80);
    if (termo.length < 2) return json({ lista: [] });
    const r = await fetch(`https://api.deezer.com/search?limit=20&q=${encodeURIComponent(termo)}`);
    const d = await r.json();
    const lista = (d?.data || []).map(limpar).filter(Boolean);
    return json({ lista });
  } catch (_) {
    return json({ lista: [], erro: "falhou" }, 200);
  }
});
