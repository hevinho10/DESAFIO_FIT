// =====================================================================
// Pulso · Edge Function "vision-tools"
// Lê fotos com o Gemini. Tarefas:
//   moderate  → a foto pode ir pro feed?            { safe, reason }
//   scale     → peso no visor da balança            { weight_kg }
//   workout   → print de app de treino              { activity_type, duration_min, distance_km }
//   cardapio  → 3 melhores pratos do cardápio       { opcoes:[{prato, porque}], dica }
//   geladeira → 3 refeições com o que tem em casa    { ideias:[{nome, tempo_min, como}], dica }
//   coach     → Coach comenta a foto                 { resposta }
//   macros    → estimativa do prato                  { proteina_g, carbo_g, gordura_g, kcal, confianca }
// Entrada: { task, imageUrl?  ou  imageBase64 + mimeType?  ou  imagens: [{ b64, mime }] (até 4), contexto?, pergunta? }
// =====================================================================
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const CHAVE =
  Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GEMINI_KEY") || "";
const MODELOS = (Deno.env.get("GEMINI_MODELS") || "gemini-3.6-flash,gemini-flash-latest,gemini-flash-lite-latest")
  .split(",").map((m) => m.trim()).filter(Boolean);
const TIPOS = "Musculação, Corrida, Caminhada, Ciclismo, Natação, Yoga, Pilates, Dança, HIIT, Alongamento, Futebol, Outro";

const resp = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function paraBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function instrucao(task: string, contexto: string, pergunta: string): string {
  const base = "Responda SOMENTE com JSON válido, em português do Brasil, sem texto fora do JSON.";
  switch (task) {
    case "moderate":
      return `Você modera fotos de uma rede social de saúde e treino. A foto pode ser publicada se NÃO tiver nudez, conteúdo sexual, violência, sangue, drogas, armas, ódio ou dados pessoais expostos (documentos, cartões). Selfies de academia, treino, comida, natureza e pessoas vestidas são permitidas. ${base} Formato: {"safe": true ou false, "reason": "motivo curto e gentil em português, só se safe for false"}`;
    case "scale":
      return `Leia o número mostrado no visor desta balança. ${base} Formato: {"weight_kg": número com até 1 casa decimal, ou null se não der pra ler}`;
    case "workout":
      return `Este é um print de um app ou relógio de treino. Extraia o treino. activity_type deve ser um destes: ${TIPOS}. ${base} Formato: {"activity_type": "...", "duration_min": número ou null, "distance_km": número ou null}`;
    case "cardapio":
      return `Você é o Coach Pulso. Esta é a foto de um cardápio. Escolha as 3 MELHORES opções do cardápio para esta pessoa, pensando no objetivo dela, e explique em uma frase curta o porquê de cada uma. Use os nomes como aparecem no cardápio. Se não for um cardápio legível, devolva opcoes vazia e explique na dica. Contexto da pessoa: ${contexto || "sem dados"}. ${base} Formato: {"opcoes": [{"prato": "...", "porque": "..."}], "dica": "uma dica curta de como pedir (ex: molho à parte)"}`;
    case "geladeira":
      return `Você é o Coach Pulso. Esta é a foto de uma geladeira ou despensa. Sugira 3 refeições simples e saudáveis que dá pra fazer com o que aparece na foto, pensando no objetivo da pessoa. Use só ingredientes visíveis mais básicos (sal, óleo, temperos). Contexto da pessoa: ${contexto || "sem dados"}. ${base} Formato: {"ideias": [{"nome": "...", "tempo_min": número, "como": "preparo em 1 ou 2 frases"}], "dica": "uma dica curta"}`;
    case "coach":
      return `Você é o Coach Pulso, treinador virtual próximo, direto e gentil, de um app brasileiro de vida saudável. A pessoa mandou esta foto${pergunta ? ` e perguntou: "${pergunta}"` : ""}. Contexto da pessoa: ${contexto || "sem dados"}. Responda em até 90 palavras, sem travessão, sem listas longas. Nunca sugira dieta restritiva nem diagnóstico. ${base} Formato: {"resposta": "..."}`;
    case "macros":
      return `Você é nutricionista. Estime os macronutrientes do prato desta foto, considerando o tamanho visível das porções (prato comum de 25 cm). Some todos os alimentos visíveis. Se não for comida, devolva tudo null. ${base} Formato: {"proteina_g": número inteiro, "carbo_g": número inteiro, "gordura_g": número inteiro, "kcal": número inteiro, "confianca": "alta" ou "media" ou "baixa"}`;
    case "refeicao":
      return `Você é nutricionista de um app brasileiro de vida saudável. Avalie o prato desta foto numa chamada só: a nota e os macronutrientes.
- score: nota de 0 a 10 (uma casa decimal) pra qualidade da refeição: equilíbrio (proteína, vegetais, carboidrato de qualidade), pouco ultraprocessado, fritura e açúcar, e porção razoável. Prato colorido e equilibrado fica entre 8 e 10; ultraprocessado ou só carboidrato fica abaixo de 5.
- analysis: em português do Brasil, sem travessão, gentil. Se a nota for 8 ou mais: só 1 frase elogiando o ponto forte, SEM dica nem sugestão. Se a nota for menor que 8: o ponto forte e uma dica prática curta (2 frases no máximo). Nunca sugira dieta restritiva.
- items: até 6 alimentos que aparecem, nomes curtos.
- macros: estime pela porção visível (prato comum de 25 cm), somando tudo: proteina_g, carbo_g, gordura_g, kcal (números inteiros) e confianca ("alta", "media" ou "baixa").
Se não for comida, devolva eh_comida false e score null. ${base} Formato: {"eh_comida": true, "score": 8.5, "analysis": "...", "items": ["..."], "proteina_g": 0, "carbo_g": 0, "gordura_g": 0, "kcal": 0, "confianca": "media"}`;
    case "ficha":
      return `Você lê fichas de treino de academia (papel, quadro, print ou foto de tela), em português. ${pergunta ? `A pessoa mandou ${pergunta}, na ordem: são páginas da MESMA ficha.` : ""} Separe cada treino da ficha (Treino A, B, C, ou por dia da semana, ou por grupo). Para cada treino:
- nome: curto, até 30 caracteres, ex "Treino A · Peito e Tríceps" (se a ficha já tiver um nome, use).
- grupos: escolha 1 a 4 destes, exatamente como escritos: Peito, Costas, Ombros, Bíceps, Tríceps, Abdômen, Lombar, Glúteos, Quadríceps, Posterior, Panturrilha, Corpo todo.
- exercicios: na ordem da ficha. nome: se for o mesmo exercício de um nome desta biblioteca, use EXATAMENTE o nome da biblioteca; se não houver equivalente, escreva o nome por extenso e corrigido (sem abreviação, ex "Sup. Inc. Halt." vira "Supino inclinado com halteres"). Biblioteca: ${contexto || "sem biblioteca"}.
- series: número inteiro (ex "4x12" tem series 4). Se não estiver escrito, use 3 e explique em duvida.
- reps: texto curto com as repetições como na ficha, ex "12", "10-12", "15/12/10", "30s", "até a falha". Se não estiver escrito, use "10" e explique em duvida.
- duvida: null quando a leitura estiver clara. Se a letra estiver difícil, cortada ou você tiver deduzido algo, escreva uma frase curta do que conferir (ex "Não deu pra ler as repetições").
Ignore cabeçalho, nome do aluno, do professor, datas, carga em kg e observações gerais. Não invente exercícios que não estão na foto. Se não for uma ficha de treino ou estiver ilegível, devolva legivel false e treinos vazio. ${base} Formato: {"legivel": true ou false, "treinos": [{"nome": "...", "grupos": ["..."], "exercicios": [{"nome": "...", "series": número, "reps": "...", "duvida": null ou "..."}]}]}`;
    default:
      return "";
  }
}

type Img = { mime: string; b64: string };
async function chamarGemini(prompt: string, imgs: Img[], temperatura = 0.3) {
  const erros: string[] = [];
  for (const modelo of MODELOS) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${CHAVE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, ...imgs.map((i) => ({ inline_data: { mime_type: i.mime, data: i.b64 } }))] }],
          generationConfig: { temperature: temperatura, responseMimeType: "application/json" },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const txt = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
        const m = txt.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
        erros.push(`${modelo}: resposta sem JSON`);
        break;
      }
      const corpo = (await r.text()).slice(0, 200);
      erros.push(`${modelo} [${r.status}]: ${corpo}`);
      if (r.status === 503 && tentativa === 0) { await new Promise((ok) => setTimeout(ok, 1500)); continue; }
      break; // 429 (cota) ou outro erro: tenta o próximo modelo
    }
  }
  throw new Error("Nenhum modelo respondeu.\n" + erros.join("\n"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!CHAVE) return resp({ error: "Chave do Gemini não configurada (GEMINI_API_KEY)" }, 500);
    const { task, imageUrl, imageBase64, mimeType, imagens, contexto, pergunta } = await req.json();
    const t = String(task || "");
    // a ficha manda a biblioteca de exercícios inteira, então aceita um contexto maior
    const prompt = instrucao(t, String(contexto || "").slice(0, t === "ficha" ? 4000 : 1500), String(pergunta || "").slice(0, 400));
    if (!prompt) return resp({ error: "tarefa desconhecida" }, 400);

    let b64 = imageBase64 as string | undefined;
    let mime = (mimeType as string) || "image/jpeg";
    if (!b64 && imageUrl) {
      const img = await fetch(String(imageUrl));
      if (!img.ok) return resp({ error: "não consegui baixar a foto" }, 400);
      mime = img.headers.get("content-type")?.split(";")[0] || mime;
      b64 = paraBase64(await img.arrayBuffer());
    }
    const lista: Img[] = Array.isArray(imagens)
      ? imagens.slice(0, 4).filter((i: { b64?: string }) => i && i.b64).map((i: { b64: string; mime?: string }) => ({ b64: i.b64, mime: i.mime || "image/jpeg" }))
      : [];
    if (!lista.length && b64) lista.push({ mime, b64 });
    if (!lista.length) return resp({ error: "sem foto" }, 400);

    const out = await chamarGemini(prompt, lista, t === "ficha" ? 0.1 : 0.3);
    return resp(out);
  } catch (e) {
    console.error("vision-tools erro:", e);
    // moderação nunca trava a postagem por erro técnico
    return resp({ error: String((e as Error).message || e) }, 500);
  }
});
