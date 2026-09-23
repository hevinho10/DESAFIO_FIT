// ============================================================
// PULSO - Edge Function: vision-tools
//
// Duas tarefas numa função só:
//   task "workout"  -> lê print de relógio/esteira/app e devolve atividade e duração
//   task "moderate" -> checa se a imagem pode ir pro feed
//
// Entrada: { task, imageUrl }  ou  { task, imageBase64, mimeType }
//
// Nome da função: vision-tools
// Secret: GEMINI_API_KEY (o mesmo que você já usa)
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODELS = ["gemini-3.6-flash", "gemini-flash-latest"];
const TIMEOUT_MS = 25000;

const PROMPT_WORKOUT = `Você lê prints de aplicativos de treino, relógios esportivos, esteiras e bicicletas.

Responda APENAS com JSON válido, sem markdown e sem crases:
{"activity_type":"Corrida","duration_min":45,"distance_km":7.2,"confidence":0.9}

REGRAS:
- activity_type precisa ser exatamente um destes: Musculação, Corrida, Ciclismo, Natação, Caminhada, Yoga, Dança, Alongamento, Futebol, Outro.
- duration_min é a duração em minutos, número inteiro. Se aparecer como 00:45:30, use 45.
- distance_km só quando a imagem mostrar distância. Se não houver, use null.
- confidence de 0 a 1, indicando o quanto você tem certeza.
- Se a imagem não for print de treino, devolva {"activity_type":null,"duration_min":null,"distance_km":null,"confidence":0}.`;

const PROMPT_MODERATE = `Você faz a triagem de fotos de um aplicativo de saúde e atividade física aberto ao público.

Responda APENAS com JSON válido, sem markdown e sem crases:
{"safe":true,"reason":""}

Marque safe=false apenas nestes casos:
- nudez ou conteúdo sexual
- violência gráfica, sangue, ferimentos explícitos
- drogas ilícitas
- símbolos ou mensagens de ódio
- conteúdo que estimule transtorno alimentar (corpos extremamente magros apresentados como meta, listas de restrição severa, frases de "thinspiration")

É SEGURO e deve receber safe=true: foto de academia, treino, selfie de espelho com roupa de treino, prato de comida, corpo em roupa de treino ou praia em contexto esportivo, print de relógio, paisagem, animal, foto de rosto.

Em reason, quando safe=false, escreva uma frase curta e gentil em português explicando o motivo, sem acusar a pessoa.`;

async function fetchWithTimeout(url: string, options: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toBase64(buf: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function askVision(prompt: string, b64: string, mime: string, key: string) {
  const erros: string[] = [];
  for (const model of MODELS) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }],
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 300,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
        TIMEOUT_MS,
      );
      if (!res.ok) { erros.push(`${model} [${res.status}]`); continue; }
      const data = await res.json();
      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) return txt;
      erros.push(`${model} [vazio]`);
    } catch (e) {
      erros.push(`${model} [${(e as Error)?.name === "AbortError" ? "timeout" : String(e)}]`);
    }
  }
  throw new Error("Nenhum modelo respondeu. " + erros.join(" | "));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { task, imageUrl, imageBase64, mimeType } = await req.json();
    if (task !== "workout" && task !== "moderate") throw new Error("task inválida");

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY não configurada");

    let b64 = imageBase64;
    let mime = mimeType || "image/jpeg";
    if (!b64) {
      if (!imageUrl) throw new Error("envie imageUrl ou imageBase64");
      const r = await fetch(imageUrl);
      if (!r.ok) throw new Error("não consegui baixar a imagem");
      mime = r.headers.get("content-type") || "image/jpeg";
      b64 = toBase64(new Uint8Array(await r.arrayBuffer()));
    }

    const raw = await askVision(
      task === "workout" ? PROMPT_WORKOUT : PROMPT_MODERATE,
      b64, mime, key,
    );
    const limpo = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(limpo);
    } catch {
      const m = limpo.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed) throw new Error("resposta em formato inesperado");

    if (task === "moderate") {
      return new Response(
        JSON.stringify({ safe: parsed.safe !== false, reason: String(parsed.reason || "") }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        activity_type: parsed.activity_type || null,
        duration_min: parsed.duration_min ? Math.round(Number(parsed.duration_min)) : null,
        distance_km: parsed.distance_km != null ? Number(parsed.distance_km) : null,
        confidence: Number(parsed.confidence || 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("vision-tools erro:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message || err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
