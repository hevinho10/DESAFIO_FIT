// ============================================================
// CONFIG (mesmo projeto Supabase do FIT)
// ============================================================
const SUPABASE_URL = 'https://wkvwrtwovcfnvfgleslq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdndydHdvdmNmbnZmZ2xlc2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTE2MTQsImV4cCI6MjA2NzkyNzYxNH0.osy_C1SsPJ7t8BJlri7DpVDJU64S_IfRzy9KEBP9VMY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// STATE
// ============================================================
const state = {
    session: null,
    profile: null,
    score: 0,
    view: 'feed',
    posts: [],
    composerKind: 'workout',
    salvos: new Set(),
    composerPhoto: null,
    composerPrivacy: 'followers',  // padrão dinâmico ajustado no boot
    composerBg: '#35E19B',
    storiesData: [],
    storyIdx: 0,
    storyItemIdx: 0,
    storyTimer: null,
    coachContext: null,
    coachHistory: [],
    chatMessages: [],
};

// ============================================================
// HELPERS
// ============================================================
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const PAL = ['#35E19B','#5FB0FF','#FF7A4D','#C08BFF','#FFC24B','#4FD6C4','#FF6FA5','#8AD65E'];
const colorFor = s => { let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return PAL[h%PAL.length]; };
const initials = n => String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const avatarHTML = (p, size='md') => {
    const cls = size==='sm'?'avatar-sm':size==='lg'?'avatar-lg':'avatar-md';
    const bg = colorFor(String(p?.id || p?.username || 'x'));
    if (p?.avatar_url) return `<span class="avatar ${cls}" style="background:${bg}"><img src="${p.avatar_url}" onerror="this.remove()"></span>`;
    return `<span class="avatar ${cls}" style="background:${bg}">${initials(p?.display_name || p?.username || '?')}</span>`;
};
// Ícones de traço fino usados nos menus
const ICO = {
    peso:'<path d="M12 4v16M7 8h10M6 8l-3 7a3 3 0 0 0 6 0L6 8zM18 8l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
    saude:'<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8.1a5.2 5.2 0 0 0 0-7.3z"/>',
    historico:'<path d="M3 16l5-5 4 3 8-8M15 6h6v6"/>',
    grafico:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    perfil:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    times:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M10.5 20a5.5 5.5 0 0 1 11 0"/>',
    comunidade:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    config:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z"/>',
    admin:'<path d="M14.7 6.3a4 4 0 0 1 5 5l-9.7 9.7a2 2 0 0 1-2.8-2.8l9.7-9.7a1 1 0 0 0-1.4-1.4L5 17.6M3 21l3-1-2-2-1 3z"/>',
    sair:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    editar:'<path d="M4 20h16M6 16l9-9 3 3-9 9H6v-3z"/>',
    olho:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    lixo:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    bandeira:'<path d="M4 21V4M4 5h11l-1.5 3L15 11H4"/>',
    bloquear:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    ok:'<path d="M4 12l5 5L20 6"/>',
    instalar:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/>',
    medalha:'<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5"/>',
    cadeado:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    baixar:'<path d="M12 3v12M8 11l4 4 4-4M4 20h16"/>',
    alerta:'<path d="M12 3l9 17H3l9-17zM12 9v5M12 17h.01"/>',
    sino:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0"/>',
    mensagem:'<path d="M22 3L11 13M22 3l-7 19-4-9-9-4 20-6z"/>',
    comentario:'<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    pessoaMais:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
    storyOculto:'<path d="M3 3l18 18M10.6 5.1A8 8 0 0 1 20 12.5M18.4 18.4A8 8 0 0 1 5.6 5.6M4.2 9.5A8 8 0 0 0 4 12a8 8 0 0 0 2.3 5.6"/>',
    tema:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    mais:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8.5v7M8.5 12h7"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    chave:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    salvo:'<path d="M6 3h12v18l-6-4.5L6 21z"/>',
    agua:'<path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z"/>',
    coach:'<rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 15.5h5"/>',
    alvo:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
};
const icon = (nome) => `<svg class="mi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICO[nome] || ''}</svg>`;

const OBJETIVOS = [
    ['massa', 'Ganhar massa', 'músculo e força'],
    ['gordura', 'Perder gordura', 'emagrecer com saúde'],
    ['energia', 'Mais energia', 'disposição no dia a dia'],
    ['rotina', 'Criar constância', 'não largar no meio'],
    ['saude', 'Cuidar da saúde', 'exames e bem-estar'],
    ['performance', 'Performance', 'melhorar no esporte'],
];
const msgErro = (e) => {
    const t = String((e && (e.message || e.error_description || e)) || '').toLowerCase();
    if (!navigator.onLine || t.includes('failed to fetch') || t.includes('networkerror')) {
        return 'Sem conexão agora. O que você escreveu continua aqui, tente de novo em instantes.';
    }
    if (t.includes('timeout')) return 'A internet está lenta. Tente de novo em instantes.';
    if (t.includes('duplicate') || t.includes('23505')) return 'Isso já foi registrado.';
    if (t.includes('row-level security') || t.includes('permission')) return 'Você não tem permissão pra isso.';
    // Mensagens escritas por nós no banco (em português, sem jargão) aparecem como vieram
    const original = String((e && e.message) || '');
    if (original && original.length < 140 && /[áéíóúãõç]|^[A-ZÁÉÍÓÚ][a-záéíóúãõç ]+/.test(original)
        && !/violates|relation|column|syntax|function|constraint|null value|duplicate key/i.test(original)) return original;
    console.warn('erro não tratado:', e);
    return 'Não consegui completar agora. Tente de novo em instantes.';
};
// Admin vê o erro técnico completo; os demais, a mensagem amigável
const erroParaAdmin = (e) => {
    console.error(e);
    if (state && state.profile && state.profile.is_admin) {
        return 'Erro: ' + [e && e.message, e && e.details, e && e.hint, e && e.code].filter(Boolean).join(' | ');
    }
    return msgErro(e);
};
const plural = (n, sing, plur) => `${n} ${Number(n) === 1 ? sing : plur}`;
const escapeHTML = s => String(s||'').replace(/[\u2014\u2013]/g, '-').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timeAgo = iso => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff/60)}min`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d`;
    return new Date(iso).toLocaleDateString('pt-BR');
};
const toast = (msg, kind='ok') => {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

// ============================================================
// PONTOS (cálculo cliente; depois migra pra edge function)
// ============================================================
const INTENSITY = {
    'Musculação':1.0,'Corrida':1.0,'Natação':1.0,'Ciclismo':1.0,'HIIT':1.0,
    'Caminhada':0.7,'Pilates':0.7,'Yoga':0.7,'Dança':0.7,'Alongamento':0.7,
    'Futebol':1.0,
    'Outro':0.8
};

// Distância (e ritmo) ou grupos musculares, pro selo do post
const ATIVIDADES_COM_KM = ['Corrida', 'Caminhada', 'Ciclismo', 'Natação', 'Futebol'];
// distância: valor inicial e passo do contador por atividade
const KM_PADRAO = { 'Corrida': [3, 0.5], 'Caminhada': [2, 0.5], 'Futebol': [5, 0.5], 'Ciclismo': [10, 1], 'Natação': [1, 0.25] };
// grupos novos contam nas categorias antigas (equilíbrio muscular e coach)
const GRUPO_CATEGORIA = { 'Bíceps': 'Braços', 'Tríceps': 'Braços', 'Quadríceps': 'Pernas', 'Posterior': 'Pernas', 'Panturrilha': 'Pernas', 'Lombar': 'Costas' };
const categoriasMusculares = lista => [...new Set((lista || []).map(g => GRUPO_CATEGORIA[g] || g))];
function formatarPace(min, km) {
    if (!min || !km) return '';
    const seg = Math.round((min * 60) / km);
    return `${Math.floor(seg / 60)}'${String(seg % 60).padStart(2, '0')}"/km`;
}
function detalheTreino(p) {
    let t = '';
    const km = Number(p.distance_km || 0);
    if (km > 0) {
        t += ` · <b>${String(km).replace('.', ',')} km</b>`;
        if (p.activity_type === 'Corrida' || p.activity_type === 'Caminhada') {
            const pace = formatarPace(p.duration_min, km);
            if (pace) t += ` · ${pace}`;
        }
    }
    if (Array.isArray(p.muscle_groups) && p.muscle_groups.length) {
        t += ` · ${p.muscle_groups.map(escapeHTML).join(', ')}`;
    }
    return t;
}

function workoutPoints(type, duration, hasPhoto) {
    const factor = INTENSITY[type] || 0.8;
    let pts = Math.min(15, (duration / 6) * factor);  // teto de 15 por sessão
    if (hasPhoto) pts += 3;
    return Math.round(pts * 10) / 10;
}

// Reduz a foto antes de subir: economiza dados e deixa o feed leve
function compressImage(file, maxSide = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            const maior = Math.max(width, height);
            if (maior > maxSide) {
                const f = maxSide / maior;
                width = Math.round(width * f);
                height = Math.round(height * f);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const universal = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
            canvas.toBlob(blob => resolve(blob && (!universal || blob.size < file.size) ? blob : file), 'image/jpeg', quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

async function uploadImage(bucket, file, opts = {}) {
    const blob = await compressImage(file, opts.maxSide || 1200, opts.quality || 0.8);
    const ext = (blob.type === 'image/jpeg' || blob !== file) ? 'jpg' : (file.name.split('.').pop() || 'jpg');
    const path = opts.fixedName
        ? `${state.session.user.id}/${opts.fixedName}.${ext}`
        : `${state.session.user.id}/${Date.now()}.${ext}`;
    if (opts.fixedName) await sb.storage.from(bucket).remove([path]);
    const { error } = await sb.storage.from(bucket).upload(path, blob, { upsert: !!opts.fixedName, contentType: blob.type || 'image/jpeg' });
    if (error) throw error;
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ---- Fotos privadas (balança e registros "Só eu") ficam em pasta PRIVADA ----
// No banco a foto aparece como "privado:<caminho>". O app troca por um link temporário na hora de mostrar.
const BUCKET_PRIVADO = 'private-images';
const ehPrivada = url => typeof url === 'string' && url.startsWith('privado:');
async function uploadImagemPrivada(file) {
    const blob = await compressImage(file, 1200, 0.8);
    const path = `${state.session.user.id}/${Date.now()}.jpg`;
    const { error } = await sb.storage.from(BUCKET_PRIVADO).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return 'privado:' + path;
}
const cacheLinksPrivados = {};
async function linkPrivado(ref, validadeSeg = 3600) {
    const path = ref.slice('privado:'.length);
    const c = cacheLinksPrivados[path];
    if (c && c.ate > Date.now() + 60000) return c.url;
    const { data } = await sb.storage.from(BUCKET_PRIVADO).createSignedUrl(path, validadeSeg);
    if (data && data.signedUrl) cacheLinksPrivados[path] = { url: data.signedUrl, ate: Date.now() + validadeSeg * 1000 };
    return data ? data.signedUrl : '';
}
// Qualquer <img src="privado:..."> que aparecer na tela é resolvida sozinha
(function resolverImagensPrivadas() {
    const pendentes = new Set();
    let agendado = false;
    const processar = () => {
        agendado = false;
        document.querySelectorAll('img[src^="privado:"]').forEach(img => {
            const ref = img.getAttribute('src');
            if (pendentes.has(img)) return;
            pendentes.add(img);
            img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
            img.dataset.privado = ref;
            linkPrivado(ref).then(u => { if (u) img.src = u; pendentes.delete(img); });
        });
    };
    new MutationObserver(() => { if (!agendado) { agendado = true; requestAnimationFrame(processar); } })
        .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
})();
// Mudou de "Só eu" pra público/seguidores: a foto sai da pasta privada
async function tornarFotoPublica(postId) {
    const { data: p } = await sb.from('posts').select('image_url').eq('id', postId).maybeSingle();
    if (!p || !ehPrivada(p.image_url)) return;
    const path = p.image_url.slice('privado:'.length);
    const { data: blob, error } = await sb.storage.from(BUCKET_PRIVADO).download(path);
    if (error || !blob) throw error || new Error('download');
    const novoPath = `${state.session.user.id}/${Date.now()}.jpg`;
    const up = await sb.storage.from('post-images').upload(novoPath, blob, { contentType: 'image/jpeg' });
    if (up.error) throw up.error;
    const url = sb.storage.from('post-images').getPublicUrl(novoPath).data.publicUrl;
    await sb.from('posts').update({ image_url: url }).eq('id', postId);
    await sb.storage.from(BUCKET_PRIVADO).remove([path]);
    document.querySelectorAll(`.post[data-post-id="${postId}"] img.post-photo`).forEach(i => { i.src = url; });
}
// Miniatura leve pra grade do perfil (a foto grande só carrega ao abrir)
async function uploadMiniatura(file) {
    try {
        const blob = await compressImage(file, 420, 0.72);
        const path = `${state.session.user.id}/${Date.now()}_t.jpg`;
        const { error } = await sb.storage.from('post-images').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) return null;
        return sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
    } catch (_) { return null; }
}

// Apaga do storage a imagem de um post que foi removido
async function removeStoredImage(url) {
    if (!url) return;
    if (ehPrivada(url)) {
        try { await sb.storage.from(BUCKET_PRIVADO).remove([url.slice('privado:'.length)]); } catch (e) {}
        return;
    }
    const marcador = '/post-images/';
    const i = url.indexOf(marcador);
    if (i === -1) return;
    const path = decodeURIComponent(url.slice(i + marcador.length).split('?')[0]);
    try { await sb.storage.from('post-images').remove([path]); } catch (e) {}
}

async function creditPoints(amount, reason, referenceId=null) {
    const { error } = await sb.from('points_ledger').insert({
        user_id: state.session.user.id,
        amount,
        reason,
        reference_id: referenceId
    });
    if (error) console.error('credit failed', error);
}

async function updateStreak(activityDate) {
    const { data, error } = await sb.rpc('update_streak', {
        uid: state.session.user.id,
        activity_date: activityDate
    });
    if (error) { console.error('streak', error); return null; }
    return data?.[0];
}

async function loadScore() {
    const { data, error } = await sb.rpc('user_score', { uid: state.session.user.id });
    if (!error) {
        state.score = Number(data || 0);
        const ts = document.getElementById('topScore');
        if (ts) ts.textContent = Math.round(state.score);
    }
    refreshWeeklyPill();
}

async function countTodayByReason(reason) {
    const start = new Date(); start.setHours(0,0,0,0);
    const { count } = await sb.from('points_ledger')
        .select('*', { count:'exact', head:true })
        .eq('user_id', state.session.user.id)
        .eq('reason', reason)
        .gte('earned_at', start.toISOString());
    return count || 0;
}

// ============================================================
// STEPPERS (botões − e + em campos numéricos)
// ============================================================
document.addEventListener('click', e => {
    const btn = e.target.closest('.step-btn');
    if (!btn) return;
    const stepper = btn.closest('.stepper');
    const input = document.getElementById(stepper.dataset.target);
    if (!input) return;
    const step = parseFloat(stepper.dataset.step) || 1;
    const min = parseFloat(stepper.dataset.min);
    const max = parseFloat(stepper.dataset.max);
    const def = parseFloat(stepper.dataset.default);
    const dir = btn.dataset.dir === '+' ? 1 : -1;
    let cur = parseFloat(input.value);
    if (isNaN(cur)) cur = def;
    let next = cur + (step * dir);
    if (!isNaN(min) && next < min) next = min;
    if (!isNaN(max) && next > max) next = max;
    // Formata pra evitar 78.30000001
    input.value = step < 1 ? Number(next).toFixed(String(step).split('.')[1]?.length || 1) : Math.round(next);
    // Dispara event pra quem escuta
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
});

// Ao focar num stepper vazio, preencher com o default
document.addEventListener('focusin', e => {
    if (e.target.matches('.stepper input') && !e.target.value) {
        const stepper = e.target.closest('.stepper');
        const def = stepper.dataset.default;
        if (def) e.target.value = def;
    }
});

// Alterna entre subtelas: signin, signup, forgot-step1, forgot-step2, await-confirm, reset-password
function showAuthScreen(name) {
    const screens = {
        'signin':         ['signinForm', true],
        'signup':         ['signupForm', true],
        'forgot-step1':   ['forgotStep1', false],
        'forgot-step2':   ['forgotStep2', false],
        'await-confirm':  ['awaitConfirm', false],
        'reset-password': ['resetPasswordForm', false],
    };
    Object.values(screens).forEach(([id]) => $('#'+id).classList.add('hidden'));
    const [showId, showTabs] = screens[name];
    $('#'+showId).classList.remove('hidden');
    $('#authTabs').classList.toggle('hidden', !showTabs);
    $('#authHint').classList.toggle('hidden', !showTabs);
    if (showTabs) {
        $$('.auth-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    }
}

// Cliques nos tabs
$$('.auth-tab').forEach(btn => btn.addEventListener('click', e => {
    showAuthScreen(e.currentTarget.dataset.tab);
}));

// Cliques nos data-goto (links internos entre subtelas)
document.addEventListener('click', e => {
    // Toggle mostrar/esconder senha
    const pwBtn = e.target.closest('.pw-toggle');
    if (pwBtn) {
        const target = document.getElementById(pwBtn.dataset.pwTarget);
        if (target) {
            const isPw = target.type === 'password';
            target.type = isPw ? 'text' : 'password';
            pwBtn.setAttribute('aria-label', isPw ? 'Esconder senha' : 'Mostrar senha');
            // Ícone muda: olho aberto <-> olho cortado
            pwBtn.innerHTML = isPw
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
        return;
    }

    const el = e.target.closest('[data-goto]');
    if (!el) return;
    const target = el.dataset.goto;
    if (target === 'forgot') {
        // pré-preenche o email da tela de login se tiver
        const guess = $('#siLogin').value.trim();
        if (guess.includes('@')) $('#fpEmail').value = guess;
        showAuthScreen('forgot-step1');
    } else if (target === 'forgot-step1') {
        showAuthScreen('forgot-step1');
    } else if (target === 'signin') {
        showAuthScreen('signin');
    }
});

// ---- SIGN IN (email OU username) ----
$('#signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#siBtn'), msg = $('#siMsg');
    const loginInput = $('#siLogin').value.trim();
    const password = $('#siPassword').value;
    if (!loginInput || !password) return;

    btn.disabled = true; btn.textContent = 'Entrando...'; msg.innerHTML = '';

    let email = loginInput;

    // Se não parece email, trata como username: resolve pra email via RPC
    if (!loginInput.includes('@')) {
        const { data: resolvedEmail, error: rpcErr } = await sb.rpc('get_email_by_username', { uname: loginInput });
        if (rpcErr || !resolvedEmail) {
            btn.disabled = false; btn.textContent = 'Entrar';
            msg.className = 'auth-msg err';
            msg.textContent = 'Usuário ou senha incorretos.';
            return;
        }
        email = resolvedEmail;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.textContent = 'Entrar';

    if (error) {
        msg.className = 'auth-msg err';
        if (error.message.toLowerCase().includes('email not confirmed')) {
            msg.textContent = 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.';
            $('#acShowEmail').textContent = email;
            setTimeout(() => showAuthScreen('await-confirm'), 800);
        } else if (error.message.toLowerCase().includes('invalid')) {
            msg.textContent = 'Email/usuário ou senha incorretos.';
        } else {
            msg.textContent = error.message;
        }
    }
});

// ---- SIGN UP com validação em tempo real do username ----
let usernameCheckTimer = null;
let lastCheckedUsername = null;
let usernameIsAvailable = false;

$('#suUsername').addEventListener('input', e => {
    const val = e.target.value.trim().toLowerCase();
    const status = $('#suUsernameStatus');

    clearTimeout(usernameCheckTimer);

    const BANNED = ['teste','tests','test','testes','admin','administrador','root','user','usuario','null','undefined','anonimo','anonymous','none','xxxx','abc','abcd','xyz'];

    if (!val) { status.textContent = ''; status.className = 'uname-status'; usernameIsAvailable = false; return; }
    if (val.length < 3) { status.textContent = 'muito curto'; status.className = 'uname-status err'; usernameIsAvailable = false; return; }
    if (!/^[a-z0-9_]+$/.test(val)) { status.textContent = 'só letras, números e _'; status.className = 'uname-status err'; usernameIsAvailable = false; return; }
    if (!/[a-z]/.test(val)) { status.textContent = 'precisa ter pelo menos 1 letra'; status.className = 'uname-status err'; usernameIsAvailable = false; return; }
    if (BANNED.includes(val) || /^teste/.test(val) || /^test[0-9]*$/.test(val)) {
        status.textContent = 'nome não permitido';
        status.className = 'uname-status err';
        usernameIsAvailable = false;
        return;
    }

    status.textContent = 'verificando...';
    status.className = 'uname-status checking';

    usernameCheckTimer = setTimeout(async () => {
        const { data: available, error } = await sb.rpc('check_username_available', { uname: val });
        if (error) { status.textContent = ''; status.className = 'uname-status'; return; }
        lastCheckedUsername = val;
        usernameIsAvailable = !!available;
        if (available) { status.textContent = '✓ disponível'; status.className = 'uname-status ok'; }
        else { status.textContent = '✗ já em uso'; status.className = 'uname-status err'; }
    }, 400);
});

$('#signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#suBtn'), msg = $('#suMsg');
    const username = $('#suUsername').value.trim().toLowerCase();
    const displayName = $('#suName').value.trim();
    const email = $('#suEmail').value.trim();
    const password = $('#suPassword').value;

    msg.innerHTML = '';

    const BANNED_NAMES = ['teste','test','testes','admin','user','usuario','null','undefined','abc','xyz','anonimo','anonymous'];

    // Nome de exibição
    if (displayName.length < 2) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Nome de exibição precisa ter pelo menos 2 caracteres.';
        return;
    }
    const dnLower = displayName.toLowerCase();
    if (BANNED_NAMES.includes(dnLower) || /^teste/.test(dnLower) || /^test[0-9]*$/.test(dnLower)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Este nome de exibição não é permitido. Use seu nome real.';
        return;
    }

    // Username
    if (!/^[a-z0-9_]+$/.test(username)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Usuário só pode ter letras, números e _';
        return;
    }
    if (username.length < 3) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Usuário precisa ter no mínimo 3 caracteres.';
        return;
    }
    if (!/[a-z]/.test(username)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Usuário precisa ter pelo menos uma letra (não pode ser só números).';
        return;
    }
    if (BANNED_NAMES.includes(username) || /^teste/.test(username) || /^test[0-9]*$/.test(username)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Este usuário não é permitido. Escolha outro.';
        return;
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Email inválido.';
        return;
    }

    // Senha forte: mínimo 6, com pelo menos 1 número e 1 caractere especial
    if (password.length < 6) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter no mínimo 6 caracteres.';
        return;
    }
    if (!/[0-9]/.test(password)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter pelo menos 1 número.';
        return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter pelo menos 1 caractere especial (!@#$%&*...).';
        return;
    }

    // Username duplicado
    if (lastCheckedUsername === username && !usernameIsAvailable) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Este usuário já está em uso. Escolha outro.';
        return;
    }
    if (lastCheckedUsername !== username) {
        const { data: available } = await sb.rpc('check_username_available', { uname: username });
        if (available === false) {
            msg.className = 'auth-msg err';
            msg.textContent = 'Este usuário já está em uso. Escolha outro.';
            return;
        }
    }

    btn.disabled = true; btn.textContent = 'Criando...';

    const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { username, display_name: displayName } }
    });

    btn.disabled = false; btn.textContent = 'Criar conta';

    if (error) {
        msg.className = 'auth-msg err';
        if (error.message.toLowerCase().includes('registered') || error.message.toLowerCase().includes('already')) {
            msg.textContent = 'Este email já tem conta. Tente entrar ou recuperar a senha.';
        } else if (error.message.toLowerCase().includes('password')) {
            msg.textContent = 'Senha muito fraca. Use pelo menos 6 caracteres com número e especial.';
        } else if (error.message.toLowerCase().includes('database')) {
            msg.textContent = 'Erro no banco. Rode o fix_signup.sql no Supabase.';
        } else {
            msg.textContent = error.message;
        }
        return;
    }

    // Se precisa confirmar email (sem session), mostra tela de espera
    if (data.user && !data.session) {
        $('#acShowEmail').textContent = email;
        showAuthScreen('await-confirm');
    }
    // Se veio session direto (confirmação desabilitada), o onAuthStateChange cuida
});

// ---- FORGOT PASSWORD: envia link por email ----
$('#fpSendBtn').addEventListener('click', async () => {
    const btn = $('#fpSendBtn'), msg = $('#fpMsg1');
    const email = $('#fpEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Digite um email válido.';
        return;
    }
    btn.disabled = true; btn.textContent = 'Enviando...'; msg.innerHTML = '';

    const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    });

    btn.disabled = false; btn.textContent = 'Enviar link';

    // Por segurança, não revela se o email existe
    $('#fpShowEmail').textContent = email;
    setTimeout(() => showAuthScreen('forgot-step2'), 400);
});

// ---- RESET PASSWORD: após clicar no link, definir nova senha ----
$('#rpBtn').addEventListener('click', async () => {
    const btn = $('#rpBtn'), msg = $('#rpMsg');
    const pw1 = $('#rpPassword').value;
    const pw2 = $('#rpPassword2').value;

    msg.innerHTML = '';

    if (pw1.length < 6) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter no mínimo 6 caracteres.';
        return;
    }
    if (!/[0-9]/.test(pw1)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter pelo menos 1 número.';
        return;
    }
    if (!/[^a-zA-Z0-9]/.test(pw1)) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Senha precisa ter pelo menos 1 caractere especial.';
        return;
    }
    if (pw1 !== pw2) {
        msg.className = 'auth-msg err';
        msg.textContent = 'As senhas não coincidem.';
        return;
    }

    btn.disabled = true; btn.textContent = 'Salvando...';

    const { error } = await sb.auth.updateUser({ password: pw1 });

    btn.disabled = false; btn.textContent = 'Salvar nova senha';

    if (error) {
        msg.className = 'auth-msg err';
        msg.textContent = 'Erro: ' + error.message;
        return;
    }

    msg.className = 'auth-msg ok';
    msg.textContent = 'Senha atualizada! Entrando...';
    // A sessão já é válida (veio do link), então o boot vai carregar o app
    setTimeout(() => boot(), 800);
});

// ---- REENVIAR EMAIL DE CONFIRMAÇÃO ----
$('#acResendBtn').addEventListener('click', async () => {
    const btn = $('#acResendBtn'), msg = $('#acMsg');
    const email = $('#acShowEmail').textContent;
    btn.disabled = true; btn.textContent = 'Enviando...'; msg.innerHTML = '';
    const { error } = await sb.auth.resend({ type: 'signup', email });
    btn.disabled = false; btn.textContent = 'Reenviar email';
    if (error) {
        msg.className = 'auth-msg err';
        msg.textContent = error.message.toLowerCase().includes('rate') ? 'Aguarde alguns segundos antes de reenviar.' : error.message;
    } else {
        msg.className = 'auth-msg ok';
        msg.textContent = 'Email reenviado! Verifique sua caixa.';
    }
});

function showProfileMenu(anchor, isAdmin) {
    // Toggle: se já está aberto, fecha
    const existing = document.getElementById('floatingPostMenu');
    if (existing && existing.dataset.menuType === 'profile') {
        existing.remove();
        return;
    }
    hidePostMenu();

    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.dataset.menuType = 'profile';
    menu.className = 'post-menu';
    menu.innerHTML = `
        <button class="post-menu-item" data-act="open-weight-log">${icon('peso')}Registrar peso</button>
        <button class="post-menu-item" data-act="go-health">${icon('saude')}Ficha de saúde</button>
        <button class="post-menu-item" data-act="go-activity-log">${icon('historico')}Histórico</button>
        <button class="post-menu-item" data-act="go-compare">${icon('olho')}Antes e depois</button>
        <button class="post-menu-item" data-act="go-challenges">${icon('comunidade')}Desafios</button>
        <button class="post-menu-item" data-act="go-settings">${icon('config')}Configurações</button>
        ${isAdmin ? `<div class="menu-divider"></div><button class="post-menu-item admin-item" data-act="go-admin">${icon('admin')}Painel Admin</button>` : ''}
        <div class="menu-divider"></div>
        <button class="post-menu-item danger" data-act="do-logout">${icon('sair')}Sair</button>
    `;
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}

// ============================================================
// PAINEL ADMIN
// ============================================================
async function renderAdmin() {
    const c = $('#viewContainer');
    if (!state.profile.is_admin) {
        c.innerHTML = '<div class="view"><p style="color:var(--danger)">Acesso restrito.</p></div>';
        return;
    }
    c.innerHTML = '<div class="view"><div class="spinner"></div></div>';

    const [{ data: ov, error: ovErr }, { data: users, error: usErr }, { data: criadores }] = await Promise.all([
        sb.rpc('admin_overview'),
        sb.rpc('admin_user_list'),
        sb.from('profiles').select('id').eq('can_create_challenges', true),
    ]);
    const podeCriar = new Set((criadores || []).map(x => x.id));
    const { data: acessos } = await sb.from('profiles').select('id, app_installed, last_device, last_seen_at, display_name, username, avatar_url, access_status');
    const acessoDe = {}; (acessos || []).forEach(a => { acessoDe[a.id] = a; });
    const NOME_APARELHO = { iphone: 'iPhone', android: 'Android', computador: 'computador' };
    const comoUsa = a => !a || a.app_installed == null ? ' · <span class="adm-sem">acesso ainda não registrado</span>' : a.app_installed ? ` · <span class="adm-inst">instalado${a.last_device ? ' (' + NOME_APARELHO[a.last_device] + ')' : ''}</span>` : ` · navegador${a.last_device ? ' (' + NOME_APARELHO[a.last_device] + ')' : ''}`;
    const sumidosAcesso = (acessos || []).filter(a => a.id !== state.session.user.id && (a.access_status || 'aprovado') === 'aprovado'
        && a.last_seen_at && Date.now() - new Date(a.last_seen_at) > 15 * 86400000)
        .sort((x, y) => new Date(x.last_seen_at) - new Date(y.last_seen_at));

    if (ovErr) { c.innerHTML = `<div class="view"><p style="color:var(--danger)">Erro: ${ovErr.message}</p></div>`; return; }
    const o = ov?.[0] || {};

    const usersHTML = (users || []).map((u, i) => {
        const lastActive = u.last_active_at ? timeAgo(u.last_active_at) : 'nunca postou';
        return `<div class="admin-user-row" data-act="view-user" data-uid="${u.id}">
            <span class="admin-user-pos">${i+1}</span>
            ${avatarHTML(u, 'sm')}
            <div class="admin-user-info">
                <div class="admin-user-name">${escapeHTML(u.display_name)} <span class="admin-user-uname">@${escapeHTML(u.username)}</span></div>
                <div class="admin-user-meta">${u.total_posts} posts · ${u.current_streak} · ativo ${lastActive}${comoUsa(acessoDe[u.id])}</div>
            </div>
            <div class="admin-user-score">${Math.round(u.score)}</div>
            ${u.id !== state.session.user.id ? `<button class="criador-toggle${podeCriar.has(u.id) ? ' on' : ''}" data-act="toggle-creator" data-uid="${u.id}" data-on="${podeCriar.has(u.id) ? '1' : '0'}">${podeCriar.has(u.id) ? 'Cria desafios' : 'Liberar desafios'}</button>` : ''}
        </div>`;
    }).join('') || '<div class="log-empty">Nenhum usuário ainda.</div>';

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-profile">←</button>
                <div class="topbar-title">Painel Admin</div>
                <div style="width:28px"></div>
            </div>

            <div class="evo-abas adm-abas">
                ${[['geral', 'Visão geral'], ['cadastros', 'Cadastros'], ['usuarios', 'Usuários'], ['ferramentas', 'Ferramentas']].map(([k, n]) =>
                    `<button class="evo-aba${(state.abaAdmin || 'geral') === k ? ' on' : ''}" data-act="adm-aba" data-aba="${k}">${n}</button>`).join('')}
            </div>

            <div class="adm-painel${(state.abaAdmin || 'geral') === 'geral' ? '' : ' hidden'}" data-painel="geral">
            <div class="stat-grid">
                <div class="stat-card"><div class="num">${o.total_usuarios||0}</div><div class="lbl">Total de usuários</div></div>
                <div class="stat-card"><div class="num">${o.novos_7d||0}</div><div class="lbl">Novos (7 dias)</div></div>
                <div class="stat-card"><div class="num">${o.ativos_hoje||0}</div><div class="lbl">Ativos hoje</div></div>
                <div class="stat-card"><div class="num">${o.ativos_7d||0}</div><div class="lbl">Ativos (7 dias)</div></div>
            </div>
            <div class="stat-grid" style="margin-top:10px">
                <div class="stat-card"><div class="num">${o.total_treinos||0}</div><div class="lbl">Treinos totais</div></div>
                <div class="stat-card"><div class="num">${o.total_refeicoes||0}</div><div class="lbl">Refeições totais</div></div>
                <div class="stat-card"><div class="num">${o.nota_media_refeicoes ? br(o.nota_media_refeicoes) : '-'}</div><div class="lbl">Nota média pratos</div></div>
                <div class="stat-card"><div class="num">${o.maior_streak_atual||0}</div><div class="lbl">Maior streak ativo</div></div>
            </div>
            <div class="health-card" style="text-align:center">
                <span class="hc-title">⚡ Pontos distribuídos (todo o histórico)</span>
                <div style="font-family:var(--ff-display); font-size:28px; font-weight:700; color:var(--vital); margin-top:8px">
                    ${Math.round(o.pontos_distribuidos_total||0)}
                </div>
            </div>

            <h3 class="edit-section-title" style="margin-top:22px">Uso do app</h3>
            <div id="metricasBox"><div class="spinner"></div></div>

            <h3 class="edit-section-title" style="margin-top:22px">Quem volta</h3>
            <div id="retencaoBox"><div class="spinner"></div></div>

            <h3 class="edit-section-title" style="margin-top:22px">Sem abrir o app há 15+ dias</h3>
            <div class="chart-card">
                ${sumidosAcesso.length ? sumidosAcesso.map(a => `<div class="nc-user">
                    <span data-act="view-user" data-uid="${a.id}">${avatarHTML(a, 'sm')}</span>
                    <div class="nc-info" data-act="view-user" data-uid="${a.id}"><b>${escapeHTML(a.display_name || '')}</b><small>sem abrir há uns ${Math.floor((Date.now() - new Date(a.last_seen_at)) / 86400000)} dias</small></div>
                    <button class="btn-mini" data-act="start-chat" data-uid="${a.id}" data-name="${escapeHTML(a.display_name || '')}" data-username="${escapeHTML(a.username || '')}" data-avatar="${a.avatar_url || ''}">Mandar mensagem</button>
                </div>`).join('') : '<p class="faixa-nota">Todo mundo abriu o app nos últimos 15 dias. 🎉</p>'}
                <p class="faixa-nota">Conta a partir do último acesso registrado (o app registra a cada 15 dias).</p>
            </div>
            </div>

            <div class="adm-painel${state.abaAdmin === 'cadastros' ? '' : ' hidden'}" data-painel="cadastros">
            <div id="cadastrosBox"><div class="spinner"></div></div>
            </div>

            <div class="adm-painel${state.abaAdmin === 'ferramentas' ? '' : ' hidden'}" data-painel="ferramentas">
            <h3 class="edit-section-title">Alterações feitas por você</h3>
            <div class="chart-card" id="admLog"><div class="spinner"></div></div>
            <h3 class="edit-section-title" style="margin-top:22px">Backup</h3>
            <div class="chart-card">
                <p class="faixa-txt" style="margin-top:0">Baixa uma cópia dos dados do app (perfis, registros, desafios, stories) num arquivo. As fotos não entram no arquivo; elas continuam guardadas no Supabase. Faça pelo menos uma vez por semana e guarde num lugar seguro (Google Drive, por exemplo).</p>
                <button class="btn-mini" data-act="admin-backup" style="margin-top:12px">Baixar backup agora</button>
                <p class="faixa-nota" id="backupInfo"></p>
            </div>

            </div>

            <div class="adm-painel${state.abaAdmin === 'usuarios' ? '' : ' hidden'}" data-painel="usuarios">
            <div id="admUsuarios"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    state.admPodeCriar = podeCriar;
    hydrateAdminUsuarios();
    hydrateAdminLog();
    hydrateNovosCadastros().then(() => {
        const n = document.querySelectorAll('#cadastrosBox [data-status="aprovado"]').length - document.querySelectorAll('#cadastrosBox details [data-status="aprovado"]').length;
        const aba = document.querySelector('.adm-abas [data-aba="cadastros"]');
        if (aba && n > 0) aba.innerHTML = `Cadastros <span class="cfg-aviso">${n}</span>`;
    });

    // Métricas de uso
    sb.rpc('admin_metrics').then(({ data: m, error }) => {
        const mb = document.getElementById('metricasBox');
        if (!mb) return;
        if (error || !m) { mb.innerHTML = `<p class="faixa-nota">Não consegui carregar as métricas${error ? ': ' + escapeHTML(error.message) : ''}.</p>`; return; }
        let serie = m.dau || [];
        const primeiro = serie.findIndex(r => r.n > 0);
        if (primeiro > 0) serie = serie.slice(primeiro);           // começa no primeiro dia com uso
        const passo = serie.length > 21 ? 5 : serie.length > 10 ? 3 : 1; // datas sem amontoar
        const dau = serie.map((r, i) => {
            const dt = new Date(r.d + 'T12:00:00');
            const mostra = (serie.length - 1 - i) % passo === 0;
            return {
                label: mostra ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
                value: r.n, txt: r.n ? String(r.n) : '0',
                tip: `${dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}: ${r.n} ${r.n === 1 ? 'pessoa' : 'pessoas'}`,
            };
        });
        const u = m.uso || {};
        const media = dau.length ? Math.round(dau.reduce((t, x) => t + x.value, 0) / dau.length * 10) / 10 : 0;
        mb.innerHTML = `<div class="chart-card">
            <div class="chart-head"><span class="chart-title">Pessoas ativas por dia</span><span class="chart-legend">média ${String(media).replace('.', ',')} · ${dau.length} dias</span></div>
            ${barChart(dau.slice(-30), { height: 130, mostrarZero: true })}
            <div class="chart-foot">Ativos na semana: <b>${m.wau || 0}</b> · no mês: <b>${m.mau || 0}</b> · voltaram depois de 7 dias: <b>${m.ret7 != null ? m.ret7 + '%' : '-'}</b> · depois de 30: <b>${m.ret30 != null ? m.ret30 + '%' : '-'}</b></div>
        </div>
        <div class="mini-stats" style="margin-top:10px">
            ${[['treinos', 'treinos'], ['refeicoes', 'refeições'], ['agua', 'registros de água'], ['sono', 'noites de sono'], ['stories', 'stories'], ['comentarios', 'comentários'], ['coach', 'gerações do coach'], ['posts_livres', 'posts no feed']]
                .map(([k, n]) => `<div><b>${u[k] || 0}</b><span>${n}</span></div>`).join('')}
        </div>`;
    });

    // Retenção: de quem entrou em cada semana, quantos ainda registram algo
    const [{ data: ret }, { data: sumidos }] = await Promise.all([
        sb.rpc('admin_retention'),
        sb.rpc('admin_churn'),
    ]);
    const box = $('#retencaoBox');
    if (!box) return;

    const linhas = (ret || []).map(r => {
        const semana = new Date(r.semana + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
        const cor = r.pct >= 50 ? 'var(--vital)' : r.pct >= 25 ? 'var(--gold)' : 'var(--effort)';
        return `<div class="ret-row">
            <span class="ret-semana">Semana de ${semana}</span>
            <div class="ret-bar"><div class="ret-fill" style="width:${r.pct}%;background:${cor}"></div></div>
            <span class="ret-pct" style="color:${cor}">${r.pct}%</span>
            <span class="ret-n">${r.ainda_ativos}/${r.novos}</span>
        </div>`;
    }).join('') || '<div class="log-empty">Ainda sem gente suficiente pra medir.</div>';

    const sumidosHTML = (sumidos || []).slice(0, 8).map(u => `
        <div class="admin-user-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div class="admin-user-info">
                <div class="admin-user-name">${escapeHTML(u.display_name)}</div>
                <div class="admin-user-meta">sem registrar há ${u.dias_sumido >= 999 ? 'sempre' : plural(u.dias_sumido, 'dia', 'dias')}</div>
            </div>
        </div>`).join('');

    box.innerHTML = `
        <p class="chart-foot" style="text-align:left;margin-bottom:10px">De quem se cadastrou em cada semana, quantos ainda registraram algo nos últimos 7 dias.</p>
        <div class="ret-list">${linhas}</div>
        ${sumidosHTML ? `<h3 class="edit-section-title" style="margin-top:18px">Sumidos há mais de 7 dias</h3>${sumidosHTML}` : ''}`;
}

// ---- Quem viu o story / quem curtiu o post (só o dono vê) ----
function openPeopleSheet(titulo, subtitulo, carregar) {
    const old = document.getElementById('peopleSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'peopleSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${escapeHTML(titulo)}</h3>
        <p class="sheet-sub">${escapeHTML(subtitulo)}</p>
        <div id="peopleBody" class="follow-list"><div class="spinner"></div></div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    sheet.onclick = e => { if (e.target === sheet) { sheet.remove(); document.body.style.overflow = ''; } };

    carregar().then(({ data, error }) => {
        const body = document.getElementById('peopleBody');
        if (!body) return;
        if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
        if (!data || data.length === 0) { body.innerHTML = '<div class="log-empty">Ninguém ainda.</div>'; return; }
        body.innerHTML = data.map(u => `<div class="follow-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div style="flex:1;min-width:0">
                <div class="follow-name">${escapeHTML(u.display_name)}</div>
                <div class="follow-uname">@${escapeHTML(u.username)}</div>
            </div>
            <span class="people-time">${timeAgo(u.viewed_at || u.liked_at)}</span>
        </div>`).join('');
    });
}

// ---- Boas-vindas: completa o perfil no primeiro acesso ----
function openOnboarding() {
    const old = document.getElementById('onboardingSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'onboardingSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Bem-vindo ao Pulso 👋</h3>
        <p class="sheet-sub">Três informações rápidas pro app calcular sua evolução e o coach te conhecer. Dá pra mudar depois.</p>

        <div class="field-row">
            <div class="field"><label>Altura (m)</label>
                <div class="stepper" data-target="obAltura" data-min="1.20" data-max="2.30" data-step="0.01" data-default="1.70">
                    <button type="button" class="step-btn" data-dir="-">−</button>
                    <input type="number" id="obAltura" step="0.01" inputmode="decimal">
                    <button type="button" class="step-btn" data-dir="+">+</button>
                </div>
            </div>
            <div class="field"><label>Peso hoje (kg)</label>
                <div class="stepper" data-target="obPeso" data-min="30" data-max="250" data-step="0.5" data-default="75">
                    <button type="button" class="step-btn" data-dir="-">−</button>
                    <input type="number" id="obPeso" step="0.5" inputmode="decimal">
                    <button type="button" class="step-btn" data-dir="+">+</button>
                </div>
            </div>
        </div>

        <div class="field"><label>Meta de peso (kg)</label>
            <div class="stepper" data-target="obMeta" data-min="30" data-max="250" data-step="0.5" data-default="70">
                <button type="button" class="step-btn" data-dir="-">−</button>
                <input type="number" id="obMeta" step="0.5" inputmode="decimal">
                <button type="button" class="step-btn" data-dir="+">+</button>
            </div>
        </div>

        <div class="field"><label>Qual é o seu objetivo?</label>
            <div class="goal-grid">
                ${OBJETIVOS.map(([v, nome, desc]) => `<button type="button" class="goal-btn" data-ob-goal-tipo="${v}">
                    <span class="goal-nome">${nome}</span><span class="goal-desc">${desc}</span>
                </button>`).join('')}
            </div>
        </div>

        <div class="field"><label>Quantos treinos por semana você quer fazer?</label>
            <div class="weekly-goal-picker">
                <button type="button" class="wg-btn on" data-ob-goal="2"><span class="wg-emo">🌱</span><span><span class="wg-title">Iniciante</span><span class="wg-sub">1 a 3 dias</span></span></button>
                <button type="button" class="wg-btn" data-ob-goal="4"><span class="wg-emo">🔥</span><span><span class="wg-title">Intermediário</span><span class="wg-sub">4 ou 5 dias</span></span></button>
                <button type="button" class="wg-btn" data-ob-goal="6"><span class="wg-emo">⚡</span><span><span class="wg-title">Avançado</span><span class="wg-sub">6 ou 7 dias</span></span></button>
            </div>
        </div>

        <div class="sheet-footer">
            <button class="btn-ghost" id="obSkip">Agora não</button>
            <button class="btn-primary" id="obSave">Começar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';

    let objetivo = null;
    sheet.querySelectorAll('[data-ob-goal-tipo]').forEach(b => b.addEventListener('click', e => {
        objetivo = e.currentTarget.dataset.obGoalTipo;
        sheet.querySelectorAll('[data-ob-goal-tipo]').forEach(x => x.classList.toggle('on', x === e.currentTarget));
    }));

    let meta = 2;
    sheet.querySelectorAll('[data-ob-goal]').forEach(b => b.addEventListener('click', e => {
        meta = parseInt(e.currentTarget.dataset.obGoal);
        sheet.querySelectorAll('[data-ob-goal]').forEach(x => x.classList.toggle('on', x === e.currentTarget));
    }));

    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    document.getElementById('obSkip').onclick = close;
    sheet.onclick = e => { if (e.target === sheet) close(); };

    document.getElementById('obSave').onclick = async () => {
        const btn = document.getElementById('obSave');
        const altura = parseFloat(document.getElementById('obAltura').value) || null;
        const peso = parseFloat(document.getElementById('obPeso').value) || null;
        const alvo = parseFloat(document.getElementById('obMeta').value) || null;

        btn.disabled = true; btn.textContent = 'Salvando...';
        const { error } = await sb.from('profiles').update({
            altura, peso_inicial: peso, target_weight: alvo, weekly_goal: meta, goal: objetivo,
        }).eq('id', state.session.user.id);
        btn.disabled = false; btn.textContent = 'Começar';
        if (error) { toast('Erro: ' + error.message, 'err'); return; }

        Object.assign(state.profile, { altura, peso_inicial: peso, target_weight: alvo, weekly_goal: meta, goal: objetivo });
        if (peso) {
            await sb.from('posts').insert({
                user_id: state.session.user.id, kind: 'weight', weight_kg: peso,
                visibility: 'private', is_public: false,
            });
        }
        close();
        toast('Tudo pronto! Bora começar 💪', 'ok');
        await loadScore();
        switchView('feed');
    };
}

// ---- Editar um registro ----
async function openEditPostSheet(id) {
    const { data: p, error } = await sb.from('posts')
        .select('id, kind, caption, activity_type, duration_min, meal_slot, weight_kg')
        .eq('id', id).maybeSingle();
    if (error || !p) { toast('Não consegui abrir esse registro', 'err'); return; }

    const old = document.getElementById('editPostSheet');
    if (old) old.remove();

    let campos = '';
    if (p.kind === 'workout') {
        const tipos = ['Musculação','Corrida','Ciclismo','Natação','Caminhada','Yoga','Dança','Alongamento','Futebol','Outro'];
        campos = `
            <div class="field-row">
                <div class="field"><label>Atividade</label>
                    <select id="epType">${tipos.map(t => `<option ${p.activity_type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </div>
                <div class="field"><label>Duração (min)</label>
                    <div class="stepper" data-target="epDur" data-min="5" data-max="240" data-step="5" data-default="45">
                        <button type="button" class="step-btn" data-dir="-">−</button>
                        <input type="number" id="epDur" value="${p.duration_min || 45}" inputmode="numeric">
                        <button type="button" class="step-btn" data-dir="+">+</button>
                    </div>
                </div>
            </div>`;
    } else if (p.kind === 'meal') {
        const slots = { cafe:'Café da manhã', almoco:'Almoço', jantar:'Jantar', lanche:'Lanche' };
        campos = `<div class="field"><label>Refeição</label>
            <select id="epSlot">${Object.entries(slots).map(([v, n]) => `<option value="${v}" ${p.meal_slot === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </div>`;
    } else if (p.kind === 'weight') {
        campos = `<div class="field"><label>Peso (kg)</label>
            <div class="stepper" data-target="epKg" data-min="30" data-max="250" data-step="0.1" data-default="70">
                <button type="button" class="step-btn" data-dir="-">−</button>
                <input type="number" id="epKg" step="0.1" value="${p.weight_kg || ''}" inputmode="decimal">
                <button type="button" class="step-btn" data-dir="+">+</button>
            </div>
        </div>`;
    }

    const sheet = document.createElement('div');
    sheet.id = 'editPostSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Editar registro</h3>
        <p class="sheet-sub">Os pontos já creditados não mudam.</p>
        ${campos}
        <div class="field"><label>Legenda</label><textarea id="epCaption" maxlength="500">${escapeHTML(p.caption || '')}</textarea></div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="epCancel">Cancelar</button>
            <button class="btn-primary" id="epSave">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('epCancel').onclick = close;

    document.getElementById('epSave').onclick = async () => {
        const btn = document.getElementById('epSave');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const up = { caption: document.getElementById('epCaption').value.trim() || null };
        if (p.kind === 'workout') {
            up.activity_type = document.getElementById('epType').value;
            up.duration_min = parseInt(document.getElementById('epDur').value) || p.duration_min;
        } else if (p.kind === 'meal') {
            up.meal_slot = document.getElementById('epSlot').value;
        } else if (p.kind === 'weight') {
            up.weight_kg = parseFloat(document.getElementById('epKg').value) || p.weight_kg;
        }
        const { error: upErr } = await sb.from('posts').update(up).eq('id', id);
        btn.disabled = false; btn.textContent = 'Salvar';
        if (upErr) { toast('Erro: ' + upErr.message, 'err'); return; }
        close();
        toast('Registro atualizado', 'ok');
        if (state.view === 'feed') renderFeed();
        else if (state.view === 'profile') renderProfile();
        else if (state.view === 'activity-log') renderActivityLog();
    };
}

// ---- Termos de uso ----
// ============================================================
// TERMOS DE USO E POLÍTICA DE PRIVACIDADE (LGPD)
// Quando mudar o texto de forma importante, troque a versão: todos aceitam de novo.
// ============================================================
const TERMOS_VERSAO = '2026-10';
const CONTATO_EMAIL = ''; // coloque aqui o e-mail de contato do Pulso (ex: contato@seudominio.com.br)
const TERMOS_ATUALIZADO = '1º de outubro de 2026';

function contatoHTML() {
    return CONTATO_EMAIL
        ? `pelo e-mail <b>${CONTATO_EMAIL}</b> ou por mensagem ao administrador dentro do app`
        : 'por mensagem ao administrador dentro do app (perfil @heverton)';
}
function paginaTexto(titulo, secoes) {
    $('#viewContainer').innerHTML = `
        <div class="view cfg-view doc-legal">
            ${cabecalhoConfig(titulo)}
            <p class="doc-data">Versão ${TERMOS_VERSAO} · atualizada em ${TERMOS_ATUALIZADO}</p>
            ${secoes.map(([t, corpo]) => `<section class="doc-secao"><h4>${t}</h4>${corpo}</section>`).join('')}
        </div>`;
}
function renderTermos() {
    paginaTexto('Termos de uso', [
        ['1. O que é o Pulso', `<p>O Pulso é uma rede social de hábitos saudáveis: você registra treinos, refeições, água, sono e peso, acompanha sua evolução, participa de desafios e recebe orientações de um coach com inteligência artificial.</p>`],
        ['2. Quem pode usar', `<p>O app é destinado a maiores de 18 anos. Ao criar a conta, você declara ter essa idade e que as informações do cadastro são verdadeiras. A conta é pessoal e você é responsável pelo que acontece nela.</p>`],
        ['3. Não é serviço de saúde', `<p>As orientações do coach e as análises de refeições são <b>gerais e automatizadas</b>. Elas não substituem médico, nutricionista ou educador físico, não são diagnóstico e não devem ser seguidas se contrariarem a orientação de um profissional. Se você tem alguma condição de saúde, está gestante, sente dor ou tem dúvida, procure um profissional antes de mudar treino ou alimentação. Pare qualquer atividade que cause dor ou mal-estar.</p>`],
        ['4. Conteúdo e convivência', `<p>Você é responsável pelo que publica. Não é permitido publicar conteúdo sexual, violento, discriminatório, que exponha outras pessoas sem autorização, que viole direitos autorais ou que incentive práticas perigosas (como dietas extremas ou uso de substâncias). As fotos do feed passam por uma verificação automática, e o Pulso pode remover conteúdo, limitar ou encerrar contas que descumpram estas regras.</p>
            <p>Ao publicar, você autoriza o Pulso a exibir o conteúdo dentro do app, de acordo com a privacidade que você escolheu. O conteúdo continua sendo seu.</p>`],
        ['5. Pontos, rankings e desafios', `<p>Pontos, faixas, conquistas e posições em desafios são apenas motivacionais: <b>não têm valor em dinheiro</b>, não podem ser trocados nem transferidos, e as regras de pontuação podem ser ajustadas para manter o jogo justo. Tentativas de burlar a pontuação (registros falsos ou repetidos) podem levar à remoção dos pontos ou da conta. Prêmios combinados em desafios são responsabilidade de quem criou o desafio.</p>`],
        ['6. Recursos pagos', `<p>Hoje o Pulso é gratuito. Se no futuro existirem recursos pagos (como criação de desafios ou funções extras do coach), preço e condições serão informados antes de qualquer cobrança, e nada será cobrado sem a sua confirmação.</p>`],
        ['7. Disponibilidade', `<p>O Pulso é um projeto em evolução. Podemos mudar, suspender ou encerrar funções, e o app pode ficar fora do ar por manutenção ou falhas. Faremos o possível para avisar mudanças importantes com antecedência.</p>`],
        ['8. Encerrar a conta', `<p>Você pode excluir sua conta a qualquer momento em Configurações › Excluir conta. Seus dados são apagados conforme a Política de privacidade.</p>`],
        ['9. Mudanças nestes termos', `<p>Quando estes termos mudarem de forma importante, você será avisado no app e precisará aceitar a nova versão para continuar usando.</p>`],
        ['10. Contato', `<p>Dúvidas sobre estes termos: ${contatoHTML()}. Estes termos seguem as leis brasileiras.</p>`],
    ]);
}
function renderPoliticaPrivacidade() {
    paginaTexto('Política de privacidade', [
        ['Resumo', `<p>Usamos seus dados só para o app funcionar e te ajudar a cuidar da saúde. <b>Não vendemos dados</b> e não usamos para publicidade. Dados de saúde (peso, medidas, sono, refeições) são tratados como <b>dados sensíveis</b> e só são usados com o seu consentimento.</p>`],
        ['1. Quem é o responsável', `<p>O Pulso é o controlador dos dados tratados no app, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018). Contato para assuntos de privacidade: ${contatoHTML()}.</p>`],
        ['2. Quais dados coletamos', `<ul>
            <li><b>Cadastro:</b> nome, usuário, e-mail, foto, bio e cidade.</li>
            <li><b>Registros:</b> treinos, refeições (com fotos), água, sono, peso, medidas, objetivos, preferências de treino e limitações que você informar.</li>
            <li><b>Social:</b> posts, stories, destaques, comentários, curtidas, mensagens, quem você segue e desafios.</li>
            <li><b>Uso técnico:</b> dados de acesso e do aparelho necessários para login, segurança e notificações.</li>
        </ul>`],
        ['3. Para que usamos', `<ul>
            <li>Mostrar sua evolução, calcular pontos, ofensivas e desafios.</li>
            <li>Gerar orientações do coach, treinos do dia e análise de refeições com inteligência artificial.</li>
            <li>Exibir seu conteúdo para quem você autorizou.</li>
            <li>Enviar lembretes e notificações que você ativou.</li>
            <li>Manter o app seguro e evitar abusos.</li>
        </ul>
        <p>Bases legais: execução do serviço que você contratou ao criar a conta, legítimo interesse (segurança e melhoria do app) e, para dados de saúde, o seu <b>consentimento</b>, que você pode revogar excluindo esses registros ou a conta.</p>`],
        ['4. Quem vê o quê', `<p>Peso, medidas, sono, objetivos e limitações são <b>só seus</b>. Refeições ficam privadas por padrão. Fotos privadas (como a da balança) ficam guardadas em área protegida, acessível apenas por você. Nos desafios, os outros participantes veem seus pontos no período do desafio, nunca o seu peso. Fora dos desafios, ninguém vê seus pontos. Posts e stories seguem a privacidade que você escolhe (pública, seguidores ou só você) e a privacidade da sua conta.</p>`],
        ['5. Com quem compartilhamos', `<p>Apenas com empresas que operam o app para nós, sob contrato e só para essa finalidade: provedor de banco de dados e armazenamento (Supabase), hospedagem do site (Netlify) e serviço de inteligência artificial que analisa fotos de refeições e gera as orientações do coach. Para a IA, enviamos somente o necessário para a resposta (por exemplo, a foto do prato ou um resumo dos seus números), sem seu e-mail. Alguns desses serviços podem armazenar dados fora do Brasil, com as proteções exigidas pela LGPD. Também podemos compartilhar dados se houver obrigação legal ou ordem judicial.</p>`],
        ['6. Por quanto tempo guardamos', `<p>Enquanto sua conta existir. Stories somem do app em 24 horas (exceto os que você destacar). Orientações geradas pela IA são guardadas por até 120 dias. Ao excluir a conta, seus dados são apagados, exceto o que a lei exigir guardar por mais tempo.</p>`],
        ['7. Seus direitos', `<p>Você pode, a qualquer momento: confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a exclusão, pedir a portabilidade, saber com quem compartilhamos e revogar o consentimento. Boa parte disso você faz direto no app (editar perfil, apagar registros, excluir conta). Para o resto, fale com a gente ${contatoHTML()}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>`],
        ['8. Segurança', `<p>Usamos conexão criptografada, regras de acesso no banco de dados que impedem uma pessoa de ler os dados privados de outra, e área protegida para fotos privadas. Nenhum sistema é 100% seguro; se houver um incidente que possa te afetar, você será avisado.</p>`],
        ['9. Menores de idade', `<p>O Pulso não é destinado a menores de 18 anos. Se descobrirmos uma conta de menor, ela poderá ser removida.</p>`],
        ['10. Mudanças', `<p>Quando esta política mudar de forma importante, você será avisado no app e precisará aceitar a nova versão.</p>`],
    ]);
}

function openTermsSheet() {
    const old = document.getElementById('termsSheet');
    if (old) old.remove();
    const nova = !!state.profile.terms_accepted_at;
    const sheet = document.createElement('div');
    sheet.id = 'termsSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${nova ? 'Atualizamos nossos termos' : 'Antes de começar'}</h3>
        <p class="sheet-sub">${nova ? 'Leia e aceite a nova versão pra continuar.' : 'Duas coisas rápidas e importantes.'}</p>
        <div class="terms-block">
            <p class="priv-text"><b>Seus dados de saúde são privados.</b> Peso, medidas, sono e objetivos só você vê. Nos desafios, os outros veem só seus pontos no período, nunca o peso.</p>
            <p class="priv-text"><b>O coach não é médico.</b> As orientações da IA são gerais e não substituem profissional de saúde.</p>
            <p class="priv-text">Leia os <button class="ia-link termos-link" data-ler="termos">Termos de uso</button> e a <button class="ia-link termos-link" data-ler="politica">Política de privacidade</button>.</p>
            <label class="termos-check"><input type="checkbox" id="termsCk1"> <span>Tenho 18 anos ou mais e concordo com os Termos de uso e a Política de privacidade.</span></label>
            <label class="termos-check"><input type="checkbox" id="termsCk2"> <span>Autorizo o Pulso a tratar meus dados de saúde (peso, medidas, sono e refeições) para mostrar minha evolução e gerar as orientações do coach.</span></label>
        </div>
        <div class="sheet-footer">
            <button class="btn-primary" id="termsOk" disabled style="width:100%">Concordo, vamos lá</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const ck1 = sheet.querySelector('#termsCk1'), ck2 = sheet.querySelector('#termsCk2'), ok = sheet.querySelector('#termsOk');
    const atualizar = () => { ok.disabled = !(ck1.checked && ck2.checked); };
    ck1.onchange = atualizar; ck2.onchange = atualizar;
    sheet.querySelectorAll('.termos-link').forEach(b => b.onclick = () => {
        sheet.classList.remove('on'); sheet.style.display = 'none';
        state.voltarTermos = true;
        switchView(b.dataset.ler === 'termos' ? 'termos' : 'politica-privacidade');
    });
    ok.onclick = async () => {
        ok.disabled = true;
        const agora = new Date().toISOString();
        await sb.from('profiles').update({ terms_accepted_at: agora, terms_version: TERMOS_VERSAO, health_consent_at: agora }).eq('id', state.session.user.id);
        Object.assign(state.profile, { terms_accepted_at: agora, terms_version: TERMOS_VERSAO, health_consent_at: agora });
        sheet.remove();
        document.body.style.overflow = '';
    };
}

// ---- Fila offline: o que você registrou sem internet ----
function guardarNaFila(registro) {
    try {
        const fila = JSON.parse(localStorage.getItem('pulso-fila') || '[]');
        fila.push({ ...registro, quando: Date.now() });
        localStorage.setItem('pulso-fila', JSON.stringify(fila.slice(-30)));
        return true;
    } catch (e) { return false; }
}

async function enviarFilaOffline() {
    let fila = [];
    try { fila = JSON.parse(localStorage.getItem('pulso-fila') || '[]'); } catch (e) { return; }
    if (!fila.length || !navigator.onLine) return;

    const sobraram = [];
    for (const item of fila) {
        try {
            if (item.tipo === 'sleep') {
                const { error } = await sb.from('sleep_logs').upsert({
                    user_id: state.session.user.id, slept_on: item.dia, hours: item.horas,
                }, { onConflict: 'user_id,slept_on' });
                if (error) throw error;
            } else {
                const { error } = await sb.from('posts').insert({
                    ...item.post, user_id: state.session.user.id,
                });
                if (error && error.code !== '23505') throw error;
            }
        } catch (e) {
            sobraram.push(item);
        }
    }
    localStorage.setItem('pulso-fila', JSON.stringify(sobraram));
    const enviados = fila.length - sobraram.length;
    if (enviados > 0) {
        await loadScore();
        toast(`${plural(enviados, 'registro enviado', 'registros enviados')} agora que a internet voltou`, 'ok');
    }
}

window.addEventListener('online', () => { if (state.session) enviarFilaOffline(); });

// ---- Trocar senha ----
function abrirTrocaSenha() {
    const old = document.getElementById('senhaSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'senhaSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Trocar senha</h3>
        <p class="sheet-sub">Mínimo 6 caracteres, com um número e um caractere especial.</p>
        <div class="field">
            <label>Senha nova</label>
            <div class="pw-wrap">
                <input type="password" id="pwNova" minlength="6" autocomplete="new-password">
                <button type="button" class="pw-toggle" data-target="pwNova">👁</button>
            </div>
        </div>
        <div class="field">
            <label>Repita a senha nova</label>
            <div class="pw-wrap">
                <input type="password" id="pwNova2" minlength="6" autocomplete="new-password">
                <button type="button" class="pw-toggle" data-target="pwNova2">👁</button>
            </div>
        </div>
        <div id="pwMsg"></div>
        <p class="field-hint" style="margin-top:10px">Não lembra a senha atual? <button class="link-btn" id="pwEsqueci">Receber link por email</button></p>
        <div class="sheet-footer">
            <button class="btn-ghost" id="pwCancel">Cancelar</button>
            <button class="btn-primary" id="pwSave">Salvar senha</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('pwCancel').onclick = close;

    sheet.querySelectorAll('.pw-toggle').forEach(b => b.addEventListener('click', () => {
        const campo = document.getElementById(b.dataset.target);
        campo.type = campo.type === 'password' ? 'text' : 'password';
    }));

    document.getElementById('pwEsqueci').onclick = async () => {
        const email = state.session.user.email;
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast(`Link enviado para ${email}`, 'ok');
        close();
    };

    document.getElementById('pwSave').onclick = async () => {
        const a = document.getElementById('pwNova').value;
        const b = document.getElementById('pwNova2').value;
        const msg = document.getElementById('pwMsg');
        if (a.length < 6) { msg.innerHTML = '<div class="auth-msg err">A senha precisa de pelo menos 6 caracteres.</div>'; return; }
        if (!/[0-9]/.test(a)) { msg.innerHTML = '<div class="auth-msg err">Inclua pelo menos um número.</div>'; return; }
        if (!/[^a-zA-Z0-9]/.test(a)) { msg.innerHTML = '<div class="auth-msg err">Inclua pelo menos um caractere especial.</div>'; return; }
        if (a !== b) { msg.innerHTML = '<div class="auth-msg err">As duas senhas não são iguais.</div>'; return; }

        const btn = document.getElementById('pwSave');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const { error } = await sb.auth.updateUser({ password: a });
        btn.disabled = false; btn.textContent = 'Salvar senha';
        if (error) { msg.innerHTML = `<div class="auth-msg err">${escapeHTML(msgErro(error))}</div>`; return; }
        close();
        toast('Senha atualizada', 'ok');
    };
}

// ---- Explicações rápidas ----
const CONCEITOS = {
    pontos: {
        titulo: 'Pontos ativos',
        corpo: [
            'É o seu placar dos últimos 90 dias. Cada treino, refeição com foto, pesagem, copo de água e story soma pontos.',
            'Eles expiram depois de 90 dias, de propósito: o número mostra como você está agora, não como estava no ano passado.',
            'É por eles que sai o ranking da comunidade e dos desafios.',
        ],
    },
    ofensiva: {
        titulo: 'Ofensiva',
        corpo: [
            'São os dias seguidos em que você registrou alguma coisa. Vale qualquer registro: treino, refeição, água, sono ou pesagem.',
            'A cada marco você ganha bônus: 3 dias, 7, 14 e 30.',
            'Perdeu um dia? Você tem um escudo por semana que segura a sequência, sem precisar fazer nada.',
        ],
    },
    semana: {
        titulo: 'Meta da semana',
        corpo: [
            'É quantos dias de treino você decidiu fazer por semana, lá no seu perfil.',
            'Bateu a meta, ganha 10 pontos de bônus naquela semana.',
        ],
    },
    ranking: {
        titulo: 'Ranking',
        corpo: [
            'Sua posição entre quem pontuou nesta semana, considerando só os pontos ganhos de segunda pra cá.',
            'Dentro de um desafio, vale só o que foi ganho durante o período dele.',
        ],
    },
};

function explicarConceito(tema) {
    const c = CONCEITOS[tema];
    if (!c) return;
    const old = document.getElementById('explicaSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'explicaSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${c.titulo}</h3>
        ${c.corpo.map(p => `<p class="priv-text">${p}</p>`).join('')}
        <div class="sheet-footer">
            <button class="btn-ghost" data-act="go-rules" id="exRegras">Ver todas as regras</button>
            <button class="btn-primary" id="exOk">Entendi</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('exOk').onclick = close;
    document.getElementById('exRegras').onclick = () => { close(); switchView('rules'); };
}

// ---- Convite por link ----
async function checarConvite() {
    // Link de convite de desafio: abre a vitrine (ou o desafio, se já participa)
    try {
        const cidLink = localStorage.getItem('pulso-link-desafio');
        if (cidLink) {
            localStorage.removeItem('pulso-link-desafio');
            setTimeout(() => switchView('challenge', { id: cidLink }), 600);
        }
    } catch (_) {}
    let quem = null, tipo = 'convite';
    try {
        quem = localStorage.getItem('pulso-link-user');
        tipo = localStorage.getItem('pulso-link-tipo') || 'convite';
        localStorage.removeItem('pulso-link-user');
        localStorage.removeItem('pulso-link-tipo');
    } catch (_) {}
    if (location.search) history.replaceState(null, '', location.pathname);
    if (!quem) return;
    if (quem.toLowerCase() === (state.profile.username || '').toLowerCase()) return;
    // Conta nova que chegou por link: registra quem convidou (vale ponto no 1º treino)
    sb.rpc('registrar_convite', { convidante: quem }).then(() => {});
    if (tipo === 'perfil') {
        const { data: alvo } = await sb.from('profiles').select('id').ilike('username', quem).maybeSingle();
        if (alvo) switchView('user-profile', { uid: alvo.id });
        return;
    }

    const { data: perfil } = await sb.from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .ilike('username', quem).maybeSingle();
    if (!perfil) return;

    const { data: jaSegue } = await sb.rpc('am_i_following', { target_id: perfil.id });
    if (jaSegue) return;

    const sheet = document.createElement('div');
    sheet.id = 'conviteSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card" style="text-align:center">
        <div class="sheet-handle"></div>
        <div style="margin:6px auto 12px">${avatarHTML(perfil, 'lg')}</div>
        <h3 class="sheet-title">${escapeHTML(perfil.display_name)} te convidou</h3>
        <p class="sheet-sub">@${escapeHTML(perfil.username)}${perfil.bio ? ' · ' + escapeHTML(perfil.bio.slice(0, 50)) : ''}</p>
        <div class="sheet-footer">
            <button class="btn-ghost" id="cvSkip">Agora não</button>
            <button class="btn-primary" data-act="seguir-convite" data-uid="${perfil.id}">Seguir</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    document.getElementById('cvSkip').onclick = () => { sheet.remove(); document.body.style.overflow = ''; };
}

// ---- Antes e depois ----
async function renderCompare() {
    const c = $('#viewContainer');
    c.innerHTML = '<div class="view"><div class="spinner"></div></div>';

    const { data: fotos } = await sb.from('posts')
        .select('id, image_url, created_at')
        .eq('user_id', state.session.user.id)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: true })
        .limit(60);

    if (!fotos || fotos.length < 2) {
        c.innerHTML = `
            <div class="view">
                <div class="user-topbar">
                    <button class="topbar-back" data-act="go-progress">←</button>
                    <div class="topbar-title">Antes e depois</div><div style="width:28px"></div>
                </div>
                <div class="grid-empty">Você precisa de pelo menos duas fotos registradas pra montar a comparação.</div>
            </div>`;
        return;
    }

    if (!state.cmpA) state.cmpA = fotos[0].id;
    if (!state.cmpB) state.cmpB = fotos[fotos.length - 1].id;
    const a = fotos.find(f => f.id === state.cmpA) || fotos[0];
    const b = fotos.find(f => f.id === state.cmpB) || fotos[fotos.length - 1];

    const [{ data: pesos }, { data: medidas }] = await Promise.all([
        sb.from('posts').select('weight_kg, created_at').eq('user_id', state.session.user.id)
            .eq('kind', 'weight').not('weight_kg', 'is', null).order('created_at', { ascending: true }),
        sb.from('body_measurements').select('cintura, measured_at').eq('user_id', state.session.user.id)
            .order('measured_at', { ascending: true }),
    ]);

    const maisProximo = (lista, quando, campoData, campoValor) => {
        if (!lista || !lista.length) return null;
        const alvo = new Date(quando).getTime();
        let melhor = null, dist = Infinity;
        lista.forEach(x => {
            if (x[campoValor] == null) return;
            const d = Math.abs(new Date(x[campoData]).getTime() - alvo);
            if (d < dist) { dist = d; melhor = Number(x[campoValor]); }
        });
        return melhor;
    };

    const pesoA = maisProximo(pesos, a.created_at, 'created_at', 'weight_kg');
    const pesoB = maisProximo(pesos, b.created_at, 'created_at', 'weight_kg');
    const cintA = maisProximo(medidas, a.created_at, 'measured_at', 'cintura');
    const cintB = maisProximo(medidas, b.created_at, 'measured_at', 'cintura');

    const dias = Math.max(0, Math.round((new Date(b.created_at) - new Date(a.created_at)) / 86400000));
    const fmt = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const delta = (x, y, un) => {
        if (x == null || y == null) return '';
        const d = y - x;
        if (Math.abs(d) < 0.05) return `<span class="cmp-delta">sem mudança</span>`;
        return `<span class="cmp-delta ${d < 0 ? 'down' : 'up'}">${d < 0 ? '−' : '+'}${br(Math.abs(d))} ${un}</span>`;
    };

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-progress">←</button>
                <div class="topbar-title">Antes e depois</div><div style="width:28px"></div>
            </div>

            <div class="cmp-par">
                <div class="cmp-lado">
                    <img src="${a.image_url}" loading="lazy">
                    <div class="cmp-data">${fmt(a.created_at)}</div>
                    ${pesoA != null ? `<div class="cmp-num">${br(pesoA)} kg</div>` : ''}
                </div>
                <div class="cmp-lado">
                    <img src="${b.image_url}" loading="lazy">
                    <div class="cmp-data">${fmt(b.created_at)}</div>
                    ${pesoB != null ? `<div class="cmp-num">${br(pesoB)} kg</div>` : ''}
                </div>
            </div>

            <div class="cmp-resumo">
                <div class="cmp-linha"><span>Intervalo</span><b>${plural(dias, 'dia', 'dias')}</b></div>
                ${pesoA != null && pesoB != null ? `<div class="cmp-linha"><span>Peso</span>${delta(pesoA, pesoB, 'kg')}</div>` : ''}
                ${cintA != null && cintB != null ? `<div class="cmp-linha"><span>Cintura</span>${delta(cintA, cintB, 'cm')}</div>` : ''}
            </div>

            <h3 class="edit-section-title">Escolha as fotos</h3>
            <p class="chart-foot" style="text-align:left">Toque numa foto pra usar como "antes", toque de novo pra usar como "depois".</p>
            <div class="ig-grid cmp-grid">
                ${fotos.map(f => `<div class="grid-item${f.id === state.cmpA ? ' sel-a' : ''}${f.id === state.cmpB ? ' sel-b' : ''}" data-act="cmp-pick" data-id="${f.id}">
                    <img src="${f.image_url}" loading="lazy">
                </div>`).join('')}
            </div>
        </div>`;
}
const VAPID_PUBLIC = 'BNJ3oZgUsEZlykYnN_2RnotEOQuFzKhIGTNO8qvpWDHRMZ2aUqUx0ZRFrK3MAcFbI9wJygm1bONzsVQszgK6NT0';

function base64ParaUint8(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function ligarPush() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ParaUint8(VAPID_PUBLIC),
            });
        }
        const json = sub.toJSON();
        if (!json.keys || !json.keys.p256dh) return false;

        await sb.from('push_subs').upsert({
            user_id: state.session.user.id,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
        }, { onConflict: 'endpoint' });
        return true;
    } catch (e) {
        console.warn('push indisponível', e);
        return false;
    }
}

async function desligarPush() {
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await sb.from('push_subs').delete().eq('endpoint', sub.endpoint);
            await sub.unsubscribe();
        }
    } catch (e) {}
}

// ---- Aviso do fim do dia ----
// Só dispara com o app aberto. Aviso com o app fechado exigiria servidor de push.
async function checkDailyReminder() {
    if (localStorage.getItem('pulso-reminder') !== 'on') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const agora = new Date();
    const hora = agora.getHours();
    const hoje = hojeISO(); // data do Brasil (antes usava a de Londres)

    // Três momentos do dia, cada um avisa uma vez só
    let janela = null;
    if (hora >= 21) janela = 'noite';
    else if (hora >= 18) janela = 'tarde';
    else if (hora >= 12) janela = 'meiodia';
    else if (hora >= 10) janela = 'manha';
    if (!janela) return;
    if (localStorage.getItem('pulso-reminder-' + janela) === hoje) return;
    // marca ANTES de checar: se o app iniciar duas vezes seguidas, só um aviso sai
    if (checkDailyReminder.rodando) return;
    checkDailyReminder.rodando = true;
    localStorage.setItem('pulso-reminder-' + janela, hoje);

    try {
        const iso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const uid = state.session.user.id;
        const [w, { count: treinos }] = await Promise.all([
            aguaDeHoje(),
            sb.from('posts').select('*', { count: 'exact', head: true })
                .eq('user_id', uid).eq('kind', 'workout').gte('created_at', iso),
        ]);
        let corpo = null;

        if (janela === 'manha') {
            const { data: sono } = await sb.rpc('sleep_summary');
            const temSono = sono && sono[0] && sono[0].hoje != null;
            if (!temSono) corpo = 'Quantas horas você dormiu essa noite? Registre agora, leva 5 segundos.';
        } else if (janela === 'meiodia') {
            if ((w.total_ml || 0) === 0) corpo = 'Nenhuma água registrada até agora. Bora começar o dia hidratado?';
            else if ((w.pct || 0) < 50) corpo = `Você está em ${formatLitros(w.total_ml)}. Que tal mais um copo?`;
        }
        // Meta da semana em risco? Isso vem antes dos outros avisos da tarde
        if (!corpo && janela === 'tarde' && !treinos) {
            const { data: diasSem } = await sb.rpc('count_days_current_week', { uid });
            const meta = state.profile.weekly_goal || 3;
            const feitos = Number(diasSem || 0);
            const restam = 7 - ((new Date().getDay() + 6) % 7); // dias até domingo, contando hoje
            const nomeDia = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
            if (feitos < meta && meta - feitos >= restam - 1) {
                const dia = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1);
                corpo = meta - feitos >= restam
                    ? `${dia} e ${feitos} de ${meta} treinos da semana. Dá pra fechar se treinar todo dia até domingo, bora hoje?`
                    : `${dia} e ${feitos} de ${meta} treinos da semana. Um hoje deixa a meta bem encaminhada.`;
            }
        }
        if (corpo) {
            // já definido
        } else if (janela === 'tarde') {
            if ((w.total_ml || 0) === 0) corpo = 'Registre quanto de água você bebeu hoje, leva 5 segundos.';
            else if ((w.pct || 0) < 100) corpo = `Faltam ${formatLitros(Math.max(0, w.goal_ml - w.total_ml))} pra sua meta de água.`;
            else if (!treinos) corpo = 'Água em dia. Ainda dá tempo de registrar um treino.';
        } else if (janela === 'noite') {
            if (!treinos) corpo = 'Fechando o dia: registre o que você fez hoje.';
            else if ((w.pct || 0) < 100) corpo = 'Faltou água hoje. Amanhã a gente compensa.';
        }

        if (!corpo) return;
        new Notification('Pulso', { body: corpo, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'pulso-' + janela + '-' + hoje, renotify: false });
    } catch (e) {
    } finally {
        checkDailyReminder.rodando = false;
    }
}

// ---- Convite pra ativar os lembretes (o celular exige um toque da pessoa) ----
function talvezConvidarLembretes() {
    const p = state.profile;
    if (!p || p.reminders_on === false) return;
    if (!('Notification' in window)) return;
    if (localStorage.getItem('pulso-reminder') === 'on' && Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem('pulso-convite-lembrete') === hojeISO()) return; // no máximo 1 vez por dia
    if (document.querySelector('.sheet.on')) return;
    localStorage.setItem('pulso-convite-lembrete', hojeISO());
    const sheet = document.createElement('div');
    sheet.id = 'lembreteSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Ativar lembretes do dia?</h3>
        <p class="sheet-sub">Um aviso curto pra lembrar do sono pela manhã, da água à tarde e do treino à noite. Você desliga quando quiser em Configurações.</p>
        <div class="sheet-footer">
            <button class="btn-ghost" id="lbNao">Agora não</button>
            <button class="btn-primary" id="lbSim">Ativar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector('#lbNao').onclick = async () => {
        sheet.remove();
        localStorage.setItem('pulso-reminder', 'off');
        await sb.from('profiles').update({ reminders_on: false }).eq('id', state.session.user.id);
        state.profile.reminders_on = false;
    };
    sheet.querySelector('#lbSim').onclick = async () => {
        let perm = Notification.permission;
        if (perm === 'default') perm = await Notification.requestPermission();
        sheet.remove();
        if (perm !== 'granted') { toast('O celular não liberou os avisos. Dá pra ativar depois em Configurações.', 'err'); return; }
        try { await ligarPush(); } catch (_) {}
        localStorage.setItem('pulso-reminder', 'on');
        toast('Lembretes ativados ✓', 'ok');
    };
}

// ---- Lembretes do dia ----
async function hydrateLembretes() {
    const slot = document.getElementById('lembretesSlot');
    if (!slot) return;
    try {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const iso = hoje.toISOString();
        const uid = state.session.user.id;

        const [w, { count: treinos }] = await Promise.all([
            aguaDeHoje(),
            sb.from('posts').select('*', { count: 'exact', head: true })
                .eq('user_id', uid).eq('kind', 'workout').gte('created_at', iso),
        ]);
        const faltas = [];
        if ((w.pct || 0) < 100) {
            faltas.push({ emo: '💧', txt: `Beber água: ${formatLitros(w.total_ml)} de ${formatLitros(w.goal_ml)}`, kind: 'water' });
        }
        if (!treinos) faltas.push({ emo: '💪', txt: 'Você ainda não registrou treino hoje', kind: 'workout' });
        const ontemISO = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const { data: sonoOntem } = await sb.from('sleep_logs')
            .select('hours').eq('user_id', uid).eq('slept_on', ontemISO).maybeSingle();
        if (!sonoOntem) faltas.push({ emo: '🌙', txt: 'Registre seu sono da noite passada', kind: 'sleep' });

        if (faltas.length === 0) {
            slot.innerHTML = `<div class="lembrete-card tudo-ok">Dia completo: sono, água e treino registrados. Boa!</div>`;
            return;
        }

        slot.innerHTML = `<div class="lembrete-card">
            <div class="lembrete-titulo">Hoje ainda falta</div>
            ${faltas.map(f => `<button class="lembrete-item" data-act="quick-kind" data-kind="${f.kind}">
                <span class="lembrete-emo">${f.emo}</span><span>${f.txt}</span><span class="lembrete-seta">›</span>
            </button>`).join('')}
        </div>`;
    } catch (e) {
        slot.innerHTML = '';
    }
}

// ---- Conquistas ----
async function renderAchievements(uid) {
    const alvo = uid || state.session.user.id;
    const ehMeu = alvo === state.session.user.id;
    const body = $('#profileTabBody');
    if (!body) return;
    body.innerHTML = '<div class="spinner"></div>';
    const [{ data, error }, { data: jaCompartilhadas }] = await Promise.all([
        sb.rpc('user_achievements', { alvo }),
        ehMeu ? sb.rpc('shared_achievements') : Promise.resolve({ data: [] }),
    ]);
    const compartilhadas = new Set((jaCompartilhadas || []).map(r => r.code));
    if (!$('#profileTabBody')) return;
    if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }

    const brutas = data || [];
    if (!ehMeu && brutas.length === 0) {
        body.innerHTML = '<div class="grid-empty">Essa pessoa prefere manter as conquistas dela em particular.</div>';
        return;
    }
    const todas = agruparNiveis(brutas);
    const datas = ehMeu ? datasConquistas() : {};
    const ganhas = todas.filter(a => a.ok);
    // em andamento: só as que já começaram (progresso > 0); o resto aparece de surpresa
    const andamento = ehMeu ? todas.filter(a => !a.okTotal && a.meta && a.prog > 0) : [];
    if (!ehMeu && !ganhas.length) { body.innerHTML = '<div class="grid-empty">Nenhuma conquista ainda.</div>'; return; }
    const proxima = andamento.slice().sort((x, y) => (y.prog / y.meta) - (x.prog / x.meta))[0] || null;
    const faltam = proxima ? Math.max(1, proxima.meta - proxima.prog) : 0;
    const card = (a, ehGanha) => {
        const nova = ehGanha && datas[a.codeAtual] && Date.now() - datas[a.codeAtual] < 7 * 86400000;
        const jaFoi = compartilhadas.has(a.codeAtual);
        const podeCompartilhar = ehGanha && ehMeu && !jaFoi;
        const prog = (!ehGanha && a.meta) || (ehGanha && a.proximoNivel && ehMeu)
            ? `<div class="badge-prog"><div class="badge-prog-fill" style="width:${Math.min(100, (a.prog / a.meta) * 100)}%"></div></div><span class="badge-prog-txt">${a.prog}/${a.meta}${ehGanha && a.proximoNivel ? ` pro ${a.proximoNivel}` : ''}</span>` : '';
        return `<div class="badge-card${ehGanha ? ' ok' : ''}${nova ? ' nova' : ''}"${podeCompartilhar ? ` data-act="share-badge" data-code="${a.codeAtual}"` : ''}>
            ${nova ? '<span class="badge-nova">nova</span>' : ''}
            <span class="badge-emo">${a.emo}</span>
            <div class="badge-name">${escapeHTML(a.nome)}</div>
            ${a.nivel ? `<span class="badge-nivel ${a.nivel.toLowerCase()}">${a.nivel}</span>` : ''}
            <div class="badge-desc">${escapeHTML(a.desc)}</div>
            ${prog}
            ${ehGanha && ehMeu ? `<span class="badge-share${jaFoi ? ' feito' : ''}">${jaFoi ? 'compartilhado' : 'compartilhar'}</span>` : ''}
        </div>`;
    };
    body.innerHTML = `
        ${proxima ? `<div class="prox-conq">
            <span class="prox-emo">${proxima.emo}</span>
            <div class="prox-txt"><small>Sua próxima conquista</small><b>${escapeHTML(proxima.nomeProximo || proxima.nome)}</b><span>Falta${faltam > 1 ? 'm' : ''} ${faltam} pra chegar lá · ${escapeHTML(proxima.descProximo || proxima.desc)}</span>
                <div class="badge-prog"><div class="badge-prog-fill" style="width:${Math.min(100, (proxima.prog / proxima.meta) * 100)}%"></div></div></div>
        </div>` : ''}
        ${ehMeu ? `<div class="wk-summary"><b>${ganhas.length}</b> ${ganhas.length === 1 ? 'conquista' : 'conquistas'}${andamento.filter(x => !x.ok).length ? ` · ${andamento.filter(x => !x.ok).length} em andamento` : ''} · <button class="link-btn" data-act="toggle-badges-public">${state.profile.show_badges ? 'visíveis no seu perfil' : 'só você vê'}</button></div>` : ''}
        ${ganhas.length ? `${ehMeu ? '<div class="badge-secao">Conquistadas</div>' : ''}<div class="badge-grid">${ganhas.map(a => card(a, true)).join('')}</div>` : ''}
        ${andamento.filter(a => !a.ok).length ? `<div class="badge-secao">Em andamento</div><div class="badge-grid">${andamento.filter(a => !a.ok).map(a => card(a, false)).join('')}</div>` : ''}
        ${ehMeu && !ganhas.length && !andamento.length ? '<div class="grid-empty">Registre seu primeiro treino e as conquistas começam a aparecer.</div>' : ''}`;
}

// Conquistas em níveis: Treinos, Ofensiva e Evolução no peso viram um card só (bronze → prata → ouro)
const NIVEIS_CONQ = [
    { nome: 'Treinos', emo: '🏋️', codes: ['treinos_10', 'treinos_50', 'treinos_100'] },
    { nome: 'Ofensiva', emo: '🔥', codes: ['streak_7', 'streak_30', 'streak_100'] },
    { nome: 'Evolução no peso', emo: '📉', codes: ['perda_5', 'perda_10'] },
];
const NOMES_NIVEL = ['Bronze', 'Prata', 'Ouro'];
function agruparNiveis(lista) {
    const porCode = Object.fromEntries(lista.map(a => [a.code, a]));
    const usados = new Set();
    const saida = [];
    NIVEIS_CONQ.forEach(g => {
        const itens = g.codes.map(c => porCode[c]).filter(Boolean);
        if (!itens.length) return;
        itens.forEach(a => usados.add(a.code));
        const k = itens.filter(a => a.ok).length; // quantos níveis já ganhos
        const atual = k ? itens[k - 1] : null, prox = itens[k] || null;
        saida.push({
            code: g.codes[0], codeAtual: atual ? atual.code : itens[0].code,
            emo: (atual || itens[0]).emo, nome: g.nome,
            nivel: k ? NOMES_NIVEL[k - 1] : null,
            desc: (atual || itens[0]).desc,
            ok: k > 0, okTotal: k === itens.length,
            prog: prox ? prox.prog : (atual ? atual.prog : 0), meta: prox ? prox.meta : (atual ? atual.meta : 0),
            proximoNivel: prox && k ? NOMES_NIVEL[k] : null,
            nomeProximo: prox ? `${g.nome} · ${NOMES_NIVEL[k]}` : null, descProximo: prox ? prox.desc : null,
        });
    });
    lista.forEach(a => { if (!usados.has(a.code)) saida.push({ ...a, codeAtual: a.code, okTotal: a.ok }); });
    return saida;
}
// Quando cada conquista foi ganha (pra mostrar o selo "nova" por 7 dias)
function datasConquistas() {
    try { return JSON.parse(localStorage.getItem('pulso-conq-datas-' + state.session.user.id) || '{}'); } catch (_) { return {}; }
}

// ---- Comemoração quando ganha uma conquista nova ----
async function checarConquistasNovas() {
    if (!state.session) return;
    const { data } = await sb.rpc('user_achievements', { alvo: state.session.user.id });
    const ganhas = (data || []).filter(a => a.ok);
    const chave = 'pulso-conquistas-' + state.session.user.id;
    let vistas = null;
    try { vistas = JSON.parse(localStorage.getItem(chave) || 'null'); } catch (_) {}
    localStorage.setItem(chave, JSON.stringify(ganhas.map(a => a.code)));
    if (!vistas) return; // primeira vez neste aparelho: só anota, não comemora o que já tinha
    const novas = ganhas.filter(a => !vistas.includes(a.code));
    if (novas.length) {
        const d = datasConquistas();
        novas.forEach(a => { d[a.code] = Date.now(); });
        localStorage.setItem('pulso-conq-datas-' + state.session.user.id, JSON.stringify(d));
        const a = novas[0];
        const grupo = NIVEIS_CONQ.find(g => g.codes.includes(a.code));
        comemorarConquista(grupo ? { ...a, nome: `${grupo.nome} · ${NOMES_NIVEL[grupo.codes.indexOf(a.code)]}`, emo: a.emo } : a);
    }
}
function comemorarConquista(a) {
    const old = document.getElementById('conqSheet'); if (old) old.remove();
    const tela = document.createElement('div');
    tela.id = 'conqSheet';
    tela.className = 'conq-tela';
    const confete = Array.from({ length: 26 }, (_, k) => `<i style="left:${(k * 37) % 100}%;animation-delay:${(k % 9) * 0.08}s;background:${['#35E19B', '#FFC24B', '#5FB0FF', '#FF7A4D', '#C08BFF'][k % 5]}"></i>`).join('');
    tela.innerHTML = `<div class="conq-confete">${confete}</div>
        <div class="conq-card">
            <small>Nova conquista</small>
            <span class="conq-emo">${a.emo}</span>
            <h2>${escapeHTML(a.nome)}</h2>
            <p>${escapeHTML(a.desc)}</p>
            <button class="btn-primary" data-act="share-badge" data-code="${a.code}">Compartilhar</button>
            <button class="btn-ghost" id="conqFechar">Agora não</button>
        </div>`;
    document.body.appendChild(tela);
    requestAnimationFrame(() => tela.classList.add('on'));
    const fechar = () => { tela.classList.remove('on'); setTimeout(() => tela.remove(), 200); };
    tela.querySelector('#conqFechar').onclick = fechar;
    tela.querySelector('[data-act="share-badge"]').addEventListener('click', () => setTimeout(fechar, 50));
    tela.addEventListener('click', e => { if (e.target === tela) fechar(); });
}

// ---- Bloquear e denunciar ----
function showUserMenu(anchor) {
    const existing = document.getElementById('floatingPostMenu');
    if (existing && existing.dataset.menuType === 'user') { existing.remove(); return; }
    hidePostMenu();
    const uid = anchor.dataset.uid;
    const nome = anchor.dataset.name || 'essa pessoa';
    const bloqueado = state.blockedIds && state.blockedIds.has(uid);

    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.dataset.menuType = 'user';
    menu.className = 'post-menu';
    menu.innerHTML = `
        <button class="post-menu-item" data-act="report-user" data-uid="${uid}" data-name="${escapeHTML(nome)}">${icon('bandeira')}Denunciar</button>
        <button class="post-menu-item danger" data-act="toggle-block" data-uid="${uid}" data-name="${escapeHTML(nome)}" data-blocked="${bloqueado ? '1' : '0'}">
            ${bloqueado ? icon('ok') + 'Desbloquear' : icon('bloquear') + 'Bloquear'}
        </button>
    `;
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}

function openReportSheet(uid, nome, postId) {
    const old = document.getElementById('reportSheet');
    if (old) old.remove();
    const motivos = [
        ['spam', '📢 Spam ou propaganda'],
        ['ofensivo', '😡 Conteúdo ofensivo'],
        ['assedio', '🚷 Assédio ou perseguição'],
        ['perigoso', '⚠️ Conteúdo perigoso à saúde'],
        ['falso', '🎭 Perfil falso'],
        ['outro', '❓ Outro motivo'],
    ];
    const sheet = document.createElement('div');
    sheet.id = 'reportSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Denunciar</h3>
        <p class="sheet-sub">A denúncia vai só pra administração do app. ${escapeHTML(nome || '')} não fica sabendo.</p>
        <div class="report-list">
            ${motivos.map(([v, t]) => `<button type="button" class="report-opt" data-reason="${v}">${t}</button>`).join('')}
        </div>
        <div class="field" style="margin-top:12px"><label>Quer contar mais? (opcional)</label>
            <textarea id="repDetails" maxlength="300" placeholder="O que aconteceu"></textarea>
        </div>
        <div id="repMsg"></div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="repCancel">Cancelar</button>
            <button class="btn-primary" id="repSend">Enviar denúncia</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('repCancel').onclick = close;

    let motivo = null;
    sheet.querySelectorAll('.report-opt').forEach(b => b.addEventListener('click', e => {
        motivo = e.currentTarget.dataset.reason;
        sheet.querySelectorAll('.report-opt').forEach(x => x.classList.toggle('on', x === e.currentTarget));
    }));

    document.getElementById('repSend').onclick = async () => {
        if (!motivo) { document.getElementById('repMsg').innerHTML = '<div class="auth-msg err">Escolha um motivo.</div>'; return; }
        const btn = document.getElementById('repSend');
        btn.disabled = true; btn.textContent = 'Enviando...';
        const { error } = await sb.from('reports').insert({
            reporter_id: state.session.user.id,
            target_user: uid || null,
            post_id: postId || null,
            reason: motivo,
            details: document.getElementById('repDetails').value.trim() || null,
        });
        btn.disabled = false; btn.textContent = 'Enviar denúncia';
        if (error) { document.getElementById('repMsg').innerHTML = `<div class="auth-msg err">${error.message}</div>`; return; }
        close();
        toast('Denúncia enviada. Obrigado por avisar.', 'ok');
    };
}

// ---- Feed em pedaços ----
const FEED_PAGE = 10;

function filtrarBloqueados(lista) {
    if (!lista) return [];
    const bloq = state.blockedIds || new Set();
    return lista.filter(p => !bloq.has(p.user_id));
}

async function carregarBlocked() {
    const { data } = await sb.rpc('blocked_ids');
    state.blockedIds = new Set((data || []).map(r => r.id));
}

async function loadMoreFeed() {
    const box = $('#feedPosts');
    const maisBox = $('#feedMore');
    if (!box || !maisBox) return;
    const btn = maisBox.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Carregando...'; }

    const de = state.feedOffset || 0;
    const { data: posts, error } = await sb.from('posts')
        .select(`
            id, kind, caption, image_url, activity_type, duration_min, distance_km, muscle_groups, meal_slot, weight_kg, created_at, user_id, visibility, meal_score, meta, comments_off, pinned_at, meal_analysis, achievement_code,
            user:profiles!user_id!inner (id, username, display_name, avatar_url),
            reactions (id, user_id),
            comments (id)
        `)
        .neq('kind', 'story').neq('kind', 'weight').eq('in_feed', true)
        .order('created_at', { ascending: false })
        .range(de, de + FEED_PAGE - 1);

    if (error) { if (btn) { btn.disabled = false; btn.textContent = 'Tentar de novo'; } return; }

    state.feedOffset = de + (posts || []).length;
    const novos = filtrarBloqueados(posts);
    if (novos.length) box.insertAdjacentHTML('beforeend', novos.map(p => renderPost(p)).join(''));
    maisBox.innerHTML = (posts || []).length >= FEED_PAGE
        ? '<button class="btn-secondary feed-more-btn" data-act="load-more-feed">Carregar mais</button>'
        : '<div class="feed-end">Você chegou ao fim 🌿</div>';
}

// Carrega sozinho quando chega perto do fim
window.addEventListener('scroll', () => {
    if (state.view !== 'feed' || state.loadingMore) return;
    const maisBox = document.getElementById('feedMore');
    if (!maisBox || !maisBox.querySelector('button')) return;
    const perto = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
    if (perto) {
        state.loadingMore = true;
        loadMoreFeed().finally(() => { state.loadingMore = false; });
    }
}, { passive: true });

// ---- Conquista nova avisa na hora ----
async function checarConquistas(silencioso) {
    try {
        const { data } = await sb.rpc('my_achievements');
        const feitas = (data || []).filter(a => a.ok).map(a => a.code);
        const chave = 'pulso-badges-' + state.session.user.id;
        let antigas = [];
        try { antigas = JSON.parse(localStorage.getItem(chave) || '[]'); } catch (e) {}

        const primeiraVez = !localStorage.getItem(chave);
        const novas = feitas.filter(c => !antigas.includes(c));
        localStorage.setItem(chave, JSON.stringify(feitas));

        if (primeiraVez || silencioso || novas.length === 0) return;
        const conq = (data || []).find(a => a.code === novas[0]);
        if (conq) mostrarConquista(conq, novas.length - 1);
    } catch (e) {}
}

function mostrarConquista(conq, extras) {
    const old = document.getElementById('badgeSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'badgeSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card badge-unlock">
        <div class="sheet-handle"></div>
        <span class="unlock-emo">${conq.emo}</span>
        <div class="unlock-tag">Conquista desbloqueada</div>
        <h3 class="unlock-nome">${escapeHTML(conq.nome)}</h3>
        <p class="unlock-desc">${escapeHTML(conq.desc)}</p>
        ${extras > 0 ? `<p class="unlock-extra">e mais ${plural(extras, 'conquista', 'conquistas')} esperando no seu perfil</p>` : ''}
        <div class="sheet-footer">
            <button class="btn-ghost" id="bsClose">Agora não</button>
            <button class="btn-primary" data-act="share-badge" data-code="${conq.code}" id="bsShare">Compartilhar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('bsClose').onclick = close;
    document.getElementById('bsShare').addEventListener('click', () => setTimeout(close, 400));
}

// ---- Ler print de treino ----
// Pra IA: sempre reconverte em JPEG (PNG, WEBP e HEIC davam leitura falha)
function imagemJpegParaIA(file, maxSide = 1280, quality = 0.88) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            const maior = Math.max(width, height);
            if (maior > maxSide) { const f = maxSide / maior; width = Math.round(width * f); height = Math.round(height * f); }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem ilegível')); };
        img.src = url;
    });
}
function numeroDaIA(v) {
    if (v == null) return NaN;
    const m = String(v).replace(',', '.').match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
}

function fileParaBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

async function lerPrintDeTreino() {
    const btn = $('#lerPrintBtn');
    if (!state.composerPhoto) { toast('Escolha a foto do print primeiro', 'err'); return; }
    btn.disabled = true; btn.textContent = 'Lendo o print...';
    try {
        const b64 = await imagemJpegParaIA(state.composerPhoto);
        const { data, error } = await sb.functions.invoke('vision-tools', {
            body: { task: 'workout', imageBase64: b64, mimeType: 'image/jpeg' },
        });
        if (error || !data || !data.activity_type) throw (error || new Error('sem leitura'));

        const sel = $('#wType');
        if ([...sel.options].some(o => o.value === data.activity_type || o.text === data.activity_type)) {
            sel.value = data.activity_type;
        }
        if (data.duration_min) $('#wDuration').value = data.duration_min;
        if (data.distance_km) {
            $('#wDistance').value = data.distance_km;
            atualizarCamposTreino();
        }
        toast(`Li do print: ${data.activity_type}${data.duration_min ? ', ' + data.duration_min + ' min' : ''}`, 'ok');
    } catch (e) {
        toast('Não consegui ler esse print. Preencha na mão mesmo.', 'err');
    } finally {
        btn.disabled = false; btn.textContent = 'Preencher pelo print';
    }
}

// ---- Relatório de padrões (IA) ----
async function refreshReportCard() {
    const box = $('#reportCard');
    if (!box) return;
    const [{ data: atual }, { data: semanas }] = await Promise.all([
        sb.rpc('current_report'),
        sb.rpc('report_readiness'),
    ]);
    const relatorio = atual && atual[0];
    const prontas = Number(semanas || 0);

    if (relatorio) {
        const quando = new Date(relatorio.created_at).toLocaleDateString('pt-BR');
        box.innerHTML = `
            <div class="chart-head"><span class="chart-title">Seus padrões</span><span class="chart-legend">gerado em ${quando}</span></div>
            <div class="report-body">${escapeHTML(relatorio.body).replace(/\n/g, '<br>')}</div>`;
        return;
    }

    if (prontas < 3) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';

    // Avisa uma vez quando o relatório passa a estar disponível
    if (localStorage.getItem('pulso-relatorio-avisado') !== 'sim') {
        localStorage.setItem('pulso-relatorio-avisado', 'sim');
        setTimeout(() => toast('Você já tem dados pra IA achar seus padrões. Role até o fim da Evolução.', 'ok'), 800);
    }

    box.innerHTML = `
        <div class="chart-head"><span class="chart-title">Seus padrões</span></div>
        <p class="chart-foot" style="text-align:left">A IA cruza seu sono, sua água, seus treinos e sua alimentação pra achar o que funciona pra você. Uma vez por mês.</p>
        <button class="btn-mini" data-act="gerar-relatorio" style="margin-top:12px">Gerar relatório do mês</button>`;
}

async function gerarRelatorio(btn) {
    btn.disabled = true; btn.textContent = 'Analisando seus dados...';
    try {
        const { data: linhas, error } = await sb.rpc('weekly_patterns', { weeks_back: 10 });
        if (error) throw error;
        const comDados = (linhas || []).filter(l => l.dias_treino || l.agua_media_ml || l.sono_medio || l.peso);
        if (comDados.length < 3) { toast('Ainda faltam semanas com registro', 'err'); return; }

        const tabela = comDados.map(l => {
            const p = [];
            p.push(`Semana de ${new Date(l.semana + 'T12:00:00').toLocaleDateString('pt-BR')}`);
            p.push(`treinos: ${l.dias_treino} dias (${l.minutos} min)`);
            if (l.agua_media_ml) p.push(`água: ${(l.agua_media_ml / 1000).toFixed(1)} L/dia`);
            if (l.sono_medio) p.push(`sono: ${l.sono_medio}h/noite`);
            if (l.peso) p.push(`peso: ${l.peso} kg`);
            if (l.nota_refeicao) p.push(`nota das refeições: ${l.nota_refeicao}/10`);
            p.push(`pontos: ${Math.round(l.pontos)}`);
            return '- ' + p.join(' | ');
        }).join('\n');

        const ctx = await getCoachContext(true);
        const brief = formatCoachContext(ctx);

        const prompt = `${COACH_PERSONA}

DOSSIÊ DA PESSOA:
${brief}

HISTÓRICO SEMANA A SEMANA:
${tabela}

TAREFA:
Analise as semanas acima e escreva um retrato curto dos padrões dessa pessoa. Procure relações entre as colunas, por exemplo: semanas com mais sono tiveram mais treino? a água acompanha os dias de treino? o peso ou a nota das refeições mudou junto com alguma coisa?

REGRAS DA RESPOSTA:
- No máximo 150 palavras, em português do Brasil.
- Comece pelo padrão mais forte que você encontrou, citando os números reais das semanas.
- Só afirme uma relação se ela aparecer em pelo menos 3 semanas. Se não houver relação clara, diga isso com honestidade em vez de inventar.
- Termine com UMA sugestão prática pra este mês, ligada ao objetivo da pessoa.
- Nada de bullet point numerado, escreva em dois ou três parágrafos curtos.
- Não fale de emagrecer se o objetivo dela não for esse.`;

        const texto = await callAI(prompt);
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const periodo = inicioMes.toISOString().split('T')[0];

        const { error: erroSalvar } = await sb.from('ai_reports').insert({
            user_id: state.session.user.id,
            period_start: periodo,
            body: texto.trim(),
        });
        if (erroSalvar && erroSalvar.code !== '23505') throw erroSalvar;

        toast('Relatório pronto', 'ok');
        refreshReportCard();
    } catch (e) {
        console.error(e);
        toast('Não consegui gerar agora. Tente de novo em instantes.', 'err');
        btn.disabled = false; btn.textContent = 'Gerar relatório do mês';
    }
}

// ---- Ditar em vez de digitar ----
function ditar(alvoId) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) { toast('Seu navegador não suporta ditado por voz', 'err'); return; }
    const campo = document.getElementById(alvoId);
    if (!campo) return;

    if (state.rec) { state.rec.stop(); state.rec = null; return; }

    const rec = new Rec();
    state.rec = rec;
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;

    const btn = document.querySelector(alvoId === 'coachInput' ? '#coachMic' : '#chatMic');
    if (btn) btn.classList.add('gravando');
    const inicial = campo.value;

    rec.onresult = (e) => {
        let texto = '';
        for (let i = e.resultIndex; i < e.results.length; i++) texto += e.results[i][0].transcript;
        campo.value = (inicial ? inicial + ' ' : '') + texto;
        campo.style.height = 'auto';
        campo.style.height = Math.min(120, campo.scrollHeight) + 'px';
    };
    rec.onerror = () => { toast('Não consegui ouvir. Tente de novo.', 'err'); };
    rec.onend = () => {
        if (btn) btn.classList.remove('gravando');
        state.rec = null;
        campo.focus();
    };
    rec.start();
    toast('Pode falar', 'ok');
}

// ---- Story já começa com uma cor bonita ----
function prepararStory() {
    const campo = $('#storyColorField');
    if (!campo) return;
    // Com foto, a cor não importa: some o seletor
    campo.classList.toggle('hidden', !!state.composerPhoto);
    if (!state.composerBg) state.composerBg = '#35E19B';
    atualizarPreviaStory();
}

function atualizarPreviaStory() {
    const prev = $('#storyPreview');
    if (!prev) return;
    prev.style.background = state.composerBg || '#35E19B';
    const escuro = (state.composerBg || '') === '#151B18';
    prev.style.color = escuro ? '#F1F4F1' : '#0A0C0B';
    const txt = $('#storyPreviewTxt');
    const legenda = ($('#pCaption') && $('#pCaption').value.trim()) || '';
    if (txt) {
        txt.textContent = legenda || 'Escreva algo na legenda';
        txt.style.opacity = legenda ? '1' : '.55';
    }
}

// ---- Sono no composer ----
let qualidadeSono = 'moderado';
document.addEventListener('click', e => {
    const b = e.target.closest('.qual-btn');
    if (!b) return;
    qualidadeSono = b.dataset.qual;
    document.querySelectorAll('.qual-btn').forEach(x => x.classList.toggle('on', x === b));
});

// Mostra a noite escolhida como "Ontem · 01/10/2026"
function mostrarDataSono() {
    const v = $('#skDate').value;
    const el = document.getElementById('skDateTxt');
    if (!el) return;
    if (!v) { el.textContent = 'Escolha a noite'; return; }
    const dt = new Date(v + 'T12:00:00');
    const br = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rel = v === hojeISO() ? 'Hoje' : v === isoDe(new Date(Date.now() - 86400000)) ? 'Ontem'
        : dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    el.textContent = `${rel.charAt(0).toUpperCase() + rel.slice(1)} · ${br}`;
}
document.getElementById('skDate').addEventListener('change', mostrarDataSono);
document.getElementById('skDate').addEventListener('input', mostrarDataSono);

async function prepararSono() {
    const ontem = isoDe(new Date(Date.now() - 86400000)); // data do Brasil
    const campoData = $('#skDate');
    campoData.value = ontem;
    mostrarDataSono();
    campoData.max = hojeISO();                                   // nunca no futuro
    campoData.min = isoDe(new Date(Date.now() - 7 * 86400000));  // até 7 dias pra trás

    const { data } = await sb.rpc('sleep_summary');
    const s = (data && data[0]) || {};
    const box = $('#sleepInfo');
    if (!box) return;

    const jaTem = s.ontem != null;
    if (jaTem) $('#skHours').value = Number(s.ontem);

    box.innerHTML = `
        <div class="wtr-top">
            <span class="wtr-now">${s.media7 != null ? String(s.media7).replace('.', ',') + 'h' : '--'}</span>
            <span class="wtr-goal">média das últimas noites</span>
        </div>
        <div class="wtr-hint">${jaTem
            ? 'Você já registrou essa noite. Salvando de novo, o valor é atualizado.'
            : 'Registre a noite que acabou de passar.'}</div>`;
}

// ---- Sono ----
async function refreshSleepCard() {
    const box = $('#sleepCard');
    if (!box) return;
    const [{ data }, { data: serie }] = await Promise.all([
        sb.rpc('sleep_summary'),
        sb.rpc('sleep_series', { days_back: 14 }),
    ]);
    const s = (data && data[0]) || {};
    state.sleep = s;

    if (!s.registros) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';

    const media = s.media7 != null ? Number(s.media7) : null;
    const rotulo = { ruim: 'noites difíceis', moderado: 'noites medianas', bom: 'noites boas' }[s.qualidade_comum] || null;
    const barras = (serie || []).map(d => ({
        label: new Date(d.d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' }),
        value: Number(d.hours),
    }));

    box.innerHTML = `
        <div class="chart-head">
            <span class="chart-title">Sono</span>
            ${rotulo ? `<span class="chart-legend">na maioria, ${rotulo}</span>` : ''}
        </div>
        <div class="sleep-row">
            <div class="sleep-now">
                <span class="sleep-val">${media != null ? String(media).replace('.', ',') + 'h' : '--'}</span>
                <span class="sleep-lbl">média por noite</span>
            </div>
        </div>
        ${barras.length >= 2 ? barChart(barras, { goal: Number(state.profile.sleep_goal_h) || 7, height: 110 }) : ''}
    `;
}

function openSleepSheet() {
    const old = document.getElementById('sleepSheet');
    if (old) old.remove();
    const atual = (state.sleep && state.sleep.ontem != null) ? Number(state.sleep.ontem) : 7.5;
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sheet = document.createElement('div');
    sheet.id = 'sleepSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Quanto você dormiu?</h3>
        <p class="sheet-sub">A noite que já passou. Só você vê, e dá pra ajustar depois.</p>
        <div class="field">
            <label>Horas de sono</label>
            <div class="stepper" data-target="slHours" data-min="0" data-max="16" data-step="0.5" data-default="7.5">
                <button type="button" class="step-btn" data-dir="-">−</button>
                <input type="number" id="slHours" step="0.5" value="${atual}" inputmode="decimal">
                <button type="button" class="step-btn" data-dir="+">+</button>
            </div>
        </div>
        <div class="field">
            <label>Dia</label>
            <input type="date" id="slDate" value="${ontem}" max="${ontem}">
            <p class="field-hint">Por padrão vem o dia de ontem, a noite que você acabou de dormir. Dá pra escolher dias anteriores.</p>
        </div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="slCancel">Cancelar</button>
            <button class="btn-primary" id="slSave">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('slCancel').onclick = close;

    document.getElementById('slSave').onclick = async () => {
        const btn = document.getElementById('slSave');
        const horas = parseFloat(document.getElementById('slHours').value);
        const dia = document.getElementById('slDate').value;
        if (isNaN(horas) || horas < 0 || horas > 16) { toast('Informe um valor entre 0 e 16 horas', 'err'); return; }
        btn.disabled = true; btn.textContent = 'Salvando...';
        const { error } = await sb.from('sleep_logs').upsert({
            user_id: state.session.user.id, slept_on: dia, hours: horas, updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,slept_on' });
        btn.disabled = false; btn.textContent = 'Salvar';
        if (error) {
            if (!navigator.onLine || String(error.message || '').toLowerCase().includes('fetch')) {
                guardarNaFila({ tipo: 'sleep', dia, horas });
                close();
                toast('Sem internet agora. Guardei e envio assim que voltar.', 'ok');
                return;
            }
            toast(msgErro(error), 'err'); return;
        }
        close();
        toast('Sono registrado', 'ok');
        refreshSleepCard();
    };
}

// ---- Água ----
function formatLitros(ml) {
    return (ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace('.', ',') + ' L';
}

async function refreshWaterProgress() {
    const box = $('#waterProgress');
    if (!box) return;
    const w = await aguaDeHoje();
    state.waterToday = w;
    const falta = Math.max(0, w.goal_ml - w.total_ml);
    box.innerHTML = `
        <div class="wtr-top">
            <span class="wtr-now">${formatLitros(w.total_ml)}</span>
            <span class="wtr-goal">de ${formatLitros(w.goal_ml)} hoje</span>
        </div>
        <div class="wtr-track"><div class="wtr-fill" style="width:${w.pct}%"></div></div>
        <div class="wtr-hint">${falta > 0 ? `Faltam ${formatLitros(falta)} pra bater a meta de hoje.` : 'Meta do dia batida! 🎉'}</div>
    `;
}

document.addEventListener('click', e => {
    const b = e.target.closest('.water-btn');
    if (!b) return;
    document.querySelectorAll('.water-btn').forEach(x => x.classList.toggle('on', x === b));
    const input = $('#wMl');
    if (input) input.value = b.dataset.ml;
});

// ---- Refeições já registradas hoje ficam bloqueadas no seletor ----
async function refreshMealSlots() {
    const sel = $('#mSlot');
    if (!sel) return;
    const { data } = await sb.rpc('meals_today');
    const usados = new Set((data || []).map(r => r.slot));
    let primeiroLivre = null;
    [...sel.options].forEach(op => {
        const bloqueado = op.value !== 'lanche' && usados.has(op.value);
        op.disabled = bloqueado;
        const base = op.textContent.replace(' (já registrado hoje)', '');
        op.textContent = bloqueado ? base + ' (já registrado hoje)' : base;
        if (!bloqueado && primeiroLivre === null) primeiroLivre = op.value;
    });
    if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled && primeiroLivre) sel.value = primeiroLivre;
}

// ---- Buscar pessoas ----
// ---- Busca com histórico das últimas 10 pessoas (fica só neste aparelho) ----
const chaveHistBusca = () => 'pulso-busca-' + (state.session ? state.session.user.id : '');
function lerHistBusca() { try { return JSON.parse(lsGet(chaveHistBusca()) || '[]'); } catch (_) { return []; } }
function salvarNoHistBusca(u) {
    if (!u || !u.id) return;
    const lista = lerHistBusca().filter(x => x.id !== u.id);
    lista.unshift({ id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url || null });
    lsSet(chaveHistBusca(), JSON.stringify(lista.slice(0, 10)));
}
function linhaPessoaBusca(u, comX) {
    return `<div class="follow-row busca-row" data-act="busca-abrir" data-uid="${u.id}" data-username="${escapeHTML(u.username || '')}" data-nome="${escapeHTML(u.display_name || '')}" data-avatar="${u.avatar_url || ''}">
        ${avatarHTML(u, 'sm')}
        <div style="flex:1;min-width:0">
            <div class="follow-name">${escapeHTML(u.display_name || '')}</div>
            <div class="follow-uname">@${escapeHTML(u.username || '')}</div>
        </div>
        ${comX ? `<button class="busca-x" data-act="busca-remover" data-uid="${u.id}" aria-label="Tirar do histórico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg></button>` : ''}
    </div>`;
}
function mostrarHistBusca() {
    const box = document.getElementById('searchResults');
    if (!box) return;
    const lista = lerHistBusca();
    box.innerHTML = (lista.length
        ? `<div class="busca-topo"><span>Recentes</span><button class="ia-link" data-act="busca-limpar">Limpar tudo</button></div>${lista.map(u => linhaPessoaBusca(u, true)).join('')}`
        : '') + '<div id="buscaSugestoes"></div>';
    carregarSugestoes(6).then(sug => {
        const s = document.getElementById('buscaSugestoes');
        if (!s) return;
        s.innerHTML = sug.length ? `<div class="busca-topo"><span>Sugestões pra você</span></div>${sug.map(linhaSugestao).join('')}`
            : (lista.length ? '' : '<div class="log-empty">Digite pra encontrar gente no Pulso.</div>');
    });
}
function renderSearch() {
    $('#viewContainer').innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back">←</button>
                <div class="topbar-title">Buscar pessoas</div>
                <div style="width:28px"></div>
            </div>
            <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                <input type="text" id="searchInput" placeholder="Nome ou @usuario" autocapitalize="off" autocomplete="off">
            </div>
            <div id="searchResults"></div>
        </div>
    `;
    mostrarHistBusca();
    const input = $('#searchInput');
    input.focus();
    let timer = null;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim();
        const box = $('#searchResults');
        if (!q) { mostrarHistBusca(); return; }
        if (q.length < 2) { box.innerHTML = '<div class="log-empty">Digite pelo menos 2 letras.</div>'; return; }
        box.innerHTML = '<div class="spinner"></div>';
        timer = setTimeout(async () => {
            const { data, error } = await sb.rpc('search_profiles', { q });
            if (!$('#searchResults')) return;
            if (error) { box.innerHTML = `<p style="color:var(--danger)">Erro: ${escapeHTML(error.message)}</p>`; return; }
            if (!data || data.length === 0) { box.innerHTML = '<div class="log-empty">Ninguém encontrado com esse nome.</div>'; return; }
            box.innerHTML = data.map(u => linhaPessoaBusca(u, false)).join('');
        }, 350);
    });
}

// ---- Notificações ----
async function updateNotifBadge() {
    const [{ data }, { data: pend }, { data: extra }] = await Promise.all([
        sb.rpc('unread_notifications'),
        sb.rpc('pending_follow_requests_count'),
        sb.rpc('unread_app_notifications'),
    ]);
    const n = Number(data || 0) + Number(pend || 0) + Number(extra || 0);
    const dot = $('#notifDot');
    if (!dot) return;
    dot.textContent = n > 9 ? '9+' : String(n);
    dot.classList.toggle('hidden', n === 0);
}

async function renderNotifications() {
    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back">←</button>
                <div class="topbar-title">Notificações</div>
                <div style="width:28px"></div>
            </div>
            <div id="notifList"><div class="spinner"></div></div>
        </div>
    `;
    const [{ data: base, error }, { data: pedidos }, { data: extras }] = await Promise.all([
        sb.rpc('list_notifications'),
        sb.rpc('list_follow_requests'),
        sb.rpc('list_app_notifications'),
    ]);
    const tudo = [...(base || []), ...(extras || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    // agrupa curtidas e comentários do mesmo post: "Maria e mais 4 pessoas curtiram"
    const data = [];
    const grupos = {};
    tudo.forEach(n => {
        if ((n.kind === 'reaction' || n.kind === 'comment') && n.post_id) {
            const k = n.kind + '|' + n.post_id;
            if (grupos[k]) {
                if (n.actor_id && !grupos[k].atores.has(n.actor_id)) { grupos[k].atores.add(n.actor_id); grupos[k].n.outros++; }
                return;
            }
            n.outros = 0;
            grupos[k] = { n, atores: new Set([n.actor_id]) };
        }
        data.push(n);
    });
    const box = $('#notifList');
    if (!box) return;
    if (error) { box.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
    const pedidosHTML = (pedidos && pedidos.length) ? `<div class="freq-box">
        <div class="freq-titulo">Pedidos pra seguir</div>
        ${pedidos.map(u => `<div class="freq-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div class="freq-info">
                <div class="freq-nome">${escapeHTML(u.display_name)}</div>
                <div class="freq-user">@${escapeHTML(u.username)} · ${timeAgo(u.requested_at)}</div>
            </div>
            <div class="freq-acoes">
                <button class="btn-primary-sm" data-act="follow-request" data-uid="${u.id}" data-accept="1">Aprovar</button>
                <button class="btn-ghost btn-xs" data-act="follow-request" data-uid="${u.id}" data-accept="0">Recusar</button>
            </div>
        </div>`).join('')}
    </div>` : '';
    if ((!data || data.length === 0) && pedidosHTML) {
        box.innerHTML = pedidosHTML;
        await sb.rpc('mark_notifications_read');
        updateNotifBadge();
        return;
    }
    if (!data || data.length === 0) {
        box.innerHTML = `<div class="feed-empty"><span class="emo">🔔</span><h3>Nenhum aviso por enquanto</h3><p>Quando alguém curtir, comentar, seguir você ou te chamar pra um desafio, aparece aqui.</p><button class="btn-mini" data-act="m-go" data-view="search">Encontrar pessoas</button></div>`;
        await sb.rpc('mark_notifications_read');
        updateNotifBadge();
        return;
    }

    box.innerHTML = pedidosHTML + data.map(n => {
        const quem = escapeHTML(n.actor_name || 'Alguém');
        const autor = { id: n.actor_id, display_name: n.actor_name, username: n.actor_username, avatar_url: n.actor_avatar };
        let texto, emo, act = '', extra = '';
        const mais = n.outros > 0 ? ` e mais ${n.outros} ${n.outros === 1 ? 'pessoa' : 'pessoas'}` : '';
        if (n.kind === 'comment') {
            emo = '💬'; texto = `<b>${quem}</b>${mais} ${n.outros > 0 ? 'comentaram' : 'comentou'} no seu post`;
            act = ` data-act="view-post" data-id="${n.post_id}"`;
        } else if (n.kind === 'reaction') {
            emo = '❤️'; texto = `<b>${quem}</b>${mais} ${n.outros > 0 ? 'curtiram' : 'curtiu'} seu post`;
            act = ` data-act="view-post" data-id="${n.post_id}"`;
        } else if (n.kind === 'follow') {
            emo = '👤'; texto = `<b>${quem}</b> começou a te seguir`;
            act = ` data-act="view-user" data-uid="${n.actor_id}"`;
        } else if (n.kind === 'follow_aceito') {
            emo = '✅'; texto = `<b>${quem}</b> aceitou seu pedido pra seguir`;
            act = ` data-act="view-user" data-uid="${n.actor_id}"`;
        } else if (n.kind === 'convite_premiado') {
            emo = '🎁'; texto = `<b>${quem}</b> registrou o primeiro treino. Você ganhou 10 pontos pelo convite`;
            act = ` data-act="view-user" data-uid="${n.actor_id}"`;
        } else if (n.kind === 'acesso_liberado') {
            emo = '🎉'; texto = `Seu acesso ao Pulso foi liberado. Bem-vindo!`;
            act = ` data-act="m-go" data-view="feed"`;
        } else if (n.kind === 'cadastro_pendente') {
            emo = '🆕'; texto = `<b>${quem}</b> se cadastrou e está esperando você liberar o acesso`;
            act = ` data-act="m-go" data-view="admin"`;
        } else if (n.kind === 'resposta') {
            emo = '↩️'; texto = `<b>${quem}</b> respondeu seu comentário`;
            act = ` data-act="abrir-comentarios" data-id="${n.post_id}"`;
        } else if (n.kind === 'mencao') {
            emo = '@'; texto = `<b>${quem}</b> mencionou você num comentário`;
            act = ` data-act="abrir-comentarios" data-id="${n.post_id}"`;
        } else if (n.kind === 'depoimento') {
            emo = '✍️'; texto = `<b>${quem}</b> deixou um depoimento pra você`;
            act = ` data-act="abrir-depoimentos"`;
        } else if (n.kind === 'depoimento_publicado') {
            emo = '✨'; texto = `<b>${quem}</b> publicou o seu depoimento no perfil`;
            act = ` data-act="view-user" data-uid="${n.actor_id}"`;
        } else if (n.kind === 'dados_corrigidos') {
            emo = '🛠️'; texto = 'O administrador corrigiu alguns dados seus (como peso ou meta). Se algo parecer estranho, fale com ele.';
        } else if (n.kind === 'treino_com') {
            const m = n.meta || {};
            emo = '🤝';
            texto = `<b>${quem}</b> marcou você num treino de ${escapeHTML(m.atividade || 'treino')}${m.duracao ? ' · ' + m.duracao + ' min' : ''}${m.km ? ' · ' + br(m.km) + ' km' : ''}`
                + (m.resolvido ? `<span class="nt-sub">${m.resolvido === 'aceito' ? 'Registrado no seu histórico ✓' : 'Você recusou'}</span>`
                : `<span class="nt-acoes"><button class="btn-mini" data-act="treino-com-aceitar" data-post="${n.post_id}">Registrar o mesmo treino</button><button class="btn-ghost btn-xs" data-act="treino-com-recusar" data-post="${n.post_id}">Recusar</button></span>`);
        } else if (n.kind === 'story_curtido') {
            emo = '❤️'; texto = `<b>${quem}</b> curtiu seu story`;
            act = ` data-act="view-user" data-uid="${n.actor_id}"`;
        } else if (n.kind === 'desafio_fim') {
            const m = n.meta || {};
            emo = '🏆';
            texto = `O desafio <b>${escapeHTML(n.challenge_name || '')}</b> acabou! ${m.vencedor ? `${m.time ? 'Time ' : ''}<b>${escapeHTML(m.vencedor)}</b> venceu.` : ''}${m.posicao ? ` Você ficou em ${m.posicao}º.` : ''}`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'time_movido') {
            emo = '🔄'; texto = `Você mudou de time no desafio <b>${escapeHTML(n.challenge_name || '')}</b>. Confira seu time novo!`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'times_montados') {
            emo = '🟢'; texto = `Os times do desafio <b>${escapeHTML(n.challenge_name || '')}</b> foram montados! Veja em qual você está.`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'organizacao_recebida') {
            emo = '🗝️'; texto = `<b>${quem}</b> passou pra você a organização do desafio <b>${escapeHTML(n.challenge_name || '')}</b>`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'time_passou') {
            emo = '🟢'; texto = `Seu time passou na frente no desafio <b>${escapeHTML(n.challenge_name || '')}</b>! Bora segurar.`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'time_virado') {
            emo = '⚔️'; texto = `Viraram o placar no desafio <b>${escapeHTML(n.challenge_name || '')}</b>. Bora, time!`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'desafio_ultrapassado') {
            emo = '🏁'; texto = `<b>${quem}</b> te passou no desafio <b>${escapeHTML(n.challenge_name || '')}</b>. Bora retomar?`;
            act = ` data-act="open-painel-desafio" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'desafio_convite') {
            emo = '🏆'; texto = `<b>${quem}</b> te convidou pro desafio <b>${escapeHTML(n.challenge_name || '')}</b>`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        } else if (n.kind === 'desafio_aceito') {
            emo = '🏆'; texto = `Seu pedido pra entrar no desafio <b>${escapeHTML(n.challenge_name || '')}</b> foi aceito`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        } else if (n.body === 'incentivo') {
            emo = '💪'; texto = `<b>${quem}</b> mandou força pra você no desafio <b>${escapeHTML(n.challenge_name || '')}</b>`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        } else if (n.body === 'pediu pra entrar') {
            emo = '🙋'; texto = `<b>${quem}</b> pediu pra entrar no desafio <b>${escapeHTML(n.challenge_name || '')}</b>`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        } else {
            emo = '🏆'; texto = `<b>${quem}</b> te adicionou no desafio <b>${escapeHTML(n.challenge_name || '')}</b>`;
            act = ` data-act="open-challenge" data-id="${n.challenge_id}"`;
        }
        return `<div class="notif-row${n.read_at ? '' : ' nova'}"${act}>
            <span class="notif-av">${avatarHTML(autor, 'sm')}<span class="notif-mark">${emo}</span></span>
            <div class="notif-body">
                <div class="notif-text">${texto}</div>
                ${extra}
                <div class="notif-time">${timeAgo(n.created_at)}</div>
            </div>
        </div>`;
    }).join('');

    await Promise.all([sb.rpc('mark_notifications_read'), sb.rpc('mark_app_notifications_read')]);
    updateNotifBadge();
}

// ---- Como funcionam os pontos ----
function renderRules() {
    $('#viewContainer').innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-settings-back">←</button>
                <div class="topbar-title">Como ganhar pontos</div>
                <div style="width:28px"></div>
            </div>

            <p class="screen-sub">Aqui tudo gira em torno de constância. Vale mais aparecer todo dia do que se matar uma vez por mês.</p>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">💪</span><div><h4>Treino</h4><span class="rule-pts">até 15 pontos</span></div></div>
                <p class="rule-text">Quanto mais tempo de atividade, mais pontos. Musculação, corrida, natação, ciclismo e futebol rendem mais por minuto; caminhada, yoga, dança e alongamento rendem um pouco menos.</p>
                <p class="rule-text">Anexar foto do treino dá <b>+3</b>.</p>
                <p class="rule-note">Treinou mais de uma vez no mesmo dia? Vale o treino mais forte do dia.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">🍽️</span><div><h4>Refeição</h4><span class="rule-pts">1 ponto</span></div></div>
                <p class="rule-text">Fotografe o prato e a IA analisa: dá uma nota de 0 a 10, identifica os alimentos e sugere um ajuste pra próxima.</p>
                <p class="rule-note">Café, almoço e jantar valem um registro por dia cada. Lanche é livre.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">⚖️</span><div><h4>Pesagem</h4><span class="rule-pts">3 pontos por semana</span></div></div>
                <p class="rule-text">Pode registrar o peso quando quiser, todo dia se preferir, pra acompanhar a curva. A pontuação entra uma vez por semana.</p>
                <p class="rule-note">Seu peso é privado. Ninguém vê. Nos desafios, ele só entra na soma do grupo ("o grupo perdeu X kg"), e você pode tirar o seu dessa soma.</p>
            </div>

            <div class="rule-card destaque">
                <div class="rule-head"><span class="rule-emo">📉</span><div><h4>Perda de peso</h4><span class="rule-pts">25 pontos por 1%</span></div></div>
                <p class="rule-text">A conta é proporcional ao seu peso inicial, então é justa pra qualquer ponto de partida. Cada 1% perdido vale <b>25 pontos</b>, pagos uma única vez por marco.</p>
                <p class="rule-text">Pra cuidar da sua saúde, a pontuação acompanha um ritmo seguro: no máximo <b>1% por semana</b>. Se você perder mais rápido, nada se perde: o restante é pago nas semanas seguintes, conforme você registra o peso.</p>
                <p class="rule-note">Se o peso subir e descer de novo, você não perde o que já conquistou.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">🔥</span><div><h4>Ofensiva</h4><span class="rule-pts">até 20 pontos</span></div></div>
                <p class="rule-text">Qualquer registro do dia mantém a chama acesa: treino, refeição, pesagem ou story.</p>
                <p class="rule-text">Bônus em <b>3 dias</b> (+2), <b>7 dias</b> (+5), <b>14 dias</b> (+10) e <b>30 dias</b> (+20).</p>
                <p class="rule-note">Ficou um dia sem registrar nada? A ofensiva recomeça do zero.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">🎯</span><div><h4>Meta da semana</h4><span class="rule-pts">10 pontos</span></div></div>
                <p class="rule-text">Você escolhe quantos treinos quer fazer por semana em Editar perfil. Bateu a meta, ganha o bônus.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">⚡</span><div><h4>Story</h4><span class="rule-pts">3 pontos por dia</span></div></div>
                <p class="rule-text">Poste quantos quiser, eles somem em 24 horas. A pontuação conta uma vez por dia.</p>
            </div>

            <div class="rule-card alerta">
                <div class="rule-head"><span class="rule-emo">⏳</span><div><h4>Pontos têm validade</h4></div></div>
                <p class="rule-text">Cada ponto vale por <b>90 dias</b>. Foi ganho hoje, expira daqui a três meses.</p>
                <p class="rule-note">É de propósito: o score mostra como você está agora, não como estava no ano passado. Quem mantém a rotina, mantém a pontuação.</p>
            </div>

            <div class="rule-card">
                <div class="rule-head"><span class="rule-emo">🏆</span><div><h4>Desafios</h4></div></div>
                <p class="rule-text">Dentro de um desafio, o ranking usa os pontos que cada um ganhar durante o período dele. Enquanto o desafio rola, os participantes acompanham o progresso uns dos outros.</p>
            </div>
        </div>
    `;
}

// ---- Política de privacidade ----
function renderPrivacy() {
    $('#viewContainer').innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-settings-back">←</button>
                <div class="topbar-title">Privacidade</div>
                <div style="width:28px"></div>
            </div>
            <div class="install-card">
                <h4>O que o Pulso guarda</h4>
                <p class="priv-text">Seu nome, usuário, email e foto. E o que você registra: treinos, refeições, pesagens, medidas corporais e o histórico de saúde que você preencher.</p>
            </div>
            <div class="install-card">
                <h4>Quem vê o quê</h4>
                <p class="priv-text">Peso, medidas e histórico de saúde são <b>só seus</b>. Ninguém mais vê, nem o administrador pelo app.</p>
                <p class="priv-text">Refeições ficam privadas por padrão. Só vão pro feed se você escolher publicar.</p>
                <p class="priv-text">Dentro de um desafio, e só enquanto ele durar, os participantes veem o peso atual, a cintura e o percentual perdido uns dos outros. Quando o desafio acaba ou você sai, esse acesso some.</p>
                <p class="priv-text">Treinos aparecem no seu perfil pra quem visitar. Posts seguem a privacidade que você escolher em cada um.</p>
            </div>
            <div class="install-card">
                <h4>Inteligência artificial</h4>
                <p class="priv-text">A foto do prato é enviada a um serviço de inteligência artificial para análise nutricional. Suas conversas com o Coach levam um resumo dos seus números para a resposta fazer sentido. Nada disso é usado para publicidade.</p>
                <p class="priv-text">O Coach não é médico nem nutricionista. As sugestões são orientação geral, não substituem profissional de saúde.</p>
            </div>
            <div class="install-card">
                <h4>Seus direitos</h4>
                <p class="priv-text">Você pode editar ou apagar qualquer registro quando quiser, e pode excluir sua conta a qualquer momento em Configurações. Excluindo a conta, todo o seu conteúdo é apagado junto e não tem como recuperar.</p>
            </div>
        </div>
    `;
}

// ============================================================
// ATALHO NA TELA INICIAL: registra quem usa instalado e convida quem não usa
// ============================================================
const estaInstalado = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
function tipoAparelho() {
    const ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iphone';
    if (/android/i.test(ua)) return 'android';
    return 'computador';
}
// Navegador "de dentro" de outro app (Instagram, Facebook, LinkedIn...): não deixa instalar
const navegadorDeApp = () => /Instagram|FBAN|FBAV|FB_IAB|Line\/|LinkedInApp|Twitter|TikTok|GSA\//i.test(navigator.userAgent || '');

async function registrarAcesso() {
    if (!state.session) return;
    const instalado = estaInstalado();
    const chave = 'pulso-acesso-' + state.session.user.id;
    // registra no máximo a cada 15 dias por aparelho; se mudou (ex: acabou de instalar), registra na hora
    let ult = {};
    try { ult = JSON.parse(lsGet(chave) || '{}'); } catch (_) {}
    const modo = instalado ? 'app' : 'nav';
    if (ult.modo === modo && ult.em && Date.now() - ult.em < 15 * 86400000) return;
    lsSet(chave, JSON.stringify({ modo, em: Date.now() }));
    try { await sb.rpc('registrar_acesso', { instalado, aparelho: tipoAparelho() }); } catch (_) {}
}
window.addEventListener('appinstalled', () => {
    lsSet('pulso-acesso-' + (state.session ? state.session.user.id : ''), '');
    toast('Pulso instalado na tela inicial ✓', 'ok');
    setTimeout(registrarAcesso, 1500);
});

function convidarParaInstalar(forcar = false) {
    if (estaInstalado()) return;
    const ap = tipoAparelho();
    if (ap === 'computador' && !state.deferredPrompt) return;
    const ult = Number(lsGet('pulso-convite-instalar') || 0);
    if (!forcar && Date.now() - ult < 7 * 86400000) return;   // no máximo 1 vez por semana
    if (!forcar && document.querySelector('.sheet.on, #onbTela')) return;
    lsSet('pulso-convite-instalar', String(Date.now()));
    const old = document.getElementById('instalarSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'instalarSheet';
    sheet.className = 'sheet on';
    const compartilharIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
    const somarIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    let corpo;
    if (navegadorDeApp()) {
        corpo = `<p class="sheet-sub">Você abriu o Pulso de dentro de outro app, e por aqui não dá pra instalar. Copie o link e abra no ${ap === 'iphone' ? '<b>Safari</b>' : '<b>Chrome</b>'}.</p>
            <button class="btn-primary inst-ok" id="instCopiar">Copiar link do Pulso</button>`;
    } else if (state.deferredPrompt) {
        corpo = `<p class="sheet-sub">Fica com ícone próprio, abre em tela cheia e mais rápido, e recebe os lembretes do dia.</p>
            <button class="btn-primary inst-ok" id="instAgora">Instalar agora</button>`;
    } else if (ap === 'iphone') {
        corpo = `<p class="sheet-sub">Fica com ícone próprio, abre em tela cheia e recebe os lembretes do dia. São dois toques:</p>
            <div class="inst-passos">
                <div class="inst-passo"><span class="inst-n">1</span><span>Toque em <b class="inst-ico">${compartilharIco}</b> <b>Compartilhar</b>, na barra do Safari</span></div>
                <div class="inst-passo"><span class="inst-n">2</span><span>Escolha <b class="inst-ico">${somarIco}</b> <b>Adicionar à Tela de Início</b></span></div>
            </div>
            <button class="btn-primary inst-ok" id="instEntendi">Entendi</button>`;
    } else {
        corpo = `<p class="sheet-sub">No Chrome, toque nos <b>três pontinhos</b> do canto de cima e escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</p>
            <button class="btn-primary inst-ok" id="instEntendi">Entendi</button>`;
    }
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <div class="inst-topo"><img src="icon-192.png" alt="" class="inst-icone"><div><h3 class="sheet-title" style="margin:0">Coloque o Pulso na tela inicial</h3></div></div>
        ${corpo}
        <button class="btn-ghost inst-depois" id="instDepois">Agora não</button>
        ${ap === 'iphone' && !state.deferredPrompt && !navegadorDeApp() ? '<div class="inst-seta" aria-hidden="true"><span>a barra do Safari fica aqui embaixo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg></div>' : ''}
    </div>`;
    document.body.appendChild(sheet);
    const fechar = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet) fechar(); });
    sheet.querySelector('#instDepois').onclick = fechar;
    const en = sheet.querySelector('#instEntendi'); if (en) en.onclick = fechar;
    const cp = sheet.querySelector('#instCopiar'); if (cp) cp.onclick = async () => {
        try { await navigator.clipboard.writeText(location.origin + location.pathname); toast('Link copiado. Cole no navegador.', 'ok'); } catch (_) {}
    };
    const ag = sheet.querySelector('#instAgora'); if (ag) ag.onclick = async () => {
        fechar();
        try { state.deferredPrompt.prompt(); await state.deferredPrompt.userChoice; } catch (_) {}
        state.deferredPrompt = null;
    };
}

// ---- Instalar na tela inicial ----
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    const bt = document.getElementById('installNowBtn');
    if (bt) bt.classList.remove('hidden');
});

function renderInstall() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const jaInstalado = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    $('#viewContainer').innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-settings-back">←</button>
                <div class="topbar-title">Instalar o Pulso</div>
                <div style="width:28px"></div>
            </div>

            ${jaInstalado
                ? '<div class="install-ok">✅ Você já está usando o Pulso instalado. Boa!</div>'
                : `<p class="screen-sub">Colocando o Pulso na tela inicial, ele abre como um aplicativo: em tela cheia, sem a barra do navegador, e com ícone próprio.</p>
                   <button class="btn-primary ${state.deferredPrompt ? '' : 'hidden'}" id="installNowBtn" data-act="do-install" style="margin-bottom:18px">📲 Instalar agora</button>`}

            <div class="install-card${ios ? ' destaque' : ''}">
                <h4>🍎 iPhone e iPad</h4>
                <p class="install-note">Precisa ser pelo navegador <b>Safari</b>. Pelo Chrome do iPhone não funciona.</p>
                <ol class="install-steps">
                    <li>Abra o Pulso no <b>Safari</b>.</li>
                    <li>Toque no botão <b>Compartilhar</b>, o quadrado com a seta pra cima, na barra de baixo.</li>
                    <li>Role as opções e toque em <b>Adicionar à Tela de Início</b>.</li>
                    <li>Se quiser, mude o nome que vai aparecer embaixo do ícone.</li>
                    <li>Toque em <b>Adicionar</b>, no canto superior direito.</li>
                </ol>
            </div>

            <div class="install-card${ios ? '' : ' destaque'}">
                <h4>🤖 Android</h4>
                <p class="install-note">Pelo navegador <b>Google Chrome</b>.</p>
                <ol class="install-steps">
                    <li>Abra o Pulso no <b>Chrome</b>.</li>
                    <li>Toque nos <b>três pontinhos</b> no canto superior direito.</li>
                    <li>Toque em <b>Instalar aplicativo</b> (ou <b>Adicionar à tela inicial</b>).</li>
                    <li>Se quiser, ajuste o nome do atalho.</li>
                    <li>Confirme em <b>Instalar</b> ou <b>Adicionar</b>.</li>
                </ol>
            </div>

            <div class="install-card">
                <h4>💻 Computador</h4>
                <ol class="install-steps">
                    <li>No Chrome ou Edge, olhe a barra de endereço.</li>
                    <li>Clique no ícone de <b>instalar</b> (uma telinha com uma seta), à direita do endereço.</li>
                    <li>Confirme em <b>Instalar</b>.</li>
                </ol>
            </div>
        </div>
    `;
}

// ---- Tema e configurações ----
function applyTheme(theme) {
    const light = theme === 'light';
    if (light) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('pulso-theme', light ? 'light' : 'dark'); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#F4F6F4' : '#0A0C0B');
}

const POLITICA_NOME = { todos: 'Todos', seguidores: 'Seguidores', ninguem: 'Ninguém' };
const podeCriarDesafio = () => !!(state.profile && (state.profile.is_admin || state.profile.can_create_challenges));

function linhaConfig(act, ic, texto, valor = '', extra = '') {
    return `<button class="cfg-row" data-act="${act}"${extra}>
        ${icon(ic)}<span class="cfg-txt">${texto}</span>
        ${valor !== null ? `<span class="cfg-val">${valor}</span>` : ''}
        <svg class="cfg-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
    </button>`;
}
function cabecalhoConfig(titulo, voltar = 'go-settings-back') {
    return `<div class="user-topbar">
        <button class="topbar-back" data-act="${voltar}" aria-label="Voltar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="topbar-title">${titulo}</div>
        <div style="width:36px"></div>
    </div>`;
}

function renderSettings() {
    const p = state.profile;
    const tema = document.documentElement.getAttribute('data-theme') === 'light' ? 'Claro' : 'Escuro';
    const lembrete = localStorage.getItem('pulso-reminder') === 'on';
    $('#viewContainer').innerHTML = `
        <div class="view cfg-view">
            ${cabecalhoConfig('Configurações', 'go-menu')}

            <div class="cfg-grupo">
                <div class="cfg-titulo">Sua conta</div>
                ${linhaConfig('open-edit-profile', 'editar', 'Editar perfil')}
                ${linhaConfig('trocar-senha', 'chave', 'Trocar senha')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Privacidade</div>
                ${linhaConfig('cfg-page', 'cadeado', 'Privacidade da conta', p.is_private ? 'Privada' : 'Pública', ' data-page="set-privacy"')}
                ${linhaConfig('cfg-page', 'storyOculto', 'Ocultar story de', '<span id="cfgOcultos"></span>', ' data-page="set-hide-story"')}
                ${linhaConfig('go-blocked', 'bloquear', 'Bloqueados', '<span id="cfgBloq"></span>')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Interações</div>
                ${linhaConfig('cfg-page', 'mensagem', 'Quem pode mandar mensagem', POLITICA_NOME[p.dm_policy || 'todos'], ' data-page="set-messages"')}
                ${linhaConfig('cfg-page', 'comentario', 'Quem pode comentar', POLITICA_NOME[p.comment_policy || 'todos'], ' data-page="set-comments"')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Notificações</div>
                <button class="cfg-row" data-act="toggle-reminder" role="switch" aria-checked="${lembrete}">
                    ${icon('sino')}<span class="cfg-txt">Lembretes do dia</span>
                    <span class="cfg-switch${lembrete ? ' on' : ''}"><i></i></span>
                </button>
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">App</div>
                ${linhaConfig('cfg-page', 'tema', 'Aparência', tema, ' data-page="set-appearance"')}
                ${linhaConfig('go-install', 'instalar', 'Instalar na tela inicial')}
                ${p.is_admin ? linhaConfig('export-data', 'baixar', 'Baixar meus dados') : ''}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Ajuda</div>
                ${linhaConfig('go-rules', 'medalha', 'Como ganhar pontos')}
                ${linhaConfig('go-privacy', 'info', 'Seus dados e privacidade')}
                ${linhaConfig('cfg-page', 'info', 'Termos de uso', '', ' data-page="termos"')}
                ${linhaConfig('cfg-page', 'cadeado', 'Política de privacidade', '', ' data-page="politica-privacidade"')}
            </div>

            <div class="cfg-grupo cfg-sair">
                <button class="cfg-row cfg-perigo" data-act="do-logout"><span class="cfg-txt">Sair</span></button>
                <button class="cfg-row cfg-perigo" data-act="delete-account"><span class="cfg-txt">Excluir conta</span></button>
            </div>
        </div>
    `;
    // Números à direita chegam depois, sem travar a tela
    Promise.all([
        sb.from('blocks').select('*', { count: 'exact', head: true }).eq('blocker_id', state.session.user.id),
        sb.rpc('pending_follow_requests_count'),
        sb.from('story_hidden').select('*', { count: 'exact', head: true }).eq('owner_id', state.session.user.id),
    ]).then(([bl, pend, oc]) => {
        const put = (id, n) => { const el = document.getElementById(id); if (el && Number(n) > 0) el.textContent = n; };
        put('cfgBloq', bl.count);
        put('cfgPedidos', pend.data);
        put('cfgOcultos', oc.count);
    });
}

function paginaOpcoes(titulo, sub, campo, atual, opcoes) {
    return `<div class="view cfg-view">
        ${cabecalhoConfig(titulo)}
        <p class="cfg-sub">${sub}</p>
        <div class="cfg-grupo">
            ${opcoes.map(([v, nome, desc]) => `<button class="cfg-radio${atual === v ? ' on' : ''}" data-act="cfg-set" data-campo="${campo}" data-valor="${v}">
                <span class="cfg-radio-txt"><b>${nome}</b>${desc ? `<small>${desc}</small>` : ''}</span>
                <span class="cfg-radio-dot"></span>
            </button>`).join('')}
        </div>
    </div>`;
}

async function renderPaginaConfig(page) {
    const c = $('#viewContainer');
    const p = state.profile;
    if (page === 'set-privacy') {
        c.innerHTML = paginaOpcoes('Privacidade da conta',
            'Numa conta privada, só quem você aprovar vê seus posts, treinos e stories, mesmo os marcados como públicos.',
            'is_private', p.is_private ? '1' : '0', [
                ['0', 'Pública', 'Qualquer pessoa vê o que você posta como público. Seguir é na hora.'],
                ['1', 'Privada', 'Cada pedido pra seguir passa por você.'],
            ]);
    } else if (page === 'set-messages') {
        c.innerHTML = paginaOpcoes('Mensagens',
            'Quem pode começar uma conversa com você. Conversas que já existem continuam.',
            'dm_policy', p.dm_policy || 'todos', [
                ['todos', 'Todos', ''], ['seguidores', 'Só quem me segue', ''], ['ninguem', 'Ninguém', ''],
            ]);
    } else if (page === 'set-comments') {
        c.innerHTML = paginaOpcoes('Comentários',
            'Quem pode comentar nos seus posts.',
            'comment_policy', p.comment_policy || 'todos', [
                ['todos', 'Todos', ''], ['seguidores', 'Só quem me segue', ''], ['ninguem', 'Ninguém', ''],
            ]);
    } else if (page === 'set-appearance') {
        const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        c.innerHTML = paginaOpcoes('Aparência', 'Vale só pra este aparelho.', 'tema', cur, [
            ['dark', 'Escuro', ''], ['light', 'Claro', ''],
        ]);
    } else if (page === 'set-requests') {
        c.innerHTML = `<div class="view cfg-view">${cabecalhoConfig('Pedidos pra seguir')}<div id="cfgBody"><div class="spinner"></div></div></div>`;
        const { data } = await sb.rpc('list_follow_requests');
        const body = document.getElementById('cfgBody');
        if (!body) return;
        body.innerHTML = (data && data.length) ? `<div class="freq-box">${data.map(u => `<div class="freq-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div class="freq-info"><div class="freq-nome">${escapeHTML(u.display_name)}</div><div class="freq-user">@${escapeHTML(u.username)} · ${timeAgo(u.requested_at)}</div></div>
            <div class="freq-acoes">
                <button class="btn-primary-sm" data-act="follow-request" data-uid="${u.id}" data-accept="1">Aprovar</button>
                <button class="btn-ghost btn-xs" data-act="follow-request" data-uid="${u.id}" data-accept="0">Recusar</button>
            </div>
        </div>`).join('')}</div>`
            : `<p class="cfg-sub">Nenhum pedido esperando.${p.is_private ? '' : ' Sua conta é pública, então quem te segue entra na hora.'}</p>`;
    } else if (page === 'set-hide-story') {
        c.innerHTML = `<div class="view cfg-view">${cabecalhoConfig('Ocultar story de')}
            <p class="cfg-sub">Quem estiver marcado não vê seus stories. A pessoa não é avisada.</p>
            <div id="cfgBody"><div class="spinner"></div></div></div>`;
        const { data, error } = await sb.rpc('my_followers_story_visibility');
        const body = document.getElementById('cfgBody');
        if (!body) return;
        if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${escapeHTML(error.message)}</p>`; return; }
        body.innerHTML = (data && data.length) ? `<div class="cfg-grupo">${data.map(u => `<button class="cfg-pessoa" data-act="toggle-hide-story" data-uid="${u.id}" data-on="${u.hidden ? '1' : '0'}">
            ${avatarHTML(u, 'sm')}
            <span class="cfg-pessoa-txt"><b>${escapeHTML(u.display_name)}</b><small>@${escapeHTML(u.username)}</small></span>
            <span class="cfg-check${u.hidden ? ' on' : ''}"></span>
        </button>`).join('')}</div>` : '<p class="cfg-sub">Quando alguém te seguir, aparece aqui.</p>';
    }
}

// ---- Histórico de refeições no perfil ----
// Suas: todas (inclusive as só registradas). De outra pessoa: só as que ela publicou.
const MEAL_SLOT_NAME = { cafe:'Café da manhã', almoco:'Almoço', jantar:'Jantar', lanche:'Lanche' };

async function renderMealHistory(uid) {
    const body = $('#profileTabBody');
    if (!body) return;
    body.innerHTML = '<div class="spinner"></div>';
    const isMe = uid === state.session.user.id;

    let qRef = sb.from('posts')
        .select('id, meal_slot, meal_score, meal_analysis, image_url, created_at, in_feed, meta')
        .eq('user_id', uid).eq('kind', 'meal');
    if (!isMe) qRef = qRef.eq('in_feed', true).not('image_url', 'is', null); // dos outros: só o que foi publicado com foto
    const { data, error } = await qRef.order('created_at', { ascending: false }).limit(60);

    if (!$('#profileTabBody')) return;
    if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
    if (!data || data.length === 0) {
        body.innerHTML = `<div class="grid-empty">${isMe ? 'Nenhuma refeição registrada ainda.' : 'Nenhuma refeição compartilhada.'}</div>`;
        return;
    }

    const notas = data.filter(m => m.meal_score != null).map(m => Number(m.meal_score));
    const media = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : null;

    const rows = data.map(m => {
        const dia = new Date(m.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
        const sc = m.meal_score != null ? Number(m.meal_score) : null;
        const cor = sc == null ? 'var(--ink-faint)' : sc >= 8 ? 'var(--vital)' : sc >= 5 ? 'var(--gold)' : 'var(--effort)';
        const thumb = m.image_url
            ? `<img class="ml-thumb" src="${m.image_url}" loading="lazy">`
            : `<span class="ml-thumb ml-thumb-empty">🍽️</span>`;
        const act = m.image_url ? ` data-act="view-post" data-id="${m.id}"` : '';
        if (isMe) { state.wkDados = state.wkDados || {}; state.wkDados[m.id] = { ...m, kind: 'meal' }; }
        return `<div class="wk-row${m.image_url ? ' tappable' : ''}"${act}>
            ${thumb}
            <div class="wk-body">
                <div class="wk-title">${MEAL_SLOT_NAME[m.meal_slot] || 'Refeição'}${isMe && m.in_feed ? ' <svg class="wk-feed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="Publicado no feed"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M3.5 9h17"/></svg>' : ''}</div>
                ${m.meal_analysis ? `<div class="wk-sub">${escapeHTML(m.meal_analysis.slice(0, 80))}</div>` : ''}
            </div>
            <div class="ml-side">
                ${sc != null ? `<span class="ml-score" style="color:${cor}">${br(sc)}</span>` : ''}
                ${sc == null && isMe && m.image_url && m.meta && m.meta.analise_pendente && Date.now() - new Date(m.created_at) < 7 * 86400000 ? `<button class="btn-mini ml-analisar" data-act="analisar-prato" data-id="${m.id}">Analisar agora</button>` : ''}
                <span class="wk-date">${dia}</span>
            </div>
            ${isMe ? `<button class="wk-mais" data-act="wk-menu" data-id="${m.id}" data-tipo="refeicao" aria-label="Opções"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>` : ''}
        </div>`;
    }).join('');

    body.innerHTML = `<div class="wk-summary"><b>${data.length}</b> refeições${media ? ` · nota média <b>${media}</b>` : ''}</div>
        <div class="wk-list">${rows}</div>`;
}

// ---- Seus treinos e refeições no perfil: detalhes, editar (só hoje) e apagar ----
const ehDeHoje = iso => isoDe(new Date(iso)) === hojeISO();
function menuRegistro(btn) {
    hidePostMenu();
    const r = (state.wkDados || {})[btn.dataset.id];
    if (!r) return;
    const treino = btn.dataset.tipo === 'treino';
    const ops = [];
    if (ehDeHoje(r.created_at)) ops.push(`<button class="post-menu-item" data-act="reg-editar" data-id="${r.id}" data-tipo="${btn.dataset.tipo}">${icon('editar')}Editar</button>`);
    ops.push(`<button class="post-menu-item danger" data-act="reg-apagar" data-id="${r.id}" data-tipo="${btn.dataset.tipo}">${icon('lixo')}Apagar ${treino ? 'treino' : 'refeição'}</button>`);
    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.className = 'post-menu';
    menu.innerHTML = ops.join('');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = Math.min(window.innerHeight - 70 - ops.length * 46, rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.zIndex = 160;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}
async function apagarRegistro(id, tipo) {
    const treino = tipo === 'treino';
    if (!(await confirmar(`Apagar ${treino ? 'este treino' : 'esta refeição'}? Os pontos ${treino ? 'dele' : 'dela'} saem junto.`))) return;
    const r = (state.wkDados || {})[id] || {};
    const { error } = await sb.from('posts').delete().eq('id', id).eq('user_id', state.session.user.id);
    if (error) { toast(msgErro(error), 'err'); return; }
    if (r.image_url) removeStoredImage(r.image_url);
    const det = document.getElementById('regDetalhe'); if (det) det.remove();
    toast(treino ? 'Treino apagado' : 'Refeição apagada', 'ok');
    loadScore();
    const aba = document.querySelector('.ig-tab.on');
    if (aba) aba.click();
}
function abrirDetalheTreino(id) {
    const w = (state.wkDados || {})[id];
    if (!w) return;
    const old = document.getElementById('regDetalhe'); if (old) old.remove();
    const d = new Date(w.created_at);
    const quando = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const ritmo = w.distance_km && w.duration_min ? (() => { const sp = (w.duration_min * 60) / w.distance_km; return `${Math.floor(sp / 60)}'${String(Math.round(sp % 60)).padStart(2, '0')}"/km`; })() : '';
    const com = (w.meta && Array.isArray(w.meta.com) && w.meta.com.length) ? w.meta.com.map(u => '@' + escapeHTML(u.username || '')).join(', ') : '';
    const linha = (rot, val) => val ? `<div class="rd-linha"><span>${rot}</span><b>${val}</b></div>` : '';
    const sheet = document.createElement('div');
    sheet.id = 'regDetalhe';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <div class="rd-topo"><span class="rd-emo">${WORKOUT_EMOJI[w.activity_type] || '💪'}</span>
            <div><h3 class="sheet-title" style="margin:0">${escapeHTML(w.activity_type || 'Treino')}</h3><small>${quando.charAt(0).toUpperCase() + quando.slice(1)}</small></div></div>
        ${w.image_url ? `<img class="rd-foto" src="${w.image_url}" alt="">` : ''}
        <div class="rd-dados">
            ${linha('Duração', (w.duration_min || 0) + ' min')}
            ${linha('Distância', w.distance_km ? br(w.distance_km) + ' km' : '')}
            ${linha('Ritmo', ritmo)}
            ${linha('O que treinou', (w.muscle_groups || []).join(', '))}
            ${linha('Treinou com', com)}
            ${linha('No feed', w.in_feed ? 'Publicado' : 'Só no seu histórico')}
        </div>
        <div class="sheet-footer">
            <button class="btn-ghost btn-perigo-txt" data-act="reg-apagar" data-id="${w.id}" data-tipo="treino">Apagar</button>
            ${ehDeHoje(w.created_at) ? `<button class="btn-secondary" data-act="reg-editar" data-id="${w.id}" data-tipo="treino">Editar</button>` : ''}
            ${w.in_feed ? `<button class="btn-primary" data-act="view-post" data-id="${w.id}">Ver no feed</button>` : ''}
        </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-act="view-post"]')) sheet.remove(); });
}
function abrirEditarRegistro(id, tipo) {
    const r = (state.wkDados || {})[id];
    if (!r) return;
    const det = document.getElementById('regDetalhe'); if (det) det.remove();
    const old = document.getElementById('regEditar'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'regEditar';
    sheet.className = 'sheet on';
    if (tipo === 'treino') {
        let ativ = r.activity_type || 'Musculação', dur = r.duration_min || 45, km = r.distance_km ? Number(r.distance_km) : null;
        const pintar = () => {
            const comKm = ATIVIDADES_COM_KM.includes(ativ);
            const passoKm = (KM_PADRAO[ativ] || [3, 0.5])[1];
            sheet.innerHTML = `<div class="sheet-card">
                <div class="sheet-handle"></div>
                <h3 class="sheet-title">Editar treino</h3>
                <div class="tr-chips re-chips">${[...$('#wType').options].map(o => o.value).map(t => `<button type="button" class="tr-chip${t === ativ ? ' on' : ''}" data-ativ="${t}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONES_ATIVIDADE[t] || ICONES_ATIVIDADE.Outro}</svg>${NOME_CURTO_ATIV[t] || t}</button>`).join('')}</div>
                <div class="tr-dur-linha re-linha"><button type="button" class="tr-dur-btn" data-d="-5">−</button><div class="tr-dur-num"><span>${dur}</span><small>min</small></div><button type="button" class="tr-dur-btn" data-d="5">+</button></div>
                ${comKm ? `<div class="tr-dur-linha re-linha"><button type="button" class="tr-dur-btn" data-k="-1">−</button><div class="tr-km-num"><span>${km ? br(km, km % 1 ? (passoKm < 0.5 ? 2 : 1) : 0) : '–'}</span><small>km</small></div><button type="button" class="tr-dur-btn" data-k="1">+</button></div>` : ''}
                <div class="sheet-footer"><button class="btn-ghost" data-r="cancelar">Cancelar</button><button class="btn-primary" data-r="salvar">Salvar</button></div>
            </div>`;
            const chips = sheet.querySelector('.re-chips'); const ativo = chips.querySelector('.on'); if (ativo) ativo.scrollIntoView({ inline: 'center', block: 'nearest' });
        };
        pintar();
        sheet.addEventListener('click', async e => {
            if (e.target === sheet) { sheet.remove(); return; }
            const c = e.target.closest('[data-ativ]'); if (c) { ativ = c.dataset.ativ; if (!ATIVIDADES_COM_KM.includes(ativ)) km = null; pintar(); return; }
            const bd = e.target.closest('[data-d]'); if (bd) { dur = Math.max(5, Math.min(300, dur + Number(bd.dataset.d))); pintar(); return; }
            const bk = e.target.closest('[data-k]'); if (bk) { const p = (KM_PADRAO[ativ] || [3, 0.5]); km = km ? Math.max(p[1], Math.round((km + Number(bk.dataset.k) * p[1]) * 100) / 100) : p[0]; pintar(); return; }
            const b = e.target.closest('[data-r]'); if (!b) return;
            if (b.dataset.r === 'cancelar') { sheet.remove(); return; }
            btnCarregando(b, true);
            const { data: pts, error } = await sb.rpc('editar_treino', { pid: id, atividade: ativ, duracao: dur, distancia: km });
            if (error) { btnCarregando(b, false); toast(String(error.message || '').includes('treino_repetido') ? 'Já existe um treino igual hoje.' : msgErro(error), 'err'); return; }
            sheet.remove();
            toast(`Treino atualizado${pts != null ? ` · ${br(pts, 0)} pts` : ''}`, 'ok');
            loadScore();
            const aba = document.querySelector('.ig-tab.on'); if (aba) aba.click();
        });
    } else {
        let slot = r.meal_slot || 'lanche';
        const pintar = () => {
            sheet.innerHTML = `<div class="sheet-card">
                <div class="sheet-handle"></div>
                <h3 class="sheet-title">Editar refeição</h3>
                <div class="ref-slots re-slots">${[['cafe', 'Café da manhã'], ['almoco', 'Almoço'], ['jantar', 'Jantar'], ['lanche', 'Lanche']].map(([k, n]) => `<button type="button" class="${k === slot ? 'on' : ''}" data-slot="${k}">${n}</button>`).join('')}</div>
                <div class="sheet-footer"><button class="btn-ghost" data-r="cancelar">Cancelar</button><button class="btn-primary" data-r="salvar">Salvar</button></div>
            </div>`;
        };
        pintar();
        sheet.addEventListener('click', async e => {
            if (e.target === sheet) { sheet.remove(); return; }
            const c = e.target.closest('[data-slot]'); if (c) { slot = c.dataset.slot; pintar(); return; }
            const b = e.target.closest('[data-r]'); if (!b) return;
            if (b.dataset.r === 'cancelar') { sheet.remove(); return; }
            btnCarregando(b, true);
            const { error } = await sb.rpc('editar_refeicao', { pid: id, slot });
            if (error) { btnCarregando(b, false); toast(msgErro(error), 'err'); return; }
            sheet.remove();
            toast('Refeição atualizada', 'ok');
            loadScore();
            const aba = document.querySelector('.ig-tab.on'); if (aba) aba.click();
        });
    }
    document.body.appendChild(sheet);
}

// ---- Histórico de treinos no perfil (visível pra quem visita) ----
const WORKOUT_EMOJI = {
    'Musculação':'🏋️', 'Corrida':'🏃', 'Caminhada':'🚶', 'Natação':'🏊', 'Ciclismo':'🚴',
    'Yoga':'🧘', 'Pilates':'🧘', 'Dança':'💃', 'HIIT':'⚡', 'Alongamento':'🤸', 'Futebol':'⚽', 'Outro':'💪'
};

async function renderWorkoutHistory(uid) {
    const body = $('#profileTabBody');
    if (!body) return;
    body.innerHTML = '<div class="spinner"></div>';

    const iniMes = new Date(); iniMes.setDate(1); iniMes.setHours(0, 0, 0, 0);
    const { data: ofensiva } = await sb.from('daily_streaks').select('current_streak, longest_streak').eq('user_id', uid).maybeSingle();
    const ehMeuPerfil = uid === state.session.user.id;
    let qTr = sb.from('posts')
        .select('id, activity_type, duration_min, distance_km, caption, created_at, image_url, in_feed, muscle_groups, meta, user_id')
        .eq('user_id', uid).eq('kind', 'workout');
    if (!ehMeuPerfil) qTr = qTr.eq('in_feed', true).not('image_url', 'is', null); // dos outros: só o que foi publicado com foto
    const { data, error } = await qTr.order('created_at', { ascending: false }).limit(60);

    if (!$('#profileTabBody')) return;
    if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
    if (!data || data.length === 0) { body.innerHTML = `<div class="grid-empty">${ehMeuPerfil ? 'Nenhum treino registrado ainda.' : 'Nenhum treino publicado ainda.'}</div>`; return; }

    const totalMin = data.reduce((s, w) => s + (w.duration_min || 0), 0);
    const horas = Math.floor(totalMin / 60), mins = totalMin % 60;

    state.wkDados = state.wkDados || {};
    data.forEach(w => { state.wkDados[w.id] = w; });
    const rows = data.map(w => {
        const d = new Date(w.created_at);
        const dia = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
        const tipo = w.activity_type || 'Treino';
        // no seu perfil, tocar abre os detalhes; no dos outros, abre o post
        const act = ehMeuPerfil ? ` data-act="wk-detalhe" data-id="${w.id}"` : (w.in_feed ? ` data-act="view-post" data-id="${w.id}"` : '');
        const km = w.distance_km ? ` · ${br(w.distance_km)} km` : '';
        return `<div class="wk-row tappable"${act}>
            <span class="wk-emo">${WORKOUT_EMOJI[tipo] || '💪'}</span>
            <div class="wk-body">
                <div class="wk-title">${escapeHTML(tipo)} <b>${w.duration_min || 0} min</b><span class="wk-km">${km}</span>${ehMeuPerfil && w.in_feed ? ' <svg class="wk-feed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="Publicado no feed"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M3.5 9h17"/></svg>' : ''}</div>
                ${w.caption ? `<div class="wk-sub">${escapeHTML(w.caption.slice(0, 70))}</div>` : ''}
            </div>
            <span class="wk-date">${dia}</span>
            ${ehMeuPerfil ? `<button class="wk-mais" data-act="wk-menu" data-id="${w.id}" data-tipo="treino" aria-label="Opções"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>` : ''}
        </div>`;
    }).join('');

    const noMes = data.filter(w => new Date(w.created_at) >= iniMes).length;
    const kmTotal = data.reduce((t, w) => t + Number(w.distance_km || 0), 0);
    const partes = [
        `<b>${noMes}</b> ${noMes === 1 ? 'treino' : 'treinos'} no mês`,
        `<b>${horas}h${mins ? String(mins).padStart(2,'0') : ''}</b> de atividade`,
    ];
    if (kmTotal) partes.push(`<b>${String(Math.round(kmTotal * 10) / 10).replace('.', ',')}</b> km`);
    if (ofensiva && ofensiva.current_streak) partes.push(`🔥 <b>${ofensiva.current_streak}</b> ${ofensiva.current_streak === 1 ? 'dia' : 'dias'} de ofensiva`);
    if (ofensiva && ofensiva.longest_streak > (ofensiva.current_streak || 0)) partes.push(`recorde <b>${ofensiva.longest_streak}</b>`);
    body.innerHTML = `<div class="wk-summary">${partes.join(' · ')}</div>
        <div class="wk-list">${rows}</div>`;
}

// ============================================================
// AJUDANTES: thumb do grid, listas de seguidores, ver post, menu do chat
// ============================================================
function gridThumb(p) {
    if (p.image_url) {
        return `<div class="grid-item${p.pinned_at ? ' fixado' : ''}" data-act="view-post" data-id="${p.id}"><img src="${p.thumb_url || p.image_url}" loading="lazy" decoding="async"></div>`;
    }
    let emo = '📝', line = '';
    if (p.kind === 'workout') {
        emo = '💪';
        line = `${escapeHTML(p.activity_type || 'Treino')}<br><b>${p.duration_min || 0} min</b>`;
    } else if (p.kind === 'meal') {
        emo = '🍽️';
        line = { cafe:'Café da manhã', almoco:'Almoço', jantar:'Jantar', lanche:'Lanche' }[p.meal_slot] || 'Refeição';
    } else {
        line = escapeHTML((p.caption || '').slice(0, 50));
    }
    return `<div class="grid-item${p.pinned_at ? ' fixado' : ''}" data-act="view-post" data-id="${p.id}"><div class="grid-text-thumb"><span class="gt-emo">${emo}</span><span class="gt-line">${line}</span></div></div>`;
}

function closeDynamicSheets() {
    ['followListSheet', 'postViewSheet'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    hidePostMenu();
    const pm = document.getElementById('floatingPrivacyMenu');
    if (pm) pm.remove();
    document.body.style.overflow = '';
}

async function openFollowList(uid, type) {
    const old = document.getElementById('followListSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'followListSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${type === 'followers' ? 'Seguidores' : 'Seguindo'}</h3>
        <div id="followListBody" class="follow-list"><div class="spinner"></div></div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    sheet.onclick = e => { if (e.target === sheet) { sheet.remove(); document.body.style.overflow = ''; } };

    const { data, error } = await sb.rpc(type === 'followers' ? 'list_followers' : 'list_following', { target: uid });
    const body = document.getElementById('followListBody');
    if (!body) return;
    if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
    if (!data || data.length === 0) {
        body.innerHTML = `<div class="log-empty">${type === 'followers' ? 'Ninguém segue ainda.' : 'Não segue ninguém ainda.'}</div>`;
        return;
    }
    body.innerHTML = data.map(u => `<div class="follow-row" data-act="view-user" data-uid="${u.id}">
        ${avatarHTML(u, 'sm')}
        <div><div class="follow-name">${escapeHTML(u.display_name)}</div><div class="follow-uname">@${escapeHTML(u.username)}</div></div>
    </div>`).join('');
}

async function openPostSheet(id) {
    const old = document.getElementById('postViewSheet');
    if (old) old.remove();
    const { data: p, error } = await sb.from('posts')
        .select(`id, kind, caption, image_url, activity_type, duration_min, distance_km, muscle_groups, meal_slot, weight_kg, created_at, user_id, visibility, meal_score, meta, comments_off, pinned_at, meal_analysis, achievement_code,
            user:profiles!user_id!inner (id, username, display_name, avatar_url),
            reactions (id, user_id),
            comments (id)`)
        .eq('id', id).maybeSingle();
    if (error || !p) { toast('Não consegui abrir esse post', 'err'); return; }

    const sheet = document.createElement('div');
    sheet.id = 'postViewSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card post-view-card">
        <div class="sheet-handle"></div>
        <button class="post-view-back" id="pvBack" aria-label="Voltar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        ${renderPost(p)}
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';

    const fechar = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) fechar(); };
    document.getElementById('pvBack').onclick = fechar;

    // Arrastar pra baixo ou pro lado fecha, igual ao gesto do celular
    const card = sheet.querySelector('.sheet-card');
    let x0 = 0, y0 = 0, arrastando = false;
    card.addEventListener('touchstart', ev => {
        if (card.scrollTop > 4) return;
        arrastando = true;
        x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY;
    }, { passive: true });
    card.addEventListener('touchmove', ev => {
        if (!arrastando) return;
        const dx = ev.touches[0].clientX - x0;
        const dy = ev.touches[0].clientY - y0;
        if (dy > 8 || Math.abs(dx) > 8) {
            card.style.transform = `translate(${dx * 0.5}px, ${Math.max(0, dy) * 0.6}px)`;
            card.style.opacity = String(Math.max(0.35, 1 - (Math.abs(dx) + Math.max(0, dy)) / 420));
        }
    }, { passive: true });
    card.addEventListener('touchend', ev => {
        if (!arrastando) return;
        arrastando = false;
        const dx = ev.changedTouches[0].clientX - x0;
        const dy = ev.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 90 || dy > 110) { fechar(); return; }
        card.style.transition = 'transform .18s ease, opacity .18s ease';
        card.style.transform = ''; card.style.opacity = '';
        setTimeout(() => { card.style.transition = ''; }, 200);
    }, { passive: true });
}

function showChatMenu(anchor) {
    const existing = document.getElementById('floatingPostMenu');
    if (existing && existing.dataset.menuType === 'chat') { existing.remove(); return; }
    hidePostMenu();
    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.dataset.menuType = 'chat';
    menu.className = 'post-menu';
    menu.innerHTML = `
        <button class="post-menu-item danger" data-act="clear-chat" data-id="${anchor.dataset.id}">${icon('lixo')}Apagar conversa</button>
    `;
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}

// Pílula no topo: progresso da semana e ofensiva num relance
async function refreshWeeklyPill() {
    const uid = state.session && state.session.user && state.session.user.id;
    if (!uid) return;
    const [{ data: days }, { data: st }] = await Promise.all([
        sb.rpc('count_days_current_week', { uid }),
        sb.from('daily_streaks').select('current_streak').eq('user_id', uid).maybeSingle(),
    ]);
    const goal = (state.profile && state.profile.weekly_goal) || 3;
    const d = Number(days || 0);
    const C = 56.55;
    const fill = document.getElementById('wpFill');
    if (fill) {
        fill.setAttribute('stroke-dasharray', `${(Math.min(1, d / goal) * C).toFixed(2)} ${C}`);
        fill.classList.toggle('done', d >= goal);
    }
    const dEl = document.getElementById('wpDays');
    if (dEl) dEl.textContent = `${d}/${goal}`;
    const sEl = document.getElementById('wpStreak');
    if (sEl) sEl.textContent = (st && st.current_streak) || 0;

    // Posição no ranking da semana
    const { data: rk } = await sb.rpc('my_weekly_rank');
    const r = rk && rk[0];
    const rankEl = document.getElementById('topRank');
    if (rankEl) {
        const fx = r && faixaRanking(r.rank, r.total);
        if (fx) {
            document.getElementById('topRankN').textContent = fx.curto;
            rankEl.classList.remove('hidden');
        } else {
            rankEl.classList.add('hidden');
        }
    }
}

// ============================================================
// MENSAGENS (DM)
// ============================================================
async function renderMessages() {
    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view">
            <div class="page-head"><h1 class="screen-title">Chat</h1><span class="page-sub">coach e comunidade</span></div>
            <div id="convList"><div class="spinner"></div></div>
        </div>
    `;

    const { data: convs, error } = await sb.rpc('list_conversations');
    const list = $('#convList');

    // Coach sempre fixo no topo
    const coachNovo = lsGet('pulso-coach-novo-' + state.session.user.id) === '1';
    let html = `<div class="conv-item conv-coach${coachNovo ? ' nao-lida' : ''}" data-act="go-coach">
        <span class="conv-coach-avatar">🤖</span>
        <div class="conv-info">
            <div class="conv-name">Coach Pulso <span class="conv-tag">IA</span></div>
            <div class="conv-preview">${coachNovo ? 'Mandou uma mensagem pra você' : 'Pergunte sobre treino, alimentação e constância'}</div>
        </div>
        ${coachNovo ? '<span class="conv-bolinha"></span>' : '<div class="conv-chevron">›</div>'}
    </div>`;

    if (error) {
        html += `<p style="color:var(--danger); padding:12px 4px">Erro ao carregar conversas: ${error.message}</p>`;
    } else if (!convs || convs.length === 0) {
        html += `<div class="conv-section-label">Pessoas</div>
            <div class="feed-empty" style="margin-top:0">
                <span class="emo">💬</span>
                <h3>Nenhuma conversa ainda</h3>
                <p>Vai no perfil de alguém e toca no ícone de mensagem (o aviãozinho) pra começar a falar.</p>
            </div>`;
    } else {
        html += `<div class="conv-section-label">Pessoas</div>`;
        html += convs.map(cv => {
            const other = { id: cv.other_id, display_name: cv.other_name, username: cv.other_username, avatar_url: cv.other_avatar };
            return `<div class="conv-item" data-act="open-chat-item" data-conv-id="${cv.conversation_id}" data-uid="${cv.other_id}" data-name="${escapeHTML(cv.other_name)}" data-username="${escapeHTML(cv.other_username)}" data-avatar="${cv.other_avatar||''}">
                ${avatarHTML(other, 'md')}
                <div class="conv-info">
                    <div class="conv-name">${escapeHTML(cv.other_name)}${cv.unread_count>0?` <span class="conv-unread">${cv.unread_count}</span>`:''}</div>
                    <div class="conv-preview">${escapeHTML(previaMensagem(cv.last_message || 'Diga oi 👋').slice(0,50))}</div>
                </div>
                <div class="conv-time">${cv.last_message_at ? timeAgo(cv.last_message_at) : ''}</div>
            </div>`;
        }).join('');
    }

    list.innerHTML = html;
    updateUnreadBadge();
}

async function updateUnreadBadge() {
    const { data } = await sb.rpc('unread_conversations');
    const n = Number(data || 0);
    const dot = $('#navUnreadDot');
    if (!dot) return;
    dot.textContent = n > 9 ? '9+' : String(n);
    dot.classList.toggle('hidden', n === 0);
}

let chatChannel = null;

function stopChatSync() {
    if (chatChannel) { sb.removeChannel(chatChannel); chatChannel = null; }
    if (state.chatPoll) { clearInterval(state.chatPoll); state.chatPoll = null; }
}

async function loadChatMessages(conversationId) {
    const { data, error } = await sb.rpc('get_conversation_messages', { conv_id: conversationId });
    if (error) throw error;
    return data || [];
}

async function renderChat(conversationId, otherUser) {
    stopChatSync();
    state.chatConversationId = conversationId;

    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view coach-view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-messages">←</button>
                <div class="chat-header-user" data-act="view-user" data-uid="${otherUser.id}">
                    ${avatarHTML(otherUser, 'sm')}
                    <span class="chat-header-name">${escapeHTML(otherUser.display_name)}</span>
                </div>
                <button class="chat-menu-btn" data-act="chat-menu" data-id="${conversationId}" data-uid="${otherUser.id}" aria-label="Opções">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
                </button>
            </div>
            <div id="chatMessages" class="coach-chat"><div class="spinner"></div></div>
            <div class="chat-resp-barra hidden" id="chatRespBarra">
                <div><small>Respondendo</small><span id="chatRespTxt"></span></div>
                <button type="button" id="chatRespX" aria-label="Cancelar resposta">×</button>
            </div>
            <div class="coach-composer">
                <textarea id="chatInput" placeholder="Escreva uma mensagem..." maxlength="2000" rows="1"></textarea>
                <button class="mic-btn" id="chatMic" aria-label="Ditar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
                </button>
                <button class="coach-send" id="chatSend" aria-label="Enviar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
            </div>
        </div>
    `;

    state.chatRespondendo = null;
    try {
        state.chatMessages = await loadChatMessages(conversationId);
        await carregarExtrasDoChat(conversationId);
    } catch (error) {
        $('#chatMessages').innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`;
        return;
    }
    paintChatMessages();
    await sb.rpc('mark_conversation_read', { conv_id: conversationId });
    updateUnreadBadge();

    const input = $('#chatInput');
    let ultimoAviso = 0;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(120, input.scrollHeight) + 'px';
        const agora = Date.now();
        if (chatChannel && agora - ultimoAviso > 2000) {
            ultimoAviso = agora;
            chatChannel.send({ type: 'broadcast', event: 'typing', payload: { uid: me } });
        }
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(conversationId); }
    });
    $('#chatSend').addEventListener('click', () => sendChatMessage(conversationId));
    $('#chatRespX').addEventListener('click', () => { state.chatRespondendo = null; $('#chatRespBarra').classList.add('hidden'); });
    ligarGestosDoChat(conversationId);
    const atualizarEnviar = () => $('#chatSend').classList.toggle('pronto', !!input.value.trim());
    input.addEventListener('input', atualizarEnviar); atualizarEnviar();
    $('#chatMic').addEventListener('click', () => ditar('chatInput'));

    // Tempo real (mensagens novas e apagadas)
    const me = state.session.user.id;
    chatChannel = sb.channel(`chat-${conversationId}`)
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (!payload || payload.uid === me) return;
            mostrarDigitando();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
            const msg = payload.new;
            if (state.chatMessages.some(m => m.id === msg.id)) return;
            state.chatMessages.push(msg);
            paintChatMessages();
            if (msg.sender_id !== me) sb.rpc('mark_conversation_read', { conv_id: conversationId });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
            const gone = payload.old && payload.old.id;
            if (!gone) return;
            state.chatMessages = state.chatMessages.filter(m => m.id !== gone);
            paintChatMessages();
        })
        .subscribe();

    // Plano B: se o tempo real falhar por qualquer motivo, sincroniza a cada 4s
    const sig = arr => arr.map(m => m.id).join(',');
    state.chatPoll = setInterval(async () => {
        if (state.view !== 'chat' || state.chatConversationId !== conversationId) { stopChatSync(); return; }
        try {
            const fresh = await loadChatMessages(conversationId);
            const antesReac = JSON.stringify(state.chatReacoes || {});
            await carregarExtrasDoChat(conversationId);
            if (sig(fresh) === sig(state.chatMessages)) { if (antesReac !== JSON.stringify(state.chatReacoes || {})) paintChatMessages(); return; }
            const newFromOther = fresh.some(m => m.sender_id !== me && !state.chatMessages.some(x => x.id === m.id));
            state.chatMessages = fresh;
            paintChatMessages();
            if (newFromOther) sb.rpc('mark_conversation_read', { conv_id: conversationId });
        } catch (_) {}
    }, 4000);
}

function mostrarDigitando() {
    const box = $('#chatMessages');
    if (!box) return;
    let el = document.getElementById('typingBubble');
    if (!el) {
        el = document.createElement('div');
        el.id = 'typingBubble';
        el.className = 'cmsg coach';
        el.innerHTML = '<div class="cmsg-bubble typing"><span></span><span></span><span></span></div>';
        box.appendChild(el);
        box.scrollTop = box.scrollHeight;
    }
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => {
        const t = document.getElementById('typingBubble');
        if (t) t.remove();
    }, 3500);
}

function paintChatMessages() {
    const box = $('#chatMessages');
    if (!box) return;
    const digitando = document.getElementById('typingBubble');
    const ocultas = state.chatOcultas || new Set();
    const lista = state.chatMessages.filter(m => !ocultas.has(m.id) && !(state.chatSumindo && state.chatSumindo.has(m.id)));
    if (lista.length === 0) {
        box.innerHTML = `<div class="coach-empty"><span class="ce-emo">👋</span><p>Comece a conversa!</p></div>`;
    } else {
        const eu = state.session.user.id;
        const reac = state.chatReacoes || {};
        let diaAnterior = '';
        box.innerHTML = lista.map(m => {
            const mine = m.sender_id === eu;
            // separador de dia
            let sep = '';
            if (m.created_at) {
                const d = new Date(m.created_at);
                const dia = isoDe(d);
                if (dia !== diaAnterior) {
                    diaAnterior = dia;
                    const rot = dia === hojeISO() ? 'Hoje' : dia === isoDe(new Date(Date.now() - 86400000)) ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    sep = `<div class="chat-dia"><span>${rot}</span></div>`;
                }
            }
            let corpo = m.body, topo = '';
            const st = lerStoryDaMensagem(corpo);
            if (st) {
                const mini = st.ref.img ? `<img src="${st.ref.img}" alt="" onerror="this.parentElement.classList.add('sem')">` : `<span class="cmsg-st-txt" style="background:${st.ref.bg || '#1C2420'}">${escapeHTML(st.ref.txt || '')}</span>`;
                topo = `<div class="cmsg-story"><span class="cmsg-st-mini">${mini}<em>Story indisponível</em></span><span class="cmsg-st-lbl">${mine ? 'Você respondeu ao story' : 'Respondeu ao seu story'}</span></div>`;
                corpo = st.texto;
            }
            const rp = lerRespostaDaMensagem(corpo);
            if (rp) {
                topo += `<button class="cmsg-cita" data-ir-msg="${rp.ref.id}"><span>${escapeHTML(rp.ref.txt || '')}</span></button>`;
                corpo = rp.texto;
            }
            const r = reac[m.id] || [];
            const reacHTML = r.length ? `<span class="cmsg-reac">${[...new Set(r.map(x => x.emoji))].join('')}${r.length > 1 ? `<small>${r.length}</small>` : ''}</span>` : '';
            return `${sep}<div class="cmsg ${mine ? 'user' : 'coach'}${r.length ? ' com-reac' : ''}" data-mid="${m.id}">
                ${topo}
                <div class="cmsg-bubble" data-msg="${m.id}">${escapeHTML(corpo).replace(/\n/g, '<br>')}${reacHTML}</div>
            </div>`;
        }).join('');
        if (digitando) box.appendChild(digitando);
    }
    box.scrollTop = box.scrollHeight;
}

// ---- Reações, respostas, excluir pra você e cancelar envio ----
const MARCA_RESP = '⟦resp⟧';
const REACOES_CHAT = ['❤️', '😂', '😮', '👏', '🔥', '👍'];
function lerRespostaDaMensagem(body) {
    const b = String(body || '');
    if (!b.startsWith(MARCA_RESP)) return null;
    const fim = b.indexOf('\n');
    try { return { ref: JSON.parse(b.slice(MARCA_RESP.length, fim)), texto: b.slice(fim + 1) }; } catch (_) { return null; }
}
const textoLimpo = body => { const st = lerStoryDaMensagem(body); const b = st ? st.texto : body; const rp = lerRespostaDaMensagem(b); return rp ? rp.texto : b; };

async function carregarExtrasDoChat(conv) {
    const [{ data: rs }, { data: oc }] = await Promise.all([
        sb.rpc('reacoes_da_conversa', { conv }),
        sb.rpc('ocultas_da_conversa', { conv }),
    ]);
    const mapa = {};
    (rs || []).forEach(x => { (mapa[x.message_id] = mapa[x.message_id] || []).push(x); });
    state.chatReacoes = mapa;
    state.chatOcultas = new Set((oc || []).map(x => x.message_id));
}

function ligarGestosDoChat(conv) {
    const box = $('#chatMessages');
    let timer = null, alvo = null, ultimoToque = 0, ultimoAlvo = null, moveu = false, x0 = 0, y0 = 0;
    box.addEventListener('pointerdown', e => {
        const b = e.target.closest('.cmsg-bubble[data-msg]');
        if (!b) return;
        alvo = b; moveu = false; x0 = e.clientX; y0 = e.clientY;
        timer = setTimeout(() => { if (!moveu) { abrirMenuMensagem(b.dataset.msg, conv); if (navigator.vibrate) navigator.vibrate(12); } }, 450);
    });
    box.addEventListener('pointermove', e => { if (alvo && (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8)) { moveu = true; clearTimeout(timer); } });
    const soltar = () => { clearTimeout(timer); alvo = null; };
    box.addEventListener('pointerup', soltar); box.addEventListener('pointercancel', soltar); box.addEventListener('pointerleave', soltar);
    box.addEventListener('contextmenu', e => { if (e.target.closest('.cmsg-bubble')) e.preventDefault(); });
    box.addEventListener('click', e => {
        const cita = e.target.closest('[data-ir-msg]');
        if (cita) {
            const el = box.querySelector(`[data-msg="${cita.dataset.irMsg}"]`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('pisca'); setTimeout(() => el.classList.remove('pisca'), 1200); }
            return;
        }
        const b = e.target.closest('.cmsg-bubble[data-msg]');
        if (!b) return;
        const agora = Date.now();
        if (ultimoAlvo === b.dataset.msg && agora - ultimoToque < 320) { reagirMensagem(b.dataset.msg, '❤️', conv, true); ultimoToque = 0; return; }
        ultimoToque = agora; ultimoAlvo = b.dataset.msg;
    });
}

async function reagirMensagem(mid, emoji, conv, soColocar = false) {
    const eu = state.session.user.id;
    const lista = (state.chatReacoes[mid] || []);
    const minha = lista.find(x => x.user_id === eu);
    const tirar = minha && minha.emoji === emoji && !soColocar;
    // otimista
    state.chatReacoes[mid] = lista.filter(x => x.user_id !== eu).concat(tirar ? [] : [{ message_id: mid, user_id: eu, emoji }]);
    paintChatMessages();
    const { error } = await sb.rpc('reagir_mensagem', { mid, emoji: tirar ? null : emoji });
    if (error) { await carregarExtrasDoChat(conv); paintChatMessages(); toast('Não consegui reagir agora', 'err'); }
}

function abrirMenuMensagem(mid, conv) {
    const m = state.chatMessages.find(x => x.id === mid);
    const bolha = document.querySelector(`.cmsg-bubble[data-msg="${mid}"]`);
    if (!m || !bolha) return;
    const eu = state.session.user.id;
    const minha = m.sender_id === eu;
    const rect = bolha.getBoundingClientRect();
    const quando = m.created_at ? new Date(m.created_at).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '') : '';
    const minhaReac = ((state.chatReacoes[mid] || []).find(x => x.user_id === eu) || {}).emoji;
    const ic = {
        resp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/></svg>',
        copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
        excluir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
        cancelar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5L7 12l2.5 2.5"/><path d="M7 12h6.5a3 3 0 0 1 0 6H12"/></svg>',
    };
    const camada = document.createElement('div');
    camada.className = 'msg-camada';
    const largura = Math.min(260, window.innerWidth - 32);
    const cloneHTML = bolha.outerHTML.replace('data-msg=', 'data-clone=');
    camada.innerHTML = `
        <div class="msg-reacoes">${REACOES_CHAT.map(e => `<button data-emo="${e}" class="${e === minhaReac ? 'on' : ''}">${e}</button>`).join('')}</div>
        <div class="msg-clone cmsg ${minha ? 'user' : 'coach'}">${cloneHTML}</div>
        <div class="msg-menu" style="width:${largura}px">
            ${quando ? `<div class="msg-quando">${quando}</div>` : ''}
            <button data-op="responder">${ic.resp}<span>Responder</span></button>
            <button data-op="copiar">${ic.copiar}<span>Copiar</span></button>
            <button data-op="excluir">${ic.excluir}<span>Excluir pra você</span></button>
            ${minha ? `<button data-op="cancelar" class="perigo">${ic.cancelar}<span>Cancelar envio</span></button>` : ''}
        </div>`;
    document.body.appendChild(camada);
    // posiciona: reações em cima, mensagem no mesmo lugar, menu embaixo (ou em cima, se não couber)
    const reac = camada.querySelector('.msg-reacoes'), clone = camada.querySelector('.msg-clone'), menu = camada.querySelector('.msg-menu');
    const lado = minha ? 'right' : 'left';
    const margem = minha ? (window.innerWidth - rect.right) : rect.left;
    clone.style.top = rect.top + 'px'; clone.style[lado] = margem + 'px'; clone.style.width = rect.width + 'px';
    const hMenu = menu.offsetHeight, hReac = reac.offsetHeight;
    let topoClone = rect.top;
    const cabe = rect.bottom + 10 + hMenu < window.innerHeight - 20;
    if (!cabe) topoClone = Math.max(20 + hReac + 10, window.innerHeight - 20 - hMenu - 10 - rect.height);
    if (topoClone - hReac - 10 < 20) topoClone = 20 + hReac + 10;
    clone.style.top = topoClone + 'px';
    reac.style.top = (topoClone - hReac - 10) + 'px'; reac.style[lado] = Math.max(12, margem - 6) + 'px';
    menu.style.top = (topoClone + rect.height + 10) + 'px'; menu.style[lado] = Math.max(12, margem) + 'px';
    requestAnimationFrame(() => camada.classList.add('on'));

    const fechar = () => { camada.classList.remove('on'); setTimeout(() => camada.remove(), 160); };
    camada.addEventListener('click', e => { if (e.target === camada || e.target.closest('.msg-clone')) fechar(); });
    reac.querySelectorAll('[data-emo]').forEach(b => b.onclick = () => { fechar(); reagirMensagem(mid, b.dataset.emo, conv); });
    menu.querySelector('[data-op="responder"]').onclick = () => {
        fechar();
        const txt = textoLimpo(m.body).slice(0, 80);
        state.chatRespondendo = { id: mid, txt, de: m.sender_id };
        $('#chatRespTxt').textContent = txt;
        $('#chatRespBarra').classList.remove('hidden');
        $('#chatInput').focus();
    };
    menu.querySelector('[data-op="copiar"]').onclick = async () => {
        fechar();
        try { await navigator.clipboard.writeText(textoLimpo(m.body)); toast('Copiado', 'ok'); } catch (_) {}
    };
    menu.querySelector('[data-op="excluir"]').onclick = async () => {
        fechar();
        state.chatOcultas.add(mid); paintChatMessages();
        const { error } = await sb.rpc('ocultar_mensagem', { mid });
        if (error) { state.chatOcultas.delete(mid); paintChatMessages(); toast('Não consegui excluir agora', 'err'); }
    };
    const cancelar = menu.querySelector('[data-op="cancelar"]');
    if (cancelar) cancelar.onclick = () => {
        fechar();
        state.chatSumindo = state.chatSumindo || new Set();
        state.chatSumindo.add(mid); paintChatMessages();
        let desfeito = false;
        toastComAcao('Envio cancelado', 'Desfazer', () => { desfeito = true; state.chatSumindo.delete(mid); paintChatMessages(); });
        setTimeout(async () => {
            if (desfeito) return;
            const { error } = await sb.from('messages').delete().eq('id', mid);
            state.chatSumindo.delete(mid);
            if (error) { toast('Não consegui cancelar o envio', 'err'); paintChatMessages(); return; }
            state.chatMessages = state.chatMessages.filter(x => x.id !== mid);
            paintChatMessages();
        }, 5000);
    };
}

async function sendChatMessage(conversationId) {
    if (state.enviandoMsg) return;
    state.enviandoMsg = true;
    setTimeout(() => { state.enviandoMsg = false; }, 1200);
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = 'auto';

    let corpoMsg = text;
    if (state.chatRespondendo) {
        corpoMsg = MARCA_RESP + JSON.stringify({ id: state.chatRespondendo.id, txt: state.chatRespondendo.txt }) + '\n' + text;
        state.chatRespondendo = null;
        const barra = $('#chatRespBarra'); if (barra) barra.classList.add('hidden');
    }
    const sendBtn = $('#chatSend'); if (sendBtn) sendBtn.classList.remove('pronto');
    const { data, error } = await sb.from('messages').insert({
        conversation_id: conversationId,
        sender_id: state.session.user.id,
        body: corpoMsg,
    }).select().single();

    if (error) { toast('Erro ao enviar: ' + error.message, 'err'); return; }
    if (!state.chatMessages.some(m => m.id === data.id)) {
        state.chatMessages.push(data);
        paintChatMessages();
    }
}

// ============================================================
// COACH PULSO (IA)
// ============================================================
const COACH_PERSONA = `Você é o Coach Pulso, treinador virtual de um app brasileiro de vida saudável e atividade física.

COMO VOCÊ FALA:
- Português do Brasil, tom de amigo que entende do assunto. Nada de formalidade ou de discurso motivacional vazio.
- Frases curtas, direto ao ponto.
- SEMPRE cite os números reais da pessoa que estão no dossiê abaixo. É isso que te diferencia de um conselho genérico de internet.
- No máximo 3 itens quando listar algo.
- Máximo 110 palavras, a não ser que a pessoa peça detalhe.
- Não use emoji em excesso, no máximo um.
- Nunca use o travessão longo. Use vírgula, ponto, dois pontos ou parênteses.
- NÃO trate perda de peso como o objetivo padrão de todo mundo. Só fale de peso se a pessoa tiver meta de peso definida ou puxar o assunto.
- O objetivo pode ser ganhar massa, ter mais energia, dormir melhor, criar constância ou simplesmente se mexer mais. Na dúvida, fale de constância e de como a pessoa se sente.

LIMITES QUE VOCÊ NÃO ULTRAPASSA:
- Você não é médico nem nutricionista. Não diagnostica, não prescreve medicação, não manda mudar tratamento.
- Se aparecer sintoma preocupante, dor persistente ou condição séria, recomende procurar um profissional, com calma, sem alarmar.
- Nunca sugira restrição calórica agressiva, jejum prolongado, detox, ou cortar grupos alimentares inteiros.
- Nunca comente o corpo da pessoa de forma julgadora. Fale de hábito e constância, não de aparência.
- Se a pessoa demonstrar sofrimento com comida, com o peso ou com o corpo, acolha e sugira apoio profissional em vez de dar meta ou número.
- Se o dossiê tiver condição de saúde ou medicação, leve em conta ao sugerir esforço, mas não opine sobre o tratamento.`;

// Água de hoje, respeitando a meta que a pessoa definiu em Objetivos
async function aguaDeHoje() {
    const { data } = await sb.rpc('water_today');
    const w = Object.assign({ total_ml: 0, goal_ml: 2000, pct: 0 }, (data && data[0]) || {});
    const meta = Number(state.profile && state.profile.water_goal_ml);
    if (meta >= 500) {
        w.goal_ml = meta;
        w.pct = Math.min(100, Math.round(((w.total_ml || 0) / meta) * 100));
    }
    return w;
}

// ============================================================
// META COM PRAZO: projeção pelo ritmo real
// ============================================================
function projecaoMeta(pesos, semanas, p) {
    const out = { peso: null, treino: null };
    const DIA = 86400000;
    const pts = (pesos || []).filter(x => x && x.y > 0).sort((a, b) => a.x - b.x);
    const meta = Number(p.target_weight || 0);
    const prazo = p.goal_deadline ? new Date(p.goal_deadline + 'T12:00:00') : null;
    if (meta > 0 && pts.length) {
        const atual = pts[pts.length - 1].y;
        const recentes = pts.filter(x => x.x >= new Date(Date.now() - 35 * DIA));
        let ritmo = null; // kg por semana (negativo = perdendo)
        if (recentes.length >= 2) {
            const a = recentes[0], b = recentes[recentes.length - 1];
            const sem = (b.x - a.x) / (7 * DIA);
            if (sem >= 1) ritmo = (b.y - a.y) / sem;
        }
        const falta = meta - atual; // negativo = precisa perder
        const semanasPrazo = prazo ? Math.max(0, (prazo - Date.now()) / (7 * DIA)) : null;
        let semanasNoRitmo = null;
        if (ritmo && Math.abs(falta) > 0.2 && Math.sign(ritmo) === Math.sign(falta)) semanasNoRitmo = Math.abs(falta / ritmo);
        out.peso = {
            atual, meta, falta, ritmo, prazo, semanasPrazo, semanasNoRitmo,
            precisa: semanasPrazo && semanasPrazo > 0.5 ? falta / semanasPrazo : null,
            chegou: Math.abs(falta) <= 0.2,
        };
    }
    const metaTreino = p.weekly_goal || 3;
    const ult = (semanas || []).slice(-5, -1); // 4 semanas completas antes da atual
    if (ult.length) {
        const media = ult.reduce((t, r) => t + (r.days_trained || 0), 0) / ult.length;
        out.treino = { meta: metaTreino, media: Math.round(media * 10) / 10 };
    }
    return out;
}
const kgTxt = n => String(Math.abs(Math.round(n * 10) / 10)).replace('.', ',');
function metaCardHTML(proj) {
    const pe = proj.peso, tr = proj.treino;
    if (!pe && !tr) return '';
    let linhas = '';
    if (pe) {
        const titulo = `Meta: ${kgTxt(pe.meta)} kg${pe.prazo ? ' até ' + pe.prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}`;
        let sub;
        if (pe.chegou) sub = 'Você chegou na meta. Hora de definir a próxima em Objetivos.';
        else {
            const partes = [];
            partes.push(`Faltam ${kgTxt(pe.falta)} kg`);
            if (pe.semanasPrazo != null) partes.push(`${Math.ceil(pe.semanasPrazo)} semanas de prazo`);
            if (pe.semanasNoRitmo != null) partes.push(`no seu ritmo atual, chega em ${Math.ceil(pe.semanasNoRitmo)}`);
            else if (pe.ritmo != null) partes.push('no ritmo atual, o peso está indo pro lado contrário');
            else partes.push('registre o peso toda semana pra calcular seu ritmo');
            sub = partes.join(' · ');
        }
        const precisa = pe.precisa != null && !pe.chegou
            ? `<div class="meta-dica">Pra chegar no prazo: ~${kgTxt(pe.precisa)} kg por semana${pe.ritmo != null ? ` (hoje: ${kgTxt(pe.ritmo)} kg)` : ''}</div>` : '';
        const atrasado = pe.semanasPrazo != null && pe.semanasNoRitmo != null && pe.semanasNoRitmo > pe.semanasPrazo;
        linhas += `<div class="meta-linha${atrasado ? ' atrasado' : ''}"><b>${titulo}</b><span>${sub}</span>${precisa}</div>`;
    }
    if (tr) {
        const ok = tr.media >= tr.meta;
        linhas += `<div class="meta-linha${ok ? '' : ' atrasado'}"><b>Treinos: meta de ${tr.meta}x por semana</b><span>Nas últimas 4 semanas, você fez ${String(tr.media).replace('.', ',')} em média${ok ? '. Mandando bem.' : '.'}</span></div>`;
    }
    return `<div class="chart-card meta-card" data-act="m-go" data-view="objetivos">
        <div class="chart-head"><span class="chart-title">Sua meta</span><span class="chart-legend">ajustar ›</span></div>
        ${linhas}
    </div>`;
}
async function calcularProjecaoAtual() {
    const uid = state.session.user.id;
    const [{ data: w }, { data: a }] = await Promise.all([
        sb.rpc('weight_series', { uid, days_back: 60 }),
        sb.rpc('activity_series', { uid, weeks_back: 6 }),
    ]);
    const pesos = (w || []).map(r => ({ x: new Date(r.d + 'T12:00:00'), y: Number(r.kg) }));
    state.projecao = projecaoMeta(pesos, a || [], state.profile || {});
    return state.projecao;
}

function formatCoachContext(ctx) {
    if (!ctx) return 'Sem dados ainda.';
    const L = [];
    const add = (label, val, suffix = '') => {
        if (val === null || val === undefined || val === '' ) return;
        if (Array.isArray(val) && val.length === 0) return;
        L.push(`- ${label}: ${Array.isArray(val) ? val.join(', ') : val}${suffix}`);
    };

    const p = state.profile || {};
    const obj = OBJETIVOS.find(o => o[0] === p.goal);
    add('Objetivo principal', obj ? `${obj[1]} (${obj[2]})` : null);
    add('O que quer alcançar, nas palavras dela', p.goal_details);
    if (p.goal_deadline) add('Prazo que definiu', new Date(p.goal_deadline + 'T12:00:00').toLocaleDateString('pt-BR'));
    add('Nível de treino', (NIVEIS.find(n => n[0] === p.training_level) || [])[1]);
    add('Onde treina', Array.isArray(p.training_place) ? p.training_place : null);
    add('Meta de água por dia', p.water_goal_ml ? formatLitros(p.water_goal_ml) : null);
    add('Meta de sono por noite', p.sleep_goal_h, ' h');
    const pj = state.projecao || {};
    if (pj.peso && !pj.peso.chegou) {
        add('Faltam pra meta de peso', kgTxt(pj.peso.falta), ' kg');
        if (pj.peso.semanasPrazo != null) add('Semanas até o prazo', Math.ceil(pj.peso.semanasPrazo));
        if (pj.peso.ritmo != null) add('Ritmo real nas últimas semanas', (pj.peso.ritmo > 0 ? '+' : '-') + kgTxt(pj.peso.ritmo), ' kg por semana');
        if (pj.peso.semanasNoRitmo != null) add('Semanas pra chegar na meta nesse ritmo', Math.ceil(pj.peso.semanasNoRitmo));
        if (pj.peso.precisa != null) add('Ritmo necessário pra cumprir o prazo', kgTxt(pj.peso.precisa), ' kg por semana');
    }
    if (pj.treino) add('Média de treinos por semana (últimas 4)', String(pj.treino.media).replace('.', ','));
    add('Nome', ctx.nome);
    add('Idade', ctx.idade, ' anos');
    add('Sexo', ctx.sexo === 'M' ? 'masculino' : ctx.sexo === 'F' ? 'feminino' : null);
    add('Altura', ctx.altura_m, ' m');
    add('Peso atual', ctx.peso_atual_kg, ' kg');
    add('Peso inicial', ctx.peso_inicial_kg, ' kg');
    add('Peso 4 semanas atrás', ctx.peso_4_semanas_atras_kg, ' kg');
    add('Meta de peso', ctx.meta_peso_kg, ' kg');
    add('IMC', ctx.imc);
    add('Meta de treinos por semana', ctx.meta_treinos_semana);
    add('Dias treinados esta semana', ctx.dias_treinados_esta_semana);
    add('Dias treinados semana passada', ctx.dias_treinados_semana_passada);
    add('Dias desde o último treino', ctx.dias_desde_ultimo_treino);
    add('Total de treinos registrados', ctx.total_treinos_registrados);
    add('Atividades que mais pratica', ctx.atividades_favoritas);
    add('Duração média do treino', ctx.duracao_media_min, ' min');
    add('Dias seguidos treinando agora', ctx.streak_atual_dias);
    add('Recorde de dias seguidos', ctx.streak_recorde_dias);
    add('Cintura', ctx.cintura_cm, ' cm');
    add('Cintura na medição anterior', ctx.cintura_anterior_cm, ' cm');
    add('Gordura corporal', ctx.gordura_pct, '%');
    add('Refeições registradas nos últimos 7 dias', ctx.refeicoes_registradas_7d);
    add('Nota média das refeições', ctx.nota_media_refeicoes, '/10');
    add('Pontos ativos no app', ctx.pontos_ativos);
    add('Histórico de saúde na família', ctx.historico_familiar);
    add('Condições de saúde próprias', ctx.condicoes_proprias);
    add('Alergias', ctx.alergias);
    add('Medicações em uso', ctx.medicacoes);

    return L.join('\n') || 'Pessoa ainda não preencheu dados.';
}

async function getCoachContext(force = false) {
    if (state.coachContext && !force) return state.coachContext;
    const [{ data, error }] = await Promise.all([
        sb.rpc('ai_context', { uid: state.session.user.id }),
        calcularProjecaoAtual().catch(() => null),
    ]);
    if (error) { console.error('ai_context', error); return null; }
    state.coachContext = data;
    return data;
}

async function callAI(prompt) {
    const { data, error } = await sb.functions.invoke('get-ai-tip', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.tip) throw new Error('Resposta da IA vazia');
    return data.tip;
}

async function askCoach(question, history = []) {
    const ctx = await getCoachContext();
    const brief = formatCoachContext(ctx);

    const historyText = history.length
        ? '\n\nCONVERSA ATÉ AGORA:\n' + history.slice(-8).map(m =>
            `${m.role === 'user' ? 'Pessoa' : 'Você'}: ${m.body}`).join('\n')
        : '';

    const prompt = `${COACH_PERSONA}

DOSSIÊ DA PESSOA (dados reais do app, use-os na resposta):
${brief}${historyText}

PERGUNTA DA PESSOA:
${question}

Responda como o Coach Pulso.`;

    return await callAI(prompt);
}

// ---- Coach que percebe a queda (no máximo 1 vez por semana) ----
async function checarQuedaCoach() {
    if (!state.session || !state.profile) return;
    const uid = state.session.user.id;
    const chave = 'pulso-coach-queda-' + uid;
    if (Date.now() - Number(lsGet(chave) || 0) < 7 * 86400000) return;
    try {
        const ini28 = new Date(Date.now() - 28 * 86400000).toISOString();
        const [{ data: ultimo }, { data: treinos }, { data: st }] = await Promise.all([
            sb.from('posts').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
            sb.from('posts').select('created_at, activity_type').eq('user_id', uid).eq('kind', 'workout').gte('created_at', ini28),
            sb.from('daily_streaks').select('current_streak').eq('user_id', uid).maybeSingle(),
        ]);
        if (!ultimo || !ultimo.length) return; // conta nova, sem histórico: não é queda
        const diasSem = Math.floor((Date.now() - new Date(ultimo[0].created_at)) / 86400000);
        const seg = segundaDe(); seg.setHours(0, 0, 0, 0);
        const estaSemana = (treinos || []).filter(t => new Date(t.created_at) >= seg).length;
        const anteriores = (treinos || []).filter(t => new Date(t.created_at) < seg).length;
        const mediaSemanal = anteriores / 3;
        const diaDaSemana = (new Date().getDay() + 6) % 7; // 0 = segunda
        const caiuTreinos = diaDaSemana >= 4 && mediaSemanal >= 2 && estaSemana < mediaSemanal / 2;
        // ofensiva de 7+ dias que caiu
        const chaveOf = 'pulso-ofensiva-vista-' + uid;
        const ofAntes = Number(lsGet(chaveOf) || 0);
        const ofAgora = (st && st.current_streak) || 0;
        lsSet(chaveOf, String(ofAgora));
        const perdeuOfensiva = ofAntes >= 7 && ofAgora < 2;
        if (diasSem < 3 && !caiuTreinos && !perdeuOfensiva) return;

        lsSet(chave, String(Date.now()));
        const p = state.profile;
        const objetivo = p.goal ? (OBJETIVOS.find(o => o[0] === p.goal) || [, ''])[1] : '';
        const meta = p.target_weight && p.goal_deadline ? `meta de ${br(p.target_weight)} kg até ${new Date(p.goal_deadline + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
        const gosta = (p.train_likes || []).join(', ') || [...new Set((treinos || []).map(t => t.activity_type).filter(Boolean))].slice(0, 2).join(', ');
        const situacao = diasSem >= 3 ? `está há ${diasSem} dias sem registrar nada no app`
            : perdeuOfensiva ? `perdeu uma sequência de ${ofAntes} dias seguidos`
            : `treinou ${estaSemana} vez(es) nesta semana, quando costuma treinar umas ${Math.round(mediaSemanal)} por semana`;
        const prompt = `${COACH_PERSONA}

Escreva UMA mensagem curta (2 ou 3 frases, no máximo 60 palavras) pro chat, em português do Brasil, pra ${String(p.display_name || '').split(' ')[0]}.
Situação: a pessoa ${situacao}.
${objetivo ? `Objetivo dela: ${objetivo}${meta ? ', ' + meta : ''}.` : ''}
${gosta ? `Ela costuma fazer: ${gosta}.` : ''}
Regras: tom acolhedor, sem bronca e sem culpa; cite o objetivo dela de forma natural; termine propondo UM passo pequeno e fácil pra hoje (até 20 minutos). No máximo 1 emoji. Não use travessão. Não use lista.`;
        const texto = (await callAI(prompt)).trim();
        if (!texto) return;
        await sb.from('ai_messages').insert({ user_id: uid, role: 'coach', body: texto });
        lsSet('pulso-coach-novo-' + uid, '1');
        toastComAcao('O Coach te mandou uma mensagem', 'Ver', () => switchView('coach'));
    } catch (_) { /* sem IA agora: tenta na próxima abertura */ lsSet(chave, ''); }
}

// ---- INSIGHTS: o coach que aparece no feed ----
const INSIGHT_SPECS = {
    weekly_plan: {
        title: 'Plano da semana',
        cta: 'Conversar com o coach',
        ask: (ctx) => `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday:'long' })}, começo de semana. Olhe a semana passada da pessoa e monte um plano curto e realista para esta semana. Cite o que ela fez na semana passada e o que dá pra ajustar. Termine com uma ação concreta para os próximos 2 dias.`
    },
    celebration: {
        title: 'Meta batida',
        cta: 'Ver minha evolução',
        ask: () => `A pessoa acabou de bater a meta de treinos da semana. Comemore de forma específica citando os números reais dela (quantos dias, qual atividade, streak). Nada de frase de efeito genérica. Termine sugerindo como manter o ritmo sem exagerar.`
    },
    nudge: {
        title: 'Faz uns dias...',
        cta: 'Registrar treino',
        ask: (ctx) => `A pessoa está há ${ctx.dias_desde_ultimo_treino} dias sem registrar treino. Escreva um convite gentil de volta, sem cobrança e sem culpa. Cite o que ela costumava fazer e proponha algo bem pequeno e fácil para hoje ou amanhã, do tipo que leva 15 minutos.`
    },
    plateau: {
        title: 'Sobre o peso parado',
        cta: 'Conversar com o coach',
        ask: () => `O peso da pessoa está praticamente igual nas últimas 4 semanas, mesmo ela treinando. Explique em linguagem simples por que isso acontece e o que costuma destravar, citando os números reais dela. Seja tranquilizador: platô é normal, não é fracasso. Sugira olhar medida de cintura além da balança.`
    },
    weekly_review: {
        title: 'Retrospectiva da semana',
        cta: 'Ver minha evolução',
        ask: () => `Faça a retrospectiva da semana que está acabando: o que a pessoa fez, o que foi bem, e UM ajuste concreto para a próxima semana. Use os números reais. Seja honesto, se a semana foi fraca diga isso sem dureza.`
    },
};

async function loadActiveInsight() {
    const { data } = await sb.from('ai_insights')
        .select('*')
        .eq('user_id', state.session.user.id)
        .eq('dismissed', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
    return data?.[0] || null;
}

function decideInsightKind(ctx) {
    if (!ctx) return null;
    const hoje = new Date().getDay(); // 0 dom, 1 seg
    const meta = ctx.meta_treinos_semana || 3;
    const dias = ctx.dias_treinados_esta_semana || 0;
    const semTreinar = ctx.dias_desde_ultimo_treino;

    // Prioridade: sumiu > bateu meta > platô > segunda > domingo
    if (semTreinar != null && semTreinar >= 4) return 'nudge';
    if (dias >= meta) return 'celebration';

    const p0 = Number(ctx.peso_4_semanas_atras_kg);
    const p1 = Number(ctx.peso_atual_kg);
    if (p0 && p1 && Math.abs(p0 - p1) < 0.6 && (ctx.total_treinos_registrados || 0) >= 6) return 'plateau';

    if (hoje === 1) return 'weekly_plan';
    if (hoje === 0) return 'weekly_review';
    return null;
}

async function generateInsight(kind, ctx) {
    const spec = INSIGHT_SPECS[kind];
    if (!spec) return null;

    const brief = formatCoachContext(ctx);
    const prompt = `${COACH_PERSONA}

DOSSIÊ DA PESSOA (dados reais do app, use-os na resposta):
${brief}

TAREFA:
${spec.ask(ctx)}

Escreva apenas o texto da mensagem, sem título e sem saudação formal. Máximo 90 palavras.`;

    const body = await callAI(prompt);

    const { data } = await sb.from('ai_insights').insert({
        user_id: state.session.user.id,
        kind,
        title: spec.title,
        body: body.trim(),
        cta_label: spec.cta,
        cta_action: kind === 'nudge' ? 'register' : kind === 'celebration' || kind === 'weekly_review' ? 'progress' : 'chat',
    }).select().single();

    return data;
}

function insightCardHTML(ins) {
    const emo = { weekly_plan:'🗓️', celebration:'🎉', nudge:'👋', plateau:'📊', weekly_review:'📋', tip:'💡' }[ins.kind] || '💡';
    return `<div class="coach-card" data-insight-id="${ins.id}">
        <div class="coach-card-head">
            <span class="coach-avatar">${emo}</span>
            <div class="coach-card-meta">
                <div class="coach-name">Coach Pulso</div>
                <div class="coach-sub">${escapeHTML(ins.title)}</div>
            </div>
            <button class="coach-dismiss" data-act="dismiss-insight" data-id="${ins.id}" aria-label="Dispensar">×</button>
        </div>
        <p class="coach-body">${escapeHTML(ins.body)}</p>
        ${ins.cta_label ? `<button class="coach-cta" data-act="insight-cta" data-target="${ins.cta_action}">${escapeHTML(ins.cta_label)}</button>` : ''}
    </div>`;
}

// Roda depois do feed aparecer, sem travar a tela
async function hydrateCoachCard() {
    const slot = document.getElementById('coachSlot');
    if (!slot) return;

    try {
        let ins = await loadActiveInsight();

        if (!ins) {
            const ctx = await getCoachContext(true);
            const kind = decideInsightKind(ctx);
            if (!kind) return;

            // Não gera o mesmo tipo duas vezes no mesmo dia
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const { count } = await sb.from('ai_insights')
                .select('*', { count:'exact', head:true })
                .eq('user_id', state.session.user.id)
                .eq('kind', kind)
                .gte('created_at', hoje.toISOString());
            if (count && count > 0) return;

            slot.innerHTML = `<div class="coach-card loading">
                <div class="coach-card-head">
                    <span class="coach-avatar">🤖</span>
                    <div class="coach-card-meta"><div class="coach-name">Coach Pulso</div>
                    <div class="coach-sub">analisando sua semana...</div></div>
                </div>
                <div class="coach-skeleton"></div>
            </div>`;

            ins = await generateInsight(kind, ctx);
        }

        slot.innerHTML = ins ? insightCardHTML(ins) : '';
    } catch (err) {
        console.error('coach card', err);
        slot.innerHTML = '';
    }
}

// ============================================================
// VIEWS
// ============================================================
async function renderFeed() {
    sincronizarModoTela();
    const c = $('#viewContainer');
    c.innerHTML = esqueleto('feed');

    // Carrega stories em paralelo com posts
    const storiesPromise = sb.from('stories')
        .select('id, user_id, caption, image_url, background_color, style, created_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    // Posts com policy do banco filtrando visibilidade
    const postsPromise = sb
        .from('posts')
        .select(`
            id, kind, caption, image_url, activity_type, duration_min, distance_km, muscle_groups, meal_slot, weight_kg, created_at, user_id, visibility, meal_score, meta, comments_off, pinned_at, meal_analysis, achievement_code,
            user:profiles!user_id!inner (id, username, display_name, avatar_url),
            reactions (id, user_id),
            comments (id)
        `)
        .neq('kind', 'story')  // stories vão pra barra separada
        .neq('kind', 'weight')  // peso é sempre privado, nunca aparece em feed nem mural
        .eq('in_feed', true)    // só o que a pessoa escolheu publicar
        .eq('archived', false)  // arquivados somem do feed
        .order('created_at', { ascending: false })
        .range(0, FEED_PAGE - 1);

    const [{ data: stories }, { data: posts, error }] = await Promise.all([storiesPromise, postsPromise]);
    state.feedOffset = (posts || []).length;

    if (error) { c.innerHTML = `<div class="view"><p style="color:var(--danger)">Erro ao carregar: ${error.message}</p></div>`; return; }

    // Busca os perfis dos autores dos stories numa consulta separada
    const storyUids = [...new Set((stories || []).map(s => s.user_id))];
    let perfisStory = {};
    if (storyUids.length) {
        const { data: ps } = await sb.from('profiles')
            .select('id, username, display_name, avatar_url').in('id', storyUids);
        (ps || []).forEach(p => { perfisStory[p.id] = p; });
    }

    // Agrupa stories por autor
    const storiesByUser = {};
    (stories || []).forEach(s => {
        const uid = s.user_id;
        const autor = perfisStory[uid] || { id: uid, username: '?', display_name: '?' };
        if (!storiesByUser[uid]) storiesByUser[uid] = { user: autor, items: [] };
        storiesByUser[uid].items.push(s);
    });
    // Ordena: meus primeiro, resto por mais recente
    const mine = storiesByUser[state.session.user.id];
    const others = Object.entries(storiesByUser)
        .filter(([uid]) => uid !== state.session.user.id)
        .map(([, v]) => v)
        .sort((a, b) => new Date(b.items[0].created_at) - new Date(a.items[0].created_at));
    const storiesOrdered = mine ? [mine, ...others] : others;
    state.storiesData = storiesOrdered;

    // HTML da barra de stories
    let storiesHTML = '<div class="stories-bar">';
    // Meu botão de adicionar story sempre presente
    storiesHTML += `<div class="story-item" data-add-story="1">
        <div class="story-avatar mine">
            <div class="story-avatar-in">${avatarHTML(state.profile, 'md').replace('avatar-md','avatar')}</div>
            <span class="story-plus">+</span>
        </div>
        <span class="story-name">Seu story</span>
    </div>`;
    storiesOrdered.forEach((group, i) => {
        if (group === mine) return;  // já ficou embutido no botão de cima quando eu tenho meus stories, mostro os outros aqui
        storiesHTML += `<div class="story-item" data-story-idx="${i}">
            <div class="story-avatar">
                <div class="story-avatar-in">${avatarHTML(group.user, 'md').replace('avatar-md','avatar')}</div>
            </div>
            <span class="story-name">${escapeHTML(group.user.display_name || group.user.username)}</span>
        </div>`;
    });
    // Se eu tenho meus stories, adiciona também um item pra ver (além do botão +)
    if (mine) {
        storiesHTML = storiesHTML.replace('data-add-story="1"', `data-add-story="1" data-story-idx="0"`);
    }
    storiesHTML += '</div>';

    let html = '<div class="view feed-view">';

    html += `<div id="coachSlot"></div>`;
    html += storiesHTML;
    html += `<div id="resumoSlot"></div>`;
    html += `<div id="desafioSlot"></div>`;

    // Sugestões de seguir (só aparece se você não segue ninguém ainda ou poucas pessoas)
    const suggestions = await carregarSugestoes(6);
    if (suggestions && suggestions.length > 0) {
        let sugHTML = '<div class="suggestions-section"><h3 class="suggestions-title">Descobrir pessoas</h3><div class="suggestions-row">';
        suggestions.forEach(u => {
            sugHTML += `<div class="suggestion-card" data-act="view-user" data-uid="${u.id}">
                ${avatarHTML(u, 'md')}
                <div class="suggestion-name">${escapeHTML(u.display_name)}</div>
                <div class="suggestion-uname">${escapeHTML(u.motivo || '@' + u.username)}</div>
                <button class="suggestion-follow" data-act="quick-follow" data-uid="${u.id}" data-following="0">Seguir</button>
            </div>`;
        });
        sugHTML += '</div></div>';
        html += sugHTML;
    }

    const visiveis = filtrarBloqueados(posts);
    if (!visiveis || visiveis.length === 0) {
        html += `<div class="primeiro-dia">
            <h3>Bem-vindo ao Pulso</h3>
            <p class="pd-sub">Três coisas pra começar hoje:</p>
            <button class="pd-passo" data-act="quick-kind" data-kind="workout">
                <span class="pd-n">1</span>
                <span class="pd-txt"><b>Registre um treino</b><small>vale até 15 pontos, com ou sem foto</small></span>
                <span class="pd-seta">›</span>
            </button>
            <button class="pd-passo" data-act="quick-kind" data-kind="water">
                <span class="pd-n">2</span>
                <span class="pd-txt"><b>Marque a água do dia</b><small>o app calcula sua meta pelo seu peso</small></span>
                <span class="pd-seta">›</span>
            </button>
            <button class="pd-passo" data-act="go-coach">
                <span class="pd-n">3</span>
                <span class="pd-txt"><b>Converse com o coach</b><small>ele já conhece seus números</small></span>
                <span class="pd-seta">›</span>
            </button>
            <p class="pd-rodape">Siga algumas pessoas abaixo e o feed começa a ganhar vida.</p>
        </div>`;
    } else {
        html += `<div id="feedPosts">${visiveis.map(p => renderPost(p)).join('')}</div>`;
        html += `<div id="feedMore">${(posts || []).length >= FEED_PAGE ? '<button class="btn-secondary feed-more-btn" data-act="load-more-feed">Carregar mais</button>' : ''}</div>`;
    }
    html += '</div>';
    c.innerHTML = html;

    // Coach, lembretes e desafios aparecem depois, sem travar o feed
    hydrateCoachCard();
    hydrateResumoSemana();
    hydrateDesafiosFeed();
}

// Ícone de linha da privacidade do post (no lugar dos emojis)
const ICONE_VIS = {
    public: '<svg class="vis-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    followers: '<svg class="vis-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
    private: '<svg class="vis-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
};
const ICONE_LIXO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
// Número com vírgula (padrão brasileiro)
const br = (n, casas = 1) => (n == null || isNaN(Number(n))) ? '-' : Number(n).toFixed(casas).replace('.', ',');

function renderPost(p) {
    const user = p.user || { display_name:'?', username:'?' };
    const reacted = p.reactions?.some(r => r.user_id === state.session.user.id);
    const rCount = p.reactions?.length || 0;
    const cCount = p.comments?.length || 0;

    const privacyIcon = ICONE_VIS[p.visibility || 'public'] || ICONE_VIS.public;
    const privacyLabel = { public:'Público', followers:'Seguidores', private:'Só eu' }[p.visibility || 'public'];
    const privacyBadge = `<span class="post-privacy-badge">${privacyIcon} ${privacyLabel}</span>`;

    let badge = '', body = '';
    if (p.kind === 'workout') {
        const comQuem = (p.meta && Array.isArray(p.meta.com) && p.meta.com.length)
            ? ` <span class="post-com">com ${p.meta.com.map(u => `<a data-act="view-user" data-uid="${u.id}">@${escapeHTML(u.username || '')}</a>`).join(', ')}</span>` : '';
        badge = `<div class="post-badge"><span class="emo">💪</span>${escapeHTML(p.activity_type||'Treino')} · <b>${p.duration_min||0} min</b>${detalheTreino(p)}${comQuem}</div>`;
    } else if (p.kind === 'meal') {
        const slotName = {cafe:'Café da manhã',almoco:'Almoço',jantar:'Jantar',lanche:'Lanche'}[p.meal_slot] || 'Refeição';
        const scoreTag = p.meal_score != null
            ? ` · <b style="color:${p.meal_score >= 8 ? 'var(--vital)' : p.meal_score >= 5 ? 'var(--gold)' : 'var(--effort)'}">${br(p.meal_score)}/10</b>`
            : '';
        badge = `<div class="post-badge"><span class="emo">🍽️</span>${slotName}${scoreTag}</div>`;
        if (p.meal_analysis) {
            body += `<div class="post-ai-note"><span class="pan-emo">🤖</span>${escapeHTML(p.meal_analysis)}</div>`;
        }
    } else if (p.kind === 'weight') {
        badge = `<div class="post-badge">Pesagem · <b>${p.weight_kg} kg</b></div>`;
    } else if (p.kind === 'text' && p.meta && p.meta.depoimento) {
        const dep = p.meta.depoimento;
        badge = `<div class="dep-card-feed">
            <span class="dep-aspas">“</span>
            <p>${escapeHTML(p.caption || '')}</p>
            <span class="dep-autor" data-act="view-user" data-uid="${dep.autor_id}">Depoimento de <b>${escapeHTML(dep.autor_nome || '')}</b> <small>@${escapeHTML(dep.autor_username || '')}</small></span>
        </div>`;
        p = Object.assign({}, p, { caption: null });
    } else if (p.kind === 'achievement') {
        const partes = String(p.caption || '').split('|');
        if (partes.length === 3) {
            badge = `<div class="conquista-card">
                <span class="cq-emo">${partes[0]}</span>
                <div class="cq-txt">
                    <div class="cq-tag">Nova conquista</div>
                    <div class="cq-nome">${escapeHTML(partes[1])}</div>
                    <div class="cq-desc">${escapeHTML(partes[2])}</div>
                </div>
            </div>`;
            p = Object.assign({}, p, { caption: null });
        } else {
            badge = `<div class="post-badge conquista">Nova conquista</div>`;
        }
    }

    if (p.caption) {
        const longa = p.caption.length > 160 || (p.caption.match(/\n/g) || []).length > 2;
        body += `<p class="post-caption${longa ? ' longa' : ''}">${escapeHTML(p.caption)}</p>${longa ? '<button class="caption-mais" data-act="caption-mais">mais</button>' : ''}`;
    }
    if (p.image_url) body += `<img class="post-photo" src="${p.image_url}" loading="lazy" decoding="async">`;

    const isMine = p.user_id === state.session.user.id;
    const autorDoDepoimento = p.meta && p.meta.depoimento && p.meta.depoimento.autor_id === state.session.user.id;
    const menuBtn = !isMine
        ? `<button class="post-menu-btn" data-act="${autorDoDepoimento ? 'post-menu-dep' : 'report-post'}" data-id="${p.id}" data-uid="${p.user_id}" data-name="${escapeHTML(user.display_name)}" data-dep="${autorDoDepoimento ? p.meta.depoimento.id : ''}" aria-label="Opções">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
           </button>`
        : `<button class="post-menu-btn" data-act="post-menu" data-id="${p.id}" aria-label="Opções">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
           </button>`;

    return `
        <article class="post" data-post-id="${p.id}" data-visibility="${p.visibility || 'public'}" data-coment-off="${p.comments_off ? '1' : '0'}" data-fixado="${p.pinned_at ? '1' : '0'}">
            <div class="post-head">
                <span data-act="view-user" data-uid="${p.user_id}" class="post-head-link">${avatarHTML(user, 'sm')}</span>
                <div class="post-meta" data-act="view-user" data-uid="${p.user_id}">
                    <div class="post-name">${escapeHTML(user.display_name)}</div>
                    <div class="post-time">@${escapeHTML(user.username)} · ${timeAgo(p.created_at)} <span class="post-privacy-badge" data-privacy-badge>${privacyIcon} ${privacyLabel}</span></div>
                </div>
                ${menuBtn}
            </div>
            ${badge}
            ${body}
            <div class="post-actions">
                <button class="post-btn ${reacted?'on':''}" data-act="react" data-id="${p.id}">
                    <svg viewBox="0 0 24 24" fill="${reacted?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span>${rCount}</span>
                </button>
                <button class="post-btn" data-act="comment" data-id="${p.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>${cCount}</span>
                </button>
                ${isMine ? `<span class="post-coment-off${p.comments_off ? '' : ' hidden'}">comentários desativados</span>` : ''}
                ${isMine && rCount > 0 ? `<button class="post-btn ghost" data-act="see-likers" data-id="${p.id}">👀 Quem curtiu</button>` : ''}
                <button class="post-btn post-salvar${state.salvos && state.salvos.has(p.id) ? ' on' : ''}" data-act="save-post" data-id="${p.id}" aria-label="Salvar">
                    <svg viewBox="0 0 24 24" fill="${state.salvos && state.salvos.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>
                </button>
            </div>
        </article>
    `;
}

// ============================================================
// GRÁFICOS SVG (sem dependências)
// ============================================================
function lineChart(points, opts = {}) {
    // points: [{x: Date|number, y: number}]
    const W = opts.width || 320, H = opts.height || 140;
    const pad = { t: 14, r: 10, b: 24, l: 34 };
    if (opts.vazio && (!points || points.length < (opts.vazio.min || 2))) {
        const v = opts.vazio;
        return `<div class="chart-convite">
            <span>${v.msg}</span>
            ${v.act ? `<button class="btn-mini" data-act="${v.act}"${v.extra || ''}>${v.label}</button>` : ''}
        </div>`;
    }
    if (!points || points.length === 0) {
        return `<div class="chart-empty">Sem dados suficientes ainda.</div>`;
    }
    if (points.length === 1) {
        return `<div class="chart-single">
            <span class="cs-val">${br(points[0].y)}</span>
            <span class="cs-hint">${opts.unit || ''} - registre mais para ver a curva</span>
        </div>`;
    }

    const extra = [...(opts.trend || []), ...(opts.projecao ? [opts.projecao.de, opts.projecao.ate] : [])];
    const xs = [...points, ...extra].map(p => +p.x), ys = [...points, ...extra].map(p => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    const span = yMax - yMin || 1;
    yMin -= span * 0.12; yMax += span * 0.12;

    const px = x => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r);
    const py = y => pad.t + (1 - (y - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b);

    const path = points.map((p, i) => `${i ? 'L' : 'M'}${px(+p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
    const ultX = Math.max(...points.map(p => +p.x)), priX = Math.min(...points.map(p => +p.x));
    const areaPath = path + ` L${px(ultX).toFixed(1)} ${(H - pad.b).toFixed(1)} L${px(priX).toFixed(1)} ${(H - pad.b).toFixed(1)} Z`;
    const trendPath = (opts.trend && opts.trend.length >= 2)
        ? `<path d="${opts.trend.map((p, i) => `${i ? 'L' : 'M'}${px(+p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-opacity=".55" stroke-linecap="round"/>` : '';
    const projPath = opts.projecao
        ? `<path d="M${px(+opts.projecao.de.x).toFixed(1)} ${py(opts.projecao.de.y).toFixed(1)} L${px(+opts.projecao.ate.x).toFixed(1)} ${py(opts.projecao.ate.y).toFixed(1)}" fill="none" stroke="var(--vital)" stroke-width="1.6" stroke-dasharray="4 4" opacity=".8"/>
           <circle cx="${px(+opts.projecao.ate.x).toFixed(1)}" cy="${py(opts.projecao.ate.y).toFixed(1)}" r="3" fill="var(--bg-card)" stroke="var(--vital)" stroke-width="1.4"/>` : '';
    const un = opts.unit ? ' ' + opts.unit : '';
    const fmtTip = p => `${new Date(p.x).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}: ${String(Number(p.y).toFixed(opts.decimals ?? 1)).replace('.', ',')}${un}`;
    const hits = points.map((p, i) => {
        const x0 = i === 0 ? pad.l : (px(+points[i - 1].x) + px(+p.x)) / 2;
        const x1 = i === points.length - 1 ? W - pad.r : (px(+p.x) + px(+points[i + 1].x)) / 2;
        return `<rect class="tip-hit" x="${x0.toFixed(1)}" y="0" width="${Math.max(1, x1 - x0).toFixed(1)}" height="${H}" fill="transparent" data-tip="${fmtTip(p)}"/>`;
    }).join('');

    // linha de meta (opcional)
    let goalLine = '';
    if (opts.goal != null && opts.goal >= yMin && opts.goal <= yMax) {
        const gy = py(opts.goal).toFixed(1);
        goalLine = `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="var(--gold)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".8"/>
                    <text x="${W - pad.r}" y="${gy - 4}" text-anchor="end" font-size="9" fill="var(--gold)">meta</text>`;
    }

    // eixo Y (3 marcas)
    const ticks = [yMin + span * 0.12, (yMin + yMax) / 2, yMax - span * 0.12];
    const yAxis = ticks.map(t => `
        <line x1="${pad.l}" y1="${py(t).toFixed(1)}" x2="${W - pad.r}" y2="${py(t).toFixed(1)}" stroke="var(--line)" stroke-width="1" opacity=".5"/>
        <text x="${pad.l - 5}" y="${(py(t) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--ink-faint)">${br(t, opts.decimals ?? 1)}</text>
    `).join('');

    // pontos (só se poucos)
    const dots = points.length <= 20
        ? points.map(p => `<circle cx="${px(+p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="2.6" fill="var(--vital)" stroke="var(--bg-card)" stroke-width="1.4"/>`).join('')
        : '';

    // labels X (primeiro e último)
    const fmt = d => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    const xLabels = `
        <text x="${pad.l}" y="${H - 6}" font-size="9" fill="var(--ink-faint)">${fmt(xMin)}</text>
        <text x="${W - pad.r}" y="${H - 6}" text-anchor="end" font-size="9" fill="var(--ink-faint)">${fmt(xMax)}</text>
    `;

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
            <linearGradient id="grad-${opts.id || 'a'}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--vital)" stop-opacity=".28"/>
                <stop offset="100%" stop-color="var(--vital)" stop-opacity="0"/>
            </linearGradient>
        </defs>
        ${yAxis}
        ${goalLine}
        <path d="${areaPath}" fill="url(#grad-${opts.id || 'a'})"/>
        <path d="${path}" fill="none" stroke="var(--vital)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${trendPath}
        ${projPath}
        ${dots}
        ${xLabels}
        ${hits}
    </svg>`;
}

function barChart(bars, opts = {}) {
    // bars: [{label, value, highlight?, tip?}]
    if (opts.vazio && (!bars || !bars.some(b => b.value > 0))) {
        const v = opts.vazio;
        return `<div class="chart-convite"><span>${v.msg}</span>${v.act ? `<button class="btn-mini" data-act="${v.act}"${v.extra || ''}>${v.label}</button>` : ''}</div>`;
    }
    if (!bars || bars.length === 0) return `<div class="chart-empty">Sem dados ainda.</div>`;

    // Com pouco histórico, uma barra sozinha fica feia - mostra número grande em vez de gráfico
    if (bars.length <= 1) {
        const b = bars[0];
        const hit = opts.goal != null && b.value >= opts.goal;
        return `<div class="chart-single">
            <span class="cs-val" style="color:${hit ? 'var(--vital)' : 'var(--ink)'}">${b.value}</span>
            <span class="cs-hint">${b.label}${opts.goal != null ? ` - meta: ${opts.goal}` : ''}</span>
        </div>`;
    }

    const W = opts.width || 320, H = opts.height || 130;
    const pad = { t: 12, r: 8, b: 22, l: 8 };
    const maxV = Math.max(...bars.map(b => b.value), opts.goal || 0, 1);
    const bw = (W - pad.l - pad.r) / bars.length;
    const barW = Math.min(bw * 0.62, 28);

    let goalLine = '';
    if (opts.goal) {
        const gy = (pad.t + (1 - opts.goal / maxV) * (H - pad.t - pad.b)).toFixed(1);
        goalLine = `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="var(--gold)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".85"/>`;
    }

    const rects = bars.map((b, i) => {
        const h = (b.value / maxV) * (H - pad.t - pad.b);
        const x = pad.l + i * bw + (bw - barW) / 2;
        const y = H - pad.b - h;
        const fill = b.value >= (opts.goal || Infinity) ? 'var(--vital)' : 'var(--bg-elev)';
        const stroke = b.value >= (opts.goal || Infinity) ? 'none' : 'var(--line)';
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2,h).toFixed(1)}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
                ${b.value > 0 || opts.mostrarZero ? `<text x="${(x + barW/2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--ink-faint)">${b.txt ?? b.value}</text>` : ''}
                <text x="${(x + barW/2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="8.5" fill="var(--ink-faint)">${b.label}</text>
                <rect class="tip-hit" x="${(pad.l + i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}" fill="transparent" data-tip="${b.tip || (b.label + ': ' + b.value + (opts.unit ? ' ' + opts.unit : ''))}"/>`;
    }).join('');

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${goalLine}${rects}</svg>`;
}

// ============================================================
// EVOLUÇÃO INDIVIDUAL (aba Progresso)
// ============================================================
// ---- O que pode entrar no resumo compartilhável (a pessoa escolhe até 4) ----
// Treino e constância vêm marcados; água, sono, refeições e pontos ficam desmarcados (mais pessoais). Peso nunca entra.
function candidatosResumo(d) {
    const L = [];
    const hm = m => m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min';
    const n1 = n => String(Math.round(n * 10) / 10).replace('.', ',');
    if (d.dias != null) L.push({ id: 'treinos', valor: d.meta ? `${d.dias}/${d.meta}` : String(d.dias), rotulo: d.meta ? 'treinos na semana' : (d.dias === 1 ? 'dia treinado' : 'dias treinados'), padrao: true, destaque: d.meta ? d.dias >= d.meta : true });
    if (d.maisFeito) L.push({ id: 'maisfeito', valor: d.maisFeito[0], rotulo: `treino que mais fiz, ${d.maisFeito[1]}x`, padrao: true });
    if (d.km > 0) L.push({ id: 'km', valor: n1(d.km) + ' km', rotulo: 'percorridos', padrao: true });
    if (d.ofensiva > 0) L.push({ id: 'ofensiva', valor: `🔥 ${d.ofensiva}`, rotulo: d.ofensiva === 1 ? 'dia de ofensiva' : 'dias de ofensiva', padrao: true });
    if (d.minutos > 0) L.push({ id: 'tempo', valor: hm(d.minutos), rotulo: 'treinando', padrao: false });
    if (d.aguaMedia > 0) L.push({ id: 'agua', valor: n1(d.aguaMedia / 1000) + ' L', rotulo: 'de água por dia', padrao: false });
    if (d.refeicoesBoas > 0) L.push({ id: 'refeicoes', valor: String(d.refeicoesBoas), rotulo: d.refeicoesBoas === 1 ? 'refeição bem avaliada' : 'refeições bem avaliadas', padrao: false });
    if (d.sono) L.push({ id: 'sono', valor: n1(d.sono) + ' h', rotulo: 'de sono por noite', padrao: false });
    if (d.pontos > 0) L.push({ id: 'pontos', valor: String(d.pontos), rotulo: 'pontos', padrao: false });
    // no máximo 4 marcados por padrão
    let marcados = 0;
    L.forEach(c => { if (c.padrao && marcados < 4) marcados++; else c.padrao = false; });
    if (!marcados && L.length) L[0].padrao = true;
    return L;
}

// Passo 1: escolher o que mostrar
function abrirEscolhaResumo(res, nomeArquivo) {
    const old = document.getElementById('resumoSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'resumoSheet';
    sheet.className = 'sheet on';
    const marcados = new Set(res.candidatos.filter(c => c.padrao).map(c => c.id));
    const pintar = () => {
        sheet.innerHTML = `<div class="sheet-card">
            <div class="sheet-handle"></div>
            <h3 class="sheet-title">O que mostrar no seu story</h3>
            <p class="sheet-sub">Escolha até 4. O que é mais pessoal começa desmarcado.</p>
            <div class="rs-lista">${res.candidatos.map(c => `<button type="button" class="cfg-pessoa rs-item${marcados.has(c.id) ? ' on' : ''}" data-id="${c.id}">
                <span class="cfg-pessoa-txt"><b>${escapeHTML(c.valor)}</b><small>${escapeHTML(c.rotulo)}</small></span>
                <span class="cfg-check${marcados.has(c.id) ? ' on' : ''}"></span>
            </button>`).join('')}</div>
            <div class="sheet-footer">
                <button class="btn-ghost" id="rsCancelar">Cancelar</button>
                <button class="btn-primary" id="rsPrevia" ${marcados.size ? '' : 'disabled'}>Ver prévia (${marcados.size}/4)</button>
            </div>
        </div>`;
        sheet.querySelectorAll('.rs-item').forEach(b => b.onclick = () => {
            const id = b.dataset.id;
            if (marcados.has(id)) marcados.delete(id);
            else if (marcados.size < 4) marcados.add(id);
            else { toast('Até 4 itens. Desmarque um pra trocar.', 'err'); return; }
            pintar();
        });
        sheet.querySelector('#rsCancelar').onclick = () => sheet.remove();
        sheet.querySelector('#rsPrevia').onclick = async () => {
            const btn = sheet.querySelector('#rsPrevia');
            btn.disabled = true; btn.textContent = 'Montando...';
            const itens = res.candidatos.filter(c => marcados.has(c.id)).map(c => [c.valor, c.rotulo, !!c.destaque]);
            const blob = await imagemResumo({ titulo: res.titulo, subtitulo: res.subtitulo, itens, versiculo: res.versiculo });
            sheet.remove();
            if (!blob) { toast('Não consegui montar a imagem agora.', 'err'); return; }
            abrirPreviaImagem(blob, nomeArquivo, res.versiculo ? isoDe(semanaDoResumo()) : null);
        };
    };
    pintar();
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
}

// Passo 2: prévia com Postar no Pulso, Compartilhar e Salvar
function abrirPreviaImagem(blob, nomeArquivo, semanaResumo = null) {
    const old = document.getElementById('previaSheet');
    if (old) old.remove();
    const url = URL.createObjectURL(blob);
    const arquivo = new File([blob], nomeArquivo, { type: 'image/jpeg' });
    const sheet = document.createElement('div');
    sheet.id = 'previaSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card previa-card">
        <div class="sheet-handle"></div>
        <img class="previa-img" src="${url}" alt="Prévia">
        <div class="previa-botoes">
            <button class="btn-primary" id="pvPulso">Postar no Pulso</button>
            <div class="previa-linha">
                <button class="btn-secondary" id="pvCompartilhar">Compartilhar</button>
                <button class="btn-secondary" id="pvSalvar">Salvar imagem</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const fechar = () => { sheet.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); };
    sheet.addEventListener('click', e => { if (e.target === sheet) fechar(); });
    document.getElementById('pvPulso').onclick = () => { fechar(); state.storyResumoSemana = semanaResumo; openStoryCreator(); entrarModoFoto(arquivo); };
    document.getElementById('pvCompartilhar').onclick = () => compartilharImagem(arquivo);
    document.getElementById('pvSalvar').onclick = () => salvarImagem(blob, nomeArquivo);
}
async function compartilharImagem(arquivo) {
    try {
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            await navigator.share({ files: [arquivo], title: 'Pulso' });
            return;
        }
    } catch (e) {
        if (e && e.name === 'AbortError') return; // a pessoa fechou o menu
    }
    toast('Seu celular não abriu o compartilhar. Salvei a imagem pra você postar.', 'ok');
    salvarImagem(arquivo, arquivo.name);
}
function salvarImagem(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ============================================================
// COACH NA EVOLUÇÃO: treino do dia, plano, carta, alerta
// (tudo gerado uma vez e guardado; abrir de novo não gera outra vez)
// ============================================================
const MODALIDADES = ['Musculação', 'Corrida', 'Caminhada', 'Ciclismo', 'Natação', 'Pilates', 'Yoga', 'Dança', 'Alongamento', 'Futebol'];
const TIPOS_TREINO = ['Musculação', 'Corrida', 'Ciclismo', 'Natação', 'Caminhada', 'Yoga', 'Dança', 'Alongamento', 'Futebol', 'Outro'];
const EQUIPAMENTOS = ['Nenhum', 'Halteres', 'Elástico', 'Barra fixa', 'Kettlebell', 'Esteira ou bike'];
const DIAS_SEMANA = [[0, 'D'], [1, 'S'], [2, 'T'], [3, 'Q'], [4, 'Q'], [5, 'S'], [6, 'S']]; // exibição começa no domingo
const NOME_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const REGRAS_SEGURAS = `REGRAS FIXAS:
- Fale em português do Brasil, tom de treinador próximo, sem jargão, sem emojis em excesso.
- Nunca sugira dieta restritiva, jejum, nem fale de peso se a pessoa não tiver meta de peso.
- Respeite limitações informadas. Se houver dor ou lesão, prefira exercícios leves e recomende um profissional.
- Nunca invente números: use só os dados fornecidos.`;

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const isoDe = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function iaGuardado(kind, dia) {
    const { data } = await sb.from('ai_daily').select('content').eq('user_id', state.session.user.id).eq('day', dia).eq('kind', kind).maybeSingle();
    return data ? data.content : null;
}
async function iaGuardar(kind, dia, content) {
    await sb.from('ai_daily').upsert({ user_id: state.session.user.id, day: dia, kind, content }, { onConflict: 'user_id,day,kind' });
}
async function iaJSON(prompt) {
    const txt = await callAI(prompt + '\n\nResponda SOMENTE com JSON válido, sem texto antes ou depois e sem crases.');
    const m = String(txt).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Resposta da IA sem JSON');
    return JSON.parse(m[0]);
}

// Lacunas calculadas pelo app com dados reais (a IA só usa, não inventa)
async function calcularLacunas() {
    const uid = state.session.user.id;
    const desde = new Date(Date.now() - 42 * 86400000).toISOString();
    const [{ data: treinos }, { data: sonos }, { data: tudo }] = await Promise.all([
        sb.from('posts').select('created_at, activity_type, duration_min, distance_km, muscle_groups, effort')
            .eq('user_id', uid).eq('kind', 'workout').gte('created_at', desde).order('created_at', { ascending: false }),
        sb.from('sleep_logs').select('slept_on, hours').eq('user_id', uid).order('slept_on', { ascending: false }).limit(3),
        sb.from('posts').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
    ]);
    const t = treinos || [];
    const agora = Date.now();
    const diasDesde = f => { const x = t.find(f); return x ? Math.floor((agora - new Date(x.created_at)) / 86400000) : null; };
    const SUP = ['Peito', 'Costas', 'Ombros', 'Braços'], INF = ['Pernas', 'Glúteos'];
    const tem = (p, lista) => Array.isArray(p.muscle_groups) && (p.muscle_groups.includes('Corpo todo') || categoriasMusculares(p.muscle_groups).some(g => lista.includes(g)));
    const CARDIO = ['Corrida', 'Caminhada', 'Ciclismo', 'Natação', 'Futebol', 'Dança'];
    // dias seguidos treinando até ontem/hoje
    const diasTreino = new Set(t.map(p => new Date(p.created_at).toDateString()));
    let seguidos = 0;
    for (let i = 0; i < 14; i++) { if (diasTreino.has(new Date(agora - i * 86400000).toDateString())) seguidos++; else if (i > 0) break; }
    const semanas = [0, 1, 2, 3, 4, 5].map(w => new Set(t.filter(p => { const d = (agora - new Date(p.created_at)) / 86400000; return d >= w * 7 && d < (w + 1) * 7; }).map(p => new Date(p.created_at).toDateString())).size);
    const mediaAntes = (semanas[2] + semanas[3] + semanas[4] + semanas[5]) / 4;
    const recente = (semanas[0] + semanas[1]) / 2;
    const horas = (sonos || []).map(x => Number(x.hours)).filter(Boolean);
    const contagemTipos = {};
    t.forEach(p => { contagemTipos[p.activity_type || 'Treino'] = (contagemTipos[p.activity_type || 'Treino'] || 0) + 1; });
    return {
        forca: diasDesde(p => p.activity_type === 'Musculação'),
        superior: diasDesde(p => tem(p, SUP)),
        inferior: diasDesde(p => tem(p, INF)),
        cardio: diasDesde(p => CARDIO.includes(p.activity_type)),
        seguidos,
        ultimosEsforcos: t.slice(0, 3).map(p => p.effort).filter(Boolean),
        sonoMedio: horas.length ? Math.round(horas.reduce((a, b) => a + b, 0) / horas.length * 10) / 10 : null,
        semanas, mediaAntes, recente,
        diasSemRegistro: tudo && tudo[0] ? Math.floor((agora - new Date(tudo[0].created_at)) / 86400000) : null,
        tipos: contagemTipos,
        treinouHoje: diasTreino.has(new Date().toDateString()),
    };
}
function precisaDescanso(l) {
    const puxados = l.ultimosEsforcos.filter(e => e === 'puxado').length;
    return l.seguidos >= 5 || (l.seguidos >= 3 && l.sonoMedio != null && l.sonoMedio < 6) || puxados >= 2;
}
function perfilTreinoTexto(p) {
    const L = [];
    const obj = OBJETIVOS.find(o => o[0] === p.goal);
    if (obj) L.push(`Objetivo: ${obj[1]} (${obj[2]})`);
    if (p.goal_details) L.push(`Nas palavras dela: ${p.goal_details}`);
    if (p.training_level) L.push(`Nível: ${(NIVEIS.find(n => n[0] === p.training_level) || [])[1]}`);
    if (Array.isArray(p.training_place) && p.training_place.length) L.push(`Onde treina: ${p.training_place.join(', ')}`);
    if (Array.isArray(p.train_likes) && p.train_likes.length) L.push(`Gosta de: ${p.train_likes.join(', ')}`);
    if (p.train_avoid) L.push(`Prefere evitar: ${p.train_avoid}`);
    if (p.train_minutes) L.push(`Tempo por treino: ${p.train_minutes} min`);
    if (Array.isArray(p.train_equipment) && p.train_equipment.length) L.push(`Equipamento em casa: ${p.train_equipment.join(', ')}`);
    if (p.train_limits) L.push(`Limitações: ${p.train_limits}`);
    L.push(`Meta: ${p.weekly_goal || 3} treinos por semana`);
    return L.join('\n');
}
function lacunasTexto(l) {
    const f = (n, nome) => n == null ? `${nome}: nenhum registro nas últimas 6 semanas` : `${nome}: há ${n} dias`;
    const tipos = Object.entries(l.tipos).map(([k, v]) => `${k} ${v}x`).join(', ') || 'nenhum';
    return [
        f(l.forca, 'Último treino de força'), f(l.superior, 'Último treino de membros superiores'),
        f(l.inferior, 'Último treino de membros inferiores'), f(l.cardio, 'Último cardio'),
        `Dias seguidos treinando: ${l.seguidos}`, `Sono médio das últimas noites: ${l.sonoMedio ?? 'sem registro'} h`,
        `Esforço dos últimos treinos: ${l.ultimosEsforcos.join(', ') || 'sem registro'}`,
        `Treinos nas últimas 6 semanas por tipo: ${tipos}`,
    ].join('\n');
}

// ---------- Treino do dia ----------
async function obterTreinoDoDia(forcar = false, trocarDe = null) {
    const p = state.profile;
    const dia = hojeISO();
    let atual = await iaGuardado('treino', dia);
    if (atual && !forcar && !state.iaTreinoForcar) return atual;
    state.iaTreinoForcar = false;
    const l = await calcularLacunas();
    const leve = precisaDescanso(l);
    const trocas = atual ? (atual.trocas || 0) : 0;
    const prompt = `Você é o coach do app Pulso. Monte o treino de HOJE (${NOME_DIA[new Date().getDay()]}) pra esta pessoa.

PERFIL:
${perfilTreinoTexto(p)}

HISTÓRICO REAL (calculado pelo app):
${lacunasTexto(l)}

COMO DECIDIR:
- Use o que a pessoa gosta como base, mas encaixe o que está faltando no jeito mais próximo do gosto dela. Ex: quem gosta de correr e está sem força recebe força pensada pra corredor; quem só treina pernas recebe superior.
- Referência de equilíbrio: força pelo menos 2x por semana, todos os grupos musculares ao longo da semana, cardio regular.
- ${leve ? 'HOJE É DIA LEVE: sequência longa, sono curto ou esforço alto recente. Sugira mobilidade, alongamento ou cardio bem leve, curto.' : 'Pode ser um treino normal, na duração que a pessoa tem disponível.'}
- Ajuste ao nível, ao local e ao equipamento. Sem equipamento, use peso do corpo.
${trocarDe ? `- A pessoa pediu pra TROCAR a sugestão "${trocarDe}". Proponha algo diferente, mantendo o equilíbrio.` : ''}
${REGRAS_SEGURAS}

Formato do JSON:
{"titulo": "curto, ex: Corrida leve + força pra corredor", "tipo": "um destes: ${TIPOS_TREINO.join(', ')}", "minutos": número, "porque": "uma frase explicando a escolha, citando o gosto e a lacuna", "leve": ${leve}, "blocos": [{"nome": "ex: Aquecimento", "itens": ["exercício com séries e repetições ou tempo"]}]}`;
    const t = await iaJSON(prompt);
    if (!TIPOS_TREINO.includes(t.tipo)) t.tipo = 'Outro';
    t.minutos = Math.max(10, Math.min(120, parseInt(t.minutos) || p.train_minutes || 30));
    t.trocas = trocarDe ? trocas + 1 : trocas;
    t.status = 'sugerido';
    await iaGuardar('treino', dia, t);
    return t;
}

function treinoDoDiaHTML(t, feitoHoje) {
    if (!t) return '';
    if (t.status === 'pulado') return `<div class="chart-card ia-card ia-mini"><span>Treino de hoje dispensado. Amanhã tem outro.</span><button class="btn-mini" data-act="ia-treino-voltar">Ver mesmo assim</button></div>`;
    const feito = t.status === 'feito' || feitoHoje;
    if (feitoHoje && (state.treinosHoje || []).length) {
        const resumo = state.treinosHoje.map(w => `${escapeHTML(w.activity_type || 'Treino')}${w.duration_min ? ' · ' + w.duration_min + ' min' : ''}`).join(' + ');
        return `<div class="chart-card ia-card ia-feito-card">
            <div class="chart-head"><span class="chart-title">Treino de hoje</span><span class="chart-legend">✓ feito</span></div>
            <div class="ia-treino-titulo">Você já treinou hoje: ${resumo} ✓</div>
            <p class="ia-porque">Mandou bem. Amanhã tem sugestão nova, pensada no que você fez hoje.</p>
        </div>`;
    }
    return `<div class="chart-card ia-card">
        <div class="chart-head"><span class="chart-title">${t.leve ? 'Hoje é dia leve' : 'Seu treino de hoje'}</span><span class="chart-legend">${t.minutos} min</span></div>
        <div class="ia-treino-titulo">${escapeHTML(t.titulo || '')}</div>
        <p class="ia-porque">${escapeHTML(t.porque || '')}</p>
        <details class="ia-blocos">
            <summary>Ver exercícios</summary>
            ${(t.blocos || []).map(b => `<div class="ia-bloco"><b>${escapeHTML(b.nome || '')}</b><ul>${(b.itens || []).map(i => `<li>${escapeHTML(i)}</li>`).join('')}</ul></div>`).join('')}
        </details>
        ${feito ? '<div class="ia-feito">✓ Treino de hoje registrado. Mandou bem.</div>' : `<div class="ia-acoes">
            <button class="btn-ghost btn-xs" data-act="ia-treino-pular">Hoje não</button>
            ${(t.trocas || 0) < 2 ? '<button class="btn-ghost btn-xs" data-act="ia-treino-trocar">Trocar</button>' : ''}
            <button class="btn-primary-sm" data-act="ia-treino-fiz">Fiz esse treino</button>
        </div>`}
    </div>`;
}

// ---------- Plano da semana ----------
function segundaDe(d = new Date()) { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
async function obterPlanoSemana(forcar = false) {
    const seg = isoDe(segundaDe());
    const salvo = await iaGuardado('plano', seg);
    if (salvo && !forcar) return salvo;
    const p = state.profile;
    const l = await calcularLacunas();
    const prompt = `Você é o coach do app Pulso. Monte o plano DESTA semana (segunda a domingo) pra esta pessoa.

PERFIL:
${perfilTreinoTexto(p)}
Dias disponíveis: ${(p.train_days || []).length ? p.train_days.map(n => NOME_DIA[n]).join(', ') : 'não informou, distribua bem'}

HISTÓRICO REAL:
${lacunasTexto(l)}

COMO DECIDIR:
- Exatamente ${p.weekly_goal || 3} dias de treino, nos dias disponíveis. Os outros dias são descanso ou leve.
- Parta do que a pessoa gosta e encaixe o que falta (força, superior, inferior, cardio), sem repetir o mesmo grupo em dias seguidos.
${REGRAS_SEGURAS}

Formato do JSON:
{"resumo": "uma frase sobre o foco da semana", "dias": [{"dia": "segunda", "foco": "ex: Corrida leve 30 min ou Descanso", "minutos": número ou 0, "treino": true ou false}]} com os 7 dias, de segunda a domingo.`;
    const plano = await iaJSON(prompt);
    await iaGuardar('plano', seg, plano);
    return plano;
}
function planoSemanaHTML(plano, diasFeitos) {
    if (!plano || !Array.isArray(plano.dias)) return '';
    const hojeIdx = (new Date().getDay() + 6) % 7;
    return `<div class="chart-card ia-card">
        <div class="chart-head"><span class="chart-title">Seu plano da semana</span><button class="chart-legend ia-link" data-act="ia-plano-refazer">refazer</button></div>
        ${plano.resumo ? `<p class="ia-porque">${escapeHTML(plano.resumo)}</p>` : ''}
        <div class="ia-plano">${plano.dias.slice(0, 7).map((d, i) => {
            const feito = diasFeitos.has(i);
            return `<div class="ia-dia${i === hojeIdx ? ' hoje' : ''}${feito && d.treino ? ' feito' : ''}${d.treino ? '' : ' folga'}">
                <span class="ia-dia-nome">${escapeHTML(String(d.dia || NOME_DIA[(i + 1) % 7]).slice(0, 3))}</span>
                <span class="ia-dia-foco">${escapeHTML(d.foco || '')}</span>
                <span class="ia-dia-check">${feito ? '✓' : ''}</span>
            </div>`;
        }).join('')}</div>
    </div>`;
}

// ---------- Carta da semana ----------
async function obterCartaSemana() {
    const hoje = new Date();
    const alvo = hoje.getDay() === 0 ? segundaDe(hoje) : segundaDe(new Date(Date.now() - 7 * 86400000));
    const chave = isoDe(alvo);
    const salva = await iaGuardado('carta', chave);
    if (salva) return { ...salva, semana: chave };
    // só escreve se a pessoa usou o app naquela semana
    const fim = new Date(alvo.getTime() + 7 * 86400000);
    const { data: posts } = await sb.from('posts').select('kind, activity_type, duration_min, distance_km, effort, created_at')
        .eq('user_id', state.session.user.id).gte('created_at', alvo.toISOString()).lt('created_at', fim.toISOString());
    if (!posts || !posts.length) return null;
    const treinos = posts.filter(x => x.kind === 'workout');
    const dias = new Set(treinos.map(x => new Date(x.created_at).toDateString())).size;
    const resumo = [
        `Dias treinados: ${dias} de meta ${state.profile.weekly_goal || 3}`,
        `Treinos: ${treinos.map(x => `${x.activity_type || 'treino'} ${x.duration_min || 0}min${x.distance_km ? ' ' + x.distance_km + 'km' : ''}${x.effort ? ' (' + x.effort + ')' : ''}`).join('; ') || 'nenhum'}`,
        `Registros de água: ${posts.filter(x => x.kind === 'water').length}`,
        `Refeições registradas: ${posts.filter(x => x.kind === 'meal').length}`,
    ].join('\n');
    const carta = await iaJSON(`Você é o coach do app Pulso. Escreva a carta da semana desta pessoa.

PERFIL:
${perfilTreinoTexto(state.profile)}

SEMANA (dados reais):
${resumo}

${REGRAS_SEGURAS}
Seja específico com os dados, caloroso e direto. Cada campo com UMA frase.
Formato do JSON: {"bem": "o que foi bem", "atencao": "o que merece atenção", "foco": "o foco da próxima semana"}`);
    await iaGuardar('carta', chave, carta);
    return { ...carta, semana: chave };
}
function cartaHTML(carta, anteriores) {
    if (!carta) return '';
    const bloco = c => `<div class="ia-carta-linha"><span>✓</span><p>${escapeHTML(c.bem || '')}</p></div>
        <div class="ia-carta-linha"><span>!</span><p>${escapeHTML(c.atencao || '')}</p></div>
        <div class="ia-carta-linha"><span>→</span><p>${escapeHTML(c.foco || '')}</p></div>`;
    const dataCurta = iso => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `<div class="chart-card ia-card">
        <div class="chart-head"><span class="chart-title">Carta do coach</span><span class="chart-legend">semana de ${dataCurta(carta.semana)}</span></div>
        ${bloco(carta)}
        ${anteriores.length ? `<details class="ia-blocos"><summary>Cartas anteriores</summary>${anteriores.map(a => `<div class="ia-carta-ant"><b>Semana de ${dataCurta(a.day)}</b>${bloco(a.content)}</div>`).join('')}</details>` : ''}
    </div>`;
}

// ---------- Alerta de queda ----------
async function obterAlertaQueda(l) {
    const caiu = (l.mediaAntes >= 1.5 && l.recente < l.mediaAntes * 0.5) || (l.diasSemRegistro != null && l.diasSemRegistro >= 4 && l.mediaAntes >= 1);
    if (!caiu) return null;
    const seg = isoDe(segundaDe());
    const salvo = await iaGuardado('alerta', seg);
    if (salvo) return salvo;
    const a = await iaJSON(`Você é o coach do app Pulso. Esta pessoa diminuiu bastante o ritmo.
Antes: ${l.mediaAntes.toFixed(1)} treinos por semana. Últimas 2 semanas: ${l.recente.toFixed(1)} por semana. Dias sem registrar nada: ${l.diasSemRegistro ?? 0}.
PERFIL:
${perfilTreinoTexto(state.profile)}
${REGRAS_SEGURAS}
Escreva uma mensagem curta e acolhedora, SEM culpa e sem cobrança, perguntando o que mudou e propondo um passo pequeno pra recomeçar (ex: 15 minutos do que a pessoa mais gosta).
Formato do JSON: {"mensagem": "2 frases no máximo", "passo": "o passo pequeno, curto"}`);
    await iaGuardar('alerta', seg, a);
    return a;
}

// ---------- Monta tudo na aba Resumo ----------
async function hydrateIAEvolucao() {
    const slot = document.getElementById('iaSlot');
    if (!slot) return;
    const p = state.profile;
    const semPrefs = !(p.train_likes && p.train_likes.length);
    if (semPrefs) {
        slot.innerHTML = `<div class="chart-card ia-card ia-convite">
            <div class="chart-head"><span class="chart-title">Seu treino de hoje</span></div>
            <p class="ia-porque">Me conta o que você gosta de fazer, quanto tempo tem e onde treina, que eu monto seu treino do dia e o plano da semana.</p>
            <button class="btn-primary-sm" data-act="m-go" data-view="jeito-treino">Contar pro coach</button>
        </div>`;
        return;
    }
    slot.innerHTML = '<div class="chart-card ia-card ia-carregando"><div class="spinner"></div><span>O coach está montando seu dia...</span></div>';
    try {
        const l = await calcularLacunas();
        // treinos de hoje (00:00 às 23:59 do Brasil)
        const ini0 = new Date(); ini0.setHours(0, 0, 0, 0);
        const { data: treinosHoje } = await sb.from('posts').select('activity_type, duration_min')
            .eq('user_id', state.session.user.id).eq('kind', 'workout').gte('created_at', ini0.toISOString());
        state.treinosHoje = treinosHoje || [];
        if (state.treinosHoje.length) l.treinouHoje = true;
        const seg = segundaDe();
        const { data: semTreinos } = await sb.from('posts').select('created_at').eq('user_id', state.session.user.id)
            .eq('kind', 'workout').gte('created_at', new Date(seg.getTime() - 12 * 3600000).toISOString());
        const diasFeitos = new Set((semTreinos || []).map(x => (new Date(x.created_at).getDay() + 6) % 7));
        const [treino, plano, alerta, carta, { data: antigas }] = await Promise.all([
            obterTreinoDoDia().catch(e => { console.warn('treino do dia', e); return null; }),
            obterPlanoSemana().catch(e => { console.warn('plano', e); return null; }),
            obterAlertaQueda(l).catch(() => null),
            obterCartaSemana().catch(e => { console.warn('carta', e); return null; }),
            sb.from('ai_daily').select('day, content').eq('user_id', state.session.user.id).eq('kind', 'carta').order('day', { ascending: false }).limit(5),
        ]);
        state.iaTreino = treino;
        if (!document.getElementById('iaSlot')) return;
        const anteriores = (antigas || []).filter(a => !carta || a.day !== carta.semana).slice(0, 4);
        slot.innerHTML = [
            alerta && alerta.mensagem ? `<div class="chart-card ia-card ia-alerta"><div class="chart-head"><span class="chart-title">Tudo bem por aí?</span></div><p>${escapeHTML(alerta.mensagem || '')}</p>${alerta.passo ? `<p class="ia-passo">${escapeHTML(alerta.passo)}</p>` : ''}</div>` : '',
            treinoDoDiaHTML(treino, l.treinouHoje),
            planoSemanaHTML(plano, diasFeitos),
            cartaHTML(carta, anteriores),
        ].join('') || '';
    } catch (e) {
        console.warn('coach evolução', e);
        slot.innerHTML = '';
    }
}

// ---------- Previsão da semana (no anel) ----------
function previsaoSemanaTexto(dias, meta, mediaSemanal) {
    const idx = (new Date().getDay() + 6) % 7; // 0 = segunda
    if (idx < 2 || dias >= meta) return '';
    const restam = 6 - idx; // dias depois de hoje
    const ritmoDia = Math.max(dias / (idx + 1), (mediaSemanal || 0) / 7);
    const prev = Math.min(7, Math.round(dias + ritmoDia * (restam + 1)));
    if (prev >= meta) return `No seu ritmo, você fecha a semana na meta.`;
    return `No seu ritmo, você fecha com ${prev} de ${meta}. ${restam >= meta - dias ? 'Um treino amanhã muda isso.' : 'Ainda dá pra chegar perto.'}`;
}

// ---------- Registro por texto ou voz ----------
async function interpretarRegistro(texto) {
    const r = await iaJSON(`Transforme o que a pessoa escreveu num registro do app Pulso.
Texto: "${texto.replace(/"/g, "'")}"
Tipos: "workout" (treino), "water" (água), "sleep" (sono), "meal" (refeição).
Formato do JSON: {"kind": "workout|water|sleep|meal", "activity_type": "um destes: ${TIPOS_TREINO.join(', ')}", "duration_min": número ou null, "distance_km": número ou null, "water_ml": número ou null, "sleep_hours": número ou null, "legenda": "texto curto opcional ou null"}
Se não der pra entender, use {"kind": null}.`);
    return r;
}

// ---------- Narração do desafio ----------
async function hydrateNarracaoDesafio(ch, ranking) {
    const slot = document.getElementById('chNarracao');
    if (!slot || !ranking || ranking.length < 2 || ch.status !== 'ativo') return;
    const chave = 'narr:' + ch.id;
    let n = await iaGuardado(chave, hojeISO());
    if (!n) {
        const eu = ranking.findIndex(r => r.user_id === state.session.user.id);
        const top = ranking.slice(0, 5).map((r, i) => `${i + 1}º ${String(r.display_name || '').split(' ')[0]}: ${Math.round(r.points)} pts`).join('; ');
        const fim = Math.ceil((new Date(ch.ends_at) - Date.now()) / 86400000);
        try {
            n = await iaJSON(`Você narra o desafio "${ch.name}" do app Pulso, como um locutor animado mas respeitoso.
Ranking atual: ${top}. Participantes: ${ranking.length}. Faltam ${fim} dias.
Quem está lendo: ${eu >= 0 ? `${eu + 1}º lugar com ${Math.round(ranking[eu].points)} pts` : 'não está no ranking'}${eu > 0 ? `, a ${Math.round(ranking[eu - 1].points - ranking[eu].points)} pts de quem está na frente` : ''}.
Nunca humilhe ninguém. Use só primeiros nomes e só os dados acima.
Formato do JSON: {"texto": "2 frases no máximo, falando com quem está lendo no fim"}`);
            await iaGuardar(chave, hojeISO(), n);
        } catch (e) { return; }
    }
    if (document.getElementById('chNarracao')) slot.innerHTML = `<div class="ia-narracao">🎙️ ${escapeHTML(n.texto || '')}</div>`;
}

// ---------- Check-in pós-treino ----------
function perguntarEsforco(postId) {
    const old = document.getElementById('esforcoSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'esforcoSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Como foi o treino?</h3>
        <p class="sheet-sub">Isso ajuda o coach a ajustar o próximo.</p>
        <div class="esforco-opcoes">
            <button data-esf="leve">😌<span>Leve</span></button>
            <button data-esf="bom">💪<span>Bom</span></button>
            <button data-esf="puxado">🥵<span>Puxado</span></button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.onclick = e => { if (e.target === sheet) sheet.remove(); };
    sheet.querySelectorAll('[data-esf]').forEach(b => b.onclick = async () => {
        sheet.remove();
        await sb.rpc('set_workout_effort', { pid: postId, esforco: b.dataset.esf });
        // treino feito: marca o treino do dia
        const t = await iaGuardado('treino', hojeISO());
        if (t && t.status !== 'feito') { t.status = 'feito'; await iaGuardar('treino', hojeISO(), t); }
    });
}

// ============================================================
// EVOLUÇÃO: período, comparações e gráficos novos
// ============================================================
const DIA_MS = 86400000;
const PERIODOS = [['7', '7 dias', 7], ['30', '30 dias', 30], ['90', '3 meses', 90], ['tudo', 'Tudo', null]];
const num1 = n => String(Math.round(n * 10) / 10).replace('.', ',');
const diaChave = d => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };

function montarEvolucao(d) {
    const agora = Date.now();
    // Primeiro registro de qualquer tipo = início do histórico
    const datas = [
        ...(d.meusPosts || []).map(p => +new Date(p.created_at)),
        ...(d.sonos || []).map(x => +new Date(x.slept_on + 'T12:00:00')),
        ...(d.weightPoints || []).map(p => +p.x),
    ].filter(Boolean);
    const inicioHist = datas.length ? Math.min(...datas) : agora;
    const diasHist = Math.max(1, Math.ceil((agora - inicioHist) / DIA_MS));

    // Períodos só aparecem quando há histórico pra preencher
    const disponiveis = PERIODOS.filter(([k, , n]) => k === '7' || k === 'tudo' || (k === '30' && diasHist >= 14) || (k === '90' && diasHist >= 45));
    if (!state.periodo || !disponiveis.some(p => p[0] === state.periodo)) state.periodo = diasHist >= 14 ? '30' : '7';
    const per = PERIODOS.find(p => p[0] === state.periodo);
    const nDias = per[2] || diasHist;
    const desde = per[2] ? agora - nDias * DIA_MS : inicioHist;
    const desdeAnt = desde - nDias * DIA_MS;
    const noPer = t => t >= desde && t <= agora;
    const noAnt = t => t >= desdeAnt && t < desde;
    const temAnterior = per[2] && inicioHist <= desde - DIA_MS;

    const periodosHTML = `<div class="periodos">${disponiveis.map(([k, nome]) =>
        `<button class="periodo${k === state.periodo ? ' on' : ''}" data-act="set-periodo" data-p="${k}">${nome}</button>`).join('')}</div>`;

    // ---- números do topo, com comparação ----
    const treinos = (d.meusPosts || []).filter(p => p.kind === 'workout');
    const tIn = treinos.filter(p => noPer(+new Date(p.created_at))), tAnt = treinos.filter(p => noAnt(+new Date(p.created_at)));
    const diasDe = l => new Set(l.map(p => diaChave(p.created_at))).size;
    const minDe = l => l.reduce((t, p) => t + (p.duration_min || 0), 0);
    const pts = (d.ledger || []);
    const ptsDe = f => Math.round(pts.filter(x => f(+new Date(x.earned_at))).reduce((t, x) => t + Number(x.amount || 0), 0));
    const comp = (a, b) => {
        if (!temAnterior) return '';
        const dif = a - b;
        if (dif === 0) return '<div class="sub">igual ao período anterior</div>';
        return `<div class="sub ${dif > 0 ? 'sobe' : 'desce'}">${dif > 0 ? '+' : '−'}${Math.abs(dif)} vs anterior</div>`;
    };
    const mins = minDe(tIn);
    const statsHTML = `<div class="stat-grid">
        <div class="stat-card"><div class="num">${ptsDe(noPer)}</div><div class="lbl">Pontos no período</div>${comp(ptsDe(noPer), ptsDe(noAnt))}</div>
        <div class="stat-card"><div class="num">${diasDe(tIn)}</div><div class="lbl">Dias treinados</div>${comp(diasDe(tIn), diasDe(tAnt))}</div>
        <div class="stat-card"><div class="num">${mins >= 60 ? Math.floor(mins / 60) + 'h' + (mins % 60 ? String(mins % 60).padStart(2, '0') : '') : mins + ' min'}</div><div class="lbl">Tempo treinando</div>${comp(mins, minDe(tAnt))}</div>
        <div class="stat-card"><div class="num">${d.streak?.current_streak || 0}</div><div class="lbl">Ofensiva</div><div class="sub">Recorde: ${d.streak?.longest_streak || 0}</div></div>
    </div>`;

    // ---- calendário de constância (a partir do primeiro dia de uso) ----
    const porDia = {};
    const marca = (t, tipo) => { const k = diaChave(t); (porDia[k] = porDia[k] || new Set()).add(tipo); };
    (d.meusPosts || []).forEach(p => marca(p.created_at, p.kind));
    (d.sonos || []).forEach(x => marca(x.slept_on + 'T12:00:00', 'sleep'));
    const iniCal = new Date(Math.max(inicioHist, desde)); iniCal.setHours(0, 0, 0, 0);
    iniCal.setDate(iniCal.getDate() - ((iniCal.getDay() + 6) % 7)); // começa na segunda
    const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
    const semanasCal = [];
    for (let w = new Date(iniCal); w <= hoje0; w = new Date(w.getTime() + 7 * DIA_MS)) {
        const col = [];
        for (let i = 0; i < 7; i++) {
            const dia = new Date(w.getTime() + i * DIA_MS);
            if (dia > hoje0 || +dia < new Date(inicioHist).setHours(0, 0, 0, 0)) { col.push('<span class="cal-d fora"></span>'); continue; }
            const tipos = porDia[diaChave(dia)] || new Set();
            const n = tipos.size;
            const nomes = { workout: 'treino', water: 'água', meal: 'refeição', sleep: 'sono', weight: 'peso' };
            const lista = [...tipos].map(t => nomes[t]).filter(Boolean).join(', ');
            const tip = `${dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}: ${n ? lista : 'nada registrado'}`;
            col.push(`<span class="cal-d n${Math.min(4, n)}${tipos.has('workout') ? ' treino' : ''} tip-hit" data-tip="${tip}"></span>`);
        }
        semanasCal.push(`<div class="cal-col">${col.join('')}</div>`);
    }
    const diasAtivos = Object.keys(porDia).filter(k => { const [a, m, dd] = k.split('-').map(Number); return noPer(+new Date(a, m, dd, 12)); }).length;
    const calendarioHTML = `<div id="calMesSlot"><div class="chart-card cal-mes"><div class="spinner"></div></div></div>`;

    // ---- peso: período, tendência e projeção até o prazo ----
    const pesos = (d.weightPoints || []).filter(p => noPer(+p.x));
    let tendencia = null;
    if (pesos.length >= 4) {
        const alfa = 0.35; let m = pesos[0].y;
        tendencia = pesos.map(p => { m = alfa * p.y + (1 - alfa) * m; return { x: p.x, y: m }; });
    }
    let projecaoLinha = null;
    const pj = d.projecao && d.projecao.peso;
    // Simulador: cenários com base nos seus próprios dados (nada inventado)
    let cenariosHTML = '';
    if (pj && !pj.chegou && (d.weightPoints || []).length >= 2) {
        const todos = [...d.weightPoints].sort((a, b) => a.x - b.x);
        const querPerder = pj.falta < 0;
        let melhor = null;
        for (let i = 0; i < todos.length; i++) {
            for (let j = i + 1; j < todos.length; j++) {
                const sem = (todos[j].x - todos[i].x) / (7 * DIA_MS);
                if (sem < 3 || sem > 6) continue;
                const r = (todos[j].y - todos[i].y) / sem;
                if (querPerder ? (r < 0 && (melhor == null || r < melhor)) : (r > 0 && (melhor == null || r > melhor))) melhor = r;
            }
        }
        const cen = {
            atual: pj.ritmo && Math.sign(pj.ritmo) === Math.sign(pj.falta) ? pj.ritmo : null,
            prazo: pj.precisa,
            melhor,
        };
        const nomes = { atual: 'No ritmo atual', prazo: 'Pra chegar no prazo', melhor: 'Suas melhores semanas' };
        const disp = Object.keys(cen).filter(k => cen[k] != null && Math.abs(cen[k]) > 0.02);
        if (!disp.includes(state.cenario)) state.cenario = disp[0];
        const escolhido = cen[state.cenario];
        const ult = todos[todos.length - 1];
        if (escolhido) {
            const semanasAte = Math.abs(pj.falta / escolhido);
            if (semanasAte < 104) {
                const chegada = new Date(+ult.x + semanasAte * 7 * DIA_MS);
                projecaoLinha = { de: { x: ult.x, y: ult.y }, ate: { x: chegada, y: pj.meta } };
                const data = chegada.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                const txt = {
                    atual: `No seu ritmo das últimas semanas (${escolhido > 0 ? '+' : '−'}${kgTxt(escolhido)} kg por semana), você chega em ${data}.`,
                    prazo: `Pra bater o prazo, o ritmo precisa ser ${escolhido > 0 ? '+' : '−'}${kgTxt(escolhido)} kg por semana.`,
                    melhor: `Se repetir suas melhores semanas (${escolhido > 0 ? '+' : '−'}${kgTxt(escolhido)} kg por semana), você chega em ${data}.`,
                }[state.cenario];
                cenariosHTML = `<div class="cenarios">${disp.map(k => `<button class="periodo${k === state.cenario ? ' on' : ''}" data-act="set-cenario" data-c="${k}">${nomes[k]}</button>`).join('')}</div>
                    <p class="cenario-txt">${txt}</p>`;
            }
        }
    }
    const deltaPer = pesos.length >= 2 ? pesos[pesos.length - 1].y - pesos[0].y : null;
    const pesoHTML = `<div class="chart-card">
        <div class="chart-head"><span class="chart-title">Peso</span>${deltaPer != null && Math.abs(deltaPer) >= 0.1 ? `<span class="chart-delta ${deltaPer < 0 ? 'down' : 'up'}">${deltaPer < 0 ? '−' : '+'}${num1(Math.abs(deltaPer))} kg</span>` : ''}</div>
        ${lineChart(pesos, { id: 'w', goal: d.goal.meta ? Number(d.goal.meta) : null, unit: 'kg', decimals: 1, trend: tendencia, projecao: projecaoLinha,
            vazio: { min: 2, msg: pesos.length ? 'Registre seu peso mais uma vez pra ver sua linha de evolução.' : 'Registre seu peso pra começar a acompanhar a evolução.', act: 'm-peso', label: 'Registrar peso' } })}
        ${tendencia || projecaoLinha ? `<div class="chart-leg">${tendencia ? '<span><i class="leg-trend"></i>tendência</span>' : ''}${projecaoLinha ? '<span><i class="leg-proj"></i>simulação até a meta</span>' : ''}</div>` : ''}
        ${cenariosHTML}
    </div>`;

    // ---- dias treinados por semana (no período) ----
    const semanasPer = (d.aSeries || []).filter(r => +new Date(r.week_start + 'T12:00:00') >= desde - 6 * DIA_MS);
    const actBars = semanasPer.slice(-12).map(r => {
        const dd = new Date(r.week_start + 'T12:00:00');
        return { label: dd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: r.days_trained, tip: `Semana de ${dd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: ${r.days_trained} dias, ${r.total_min || 0} min` };
    });
    const atividadeHTML = nDias >= 14 ? `<div class="chart-card">
        <div class="chart-head"><span class="chart-title">Dias treinados por semana</span><span class="chart-legend">meta: ${d.weeklyGoal}</span></div>
        ${barChart(actBars, { goal: d.weeklyGoal, vazio: { msg: 'Nenhum treino nesse período ainda.', act: 'quick-kind', extra: ' data-kind="workout"', label: 'Registrar treino' } })}
    </div>` : '';

    // ---- treinos por tipo ----
    const porTipo = {};
    tIn.forEach(p => { const k = p.activity_type || 'Outro'; porTipo[k] = (porTipo[k] || 0) + (p.duration_min || 0); });
    const tipos = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);
    const maxTipo = tipos.length ? tipos[0][1] : 1;
    const tiposHTML = tipos.length ? `<div class="chart-card">
        <div class="chart-head"><span class="chart-title">Seus treinos por tipo</span><span class="chart-legend">em minutos</span></div>
        <div class="hbars">${tipos.map(([t, m]) => `<div class="hbar tip-hit" data-tip="${escapeHTML(t)}: ${m} min em ${tIn.filter(p => (p.activity_type || 'Outro') === t).length} treinos">
            <span class="hbar-nome">${escapeHTML(t)}</span>
            <span class="hbar-trilho"><i style="width:${Math.max(4, Math.round(m / maxTipo * 100))}%"></i></span>
            <span class="hbar-val">${m}</span>
        </div>`).join('')}</div>
    </div>` : '';

    // ---- cardio ----
    const cardios = tIn.filter(p => Number(p.distance_km) > 0);
    let cardioHTML = '';
    if (cardios.length) {
        const km = cardios.reduce((t, p) => t + Number(p.distance_km), 0);
        const corridas = cardios.filter(p => p.activity_type === 'Corrida' && p.duration_min);
        const paceMin = corridas.map(p => ({ x: new Date(p.created_at), y: p.duration_min / Number(p.distance_km) }));
        const melhor = paceMin.length ? Math.min(...paceMin.map(p => p.y)) : null;
        const fmtPace = v => `${Math.floor(v)}'${String(Math.round((v % 1) * 60)).padStart(2, '0')}"`;
        const maior = Math.max(...cardios.map(p => Number(p.distance_km)));
        cardioHTML = `<div class="chart-card">
            <div class="chart-head"><span class="chart-title">Cardio</span><span class="chart-legend">${cardios.length} ${cardios.length === 1 ? 'treino' : 'treinos'} com distância</span></div>
            <div class="mini-stats">
                <div><b>${num1(km)} km</b><span>no período</span></div>
                <div><b>${num1(maior)} km</b><span>mais longo</span></div>
                ${melhor ? `<div><b>${fmtPace(melhor)}</b><span>melhor ritmo /km</span></div>` : ''}
            </div>
            ${paceMin.length >= 2 ? `<div class="chart-sub">Ritmo da corrida (min/km, quanto menor melhor)</div>${lineChart(paceMin, { id: 'pace', unit: 'min/km', decimals: 1 })}` : ''}
        </div>`;
    }

    // ---- equilíbrio muscular ----
    const GRUPOS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Glúteos'];
    const muscu = treinos.filter(p => p.activity_type === 'Musculação' && Array.isArray(p.muscle_groups) && p.muscle_groups.length);
    let musculosHTML = '';
    if (muscu.length) {
        const ultimo = {}, qtd = {};
        muscu.forEach(p => {
            const gs = p.muscle_groups.includes('Corpo todo') ? GRUPOS : categoriasMusculares(p.muscle_groups);
            gs.forEach(g => { ultimo[g] = Math.max(ultimo[g] || 0, +new Date(p.created_at)); if (noPer(+new Date(p.created_at))) qtd[g] = (qtd[g] || 0) + 1; });
        });
        musculosHTML = `<div class="chart-card">
            <div class="chart-head"><span class="chart-title">Equilíbrio muscular</span><span class="chart-legend">treinos no período</span></div>
            <div class="musc-lista">${GRUPOS.map(g => {
                const dias = ultimo[g] ? Math.floor((agora - ultimo[g]) / DIA_MS) : null;
                const cls = dias == null ? 'nunca' : dias > 10 ? 'alerta' : dias > 6 ? 'atencao' : 'ok';
                return `<div class="musc ${cls}"><span class="musc-nome">${g}</span><span class="musc-qtd">${qtd[g] || 0}x</span><span class="musc-dias">${dias == null ? 'nunca registrado' : dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}</span></div>`;
            }).join('')}</div>
        </div>`;
    }

    // ---- nota das refeições ----
    const refeicoes = (d.meusPosts || []).filter(p => p.kind === 'meal' && p.meal_score != null && noPer(+new Date(p.created_at)));
    let refeicoesHTML = '';
    if (refeicoes.length >= 3) {
        const semanaDe = t => { const x = new Date(t); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return +x; };
        const porSem = {};
        refeicoes.forEach(p => { const k = semanaDe(p.created_at); (porSem[k] = porSem[k] || []).push(Number(p.meal_score)); });
        const linha = Object.entries(porSem).sort((a, b) => a[0] - b[0]).map(([k, v]) => ({ x: new Date(Number(k)), y: v.reduce((a, b) => a + b, 0) / v.length }));
        const NOMES = { cafe: 'Café da manhã', almoco: 'Almoço', jantar: 'Jantar', lanche: 'Lanche' };
        const porSlot = {};
        refeicoes.forEach(p => { if (p.meal_slot) (porSlot[p.meal_slot] = porSlot[p.meal_slot] || []).push(Number(p.meal_score)); });
        const medias = Object.entries(porSlot).filter(([, v]) => v.length >= 2).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => a[1] - b[1]);
        const media = refeicoes.reduce((t, p) => t + Number(p.meal_score), 0) / refeicoes.length;
        refeicoesHTML = `<div class="chart-card">
            <div class="chart-head"><span class="chart-title">Nota das refeições</span><span class="chart-legend">média ${num1(media)}/10</span></div>
            ${linha.length >= 2 ? lineChart(linha, { id: 'meal', unit: '/10', decimals: 1 }) : ''}
            ${medias.length >= 2 ? `<div class="chart-foot">Melhor: ${NOMES[medias[medias.length - 1][0]]} (${num1(medias[medias.length - 1][1])}) · Pede atenção: ${NOMES[medias[0][0]]} (${num1(medias[0][1])})</div>` : ''}
        </div>`;
    }

    // ---- pontos por semana ----
    const ptsBars = (d.pSeries || []).filter(r => +new Date(r.week_start + 'T12:00:00') >= desde - 6 * DIA_MS).slice(-12).map(r => {
        const dd = new Date(r.week_start + 'T12:00:00');
        return { label: dd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Math.round(Number(r.pts)) };
    });
    const pontosHTML = nDias >= 14 ? `<div class="chart-card"><div class="chart-head"><span class="chart-title">Pontos por semana</span></div>${barChart(ptsBars, { unit: 'pts' })}</div>` : '';

    // ---- cintura ----
    const cint = (d.mSeries || []).filter(r => r.cintura != null).map(r => ({ x: new Date(r.d + 'T12:00:00'), y: Number(r.cintura) })).filter(p => noPer(+p.x));
    const cinturaHTML = cint.length ? `<div class="chart-card"><div class="chart-head"><span class="chart-title">Cintura</span></div>${lineChart(cint, { id: 'c', unit: 'cm', decimals: 1 })}</div>` : '';

    // ---- recordes pessoais (de todo o histórico) ----
    const rec = [];
    if (d.streak?.longest_streak) rec.push(['🔥', `${d.streak.longest_streak} dias`, 'maior ofensiva']);
    const melhorSem = (d.aSeries || []).reduce((m, r) => (r.days_trained > (m ? m.days_trained : 0) ? r : m), null);
    if (melhorSem && melhorSem.days_trained) rec.push(['📅', `${melhorSem.days_trained} treinos`, `melhor semana (${new Date(melhorSem.week_start + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`]);
    const longo = treinos.reduce((m, p) => ((p.duration_min || 0) > (m ? m.duration_min : 0) ? p : m), null);
    if (longo) rec.push(['⏱️', `${longo.duration_min} min`, `treino mais longo (${escapeHTML(longo.activity_type || 'treino')})`]);
    const dist = treinos.reduce((m, p) => (Number(p.distance_km || 0) > (m ? Number(m.distance_km) : 0) ? p : m), null);
    if (dist) rec.push(['🏃', `${num1(Number(dist.distance_km))} km`, `maior distância (${escapeHTML(dist.activity_type || '')})`]);
    const recordesHTML = rec.length ? `<div class="chart-card">
        <div class="chart-head"><span class="chart-title">Seus recordes</span><span class="chart-legend">de todos os tempos</span></div>
        <div class="recordes">${rec.map(([e, v, l]) => `<div class="recorde"><span class="rec-emo">${e}</span><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    </div>` : '';

    // ---- resumo que se adapta ao tempo de uso: semana, mês ou ano ----
    let mesHTML = '';
    state.resumoMes = null;
    if (diasHist >= 7) {
        const hojeD = new Date();
        const mes = hojeD.getMonth(), diaM = hojeD.getDate();
        let iniR, fimR = agora, titulo, legenda, rotuloCard;
        const nomeMesDe = dt => dt.toLocaleDateString('pt-BR', { month: 'long' });
        const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
        if ((mes === 11 && diaM >= 15) || (mes === 0 && diaM <= 10)) {
            const ano = mes === 0 ? hojeD.getFullYear() - 1 : hojeD.getFullYear();
            iniR = +new Date(ano, 0, 1); fimR = mes === 0 ? +new Date(ano + 1, 0, 1) : agora;
            titulo = `Meu ${ano}`; rotuloCard = `Seu ${ano}`; legenda = 'retrospectiva do ano';
        } else if (diasHist < 30) {
            iniR = agora - 7 * DIA_MS;
            titulo = 'Minha semana'; rotuloCard = 'Sua semana'; legenda = 'últimos 7 dias';
        } else if (diaM <= 5) {
            const a = new Date(hojeD.getFullYear(), mes - 1, 1);
            iniR = +a; fimR = +new Date(hojeD.getFullYear(), mes, 1);
            titulo = `Meu ${nomeMesDe(a)}`; rotuloCard = `Seu ${nomeMesDe(a)}`; legenda = 'mês fechado';
        } else {
            iniR = +new Date(hojeD.getFullYear(), mes, 1);
            titulo = `Meu ${nomeMesDe(hojeD)}`; rotuloCard = 'Seu mês'; legenda = `${nomeMesDe(hojeD)} até agora`;
        }
        const noR = t => t >= iniR && t < fimR;
        const tR = treinos.filter(p => noR(+new Date(p.created_at)));
        const kmR = tR.reduce((t, p) => t + Number(p.distance_km || 0), 0);
        const minR = minDe(tR);
        const contagem = {};
        tR.forEach(p => { const k = p.activity_type || 'Treino'; contagem[k] = (contagem[k] || 0) + 1; });
        const maisFeito = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
        const sonoR = (d.sonos || []).filter(x => noR(+new Date(x.slept_on + 'T12:00:00'))).map(x => Number(x.hours));
        const diasR = Math.max(1, Math.ceil((Math.min(fimR, agora) - iniR) / DIA_MS));
        const aguaR = (d.meusPosts || []).filter(x => x.kind === 'water' && noR(+new Date(x.created_at))).reduce((t, x) => t + (x.water_ml || 0), 0);
        const candidatos = candidatosResumo({
            dias: diasDe(tR), meta: null, maisFeito, km: kmR,
            ofensiva: d.streak && d.streak.current_streak,
            minutos: minR, aguaMedia: aguaR ? aguaR / diasR : 0,
            refeicoesBoas: (d.meusPosts || []).filter(x => x.kind === 'meal' && Number(x.meal_score) >= 7 && noR(+new Date(x.created_at))).length,
            sono: sonoR.length ? sonoR.reduce((a, b) => a + b, 0) / sonoR.length : null,
            pontos: ptsDe(noR),
        });
        const itens = candidatos.filter(c => c.padrao).map(c => [c.valor, c.rotulo]);
        if (tR.length) {
            state.resumoMes = { titulo, subtitulo: cap(legenda), candidatos };
            mesHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">${rotuloCard}</span><span class="chart-legend">${legenda}</span></div>
                <div class="mini-stats">${itens.map(([v, l]) => `<div><b>${escapeHTML(v)}</b><span>${escapeHTML(l)}</span></div>`).join('')}</div>
                <button class="btn-secondary resumo-story" data-act="mes-story">Postar como story</button>
            </div>`;
        }
    }

    // ---- água: média por dia no período ----
    const porDiaAguaPer = {};
    (d.meusPosts || []).filter(p => p.kind === 'water' && noPer(+new Date(p.created_at))).forEach(p => {
        const k = diaChave(p.created_at); porDiaAguaPer[k] = (porDiaAguaPer[k] || 0) + (p.water_ml || 0);
    });
    const diasAguaBase = Math.max(1, Math.min(nDias, diasHist));
    const totalAguaPer = Object.values(porDiaAguaPer).reduce((a, b) => a + b, 0);
    const aguaMediaTxt = totalAguaPer
        ? `Média no período: <b>${formatLitros(Math.round(totalAguaPer / diasAguaBase))}</b> por dia · registrou em ${Object.keys(porDiaAguaPer).length} de ${diasAguaBase} dias`
        : '';
    const semMedidas = !(d.weightPoints || []).length && !(d.mSeries || []).some(r => r.cintura != null) && !Number(state.profile.target_weight || 0);

    // ---- água: últimos dias contra a meta ----
    const aguaHistorico = metaMl => {
        const nd = Math.min(nDias, 14);
        const porDiaAgua = {};
        (d.meusPosts || []).filter(p => p.kind === 'water').forEach(p => {
            const k = diaChave(p.created_at); porDiaAgua[k] = (porDiaAgua[k] || 0) + (p.water_ml || 0);
        });
        const barras = [];
        for (let i = nd - 1; i >= 0; i--) {
            const dia = new Date(Date.now() - i * DIA_MS);
            if (+dia < new Date(inicioHist).setHours(0, 0, 0, 0)) continue;
            const ml = porDiaAgua[diaChave(dia)] || 0;
            barras.push({
                label: dia.toLocaleDateString('pt-BR', { day: '2-digit' }),
                value: Math.round(ml / 100) / 10, txt: ml ? String(Math.round(ml / 100) / 10).replace('.', ',') : '',
                tip: `${dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}: ${formatLitros(ml)}`,
            });
        }
        if (barras.length < 2) return '';
        const bateu = barras.filter(b => b.value * 1000 >= metaMl).length;
        return `<div class="chart-sub">Últimos ${barras.length} dias · meta batida em ${bateu}</div>${barChart(barras, { goal: Math.round(metaMl / 100) / 10, height: 110 })}`;
    };

    return { periodosHTML, statsHTML, calendarioHTML, pesoHTML, atividadeHTML, tiposHTML, cardioHTML, musculosHTML, refeicoesHTML, pontosHTML, cinturaHTML, recordesHTML, mesHTML, aguaHistorico, aguaMediaTxt, semMedidas };
}

async function renderProgress() {
    sincronizarModoTela();
    const c = $('#viewContainer');
    c.innerHTML = esqueleto('painel');

    const uid = state.session.user.id;
    const [
        { data: wSeries }, { data: aSeries }, { data: mSeries }, { data: pSeries },
        { data: goalData }, { data: streak }, { data: validWeeks },
        { data: meusPosts }, { data: sonos }, { data: ledger }
    ] = await Promise.all([
        sb.rpc('weight_series', { uid, days_back: 1100 }),
        sb.rpc('activity_series', { uid, weeks_back: 156 }),
        sb.rpc('measurement_series', { uid, months_back: 36 }),
        sb.rpc('points_series', { uid, weeks_back: 156 }),
        sb.rpc('weight_progress', { uid }),
        sb.from('daily_streaks').select('*').eq('user_id', uid).maybeSingle(),
        sb.rpc('count_valid_weeks', { uid }),
        sb.from('posts').select('kind, created_at, activity_type, duration_min, distance_km, muscle_groups, meal_slot, meal_score, water_ml')
            .eq('user_id', uid).in('kind', ['workout', 'water', 'meal', 'weight']).order('created_at', { ascending: true }).limit(3000),
        sb.from('sleep_logs').select('slept_on, hours').eq('user_id', uid).order('slept_on', { ascending: true }).limit(1200),
        sb.from('points_ledger').select('amount, earned_at').eq('user_id', uid).order('earned_at', { ascending: true }).limit(5000),
    ]);
    const aguaHoje = await aguaDeHoje();


    const goal = goalData?.[0] || {};
    const weeklyGoal = state.profile.weekly_goal || 3;

    // Card "Sua semana" (movido do feed pra cá)
    const { data: daysThisWeek } = await sb.rpc('count_days_current_week', { uid });
    const days = Number(daysThisWeek || 0);
    const isValid = days >= weeklyGoal;
    const pctWeek = Math.min(100, Math.round((days / weeklyGoal) * 100));
    const falta = weeklyGoal - days;
    const currentStreak = streak?.current_streak || 0;
    const { data: escudo } = await sb.rpc('shield_status');
    const escudoOk = escudo && escudo[0] && escudo[0].disponivel;
    const totalValid = Number(validWeeks || 0);

    const circ = 263.9;
    const weeklyCardHTML = `<div class="anel-card${isValid ? ' valid' : ''}">
        <div class="anel">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="anel-trilho"/>${pctWeek > 0 ? `<circle cx="50" cy="50" r="42" class="anel-fill" stroke-dasharray="${(pctWeek / 100 * circ).toFixed(1)} ${circ}"/>` : ''}</svg>
            <div class="anel-centro"><b>${days}<small>/${weeklyGoal}</small></b><span>treinos</span></div>
        </div>
        <div class="anel-info">
            <span class="anel-titulo">Sua semana</span>
            <b class="anel-status">${isValid ? 'Meta batida 🎉' : `Falta${falta === 1 ? '' : 'm'} ${falta} ${falta === 1 ? 'dia' : 'dias'}`}</b>
            ${(() => { const semAnt = (aSeries || []).slice(-5, -1); const med = semAnt.length ? semAnt.reduce((t, r) => t + (r.days_trained || 0), 0) / semAnt.length : 0; const pv = previsaoSemanaTexto(days, weeklyGoal, med); return pv ? `<span class="anel-prev">${pv}</span>` : ''; })()}
            <span>🔥 ${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'} de ofensiva${escudoOk ? ' · escudo 🛡️' : ''}</span>
            <span>✅ ${totalValid} ${totalValid === 1 ? 'semana' : 'semanas'} com meta batida</span>
        </div>
    </div>`;

    // Gráfico de peso
    const weightPoints = (wSeries || []).map(r => ({ x: new Date(r.d + 'T12:00:00'), y: Number(r.kg) }));
    const projecao = state.projecao = projecaoMeta(weightPoints, aSeries || [], state.profile);
    const weightChart = lineChart(weightPoints, { id:'w', goal: goal.meta ? Number(goal.meta) : null, unit:'kg', decimals:1 });

    // Gráfico de atividade semanal
    const actBars = (aSeries || []).slice(-8).map(r => {
        const d = new Date(r.week_start + 'T12:00:00');
        return { label: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }), value: r.days_trained };
    });
    const actChart = barChart(actBars, { goal: weeklyGoal });

    // Gráfico de pontos
    const ptsBars = (pSeries || []).slice(-8).map(r => {
        const d = new Date(r.week_start + 'T12:00:00');
        return { label: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }), value: Math.round(Number(r.pts)) };
    });
    const ptsChart = barChart(ptsBars, {});

    // Gráfico de medidas (cintura)
    const cinturaPoints = (mSeries || []).filter(r => r.cintura != null)
        .map(r => ({ x: new Date(r.d + 'T12:00:00'), y: Number(r.cintura) }));
    const cinturaChart = lineChart(cinturaPoints, { id:'c', unit:'cm', decimals:1 });

    // Totais
    const totalMin = (aSeries || []).reduce((s, r) => s + (r.total_min || 0), 0);
    const totalDays = (aSeries || []).reduce((s, r) => s + (r.days_trained || 0), 0);
    const horas = Math.floor(totalMin / 60);
    const ev = montarEvolucao({ wSeries, aSeries, mSeries, pSeries, meusPosts, sonos, ledger, streak, weightPoints, projecao, goal, weeklyGoal });

    // Medidas agora mora no Menu › Seu corpo
    if (state.view === 'medidas') {
        c.innerHTML = `<div class="view cfg-view">
            ${cabecalhoConfig('Medidas', 'go-menu')}
            <div id="evoPeriodos">${ev.periodosHTML}</div>
            ${ev.semMedidas ? `<div class="chart-card"><div class="chart-convite">
                <span><b>Quer acompanhar peso ou medidas?</b><br>Você decide o que registrar.</span>
                <button class="btn-mini" data-act="m-peso">Registrar peso</button>
            </div></div>` : `${ev.pesoHTML}${ev.cinturaHTML}`}
        </div>`;
        return;
    }
    if (state.abaEvolucao === 'corpo') state.abaEvolucao = 'coach';
    const aba = state.abaEvolucao || 'coach';
    const abaHTML = (id, conteudo) => `<div class="evo-painel${aba === id ? '' : ' hidden'}" data-painel="${id}">${conteudo}</div>`;
    c.innerHTML = `
        <div class="view">
            <div class="page-head"><h1 class="screen-title">Evolução</h1><span class="page-sub">progresso ao longo do tempo</span></div>

            <div class="evo-abas">
                ${[['coach', 'Coach'], ['resumo', 'Resumo'], ['treinos', 'Treinos'], ['habitos', 'Hábitos']].map(([k, n]) =>
                    `<button class="evo-aba${aba === k ? ' on' : ''}" data-act="evo-aba" data-aba="${k}">${n}</button>`).join('')}
            </div>
            <div id="evoPeriodos" class="${aba === 'coach' ? 'hidden' : ''}">${ev.periodosHTML}</div>

            ${abaHTML('coach', `
                <div id="iaSlot"></div>
                <p class="coach-rodape">O coach usa seus <button class="ia-link" data-act="m-go" data-view="objetivos">objetivos</button> e o seu <button class="ia-link" data-act="m-go" data-view="jeito-treino">jeito de treinar</button>.</p>
            `)}
            ${abaHTML('resumo', `
                <div id="lembretesSlot"></div>
                <div id="semanaEvoSlot"></div>
                ${metaCardHTML(projecao)}
                ${weeklyCardHTML}
                ${ev.statsHTML}
                ${ev.calendarioHTML}
                ${ev.mesHTML}
                <div class="chart-card" id="reportCard"></div>
            `)}
            ${abaHTML('treinos', `
                ${ev.atividadeHTML}
                ${ev.tiposHTML}
                ${ev.cardioHTML}
                ${ev.musculosHTML}
                ${ev.recordesHTML}
                ${ev.pontosHTML}
                ${!ev.atividadeHTML && !ev.tiposHTML ? '<div class="chart-card"><div class="chart-convite"><span>Nenhum treino nesse período ainda.</span><button class="btn-mini" data-act="quick-kind" data-kind="workout">Registrar treino</button></div></div>' : ''}
            `)}
            ${abaHTML('corpo', ev.semMedidas ? `
                <div class="chart-card">
                    <div class="chart-convite">
                        <span><b>Quer acompanhar peso ou medidas?</b><br>Você decide o que registrar. Se preferir focar em treino e hábitos, pode deixar essa aba de lado.</span>
                        <button class="btn-mini" data-act="m-peso">Registrar peso</button>
                    </div>
                </div>
            ` : `
                ${ev.pesoHTML}
                ${ev.cinturaHTML}
            `)}
            ${abaHTML('habitos', `
                <div class="chart-card water-card">
                    <div class="chart-head">
                        <span class="chart-title">Água</span>
                        <span class="chart-legend">hoje: ${aguaHoje.pct || 0}% da meta</span>
                    </div>
                    <div class="wtr-top">
                        <span class="wtr-now">${formatLitros(aguaHoje.total_ml || 0)}</span>
                        <span class="wtr-goal">de ${formatLitros(aguaHoje.goal_ml || 2000)} hoje</span>
                    </div>
                    <div class="wtr-track"><div class="wtr-fill" style="width:${aguaHoje.pct || 0}%"></div></div>
                    ${ev.aguaMediaTxt ? `<div class="agua-media">${ev.aguaMediaTxt}</div>` : ''}
                    ${ev.aguaHistorico(aguaHoje.goal_ml || 2000)}
                    <button class="btn-mini wtr-btn" data-act="quick-water">+ Registrar água</button>
                </div>
                <div class="chart-card" id="sleepCard"></div>
                ${ev.refeicoesHTML}
            `)}
        </div>
    `;
    const cal = c.querySelector('.cal-scroll');
    if (cal) cal.scrollLeft = cal.scrollWidth;
    hydrateCalMes();
    hydrateIAEvolucao();
    hydrateSemanaEvo();
    hydrateLembretes();
    refreshSleepCard();
    refreshReportCard();
}

async function renderChallenges() {
    const c = $('#viewContainer');
    c.innerHTML = '<div class="view"><h1 class="screen-title">Desafios</h1><div class="spinner"></div></div>';

    const [{ lista: challenges, amigos: amigosCh, pedidos: pedidosCh }, { data: summaryData }, { data: top }, { data: myRk }] = await Promise.all([
        dadosDesafios(),
        sb.rpc('community_weekly_summary'),
        Promise.resolve({ data: null }),
        sb.rpc('my_weekly_rank'),
    ]);
    const mine = myRk && myRk[0];
    const s = (summaryData && summaryData[0]) || {};

    const STATUS = {
        ativo:     { label: 'Rolando agora', cls: 'ativo' },
        futuro:    { label: 'Em breve',      cls: 'futuro' },
        encerrado: { label: 'Encerrado',     cls: 'fim' },
    };
    const dataBR = d => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });

    const cards = (challenges || []).map(ch => {
        const st = STATUS[ch.status] || STATUS.futuro;
        return `<div class="ch-card" data-act="open-challenge" data-id="${ch.id}">
            <div class="ch-head">
                <span class="ch-name">${escapeHTML(ch.name)}</span>
                <span class="ch-status ${st.cls}">${st.label}</span>
            </div>
            ${ch.description ? `<p class="ch-desc">${escapeHTML(ch.description.slice(0,90))}</p>` : ''}
            ${!ch.im_member && ch.status !== 'encerrado' ? `<div class="dc-rodape ch-card-acao">
                <div class="dc-social"><span class="dc-avatares">${avataresAmigos(amigosCh[ch.id])}</span><span>${provaSocial(ch, amigosCh[ch.id])}</span></div>
                ${botaoEntrarDesafio(ch, pedidosCh[ch.id])}
            </div>` : ''}
            <div class="ch-meta">
                <span>📅 ${dataBR(ch.starts_at)} a ${dataBR(ch.ends_at)}</span>
                <span>👥 ${ch.members}</span>
                ${ch.im_member ? '<span class="ch-in">Você participa</span>' : ''}
                ${!ch.is_open ? '<span>privado</span>' : ''}
                ${ch.pedidos > 0 ? `<span class="ch-pedidos">${plural(ch.pedidos, 'pedido', 'pedidos')}</span>` : ''}
            </div>
        </div>`;
    }).join('') || `<div class="feed-empty"><span class="emo">🏆</span><h3>Nenhum desafio ainda</h3><p>${podeCriarDesafio() ? 'Crie o primeiro no botão acima.' : 'Fique de olho, logo aparece um por aqui.'}</p></div>`;

    const fx = mine ? faixaRanking(mine.rank, mine.total) : null;
    // Compara com a faixa da semana passada (guardada no aparelho)
    const semKey = d => 'pulso-faixa-' + isoDe(segundaDe(d));
    let subiu = '';
    if (fx) {
        lsSet(semKey(new Date()), JSON.stringify(fx));
        try {
            const ant = JSON.parse(lsGet(semKey(new Date(Date.now() - 7 * 86400000))) || 'null');
            if (ant && ant.nivel > fx.nivel) subiu = `Subiu de ${ant.curto} pra ${fx.curto} 🚀`;
        } catch (_) {}
    }

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-profile">←</button>
                <div class="topbar-title">Desafios</div>
                <div style="width:28px"></div>
            </div>
            <div class="ch-title-row">
                <span class="page-sub">compare seu progresso com um grupo</span>

            </div>

            ${podeCriarDesafio() ? `<button class="ch-criar" data-act="new-challenge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span><b>Criar desafio</b><small>Defina período, regras e convide quem quiser</small></span>
            </button>` : ''}
            <div class="ch-list">${cards}</div>

            <h3 class="edit-section-title" style="margin-top:24px">Comunidade essa semana</h3>
            <div class="stat-grid">
                <div class="stat-card"><div class="num">${s.usuarios_ativos||0}</div><div class="lbl">Pessoas ativas</div></div>
                <div class="stat-card"><div class="num">${s.total_treinos||0}</div><div class="lbl">Treinos</div></div>
            </div>
            <div class="chart-card faixa-card" style="margin-top:12px">
                <div class="chart-head"><span class="chart-title">Sua faixa na semana</span></div>
                ${fx ? `<div class="faixa-selo">${fx.curto}</div><p class="faixa-txt">${fx.longo}</p>${subiu ? `<p class="faixa-subiu">${subiu}</p>` : ''}`
                    : '<p class="faixa-txt">Você ainda não pontuou essa semana. Registre um treino pra aparecer aqui.</p>'}
                <p class="faixa-nota">Fora dos desafios, ninguém vê a posição nem os pontos de ninguém. Pra competir de verdade, entre num desafio.</p>
            </div>
        </div>
    `;
}

// ---- Detalhe do desafio ----
async function renderChallengeDetail(cid) {
    const c = $('#viewContainer');
    c.innerHTML = '<div class="view"><div class="spinner"></div></div>';

    const { data: all } = await sb.rpc('list_challenges');
    const ch = (all || []).find(x => x.id === cid);
    if (!ch) { c.innerHTML = '<div class="view"><p style="color:var(--danger)">Desafio não encontrado.</p></div>'; return; }

    // Quem não participa não vê ranking nem progresso: só a vitrine
    const podeVerDentro = ch.im_member || ch.created_by === state.session.user.id || state.profile.is_admin;
    if (!podeVerDentro) { await renderChallengeVitrine(ch); return; }

    const [{ data: ranking }, { data: saude }, { data: regrasRow }] = await Promise.all([
        sb.rpc('challenge_ranking', { cid }),
        sb.rpc('challenge_health', { cid }),
        sb.from('challenges').select('rules').eq('id', cid).maybeSingle(),
    ]);
    ch.rules = regrasRow ? regrasRow.rules : null;
    setTimeout(() => hydrateNarracaoDesafio(ch, ranking || []), 300);

    const dataBR = d => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const diasFim = Math.max(0, Math.ceil((new Date(ch.ends_at) - new Date()) / 86400000));
    const souDono = ch.created_by === state.session.user.id || state.profile.is_admin;
    const podeEntrar = !ch.im_member && ch.is_open && ch.status !== 'encerrado';
    const podePedir = !ch.im_member && !ch.is_open && ch.status !== 'encerrado';

    let meuPedido = null;
    if (podePedir) {
        const { data: st } = await sb.rpc('my_challenge_request', { cid });
        meuPedido = st || null;
    }

    let pedidosHTML = '';
    if (souDono) {
        const { data: pedidos } = await sb.rpc('challenge_requests_list', { cid });
        if (pedidos && pedidos.length) {
            pedidosHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">Pedidos pra entrar</span><span class="chart-legend">${pedidos.length}</span></div>
                <div class="ch-req-list">
                    ${pedidos.map(u => `<div class="ch-req-row">
                        ${avatarHTML({ ...u, id: u.id || u.user_id || u.requester_id }, 'sm')}
                        <div class="ch-req-info">
                            <div class="ch-req-nome">${escapeHTML(u.display_name)}</div>
                            <div class="ch-req-user">@${escapeHTML(u.username)}</div>
                        </div>
                        <button class="btn-mini" data-act="aprovar-pedido" data-cid="${cid}" data-uid="${u.id || u.user_id || u.requester_id}">Aceitar</button>
                        <button class="btn-ghost btn-xs" data-act="recusar-pedido" data-cid="${cid}" data-uid="${u.id || u.user_id || u.requester_id}">Recusar</button>
                    </div>`).join('')}
                </div>
            </div>`;
        }
    }

    // Destaques, médias e resumo só fazem sentido pra quem está dentro
    let destaquesHTML = '', grupoHTML = '', semanaHTML = '', relatorioHTML = '';
    if (ch.im_member) {
        const [{ data: destaques }, { data: grupo }, { data: semana }] = await Promise.all([
            sb.rpc('challenge_highlights', { cid }),
            sb.rpc('challenge_group_stats', { cid }),
            sb.rpc('challenge_week_summary', { cid }),
        ]);

        const rotulos = {
            treinos: 'Quem mais treinou',
            agua: 'Mais hidratado',
            ofensiva: 'Maior ofensiva',
        };
        const comValor = (destaques || []).filter(d => Number(d.valor) > 0);
        if (comValor.length) {
            destaquesHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">Destaques</span></div>
                <div class="dest-list">
                    ${comValor.map(d => `<div class="dest-row" data-act="view-user" data-uid="${d.user_id}">
                        ${avatarHTML({ id: d.user_id, display_name: d.display_name, avatar_url: d.avatar_url }, 'sm')}
                        <div class="dest-info">
                            <div class="dest-tipo">${rotulos[d.tipo] || d.tipo}</div>
                            <div class="dest-nome">${d.user_id === state.session.user.id ? 'Você' : escapeHTML(d.display_name)}</div>
                        </div>
                        <div class="dest-valor">${String(Number(d.valor)).replace('.', ',')}<small>${d.unidade}</small></div>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        const g = (grupo && grupo[0]) || null;
        if (g) {
            grupoHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">O grupo junto</span>${g.dias_restantes > 0 ? `<span class="chart-legend">${plural(g.dias_restantes, 'dia restante', 'dias restantes')}</span>` : ''}</div>
                <div class="grupo-grid">
                    <div class="grupo-item"><b>${g.treinos_total}</b><span>treinos somados</span></div>
                    <div class="grupo-item"><b>${String(g.agua_media_l).replace('.', ',')} L</b><span>água por dia</span></div>
                    <div class="grupo-item"><b>${String(g.sono_medio).replace('.', ',')}h</b><span>sono médio</span></div>
                    <div class="grupo-item"><b>${String(g.pct_medio).replace('.', ',')}%</b><span>evolução média</span></div>
                </div>
                <p class="chart-foot" style="text-align:left">Médias do grupo inteiro, sem identificar ninguém.</p>
            </div>`;
        }

        const semanaLista = (semana || []).filter(s => Number(s.pontos_semana) > 0 || s.dias_semana > 0);
        if (semanaLista.length) {
            semanaHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">Esta semana</span></div>
                <div class="cw-rank-list">
                    ${semanaLista.slice(0, 6).map((s, i) => {
                        const eu = s.user_id === state.session.user.id;
                        return `<div class="cw-rank-item${eu ? ' me' : ''}">
                            <span class="cw-rank-medal">${i + 1}</span>
                            ${avatarHTML({ id: s.user_id, display_name: s.display_name, avatar_url: s.avatar_url }, 'sm')}
                            <div class="cw-rank-info">
                                <span class="cw-rank-name">${eu ? 'Você' : escapeHTML(s.display_name)}</span>
                                <span class="cw-rank-sub">${plural(s.dias_semana, 'treino', 'treinos')} na semana</span>
                            </div>
                            ${!eu ? `<button class="cheer-btn" data-act="incentivar" data-cid="${cid}" data-uid="${s.user_id}" data-nome="${escapeHTML(s.display_name)}">Força!</button>` : ''}
                            <span class="cw-rank-pts">${Math.round(s.pontos_semana)}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
    }

    if (souDono) {
        const { data: rel } = await sb.rpc('challenge_admin_report', { cid });
        const r = rel && rel[0];
        if (r) {
            const horas = Math.floor((r.minutos_total || 0) / 60);
            relatorioHTML = `<div class="chart-card">
                <div class="chart-head"><span class="chart-title">Relatório do organizador</span></div>
                <div class="grupo-grid">
                    <div class="grupo-item"><b>${r.participantes}</b><span>participantes</span></div>
                    <div class="grupo-item"><b>${String(r.kg_perdidos_total).replace('.', ',')} kg</b><span>perdidos no total</span></div>
                    <div class="grupo-item"><b>${String(r.pct_medio).replace('.', ',')}%</b><span>média de evolução</span></div>
                    <div class="grupo-item"><b>${horas}h</b><span>de treino somadas</span></div>
                    <div class="grupo-item"><b>${String(r.sono_medio).replace('.', ',')}h</b><span>sono médio</span></div>
                    <div class="grupo-item"><b>${String(r.agua_media_l).replace('.', ',')} L</b><span>água por dia</span></div>
                </div>
                ${r.sem_registro > 0 ? `<p class="chart-foot" style="text-align:left">${plural(r.sem_registro, 'pessoa está', 'pessoas estão')} sem registrar nada há mais de 7 dias.</p>` : ''}
            </div>`;
        }
    }

    const diasPorPessoa = {};
    (saude || []).forEach(m => { diasPorPessoa[m.user_id] = m.dias_treinados; });

    const rankRows = (ranking || []).map((u, i) => {
        const isMe = u.user_id === state.session.user.id;
        const dias = diasPorPessoa[u.user_id];
        return `<div class="cw-rank-item${isMe?' me':''}" data-act="view-user" data-uid="${u.user_id}">
            <span class="cw-rank-medal">${i+1}</span>
            ${avatarHTML(u, 'sm')}
            <div class="cw-rank-info">
                <span class="cw-rank-name">${isMe?'Você':escapeHTML(u.display_name)}</span>
                ${dias != null ? `<span class="cw-rank-sub">${plural(dias, 'dia treinado', 'dias treinados')} no desafio</span>` : ''}
            </div>
            <span class="cw-rank-pts">${plural(Math.round(u.points), 'pt', 'pts')}</span>
        </div>`;
    }).join('') || '<div class="log-empty">Ninguém pontuou nesse período ainda.</div>';

    let saudeHTML;
    if (!ch.im_member) {
        saudeHTML = '<div class="log-empty">Entre no desafio pra acompanhar o progresso do grupo.</div>';
    } else if (ch.status !== 'ativo') {
        saudeHTML = `<div class="log-empty">Os dados de saúde do grupo aparecem só enquanto o desafio está rolando.</div>`;
    } else {
        saudeHTML = (saude || []).map(m => {
            const isMe = m.user_id === state.session.user.id;
            const pct = isMe && m.pct != null ? Number(m.pct) : null;
            const cor = pct > 0 ? 'var(--vital)' : pct < 0 ? 'var(--effort)' : 'var(--ink-faint)';
            return `<div class="ch-health-row${isMe?' me':''}" data-act="view-user" data-uid="${m.user_id}">
                ${avatarHTML(m, 'sm')}
                <div class="ch-health-info">
                    <div class="ch-health-name">${isMe?'Você':escapeHTML(m.display_name)}</div>
                    <div class="ch-health-sub">${isMe && m.peso_atual ? br(m.peso_atual) + ' kg · ' : ''}${plural(m.dias_treinados, 'dia treinado', 'dias treinados')}</div>
                </div>
                ${pct != null ? `<span class="ch-health-pct" style="color:${cor}">${pct > 0 ? '−' : pct < 0 ? '+' : ''}${br(Math.abs(pct))}%</span>` : ''}
            </div>`;
        }).join('') || '<div class="log-empty">Ninguém registrou peso ainda.</div>';
    }

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-community">←</button>
                <div class="topbar-title">Desafio</div>
                <div style="width:28px"></div>
            </div>

            ${ch.status === 'ativo' && diasFim <= 7 ? `<div class="ch-reta-final">Reta final: ${plural(diasFim, 'dia restante', 'dias restantes')} neste desafio.</div>` : ''}

            <div class="ch-hero">
                <span class="ch-status ${ch.status === 'ativo' ? 'ativo' : ch.status === 'futuro' ? 'futuro' : 'fim'}">
                    ${ch.status === 'ativo' ? 'Rolando agora' : ch.status === 'futuro' ? 'Em breve' : 'Encerrado'}
                </span>
                <h1 class="ch-hero-name">${escapeHTML(ch.name)}</h1>
                ${ch.description ? `<p class="ch-hero-desc">${escapeHTML(ch.description)}</p>` : ''}
                <div class="ch-hero-meta">
                    <span>📅 ${dataBR(ch.starts_at)} a ${dataBR(ch.ends_at)}</span>
                    <span>👥 ${ch.members} participantes</span>
                </div>
                <div class="ch-actions">
                    ${podeEntrar ? `<button class="btn-primary-sm" data-act="join-challenge" data-id="${cid}">Entrar no desafio</button>` : ''}
                    ${(podeEntrar || podePedir) ? '<p class="ch-aviso-privacidade">Entrando, o grupo passa a ver seu percentual de evolução, seus dias treinados e seus pontos. Peso, medidas e refeições continuam privados.</p>' : ''}
                    ${podePedir && !meuPedido ? `<button class="btn-primary-sm" data-act="pedir-acesso" data-id="${cid}">Solicitar acesso</button>` : ''}
                    ${meuPedido === 'pendente' ? '<span class="ch-pedido-tag">Pedido enviado, aguardando resposta</span>' : ''}
                    ${meuPedido === 'recusado' ? '<span class="ch-pedido-tag recusado">Pedido não aceito</span>' : ''}
                    ${ch.im_member ? `<button class="btn-secondary" data-act="leave-challenge" data-id="${cid}">Sair</button>` : ''}
                    ${souDono ? `<button class="btn-secondary" data-act="invite-challenge" data-id="${cid}">Convidar</button>` : ''}
                    <button class="btn-secondary" data-act="ver-regras-desafio">Regras</button>
                    ${souDono ? `<button class="btn-danger" data-act="delete-challenge" data-id="${cid}">Apagar</button>` : ''}
                </div>
                <div id="chRegrasMembro" class="hidden">${regrasDesafioHTML(ch)}</div>
                <div id="chNarracao"></div>
            </div>

            ${pedidosHTML}

            <div class="chart-card">
                <div class="chart-head"><span class="chart-title">Ranking do desafio</span></div>
                <div class="cw-rank-list">${rankRows}</div>
                <p class="chart-foot" style="text-align:left">Conta só o que cada um ganhou de ${dataBR(ch.starts_at)} em diante. Pontos anteriores ao desafio não entram.</p>
            </div>

            ${destaquesHTML}
            ${grupoHTML}
            ${semanaHTML}
            ${relatorioHTML}

            <div class="chart-card">
                <div class="chart-head"><span class="chart-title">Progresso do grupo</span></div>
                <div class="ch-health-list">${saudeHTML}</div>
                ${ch.im_member && ch.status === 'ativo' ? '<p class="dest-hint" style="margin-top:10px">Cada um vê só o percentual de evolução dos outros. Peso e medidas continuam privados.</p>' : ''}
            </div>
        </div>
    `;
}

// ============================================================
// MENU (tela cheia, mesma cara das configurações)
// ============================================================
function linhaMenu(act, ic, texto, valor = '', extra = '', aviso = 0) {
    return `<button class="cfg-row" data-act="${act}"${extra}>
        ${icon(ic)}<span class="cfg-txt">${texto}</span>
        ${aviso > 0 ? `<span class="cfg-aviso">${aviso > 9 ? '9+' : aviso}</span>` : ''}
        ${valor ? `<span class="cfg-val">${valor}</span>` : ''}
        <svg class="cfg-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
    </button>`;
}

// Atalhos do topo do Menu: os 3 registros que a pessoa mais usa
const ATALHOS_MENU = {
    peso:   { ic: 'peso',  txt: 'Peso',     act: 'm-peso' },
    agua:   { ic: 'agua',  txt: 'Água',     act: 'quick-water' },
    treino: { ic: 'grafico', txt: 'Treino', act: 'atalho-registro', extra: ' data-k="workout"' },
    refeicao: { ic: 'alvo', txt: 'Refeição', act: 'atalho-registro', extra: ' data-k="meal"' },
    sono:   { ic: 'relogio', txt: 'Sono',   act: 'atalho-registro', extra: ' data-k="sleep"' },
};
function contarUsoAtalho(k) {
    try {
        const uso = JSON.parse(localStorage.getItem('pulso-uso-atalhos') || '{}');
        uso[k] = (uso[k] || 0) + 1;
        localStorage.setItem('pulso-uso-atalhos', JSON.stringify(uso));
    } catch (_) {}
}
function atalhosDoMenu() {
    let uso = {};
    try { uso = JSON.parse(localStorage.getItem('pulso-uso-atalhos') || '{}'); } catch (_) {}
    const padrao = ['peso', 'agua', 'treino'];
    const ordem = Object.keys(ATALHOS_MENU).sort((a, b) => (uso[b] || 0) - (uso[a] || 0) || padrao.indexOf(b) - padrao.indexOf(a));
    const usados = ordem.filter(k => (uso[k] || 0) >= 3);
    const escolha = [...usados, ...padrao.filter(k => !usados.includes(k))].slice(0, 3);
    return escolha.map(k => { const a = ATALHOS_MENU[k]; return `<button class="menu-atalho" data-act="${a.act}"${a.extra || ''}>${icon(a.ic)}<span>${a.txt}</span></button>`; }).join('');
}

async function renderMenu() {
    const p = state.profile;
    const c = $('#viewContainer');
    const objetivo = p.goal ? (OBJETIVOS.find(o => o[0] === p.goal) || [, ''])[1] : '';
    const prazo = p.target_weight && p.goal_deadline ? ` · ${br(p.target_weight)} kg até ${new Date(p.goal_deadline + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : '';
    const pintar = (pedidos = 0) => {
        c.innerHTML = `
        <div class="view cfg-view">
            ${cabecalhoConfig('Menu', 'menu-voltar')}

            <button class="menu-perfil" data-act="m-go" data-view="profile">
                ${avatarHTML(p, 'md')}
                <span class="menu-perfil-txt"><b>${escapeHTML(p.display_name)}</b><small>Ver perfil</small></span>
                <svg class="cfg-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>

            <div class="menu-atalhos">${atalhosDoMenu()}</div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Suas metas</div>
                ${linhaMenu('cfg-page', 'alvo', 'Objetivo', objetivo ? escapeHTML(objetivo + prazo) : 'Definir', ' data-page="objetivos"')}
                ${linhaMenu('cfg-page', 'historico', 'Jeito de treinar', `${p.weekly_goal || 3}x por semana`, ' data-page="jeito-treino"')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Seu corpo</div>
                ${linhaMenu('m-peso', 'peso', 'Registrar peso')}
                ${linhaMenu('m-go', 'grafico', 'Medidas', '', ' data-view="medidas"')}
                ${linhaMenu('m-go', 'saude', 'Ficha de saúde', '', ' data-view="health"')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Sua atividade</div>
                ${linhaMenu('m-go', 'historico', 'Histórico', '', ' data-view="activity-log"')}
                ${linhaMenu('m-go', 'salvo', 'Salvos', state.salvos.size ? String(state.salvos.size) : '', ' data-view="saved"')}
                ${linhaMenu('m-go', 'salvo', 'Arquivados', '', ' data-view="arquivados"')}
            </div>

            <div class="cfg-grupo">
                <div class="cfg-titulo">Pessoas</div>
                ${linhaMenu('cfg-page', 'pessoaMais', 'Pedidos pra seguir', '', ' data-page="set-requests"', pedidos)}
                ${linhaMenu('convidar-amigo', 'pessoaMais', 'Convidar amigos')}
                ${linhaMenu('compartilhar-perfil', 'mensagem', 'Compartilhar perfil')}
            </div>

            ${p.is_admin ? `<div class="cfg-grupo">
                <div class="cfg-titulo">Admin</div>
                ${linhaMenu('m-go', 'admin', 'Painel Admin', '', ' data-view="admin" id="menuAdminLinha"')}
            </div>` : ''}

            <div class="cfg-grupo">
                ${linhaMenu('m-go', 'config', 'Configurações', '', ' data-view="settings"')}
            </div>

            <div class="cfg-grupo cfg-sair">
                <button class="cfg-row cfg-perigo" data-act="do-logout"><span class="cfg-txt">Sair</span></button>
            </div>
        </div>`;
    };
    pintar();
    const { data: pend } = await sb.rpc('pending_follow_requests_count');
    if (state.view !== 'menu') return;
    pintar(Number(pend || 0));
}

// ============================================================
// OBJETIVOS (alimenta o coach e as análises da IA)
// ============================================================
const NIVEIS = [['iniciante', 'Iniciante', 'estou começando ou voltando agora'], ['intermediario', 'Intermediário', 'treino com alguma regularidade'], ['avancado', 'Avançado', 'treino há anos, com constância']];
const LOCAIS = ['Academia', 'Em casa', 'Ao ar livre', 'Esporte coletivo'];

// Monta uma tela de configuração com salvar no topo e no rodapé,
// que só aparecem quando algo mudou.
function telaEditavel({ titulo, sub, corpo, coletar, salvar, aoMontar }) {
    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view cfg-view tela-editavel">
            <div class="user-topbar">
                <button class="topbar-back" data-act="voltar-editavel" aria-label="Voltar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                <div class="topbar-title">${titulo}</div>
                <button class="ed-salvar ed-salvar-topo" id="salvarTopo" style="visibility:hidden">Salvar</button>
            </div>
            ${sub ? `<p class="cfg-sub">${sub}</p>` : ''}
            ${corpo}
            <div class="salvar-rodape" id="salvarRodape">
                <button class="btn-primary" id="salvarBaixo">Salvar alterações</button>
            </div>
        </div>`;
    if (aoMontar) aoMontar(c);
    const inicial = JSON.stringify(coletar(c));
    const atualizar = () => {
        if (!document.getElementById('salvarTopo')) return;
        const mudou = JSON.stringify(coletar(c)) !== inicial;
        document.getElementById('salvarTopo').style.visibility = mudou ? 'visible' : 'hidden';
        document.getElementById('salvarRodape').classList.toggle('on', mudou);
    };
    const raiz = c.querySelector('.tela-editavel');
    raiz.addEventListener('input', atualizar);
    raiz.addEventListener('change', atualizar);
    raiz.addEventListener('click', () => setTimeout(atualizar, 0));
    const fazer = async () => {
        const bt1 = document.getElementById('salvarTopo'), bt2 = document.getElementById('salvarBaixo');
        bt1.disabled = bt2.disabled = true; bt2.textContent = 'Salvando...';
        const dados = coletar(c);
        const { error } = await sb.from('profiles').update(dados).eq('id', state.session.user.id);
        bt1.disabled = bt2.disabled = false; bt2.textContent = 'Salvar alterações';
        if (error) { toast(msgErro(error), 'err'); return; }
        Object.assign(state.profile, dados);
        state.coachContext = null;
        if (salvar) salvar(dados);
        switchView(state.voltarEditavel || 'settings');
    };
    document.getElementById('salvarTopo').onclick = fazer;
    document.getElementById('salvarBaixo').onclick = fazer;
}
// Botões de escolha única e múltipla dentro da tela
function ligarEscolhas(c, seletor, multipla) {
    c.querySelectorAll(seletor).forEach(b => b.addEventListener('click', () => {
        if (multipla) b.classList.toggle('on');
        else c.querySelectorAll(seletor).forEach(x => x.classList.toggle('on', x === b));
    }));
}
const numOuNull = (v, min, max) => { const n = parseFloat(String(v || '').replace(',', '.')); return n >= min && n <= max ? n : null; };

function renderObjetivos() {
    const p = state.profile;
    const prazo = p.goal_deadline || '';
    telaEditavel({
        titulo: 'Objetivos',
        sub: 'Quanto mais claro aqui, mais certeiro o coach fica. Ele usa essas respostas em toda conversa e análise.',
        corpo: `
            <div class="obj-bloco">
                <div class="obj-rotulo">Seu objetivo principal</div>
                <div class="goal-grid">
                    ${OBJETIVOS.map(([v, nome, desc]) => `<button type="button" class="goal-btn${p.goal === v ? ' on' : ''}" data-obj-goal="${v}">
                        <span class="goal-nome">${nome}</span><span class="goal-desc">${desc}</span>
                    </button>`).join('')}
                </div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Com suas palavras, onde você quer chegar?</div>
                <textarea id="objTexto" class="obj-input" maxlength="300" rows="3" placeholder="ex: correr 10 km sem parar até dezembro, ou voltar a caber na calça de antes">${escapeHTML(p.goal_details || '')}</textarea>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Até quando <span class="lbl-opt">opcional</span></div>
                <div class="data-campo${prazo ? ' tem' : ''}" id="objPrazoBox">
                    <input type="date" id="objPrazo" value="${prazo}" min="${hojeISO()}">
                    <span class="data-vazia">Sem prazo</span>
                    <button type="button" class="data-limpar" id="objPrazoLimpar" aria-label="Tirar prazo">×</button>
                </div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Meta de peso <span class="lbl-opt">opcional</span></div>
                <input type="number" id="objPeso" class="obj-input" step="0.1" min="30" max="250" inputmode="decimal" placeholder="em kg, deixe vazio se não quiser" value="${p.target_weight || ''}">
            </div>
            <div class="obj-linha">
                <div class="obj-bloco">
                    <div class="obj-rotulo">Água por dia</div>
                    <input type="text" id="objAgua" class="obj-input" inputmode="decimal" placeholder="automático" value="${p.water_goal_ml ? String(p.water_goal_ml / 1000).replace('.', ',') : ''}">
                    <p class="field-hint">Em litros. Vazio usa o automático.</p>
                </div>
                <div class="obj-bloco">
                    <div class="obj-rotulo">Sono por noite</div>
                    <input type="text" id="objSono" class="obj-input" inputmode="decimal" placeholder="7" value="${p.sleep_goal_h ? String(p.sleep_goal_h).replace('.', ',') : ''}">
                    <p class="field-hint">Em horas.</p>
                </div>
            </div>`,
        aoMontar: c => {
            ligarEscolhas(c, '[data-obj-goal]', false);
            const box = document.getElementById('objPrazoBox'), inp = document.getElementById('objPrazo');
            const sync = () => box.classList.toggle('tem', !!inp.value);
            inp.addEventListener('change', sync); inp.addEventListener('input', sync);
            document.getElementById('objPrazoLimpar').onclick = () => { inp.value = ''; sync(); inp.dispatchEvent(new Event('input', { bubbles: true })); };
            // mostra quanto é o automático da água
            sb.rpc('water_today').then(({ data }) => {
                const auto = data && data[0] && data[0].goal_ml;
                const campo = document.getElementById('objAgua');
                if (auto && campo) campo.placeholder = `automático (${formatLitros(auto)})`;
            });
        },
        coletar: c => ({
            goal: c.querySelector('[data-obj-goal].on') ? c.querySelector('[data-obj-goal].on').dataset.objGoal : null,
            goal_details: (document.getElementById('objTexto').value || '').trim() || null,
            goal_deadline: document.getElementById('objPrazo').value || null,
            target_weight: numOuNull(document.getElementById('objPeso').value, 30, 250),
            water_goal_ml: (() => { const l = numOuNull(document.getElementById('objAgua').value, 0.5, 6); return l ? Math.round(l * 1000) : null; })(),
            sleep_goal_h: numOuNull(document.getElementById('objSono').value, 4, 12),
        }),
        salvar: () => {
            sb.from('profiles').update({ goal_reviewed_at: new Date().toISOString() }).eq('id', state.session.user.id).then(() => {});
            toast('Objetivos salvos. O coach já vai levar isso em conta.', 'ok');
        },
    });
}

function renderJeitoTreino() {
    const p = state.profile;
    const locais = Array.isArray(p.training_place) ? p.training_place : [];
    telaEditavel({
        titulo: 'Seu jeito de treinar',
        sub: 'O coach parte do que você gosta e encaixa o que está faltando. Quanto mais você contar, melhor o treino do dia.',
        corpo: `
            <div class="obj-bloco">
                <div class="obj-rotulo">Treinos por semana</div>
                <div class="obj-dias">
                    ${[1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="obj-dia${(p.weekly_goal || 3) === n ? ' on' : ''}" data-obj-dias="${n}">${n}</button>`).join('')}
                </div>
                <p class="field-hint">Você ganha +10 pontos toda semana que bater essa meta.</p>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Seu nível</div>
                <div class="cfg-grupo obj-grupo">
                    ${NIVEIS.map(([v, nome, desc]) => `<button type="button" class="cfg-radio${p.training_level === v ? ' on' : ''}" data-obj-nivel="${v}">
                        <span class="cfg-radio-txt"><b>${nome}</b><small>${desc}</small></span><span class="cfg-radio-dot"></span>
                    </button>`).join('')}
                </div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Onde você treina</div>
                <div class="chip-row">${LOCAIS.map(l => `<button type="button" class="chip${locais.includes(l) ? ' on' : ''}" data-obj-local="${l}">${l}</button>`).join('')}</div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">O que você curte fazer</div>
                <div class="chip-row">${MODALIDADES.map(m => `<button type="button" class="chip${(p.train_likes || []).includes(m) ? ' on' : ''}" data-obj-gosto="${m}">${m}</button>`).join('')}</div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">O que você prefere evitar <span class="lbl-opt">opcional</span></div>
                <input type="text" id="objEvita" class="obj-input" maxlength="160" placeholder="ex: burpee, esteira, treino muito longo" value="${escapeHTML(p.train_avoid || '')}">
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Dias que você consegue treinar</div>
                <div class="obj-dias">${DIAS_SEMANA.map(([n, sigla]) => `<button type="button" class="obj-dia${(p.train_days || []).includes(n) ? ' on' : ''}" data-obj-dia-sem="${n}">${sigla}</button>`).join('')}</div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Tempo por treino</div>
                <div class="chip-row">${[20, 30, 45, 60, 90].map(m => `<button type="button" class="chip${p.train_minutes === m ? ' on' : ''}" data-obj-min="${m}">${m === 90 ? '90+ min' : m + ' min'}</button>`).join('')}</div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Equipamento que você tem em casa <span class="lbl-opt">opcional</span></div>
                <div class="chip-row">${EQUIPAMENTOS.map(e => `<button type="button" class="chip${(p.train_equipment || []).includes(e) ? ' on' : ''}" data-obj-equip="${e}">${e}</button>`).join('')}</div>
            </div>
            <div class="obj-bloco">
                <div class="obj-rotulo">Alguma limitação ou dor? <span class="lbl-opt">opcional</span></div>
                <input type="text" id="objLimites" class="obj-input" maxlength="160" placeholder="ex: joelho sensível, dor lombar" value="${escapeHTML(p.train_limits || '')}">
                <p class="field-hint">Só você vê. O coach evita exercícios de risco e, se houver dor, recomenda um profissional.</p>
            </div>`,
        aoMontar: c => {
            ligarEscolhas(c, '[data-obj-dias]', false);
            ligarEscolhas(c, '[data-obj-nivel]', false);
            ligarEscolhas(c, '[data-obj-min]', false);
            ligarEscolhas(c, '[data-obj-local]', true);
            ligarEscolhas(c, '[data-obj-gosto]', true);
            ligarEscolhas(c, '[data-obj-dia-sem]', true);
            ligarEscolhas(c, '[data-obj-equip]', true);
        },
        coletar: c => {
            const um = (sel, campo, conv = x => x) => { const el = c.querySelector(sel + '.on'); return el ? conv(el.dataset[campo]) : null; };
            const varios = (sel, campo, conv = x => x) => [...c.querySelectorAll(sel + '.on')].map(el => conv(el.dataset[campo]));
            return {
                weekly_goal: um('[data-obj-dias]', 'objDias', Number) || p.weekly_goal || 3,
                training_level: um('[data-obj-nivel]', 'objNivel'),
                training_place: varios('[data-obj-local]', 'objLocal'),
                train_likes: varios('[data-obj-gosto]', 'objGosto'),
                train_avoid: (document.getElementById('objEvita').value || '').trim() || null,
                train_days: varios('[data-obj-dia-sem]', 'objDiaSem', Number),
                train_minutes: um('[data-obj-min]', 'objMin', Number),
                train_equipment: varios('[data-obj-equip]', 'objEquip'),
                train_limits: (document.getElementById('objLimites').value || '').trim() || null,
            };
        },
        salvar: () => {
            state.iaTreinoForcar = true;
            refreshWeeklyPill();
            toast('Pronto. O coach vai montar seus próximos treinos com isso.', 'ok');
        },
    });
}

// ---- Revisão dos objetivos (a cada 30 dias) ----
async function checarRevisaoObjetivo() {
    const p = state.profile;
    if (!p || !p.goal) return;
    if (!p.goal_reviewed_at) {
        // Começa a contar a partir de agora
        await sb.from('profiles').update({ goal_reviewed_at: new Date().toISOString() }).eq('id', state.session.user.id);
        p.goal_reviewed_at = new Date().toISOString();
        return;
    }
    if (Date.now() - new Date(p.goal_reviewed_at).getTime() < 30 * 86400000) return;
    if (document.querySelector('.sheet.on')) return;
    const obj = OBJETIVOS.find(o => o[0] === p.goal);
    const sheet = document.createElement('div');
    sheet.id = 'revisaoSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Seu objetivo ainda é esse?</h3>
        <div class="revisao-obj"><b>${obj ? obj[1] : 'Seu objetivo'}</b>${p.goal_details ? `<span>${escapeHTML(p.goal_details)}</span>` : ''}</div>
        <p class="sheet-sub">O coach usa isso em toda conversa. Faz um mês desde a última vez que você conferiu.</p>
        <div class="sheet-footer">
            <button class="btn-ghost" id="revAtualizar">Atualizar</button>
            <button class="btn-primary" id="revOk">Sim, continua</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const marcar = async () => {
        p.goal_reviewed_at = new Date().toISOString();
        await sb.from('profiles').update({ goal_reviewed_at: p.goal_reviewed_at }).eq('id', state.session.user.id);
    };
    document.getElementById('revOk').onclick = async () => { sheet.remove(); await marcar(); toast('Beleza, seguimos nesse foco', 'ok'); };
    document.getElementById('revAtualizar').onclick = () => { sheet.remove(); switchView('objetivos'); };
}

// ---- Resumo da semana (domingo e segunda) ----
function inicioDaSemana(d = new Date()) {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    const dia = (x.getDay() + 6) % 7; // segunda = 0
    x.setDate(x.getDate() - dia);
    return x;
}
async function dadosDaSemana() {
    const uid = state.session.user.id;
    const hoje = new Date();
    // No domingo resume a semana atual; na segunda, a que acabou
    const ini = inicioDaSemana(hoje.getDay() === 1 ? new Date(Date.now() - 86400000) : hoje);
    const fim = new Date(ini.getTime() + 7 * 86400000);
    const iniAnt = new Date(ini.getTime() - 7 * 86400000);
    const [{ data: posts }, { data: sonos }, { data: pts }] = await Promise.all([
        sb.from('posts').select('kind, water_ml, duration_min, distance_km, activity_type, meal_score, created_at').eq('user_id', uid)
            .in('kind', ['workout', 'water', 'meal']).gte('created_at', iniAnt.toISOString()).lt('created_at', fim.toISOString()),
        sb.from('sleep_logs').select('hours, slept_on').eq('user_id', uid)
            .gte('slept_on', ini.toISOString().split('T')[0]).lt('slept_on', fim.toISOString().split('T')[0]),
        sb.from('points_ledger').select('amount, earned_at').eq('user_id', uid)
            .gte('earned_at', iniAnt.toISOString()).lt('earned_at', fim.toISOString()),
    ]);
    const naSemana = (lista, campo, a, b) => (lista || []).filter(x => { const t = new Date(x[campo]); return t >= a && t < b; });
    const diasTreino = l => new Set(l.filter(x => x.kind === 'workout').map(x => new Date(x.created_at).toDateString())).size;
    const atual = naSemana(posts, 'created_at', ini, fim), ant = naSemana(posts, 'created_at', iniAnt, ini);
    const agua = atual.filter(x => x.kind === 'water').reduce((t, x) => t + (x.water_ml || 0), 0);
    const somaPts = (a, b) => Math.round(naSemana(pts, 'earned_at', a, b).reduce((t, x) => t + Number(x.amount || 0), 0));
    const horas = (sonos || []).map(x => Number(x.hours)).filter(h => h > 0);
    const { data: ofe } = await sb.from('daily_streaks').select('current_streak').eq('user_id', uid).maybeSingle();
    const treinosSem = atual.filter(x => x.kind === 'workout');
    const cont = {};
    treinosSem.forEach(x => { const k = x.activity_type || 'Treino'; cont[k] = (cont[k] || 0) + 1; });
    const maisFeito = Object.entries(cont).sort((a, b) => b[1] - a[1])[0] || null;
    const fimSem = new Date(ini.getTime() + 6 * 86400000);
    const candidatos = candidatosResumo({
        dias: diasTreino(atual), meta: state.profile.weekly_goal || 3, maisFeito,
        km: treinosSem.reduce((t, x) => t + Number(x.distance_km || 0), 0),
        ofensiva: ofe && ofe.current_streak,
        minutos: treinosSem.reduce((t, x) => t + (x.duration_min || 0), 0),
        aguaMedia: agua ? agua / 7 : 0,
        refeicoesBoas: atual.filter(x => x.kind === 'meal' && Number(x.meal_score) >= 7).length,
        sono: horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null,
        pontos: somaPts(ini, fim),
    });
    return {
        versiculo: versiculoDaSemana(),
        titulo: 'Minha semana',
        subtitulo: `${ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${new Date(Math.min(+fimSem, Date.now())).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        candidatos,
        ini, treinos: diasTreino(atual), treinosAnt: diasTreino(ant),
        minutos: atual.filter(x => x.kind === 'workout').reduce((t, x) => t + (x.duration_min || 0), 0),
        aguaMediaL: Math.round((agua / 7) / 100) / 10,
        sono: horas.length ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10 : null,
        pontos: somaPts(ini, fim), pontosAnt: somaPts(iniAnt, ini),
        meta: state.profile.weekly_goal || 3,
    };
}
function difTxt(a, b) { const d = a - b; return d === 0 ? 'igual à semana passada' : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs semana passada`; }

const VERSICULOS = [["Tudo é possível para quem tem fé", "Marcos 9:23"], ["Deus é a minha força e o meu escudo!", "Salmos 28:7"], ["Faça tudo com amor", "1 Coríntios 16:14"], ["O choro pode durar uma noite, mas a alegria vem ao amanhecer", "Salmos 30:5"], ["Seja forte e corajoso! Não desanime", "Josué 1:9"], ["Tudo posso naquele que me fortalece", "Filipenses 4:13"], ["O Senhor cuida de mim, nada me falta", "Salmos 23:1"], ["Confie no Senhor de todo o seu coração", "Provérbios 3:5"], ["A sua fé curou você", "Marcos 10:52"], ["Grandes coisas fez o Senhor por nós, e por isso estamos alegres", "Salmos 126:3"], ["O amor nunca falha", "1 Coríntios 13:8"], ["Deus é o meu refúgio e a minha fortaleza", "Salmos 46:1"], ["Entrega o teu caminho ao Senhor; confia nele, e ele o fará", "Salmos 37:5"], ["A alegria do Senhor é a nossa força", "Neemias 8:10"], ["Deus faz infinitamente mais do que pedimos ou pensamos", "Efésios 3:20"], ["O Senhor é bom, um refúgio em tempos de angústia", "Naum 1:7"], ["Lâmpada para os meus pés é a tua palavra e luz para o meu caminho", "Salmos 119:105"], ["Quem está em Cristo é nova criatura", "2 Coríntios 5:17"], ["Deus derramou o seu amor em nossos corações", "Romanos 5:5"], ["Tenha bom ânimo, eu venci o mundo", "João 16:33"], ["O Senhor renova as minhas forças", "Salmos 23:3"], ["Busquem em primeiro lugar o Reino de Deus", "Mateus 6:33"], ["A nossa esperança está firme no Senhor", "Salmos 33:20"], ["Combati o bom combate, acabei a carreira, guardei a fé", "2 Timóteo 4:7"], ["Deus é amor", "1 João 4:8"], ["O Senhor sustenta todos os que caem", "Salmos 145:14"], ["O fruto do Espírito é amor, alegria e paz", "Gálatas 5:22"], ["Revesti-vos de toda a armadura de Deus", "Efésios 6:11"], ["O Senhor te guardará de todo o mal", "Salmos 121:7"], ["Andemos por fé, e não por vista", "2 Coríntios 5:7"], ["O Senhor firma os passos do homem bom", "Salmos 37:23"], ["Deus dá força ao cansado e multiplica as forças ao que não tem nenhum vigor", "Isaías 40:29"], ["Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará", "Salmos 91:1"], ["O Senhor abençoará o seu povo com paz", "Salmos 29:11"], ["A sua graça me basta", "2 Coríntios 12:9"], ["Em paz me deito e logo pego no sono, porque só tu, Senhor, me fazes descansar", "Salmos 4:8"], ["O Senhor é a minha luz e a minha salvação; de quem terei medo?", "Salmos 27:1"], ["Deus sabe de todas as coisas", "1 João 3:20"], ["Tudo tem o seu tempo determinado debaixo do céu", "Eclesiastes 3:1"], ["O Senhor pelejará por vós, e vós calareis os vossos lábios", "Êxodo 14:14"], ["Guarda o teu coração do mal", "Provérbios 4:23"], ["Bem-aventurados os limpos de coração, porque eles verão a Deus", "Mateus 5:8"], ["A fé é a certeza das coisas que se esperam", "Hebreus 11:1"], ["Se Deus é por nós, quem será contra nós?", "Romanos 8:31"], ["Clama a mim, e responder-te-ei", "Jeremias 33:3"], ["O meu socorro vem do Senhor, que fez os céus e a terra", "Salmos 121:2"], ["O Senhor é compassivo e misericordioso", "Salmos 103:8"], ["Deus amou o mundo de tal maneira...", "João 3:16"], ["Não temas, porque eu sou contigo", "Isaías 43:5"], ["O Senhor é o meu rochedo, a minha fortaleza e o meu libertador", "Salmos 18:2"], ["Deus prova o seu amor para conosco em que Cristo morreu por nós", "Romanos 5:8"], ["O temor do Senhor é o princípio da sabedoria", "Provérbios 9:10"], ["Lança o teu fardo sobre o Senhor, e ele te susterá", "Salmos 55:22"], ["O justo viverá por fé", "Romanos 1:17"], ["Deus não nos deu espírito de covardia, mas de poder, de amor e de moderação", "2 Timóteo 1:7"], ["Buscai e achareis; batei e abrir-se-vos-á", "Mateus 7:7"], ["O Senhor guarda os simples; fui humilhado, e ele me salvou", "Salmos 116:6"], ["A palavra do nosso Deus permanece para sempre", "Isaías 40:8"], ["Guarda-me, ó Deus, porque em ti confio", "Salmos 16:1"], ["O Senhor coroa-te de graça e de misericórdia", "Salmos 103:4"], ["Cantai ao Senhor um cântico novo", "Salmos 96:1"], ["Habite em vós a palavra de Cristo ricamente", "Colossenses 3:16"], ["Deus é fiel, o qual não vos deixará tentar acima do que podeis suportar", "1 Coríntios 10:13"], ["O Senhor é grande e mui digno de louvor", "Salmos 48:1"], ["Creia no Senhor Jesus e serás salvo", "Atos 16:31"], ["A vereda dos justos é como a luz da aurora", "Provérbios 4:18"], ["Celebrai com júbilo ao Senhor, todos os moradores da terra", "Salmos 100:1"], ["O Senhor conhece os que andam na integridade", "Salmos 37:18"], ["Deus exalta os humildes", "Tiago 4:10"], ["A sabedoria é a coisa principal; adquire pois a sabedoria", "Provérbios 4:7"], ["Esperem no Senhor; tenham coragem e sejam fortes!", "Salmos 27:14"], ["Os que confiam no Senhor são como o monte de Sião", "Salmos 125:1"], ["O meu refúgio e a minha fortaleza são o meu Deus", "Salmos 91:2"], ["A paz de Deus, que excede todo o entendimento, guardará os vossos corações", "Filipenses 4:7"], ["O Senhor retribui a cada um conforme a sua justiça", "Salmos 18:24"], ["Bem-aventurados os que têm fome e sede de justiça", "Mateus 5:6"], ["O Senhor é a porção da minha herança", "Salmos 16:5"], ["Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia", "Salmos 46:1"], ["Guarda a tua língua do mal", "Salmos 34:13"], ["Deus escolheu as coisas loucas deste mundo para confundir as sábias", "1 Coríntios 1:27"], ["O Senhor dá sabedoria; da sua boca procedem a ciência e o entendimento", "Provérbios 2:6"], ["A palavra de Deus é viva e eficaz", "Hebreus 4:12"], ["O Senhor desfaz os conselhos das nações", "Salmos 33:10"], ["Deus habita nos louvores do seu povo", "Salmos 22:3"], ["O Senhor é justo em todos os seus caminhos", "Salmos 145:17"], ["A veracidade do Senhor dura para sempre", "Salmos 117:2"], ["O Senhor guarda todos os que o amam", "Salmos 145:20"], ["Deus é quem efetua em vós tanto o querer como o realizar", "Filipenses 2:13"], ["O Senhor abrirá o seu bom tesouro", "Deuteronômio 28:12"], ["A lei do Senhor é perfeita e refrigera a alma", "Salmos 19:7"], ["Deus enxugará de seus olhos toda lágrima", "Apocalipse 21:4"], ["O Senhor é o rei perpétuo e para sempre", "Salmos 10:16"], ["A benignidade do Senhor é melhor do que a vida", "Salmos 63:3"], ["O Senhor ouve a oração dos justos", "Provérbios 15:29"], ["Deus não vê como vê o homem", "1 Samuel 16:7"], ["O Senhor dá força ao seu povo", "Salmos 29:11"], ["A mansidão seja conhecida por todos os homens", "Filipenses 4:5"], ["O Senhor é o meu pastor; nada me faltará", "Salmos 23:1"], ["Deus é o nosso salvador", "Salmos 68:20"], ["O Senhor reina; regozije-se a terra", "Salmos 97:1"], ["A oração fervorosa de um justo tem muito poder", "Tiago 5:16"], ["Deus nos chamou para a paz", "1 Coríntios 7:15"], ["O Senhor orienta os passos do homem reto", "Provérbios 20:24"], ["A luz brilha nas trevas, e as trevas não a derrotaram", "João 1:5"], ["O Senhor salva a alma de seus servos", "Salmos 34:22"], ["Deus é fiel e justo para nos perdoar", "1 João 1:9"], ["O Senhor livra o seu povo de todas as angústias", "Salmos 34:17"], ["A esperança que se adia faz adoecer o coração, mas o desejo cumprido é árvore de vida", "Provérbios 13:12"], ["O Senhor guarda os passos dos seus fiéis", "1 Samuel 2:9"], ["Deus dá graça aos humildes", "Tiago 4:6"], ["O Senhor é a fortaleza da minha vida", "Salmos 27:1"], ["Acaso há alguma coisa difícil para o Senhor?", "Gênesis 18:14"], ["O Senhor cumpre o seu propósito para comigo", "Salmos 138:8"], ["Deus faz o solitário viver em família", "Salmos 68:6"], ["O Senhor fortalece o seu povo", "Salmos 29:11"], ["A nossa cidadania está nos céus", "Filipenses 3:20"], ["O Senhor ama a justiça e o juízo", "Salmos 33:5"], ["Deus supre todas as nossas necessidades segundo as suas riquezas", "Filipenses 4:19"], ["O Senhor dá sabedoria aos simples", "Salmos 19:7"], ["A palavra do Senhor é reta, e todas as suas obras são fiéis", "Salmos 33:4"], ["O Senhor sonda o coração e examina a mente", "Jeremias 17:10"], ["Deus é o nosso auxílio na tormenta", "Salmos 46:1"], ["O Senhor renova a tua juventude como a da águia", "Salmos 103:5"], ["A sabedoria do alto é primeiramente pura, depois pacífica", "Tiago 3:17"], ["O Senhor governa para sempre", "Salmos 146:10"], ["Deus está no meio dela; não será abalada", "Salmos 46:5"], ["O Senhor ama os que seguem a justiça", "Provérbios 15:9"], ["A graça e a verdade vieram por Jesus Cristo", "João 1:17"], ["O Senhor firma os céus com entendimento", "Salmos 136:5"], ["Deus nos abençoou com todas as bênçãos espirituais", "Efésios 1:3"], ["O Senhor é o criador dos confins da terra", "Isaías 40:28"], ["A justiça exalta as nações", "Provérbios 14:34"], ["O Senhor é bom para com todos", "Salmos 145:9"], ["Deus enviou o seu Filho ao mundo para que sejamos salvos", "1 João 4:9"], ["O Senhor dá alegria ao coração", "Salmos 4:7"], ["A veracidade do Senhor é eterna", "Salmos 100:5"], ["O Senhor olha do céu e vê todos os filhos dos homens", "Salmos 33:13"], ["Deus nos deu a vida eterna em seu Filho", "1 João 5:11"], ["O Senhor liberta os cativos", "Salmos 146:7"], ["A paciência de Deus nos leva ao arrependimento", "Romanos 2:4"], ["O Senhor estabelece a sua habitação no meio de nós", "Levítico 26:11"], ["Deus guia os mansos na justiça", "Salmos 25:9"], ["O Senhor cuida de mim todos os dias", "Salmos 68:19"], ["A paz esteja com todos vós em Cristo Jesus", "1 Pedro 5:14"], ["O Senhor é o Deus que me salva", "Salmos 88:1"], ["Tudo o que tem fôlego louve ao Senhor!", "Salmos 150:6"], ["Esforça-te, e tem bom ânimo", "Josué 1:9"], ["Deus é o que me cinge de força", "Salmos 18:32"]];

// Semana que o resumo mostra: sábado e domingo = semana atual; segunda = a que acabou
function semanaDoResumo() {
    const hoje = new Date();
    return inicioDaSemana(hoje.getDay() === 1 ? new Date(Date.now() - 86400000) : hoje);
}
// Aparece de sábado 12h até segunda 19h
function janelaDoResumo() {
    const a = new Date(), d = a.getDay(), h = a.getHours();
    return (d === 6 && h >= 12) || d === 0 || (d === 1 && h < 19);
}
// Um versículo por semana, sorteado e guardado (o card e a imagem mostram o mesmo)
function versiculoDaSemana() {
    // escolhido pela pessoa + semana: cada um tem o seu, igual em qualquer aparelho
    const semente = (state.session ? state.session.user.id : 'x') + '|' + isoDe(semanaDoResumo());
    let hsh = 2166136261;
    for (let k = 0; k < semente.length; k++) { hsh ^= semente.charCodeAt(k); hsh = Math.imul(hsh, 16777619); }
    return VERSICULOS[(hsh >>> 0) % VERSICULOS.length];
}

// Já postou o resumo desta semana? (vale em qualquer aparelho: olha o próprio story)
async function resumoJaPostado() {
    const sem = isoDe(semanaDoResumo());
    if (lsGet('pulso-resumo-postado-' + state.session.user.id) === sem) return true;
    try {
        const { data } = await sb.from('stories').select('id')
            .eq('user_id', state.session.user.id).eq('style->>resumo_semana', sem).limit(1);
        if (data && data.length) { lsSet('pulso-resumo-postado-' + state.session.user.id, sem); return true; }
    } catch (_) {}
    return false;
}

async function hydrateResumoSemana() {
    const slot = document.getElementById('resumoSlot');
    if (!slot) return;
    if (!janelaDoResumo()) { slot.innerHTML = ''; return; }
    const chave = 'pulso-resumo-' + isoDe(semanaDoResumo());
    // fechou 2 vezes: só na semana que vem; fechou 1 vez: só no dia seguinte
    let fech = {};
    try { fech = JSON.parse(lsGet(chave) || '{}'); } catch (_) {}
    if ((fech.vezes || 0) >= 2 || fech.dia === hojeISO()) { slot.innerHTML = ''; return; }
    if (await resumoJaPostado()) { slot.innerHTML = ''; return; }
    const d = await dadosDaSemana();
    state.resumoSemana = d;
    if (!document.getElementById('resumoSlot')) return;
    slot.innerHTML = `<div class="dc-card resumo-card">
        <button class="dc-x" data-act="fechar-resumo" data-chave="${chave}" aria-label="Fechar">×</button>
        <div class="dc-topo"><span class="dc-emo">📊</span><div><b>Resumo da semana</b><small>${d.ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${new Date(Math.min(d.ini.getTime() + 6 * 86400000, Date.now())).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small></div></div>
        <div class="resumo-grade">
            <div><b>${d.treinos}<small>/${d.meta}</small></b><span>treinos</span><em>${difTxt(d.treinos, d.treinosAnt)}</em></div>
            <div><b>${d.pontos}</b><span>pontos</span><em>${difTxt(d.pontos, d.pontosAnt)}</em></div>
            <div><b>${String(d.aguaMediaL).replace('.', ',')}<small> L</small></b><span>água por dia</span></div>
            <div><b>${d.sono != null ? String(d.sono).replace('.', ',') + '<small> h</small>' : '-'}</b><span>sono médio</span></div>
        </div>
        ${d.versiculo ? `<p class="resumo-verso">“${escapeHTML(d.versiculo[0])}”<span>${escapeHTML(d.versiculo[1])}</span></p>` : ''}
        <button class="btn-secondary resumo-story" data-act="resumo-story">Postar como story</button>
    </div>`;
}

// Evolução › Resumo: o caminho normal pra postar a semana, a qualquer momento
async function hydrateSemanaEvo() {
    const slot = document.getElementById('semanaEvoSlot');
    if (!slot) return;
    if (!janelaDoResumo()) { slot.innerHTML = ''; return; } // só de sábado 12h a segunda 19h
    if (await resumoJaPostado()) { slot.innerHTML = ''; return; }
    const d = await dadosDaSemana();
    state.resumoSemana = d;
    if (!document.getElementById('semanaEvoSlot')) return;
    const fimSemana = new Date(d.ini.getTime() + 6 * 86400000);
    const fim = new Date(Math.min(+fimSemana, Date.now()));
    slot.innerHTML = `<div class="chart-card semana-evo">
        <div class="chart-head"><span class="chart-title">Resumo da semana</span><span class="chart-legend">${d.ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></div>
        <div class="se-linha"><span><b>${d.treinos}</b>/${d.meta} treinos</span><span><b>${d.pontos}</b> pontos</span>${d.sono != null ? `<span><b>${String(d.sono).replace('.', ',')}</b> h de sono</span>` : ''}</div>
        <button class="btn-secondary resumo-story" data-act="resumo-story">Postar como story</button>
    </div>`;
}

// Monta a imagem 1080x1920 do resumo pra virar story
async function imagemResumoSemana(d) {
    const fimSem = new Date(d.ini.getTime() + 6 * 86400000);
    return imagemResumo({
        titulo: 'Minha semana',
        subtitulo: `${d.ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${fimSem.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        itens: [
            [`${d.treinos}/${d.meta}`, 'treinos na semana', d.treinos >= d.meta],
            [String(d.pontos), 'pontos'],
            [String(d.aguaMediaL).replace('.', ',') + ' L', 'de água por dia'],
            [d.sono != null ? String(d.sono).replace('.', ',') + ' h' : '-', 'de sono por noite'],
        ],
    });
}
async function imagemResumo(r) {
    const d = r;
    try { await document.fonts.load('700 80px "Space Grotesk"'); } catch (_) {}
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#0A0C0B'); bg.addColorStop(1, '#0F1F18');
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
    g.fillStyle = 'rgba(53,225,155,.14)';
    g.beginPath(); g.arc(980, 180, 360, 0, Math.PI * 2); g.fill();
    const F = (peso, tam) => `${peso} ${tam}px "Space Grotesk", Inter, sans-serif`;
    g.fillStyle = '#F1F4F1'; g.font = F(700, 64); g.fillText('Pulso', 90, 170);
    g.fillStyle = '#35E19B'; g.fillText('.', 90 + g.measureText('Pulso').width, 170);
    g.fillStyle = '#F1F4F1'; g.font = F(700, 104); g.fillText(r.titulo, 90, 400);
    g.fillStyle = '#8B948C'; g.font = F(500, 44);
    if (r.subtitulo) g.fillText(r.subtitulo, 90, 480);
    const itens = r.itens.slice(0, r.versiculo ? 4 : 5);
    const passo = itens.length > 4 ? 235 : 270;
    itens.forEach(([n, l, destaque], i) => {
        const y = 700 + i * passo;
        g.fillStyle = 'rgba(255,255,255,.06)';
        const alt = passo - 40;
        if (g.roundRect) { g.beginPath(); g.roundRect(90, y - 150, 900, alt, 36); g.fill(); } else g.fillRect(90, y - 150, 900, alt);
        g.fillStyle = destaque ? '#35E19B' : '#F1F4F1';
        let tam = 110; g.font = F(700, tam);
        while (g.measureText(n).width > 800 && tam > 56) { tam -= 6; g.font = F(700, tam); }
        const apertado = passo < 250;
        g.fillText(n, 140, y - (apertado ? 32 : 12));
        g.fillStyle = '#8B948C'; g.font = F(500, apertado ? 36 : 40); g.fillText(l, 140, y + (apertado ? 20 : 42));
    });
        if (r.versiculo) {
        // versículo da semana, centralizado no rodapé
        const [texto, ref] = r.versiculo;
        g.textAlign = 'center';
        g.fillStyle = '#C9D0CA';
        g.font = `italic 500 40px "Space Grotesk", Inter, sans-serif`;
        const palavras = ('“' + texto + '”').split(' ');
        const linhas = []; let linha = '';
        palavras.forEach(p => { const t = linha ? linha + ' ' + p : p; if (g.measureText(t).width > 880 && linha) { linhas.push(linha); linha = p; } else linha = t; });
        if (linha) linhas.push(linha);
        const base = 1800 - (linhas.length - 1) * 52;
        linhas.slice(0, 3).forEach((l, k) => g.fillText(l, 540, base + k * 52 - 40));
        g.fillStyle = '#35E19B'; g.font = `600 32px Inter, sans-serif`;
        g.fillText(ref, 540, base + Math.min(linhas.length, 3) * 52 - 20);
        g.textAlign = 'left';
    }
    return await new Promise(r => cv.toBlob(b => r(b), 'image/jpeg', 0.92));
}

// ---- Aviso de metas no perfil (só a própria pessoa vê) ----
// Aparece só quando precisa de ação: sem prazo, prazo vencido, reta final ou meta batida.
function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

async function montarCardMetas(goal) {
    const p = state.profile;
    const DIA = 86400000;
    const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
    const prazo = p.goal_deadline ? new Date(p.goal_deadline + 'T23:59:59') : null;
    const meta = Number(p.target_weight || 0);
    const atual = goal && goal.peso_atual ? Number(goal.peso_atual) : null;
    const inicial = goal && goal.peso_inicial ? Number(goal.peso_inicial) : null;
    const dataCurta = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const aviso = (emo, titulo, texto, botoes, fechar) => `<div class="meta-aviso">
        ${fechar ? `<button class="dc-x" data-act="meta-fechar" data-chave="${fechar}" aria-label="Fechar">×</button>` : ''}
        <div class="ma-topo"><span class="ma-emo">${emo}</span><div><b>${titulo}</b>${texto ? `<p>${texto}</p>` : ''}</div></div>
        <div class="ma-botoes">${botoes}</div>
    </div>`;

    // 1) Meta de peso batida: comemora e convida pra próxima
    if (meta > 0 && atual != null && inicial != null && Math.abs(inicial - meta) >= 0.5) {
        const perdendo = meta < inicial;
        const chegou = perdendo ? atual <= meta + 0.05 : atual >= meta - 0.05;
        const chave = 'pulso-meta-batida-' + meta;
        if (chegou && lsGet(chave) !== '1') {
            return aviso('🎉', `Você chegou nos ${kgTxt(meta)} kg!`, 'Meta batida. Quer definir a próxima?',
                `<button class="btn-ghost btn-xs" data-act="meta-fechar" data-chave="${chave}">Agora não</button>
                 <button class="btn-primary-sm" data-act="m-go" data-view="objetivos">Definir próxima meta</button>`, null);
        }
    }

    // 2) Prazo vencido: renovar com um toque
    if (prazo && prazo < hoje0) {
        return aviso('⏰', `Seu prazo de ${dataCurta(prazo)} passou`, 'Bora renovar? Com um prazo novo o coach volta a calcular seu ritmo.',
            `<button class="btn-ghost btn-xs" data-act="meta-renovar" data-sem="4">+4 semanas</button>
             <button class="btn-ghost btn-xs" data-act="meta-renovar" data-sem="8">+8 semanas</button>
             <button class="btn-primary-sm" data-act="m-go" data-view="objetivos">Ajustar meta</button>`, null);
    }

    // 3) Reta final: última semana antes do prazo
    if (prazo) {
        const dias = Math.ceil((prazo - Date.now()) / DIA);
        const chave = 'pulso-reta-final-' + p.goal_deadline;
        if (dias <= 7 && lsGet(chave) !== '1') {
            const falta = meta > 0 && atual != null ? Math.abs(atual - meta) : null;
            const txt = falta != null && falta >= 0.1 ? `Faltam ${kgTxt(falta)} kg e ${dias <= 1 ? 'só hoje' : dias + ' dias'}.` : `${dias <= 1 ? 'O prazo é hoje' : 'Faltam ' + dias + ' dias'}. Cada treino conta agora.`;
            return aviso('🏁', 'Última semana da sua meta', txt,
                `<button class="btn-primary-sm" data-act="m-go" data-view="progress">Ver meu ritmo</button>`, chave);
        }
        return ''; // tudo definido e em andamento: não precisa aparecer
    }

    // 4) Sem objetivo ou sem prazo (respeita o "Agora não" por 7 dias)
    const soneca = Number(lsGet('pulso-meta-soneca') || 0);
    if (Date.now() - soneca < 7 * DIA) return '';
    const semObjetivo = !p.goal;
    return aviso('🎯', semObjetivo ? 'Você ainda não definiu um objetivo' : 'Sua meta ainda não tem prazo',
        semObjetivo ? 'Com um objetivo, o coach monta treinos e dicas pensados pra você.' : 'Com uma data, o coach consegue te dizer se o ritmo está bom.',
        `<button class="btn-ghost btn-xs" data-act="meta-soneca">Agora não</button>
         <button class="btn-primary-sm" data-act="m-go" data-view="objetivos">${semObjetivo ? 'Definir objetivo' : 'Definir prazo'}</button>`, null);
}

// Duas batidinhas na foto do post = curtir (com coração animado)
(function curtirComDuploToque() {
    let ultimo = 0, alvoAnterior = null;
    const curtir = foto => {
        const post = foto.closest('.post');
        if (!post) return;
        const coracao = document.createElement('div');
        coracao.className = 'dbl-coracao';
        coracao.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        const wrap = foto.parentElement;
        if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
        coracao.style.top = (foto.offsetTop + foto.offsetHeight / 2) + 'px';
        coracao.style.left = (foto.offsetLeft + foto.offsetWidth / 2) + 'px';
        wrap.appendChild(coracao);
        setTimeout(() => coracao.remove(), 900);
        const btn = post.querySelector('[data-act="react"]');
        if (btn && !btn.classList.contains('on')) btn.click();
    };
    document.addEventListener('click', e => {
        const foto = e.target.closest('.post .post-photo');
        if (!foto) return;
        const agora = Date.now();
        if (alvoAnterior === foto && agora - ultimo < 320) { curtir(foto); ultimo = 0; alvoAnterior = null; return; }
        ultimo = agora; alvoAnterior = foto;
    });
})();

// ============================================================
// PESSOAS SUGERIDAS E PRIMEIROS PASSOS
// ============================================================
function linhaSugestao(u) {
    return `<div class="follow-row sug-row">
        <span data-act="view-user" data-uid="${u.id}">${avatarHTML(u, 'sm')}</span>
        <div style="flex:1;min-width:0" data-act="view-user" data-uid="${u.id}">
            <div class="follow-name">${escapeHTML(u.display_name || '')}</div>
            <div class="follow-uname">${escapeHTML(u.motivo || '@' + (u.username || ''))}</div>
        </div>
        <button class="btn-mini sug-seguir" data-act="sug-seguir" data-uid="${u.id}">Seguir</button>
    </div>`;
}
async function carregarSugestoes(lim = 8) {
    const { data } = await sb.rpc('suggested_people', { lim });
    return data || [];
}

const ONB_PASSOS = ['objetivo', 'treino', 'pessoas', 'desafios'];
async function abrirPrimeirosPassos(passo = 0) {
    let tela = document.getElementById('onbTela');
    if (!tela) { tela = document.createElement('div'); tela.id = 'onbTela'; tela.className = 'onb'; document.body.appendChild(tela); }
    document.body.style.overflow = 'hidden';
    const p = state.profile;
    state.onb = state.onb || { goal: p.goal || null, likes: new Set(p.train_likes || []), semana: p.weekly_goal || 3 };
    const o = state.onb;
    const pontos = ONB_PASSOS.map((_, k) => `<i class="${k <= passo ? 'on' : ''}"></i>`).join('');
    const topo = `<div class="onb-topo"><div class="onb-pontos">${pontos}</div><button class="onb-pular" data-onb="pular">Pular</button></div>`;
    const rodape = (txt = 'Continuar', desab = false) => `<button class="btn-primary onb-ok" data-onb="proximo" ${desab ? 'disabled' : ''}>${txt}</button>`;
    let corpo = '';
    if (ONB_PASSOS[passo] === 'objetivo') {
        corpo = `<h2>Bem-vindo ao Pulso, ${escapeHTML(String(p.display_name || '').split(' ')[0])}!</h2>
            <p>Qual é o seu foco agora? O coach usa isso pra te ajudar.</p>
            <div class="goal-grid">${OBJETIVOS.map(([v, nome, desc]) => `<button type="button" class="goal-btn${o.goal === v ? ' on' : ''}" data-onb-goal="${v}"><span class="goal-nome">${nome}</span><span class="goal-desc">${desc}</span></button>`).join('')}</div>
            ${rodape('Continuar', !o.goal)}`;
    } else if (ONB_PASSOS[passo] === 'treino') {
        corpo = `<h2>Como você gosta de se mexer?</h2>
            <p>Escolha o que curte. Dá pra mudar quando quiser.</p>
            <div class="chip-row onb-likes">${MODALIDADES.map(m => `<button type="button" class="chip${o.likes.has(m) ? ' on' : ''}" data-onb-like="${m}">${m}</button>`).join('')}</div>
            <div class="onb-sub">Quantos treinos por semana?</div>
            <div class="obj-dias">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="obj-dia${o.semana === n ? ' on' : ''}" data-onb-semana="${n}">${n}</button>`).join('')}</div>
            ${rodape()}`;
    } else if (ONB_PASSOS[passo] === 'pessoas') {
        corpo = `<h2>Treinar junto é mais fácil</h2>
            <p>Siga algumas pessoas pra ver os treinos delas no seu feed.</p>
            <div class="follow-list onb-lista" id="onbPessoas"><div class="spinner"></div></div>
            ${rodape()}`;
    } else {
        corpo = `<h2>Entre num desafio</h2>
            <p>É no desafio que a mágica acontece: ranking, times e o grupo te puxando.</p>
            <div id="onbDesafios"><div class="spinner"></div></div>
            ${rodape('Começar a usar')}`;
    }
    tela.innerHTML = `<div class="onb-card">${topo}<div class="onb-corpo">${corpo}</div></div>`;

    if (ONB_PASSOS[passo] === 'pessoas') {
        const lista = await carregarSugestoes(8);
        const box = document.getElementById('onbPessoas');
        if (box) box.innerHTML = lista.length ? lista.map(linhaSugestao).join('') : '<p class="faixa-nota">Assim que mais gente entrar, as sugestões aparecem aqui.</p>';
    }
    if (ONB_PASSOS[passo] === 'desafios') {
        const { data } = await sb.rpc('list_challenges');
        const abertos = (data || []).filter(c => c.status !== 'encerrado' && !c.im_member).slice(0, 4);
        const box = document.getElementById('onbDesafios');
        if (box) box.innerHTML = abertos.length ? abertos.map(c => `<div class="onb-desafio">
            <div><b>${escapeHTML(c.name)}</b><small>${c.members || 0} participantes · ${c.status === 'futuro' ? 'começa em breve' : 'rolando agora'}</small></div>
            <button class="btn-mini" data-act="${c.is_open ? 'join-challenge' : 'pedir-acesso'}" data-id="${c.id}">${c.is_open ? 'Entrar' : 'Pedir entrada'}</button>
        </div>`).join('') : '<p class="faixa-nota">Nenhum desafio aberto agora. Quando tiver, ele aparece na aba Desafio.</p>';
    }
}
async function concluirPrimeirosPassos() {
    const o = state.onb || {};
    const dados = { onboarding_done: true };
    if (o.goal) dados.goal = o.goal;
    if (o.likes && o.likes.size) dados.train_likes = [...o.likes];
    if (o.semana) dados.weekly_goal = o.semana;
    await sb.from('profiles').update(dados).eq('id', state.session.user.id);
    Object.assign(state.profile, dados);
    state.coachContext = null;
    const tela = document.getElementById('onbTela'); if (tela) tela.remove();
    document.body.style.overflow = '';
    state.onb = null;
    toast('Tudo pronto! Bora pro primeiro registro 💪', 'ok');
    if (state.view === 'feed') renderFeed(); else switchView('feed');
}
document.addEventListener('click', async e => {
    const tela = document.getElementById('onbTela');
    if (!tela || !tela.contains(e.target)) return;
    const o = state.onb;
    const g = e.target.closest('[data-onb-goal]');
    if (g) { o.goal = g.dataset.onbGoal; abrirPrimeirosPassos(0); return; }
    const l = e.target.closest('[data-onb-like]');
    if (l) { o.likes.has(l.dataset.onbLike) ? o.likes.delete(l.dataset.onbLike) : o.likes.add(l.dataset.onbLike); l.classList.toggle('on'); return; }
    const sm = e.target.closest('[data-onb-semana]');
    if (sm) { o.semana = Number(sm.dataset.onbSemana); tela.querySelectorAll('[data-onb-semana]').forEach(x => x.classList.toggle('on', x === sm)); return; }
    const b = e.target.closest('[data-onb]');
    if (!b) return;
    const atual = ONB_PASSOS.findIndex((_, k) => tela.querySelectorAll('.onb-pontos i.on').length - 1 === k);
    if (b.dataset.onb === 'pular' || (b.dataset.onb === 'proximo' && atual >= ONB_PASSOS.length - 1)) { concluirPrimeirosPassos(); return; }
    abrirPrimeirosPassos(atual + 1);
});

// Esqueletos de carregamento (no lugar da rodinha)
function esqueleto(tipo) {
    const b = (w, h, extra = '') => `<span class="esq" style="width:${w};height:${h}px;${extra}"></span>`;
    if (tipo === 'feed') return `<div class="view feed-view esq-wrap">
        <div class="esq-linha">${b('62px', 62, 'border-radius:50%')}${b('62px', 62, 'border-radius:50%')}${b('62px', 62, 'border-radius:50%')}</div>
        ${[1, 2].map(() => `<div class="esq-post"><div class="esq-linha">${b('40px', 40, 'border-radius:50%')}<div style="flex:1">${b('40%', 12)}${b('25%', 10, 'margin-top:6px')}</div></div>${b('100%', 300, 'border-radius:14px;margin-top:12px')}</div>`).join('')}
    </div>`;
    if (tipo === 'perfil') return `<div class="view esq-wrap">
        <div class="esq-linha">${b('88px', 88, 'border-radius:50%')}<div style="flex:1;display:flex;justify-content:space-around">${b('40px', 34)}${b('50px', 34)}${b('50px', 34)}</div></div>
        ${b('35%', 14, 'margin-top:16px')}${b('100%', 38, 'margin-top:14px;border-radius:12px')}
        <div class="esq-grade">${Array.from({ length: 6 }, () => b('100%', 0, 'aspect-ratio:1;height:auto')).join('')}</div>
    </div>`;
    return `<div class="view esq-wrap">${b('55%', 26)}${b('30%', 12, 'margin-top:8px')}${b('100%', 170, 'margin-top:18px;border-radius:20px')}${b('100%', 220, 'margin-top:14px;border-radius:20px')}</div>`;
}

// Puxar pra atualizar o feed (arrastar pra baixo no topo)
(function puxarParaAtualizar() {
    let inicioY = null, puxou = 0, atualizando = false;
    const ind = document.createElement('div');
    ind.className = 'ptr';
    ind.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>';
    document.body.appendChild(ind);
    const pode = () => state.view === 'feed' && window.scrollY <= 0 && !document.querySelector('.sheet.on, .sc.on, .story-viewer.on, .posts-viewer, #onbTela');
    window.addEventListener('touchstart', e => { inicioY = pode() && !atualizando ? e.touches[0].clientY : null; puxou = 0; }, { passive: true });
    window.addEventListener('touchmove', e => {
        if (inicioY == null) return;
        puxou = Math.max(0, Math.min(110, (e.touches[0].clientY - inicioY) * 0.5));
        if (puxou > 4) {
            ind.style.transform = `translate(-50%, ${puxou}px) rotate(${puxou * 3}deg)`;
            ind.style.opacity = Math.min(1, puxou / 60);
            ind.classList.toggle('pronto', puxou >= 60);
        }
    }, { passive: true });
    window.addEventListener('touchend', async () => {
        if (inicioY == null) return;
        inicioY = null;
        if (puxou >= 60 && !atualizando) {
            atualizando = true;
            ind.classList.add('girando');
            ind.style.transform = 'translate(-50%, 60px)';
            try { await renderFeed(); } catch (_) {}
            atualizando = false;
            ind.classList.remove('girando', 'pronto');
        }
        ind.style.transform = 'translate(-50%, 0)';
        ind.style.opacity = 0;
        puxou = 0;
    });
})();

// Selo de Fundador (primeiras 100 contas aprovadas): só no perfil, ao lado do nome
const SELO_FUNDADOR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.2l1.45 2.95 3.25.47-2.35 2.3.55 3.23L12 14.62l-2.9 1.53.55-3.23-2.35-2.3 3.25-.47z"/></svg>';
const seloHTML = p => p && p.fundador ? `<button class="selo-fundador" data-act="ver-selo" data-desde="${p.created_at || ''}" aria-label="Membro fundador">${SELO_FUNDADOR}</button>` : '';

// ---- Segurar o + : atalhos rápidos em arco (fica aberto; toca no item; toca fora fecha) ----
(function atalhosDoMais() {
    const fab = document.getElementById('postFab');
    if (!fab) return;
    let timer = null, ignorarClique = false;
    const limparSelecao = () => { try { window.getSelection().removeAllRanges(); } catch (_) {} };
    const abrir = async () => {
        ignorarClique = true;
        limparSelecao();
        if (navigator.vibrate) navigator.vibrate(12);
        const manha = new Date().getHours() < 11;
        let mostrarSono = false;
        if (manha) {
            // de manhã, Sono no lugar do Story, a não ser que a noite passada já esteja registrada
            const ontem = isoDe(new Date(Date.now() - 86400000));
            if (state.sonoRegistrado === ontem) mostrarSono = false;
            else {
                const { data: sn } = await sb.from('sleep_logs').select('slept_on').eq('user_id', state.session.user.id).eq('slept_on', ontem).limit(1);
                if (sn && sn.length) state.sonoRegistrado = ontem; else mostrarSono = true;
            }
        }
        const itens = [
            mostrarSono ? { k: 'sleep', emo: '😴', txt: 'Sono' } : { k: 'story', emo: '📸', txt: 'Story' },
            { k: 'agua', emo: '💧', txt: 'Água' },
            { k: 'workout', emo: '🏋️', txt: 'Treino' },
            { k: 'meal', emo: '🍽️', txt: 'Refeição' },
        ];
        const angulos = [160, 117, 63, 20];
        const r = fab.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, raio = 122;
        const arco = document.createElement('div');
        arco.className = 'fab-arco';
        arco.innerHTML = itens.map((it, k) => {
            const x = cx + raio * Math.cos(angulos[k] * Math.PI / 180), y = cy - raio * Math.sin(angulos[k] * Math.PI / 180);
            return `<button type="button" class="fab-bola" data-k="${it.k}" style="left:${x}px;top:${y}px;transition-delay:${k * 25}ms"><span>${it.emo}</span><small>${it.txt}</small></button>`;
        }).join('') + `<button type="button" class="fab-fechar" style="left:${cx}px;top:${cy}px" aria-label="Fechar">×</button>`;
        document.body.appendChild(arco);
        requestAnimationFrame(() => arco.classList.add('on'));
        const fechar = () => { arco.classList.remove('on'); setTimeout(() => arco.remove(), 160); };
        arco.addEventListener('click', e => {
            const op = e.target.closest('.fab-bola');
            fechar();
            if (op) usarAtalho(op.dataset.k);
        });
    };
    fab.addEventListener('touchstart', limparSelecao, { passive: true });
    fab.addEventListener('pointerdown', () => { ignorarClique = false; clearTimeout(timer); timer = setTimeout(abrir, 600); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => fab.addEventListener(ev, () => { clearTimeout(timer); limparSelecao(); }));
    fab.addEventListener('contextmenu', e => e.preventDefault());
    fab.addEventListener('click', e => { if (ignorarClique) { e.stopImmediatePropagation(); e.preventDefault(); ignorarClique = false; } }, true);
})();
// Copo de água mais usado (pro atalho "+250 ml" virar o tamanho de cada um)
async function carregarCopoAgua() {
    if (!state.session) return;
    const { data } = await sb.from('posts').select('water_ml').eq('user_id', state.session.user.id).eq('kind', 'water')
        .order('created_at', { ascending: false }).limit(40);
    const cont = {};
    (data || []).forEach(r => { if (r.water_ml) cont[r.water_ml] = (cont[r.water_ml] || 0) + 1; });
    const top = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) state.copoAgua = Number(top[0]);
}
async function usarAtalho(k) {
    if (k === 'agua') { registrarAguaRapida(state.copoAgua || 250); return; }
    if (k === 'story') { openStoryCreator(); return; }
    contarUsoAtalho({ workout: 'treino', meal: 'refeicao', sleep: 'sono' }[k]);
    $('#tileDesafio').classList.toggle('hidden', !podeCriarDesafio());
    limparComposer();
    $('#composerPick').classList.add('hidden');
    $('#composerForm').classList.remove('hidden');
    setComposerKind(k);
    abrirComposer();
}
async function registrarAguaRapida(ml) {
    contarUsoAtalho('agua');
    const { data: criado, error } = await sb.from('posts').insert({
        user_id: state.session.user.id, kind: 'water', water_ml: ml, visibility: 'private', is_public: false, in_feed: false,
    }).select().single();
    if (error) {
        if (!navigator.onLine) { guardarNaFila({ tipo: 'post', post: { kind: 'water', water_ml: ml, visibility: 'private', is_public: false, in_feed: false } }); toast('Sem internet agora. Guardei e envio assim que voltar.', 'ok'); return; }
        toast(msgErro(error), 'err'); return;
    }
    await updateStreak(hojeISO());
    loadScore();
    toastComAcao(`+${ml} ml de água`, 'Desfazer', async () => {
        await sb.from('posts').delete().eq('id', criado.id).eq('user_id', state.session.user.id);
        loadScore();
        toast('Registro desfeito', 'ok');
    });
    if (typeof hydrateLembretes === 'function') hydrateLembretes();
}
// dica do atalho: aparece uma única vez, na primeira vez que a pessoa abre o +
function dicaDoMais() {
    const k = 'pulso-dica-mais-' + state.session.user.id;
    if (lsGet(k)) return;
    lsSet(k, '1');
    setTimeout(() => toast('Dica: segure o + pra atalhos rápidos, como água com um gesto só', 'ok'), 400);
}

// Faixa de "sem conexão" no topo
(function avisoSemInternet() {
    const faixa = document.createElement('div');
    faixa.className = 'sem-net';
    faixa.textContent = 'Sem conexão. O que você registrar será enviado quando voltar.';
    document.body.appendChild(faixa);
    const atualizar = () => faixa.classList.toggle('on', !navigator.onLine);
    window.addEventListener('online', () => { atualizar(); toast('Conexão de volta ✓', 'ok'); });
    window.addEventListener('offline', atualizar);
    atualizar();
})();

// Deslizar pro lado troca de aba (Evolução e perfil)
(function deslizarEntreAbas() {
    let x0 = null, y0 = null, alvo = null;
    document.addEventListener('touchstart', e => {
        alvo = null;
        if (document.querySelector('.sheet.on, .story-viewer.on, .posts-viewer, .msg-camada, #onbTela')) return;
        const t = e.target;
        if (t.closest('.cal-mes, .ed-grade, .tr-chips, .cm-grade, input, textarea, .chart-card svg, .destaques, .stories-row, .pd-card, .adm-filtros, .evo-abas, .ig-tabs')) return;
        if (state.view === 'progress') alvo = '.evo-abas .evo-aba';
        else if (state.view === 'profile' || state.view === 'user-profile') alvo = '.ig-tabs .ig-tab';
        else return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!alvo || x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
        const abas = [...document.querySelectorAll(alvo)];
        const i = abas.findIndex(b => b.classList.contains('on'));
        const prox = abas[i + (dx < 0 ? 1 : -1)];
        if (prox) { prox.click(); prox.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
    }, { passive: true });
})();

// Converte fotos antigas em HEIC (formato do iPhone) pra JPEG, pra abrirem no Android e no computador.
// Só roda num iPhone (é ele que consegue ler o HEIC), uma vez por semana, nas fotos da própria pessoa.
async function converterFotosHeic() {
    if (!state.session || tipoAparelho() !== 'iphone') return;
    const chave = 'pulso-heic-' + state.session.user.id;
    if (Date.now() - Number(lsGet(chave) || 0) < 7 * 86400000) return;
    lsSet(chave, String(Date.now()));
    const uid = state.session.user.id;
    const ehHeic = u => typeof u === 'string' && /\.(heic|heif)(\?|$)/i.test(u);
    const converter = async url => {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('baixar');
        const original = await resp.blob();
        const arquivo = new File([original], 'foto.heic', { type: 'image/heic' });
        const jpg = await compressImage(arquivo, 1200, 0.82);
        if (!jpg || jpg === arquivo || jpg.type !== 'image/jpeg') throw new Error('converter');
        const caminho = `${uid}/${Date.now()}-conv.jpg`;
        const { error } = await sb.storage.from('post-images').upload(caminho, jpg, { contentType: 'image/jpeg' });
        if (error) throw error;
        return sb.storage.from('post-images').getPublicUrl(caminho).data.publicUrl;
    };
    try {
        const { data: posts } = await sb.from('posts').select('id, image_url, thumb_url')
            .eq('user_id', uid).or('image_url.ilike.%.heic,image_url.ilike.%.heif').limit(15);
        for (const p of posts || []) {
            try {
                const novo = await converter(p.image_url);
                const mudanca = { image_url: novo };
                if (!p.thumb_url || ehHeic(p.thumb_url)) mudanca.thumb_url = novo;
                await sb.from('posts').update(mudanca).eq('id', p.id).eq('user_id', uid);
                removeStoredImage(p.image_url);
            } catch (_) {}
        }
        const { data: sts } = await sb.from('stories').select('id, image_url')
            .eq('user_id', uid).or('image_url.ilike.%.heic,image_url.ilike.%.heif').limit(10);
        for (const st of sts || []) {
            try {
                const novo = await converter(st.image_url);
                await sb.from('stories').update({ image_url: novo }).eq('id', st.id).eq('user_id', uid);
                await sb.from('story_highlight_items').update({ image_url: novo }).eq('image_url', st.image_url);
            } catch (_) {}
        }
    } catch (_) {}
}

// ---- Refeições com análise pendente (a IA falhou na hora): tenta de novo ----
async function analisarRefeicao(id) {
    const { data: p } = await sb.from('posts').select('id, image_url, meta, meal_score').eq('id', id).eq('user_id', state.session.user.id).maybeSingle();
    if (!p || p.meal_score != null || !p.image_url) return { ok: false };
    const urlIA = ehPrivada(p.image_url) ? await linkPrivado(p.image_url, 600) : p.image_url;
    const { data: an, error } = await sb.functions.invoke('analyze-meal', { body: { imageUrl: urlIA } });
    if (error || !an || typeof an.score !== 'number') return { ok: false };
    const meta = { ...(p.meta || {}) }; delete meta.analise_pendente;
    await sb.from('posts').update({ meal_score: an.score, meal_analysis: an.analysis || null, meta }).eq('id', id).eq('user_id', state.session.user.id);
    const { data: pts } = await sb.rpc('creditar_refeicao_analisada', { pid: id });
    return { ok: true, nota: an.score, pts: Number(pts || 0) };
}
async function tentarAnalisesPendentes() {
    if (!state.session) return;
    const desde = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await sb.from('posts').select('id').eq('user_id', state.session.user.id).eq('kind', 'meal')
        .is('meal_score', null).not('image_url', 'is', null).eq('meta->>analise_pendente', 'true').gte('created_at', desde).limit(5);
    let feitas = 0, pontos = 0;
    for (const p of data || []) {
        const r = await analisarRefeicao(p.id);
        if (!r.ok) break; // a IA ainda está fora: tenta na próxima abertura
        feitas++; pontos += r.pts;
    }
    if (feitas) { loadScore(); toast(`${feitas === 1 ? 'A refeição pendente foi analisada' : feitas + ' refeições pendentes foram analisadas'}${pontos ? ` · +${pontos} pts` : ''}`, 'ok'); }
}

// Faxina: fotos dos seus stories vencidos há mais de 30 dias e fora de destaques (1 vez por semana)
async function limparStoriesAntigos() {
    if (!state.session) return;
    const chave = 'pulso-faxina-' + state.session.user.id;
    if (Date.now() - Number(lsGet(chave) || 0) < 7 * 86400000) return;
    lsSet(chave, String(Date.now()));
    try {
        const limite = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: velhos } = await sb.from('stories').select('id, image_url')
            .eq('user_id', state.session.user.id).lt('created_at', limite).limit(100);
        if (!velhos || !velhos.length) return;
        const { data: dest } = await sb.from('story_highlight_items').select('image_url, source_story_id');
        const usadas = new Set((dest || []).map(x => x.image_url).filter(Boolean));
        const usadosIds = new Set((dest || []).map(x => x.source_story_id).filter(Boolean));
        const apagar = velhos.filter(v => !usadosIds.has(v.id) && !(v.image_url && usadas.has(v.image_url)));
        for (const v of apagar) {
            if (v.image_url) await removeStoredImage(v.image_url);
            await sb.from('stories').delete().eq('id', v.id);
        }
    } catch (_) {}
}

// ---- Lista rolável de posts (ao tocar numa foto do perfil ou dos salvos) ----
async function abrirListaDePosts(ids, inicio) {
    const old = document.getElementById('postsViewer');
    if (old) old.remove();
    const v = document.createElement('div');
    v.id = 'postsViewer';
    v.className = 'posts-viewer';
    v.innerHTML = `<div class="pv-topo">
            <button class="topbar-back pv-voltar" aria-label="Voltar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="topbar-title">Publicações</div>
            <div style="width:36px"></div>
        </div>
        <div class="pv-lista"><div class="spinner"></div></div>`;
    document.body.appendChild(v);
    document.body.style.overflow = 'hidden';
    const fechar = () => { v.remove(); document.body.style.overflow = ''; };
    v.querySelector('.pv-voltar').onclick = fechar;

    const { data, error } = await sb.from('posts').select(`
            id, kind, caption, image_url, activity_type, duration_min, distance_km, muscle_groups, meal_slot, weight_kg, created_at, user_id, visibility, meal_score, meta, comments_off, pinned_at, meal_analysis, achievement_code,
            user:profiles!user_id!inner (id, username, display_name, avatar_url),
            reactions (id, user_id),
            comments (id)
        `).in('id', ids);
    const lista = v.querySelector('.pv-lista');
    if (!lista) return;
    if (error) { lista.innerHTML = `<p style="color:var(--danger)">${escapeHTML(msgErro(error))}</p>`; return; }
    const posts = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    lista.innerHTML = posts.map(p => renderPost(p)).join('') || '<div class="log-empty">Nada por aqui.</div>';
    const alvo = lista.querySelector(`.post[data-post-id="${inicio}"]`);
    if (alvo) v.scrollTop = alvo.offsetTop - 64;
}

// Depois de arquivar/apagar um post: tira de todo lugar e atualiza a tela de trás
function aposRemoverPost(id) {
    document.querySelectorAll(`.post[data-post-id="${id}"], .grid-item[data-id="${id}"]`).forEach(el => el.remove());
    const viewer = document.getElementById('postsViewer');
    if (viewer && !viewer.querySelector('.post')) { viewer.remove(); document.body.style.overflow = ''; }
    const pvs = document.getElementById('postViewSheet');
    if (pvs) { pvs.remove(); document.body.style.overflow = ''; }
    // recarrega o perfil por trás (contagem de posts, grade, fixados)
    if (state.view === 'profile') renderProfile();
}

// ---- Posts arquivados (só a própria pessoa vê) ----
async function renderArquivados() {
    const c = $('#viewContainer');
    c.innerHTML = `<div class="view cfg-view">${cabecalhoConfig('Arquivados', 'go-menu')}
        <p class="cfg-sub">Posts que você escondeu sem apagar. Ninguém mais vê. Toque em "Restaurar" pra trazer de volta.</p>
        <div id="arqLista"><div class="spinner"></div></div></div>`;
    const { data } = await sb.from('posts').select('id, kind, caption, image_url, thumb_url, activity_type, duration_min, meal_slot, created_at')
        .eq('user_id', state.session.user.id).eq('archived', true).order('created_at', { ascending: false });
    const box = document.getElementById('arqLista');
    if (!box) return;
    box.innerHTML = (data || []).length ? `<div class="arq-grade">${data.map(p => `<div class="arq-item">
        ${gridThumb(p).replace('data-act="view-post"', '')}
        <button class="btn-mini" data-act="desarquivar-post" data-id="${p.id}">Restaurar</button>
    </div>`).join('')}</div>` : `<div class="grid-empty grid-empty-cta">${icon('salvo')}<b>Nenhum post arquivado</b><span>No ··· de um post seu, toque em "Arquivar" pra esconder sem apagar. Ele fica guardado aqui.</span></div>`;
}

// ---- Tela pra quem ainda não foi liberado pelo administrador ----
function mostrarTelaAguardandoAcesso(status) {
    $('#authScreen').style.display = 'none';
    $('#app').classList.remove('on');
    let tela = document.getElementById('telaEspera');
    if (!tela) { tela = document.createElement('div'); tela.id = 'telaEspera'; tela.className = 'tela-espera'; document.body.appendChild(tela); }
    const bloqueado = status === 'bloqueado';
    tela.innerHTML = `<div class="te-card">
        <div class="te-logo">Pulso<span>.</span></div>
        <div class="te-emo">${bloqueado ? '🔒' : '⏳'}</div>
        <h2>${bloqueado ? 'Seu acesso não foi liberado' : 'Seu cadastro foi recebido!'}</h2>
        <p>${bloqueado
            ? 'No momento, o seu acesso ao Pulso não foi liberado. Se achar que é um engano, fale com quem te convidou.'
            : 'Estamos liberando o acesso aos poucos. Assim que o administrador aprovar, você entra no app normalmente.'}</p>
        ${bloqueado ? '' : '<button class="btn-primary" id="teVerificar">Verificar de novo</button>'}
        <button class="btn-ghost" id="teSair">Sair</button>
    </div>`;
    const ver = document.getElementById('teVerificar');
    if (ver) ver.onclick = async () => {
        ver.disabled = true; ver.textContent = 'Verificando...';
        const { data } = await sb.from('profiles').select('access_status').eq('id', state.session.user.id).maybeSingle();
        if (data && data.access_status === 'aprovado') { tela.remove(); boot(); return; }
        ver.disabled = false; ver.textContent = 'Verificar de novo';
        toast('Ainda aguardando a liberação. Tente mais tarde.', 'ok');
    };
    document.getElementById('teSair').onclick = async () => { await sb.auth.signOut(); tela.remove(); location.reload(); };
    // confere sozinho de tempos em tempos, pra pessoa não precisar ficar tocando
    clearInterval(state.timerEspera);
    if (!bloqueado) state.timerEspera = setInterval(async () => {
        if (!document.getElementById('telaEspera')) { clearInterval(state.timerEspera); return; }
        const { data } = await sb.from('profiles').select('access_status').eq('id', state.session.user.id).maybeSingle();
        if (data && data.access_status === 'aprovado') { clearInterval(state.timerEspera); tela.remove(); toast('Seu acesso foi liberado! Bem-vindo ao Pulso 🎉', 'ok'); boot(); }
    }, 20000);
}

// ---- Painel Admin › Usuários: todos, com como usam o app, busca, filtros e ações ----
const NOME_APARELHO_ADM = { iphone: 'iPhone', android: 'Android', computador: 'Computador' };
async function hydrateAdminUsuarios() {
    const box = document.getElementById('admUsuarios');
    if (!box) return;
    const { data, error } = await sb.rpc('admin_lista_usuarios');
    if (!document.getElementById('admUsuarios')) return;
    if (error) { box.innerHTML = `<p class="faixa-nota">Não consegui carregar: ${escapeHTML(error.message)}</p>`; return; }
    state.admUsuarios = data || [];
    pintarAdminUsuarios();
}
function pintarAdminUsuarios() {
    const box = document.getElementById('admUsuarios');
    if (!box) return;
    const todos = state.admUsuarios || [];
    const filtro = state.admFiltro || 'todos';
    const busca = (state.admBusca || '').toLowerCase().trim();
    const inst = todos.filter(u => u.app_installed === true).length;
    const nav = todos.filter(u => u.app_installed === false).length;
    const sem = todos.filter(u => u.app_installed == null).length;
    const bloq = todos.filter(u => u.access_status === 'bloqueado').length;
    const lista = todos.filter(u => {
        if (filtro === 'instalado' && u.app_installed !== true) return false;
        if (filtro === 'navegador' && u.app_installed !== false) return false;
        if (filtro === 'bloqueados' && u.access_status !== 'bloqueado') return false;
        if (busca && !(`${u.display_name || ''} ${u.username || ''}`.toLowerCase().includes(busca))) return false;
        return true;
    });
    const linha = u => {
        const como = u.app_installed === true ? `<span class="adm-inst">Instalado</span>` : u.app_installed === false ? 'Navegador' : '<span class="adm-sem">Sem registro ainda</span>';
        const ap = u.last_device ? ` · ${NOME_APARELHO_ADM[u.last_device] || u.last_device}` : '';
        const quando = u.last_seen_at ? ` · abriu ${timeAgo(u.last_seen_at)}` : '';
        const st = u.access_status === 'bloqueado' ? ' <span class="adm-tag-bloq">bloqueado</span>' : u.access_status === 'pendente' ? ' <span class="adm-tag-pend">pendente</span>' : '';
        return `<div class="adm-u">
            <span data-act="view-user" data-uid="${u.id}">${avatarHTML(u, 'sm')}</span>
            <div class="adm-u-info" data-act="view-user" data-uid="${u.id}">
                <b>${escapeHTML(u.display_name || '')}${u.is_admin ? ' <span class="adm-tag-adm">admin</span>' : ''}${st}</b>
                <small>@${escapeHTML(u.username || '')} · ${u.total_posts || 0} posts</small>
                <small>${como}${ap}${quando}</small>
            </div>
            ${u.id !== state.session.user.id ? `<button class="ger-mais" data-act="adm-u-menu" data-uid="${u.id}" aria-label="Opções"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>` : ''}
        </div>`;
    };
    box.innerHTML = `
        <p class="adm-resumo">Fundadores: <b>${todos.filter(u => u.fundador).length}</b> de 100 · <b>${todos.length}</b> pessoas · <b>${inst}</b> instalado · <b>${nav}</b> navegador · <b>${sem}</b> sem registro${bloq ? ` · <b>${bloq}</b> bloqueado${bloq > 1 ? 's' : ''}` : ''}</p>
        <div class="search-box adm-busca">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input type="text" id="admBuscaInput" placeholder="Buscar por nome ou @" value="${escapeHTML(state.admBusca || '')}" autocapitalize="off" autocomplete="off">
        </div>
        <div class="adm-filtros">${[['todos', 'Todos'], ['instalado', 'Instalado'], ['navegador', 'Navegador'], ['bloqueados', 'Bloqueados']].map(([k, n]) =>
            `<button class="${filtro === k ? 'on' : ''}" data-act="adm-filtro" data-f="${k}">${n}</button>`).join('')}</div>
        <div class="chart-card adm-lista">${lista.map(linha).join('') || '<p class="faixa-nota">Ninguém por aqui.</p>'}</div>`;
    const inp = document.getElementById('admBuscaInput');
    inp.oninput = () => {
        state.admBusca = inp.value;
        const pos = inp.selectionStart;
        pintarAdminUsuarios();
        const novo = document.getElementById('admBuscaInput');
        novo.focus(); try { novo.setSelectionRange(pos, pos); } catch (_) {}
    };
}
function menuAdminUsuario(btn) {
    hidePostMenu();
    const u = (state.admUsuarios || []).find(x => x.id === btn.dataset.uid);
    if (!u) return;
    const cria = state.admPodeCriar && state.admPodeCriar.has(u.id);
    const ops = [
        `<button class="post-menu-item" data-act="view-user" data-uid="${u.id}">${icon('perfil')}Ver perfil</button>`,
        `<button class="post-menu-item" data-act="start-chat" data-uid="${u.id}" data-name="${escapeHTML(u.display_name || '')}" data-username="${escapeHTML(u.username || '')}" data-avatar="${u.avatar_url || ''}">${icon('mensagem')}Mandar mensagem</button>`,
        `<button class="post-menu-item" data-act="adm-editar-dados" data-uid="${u.id}">${icon('editar')}Editar dados</button>`,
        `<button class="post-menu-item" data-act="toggle-creator" data-uid="${u.id}" data-on="${cria ? '1' : '0'}">${icon('comunidade')}${cria ? 'Tirar permissão de criar desafios' : 'Liberar criar desafios'}</button>`,
    ];
    if (!u.is_admin) {
        ops.push(u.access_status === 'bloqueado'
            ? `<button class="post-menu-item" data-act="adm-bloquear" data-uid="${u.id}" data-bloq="0">${icon('ok')}Desbloquear acesso</button>`
            : `<button class="post-menu-item" data-act="adm-bloquear" data-uid="${u.id}" data-bloq="1">${icon('bloquear')}Bloquear acesso</button>`);
        ops.push(`<button class="post-menu-item danger" data-act="adm-excluir" data-uid="${u.id}">${icon('lixo')}Excluir conta</button>`);
    }
    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.className = 'post-menu';
    menu.innerHTML = ops.join('');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = Math.max(70, Math.min(window.innerHeight - 70 - ops.length * 46, rect.bottom + 4)) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.zIndex = 120;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}
function confirmarExclusaoConta(u) {
    const old = document.getElementById('excluirSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'excluirSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Excluir a conta de ${escapeHTML(u.display_name || '')}?</h3>
        <p class="sheet-sub">Apaga os posts, stories, comentários, mensagens, registros e a participação em desafios dessa pessoa, e o login dela deixa de funcionar. <b>Não tem como desfazer.</b> Se só quiser impedir o acesso, use "Bloquear acesso".</p>
        <div class="field"><label>Pra confirmar, digite o usuário: <b>${escapeHTML(u.username || '')}</b></label>
            <input type="text" id="excConf" autocapitalize="off" autocomplete="off" placeholder="${escapeHTML(u.username || '')}"></div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="excCanc">Cancelar</button>
            <button class="btn-primary btn-perigo" id="excOk" disabled>Excluir conta</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const campo = sheet.querySelector('#excConf'), ok = sheet.querySelector('#excOk');
    campo.oninput = () => { ok.disabled = campo.value.trim().toLowerCase() !== String(u.username || '').toLowerCase(); };
    sheet.querySelector('#excCanc').onclick = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    ok.onclick = async () => {
        ok.disabled = true; ok.textContent = 'Excluindo...';
        const { error } = await sb.rpc('admin_excluir_conta', { alvo: u.id, confirmacao: campo.value.trim() });
        if (error) { toast(erroParaAdmin(error), 'err'); ok.disabled = false; ok.textContent = 'Excluir conta'; return; }
        sheet.remove();
        toast('Conta excluída', 'ok');
        hydrateAdminUsuarios();
    };
}

// ---- Painel Admin › Usuários › Editar dados ----
async function abrirEditarDadosAdmin(uid) {
    const { data, error } = await sb.rpc('admin_dados_usuario', { alvo: uid });
    if (error || !data) { toast(error ? erroParaAdmin(error) : 'Não encontrei esse usuário', 'err'); return; }
    const p = data.perfil || {}, pesos = data.pesagens || [];
    // marca pesagens muito diferentes das vizinhas
    const fora = new Set();
    const ordenados = pesos.map(w => Number(w.kg)).sort((x, y) => x - y);
    const mediana = ordenados.length ? ordenados[Math.floor(ordenados.length / 2)] : 0;
    if (ordenados.length >= 2) pesos.forEach(w => { if (Math.abs(Number(w.kg) - mediana) > Math.max(5, mediana * 0.08)) fora.add(w.id); });
    const old = document.getElementById('admDadosSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'admDadosSheet';
    sheet.className = 'sheet on';
    const campo = (id, rot, val, tipo = 'text', extra = '') => `<div class="field"><label>${rot}</label><input type="${tipo}" id="${id}" value="${val == null ? '' : escapeHTML(String(val))}" ${extra}></div>`;
    sheet.innerHTML = `<div class="sheet-card adm-dados">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Editar dados · ${escapeHTML(p.display_name || '')}</h3>
        <div class="badge-secao">Perfil</div>
        ${campo('adNome', 'Nome', p.display_name, 'text', 'maxlength="40"')}
        ${campo('adUser', 'Usuário', p.username, 'text', 'maxlength="30" autocapitalize="off"')}
        <div class="badge-secao">Corpo</div>
        <div class="field-row">
            ${campo('adPesoIni', 'Peso inicial (kg)', p.peso_inicial, 'number', 'step="0.1" min="25" max="300" inputmode="decimal"')}
            ${campo('adAltura', 'Altura (m)', p.altura, 'number', 'step="0.01" min="1" max="2.5" inputmode="decimal"')}
        </div>
        <div class="field-row">
            ${campo('adMeta', 'Meta de peso (kg)', p.target_weight, 'number', 'step="0.1" min="25" max="300" inputmode="decimal"')}
            ${campo('adPrazo', 'Prazo da meta', p.goal_deadline, 'date')}
        </div>
        <div class="badge-secao">Pesagens</div>
        <div class="adm-pesos">${pesos.length ? pesos.map(w => `<div class="adm-peso${fora.has(w.id) ? ' fora' : ''}" data-pid="${w.id}">
            <span class="ap-dia">${new Date(w.quando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            <input type="number" class="ap-kg" step="0.1" min="25" max="300" inputmode="decimal" value="${w.kg}">
            ${fora.has(w.id) ? '<span class="ap-fora">fora do normal</span>' : '<span></span>'}
            <button type="button" class="ah-x" data-apagar-peso="${w.id}" aria-label="Apagar pesagem">×</button>
        </div>`).join('') : '<p class="faixa-nota">Nenhuma pesagem registrada.</p>'}</div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="adCancelar">Cancelar</button>
            <button class="btn-primary" id="adSalvar">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const apagar = new Set();
    sheet.querySelectorAll('[data-apagar-peso]').forEach(b => b.onclick = () => {
        const linha = b.closest('.adm-peso'); linha.classList.toggle('apagando');
        linha.classList.contains('apagando') ? apagar.add(b.dataset.apagarPeso) : apagar.delete(b.dataset.apagarPeso);
    });
    sheet.querySelector('#adCancelar').onclick = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelector('#adSalvar').onclick = async () => {
        const num = id => { const v = sheet.querySelector('#' + id).value; return v === '' ? null : Number(v); };
        const pesagens = [...sheet.querySelectorAll('.adm-peso')].map(l => ({ id: l.dataset.pid, kg: Number(l.querySelector('.ap-kg').value), apagar: apagar.has(l.dataset.pid) }));
        const invalida = pesagens.find(w => !w.apagar && !(w.kg >= 25 && w.kg <= 300));
        if (invalida) { toast('Peso fora do possível (25 a 300 kg). Confira as pesagens.', 'err'); return; }
        const btn = sheet.querySelector('#adSalvar');
        btnCarregando(btn, true);
        const { error } = await sb.rpc('admin_salvar_dados', { alvo: uid, dados: {
            display_name: sheet.querySelector('#adNome').value.trim(),
            username: sheet.querySelector('#adUser').value.trim().toLowerCase(),
            peso_inicial: num('adPesoIni'), altura: num('adAltura'), target_weight: num('adMeta'),
            goal_deadline: sheet.querySelector('#adPrazo').value || null,
            pesagens,
        } });
        if (error) { btnCarregando(btn, false); toast(erroParaAdmin(error), 'err'); return; }
        sheet.remove();
        toast('Dados atualizados. A pessoa foi avisada.', 'ok');
        hydrateAdminUsuarios();
        hydrateAdminLog();
    };
}
async function hydrateAdminLog() {
    const box = document.getElementById('admLog');
    if (!box) return;
    const { data } = await sb.rpc('admin_log_recente');
    if (!document.getElementById('admLog')) return;
    box.innerHTML = (data || []).length ? data.map(l => `<div class="adm-log-linha">
        <span>${new Date(l.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <b>${escapeHTML(l.alvo_nome || '')}</b><small>${escapeHTML(l.acao || '')}</small>
    </div>`).join('') : '<p class="faixa-nota">Nenhuma alteração feita ainda.</p>';
}

// ---- Painel Admin: novos cadastros ----
async function contarPendentesMenu() {
    if (!state.profile || !state.profile.is_admin) return;
    const { data } = await sb.rpc('admin_pending_users');
    const n = (data || []).filter(u => u.access_status === 'pendente').length;
    const linha = document.getElementById('menuAdminLinha');
    if (linha && n && !linha.querySelector('.cfg-aviso')) {
        const seta = linha.querySelector('.cfg-seta');
        if (seta) seta.insertAdjacentHTML('beforebegin', `<span class="cfg-aviso">${n > 9 ? '9+' : n}</span>`);
    }
}
async function hydrateNovosCadastros() {
    const box = document.getElementById('cadastrosBox');
    if (!box) return;
    const [{ data: cfg }, { data: lista, error }] = await Promise.all([
        sb.rpc('admin_get_settings'),
        sb.rpc('admin_pending_users'),
    ]);
    if (!document.getElementById('cadastrosBox')) return;
    if (error) { box.innerHTML = `<p class="faixa-nota">Não consegui carregar: ${escapeHTML(error.message)}</p>`; return; }
    const exige = !!(cfg && cfg.exigir_aprovacao);
    const pend = (lista || []).filter(u => u.access_status === 'pendente');
    const bloq = (lista || []).filter(u => u.access_status === 'bloqueado');
    const linha = u => `<div class="nc-user">
        ${avatarHTML(u, 'sm')}
        <div class="nc-info"><b>${escapeHTML(u.display_name || '')}</b><small>@${escapeHTML(u.username || '')}${u.email ? ' · ' + escapeHTML(u.email) : ''}</small><small>${new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>
        <div class="nc-bts">
            ${u.access_status !== 'bloqueado' ? `<button class="btn-ghost btn-xs" data-act="admin-acesso" data-uid="${u.id}" data-status="bloqueado">Recusar</button>` : ''}
            <button class="btn-primary-sm" data-act="admin-acesso" data-uid="${u.id}" data-status="aprovado">Aprovar</button>
        </div>
    </div>`;
    box.innerHTML = `<div class="chart-card">
        <div class="nc-topo">
            <div><b>Exigir minha aprovação</b><small>${exige ? 'Quem se cadastra espera você liberar.' : 'Quem se cadastra entra direto.'}</small></div>
            <button class="nc-sw${exige ? ' on' : ''}" data-act="admin-exigir-aprovacao" data-on="${exige ? '1' : '0'}" role="switch" aria-checked="${exige}" aria-label="Exigir aprovação"><i></i></button>
        </div>
        <div class="dep-secao">Aguardando aprovação (${pend.length})</div>
        ${pend.length ? pend.map(linha).join('') : '<p class="faixa-nota">Ninguém esperando agora.</p>'}
        ${bloq.length ? `<details class="ia-blocos"><summary>Recusados (${bloq.length})</summary>${bloq.map(linha).join('')}</details>` : ''}
    </div>`;
}

// ---- Salvos ----
async function carregarSalvos() {
    const { data } = await sb.from('saved_posts').select('post_id').eq('user_id', state.session.user.id);
    state.salvos = new Set((data || []).map(r => r.post_id));
}

async function renderSalvos() {
    const c = $('#viewContainer');
    c.innerHTML = `<div class="view cfg-view">${cabecalhoConfig('Salvos', 'go-menu')}<div id="salvosBody"><div class="spinner"></div></div></div>`;
    const { data: marc } = await sb.from('saved_posts').select('post_id, created_at')
        .eq('user_id', state.session.user.id).order('created_at', { ascending: false }).limit(90);
    const ids = (marc || []).map(r => r.post_id);
    let posts = [];
    if (ids.length) {
        const { data } = await sb.from('posts')
            .select('id, image_url, thumb_url, kind, caption, created_at, activity_type, duration_min, meal_slot, pinned_at').in('id', ids);
        const porId = {};
        (data || []).forEach(x => { porId[x.id] = x; });
        posts = ids.map(id => porId[id]).filter(Boolean);
    }
    const body = document.getElementById('salvosBody');
    if (!body) return;
    body.innerHTML = posts.length
        ? `<div class="ig-grid">${posts.map(gridThumb).join('')}</div>`
        : `<div class="grid-empty grid-empty-cta">${ICO.salvo ? icon('salvo') : ''}<b>Nada salvo ainda</b><span>Toque no marcador de um post no feed pra guardar e achar aqui depois.</span></div>`;
}

// ============================================================
// DESAFIOS NO FEED: vitrine (rolando ou em breve) e pódio
// ============================================================
function provaSocial(ch, amigos) {
    const lista = amigos || [];
    if (!lista.length) return plural(ch.members, 'participante', 'participantes');
    const nomes = lista.slice(0, 2).map(a => escapeHTML(String(a.display_name || a.username).split(' ')[0]));
    const resto = Math.max(0, Number(ch.members || 0) - nomes.length);
    return nomes.join(', ') + (resto > 0 ? ` e mais ${resto}` : '');
}
function avataresAmigos(amigos) {
    return (amigos || []).slice(0, 3).map(a => avatarHTML(a, 'sm')).join('');
}
function botaoEntrarDesafio(ch, pedido) {
    if (ch.im_member) return '<span class="dc-tag">Você participa</span>';
    if (ch.status === 'encerrado') return '';
    if (ch.is_open) return `<button class="btn-primary-sm" data-act="join-challenge" data-id="${ch.id}">Entrar</button>`;
    if (pedido === 'pendente') return '<span class="dc-tag">Pedido enviado</span>';
    if (pedido === 'recusado') return '';
    return `<button class="btn-primary-sm" data-act="pedir-acesso" data-id="${ch.id}">Solicitar entrada</button>`;
}
async function dadosDesafios() {
    const [{ data: todos }, { data: amigosRows }] = await Promise.all([
        sb.rpc('list_challenges'),
        sb.rpc('challenge_friends'),
    ]);
    const amigos = {};
    (amigosRows || []).forEach(r => { (amigos[r.challenge_id] = amigos[r.challenge_id] || []).push(r); });
    const lista = todos || [];
    const pedidos = {};
    await Promise.all(lista.filter(ch => !ch.im_member && !ch.is_open && ch.status !== 'encerrado').map(async ch => {
        const { data } = await sb.rpc('my_challenge_request', { cid: ch.id });
        pedidos[ch.id] = data || null;
    }));
    return { lista, amigos, pedidos };
}

async function hydrateDesafiosFeed() {
    const slot = document.getElementById('desafioSlot');
    if (!slot) return;
    const oculto = k => { try { return localStorage.getItem(k) === '1'; } catch (_) { return false; } };
    const { lista, amigos, pedidos } = await dadosDesafios();
    if (!document.getElementById('desafioSlot')) return;
    const agora = Date.now();
    let html = '';

    // Pódio: desafios que você participou e acabaram nos últimos 7 dias
    const encerrados = lista.filter(ch => ch.im_member && ch.status === 'encerrado'
        && (agora - new Date(ch.ends_at).getTime()) < 7 * 86400000 && !oculto('pulso-podio-' + ch.id));
    for (const ch of encerrados.slice(0, 1)) {
        const { data: rk } = await sb.rpc('challenge_ranking', { cid: ch.id });
        const r = rk || [];
        if (!r.length) continue;
        const minhaPos = r.findIndex(u => u.user_id === state.session.user.id) + 1;
        state.podios = state.podios || {};
        state.podios[ch.id] = { nome: ch.name, r, minhaPos };
        const medalhas = ['🥇', '🥈', '🥉'];
        html += `<div class="dc-card dc-podio" data-act="open-challenge" data-id="${ch.id}">
            <button class="dc-x" data-act="dispensar-card" data-chave="pulso-podio-${ch.id}" aria-label="Fechar">×</button>
            <div class="dc-topo"><span class="dc-emo">🏁</span><div><b>${escapeHTML(ch.name)} terminou</b><small>${minhaPos ? `Você ficou em ${minhaPos}º de ${r.length}` : 'Veja como ficou'}</small></div></div>
            <div class="dc-podio-lista">${r.slice(0, 3).map((u, i) => `<div class="dc-podio-item${u.user_id === state.session.user.id ? ' eu' : ''}">
                <span class="dc-medalha">${medalhas[i]}</span>${avatarHTML({ id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
                <span class="dc-podio-nome">${u.user_id === state.session.user.id ? 'Você' : escapeHTML(String(u.display_name || '').split(' ')[0])}</span>
                <span class="dc-podio-pts">${Math.round(u.points)}</span>
            </div>`).join('')}</div>
            <button class="btn-secondary resumo-story" data-act="podio-compartilhar" data-id="${ch.id}">Compartilhar resultado</button>
        </div>`;
    }

    // Vitrine: rolando ou em breve, pra quem ainda não participa
    const abertos = lista.filter(ch => !ch.im_member && (ch.status === 'ativo' || ch.status === 'futuro')
        && pedidos[ch.id] !== 'recusado' && !oculto('pulso-desafio-' + ch.id));
    for (const ch of abertos.slice(0, 2)) {
        const dias = Math.ceil(((ch.status === 'futuro' ? new Date(ch.starts_at) : new Date(ch.ends_at)) - agora) / 86400000);
        const quando = ch.status === 'futuro'
            ? (dias <= 1 ? 'Começa amanhã, garanta sua vaga' : `Começa em ${dias} dias, garanta sua vaga`)
            : (dias <= 1 ? 'Termina hoje' : `Termina em ${dias} dias`);
        html += `<div class="dc-card" data-act="open-challenge" data-id="${ch.id}">
            <button class="dc-x" data-act="dispensar-card" data-chave="pulso-desafio-${ch.id}" aria-label="Fechar">×</button>
            <div class="dc-topo"><span class="dc-emo">🏆</span><div><b>${escapeHTML(ch.name)} ${ch.status === 'futuro' ? 'vem aí' : 'está rolando'}</b><small>${quando}</small></div></div>
            <div class="dc-rodape">
                <div class="dc-social"><span class="dc-avatares">${avataresAmigos(amigos[ch.id])}</span><span>${provaSocial(ch, amigos[ch.id])}</span></div>
                ${botaoEntrarDesafio(ch, pedidos[ch.id])}
            </div>
        </div>`;
    }
    slot.innerHTML = html;
}

function atualizarTelaDesafio(cid) {
    if (state.view === 'feed') hydrateDesafiosFeed();
    else if (state.view === 'challenges') renderChallenges();
    else renderChallengeDetail(cid);
}

// O que vale ponto (mostrado no desafio)
const TABELA_PONTOS = [
    ['💪', 'Treino', 'até 15 pontos, +3 com foto'],
    ['🔥', 'Ofensiva', 'até 20 pontos'],
    ['🎯', 'Meta da semana batida', '10 pontos'],
    ['⚡', 'Story', '3 pontos por dia'],
    ['⚖️', 'Pesagem', '3 pontos por semana'],
    ['📉', 'Perda de peso', '25 pontos por 1%'],
    ['🍽️', 'Refeição com foto', '1 ponto'],
];
function regrasDesafioHTML(ch) {
    const dataBR = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `<div class="chart-card ch-regras">
        <div class="chart-head"><span class="chart-title">Regras e pontos</span></div>
        <p class="ch-regra-base">Vale o que você fizer de <b>${dataBR(ch.starts_at)}</b> a <b>${dataBR(ch.ends_at)}</b>. Seus pontos normais do app continuam valendo, mas o ranking do desafio conta só esse período. A <b>ofensiva do desafio</b> começa do zero quando você entra nele.</p>
        ${ch.rules ? `<div class="ch-regras-dono"><span>Combinados de quem criou</span><p>${escapeHTML(ch.rules).replace(/\n/g, '<br>')}</p></div>` : ''}
        <div class="ch-pontos">${TABELA_PONTOS.map(([e, n, v]) => `<div class="ch-ponto"><span>${e}</span><b>${n}</b><em>${v}</em></div>`).join('')}</div>
        <button class="btn-mini" data-act="go-rules" style="margin-top:10px">Ver todas as regras de pontos</button>
    </div>`;
}

// ---- Ranking global por faixa (fora de desafio ninguém vê posição nem pontos dos outros) ----
const FAIXAS = [[0.05, 'Top 5%'], [0.10, 'Top 10%'], [0.25, 'Top 25%'], [0.50, 'Top 50%']];
function faixaRanking(rank, total) {
    if (!rank || !total) return null;
    const pct = rank / total;
    if (total < 20) {
        return pct <= 0.3
            ? { nivel: 1, curto: 'Destaque', longo: 'Você está entre os mais ativos essa semana' }
            : { nivel: 5, curto: 'Ativo', longo: 'Você está em movimento essa semana. Cada registro conta.' };
    }
    const i = FAIXAS.findIndex(([lim]) => pct <= lim);
    if (i === -1) return { nivel: 5, curto: 'Ativo', longo: 'Você está em movimento essa semana. Cada registro conta.' };
    const nome = FAIXAS[i][1];
    return { nivel: i + 1, curto: nome, longo: `Você está entre os ${nome.replace('Top ', '')} mais ativos essa semana` };
}

// ============================================================
// ABA DESAFIO: painel ao vivo do desafio em que a pessoa está
// ============================================================
const posChave = (cid, dia) => `pulso-pos-${cid}-${dia}`;
function ontemISO() { return isoDe(new Date(Date.now() - 86400000)); }

async function meusDesafiosAtivos() {
    const { data } = await sb.rpc('list_challenges');
    return (data || []).filter(ch => ch.im_member && ch.status !== 'encerrado')
        .sort((a, b) => (a.status === 'ativo' ? 0 : 1) - (b.status === 'ativo' ? 0 : 1) || new Date(a.ends_at) - new Date(b.ends_at));
}

async function renderPainelDesafio(cidEscolhido) {
    const c = $('#viewContainer');
    c.innerHTML = esqueleto('painel');
    const meus = await meusDesafiosAtivos();
    if (!meus.length) {
        await renderChallenges();
        // é aba principal: sem seta de voltar
        const voltar = document.querySelector('#viewContainer .user-topbar .topbar-back');
        if (voltar) voltar.style.visibility = 'hidden';
        return;
    }
    // Mais de um desafio e nenhum escolhido: mostra a lista
    if (!cidEscolhido && meus.length > 1) { await renderListaMeusDesafios(meus); return; }
    const ch = meus.find(x => x.id === cidEscolhido) || meus[0];
    state.desafioAtual = ch.id;
    const uid = state.session.user.id;
    const [{ data: ranking }, { data: regrasRow }] = await Promise.all([
        sb.rpc('challenge_ranking', { cid: ch.id }),
        sb.from('challenges').select('rules, team_mode, team_count, team_names').eq('id', ch.id).maybeSingle(),
    ]);
    ch.rules = regrasRow ? regrasRow.rules : null;
    ch.team_mode = !!(regrasRow && regrasRow.team_mode);
    ch.team_names = (regrasRow && regrasRow.team_names) || NOMES_TIMES;
    let times = null, meuTime = null, membrosTime = {};
    if (ch.team_mode) {
        const [{ data: tr }, { data: tm }] = await Promise.all([
            sb.rpc('challenge_team_ranking', { cid: ch.id }),
            sb.rpc('challenge_teams', { cid: ch.id }),
        ]);
        times = tr || [];
        (tm || []).forEach(x => { membrosTime[x.user_id] = x.team; });
        meuTime = membrosTime[uid] || null;
    }
    const r = ranking || [];
    const i = r.findIndex(u => u.user_id === uid);
    const eu = i >= 0 ? r[i] : null;
    const pos = i + 1;

    // posição de ontem x hoje (guardada no aparelho)
    const hoje = hojeISO();
    if (pos) { lsSet(posChave(ch.id, hoje), String(pos)); lsSet('pulso-pos-visto-' + ch.id, String(pos)); }
    const ontem = Number(lsGet(posChave(ch.id, ontemISO())) || 0);
    let movimento = '';
    if (pos && ontem && ontem !== pos) movimento = ontem > pos ? `▲ subiu ${ontem - pos} ${ontem - pos === 1 ? 'posição' : 'posições'} desde ontem` : `▼ caiu ${pos - ontem} ${pos - ontem === 1 ? 'posição' : 'posições'} desde ontem`;
    atualizarBadgeDesafio();

    const agora = Date.now();
    const ini = new Date(ch.starts_at), fim = new Date(ch.ends_at);
    const futuro = ch.status === 'futuro';
    const diasFaltam = Math.max(0, Math.ceil(((futuro ? ini : fim) - agora) / 86400000));
    const pctTempo = futuro ? 0 : Math.max(0, Math.min(100, (agora - ini) / (fim - ini) * 100));
    const primeiroNome = u => u.user_id === uid ? 'Você' : escapeHTML(String(u.display_name || '').split(' ')[0]);
    const maxPts = r.length ? Math.max(1, ...r.map(u => Number(u.points))) : 1;
    const medalha = k => ['🥇', '🥈', '🥉'][k] || `${k + 1}º`;
    let proximo = '';
    if (i > 0) {
        const gap = Math.max(1, Math.ceil(Number(r[i - 1].points) - Number(eu.points)));
        proximo = `Faltam <b>${gap} pts</b> pra passar ${primeiroNome(r[i - 1])}`;
    } else if (i === 0 && r.length > 1) {
        const gap = Math.floor(Number(eu.points) - Number(r[1].points));
        proximo = gap > 0 ? `Você lidera por <b>${gap} pts</b>. Segura!` : 'Empatado na liderança. Um treino decide!';
    }
    const topo = r.slice(0, 4);
    const mostraEu = eu && i >= 4;
    const linhaRank = (u, k) => `<div class="pd-rank${u.user_id === uid ? ' eu' : ''}">
        <span class="pd-rank-pos">${medalha(k)}</span>
        ${avatarHTML({ id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
        <span class="pd-rank-nome">${primeiroNome(u)}</span>
        <span class="pd-rank-barra"><i style="width:${Math.max(4, Number(u.points) / maxPts * 100)}%"></i></span>
        <span class="pd-rank-pts">${Math.round(u.points)}</span>
    </div>`;

    // o foco é sempre o ranking individual; Times fica a um toque
    const abaPd = ch.team_mode ? ((state.abaDesafio || {})[ch.id] || 'individual') : 'individual';
    c.innerHTML = `<div class="view painel-desafio">
        <div class="pd-head">
            ${meus.length > 1 ? `<button class="pd-voltar" data-act="pd-lista" aria-label="Seus desafios"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>` : ''}
            <div class="pd-head-txt"><h1 class="pd-nome">${escapeHTML(ch.name)}</h1>
            <span class="pd-quando${!futuro && diasFaltam <= 3 ? ' reta' : ''}">${futuro ? (diasFaltam <= 1 ? 'Começa amanhã' : `Começa em ${diasFaltam} dias`) : diasFaltam <= 0 ? 'Último dia!' : diasFaltam <= 3 ? `🏁 Reta final: faltam ${diasFaltam} dias` : `Faltam ${diasFaltam} dias`}</span></div>
            <button class="ia-link" data-act="open-challenge" data-id="${ch.id}">detalhes ›</button>
        </div>
        <div class="pd-tempo"><i style="width:${pctTempo}%"></i></div>

        ${ch.team_mode ? `<div class="evo-abas pd-abas">
            <button class="evo-aba${abaPd === 'individual' ? ' on' : ''}" data-act="pd-aba" data-aba="individual" data-id="${ch.id}">Individual</button>
            <button class="evo-aba${abaPd === 'times' ? ' on' : ''}" data-act="pd-aba" data-aba="times" data-id="${ch.id}">Times</button>
        </div>` : ''}

        ${ch.team_mode ? `<div class="pd-painel${abaPd === 'times' ? '' : ' hidden'}" data-pd="times">${timesHTML(ch, times, meuTime, r, membrosTime, futuro)}</div>` : ''}

        <div class="pd-painel${abaPd === 'individual' ? '' : ' hidden'}" data-pd="individual">
        ${futuro ? `<div class="pd-destaque"><span class="pd-rotulo">O desafio ainda não começou</span><b class="pd-pos">${r.length}</b><span class="pd-sub">${r.length === 1 ? 'participante confirmado' : 'participantes confirmados'}</span><p class="pd-prox">Seus pontos passam a contar a partir de ${ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}.</p></div>`
        : eu ? `<div class="pd-destaque">
            <span class="pd-rotulo">Você está em</span>
            <b class="pd-pos">${pos}º</b>
            <span class="pd-sub">de ${r.length} · ${Math.round(eu.points)} pontos</span>
            ${movimento ? `<span class="pd-mov ${movimento.startsWith('▲') ? 'sobe' : 'desce'}">${movimento}</span>` : ''}
            ${proximo ? `<p class="pd-prox">${proximo}</p>` : ''}
        </div>` : ''}

        ${!futuro && r.length ? `<div class="chart-card">
            <div class="chart-head"><span class="chart-title">Ranking</span><button class="ia-link" data-act="open-challenge" data-id="${ch.id}">ver completo ›</button></div>
            ${topo.map(linhaRank).join('')}
            ${mostraEu ? `<div class="pd-rank-sep">···</div>${linhaRank(eu, i)}` : ''}
        </div>` : ''}

        <div id="pdMarco"></div>
        <div id="pdGrupoTotais"></div>
        <div id="pdDestaque"></div>
        <div id="chNarracao"></div>

        <div class="chart-card">
            <div class="chart-head"><span class="chart-title">Hoje no grupo</span></div>
            <div id="pdGrupo"><div class="spinner"></div></div>
        </div>

        <div class="pd-acoes">
            <button class="btn-secondary" data-act="ver-regras-desafio">Regras</button>
            ${(ch.created_by === uid || state.profile.is_admin) ? `<button class="btn-secondary" data-act="invite-challenge" data-id="${ch.id}">Convidar</button>
            <button class="btn-secondary" data-act="go-gerenciar" data-id="${ch.id}">Gerenciar</button>` : ''}
            <button class="btn-secondary" data-act="go-challenges-lista">Outros desafios</button>
        </div>
        <div id="chRegrasMembro" class="hidden">${regrasDesafioHTML(ch)}</div>
        </div>
    </div>`;

    if (!futuro) hydrateNarracaoDesafio(ch, r);
    hydrateGrupoHoje(ch, r);
    if (!futuro) { hydrateTotaisGrupo(ch); hydrateDestaqueSemana(ch); }
}

// ============================================================
// TIMES NO DESAFIO
// ============================================================
const NOMES_TIMES = ['Verde', 'Laranja', 'Azul', 'Roxo'];
const CORES_TIMES = ['#35E19B', '#FF7A4D', '#5FB0FF', '#C08BFF'];
const nomeTime = (ch, t) => (ch.team_names && ch.team_names[t - 1]) || NOMES_TIMES[t - 1] || `Time ${t}`;
const corTime = t => CORES_TIMES[(t - 1) % CORES_TIMES.length];
const ptsBR = n => Math.round(Number(n || 0)).toLocaleString('pt-BR');

function timesHTML(ch, times, meuTime, ranking, membrosTime, futuro) {
    const lista = [...(times || [])].sort((a, b) => Number(b.points) - Number(a.points));
    if (!lista.length) return '<p class="faixa-nota">Os times aparecem quando as pessoas entrarem no desafio.</p>';
    const eu = state.session.user.id;
    const meu = lista.find(t => t.team === meuTime);
    let placar = '';
    if (lista.length === 2) {
        // cabo de guerra
        const [a, b] = [...lista].sort((x, y) => x.team - y.team);
        const tot = Math.max(1, Number(a.points) + Number(b.points));
        const pa = Math.max(6, Math.min(94, Number(a.points) / tot * 100));
        placar = `<div class="tm-cabo">
            <div class="tm-lados">
                <span class="tm-lado${a.team === meuTime ? ' meu' : ''}"><i style="background:${corTime(a.team)}"></i>${escapeHTML(nomeTime(ch, a.team))}<b>${ptsBR(a.points)}</b></span>
                <span class="tm-lado dir${b.team === meuTime ? ' meu' : ''}"><b>${ptsBR(b.points)}</b>${escapeHTML(nomeTime(ch, b.team))}<i style="background:${corTime(b.team)}"></i></span>
            </div>
            <div class="tm-barra"><span style="width:${pa}%;background:${corTime(a.team)}"></span><span style="background:${corTime(b.team)}"></span></div>
        </div>`;
    } else {
        const max = Math.max(1, ...lista.map(t => Number(t.points)));
        placar = `<div class="tm-lista">${lista.map((t, k) => `<div class="tm-linha${t.team === meuTime ? ' meu' : ''}">
            <span class="tm-pos">${k + 1}º</span>
            <span class="tm-nome"><i style="background:${corTime(t.team)}"></i>${escapeHTML(nomeTime(ch, t.team))}</span>
            <span class="tm-trilho"><i style="width:${Math.max(4, Number(t.points) / max * 100)}%;background:${corTime(t.team)}"></i></span>
            <b>${ptsBR(t.points)}</b>
        </div>`).join('')}</div>`;
    }
    // frase do seu time
    let frase = '';
    if (meu && !futuro) {
        const k = lista.indexOf(meu);
        if (k === 0 && lista.length > 1) {
            const dif = Math.round(Number(meu.points) - Number(lista[1].points));
            frase = dif > 0 ? `Seu time está na frente por <b>${ptsBR(dif)} pts</b>` : 'Empate na liderança. Cada treino decide!';
        } else if (k > 0) {
            const dif = Math.max(1, Math.ceil(Number(lista[k - 1].points) - Number(meu.points)));
            frase = `Faltam <b>${ptsBR(dif)} pts</b> pro seu time passar o ${escapeHTML(nomeTime(ch, lista[k - 1].team))}`;
        }
    } else if (futuro) frase = 'Os pontos dos times começam a contar quando o desafio começar.';

    // quem é do seu time
    const doMeuTime = (ranking || []).filter(u => membrosTime[u.user_id] === meuTime);
    const max = doMeuTime.length ? Math.max(1, ...doMeuTime.map(u => Number(u.points))) : 1;
    const souDono = ch.created_by === eu || state.profile.is_admin;
    return `
        ${placar}
        ${frase ? `<p class="tm-frase">${frase}</p>` : ''}
        ${meu ? `<div class="chart-card">
            <div class="chart-head"><span class="chart-title"><i class="tm-ponto" style="background:${corTime(meuTime)}"></i>Seu time · ${escapeHTML(nomeTime(ch, meuTime))}</span><span class="chart-legend">${doMeuTime.length} ${doMeuTime.length === 1 ? 'pessoa' : 'pessoas'}</span></div>
            ${doMeuTime.map((u, k) => `<div class="pd-rank${u.user_id === eu ? ' eu' : ''}">
                <span class="pd-rank-pos">${['🥇', '🥈', '🥉'][k] || (k + 1) + 'º'}</span>
                ${avatarHTML({ id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
                <span class="pd-rank-nome">${u.user_id === eu ? 'Você' : escapeHTML(String(u.display_name || '').split(' ')[0])}</span>
                <span class="pd-rank-barra"><i style="width:${Math.max(4, Number(u.points) / max * 100)}%;background:${corTime(meuTime)}"></i></span>
                <span class="pd-rank-pts">${ptsBR(u.points)}</span>
            </div>`).join('')}
        </div>` : '<p class="faixa-nota">Você ainda não está em nenhum time.</p>'}
        ${souDono && futuro ? `<button class="btn-secondary pd-times-ajustar" data-act="tm-ajustar" data-id="${ch.id}">Ajustar times antes de começar</button>` : ''}
    `;
}

// Lista "Seus desafios" (quando a pessoa está em mais de um)
async function renderListaMeusDesafios(meus) {
    const c = $('#viewContainer');
    const uid = state.session.user.id;
    const extras = await Promise.all(meus.map(async ch => {
        const [{ data: r }, { data: cfg }] = await Promise.all([
            sb.rpc('challenge_ranking', { cid: ch.id }),
            sb.from('challenges').select('team_mode, team_names').eq('id', ch.id).maybeSingle(),
        ]);
        let time = null;
        if (cfg && cfg.team_mode) {
            const { data: tm } = await sb.rpc('challenge_teams', { cid: ch.id });
            const meu = (tm || []).find(x => x.user_id === uid);
            time = meu ? meu.team : null;
        }
        const pos = (r || []).findIndex(u => u.user_id === uid) + 1;
        const visto = Number(lsGet('pulso-pos-visto-' + ch.id) || 0);
        return { ch, pos, total: (r || []).length, time, cfg: cfg || {}, mudou: pos && visto && pos !== visto };
    }));
    if (!document.getElementById('viewContainer')) return;
    const agora = Date.now();
    c.innerHTML = `<div class="view painel-desafio">
        <h1 class="pd-nome pd-lista-titulo">Seus desafios</h1>
        ${extras.map(({ ch, pos, total, time, cfg, mudou }) => {
            const ini = new Date(ch.starts_at), fim = new Date(ch.ends_at);
            const futuro = ch.status === 'futuro';
            const dias = Math.max(0, Math.ceil(((futuro ? ini : fim) - agora) / 86400000));
            const pct = futuro ? 0 : Math.max(0, Math.min(100, (agora - ini) / (fim - ini) * 100));
            const quando = futuro ? (dias <= 1 ? 'começa amanhã' : `começa em ${dias} d`) : dias <= 0 ? 'último dia' : dias <= 3 ? `🏁 ${dias} ${dias === 1 ? 'dia' : 'dias'}` : `faltam ${dias} d`;
            const linhaTime = time ? ` · <span class="pd-card-time"><i style="background:${corTime(time)}"></i>Time ${escapeHTML(nomeTime(cfg, time))}</span>` : (cfg.team_mode ? '' : ' · individual');
            return `<button class="pd-card" data-act="pd-abrir" data-id="${ch.id}">
                <div class="pd-card-topo"><b>${escapeHTML(ch.name)}</b><span class="${!futuro && dias <= 3 ? 'reta' : ''}">${quando}</span>${mudou ? '<i class="pd-card-dot"></i>' : ''}</div>
                <div class="pd-card-sub">${futuro ? `${total} ${total === 1 ? 'participante' : 'participantes'}` : pos ? `Você em <b>${pos}º</b> de ${total}` : `${total} participantes`}${linhaTime}</div>
                <div class="pd-tempo"><i style="width:${pct}%"></i></div>
            </button>`;
        }).join('')}
        <button class="pd-descobrir" data-act="go-challenges-lista">Descobrir desafios <span>›</span></button>
    </div>`;
}

// Quem criou ajusta os times antes de começar
async function abrirAjusteTimes(cid) {
    const [{ data: cfg }, { data: tm }, { data: r }] = await Promise.all([
        sb.from('challenges').select('team_count, team_names').eq('id', cid).maybeSingle(),
        sb.rpc('challenge_teams', { cid }),
        sb.rpc('challenge_ranking', { cid }),
    ]);
    const n = (cfg && cfg.team_count) || 2;
    const ch = { team_names: (cfg && cfg.team_names) || NOMES_TIMES };
    const nomes = {}; (r || []).forEach(u => { nomes[u.user_id] = u; });
    const old = document.getElementById('timesSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'timesSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Ajustar times</h3>
        <p class="sheet-sub">Toque na cor pra trocar a pessoa de time. Dá pra ajustar até o desafio começar.</p>
        <div class="tm-ajuste">${(tm || []).map(x => {
            const u = nomes[x.user_id] || {};
            return `<div class="tm-aj-linha">
                ${avatarHTML({ id: x.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
                <span class="tm-aj-nome">${escapeHTML(u.display_name || '')}</span>
                <span class="tm-aj-cores">${Array.from({ length: n }, (_, k) => k + 1).map(t => `<button class="tm-aj-cor${x.team === t ? ' on' : ''}" data-act="tm-trocar" data-cid="${cid}" data-uid="${x.user_id}" data-team="${t}" style="--c:${corTime(t)}" aria-label="${escapeHTML(nomeTime(ch, t))}"></button>`).join('')}</span>
            </div>`;
        }).join('') || '<p class="faixa-nota">Ninguém entrou ainda.</p>'}</div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) { sheet.remove(); renderPainelDesafio(cid); } });
}

// ============================================================
// GERENCIAR DESAFIO (quem criou ou admin)
// ============================================================
async function renderGerenciarDesafio(cid) {
    const c = $('#viewContainer');
    c.innerHTML = '<div class="view"><div class="spinner"></div></div>';
    const [{ data: ch }, { data: r }, { data: tm }] = await Promise.all([
        sb.from('challenges').select('id, name, description, rules, starts_at, ends_at, created_by, team_mode, team_count, team_names, group_goal_type, group_goal_value').eq('id', cid).maybeSingle(),
        sb.rpc('challenge_ranking', { cid }),
        sb.rpc('challenge_teams', { cid }),
    ]);
    if (!ch) { c.innerHTML = '<div class="view"><p class="faixa-nota">Desafio não encontrado.</p></div>'; return; }
    state.gerDesafio = ch;
    const times = {}; (tm || []).forEach(x => { times[x.user_id] = x.team; });
    state.gerTimes = times;
    state.gerRanking = r || [];
    const terminou = new Date(ch.ends_at) < new Date();
    const fimTxt = new Date(ch.ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    c.innerHTML = `<div class="view cfg-view">
        <div class="user-topbar">
            <button class="topbar-back" data-act="ger-voltar" data-id="${cid}" aria-label="Voltar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div class="topbar-title">Gerenciar desafio</div>
            <div style="width:36px"></div>
        </div>
        <p class="cfg-sub">${escapeHTML(ch.name)} · termina em ${fimTxt}</p>

        <div class="cfg-grupo">
            <div class="cfg-titulo">Desafio</div>
            ${terminou ? '' : linhaConfig('ger-editar', 'editar', 'Editar desafio')}
            ${!terminou && !ch.team_mode ? linhaConfig('ger-montar-times', 'times', 'Montar times') : ''}
            ${linhaConfig('ger-passar', 'perfil', 'Passar a organização')}
            ${terminou ? '' : linhaConfig('ger-encerrar', 'relogio', 'Encerrar agora')}
        </div>

        <div class="cfg-grupo">
            <div class="cfg-titulo">Participantes · ${state.gerRanking.length}</div>
            ${state.gerRanking.map(u => {
                const t = times[u.user_id];
                const org = u.user_id === ch.created_by;
                return `<div class="ger-linha">
                    ${avatarHTML({ id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
                    <div class="ger-info"><b>${escapeHTML(u.display_name || '')}</b><small>${t ? `<i class="tm-ponto" style="background:${corTime(t)}"></i>Time ${escapeHTML(nomeTime(ch, t))} · ` : ''}${ptsBR(u.points)} pts${org ? ' · organiza' : ''}</small></div>
                    <button class="ger-mais" data-act="ger-menu" data-uid="${u.user_id}" aria-label="Opções"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function menuGerParticipante(btn) {
    hidePostMenu();
    const ch = state.gerDesafio, alvo = btn.dataset.uid;
    const meuT = state.gerTimes[alvo];
    const ops = [];
    if (ch.team_mode) {
        for (let t = 1; t <= (ch.team_count || 2); t++) {
            if (t !== meuT) ops.push(`<button class="post-menu-item" data-act="ger-mover" data-uid="${alvo}" data-team="${t}"><i class="tm-ponto" style="background:${corTime(t)}"></i>Mover pro Time ${escapeHTML(nomeTime(ch, t))}</button>`);
        }
        ops.push(`<button class="post-menu-item" data-act="ger-trocar" data-uid="${alvo}">${icon('times')}Trocar de lugar com…</button>`);
    }
    if (alvo !== ch.created_by) ops.push(`<button class="post-menu-item danger" data-act="ger-remover" data-uid="${alvo}">${icon('lixo')}Remover do desafio</button>`);
    if (!ops.length) { toast('Quem organiza não pode ser removido. Passe a organização antes.', 'ok'); return; }
    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.className = 'post-menu';
    menu.innerHTML = ops.join('');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = Math.min(window.innerHeight - 60 - ops.length * 46, rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.zIndex = 120;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}

// Folha simples pra escolher uma pessoa (trocar de lugar / passar organização)
function escolherPessoaGer(titulo, filtro, aoEscolher) {
    const old = document.getElementById('gerSheet'); if (old) old.remove();
    const lista = state.gerRanking.filter(filtro);
    const sheet = document.createElement('div');
    sheet.id = 'gerSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${titulo}</h3>
        <div class="ger-escolha">${lista.map(u => `<button class="ger-linha ger-opcao" data-uid="${u.user_id}">
            ${avatarHTML({ id: u.user_id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm')}
            <div class="ger-info"><b>${escapeHTML(u.display_name || '')}</b>${state.gerTimes[u.user_id] ? `<small><i class="tm-ponto" style="background:${corTime(state.gerTimes[u.user_id])}"></i>Time ${escapeHTML(nomeTime(state.gerDesafio, state.gerTimes[u.user_id]))}</small>` : ''}</div>
        </button>`).join('') || '<p class="faixa-nota">Ninguém disponível.</p>'}</div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelectorAll('.ger-opcao').forEach(b => b.onclick = () => { sheet.remove(); aoEscolher(b.dataset.uid); });
}

function abrirEditarDesafio() {
    const ch = state.gerDesafio;
    const old = document.getElementById('gerSheet'); if (old) old.remove();
    const fim = isoDe(new Date(ch.ends_at));
    const sheet = document.createElement('div');
    sheet.id = 'gerSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Editar desafio</h3>
        <div class="field"><label>Nome</label><input type="text" id="edNomeD" maxlength="60" value="${escapeHTML(ch.name || '')}"></div>
        <div class="field"><label>Descrição</label><textarea id="edDescD" maxlength="200">${escapeHTML(ch.description || '')}</textarea></div>
        <div class="field"><label>Regras</label><textarea id="edRegrasD" maxlength="600">${escapeHTML(ch.rules || '')}</textarea></div>
        <div class="field"><label>Meta coletiva</label>
            <div class="nc-meta">
                <input type="number" id="edMetaV" min="1" inputmode="numeric" value="${ch.group_goal_value || ''}" placeholder="ex: 500">
                <select id="edMetaT"><option value="">sem meta</option>${[['km', 'km juntos'], ['treinos', 'treinos juntos'], ['horas', 'horas juntos']].map(([v, n]) => `<option value="${v}"${ch.group_goal_type === v ? ' selected' : ''}>${n}</option>`).join('')}</select>
            </div>
        </div>
        <div class="field"><label>Termina em</label>
            <div class="data-campo tem"><input type="date" id="edFimD" value="${fim}" min="${fim}"></div>
            <p class="field-hint">Dá pra estender. Encurtar não, pra não tirar pontos de ninguém.</p>
        </div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="edCancD">Cancelar</button>
            <button class="btn-primary" id="edSalvD">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelector('#edCancD').onclick = () => sheet.remove();
    sheet.querySelector('#edSalvD').onclick = async () => {
        const fimNovo = sheet.querySelector('#edFimD').value;
        const fimTs = fimNovo ? new Date(fimNovo + 'T23:59:59') : null;
        const { error } = await sb.rpc('gestor_editar_desafio', {
            cid: ch.id,
            nome: sheet.querySelector('#edNomeD').value,
            descricao: sheet.querySelector('#edDescD').value,
            regras: sheet.querySelector('#edRegrasD').value,
            meta_tipo: sheet.querySelector('#edMetaT').value || null,
            meta_valor: Number(sheet.querySelector('#edMetaV').value) || null,
            novo_fim: fimTs && fimTs > new Date(ch.ends_at) ? fimTs.toISOString() : null,
        });
        if (error) { toast(msgErro(error), 'err'); return; }
        sheet.remove();
        toast('Desafio atualizado', 'ok');
        renderGerenciarDesafio(ch.id);
    };
}

function abrirMontarTimes() {
    const ch = state.gerDesafio;
    const old = document.getElementById('gerSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'gerSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Montar times</h3>
        <p class="sheet-sub">O app divide todo mundo equilibrando pelos pontos atuais. O placar de cada time já começa com a soma do que cada um fez no desafio. Depois de montados, os times não podem ser desfeitos.</p>
        <div class="nc-qtd">${[2, 3, 4].map(n => `<button type="button" class="${n === 2 ? 'on' : ''}" data-qtd="${n}">${n} times</button>`).join('')}</div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="mtCanc">Cancelar</button>
            <button class="btn-primary" id="mtOk">Montar times</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelectorAll('[data-qtd]').forEach(b => b.onclick = () => sheet.querySelectorAll('[data-qtd]').forEach(x => x.classList.toggle('on', x === b)));
    sheet.querySelector('#mtCanc').onclick = () => sheet.remove();
    sheet.querySelector('#mtOk').onclick = async () => {
        const qtd = Number(sheet.querySelector('[data-qtd].on').dataset.qtd);
        const { error } = await sb.rpc('gestor_montar_times', { cid: ch.id, qtd });
        if (error) { toast(msgErro(error), 'err'); return; }
        sheet.remove();
        toast('Times montados! Todo mundo foi avisado. 🟢🟠', 'ok');
        renderGerenciarDesafio(ch.id);
    };
}

// ============================================================
// CONSTÂNCIA: calendário do mês (só a própria pessoa vê)
// ============================================================
async function hydrateCalMes() {
    const slot = document.getElementById('calMesSlot');
    if (!slot) return;
    const agora = new Date();
    if (!state.calMes) state.calMes = { a: agora.getFullYear(), m: agora.getMonth() };
    const { a, m } = state.calMes;
    const ini = new Date(a, m, 1), fim = new Date(a, m + 1, 1);
    const { data } = await sb.from('posts').select('created_at, activity_type, duration_min, distance_km')
        .eq('user_id', state.session.user.id).eq('kind', 'workout')
        .gte('created_at', ini.toISOString()).lt('created_at', fim.toISOString())
        .order('created_at', { ascending: true });
    if (!document.getElementById('calMesSlot')) return;
    const porDia = {};
    (data || []).forEach(p => { const dd = new Date(p.created_at).getDate(); (porDia[dd] = porDia[dd] || []).push(p); });
    const diasMes = new Date(a, m + 1, 0).getDate();
    const vazios = (ini.getDay() + 6) % 7; // semana começa na segunda
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const ehMesAtual = a === agora.getFullYear() && m === agora.getMonth();
    // maior sequência no mês
    let seq = 0, melhor = 0;
    for (let d = 1; d <= diasMes; d++) { if (porDia[d]) { seq++; melhor = Math.max(melhor, seq); } else seq = 0; }
    const treinados = Object.keys(porDia).length;
    const celulas = [];
    for (let k = 0; k < vazios; k++) celulas.push('<span class="cm-d vazio"></span>');
    for (let d = 1; d <= diasMes; d++) {
        const dia = new Date(a, m, d);
        const cls = ['cm-d'];
        if (porDia[d]) cls.push('on');
        if (+dia === +hoje) cls.push('hoje');
        if (dia > hoje) cls.push('futuro');
        celulas.push(`<button type="button" class="${cls.join(' ')}" ${porDia[d] ? `data-act="cal-dia" data-d="${d}"` : 'tabindex="-1"'}>${d}</button>`);
    }
    state.calMesDias = porDia;
    const nomeMes = ini.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    slot.innerHTML = `<div class="chart-card cal-mes" id="calMesCard">
        <div class="cm-topo">
            <span class="chart-title">Constância</span>
            <div class="cm-nav">
                <button type="button" data-act="cal-mes" data-dir="-1" aria-label="Mês anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                <span>${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</span>
                <button type="button" data-act="cal-mes" data-dir="1" aria-label="Próximo mês" ${ehMesAtual ? 'disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
            </div>
        </div>
        <div class="cm-sem">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="cm-grade">${celulas.join('')}</div>
        <div class="cm-balao hidden" id="cmBalao"></div>
        <p class="cm-rodape"><b>${treinados}</b> ${treinados === 1 ? 'dia treinado' : 'dias treinados'}${melhor > 1 ? ` · melhor sequência: <b>${melhor}</b> dias` : ''}</p>
    </div>`;
    // arrastar pro lado troca o mês
    const card = document.getElementById('calMesCard');
    let x0 = null;
    card.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', e => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) trocarMesCal(dx > 0 ? -1 : 1);
    });
}
function trocarMesCal(dir) {
    const agora = new Date();
    let { a, m } = state.calMes;
    m += dir;
    if (m < 0) { m = 11; a--; } if (m > 11) { m = 0; a++; }
    if (a > agora.getFullYear() || (a === agora.getFullYear() && m > agora.getMonth())) return;
    state.calMes = { a, m };
    hydrateCalMes();
}

// Explicação rápida da ofensiva (toque no 🔥 do perfil)
async function abrirExplicacaoOfensiva() {
    const [{ data: st }, { data: escudo }] = await Promise.all([
        sb.from('daily_streaks').select('current_streak, longest_streak').eq('user_id', state.session.user.id).maybeSingle(),
        sb.rpc('shield_status'),
    ]);
    const atual = (st && st.current_streak) || 0, rec = (st && st.longest_streak) || 0;
    const temEscudo = escudo && escudo[0] && escudo[0].disponivel;
    const old = document.getElementById('ofSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'ofSheet'; sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card of-card">
        <div class="sheet-handle"></div>
        <div class="of-num">🔥 <b>${atual}</b><span>${atual === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
        <p class="of-rec">Seu recorde: <b>${rec}</b> ${rec === 1 ? 'dia' : 'dias'}</p>
        <div class="of-itens">
            <p><b>Como manter:</b> registre qualquer coisa por dia: treino, refeição, água, sono, peso ou story.</p>
            <p><b>Escudo 🛡️:</b> perdeu um dia? Um escudo por semana segura a sequência sozinho. ${temEscudo ? '<span class="of-ok">Seu escudo desta semana está disponível.</span>' : '<span class="of-usado">Seu escudo desta semana já foi usado.</span>'}</p>
            <p><b>Bônus:</b> 3 dias (+2), 7 dias (+5), 14 dias (+10) e 30 dias (+20).</p>
        </div>
        <button class="btn-secondary" data-act="go-rules" style="width:100%">Como ganhar pontos</button>
    </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-act="go-rules"]')) sheet.remove(); });
}

// ---- Conquistas do grupo, meta coletiva e marcos ----
const MARCOS_GRUPO = {
    treinos: [25, 50, 100, 200, 300, 500, 750, 1000, 2000],
    km: [25, 50, 100, 250, 500, 1000, 2000],
    horas: [10, 25, 50, 100, 250, 500],
    kg: [5, 10, 20, 30, 50, 100],
};
const NOME_MARCO = { treinos: 'treinos', km: 'km', horas: 'horas de treino', kg: 'kg perdidos' };
function numBR(n, casas = 0) { return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas }); }

async function hydrateTotaisGrupo(ch) {
    const box = document.getElementById('pdGrupoTotais');
    if (!box) return;
    const [{ data: t }, { data: optout }] = await Promise.all([
        sb.rpc('challenge_group_totals', { cid: ch.id }),
        sb.rpc('my_challenge_weight_optout', { cid: ch.id }),
    ]);
    if (!t || !document.getElementById('pdGrupoTotais')) return;
    state.totaisGrupo = state.totaisGrupo || {};
    state.totaisGrupo[ch.id] = t;
    const horas = Math.round(Number(t.minutos || 0) / 60);
    const valores = { treinos: Number(t.treinos || 0), km: Number(t.km || 0), horas, kg: t.kg_perdidos != null ? Number(t.kg_perdidos) : null };

    // meta coletiva
    let metaHTML = '';
    if (t.meta_tipo && Number(t.meta_valor) > 0) {
        const atual = valores[t.meta_tipo] || 0;
        const alvo = Number(t.meta_valor);
        const pct = Math.min(100, atual / alvo * 100);
        metaHTML = `<div class="gm-meta${pct >= 100 ? ' batida' : ''}">
            <div class="gm-meta-topo"><span>Meta do grupo</span><b>${numBR(atual, 1)} de ${numBR(alvo)} ${NOME_MARCO[t.meta_tipo]}</b></div>
            <div class="gm-trilho"><i style="width:${Math.max(2, pct)}%"></i></div>
            <small>${pct >= 100 ? '🎉 Meta batida! Todo mundo junto.' : `Faltam ${numBR(Math.max(0, alvo - atual), 1)} ${NOME_MARCO[t.meta_tipo]}. Cada treino conta pro grupo.`}</small>
        </div>`;
    }
    box.innerHTML = `<div class="chart-card gm-card">
        <div class="chart-head"><span class="chart-title">Conquistas do grupo</span></div>
        ${metaHTML}
        <div class="gm-grade">
            <div><b>${numBR(valores.treinos)}</b><span>treinos</span></div>
            <div><b>${numBR(valores.horas)}h</b><span>treinando</span></div>
            ${valores.km ? `<div><b>${numBR(valores.km, 1)}</b><span>km juntos</span></div>` : ''}
            ${valores.kg ? `<div><b>${numBR(valores.kg, 1)} kg</b><span>a menos, juntos</span></div>` : ''}
            <div><b>🔥 ${numBR(t.ofensiva_soma || 0)}</b><span>dias de ofensiva somados</span></div>
        </div>
        <p class="gm-nota">${valores.kg == null ? 'O total de kg aparece quando pelo menos 3 pessoas registrarem peso no período. ' : ''}Ninguém vê o peso de ninguém, só a soma.
        <button class="ia-link" data-act="peso-grupo-toggle" data-id="${ch.id}" data-sair="${optout ? '0' : '1'}">${optout ? 'Incluir meu peso no total' : 'Tirar meu peso do total'}</button></p>
    </div>`;

    // marcos: compara com o que este aparelho já tinha visto
    const chave = 'pulso-marcos-' + ch.id;
    let vistos = {};
    try { vistos = JSON.parse(lsGet(chave) || '{}'); } catch (_) {}
    let celebrar = null;
    Object.entries(MARCOS_GRUPO).forEach(([k, lista]) => {
        const v = valores[k];
        if (v == null) return;
        const passou = lista.filter(x => v >= x).pop();
        if (passou && (vistos[k] || 0) < passou) {
            if (vistos[k] !== undefined) celebrar = celebrar || { k, passou };
            vistos[k] = passou;
        } else if (vistos[k] === undefined) vistos[k] = passou || 0;
    });
    lsSet(chave, JSON.stringify(vistos));
    if (celebrar) {
        const m = document.getElementById('pdMarco');
        if (m) m.innerHTML = `<div class="gm-marco">🎉 <b>O grupo acabou de passar de ${numBR(celebrar.passou)} ${NOME_MARCO[celebrar.k]}!</b><button class="dc-x" data-act="fechar-marco" aria-label="Fechar">×</button></div>`;
    }
}

async function hydrateDestaqueSemana(ch) {
    const box = document.getElementById('pdDestaque');
    if (!box) return;
    // só a partir da 2ª semana do desafio
    if (Date.now() - new Date(ch.starts_at) < 7 * 86400000) return;
    const { data } = await sb.rpc('challenge_destaque_semana', { cid: ch.id });
    const d = data && data[0];
    if (!d || !d.dias || !document.getElementById('pdDestaque')) return;
    const eu = d.user_id === state.session.user.id;
    box.innerHTML = `<div class="chart-card gm-destaque">
        <span class="gm-dest-tag">⭐ Destaque da semana passada</span>
        <div class="gm-dest-linha">
            ${avatarHTML({ id: d.user_id, display_name: d.display_name, avatar_url: d.avatar_url }, 'md')}
            <div><b>${eu ? 'Você!' : escapeHTML(d.display_name)}</b><span>${d.dias} ${d.dias === 1 ? 'dia' : 'dias'} de treino · ${String(Math.round(d.minutos / 60 * 10) / 10).replace('.', ',')}h no total</span></div>
            ${eu ? '' : `<button class="pd-aplauso" data-act="incentivar" data-cid="${ch.id}" data-uid="${d.user_id}" data-nome="${escapeHTML(String(d.display_name).split(' ')[0])}" aria-label="Aplaudir">👏</button>`}
        </div>
    </div>`;
}

// O que os participantes fizeram hoje (só treino e ofensiva; nunca peso nem refeição)
async function hydrateGrupoHoje(ch, ranking) {
    const box = document.getElementById('pdGrupo');
    if (!box) return;
    const ids = (ranking || []).map(u => u.user_id);
    if (!ids.length) { box.innerHTML = '<p class="faixa-nota">Ninguém no grupo ainda.</p>'; return; }
    const ini = new Date(); ini.setHours(0, 0, 0, 0);
    const [{ data: treinos }, { data: ofensivas }] = await Promise.all([
        sb.from('posts').select('user_id, activity_type, duration_min, distance_km, created_at')
            .in('user_id', ids).eq('kind', 'workout').gte('created_at', ini.toISOString()).order('created_at', { ascending: false }).limit(30),
        sb.rpc('challenge_streaks', { cid: ch.id }),
    ]);
    if (!document.getElementById('pdGrupo')) return;
    const nome = id => { const u = ranking.find(x => x.user_id === id); return id === state.session.user.id ? 'Você' : escapeHTML(String((u && u.display_name) || '').split(' ')[0]); };
    const avatar = id => { const u = ranking.find(x => x.user_id === id) || {}; return avatarHTML({ id, display_name: u.display_name, avatar_url: u.avatar_url }, 'sm'); };
    const itens = [];
    (treinos || []).forEach(t => {
        const km = Number(t.distance_km || 0);
        itens.push({ id: t.user_id, quando: t.created_at, txt: `${WORKOUT_EMOJI[t.activity_type] || '💪'} ${nome(t.user_id)} ${t.activity_type === 'Corrida' ? 'correu' : 'treinou'} ${km ? String(km).replace('.', ',') + ' km · ' : ''}${t.duration_min || 0} min` });
    });
    const MARCOS = [3, 7, 14, 21, 30, 60, 100];
    (ofensivas || []).filter(o => MARCOS.includes(o.atual)).forEach(o => {
        itens.push({ id: o.user_id, quando: null, txt: `🔥 ${nome(o.user_id)} chegou a ${o.atual} dias de ofensiva no desafio` });
    });
    box.innerHTML = itens.length ? itens.slice(0, 12).map(it => `<div class="pd-grupo-item">
        ${avatar(it.id)}
        <span class="pd-grupo-txt">${it.txt}${it.quando ? `<small>${timeAgo(it.quando)}</small>` : ''}</span>
        ${it.id !== state.session.user.id ? `<button class="pd-aplauso" data-act="incentivar" data-cid="${ch.id}" data-uid="${it.id}" data-nome="${nome(it.id)}" aria-label="Aplaudir">👏</button>` : ''}
    </div>`).join('') : '<p class="faixa-nota">Ninguém treinou hoje ainda. Que tal ser o primeiro?</p>';
}

// Bolinha no botão Desafio quando a posição mudou desde a última visita
async function atualizarBadgeDesafio() {
    const dot = document.getElementById('navDesafioDot');
    if (!dot || !state.session) return;
    try {
        const meus = (await meusDesafiosAtivos()).filter(ch => ch.status === 'ativo').slice(0, 3);
        let mudou = false;
        for (const ch of meus) {
            const { data: r } = await sb.rpc('challenge_ranking', { cid: ch.id });
            const pos = (r || []).findIndex(u => u.user_id === state.session.user.id) + 1;
            const visto = Number(lsGet('pulso-pos-visto-' + ch.id) || 0);
            lsSet(posChave(ch.id, hojeISO()), String(pos || ''));
            if (pos && visto && pos !== visto && state.view !== 'desafio') mudou = true;
            state.posDesafio = state.posDesafio || {};
            state.posDesafio[ch.id] = { pos, nome: ch.name, pts: r && r[pos - 1] ? Number(r[pos - 1].points) : 0 };
        }
        dot.classList.toggle('hidden', !mudou);
    } catch (_) {}
}

// Depois de registrar um treino: mostra o efeito no desafio
async function efeitoNoDesafio() {
    try {
        const antes = { ...(state.posDesafio || {}) };
        await atualizarBadgeDesafio();
        const depois = state.posDesafio || {};
        for (const cid of Object.keys(depois)) {
            const a = antes[cid], d = depois[cid];
            if (!d || !d.pos) continue;
            const ganho = a ? Math.round(d.pts - a.pts) : 0;
            if (a && a.pos && d.pos < a.pos) { toast(`${ganho > 0 ? '+' + ganho + ' no ' : ''}${d.nome} · você subiu pra ${d.pos}º 🚀`, 'ok'); return; }
            if (ganho > 0) { toast(`+${ganho} no ${d.nome} · você está em ${d.pos}º`, 'ok'); return; }
        }
    } catch (_) {}
}

// ============================================================
// DEPOIMENTOS (até 140 caracteres; quem recebe decide publicar)
// ============================================================
const PALAVRAS_BLOQUEADAS = ['porra', 'caralho', 'puta', 'merda', 'fdp', 'buceta', 'cacete', 'arrombado', 'arrombada', 'viado', 'otário', 'otario', 'vagabundo', 'vagabunda', 'desgraçado', 'desgraçada', 'lixo', 'nojento', 'nojenta', 'gorda', 'gordo', 'baleia', 'feio', 'feia'];
function textoOfensivo(t) {
    const norm = ' ' + String(t || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ') + ' ';
    return PALAVRAS_BLOQUEADAS.some(p => norm.includes(' ' + p + ' '));
}

async function renderDepoimentos(uid, euSigo, nomeAlvo) {
    const body = $('#profileTabBody');
    if (!body) return;
    body.innerHTML = '<div class="spinner"></div>';
    const eu = state.session.user.id;
    const meu = uid === eu;
    const { data, error } = await sb.from('depoimentos')
        .select('id, author_id, target_id, texto, status, created_at, published_at, autor:profiles!author_id (id, username, display_name, avatar_url)')
        .eq('target_id', uid).order('created_at', { ascending: false }).limit(60);
    if (!document.getElementById('profileTabBody')) return;
    if (error) { body.innerHTML = `<p class="faixa-nota">Não consegui carregar: ${escapeHTML(msgErro(error))}</p>`; return; }
    const lista = data || [];
    const pendentes = meu ? lista.filter(x => x.status === 'pendente') : [];
    const meuPendente = !meu ? lista.find(x => x.author_id === eu && x.status === 'pendente') : null;
    const publicados = lista.filter(x => x.status === 'publicado');
    const jaMandei = !meu && lista.some(x => x.author_id === eu && x.status === 'pendente');

    const cartao = (x, pendente) => {
        const a = x.autor || {};
        const podeApagar = meu || x.author_id === eu;
        return `<div class="dep-item${pendente ? ' pendente' : ''}">
            <div class="dep-topo">
                <span data-act="view-user" data-uid="${a.id}">${avatarHTML(a, 'sm')}</span>
                <div class="dep-quem" data-act="view-user" data-uid="${a.id}"><b>${escapeHTML(a.display_name || '')}</b><small>@${escapeHTML(a.username || '')} · ${timeAgo(x.published_at || x.created_at)}</small></div>
                ${!pendente && podeApagar ? `<button class="dep-mini" data-act="dep-apagar" data-id="${x.id}">Apagar</button>` : ''}
                ${!pendente && !podeApagar ? `<button class="dep-mini" data-act="report-user" data-uid="${a.id}" data-name="${escapeHTML(a.display_name || '')}">Denunciar</button>` : ''}
            </div>
            <p class="dep-texto">“${escapeHTML(x.texto)}”</p>
            ${pendente && !meu ? `<div class="dep-meu-pend">
                <span class="dep-tag-pend">Aguardando aprovação</span>
                <div class="dep-bts">
                    <button class="btn-ghost btn-xs" data-act="dep-apagar" data-id="${x.id}">Apagar</button>
                    <button class="btn-secondary btn-xs" data-act="dep-editar" data-id="${x.id}" data-texto="${escapeHTML(x.texto)}" data-uid="${uid}">Editar</button>
                </div>
            </div>` : ''}
            ${pendente && meu ? `<div class="dep-decidir">
                <label class="dep-feed"><input type="checkbox" id="depFeed-${x.id}"> também postar no feed</label>
                <div class="dep-bts">
                    <button class="btn-ghost btn-xs" data-act="dep-responder" data-id="${x.id}" data-pub="0">Recusar</button>
                    <button class="btn-primary-sm" data-act="dep-responder" data-id="${x.id}" data-pub="1">Publicar</button>
                </div>
            </div>` : ''}
        </div>`;
    };

    let topo = '';
    if (!meu) {
        if (euSigo && !jaMandei) topo = `<button class="dep-escrever" data-act="dep-escrever" data-uid="${uid}" data-nome="${escapeHTML(nomeAlvo || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16v4zM13.5 6.5l4 4"/></svg>
            <span>Escreva um depoimento pra ${escapeHTML(String(nomeAlvo || '').split(' ')[0])}…</span>
        </button>`;
        else if (jaMandei) topo = '';
        else topo = '<p class="faixa-nota dep-aviso">Siga essa pessoa pra poder deixar um depoimento.</p>';
    }
    body.innerHTML = `
        ${topo}
        ${meuPendente ? `<div class="dep-secao">Seu depoimento</div>${cartao(meuPendente, true)}` : ''}
        ${pendentes.length ? `<div class="dep-secao">Esperando sua aprovação (${pendentes.length})</div>${pendentes.map(x => cartao(x, true)).join('')}` : ''}
        ${publicados.length ? `${pendentes.length ? '<div class="dep-secao">Publicados</div>' : ''}${publicados.map(x => cartao(x, false)).join('')}`
            : (meuPendente ? '' : `<div class="grid-empty">${meu ? 'Quando alguém deixar um depoimento pra você, ele aparece aqui pra você aprovar.' : 'Nenhum depoimento ainda.'}</div>`)}
    `;
}

function abrirEscreverDepoimento(uid, nome, editando = null) {
    const old = document.getElementById('depSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'depSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">${editando ? 'Editar depoimento' : `Depoimento pra ${escapeHTML(String(nome || '').split(' ')[0])}`}</h3>
        <p class="sheet-sub">Ela lê e decide se publica no perfil. Seja gentil e verdadeiro.</p>
        <textarea id="depTexto" class="obj-input dep-campo" maxlength="140" rows="4" placeholder="O que te inspira nessa pessoa?">${editando ? escapeHTML(editando.texto) : ''}</textarea>
        <div class="dep-contador"><span id="depConta">${editando ? editando.texto.length : 0}</span>/140</div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="depCancelar">Cancelar</button>
            <button class="btn-primary" id="depEnviar" ${editando ? '' : 'disabled'}>${editando ? 'Salvar' : 'Enviar'}</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const campo = sheet.querySelector('#depTexto'), enviar = sheet.querySelector('#depEnviar');
    campo.addEventListener('input', () => {
        const n = campo.value.length;
        sheet.querySelector('#depConta').textContent = n;
        enviar.disabled = !campo.value.trim();
    });
    setTimeout(() => campo.focus(), 80);
    sheet.querySelector('#depCancelar').onclick = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    enviar.onclick = async () => {
        const texto = campo.value.trim();
        if (textoOfensivo(texto)) { toast('Esse texto tem palavras que não combinam com um depoimento. Que tal reescrever?', 'err'); return; }
        enviar.disabled = true; enviar.textContent = 'Enviando...';
        const { error } = editando
            ? await sb.rpc('editar_depoimento', { did: editando.id, texto })
            : await sb.rpc('enviar_depoimento', { alvo: uid, texto });
        if (error) { toast(msgErro(error), 'err'); enviar.disabled = false; enviar.textContent = editando ? 'Salvar' : 'Enviar'; return; }
        sheet.remove();
        toast(editando ? 'Depoimento atualizado' : 'Depoimento enviado. Agora é com ela!', 'ok');
        const aba = document.querySelector('.ig-tab[data-tab="depoimentos"]');
        if (aba) aba.click();
    };
}

// ---- Vitrine do desafio (pra quem ainda não participa) ----
async function renderChallengeVitrine(ch) {
    const c = $('#viewContainer');
    const cid = ch.id;
    const dataBR = d => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const aberto = ch.status !== 'encerrado';
    const podeEntrar = ch.is_open && aberto;
    const podePedir = !ch.is_open && aberto;

    let meuPedido = null;
    if (podePedir) {
        const { data: st } = await sb.rpc('my_challenge_request', { cid });
        meuPedido = st || null;
    }
    const [{ data: convite }, { data: regrasRow }] = await Promise.all([
        sb.rpc('my_challenge_invite', { cid }),
        sb.from('challenges').select('rules').eq('id', cid).maybeSingle(),
    ]);
    ch.rules = regrasRow ? regrasRow.rules : ch.rules;
    const convidado = convite && convite.length ? convite[0] : null;

    const statusLbl = ch.status === 'ativo' ? 'Rolando agora' : ch.status === 'futuro' ? 'Em breve' : 'Encerrado';
    const statusCls = ch.status === 'ativo' ? 'ativo' : ch.status === 'futuro' ? 'futuro' : 'fim';

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="go-community">←</button>
                <div class="topbar-title">Desafio</div>
                <div style="width:28px"></div>
            </div>

            <div class="ch-hero">
                <span class="ch-status ${statusCls}">${statusLbl}</span>
                <h1 class="ch-hero-name">${escapeHTML(ch.name)}</h1>
                ${ch.description ? `<p class="ch-hero-desc">${escapeHTML(ch.description)}</p>` : ''}
                <div class="ch-hero-meta">
                    <span>📅 ${dataBR(ch.starts_at)} a ${dataBR(ch.ends_at)}</span>
                    <span>👥 ${plural(ch.members, 'participante', 'participantes')}</span>
                </div>
                ${convidado && aberto ? `<div class="ch-convite">
                    <span><b>${escapeHTML(convidado.inviter_name || 'Alguém')}</b> te convidou pra esse desafio</span>
                    <div class="ch-convite-bts">
                        <button class="btn-ghost btn-xs" data-act="responder-convite" data-id="${cid}" data-aceitar="0">Recusar</button>
                        <button class="btn-primary-sm" data-act="responder-convite" data-id="${cid}" data-aceitar="1">Aceitar e entrar</button>
                    </div>
                </div>` : ''}
                <div class="ch-actions${convidado && aberto ? ' hidden' : ''}">
                    ${podeEntrar ? `<button class="btn-primary-sm" data-act="join-challenge" data-id="${cid}">Entrar no desafio</button>` : ''}
                    ${podePedir && !meuPedido ? `<button class="btn-primary-sm" data-act="pedir-acesso" data-id="${cid}">Solicitar entrada</button>` : ''}
                    ${meuPedido === 'pendente' ? '<span class="ch-pedido-tag">Pedido enviado, aguardando resposta</span>' : ''}
                    ${meuPedido === 'recusado' ? '<span class="ch-pedido-tag recusado">Pedido não aceito</span>' : ''}
                    ${(podeEntrar || (podePedir && !meuPedido)) ? '<p class="ch-aviso-privacidade">Entrando, o grupo passa a ver seu percentual de evolução, seus dias treinados e seus pontos. Peso, medidas e refeições continuam privados.</p>' : ''}
                </div>
            </div>

            ${aberto ? regrasDesafioHTML(ch) : ''}

            <div class="ch-locked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>
                <p>${aberto ? 'Ranking e progresso do grupo ficam visíveis só pra quem participa.' : 'Esse desafio já terminou.'}</p>
            </div>
        </div>
    `;
}

function openNewChallengeSheet() {
    const old = document.getElementById('newChallengeSheet');
    if (old) old.remove();
    const hoje = new Date().toISOString().split('T')[0];
    const em30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    const sheet = document.createElement('div');
    sheet.id = 'newChallengeSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Criar desafio</h3>
        <p class="sheet-sub">O ranking usa os pontos que cada um ganhar no período.</p>
        <div class="field"><label>Nome</label><input type="text" id="ncName" maxlength="60" placeholder="ex: Setembro Ativo"></div>
        <div class="field"><label>Descrição (opcional)</label><textarea id="ncDesc" maxlength="200" placeholder="Qual é o objetivo do desafio?"></textarea></div>
        <div class="field"><label>Regras do desafio (opcional)</label><textarea id="ncRegras" maxlength="600" placeholder="ex: vale só treino com foto; prêmio pro primeiro lugar; quem sumir 7 dias sai"></textarea></div>
        <div class="field"><label>Formato</label>
            <div class="nc-formato">
                <button type="button" class="on" data-formato="individual">Individual</button>
                <button type="button" data-formato="times">Em times</button>
            </div>
            <div class="nc-times hidden" id="ncTimes">
                <span class="field-hint">Quantos times?</span>
                <div class="nc-qtd">${[2, 3, 4].map(n => `<button type="button" class="${n === 2 ? 'on' : ''}" data-qtd="${n}">${n}</button>`).join('')}</div>
                <p class="field-hint">O app divide as pessoas automaticamente, equilibrando quem é mais e menos ativo. O placar de cada time é a soma dos pontos de quem está nele.</p>
            </div>
        </div>
        <div class="field"><label>Meta coletiva (opcional)</label>
            <div class="nc-meta">
                <input type="number" id="ncMetaValor" min="1" max="100000" inputmode="numeric" placeholder="ex: 500">
                <select id="ncMetaTipo"><option value="">sem meta</option><option value="km">km juntos</option><option value="treinos">treinos juntos</option><option value="horas">horas juntos</option></select>
            </div>
            <p class="field-hint">Um número que o grupo todo persegue junto, além da competição.</p>
        </div>
        <div class="field-row">
            <div class="field"><label>Começa</label><input type="date" id="ncStart" value="${hoje}"></div>
            <div class="field"><label>Termina</label><input type="date" id="ncEnd" value="${em30}"></div>
        </div>
        <div class="field">
            <label>Quem pode entrar</label>
            <select id="ncOpen">
                <option value="1">Público: qualquer pessoa entra na hora</option>
                <option value="0">Privado: entra por convite ou pedido aprovado</option>
            </select>
        </div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="ncCancel">Cancelar</button>
            <button class="btn-primary" id="ncSave">Criar desafio</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('ncCancel').onclick = close;
    sheet.querySelectorAll('[data-formato]').forEach(b => b.onclick = () => {
        sheet.querySelectorAll('[data-formato]').forEach(x => x.classList.toggle('on', x === b));
        sheet.querySelector('#ncTimes').classList.toggle('hidden', b.dataset.formato !== 'times');
    });
    sheet.querySelectorAll('[data-qtd]').forEach(b => b.onclick = () => sheet.querySelectorAll('[data-qtd]').forEach(x => x.classList.toggle('on', x === b)));

    document.getElementById('ncSave').onclick = async () => {
        const btn = document.getElementById('ncSave');
        const nome = document.getElementById('ncName').value.trim();
        const ini = document.getElementById('ncStart').value;
        const fim = document.getElementById('ncEnd').value;
        if (!nome) { toast('Dê um nome ao desafio', 'err'); return; }
        if (!ini || !fim || new Date(fim) <= new Date(ini)) { toast('A data final precisa ser depois da inicial', 'err'); return; }

        btn.disabled = true; btn.textContent = 'Criando...';
        const { data, error } = await sb.from('challenges').insert({
            name: nome,
            description: document.getElementById('ncDesc').value.trim() || null,
            rules: document.getElementById('ncRegras').value.trim() || null,
            team_mode: !!sheet.querySelector('[data-formato="times"].on'),
            team_count: sheet.querySelector('[data-formato="times"].on') ? Number((sheet.querySelector('[data-qtd].on') || {}).dataset?.qtd || 2) : null,
            group_goal_type: (document.getElementById('ncMetaTipo').value && Number(document.getElementById('ncMetaValor').value) > 0) ? document.getElementById('ncMetaTipo').value : null,
            group_goal_value: (document.getElementById('ncMetaTipo').value && Number(document.getElementById('ncMetaValor').value) > 0) ? Number(document.getElementById('ncMetaValor').value) : null,
            starts_at: new Date(ini + 'T00:00:00').toISOString(),
            ends_at: new Date(fim + 'T23:59:59').toISOString(),
            created_by: state.session.user.id,
            is_open: document.getElementById('ncOpen').value === '1',
        }).select().single();
        btn.disabled = false; btn.textContent = 'Criar desafio';
        if (error) { toast('Erro: ' + error.message, 'err'); return; }

        await sb.from('challenge_members').insert({ challenge_id: data.id, user_id: state.session.user.id });
        close();
        toast('Desafio criado!', 'ok');
        switchView('challenge', { id: data.id });
    };
}

function openInviteSheet(cid) {
    const old = document.getElementById('inviteSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'inviteSheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Convidar pro desafio</h3>
        <button type="button" class="inv-link" id="invLink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>
            <span><b>Compartilhar link de convite</b><small>Manda no grupo do WhatsApp. Quem tocar cai direto no desafio.</small></span>
        </button>
        <p class="sheet-sub">Ou convide alguém que já usa o Pulso pelo @usuário:</p>
        <div class="field"><label>Usuário ou nome</label><input type="text" id="invUser" placeholder="comece a digitar..." autocapitalize="off" autocomplete="off"></div>
        <div id="invResults" class="follow-list"></div>
        <div id="invMsg"></div>
        <div class="sheet-footer">
            <button class="btn-ghost" id="invCancel">Fechar</button>
            <button class="btn-primary" id="invAdd">Convidar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const btnLink = sheet.querySelector('#invLink');
    if (btnLink) btnLink.onclick = async () => {
        const link = `${location.origin}${location.pathname}?d=${cid}&u=${encodeURIComponent(state.profile.username)}`;
        const texto = `Bora entrar no meu desafio no Pulso? ${link}`;
        try {
            if (navigator.share) await navigator.share({ title: 'Pulso', text: texto, url: link });
            else { await navigator.clipboard.writeText(texto); toast('Link copiado, é só colar no grupo', 'ok'); }
        } catch (_) {}
    };
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('invCancel').onclick = close;

    // Sugere pessoas conforme digita
    const campo = document.getElementById('invUser');
    let buscaTimer = null;
    campo.addEventListener('input', () => {
        clearTimeout(buscaTimer);
        const q = campo.value.trim().replace('@', '');
        const box = document.getElementById('invResults');
        if (q.length < 2) { box.innerHTML = ''; return; }
        buscaTimer = setTimeout(async () => {
            const { data } = await sb.rpc('search_profiles', { q });
            if (!data || data.length === 0) { box.innerHTML = '<div class="log-empty" style="padding:12px">Ninguém com esse nome.</div>'; return; }
            box.innerHTML = data.slice(0, 6).map(u => `<div class="follow-row" data-inv-user="${escapeHTML(u.username)}">
                ${avatarHTML(u, 'sm')}
                <div style="flex:1;min-width:0">
                    <div class="follow-name">${escapeHTML(u.display_name)}</div>
                    <div class="follow-uname">@${escapeHTML(u.username)}</div>
                </div>
                <span class="inv-add">+ Convidar</span>
            </div>`).join('');
            box.querySelectorAll('[data-inv-user]').forEach(row => row.addEventListener('click', () => {
                campo.value = row.dataset.invUser;
                box.innerHTML = '';
                document.getElementById('invAdd').click();
            }));
        }, 300);
    });

    document.getElementById('invAdd').onclick = async () => {
        const btn = document.getElementById('invAdd');
        const uname = document.getElementById('invUser').value.trim().replace('@', '');
        const msg = document.getElementById('invMsg');
        if (!uname) return;
        btn.disabled = true; btn.textContent = 'Convidando...';
        const { data, error } = await sb.rpc('add_challenge_member', { cid, uname });
        btn.disabled = false; btn.textContent = 'Convidar';
        if (error) { msg.innerHTML = `<div class="auth-msg err">${escapeHTML(msgErro(error))}</div>`; return; }
        if (data === 'nao_encontrado') { msg.innerHTML = '<div class="auth-msg err">Usuário não encontrado.</div>'; return; }
        if (data === 'ja_participa') { msg.innerHTML = `<div class="auth-msg ok">@${escapeHTML(uname)} já está no desafio.</div>`; return; }
        msg.innerHTML = `<div class="auth-msg ok">Convite enviado pra @${escapeHTML(uname)}. Ela entra quando aceitar.</div>`;
        document.getElementById('invUser').value = '';
    };
}

async function renderProfile() {
    sincronizarModoTela();
    const c = $('#viewContainer');
    if (!c.querySelector('.ig-profile, .profile-header, .ig-profile-stats')) c.innerHTML = esqueleto('perfil');
    const p = state.profile;
    const [{ count: postCount }, { data: streak }, { data: followersCount }, { data: followingCount }] = await Promise.all([
        sb.from('posts').select('*', {count:'exact', head:true}).eq('user_id', state.session.user.id).neq('kind', 'weight').not('image_url', 'is', null).eq('in_feed', true),
        sb.from('daily_streaks').select('*').eq('user_id', state.session.user.id).maybeSingle(),
        sb.rpc('my_followers_count'),
        sb.rpc('my_following_count'),
    ]);

    const { data: myPosts } = await sb.from('posts')
        .select('id, image_url, thumb_url, kind, caption, created_at, activity_type, duration_min, meal_slot, pinned_at')
        .eq('user_id', state.session.user.id)
        .neq('kind', 'weight')
        .not('image_url', 'is', null).eq('in_feed', true).eq('archived', false)
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(30);

    // Meta de peso
    const { data: goalData } = await sb.rpc('weight_progress', { uid: state.session.user.id });
    const goal = goalData?.[0];
    let goalHTML = '';
    const temMeta = Number(state.profile.target_weight || (goal && goal.meta) || 0) > 0;
    if (!temMeta) {
        goalHTML = '';
    } else if (!goal || !goal.peso_atual) {
        goalHTML = `<button class="goal-convite" data-act="m-peso">Registre seu peso pra acompanhar a meta de ${kgTxt(Number(state.profile.target_weight || goal.meta))} kg ›</button>`;
    } else if (goal && goal.peso_inicial && goal.meta) {
        const delta = Number(goal.delta || 0);
        const pct = Math.max(0, Math.min(100, Number(goal.progresso_pct || 0)));
        const deltaClass = delta > 0 ? 'down' : delta < 0 ? 'up' : '';
        const deltaSign = delta > 0 ? '↓ ' : delta < 0 ? '↑ ' : '';
        goalHTML = `<div class="goal-card">
            <div class="goal-card-head">
                <span class="goal-title">Meta de peso</span>
                ${Math.abs(delta) >= 0.1 ? `<span class="goal-delta ${deltaClass}">${deltaSign}${kgTxt(delta)} kg</span>` : ''}
            </div>
            <div class="goal-numbers">
                <div class="goal-num"><span class="v">${kgTxt(Number(goal.peso_inicial))}</span><span class="l">Inicial</span></div>
                <div class="goal-num"><span class="v current">${kgTxt(Number(goal.peso_atual))}</span><span class="l">Atual</span></div>
                <div class="goal-num"><span class="v">${kgTxt(Number(goal.meta))}</span><span class="l">Meta (kg)</span></div>
            </div>
            <div class="goal-track"><div class="goal-fill" style="width:${pct}%"></div></div>
            <div class="goal-pct">${pct}% da meta</div>
        </div>`;
    }

    const gridHTML = state.profileGridHTML = (myPosts || []).map(pp => gridThumb(pp)).join('') || `<div class="grid-empty grid-empty-cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/></svg>
        <b>Crie seu primeiro post</b>
        <span>Uma foto pro feed. Treinos e refeições sem foto ficam no Histórico.</span>
        <button class="btn-primary-sm" data-act="novo-post">Criar</button>
    </div>`;

    const [{ data: diasSem }, { data: rkProf }] = await Promise.all([
        sb.rpc('count_days_current_week', { uid: state.session.user.id }),
        sb.rpc('my_weekly_rank'),
    ]);
    const diasSemana = Number(diasSem || 0);
    const fxProf = rkProf && rkProf[0] ? faixaRanking(rkProf[0].rank, rkProf[0].total) : null;
    const rankTxt = fxProf ? fxProf.curto : '-';
    const metaSemana = state.profile.weekly_goal || 3;
    const metasHTML = await montarCardMetas(goal);

    const meusDestaques = await carregarDestaques(state.session.user.id);
    const { count: myStoryCount } = await sb.from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', state.session.user.id)
        .gt('expires_at', new Date().toISOString());

    c.innerHTML = `
        <div class="view">
            <div class="ig-profile-head">
                <button class="ig-avatar-btn${myStoryCount ? ' has-story' : ''}" data-act="open-user-stories" data-uid="${state.session.user.id}" aria-label="Ver story">${avatarHTML(p, 'lg')}</button>
                <div class="ig-profile-stats">
                    <div class="ig-stat"><span class="v">${postCount || 0}</span><span class="l">Posts</span></div>
                    <div class="ig-stat tappable" data-act="open-follow-list" data-type="followers" data-uid="${state.session.user.id}"><span class="v">${followersCount || 0}</span><span class="l">Seguidores</span></div>
                    <div class="ig-stat tappable" data-act="open-follow-list" data-type="following" data-uid="${state.session.user.id}"><span class="v">${followingCount || 0}</span><span class="l">Seguindo</span></div>
                </div>
            </div>
            <div class="ig-profile-info">
                <div class="ig-name">${escapeHTML(p.display_name)}${seloHTML(p)}</div>
                ${p.bio ? `<div class="ig-bio">${escapeHTML(p.bio)}</div>` : ''}
                ${p.city ? `<div class="ig-loc">📍 ${escapeHTML(p.city)}</div>` : ''}
            </div>
            <div class="ig-profile-actions">
                <button class="btn-secondary flex-1" data-act="go-edit-profile">Editar perfil</button>
                <div class="prof-pill">
                    <div class="weekly-pill">
                        <button class="wp-anel" data-act="go-progress" aria-label="Sua semana"><svg class="wp-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" class="wp-track"/><circle cx="12" cy="12" r="9" class="wp-fill${diasSemana >= metaSemana ? ' done' : ''}" id="wpFill" stroke-dasharray="${(Math.min(1, diasSemana / metaSemana) * 56.55).toFixed(2)} 56.55"/></svg>
                        <span id="wpDays">${diasSemana}/${metaSemana}</span></button>
                        <button class="wp-flame" data-act="ver-ofensiva" aria-label="Sua ofensiva">🔥<b id="wpStreak">${streak?.current_streak || 0}</b></button>
                    </div>
                    <button class="topbar-score" data-act="go-rules" aria-label="Como ganhar pontos">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
                        <span id="topScore">${Math.round(state.score)}</span>
                        <span id="topRank" class="top-rank${rankTxt === '-' ? ' hidden' : ''}">🏆<b id="topRankN">${rankTxt}</b></span>
                    </button>
                </div>
            </div>
            ${destaquesHTML(meusDestaques, state.session.user.id)}
            ${metasHTML}
            <div class="ig-tabs">
                <button class="ig-tab on" data-act="profile-tab" data-tab="posts">Posts</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="workouts" data-uid="${state.session.user.id}">Treinos</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="meals" data-uid="${state.session.user.id}">Refeições</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="depoimentos" data-uid="${state.session.user.id}">Depoimentos</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="badges" data-uid="${state.session.user.id}">Conquistas</button>
            </div>
            <div id="profileTabBody"><div class="ig-grid">${gridHTML}</div></div>
        </div>
    `;

    $('[data-act="go-edit-profile"]').addEventListener('click', () => switchView('edit-profile'));
    if (state.abrirAbaPerfil) {
        const aba = document.querySelector(`.ig-tab[data-tab="${state.abrirAbaPerfil}"]`);
        state.abrirAbaPerfil = null;
        if (aba) aba.click();
    }
}

// ============================================================
// CHAT COM O COACH
// ============================================================
const COACH_SUGGESTIONS = [
    'Como está minha evolução?',
    'Como está minha constância?',
    'Monta um treino pra hoje',
    'O que comer depois do treino?',
    'Tô sem motivação, me ajuda',
];

async function renderCoach() {
    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view coach-view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-messages">←</button>
                <div class="chat-header-user">
                    <span class="conv-coach-avatar" style="width:32px;height:32px;font-size:16px">🤖</span>
                    <span class="chat-header-name">Coach Pulso</span>
                </div>
                <div style="width:28px"></div>
            </div>
            <div id="coachChat" class="coach-chat"><div class="spinner"></div></div>
            <div id="coachSuggestions" class="coach-suggestions"></div>
            <div class="coach-composer">
                <textarea id="coachInput" placeholder="Pergunta o que quiser..." maxlength="500" rows="1"></textarea>
                <button class="mic-btn" id="coachMic" aria-label="Ditar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
                </button>
                <button class="coach-send" id="coachSend" aria-label="Enviar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
            </div>
        </div>
    `;

    const { data: msgs } = await sb.from('ai_messages')
        .select('*')
        .eq('user_id', state.session.user.id)
        .order('created_at', { ascending: true })
        .limit(60);

    state.coachHistory = msgs || [];
    lsSet('pulso-coach-novo-' + state.session.user.id, '');
    paintCoachChat();

    const input = $('#coachInput');
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(120, input.scrollHeight) + 'px';
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachMessage(); }
    });
    $('#coachSend').addEventListener('click', () => sendCoachMessage());
    $('#coachMic').addEventListener('click', () => ditar('coachInput'));
}

function paintCoachChat() {
    const chat = $('#coachChat');
    if (!chat) return;

    if (state.coachHistory.length === 0) {
        chat.innerHTML = `<div class="coach-empty">
            <span class="ce-emo">👋</span>
            <p>Oi! Eu acompanho seus treinos, sua alimentação e sua rotina aqui no app.</p>
            <p class="ce-hint">Pergunta o que quiser, eu respondo olhando os seus números de verdade.</p>
        </div>`;
    } else {
        chat.innerHTML = state.coachHistory.map(m => `
            <div class="cmsg ${m.role}">
                ${m.role === 'coach' ? '<span class="cmsg-avatar">🤖</span>' : ''}
                <div class="cmsg-bubble">${escapeHTML(m.body).replace(/\n/g, '<br>')}</div>
            </div>
        `).join('');
    }

    // Sugestões só quando a conversa está curta
    const sug = $('#coachSuggestions');
    if (sug) {
        sug.innerHTML = state.coachHistory.length < 2
            ? COACH_SUGGESTIONS.map(s => `<button class="sug-chip" data-act="coach-suggest" data-q="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join('')
            : '';
    }

    chat.scrollTop = chat.scrollHeight;
}

async function sendCoachMessage(forced) {
    const { data: quota } = await sb.rpc('ai_quota');
    const q = (quota && quota[0]) || { usadas: 0, limite: 30 };
    if (q.usadas >= q.limite) {
        state.coachHistory.push({ role:'coach', body:`Por hoje chegamos no limite de ${q.limite} mensagens. Amanhã cedo eu tô aqui de novo. Enquanto isso, que tal registrar um treino?` });
        paintCoachChat();
        return;
    }
    const input = $('#coachInput');
    const source = (typeof forced === 'string' && forced) ? forced : input.value;
    const text = String(source || '').trim();
    if (!text) return;

    const btn = $('#coachSend');
    btn.disabled = true;
    if (typeof forced !== 'string') { input.value = ''; input.style.height = 'auto'; }

    // Mostra a mensagem da pessoa na hora
    state.coachHistory.push({ role:'user', body:text });
    paintCoachChat();

    // Bolha de "digitando"
    const chat = $('#coachChat');
    const typing = document.createElement('div');
    typing.className = 'cmsg coach';
    typing.innerHTML = '<span class="cmsg-avatar">🤖</span><div class="cmsg-bubble typing"><span></span><span></span><span></span></div>';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
        const reply = await askCoach(text, state.coachHistory);
        typing.remove();

        state.coachHistory.push({ role:'coach', body:reply });
        paintCoachChat();

        // Persiste as duas mensagens
        await sb.from('ai_messages').insert([
            { user_id: state.session.user.id, role:'user', body:text },
            { user_id: state.session.user.id, role:'coach', body:reply },
        ]);
    } catch (err) {
        typing.remove();
        console.error(err);
        state.coachHistory.push({ role:'coach', body:'Não consegui responder agora. Tenta de novo daqui a pouco.' });
        paintCoachChat();
    } finally {
        btn.disabled = false;
    }
}

// ============================================================
// FICHA DE SAÚDE
// ============================================================
async function renderHealth() {
    const c = $('#viewContainer');
    c.innerHTML = '<div class="view"><div class="spinner"></div></div>';

    const [{ data: hs }, { data: measurements }, { data: goalData }] = await Promise.all([
        sb.rpc('health_summary', { uid: state.session.user.id }),
        sb.from('body_measurements').select('*').eq('user_id', state.session.user.id)
            .order('measured_at', { ascending: false }).limit(20),
        sb.rpc('weight_progress', { uid: state.session.user.id }),
    ]);

    const h = hs?.[0] || {};
    const goal = goalData?.[0] || {};
    const last = measurements?.[0];
    const prev = measurements?.[1];

    // Cor do IMC
    const imcColor = !h.imc ? 'var(--ink-dim)'
        : h.imc < 18.5 ? 'var(--info)'
        : h.imc < 25 ? 'var(--vital)'
        : h.imc < 30 ? 'var(--gold)'
        : 'var(--effort)';

    // Delta de medidas
    function delta(field) {
        if (!last || !prev || last[field] == null || prev[field] == null) return '';
        const d = Number(last[field]) - Number(prev[field]);
        if (Math.abs(d) < 0.05) return '<span class="m-delta same">-</span>';
        const cls = d < 0 ? 'down' : 'up';
        return `<span class="m-delta ${cls}">${d < 0 ? '▼' : '▲'} ${br(Math.abs(d))}</span>`;
    }
    function mRow(label, field, unit = 'cm') {
        const v = last?.[field];
        return `<div class="m-row">
            <span class="m-label">${label}</span>
            <span class="m-value">${v != null ? br(v) + ' ' + unit : '-'}</span>
            ${delta(field)}
        </div>`;
    }

    const histHTML = (measurements || []).length > 1
        ? measurements.slice(0, 10).map(m => {
            const d = new Date(m.measured_at + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
            const parts = [];
            if (m.cintura) parts.push(`cintura ${m.cintura}`);
            if (m.quadril) parts.push(`quadril ${m.quadril}`);
            if (m.braco) parts.push(`braço ${m.braco}`);
            if (m.coxa) parts.push(`coxa ${m.coxa}`);
            return `<div class="hist-row">
                <span class="hist-date">${d}</span>
                <span class="hist-detail">${parts.join(' · ') || 'sem dados'}</span>
                <button class="hist-del" data-act="delete-measurement" data-id="${m.id}" aria-label="Apagar">${ICONE_LIXO}</button>
            </div>`;
        }).join('')
        : '<div class="log-empty" style="padding:24px">Registre suas medidas para acompanhar a evolução.</div>';

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-profile">←</button>
                <div class="topbar-title">Ficha de Saúde</div>
                <div style="width:28px"></div>
            </div>

            <!-- IMC -->
            <div class="health-card imc-card">
                <div class="health-card-head"><span class="hc-title">IMC</span>
                    ${h.ultima_medida_em ? `<span class="hc-date">Medido em ${new Date(h.ultima_medida_em + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : ''}
                </div>
                <div class="imc-display">
                    <span class="imc-num" style="color:${imcColor}">${h.imc ? br(h.imc) : '-'}</span>
                    <span class="imc-class" style="color:${imcColor}">${h.imc_classe || 'Preencha altura e peso'}</span>
                </div>
                <div class="imc-scale">
                    <div class="imc-seg" style="background:var(--info)" title="Abaixo"></div>
                    <div class="imc-seg" style="background:var(--vital)" title="Normal"></div>
                    <div class="imc-seg" style="background:var(--gold)" title="Sobrepeso"></div>
                    <div class="imc-seg" style="background:var(--effort)" title="Obesidade"></div>
                    ${h.imc ? `<div class="imc-marker" style="left:${Math.min(97, Math.max(1, ((Number(h.imc) - 15) / 25) * 100))}%"></div>` : ''}
                </div>
                <div class="imc-legend"><span>&lt;18,5</span><span>18,5-25</span><span>25-30</span><span>30+</span></div>
                <div class="health-meta">
                    <span>Altura: <b>${h.altura ? br(h.altura, 2) + ' m' : '-'}</b></span>
                    <span>Peso: <b>${h.peso_atual ? br(h.peso_atual) + ' kg' : '-'}</b></span>
                </div>
            </div>

            <!-- RCQ (relação cintura-quadril) -->
            ${h.rcq ? `<div class="health-card">
                <div class="health-card-head"><span class="hc-title">Relação Cintura-Quadril</span></div>
                <div class="rcq-display">
                    <span class="rcq-num">${Number(h.rcq).toFixed(2)}</span>
                    <span class="rcq-hint">${Number(h.rcq) < 0.85 ? 'Risco baixo' : Number(h.rcq) < 0.95 ? 'Risco moderado' : 'Risco elevado'}</span>
                </div>
            </div>` : ''}

            <!-- Dados do corpo -->
            <div class="health-card">
                <div class="health-card-head">
                    <span class="hc-title">Dados do corpo</span>
                    <button class="btn-mini" data-act="open-body-data">Editar</button>
                </div>
                <div class="measures-grid">
                    <div class="m-row"><span class="m-label">Altura</span><span class="m-value">${state.profile.altura ? br(state.profile.altura, 2) + ' m' : '-'}</span></div>
                    <div class="m-row"><span class="m-label">Sexo</span><span class="m-value">${state.profile.sexo === 'M' ? 'Masculino' : state.profile.sexo === 'F' ? 'Feminino' : '-'}</span></div>
                    <div class="m-row"><span class="m-label">Nascimento</span><span class="m-value">${state.profile.birth_date ? new Date(String(state.profile.birth_date).split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span></div>
                    <div class="m-row"><span class="m-label">Peso inicial</span><span class="m-value">${state.profile.peso_inicial ? br(state.profile.peso_inicial) + ' kg' : '-'}</span></div>
                    <div class="m-row"><span class="m-label">Meta de peso</span><span class="m-value">${state.profile.target_weight ? br(state.profile.target_weight) + ' kg' : '-'}</span></div>
                </div>
            </div>

            <!-- Medidas atuais -->
            <div class="health-card">
                <div class="health-card-head">
                    <span class="hc-title">Medidas corporais</span>
                    <button class="btn-mini" data-act="open-measure">+ Registrar</button>
                </div>
                ${last ? `
                    <div class="measures-grid">
                        ${mRow('Cintura', 'cintura')}
                        ${mRow('Quadril', 'quadril')}
                        ${mRow('Peito', 'peito')}
                        ${mRow('Braço', 'braco')}
                        ${mRow('Coxa', 'coxa')}
                        ${mRow('Panturrilha', 'panturrilha')}
                        ${mRow('Gordura', 'gordura_pct', '%')}
                    </div>
                ` : '<div class="log-empty" style="padding:20px">Nenhuma medida registrada ainda.</div>'}
            </div>

            <!-- Histórico -->
            <div class="health-card">
                <div class="health-card-head"><span class="hc-title">Histórico de medidas</span></div>
                <div class="hist-list">${histHTML}</div>
            </div>

            <!-- Histórico familiar e condições -->
            <div class="health-card">
                <div class="health-card-head">
                    <span class="hc-title">Histórico de saúde</span>
                    <button class="btn-mini" data-act="open-family">Editar</button>
                </div>
                ${renderHealthInfo()}
            </div>
        </div>
    `;
}

const FAMILY_CONDITIONS = [
    { id:'diabetes',    label:'Diabetes',        emo:'🩸' },
    { id:'hipertensao', label:'Hipertensão',     emo:'💗' },
    { id:'cardiopatia', label:'Doença cardíaca', emo:'❤️' },
    { id:'obesidade',   label:'Obesidade',       emo:'⚖️' },
    { id:'colesterol',  label:'Colesterol alto', emo:'🧈' },
    { id:'tireoide',    label:'Tireoide',        emo:'🦋' },
    { id:'cancer',      label:'Câncer',          emo:'🎗️' },
    { id:'avc',         label:'AVC',             emo:'🧠' },
];

function renderHealthInfo() {
    const p = state.profile;
    const fam = Array.isArray(p.family_history) ? p.family_history : [];
    const cond = Array.isArray(p.conditions) ? p.conditions : [];

    const chip = (id) => {
        const item = FAMILY_CONDITIONS.find(f => f.id === id);
        return item ? `<span class="health-chip">${item.emo} ${item.label}</span>` : `<span class="health-chip">${escapeHTML(id)}</span>`;
    };

    let html = '';

    html += `<div class="health-info-block">
        <div class="hi-label">Na família</div>
        <div class="hi-chips">${fam.length ? fam.map(chip).join('') : '<span class="hi-empty">Nada informado</span>'}</div>
    </div>`;

    html += `<div class="health-info-block">
        <div class="hi-label">Comigo</div>
        <div class="hi-chips">${cond.length ? cond.map(chip).join('') : '<span class="hi-empty">Nada informado</span>'}</div>
    </div>`;

    if (p.blood_type) html += `<div class="health-info-block"><div class="hi-label">Tipo sanguíneo</div><div class="hi-text">${escapeHTML(p.blood_type)}</div></div>`;
    if (p.allergies) html += `<div class="health-info-block"><div class="hi-label">Alergias</div><div class="hi-text">${escapeHTML(p.allergies)}</div></div>`;
    if (p.medications) html += `<div class="health-info-block"><div class="hi-label">Medicações em uso</div><div class="hi-text">${escapeHTML(p.medications)}</div></div>`;
    if (p.emergency_contact) html += `<div class="health-info-block"><div class="hi-label">Contato de emergência</div><div class="hi-text">${escapeHTML(p.emergency_contact)}</div></div>`;

    html += `<p class="hi-note">🔒 Essas informações são privadas. Ninguém além de você vê.</p>`;
    return html;
}

function openFamilySheet() {
    const p = state.profile;
    const fam = Array.isArray(p.family_history) ? p.family_history : [];
    const cond = Array.isArray(p.conditions) ? p.conditions : [];

    let sheet = document.getElementById('familySheet');
    if (sheet) sheet.remove();

    sheet = document.createElement('div');
    sheet.id = 'familySheet';
    sheet.className = 'sheet';
    sheet.innerHTML = `
        <div class="sheet-card">
            <div class="sheet-handle"></div>
            <h3 class="sheet-title">Histórico de saúde</h3>
            <p class="sheet-sub">Privado. Ajuda o coach a dar conselhos melhores.</p>

            <div class="field">
                <label>Casos na família (pais, irmãos, avós)</label>
                <div class="cond-grid" id="famGrid">
                    ${FAMILY_CONDITIONS.map(f => `
                        <button type="button" class="cond-btn ${fam.includes(f.id)?'on':''}" data-group="fam" data-id="${f.id}">
                            <span class="cond-emo">${f.emo}</span><span>${f.label}</span>
                        </button>`).join('')}
                </div>
            </div>

            <div class="field">
                <label>Condições que eu tenho</label>
                <div class="cond-grid" id="condGrid">
                    ${FAMILY_CONDITIONS.map(f => `
                        <button type="button" class="cond-btn ${cond.includes(f.id)?'on':''}" data-group="cond" data-id="${f.id}">
                            <span class="cond-emo">${f.emo}</span><span>${f.label}</span>
                        </button>`).join('')}
                </div>
            </div>

            <div class="field">
                <label>Tipo sanguíneo</label>
                <select id="hsBlood">
                    <option value="">-</option>
                    ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => `<option value="${b}" ${p.blood_type===b?'selected':''}>${b}</option>`).join('')}
                </select>
            </div>

            <div class="field">
                <label>Alergias</label>
                <input type="text" id="hsAllergies" value="${escapeHTML(p.allergies || '')}" placeholder="ex: amendoim, dipirona" maxlength="200">
            </div>

            <div class="field">
                <label>Medicações em uso</label>
                <input type="text" id="hsMeds" value="${escapeHTML(p.medications || '')}" placeholder="ex: losartana 50mg" maxlength="200">
            </div>

            <div class="field">
                <label>Contato de emergência</label>
                <input type="text" id="hsEmergency" value="${escapeHTML(p.emergency_contact || '')}" placeholder="ex: Maria (81) 99999-0000" maxlength="120">
            </div>

            <div class="sheet-footer">
                <button class="btn-ghost" id="familyCancel">Cancelar</button>
                <button class="btn-primary" id="familySave">Salvar</button>
            </div>
        </div>
    `;
    document.body.appendChild(sheet);
    sheet.classList.add('on');
    document.body.style.overflow = 'hidden';

    sheet.onclick = e => { if (e.target === sheet) closeFamilySheet(); };
    document.getElementById('familyCancel').onclick = closeFamilySheet;

    // Toggle dos chips
    sheet.querySelectorAll('.cond-btn').forEach(b => b.addEventListener('click', e => {
        e.currentTarget.classList.toggle('on');
    }));

    document.getElementById('familySave').onclick = async () => {
        const btn = document.getElementById('familySave');
        btn.disabled = true; btn.textContent = 'Salvando...';

        const collect = group => [...sheet.querySelectorAll(`.cond-btn[data-group="${group}"].on`)].map(b => b.dataset.id);
        const updates = {
            family_history: collect('fam'),
            conditions: collect('cond'),
            blood_type: document.getElementById('hsBlood').value || null,
            allergies: document.getElementById('hsAllergies').value.trim() || null,
            medications: document.getElementById('hsMeds').value.trim() || null,
            emergency_contact: document.getElementById('hsEmergency').value.trim() || null,
        };

        const { error } = await sb.from('profiles').update(updates).eq('id', state.session.user.id);
        btn.disabled = false; btn.textContent = 'Salvar';
        if (error) { toast('Erro: ' + error.message, 'err'); return; }

        Object.assign(state.profile, updates);
        closeFamilySheet();
        toast('Histórico atualizado!', 'ok');
        if (state.view === 'health') await renderHealth();
    };
}

function closeFamilySheet() {
    const s = document.getElementById('familySheet');
    if (s) s.classList.remove('on');
    document.body.style.overflow = '';
}

function openBodyDataSheet() {
    const p = state.profile;
    const old = document.getElementById('bodySheet');
    if (old) old.remove();
    const hoje = new Date().toISOString().split('T')[0];

    const sheet = document.createElement('div');
    sheet.id = 'bodySheet';
    sheet.className = 'sheet on';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Dados do corpo</h3>
        <p class="sheet-sub">Privado. Usado pra calcular IMC, meta de água e a análise da IA.</p>

        <div class="field-row">
            <div class="field"><label>Altura (m)</label>
                <div class="stepper" data-target="bdAltura" data-min="1.20" data-max="2.30" data-step="0.01" data-default="1.70">
                    <button type="button" class="step-btn" data-dir="-">−</button>
                    <input type="number" id="bdAltura" step="0.01" value="${p.altura || ''}" inputmode="decimal">
                    <button type="button" class="step-btn" data-dir="+">+</button>
                </div>
            </div>
            <div class="field"><label>Sexo</label>
                <select id="bdSexo">
                    <option value="" disabled hidden ${!p.sexo ? 'selected' : ''}>Selecione</option>
                    <option value="M" ${p.sexo === 'M' ? 'selected' : ''}>Masculino</option>
                    <option value="F" ${p.sexo === 'F' ? 'selected' : ''}>Feminino</option>
                </select>
            </div>
        </div>

        <div class="field"><label>Data de nascimento</label>
            <input type="date" id="bdBirth" value="${p.birth_date ? String(p.birth_date).split('T')[0] : ''}" max="${hoje}">
            <p class="field-hint">Não aparece pra ninguém. Usamos só para deixar as análises da IA mais precisas.</p>
        </div>

        <div class="field-row">
            <div class="field"><label>Peso inicial (kg)</label>
                <div class="stepper" data-target="bdPesoIni" data-min="30" data-max="250" data-step="0.5" data-default="75">
                    <button type="button" class="step-btn" data-dir="-">−</button>
                    <input type="number" id="bdPesoIni" step="0.5" value="${p.peso_inicial || ''}" inputmode="decimal">
                    <button type="button" class="step-btn" data-dir="+">+</button>
                </div>
            </div>
            <div class="field"><label>Meta de peso (kg)</label>
                <div class="stepper" data-target="bdMeta" data-min="30" data-max="250" data-step="0.5" data-default="70">
                    <button type="button" class="step-btn" data-dir="-">−</button>
                    <input type="number" id="bdMeta" step="0.5" value="${p.target_weight || ''}" inputmode="decimal">
                    <button type="button" class="step-btn" data-dir="+">+</button>
                </div>
            </div>
        </div>

        <div class="sheet-footer">
            <button class="btn-ghost" id="bdCancel">Cancelar</button>
            <button class="btn-primary" id="bdSave">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    const close = () => { sheet.remove(); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('bdCancel').onclick = close;

    // Peso inicial trava durante desafio
    sb.rpc('in_active_challenge').then(({ data: emDesafio }) => {
        if (!emDesafio) return;
        const pi = document.getElementById('bdPesoIni');
        if (!pi) return;
        pi.readOnly = true;
        const st = pi.closest('.stepper');
        if (st) {
            st.querySelectorAll('.step-btn').forEach(b => b.disabled = true);
            st.addEventListener('click', () => toast('O peso inicial fica travado durante um desafio, pra ninguém mudar a base do cálculo no meio do jogo.', 'err'));
        }
    });

    document.getElementById('bdSave').onclick = async () => {
        const btn = document.getElementById('bdSave');
        btn.disabled = true; btn.textContent = 'Salvando...';

        // aceita 1.69 e 169
        let altura = parseFloat(document.getElementById('bdAltura').value) || null;
        if (altura && altura > 3) altura = altura / 100;
        if (altura && (altura < 1.2 || altura > 2.3)) {
            toast('Altura fora do esperado. Use metros, como 1.70.', 'err');
            btn.disabled = false; btn.textContent = 'Salvar'; return;
        }

        const up = {
            altura,
            sexo: document.getElementById('bdSexo').value || null,
            birth_date: document.getElementById('bdBirth').value || null,
            target_weight: parseFloat(document.getElementById('bdMeta').value) || null,
        };
        const pesoIni = parseFloat(document.getElementById('bdPesoIni').value) || null;
        if (!document.getElementById('bdPesoIni').readOnly) up.peso_inicial = pesoIni;

        const { error } = await sb.from('profiles').update(up).eq('id', state.session.user.id);
        btn.disabled = false; btn.textContent = 'Salvar';
        if (error) { toast(msgErro(error), 'err'); return; }

        Object.assign(state.profile, up);

        // Se é o primeiro peso informado, já vira a primeira pesagem
        if (up.peso_inicial) {
            const { count } = await sb.from('posts').select('*', { count: 'exact', head: true })
                .eq('user_id', state.session.user.id).eq('kind', 'weight');
            if (!count) {
                await sb.from('posts').insert({
                    user_id: state.session.user.id, kind: 'weight', weight_kg: up.peso_inicial,
                    visibility: 'private', is_public: false, in_feed: false,
                });
            }
        }

        close();
        toast('Dados atualizados', 'ok');
        if (state.view === 'health') renderHealth();
    };
}

// Sheet dedicado para registrar peso - sempre privado, nunca vai pro feed
function openWeightLogSheet() {
    let sheet = document.getElementById('weightLogSheet');
    if (sheet) sheet.remove();

    sheet = document.createElement('div');
    sheet.id = 'weightLogSheet';
    sheet.className = 'sheet';
    sheet.innerHTML = `
        <div class="sheet-card">
            <div class="sheet-handle"></div>
            <div class="peso-topo">
                <button type="button" class="peso-voltar" id="weightLogCancel" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                <h3 class="sheet-title" style="margin:0">Peso</h3>
            </div>
            <p class="peso-priv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>Só você vê. Nunca aparece no feed.</p>
            <input type="number" id="wlKg" step="0.1" min="30" max="250" hidden>
            <div class="tr-dur-linha peso-contador">
                <button type="button" class="tr-dur-btn" data-kg="-0.1" aria-label="Menos 100 gramas">−</button>
                <div class="tr-dur-num"><span id="wlKgBig">–</span><small>kg</small></div>
                <button type="button" class="tr-dur-btn" data-kg="0.1" aria-label="Mais 100 gramas">+</button>
            </div>
            <div class="peso-foto-linha">
                <label class="cap-foto peso-foto" aria-label="Foto da balança">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
                    <img id="wlPhotoPreview" alt="">
                    <input type="file" id="wlPhotoGal" accept="image/*" hidden>
                    <input type="file" id="wlPhotoCam" accept="image/*" hidden>
                </label>
                <div><span>Foto da balança</span><small>Opcional, só pra seu controle</small></div>
                <button type="button" class="btn-mini hidden" id="lerBalancaBtn">Ler da balança</button>
            </div>
            <button class="btn-primary peso-salvar" id="weightLogSave">Salvar peso</button>
        </div>
    `;
    document.body.appendChild(sheet);
    sheet.classList.add('on');
    document.body.style.overflow = 'hidden';

    let photoFile = null;
    function handlePick(e) {
        const file = e.target.files[0];
        if (!file) return;
        photoFile = file;
        document.getElementById('wlPhotoPreview').src = URL.createObjectURL(file);
        document.getElementById('wlPhotoPreview').closest('.peso-foto').classList.add('com-foto');
        document.getElementById('lerBalancaBtn').classList.remove('hidden');
    }

    document.getElementById('lerBalancaBtn').onclick = async () => {
        const b = document.getElementById('lerBalancaBtn');
        if (!photoFile) return;
        b.disabled = true; b.textContent = 'Lendo o visor...';
        try {
            const b64 = await imagemJpegParaIA(photoFile);
            const { data, error } = await sb.functions.invoke('vision-tools', {
                body: { task: 'scale', imageBase64: b64, mimeType: 'image/jpeg' },
            });
            if (error) { console.warn('vision-tools scale erro', error); throw error; }
            const lido = numeroDaIA(data && (data.weight_kg ?? data.weight ?? data.peso));
            if (!(lido >= 20 && lido <= 300)) { console.warn('vision-tools scale resposta', data); throw new Error('sem leitura'); }

            const { data: ultimo } = await sb.from('posts')
                .select('weight_kg').eq('user_id', state.session.user.id).eq('kind', 'weight')
                .not('weight_kg', 'is', null).order('created_at', { ascending: false }).limit(1);
            const anterior = ultimo && ultimo[0] ? Number(ultimo[0].weight_kg) : null;

            if (anterior && Math.abs(lido - anterior) > 10) {
                if (!(await confirmar(`Li ${lido} kg, mas sua última pesagem foi ${anterior} kg. Está certo?`))) {
                    b.disabled = false; b.textContent = 'Ler da balança'; return;
                }
            }
            document.getElementById('wlKg').value = lido;
            document.getElementById('wlKg').dispatchEvent(new Event('input'));
            toast(`Li ${String(lido).replace('.', ',')} kg. Confira e salve.`, 'ok');
        } catch (e) {
            toast('Não consegui ler o visor. Digite o peso na mão.', 'err');
        } finally {
            b.disabled = false; b.textContent = 'Ler da balança';
        }
    };
    document.getElementById('wlPhotoCam').addEventListener('change', handlePick);
    document.getElementById('wlPhotoGal').addEventListener('change', handlePick);

    const close = () => { sheet.classList.remove('on'); document.body.style.overflow = ''; };
    sheet.onclick = e => { if (e.target === sheet) close(); };
    document.getElementById('weightLogCancel').onclick = close;
    // contador do peso: começa no último peso registrado
    const kgCampo = document.getElementById('wlKg'), kgBig = document.getElementById('wlKgBig');
    const mostrarKg = () => { const v = parseFloat(kgCampo.value); kgBig.textContent = v > 0 ? v.toFixed(1).replace('.', ',') : '–'; };
    sheet.querySelectorAll('[data-kg]').forEach(b => b.onclick = () => {
        let v = parseFloat(kgCampo.value);
        if (!(v > 0)) v = Number(state.profile.peso_inicial) || 70;
        v = Math.max(25, Math.min(300, Math.round((v + Number(b.dataset.kg)) * 10) / 10));
        kgCampo.value = v; mostrarKg();
    });
    sb.from('posts').select('weight_kg').eq('user_id', state.session.user.id).eq('kind', 'weight')
        .not('weight_kg', 'is', null).order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => {
            const ult = data && data[0] ? Number(data[0].weight_kg) : Number(state.profile.peso_inicial) || 70;
            if (!kgCampo.value) kgCampo.value = ult;
            mostrarKg();
        });
    kgCampo.addEventListener('input', mostrarKg);

    document.getElementById('weightLogSave').onclick = async () => {
        const btn = document.getElementById('weightLogSave');
        const kg = parseFloat(document.getElementById('wlKg').value);
        if (!kg || kg < 25 || kg > 300) { toast('Esse peso não parece certo. Confira e tente de novo (entre 25 e 300 kg).', 'err'); return; }

        btn.disabled = true; btn.textContent = 'Salvando...';
        try {
            let imageUrl = null;
            if (photoFile) {
                try { imageUrl = await uploadImagemPrivada(photoFile); } catch (e) { console.warn(e); }
            }

            const { data: created, error } = await sb.from('posts').insert({
                user_id: state.session.user.id,
                kind: 'weight',
                weight_kg: kg,
                image_url: imageUrl,
                visibility: 'private',
                is_public: false,
            }).select().single();
            if (error) throw error;

            const today = new Date().toISOString().split('T')[0];
            const streakInfo = await updateStreak(today);
            const { data: wl } = await sb.rpc('credit_weight_loss');
            const wlPts = Number((wl && wl[0] && wl[0].pts) || 0);
            const { data: basePts } = await sb.rpc('points_for_reference', { ref: created.id });
            await loadScore();

            close();
            let msg = `+${Number(basePts || 0)} pontos! Peso registrado`;
            if (streakInfo?.shield_used) msg += ' · escudo usado 🛡️';
            if (wlPts > 0) msg = `+${3 + wlPts} pontos! Você chegou a ${wl[0].pct}% do peso inicial perdido 🎉`;
            if (streakInfo?.streak_bonus > 0) msg += ` · +${streakInfo.streak_bonus} bônus ofensiva 🔥`;
            toast(msg, 'ok');
            if (state.view === 'health') await renderHealth();
            if (state.view === 'progress') await renderProgress();
        } catch (err) {
            toast('Erro: ' + err.message, 'err');
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    };
}
function openMeasureSheet() {
    let sheet = document.getElementById('measureSheet');
    if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'measureSheet';
        sheet.className = 'sheet';
        sheet.innerHTML = `
            <div class="sheet-card">
                <div class="sheet-handle"></div>
                <h3 class="sheet-title">Registrar medidas</h3>
                <p class="sheet-sub">Preencha só o que quiser. Todos os campos são opcionais.</p>

                <div class="field">
                    <label>Data da medição</label>
                    <input type="date" id="msDate">
                </div>

                <div class="field-row">
                    <div class="field"><label>Cintura (cm)</label>
                        <div class="stepper" data-target="msCintura" data-min="40" data-max="200" data-step="0.5" data-default="85">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msCintura" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                    <div class="field"><label>Quadril (cm)</label>
                        <div class="stepper" data-target="msQuadril" data-min="40" data-max="200" data-step="0.5" data-default="98">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msQuadril" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                </div>

                <div class="field-row">
                    <div class="field"><label>Peito (cm)</label>
                        <div class="stepper" data-target="msPeito" data-min="40" data-max="200" data-step="0.5" data-default="95">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msPeito" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                    <div class="field"><label>Braço (cm)</label>
                        <div class="stepper" data-target="msBraco" data-min="15" data-max="80" data-step="0.5" data-default="32">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msBraco" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                </div>

                <div class="field-row">
                    <div class="field"><label>Coxa (cm)</label>
                        <div class="stepper" data-target="msCoxa" data-min="25" data-max="100" data-step="0.5" data-default="55">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msCoxa" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                    <div class="field"><label>Panturrilha (cm)</label>
                        <div class="stepper" data-target="msPantu" data-min="20" data-max="70" data-step="0.5" data-default="37">
                            <button type="button" class="step-btn" data-dir="-">−</button>
                            <input type="number" id="msPantu" step="0.5" inputmode="decimal">
                            <button type="button" class="step-btn" data-dir="+">+</button>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label>Gordura corporal (%) - opcional</label>
                    <div class="stepper" data-target="msGordura" data-min="3" data-max="60" data-step="0.5" data-default="20">
                        <button type="button" class="step-btn" data-dir="-">−</button>
                        <input type="number" id="msGordura" step="0.5" inputmode="decimal">
                        <button type="button" class="step-btn" data-dir="+">+</button>
                    </div>
                </div>

                <div class="sheet-footer">
                    <button class="btn-ghost" id="measureCancel">Cancelar</button>
                    <button class="btn-primary" id="measureSave">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(sheet);
    }

    sheet.classList.add('on');
    document.body.style.overflow = 'hidden';
    document.getElementById('msDate').value = new Date().toISOString().split('T')[0];

    sheet.onclick = e => { if (e.target === sheet) closeMeasureSheet(); };
    document.getElementById('measureCancel').onclick = closeMeasureSheet;

    document.getElementById('measureSave').onclick = async () => {
        const btn = document.getElementById('measureSave');
        btn.disabled = true; btn.textContent = 'Salvando...';

        const num = id => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };
        const row = {
            user_id: state.session.user.id,
            measured_at: document.getElementById('msDate').value || new Date().toISOString().split('T')[0],
            cintura: num('msCintura'),
            quadril: num('msQuadril'),
            peito: num('msPeito'),
            braco: num('msBraco'),
            coxa: num('msCoxa'),
            panturrilha: num('msPantu'),
            gordura_pct: num('msGordura'),
        };

        const hasAny = ['cintura','quadril','peito','braco','coxa','panturrilha','gordura_pct'].some(k => row[k] != null);
        if (!hasAny) {
            toast('Preencha pelo menos uma medida', 'err');
            btn.disabled = false; btn.textContent = 'Salvar';
            return;
        }

        const { error } = await sb.from('body_measurements').upsert(row, { onConflict: 'user_id,measured_at' });
        btn.disabled = false; btn.textContent = 'Salvar';
        if (error) { toast('Erro: ' + error.message, 'err'); return; }

        closeMeasureSheet();
        toast('Medidas registradas!', 'ok');
        if (state.view === 'health') await renderHealth();
    };
}

function closeMeasureSheet() {
    const s = document.getElementById('measureSheet');
    if (s) s.classList.remove('on');
    document.body.style.overflow = '';
}

// Resultado da análise do prato pela IA
function showMealResult(an, pts, limitReached) {
    const cor = an.score >= 8 ? 'var(--vital)' : an.score >= 5 ? 'var(--gold)' : 'var(--effort)';
    let overlay = document.getElementById('mealResult');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'mealResult';
    overlay.className = 'sheet on';
    overlay.innerHTML = `
        <div class="sheet-card meal-result-card">
            <div class="sheet-handle"></div>
            <div class="mr-score-ring" style="--c:${cor}; --pct:${Number(an.score) * 10}">
                <span class="mr-score" style="color:${cor}">${Number(an.score).toFixed(1)}</span>
                <span class="mr-max">/10</span>
            </div>
            <p class="mr-analysis">${escapeHTML(an.analysis || '')}</p>
            ${an.items && an.items.length ? `<div class="mr-items">${an.items.map(i => `<span class="mr-item">${escapeHTML(i)}</span>`).join('')}</div>` : ''}
            ${limitReached
                ? `<div class="mr-limit-note">Você já registrou essa refeição hoje, então essa não somou pontos. A análise continua sendo sua.</div>`
                : `<div class="mr-points">+${pts} ${pts === 1 ? 'ponto' : 'pontos'}</div>`}
            <button class="btn-primary" id="mealResultClose">Fechar</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => { overlay.remove(); document.body.style.overflow = ''; };
    overlay.onclick = e => { if (e.target === overlay) close(); };
    document.getElementById('mealResultClose').onclick = close;
}

// ============================================================
// HISTÓRICO DE ATIVIDADES
// ============================================================
async function renderActivityLog() {
    const c = $('#viewContainer');
    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back-profile">←</button>
                <div class="topbar-title">Histórico</div>
                <div style="width:28px"></div>
            </div>
            <div class="log-filters">
                <button class="log-filter on" data-filter="all">Tudo</button>
                <button class="log-filter" data-filter="workout">Treinos</button>
                <button class="log-filter" data-filter="meal">Refeições</button>
                <button class="log-filter" data-filter="weight">Pesagens</button>
                <button class="log-filter" data-filter="water">Água</button>
                <button class="log-filter" data-filter="text">Textos</button>
            </div>
            <div id="logList"><div class="spinner"></div></div>
        </div>
    `;

    async function loadLog(filter) {
        const list = $('#logList');
        list.innerHTML = '<div class="spinner"></div>';
        let q = sb.from('posts')
            .select('id, kind, caption, image_url, activity_type, duration_min, meal_slot, weight_kg, water_ml, created_at, visibility')
            .eq('user_id', state.session.user.id)
            .order('created_at', { ascending: false })
            .limit(100);
        // em "Tudo" a água fica de fora (são muitos registros por dia); ela tem o filtro próprio
        if (filter === 'all') q = q.neq('kind', 'water');
        else q = q.eq('kind', filter);

        const { data: posts, error } = await q;
        if (error) { list.innerHTML = `<p style="color:var(--danger)">Erro: ${error.message}</p>`; return; }
        if (!posts || posts.length === 0) {
            list.innerHTML = `<div class="grid-empty grid-empty-cta">${icon('historico')}<b>Nada registrado aqui ainda</b><span>Toque no + embaixo pra registrar um treino, refeição, água, sono ou peso.</span></div>`;
            return;
        }

        // Agrupa por dia
        // guarda o peso anterior de cada pesagem, pra mostrar a direção
        state.pesoAnterior = {};
        const pesagens = posts.filter(p => p.kind === 'weight' && p.weight_kg != null)
            .slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        pesagens.forEach((p, i) => { if (i > 0) state.pesoAnterior[p.id] = pesagens[i - 1].weight_kg; });

        const byDay = {};
        posts.forEach(p => {
            const d = new Date(p.created_at);
            const hojeD = new Date(); hojeD.setHours(0,0,0,0);
            const diaD = new Date(d); diaD.setHours(0,0,0,0);
            const difDias = Math.round((hojeD - diaD) / 86400000);
            const key = difDias === 0 ? 'Hoje'
                : difDias === 1 ? 'Ontem'
                : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
            if (!byDay[key]) byDay[key] = [];
            byDay[key].push(p);
        });

        list.innerHTML = Object.entries(byDay).map(([day, items]) => {
            // Água do dia vira uma linha só, senão a lista fica cheia de copos
            const rowsHTML = items.map(p => renderLogItem(p)).join('');
            return `<div class="log-day"><h4 class="log-day-title">${day}</h4>${rowsHTML}</div>`;
        }).join('');
    }

    function renderLogItem(p) {
        const t = new Date(p.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
        let emo = '📝', title = '', sub = '';
        if (p.kind === 'workout') {
            emo = '💪'; title = p.activity_type || 'Treino'; sub = `${p.duration_min || 0} min`;
        } else if (p.kind === 'meal') {
            emo = '🍽️'; title = { cafe:'Café da manhã', almoco:'Almoço', jantar:'Jantar', lanche:'Lanche' }[p.meal_slot] || 'Refeição';
            sub = p.image_url ? 'com foto' : 'sem foto';
        } else if (p.kind === 'weight') {
            emo = '⚖️'; title = 'Pesagem';
            const anterior = state.pesoAnterior && state.pesoAnterior[p.id];
            if (anterior != null) {
                const d = Number(p.weight_kg) - Number(anterior);
                const seta = Math.abs(d) < 0.05 ? '=' : (d > 0 ? '↑' : '↓');
                sub = `${br(p.weight_kg)} kg <span class="peso-delta">${seta} ${br(Math.abs(d))} kg</span>`;
            } else {
                sub = `${p.weight_kg} kg`;
            }
        } else if (p.kind === 'water') {
            emo = '💧'; title = 'Água'; sub = `${p.water_ml} ml`;
        } else if (p.kind === 'text') {
            emo = '✍️'; title = 'Texto'; sub = (p.caption||'').slice(0,60);
        }
        const privacyIcon = ICONE_VIS[p.visibility || 'public'] || ICONE_VIS.public;
        return `<div class="log-item">
            <span class="log-emo">${emo}</span>
            <div class="log-body">
                <div class="log-title">${escapeHTML(title)}</div>
                <div class="log-sub">${sub}${p.caption && p.kind !== 'text' ? ' · ' + escapeHTML(p.caption.slice(0,50)) : ''}</div>
            </div>
            <div class="log-meta">
                <div class="log-time">${t}</div>
                <div class="log-priv">${privacyIcon}</div>
                ${p.kind !== 'water' || isoDe(new Date(p.created_at)) === hojeISO() ? `<button class="log-del" data-act="delete-post" data-id="${p.id}" title="Apagar" aria-label="Apagar">${ICONE_LIXO}</button>` : ''}
            </div>
        </div>`;
    }

    // Filter clicks
    document.querySelectorAll('.log-filter').forEach(b => b.addEventListener('click', e => {
        document.querySelectorAll('.log-filter').forEach(x => x.classList.toggle('on', x === e.currentTarget));
        loadLog(e.currentTarget.dataset.filter);
    }));

    loadLog('all');
}

async function renderUserProfile(uid) {
    sincronizarModoTela();
    const c = $('#viewContainer');
    c.innerHTML = esqueleto('perfil');

    const { data: p, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error || !p) {
        c.innerHTML = '<div class="view"><p style="color:var(--danger)">Usuário não encontrado.</p></div>';
        return;
    }

    const isMe = uid === state.session.user.id;
    if (isMe) { switchView('profile'); return; }

    const [{ count: postCount }, followersRes, followingRes, iFollowRes, streakRes, postsRes] = await Promise.all([
        sb.from('posts').select('*', {count:'exact', head:true}).eq('user_id', uid).neq('kind', 'weight').not('image_url', 'is', null).eq('in_feed', true),
        sb.from('follows').select('*', {count:'exact', head:true}).eq('following_id', uid),
        sb.from('follows').select('*', {count:'exact', head:true}).eq('follower_id', uid),
        sb.rpc('am_i_following', { target_id: uid }),
        sb.from('daily_streaks').select('*').eq('user_id', uid).maybeSingle(),
        sb.from('posts').select('id, image_url, thumb_url, kind, caption, created_at, activity_type, duration_min, meal_slot, pinned_at')
            .eq('user_id', uid).neq('kind', 'weight').not('image_url', 'is', null).eq('in_feed', true).eq('archived', false)
            .order('pinned_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(30),
    ]);
    const iFollow = !!iFollowRes.data;
    const streak = streakRes.data;
    const posts = postsRes.data || [];
    let pedi = false;
    if (!iFollow && p.is_private) {
        const { data: st } = await sb.rpc('follow_request_status', { target_id: uid });
        pedi = st === 'pendente';
    }
    const trancado = !!p.is_private && !iFollow;
    const destaquesDele = trancado ? [] : await carregarDestaques(uid);
    const txtSeguir = iFollow ? 'Seguindo' : pedi ? 'Solicitado' : 'Seguir';

    const gridHTML = state.profileGridHTML = posts.map(pp => gridThumb(pp)).join('') || '<div class="grid-empty">Nenhuma foto por aqui ainda.</div>';

    const { data: mostraBadges } = await sb.rpc('profile_shows_badges', { alvo: uid });

    const { count: theirStoryCount } = await sb.from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gt('expires_at', new Date().toISOString());

    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back">←</button>
                <div class="topbar-title topbar-title-user">${p.is_private ? '<svg class="tu-cadeado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>' : ''}${escapeHTML(p.username)}</div>
                <div style="width:28px"></div>
            </div>
            <div class="ig-profile-head">
                <button class="ig-avatar-btn${theirStoryCount ? ' has-story' : ''}" data-act="open-user-stories" data-uid="${uid}" aria-label="Ver story">${avatarHTML(p, 'lg')}</button>
                <div class="ig-profile-stats">
                    <div class="ig-stat"><span class="v">${postCount || 0}</span><span class="l">Posts</span></div>
                    <div class="ig-stat tappable" data-act="open-follow-list" data-type="followers" data-uid="${uid}"><span class="v">${followersRes.count || 0}</span><span class="l">Seguidores</span></div>
                    <div class="ig-stat tappable" data-act="open-follow-list" data-type="following" data-uid="${uid}"><span class="v">${followingRes.count || 0}</span><span class="l">Seguindo</span></div>
                </div>
            </div>
            <div class="ig-profile-info">
                <div class="ig-name">${escapeHTML(p.display_name)}${seloHTML(p)}</div>
                ${p.bio ? `<div class="ig-bio">${escapeHTML(p.bio)}</div>` : ''}
                ${p.city ? `<div class="ig-loc">📍 ${escapeHTML(p.city)}</div>` : ''}
            </div>
            
            <div class="ig-profile-actions">
                <button class="${(iFollow || pedi) ? 'btn-secondary' : 'btn-primary-sm'} flex-1" data-act="profile-follow-toggle" data-uid="${uid}" data-following="${(iFollow || pedi) ? '1' : '0'}" data-requested="${pedi ? '1' : '0'}" data-private="${p.is_private ? '1' : '0'}">
                    ${txtSeguir}
                </button>
                ${(p.dm_policy === 'ninguem' || (p.dm_policy === 'seguidores' && !iFollow)) ? '' : `<button class="btn-secondary" data-act="start-chat" data-uid="${uid}" data-name="${escapeHTML(p.display_name)}" data-username="${escapeHTML(p.username)}" data-avatar="${p.avatar_url||''}" aria-label="Mensagem"><svg class="btn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3L11 13M22 3l-7 19-4-9-9-4 20-6z"/></svg></button>`}
                <button class="btn-secondary" data-act="user-menu" data-uid="${uid}" data-name="${escapeHTML(p.display_name)}" aria-label="Mais opções"><svg class="btn-ico" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button>
            </div>
            ${destaquesHTML(destaquesDele, uid)}

            ${trancado ? `<div class="perfil-privado">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>
                <b>Esta conta é privada</b>
                <span>${pedi ? 'Seu pedido está aguardando aprovação.' : 'Siga pra ver os posts e treinos.'}</span>
            </div>` : `<div class="ig-tabs">
                <button class="ig-tab on" data-act="profile-tab" data-tab="posts">Posts</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="workouts" data-uid="${uid}">Treinos</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="meals" data-uid="${uid}">Refeições</button>
                <button class="ig-tab" data-act="profile-tab" data-tab="depoimentos" data-uid="${uid}" data-segue="${iFollow ? '1' : '0'}" data-nome="${escapeHTML(p.display_name)}">Depoimentos</button>
                ${mostraBadges ? `<button class="ig-tab" data-act="profile-tab" data-tab="badges" data-uid="${uid}">Conquistas</button>` : ''}
            </div>
            <div id="profileTabBody"><div class="ig-grid">${gridHTML}</div></div>`}
        </div>
    `;
}

async function renderEditProfile() {
    const c = $('#viewContainer');
    const p = state.profile;
    c.innerHTML = `
        <div class="view">
            <div class="user-topbar">
                <button class="topbar-back" data-act="back">←</button>
                <div class="topbar-title">Editar perfil</div>
                <div style="width:28px"></div>
            </div>

            <div class="edit-avatar-section">
                <div id="editAvatarPreview">${avatarHTML(p, 'lg')}</div>
                <label class="btn-ghost avatar-upload-btn">
                    Alterar foto
                    <input type="file" id="editAvatarFile" accept="image/*" style="display:none">
                </label>
            </div>

            <div class="field">
                <label>Nome de exibição</label>
                <input type="text" id="edName" value="${escapeHTML(p.display_name || '')}" maxlength="60">
            </div>
            <div class="field">
                <label>Usuário <span id="edUserStatus" class="uname-status"></span></label>
                <input type="text" id="edUsername" value="${escapeHTML(p.username || '')}" minlength="3" maxlength="30" autocapitalize="off" autocomplete="off">
                <p class="field-hint">É por ele que as pessoas te acham. Você também pode entrar com ele no lugar do email.</p>
            </div>
            <div class="field">
                <label>Bio</label>
                <textarea id="edBio" maxlength="200" placeholder="Uma frase sobre você...">${escapeHTML(p.bio || '')}</textarea>
            </div>
            <div class="field">
                <label>Cidade</label>
                <input type="text" id="edCity" value="${escapeHTML(p.city || '')}" maxlength="60">
            </div>
            <div class="field hidden">
            </div>

            <p class="field-hint ed-dica-metas">Seu objetivo, suas metas e seu jeito de treinar ficam em <button class="ia-link" data-act="cfg-page" data-page="objetivos">Configurações › Objetivos</button>.</p>

            <button class="btn-primary" id="edSaveBtn" style="margin-top:16px">Salvar alterações</button>
            <div id="edMsg" style="margin-top:10px"></div>
        </div>
    `;

    // Preview do avatar novo
    let newAvatarFile = null;

    // Confere se o usuário novo está livre
    let userOk = true, userTimer = null;
    const campoUser = $('#edUsername');
    campoUser.addEventListener('input', () => {
        clearTimeout(userTimer);
        const val = campoUser.value.trim().toLowerCase();
        const st = $('#edUserStatus');
        if (val === (p.username || '').toLowerCase()) { st.textContent = ''; st.className = 'uname-status'; userOk = true; return; }
        if (val.length < 3) { st.textContent = 'muito curto'; st.className = 'uname-status err'; userOk = false; return; }
        if (!/^[a-z0-9_]+$/.test(val)) { st.textContent = 'só letras, números e _'; st.className = 'uname-status err'; userOk = false; return; }
        if (!/[a-z]/.test(val)) { st.textContent = 'precisa de pelo menos 1 letra'; st.className = 'uname-status err'; userOk = false; return; }
        st.textContent = 'verificando...'; st.className = 'uname-status checking'; userOk = false;
        userTimer = setTimeout(async () => {
            const { data: livre } = await sb.rpc('check_username_available', { uname: val });
            userOk = !!livre;
            st.textContent = livre ? '✓ disponível' : '✗ já em uso';
            st.className = 'uname-status ' + (livre ? 'ok' : 'err');
        }, 400);
    });
    $('#editAvatarFile').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        newAvatarFile = file;
        const url = URL.createObjectURL(file);
        $('#editAvatarPreview').innerHTML = `<span class="avatar avatar-lg" style="overflow:hidden"><img src="${url}" style="width:100%;height:100%;object-fit:cover"></span>`;
    });

    $('#edSaveBtn').addEventListener('click', async () => {
        const btn = $('#edSaveBtn'), msg = $('#edMsg');
        btn.disabled = true; btn.textContent = 'Salvando...';

        try {
            let avatarUrl = state.profile.avatar_url;
            if (newAvatarFile) {
                avatarUrl = await uploadImage('avatars', newAvatarFile, { maxSide: 600, fixedName: 'avatar' }) + '?t=' + Date.now();
            }

            const novoUser = $('#edUsername').value.trim().toLowerCase();
            if (novoUser !== (p.username || '').toLowerCase() && !userOk) {
                toast('Escolha um usuário disponível antes de salvar', 'err');
                return;
            }

            const updates = {
                display_name: $('#edName').value.trim(),
                username: novoUser,
                bio: $('#edBio').value.trim() || null,
                city: $('#edCity').value.trim() || null,
                avatar_url: avatarUrl,
            };
            const { error } = await sb.from('profiles').update(updates).eq('id', state.session.user.id);
            if (error) throw error;

            // Atualiza state
            Object.assign(state.profile, updates);
            btn.disabled = false; btn.textContent = 'Salvar alterações';
            toast('Perfil atualizado!', 'ok');
            switchView('profile');
        } catch (err) {
            btn.disabled = false; btn.textContent = 'Salvar alterações';
            msg.innerHTML = `<div class="auth-msg err">Erro: ${err.message}</div>`;
        }
    });
}

function setKeyboardMode(on) {
    document.documentElement.classList.toggle('kb-open', on);
    syncLayoutVars();
}

// Detecta o teclado abrindo e fechando no celular
document.addEventListener('focusin', e => {
    if (e.target.matches('#chatInput, #coachInput')) setKeyboardMode(true);
});
document.addEventListener('focusout', e => {
    if (e.target.matches('#chatInput, #coachInput')) setTimeout(() => setKeyboardMode(false), 120);
});

function syncLayoutVars() {
    const root = document.documentElement.style;
    const vv = window.visualViewport;
    root.setProperty('--app-h', Math.round(vv ? vv.height : window.innerHeight) + 'px');
    root.setProperty('--vv-offset', Math.round(vv ? vv.offsetTop : 0) + 'px');
    const tb = document.querySelector('.topbar');
    const app = document.getElementById('app');
    if (tb && tb.offsetHeight) root.setProperty('--topbar-h', tb.offsetHeight + 'px');
    const nav = document.querySelector('.bottomnav');
    const navH = nav && nav.offsetHeight
        ? Math.round(window.innerHeight - nav.getBoundingClientRect().top)
        : 74;
    root.setProperty('--nav-pad', navH + 'px');
}
window.addEventListener('resize', syncLayoutVars);
window.addEventListener('orientationchange', syncLayoutVars);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncLayoutVars);
    window.visualViewport.addEventListener('scroll', syncLayoutVars);
}

// Quais telas escondem o topo e o menu do app
const TELAS_CHEIAS = ['settings', 'privacy', 'rules', 'install', 'menu', 'saved', 'objetivos', 'jeito-treino', 'termos', 'politica-privacidade', 'arquivados', 'medidas', 'gerenciar'];
function ehTelaCheia(v) { return !!v && (TELAS_CHEIAS.includes(v) || v.startsWith('set-')); }
// Garante que topo e menu batem com a tela atual (evita ficar "preso" sem topo/menu)
function sincronizarModoTela() {
    const html = document.documentElement;
    html.classList.remove('kb-open');
    html.classList.toggle('tela-cheia', ehTelaCheia(state.view));
    if (!document.querySelector('.sheet.on, .sc.on, .story-viewer.on, .posts-viewer')) document.body.style.overflow = '';
}
window.addEventListener('pageshow', () => sincronizarModoTela());
// iPhone: depois de teclado, câmera ou galeria, às vezes o topo e o menu ficam deslocados.
// Um "empurrão" na rolagem faz o Safari recalcular a posição deles.
function realinharTela() {
    setTimeout(() => { window.scrollTo(window.scrollX, window.scrollY); syncLayoutVars && syncLayoutVars(); }, 60);
}
document.addEventListener('focusout', realinharTela);
document.addEventListener('change', e => { if (e.target && e.target.type === 'file') realinharTela(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizarModoTela(); });

async function switchView(v, params = {}) {
    const viewAnterior = state.view;
    const paramsAnteriores = state.viewParams || {};
    if (viewAnterior === 'feed' && v !== 'feed') state.feedScroll = window.scrollY; // lembra onde parou
    closeDynamicSheets();
    const noChat = (v === 'chat' || v === 'coach');
    document.documentElement.classList.toggle('chat-mode', noChat);
    if (!noChat) document.documentElement.classList.remove('kb-open');
    requestAnimationFrame(syncLayoutVars);
    if (v !== 'chat') stopChatSync();
    state.view = v;
    state.viewParams = params;
    // Coach e conversas ficam sob a aba Chat na navegação
    const navView = (v === 'challenge' || v === 'challenges') ? 'desafio' : v;
    const topoUser = document.getElementById('topbarUser');
    if (topoUser) {
        const noPerfil = v === 'profile' && state.profile;
        topoUser.classList.toggle('hidden', !noPerfil);
        document.querySelector('.topbar-brand').classList.toggle('hidden', !!noPerfil);
        if (noPerfil) topoUser.innerHTML = `${state.profile.is_private ? '<svg class="tu-cadeado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>' : ''}<span>${escapeHTML(state.profile.username)}</span>`;
    }
    const feedPostBtn = document.getElementById('feedPostBtn');
    if (feedPostBtn) feedPostBtn.classList.toggle('hidden', v !== 'feed' && v !== 'profile');
    // No perfil o @usuário fica no centro do topo: a busca sai pra não apertar
    const buscaBtn = document.querySelector('.topbar [data-act="go-search"]');
    if (buscaBtn) buscaBtn.classList.toggle('hidden', v === 'profile');
    // Telas de configuração ocupam a tela toda, sem topo nem menu do app
    const telaCheia = ehTelaCheia(v);
    if ((v === 'objetivos' || v === 'jeito-treino') && viewAnterior && viewAnterior !== 'objetivos' && viewAnterior !== 'jeito-treino') {
        state.voltarEditavel = viewAnterior;
    }
    const TELAS_PRINCIPAIS = ['feed', 'progress', 'desafio', 'profile', 'user-profile', 'challenges', 'challenge', 'messages', 'notifications', 'search', 'chat', 'coach'];
    if (v === 'menu' && viewAnterior && TELAS_PRINCIPAIS.includes(viewAnterior)) {
        state.menuVoltar = viewAnterior;
        state.menuVoltarParams = paramsAnteriores;
    }
    // Ao entrar ou sair de uma tela cheia, limpa o conteúdo antigo na hora
    // (evita aparecer, por um instante, a tela anterior com o topo errado)
    if (document.documentElement.classList.contains('tela-cheia') !== telaCheia) {
        const vc = document.getElementById('viewContainer');
        if (vc) vc.innerHTML = '<div class="view"><div class="spinner"></div></div>';
        window.scrollTo(0, 0);
    }
    document.documentElement.classList.toggle('tela-cheia', telaCheia);
    document.documentElement.classList.remove('nav-compacta');
    $$('.nav-btn').forEach(b => b.classList.toggle('on', b.dataset.view === navView));
    if (v === 'feed') await renderFeed();
    else if (v === 'progress') await renderProgress();
    else if (v === 'challenges') renderChallenges();
    else if (v === 'profile') await renderProfile();
    else if (v === 'user-profile') await renderUserProfile(params.uid);
    else if (v === 'edit-profile') await renderEditProfile();
    else if (v === 'activity-log') await renderActivityLog();
    else if (v === 'health') await renderHealth();
    else if (v === 'coach') await renderCoach();
    else if (v === 'admin') await renderAdmin();
    else if (v === 'messages') await renderMessages();
    else if (v === 'settings') renderSettings();
    else if (v === 'menu') { await renderMenu(); contarPendentesMenu(); }
    else if (v === 'objetivos') renderObjetivos();
    else if (v === 'jeito-treino') renderJeitoTreino();
    else if (v === 'termos') renderTermos();
    else if (v === 'arquivados') renderArquivados();
    else if (v === 'medidas') await renderProgress();
    if (v === 'feed' && state.feedScroll > 0) {
        const y = state.feedScroll;
        requestAnimationFrame(() => setTimeout(() => window.scrollTo(0, y), 60));
    }
    else if (v === 'gerenciar') await renderGerenciarDesafio(params.id);
    else if (v === 'politica-privacidade') renderPoliticaPrivacidade();
    else if (v === 'saved') await renderSalvos();
    else if (v.startsWith('set-')) await renderPaginaConfig(v);
    else if (v === 'challenge') await renderChallengeDetail(params.id);
    else if (v === 'desafio') await renderPainelDesafio(params.id);
    else if (v === 'install') renderInstall();
    else if (v === 'search') renderSearch();
    else if (v === 'notifications') await renderNotifications();
    else if (v === 'privacy') renderPrivacy();
    else if (v === 'rules') renderRules();
    else if (v === 'compare') await renderCompare();
    else if (v === 'chat') await renderChat(params.conversationId, params.otherUser);
    document.scrollingElement.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.nav-btn').forEach(b => b.addEventListener('click', e => {
    const v = e.currentTarget.dataset.view;
    // já está nessa aba: volta pro topo (e no feed, atualiza)
    if (state.view === v) {
        if (window.scrollY > 40) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (v === 'feed') { state.feedScroll = 0; renderFeed(); }
        return;
    }
    if (v === 'feed') state.feedScroll = 0; // pela barra, o feed abre do topo
    switchView(v);
}));

// Toque num ponto/barra/dia de gráfico mostra o valor no canto do card
document.addEventListener('click', e => {
    const hit = e.target.closest('.tip-hit');
    if (!hit) return;
    e.stopPropagation();
    const card = hit.closest('.chart-card') || hit.closest('.cal-wrap');
    if (!card) return;
    let tip = card.querySelector(':scope > .chart-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; card.appendChild(tip); }
    tip.textContent = hit.dataset.tip;
    tip.classList.add('on');
    card.querySelectorAll('.tip-hit.sel').forEach(x => x.classList.remove('sel'));
    hit.classList.add('sel');
    clearTimeout(tip._t);
    tip._t = setTimeout(() => { tip.classList.remove('on'); hit.classList.remove('sel'); }, 2600);
}, true);

// Igual Instagram: rolando pra baixo o menu encolhe, rolando pra cima volta
(function navQueEncolhe() {
    let ultimo = window.scrollY, pendente = false;
    window.addEventListener('scroll', () => {
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            const html = document.documentElement;
            if (!html.classList.contains('chat-mode')) {
                if (y > 80 && y - ultimo > 6) html.classList.add('nav-compacta');
                else if (ultimo - y > 6 || y < 40) html.classList.remove('nav-compacta');
            }
            ultimo = y;
            pendente = false;
        });
    }, { passive: true });
})();

// ============================================================
// FEED INTERACTIONS
// ============================================================
document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act, id = btn.dataset.id;

    if (act === 'react') {
        const on = btn.classList.contains('on');
        btn.classList.toggle('on');  // otimista
        const span = btn.querySelector('span');
        span.textContent = Number(span.textContent) + (on ? -1 : 1);

        if (on) {
            await sb.from('reactions').delete().match({ post_id:id, user_id:state.session.user.id, reaction:'❤️' });
        } else {
            const { error } = await sb.from('reactions').insert({ post_id:id, user_id:state.session.user.id, reaction:'❤️' });
            if (error) { btn.classList.remove('on'); span.textContent = Number(span.textContent) - 1; toast('Erro ao reagir', 'err'); }
        }
    } else if (act === 'comment') {
        openCommentSheet(id);
    } else if (act === 'ver-selo') {
        const desde = btn.dataset.desde ? new Date(btn.dataset.desde).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
        const old = document.getElementById('seloSheet'); if (old) old.remove();
        const sheet = document.createElement('div');
        sheet.id = 'seloSheet'; sheet.className = 'sheet on';
        sheet.innerHTML = `<div class="sheet-card selo-card">
            <div class="sheet-handle"></div>
            <span class="selo-grande">${SELO_FUNDADOR}</span>
            <h3 class="sheet-title">Membro fundador</h3>
            ${desde ? `<p class="sheet-sub">${desde}</p>` : ''}
        </div>`;
        document.body.appendChild(sheet);
        sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    } else if (act === 'sug-seguir') {
        e.stopPropagation();
        btn.disabled = true;
        const { data, error } = await sb.rpc('follow_user', { target_id: btn.dataset.uid });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        btn.textContent = data === 'requested' ? 'Solicitado' : 'Seguindo';
        btn.classList.add('feito');
    } else if (act === 'busca-remover') {
        e.stopPropagation();
        lsSet(chaveHistBusca(), JSON.stringify(lerHistBusca().filter(x => x.id !== btn.dataset.uid)));
        mostrarHistBusca();
    } else if (act === 'busca-limpar') {
        if (!(await confirmar('Limpar todo o histórico de busca?'))) return;
        lsSet(chaveHistBusca(), '[]');
        mostrarHistBusca();
    } else if (act === 'busca-abrir') {
        const uid = btn.dataset.uid;
        salvarNoHistBusca({ id: uid, username: btn.dataset.username, display_name: btn.dataset.nome, avatar_url: btn.dataset.avatar || null });
        if (uid === state.session.user.id) switchView('profile');
        else switchView('user-profile', { uid });
    } else if (act === 'view-user') {
        const uid = btn.dataset.uid;
        if (!uid || uid === 'undefined') return;
        fecharJanelasAbertas();
        if (uid === state.session.user.id) switchView('profile');
        else switchView('user-profile', { uid });
    } else if (act === 'post-menu') {
        showPostMenu(id, btn);
    } else if (act === 'post-menu-dep') {
        e.stopPropagation();
        hidePostMenu();
        const menu = document.createElement('div');
        menu.id = 'floatingPostMenu';
        menu.className = 'post-menu';
        menu.innerHTML = `<button class="post-menu-item danger" data-act="apagar-meu-depoimento" data-dep="${btn.dataset.dep}" data-id="${id}">${icon('lixo')}Apagar meu depoimento</button>
            <button class="post-menu-item" data-act="report-post" data-id="${id}" data-uid="${btn.dataset.uid}" data-name="${btn.dataset.name}">${icon('bloquear')}Denunciar</button>`;
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
    } else if (act === 'apagar-meu-depoimento') {
        hidePostMenu();
        if (!(await confirmar('Apagar seu depoimento? Ele sai do feed e do perfil da pessoa.'))) return;
        const { error } = await sb.rpc('apagar_depoimento', { did: btn.dataset.dep });
        if (error) { toast(msgErro(error), 'err'); return; }
        const el = document.querySelector(`.post[data-post-id="${btn.dataset.id}"]`); if (el) el.remove();
        toast('Depoimento apagado', 'ok');
    } else if (act === 'fixar-post') {
        hidePostMenu();
        const fixar = btn.dataset.fixar === '1';
        const { error } = await sb.rpc('fixar_post_perfil', { pid: id, fixar });
        if (error) { toast(msgErro(error), 'err'); return; }
        const el = document.querySelector(`.post[data-post-id="${id}"]`); if (el) el.dataset.fixado = fixar ? '1' : '0';
        toast(fixar ? 'Fixado no topo do seu perfil 📌' : 'Post desafixado', 'ok');
        if (state.view === 'profile') renderProfile();
    } else if (act === 'arquivar-post') {
        hidePostMenu();
        const { error } = await sb.from('posts').update({ archived: true }).eq('id', id).eq('user_id', state.session.user.id);
        if (error) { toast(msgErro(error), 'err'); return; }
        aposRemoverPost(id);
        toastComAcao('Post arquivado. Está em Menu › Arquivados.', 'Desfazer', async () => {
            await sb.from('posts').update({ archived: false }).eq('id', id);
            toast('Post de volta', 'ok');
            if (state.view === 'feed') renderFeed(); else if (state.view === 'profile') renderProfile();
        });
    } else if (act === 'desarquivar-post') {
        const { error } = await sb.from('posts').update({ archived: false }).eq('id', id).eq('user_id', state.session.user.id);
        if (error) { toast(msgErro(error), 'err'); return; }
        toast('Post de volta no seu perfil', 'ok');
        renderArquivados();
    } else if (act === 'quick-follow') {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const following = btn.dataset.following === '1';
        btn.disabled = true;
        if (following) {
            await sb.rpc('unfollow_user', { target_id: uid });
            btn.dataset.following = '0';
            btn.textContent = 'Seguir';
            btn.classList.remove('following');
        } else {
            const { data: res, error } = await sb.rpc('follow_user', { target_id: uid });
            if (!error) {
                btn.dataset.following = '1';
                btn.textContent = res === 'requested' ? 'Solicitado' : 'Seguindo';
                btn.classList.add('following');
            }
        }
        btn.disabled = false;
    } else if (act === 'profile-follow-toggle') {
        const uid = btn.dataset.uid;
        const following = btn.dataset.following === '1';
        btn.disabled = true;
        if (following) {
            const eraPedido = btn.dataset.requested === '1';
            if (!eraPedido && btn.dataset.private === '1' && !(await confirmar('Deixar de seguir? A conta é privada, pra ver de novo vai precisar pedir.'))) { btn.disabled = false; return; }
            await sb.rpc('unfollow_user', { target_id: uid });
        } else {
            const { error } = await sb.rpc('follow_user', { target_id: uid });
            if (error) { toast('Não consegui seguir agora.', 'err'); btn.disabled = false; return; }
        }
        btn.disabled = false;
        renderUserProfile(uid);
    } else if (act === 'back') {
        switchView('feed');
    } else if (act === 'back-profile') {
        switchView('profile');
    } else if (act === 'open-body-data') {
        openBodyDataSheet();
    } else if (act === 'open-measure') {
        openMeasureSheet();
    } else if (act === 'go-messages') {
        switchView('messages');
    } else if (act === 'start-chat') {
        const otherUid = btn.dataset.uid;
        const otherName = btn.dataset.name;
        const otherUsername = btn.dataset.username;
        const otherAvatar = btn.dataset.avatar || '';
        btn.disabled = true;
        const { data: convId, error } = await sb.rpc('get_or_create_conversation', { other_id: otherUid });
        btn.disabled = false;
        if (error) {
            const t = String(error.message || '');
            if (t.includes('dm_ninguem')) toast('Essa pessoa não está recebendo mensagens.', 'err');
            else if (t.includes('dm_seguidores')) toast('Essa pessoa só recebe mensagem de quem a segue.', 'err');
            else toast('Erro ao abrir conversa: ' + t, 'err');
            return;
        }
        switchView('chat', { conversationId: convId, otherUser: { id: otherUid, display_name: otherName, username: otherUsername, avatar_url: otherAvatar } });
    } else if (act === 'profile-tab') {
        $$('.ig-tab').forEach(t => t.classList.toggle('on', t === btn));
        if (btn.dataset.tab === 'workouts') renderWorkoutHistory(btn.dataset.uid);
        else if (btn.dataset.tab === 'meals') renderMealHistory(btn.dataset.uid);
        else if (btn.dataset.tab === 'badges') renderAchievements(btn.dataset.uid);
        else if (btn.dataset.tab === 'depoimentos') renderDepoimentos(btn.dataset.uid, btn.dataset.segue === '1', btn.dataset.nome);
        else $('#profileTabBody').innerHTML = `<div class="ig-grid">${state.profileGridHTML || ''}</div>`;
    } else if (act === 'open-challenge') {
        switchView('challenge', { id: btn.dataset.id });
    } else if (act === 'new-challenge') {
        openNewChallengeSheet();
    } else if (act === 'invite-challenge') {
        openInviteSheet(btn.dataset.id);
    } else if (act === 'compartilhar-perfil') {
        const link = `${location.origin}${location.pathname}?u=${encodeURIComponent(state.profile.username)}`;
        const texto = `Me segue no Pulso: ${link}`;
        try {
            if (navigator.share) await navigator.share({ title: 'Pulso', text: texto, url: link });
            else { await navigator.clipboard.writeText(link); toast('Link do perfil copiado', 'ok'); }
        } catch (e) {}
    } else if (act === 'convidar-amigo') {
        const link = `${location.origin}${location.pathname}?seguir=${encodeURIComponent(state.profile.username)}`;
        const texto = `Tô usando o Pulso pra acompanhar meus treinos. Bora junto? ${link}`;
        toast('Você ganha 10 pontos quando seu amigo registrar o primeiro treino', 'ok');
        try {
            if (navigator.share) await navigator.share({ title: 'Pulso', text: texto, url: link });
            else { await navigator.clipboard.writeText(texto); toast('Convite copiado, é só colar', 'ok'); }
        } catch (e) {}
    } else if (act === 'seguir-convite') {
        const uid = btn.dataset.uid;
        const { data: res } = await sb.rpc('follow_user', { target_id: uid });
        toast(res === 'requested' ? 'Pedido pra seguir enviado' : 'Seguindo!', 'ok');
        const s = document.getElementById('conviteSheet');
        if (s) { s.remove(); document.body.style.overflow = ''; }
        switchView('feed');
    } else if (act === 'topbar-menu') {
        switchView('menu');
    } else if (act === 'go-menu') {
        switchView('menu');
    } else if (act === 'menu-voltar') {
        switchView(state.menuVoltar || 'feed', state.menuVoltarParams || {});
    } else if (act === 'm-go') {
        switchView(btn.dataset.view);
    } else if (act === 'm-peso') {
        contarUsoAtalho('peso');
        openWeightLogSheet();
    } else if (act === 'save-post') {
        e.stopPropagation();
        const id = btn.dataset.id;
        const salvar = !state.salvos.has(id);
        btn.classList.toggle('on', salvar);
        const { error } = salvar
            ? await sb.from('saved_posts').insert({ user_id: state.session.user.id, post_id: id })
            : await sb.from('saved_posts').delete().match({ user_id: state.session.user.id, post_id: id });
        if (error) { btn.classList.toggle('on', !salvar); toast(msgErro(error), 'err'); return; }
        if (salvar) state.salvos.add(id); else state.salvos.delete(id);
        btn.querySelector('svg').setAttribute('fill', salvar ? 'currentColor' : 'none');
        toast(salvar ? 'Salvo. Fica em Menu › Salvos.' : 'Removido dos salvos', 'ok');
    } else if (act === 'responder-convite') {
        const aceitar = btn.dataset.aceitar === '1';
        btn.disabled = true;
        const { error } = await sb.rpc('respond_challenge_invite', { cid: btn.dataset.id, accept: aceitar });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        toast(aceitar ? 'Você entrou no desafio!' : 'Convite recusado', 'ok');
        if (aceitar) renderChallengeDetail(btn.dataset.id); else switchView('challenges');
    } else if (act === 'ver-regras-desafio') {
        const el = document.getElementById('chRegrasMembro');
        if (el) el.classList.toggle('hidden');
    } else if (act === 'ia-treino-fiz') {
        const t = state.iaTreino;
        if (!t) return;
        limparComposer();
        setComposerKind('workout');
        $('#wType').value = t.tipo;
        $('#wDuration').value = t.minutos;
        $('#pCaption').value = t.titulo || '';
        atualizarCamposTreino();
        abrirComposer();
    } else if (act === 'ia-treino-trocar') {
        const t = state.iaTreino;
        btn.disabled = true; btn.textContent = 'Pensando...';
        try { await obterTreinoDoDia(true, t && t.titulo); } catch (err) { toast('Não consegui trocar agora.', 'err'); }
        hydrateIAEvolucao();
    } else if (act === 'ia-treino-pular') {
        const t = state.iaTreino;
        if (t) { t.status = 'pulado'; await iaGuardar('treino', hojeISO(), t); }
        hydrateIAEvolucao();
    } else if (act === 'ia-treino-voltar') {
        const t = state.iaTreino;
        if (t) { t.status = 'sugerido'; await iaGuardar('treino', hojeISO(), t); }
        hydrateIAEvolucao();
    } else if (act === 'ia-plano-refazer') {
        btn.textContent = 'refazendo...';
        try { await obterPlanoSemana(true); } catch (err) { toast('Não consegui refazer agora.', 'err'); }
        hydrateIAEvolucao();
    } else if (act === 'adm-aba') {
        state.abaAdmin = btn.dataset.aba;
        $$('.adm-abas .evo-aba').forEach(b => b.classList.toggle('on', b === btn));
        $$('.adm-painel').forEach(p => p.classList.toggle('hidden', p.dataset.painel !== state.abaAdmin));
    } else if (act === 'adm-u-menu') {
        e.stopPropagation();
        menuAdminUsuario(btn);
    } else if (act === 'adm-editar-dados') {
        hidePostMenu();
        abrirEditarDadosAdmin(btn.dataset.uid);
    } else if (act === 'adm-filtro') {
        state.admFiltro = btn.dataset.f;
        pintarAdminUsuarios();
    } else if (act === 'adm-bloquear') {
        hidePostMenu();
        const u = (state.admUsuarios || []).find(x => x.id === btn.dataset.uid) || {};
        const bloq = btn.dataset.bloq === '1';
        if (bloq && !(await confirmar(`Bloquear o acesso de ${u.display_name}? A pessoa não consegue mais usar o app até você desbloquear.`))) return;
        const { error } = await sb.rpc('admin_set_access', { alvo: btn.dataset.uid, status: bloq ? 'bloqueado' : 'aprovado' });
        if (error) { toast(erroParaAdmin(error), 'err'); return; }
        toast(bloq ? 'Acesso bloqueado' : 'Acesso liberado de novo', 'ok');
        hydrateAdminUsuarios();
    } else if (act === 'adm-excluir') {
        hidePostMenu();
        const u = (state.admUsuarios || []).find(x => x.id === btn.dataset.uid);
        if (u) confirmarExclusaoConta(u);
    } else if (act === 'admin-acesso') {
        btn.disabled = true;
        const { error } = await sb.rpc('admin_set_access', { alvo: btn.dataset.uid, status: btn.dataset.status });
        if (error) { toast(erroParaAdmin(error), 'err'); btn.disabled = false; return; }
        toast(btn.dataset.status === 'aprovado' ? 'Acesso liberado ✓' : 'Cadastro recusado (fica bloqueado)', 'ok');
        hydrateNovosCadastros();
    } else if (act === 'admin-exigir-aprovacao') {
        const ligar = btn.dataset.on !== '1';
        const { error } = await sb.rpc('admin_set_require_approval', { exigir: ligar });
        if (error) { toast(erroParaAdmin(error), 'err'); return; }
        toast(ligar ? 'Novos cadastros agora esperam sua aprovação' : 'Novos cadastros entram direto', 'ok');
        hydrateNovosCadastros();
    } else if (act === 'admin-backup') {
        btn.disabled = true; btn.textContent = 'Gerando...';
        const { data, error } = await sb.rpc('admin_backup');
        btn.disabled = false; btn.textContent = 'Baixar backup agora';
        if (error) { toast(erroParaAdmin(error), 'err'); return; }
        const texto = JSON.stringify(data);
        const blob = new Blob([texto], { type: 'application/json' });
        const nome = `pulso-backup-${hojeISO()}.json`;
        salvarImagem(blob, nome);
        const info = document.getElementById('backupInfo');
        if (info) info.textContent = `Backup gerado (${Math.round(texto.length / 1024)} KB). Guarde o arquivo ${nome} num lugar seguro.`;
    } else if (act === 'dep-editar') {
        abrirEscreverDepoimento(btn.dataset.uid, '', { id: btn.dataset.id, texto: btn.dataset.texto });
    } else if (act === 'dep-escrever') {
        abrirEscreverDepoimento(btn.dataset.uid, btn.dataset.nome);
    } else if (act === 'dep-responder') {
        const publicar = btn.dataset.pub === '1';
        const ck = document.getElementById('depFeed-' + btn.dataset.id);
        btn.disabled = true;
        const { error } = await sb.rpc('responder_depoimento', { did: btn.dataset.id, publicar, no_feed: !!(publicar && ck && ck.checked) });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        toast(publicar ? (ck && ck.checked ? 'Publicado no perfil e no feed ✨' : 'Publicado no seu perfil ✨') : 'Depoimento recusado', 'ok');
        renderDepoimentos(state.session.user.id, false, '');
    } else if (act === 'dep-apagar') {
        if (!(await confirmar('Apagar este depoimento? Se ele foi pro feed, o post também sai.'))) return;
        const { error } = await sb.rpc('apagar_depoimento', { did: btn.dataset.id });
        if (error) { toast(msgErro(error), 'err'); return; }
        const item = btn.closest('.dep-item'); if (item) item.remove();
        toast('Depoimento apagado', 'ok');
        const abaDep = document.querySelector('.ig-tab[data-tab="depoimentos"].active, .ig-tab[data-tab="depoimentos"].on');
        if (abaDep) abaDep.click();
    } else if (act === 'abrir-depoimentos') {
        state.abrirAbaPerfil = 'depoimentos';
        switchView('profile');
    } else if (act === 'open-painel-desafio') {
        state.desafioAtual = btn.dataset.id;
        switchView('desafio', { id: btn.dataset.id });
    } else if (act === 'peso-grupo-toggle') {
        const sair = btn.dataset.sair === '1';
        if (sair && !(await confirmar('Tirar seu peso do total do grupo? Ninguém vê seu peso de qualquer forma, isso só não soma você no total.'))) return;
        const { error } = await sb.rpc('set_challenge_weight_optout', { cid: btn.dataset.id, sair });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast(sair ? 'Seu peso não entra mais no total do grupo' : 'Seu peso volta a somar no total do grupo', 'ok');
        hydrateTotaisGrupo({ id: btn.dataset.id });
    } else if (act === 'fechar-marco') {
        const m = document.getElementById('pdMarco'); if (m) m.innerHTML = '';
    } else if (act === 'go-gerenciar') {
        switchView('gerenciar', { id: btn.dataset.id });
    } else if (act === 'ger-voltar') {
        switchView('desafio', { id: btn.dataset.id });
    } else if (act === 'ger-menu') {
        e.stopPropagation();
        menuGerParticipante(btn);
    } else if (act === 'ger-mover') {
        hidePostMenu();
        const { error } = await sb.rpc('gestor_mover_time', { cid: state.gerDesafio.id, alvo: btn.dataset.uid, novo_time: Number(btn.dataset.team) });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast(`Movido pro Time ${nomeTime(state.gerDesafio, Number(btn.dataset.team))}`, 'ok');
        renderGerenciarDesafio(state.gerDesafio.id);
    } else if (act === 'ger-trocar') {
        hidePostMenu();
        const a = btn.dataset.uid, ta = state.gerTimes[a];
        escolherPessoaGer('Trocar de lugar com…', u => state.gerTimes[u.user_id] && state.gerTimes[u.user_id] !== ta, async b => {
            const { error } = await sb.rpc('gestor_trocar_times', { cid: state.gerDesafio.id, a, b });
            if (error) { toast(msgErro(error), 'err'); return; }
            toast('Os dois trocaram de time', 'ok');
            renderGerenciarDesafio(state.gerDesafio.id);
        });
    } else if (act === 'ger-remover') {
        hidePostMenu();
        const u = state.gerRanking.find(x => x.user_id === btn.dataset.uid) || {};
        if (!(await confirmar(`Remover ${u.display_name || 'essa pessoa'} do desafio? Ela não será avisada e pode pedir pra entrar de novo.`))) return;
        const { error } = await sb.rpc('gestor_remover_participante', { cid: state.gerDesafio.id, alvo: btn.dataset.uid });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast('Removido do desafio', 'ok');
        renderGerenciarDesafio(state.gerDesafio.id);
    } else if (act === 'ger-editar') {
        abrirEditarDesafio();
    } else if (act === 'ger-montar-times') {
        abrirMontarTimes();
    } else if (act === 'ger-encerrar') {
        if (!(await confirmar('Encerrar o desafio agora? O ranking fica congelado e o pódio sai na hora.'))) return;
        const { error } = await sb.rpc('gestor_encerrar_desafio', { cid: state.gerDesafio.id });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast('Desafio encerrado 🏁', 'ok');
        renderGerenciarDesafio(state.gerDesafio.id);
    } else if (act === 'ger-passar') {
        escolherPessoaGer('Passar a organização pra…', u => u.user_id !== state.gerDesafio.created_by, async alvo => {
            const u = state.gerRanking.find(x => x.user_id === alvo) || {};
            if (!(await confirmar(`Passar a organização do desafio pra ${u.display_name}? Ela vai poder gerenciar tudo.`))) return;
            const { error } = await sb.rpc('gestor_passar_organizacao', { cid: state.gerDesafio.id, alvo });
            if (error) { toast(msgErro(error), 'err'); return; }
            toast('Organização transferida', 'ok');
            renderGerenciarDesafio(state.gerDesafio.id);
        });
    } else if (act === 'treino-com-aceitar' || act === 'treino-com-recusar') {
        e.stopPropagation();
        const aceitar = act === 'treino-com-aceitar';
        btn.disabled = true;
        const { error } = await sb.rpc(aceitar ? 'aceitar_treino_com' : 'recusar_treino_com', { pid: btn.dataset.post });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        const acoes = btn.closest('.nt-acoes');
        if (acoes) acoes.outerHTML = `<span class="nt-sub">${aceitar ? 'Registrado no seu histórico ✓' : 'Você recusou'}</span>`;
        if (aceitar) { toast('Treino registrado pra você também 💪', 'ok'); loadScore(); }
    } else if (act === 'wk-menu') {
        e.stopPropagation();
        menuRegistro(btn);
    } else if (act === 'wk-detalhe') {
        if (e.target.closest('.wk-mais')) return;
        abrirDetalheTreino(btn.dataset.id);
    } else if (act === 'reg-apagar') {
        hidePostMenu();
        apagarRegistro(btn.dataset.id, btn.dataset.tipo);
    } else if (act === 'reg-editar') {
        hidePostMenu();
        abrirEditarRegistro(btn.dataset.id, btn.dataset.tipo);
    } else if (act === 'analisar-prato') {
        e.stopPropagation();
        btnCarregando(btn, true);
        const r = await analisarRefeicao(btn.dataset.id);
        if (!r.ok) { btnCarregando(btn, false); toast('A IA ainda está indisponível. Tento de novo mais tarde.', 'err'); return; }
        loadScore();
        toast(`Nota ${br(r.nota)}${r.pts ? ` · +${r.pts} pt` : ''}`, 'ok');
        renderMealHistory(state.session.user.id);
    } else if (act === 'caption-mais') {
        const cap = btn.previousElementSibling;
        if (cap) cap.classList.add('aberta');
        btn.remove();
    } else if (act === 'apagar-agua') {
        e.stopPropagation();
        const id = btn.dataset.id;
        const linha = btn.closest('.ah-linha'); if (linha) linha.classList.add('sumindo');
        let desfeito = false;
        toastComAcao('Registro de água apagado', 'Desfazer', () => { desfeito = true; if (linha) linha.classList.remove('sumindo'); });
        setTimeout(async () => {
            if (desfeito) return;
            const { error } = await sb.from('posts').delete().eq('id', id).eq('user_id', state.session.user.id);
            if (error) { toast(msgErro(error), 'err'); if (linha) linha.classList.remove('sumindo'); return; }
            if (linha) linha.remove();
            loadScore();
            refreshWaterProgress();
        }, 5000);
    } else if (act === 'atalho-registro') {
        contarUsoAtalho({ workout: 'treino', meal: 'refeicao', sleep: 'sono' }[btn.dataset.k]);
        $('#tileDesafio').classList.toggle('hidden', !podeCriarDesafio());
        limparComposer();
        $('#composerPick').classList.add('hidden');
        $('#composerForm').classList.remove('hidden');
        setComposerKind(btn.dataset.k);
        abrirComposer();
    } else if (act === 'ver-ofensiva') {
        abrirExplicacaoOfensiva();
    } else if (act === 'cal-mes') {
        trocarMesCal(Number(btn.dataset.dir));
    } else if (act === 'cal-dia') {
        const lista = (state.calMesDias || {})[btn.dataset.d] || [];
        const balao = document.getElementById('cmBalao');
        if (!balao) return;
        const txt = lista.map(p => `${escapeHTML(p.activity_type || 'Treino')}${p.duration_min ? ' · ' + p.duration_min + ' min' : ''}${p.distance_km ? ' · ' + br(p.distance_km) + ' km' : ''}`).join('<br>');
        const { a, m } = state.calMes;
        const dataTxt = new Date(a, m, Number(btn.dataset.d)).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
        balao.innerHTML = `<b>${dataTxt.charAt(0).toUpperCase() + dataTxt.slice(1)}</b><span>${txt}</span>`;
        balao.classList.remove('hidden');
        document.querySelectorAll('.cm-d.sel').forEach(x => x.classList.remove('sel'));
        btn.classList.add('sel');
    } else if (act === 'pd-abrir') {
        switchView('desafio', { id: btn.dataset.id });
    } else if (act === 'pd-lista') {
        switchView('desafio', {});
    } else if (act === 'pd-aba') {
        state.abaDesafio = state.abaDesafio || {};
        state.abaDesafio[btn.dataset.id] = btn.dataset.aba;
        $$('.pd-abas .evo-aba').forEach(b => b.classList.toggle('on', b === btn));
        $$('.pd-painel').forEach(p => p.classList.toggle('hidden', p.dataset.pd !== btn.dataset.aba));
    } else if (act === 'tm-ajustar') {
        abrirAjusteTimes(btn.dataset.id);
    } else if (act === 'tm-trocar') {
        const { error } = await sb.rpc('set_member_team', { cid: btn.dataset.cid, alvo: btn.dataset.uid, novo_time: Number(btn.dataset.team) });
        if (error) { toast(msgErro(error), 'err'); return; }
        btn.parentElement.querySelectorAll('.tm-aj-cor').forEach(b => b.classList.toggle('on', b === btn));
    } else if (act === 'pd-trocar') {
        state.desafioAtual = btn.dataset.id;
        renderPainelDesafio(btn.dataset.id);
    } else if (act === 'go-challenges-lista') {
        switchView('challenges');
    } else if (act === 'evo-aba') {
        state.abaEvolucao = btn.dataset.aba;
        $$('.evo-aba').forEach(b => b.classList.toggle('on', b === btn));
        $$('.evo-painel').forEach(p => p.classList.toggle('hidden', p.dataset.painel !== state.abaEvolucao));
        const per = document.getElementById('evoPeriodos');
        if (per) per.classList.toggle('hidden', state.abaEvolucao === 'coach');
        const cal = document.querySelector('.cal-scroll');
        if (cal) cal.scrollLeft = cal.scrollWidth;
    } else if (act === 'set-cenario') {
        state.cenario = btn.dataset.c;
        const y = window.scrollY;
        await renderProgress();
        window.scrollTo(0, y);
    } else if (act === 'set-periodo') {
        state.periodo = btn.dataset.p;
        const y = window.scrollY;
        await renderProgress();
        window.scrollTo(0, y);
    } else if (act === 'mes-story') {
        e.stopPropagation();
        if (!state.resumoMes) return;
        abrirEscolhaResumo(state.resumoMes, 'pulso-resumo.jpg');
    } else if (act === 'resumo-story') {
        e.stopPropagation();
        const d = state.resumoSemana || await dadosDaSemana();
        abrirEscolhaResumo(d, 'pulso-minha-semana.jpg');
    } else if (act === 'podio-compartilhar') {
        e.stopPropagation();
        const pd = state.podios && state.podios[btn.dataset.id];
        if (!pd) return;
        btn.disabled = true;
        const medalhas = ['🥇', '🥈', '🥉'];
        const itens = pd.r.slice(0, 3).map((u, i) => [`${medalhas[i]} ${u.user_id === state.session.user.id ? 'Eu' : String(u.display_name || '').split(' ')[0]}`, `${Math.round(u.points)} pontos no desafio`, u.user_id === state.session.user.id]);
        if (pd.minhaPos > 3) itens.push([`${pd.minhaPos}º lugar`, `minha posição, entre ${pd.r.length}`, true]);
        try {
            const { data: t } = await sb.rpc('challenge_group_totals', { cid: btn.dataset.id });
            if (t && itens.length < 5) {
                const partes = [`${numBR(t.treinos || 0)} treinos`];
                if (Number(t.km) > 0) partes.push(`${numBR(t.km, 1)} km`);
                if (t.kg_perdidos != null && Number(t.kg_perdidos) > 0) partes.push(`${numBR(t.kg_perdidos, 1)} kg a menos`);
                itens.push(['Juntos', partes.join(' · ')]);
            }
        } catch (_) {}
        try {
            const { data: cfgT } = await sb.from('challenges').select('team_mode, team_names').eq('id', btn.dataset.id).maybeSingle();
            if (cfgT && cfgT.team_mode) {
                const { data: tr } = await sb.rpc('challenge_team_ranking', { cid: btn.dataset.id });
                const venc = [...(tr || [])].sort((a, b) => Number(b.points) - Number(a.points))[0];
                if (venc) itens.unshift([`Time ${nomeTime(cfgT, venc.team)}`, `campeão · ${ptsBR(venc.points)} pts`, true]);
                if (itens.length > 5) itens.length = 5;
            }
        } catch (_) {}
        const blob = await imagemResumo({ titulo: pd.nome, subtitulo: 'Resultado final do desafio', itens });
        btn.disabled = false;
        if (blob) abrirPreviaImagem(blob, 'pulso-desafio.jpg');
    } else if (act === 'fechar-resumo') {
        e.stopPropagation();
        let fech = {};
        try { fech = JSON.parse(lsGet(btn.dataset.chave) || '{}'); } catch (_) {}
        lsSet(btn.dataset.chave, JSON.stringify({ vezes: (fech.vezes || 0) + 1, dia: hojeISO() }));
        const card = btn.closest('.dc-card'); if (card) card.remove();
    } else if (act === 'dispensar-card') {
        e.stopPropagation();
        try { localStorage.setItem(btn.dataset.chave, '1'); } catch (_) {}
        const card = btn.closest('.dc-card');
        if (card) card.remove();
    } else if (act === 'trocar-senha') {
        hidePostMenu();
        abrirTrocaSenha();
    } else if (act === 'incentivar') {
        btn.disabled = true;
        const { error } = await sb.rpc('cheer_member', { cid: btn.dataset.cid, alvo: btn.dataset.uid });
        if (error) {
            const t = String(error.message || '');
            toast(t.includes('ja_incentivou_hoje')
                ? `Você já mandou força pra ${btn.dataset.nome} hoje.`
                : msgErro(error), 'err');
            btn.disabled = false;
            return;
        }
        btn.textContent = 'Enviado';
        toast(`Força enviada pra ${btn.dataset.nome}`, 'ok');
    } else if (act === 'explicar') {
        explicarConceito(btn.dataset.tema);
    } else if (act === 'cmp-pick') {
        const id = btn.dataset.id;
        if (state.cmpA === id) { state.cmpA = state.cmpB; state.cmpB = id; }
        else if (state.cmpB === id) { state.cmpB = state.cmpA; state.cmpA = id; }
        else { state.cmpA = state.cmpB; state.cmpB = id; }
        renderCompare();
    } else if (act === 'go-compare') {
        switchView('compare');
    } else if (act === 'curtir-comentario') {
        const id = btn.dataset.id;
        const curtido = btn.dataset.curtido === '1';
        btn.disabled = true;
        if (curtido) await sb.from('comment_likes').delete().match({ comment_id: id, user_id: state.session.user.id });
        else await sb.from('comment_likes').insert({ comment_id: id, user_id: state.session.user.id });
        const sheet = document.getElementById('commentSheet');
        if (sheet && sheet.dataset.postId) loadComments(sheet.dataset.postId);
    } else if (act === 'comentario-menu') {
        e.stopPropagation();
        menuComentario(btn);
    } else if (act === 'apagar-comentario') {
        hidePostMenu();
        apagarComentarioComDesfazer(btn.dataset.id, btn.dataset.respostas || '0');
    } else if (act === 'ocultar-comentario') {
        hidePostMenu();
        const ocultar = btn.dataset.ocultar === '1';
        const { error } = await sb.rpc('ocultar_comentario', { cid: btn.dataset.id, ocultar });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast(ocultar ? 'Comentário oculto. Só você e quem escreveu ainda veem.' : 'Comentário visível de novo', 'ok');
        const sheet = document.getElementById('commentSheet');
        if (sheet && sheet.dataset.postId) loadComments(sheet.dataset.postId);
    } else if (act === 'editar-comentario') {
        hidePostMenu();
        editarComentario(btn.dataset.id);
    } else if (act === 'fixar-comentario') {
        hidePostMenu();
        const fixar = btn.dataset.fixar === '1';
        const pid = state.comentPost && state.comentPost.id;
        const { error } = await sb.rpc('fixar_comentario', { pid, cid: fixar ? btn.dataset.id : null });
        if (error) { toast(msgErro(error), 'err'); return; }
        state.comentPost.fixado = fixar ? btn.dataset.id : null;
        toast(fixar ? 'Comentário fixado no topo 📌' : 'Comentário desafixado', 'ok');
        loadComments(pid);
    } else if (act === 'ver-mais-respostas') {
        state.fiosAbertos = state.fiosAbertos || new Set();
        state.fiosAbertos.add(btn.dataset.id);
        const cs = document.getElementById('commentSheet');
        if (cs && cs.dataset.postId) loadComments(cs.dataset.postId);
    } else if (act === 'quem-curtiu-comentario') {
        quemCurtiuComentario(btn.dataset.id);
    } else if (act === 'toggle-comentarios-post') {
        hidePostMenu();
        const { data: atualPost } = await sb.from('posts').select('comments_off').eq('id', btn.dataset.id).maybeSingle();
        const desligar = !(atualPost && atualPost.comments_off);
        const { error } = await sb.from('posts').update({ comments_off: desligar }).eq('id', btn.dataset.id).eq('user_id', state.session.user.id);
        if (error) { toast(msgErro(error), 'err'); return; }
        toast(desligar ? 'Comentários desativados neste post' : 'Comentários ativados de novo', 'ok');
        const elp = document.querySelector(`.post[data-post-id="${btn.dataset.id}"]`);
        if (elp) {
            elp.dataset.comentOff = desligar ? '1' : '0';
            const av = elp.querySelector('.post-coment-off'); if (av) av.classList.toggle('hidden', !desligar);
        }
    } else if (act === 'abrir-comentarios') {
        fecharJanelasAbertas();
        openCommentSheet(btn.dataset.id);
    } else if (act === 'responder-comentario') {
        state.respondendo = btn.dataset.id;
        const campoResp = document.getElementById('commentInput');
        if (campoResp && btn.dataset.user && btn.dataset.user !== (state.profile && state.profile.username)) {
            const mencao = '@' + btn.dataset.user + ' ';
            if (!campoResp.value.startsWith(mencao)) campoResp.value = mencao + campoResp.value.replace(/^@\S+\s/, '');
        }
        const slot = document.getElementById('respondendoSlot');
        if (slot) {
            slot.innerHTML = `<div class="respondendo-tag" id="respondendoTag">
                Respondendo ${escapeHTML(btn.dataset.nome)}
                <button data-act="cancelar-resposta">cancelar</button>
            </div>`;
        }
        const campo = document.getElementById('commentInput');
        if (campo) campo.focus();
    } else if (act === 'cancelar-resposta') {
        state.respondendo = null;
        const t = document.getElementById('respondendoTag');
        if (t) t.remove();
    } else if (act === 'pedir-acesso') {
        btn.disabled = true;
        const { error } = await sb.from('challenge_requests').insert({
            challenge_id: btn.dataset.id, user_id: state.session.user.id,
        });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        toast('Pedido enviado. Quem criou o desafio vai receber o aviso.', 'ok');
        atualizarTelaDesafio(btn.dataset.id);
    } else if (act === 'aprovar-pedido') {
        btn.disabled = true;
        const { error } = await sb.rpc('approve_challenge_request', { cid: btn.dataset.cid, alvo: btn.dataset.uid });
        if (error) { toast(erroParaAdmin(error), 'err'); btn.disabled = false; return; }
        toast('Entrou no desafio', 'ok');
        renderChallengeDetail(btn.dataset.cid);
    } else if (act === 'recusar-pedido') {
        btn.disabled = true;
        const { error } = await sb.rpc('reject_challenge_request', { cid: btn.dataset.cid, alvo: btn.dataset.uid });
        if (error) { toast(erroParaAdmin(error), 'err'); btn.disabled = false; return; }
        toast('Pedido recusado', 'ok');
        renderChallengeDetail(btn.dataset.cid);
    } else if (act === 'join-challenge') {
        btn.disabled = true;
        const { error } = await sb.from('challenge_members').insert({ challenge_id: btn.dataset.id, user_id: state.session.user.id });
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        toast('Você entrou no desafio!', 'ok');
        atualizarTelaDesafio(btn.dataset.id);
    } else if (act === 'leave-challenge') {
        if (!(await confirmar('Sair do desafio? Você perde acesso ao progresso do grupo.'))) return;
        await sb.from('challenge_members').delete().match({ challenge_id: btn.dataset.id, user_id: state.session.user.id });
        toast('Você saiu do desafio', 'ok');
        renderChallengeDetail(btn.dataset.id);
    } else if (act === 'delete-challenge') {
        if (!(await confirmar('Apagar este desafio? O ranking e os participantes somem junto.'))) return;
        const { error } = await sb.from('challenges').delete().eq('id', btn.dataset.id);
        if (error) { toast('Erro: ' + error.message, 'err'); return; }
        toast('Desafio apagado', 'ok');
        switchView('challenges');
    } else if (act === 'see-likers') {
        openPeopleSheet('Quem curtiu', 'Só você vê essa lista.', () => sb.rpc('post_likers', { pid: btn.dataset.id }));
    } else if (act === 'see-story-viewers') {
        openPeopleSheet('Quem viu seu story', 'Só você vê essa lista.', () => sb.rpc('story_viewers', { sid: btn.dataset.id }));
    } else if (act === 'toggle-reminder') {
        const ligado = localStorage.getItem('pulso-reminder') === 'on';
        if (ligado) {
            await desligarPush();
            localStorage.setItem('pulso-reminder', 'off');
            sb.from('profiles').update({ reminders_on: false }).eq('id', state.session.user.id).then(() => {});
            state.profile.reminders_on = false;
            toast('Lembretes desligados', 'ok');
        } else {
            let perm = Notification.permission;
            if (perm === 'default') perm = await Notification.requestPermission();
            if (perm !== 'granted') { toast('Seu navegador bloqueou os avisos', 'err'); return; }
            const ok = await ligarPush();
            localStorage.setItem('pulso-reminder', 'on');
            sb.from('profiles').update({ reminders_on: true }).eq('id', state.session.user.id).then(() => {});
            state.profile.reminders_on = true;
            toast(ok
                ? 'Pronto. Os lembretes chegam mesmo com o app fechado.'
                : 'Lembretes ligados. Nesse aparelho eles aparecem quando você abrir o app.', 'ok');
        }
        renderSettings();
    } else if (act === 'export-data') {
        toast('Preparando seus dados...', 'ok');
        const { data, error } = await sb.rpc('export_my_data');
        if (error) { toast('Erro ao exportar: ' + error.message, 'err'); return; }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulso-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        toast('Arquivo baixado', 'ok');
    } else if (act === 'go-blocked') {
        hidePostMenu();
        openPeopleSheet('Pessoas bloqueadas', 'Toque pra desbloquear.', async () => {
            const { data, error } = await sb.from('blocks')
                .select('blocked_id, profiles!blocks_blocked_id_fkey (id, username, display_name, avatar_url)')
                .eq('blocker_id', state.session.user.id);
            if (error) return { error };
            return { data: (data || []).map(r => r.profiles).filter(Boolean) };
        });
    } else if (act === 'quick-kind') {
        limparComposer();
        if (btn.dataset.kind === 'story') { openStoryCreator(); }
        else { setComposerKind(btn.dataset.kind); abrirComposer(); }
    } else if (act === 'user-menu') {
        showUserMenu(btn);
    } else if (act === 'report-user') {
        hidePostMenu();
        openReportSheet(btn.dataset.uid, btn.dataset.name, null);
    } else if (act === 'report-post') {
        hidePostMenu();
        openReportSheet(btn.dataset.uid, btn.dataset.name, btn.dataset.id);
    } else if (act === 'toggle-block') {
        hidePostMenu();
        const uid = btn.dataset.uid;
        const nome = btn.dataset.name || 'essa pessoa';
        const bloqueado = btn.dataset.blocked === '1';
        if (!bloqueado && !(await confirmar(`Bloquear ${nome}? Vocês param de se ver no app.`))) return;
        if (bloqueado) {
            await sb.from('blocks').delete().match({ blocker_id: state.session.user.id, blocked_id: uid });
            toast('Desbloqueado', 'ok');
        } else {
            await sb.from('blocks').insert({ blocker_id: state.session.user.id, blocked_id: uid });
            await sb.from('follows').delete().match({ follower_id: state.session.user.id, following_id: uid });
            await sb.from('follows').delete().match({ follower_id: uid, following_id: state.session.user.id });
            toast(`${nome} foi bloqueado`, 'ok');
        }
        await carregarBlocked();
        switchView('feed');
    } else if (act === 'load-more-feed') {
        loadMoreFeed();
    } else if (act === 'gerar-relatorio') {
        gerarRelatorio(btn);
    } else if (act === 'open-sleep') {
        openSleepSheet();
    } else if (act === 'toggle-badges-public') {
        const novo = !state.profile.show_badges;
        const { error } = await sb.from('profiles').update({ show_badges: novo }).eq('id', state.session.user.id);
        if (error) { toast('Erro: ' + error.message, 'err'); return; }
        state.profile.show_badges = novo;
        toast(novo ? 'Suas conquistas agora aparecem no seu perfil' : 'Suas conquistas voltaram a ser privadas', 'ok');
        renderAchievements();
    } else if (act === 'share-badge') {
        const code = btn.dataset.code;
        const { data: lista } = await sb.rpc('my_achievements');
        const conq = (lista || []).find(x => x.code === code);
        if (!conq) return;
        if (!(await confirmar(`Compartilhar "${conq.nome}" no feed?`))) return;
        const { error } = await sb.from('posts').insert({
            user_id: state.session.user.id,
            kind: 'achievement',
            achievement_code: code,
            caption: `${conq.emo}|${conq.nome}|${conq.desc}`,
            visibility: state.defaultPrivacy || 'public',
            is_public: (state.defaultPrivacy || 'public') === 'public',
            in_feed: true,
        });
        if (error) {
            toast(String(error.message || '').includes('duplicate') || error.code === '23505'
                ? 'Essa conquista já foi compartilhada'
                : 'Erro ao compartilhar', 'err');
            return;
        }
        toast('Conquista compartilhada!', 'ok');
        renderAchievements();
    } else if (act === 'quick-water') {
        contarUsoAtalho('agua');
        limparComposer();
        setComposerKind('water');
        abrirComposer();
    } else if (act === 'go-search') {
        switchView('search');
    } else if (act === 'go-notifications') {
        switchView('notifications');
    } else if (act === 'go-rules') {
        hidePostMenu();
        switchView('rules');
    } else if (act === 'novo-post') {
        $('#feedPostBtn').click();
    } else if (act === 'set-account-privacy') {
        const privado = btn.dataset.private === '1';
        if (privado === !!state.profile.is_private) return;
        const { error } = await sb.from('profiles').update({ is_private: privado }).eq('id', state.session.user.id);
        if (error) { toast('Não consegui mudar agora. Tente de novo.', 'err'); return; }
        state.profile.is_private = privado;
        toast(privado ? 'Conta privada. Só seguidores aprovados veem seus posts.' : 'Conta pública. Pedidos pendentes foram aprovados.', 'ok');
    } else if (act === 'follow-request') {
        e.stopPropagation();
        btn.closest('.freq-row').querySelectorAll('button').forEach(b => b.disabled = true);
        const aceitar = btn.dataset.accept === '1';
        const { error } = await sb.rpc('respond_follow_request', { requester: btn.dataset.uid, accept: aceitar });
        if (error) { toast('Não consegui responder agora.', 'err'); btn.closest('.freq-row').querySelectorAll('button').forEach(b => b.disabled = false); return; }
        const row = btn.closest('.freq-row');
        row.querySelector('.freq-acoes').innerHTML = `<span class="freq-feito">${aceitar ? 'Aprovado' : 'Recusado'}</span>`;
        updateNotifBadge();
    } else if (act === 'toggle-creator') {
        e.stopPropagation();
        const libera = btn.dataset.on !== '1';
        btn.disabled = true;
        const { error } = await sb.rpc('admin_set_challenge_creator', { target: btn.dataset.uid, allow: libera });
        btn.disabled = false;
        if (error) { toast('Não consegui alterar: ' + error.message, 'err'); return; }
        btn.dataset.on = libera ? '1' : '0';
        btn.classList.toggle('on', libera);
        btn.textContent = libera ? 'Cria desafios' : 'Liberar desafios';
        toast(libera ? 'Liberado pra criar desafios' : 'Permissão removida', 'ok');
        if (state.admPodeCriar) { libera ? state.admPodeCriar.add(btn.dataset.uid) : state.admPodeCriar.delete(btn.dataset.uid); }
        hidePostMenu();
    } else if (act === 'go-privacy') {
        hidePostMenu();
        switchView('privacy');
    } else if (act === 'edit-post') {
        hidePostMenu();
        openEditPostSheet(btn.dataset.id);
    } else if (act === 'delete-account') {
        if (!(await confirmar('Excluir sua conta? Todo o seu conteúdo some e não tem como recuperar.'))) return;
        const txt = prompt('Pra confirmar, escreva EXCLUIR em maiúsculas:');
        if (txt !== 'EXCLUIR') { toast('Exclusão cancelada', 'ok'); return; }
        const { error } = await sb.rpc('delete_my_account');
        if (error) { toast('Erro ao excluir: ' + error.message, 'err'); return; }
        await sb.auth.signOut();
        location.reload();
    } else if (act === 'go-install') {
        hidePostMenu();
        switchView('install');
    } else if (act === 'do-install') {
        if (state.deferredPrompt) {
            state.deferredPrompt.prompt();
            const r = await state.deferredPrompt.userChoice;
            state.deferredPrompt = null;
            if (r && r.outcome === 'accepted') toast('Pronto! O Pulso foi pro seu celular 🎉', 'ok');
            renderInstall();
        }
    } else if (act === 'go-settings') {
        hidePostMenu();
        switchView('settings');
    } else if (act === 'set-theme') {
        applyTheme(btn.dataset.theme);
        renderSettings();
    } else if (act === 'cfg-page') {
        switchView(btn.dataset.page);
    } else if (act === 'cfg-set') {
        const campo = btn.dataset.campo, valor = btn.dataset.valor;
        if (btn.classList.contains('on')) return;
        if (campo === 'tema') {
            applyTheme(valor);
        } else {
            const novo = campo === 'is_private' ? valor === '1' : valor;
            const { error } = await sb.from('profiles').update({ [campo]: novo }).eq('id', state.session.user.id);
            if (error) { toast(msgErro(error), 'err'); return; }
            state.profile[campo] = novo;
            if (campo === 'is_private') toast(novo ? 'Conta privada' : 'Conta pública. Pedidos pendentes foram aprovados.', 'ok');
        }
        btn.parentElement.querySelectorAll('.cfg-radio').forEach(x => x.classList.toggle('on', x === btn));
    } else if (act === 'toggle-hide-story') {
        const ocultar = btn.dataset.on !== '1';
        btn.disabled = true;
        const { error } = await sb.rpc('set_story_hidden', { target: btn.dataset.uid, hide: ocultar });
        btn.disabled = false;
        if (error) { toast(msgErro(error), 'err'); return; }
        btn.dataset.on = ocultar ? '1' : '0';
        btn.querySelector('.cfg-check').classList.toggle('on', ocultar);
    } else if (act === 'open-edit-profile') {
        switchView('edit-profile');
    } else if (act === 'meta-renovar') {
        e.stopPropagation();
        const nova = new Date(Date.now() + Number(btn.dataset.sem) * 7 * 86400000);
        const iso = isoDe(nova);
        btn.disabled = true;
        const { error } = await sb.from('profiles').update({ goal_deadline: iso, goal_reviewed_at: new Date().toISOString() }).eq('id', state.session.user.id);
        if (error) { toast(msgErro(error), 'err'); btn.disabled = false; return; }
        state.profile.goal_deadline = iso;
        state.coachContext = null;
        toast(`Prazo renovado até ${nova.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`, 'ok');
        renderProfile();
    } else if (act === 'meta-soneca') {
        e.stopPropagation();
        lsSet('pulso-meta-soneca', String(Date.now()));
        const av = btn.closest('.meta-aviso'); if (av) av.remove();
    } else if (act === 'meta-fechar') {
        e.stopPropagation();
        lsSet(btn.dataset.chave, '1');
        const av = btn.closest('.meta-aviso'); if (av) av.remove();
    } else if (act === 'voltar-editavel') {
        switchView(state.voltarEditavel || 'settings');
    } else if (act === 'go-settings-back') {
        if (state.voltarTermos && (state.view === 'termos' || state.view === 'politica-privacidade')) {
            state.voltarTermos = false;
            switchView('feed');
            const sh = document.getElementById('termsSheet');
            if (sh) { sh.style.display = ''; sh.classList.add('on'); } else openTermsSheet();
            return;
        }
        switchView('settings');
    } else if (act === 'go-community') {
        switchView('challenges');
    } else if (act === 'go-progress') {
        switchView('progress');
    } else if (act === 'open-user-stories') {
        const suid = btn.dataset.uid;
        const { data: items, error: stErr } = await sb.from('stories')
            .select('id, user_id, caption, image_url, background_color, style, created_at')
            .eq('user_id', suid)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true });
        if (stErr) { toast('Erro ao abrir story: ' + stErr.message, 'err'); return; }
        if (!items || items.length === 0) {
            toast(suid === state.session.user.id ? 'Você não tem story ativo. Toque no + pra criar.' : 'Nenhum story ativo agora.', 'ok');
            return;
        }
        const { data: autor } = await sb.from('profiles')
            .select('id, username, display_name, avatar_url').eq('id', suid).maybeSingle();
        state.storiesData = [{ user: autor || { id: suid, display_name: '?', username: '?' }, items }];
        openStoryViewer(0);
    } else if (act === 'open-follow-list') {
        openFollowList(btn.dataset.uid, btn.dataset.type);
    } else if (act === 'novo-destaque') {
        abrirEditorDestaque();
    } else if (act === 'abrir-destaque') {
        abrirDestaque(btn.dataset.id, btn.dataset.uid);
    } else if (act === 'view-post') {
        // Vindo de uma grade de perfil ou salvos: abre a lista rolável, na ordem
        const grade = btn.closest('.ig-grid');
        if (grade) {
            const ids = [...grade.querySelectorAll('.grid-item[data-id]')].map(x => x.dataset.id);
            abrirListaDePosts(ids, btn.dataset.id);
        } else {
            openPostSheet(btn.dataset.id);
        }
    } else if (act === 'chat-menu') {
        showChatMenu(btn);
    } else if (act === 'clear-chat') {
        hidePostMenu();
        if (!(await confirmar('Apagar esta conversa? Ela some pros dois e não dá pra desfazer.'))) return;
        const { error } = await sb.from('conversations').delete().eq('id', btn.dataset.id);
        if (error) { toast('Erro ao apagar conversa', 'err'); return; }
        toast('Conversa apagada', 'ok');
        switchView('messages');
    } else if (act === 'delete-message') {
        if (!(await confirmar('Apagar esta mensagem? Ela some pros dois.'))) return;
        const mid = btn.dataset.id;
        const { error } = await sb.from('messages').delete().eq('id', mid);
        if (error) { toast('Erro ao apagar mensagem', 'err'); return; }
        state.chatMessages = state.chatMessages.filter(m => m.id !== mid);
        paintChatMessages();
    } else if (act === 'go-coach') {
        switchView('coach');
    } else if (act === 'back-messages') {
        switchView('messages');
    } else if (act === 'open-chat-item') {
        switchView('chat', {
            conversationId: btn.dataset.convId,
            otherUser: { id: btn.dataset.uid, display_name: btn.dataset.name, username: btn.dataset.username, avatar_url: btn.dataset.avatar || '' }
        });
    } else if (act === 'do-logout') {
        hidePostMenu();
        if (!(await confirmar('Tem certeza que quer sair?'))) return;
        await sb.auth.signOut();
        location.reload();
    } else if (act === 'go-challenges' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        switchView('challenges');
    } else if (act === 'go-admin' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        switchView('admin');
    } else if (act === 'go-health' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        switchView('health');
    } else if (act === 'go-compare' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        switchView('compare');
    } else if (act === 'go-activity-log' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        switchView('activity-log');
    } else if (act === 'open-weight-log' && btn.closest('#floatingPostMenu')) {
        hidePostMenu();
        openWeightLogSheet();
    } else if (act === 'open-privacy-edit') {
        showPrivacyEditMenu(btn.dataset.id, btn);
    } else if (act === 'set-post-privacy') {
        const postId = btn.dataset.id;
        const newVis = btn.dataset.vis;
        if (newVis !== 'private') {
            try { await tornarFotoPublica(postId); } catch (e) { toast('Não consegui liberar a foto agora. Tente de novo.', 'err'); return; }
        }
        const { error } = await sb.from('posts').update({
            visibility: newVis,
            is_public: newVis === 'public',
        }).eq('id', postId);
        if (error) { toast('Erro ao mudar privacidade', 'err'); return; }

        const meta = { public:{emo:'🌍',label:'Público'}, followers:{emo:'👥',label:'Seguidores'}, private:{emo:'🔒',label:'Só eu'} }[newVis];
        const postEl = document.querySelector(`.post[data-post-id="${postId}"]`);
        if (postEl) {
            postEl.dataset.visibility = newVis;
            const badge = postEl.querySelector('[data-privacy-badge]');
            if (badge) badge.innerHTML = `${ICONE_VIS[newVis]} ${meta.label}`;
        }
        toast('Privacidade atualizada', 'ok');
        hidePostMenu();
        const pm = document.getElementById('floatingPrivacyMenu');
        if (pm) pm.remove();
    } else if (act === 'open-family') {
        openFamilySheet();
    } else if (act === 'dismiss-insight') {
        const card = btn.closest('.coach-card');
        if (card) card.style.display = 'none';
        await sb.from('ai_insights').update({ dismissed: true }).eq('id', btn.dataset.id);
    } else if (act === 'insight-cta') {
        const target = btn.dataset.target;
        if (target === 'chat') switchView('coach');
        else if (target === 'progress') switchView('progress');
        else if (target === 'register') {
            limparComposer();
            setComposerKind('workout');
            abrirComposer();
        }
    } else if (act === 'coach-suggest') {
        sendCoachMessage(btn.dataset.q);
    } else if (act === 'delete-measurement') {
        if (!(await confirmar('Apagar esta medição?'))) return;
        await sb.from('body_measurements').delete().eq('id', btn.dataset.id);
        toast('Medição apagada', 'ok');
        await renderHealth();
    } else if (act === 'delete-post') {
        if (!(await confirmar('Apagar este post? Essa ação não pode ser desfeita.'))) return;
        const postId = btn.dataset.id;
        const { data: velho } = await sb.from('posts').select('image_url, thumb_url').eq('id', postId).maybeSingle();
        await sb.from('posts').delete().eq('id', postId);
        if (velho && velho.image_url) removeStoredImage(velho.image_url);
        if (velho && velho.thumb_url) removeStoredImage(velho.thumb_url);
        toast('Post apagado', 'ok');
        // remove do histórico se estiver na tela de log
        const logEl = btn.closest('.log-item');
        if (logEl) logEl.remove();
        hidePostMenu();
        aposRemoverPost(postId);
    }
});

// ============================================================
// MENU DO POST (3 pontinhos)
// ============================================================
function showPostMenu(postId, anchor) {
    hidePostMenu();
    const postEl = document.querySelector(`.post[data-post-id="${postId}"]`);
    const currentVis = postEl?.dataset.visibility || 'public';

    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.className = 'post-menu';
    menu.innerHTML = `
        <button class="post-menu-item" data-act="edit-post" data-id="${postId}">${icon('editar')}Editar</button>
        <button class="post-menu-item" data-act="open-privacy-edit" data-id="${postId}">${icon('olho')}Quem pode ver</button>
        <button class="post-menu-item" data-act="toggle-comentarios-post" data-id="${postId}">${icon('comentario')}${postEl && postEl.dataset.comentOff === '1' ? 'Ativar comentários' : 'Desativar comentários'}</button>
        <button class="post-menu-item" data-act="fixar-post" data-id="${postId}" data-fixar="${postEl && postEl.dataset.fixado === '1' ? '0' : '1'}"><span class="pm-emo">📌</span>${postEl && postEl.dataset.fixado === '1' ? 'Desafixar do perfil' : 'Fixar no perfil'}</button>
        <button class="post-menu-item" data-act="arquivar-post" data-id="${postId}"><svg class="pm-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>Arquivar</button>
        <button class="post-menu-item danger" data-act="delete-post" data-id="${postId}">${icon('lixo')}Apagar post</button>
    `;
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => {
        document.addEventListener('click', hidePostMenuOnce, { once: true });
    }, 10);
}
function hidePostMenu() {
    const m = document.getElementById('floatingPostMenu');
    if (m) m.remove();
}
function hidePostMenuOnce(e) {
    // tocar no ··· de outro item abre o menu dele (não fecha o novo que acabou de abrir)
    if (e.target.closest('.wk-mais, .ger-mais, .post-menu-btn, .cm-mais, [data-act="adm-u-menu"], [data-act="chat-menu"], [data-act="comentario-menu"]')) return;
    if (!e.target.closest('#floatingPostMenu') && !e.target.closest('#floatingPrivacyMenu')) hidePostMenu();
}

// Submenu de trocar privacidade de um post já publicado
function showPrivacyEditMenu(postId, anchor) {
    const old = document.getElementById('floatingPrivacyMenu');
    if (old) old.remove();
    const postEl = document.querySelector(`.post[data-post-id="${postId}"]`);
    const currentVis = postEl?.dataset.visibility || 'public';

    const menu = document.createElement('div');
    menu.id = 'floatingPrivacyMenu';
    menu.className = 'post-menu';
    const opts = [
        { v:'public', emo:'🌍', label:'Público' },
        { v:'followers', emo:'👥', label:'Seguidores' },
        { v:'private', emo:'🔒', label:'Só eu' },
    ];
    menu.innerHTML = opts.map(o => `
        <button class="post-menu-item${o.v===currentVis?' active-vis':''}" data-act="set-post-privacy" data-id="${postId}" data-vis="${o.v}">
            ${o.emo} ${o.label}${o.v===currentVis?' ✓':''}
        </button>
    `).join('');
    const rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => {
        document.addEventListener('click', hidePostMenuOnce, { once: true });
    }, 10);
}

// ============================================================
// COMENTÁRIOS
// ============================================================
async function openCommentSheet(postId) {
    let sheet = document.getElementById('commentSheet');
    if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'commentSheet';
        sheet.className = 'sheet';
        sheet.innerHTML = `
            <div class="sheet-card">
                <div class="sheet-handle"></div>
                <h3 class="sheet-title">Comentários</h3>
                <div id="commentsList" class="comments-list"></div>
                <div id="respondendoSlot"></div>
                <div class="cm-sugestoes hidden" id="cmSugestoes"></div>
                <div class="comment-composer">
                    <textarea id="commentInput" placeholder="Escreva um comentário..." maxlength="500"></textarea>
                    <button class="btn-primary" id="commentSendBtn">Enviar</button>
                </div>
            </div>
        `;
        document.body.appendChild(sheet);
    }
    sheet.classList.add('on');
    document.body.style.overflow = 'hidden';
    sheet.dataset.postId = postId;

    // clique fora fecha
    sheet.onclick = e => { if (e.target === sheet) closeCommentSheet(); };

    // quem é o dono do post e se os comentários estão desligados
    let { data: pInfo, error: pErr } = await sb.from('posts').select('user_id, comments_off, pinned_comment_id').eq('id', postId).maybeSingle();
    if (pErr) ({ data: pInfo } = await sb.from('posts').select('user_id, comments_off').eq('id', postId).maybeSingle());
    state.comentPost = { id: postId, dono: pInfo ? pInfo.user_id : null, off: !!(pInfo && pInfo.comments_off), fixado: pInfo ? pInfo.pinned_comment_id : null };
    const composer = sheet.querySelector('.comment-composer');
    let avisoOff = sheet.querySelector('.comments-off');
    if (state.comentPost.off) {
        composer.classList.add('hidden');
        if (!avisoOff) { avisoOff = document.createElement('p'); avisoOff.className = 'comments-off'; composer.after(avisoOff); }
        avisoOff.textContent = state.comentPost.dono === state.session.user.id ? 'Você desativou os comentários deste post.' : '';
        avisoOff.classList.toggle('hidden', state.comentPost.dono !== state.session.user.id);
    } else {
        composer.classList.remove('hidden');
        if (avisoOff) avisoOff.remove();
    }

    await loadComments(postId);
    ligarAjudasDoComentario();

    document.getElementById('commentSendBtn').onclick = async () => {
        const input = document.getElementById('commentInput');
        const body = input.value.trim();
        if (!body) return;
        const btn = document.getElementById('commentSendBtn');
        btn.disabled = true; btn.textContent = 'Enviando...';
        const { error } = await sb.from('comments').insert({
            post_id: postId, user_id: state.session.user.id, body,
            parent_id: state.respondendo || null,
        });
        if (error && String(error.message || '').toLowerCase().includes('row-level') && state.comentPost && state.comentPost.off) {
            btn.disabled = false; btn.textContent = 'Enviar';
            toast('Os comentários deste post estão desativados.', 'err'); return;
        }
        btn.disabled = false; btn.textContent = 'Enviar';
        if (error) {
            const t = String(error.message || '').toLowerCase();
            toast(t.includes('row-level security') ? 'O autor limitou quem pode comentar nesse post.' : msgErro(error), 'err');
            return;
        }
        input.value = '';
        state.respondendo = null;
        const aviso = document.getElementById('respondendoTag');
        if (aviso) aviso.remove();
        await loadComments(postId);
        // Atualiza contador no feed
        const countSpan = document.querySelector(`.post[data-post-id="${postId}"] [data-act="comment"] span`);
        if (countSpan) countSpan.textContent = String(Number(countSpan.textContent) + 1);
    };
}

async function loadComments(postId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<div class="spinner"></div>';
    let { data: comments, error } = await sb.rpc('post_comments_v2', { pid: postId });
    if (error) ({ data: comments, error } = await sb.rpc('post_comments', { pid: postId }));
    if (error) { list.innerHTML = `<p style="color:var(--danger)">Erro: ${escapeHTML(error.message)}</p>`; return; }
    if (!comments || comments.length === 0) {
        list.innerHTML = '<p class="comments-empty">Nenhum comentário ainda. Seja o primeiro!</p>';
        return;
    }
    const eu = state.session.user.id;
    const souDonoDoPost = state.comentPost && state.comentPost.dono === eu;
    const raiz = comments.filter(c => !c.parent_id);
    const respostas = comments.filter(c => c.parent_id);

    const idFixado = state.comentPost && state.comentPost.fixado;
    const linha = (cm, ehResposta, raizId) => {
        const meu = cm.user_id === eu;
        const fixado = !ehResposta && cm.id === idFixado;
        const autor = { id: cm.user_id, display_name: cm.display_name, username: cm.username, avatar_url: cm.avatar_url };
        const n = Number(cm.curtidas || 0);
        const curtidasTxt = n > 0 ? `<button class="cm-acao cm-contagem" data-act="quem-curtiu-comentario" data-id="${cm.id}">${n} ${n === 1 ? 'curtida' : 'curtidas'}</button>` : '';
        return `
            <div class="comment-item${ehResposta ? ' resposta' : ''}${cm.hidden ? ' oculto' : ''}" data-comment-id="${cm.id}">
                <span data-act="view-user" data-uid="${cm.user_id}">${avatarHTML(autor, 'sm')}</span>
                <div class="comment-body">
                    <div class="comment-name">${fixado ? '<span class="cm-fixado">📌 Fixado</span> ' : ''}<span class="cm-nome" data-act="view-user" data-uid="${cm.user_id}">${escapeHTML(cm.display_name)}</span> <span class="comment-time">${timeAgo(cm.created_at)}${cm.edited_at ? ' · editado' : ''}</span>${cm.hidden ? ' <span class="cm-oculto-tag">oculto</span>' : ''}</div>
                    <div class="comment-text">${escapeHTML(cm.body).replace(/(^|\s)@([a-zA-Z0-9_.]{2,30})/g, '$1<b class="cm-mencao">@$2</b>')}</div>
                    <div class="comment-acoes">
                        ${meu ? '' : `<button class="cm-acao${cm.eu_curti ? ' on' : ''}" data-act="curtir-comentario" data-id="${cm.id}" data-curtido="${cm.eu_curti ? '1' : '0'}">${cm.eu_curti ? 'Curtido' : 'Curtir'}</button>`}
                        ${curtidasTxt}
                        ${(state.comentPost && state.comentPost.off) || meu ? '' : `<button class="cm-acao" data-act="responder-comentario" data-id="${raizId}" data-nome="${escapeHTML(cm.display_name)}" data-user="${escapeHTML(cm.username || '')}">Responder</button>`}
                        <button class="cm-acao cm-mais" data-act="comentario-menu" data-id="${cm.id}" data-uid="${cm.user_id}" data-nome="${escapeHTML(cm.display_name)}" data-oculto="${cm.hidden ? '1' : '0'}" data-raiz="${ehResposta ? '0' : '1'}" data-fixado="${fixado ? '1' : '0'}" data-respostas="${ehResposta ? 0 : respostas.filter(r => r.parent_id === cm.id).length}" aria-label="Mais">···</button>
                    </div>
                </div>
            </div>`;
    };

    // comentário fixado vai pro topo
    raiz.sort((a, b) => (b.id === idFixado) - (a.id === idFixado));
    state.comentariosCache = comments;
    list.innerHTML = raiz.map(c => {
        const filhas = respostas.filter(r => r.parent_id === c.id);
        const aberto = state.fiosAbertos && state.fiosAbertos.has(c.id);
        const mostrar = (filhas.length > 2 && !aberto) ? filhas.slice(-2) : filhas;
        const escondidas = filhas.length - mostrar.length;
        return linha(c, false, c.id)
            + (escondidas > 0 ? `<button class="cm-ver-mais" data-act="ver-mais-respostas" data-id="${c.id}">Ver mais ${escondidas} ${escondidas === 1 ? 'resposta' : 'respostas'}</button>` : '')
            + mostrar.map(f => linha(f, true, c.id)).join('');
    }).join('');
}

// Reações rápidas e sugestão de @ enquanto digita
function ligarAjudasDoComentario() {
    const campo = document.getElementById('commentInput');
    const sug = document.getElementById('cmSugestoes');
    if (!campo || campo.dataset.ligado) return;
    campo.dataset.ligado = '1';
    let timer = null;
    campo.addEventListener('input', () => {
        clearTimeout(timer);
        const antes = campo.value.slice(0, campo.selectionStart ?? campo.value.length);
        const m = antes.match(/(^|\s)@([A-Za-z0-9_.]{0,30})$/);
        if (!m) { sug.classList.add('hidden'); return; }
        const termo = m[2].toLowerCase();
        timer = setTimeout(async () => {
            if (!state.seguindoCache) {
                const { data } = await sb.from('follows').select('following:profiles!following_id (id, username, display_name, avatar_url)').eq('follower_id', state.session.user.id).limit(300);
                state.seguindoCache = (data || []).map(x => x.following).filter(Boolean);
            }
            const lista = state.seguindoCache.filter(u => !termo || (u.username || '').toLowerCase().includes(termo) || (u.display_name || '').toLowerCase().includes(termo)).slice(0, 6);
            if (!lista.length) { sug.classList.add('hidden'); return; }
            sug.innerHTML = lista.map(u => `<button type="button" class="cm-sug" data-user="${escapeHTML(u.username)}">${avatarHTML(u, 'sm')}<span><b>${escapeHTML(u.display_name)}</b><small>@${escapeHTML(u.username)}</small></span></button>`).join('');
            sug.classList.remove('hidden');
        }, 150);
    });
    sug.addEventListener('click', e => {
        const b = e.target.closest('[data-user]');
        if (!b) return;
        const pos = campo.selectionStart ?? campo.value.length;
        const antes = campo.value.slice(0, pos).replace(/@([A-Za-z0-9_.]{0,30})$/, '@' + b.dataset.user + ' ');
        campo.value = antes + campo.value.slice(pos);
        campo.focus();
        campo.setSelectionRange(antes.length, antes.length);
        sug.classList.add('hidden');
    });
}

// Editar o próprio comentário
function editarComentario(id) {
    const cm = (state.comentariosCache || []).find(c => c.id === id);
    if (!cm) return;
    const old = document.getElementById('editCmSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'editCmSheet';
    sheet.className = 'sheet on sheet-over-story';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Editar comentário</h3>
        <textarea id="editCmTexto" class="obj-input" maxlength="500" rows="3">${escapeHTML(cm.body)}</textarea>
        <div class="sheet-footer">
            <button class="btn-ghost" id="editCmCancelar">Cancelar</button>
            <button class="btn-primary" id="editCmSalvar">Salvar</button>
        </div>
    </div>`;
    document.body.appendChild(sheet);
    const campo = sheet.querySelector('#editCmTexto');
    setTimeout(() => { campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length); }, 60);
    sheet.querySelector('#editCmCancelar').onclick = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
    sheet.querySelector('#editCmSalvar').onclick = async () => {
        const texto = campo.value.trim();
        if (!texto) { toast('O comentário não pode ficar vazio', 'err'); return; }
        const { error } = await sb.rpc('editar_comentario', { cid: id, texto });
        if (error) { toast(msgErro(error), 'err'); return; }
        sheet.remove();
        toast('Comentário editado', 'ok');
        const cs = document.getElementById('commentSheet');
        if (cs && cs.dataset.postId) loadComments(cs.dataset.postId);
    };
}

// Menu ··· do comentário: apagar (dono do post ou autor), ocultar (dono do post), denunciar
function menuComentario(btn) {
    hidePostMenu();
    const eu = state.session.user.id;
    const meu = btn.dataset.uid === eu;
    const donoPost = state.comentPost && state.comentPost.dono === eu;
    const opcoes = [];
    if (meu) opcoes.push(`<button class="post-menu-item" data-act="editar-comentario" data-id="${btn.dataset.id}">${icon('editar')}Editar</button>`);
    if (donoPost && btn.dataset.raiz === '1') opcoes.push(`<button class="post-menu-item" data-act="fixar-comentario" data-id="${btn.dataset.id}" data-fixar="${btn.dataset.fixado === '1' ? '0' : '1'}">📌 ${btn.dataset.fixado === '1' ? 'Desafixar' : 'Fixar no topo'}</button>`);
    if (meu || donoPost) opcoes.push(`<button class="post-menu-item danger" data-act="apagar-comentario" data-id="${btn.dataset.id}" data-respostas="${btn.dataset.respostas}">${icon('lixo')}Apagar</button>`);
    if (donoPost && !meu) opcoes.push(`<button class="post-menu-item" data-act="ocultar-comentario" data-id="${btn.dataset.id}" data-ocultar="${btn.dataset.oculto === '1' ? '0' : '1'}">${icon('olho')}${btn.dataset.oculto === '1' ? 'Mostrar de novo' : 'Ocultar'}</button>`);
    if (!meu) opcoes.push(`<button class="post-menu-item" data-act="report-user" data-uid="${btn.dataset.uid}" data-name="${btn.dataset.nome}">${icon('bloquear')}Denunciar</button>`);
    const menu = document.createElement('div');
    menu.id = 'floatingPostMenu';
    menu.className = 'post-menu cm-menu';
    menu.innerHTML = opcoes.join('');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = Math.min(window.innerHeight - 150, rect.bottom + 4) + 'px';
    menu.style.left = Math.max(12, rect.left - 120) + 'px';
    menu.style.zIndex = 120;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', hidePostMenuOnce, { once: true }), 10);
}

// Apagar com "Desfazer": some na hora e só apaga de verdade depois de 5 segundos
async function apagarComentarioComDesfazer(id, respostas) {
    if (Number(respostas) > 0 && !(await confirmar(`Esse comentário tem ${respostas} ${respostas === '1' ? 'resposta' : 'respostas'}, que também serão apagadas. Continuar?`))) return;
    const item = document.querySelector(`.comment-item[data-comment-id="${id}"]`);
    const filhas = [];
    if (item) {
        let prox = item.nextElementSibling;
        while (prox && prox.classList.contains('resposta')) { filhas.push(prox); prox = prox.nextElementSibling; }
        [item, ...(Number(respostas) > 0 ? filhas : [])].forEach(el => el.classList.add('sumindo'));
    }
    let desfeito = false;
    const t = toastComAcao('Comentário apagado', 'Desfazer', () => {
        desfeito = true;
        document.querySelectorAll('.comment-item.sumindo').forEach(el => el.classList.remove('sumindo'));
    });
    setTimeout(async () => {
        if (desfeito) return;
        const { error } = await sb.rpc('apagar_comentario', { cid: id });
        if (error) { toast(msgErro(error), 'err'); document.querySelectorAll('.comment-item.sumindo').forEach(el => el.classList.remove('sumindo')); return; }
        const sheet = document.getElementById('commentSheet');
        if (sheet && sheet.dataset.postId) {
            loadComments(sheet.dataset.postId);
            const countSpan = document.querySelector(`.post[data-post-id="${sheet.dataset.postId}"] [data-act="comment"] span`);
            if (countSpan) countSpan.textContent = String(Math.max(0, Number(countSpan.textContent) - 1 - (Number(respostas) || 0)));
        }
    }, 5000);
}
// Confirmação no estilo do app (no lugar da caixa do navegador)
function confirmar(texto, botao = null, perigo = null) {
    if (!botao) {
        const t = String(texto);
        const mapa = [[/^Apagar/, 'Apagar', true], [/^Excluir/, 'Excluir', true], [/^Remover/, 'Remover', true], [/^Bloquear/, 'Bloquear', true],
            [/^Encerrar/, 'Encerrar', true], [/sair\?$|^Sair/, 'Sair', true], [/^Deixar de seguir/, 'Deixar de seguir', true], [/^Limpar/, 'Limpar', true],
            [/^Tirar/, 'Tirar', false], [/^Passar/, 'Passar', false], [/^Compartilhar/, 'Compartilhar', false], [/^Li /, 'Está certo', false]];
        const m = mapa.find(([re]) => re.test(t));
        botao = m ? m[1] : 'Confirmar';
        if (perigo == null) perigo = m ? m[2] : false;
    }
    return new Promise(resolve => {
        const old = document.getElementById('confirmarSheet'); if (old) old.remove();
        const sheet = document.createElement('div');
        sheet.id = 'confirmarSheet';
        sheet.className = 'sheet on confirmar-sheet';
        sheet.innerHTML = `<div class="sheet-card">
            <div class="sheet-handle"></div>
            <p class="confirmar-txt">${escapeHTML(texto)}</p>
            <div class="sheet-footer">
                <button class="btn-ghost" data-r="0">Cancelar</button>
                <button class="btn-primary${perigo ? ' btn-perigo' : ''}" data-r="1">${escapeHTML(botao)}</button>
            </div>
        </div>`;
        document.body.appendChild(sheet);
        const fim = r => { sheet.remove(); resolve(r); };
        sheet.addEventListener('click', e => {
            if (e.target === sheet) return fim(false);
            const b = e.target.closest('[data-r]');
            if (b) fim(b.dataset.r === '1');
        });
    });
}
// Botão que "segura" enquanto salva (evita toque duplo)
function btnCarregando(btn, on) {
    if (!btn) return;
    if (on) {
        if (btn.classList.contains('carregando')) return;
        btn.dataset.txtOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add('carregando');
        btn.innerHTML = '<span class="btn-spin"></span>';
    } else {
        btn.disabled = false;
        btn.classList.remove('carregando');
        if (btn.dataset.txtOriginal != null) btn.innerHTML = btn.dataset.txtOriginal;
    }
}

// Aviso com um botão (ex: Desfazer)
function toastComAcao(texto, acao, aoClicar) {
    const el = document.createElement('div');
    el.className = 'toast toast-acao';
    el.innerHTML = `<span>${escapeHTML(texto)}</span><button>${escapeHTML(acao)}</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    el.querySelector('button').onclick = () => { aoClicar(); el.remove(); };
    setTimeout(() => el.remove(), 5000);
    return el;
}

// Quem curtiu um comentário
async function quemCurtiuComentario(id) {
    const { data: likes } = await sb.from('comment_likes').select('user_id, created_at').eq('comment_id', id).order('created_at', { ascending: false });
    const ids = (likes || []).map(l => l.user_id);
    const { data: perfis } = ids.length ? await sb.from('profiles').select('id, username, display_name, avatar_url').in('id', ids) : { data: [] };
    const old = document.getElementById('peopleSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'peopleSheet';
    sheet.className = 'sheet on sheet-over-story';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Curtiram o comentário</h3>
        <div class="follow-list">${(perfis || []).map(u => `<div class="follow-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div style="flex:1;min-width:0"><div class="follow-name">${escapeHTML(u.display_name)}</div><div class="follow-uname">@${escapeHTML(u.username)}</div></div>
        </div>`).join('') || '<div class="log-empty">Ninguém ainda.</div>'}</div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.onclick = e => { if (e.target === sheet) sheet.remove(); };
}

// Fecha tudo que estiver por cima (comentários, listas, visualizador de posts) antes de navegar
function fecharJanelasAbertas() {
    closeCommentSheet();
    ['peopleSheet', 'postsViewer', 'postViewSheet', 'likersSheet'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    document.querySelectorAll('.sheet.on').forEach(sh => { if (sh.id !== 'termsSheet') sh.classList.remove('on'); });
    hidePostMenu();
    document.body.style.overflow = '';
}

function closeCommentSheet() {
    const s = document.getElementById('commentSheet');
    if (s) s.classList.remove('on');
    document.body.style.overflow = '';
}


// Cliques na barra de stories
document.addEventListener('click', async e => {
    const item = e.target.closest('[data-story-idx], [data-add-story]');
    if (!item) return;

    const addStory = item.hasAttribute('data-add-story');
    const idx = item.dataset.storyIdx;

    // Se clicou no + do meu story e eu ainda não tenho stories, abre composer
    if (addStory && !state.storiesData.some(g => g.user.id === state.session.user.id)) {
        openComposerAsStory();
        return;
    }

    // Se clicou no meu botão E eu TENHO stories, considera clique como abrir viewer
    if (idx !== undefined) {
        openStoryViewer(parseInt(idx));
    }
});

function openComposerAsStory() {
    openStoryCreator();
}

// ============================================================
// CRIAR STORY (tela cheia, estilo Instagram)
// ============================================================
const STORY_BG_PADRAO = '#000000'; // fundo de stories antigos, sem cor salva
const STORY_CORES = ['#000000', '#FFFFFF', '#35E19B', '#5FB0FF', '#FF7A4D', '#C08BFF', '#FFC24B'];
const STORY_DEGRADES = [
    'linear-gradient(160deg, #35E19B 0%, #0F7A57 100%)',
    'linear-gradient(160deg, #FF7A4D 0%, #FFC24B 100%)',
    'linear-gradient(160deg, #5FB0FF 0%, #C08BFF 100%)',
];
const FONTES_STORY = [['classico', 'Clássico'], ['forte', 'Forte'], ['manuscrito', 'Escrito']];
const bgPadraoStory = () => document.documentElement.getAttribute('data-theme') === 'light' ? '#FFFFFF' : '#000000';
const sc = { mode: null, file: null, bg: '#000000', busy: false, fonte: 'classico', fundoTxt: 'nenhum', pos: null, adesivo: null, adesivoPos: null, corLetra: null, alinhar: 'center', alvoCor: 'fundo' };

function corDeTextoPara(bg) {
    const b = (bg || '').toLowerCase();
    return ['#000000', '#151b18'].includes(b) ? '#F1F4F1' : '#0A0C0B';
}
// Letra encolhe sozinha quando o texto cresce
function tamanhoTextoStory(len, emFoto, fonte) {
    let t = emFoto ? (len <= 30 ? 24 : len <= 80 ? 20 : len <= 150 ? 17 : 15)
                   : (len <= 30 ? 34 : len <= 80 ? 28 : len <= 150 ? 23 : 19);
    if (fonte === 'manuscrito') t += 5;
    if (fonte === 'forte') t -= 2;
    return t;
}
// Estilo usado tanto no criador quanto no viewer
function estiloTextoStory(st, len, emFoto) {
    const fonte = (st && st.font) || 'classico';
    return { cls: 'fonte-' + fonte, size: tamanhoTextoStory(len, emFoto, fonte) };
}

function openStoryCreator() {
    Object.assign(sc, { mode: null, file: null, busy: false, bg: bgPadraoStory(), fonte: 'classico', fundoTxt: 'nenhum', pos: null, adesivo: null, adesivoPos: null, corLetra: null, alinhar: 'center', alvoCor: 'fundo' });
    $('#scPaleta').classList.add('hidden');
    $('#scColuna').classList.remove('recolhida');
    $('#scText').style.textAlign = '';
    $('#scCam').value = ''; $('#scGal').value = '';
    const txt = $('#scText');
    txt.value = ''; txt.classList.add('hidden'); txt.style.height = ''; txt.style.left = ''; txt.style.top = '';
    txt.readOnly = false;
    $('#scImg').classList.add('hidden'); $('#scImg').removeAttribute('src');
    $('#scSticker').classList.add('hidden'); $('#scSticker').style.left = ''; $('#scSticker').style.top = '';
    $('#scChoose').classList.remove('hidden');
    $('#scBottom').classList.add('hidden');
    $('#scSwatches').classList.add('hidden');
    $('#scStage').style.background = '';
    $('#storyCreator').classList.remove('text-mode', 'photo-mode', 'fundo-escuro', 'fundo-claro', 'alinhar-left', 'alinhar-right');
    $('#scSwatches').innerHTML = [...STORY_CORES, ...STORY_DEGRADES].map(c =>
        `<button type="button" class="sc-swatch" data-color="${c}" style="background:${c}" aria-label="Cor"></button>`).join('');
    $$('.sc-swatch').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        sc.bg = e.currentTarget.dataset.color;
        aplicarCorStory();
        $('#scSwatches').classList.add('hidden');
    }));
    aplicarFonteStory();
    $('#storyCreator').classList.add('on');
    document.body.style.overflow = 'hidden';
    atualizarBotaoPublicarStory();
}

function closeStoryCreator() {
    state.storyResumoSemana = null;
    $('#storyCreator').classList.remove('on');
    document.body.style.overflow = '';
    sincronizarModoTela();
    $('#scText').blur();
}

function ajustarAlturaTextoStory() {
    const t = $('#scText');
    const e = estiloTextoStory({ font: sc.fonte }, t.value.length, sc.mode === 'photo');
    t.style.fontSize = e.size + 'px';
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, window.innerHeight * 0.6) + 'px';
}
function atualizarBotaoPublicarStory() {
    const temTexto = $('#scText').value.trim().length > 0;
    const pronto = (sc.mode === 'photo' && sc.file) || (sc.mode === 'text' && (temTexto || sc.adesivo));
    $('#scPublish').classList.toggle('hidden', !pronto || sc.mode === 'text');
    $('#scPublicarGrande').disabled = !(sc.mode === 'text' && pronto);
}
function aplicarCorStory() {
    $('#scStage').style.background = sc.bg;
    const letra = sc.corLetra || corDeTextoPara(sc.bg);
    $('#scText').style.color = letra;
    $('#scDot').style.background = sc.bg;
    $('#scColDot').style.background = sc.alvoCor === 'letra' ? letra : sc.bg;
    $$('.sc-swatch').forEach(x => x.classList.toggle('on', x.dataset.color === sc.bg));
    montarPaletaTexto();
}
// Paleta do modo texto: uma linha que rola, pintando fundo ou letra
function montarPaletaTexto() {
    const box = document.getElementById('scPaletaCores');
    if (!box) return;
    const cores = sc.alvoCor === 'fundo' ? [...STORY_CORES, ...STORY_DEGRADES] : STORY_CORES;
    const atual = sc.alvoCor === 'fundo' ? sc.bg : (sc.corLetra || corDeTextoPara(sc.bg));
    box.innerHTML = (sc.alvoCor === 'letra' ? `<button type="button" class="sc-swatch sc-auto${!sc.corLetra ? ' on' : ''}" data-auto="1" aria-label="Automático">A</button>` : '')
        + cores.map(c => `<button type="button" class="sc-swatch${(c === atual && !(sc.alvoCor === 'letra' && !sc.corLetra)) ? ' on' : ''}" data-color="${c}" style="background:${c}" aria-label="Cor"></button>`).join('');
    document.querySelectorAll('.sc-paleta-alvo button').forEach(b => b.classList.toggle('on', b.dataset.alvo === sc.alvoCor));
}
function aplicarAlinhamento() {
    const cr = $('#storyCreator');
    cr.classList.toggle('alinhar-left', sc.alinhar === 'left');
    cr.classList.toggle('alinhar-right', sc.alinhar === 'right');
    const linhas = { center: '<path d="M5 6h14M8 12h8M5 18h14"/>', left: '<path d="M5 6h14M5 12h9M5 18h14"/>', right: '<path d="M5 6h14M10 12h9M5 18h14"/>' };
    $('#scColAlinharIco').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${linhas[sc.alinhar]}</svg>`;
    requestAnimationFrame(ajustarAlturaTextoStory);
}
function aplicarFonteStory() {
    const t = $('#scText');
    FONTES_STORY.forEach(([k]) => t.classList.remove('fonte-' + k));
    t.classList.add('fonte-' + sc.fonte);
    $('#scFonte').textContent = (FONTES_STORY.find(f => f[0] === sc.fonte) || [, 'Clássico'])[1];
    $('#scFonte').className = 'sc-round sc-tool sc-tool-txt fonte-' + sc.fonte;
    ajustarAlturaTextoStory();
}
function aplicarFundoTexto() {
    const cr = $('#storyCreator');
    cr.classList.toggle('fundo-escuro', sc.fundoTxt === 'escuro');
    cr.classList.toggle('fundo-claro', sc.fundoTxt === 'claro');
    $('#scFundoTxt').querySelector('.sc-fundo-ico').className = 'sc-fundo-ico modo-' + sc.fundoTxt;
    $('#scColMarcadorIco').className = 'sc-fundo-ico modo-' + sc.fundoTxt;
    requestAnimationFrame(ajustarAlturaTextoStory);
}
function posicionar(el, pos) {
    if (!pos) { el.style.left = ''; el.style.top = ''; return; }
    el.style.left = pos.x + '%'; el.style.top = pos.y + '%';
}

function entrarModoTexto() {
    sc.mode = 'text';
    const cr = $('#storyCreator');
    cr.classList.add('text-mode'); cr.classList.remove('photo-mode', 'fundo-escuro', 'fundo-claro');
    $('#scChoose').classList.add('hidden');
    $('#scBottom').classList.add('hidden');
    const t = $('#scText');
    t.readOnly = false;
    t.classList.remove('hidden');
    posicionar(t, null);
    t.placeholder = 'Escreva algo';
    aplicarCorStory();
    aplicarFonteStory();
    aplicarAlinhamento();
    aplicarFundoTexto();
    setTimeout(() => t.focus(), 60);
    atualizarBotaoPublicarStory();
}

function entrarModoFoto(file) {
    sc.mode = 'photo';
    sc.file = file;
    const cr = $('#storyCreator');
    cr.classList.add('photo-mode'); cr.classList.remove('text-mode');
    $('#scChoose').classList.add('hidden');
    $('#scStage').style.background = '#000';
    const img = $('#scImg');
    img.src = URL.createObjectURL(file);
    img.classList.remove('hidden');
    $('#scBottom').classList.remove('hidden');
    $('#scAddText').classList.remove('hidden');
    $('#scFundoTxt').classList.remove('hidden');
    $('#scColorBtn').classList.add('hidden');
    $('#scSwatches').classList.add('hidden');
    $('#scPaleta').classList.add('hidden');
    sc.corLetra = null; sc.alinhar = 'center';
    cr.classList.remove('alinhar-left', 'alinhar-right');
    const t = $('#scText');
    t.style.color = '#fff';
    t.placeholder = 'Escreva por cima da foto';
    if (!sc.pos) sc.pos = { x: 50, y: 76 };
    posicionar(t, sc.pos);
    t.classList.toggle('hidden', !t.value.trim());
    t.readOnly = true;
    aplicarFonteStory();
    aplicarFundoTexto();
    atualizarBotaoPublicarStory();
}

// Arrastar texto e adesivo (toque curto no texto = editar)
function tornarArrastavel(el, campoPos, aoTocar) {
    let ini = null, movendo = false;
    el.addEventListener('pointerdown', e => {
        if (sc.mode !== 'photo' && el.id === 'scText') return;
        if (el.id === 'scText' && !el.readOnly) return; // editando: deixa o cursor funcionar
        ini = { x: e.clientX, y: e.clientY }; movendo = false;
        el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
        if (!ini) return;
        if (!movendo && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 6) return;
        movendo = true;
        const r = $('#scStage').getBoundingClientRect();
        const pos = {
            x: Math.max(8, Math.min(92, ((e.clientX - r.left) / r.width) * 100)),
            y: Math.max(8, Math.min(92, ((e.clientY - r.top) / r.height) * 100)),
        };
        sc[campoPos] = pos;
        posicionar(el, pos);
    });
    el.addEventListener('pointerup', () => {
        if (ini && !movendo && aoTocar) aoTocar();
        ini = null;
    });
}
tornarArrastavel($('#scText'), 'pos', () => {
    const t = $('#scText');
    t.readOnly = false;
    t.focus();
});
tornarArrastavel($('#scSticker'), 'adesivoPos', null);
$('#scText').addEventListener('blur', () => {
    if (sc.mode === 'photo') {
        const t = $('#scText');
        t.readOnly = true;
        if (!t.value.trim()) t.classList.add('hidden');
    }
});

function escolherFotoStory(e) {
    const file = e.target.files && e.target.files[0];
    if (file) entrarModoFoto(file);
}
$('#scCam').addEventListener('change', escolherFotoStory);
$('#scGal').addEventListener('change', escolherFotoStory);
$('#scTextMode').addEventListener('click', entrarModoTexto);
$('#scClose').addEventListener('click', closeStoryCreator);
$('#scText').addEventListener('input', () => { ajustarAlturaTextoStory(); atualizarBotaoPublicarStory(); });
$('#scAddText').addEventListener('click', () => {
    const t = $('#scText');
    t.classList.remove('hidden');
    t.readOnly = false;
    ajustarAlturaTextoStory();
    t.focus();
});
$('#scColorBtn').addEventListener('click', () => $('#scSwatches').classList.toggle('hidden'));
$('#scColEstilo').addEventListener('click', e => { e.stopPropagation(); $('#scFonte').click(); });
$('#scColCor').addEventListener('click', e => { e.stopPropagation(); $('#scPaleta').classList.toggle('hidden'); montarPaletaTexto(); });
$('#scColAlinhar').addEventListener('click', e => {
    e.stopPropagation();
    const ordem = ['center', 'left', 'right'];
    sc.alinhar = ordem[(ordem.indexOf(sc.alinhar) + 1) % 3];
    aplicarAlinhamento();
});
$('#scColMarcador').addEventListener('click', e => { e.stopPropagation(); $('#scFundoTxt').click(); });
$('#scColTreino').addEventListener('click', e => { e.stopPropagation(); $('#scAdesivo').click(); });
$('#scColFechar').addEventListener('click', e => {
    e.stopPropagation();
    const col = $('#scColuna');
    col.classList.toggle('recolhida');
    $('#scColFecharNome').textContent = col.classList.contains('recolhida') ? 'Abrir' : 'Fechar';
});
document.querySelectorAll('.sc-paleta-alvo button').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    sc.alvoCor = b.dataset.alvo;
    montarPaletaTexto();
    $('#scColDot').style.background = sc.alvoCor === 'letra' ? (sc.corLetra || corDeTextoPara(sc.bg)) : sc.bg;
}));
$('#scPaletaCores').addEventListener('click', e => {
    const b = e.target.closest('.sc-swatch');
    if (!b) return;
    e.stopPropagation();
    if (sc.alvoCor === 'letra') sc.corLetra = b.dataset.auto ? null : b.dataset.color;
    else sc.bg = b.dataset.color;
    aplicarCorStory();
});
$('#scPaleta').addEventListener('click', e => e.stopPropagation());
$('#scPublicarGrande').addEventListener('click', () => $('#scPublish').click());
$('#scFonte').addEventListener('click', () => {
    const i = FONTES_STORY.findIndex(f => f[0] === sc.fonte);
    sc.fonte = FONTES_STORY[(i + 1) % FONTES_STORY.length][0];
    aplicarFonteStory();
});
$('#scFundoTxt').addEventListener('click', () => {
    const ordem = ['nenhum', 'escuro', 'claro'];
    sc.fundoTxt = ordem[(ordem.indexOf(sc.fundoTxt) + 1) % ordem.length];
    aplicarFundoTexto();
});
// Adesivo "Treino de hoje": usa o último treino das últimas 24h
$('#scAdesivo').addEventListener('click', async () => {
    const st = $('#scSticker');
    if (sc.adesivo) { sc.adesivo = null; st.classList.add('hidden'); atualizarBotaoPublicarStory(); return; }
    const { data } = await sb.from('posts').select('activity_type, duration_min, distance_km')
        .eq('user_id', state.session.user.id).eq('kind', 'workout')
        .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
        .order('created_at', { ascending: false }).limit(1);
    const w = data && data[0];
    if (!w) { toast('Registre um treino hoje pra usar o adesivo', 'err'); return; }
    const partes = [`${WORKOUT_EMOJI[w.activity_type] || '💪'} ${w.activity_type || 'Treino'}`];
    const km = Number(w.distance_km || 0);
    if (km) partes.push(`${String(km).replace('.', ',')} km`);
    if (w.duration_min) partes.push(`${w.duration_min} min`);
    if (km && w.duration_min && (w.activity_type === 'Corrida' || w.activity_type === 'Caminhada')) partes.push(formatarPace(w.duration_min, km));
    sc.adesivo = partes.join(' · ');
    if (!sc.adesivoPos) sc.adesivoPos = { x: 50, y: sc.mode === 'photo' ? 62 : 72 };
    st.textContent = sc.adesivo + '  ·  Pulso';
    posicionar(st, sc.adesivoPos);
    st.classList.remove('hidden');
    atualizarBotaoPublicarStory();
});
$('#scStage').addEventListener('click', e => {
    if (sc.mode === 'text' && e.target.id === 'scStage') $('#scText').focus();
    $('#scSwatches').classList.add('hidden');
    $('#scPaleta').classList.add('hidden');
});

$('#scPublish').addEventListener('click', async () => {
    if (sc.busy) return;
    const btn = $('#scPublish');
    const caption = $('#scText').value.trim();
    if (sc.mode === 'text' && !caption && !sc.adesivo) return;
    if (sc.mode === 'photo' && !sc.file) return;
    sc.busy = true;
    btn.disabled = true;
    $('#scPublicarGrande').classList.add('enviando');
    btn.textContent = sc.file ? 'Enviando...' : 'Publicando...';
    let imageUrl = null;
    try {
        if (sc.mode === 'photo') {
            imageUrl = await uploadImage('post-images', sc.file);
            btn.textContent = 'Verificando...';
            try {
                const { data: mod } = await sb.functions.invoke('vision-tools', { body: { task: 'moderate', imageUrl } });
                if (mod && mod.safe === false) {
                    await removeStoredImage(imageUrl);
                    toast(mod.reason || 'Essa foto não pode ser publicada.', 'err');
                    return;
                }
            } catch (e) { console.warn('moderação indisponível', e); }
        }
        const style = { font: sc.fonte, fundo: sc.fundoTxt };
        if (sc.mode === 'photo') style.pos = sc.pos;
        if (sc.mode === 'text') { style.align = sc.alinhar; if (sc.corLetra) style.color = sc.corLetra; }
        if (sc.adesivo) { style.sticker = sc.adesivo; style.stickerPos = sc.adesivoPos; }
        if (state.storyResumoSemana) style.resumo_semana = state.storyResumoSemana;

        const { data: story, error } = await sb.from('stories').insert({
            user_id: state.session.user.id,
            caption: caption || null,
            image_url: imageUrl,
            background_color: imageUrl ? null : sc.bg,
            style,
        }).select().single();
        if (error) throw error;

        if (state.storyResumoSemana) {
            lsSet('pulso-resumo-postado-' + state.session.user.id, state.storyResumoSemana);
            state.storyResumoSemana = null;
            const rs = document.getElementById('resumoSlot'); if (rs) rs.innerHTML = '';
            const se = document.getElementById('semanaEvoSlot'); if (se) se.innerHTML = '';
        }
        const { data: stPts } = await sb.rpc('points_for_reference', { ref: story.id });
        const ganhos = Number(stPts || 0);
        await loadScore();
        closeStoryCreator();
        toast(ganhos > 0 ? `+${ganhos} pontos! Story publicado` : 'Story publicado', 'ok');
        if (state.view === 'feed') await renderFeed();
        else if (state.view === 'profile') await renderProfile();
    } catch (err) {
        console.error(err);
        toast(msgErro(err), 'err');
    } finally {
        sc.busy = false;
        btn.disabled = false;
        $('#scPublicarGrande').classList.remove('enviando');
        btn.textContent = 'Publicar';
    }
});


// ============================================================
// STORY VIEWER
// ============================================================
async function openStoryViewer(groupIdx) {
    state.storyIdx = groupIdx;
    state.storyItemIdx = 0;
    $('#storyViewer').classList.add('on');
    document.body.style.overflow = 'hidden';
    showCurrentStory();
}

function closeStoryViewer() {
    state.storyCurtidosVistos = {};
    $('#storyViewer').classList.remove('on', 'paused');
    setTimeout(sincronizarModoTela, 0);
    state.storyAtual = null;
    document.body.style.overflow = '';
    clearTimeout(state.storyTimer);
}

function showCurrentStory() {
    const group = state.storiesData[state.storyIdx];
    if (!group) { closeStoryViewer(); return; }
    const item = group.items[state.storyItemIdx];
    if (!item) {
        // avança pro próximo grupo
        state.storyIdx++;
        state.storyItemIdx = 0;
        if (state.storyIdx >= state.storiesData.length) { closeStoryViewer(); return; }
        showCurrentStory();
        return;
    }

    // Progress bars
    const progressHTML = group.items.map((_, i) => {
        const cls = i < state.storyItemIdx ? 'done' : i === state.storyItemIdx ? 'active' : '';
        return `<div class="story-progress-bar ${cls}"><div class="fill"></div></div>`;
    }).join('');
    $('#storyProgress').innerHTML = progressHTML;

    // Header
    $('#svAvatar').outerHTML = avatarHTML(group.user, 'sm').replace('class="avatar avatar-sm"', 'class="avatar" id="svAvatar"');
    const ehMeu = group.user.id === state.session.user.id;
    document.getElementById('svAvatarMais').classList.toggle('hidden', !ehMeu || !!group.destaque);
    document.getElementById('svMenu').classList.add('hidden');
    const irProAutor = ev => {
        ev.stopPropagation();
        if (ehMeu && !group.destaque) { closeStoryViewer(); openStoryCreator(); return; }
        closeStoryViewer();
        switchView(ehMeu ? 'profile' : 'user-profile', { uid: group.user.id });
    };
    document.getElementById('svAutor').onclick = irProAutor;
    document.getElementById('svMeta').onclick = ev => {
        ev.stopPropagation();
        closeStoryViewer();
        switchView(ehMeu ? 'profile' : 'user-profile', { uid: group.user.id });
    };
    $('#svName').textContent = group.user.display_name || group.user.username;
    $('#svTime').textContent = timeAgo(item.created_at);

    // Quem viu (só no seu story): barra embaixo, toque ou arraste pra cima
    const souDonoDoStory = group.user.id === state.session.user.id;
    const ehDestaque = !!group.destaque;
    const isMineStory = souDonoDoStory && !ehDestaque;
    document.getElementById('svViews').classList.add('hidden');
    const act = document.getElementById('svActivity');
    act.classList.toggle('hidden', !souDonoDoStory);
    state.storyAtual = souDonoDoStory ? item.id : null;   // story ou destaque seu: mostra quem viu
    // story de outra pessoa: curtir e responder (vai pro chat)
    const resp = document.getElementById('svResp');
    const podeResponder = !souDonoDoStory && !ehDestaque;
    resp.classList.toggle('hidden', !podeResponder);
    if (podeResponder) {
        state.storyResp = { item, user: group.user };
        const nome = String(group.user.display_name || group.user.username || '').split(' ')[0];
        const inp = document.getElementById('svRespInput');
        inp.value = '';
        inp.placeholder = `Responder pra ${nome}…`;
        document.getElementById('svRespEnviar').classList.add('hidden');
        state.storyCurtidos = state.storyCurtidos || {};
        document.getElementById('svCurtir').classList.toggle('on', !!state.storyCurtidos[item.id]);
        // busca no banco quais stories desta pessoa você já curtiu (uma vez por pessoa)
        state.storyCurtidosVistos = state.storyCurtidosVistos || {};
        if (!state.storyCurtidosVistos[group.user.id]) {
            state.storyCurtidosVistos[group.user.id] = true;
            const ids = group.items.map(x => x.id);
            sb.rpc('minhas_curtidas_story', { ids }).then(({ data }) => {
                ids.forEach(id => { if (state.storyCurtidos[id] === undefined) state.storyCurtidos[id] = false; });
                (data || []).forEach(x => { state.storyCurtidos[x.story_id] = true; });
                const atual = state.storyResp && state.storyResp.item;
                if (atual && ids.includes(atual.id)) document.getElementById('svCurtir').classList.toggle('on', !!state.storyCurtidos[atual.id]);
            });
        }
    } else state.storyResp = null;
    const destBtn = document.getElementById('svDestacar');
    destBtn.classList.toggle('hidden', !isMineStory && !(ehDestaque && souDonoDoStory));
    destBtn.querySelector('span').textContent = ehDestaque ? 'Editar destaque' : 'Destacar';
    document.getElementById('svMais').classList.toggle('hidden', !souDonoDoStory);
    destBtn.onclick = ev => {
        ev.stopPropagation();
        if (ehDestaque) { closeStoryViewer(); abrirEditorDestaque(group.destaque); }
        else abrirEscolhaDestaque(item);
    };
    if (souDonoDoStory) {
        state.storyViewers = state.storyViewers || {};
        state.storyViewersReq = state.storyViewersReq || {};
        if (!state.storyViewersReq[item.id]) {
            state.storyViewersReq[item.id] = (ehDestaque ? sb.rpc('destaque_viewers', { iid: item.id }) : sb.rpc('story_viewers', { sid: item.id }))
                .then(r => { state.storyViewers[item.id] = r.data || []; return r; });
        }
        document.getElementById('svActivityN').textContent = '';
        state.storyViewersReq[item.id].then(r => {
            if (state.storyAtual !== item.id) return;
            const n = (r.data || []).length;
            document.getElementById('svActivityN').textContent = n;
            document.getElementById('svActivityLbl').textContent = n === 1 ? 'visualização' : 'visualizações';
        });
    }

    // Apagar o próprio story
    const delBtn = document.getElementById('svDelete');
    delBtn.classList.toggle('hidden', !souDonoDoStory);
    document.getElementById('svDeleteLbl').textContent = ehDestaque ? 'Tirar do destaque' : 'Apagar story';
    delBtn.onclick = async (ev) => {
        ev.stopPropagation();
        clearTimeout(state.storyTimer);
        if (!(await confirmar(ehDestaque ? 'Tirar este story do destaque?' : 'Apagar este story?'))) { state.storyTimer = setTimeout(() => advanceStory(1), 6000); return; }
        const { error } = ehDestaque
            ? await sb.from('story_highlight_items').delete().eq('id', item.id)
            : await sb.from('stories').delete().eq('id', item.id);
        if (!error && ehDestaque && group.items.length === 1) {
            await sb.from('story_highlights').delete().eq('id', group.destaque);
        }
        if (error) { toast('Erro ao apagar story', 'err'); return; }
        // apaga a foto do armazenamento se ela não estiver em nenhum destaque
        if (!ehDestaque && item.image_url) {
            sb.from('story_highlight_items').select('id').eq('image_url', item.image_url).limit(1)
                .then(({ data }) => { if (!data || !data.length) removeStoredImage(item.image_url); });
        }
        toast(ehDestaque ? 'Tirado do destaque' : 'Story apagado', 'ok');
        group.items.splice(state.storyItemIdx, 1);
        if (group.items.length === 0) {
            state.storiesData.splice(state.storyIdx, 1);
            closeStoryViewer();
            if (state.view === 'feed') renderFeed();
            else if (state.view === 'profile') renderProfile();
            return;
        }
        if (state.storyItemIdx >= group.items.length) state.storyItemIdx = group.items.length - 1;
        showCurrentStory();
    };

    // Content
    const content = $('#svContent');
    const st = item.style || {};
    const adesivoHTML = st.sticker
        ? `<div class="sv-sticker" style="left:${(st.stickerPos || { x: 50 }).x}%;top:${(st.stickerPos || { y: 72 }).y}%">${escapeHTML(st.sticker)}  ·  Pulso</div>` : '';
    if (item.image_url) {
        content.className = 'story-content';
        content.style.background = '#000';
        const e = estiloTextoStory(st, (item.caption || '').length, true);
        const pos = st.pos || null;
        content.innerHTML = `<img src="${item.image_url}">
            ${item.caption ? `<div class="caption-over ${e.cls} fundo-${st.fundo || 'escuro'}${pos ? ' posicionado' : ''}" style="font-size:${e.size}px;${pos ? `left:${pos.x}%;top:${pos.y}%` : ''}">${escapeHTML(item.caption)}</div>` : ''}
            ${adesivoHTML}
            <div class="story-nav-zones"><div id="svPrev"></div><div id="svNext"></div></div>`;
    } else {
        // Story de texto puro
        content.className = 'story-content text-story';
        const fundo = item.background_color || STORY_BG_PADRAO;
        content.style.background = fundo;
        const e = estiloTextoStory(st, (item.caption || '').length, false);
        const alin = st.align || 'center';
        const marca = st.fundo && st.fundo !== 'nenhum' ? st.fundo : null;
        content.innerHTML = `${item.caption ? `<div class="text-body ${e.cls}" style="color:${st.color || corDeTextoPara(fundo)};font-size:${e.size}px;text-align:${alin}">${marca ? `<span class="marcador-${marca}">${escapeHTML(item.caption)}</span>` : escapeHTML(item.caption)}</div>` : ''}
            ${adesivoHTML}
            <div class="story-nav-zones"><div id="svPrev"></div><div id="svNext"></div></div>`;
    }

    // Marca como visto (story e destaque contam separado)
    if (group.user.id !== state.session.user.id) {
        if (ehDestaque) sb.rpc('registrar_view_destaque', { iid: item.id }).then(() => {});
        else sb.from('story_views').insert({ story_id: item.id, viewer_id: state.session.user.id }).then(() => {});
    }

    // Handlers nav
    ligarToqueStory(document.getElementById('svPrev'), -1);
    ligarToqueStory(document.getElementById('svNext'), 1);

    // Auto-avança em 6s (só se não tem imagem, senão espera load)
    clearTimeout(state.storyTimer);
    state.storyRestante = 6000;
    state.storyInicio = Date.now();
    state.storyTimer = setTimeout(() => advanceStory(1), 6000);
}

// ---- Destaques de stories ----
async function carregarDestaques(uid) {
    const { data } = await sb.from('story_highlights')
        .select('id, title, cover_url, created_at, story_highlight_items (id, image_url, background_color, created_at)')
        .eq('user_id', uid).order('created_at', { ascending: true });
    return (data || []).filter(h => (h.story_highlight_items || []).length);
}
function destaquesHTML(lista, uid) {
    const meu = uid === state.session.user.id;
    if ((!lista || !lista.length) && !meu) return '';
    const novo = meu ? `<button class="destaque" data-act="novo-destaque">
            <span class="destaque-capa destaque-novo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></span>
            <span class="destaque-nome">Novo</span>
        </button>` : '';
    return `<div class="destaques">${(lista || []).map(h => {
        const itens = [...h.story_highlight_items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const capaUrl = h.cover_url || (itens.find(i => i.image_url) || {}).image_url;
        const fundo = capaUrl ? `background-image:url('${capaUrl}')` : `background:${itens[0].background_color || STORY_BG_PADRAO}`;
        return `<button class="destaque" data-act="abrir-destaque" data-id="${h.id}" data-uid="${uid}">
            <span class="destaque-capa" style="${fundo}"></span>
            <span class="destaque-nome">${escapeHTML(h.title)}</span>
        </button>`;
    }).join('')}${novo}</div>`;
}
// ---- Editor de destaque (criar ou editar, escolhendo vários stories) ----
function miniStoryHTML(x, marcado) {
    const fundo = x.image_url ? `background-image:url('${x.image_url}')` : `background:${x.background_color || STORY_BG_PADRAO}`;
    const txt = !x.image_url && x.caption ? `<span class="ed-txt" style="color:${corDeTextoPara(x.background_color || STORY_BG_PADRAO)}">${escapeHTML(x.caption.slice(0, 40))}</span>` : '';
    return `<button type="button" class="ed-item${marcado ? ' on' : ''}" style="${fundo}">
        ${txt}
        <span class="ed-data">${new Date(x.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
        <span class="ed-check"></span>
    </button>`;
}

// Editor de destaque em dois passos: 1) escolher os stories  2) capa e nome (opcional)
async function abrirEditorDestaque(hid = null, preSelecionado = null) {
    const old = document.getElementById('editorDestaque');
    if (old) old.remove();
    const v = document.createElement('div');
    v.id = 'editorDestaque';
    v.className = 'posts-viewer';
    document.body.appendChild(v);
    document.body.style.overflow = 'hidden';
    const fechar = () => { v.remove(); document.body.style.overflow = ''; };
    const seta = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    v.innerHTML = `<div class="pv-topo"><button class="topbar-back pv-voltar" aria-label="Voltar">${seta}</button><div class="topbar-title">${hid ? 'Editar destaque' : 'Novo destaque'}</div><div style="width:60px"></div></div><div class="pv-lista"><div class="spinner"></div></div>`;
    v.querySelector('.pv-voltar').onclick = fechar;

    const [{ data: arquivo }, dest, { data: itensAtuais }] = await Promise.all([
        sb.rpc('my_story_archive'),
        hid ? sb.from('story_highlights').select('id, title, cover_url').eq('id', hid).maybeSingle() : Promise.resolve({ data: null }),
        hid ? sb.from('story_highlight_items').select('id, source_story_id, image_url, caption, background_color, created_at, style').eq('highlight_id', hid)
            : Promise.resolve({ data: [] }),
    ]);
    if (!document.getElementById('editorDestaque')) return;
    const jaTem = new Set((itensAtuais || []).map(i => i.source_story_id).filter(Boolean));
    const opcoes = [
        ...(itensAtuais || []).map(i => ({ tipo: 'item', id: i.id, dado: i, on: true })),
        ...(arquivo || []).filter(st => !jaTem.has(st.id)).map(st => ({ tipo: 'story', id: st.id, dado: st, on: !!(preSelecionado && preSelecionado === st.id) })),
    ].sort((a, b) => new Date(b.dado.created_at) - new Date(a.dado.created_at));
    let nome = dest.data ? dest.data.title : '';
    let capa = dest.data ? dest.data.cover_url : null;

    // ---------- passo 1: escolher ----------
    const passo1 = () => {
        const n = opcoes.filter(o => o.on).length;
        v.innerHTML = `<div class="pv-topo">
                <button class="topbar-back pv-voltar" aria-label="Voltar">${seta}</button>
                <div class="topbar-title">${hid ? 'Editar destaque' : 'Novo destaque'}</div>
                <button class="ed-salvar" id="edProximo" ${n ? '' : 'disabled'}>Próximo${n ? ` (${n})` : ''}</button>
            </div>
            <div class="pv-lista">
                <p class="cfg-sub">Toque nos stories que vão entrar no destaque.</p>
                ${opcoes.length
                    ? `<div class="ed-grade">${opcoes.map((o, k) => miniStoryHTML(o.dado, o.on).replace('<button type="button" class="ed-item', `<button type="button" data-k="${k}" class="ed-item`)).join('')}</div>`
                    : '<div class="log-empty">Você ainda não tem stories pra destacar. Poste um e volte aqui.</div>'}
            </div>`;
        v.querySelector('.pv-voltar').onclick = fechar;
        v.querySelectorAll('.ed-item').forEach(b => b.onclick = () => {
            const o = opcoes[Number(b.dataset.k)];
            o.on = !o.on;
            b.classList.toggle('on', o.on);
            const m = opcoes.filter(x => x.on).length;
            const px = document.getElementById('edProximo');
            px.disabled = !m; px.textContent = m ? `Próximo (${m})` : 'Próximo';
        });
        document.getElementById('edProximo').onclick = passo2;
    };

    // ---------- passo 2: capa e nome ----------
    const passo2 = () => {
        const escolhidos = opcoes.filter(o => o.on);
        const comFoto = escolhidos.filter(o => o.dado.image_url);
        if (!capa || !escolhidos.some(o => o.dado.image_url === capa)) capa = comFoto.length ? comFoto[comFoto.length - 1].dado.image_url : null;
        const fundoCapa = capa ? `background-image:url('${capa}')` : `background:${(escolhidos[0] && escolhidos[0].dado.background_color) || STORY_BG_PADRAO}`;
        v.innerHTML = `<div class="pv-topo">
                <button class="topbar-back pv-voltar" aria-label="Voltar">${seta}</button>
                <div class="topbar-title">${hid ? 'Editar destaque' : 'Novo destaque'}</div>
                <button class="ed-salvar" id="edSalvar">${hid ? 'Salvar' : 'Criar'}</button>
            </div>
            <div class="pv-lista ed-passo2">
                <span class="ed-capa" style="${fundoCapa}"></span>
                ${comFoto.length > 1 ? `<p class="ed-capa-dica">Toque numa foto pra usar como capa</p>
                <div class="ed-capas">${comFoto.map(o => `<button type="button" class="ed-capa-op${o.dado.image_url === capa ? ' on' : ''}" data-capa="${o.dado.image_url}" style="background-image:url('${o.dado.image_url}')"></button>`).join('')}</div>` : ''}
                <input type="text" id="edNome" class="obj-input ed-nome" maxlength="20" placeholder="Nome do destaque (opcional)" value="${escapeHTML(nome)}">
                ${hid ? '<button class="cfg-row cfg-perigo ed-excluir" id="edExcluir"><span class="cfg-txt">Excluir destaque</span></button>' : ''}
            </div>`;
        v.querySelector('.pv-voltar').onclick = () => { nome = document.getElementById('edNome').value; passo1(); };
        v.querySelectorAll('[data-capa]').forEach(b => b.onclick = () => { nome = document.getElementById('edNome').value; capa = b.dataset.capa; passo2(); });
        const exc = document.getElementById('edExcluir');
        if (exc) exc.onclick = async () => {
            if (!(await confirmar('Excluir este destaque? Os stories originais não são apagados.', 'Excluir', true))) return;
            const { error } = await sb.from('story_highlights').delete().eq('id', hid);
            if (error) { toast(msgErro(error), 'err'); return; }
            fechar(); toast('Destaque excluído', 'ok');
            if (state.view === 'profile') renderProfile();
        };
        document.getElementById('edSalvar').onclick = async () => {
            const titulo = document.getElementById('edNome').value.trim() || 'Destaque';
            const btn = document.getElementById('edSalvar');
            btnCarregando(btn, true);
            try {
                let id = hid;
                if (!id) {
                    const { data: h, error } = await sb.from('story_highlights')
                        .insert({ user_id: state.session.user.id, title: titulo, cover_url: capa }).select().single();
                    if (error) throw error;
                    id = h.id;
                } else {
                    const { error } = await sb.from('story_highlights').update({ title: titulo, cover_url: capa }).eq('id', id);
                    if (error) throw error;
                }
                const remover = opcoes.filter(o => o.tipo === 'item' && !o.on).map(o => o.id);
                if (remover.length) {
                    const { error } = await sb.from('story_highlight_items').delete().in('id', remover);
                    if (error) throw error;
                }
                const novos = escolhidos.filter(o => o.tipo === 'story').map(o => ({
                    highlight_id: id, source_story_id: o.dado.id,
                    image_url: o.dado.image_url || null, caption: o.dado.caption || null, style: o.dado.style || null,
                    background_color: o.dado.image_url ? null : (o.dado.background_color || STORY_BG_PADRAO),
                    created_at: o.dado.created_at,
                }));
                if (novos.length) {
                    const { error } = await sb.from('story_highlight_items').insert(novos);
                    if (error) throw error;
                }
                fechar();
                toast(hid ? 'Destaque atualizado' : 'Destaque criado', 'ok');
                if (state.view === 'profile') renderProfile();
            } catch (err) {
                toast(msgErro(err), 'err');
                btnCarregando(btn, false);
            }
        };
    };
    if (preSelecionado && opcoes.some(o => o.on)) passo2(); else passo1();
}

// Abre um destaque (seu ou de outra pessoa) no visualizador de stories
async function abrirDestaque(hid, uid) {
    const [{ data: h }, { data: itens }, { data: autor }] = await Promise.all([
        sb.from('story_highlights').select('id, title').eq('id', hid).maybeSingle(),
        sb.from('story_highlight_items').select('id, caption, image_url, background_color, style, created_at')
            .eq('highlight_id', hid).order('created_at', { ascending: true }),
        sb.from('profiles').select('id, username, display_name, avatar_url').eq('id', uid).maybeSingle(),
    ]);
    if (!h || !itens || !itens.length) { toast('Esse destaque está vazio.', 'err'); return; }
    state.storiesData = [{ user: autor || { id: uid }, items: itens, destaque: hid }];
    openStoryViewer(0);
}
async function abrirEscolhaDestaque(item) {
    pausarStory();
    const { data: meus } = await sb.from('story_highlights').select('id, title')
        .eq('user_id', state.session.user.id).order('created_at', { ascending: true });
    const old = document.getElementById('peopleSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'peopleSheet';
    sheet.className = 'sheet on sheet-over-story';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Destacar no perfil</h3>
        <p class="sheet-sub">Destaques ficam no seu perfil depois das 24h, com a mesma privacidade da sua conta.</p>
        <div class="dest-escolha">
            ${(meus || []).map(h => `<button class="cfg-row" data-dest-id="${h.id}">${icon('salvo')}<span class="cfg-txt">${escapeHTML(h.title)}</span></button>`).join('')}
        </div>
        <button class="cfg-row dest-novo-linha" id="destNovoBtn">${icon('mais')}<span class="cfg-txt">Novo destaque</span></button>
    </div>`;
    document.body.appendChild(sheet);
    const fechar = () => { sheet.remove(); retomarStory(); };
    sheet.onclick = e => { if (e.target === sheet) fechar(); };
    const adicionar = async (hid) => {
        const { error } = await sb.from('story_highlight_items').insert({
            highlight_id: hid, source_story_id: item.id, image_url: item.image_url || null, caption: item.caption || null, style: item.style || null,
            background_color: item.image_url ? null : (item.background_color || STORY_BG_PADRAO),
            created_at: item.created_at,
        });
        if (error) { toast(msgErro(error), 'err'); return; }
        toast('Adicionado ao destaque', 'ok');
        fechar();
    };
    sheet.querySelectorAll('[data-dest-id]').forEach(b => b.onclick = () => adicionar(b.dataset.destId));
    document.getElementById('destNovoBtn').onclick = () => {
        sheet.remove();
        closeStoryViewer();
        abrirEditorDestaque(null, item.id); // já vai pro passo de capa e nome, com este story escolhido
    };
}

// Pausa o story enquanto a lista de quem viu está aberta
// Toque rápido passa o story; segurar o dedo pausa (igual ao Instagram)
function ligarToqueStory(zona, direcao) {
    if (!zona) return;
    let timerSegurar = null, segurou = false;
    const soltar = () => {
        clearTimeout(timerSegurar);
        if (segurou) {
            segurou = false;
            $('#storyViewer').classList.remove('segurando');
            retomarStoryDoPonto();
        }
    };
    zona.addEventListener('pointerdown', () => {
        segurou = false;
        timerSegurar = setTimeout(() => {
            segurou = true;
            $('#storyViewer').classList.add('segurando');
            pausarStoryNoPonto();
        }, 220);
    });
    zona.addEventListener('pointerup', e => {
        if (segurou) { e.preventDefault(); soltar(); return; }
        clearTimeout(timerSegurar);
        advanceStory(direcao);
    });
    zona.addEventListener('pointerleave', soltar);
    zona.addEventListener('pointercancel', soltar);
    zona.addEventListener('contextmenu', e => e.preventDefault());
}
// Pausa guardando quanto tempo falta, pra continuar do mesmo ponto
function pausarStoryNoPonto() {
    clearTimeout(state.storyTimer);
    const decorrido = Date.now() - (state.storyInicio || Date.now());
    state.storyRestante = Math.max(300, (state.storyRestante || 6000) - decorrido);
    $('#storyViewer').classList.add('paused');
}
function retomarStoryDoPonto() {
    $('#storyViewer').classList.remove('paused');
    if (!$('#storyViewer').classList.contains('on')) return;
    state.storyInicio = Date.now();
    clearTimeout(state.storyTimer);
    state.storyTimer = setTimeout(() => advanceStory(1), state.storyRestante || 6000);
}

function pausarStory() {
    clearTimeout(state.storyTimer);
    $('#storyViewer').classList.add('paused');
}
function retomarStory() {
    $('#storyViewer').classList.remove('paused');
    if ($('#storyViewer').classList.contains('on')) showCurrentStory();
}

// ---- Story: curtir (fica só pra dona ver) e responder (vai pro chat) ----
const MARCA_STORY = '⟦story⟧';
function corpoComStory(item, texto) {
    const ref = { id: item.id, img: item.image_url || null, bg: item.image_url ? null : (item.background_color || null), txt: item.image_url ? null : String(item.caption || '').slice(0, 60) };
    return MARCA_STORY + JSON.stringify(ref) + '\n' + texto;
}
function lerStoryDaMensagem(body) {
    const b = String(body || '');
    if (!b.startsWith(MARCA_STORY)) return null;
    const fim = b.indexOf('\n');
    try { return { ref: JSON.parse(b.slice(MARCA_STORY.length, fim)), texto: b.slice(fim + 1) }; } catch (_) { return null; }
}
const previaMensagem = body => {
    const st = lerStoryDaMensagem(body);
    if (st) return 'Respondeu ao story: ' + textoLimpo(body);
    return textoLimpo(body);
};

document.getElementById('svCurtir').addEventListener('click', async e => {
    e.stopPropagation();
    const r = state.storyResp; if (!r) return;
    const btn = e.currentTarget;
    const curtir = !btn.classList.contains('on');
    btn.classList.toggle('on', curtir);
    if (curtir) { btn.classList.remove('pulso'); void btn.offsetWidth; btn.classList.add('pulso'); }
    state.storyCurtidos[r.item.id] = curtir;
    const { error } = await sb.rpc('curtir_story', { sid: r.item.id, curtir });
    if (error) { btn.classList.toggle('on', !curtir); state.storyCurtidos[r.item.id] = !curtir; }
});
const respInput = document.getElementById('svRespInput');
respInput.addEventListener('focus', () => { pausarStoryNoPonto(); $('#storyViewer').classList.add('respondendo'); });
respInput.addEventListener('blur', () => {
    setTimeout(() => {
        $('#storyViewer').classList.remove('respondendo');
        if (!respInput.value.trim() && $('#storyViewer').classList.contains('on')) retomarStoryDoPonto();
    }, 150);
});
respInput.addEventListener('input', () => document.getElementById('svRespEnviar').classList.toggle('hidden', !respInput.value.trim()));
respInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviarRespostaStory(); } });
document.getElementById('svRespEnviar').addEventListener('click', e => { e.stopPropagation(); enviarRespostaStory(); });
['click', 'pointerdown', 'pointerup'].forEach(ev => document.getElementById('svResp').addEventListener(ev, e => e.stopPropagation()));

async function enviarRespostaStory() {
    const r = state.storyResp;
    const texto = respInput.value.trim();
    if (!r || !texto) return;
    const btn = document.getElementById('svRespEnviar');
    btn.disabled = true;
    const { data: convId, error } = await sb.rpc('get_or_create_conversation', { other_id: r.user.id });
    if (error) {
        btn.disabled = false;
        const t = String(error.message || '');
        toast(t.includes('dm_ninguem') ? 'Essa pessoa não está recebendo mensagens.' : t.includes('dm_seguidores') ? 'Essa pessoa só recebe mensagem de quem a segue.' : 'Não consegui enviar agora.', 'err');
        return;
    }
    const { error: e2 } = await sb.from('messages').insert({ conversation_id: convId, sender_id: state.session.user.id, body: corpoComStory(r.item, texto) });
    btn.disabled = false;
    if (e2) { toast('Não consegui enviar agora.', 'err'); return; }
    respInput.value = '';
    btn.classList.add('hidden');
    respInput.blur();
    toast('Enviado no chat', 'ok');
}

function abrirQuemViuStory() {
    const sid = state.storyAtual;
    if (!sid) return;
    pausarStory();
    const old = document.getElementById('peopleSheet');
    if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'peopleSheet';
    sheet.className = 'sheet on sheet-over-story';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Quem viu</h3>
        <p class="sheet-sub">Só você vê essa lista.</p>
        <div id="peopleBody" class="follow-list"><div class="spinner"></div></div>
    </div>`;
    document.body.appendChild(sheet);
    const fechar = () => { sheet.remove(); retomarStory(); };
    sheet.onclick = e => { if (e.target === sheet) fechar(); };
    // arrastar a folha pra baixo também fecha
    let y0 = null;
    const card = sheet.querySelector('.sheet-card');
    card.addEventListener('touchstart', e => { y0 = card.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    card.addEventListener('touchend', e => {
        if (y0 != null && e.changedTouches[0].clientY - y0 > 70) fechar();
        y0 = null;
    });

    const pronto = state.storyViewers && state.storyViewers[sid];
    const req = pronto ? Promise.resolve({ data: pronto }) : state.storyViewersReq[sid];
    req.then(({ data, error }) => {
        const body = document.getElementById('peopleBody');
        if (!body) return;
        if (error) { body.innerHTML = `<p style="color:var(--danger)">Erro: ${escapeHTML(error.message)}</p>`; return; }
        if (!data || !data.length) { body.innerHTML = '<div class="log-empty">Ninguém viu ainda.</div>'; return; }
        body.innerHTML = data.map(u => `<div class="follow-row" data-act="view-user" data-uid="${u.id}">
            ${avatarHTML(u, 'sm')}
            <div style="flex:1;min-width:0">
                <div class="follow-name">${escapeHTML(u.display_name)}</div>
                <div class="follow-uname">@${escapeHTML(u.username)}</div>
            </div>
            ${u.liked ? '<span class="people-curtiu" aria-label="Curtiu"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></span>' : ''}
            <span class="people-time">${timeAgo(u.viewed_at)}</span>
        </div>`).join('');
        // abrir um perfil fecha o story
        body.querySelectorAll('.follow-row').forEach(r => r.addEventListener('click', () => {
            sheet.remove();
            $('#storyViewer').classList.remove('paused');
            closeStoryViewer();
        }));
    });
}

document.getElementById('svActivity').addEventListener('click', e => { e.stopPropagation(); abrirQuemViuStory(); });
document.getElementById('svMais').addEventListener('click', e => {
    e.stopPropagation();
    const m = document.getElementById('svMenu');
    const abrir = m.classList.contains('hidden');
    m.classList.toggle('hidden', !abrir);
    if (abrir) pausarStory(); else retomarStory();
});
document.getElementById('svMenu').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('svMenu').classList.add('hidden');
});
document.getElementById('svAdd').addEventListener('click', e => {
    e.stopPropagation();
    closeStoryViewer();
    openStoryCreator();
});
(function gestoArrastarPraCima() {
    const v = document.getElementById('storyViewer');
    let x0 = 0, y0 = 0;
    v.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    v.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.5 && state.storyAtual) abrirQuemViuStory();
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) closeStoryViewer();
    });
})();

function advanceStory(dir) {
    clearTimeout(state.storyTimer);
    if ($('#storyViewer').classList.contains('paused')) return;
    const group = state.storiesData[state.storyIdx];
    if (!group) { closeStoryViewer(); return; }
    if (dir > 0) {
        state.storyItemIdx++;
        if (state.storyItemIdx >= group.items.length) {
            state.storyIdx++;
            state.storyItemIdx = 0;
            if (state.storyIdx >= state.storiesData.length) { closeStoryViewer(); return; }
        }
    } else {
        state.storyItemIdx--;
        if (state.storyItemIdx < 0) {
            state.storyIdx--;
            if (state.storyIdx < 0) { state.storyIdx = 0; state.storyItemIdx = 0; }
            else state.storyItemIdx = state.storiesData[state.storyIdx].items.length - 1;
        }
    }
    showCurrentStory();
}

document.getElementById('svClose').onclick = closeStoryViewer;

// ============================================================
// COMPOSER
// ============================================================
function atualizarCamposTreino() {
    const tipo = $('#wType').value;
    const temKm = ATIVIDADES_COM_KM.includes(tipo);
    $('#wDistField').classList.toggle('hidden', !temKm);
    $('#wMuscleField').classList.toggle('hidden', tipo !== 'Musculação');
    const km = parseFloat(String($('#wDistance').value).replace(',', '.'));
    const min = parseInt($('#wDuration').value);
    const pace = (tipo === 'Corrida' || tipo === 'Caminhada') ? formatarPace(min, km) : '';
    const vel = (tipo === 'Ciclismo' && km > 0 && min > 0) ? (km / (min / 60)).toFixed(1).replace('.', ',') + ' km/h de média' : '';
    $('#wPace').textContent = pace ? 'Ritmo: ' + pace : vel;
}
$('#wType').addEventListener('change', atualizarCamposTreino);
$('#wDistance').addEventListener('input', atualizarCamposTreino);
$('#wDuration').addEventListener('input', atualizarCamposTreino);
document.querySelector('.stepper[data-target="wDuration"]').addEventListener('click', () => setTimeout(atualizarCamposTreino, 0));
$('#wMuscles').addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (!c) return;
    if (c.dataset.m === 'Corpo todo') {
        const liga = !c.classList.contains('on');
        $$('#wMuscles .chip').forEach(x => x.classList.toggle('on', x === c && liga));
    } else {
        c.classList.toggle('on');
        const todo = document.querySelector('#wMuscles .chip[data-m="Corpo todo"]');
        if (todo) todo.classList.remove('on');
    }
});

const KIND_TITLES = { workout:'Treino', meal:'Refeição', water:'Água', sleep:'Sono', post:'Novo post' };

function abrirComposer() {
    $('#composerSheet').classList.add('on');
    document.body.style.overflow = 'hidden';
}
function mostrarEscolhaDeTipo() {
    $('#composerPick').classList.remove('hidden');
    $('#composerForm').classList.add('hidden');
}
function limparComposer() {
    $('#pCaption').value = '';
    $('#pPhotoCam').value = '';
    $('#pPhotoGal').value = '';
    $('#pPhotoPreview').classList.remove('on');
    $('#pPhotoClear').classList.add('hidden');
    $('#lerPrintBtn').classList.add('hidden');
    state.composerPhoto = null;
    state.composerDest = 'log';
    $('#wDistance').value = '';
    $$('#wMuscles .chip').forEach(x => x.classList.remove('on'));
    state.treinoCom = []; pintarTreinoCom();
}

// + central: primeiro só os ícones, o formulário vem depois
$('#postFab').addEventListener('click', () => {
    $('#tileDesafio').classList.toggle('hidden', !podeCriarDesafio());
    limparComposer();
    mostrarEscolhaDeTipo();
    abrirComposer();
    dicaDoMais();
});
// + do feed: vai direto pro post livre
$('#feedPostBtn').addEventListener('click', () => {
    limparComposer();
    setComposerKind('post');
    abrirComposer();
});
$('#composerBack').addEventListener('click', () => {
    limparComposer();
    mostrarEscolhaDeTipo();
});
$('#composerCancel').addEventListener('click', closeComposer);
$('#composerSheet').addEventListener('click', e => { if (e.target.id === 'composerSheet') closeComposer(); });

function closeComposer() {
    $('#composerSheet').classList.remove('on');
    document.body.style.overflow = '';
    limparComposer();
    mostrarEscolhaDeTipo();
    updateDestUI();
}

// Registro por texto ou voz: a IA preenche o formulário e a pessoa confere antes de salvar
async function enviarRegistroIA() {
    const campo = $('#iaTexto');
    const texto = campo.value.trim();
    if (!texto) return;
    const btn = $('#iaEnviar');
    btn.disabled = true; btn.classList.add('girando');
    try {
        const r = await interpretarRegistro(texto);
        if (!r || !r.kind) { toast('Não entendi bem. Tenta de outro jeito, ex: "caminhei 40 minutos".', 'err'); return; }
        campo.value = '';
        setComposerKind(r.kind);
        if (r.kind === 'workout') {
            if (TIPOS_TREINO.includes(r.activity_type)) $('#wType').value = r.activity_type;
            if (r.duration_min) $('#wDuration').value = Math.round(r.duration_min);
            if (r.distance_km) $('#wDistance').value = r.distance_km;
            atualizarCamposTreino();
        } else if (r.kind === 'water' && r.water_ml) {
            $('#wMl').value = Math.round(r.water_ml);
        } else if (r.kind === 'sleep' && r.sleep_hours) {
            $('#skHours').value = r.sleep_hours;
        }
        if (r.legenda) $('#pCaption').value = r.legenda;
        toast('Preenchi pra você. Confere e salva.', 'ok');
    } catch (e) {
        console.warn(e);
        toast('Não consegui interpretar agora. Use os ícones abaixo.', 'err');
    } finally {
        btn.disabled = false; btn.classList.remove('girando');
    }
}
$('#iaEnviar').addEventListener('click', enviarRegistroIA);
$('#iaTexto').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviarRegistroIA(); } });
(function ligarMicrofone() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // no iPhone, o ditado do próprio teclado resolve
    const mic = $('#iaMic');
    mic.classList.remove('hidden');
    mic.addEventListener('click', () => {
        const rec = new SR();
        rec.lang = 'pt-BR'; rec.interimResults = false; rec.maxAlternatives = 1;
        mic.classList.add('ouvindo');
        rec.onresult = ev => { $('#iaTexto').value = ev.results[0][0].transcript; enviarRegistroIA(); };
        rec.onend = () => mic.classList.remove('ouvindo');
        rec.onerror = () => { mic.classList.remove('ouvindo'); toast('Não consegui ouvir. Tenta escrever.', 'err'); };
        rec.start();
    });
})();

$$('.kind-tile').forEach(b => b.addEventListener('click', e => {
    const kind = e.currentTarget.dataset.kind;
    if (kind === 'story') { closeComposer(); openStoryCreator(); return; }
    if (kind === 'challenge') { closeComposer(); openNewChallengeSheet(); return; }
    setComposerKind(kind);
}));

function setComposerKind(kind) {
    state.composerKind = kind;
    $('#composerSheet').classList.toggle('modo-treino', kind === 'workout');
    ['meal', 'water', 'sleep'].forEach(k => $('#composerSheet').classList.toggle('modo-' + k, kind === k));
    $('#composerSheet').classList.toggle('modo-novo', ['workout', 'meal', 'water', 'sleep'].includes(kind));
    if (kind === 'workout') montarFormTreino();
    if (kind === 'water') { $('#wMl').value = 250; sincronizarContadores(); carregarAguaHoje(); }
    if (kind === 'meal') { marcarSlotRefeicao(); atualizarFotoRefeicao(); }
    setTimeout(sincronizarContadores, 0);
    $('#composerPick').classList.add('hidden');
    $('#composerForm').classList.remove('hidden');
    $('#composerTitle').textContent = KIND_TITLES[kind] || 'Registrar';
    // Post livre abre direto, sem passo de escolha: não tem pra onde voltar
    $('#composerBack').classList.toggle('hidden', kind === 'post');

    $('#workoutFields').classList.toggle('hidden', kind !== 'workout');
    $('#mealFields').classList.toggle('hidden', kind !== 'meal');
    $('#waterFields').classList.toggle('hidden', kind !== 'water');
    $('#sleepFields').classList.toggle('hidden', kind !== 'sleep');
    if (kind === 'water') refreshWaterProgress();
    if (kind === 'sleep') prepararSono();
    if (kind === 'meal') refreshMealSlots();
    if (kind === 'workout') atualizarCamposTreino();

    // Refeição é dado pessoal: por padrão só a própria pessoa vê.
    state.composerPrivacy = kind === 'meal' ? 'private' : (state.defaultPrivacy || 'public');
    updatePrivacyChip();

    const hint = $('#photoHint');
    if (kind === 'workout') hint.textContent = '(opcional, +3 pts se anexar)';
    else if (kind === 'meal') hint.textContent = '(só com foto a IA analisa e vale 1 ponto)';
    else if (kind === 'post') hint.textContent = '(obrigatória)';
    $('#pCaption').placeholder = kind === 'post' ? 'Escreva uma legenda...' : 'Conta pra gente como foi...';

    state.composerDest = kind === 'post' ? 'feed' : 'log';
    updateDestUI();
    const card = document.querySelector('#composerSheet .sheet-card');
    if (card) card.scrollTop = 0;
}

// Privacy chip: abre/fecha popover
$('#privacyChip').addEventListener('click', e => {
    e.stopPropagation();
    const menu = $('#privacyMenu');
    const chip = $('#privacyChip');
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    chip.setAttribute('aria-expanded', String(!isOpen));
});

// Privacy option: escolher e fechar
$$('.privacy-opt').forEach(opt => opt.addEventListener('click', e => {
    state.composerPrivacy = e.currentTarget.dataset.privacy;
    updatePrivacyChip();
    $('#privacyMenu').classList.add('hidden');
    $('#privacyChip').setAttribute('aria-expanded', 'false');
}));

// Fecha popover ao clicar fora
document.addEventListener('click', e => {
    if (!e.target.closest('#privacySection')) {
        const menu = $('#privacyMenu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            $('#privacyChip').setAttribute('aria-expanded', 'false');
        }
    }
});

// ============================================================
// REGISTRO DE TREINO MINIMALISTA
// ============================================================
const ICONES_ATIVIDADE = {
    'Musculação': '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
    'Corrida': '<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v4M6 12l3-3 4 1 3 4h3"/>',
    'Caminhada': '<circle cx="12" cy="4.5" r="1.8"/><path d="M10 21l2-7 3 3v4M9 12l1-4 4 1 2 3"/>',
    'Ciclismo': '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l2 7"/>',
    'Natação': '<path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 13l4-5 5 3"/><circle cx="17" cy="6" r="1.8"/>',
    'Yoga': '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 7v6M5 10l7 3 7-3M8 21l4-8 4 8"/>',
    'Pilates': '<circle cx="6" cy="9" r="1.8"/><path d="M3 20h18M7.5 11.5L12 16h6M9 13l-3 3"/><circle cx="18.5" cy="16" r="1"/>',
    'Dança': '<circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l3-7-3-3 4-3 3 4h3M12 14l4 7"/>',
    'Alongamento': '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 9h16M12 9v6l-4 6M12 15l4 6"/>',
    'Futebol': '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
    'Outro': '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
};
const NOME_CURTO_ATIV = { 'Ciclismo': 'Bike' };

function montarFormTreino() {
    // atividades em ordem do que a pessoa mais usa
    let uso = {};
    try { uso = JSON.parse(localStorage.getItem('pulso-uso-atividades') || '{}'); } catch (_) {}
    const todas = [...$('#wType').options].map(o => o.value);
    const ordem = [...todas].sort((a, b) => (uso[b] || 0) - (uso[a] || 0) || todas.indexOf(a) - todas.indexOf(b));
    const atual = $('#wType').value;
    $('#wTypeChips').innerHTML = ordem.map(t => `<button type="button" class="tr-chip${t === atual ? ' on' : ''}" data-tipo="${t}" role="radio" aria-checked="${t === atual}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONES_ATIVIDADE[t] || ICONES_ATIVIDADE.Outro}</svg>${NOME_CURTO_ATIV[t] || t}</button>`).join('');
    $('#wTypeChips').scrollLeft = 0;
    sincronizarDuracao();
    if (!$('#wDistance').value) definirKmPadrao(); else mostrarKm();
}
function sincronizarDuracao() {
    const v = Number($('#wDuration').value) || 45;
    $('#wDurBig').textContent = v;
    if (state.composerKind === 'workout') updateDestUI();
}
function estimarPontosTreino() {
    const dur = Number($('#wDuration').value) || 0;
    const fator = INTENSITY[$('#wType').value] ?? 0.8;
    let pts = Math.min(15, (dur / 6) * fator);
    if (state.composerPhoto) pts += 3;
    return Math.round(pts);
}
function atualizarFotoLegenda() {
    const thumb = $('#capFotoThumb'), x = $('#capFotoX'), box = $('#capFoto');
    if (!thumb) return;
    const prev = $('#pPhotoPreview');
    const temFoto = !!state.composerPhoto && prev && prev.getAttribute('src');
    box.classList.toggle('com-foto', !!temFoto);
    if (temFoto) thumb.src = prev.src; else thumb.removeAttribute('src');
    x.classList.toggle('hidden', !temFoto);
}
document.getElementById('wTypeChips').addEventListener('click', e => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    $('#wType').value = b.dataset.tipo;
    $('#wType').dispatchEvent(new Event('change', { bubbles: true }));
    $$('#wTypeChips .tr-chip').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
    definirKmPadrao();
    if (typeof atualizarCamposTreino === 'function') atualizarCamposTreino();
    updateDestUI();
});
$$('.tr-dur-btn[data-dur-passo]').forEach(b => b.addEventListener('click', () => {
    const v = Math.max(5, Math.min(240, (Number($('#wDuration').value) || 45) + Number(b.dataset.durPasso)));
    $('#wDuration').value = v;
    $('#wDuration').dispatchEvent(new Event('input', { bubbles: true }));
    sincronizarDuracao();
}));
$('#wDuration').addEventListener('input', () => { $('#wDurBig').textContent = $('#wDuration').value; });
// ---- "Treinou com alguém?" no registro de treino ----
state.treinoCom = [];
function pintarTreinoCom() {
    const lista = document.getElementById('trComLista');
    if (!lista) return;
    lista.innerHTML = state.treinoCom.map(u => `<span class="tr-com-chip">com ${escapeHTML(String(u.display_name || u.username).split(' ')[0])}<button type="button" data-tirar-com="${u.id}" aria-label="Tirar">×</button></span>`).join('');
    document.getElementById('trComAdd').querySelector('span').textContent = state.treinoCom.length ? 'Marcar mais alguém' : 'Treinou com alguém?';
}
document.getElementById('trComLista').addEventListener('click', e => {
    const b = e.target.closest('[data-tirar-com]');
    if (!b) return;
    state.treinoCom = state.treinoCom.filter(u => u.id !== b.dataset.tirarCom);
    pintarTreinoCom();
});
document.getElementById('trComAdd').addEventListener('click', async () => {
    if (!state.seguindoCache) {
        const { data } = await sb.from('follows').select('following:profiles!following_id (id, username, display_name, avatar_url)').eq('follower_id', state.session.user.id).limit(300);
        state.seguindoCache = (data || []).map(x => x.following).filter(Boolean);
    }
    const old = document.getElementById('comSheet'); if (old) old.remove();
    const sheet = document.createElement('div');
    sheet.id = 'comSheet'; sheet.className = 'sheet on sheet-over-story';
    const marcados = new Set(state.treinoCom.map(u => u.id));
    const linhas = lista => lista.map(u => `<button type="button" class="com-opcao${marcados.has(u.id) ? ' on' : ''}" data-uid="${u.id}">
        ${avatarHTML(u, 'sm')}<span><b>${escapeHTML(u.display_name || '')}</b><small>@${escapeHTML(u.username || '')}</small></span><i class="com-check"></i></button>`).join('')
        || '<p class="faixa-nota">Siga alguém primeiro pra poder marcar no treino.</p>';
    sheet.innerHTML = `<div class="sheet-card">
        <div class="sheet-handle"></div>
        <h3 class="sheet-title">Treinou com quem?</h3>
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input type="text" id="comBusca" placeholder="Buscar entre quem você segue" autocomplete="off" autocapitalize="off"></div>
        <div class="com-lista" id="comLista">${linhas(state.seguindoCache)}</div>
        <button class="btn-primary" id="comOk" style="width:100%;margin-top:12px">Pronto</button>
    </div>`;
    document.body.appendChild(sheet);
    const box = sheet.querySelector('#comLista');
    sheet.querySelector('#comBusca').oninput = e => {
        const q = e.target.value.toLowerCase();
        box.innerHTML = linhas(state.seguindoCache.filter(u => `${u.display_name} ${u.username}`.toLowerCase().includes(q)));
    };
    box.addEventListener('click', e => {
        const b = e.target.closest('.com-opcao'); if (!b) return;
        b.classList.toggle('on');
        b.classList.contains('on') ? marcados.add(b.dataset.uid) : marcados.delete(b.dataset.uid);
    });
    const fechar = () => { state.treinoCom = state.seguindoCache.filter(u => marcados.has(u.id)); pintarTreinoCom(); sheet.remove(); };
    sheet.querySelector('#comOk').onclick = fechar;
    sheet.addEventListener('click', e => { if (e.target === sheet) fechar(); });
});

// Contador de distância (opcional): começa num valor comum e anda em passos
function kmPasso() { return (KM_PADRAO[$('#wType').value] || [3, 0.5])[1]; }
function kmPadrao() { return (KM_PADRAO[$('#wType').value] || [3, 0.5])[0]; }
function mostrarKm() {
    const v = parseFloat(String($('#wDistance').value).replace(',', '.'));
    const tem = v > 0;
    $('#wKmBig').textContent = tem ? String(v).replace('.', ',') : '–';
    $('#wKmSem').textContent = tem ? 'sem distância' : 'adicionar distância';
    $('#wDistField').classList.toggle('sem-km', !tem);
}
function definirKmPadrao() {
    if (!ATIVIDADES_COM_KM.includes($('#wType').value)) return;
    $('#wDistance').value = kmPadrao();
    mostrarKm();
    atualizarCamposTreino();
}
$$('[data-km-passo]').forEach(b => b.addEventListener('click', () => {
    let v = parseFloat(String($('#wDistance').value).replace(',', '.'));
    const passo = kmPasso();
    if (!(v > 0)) v = kmPadrao();
    else v = Math.max(passo, Math.round((v + Number(b.dataset.kmPasso) * passo) * 100) / 100);
    $('#wDistance').value = v;
    mostrarKm(); atualizarCamposTreino();
}));
$('#wKmSem').addEventListener('click', () => {
    const v = parseFloat(String($('#wDistance').value).replace(',', '.'));
    $('#wDistance').value = v > 0 ? '' : kmPadrao();
    mostrarKm(); atualizarCamposTreino();
});

// Foto pelo ícone na legenda: o celular oferece câmera ou galeria
$('#pPhotoUnico').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const gal = $('#pPhotoGal');
    try {
        const dt = new DataTransfer(); dt.items.add(f); gal.files = dt.files;
        gal.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) { toast('Não consegui abrir essa foto. Tente de novo.', 'err'); }
    e.target.value = '';
    setTimeout(updateDestUI, 400);
});
$('#capFotoX').addEventListener('click', () => { const c = $('#pPhotoClear'); if (c) c.click(); setTimeout(updateDestUI, 50); });
$('#feedSwitch').addEventListener('click', () => {
    if (!state.composerPhoto) { toast('Adicione uma foto pra publicar no feed', 'err'); return; }
    const alvo = state.composerDest === 'feed' ? 'log' : 'feed';
    const b = document.querySelector(`#destSection [data-dest="${alvo}"]`);
    if (b) b.click();
});

// ---- Contadores grandes (água, sono) ligados aos campos de sempre ----
function sincronizarContadores() {
    $$('#composerSheet .contador').forEach(c => {
        const v = parseFloat(String($('#' + c.dataset.alvo).value).replace(',', '.'));
        c.querySelector('.contador-v').textContent = isNaN(v) ? '–' : String(v).replace('.', ',');
    });
}
$$('#composerSheet .contador [data-c]').forEach(b => b.addEventListener('click', () => {
    const c = b.closest('.contador');
    const alvo = $('#' + c.dataset.alvo);
    const passo = Number(c.dataset.passo), min = Number(c.dataset.min), max = Number(c.dataset.max);
    let v = parseFloat(String(alvo.value).replace(',', '.'));
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, Math.round((v + Number(b.dataset.c) * passo) * 100) / 100));
    alvo.value = v;
    alvo.dispatchEvent(new Event('input', { bubbles: true }));
    sincronizarContadores();
}));

// ---- Refeição: tipo em chips e foto do prato em destaque ----
function horaParaSlot() {
    const h = new Date().getHours();
    return h < 10 ? 'cafe' : h < 15 ? 'almoco' : h < 18 ? 'lanche' : 'jantar';
}
function marcarSlotRefeicao(slot) {
    const sel = $('#mSlot');
    if (slot) sel.value = slot;
    else if (!sel.dataset.tocado) sel.value = horaParaSlot();
    $$('#mSlotChips [data-slot]').forEach(b => b.classList.toggle('on', b.dataset.slot === sel.value));
}
$('#mSlotChips').addEventListener('click', e => {
    const b = e.target.closest('[data-slot]');
    if (!b) return;
    $('#mSlot').dataset.tocado = '1';
    marcarSlotRefeicao(b.dataset.slot);
    $('#mSlot').dispatchEvent(new Event('change', { bubbles: true }));
});
function atualizarFotoRefeicao() {
    const box = $('#refFoto'); if (!box) return;
    const prev = $('#pPhotoPreview');
    const tem = !!state.composerPhoto && prev && prev.getAttribute('src');
    box.classList.toggle('com-foto', !!tem);
    if (tem) $('#refFotoImg').src = prev.src; else $('#refFotoImg').removeAttribute('src');
}
$('#pPhotoMeal').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
        const dt = new DataTransfer(); dt.items.add(f); $('#pPhotoGal').files = dt.files;
        $('#pPhotoGal').dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) { toast('Não consegui abrir essa foto. Tente de novo.', 'err'); }
    e.target.value = '';
    setTimeout(() => { atualizarFotoRefeicao(); updateDestUI(); }, 400);
});

// Registros de água de hoje, com × pra apagar o errado (dias anteriores não)
async function carregarAguaHoje() {
    const box = document.getElementById('aguaHoje');
    if (!box) return;
    box.innerHTML = '';
    const ini = new Date(); ini.setHours(0, 0, 0, 0);
    const { data } = await sb.from('posts').select('id, water_ml, created_at')
        .eq('user_id', state.session.user.id).eq('kind', 'water')
        .gte('created_at', ini.toISOString()).order('created_at', { ascending: false }).limit(20);
    if (!document.getElementById('aguaHoje')) return;
    state.aguaHoje = data || [];
    box.innerHTML = state.aguaHoje.length ? `<div class="ah-titulo">Hoje</div>${state.aguaHoje.map(r => `<div class="ah-linha" data-ah="${r.id}">
        <span><b>${r.water_ml} ml</b> · ${new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        <button type="button" class="ah-x" data-act="apagar-agua" data-id="${r.id}" aria-label="Apagar este registro">×</button>
    </div>`).join('')}` : '';
}

// ---- Registrar x Publicar no feed ----
function updateDestUI() {
    const sec = $('#destSection');
    if (!sec) return;
    const kind = state.composerKind;
    const hasPhoto = !!state.composerPhoto;
    const isStory = kind === 'story';
    const isPost = kind === 'post';
    if (!state.composerDest) state.composerDest = 'log';
    if (isPost) state.composerDest = 'feed';
    else if (!hasPhoto && state.composerDest === 'feed') state.composerDest = 'log';

    const isWater = kind === 'water';
    const isSleep = kind === 'sleep';
    sec.classList.toggle('hidden', isStory || isWater || isSleep || isPost);
    $('#destHint').classList.toggle('hidden', isStory || isWater || isSleep || isPost);
    const fotoBloco = document.querySelector('#composerSheet .file-drop');
    if (fotoBloco) fotoBloco.classList.toggle('hidden', isWater || isSleep);
    const legenda = document.querySelector('#pCaption');
    if (legenda && legenda.closest('.field')) legenda.closest('.field').classList.toggle('hidden', isWater || isSleep);
    const feedBtn = sec.querySelector('[data-dest="feed"]');
    feedBtn.disabled = !hasPhoto;
    sec.querySelectorAll('.dest-btn').forEach(b => b.classList.toggle('on', b.dataset.dest === state.composerDest));

    let hint = '';
    if (!isStory && !isPost) {
        if (state.composerDest === 'feed') hint = 'Vai aparecer no feed e nas fotos do seu perfil.';
        else if (kind === 'meal') hint = 'Fica só pra você no histórico. A IA analisa a foto do mesmo jeito.';
        else hint = 'Fica no seu histórico de treinos, que aparece no seu perfil.';
        if (!hasPhoto) hint += ' Pra publicar no feed, adicione uma foto.';
    }
    $('#destHint').textContent = hint;

    $('#privacySection').classList.toggle('hidden', isStory || isWater || isSleep || state.composerDest !== 'feed');

    // modo treino: chave do feed no lugar dos dois botões
    const sw = $('#feedSwitch');
    if (sw) {
        const ligado = state.composerDest === 'feed';
        sw.classList.toggle('on', ligado);
        sw.setAttribute('aria-checked', String(ligado));
        sw.classList.toggle('travado', !hasPhoto);
        $('#feedSwitchHint').textContent = hasPhoto ? (ligado ? 'Aparece no feed e nas fotos do seu perfil' : 'Fica só no seu histórico') : 'Adicione uma foto pra publicar';
    }
    atualizarFotoLegenda();
    if (kind === 'meal') atualizarFotoRefeicao();

    const btn = $('#composerSubmit');
    if (btn && !btn.disabled && kind === 'meal') {
        btn.innerHTML = state.composerDest === 'feed' ? 'Publicar refeição' : `Registrar refeição${state.composerPhoto ? '<span class="btn-pts">· +1 pt</span>' : ''}`;
    } else if (btn && !btn.disabled && kind === 'workout') {
        const pts = estimarPontosTreino();
        btn.innerHTML = `${state.composerDest === 'feed' ? 'Publicar' : 'Registrar'}<span class="btn-pts">· +${pts} pts</span>`;
    } else if (btn && !btn.disabled) {
        btn.textContent = isPost ? 'Publicar'
            : isStory ? 'Publicar Story'
            : isWater ? 'Registrar água'
            : isSleep ? 'Registrar sono'
            : (state.composerDest === 'feed' ? 'Publicar no feed' : 'Registrar');
    }
}

$$('.dest-btn').forEach(b => b.addEventListener('click', e => {
    const el = e.currentTarget;
    if (el.disabled) { toast('Adicione uma foto pra publicar no feed', 'err'); return; }
    state.composerDest = el.dataset.dest;
    // Refeição nasce privada; se for pro feed, abre pro padrão
    if (state.composerDest === 'feed' && state.composerPrivacy === 'private') {
        state.composerPrivacy = state.defaultPrivacy || 'public';
        updatePrivacyChip();
    }
    updateDestUI();
}));

function updatePrivacyChip() {
    const meta = {
        public:    { emo:'🌍', label:'Público' },
        followers: { emo:'👥', label:'Seguidores' },
        private:   { emo:'🔒', label:'Só eu' },
    }[state.composerPrivacy] || { emo:'👥', label:'Seguidores' };
    $('#pcEmo').textContent = meta.emo;
    $('#pcLabel').textContent = meta.label;
    $$('.privacy-opt').forEach(x => x.classList.toggle('on', x.dataset.privacy === state.composerPrivacy));
}

// Background color picker for story
$$('.bg-color-swatch').forEach(s => s.addEventListener('click', e => {
    state.composerBg = e.currentTarget.dataset.color;
    $$('.bg-color-swatch').forEach(x => x.classList.toggle('on', x === e.currentTarget));
    atualizarPreviaStory();
}));
$('#pCaption').addEventListener('input', () => {
    if (state.composerKind === 'story') atualizarPreviaStory();
});

function handlePhotoPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    state.composerPhoto = file;
    const url = URL.createObjectURL(file);
    $('#pPhotoPreview').src = url;
    $('#pPhotoPreview').classList.add('on');
    $('#pPhotoClear').classList.remove('hidden');
    // treino com foto continua só no registro; vai pro feed só se a pessoa escolher
    const lerBtn = $('#lerPrintBtn');
    if (lerBtn) lerBtn.classList.toggle('hidden', !(state.composerKind === 'workout' && state.composerPhoto));
    updateDestUI();
}
$('#pPhotoCam').addEventListener('change', handlePhotoPick);
$('#lerPrintBtn').addEventListener('click', lerPrintDeTreino);
$('#pPhotoClear').addEventListener('click', () => {
    state.composerPhoto = null;
    $('#pPhotoCam').value = '';
    $('#pPhotoGal').value = '';
    $('#pPhotoPreview').classList.remove('on');
    $('#pPhotoClear').classList.add('hidden');
    $('#lerPrintBtn').classList.add('hidden');
    state.composerDest = 'log';
    updateDestUI();
});
$('#pPhotoGal').addEventListener('change', handlePhotoPick);

$('#composerSubmit').addEventListener('click', async () => {
    const btn = $('#composerSubmit');
    if (state.publishing) return;
    state.publishing = true;
    btn.disabled = true; btn.textContent = 'Publicando...';

    try {
        const caption = $('#pCaption').value.trim();
        let imageUrl = null;

        if (state.composerKind === 'post' && !state.composerPhoto) {
            toast('Escolha uma foto pra publicar', 'err');
            return;
        }

        // upload da foto se houver
        let thumbUrl = null;
        if (state.composerPhoto) {
            btn.textContent = 'Enviando foto...';
            // Refeição fora do feed fica "Só eu": a foto vai pra pasta privada
            const soEu = state.composerDest !== 'feed' && state.composerKind === 'meal';
            if (soEu) {
                imageUrl = await uploadImagemPrivada(state.composerPhoto);
            } else {
                [imageUrl, thumbUrl] = await Promise.all([
                    uploadImage('post-images', state.composerPhoto),
                    uploadMiniatura(state.composerPhoto),
                ]);
            }

            // Foto que vai pro feed passa por uma checagem rápida
            if (state.composerDest === 'feed' || state.composerKind === 'story' || state.composerKind === 'post') {
                btn.textContent = 'Verificando a foto...';
                try {
                    const { data: mod } = await sb.functions.invoke('vision-tools', {
                        body: { task: 'moderate', imageUrl },
                    });
                    if (mod && mod.safe === false) {
                        await removeStoredImage(imageUrl);
                        toast(mod.reason || 'Essa foto não pode ir pro feed.', 'err');
                        return;
                    }
                } catch (e) {
                    console.warn('moderação indisponível', e);
                }
            }
        }

        // ============ POST LIVRE (vai pro feed, não vale ponto) ============
        if (state.composerKind === 'post') {
            const vis = state.composerPrivacy || state.defaultPrivacy || 'public';
            const { error: postLivreErr } = await sb.from('posts').insert({
                user_id: state.session.user.id,
                kind: 'text',
                caption: caption || null,
                image_url: imageUrl,
                thumb_url: thumbUrl,
                visibility: vis,
                is_public: vis === 'public',
                in_feed: true,
            });
            if (postLivreErr) {
                const t = String(postLivreErr.message || '');
                if (t.includes('limite_por_hora')) { toast('Você postou bastante na última hora. Dá um tempinho e volte.', 'err'); return; }
                if (t.includes('post_repetido')) { toast('Esse mesmo texto já foi postado agora há pouco.', 'err'); return; }
                throw postLivreErr;
            }
            closeComposer();
            toast('Publicado no feed', 'ok');
            if (state.view === 'feed') await renderFeed();
            else if (state.view === 'profile') await renderProfile();
            return;
        }

        // ============ STORY (tabela separada, expira em 24h) ============
        if (state.composerKind === 'story') {
            if (!caption && !imageUrl) {
                toast('Escreva algo ou anexe uma foto', 'err');
                btn.disabled = false; btn.textContent = 'Publicar Story';
                return;
            }

            const { data: story, error: storyErr } = await sb.from('stories').insert({
                user_id: state.session.user.id,
                caption: caption || null,
                image_url: imageUrl,
                background_color: !imageUrl ? state.composerBg : null,
            }).select().single();
            if (storyErr) throw storyErr;

            // Os pontos vêm do servidor (máx 3 stories por dia)
            const { data: stPts } = await sb.rpc('points_for_reference', { ref: story.id });
            const ganhos = Number(stPts || 0);
            await loadScore();

            closeComposer();
            toast(ganhos > 0 ? `+${ganhos} pontos! Story publicado` : 'Story publicado (limite diário de pontos atingido)', 'ok');
            if (state.view === 'feed') await renderFeed();
            return;
        }

        // ============ SONO ============
        if (state.composerKind === 'sleep') {
            const horas = parseFloat($('#skHours').value);
            const dia = $('#skDate').value;
            if (isNaN(horas) || horas < 0 || horas > 16) { toast('Informe entre 0 e 16 horas', 'err'); return; }
            const limite = isoDe(new Date(Date.now() - 7 * 86400000));
            if (!dia || dia > hojeISO() || dia < limite) { toast('Dá pra registrar ou ajustar o sono só dos últimos 7 dias.', 'err'); return; }

            const { error: erroSono } = await sb.from('sleep_logs').upsert({
                user_id: state.session.user.id, slept_on: dia, hours: horas,
                quality: qualidadeSono, updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,slept_on' });

            if (erroSono) {
                if (!navigator.onLine || String(erroSono.message || '').toLowerCase().includes('fetch')) {
                    guardarNaFila({ tipo: 'sleep', dia, horas });
                    closeComposer();
                    toast('Sem internet agora. Guardei e envio assim que voltar.', 'ok');
                    return;
                }
                throw erroSono;
            }
            state.sonoRegistrado = dia;

            await updateStreak(hojeISO());
            await loadScore();
            closeComposer();
            toast('Sono registrado. Isso ajuda o coach a entender seus dias.', 'ok');
            if (state.view === 'progress') await renderProgress();
            return;
        }

        // ============ ÁGUA (registro privado e rápido) ============
        if (state.composerKind === 'water') {
            const ml = parseInt($('#wMl').value) || 0;
            if (ml < 50) { toast('Informe quanto você bebeu', 'err'); return; }

            const registroAgua = {
                kind: 'water', water_ml: ml,
                visibility: 'private', is_public: false, in_feed: false,
            };
            const { data: criado, error: erroAgua } = await sb.from('posts')
                .insert({ ...registroAgua, user_id: state.session.user.id }).select().single();

            if (erroAgua) {
                if (!navigator.onLine || String(erroAgua.message || '').toLowerCase().includes('fetch')) {
                    guardarNaFila({ tipo: 'post', post: registroAgua });
                    closeComposer();
                    toast('Sem internet agora. Guardei e envio assim que voltar.', 'ok');
                    return;
                }
                throw erroAgua;
            }

            const [{ data: aguaPts }, agoraW] = await Promise.all([
                sb.rpc('points_for_reference', { ref: criado.id }),
                aguaDeHoje(),
            ]);
            const agora = [agoraW];
            await updateStreak(hojeISO());
            await loadScore();
            closeComposer();

            const w = (agora && agora[0]) || {};
            const ganhos = Number(aguaPts || 0);
            let aviso = `${formatLitros(w.total_ml || ml)} hoje`;
            if (w.goal_ml) aviso += ` de ${formatLitros(w.goal_ml)}`;
            if (ganhos > 0) aviso = `+${ganhos} ${ganhos === 1 ? 'ponto' : 'pontos'}! ` + aviso;
            toast(aviso, 'ok');
            if (state.view === 'progress') await renderProgress();
            return;
        }

        // ============ POST (tabela posts, permanente) ============
        const toFeed = state.composerDest === 'feed' && !!imageUrl;
        const postVisibility = toFeed
            ? state.composerPrivacy
            : (state.composerKind === 'meal' ? 'private' : 'public');
        const post = {
            user_id: state.session.user.id,
            kind: state.composerKind,
            caption: caption || null,
            image_url: imageUrl,
            ...(thumbUrl ? { thumb_url: thumbUrl } : {}),
            // Registro: treino fica visível no histórico do perfil; refeição fica privada
            visibility: postVisibility,
            is_public: postVisibility === 'public',
            in_feed: toFeed,
        };
        let ptsToCredit = 0, ptsReason = '';
        let mealFeedback = null;
        let mealAnalysisFailed = false;
        let mealLimitReached = false;
        const today = new Date().toISOString().split('T')[0];

        if (state.composerKind === 'workout') {
            post.activity_type = $('#wType').value;
            post.duration_min = parseInt($('#wDuration').value) || 30;
            if (ATIVIDADES_COM_KM.includes(post.activity_type)) {
                const km = parseFloat(String($('#wDistance').value).replace(',', '.'));
                if (km > 0 && km <= 500) post.distance_km = Math.round(km * 100) / 100;
            }
            if (post.activity_type === 'Musculação') {
                const grupos = [...document.querySelectorAll('#wMuscles .chip.on')].map(c => c.dataset.m);
                if (grupos.length) post.muscle_groups = grupos;
                if (state.treinoCom.length) post.meta = { ...(post.meta || {}), com: state.treinoCom.map(u => ({ id: u.id, username: u.username, display_name: u.display_name })) };
            }
            ptsToCredit = workoutPoints(post.activity_type, post.duration_min, !!imageUrl);
            ptsReason = 'workout';
        } else if (state.composerKind === 'meal') {
            post.meal_slot = $('#mSlot').value;
            // Só pontua o que a IA analisar. Sem foto, fica registrado sem ponto.
            if (imageUrl) {
                btn.textContent = 'Analisando o prato...';
                try {
                    const urlIA = ehPrivada(imageUrl) ? await linkPrivado(imageUrl, 600) : imageUrl;
                    const { data: an, error: anErr } = await sb.functions.invoke('analyze-meal', {
                        body: { imageUrl: urlIA }
                    });
                    if (anErr || !an || typeof an.score !== 'number') throw (anErr || new Error('sem nota'));
                    post.meal_score = an.score;
                    post.meal_analysis = an.analysis || null;
                    mealFeedback = an;
                } catch (e) {
                    console.warn('analyze-meal indisponível', e);
                    mealAnalysisFailed = true;
                    post.meta = { ...(post.meta || {}), analise_pendente: true };
                }
            }
        }

        // Sem internet: treino e água sem foto ficam guardados e são enviados quando a conexão voltar
        if (!navigator.onLine && !imageUrl && post.kind === 'workout') {
            guardarNaFila({ tipo: 'post', post: { ...post, created_at: new Date().toISOString() } });
            closeComposer();
            toast('Sem internet agora. Guardei seu registro e envio assim que a conexão voltar.', 'ok');
            return;
        }
        let recordeAntes = null;
        if (post.kind === 'workout') {
            const [{ data: maxDur }, { data: maxKm }] = await Promise.all([
                sb.from('posts').select('duration_min').eq('user_id', state.session.user.id).eq('kind', 'workout')
                    .not('duration_min', 'is', null).order('duration_min', { ascending: false }).limit(1),
                sb.from('posts').select('distance_km').eq('user_id', state.session.user.id).eq('kind', 'workout')
                    .not('distance_km', 'is', null).order('distance_km', { ascending: false }).limit(1),
            ]);
            recordeAntes = { dur: maxDur && maxDur[0] ? Number(maxDur[0].duration_min) : null, km: maxKm && maxKm[0] ? Number(maxKm[0].distance_km) : null };
        }
        let created = null, postErr = null;
        try {
            ({ data: created, error: postErr } = await sb.from('posts').insert(post).select().single());
        } catch (errRede) { postErr = errRede; }
        if (postErr && !imageUrl && post.kind === 'workout'
            && /fetch|network|Failed|Load failed/i.test(String(postErr.message || postErr))) {
            guardarNaFila({ tipo: 'post', post: { ...post, created_at: new Date().toISOString() } });
            closeComposer();
            toast('A conexão caiu. Guardei seu registro e envio assim que voltar.', 'ok');
            return;
        }
        if (created) setTimeout(checarConquistasNovas, 2500);
        if (created && post.meta && post.meta.com && post.meta.com.length) {
            sb.rpc('marcar_treino_com', { pid: created.id }).then(() => {});
        }
        if (created && recordeAntes) {
            let msg = null;
            if (post.distance_km && recordeAntes.km != null && post.distance_km > recordeAntes.km) msg = `Novo recorde de distância: ${String(post.distance_km).replace('.', ',')} km 🏅`;
            else if (post.duration_min && recordeAntes.dur != null && post.duration_min > recordeAntes.dur) msg = `Novo recorde: seu treino mais longo, ${post.duration_min} min 🏅`;
            if (msg) setTimeout(() => toast(msg, 'ok'), 2600);
        }
        if (postErr) {
            const txtErro = String(postErr.message || '');
            if (txtErro.includes('limite_por_hora')) {
                toast('Você registrou bastante coisa na última hora. Dá um tempinho e volte.', 'err');
                return;
            }
            if (txtErro.includes('treino_repetido')) {
                toast(`Você já registrou ${String(post.activity_type || 'esse treino').toLowerCase() === 'corrida' ? 'uma corrida igual' : 'um treino igual'} hoje. Se treinou de novo, ajuste o tempo ou a distância.`, 'err');
                return;
            }
            if (txtErro.includes('post_repetido')) {
                toast('Esse mesmo texto já foi postado agora há pouco.', 'err');
                return;
            }
            if (txtErro.includes('refeicao_duplicada')) {
                const nome = { cafe:'o café da manhã', almoco:'o almoço', jantar:'o jantar' }[post.meal_slot] || 'essa refeição';
                toast(`Você já registrou ${nome} de hoje. Lanche você pode registrar mais de um.`, 'err');
                return;
            }
            throw postErr;
        }

        // A pontuação é calculada no servidor, o app só lê o resultado
        const { data: servidorPts } = await sb.rpc('points_for_reference', { ref: created.id });
        ptsToCredit = Number(servidorPts || 0);

        let streakInfo = null;
        let weeklyBonus = 0;
        // Ofensiva estilo Duolingo: qualquer atividade do dia mantém a chama acesa
        streakInfo = await updateStreak(today);
        if (state.composerKind === 'workout') {
            // Bônus de semana válida (só credita se atingiu 3 dias essa semana e ainda não creditou)
            const { data: bonusData } = await sb.rpc('check_and_credit_weekly_bonus', { uid: state.session.user.id });
            weeklyBonus = Number(bonusData || 0);
        }

        await loadScore();
        const eraTreino = post.kind === 'workout';
        if (eraTreino) {
            try {
                const uso = JSON.parse(localStorage.getItem('pulso-uso-atividades') || '{}');
                uso[post.activity_type || 'Outro'] = (uso[post.activity_type || 'Outro'] || 0) + 1;
                localStorage.setItem('pulso-uso-atividades', JSON.stringify(uso));
            } catch (_) {}
        }
        closeComposer();
        setTimeout(() => checarConquistas(false), 1200);
        if (eraTreino && created) setTimeout(() => perguntarEsforco(created.id), 1800);
        if (created) setTimeout(efeitoNoDesafio, 3200);

        let msg = `+${ptsToCredit} pontos!`;
        if (streakInfo?.streak_bonus > 0) msg += ` · +${streakInfo.streak_bonus} bônus ofensiva 🔥`;
        if (streakInfo?.shield_used) msg += ' · escudo usado, sua sequência continua 🛡️';
        if (weeklyBonus > 0) msg += ` · +${weeklyBonus} semana válida ✅`;

        if (mealFeedback) {
            showMealResult(mealFeedback, ptsToCredit, ptsToCredit === 0);
        } else if (mealAnalysisFailed) {
            toast('A análise do prato ficou pendente. Vou tentar de novo sozinho, e os pontos entram quando sair a nota.', 'ok');
        } else if (ptsToCredit === 0) {
            const semFoto = state.composerKind === 'meal'
                ? 'Refeição registrada. Só as com foto analisada pela IA valem ponto.'
                : 'Registrado! Hoje um treino seu já valeu mais pontos que esse.';
            toast(semFoto, 'ok');
        } else {
            toast(msg, 'ok');
        }

        if (state.view === 'feed') await renderFeed();
        else if (state.view === 'profile') await renderProfile();

    } catch (err) {
        console.error(err);
        toast(msgErro(err), 'err');
    } finally {
        state.publishing = false;
        btn.disabled = false;
        updateDestUI();
    }
});

// ============================================================
// INIT
// ============================================================
async function boot() {
    if (boot.rodando) return;
    boot.rodando = true;
    try { await bootInterno(); } finally { boot.rodando = false; }
}
async function bootInterno() {
    try {
        const q = new URLSearchParams(location.search);
        const u = q.get('u') || q.get('seguir');
        if (q.get('d')) localStorage.setItem('pulso-link-desafio', q.get('d'));
        if (u) {
            localStorage.setItem('pulso-link-user', u);
            localStorage.setItem('pulso-link-tipo', q.get('u') ? 'perfil' : 'convite');
        }
    } catch (_) {}
    // Detecta se veio pelo link de "esqueci senha" (URL tem #access_token e type=recovery)
    const hash = window.location.hash || '';
    const isRecovery = hash.includes('type=recovery');

    const { data: { session } } = await sb.auth.getSession();

    if (isRecovery && session) {
        // Chegou pelo link do email - mostra tela de nova senha
        $('#authScreen').style.display = 'flex';
        $('#app').classList.remove('on');
        showAuthScreen('reset-password');
        // Limpa a URL pra não mostrar o hash na barra
        history.replaceState(null, '', window.location.pathname);
        return;
    }

    if (!session) {
        $('#authScreen').style.display = 'flex';
        $('#app').classList.remove('on');
        return;
    }
    state.session = session;

    // carrega ou cria profile
    let { data: prof } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (!prof) {
        const meta = session.user.user_metadata || {};
        const insert = await sb.from('profiles').insert({
            id: session.user.id,
            username: (meta.username || `user_${session.user.id.slice(0,8)}`).toLowerCase(),
            display_name: meta.display_name || 'Novo usuário'
        }).select().single();
        prof = insert.data;
    }
    state.profile = prof;

    // Cadastro esperando liberação do administrador
    if (prof && prof.access_status && prof.access_status !== 'aprovado' && !prof.is_admin) {
        mostrarTelaAguardandoAcesso(prof.access_status);
        return;
    }
    const espera = document.getElementById('telaEspera');
    if (espera) espera.remove();

    $('#authScreen').style.display = 'none';
    $('#app').classList.add('on');

    // Ajusta privacidade padrão: se 0 seguidores, público; senão, seguidores
    const { data: followersCount } = await sb.rpc('my_followers_count');
    state.defaultPrivacy = (followersCount || 0) > 0 ? 'followers' : 'public';
    state.composerPrivacy = state.defaultPrivacy;
    updatePrivacyChip();

    await loadScore();
    await switchView('feed');
    updateUnreadBadge();
    updateNotifBadge();
    checarConquistas(true);
    checarConvite();
    enviarFilaOffline();

    await carregarBlocked();
    carregarSalvos();
    setTimeout(enviarFilaOffline, 3000);
    setTimeout(atualizarBadgeDesafio, 2500);
    setTimeout(registrarAcesso, 2000);
    setTimeout(checarConquistasNovas, 6000);
    setTimeout(checarQuedaCoach, 8000);
    setTimeout(carregarCopoAgua, 5000);
    setTimeout(converterFotosHeic, 20000);
    setTimeout(tentarAnalisesPendentes, 12000);
    setTimeout(limparStoriesAntigos, 15000);
    // anuncia desafios que acabaram (uma vez só, pra todos os participantes)
    setTimeout(() => sb.rpc('anunciar_fim_desafios').then(() => updateNotifBadge && updateNotifBadge()), 3500);
    if (state.profile && state.profile.onboarding_done === false) setTimeout(() => abrirPrimeirosPassos(0), 900);
    else {
        setTimeout(talvezConvidarLembretes, 4000);
        setTimeout(() => convidarParaInstalar(false), 9000);
    }
    checkDailyReminder();
    setTimeout(checarRevisaoObjetivo, 2500);

    // Aceite dos termos (uma vez por pessoa)
    if (!state.profile.terms_accepted_at || state.profile.terms_version !== TERMOS_VERSAO) {
        setTimeout(openTermsSheet, 300);
    }

    // Primeiro acesso: pede os dados que alimentam evolução e coach
    if (!state.profile.altura && !state.profile.peso_inicial) {
        setTimeout(openOnboarding, 600);
    }

    // Credita perda de peso que ainda não virou ponto (ex.: pesagens antigas)
    sb.rpc('credit_weight_loss').then(({ data }) => {
        const p = Number((data && data[0] && data[0].pts) || 0);
        if (p > 0) { toast(`+${p} pontos pela sua perda de peso até aqui 🎉`, 'ok'); loadScore(); }
    });
}

sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        // Usuário clicou no link de recuperação - mostra tela de nova senha
        state.session = session;
        $('#authScreen').style.display = 'flex';
        $('#app').classList.remove('on');
        showAuthScreen('reset-password');
        return;
    }
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session && !state.session) boot();
    } else if (event === 'SIGNED_OUT') {
        location.reload();
    }
});

boot();

// Service worker: app instalável e resistente a conexão ruim
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
