// ============================================================
// PULSO - Edge Function: send-push
//
// Envia os lembretes por push, mesmo com o app fechado.
//
// COMO USAR:
//   POST { "janela": "manha" }     -> manda pra quem não registrou sono
//   POST { "janela": "meiodia" }   -> pra quem não bebeu água
//   POST { "janela": "tarde" }     -> água e treino do dia
//   POST { "janela": "noite" }     -> quem não registrou nada
//   POST { "user_id": "...", "titulo": "...", "corpo": "..." }  -> envio avulso
//
// SECRETS NECESSÁRIOS (Edge Functions > Secrets):
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT           ex: mailto:voce@email.com
//   SUPABASE_URL            (já existe no ambiente)
//   SUPABASE_SERVICE_ROLE_KEY (já existe no ambiente)
// ============================================================

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const pub = Deno.env.get("VAPID_PUBLIC_KEY");
    const priv = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@pulso.app";
    if (!pub || !priv) throw new Error("chaves VAPID não configuradas");

    webpush.setVapidDetails(subject, pub, priv);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const { janela, user_id, titulo, corpo } = body;

    // Monta a lista de quem vai receber
    let alvos: { user_id: string; titulo: string; corpo: string }[] = [];

    if (janela) {
      const { data, error } = await supabase.rpc("pending_reminders", { janela });
      if (error) throw error;
      alvos = (data || []).map((r: any) => ({
        user_id: r.user_id, titulo: r.titulo, corpo: r.corpo,
      }));
    } else if (user_id && corpo) {
      alvos = [{ user_id, titulo: titulo || "Pulso", corpo }];
    } else {
      throw new Error("informe janela ou user_id + corpo");
    }

    if (alvos.length === 0) {
      return new Response(JSON.stringify({ enviados: 0, motivo: "ninguém pendente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca as inscrições dessas pessoas
    const ids = [...new Set(alvos.map((a) => a.user_id))];
    const { data: subs, error: errSubs } = await supabase
      .from("push_subs").select("*").in("user_id", ids);
    if (errSubs) throw errSubs;

    let enviados = 0;
    let removidos = 0;

    for (const sub of subs || []) {
      const alvo = alvos.find((a) => a.user_id === sub.user_id);
      if (!alvo) continue;

      const payload = JSON.stringify({
        title: alvo.titulo,
        body: alvo.corpo,
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: janela || "pulso",
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        enviados++;
        await supabase.from("push_subs")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", sub.id);
      } catch (e: any) {
        // 404 e 410 significam inscrição morta: limpa do banco
        const code = e?.statusCode || e?.status;
        if (code === 404 || code === 410) {
          await supabase.from("push_subs").delete().eq("id", sub.id);
          removidos++;
        } else {
          console.error("falha no envio:", code, e?.message);
        }
      }
    }

    return new Response(JSON.stringify({ enviados, removidos, alvos: alvos.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push erro:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message || err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
