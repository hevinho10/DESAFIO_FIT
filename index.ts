// Pulso: envia as notificações push que estão na fila (push_fila)
// Chamada a cada minuto pelo pg_cron. Segredos necessários (Edge Functions > Secrets):
//   VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (ex: mailto:seuemail@gmail.com)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem por padrão.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const pub = Deno.env.get("VAPID_PUBLIC") ?? "";
    const priv = Deno.env.get("VAPID_PRIVATE") ?? "";
    const subj = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@pulso.app";
    if (!pub || !priv) return json({ erro: "faltam VAPID_PUBLIC/VAPID_PRIVATE" }, 500);
    webpush.setVapidDetails(subj, pub, priv);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // pega até 200 pendentes (ignora os que já falharam 3x)
    const { data: fila, error } = await sb.from("push_fila")
      .select("id, user_id, title, body, url, tag, tries")
      .is("sent_at", null).lt("tries", 3)
      .or(`enviar_em.is.null,enviar_em.lte.${new Date().toISOString()}`) // os agendados (descanso) só na hora
      .order("created_at", { ascending: true }).limit(200);
    if (error) throw error;
    if (!fila || !fila.length) return json({ enviados: 0 });

    // marca já como enviados pra não mandar duas vezes se o cron rodar junto
    const ids = fila.map((f) => f.id);
    await sb.from("push_fila").update({ sent_at: new Date().toISOString() }).in("id", ids);

    const usuarios = [...new Set(fila.map((f) => f.user_id))];
    const { data: subs } = await sb.from("push_subs").select("user_id, endpoint, p256dh, auth").in("user_id", usuarios);
    const porUser = new Map<string, any[]>();
    (subs ?? []).forEach((s) => {
      if (!porUser.has(s.user_id)) porUser.set(s.user_id, []);
      porUser.get(s.user_id)!.push(s);
    });

    let ok = 0;
    const mortos: string[] = [];
    const falhas: number[] = [];
    await Promise.all(fila.map(async (f) => {
      const lista = porUser.get(f.user_id) ?? [];
      const payload = JSON.stringify({ title: f.title, body: f.body, url: f.url, tag: f.tag });
      let algum = false, erroTemp = false;
      await Promise.all(lista.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload, String(f.tag || "").startsWith("descanso-") ? { TTL: 120, urgency: "high" } : { TTL: 60 * 60 * 6, urgency: "normal" },
          );
          algum = true;
        } catch (e: any) {
          const st = e?.statusCode;
          if (st === 404 || st === 410 || st === 403) mortos.push(s.endpoint); // inscrição vencida ou de outra chave
          else erroTemp = true;
        }
      }));
      if (algum) ok++;
      else if (erroTemp) falhas.push(f.id);
    }));

    if (mortos.length) await sb.from("push_subs").delete().in("endpoint", mortos);
    // erro temporário: volta pra fila e tenta de novo no próximo minuto
    for (const id of falhas) {
      const t = fila.find((f) => f.id === id)!.tries + 1;
      await sb.from("push_fila").update({ sent_at: null, tries: t }).eq("id", id);
    }
    return json({ enviados: ok, removidos: mortos.length, repetir: falhas.length });
  } catch (e) {
    return json({ erro: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
