// ── STATE ─────────────────────────────────────────
const DEEPSEEK_KEY = 'sk-a7c3fadd5d46473998c58629c9011b39';

// ── SUPABASE ───────────────────────────────────────
const SUPA_URL = 'https://kknlgcbuvpethrftdfjf.supabase.co';
const SUPA_KEY = 'sb_publishable_Pa7C1gPE8ByTs-si5wZ_vg_VGaYHcym';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY);

// ── Search medicine in Supabase database ──────────
async function searchMedicineDB(rawText) {
  try {
    const STOP = new Set([
      'tablet','tablets','capsule','capsules','syrup','injection','solution',
      'cream','ointment','gel','drops','suspension','lotion','spray','patch',
      'mg','ml','mcg','gm','iu','tab','cap','inj','susp','oint','syr',
      'exp','mfg','batch','lot','manufactured','marketed','distributed',
      'ltd','pvt','inc','corp','pharma','pharmaceuticals','labs','laboratory',
      'india','delhi','mumbai','bangalore','hyderabad','chennai','kolkata',
      'store','keep','cool','dry','place','children','reach','below','above',
      'each','contains','composition','warning','caution','dosage','dose',
      'adult','adults','child','use','uses','direction','directions',
      'before','after','with','food','water','doctor','physician','prescription',
      'not','for','the','and','with','this','that','only','take','oral',
      'limited','private','company','product','products','healthcare','health',
      '500','250','100','200','400','650','1000','50','10','5','25','75',
      '125','300','150','800','600','450','350','175','750','1500',
    ]);

    function extractWords(text, maxWords) {
      return [...new Set(
        text.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w.length >= 4 && !STOP.has(w) && /[a-z]{4,}/.test(w))
      )].sort((a, b) => b.length - a.length).slice(0, maxWords);
    }

    // Prioritise first 4 lines — brand name is always prominent/at top of label
    const topLines = rawText.split('\n').slice(0, 4).join(' ');
    const topWords = extractWords(topLines, 5);
    const allWords = extractWords(rawText, 8);

    // Merge: top words first, then remaining
    const candidates = [...new Set([...topWords, ...allWords])];
    if (candidates.length === 0) return null;

    // Pass 1 — brand_name: single batched OR query (was 8 sequential calls)
    const brandOr = candidates.map(w => `brand_name.ilike.%${w}%`).join(',');
    const { data: d1 } = await supa.from('medicines').select('*')
      .or(brandOr).limit(5);
    if (d1?.length) {
      // Pick best: prefer the result whose brand_name contains the longest candidate word
      return d1.sort((a, b) => {
        const scoreA = candidates.findIndex(w => a.brand_name.toLowerCase().includes(w));
        const scoreB = candidates.findIndex(w => b.brand_name.toLowerCase().includes(w));
        return scoreA - scoreB; // lower index = longer/more specific word = better
      })[0];
    }

    // Pass 2 — generic_name: single batched OR query
    const genericOr = allWords.map(w => `generic_name.ilike.%${w}%`).join(',');
    const { data: d2 } = await supa.from('medicines').select('*')
      .or(genericOr).limit(3);
    if (d2?.length) return d2[0];

    // Pass 3 — composition: only long specific words (≥6 chars), batched
    const longWords = allWords.filter(w => w.length >= 6);
    if (longWords.length > 0) {
      const compOr = longWords.map(w => `composition.ilike.%${w}%`).join(',');
      const { data: d3 } = await supa.from('medicines').select('*')
        .or(compOr).limit(3);
      if (d3?.length) return d3[0];
    }

    return null;
  } catch(e) { return null; }
}

// ── Render DB medicine card ────────────────────────
function renderMedicineDBCard(med, lang) {
  const hi = lang === 'hi';
  const uses        = hi && med.uses_hindi      ? med.uses_hindi      : med.uses;
  const sideEffects = hi && med.side_effects_hindi ? med.side_effects_hindi : med.side_effects;
  const warnings    = hi && med.warnings_hindi  ? med.warnings_hindi  : med.warnings;
  const dosage      = hi && med.dosage_hindi    ? med.dosage_hindi    : med.dosage;

  return `
<div class="db-card anim-in" style="
  background:rgba(0,196,163,.05);border:1px solid rgba(0,196,163,.2);
  border-radius:14px;padding:1.1rem;margin-top:.75rem;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:1.5px;
    background:linear-gradient(90deg,transparent,var(--teal),transparent);"></div>
  <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.85rem;">
    <span style="font-size:.6rem;font-weight:600;color:var(--teal);
      text-transform:uppercase;letter-spacing:.1em;border:1px solid rgba(0,196,163,.3);
      border-radius:4px;padding:.15rem .5rem;">📊 ${hi ? 'दवाई डेटाबेस' : 'Medicine Database'}</span>
    ${med.prescription_required
      ? `<span style="font-size:.58rem;background:rgba(225,29,72,.08);
          border:1px solid rgba(225,29,72,.2);color:var(--rose);border-radius:4px;
          padding:.15rem .5rem;">Rx ${hi ? 'ज़रूरी' : 'Required'}</span>`
      : `<span style="font-size:.58rem;background:rgba(14,164,114,.08);
          border:1px solid rgba(14,164,114,.2);color:var(--green);border-radius:4px;
          padding:.15rem .5rem;">OTC</span>`}
  </div>

  <div style="margin-bottom:.7rem;">
    <div style="font-size:1rem;font-weight:700;color:var(--t1);">${med.brand_name}</div>
    <div style="font-size:.72rem;color:var(--teal);margin-top:.1rem;">${med.generic_name} · ${med.drug_type}</div>
    <div style="font-size:.68rem;color:var(--t3);margin-top:.08rem;">${med.composition}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr;gap:.5rem;font-size:.8rem;">
    <div style="background:rgba(255,255,255,.03);border-radius:8px;padding:.6rem .75rem;">
      <span style="font-size:.6rem;font-weight:600;color:var(--t3);text-transform:uppercase;
        letter-spacing:.08em;display:block;margin-bottom:.25rem;">
        💊 ${hi ? 'उपयोग' : 'Uses'}</span>
      <span style="color:var(--t1);line-height:1.55;">${uses}</span>
    </div>
    <div style="background:rgba(255,255,255,.03);border-radius:8px;padding:.6rem .75rem;">
      <span style="font-size:.6rem;font-weight:600;color:var(--t3);text-transform:uppercase;
        letter-spacing:.08em;display:block;margin-bottom:.25rem;">
        📏 ${hi ? 'खुराक' : 'Dosage'}</span>
      <span style="color:var(--t1);line-height:1.55;">${dosage}</span>
    </div>
    <div style="background:rgba(225,29,72,.05);border-radius:8px;padding:.6rem .75rem;">
      <span style="font-size:.6rem;font-weight:600;color:rgba(225,29,72,.7);text-transform:uppercase;
        letter-spacing:.08em;display:block;margin-bottom:.25rem;">
        ⚠️ ${hi ? 'सावधानी' : 'Warning'}</span>
      <span style="color:var(--t2);line-height:1.55;">${warnings}</span>
    </div>
    <div style="background:rgba(255,255,255,.03);border-radius:8px;padding:.6rem .75rem;">
      <span style="font-size:.6rem;font-weight:600;color:var(--t3);text-transform:uppercase;
        letter-spacing:.08em;display:block;margin-bottom:.25rem;">
        😕 ${hi ? 'दुष्प्रभाव' : 'Side Effects'}</span>
      <span style="color:var(--t2);line-height:1.55;">${sideEffects}</span>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;
    margin-top:.75rem;padding-top:.65rem;border-top:1px solid var(--line2);
    font-size:.68rem;color:var(--t3);">
    <span>🏭 ${med.manufacturer || '—'}</span>
    ${med.price_inr ? `<span style="color:var(--teal);font-weight:600;">₹${med.price_inr}</span>` : ''}
  </div>
</div>`;
}

// ── Save scan to Supabase history ─────────────────
async function saveScanHistory(type, ocrText, aiResponse, medicineId = null) {
  try {
    await supa.from('scan_history').insert({
      scan_type: type,
      ocr_text: ocrText?.slice(0, 1000),
      ai_response: aiResponse?.slice(0, 2000),
      medicine_id: medicineId,
      language: currentLang
    });
  } catch(e) { /* silent fail */ }
}

// ── Save game score to Supabase ───────────────────
async function saveGameScore(gameType, score, extra = {}) {
  try {
    await supa.from('game_scores').insert({
      game_type: gameType, score, ...extra
    });
  } catch(e) { /* silent fail */ }
}

let stream  = null;
let gs      = { total:0, played:0, streak:0 };
let ocrWorker = null; // Tesseract worker (lazy-init)

// ── SCREEN TRANSITIONS ────────────────────────────
let currentScreen = 'screen-home';
function show(id) {
  const prev = document.getElementById(currentScreen);
  const next = document.getElementById(id);
  if (!next || currentScreen === id) return;
  prev?.classList.add('prev');
  setTimeout(() => prev?.classList.remove('prev','active'), 350);
  next.classList.add('active');
  currentScreen = id;
  window.scrollTo(0, 0);
}

function goHome() {
  stopCams(); stopSpeech();
  const prev = document.getElementById(currentScreen);
  prev?.classList.remove('active','prev');
  const home = document.getElementById('screen-home');
  home.classList.add('active');
  currentScreen = 'screen-home';
}

const MODULE_ANNOUNCE = {
  hi: {
    medicine: 'दवाई पहचानकर्ता खुला। कैमरा दवाई पर रखें और तस्वीर लें।',
    document: 'दस्तावेज़ सहायक खुला। सरकारी कागज़ पर कैमरा रखें और तस्वीर लें।',
    games:    'दिमाग की कसरत! कोई खेल चुनें।',
    daily:    'रोज़ का साथी खुला। अपनी दिनचर्या देखें।',
  },
  en: {
    medicine: 'Medicine Reader opened. Point the camera at a medicine and take a photo.',
    document: 'Document Helper opened. Point the camera at a document and take a photo.',
    games:    'Brain Games opened! Choose a game to play.',
    daily:    'Daily Companion opened. Check your daily routine.',
  }
};
function openModule(m) {
  // ① Announce feature FIRST so speech starts before camera permission dialog
  const msg = MODULE_ANNOUNCE[currentLang]?.[m];
  if (msg) speak(msg);

  // ② Show screen immediately
  if (m === 'medicine') show('screen-medicine');
  else if (m === 'document') show('screen-document');
  else if (m === 'games')    show('screen-games');
  else if (m === 'daily')    show('screen-daily');

  // ③ Delay camera start by 600 ms so speech isn't cancelled by OS permission dialog
  if (m === 'medicine') setTimeout(() => startCam('medicine'), 600);
  else if (m === 'document') setTimeout(() => startCam('document'), 600);
  else if (m === 'daily')    setTimeout(() => startDaily(), 300);
}

// ── CLOCK / STATUS ────────────────────────────────
function tickAll() {
  const n = new Date();
  const hh = String(n.getHours()).padStart(2,'0');
  const mm = String(n.getMinutes()).padStart(2,'0');
  const t  = hh + ':' + mm;
  const el = document.getElementById('sb-clock');
  if (el) el.textContent = t;

  // greeting
  const gh = document.getElementById('greeting-hi');
  if (gh) {
    const h = n.getHours();
    gh.textContent = h < 12 ? '🌅 Good morning' : h < 17 ? '☀️ Good afternoon' : '🌙 Good evening';
  }
}
tickAll();
setInterval(tickAll, 10000);

// ── LANGUAGE & SPEECH ─────────────────────────────
let currentLang = localStorage.getItem('drishti_lang') || 'hi';

const T = {
  hi: {
    welcome:      'नमस्ते! दृष्टि AI में आपका स्वागत है। मैं आपकी दवाई पढ़ सकता हूँ, सरकारी कागज़ात समझा सकता हूँ, दिमाग की कसरत करा सकता हूँ। कोई भी बटन दबाएं और शुरू करें।',
    apiSet:       'API key सेट! Camera AI तैयार है।',
    demoMode:     'Demo mode में चल रहे हैं।',
    noCam:        'कैमरा नहीं मिला। अनुमति दें।',
    scanMed:      'दवाई पहचान रहा हूँ…',
    scanDoc:      'दस्तावेज़ पढ़ रहा हूँ…',
    error:        'माफ़ करें, गड़बड़ हुई। फिर कोशिश करें।',
    reminders:    'आपके आज के काम: सुबह BP की दवाई, दोपहर Metformin, शाम सैर, रात की दवाई।',
    memStart:     'याददाश्त खेल! जोड़े ढूंढो!',
    memWin:       'शाबाश! सभी जोड़े मिले!',
    memGood:      'बढ़िया!',
    quizStart:    'क्विज़ शुरू! सही जवाब चुनें!',
    quizCorrect:  'बिल्कुल सही!',
    quizWrong:    'गलत। कोई बात नहीं!',
    quizDone:     s => `क्विज़ पूरा! स्कोर ${s}।`,
    patStart:     'क्रम देखो और दोहराओ!',
    patGood:      'शाबाश!',
    patDone:      l => `खेल खत्म। लेवल ${l} तक पहुँचे!`,
    patWrong:     'गलत! फिर देखो…',
    morning:      'सुप्रभात! आज एक अच्छा दिन है। अपना ख्याल रखें।',
    langSwitch:   'हिंदी भाषा चुनी गई।',
  },
  en: {
    welcome:      'Hello! Welcome to DrishtiAI. I can read your medicines, explain government documents, and exercise your brain. Press any button to begin.',
    apiSet:       'API key set! Camera AI is ready.',
    demoMode:     'Running in demo mode.',
    noCam:        'Camera not found. Please allow camera access.',
    scanMed:      'Identifying medicine…',
    scanDoc:      'Reading document…',
    error:        'Sorry, something went wrong. Please try again.',
    reminders:    'Your tasks today: morning BP medicine, afternoon Metformin, evening walk, night medicine.',
    memStart:     'Memory game! Find the matching pairs!',
    memWin:       'Excellent! All pairs matched!',
    memGood:      'Great job!',
    quizStart:    'Quiz time! Choose the correct answer!',
    quizCorrect:  'Absolutely correct!',
    quizWrong:    'Wrong answer. Never mind, keep going!',
    quizDone:     s => `Quiz complete! Your score is ${s}.`,
    patStart:     'Watch the pattern and repeat it!',
    patGood:      'Well done!',
    patDone:      l => `Game over. You reached level ${l}!`,
    patWrong:     'Wrong! Watch the pattern again…',
    morning:      'Good morning! Today is a wonderful day. Take care of yourself.',
    langSwitch:   'English language selected.',
  }
};
function t(key, ...args) {
  const v = T[currentLang][key];
  return typeof v === 'function' ? v(...args) : (v || '');
}
// ── LANGUAGE CONTENT MAPS ─────────────────────────
const LANG_CONTENT = {
  hi: {
    sectionLabel: 'मॉड्यूल',
    mod: [
      { name: 'दवाई पहचानकर्ता', sub: 'क्या दिख रहा है?', desc: 'कैमरा दवाई पढ़कर हिंदी में समझाता है' },
      { name: 'दस्तावेज़ सहायक', sub: 'दस्तावेज़ समझाओ', desc: 'सरकारी कागज़ स्कैन करें — AI बताएगा' },
      { name: 'दिमाग की कसरत', sub: 'दिमाग तेज़ करो', desc: 'याददाश्त, प्रश्नोत्तरी और पैटर्न खेल' },
      { name: 'रोज़ का साथी', sub: 'आज का दिन', desc: 'याद दिलाना, मूड और सुबह की खबर' },
    ],
    speakTitle: 'नमस्ते — स्वागत सुनें',
    speakSub: 'हिंदी में अभिवादन सुनने के लिए टैप करें',
    alertTitle: 'दवाई याद दिलाना',
    alertSub: 'अम्लोडिपिन 5mg · सुबह 8:00 बजे',
  },
  en: {
    sectionLabel: 'Modules',
    mod: [
      { name: 'Medicine Reader', sub: 'What do you see?', desc: 'Camera reads medicine & explains clearly' },
      { name: 'Document Help', sub: 'Explain document', desc: 'Scan govt docs — AI explains what to do' },
      { name: 'Brain Games', sub: 'Sharpen your mind', desc: 'Memory, quiz & pattern games' },
      { name: 'Daily Companion', sub: 'Your day at a glance', desc: 'Reminders, mood & morning briefing' },
    ],
    speakTitle: 'Hello — Hear Welcome',
    speakSub: 'Tap to hear greeting in English',
    alertTitle: 'Medicine Reminder',
    alertSub: 'Amlodipine 5mg · Due at 8:00 AM',
  }
};

function applyLangUI() {
  const lc = LANG_CONTENT[currentLang];
  const hi = currentLang === 'hi';

  // Lang button
  const btn = document.getElementById('btn-lang');
  if (btn) btn.innerHTML = hi
    ? '<span class="qt-icon">🇮🇳</span>हिंदी'
    : '<span class="qt-icon">🇬🇧</span>English';

  // Section label
  const sl = document.querySelector('.section-label');
  if (sl) sl.textContent = lc.sectionLabel;

  // Module cards
  const cards = document.querySelectorAll('.mod-card');
  cards.forEach((card, i) => {
    const d = lc.mod[i]; if (!d) return;
    const name = card.querySelector('.mod-name');
    const hindi = card.querySelector('.mod-hindi');
    const desc = card.querySelector('.mod-desc');
    if (name) name.textContent = d.name;
    if (hindi) hindi.textContent = d.sub;
    if (desc) desc.textContent = d.desc;
  });

  // Speak CTA
  const st = document.querySelector('.speak-title');
  const ss = document.querySelector('.speak-sub');
  if (st) st.textContent = lc.speakTitle;
  if (ss) ss.textContent = lc.speakSub;

  // Alert pill
  const at = document.querySelector('.ap-title');
  const as = document.querySelector('.ap-sub');
  if (at) at.textContent = lc.alertTitle;
  if (as) as.textContent = lc.alertSub;

  // HTML lang attr
  document.documentElement.lang = hi ? 'hi' : 'en';
}

function toggleLang() {
  currentLang = currentLang === 'hi' ? 'en' : 'hi';
  localStorage.setItem('drishti_lang', currentLang);
  applyLangUI();
  speak(t('langSwitch'));
}

// ── Strip markdown so ** | * | # don't show or get spoken ──
function cleanAI(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')   // ***bold italic***
    .replace(/\*\*(.+?)\*\*/g,    '$1')   // **bold**
    .replace(/\*(.+?)\*/g,        '$1')   // *italic*
    .replace(/__(.+?)__/g,        '$1')   // __bold__
    .replace(/_(.+?)_/g,          '$1')   // _italic_
    .replace(/#{1,6}\s+/g,        '')     // ## headings
    .replace(/`{1,3}[^`]*`{1,3}/g,'')    // `code`
    .replace(/^\s*[-•]\s+/gm,    '• ')   // bullet -
    .replace(/^\s*\d+\.\s+/gm,   (m) => m.trim() + ' ') // 1. list
    .replace(/\n{3,}/g,          '\n\n') // excess blank lines
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') // strip emojis
    .trim();
}

// ── Format AI text for display (numbered points on new lines) ─
function formatAI(text) {
  const clean = cleanAI(text);
  // Put numbered points on their own lines with spacing
  return clean.replace(/(\d+\.\s)/g, '\n$1').replace(/^\n/, '');
}

let utt = null;
function speak(text) {
  stopSpeech();
  if (!window.speechSynthesis) return;
  const cleaned = cleanAI(text);           // ← strip markdown before speaking
  utt = new SpeechSynthesisUtterance(cleaned);
  utt.lang   = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
  utt.rate   = 0.80;   // calm, unhurried
  utt.pitch  = 1.0;    // default pitch
  utt.volume = 0.95;
  const voices = speechSynthesis.getVoices();

  // Different female voice priority — softer / more natural sounding:
  // English: Veena (iOS en-IN, natural), Moira (iOS Irish, very gentle),
  //          Karen (iOS Australian, warm), Samantha (iOS default, clear),
  //          Google UK English Female (Android, natural British),
  //          Tessa (iOS South African, soft), Aria (Windows, modern natural)
  // Hindi:   Microsoft Heera (Windows, softer than Google),
  //          Lekha (iOS hi-IN), Google हिन्दी (Android)
  const EN_HINTS = ['veena','moira','karen','samantha','google uk english female',
                    'tessa','fiona','aria','heera','female','woman'];
  const HI_HINTS = ['microsoft heera','heera','lekha','google हिन्दी','google हिंदी',
                    'google hindi','female','woman'];

  function pickVoice(lang, startsWith, hints) {
    const pool = voices.filter(v => v.lang === lang || v.lang.startsWith(startsWith));
    for (const h of hints) {
      const match = pool.find(v => v.name.toLowerCase().includes(h));
      if (match) return match;
    }
    return pool[0] || null;
  }

  const v = currentLang === 'hi'
    ? pickVoice('hi-IN', 'hi', HI_HINTS)
    : pickVoice('en-IN', 'en', EN_HINTS);
  if (v) utt.voice = v;
  const bar = document.getElementById('narrator');
  const txt = document.getElementById('narrator-txt');
  bar.classList.add('on');
  txt.textContent = cleaned.length > 120 ? cleaned.slice(0,120) + '…' : cleaned;
  utt.onend  = () => { bar.classList.remove('on'); clrSpeak(); };
  utt.onerror= () => { bar.classList.remove('on'); clrSpeak(); };
  speechSynthesis.speak(utt);
}
function stopSpeech() {
  if (window.speechSynthesis) speechSynthesis.cancel();
  document.getElementById('narrator').classList.remove('on');
  clrSpeak();
}
function clrSpeak() {
  document.querySelectorAll('.ai-speak-btn,.ph-action').forEach(b => b.classList.remove('speaking'));
}
function speakResult(txtId, btnId) {
  const raw = document.getElementById(txtId)?.textContent;
  if (!raw || raw === '…') return;
  stopSpeech();
  document.getElementById(btnId)?.classList.add('speaking');
  speak(raw);   // speak() calls cleanAI() internally
}
function speakWelcome() { speak(t('welcome')); }

// ── ACCESSIBILITY ─────────────────────────────────
function toggleHC() {
  document.body.classList.toggle('hc');
  document.getElementById('btn-hc').classList.toggle('on');
}
function toggleLT() {
  document.body.classList.toggle('lt');
  document.getElementById('btn-lt').classList.toggle('on');
}
function showSettings() {
  const msg = currentLang === 'hi'
    ? 'DeepSeek AI चालू है। OCR + AI से दवाई और दस्तावेज़ पहचाने जाते हैं।'
    : 'DeepSeek AI is active. Medicines and documents are read using OCR + AI.';
  alert(msg);
}

// ── CAMERA CONFIG ─────────────────────────────────
function cfg(type) {
  const m = type === 'medicine';
  return {
    videoId   : m ? 'med-video'    : 'doc-video',
    canvasId  : m ? 'med-canvas'   : 'doc-canvas',
    prevId    : m ? 'med-preview'  : 'doc-preview',
    loadId    : m ? 'med-loading'  : 'doc-loading',
    resId     : m ? 'med-result'   : 'doc-result',
    txtId     : m ? 'med-txt'      : 'doc-txt',
    capId     : m ? 'med-cap-btn'  : 'doc-cap-btn',
    retId     : m ? 'med-retry-btn': 'doc-retry-btn',
    guideId   : m ? 'med-guide'    : 'doc-guide',
    hintId    : m ? 'med-hint'     : 'doc-hint',
    nocamId   : m ? 'med-nocam'    : null,
  };
}

// ── START CAMERA ──────────────────────────────────
async function startCam(type) {
  const c = cfg(type);
  H(c.resId); H(c.loadId);
  const prev = document.getElementById(c.prevId);
  if (prev) { prev.classList.remove('show'); prev.style.display = ''; }
  document.getElementById(c.capId)?.classList.remove('hidden');
  document.getElementById(c.retId)?.classList.add('hidden');
  document.getElementById(c.guideId)?.classList.remove('hidden');
  document.getElementById(c.hintId)?.classList.remove('hidden');

  try {
    stopCams();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const v = document.getElementById(c.videoId);
    v.srcObject = stream;
    v.style.display = 'block';
    await v.play();
  } catch(e) {
    if (c.nocamId) document.getElementById(c.nocamId)?.classList.remove('hidden');
    else alert('Camera access denied. Please allow camera and reload.');
    speak(t('noCam'));
  }
}

function stopCams() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  ['med-video','doc-video'].forEach(id => {
    const v = document.getElementById(id);
    if (v) { v.srcObject = null; }
  });
}

function retry(type) {
  const c = cfg(type);
  H(c.resId); H(c.loadId);
  const prev = document.getElementById(c.prevId);
  if (prev) { prev.classList.remove('show'); prev.style.display = 'none'; }
  document.getElementById(c.capId)?.classList.remove('hidden');
  document.getElementById(c.retId)?.classList.add('hidden');
  document.getElementById(c.guideId)?.classList.remove('hidden');
  document.getElementById(c.hintId)?.classList.remove('hidden');
  startCam(type);
}

// ── OCR WORKER (Tesseract.js) ─────────────────────
async function getOCRWorker() {
  if (ocrWorker) return ocrWorker;
  ocrWorker = await Tesseract.createWorker(['eng', 'hin']);
  return ocrWorker;
}

function setLoadMsg(loadId, line1, line2) {
  const el = document.getElementById(loadId);
  if (!el) return;
  const span = el.querySelector('.loading-txt span');
  const p    = el.querySelector('.loading-txt');
  if (span) span.textContent = line1;
  // Replace second text node
  if (p) {
    const nodes = [...p.childNodes].filter(n => n.nodeType === 3);
    if (nodes[0]) nodes[0].textContent = '\n' + line2;
  }
}

// ── DEEPSEEK ANALYSIS ─────────────────────────────
async function analyzeWithDeepSeek(ocrText, type, isHindi) {
  const sys = `You are DrishtiAI, a compassionate AI healthcare companion for elderly and disabled Indians.
You help users understand medicine labels and government documents in simple, clear language.
Always be warm, concise, and use numbered points for clarity.
IMPORTANT: Do NOT use any markdown formatting — no asterisks (**), no bold, no italic, no headers (#), no bullet dashes (-). Plain text only. Numbers like 1. 2. 3. are fine.`;

  const usr = type === 'medicine'
    ? isHindi
      ? `नीचे एक दवाई के लेबल से OCR द्वारा निकाला गया text है:\n\n"${ocrText}"\n\nइस दवाई की जानकारी सरल हिंदी में 5 बिंदुओं में बताएं:\n1. दवाई का नाम\n2. खुराक (कितनी और कितनी बार)\n3. कब लें (सुबह/रात/खाने के साथ)\n4. किस लिए है\n5. सावधानी\nशुरू करें: "यह दवाई है —"\nअगर text साफ नहीं है तो दवाई का नाम पहचानकर जानकारी दें।`
      : `OCR text extracted from a medicine label:\n\n"${ocrText}"\n\nExplain this medicine in simple English with 5 numbered points:\n1. Medicine Name (brand + generic)\n2. Dosage (how much, how often)\n3. When to take (morning/night/with food)\n4. Purpose (what condition it treats)\n5. Warning (important caution)\nStart with: "This medicine is —"\nIf text is unclear, identify the medicine from context and provide information.`
    : isHindi
      ? `नीचे एक दस्तावेज़ से OCR द्वारा निकाला गया text है:\n\n"${ocrText}"\n\nइस दस्तावेज़ को सरल हिंदी में 5 बिंदुओं में समझाएं:\n1. दस्तावेज़ का प्रकार\n2. मुख्य बात (आसान भाषा में)\n3. ज़रूरी जानकारी (तारीख, राशि, ID)\n4. क्या करना है\n5. आखिरी तारीख (अगर है)\nशुरू करें: "यह दस्तावेज़ है —"`
      : `OCR text extracted from a document:\n\n"${ocrText}"\n\nExplain this document in simple English with 5 numbered points:\n1. Document Type\n2. Main Message (in simple words)\n3. Key Details (dates, amounts, IDs)\n4. Action Required\n5. Deadline (if any)\nStart with: "This document is —"`;

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: sys },
        { role: 'user',   content: usr }
      ],
      max_tokens: 700,
      temperature: 0.4
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content?.trim()
    || (isHindi ? 'AI पढ़ नहीं पाया। बेहतर रोशनी में दोबारा कोशिश करें।'
                : 'AI could not read. Try again with better lighting.');
}

// ── CAPTURE & ANALYZE ─────────────────────────────
async function capture(type) {
  const c = cfg(type);
  const video  = document.getElementById(c.videoId);
  const canvas = document.getElementById(c.canvasId);
  if (!video.srcObject) { alert('Camera not ready.'); return; }

  // Draw frame to canvas
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);

  // Show captured preview
  const prev = document.getElementById(c.prevId);
  prev.src = canvas.toDataURL('image/jpeg', .92);
  prev.style.display = 'block';
  prev.classList.add('show');

  document.getElementById(c.guideId)?.classList.add('hidden');
  document.getElementById(c.hintId)?.classList.add('hidden');
  document.getElementById(c.capId)?.classList.add('hidden');
  document.getElementById(c.retId)?.classList.remove('hidden');
  stopCams();
  document.getElementById(c.videoId).style.display = 'none';

  S(c.loadId); H(c.resId);
  speak(t(type === 'medicine' ? 'scanMed' : 'scanDoc'));

  const isHindi = currentLang === 'hi';

  try {
    // ── STEP 1: OCR ────────────────────────────────
    setLoadMsg(c.loadId,
      isHindi ? 'तस्वीर से text पढ़ रहा हूँ…' : 'Reading text from image…',
      isHindi ? 'OCR चल रहा है' : 'Running OCR'
    );

    // Preprocess canvas: grayscale + contrast boost for better OCR on coloured labels
    const ctx2 = canvas.getContext('2d');
    const imgData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Grayscale
      const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      // Contrast factor (1.6 = strong boost)
      const contrast = 1.6;
      const v = Math.min(255, Math.max(0, contrast * (gray - 128) + 128));
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx2.putImageData(imgData, 0, 0);

    const worker = await getOCRWorker();
    const { data: { text: rawOCR } } = await worker.recognize(canvas);
    const ocrText = rawOCR.trim();

    // ── STEP 2: DB lookup FIRST (medicine only) ────
    let confirmedMed = null;
    if (type === 'medicine') {
      setLoadMsg(c.loadId,
        isHindi ? 'डेटाबेस में दवाई खोज रहा हूँ…' : 'Searching medicine database…',
        isHindi ? 'दवाई पहचानी जा रही है' : 'Identifying medicine'
      );
      confirmedMed = await searchMedicineDB(ocrText);
    }

    // ── STEP 3: DeepSeek AI — use confirmed name ───
    setLoadMsg(c.loadId,
      isHindi ? 'DeepSeek AI विश्लेषण कर रहा है…' : 'DeepSeek AI is analyzing…',
      isHindi ? 'जवाब तैयार हो रहा है' : 'Preparing answer'
    );

    // If DB found a match, pass confirmed medicine details to AI for accurate response
    const aiContext = (type === 'medicine' && confirmedMed)
      ? `${ocrText}\n\n[Confirmed medicine from database: ${confirmedMed.brand_name} (${confirmedMed.generic_name}), Composition: ${confirmedMed.composition}]`
      : ocrText;

    const result = await analyzeWithDeepSeek(aiContext, type, isHindi);

    H(c.loadId);
    document.getElementById(c.txtId).textContent = formatAI(result);
    S(c.resId);

    // ── STEP 4: Show DB card (already fetched) ─────
    if (type === 'medicine') {
      const resultBox = document.getElementById(c.resId);
      if (confirmedMed && resultBox) {
        const dbCard = document.createElement('div');
        dbCard.innerHTML = renderMedicineDBCard(confirmedMed, currentLang);
        resultBox.appendChild(dbCard.firstElementChild);
      }
      await saveScanHistory(type, ocrText, result, confirmedMed?.id || null);
    } else {
      await saveScanHistory(type, ocrText, result, null);
    }

    setTimeout(() => speakResult(c.txtId, type === 'medicine' ? 'med-spk' : 'doc-spk'), 400);

  } catch(e) {
    H(c.loadId);
    const errMsg = isHindi
      ? `⚠️ गड़बड़ी आई: ${cleanAI(e.message)}\n\nदोबारा कोशिश करें।`
      : `⚠️ Error: ${cleanAI(e.message)}\n\nPlease try again.`;
    document.getElementById(c.txtId).textContent = errMsg;
    S(c.resId);
    speak(t('error'));
  }
}

// ── DAILY COMPANION ───────────────────────────────
function startDaily() {
  tickDaily();
  setInterval(tickDaily, 1000);
  renderMorning();
  renderReminders();
}
function tickDaily() {
  const n = new Date();
  const hh = String(n.getHours()).padStart(2,'0');
  const mm = String(n.getMinutes()).padStart(2,'0');
  const el = document.getElementById('d-clock'); if(el) el.textContent = hh+':'+mm;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const de = document.getElementById('d-date'); if(de) de.textContent = n.getDate()+' '+mons[n.getMonth()]+' '+n.getFullYear();
  const dy = document.getElementById('d-day');  if(dy) dy.textContent = days[n.getDay()];
  const da = document.getElementById('d-ampm'); if(da) da.textContent = n.getHours() < 12 ? '🌅 Morning' : n.getHours() < 17 ? '☀️ Afternoon' : '🌙 Evening';
}
function renderMorning() {
  const h = new Date().getHours();
  const g = h<12?'सुप्रभात':h<17?'नमस्कार':'शुभ संध्या';
  const msgs = [
    'आज एक नया दिन है। एक-एक काम करें, घबराएं नहीं।',
    'पानी पीना मत भूलिए — कम से कम 8 गिलास पिएं।',
    'थोड़ी देर धूप में बैठिए — हड्डियों के लिए बहुत अच्छा है।',
    'आज किसी प्रिय से बात करें। आपकी आवाज़ उनका दिन बना देगी।',
    'गहरी सांस लीजिए। आज का दिन आपका है।',
  ];
  const el = document.getElementById('morning-msg');
  if (el) el.textContent = g + '!\n\n' + msgs[new Date().getDate() % msgs.length];
}
function speakMorning() { speak(document.getElementById('morning-msg')?.textContent || ''); }
function renderReminders() {
  const rem = [
    { t:'08:00', txt:'Amlodipine 5mg लें', c:'#00C9A7' },
    { t:'10:00', txt:'सुबह का नाश्ता', c:'#F59E0B' },
    { t:'13:00', txt:'Metformin (खाने के साथ)', c:'#00C9A7' },
    { t:'15:00', txt:'Brain Game — 15 मिनट', c:'#818CF8' },
    { t:'18:00', txt:'शाम की सैर', c:'#10B981' },
    { t:'21:00', txt:'रात की दवाई लें', c:'#00C9A7' },
  ];
  const now = new Date(); const nm = now.getHours()*60+now.getMinutes();
  const el = document.getElementById('reminders');
  if (el) el.innerHTML = rem.map(r => {
    const [rh,rm] = r.t.split(':').map(Number); const past = rh*60+rm < nm;
    return `<div class="reminder-item" style="${past?'opacity:.4':''}">
      <div class="ri-dot" style="background:${r.c}"></div>
      <div class="ri-time">${r.t}</div>
      <div class="ri-text">${r.txt}</div>
      ${past ? '<span class="ri-done">✓</span>' : ''}
    </div>`;
  }).join('');
}
function speakReminders() { speak(t('reminders')); }
function mood(btn, m) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const r = {
    'very sad': 'आप उदास हैं — यह ठीक है। किसी प्रिय को फ़ोन करें। आप अकेले नहीं हैं। 💙',
    'sad':      'थोड़ा उदास है — धूप में बैठें और गहरी सांस लें।',
    'okay':     'ठीक है — आज का एक काम ज़रूर पूरा करें।',
    'happy':    'बहुत अच्छा! खुश रहना सबसे अच्छी दवाई है! 😊',
    'very happy':'वाह! आपकी खुशी देखकर दिल खुश हो गया! 🌟'
  };
  const msg = r[m] || 'धन्यवाद!';
  const el = document.getElementById('mood-msg');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  speak(msg);
}

// ── MEMORY GAME ───────────────────────────────────
const EMOJIS = ['🌺','🦋','🐘','🍎','⭐','🏠','☁️','🌙','🎵','🍊','🐦','💐'];
let mFlipped=[],mMatched=0,mMoves=0,mLocked=false;
function initMemory() {
  show('screen-memory');
  mFlipped=[]; mMatched=0; mMoves=0; mLocked=false;
  document.getElementById('m-moves').textContent='0';
  document.getElementById('m-matches').textContent='0';
  H('mem-win');
  const pool = EMOJIS.slice(0,8);
  const pairs = [...pool,...pool].sort(()=>Math.random()-.5);
  const grid = document.getElementById('mem-grid');
  grid.innerHTML='';
  pairs.forEach((e,i) => {
    const c = document.createElement('div');
    c.className='mem-card';
    c.innerHTML=`<span class="face">${e}</span><span class="back">❓</span>`;
    c.dataset.e=e; c.dataset.i=i;
    c.addEventListener('click',()=>flipMem(c));
    grid.appendChild(c);
  });
  speak(t('memStart'));
}
function flipMem(card) {
  if(mLocked||card.classList.contains('flipped')||card.classList.contains('matched'))return;
  card.classList.add('flipped'); mFlipped.push(card);
  if(mFlipped.length===2){
    mLocked=true; mMoves++;
    document.getElementById('m-moves').textContent=mMoves;
    const[a,b]=mFlipped;
    if(a.dataset.e===b.dataset.e){
      a.classList.add('matched'); b.classList.add('matched');
      mMatched++; mFlipped=[]; mLocked=false;
      document.getElementById('m-matches').textContent=mMatched;
      if(mMatched===8){
        setTimeout(()=>{
          const pts=Math.max(10,(80-mMoves)*5);
          document.getElementById('mem-win-msg').textContent=`All 8 pairs in ${mMoves} moves! +${pts} points`;
          S('mem-win'); addScore(pts);
          speak(t('memWin'));
        },400);
      } else speak(t('memGood'));
    } else {
      setTimeout(()=>{
        a.classList.add('wrong'); b.classList.add('wrong');
        setTimeout(()=>{ a.classList.remove('flipped','wrong'); b.classList.remove('flipped','wrong'); mFlipped=[]; mLocked=false; }, 500);
      }, 600);
    }
  }
}

// ── QUIZ ──────────────────────────────────────────
const QS=[
  {q:'भारत की राजधानी क्या है?\nWhat is India\'s capital?',opts:['मुंबई','दिल्ली','कोलकाता','चेन्नई'],a:1},
  {q:'सूरज कब उगता है?\nWhen does the sun rise?',opts:['दोपहर को','रात को','सुबह को','शाम को'],a:2},
  {q:'रोज़ कितने गिलास पानी पीने चाहिए?\nHow many glasses of water daily?',opts:['2','4','8','15'],a:2},
  {q:'महात्मा गांधी जयंती कब है?\nWhen is Gandhi Jayanti?',opts:['15 अगस्त','26 जनवरी','2 अक्टूबर','14 नवंबर'],a:2},
  {q:'एम्बुलेंस नंबर क्या है?\nAmbulance number in India?',opts:['100','102','108','112'],a:2},
  {q:'Vitamin D कहाँ से मिलता है?\nWhere do we get Vitamin D?',opts:['चाँदनी से','धूप से','बारिश से','हवा से'],a:1},
  {q:'भारत का राष्ट्रीय पक्षी कौन है?\nIndia\'s national bird?',opts:['कौवा','मोर','तोता','कबूतर'],a:1},
  {q:'दिल को स्वस्थ रखने के लिए क्या करें?\nHow to keep the heart healthy?',opts:['बहुत नमक खाएं','रोज़ टहलें','बहुत आराम करें','तला खाएं'],a:1},
  {q:'BP मापने के लिए क्या इस्तेमाल होता है?\nWhat measures blood pressure?',opts:['थर्मामीटर','BP Machine','Oximeter','Glucometer'],a:1},
  {q:'पानी का रंग क्या होता है?\nWhat color is water?',opts:['लाल','नीला','रंगहीन','हरा'],a:2},
];
let qi=0,qs=0;
const LETTERS=['A','B','C','D'];
function initQuiz(){
  show('screen-quiz'); qi=0; qs=0; H('quiz-done'); renderQ();
  speak(t('quizStart'));
}

// Speak the question text + all options aloud in the current language
function speakQuestion(q){
  const parts = q.q.split('\n');
  const qText = currentLang === 'hi' ? parts[0] : (parts[1] || parts[0]);
  const optText = q.opts.map((o,i) => `${LETTERS[i]}: ${o}`).join(', ');
  const full = currentLang === 'hi'
    ? `प्रश्न ${qi+1}: ${qText} — विकल्प: ${optText}`
    : `Question ${qi+1}: ${qText} — Options: ${optText}`;
  speak(full);
}

function renderQ(){
  const q=QS[qi];
  document.getElementById('q-n').textContent=qi+1;
  document.getElementById('quiz-prog').style.width=((qi+1)/QS.length*100)+'%';
  document.getElementById('quiz-q').textContent=q.q;
  H('quiz-fb'); H('quiz-next');
  const opts=document.getElementById('quiz-opts');
  opts.innerHTML='';
  q.opts.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='quiz-opt';
    b.innerHTML=`<span class="quiz-opt-letter">${LETTERS[i]}</span>${o}`;
    b.onclick=()=>answerQ(i,b,b.querySelector('.quiz-opt-letter'));
    opts.appendChild(b);
  });
  // Read the question aloud — delay on first so "Quiz time!" intro finishes first
  const delay = qi === 0 ? 2400 : 400;
  setTimeout(() => speakQuestion(q), delay);
}
function answerQ(chosen,btn,letter){
  const q=QS[qi];
  document.querySelectorAll('.quiz-opt').forEach((b,i)=>{
    b.onclick=null;
    if(i===q.a) b.classList.add('correct');
  });
  const fb=document.getElementById('quiz-fb'); S('quiz-fb');
  if(chosen===q.a){
    btn.classList.add('correct'); qs+=10;
    fb.style.background='rgba(16,185,129,.1)'; fb.style.border='1px solid var(--green)'; fb.style.color='var(--green)';
    fb.textContent='✅ सही जवाब! +10 points';
    speak(t('quizCorrect'));
  } else {
    btn.classList.add('wrong');
    fb.style.background='rgba(244,63,94,.08)'; fb.style.border='1px solid var(--rose)'; fb.style.color='var(--rose)';
    fb.textContent=`❌ गलत। सही जवाब: ${q.opts[q.a]}`;
    const wrongMsg = currentLang === 'hi'
      ? `${t('quizWrong')} सही जवाब था: ${q.opts[q.a]}`
      : `${t('quizWrong')} The correct answer was: ${q.opts[q.a]}`;
    speak(wrongMsg);
  }
  if(qi<QS.length-1) S('quiz-next'); else setTimeout(finishQuiz,1200);
}
function nextQ(){ qi++; renderQ(); }
function finishQuiz(){
  S('quiz-done'); H('quiz-next');
  const pct=Math.round((qs/(QS.length*10))*100);
  document.getElementById('quiz-done-msg').textContent=`Score: ${qs}/${QS.length*10} (${pct}%) — ${pct>=80?'उत्कृष्ट!':pct>=60?'अच्छे!':'अभ्यास करते रहें!'}`;
  addScore(qs);
  speak(t('quizDone', qs));
}

// ── PATTERN GAME ──────────────────────────────────
const PE=['🌺','⭐','🏠','🍎','🦋','🌙','🎵','☁️','🐘'];
let plvl=1,psc=0,plives=3,pseq=[],pinput=[],pstate='watch';
function initPattern(){
  show('screen-pattern');
  plvl=1; psc=0; plives=3; pseq=[];
  ['p-lvl','p-sc'].forEach((id,i)=>{ document.getElementById(id).textContent=i===0?1:0; });
  document.getElementById('p-lives').textContent='❤️❤️❤️';
  H('pat-done'); renderPat();
  speak(t('patStart'));
  setTimeout(newPatRound, 800);
}
function renderPat(){
  const g=document.getElementById('pat-grid'); g.innerHTML='';
  PE.forEach((e,i)=>{
    const c=document.createElement('div'); c.className='pat-cell'; c.textContent=e; c.dataset.i=i;
    c.addEventListener('click',()=>patTap(i)); g.appendChild(c);
  });
}
function newPatRound(){
  pseq.push(Math.floor(Math.random()*9)); pinput=[]; pstate='watch';
  document.getElementById('p-inst').textContent='👀 देखो — Watch the pattern…';
  document.querySelectorAll('.pat-cell').forEach(c=>c.style.pointerEvents='none');
  showSeq();
}
function showSeq(idx=0){
  if(idx>=pseq.length){
    pstate='input';
    document.getElementById('p-inst').textContent='👆 अब आपकी बारी! Tap the same pattern';
    document.querySelectorAll('.pat-cell').forEach(c=>c.style.pointerEvents='auto'); return;
  }
  const cells=document.querySelectorAll('.pat-cell');
  const d=Math.max(380,680-plvl*40);
  setTimeout(()=>{ cells[pseq[idx]].classList.add('hint'); setTimeout(()=>{ cells[pseq[idx]].classList.remove('hint'); showSeq(idx+1); },d); },d/2);
}
function patTap(idx){
  if(pstate!=='input')return;
  const cells=document.querySelectorAll('.pat-cell');
  const exp=pseq[pinput.length];
  if(idx===exp){
    cells[idx].classList.add('correct'); setTimeout(()=>cells[idx].classList.remove('correct'),380); pinput.push(idx);
    if(pinput.length===pseq.length){
      plvl++; psc+=plvl*10;
      document.getElementById('p-lvl').textContent=plvl;
      document.getElementById('p-sc').textContent=psc;
      speak(t('patGood'));
      document.getElementById('p-inst').textContent='✅ सही!';
      document.querySelectorAll('.pat-cell').forEach(c=>c.style.pointerEvents='none');
      setTimeout(newPatRound,900);
    }
  } else {
    cells[idx].classList.add('wrong'); setTimeout(()=>cells[idx].classList.remove('wrong'),380); plives--;
    document.getElementById('p-lives').textContent=['💔','❤️','❤️❤️','❤️❤️❤️'][plives]||'💔';
    if(plives<=0){
      pstate='done'; document.querySelectorAll('.pat-cell').forEach(c=>c.style.pointerEvents='none');
      S('pat-done');
      document.getElementById('pat-done-title').textContent='खेल समाप्त!';
      document.getElementById('pat-done-msg').textContent=`Level ${plvl} · Score ${psc}`;
      addScore(psc); speak(t('patDone', plvl));
    } else {
      speak(t('patWrong'));
      document.getElementById('p-inst').textContent=`❌ ${plives} जीवन बचे। फिर देखो…`;
      pinput=[]; pstate='watch';
      document.querySelectorAll('.pat-cell').forEach(c=>c.style.pointerEvents='none');
      setTimeout(showSeq, 800);
    }
  }
}

// ── SCORE ─────────────────────────────────────────
function addScore(pts){ gs.total+=pts; gs.played++; gs.streak++;
  document.getElementById('g-total').textContent=gs.total;
  document.getElementById('g-played').textContent=gs.played;
  document.getElementById('g-streak').textContent=gs.streak+'🔥';
}
function startGame(t){
  if(t==='memory')  initMemory();
  if(t==='quiz')    initQuiz();
  if(t==='pattern') initPattern();
}

// ── UTILS ─────────────────────────────────────────
function S(id){document.getElementById(id)?.classList.remove('hidden');}
function H(id){document.getElementById(id)?.classList.add('hidden');}

// ══════════════════════════════════════════════════
//  VOICE COMMAND ENGINE  (Hindi + English)
// ══════════════════════════════════════════════════
(function(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    // Hide the FAB if browser has no speech recognition
    window.addEventListener('load',()=>{
      const fab = document.getElementById('voice-fab');
      if(fab) fab.style.display='none';
    });
    window.toggleVoiceCommand = ()=>{};
    return;
  }

  /* ── Command map ─────────────────────────────── */
  const COMMANDS = [
    {
      keys: ['medicine','दवाई','दवा','मेडिसिन','scan medicine','दवाई स्कैन','दवाई पहचान','मेडिकल','दवा स्कैन'],
      label: 'Medicine Scanner',
      action(){ openModule('medicine'); }
    },
    {
      keys: ['document','documents','doc','डॉक्यूमेंट','डॉक्युमेंट','दस्तावेज़','दस्तावेज','कागज़','कागज',
             'document reader','document helper','कागज स्कैन','दस्तावेज सहायक','दस्तावेज़ स्कैन'],
      label: 'Document Helper',
      action(){ openModule('document'); }
    },
    {
      keys: ['games','game','खेल','brain game','दिमाग खेल','memory','quiz','pattern','दिमाग की कसरत','गेम्स','गेम'],
      label: 'Brain Games',
      action(){ openModule('games'); }
    },
    {
      keys: ['daily','companion','daily companion','कंपेनियन','कम्पेनियन',
             'रोज़','रोज़ का साथी','साथी','reminder','याद दिलाओ','रिमाइंडर','daily routine','रूटीन'],
      label: 'Daily Companion',
      action(){ openModule('daily'); }
    },
    {
      keys: ['home','होम','घर','वापस','back','मुख्य','मुख पृष्ठ','go home','होम पेज'],
      label: 'Home',
      action(){ goHome(); }
    },
    {
      keys: ['stop','रुको','बंद','चुप','quiet','narrator off','बोलना बंद','आवाज़ बंद','चुप करो'],
      label: 'Stop Narrator',
      action(){ stopSpeech(); }
    },
    {
      keys: ['hindi','हिंदी','हिन्दी','switch hindi','हिंदी में'],
      label: 'Switch to Hindi',
      action(){ currentLang='hi'; applyLangUI(); speak(T.hi.langSwitch); }
    },
    {
      keys: ['english','अंग्रेज़ी','english mode','switch english','इंग्लिश'],
      label: 'Switch to English',
      action(){ currentLang='en'; applyLangUI(); speak(T.en.langSwitch); }
    },
    {
      keys: ['photo','scan','फ़ोटो','तस्वीर','कैमरा','capture','खींचो','तस्वीर लो','click photo'],
      label: 'Capture Photo',
      action(){
        if(currentScreen === 'screen-medicine'){
          document.getElementById('med-cap-btn')?.click();
        } else if(currentScreen === 'screen-document'){
          document.getElementById('doc-cap-btn')?.click();
        } else {
          openModule('medicine');
          setTimeout(()=>{ document.getElementById('med-cap-btn')?.click(); }, 1200);
        }
      }
    },
    {
      keys: ['memory game','मेमोरी खेल','जोड़ी मिलाओ','memory match'],
      label: 'Memory Game',
      action(){ openModule('games'); setTimeout(()=>startGame('memory'),400); }
    },
    {
      keys: ['quiz game','quiz','प्रश्नोत्तरी','सवाल जवाब','क्विज़','क्विज'],
      label: 'Quiz Game',
      action(){ openModule('games'); setTimeout(()=>startGame('quiz'),400); }
    },
    {
      keys: ['pattern game','pattern','पैटर्न खेल','पैटर्न'],
      label: 'Pattern Game',
      action(){ openModule('games'); setTimeout(()=>startGame('pattern'),400); }
    },
  ];

  /* ── Helper: match spoken text to a command ─── */
  function matchCommand(transcript){
    const t = transcript.toLowerCase().trim();
    for(const cmd of COMMANDS){
      for(const key of cmd.keys){
        if(t.includes(key.toLowerCase())) return cmd;
      }
    }
    return null;
  }

  /* ── Toast feedback ───────────────────────────── */
  let toastTimer = null;
  function showToast(heard, label){
    const toast = document.getElementById('vc-toast');
    if(!toast) return;
    toast.innerHTML = `<span class="vc-heard">"${heard}"</span>${label ? ' → '+label : ''}`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove('show'), 3200);
  }

  /* ── Recognition instance ─────────────────────── */
  const recog = new SpeechRecognition();
  recog.continuous      = false;
  recog.interimResults  = false;
  recog.maxAlternatives = 4;

  // Dynamically set language based on current app language
  function updateRecogLang(){
    recog.lang = currentLang === 'en' ? 'en-IN' : 'hi-IN';
  }
  updateRecogLang();

  let isListening = false;

  recog.onstart = ()=>{
    isListening = true;
    const fab = document.getElementById('voice-fab');
    if(fab) fab.classList.add('listening');
    showToast(currentLang==='hi' ? 'सुन रहा हूँ…' : 'Listening…', '');
  };

  recog.onend = ()=>{
    isListening = false;
    const fab = document.getElementById('voice-fab');
    if(fab) fab.classList.remove('listening');
  };

  recog.onerror = (e)=>{
    isListening = false;
    const fab = document.getElementById('voice-fab');
    if(fab) fab.classList.remove('listening');
    if(e.error === 'no-speech') showToast(currentLang==='hi' ? 'कुछ सुनाई नहीं दिया' : 'Nothing heard', '');
    else if(e.error === 'not-allowed') showToast('Mic permission denied', '');
  };

  recog.onresult = (e)=>{
    // Collect all alternatives, try to match a command in each
    let matched = null;
    let heardText = '';
    const allTranscripts = [];
    for(let i=0;i<e.results[0].length;i++){
      const alt = e.results[0][i].transcript.trim();
      allTranscripts.push(alt);
      if(i===0) heardText = alt;
      if(!matched){
        const cmd = matchCommand(alt);
        if(cmd){ matched = cmd; heardText = alt; }
      }
    }

    if(matched){
      showToast(heardText, matched.label);
      setTimeout(()=> matched.action(), 350);
    } else if(heardText.trim().length > 1){
      // No command matched → treat as general AI question
      askGeneralAI(heardText.trim());
    } else {
      showToast(heardText, currentLang==='hi' ? 'पहचाना नहीं' : 'Not recognized');
    }
  };

  /* ── Public toggle function ───────────────────── */
  window.toggleVoiceCommand = function(){
    if(isListening){
      recog.stop();
    } else {
      updateRecogLang(); // sync to current app language
      try{ recog.start(); }
      catch(err){ console.warn('[Voice]', err); }
    }
  };

  /* ── Keyboard shortcut: Space bar (long-press) ── */
  let spaceHold = null;
  document.addEventListener('keydown',(e)=>{
    if(e.code==='Space' && e.target.tagName!=='INPUT' && e.target.tagName!=='TEXTAREA'){
      if(!spaceHold) spaceHold = setTimeout(()=>{ if(!isListening) window.toggleVoiceCommand(); },600);
    }
  });
  document.addEventListener('keyup',(e)=>{
    if(e.code==='Space'){ clearTimeout(spaceHold); spaceHold=null; }
  });
})();

// ══════════════════════════════════════════════════
//  GENERAL AI VOICE CHAT
// ══════════════════════════════════════════════════

// ── Weather cache (30 min) ─────────────────────────
let _wxCache = { text: null, ts: 0 };
async function getLiveWeather(){
  const now = Date.now();
  if(_wxCache.text && now - _wxCache.ts < 30*60*1000) return _wxCache.text;
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(()=>ctrl.abort(), 4000);
    // wttr.in: free, no API key, auto-detects location by IP
    const r = await fetch('https://wttr.in/?format=%l:+%C,+%t+(Feels+%f),+Humidity+%h', { signal: ctrl.signal });
    clearTimeout(tid);
    const t = await r.text();
    _wxCache = { text: t.trim(), ts: now };
    return _wxCache.text;
  } catch(e){ return null; }
}

// Shared system prompt — date/time + weather + app feature awareness
async function buildSysPrompt(){
  const now  = new Date();
  const loc  = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
  const dateStr = now.toLocaleDateString(loc, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString(loc, { hour:'2-digit', minute:'2-digit' });
  const weather = await getLiveWeather();

  const context = currentLang === 'hi'
    ? `आज की जानकारी:\n- दिन/तारीख: ${dateStr}\n- समय: ${timeStr}${weather ? `\n- मौसम: ${weather}` : ''}`
    : `Current context:\n- Date: ${dateStr}\n- Time: ${timeStr}${weather ? `\n- Weather: ${weather}` : ''}`;

  const features = currentLang === 'hi'
    ? `DrishtiAI ऐप की सुविधाएं (जब जरूरत हो तो जवाब के बाद सुझाएं):
- "दवाई" बोलें → दवाई स्कैनर खुलेगा (दवाई की जानकारी के लिए)
- "दस्तावेज़" बोलें → दस्तावेज़ सहायक (आधार, PAN, पर्चा पढ़ने के लिए)
- "खेल" बोलें → दिमागी खेल (मेमोरी, क्विज़)
- "साथी" बोलें → रोज़ का साथी (रिमाइंडर, मूड)`
    : `DrishtiAI app features (suggest after answering when relevant):
- say "medicine" → Medicine Scanner (for medicine info)
- say "document" → Document Helper (for Aadhaar, PAN, prescriptions)
- say "games" → Brain Games (memory, quiz)
- say "daily" → Daily Companion (reminders, mood)`;

  const base = currentLang === 'hi'
    ? `आप DrishtiAI हैं — भारतीय बुजुर्गों और दिव्यांग लोगों के एक मज़ेदार, हँसमुख AI साथी। आपकी बातें हल्की-फुल्की, थोड़ी शरारती और दिल को छूने वाली होती हैं — जैसे कोई प्यारा पोता या पोती बात कर रहा हो। कभी-कभी एक हल्की सी मज़ाकिया बात या चुटकी लगाना न भूलें, पर जानकारी सही और काम की दें।
जवाब देने के नियम:
1. पहले सवाल का सीधा, सरल जवाब दें (1-2 वाक्य) — थोड़ा मज़ेदार अंदाज़ में।
2. अगर सवाल ऊपर दी किसी सुविधा से जुड़ा हो तो जवाब के बाद एक लाइन में सुझाएं।
3. कोई markdown नहीं। केवल सादा टेक्स्ट। कुल 2-3 वाक्य।`
    : `You are DrishtiAI — a fun, goofy, and lovable AI buddy for elderly and disabled Indians. You're like that cheerful grandkid who always has a joke ready but also genuinely helps. Keep it light, warm, a little silly sometimes — maybe sneak in a gentle pun or a playful comment — but always give correct and useful information.
Rules for answering:
1. First give a direct, simple answer (1-2 sentences) — with a fun, goofy twist.
2. If the question relates to an app feature above, add one short suggestion at the end.
3. No markdown. Plain text only. Total 2-3 sentences.`;

  return `${base}\n\n${context}\n\n${features}`;
}

function showAIBubble(question, answer){
  let b = document.getElementById('ai-voice-bubble');
  if(!b){ b = document.createElement('div'); b.id='ai-voice-bubble'; document.body.appendChild(b); }
  b.innerHTML = `
    <div class="aib-header">
      <span class="aib-label">🤖 ${currentLang==='hi' ? 'AI जवाब' : 'AI Answer'}</span>
      <button class="aib-close" onclick="document.getElementById('ai-voice-bubble').classList.remove('show')">✕</button>
    </div>
    <div class="aib-q">"${question}"</div>
    <div class="aib-a">${answer}</div>`;
  b.classList.add('show');
  clearTimeout(b._t);
  b._t = setTimeout(()=>b.classList.remove('show'), 18000);
}

async function askGeneralAI(question){
  let b = document.getElementById('ai-voice-bubble');
  if(!b){ b = document.createElement('div'); b.id='ai-voice-bubble'; document.body.appendChild(b); }
  b.innerHTML = `
    <div class="aib-header">
      <span class="aib-label">🤖 ${currentLang==='hi' ? 'AI सोच रहा है…' : 'AI Thinking…'}</span>
      <button class="aib-close" onclick="document.getElementById('ai-voice-bubble').classList.remove('show')">✕</button>
    </div>
    <div class="aib-q">"${question}"</div>
    <div class="aib-thinking">
      <div class="aib-dots"><span></span><span></span><span></span></div>
      ${currentLang==='hi' ? 'जवाब ढूंढ रहा हूँ…' : 'Fetching answer…'}
    </div>`;
  b.classList.add('show');
  clearTimeout(b._t);

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: await buildSysPrompt() },
          { role: 'user',   content: question }
        ],
        max_tokens: 130,
        temperature: 0.4
      })
    });
    const data = await res.json();
    const answer = cleanAI(data.choices?.[0]?.message?.content ||
      (currentLang==='hi' ? 'माफ़ करें, जवाब नहीं मिला।' : 'Sorry, could not get an answer.'));
    showAIBubble(question, answer);
    appendChatMsg(question, 'user');
    appendChatMsg(answer, 'ai');
    if(!aiPanelOpen) toggleAIPanel();
    speak(answer);
  } catch(err){
    const msg = currentLang==='hi' ? 'माफ़ करें, अभी जवाब नहीं मिल सका।' : 'Sorry, could not fetch an answer right now.';
    showAIBubble(question, msg);
    speak(msg);
  }
}

// ══════════════════════════════════════════════════
//  AI TEXT CHAT PANEL
// ══════════════════════════════════════════════════

let aiPanelOpen = false;

function toggleAIPanel(){
  aiPanelOpen = !aiPanelOpen;
  document.getElementById('ai-chat-panel').classList.toggle('open', aiPanelOpen);
  document.getElementById('ai-chat-overlay').classList.toggle('open', aiPanelOpen);
  if(aiPanelOpen){
    const isHi = currentLang === 'hi';
    document.getElementById('acp-input').placeholder = isHi ? 'अपना सवाल टाइप करें…' : 'Type your question…';
    document.getElementById('acm-status').textContent  = isHi ? 'ऑनलाइन • मदद के लिए तैयार!' : 'Online • Ready to help!';
    document.getElementById('acm-welcome-txt').textContent = isHi
      ? 'नमस्ते! मैं DrishtiAI हूँ — आपका मज़ेदार छोटा सहायक। कुछ भी पूछें, हँसते-हँसते जवाब दूँगा!'
      : 'Namaste! I\'m DrishtiAI, your goofy little helper. Ask me anything — I might even make you smile!';
    setTimeout(()=>document.getElementById('acp-input').focus(), 350);
  }
}

function closeAIPanel(){
  aiPanelOpen = false;
  document.getElementById('ai-chat-panel').classList.remove('open');
  document.getElementById('ai-chat-overlay').classList.remove('open');
}

// Voice button inside the chat modal
let chatVoiceRecog = null;
let chatVoiceListening = false;

function toggleChatVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) {
    appendChatMsg(currentLang==='hi' ? 'आपके browser में voice नहीं है, टाइप करें!' : 'Voice not supported, please type!', 'ai');
    return;
  }
  if(chatVoiceListening){
    chatVoiceRecog?.stop();
    return;
  }
  if(!chatVoiceRecog){
    chatVoiceRecog = new SpeechRecognition();
    chatVoiceRecog.continuous     = false;
    chatVoiceRecog.interimResults = false;
    chatVoiceRecog.maxAlternatives = 2;

    chatVoiceRecog.onstart = ()=>{
      chatVoiceListening = true;
      const btn = document.getElementById('acm-voice-btn');
      if(btn) btn.classList.add('listening');
      document.getElementById('acm-status').textContent = currentLang==='hi' ? '🎤 सुन रहा हूँ…' : '🎤 Listening…';
    };
    chatVoiceRecog.onend = ()=>{
      chatVoiceListening = false;
      const btn = document.getElementById('acm-voice-btn');
      if(btn) btn.classList.remove('listening');
      document.getElementById('acm-status').textContent = currentLang==='hi' ? 'ऑनलाइन • मदद के लिए तैयार!' : 'Online • Ready to help!';
    };
    chatVoiceRecog.onerror = ()=>{
      chatVoiceListening = false;
      document.getElementById('acm-voice-btn')?.classList.remove('listening');
    };
    chatVoiceRecog.onresult = (e)=>{
      const heard = e.results[0][0].transcript.trim();
      if(heard){
        document.getElementById('acp-input').value = heard;
        sendAIChat();
      }
    };
  }
  chatVoiceRecog.lang = currentLang === 'en' ? 'en-IN' : 'hi-IN';
  try{ chatVoiceRecog.start(); } catch(e){}
}

function appendChatMsg(text, role){
  const hist = document.getElementById('acp-history');
  const div = document.createElement('div');
  div.className = `acp-msg ${role}`;
  div.textContent = text;
  hist.appendChild(div);
  hist.scrollTop = hist.scrollHeight;
  return div;
}

async function sendAIChat(){
  const inp = document.getElementById('acp-input');
  const question = inp.value.trim();
  if(!question) return;
  inp.value = '';

  const hist = document.getElementById('acp-history');
  appendChatMsg(question, 'user');

  // AI bubble that fills via streaming
  const aiDiv = document.createElement('div');
  aiDiv.className = 'acp-msg ai';
  aiDiv.textContent = '…';
  hist.appendChild(aiDiv);
  hist.scrollTop = hist.scrollHeight;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: await buildSysPrompt() },
          { role: 'user',   content: question }
        ],
        max_tokens: 130,
        temperature: 0.4,
        stream: true
      })
    });

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';

    while(true){
      const { done, value } = await reader.read();
      if(done) break;
      for(const line of decoder.decode(value, {stream:true}).split('\n')){
        if(!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if(raw === '[DONE]') break;
        try {
          const delta = JSON.parse(raw).choices?.[0]?.delta?.content || '';
          fullText += delta;
          aiDiv.textContent = cleanAI(fullText) || '…';
          hist.scrollTop = hist.scrollHeight;
        } catch(e){}
      }
    }

    const final = cleanAI(fullText) ||
      (currentLang==='hi' ? 'माफ़ करें, जवाब नहीं मिला।' : 'Sorry, could not get an answer.');
    aiDiv.textContent = final;
    speak(final);
  } catch(err){
    const msg = currentLang==='hi' ? 'माफ़ करें, अभी जवाब नहीं मिल सका।' : 'Sorry, could not fetch an answer right now.';
    aiDiv.textContent = msg;
  }
}

// ── SECTION NAVIGATOR (voice command fallback) ────
function showSection(name){
  // Mapping to openModule / goHome
  if(name==='home') goHome();
  else if(['medicine','document','games','daily'].includes(name)) openModule(name);
  else show('screen-'+name);
}

// Voices
if(window.speechSynthesis){
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices();
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden) stopCams(); });

// Auto-welcome + init lang UI + warm-up OCR worker
window.addEventListener('load', () => {
  applyLangUI();
  setTimeout(speakWelcome, 1000);
  // Pre-load Tesseract in background so first scan is instant
  setTimeout(() => getOCRWorker().catch(() => {}), 3000);

  // ── Register Service Worker (PWA) ──────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('[DrishtiAI] SW registered'))
      .catch(e => console.log('[DrishtiAI] SW failed:', e));
  }
});