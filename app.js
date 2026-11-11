'use strict';
const $ = s => document.querySelector(s);
const R = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = s => String(s).replace(/<[^>]+>/g, '');

/* ---------- state ---------- */
const KEY = 'hum2-town-v1';
const S = Object.assign({ stars: 0, best: {}, learned: {}, wrong: [], stk: [], sound: true }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
// index all questions with ids
const QBY = {};
ZONES.forEach(z => z.qs.forEach((q, i) => { q.id = z.id + i; q.zone = z.id; QBY[q.id] = q; }));
const ZBY = Object.fromEntries(ZONES.map(z => [z.id, z]));

/* ---------- sound & speech ---------- */
let AC;
function tone(seq) { if (!S.sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); let t = AC.currentTime; for (const [f, d] of seq) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); t += d * .7; } } catch (e) { } }
const sGood = () => tone([[784, .12], [988, .12], [1319, .25]]);
const sBad = () => tone([[330, .18], [262, .25]]);
const sTap = () => tone([[660, .05]]);
let VOICE = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    const norm = v => v.lang.replace('_', '-').toLowerCase();
    VOICE = vs.find(v => norm(v) === 'zh-hk') || vs.find(v => /yue|cantonese|粵|廣東/i.test(v.name + v.lang)) || null;
  } catch (e) { }
}
try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { }
const spoken = t => strip(t).replace(/＿＿/g, '，空格，').replace(/[✓✗★☆]/g, '').replace(/\$(\d+)/g, '$1元').replace(/STEAM/g, '斯廷');
function say(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spoken(text));
    u.lang = 'zh-HK'; if (!VOICE) pickVoice(); if (VOICE) u.voice = VOICE;
    u.rate = .85;
    speechSynthesis.speak(u);
  } catch (e) { }
}
function stopSay() { try { speechSynthesis.cancel(); } catch (e) { } }
function voiceNote() {
  if (!('speechSynthesis' in window)) return '這個瀏覽器不支援朗讀功能。';
  pickVoice();
  if (!VOICE && speechSynthesis.getVoices().length) return '提示：找不到粵語語音。iPad 可到「設定 › 輔助使用 › 朗讀內容 › 聲音 › 中文（香港）」下載。';
  return '';
}

/* ---------- fx ---------- */
function confetti() { const fx = $('#fx'); const cols = ['#FF8FB8', '#FFC21A', '#8B6FE0', '#38B98A', '#3C9BE0', '#FF8F5C']; for (let i = 0; i < 30; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.left = R(0, 100) + 'vw'; c.style.background = pick(cols); c.style.animationDelay = (Math.random() * .3) + 's'; if (Math.random() < .4) c.style.borderRadius = '50%'; fx.appendChild(c); setTimeout(() => c.remove(), 1900); } }
function popText(t) { const p = document.createElement('div'); p.className = 'pop'; p.textContent = t; $('#fx').appendChild(p); setTimeout(() => p.remove(), 1000); }
function updStars(bump) { $('#starCount').textContent = S.stars; if (bump) { const p = $('#starPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* ---------- screens ---------- */
const app = $('#app');
let timerId = null;
function view(html) { stopSay(); clearInterval(timerId); app.innerHTML = html; window.scrollTo({ top: 0 }); }
function starsOf(id) { const b = S.best[id]; if (b == null) return '<span class="st off">☆☆☆</span>'; const n = b >= .9 ? 3 : b >= .7 ? 2 : b >= .4 ? 1 : 0; return '<span class="st">' + '★'.repeat(n) + '<i>' + '☆'.repeat(3 - n) + '</i></span>'; }
function daysLeft() { const exam = new Date(2026, 10, 16); const now = new Date(); now.setHours(0, 0, 0, 0); return Math.round((exam - now) / 864e5); }

function home() {
  const d = daysLeft();
  const cd = d > 0 ? `距離人文科評估還有 <b>${d}</b> 天` : d === 0 ? '今天評估，加油！' : '評估完成，繼續保持！';
  view(`
  <section class="hero">
    <img class="hero-bg" src="img/hum-hero.webp" alt="人文小鎮地圖">
    <div class="hero-card">
      <h1>人文小鎮大冒險</h1>
      <p>二年級上學期 · 第3、4、5課 ＋ 已有知識</p>
      <p class="cd">${cd}</p>
    </div>
    <img class="hero-m m1" src="img/susu-cheer.webp" alt="">
    <img class="hero-m m2" src="img/neko-happy.webp" alt="">
  </section>
  <h2 class="sec">選擇一個地點開始冒險</h2>
  <div class="zones">
    ${ZONES.map(z => `<button class="zone" style="--c:${z.color}" data-z="${z.id}">
      <img src="${z.img}" alt="">
      <div class="zt"><b>${z.name}</b><small>${z.lesson}</small>${starsOf(z.id)}</div></button>`).join('')}
    <button class="zone boss" data-boss="1"><img src="img/z-boss.webp" alt="">
      <div class="zt"><b>終極挑戰城堡</b><small>綜合模擬 · 20題 · 30分鐘</small>${starsOf('boss')}</div></button>
  </div>
  <div class="extras">
    <button class="pill-btn" id="wrongBtn">📒 錯題本 <b>${S.wrong.length}</b></button>
    <button class="pill-btn" id="stkBtn">🌟 貼紙簿 <b>${S.stk.length}/${STICKERS.length}</b></button>
  </div>
  <p class="vnote">${voiceNote()}</p>`);
  app.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { sTap(); zone(b.dataset.z); });
  app.querySelector('[data-boss]').onclick = () => { sTap(); bossIntro(); };
  $('#wrongBtn').onclick = () => { sTap(); wrongBook(); };
  $('#stkBtn').onclick = () => { sTap(); stickerBook(); };
}

function backBar(label, fn) { return `<div class="backbar"><button class="back" id="backBtn">‹ ${label}</button></div>`; }
function bindBack(fn) { $('#backBtn').onclick = () => { sTap(); fn(); }; }

function zone(id) {
  const z = ZBY[id];
  const ln = (S.learned[id] || []).length;
  view(`${backBar('小鎮地圖')}
  <section class="zhead" style="--c:${z.color}">
    <img src="${z.img}" alt="">
    <div><p class="unit">${z.unit}</p><h1>${z.name}</h1><p class="lesson">${z.lesson}</p>${starsOf(id)}</div>
  </section>
  <div class="modes">
    <button class="mode" id="mLearn" style="--c:${z.color}"><span class="mi">📖</span><b>學一學</b><small>重點卡 ${ln}/${z.learn.length} 張已看</small></button>
    <button class="mode" id="mPlay" style="--c:${z.color}"><span class="mi">🎮</span><b>闖關遊戲</b><small>10 題 · 各種小遊戲</small></button>
    <button class="mode" id="mAll" style="--c:${z.color}"><span class="mi">🏅</span><b>全部題目挑戰</b><small>${z.qs.length} 題 · 徹底溫習</small></button>
  </div>
  <div class="tipbox"><img src="img/neko-soft.webp" alt=""><p>先「學一學」看重點卡，再去「闖關遊戲」！全部答對可以拿三粒星。</p></div>`);
  bindBack(home);
  $('#mLearn').onclick = () => { sTap(); learn(id, 0); };
  $('#mPlay').onclick = () => { sTap(); play({ zone: id, qs: pickRound(z.qs, 10), title: z.name + ' · 闖關遊戲', key: id }); };
  $('#mAll').onclick = () => { sTap(); play({ zone: id, qs: shuffle(z.qs), title: z.name + ' · 全部題目', key: id }); };
}

function pickRound(qs, n, ns = 5) {
  // ensure variety: at least one of each special type when present
  const special = ['sort', 'match', 'order', 'multi', 'fill'];
  const out = [];
  shuffle(special).forEach(t => { const c = qs.filter(q => q.t === t); if (c.length && out.length < ns) out.push(pick(c)); });
  const rest = shuffle(qs.filter(q => !out.includes(q)));
  while (out.length < n && rest.length) out.push(rest.pop());
  return shuffle(out.slice(0, n));
}

function cardHtml(c) {
  let h = `<h2>${c.h}</h2>`;
  if (c.b) h += `<p>${c.b}</p>`;
  if (c.list) h += `<ul>${c.list.map(x => `<li>${x}</li>`).join('')}</ul>`;
  if (c.ol) h += `<ol class="steps">${c.ol.map((x, i) => `<li><span>${i + 1}</span>${x}</li>`).join('')}</ol>`;
  if (c.table) h += `<div class="tbl">${c.table.map(r => `<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>`;
  if (c.tip) h += `<p class="tip">💡 ${c.tip}</p>`;
  return h;
}
function cardText(c) { return [c.h, c.b, ...(c.list || []), ...(c.ol || []), ...(c.table || []).map(r => r.join('，')), c.tip].filter(Boolean).map(strip).join('。'); }

function learn(id, i) {
  const z = ZBY[id], c = z.learn[i];
  const L = S.learned[id] = S.learned[id] || []; if (!L.includes(i)) { L.push(i); save(); }
  view(`${backBar(z.name)}
  <div class="learn" style="--c:${z.color}">
    <div class="dots">${z.learn.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <article class="lcard">${cardHtml(c)}
      <button class="say" id="sayBtn">🔊 粵語朗讀</button></article>
    <div class="lnav">
      <button class="nbtn" id="prev" ${i === 0 ? 'disabled' : ''}>‹ 上一張</button>
      <span>${i + 1} / ${z.learn.length}</span>
      ${i < z.learn.length - 1 ? `<button class="nbtn pri" id="next">下一張 ›</button>` : `<button class="nbtn pri" id="go">去闖關 🎮</button>`}
    </div>
  </div>`);
  bindBack(() => zone(id));
  $('#sayBtn').onclick = () => say(cardText(c));
  if (i > 0) $('#prev').onclick = () => { sTap(); learn(id, i - 1); };
  if ($('#next')) $('#next').onclick = () => { sTap(); learn(id, i + 1); };
  if ($('#go')) $('#go').onclick = () => { sTap(); play({ zone: id, qs: pickRound(z.qs, 10), title: z.name + ' · 闖關遊戲', key: id }); };
  // swipe
  let x0 = null; const el = app.querySelector('.lcard');
  el.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  el.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (dx < -60 && i < z.learn.length - 1) learn(id, i + 1); else if (dx > 60 && i > 0) learn(id, i - 1); });
}

function bossIntro() {
  view(`${backBar('小鎮地圖')}
  <section class="zhead boss-h" style="--c:#E0A21A"><img src="img/z-boss.webp" alt="">
    <div><p class="unit">綜合模擬</p><h1>終極挑戰城堡</h1><p class="lesson">第3、4、5課 ＋ 已有知識 · 20 題</p>${starsOf('boss')}</div></section>
  <div class="tipbox"><img src="img/susu-think.webp" alt=""><p>真正評估有 30 分鐘。這裏也有 30 分鐘計時，試試在時間內完成！每次題目都不同。</p></div>
  <div class="modes one"><button class="mode big" id="startBoss" style="--c:#E0A21A"><span class="mi">🏰</span><b>開始挑戰</b><small>計時 30 分鐘</small></button></div>`);
  bindBack(home);
  $('#startBoss').onclick = () => {
    sTap();
    const qs = shuffle(ZONES.flatMap(z => pickRound(z.qs, 5, 2)));
    play({ zone: null, qs, title: '終極挑戰', key: 'boss', timer: 30 * 60 });
  };
}

/* ---------- game engine ---------- */
let G = null;
function play(cfg) { G = Object.assign({ i: 0, right: 0, results: [] }, cfg); G.t0 = Date.now(); renderQ(); }
const typeLabel = { mc: '選擇題', tf: '對還是錯？', fill: '填一填', sort: '分類遊戲', order: '排一排', match: '配對遊戲', multi: '多項選擇' };

function renderQ() {
  const q = G.qs[G.i], z = ZBY[q.zone];
  const pct = Math.round(G.i / G.qs.length * 100);
  view(`<div class="backbar"><button class="back" id="quitBtn">✕ 離開</button>
    <div class="prog"><i style="width:${pct}%"></i></div><span class="qn">${G.i + 1}/${G.qs.length}</span>${G.timer ? '<span class="timer" id="timer"></span>' : ''}</div>
  <section class="qbox" style="--c:${z.color}">
    <div class="qtag">${G.zone ? '' : `<em>${z.name}</em>`}${typeLabel[q.t]}</div>
    <div class="qrow"><h2 class="qtext">${q.t === 'fill' ? esc(q.q).replace('＿＿', '<span class="blank" id="blank">　　</span>') : esc(q.q)}</h2>
    <button class="say sm" id="sayBtn" aria-label="朗讀題目">🔊</button></div>
    ${q.img ? `<img class="qimg" src="${q.img}" alt="">` : ''}
    <div id="ans"></div>
  </section>
  <div id="fb"></div>`);
  $('#quitBtn').onclick = () => { sTap(); if (confirm('要離開這一關嗎？進度不會保存。')) G.zone ? zone(G.zone) : home(); };
  $('#sayBtn').onclick = () => say(q.q + (q.t === 'mc' ? '。' + q.o.join('。') : ''));
  if (G.timer) tick();
  ({ mc: qMC, tf: qTF, fill: qFill, sort: qSort, order: qOrder, match: qMatch, multi: qMulti })[q.t](q, $('#ans'));
}
function tick() {
  const upd = () => { const left = Math.max(0, G.timer - Math.floor((Date.now() - G.t0) / 1000)); const el = $('#timer'); if (el) { el.textContent = '⏱ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); el.classList.toggle('low', left < 300); } if (left <= 0) { clearInterval(timerId); finish(true); } };
  upd(); timerId = setInterval(upd, 1000);
}

function done(ok, q, ex) {
  G.results.push({ id: q.id, ok });
  const wi = S.wrong.indexOf(q.id);
  if (ok) { G.right++; S.stars++; updStars(true); sGood(); popText(pick(['好叻呀！', '答對了！', '真棒！', '做得好！'])); if (G.review && wi >= 0) S.wrong.splice(wi, 1); }
  else { sBad(); if (wi < 0) S.wrong.push(q.id); }
  save();
  const fb = $('#fb');
  fb.innerHTML = `<div class="fbar ${ok ? 'ok' : 'no'}"><img src="img/${ok ? 'susu-cheer' : 'neko-soft'}.webp" alt="">
    <div><b>${ok ? pick(['答對了！', '好叻呀！', '完全正確！']) : '不要緊，記住：'}</b>${ex ? `<p>${esc(ex)}</p>` : ''}</div>
    <button class="nbtn pri" id="nextQ">${G.i < G.qs.length - 1 ? '下一題 ›' : '看結果 ★'}</button></div>`;
  $('#nextQ').onclick = () => { sTap(); G.i++; G.i < G.qs.length ? renderQ() : finish(); };
  setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function qMC(q, box) {
  const opts = shuffle(q.o);
  box.innerHTML = `<div class="opts">${opts.map(o => `<button class="opt">${esc(o)}</button>`).join('')}</div>`;
  box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const ok = b.textContent === q.o[0];
    box.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.textContent === q.o[0]) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    done(ok, q, q.ex);
  });
}
function qTF(q, box) {
  box.innerHTML = `<div class="tf"><button class="opt tfb" data-v="1"><span>✓</span>對</button><button class="opt tfb" data-v="0"><span>✗</span>錯</button></div>`;
  box.querySelectorAll('.tfb').forEach(b => b.onclick = () => {
    const v = b.dataset.v === '1', ok = v === q.a;
    box.querySelectorAll('.tfb').forEach(x => { x.disabled = true; if ((x.dataset.v === '1') === q.a) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    done(ok, q, q.ex);
  });
}
function qFill(q, box) {
  const opts = shuffle([q.a, ...q.o]);
  box.innerHTML = `<p class="hint">點選正確的詞語填入空格</p><div class="chips">${opts.map(o => `<button class="chip">${esc(o)}</button>`).join('')}</div>`;
  box.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    const ok = b.textContent === q.a; const bl = $('#blank');
    bl.textContent = q.a; bl.classList.add(ok ? 'filled' : 'fixed');
    box.querySelectorAll('.chip').forEach(x => { x.disabled = true; if (x.textContent === q.a) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    done(ok, q, q.ex || ('答案是「' + q.a + '」。'));
  });
}
function qSort(q, box) {
  let sel = null, miss = 0, left = q.items.length;
  const items = shuffle(q.items);
  box.innerHTML = `<p class="hint">先點選一張卡，再點選要放進的籃子</p>
   <div class="chips tray">${items.map((it, k) => `<button class="chip card" data-k="${k}">${esc(it[0])}</button>`).join('')}</div>
   <div class="bins">${q.bins.map((b, k) => `<button class="bin b${k}" data-b="${k}"><b>${esc(b)}</b><div class="inbin"></div></button>`).join('')}</div>`;
  box.querySelectorAll('.card').forEach(c => c.onclick = () => { sTap(); box.querySelectorAll('.card').forEach(x => x.classList.remove('sel')); sel = c; c.classList.add('sel'); });
  box.querySelectorAll('.bin').forEach(bn => bn.onclick = () => {
    if (!sel) { shake(box.querySelector('.tray')); return; }
    const it = items[+sel.dataset.k];
    if (it[1] === +bn.dataset.b) {
      sTap(); const t = document.createElement('span'); t.textContent = it[0]; bn.querySelector('.inbin').appendChild(t);
      sel.remove(); sel = null; left--;
      if (!left) done(miss === 0, q, miss ? `有 ${miss} 次放錯了，下次再細心一點！` : '全部分類正確！');
    } else { miss++; sBad(); shake(bn); shake(sel); }
  });
}
function qOrder(q, box) {
  let n = 0, miss = 0;
  const items = shuffle(q.items.map((t, k) => [t, k]));
  box.innerHTML = `<p class="hint">按正確次序，逐一點選</p><ol class="olist" id="olist"></ol>
   <div class="chips col">${items.map(it => `<button class="chip card" data-k="${it[1]}">${esc(it[0])}</button>`).join('')}</div>`;
  box.querySelectorAll('.card').forEach(c => c.onclick = () => {
    if (+c.dataset.k === n) { sTap(); const li = document.createElement('li'); li.innerHTML = `<span>${n + 1}</span>${esc(c.textContent)}`; $('#olist').appendChild(li); c.remove(); n++; if (n === q.items.length) done(miss === 0, q, miss ? '記住次序：' + q.items.join(' → ') : '次序完全正確！'); }
    else { miss++; sBad(); shake(c); }
  });
}
function qMatch(q, box) {
  let selL = null, miss = 0, left = q.pairs.length;
  const L = shuffle(q.pairs.map((p, k) => [p[0], k])), Rr = shuffle(q.pairs.map((p, k) => [p[1], k]));
  box.innerHTML = `<p class="hint">先點選左邊，再點選右邊配對</p><div class="match">
   <div class="mcol">${L.map(x => `<button class="chip ml" data-k="${x[1]}">${esc(x[0])}</button>`).join('')}</div>
   <div class="mcol">${Rr.map(x => `<button class="chip mr" data-k="${x[1]}">${esc(x[0])}</button>`).join('')}</div></div>`;
  const cols = ['#FFD3E2', '#D6ECFF', '#D9F5E5', '#FFF0B8', '#E6DDFF', '#FFE0CC'];
  box.querySelectorAll('.ml').forEach(b => b.onclick = () => { sTap(); box.querySelectorAll('.ml').forEach(x => x.classList.remove('sel')); selL = b; b.classList.add('sel'); });
  box.querySelectorAll('.mr').forEach(b => b.onclick = () => {
    if (!selL) { shake(box.querySelector('.mcol')); return; }
    if (selL.dataset.k === b.dataset.k) {
      sTap(); const c = cols[left % cols.length];[selL, b].forEach(x => { x.disabled = true; x.classList.remove('sel'); x.classList.add('paired'); x.style.background = c; }); selL = null; left--;
      if (!left) done(miss === 0, q, miss ? `有 ${miss} 次配錯了，再溫習一次吧！` : '全部配對正確！');
    } else { miss++; sBad(); shake(b); }
  });
}
function qMulti(q, box) {
  const opts = shuffle(q.o);
  box.innerHTML = `<p class="hint">可以選多於一個，選好後按「確定」</p><div class="chips">${opts.map(o => `<button class="chip tog" data-v="${o[1]}">${esc(o[0])}</button>`).join('')}</div>
   <button class="nbtn pri ok-btn" id="okBtn">確定</button>`;
  box.querySelectorAll('.tog').forEach(b => b.onclick = () => { sTap(); b.classList.toggle('on'); });
  $('#okBtn').onclick = () => {
    let ok = true;
    box.querySelectorAll('.tog').forEach(b => { b.disabled = true; const want = b.dataset.v === '1', on = b.classList.contains('on'); if (want !== on) ok = false; if (want) b.classList.add('right'); else if (on) b.classList.add('wrong'); });
    $('#okBtn').remove();
    done(ok, q, '正確答案：' + q.o.filter(o => o[1]).map(o => o[0]).join('、'));
  };
}

function finish(timeUp) {
  clearInterval(timerId);
  const n = G.results.length || G.qs.length, sc = G.right / G.qs.length;
  if (!G.review) S.best[G.key] = Math.max(S.best[G.key] || 0, sc);
  let newStk = null;
  if (sc >= .7 && S.stk.length < STICKERS.length) { newStk = STICKERS.find(s => !S.stk.includes(s)); S.stk.push(newStk); }
  save();
  const stars = sc >= .9 ? 3 : sc >= .7 ? 2 : sc >= .4 ? 1 : 0;
  const mins = Math.round((Date.now() - G.t0) / 60000);
  if (stars >= 2) confetti();
  const back = G.zone ? () => zone(G.zone) : G.review ? wrongBook : home;
  view(`<section class="result">
    <img class="rm" src="img/${stars >= 2 ? 'susu-cheer' : 'susu-think'}.webp" alt="">
    <h1>${timeUp ? '時間到！' : stars === 3 ? '太厲害了！' : stars === 2 ? '做得好！' : '繼續努力！'}</h1>
    <p class="big">${G.right} / ${G.qs.length}</p>
    <p class="rstars">${'★'.repeat(stars)}<i>${'☆'.repeat(3 - stars)}</i></p>
    <p>${G.title} · 用時約 ${mins} 分鐘</p>
    ${newStk ? `<div class="newstk"><img src="img/stk/${newStk}.webp" alt=""><p>你得到一張新貼紙！</p></div>` : sc < .7 ? '<p class="tip">答對七成或以上，就可以得到貼紙！</p>' : ''}
    <div class="rbtns">
      <button class="nbtn pri" id="again">再玩一次</button>
      ${S.wrong.length ? `<button class="nbtn" id="toWrong">📒 錯題本 (${S.wrong.length})</button>` : ''}
      <button class="nbtn" id="toBack">返回</button>
    </div></section>`);
  const cfg = { zone: G.zone, title: G.title, key: G.key, timer: G.timer, review: G.review };
  $('#again').onclick = () => { sTap(); if (cfg.key === 'boss') { bossIntro(); return; } if (cfg.review) { wrongBook(); return; } play(Object.assign(cfg, { qs: pickRound(ZBY[cfg.zone].qs, 10) })); };
  if ($('#toWrong')) $('#toWrong').onclick = () => { sTap(); wrongBook(); };
  $('#toBack').onclick = () => { sTap(); back(); };
}

function qSummary(q) {
  let a = '';
  if (q.t === 'mc') a = q.o[0]; else if (q.t === 'tf') a = q.a ? '✓ 對' : '✗ 錯'; else if (q.t === 'fill') a = q.a;
  else if (q.t === 'multi') a = q.o.filter(o => o[1]).map(o => o[0]).join('、');
  else if (q.t === 'order') a = q.items.join(' → ');
  else if (q.t === 'match') a = q.pairs.map(p => p[0] + '－' + p[1]).join('；');
  else if (q.t === 'sort') a = q.bins.map((b, k) => b + '：' + q.items.filter(i => i[1] === k).map(i => i[0]).join('、')).join('　');
  return a;
}
function wrongBook() {
  const ws = S.wrong.map(id => QBY[id]).filter(Boolean);
  view(`${backBar('小鎮地圖')}
  <h1 class="ptitle">📒 錯題本</h1>
  ${ws.length ? `<p class="center">答錯的題目會放在這裏。重做答對了，就會從錯題本移走。</p>
   <div class="center"><button class="nbtn pri" id="redo">重做錯題（${ws.length} 題）</button></div>
   <div class="wlist">${ws.map(q => `<div class="witem" style="--c:${ZBY[q.zone].color}"><small>${ZBY[q.zone].name} · ${typeLabel[q.t]}</small><p>${esc(q.q)}</p><p class="wa">答案：${esc(qSummary(q))}</p></div>`).join('')}</div>`
      : `<div class="tipbox"><img src="img/neko-happy.webp" alt=""><p>錯題本是空的，真厲害！</p></div>`}`);
  bindBack(home);
  if ($('#redo')) $('#redo').onclick = () => { sTap(); play({ zone: null, qs: shuffle(ws).slice(0, 15), title: '錯題重做', key: 'review', review: true }); };
}
function stickerBook() {
  view(`${backBar('小鎮地圖')}
  <h1 class="ptitle">🌟 貼紙簿</h1>
  <p class="center">每次闖關答對七成或以上，就可以得到一張貼紙。</p>
  <div class="stks">${STICKERS.map(s => S.stk.includes(s) ? `<div class="stk"><img src="img/stk/${s}.webp" alt=""></div>` : `<div class="stk lock">？</div>`).join('')}</div>
  <p class="center small">總星星：★ ${S.stars}</p>
  <div class="center"><button class="nbtn" id="reset">重新開始（清除紀錄）</button></div>`);
  bindBack(home);
  $('#reset').onclick = () => { if (confirm('確定要清除所有星星、貼紙和紀錄嗎？')) { localStorage.removeItem(KEY); location.reload(); } };
}

$('#homeBtn').onclick = () => { sTap(); home(); };
const sb = $('#soundBtn');
const updSound = () => sb.textContent = S.sound ? '🔊' : '🔇';
sb.onclick = () => { S.sound = !S.sound; save(); updSound(); };
updSound(); updStars(); home();
