/* 게임: 교실 장면에서 직접 해 보는 두 단계.
   desk  = 시험 직전 책상 점검(끌어서 세 곳으로 정리)
   watch = 시험 중 부정행위 찾기(움직이는 학생 6명) + 종료령 */
const G = (() => {
  const $ = s => document.querySelector(s);
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const isTv = () => document.documentElement.classList.contains('tv');
  let svg, st = null, timers = [], toastTimer;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  // [그림, 이름, 가야 할 곳, 이유]  — submit: 소지 금지라 제출 / bag: 가방·사물함 / desk: 책상 위
  const BAN = '소지 금지 품목이에요. 가져왔다면 시험 시작 전에 제출해요.';
  const ETC = '소지 가능 품목이 아니면 사물함에 넣거나, 가방에 넣고 지퍼를 잠가요.';
  const OKAY = '소지 가능 품목이에요. 책상 위에 둘 수 있어요.';
  const ITEMS = [
    ['phone', '휴대전화', 'submit', BAN], ['smartwatch', '스마트 워치', 'submit', BAN], ['headset', '무선 이어폰', 'submit', BAN],
    ['calc', '전자계산기', 'submit', BAN], ['edict', '전자사전', 'submit', BAN], ['camera', '디지털 카메라', 'submit', BAN],
    ['mp3', 'MP3 플레이어', 'submit', BAN], ['recorder', '녹음기', 'submit', BAN], ['radio', '라디오', 'submit', BAN], ['campen', '카메라펜', 'submit', BAN],
    ['digiwatch', '전자시계', 'submit', '전자식 화면이 있는 시계는 소지 금지예요. 제출해요.'],
    ['book', '교과서', 'bag', ETC], ['note', '공책', 'bag', ETC], ['books', '문제집', 'bag', ETC], ['cheatnote', '요점 정리 쪽지', 'bag', ETC],
    ['penRed', '빨간 볼펜', 'bag', '볼펜은 흑색과 청색만 쓸 수 있어요. 빨간 펜 예비마킹도 안 돼요.'],
    ['pencil', '연필', 'desk', OKAY], ['eraser', '지우개', 'desk', OKAY], ['lead', '샤프심', 'desk', OKAY],
    ['penBlack', '흑색 볼펜', 'desk', OKAY], ['penBlue', '청색 볼펜', 'desk', OKAY], ['signpen', '컴퓨터용 사인펜', 'desk', OKAY],
    ['tape', '수정테이프', 'desk', OKAY], ['analog', '아날로그 시계', 'desk', '전자식 화면이 없는 아날로그 시계는 둘 수 있어요.'],
  ];
  const ZONES = {
    bag: { x: 16, y: 470, w: 290, h: 414, label: '가방·사물함', sub: '넣고 지퍼 잠그기', k: 'bag', color: '#6366f1' },
    submit: { x: 1294, y: 470, w: 290, h: 414, label: '제출함', sub: '선생님께 제출', k: 'basket', color: '#ef4444' },
    desk: { x: 440, y: 706, w: 720, h: 186, label: '책상 위에', sub: '두기', color: '#16a34a' },
  };

  // 부정행위(cheat:1)와 올바른 행동(cheat:0). % 는 옆자리 방향(l/r)으로 바뀐다
  const ACTS = [
    { cheat: 1, cls: 'peek-% look-% face-sly', bub: '👀', msg: '다른 학생의 답안지를 보는 행위' },
    { cheat: 1, cls: 'look-% face-sly', bub: '🤙', msg: '손동작·소리로 신호를 주고받는 행위' },
    { cheat: 1, cls: 'arm-slip look-d face-sly lean-d', bub: '📃', msg: '컨닝 페이퍼를 보는 행위' },
    { cheat: 1, cls: 'arm-palm look-l face-sly', bub: '✋', msg: '손바닥에 적어 놓고 보는 행위' },
    { cheat: 1, cls: 'has-phone look-d lean-d face-sly', bub: '📱', msg: '휴대전화(무선기기)를 이용하는 행위' },
    { cheat: 1, cls: 'has-watch look-l look-d face-sly', bub: '⌚', msg: '스마트 워치(무선기기)를 이용하는 행위' },
    { cheat: 1, cls: 'has-ear face-sly look-u', bub: '🎧', msg: '무선 이어폰(무선기기)을 이용하는 행위' },
    { cheat: 1, cls: 'look-% face-angry', bub: '💢', msg: '답을 보여 달라고 강요·위협하는 행위' },
    { cheat: 1, cls: 'peek-% look-% face-smile', bub: '🔄', msg: '답안지를 바꾸어 대신 작성하려는 행위' },
    { cheat: 0, cls: 'arm-up look-c face-smile', bub: '❓', msg: '궁금한 점이 있어 손을 든 거예요. 올바른 행동!' },
    { cheat: 0, cls: 'flip look-d', bub: '📄', msg: '문제지 면수와 인쇄 상태를 확인하는 중이에요.' },
    { cheat: 0, cls: 'look-u face-smile', bub: '🕐', msg: '교실 시계로 남은 시간을 확인했어요.' },
    { cheat: 0, cls: 'look-u face-o', bub: '🤔', msg: '문제를 열심히 생각하는 중이에요.' },
    { cheat: 0, cls: 'yawn', bub: '🥱', msg: '하품은 부정행위가 아니에요.' },
    { cheat: 0, cls: 'look-d face-smile', bub: '✏️', msg: '수정테이프로 답을 고치는 중이에요.' },
  ];
  // 14명: 뒷줄 5 · 가운뎃줄 4 · 앞줄 5. 줄마다 엇갈려 앉아 뒷사람 얼굴이 가려지지 않는다
  const ROWS = [[430, .45, [190, 495, 800, 1105, 1410]], [615, .55, [342, 647, 952, 1257]], [845, .66, [190, 495, 800, 1105, 1410]]];
  const SEATS = ROWS.flatMap(([y, s, xs], r) => xs.map((x, c) => ({ x, y, s, r, c, n: xs.length })));
  const HAIR = ['#2b211b', '#5b3a29', '#1f2937', '#7c4a1e', '#111827', '#4a3325', '#3b2a20'];
  const SHIRT = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#38bdf8', '#f87171', '#4ade80'];
  const STYLE = ['short', 'bob', 'curly', 'pony', 'short', 'twin', 'bob', 'short', 'pony'];
  // 교시가 지날수록 빨라지고, 동시에 여러 명이 움직인다
  const WAVES = [{ name: '1교시', cheats: 4, decoys: 2, gap: 2300, life: 4300, max: 1 },
    { name: '2교시', cheats: 5, decoys: 3, gap: 1500, life: 3600, max: 2, pair: 1 },
    { name: '3교시', cheats: 6, decoys: 4, gap: 1050, life: 3000, max: 3, pair: 1, note: 1 }];
  const NOTE = { cheat: 1, cls: 'arm-slip look-d face-sly', bub: '📃', msg: '쪽지(컨닝 페이퍼)를 주고받는 행위' };
  const PAIR = { cheat: 1, cls: 'look-% face-sly', bub: '🤙', msg: '손동작·소리로 신호를 주고받는 행위' };
  const HUNT_N = 3, TOTAL = HUNT_N * 2 + WAVES.reduce((a, w) => a + w.cheats + (w.pair || 0) * 2 + (w.note || 0), 0);
  const BEST_KEY = 'examwarning-best';

  function stop() { timers.forEach(clearTimeout); timers = []; clearTimeout(toastTimer); st = null; }

  function mount(stage) {
    $('#gameBox').innerHTML = `<div class="hud"><span class="badge" id="gStage">${stage}</span><span class="score" id="gScore">0점</span>
        <span class="hearts" id="gHearts"></span><span class="combo" id="gCombo" hidden></span><span class="goal" id="gGoal"></span></div>
      <div class="timebar off" id="gTime"><i></i></div>
      <div class="gscreen"><svg id="gsvg" class="scene-svg" viewBox="0 0 ${K.W} ${K.H}"></svg>
        <div class="banner" id="gBanner" hidden></div>
        <div class="toast" id="gToast" hidden></div><div class="overlay" id="gOver" hidden></div></div>`;
    svg = $('#gsvg');
  }
  function toast(msg, kind = '') {
    const t = $('#gToast');
    t.textContent = msg; t.className = 'toast ' + kind; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function over(html) { const o = $('#gOver'); o.innerHTML = html; o.hidden = !html; }
  function hud() {
    $('#gScore').textContent = st.score + '점';
    $('#gHearts').textContent = st.hearts === undefined ? '' : '❤️'.repeat(Math.max(0, st.hearts)) + '🤍'.repeat(Math.max(0, st.maxHearts - Math.max(0, st.hearts)));
    if (st.mode === 'desk') return void ($('#gGoal').textContent = `남은 물건 ${st.items.filter(i => !i.done).length}개 · 실수 ${st.miss}번`);
    const c = $('#gCombo'), m = mult();
    c.hidden = st.combo < 2; c.textContent = `🔥 ${st.combo}연속${m > 1 ? ' ×' + m : ''}`; c.classList.toggle('hot', m > 1);
    $('#gGoal').textContent = `잡은 부정행위 ${st.caught} / ${TOTAL}`;
  }
  const stars = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);
  const logList = log => log.length ? `<ul class="miss">${[...new Set(log)].map(l => `<li>${l}</li>`).join('')}</ul>` : '';
  const svgPoint = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  /* ───────── 1단계: 책상 점검 ───────── */
  function startDesk() {
    stop(); mount('1단계 · 책상 점검');
    const pick = (cat, n) => shuffle(ITEMS.filter(i => i[2] === cat)).slice(0, n);
    const items = shuffle([...pick('submit', 4), ...pick('bag', 2), ...pick('desk', 3)]).map(([k, name, cat, why], i) =>
      ({ k, name, cat, why, tries: 0, done: false, home: i < 5 ? [480 + i * 160, 462] : [560 + (i - 5) * 160, 612] }));
    st = { mode: 'desk', items, score: 0, miss: 0, log: [], sel: null, drag: null, counts: { bag: 0, submit: 0, desk: 0 } };

    const zone = ([id, z]) => `<g class="zone" id="z-${id}"><rect class="zone-bg" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="26"
        fill="#fff" fill-opacity=".8" stroke="${z.color}" stroke-width="5" stroke-dasharray="16 10" opacity=".9"/>
      ${z.k ? `<g transform="translate(${z.x + z.w / 2} ${z.y + 170})">${K.prop(z.k, 1.7)}</g>
        <text x="${z.x + z.w / 2}" y="${z.y + 330}" font-size="38" font-weight="800" fill="${z.color}" text-anchor="middle">${z.label}</text>
        <text x="${z.x + z.w / 2}" y="${z.y + 374}" font-size="25" font-weight="600" fill="#475569" text-anchor="middle">${z.sub}</text>`
      : `<text x="${z.x + 30}" y="${z.y + 86}" font-size="34" font-weight="800" fill="${z.color}">${z.label}</text>
        <text x="${z.x + 30}" y="${z.y + 130}" font-size="34" font-weight="800" fill="${z.color}">${z.sub}</text>`}</g>`;
    const item = (it, i) => { const w = [...it.name].length * 21 + 30; return `<g class="drag" data-i="${i}" transform="translate(${it.home[0]} ${it.home[1]})"><g class="in">
      <circle class="ring-sel" r="64" fill="none" stroke="#14b8a6" stroke-width="9"/>
      <circle r="52" fill="#fff" stroke="rgba(0,0,0,.16)" stroke-width="3"/>${K.prop(it.k, .6)}
      <rect x="${-w / 2}" y="54" width="${w}" height="34" rx="17" fill="#0f172a" opacity=".86"/>
      <text y="72" font-size="21" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${it.name}</text></g></g>`; };
    svg.innerHTML = K.bgBack() + K.kid({ id: 'owner', x: 800, y: 470, s: 1, hair: '#2b211b', shirt: '#60a5fa' }) +
      `<path d="M330 400H1270L1490 900H110Z" fill="#edc58c"/><path d="M330 400H1270L1276 414H324Z" fill="#fff" opacity=".35"/>` +
      Object.entries(ZONES).map(zone).join('') + `<g id="items">${items.map(item).join('')}</g>`;
    K.set($('#owner'), 'nodesk face-o');
    K.bubble($('#owner'), '🙏');

    svg.addEventListener('pointerdown', deskDown);
    svg.addEventListener('pointermove', deskMove);
    svg.addEventListener('pointerup', deskUp);
    svg.addEventListener('pointercancel', deskUp);
    hud();
    over(`<h2>시험 시작 5분 전!</h2><p>준이의 책상을 정리해 주세요. 물건을 <b>끌어서</b> 알맞은 곳에 놓아요.<br>(물건을 누른 다음 놓을 곳을 눌러도 돼요)</p>
      <p>✏️ 시험 볼 때 쓰는 물건 → <b>책상 위</b><br>📚 그 밖의 물건 → <b>가방·사물함</b><br>📱 전자 기기 → <b>제출함</b></p>
      <button class="btn" onclick="G.begin()">정리 시작</button>`);
  }
  const zoneAt = p => Object.keys(ZONES).find(id => { const z = ZONES[id]; return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h; });
  const hot = id => svg.querySelectorAll('.zone').forEach(z => z.classList.toggle('hot', z.id === 'z-' + id));
  const place = (el, x, y) => el.setAttribute('transform', `translate(${x} ${y})`);
  function select(el) {
    svg.querySelectorAll('.drag.sel').forEach(d => d.classList.remove('sel'));
    st.sel = el;
    if (el) { el.classList.add('sel'); K.sfx('pick'); }
  }
  function deskDown(e) {
    if (!st || st.mode !== 'desk' || !$('#gOver').hidden) return;
    const el = e.target.closest('.drag'), p = svgPoint(e);
    if (!el) { const z = zoneAt(p); if (z && st.sel) drop(st.sel, z); return; }
    const it = st.items[el.dataset.i];
    if (it.done) return;
    svg.setPointerCapture(e.pointerId);
    el.parentNode.appendChild(el);  // 맨 위로
    el.classList.remove('nope');
    st.drag = { el, it, dx: p.x - it.home[0], dy: p.y - it.home[1], x0: p.x, y0: p.y, moved: false };
  }
  function deskMove(e) {
    const d = st && st.drag;
    if (!d) return;
    const p = svgPoint(e);
    if (Math.hypot(p.x - d.x0, p.y - d.y0) > 14) d.moved = true;
    if (d.moved) { place(d.el, p.x - d.dx, p.y - d.dy); hot(zoneAt(p)); }
  }
  function deskUp(e) {
    const d = st && st.drag;
    if (!d) return;
    st.drag = null; hot(null);
    if (!d.moved) return select(st.sel === d.el ? null : d.el);
    const z = zoneAt(svgPoint(e));
    if (z) drop(d.el, z); else place(d.el, ...d.it.home);
  }
  function drop(el, z) {
    const it = st.items[el.dataset.i], owner = $('#owner');
    select(null);
    if (z !== it.cat) {
      it.tries++; st.miss++;
      const msg = it.cat === 'submit' ? (z === 'bag' ? '가방에 넣어도 안 돼요. 전자 기기는 소지 자체가 금지라서 제출해야 해요!' : '전자 기기는 소지 금지! 제출함에 내야 해요.')
        : it.cat === 'desk' ? '시험 볼 때 쓸 수 있는 물건이에요. 책상 위에 둬요.'
        : z === 'submit' ? '제출할 필요는 없어요. 사물함이나 가방에 넣어요.' : '책상 위에는 둘 수 없어요. 사물함이나 가방에 넣어요.';
      st.log.push(`<b>${it.name}</b> — ${it.why}`);
      place(el, ...it.home); el.classList.add('nope');
      K.set(owner, 'face-sad'); K.bubble(owner, '😥'); K.sfx('bad');
      toast(`${it.name}: ${msg}`, 'bad');
      return hud();
    }
    it.done = true;
    st.score += it.tries ? 50 : 100;
    const n = st.counts[z]++, zz = ZONES[z];
    if (z === 'desk') {
      place(el, 690 + n * 150, 790);
      el.querySelector('.in').insertAdjacentHTML('beforeend', `<g transform="translate(44 -44) scale(.5)">${K.mark('o')}</g>`);
    } else {
      place(el, zz.x + zz.w / 2, zz.y + 170);
      el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px');
      el.classList.add('fly');
    }
    K.set(owner, 'face-smile'); K.bubble(owner, z === 'submit' ? '📥' : z === 'bag' ? '🎒' : '👍'); K.sfx('ok');
    toast(`${it.name}: ${it.why}`, 'good');
    hud();
    if (st.items.every(i => i.done)) later(finishDesk, 1200);
  }
  function finishDesk() {
    const s = st.miss === 0 ? 3 : st.miss <= 2 ? 2 : 1;
    K.sfx('win');
    over(`<h2>책상 점검 완료! ${stars(s)}</h2><p><b>${st.score}점</b> · 실수 ${st.miss}번</p>
      <p>전자 기기는 <b>제출</b>, 그 밖의 물건은 <b>가방·사물함</b>, 시험 볼 때 쓰는 물건만 <b>책상 위</b>!</p>${logList(st.log)}
      <div class="btn-row"><a class="btn" href="#game-watch">다음 단계: 부정행위를 잡아라 ▶</a>
      <button class="btn btn--ghost" onclick="G.start('desk')">새 물건으로 다시</button><a class="btn btn--ghost" href="#home">처음으로</a></div>`);
  }

  /* ───────── 2단계: 부정행위를 잡아라 ───────── */
  const room = `<rect width="1600" height="900" fill="#fdf3dc"/><rect y="330" width="1600" height="570" fill="#e8caa0"/>
    ${[410, 520, 670, 820].map(y => `<path d="M0 ${y}H1600" stroke="#d4b080" stroke-width="3"/>`).join('')}
    <rect x="50" y="40" width="470" height="200" rx="10" fill="#a16207"/><rect x="62" y="52" width="446" height="176" rx="4" fill="#d9f99d"/>
    <text x="285" y="92" font-size="30" font-weight="800" fill="#3f6212" text-anchor="middle">우리 반 게시판</text>
    ${[0, 1, 2, 3].map(i => `<rect x="${88 + i * 104}" y="112" width="84" height="92" rx="6" fill="${['#fef08a', '#bae6fd', '#fecdd3', '#ddd6fe'][i]}" transform="rotate(${[-3, 2, -2, 3][i]} ${130 + i * 104} 158)"/>`).join('')}
    <g transform="translate(730 136)">${[0, 1, 2, 3, 4, 5, 6, 7].map(c => [0, 1].map(r => `<rect x="${c * 100}" y="${r * 96}" width="94" height="90" rx="6" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/>
      <circle cx="${c * 100 + 76}" cy="${r * 96 + 46}" r="5" fill="#1e3a8a"/>`).join('')).join('')}</g>
    <g transform="translate(1560 70)"><circle r="34" fill="#fff" stroke="#475569" stroke-width="7"/><path d="M0 0V-21M0 0L15 6" stroke="#3b2f2f" stroke-width="5" stroke-linecap="round"/></g>
    <rect y="322" width="1600" height="12" fill="#c9a36b"/>`;
  const mult = () => 1 + Math.min(4, Math.floor(st.combo / 3)) * .5;
  const kidEl = i => $('#k' + i);
  const free = () => SEATS.map((_, i) => i).filter(i => !st.busy[i]);
  const active = () => Object.values(st.busy).filter(b => b.act && !b.done).length;
  const deal = (key, cheat) => { if (!st[key].length) st[key] = shuffle(ACTS.filter(a => !!a.cheat === cheat)); return st[key].pop(); };

  function startWatch() {
    stop(); mount('2단계 · 부정행위를 잡아라');
    const tv = isTv();
    let best = 0;
    try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) {}
    st = { mode: 'watch', score: 0, hearts: tv ? 6 : 5, maxHearts: tv ? 6 : 5, caught: 0, combo: 0, maxCombo: 0, log: [], busy: {},
      wi: -1, w: null, queue: [], phase: 'ready', slow: tv ? 1.4 : 1, cheats: [], decoys: [], ids: 0, penal: new Set(), best };
    svg.innerHTML = room + `<g id="wallbell" class="h" transform="translate(620 120)"><g class="in">${K.prop('bell', 1.1)}</g></g>` +
      SEATS.map(({ x, y, s }, i) => K.kid({ id: 'k' + i, x, y, s, hair: HAIR[i % 7], shirt: SHIRT[i % 9], style: STYLE[(i * 4) % 9], blink: (i * .7) % 4, bub: .9 / s })).join('') + '<g id="fx"></g>';
    SEATS.forEach((_, i) => idle(i));
    svg.addEventListener('click', e => { const k = e.target.closest('.kid'); if (k) tap(+k.id.slice(1)); });
    hud();
    over(`<h2>오늘은 내가 정직 지킴이!</h2><p>우리 반 14명이 시험을 봐요. <b>부정행위를 하는 학생</b>을 찾아 빠르게 눌러요.</p>
      <p>시작종 전 → 1교시 → 2교시 → 3교시 → 종료령<br>교시가 지날수록 빨라지고, 여러 명이 한꺼번에 움직여요.</p>
      <p>🔥 연속으로 잡으면 점수가 <b>최대 3배</b>! 올바른 행동을 하는 학생을 누르면 ❤️가 줄어요.</p>
      ${best ? `<p class="best">최고 기록 ${best}점</p>` : ''}<button class="btn" onclick="G.begin()">감독 시작</button>`);
  }
  function idle(i) {
    const el = kidEl(i);
    el.setAttribute('class', 'kid tap writing look-d');
    K.bubble(el, '');
  }
  function banner(text, ms = 1300) {
    const b = $('#gBanner');
    b.hidden = true; b.textContent = text; void b.offsetWidth; b.hidden = false;
    later(() => { if (b.textContent === text) b.hidden = true; }, ms);
  }
  function timebar(ms) {
    const bar = $('#gTime'), i = bar.firstChild;
    bar.classList.toggle('off', !ms);
    i.style.transition = 'none'; i.style.transform = 'scaleX(1)';
    if (!ms) return;
    void i.offsetWidth;
    i.style.transition = `transform ${ms}ms linear`; i.style.transform = 'scaleX(0)';
  }
  function popup(i, text, cls = '') {
    const { x, y, s } = SEATS[i], fx = $('#fx');
    fx.insertAdjacentHTML('beforeend', `<text class="fx-pop ${cls}" x="${x}" y="${y - 370 * s - (cls === 'combo' ? 60 : 0)}" font-size="${cls === 'combo' ? 46 : 64}" font-weight="900" text-anchor="middle">${text}</text>`);
    const el = fx.lastChild;
    later(() => el.remove(), 1000);
  }
  function shake() { svg.classList.remove('shake'); void svg.getBoundingClientRect(); svg.classList.add('shake'); }

  // ── 교시
  function nextWave() {
    if (!st || st.hearts <= 0) return;
    if (++st.wi >= WAVES.length) return hunt(HUNT_END);
    const w = st.w = WAVES[st.wi], q = [];
    for (let k = 0; k < w.cheats; k++) q.push({ act: deal('cheats', true) });
    for (let k = 0; k < w.decoys; k++) q.push({ act: deal('decoys', false) });
    for (let k = 0; k < (w.pair || 0); k++) q.push({ pair: true });
    for (let k = 0; k < (w.note || 0); k++) q.push({ note: true });
    st.queue = [q.shift(), ...shuffle(q)];
    st.phase = 'exam'; st.busy = {};
    SEATS.forEach((_, i) => idle(i));
    $('#gStage').textContent = `2단계 · ${w.name}`;
    K.sfx('go'); banner(`${w.name} 시작!`);
    later(spawn, 1400);
  }
  function spawn() {
    if (!st || st.phase !== 'exam') return;
    if (!st.queue.length) return active() || Object.values(st.busy).some(b => b.hold) ? later(spawn, 300) : later(nextWave, 900);
    if (active() >= st.w.max) return later(spawn, 250);
    const ev = st.queue.shift();
    if (!launch(ev)) { st.queue.unshift(ev); return later(spawn, 400); }
    later(spawn, st.w.gap * st.slow);
  }
  function launch(ev) {
    const life = st.w.life * st.slow;
    if (ev.pair || ev.note) {   // 옆자리끼리 벌이는 일: 나란히 앉은 빈 자리를 찾는다
      const n = ev.pair ? 2 : 3;
      const runs = SEATS.map((_, i) => i).filter(i => Array.from({ length: n }, (_, k) => i + k).every(j => SEATS[j] && SEATS[j].r === SEATS[i].r && !st.busy[j]));
      if (!runs.length) return false;
      const a = shuffle(runs)[0];
      if (ev.pair) { const pid = ++st.ids; setEvent(a, PAIR, 'r', life, { pid }); setEvent(a + 1, PAIR, 'l', life, { pid }); }
      else { const chain = Math.random() < .5 ? [a, a + 1, a + 2] : [a + 2, a + 1, a]; chain.forEach(j => st.busy[j] = { hold: true }); hop(chain, 0); }
      return true;
    }
    const f = free();
    if (!f.length) return false;
    const i = shuffle(f)[0], { c, n } = SEATS[i];
    setEvent(i, ev.act, c === 0 ? 'r' : c === n - 1 ? 'l' : Math.random() < .5 ? 'l' : 'r', life);
    return true;
  }
  const hop = (chain, k) => setEvent(chain[k], NOTE, 'r', Math.max(1500, st.w.life * .5) * st.slow, { chain, k });   // 쪽지가 옆으로 넘어간다
  function setEvent(i, act, dir, life, extra) {
    const el = kidEl(i);
    el.setAttribute('class', 'kid tap timed');
    el.style.setProperty('--life', life + 'ms');
    K.set(el, act.cls.replaceAll('%', dir));
    K.bubble(el, act.bub);
    st.busy[i] = { act, t0: Date.now(), life, timer: later(() => expire(i), life), ...extra };
  }
  function release(i, delay = 0) {
    const b = st.busy[i];
    if (b && b.timer) clearTimeout(b.timer);
    if (b && b.chain) b.chain.forEach(j => { if (j !== i) delete st.busy[j]; });
    st.busy[i] = { done: true };
    const me = st;
    later(() => { if (st !== me) return; delete st.busy[i]; if (st.phase === 'exam') idle(i); }, delay);
  }
  function expire(i) {
    const b = st && st.busy[i];
    if (!b || !b.act || b.done) return;
    if (b.chain && b.k < b.chain.length - 1) { st.busy[i] = { hold: true }; idle(i); return hop(b.chain, b.k + 1); }
    release(i);
    if (!b.act.cheat || st.penal.has(b.pid)) return;
    if (b.pid) st.penal.add(b.pid);
    popup(i, '놓침!', 'bad');
    lose(`놓쳤어요! ${b.act.msg}는 부정행위예요.`);
  }
  function lose(msg) {
    st.hearts--; st.combo = 0; st.log.push(msg);
    K.sfx('bad'); shake(); toast(msg, 'bad'); hud();
    if (st.hearts <= 0) { st.phase = 'over'; later(() => finishWatch(false), 900); }
  }
  function grab(i, msg, bonus) {
    st.caught++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
    const m = mult(), pts = Math.round((100 + bonus) * m);
    st.score += pts;
    const el = kidEl(i);
    el.classList.remove('timed');
    K.set(el, '!writing face-shock look-c caught'); K.bubble(el, '');
    popup(i, '+' + pts, 'good');
    if (st.combo >= 3 && st.combo % 3 === 0) popup(i, `🔥 ${st.combo}연속!`, 'combo');
    K.sfx('whistle', 1 + Math.min(st.combo, 12) * .035);
    toast(`딱 걸렸어요! ${msg}는 부정행위예요.`, 'good'); hud();
  }
  function tap(i) {
    if (!st || st.mode !== 'watch' || !$('#gOver').hidden || st.hearts <= 0) return;
    if (st.hunt) return tapHunt(i);
    if (st.phase !== 'exam') return;
    const b = st.busy[i];
    if (!b || b.hold) {   // 아무 일 없는 학생을 마구 누르면 손해
      st.combo = 0; st.score = Math.max(0, st.score - 30);
      popup(i, '-30', 'bad'); K.sfx('tick'); hud();
      return toast('열심히 시험을 보고 있는 학생이에요. 잘 보고 눌러요!');
    }
    if (b.done) return;
    if (!b.act.cheat) {
      K.set(kidEl(i), 'face-sad'); kidEl(i).classList.remove('timed');
      release(i, 900);
      popup(i, '💔', 'bad');
      return lose(`앗! ${b.act.msg}`);
    }
    grab(i, b.act.msg, Math.max(0, Math.round((1 - (Date.now() - b.t0) / b.life) * 50)));
    if (b.pid) {   // 짝꿍 둘을 모두 잡으면 덤
      const mate = Object.values(st.busy).some(o => o.pid === b.pid && o !== b && o.act && !o.done);
      if (!mate && !st.penal.has(b.pid)) { st.score += 100; popup(i, '더블! +100', 'combo'); hud(); }
    }
    release(i, 900);
  }

  // ── 정해진 시간 안에 '해당 학생'을 모두 찾는 단계 (시작종 전 / 종료령 뒤)
  const HUNT_PRE = { phase: 'pre', name: '시작종 전', msg: '시작종이 울리기 전에 문제를 풀거나 답을 표시하는 행위', wrong: '앗! 인적 사항을 표기하거나 조용히 기다리는 학생이에요.',
    intro: '📄 문제지를 받았어요. 시작종 전에는 인적 사항만 표기! 미리 푸는 학생 3명을 찾아요.',
    bad: k => ['writing look-d face-sly', ['문제 풀기', '답 표시', '문제 풀기'][k]],
    ok: i => i % 3 === 0 ? ['writing look-d face-smile', '인적사항'] : ['arm-down look-c face-smile', ''],
    next() { K.sfx('bell'); later(nextWave, 1500); toast('🔔 시작종이 울렸어요!'); } };
  const HUNT_END = { phase: 'bell', name: '종료령', msg: '종료령이 울린 뒤에도 계속 답안지를 작성하는 행위', wrong: '앗! 필기구를 내려놓고 손을 책상 아래로 내린 학생이에요.',
    intro: '🔔 종료령이 울렸어요! 아직도 답안지를 쓰고 있는 학생 3명을 찾아요.', ring: true,
    bad: () => ['writing look-d face-sly', ''], ok: () => ['arm-down look-c face-smile', ''],
    next() { finishWatch(true); } };
  function hunt(h) {
    if (!st || st.hearts <= 0) return;
    const bad = shuffle(SEATS.map((_, i) => i)).slice(0, HUNT_N), ms = (isTv() ? 11000 : 8000);
    st.phase = h.phase; st.busy = {};
    st.hunt = { h, bad, left: new Set(bad) };
    $('#gStage').textContent = `2단계 · ${h.name}`;
    if (h.ring) { K.sfx('bell'); K.set($('#wallbell'), 'on ring'); banner('종료령!'); }
    SEATS.forEach((_, i) => {
      const el = kidEl(i), [cls, bub] = bad.includes(i) ? h.bad(bad.indexOf(i)) : h.ok(i);
      el.setAttribute('class', 'kid tap');
      K.set(el, cls); K.bubble(el, bub);
    });
    toast(h.intro);
    timebar(ms);
    st.hunt.timer = later(endHunt, ms);
  }
  function endHunt() {
    if (!st || !st.hunt || st.phase === 'end') return;
    const { h, left, timer } = st.hunt;
    clearTimeout(timer); timebar(0);
    st.hunt = null;
    if (left.size) { left.forEach(i => popup(i, '놓침!', 'bad')); lose(`놓쳤어요! ${h.msg}는 부정행위예요.`); }
    if (st.hearts > 0) h.next();
  }
  function tapHunt(i) {
    const u = st.hunt;
    if (u.left.has(i)) {
      u.left.delete(i);
      grab(i, u.h.msg, 50);
      if (!u.left.size) { clearTimeout(u.timer); timebar(0); u.timer = later(endHunt, 1200); }
    } else if (!u.bad.includes(i)) {
      K.set(kidEl(i), 'face-sad');
      popup(i, '💔', 'bad');
      lose(u.h.wrong);
    }
  }
  function finishWatch(cleared) {
    if (!st || st.phase === 'end') return;
    st.phase = 'end'; st.hunt = null;
    timers.forEach(clearTimeout); timers = [];
    timebar(0); $('#gBanner').hidden = true;
    hud();
    const hearts = Math.max(0, st.hearts), s = !cleared ? 0 : hearts >= st.maxHearts - 1 ? 3 : hearts >= 3 ? 2 : 1;
    const record = st.score > st.best;
    if (record) try { localStorage.setItem(BEST_KEY, st.score); } catch (e) {}
    if (cleared) { K.sfx('win'); SEATS.forEach((_, i) => { kidEl(i).setAttribute('class', 'kid'); K.bubble(kidEl(i), ''); K.set(kidEl(i), 'arm-up face-smile look-c'); }); }
    over(`<h2>${cleared ? '감독 완료! ' + stars(s) : '아쉬워요, 다시 도전!'}</h2>
      <p><b>${st.score}점</b> · 잡은 부정행위 ${st.caught} / ${TOTAL} · 최고 ${st.maxCombo}연속</p>
      <p class="best">${record ? '🎉 새로운 최고 기록!' : '최고 기록 ' + st.best + '점'}</p>
      ${st.log.length ? '<p>다시 확인해요</p>' : '<p>하나도 놓치지 않았어요. 완벽해요!</p>'}${logList(st.log)}
      <div class="btn-row"><button class="btn" onclick="G.start('watch')">다시 하기</button>
      <a class="btn btn--ghost" href="#game-desk">1단계: 책상 점검</a><a class="btn btn--ghost" href="#quiz">퀴즈 풀기</a><a class="btn btn--ghost" href="#home">처음으로</a></div>`);
  }

  function begin() {
    over('');
    if (st.mode !== 'watch') { K.sfx('pick'); K.set($('#owner'), 'face-smile'); return K.bubble($('#owner'), ''); }
    ['3', '2', '1'].forEach((n, k) => later(() => { K.sfx('tick'); banner(n, 650); }, k * 700));
    later(() => hunt(HUNT_PRE), 2200);
  }
  const start = mode => mode === 'watch' ? startWatch() : startDesk();

  // 자체 점검: 데이터가 틀리면 콘솔에 표시
  function check() {
    const bad = [];
    ITEMS.forEach(([k, name, cat, why]) => { if (!ZONES[cat] || !why) bad.push(name); });
    ['submit', 'bag', 'desk'].forEach(c => { if (ITEMS.filter(i => i[2] === c).length < 4) bad.push(c + ' 물건 부족'); });
    [...ACTS, NOTE, PAIR].forEach(a => { if (!a.msg || !a.cls) bad.push(a.bub); });
    if (ACTS.filter(a => !a.cheat).length < 4) bad.push('올바른 행동 부족');
    if (SEATS.length !== 14) bad.push('자리 수');
    WAVES.forEach(w => { if (w.max > 3 || w.life < 2500) bad.push(w.name + ' 난이도'); });
    console.assert(!bad.length, '게임 데이터 오류', bad);
    return bad;
  }

  return { start, begin, stop, check, get state() { return st; }, ITEMS, ACTS, SEATS, WAVES, TOTAL };
})();
