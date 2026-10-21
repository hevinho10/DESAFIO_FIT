// Edge function "musica": busca músicas, listas sugeridas e o trecho de 30 s do Deezer.
// O áudio nunca é guardado no Pulso: o app toca direto do Deezer.
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

// listas sugeridas: busca a playlist do estilo no Deezer e guarda 6 horas
const LISTAS: Record<string, string> = {
  top: "Top Brasil",
  treino: "treino academia",
  gospel: "gospel brasil",
  sertanejo: "top sertanejo",
  pop: "pop hits",
  funk: "funk hits",
  rock: "rock classics",
};
const cache = new Map<string, { em: number; lista: unknown[] }>();
const SEIS_HORAS = 6 * 3600 * 1000;

async function listaSugerida(nome: string) {
  const c = cache.get(nome);
  if (c && Date.now() - c.em < SEIS_HORAS) return c.lista;
  const termo = LISTAS[nome];
  if (!termo) return [];
  const pl = await (await fetch(`https://api.deezer.com/search/playlist?limit=5&q=${encodeURIComponent(termo)}`)).json();
  const escolhida = (pl?.data || []).sort((a: any, b: any) => (b.nb_tracks || 0) - (a.nb_tracks || 0))[0];
  if (!escolhida) return [];
  const tr = await (await fetch(`https://api.deezer.com/playlist/${escolhida.id}/tracks?limit=40`)).json();
  // a capa e o nome valem 6 h; o trecho (preview) o app pede de novo na hora de tocar
  const lista = (tr?.data || []).map(limpar).filter(Boolean).slice(0, 25);
  cache.set(nome, { em: Date.now(), lista });
  return lista;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { q, id, lista } = await req.json().catch(() => ({}));
    if (id) {
      const t = await (await fetch(`https://api.deezer.com/track/${encodeURIComponent(String(id))}`)).json();
      return json({ musica: limpar(t) });
    }
    if (lista) return json({ lista: await listaSugerida(String(lista)) });
    const termo = String(q || "").trim().slice(0, 80);
    if (termo.length < 2) return json({ lista: [] });
    const d = await (await fetch(`https://api.deezer.com/search?limit=20&q=${encodeURIComponent(termo)}`)).json();
    return json({ lista: (d?.data || []).map(limpar).filter(Boolean) });
  } catch (_) {
    return json({ lista: [], erro: "falhou" }, 200);
  }
});
