/* 교실·학생 캐릭터·소품 SVG 키트. 영상(video.js)과 게임(game.js)이 함께 쓴다. 좌표계는 1600×900. */
const K = (() => {
  const SKIN = '#ffd8b5', INK = '#3b2f2f', W = 1600, H = 900;

  const emo = (e, size = 96) => `<text font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
  const pen = (body, cap = body) => `<g transform="rotate(-35)"><rect x="-62" y="-9" width="112" height="18" rx="9" fill="${body}"/>
    <rect x="-62" y="-9" width="30" height="18" rx="9" fill="${cap}"/><path d="M50-7L70 0 50 7Z" fill="#cbd5e1"/><rect x="-36" y="-13" width="6" height="26" rx="3" fill="#e2e8f0"/></g>`;
  const watch = face => `<rect x="-20" y="-64" width="40" height="128" rx="12" fill="#64748b"/>${face}`;

  // 소품: 가운데가 (0,0), 대략 120×120 크기
  const P = {
    phone: emo('📱'), camera: emo('📷'), radio: emo('📻'), headset: emo('🎧'), pencil: emo('✏️'),
    book: emo('📘'), note: emo('📒'), books: emo('📚'), bag: emo('🎒', 110), bell: emo('🔔', 110), lock: emo('🔒'),
    locker: emo('🗄️'), toilet: emo('🚻'), paper: emo('📄'), ask: emo('🙋'), hush: emo('🤫'), stack: emo('📑'),
    hands: emo('🙌'), law: emo('⚖️'), basket: emo('🧺', 110),
    smartwatch: watch(`<rect x="-38" y="-42" width="76" height="84" rx="20" fill="#0f172a"/>
      <circle cx="-13" cy="-12" r="9" fill="#f43f5e"/><circle cx="13" cy="-12" r="9" fill="#22c55e"/>
      <circle cx="-13" cy="14" r="9" fill="#38bdf8"/><circle cx="13" cy="14" r="9" fill="#f59e0b"/>`),
    digiwatch: watch(`<rect x="-40" y="-34" width="80" height="68" rx="12" fill="#1e293b"/>
      <rect x="-32" y="-22" width="64" height="44" rx="6" fill="#bbf7d0"/>
      <text y="2" font-size="30" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#14532d">12:30</text>`),
    analog: watch(`<circle r="40" fill="#fff" stroke="#334155" stroke-width="7"/>
      <path d="M0 0V-26M0 0L18 10" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/><circle r="5" fill="#ef4444"/>`),
    calc: `<rect x="-38" y="-54" width="76" height="108" rx="12" fill="#334155"/><rect x="-28" y="-44" width="56" height="28" rx="5" fill="#a7f3d0"/>
      ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${-28 + c * 20}" y="${-8 + r * 19}" width="16" height="14" rx="4" fill="${r === 2 && c === 2 ? '#f59e0b' : '#e2e8f0'}"/>`).join('')).join('')}`,
    edict: `<rect x="-52" y="-50" width="104" height="52" rx="8" fill="#475569"/><rect x="-44" y="-43" width="88" height="38" rx="4" fill="#bae6fd"/>
      <path d="M-34-32H20M-34-20H30" stroke="#0369a1" stroke-width="4" stroke-linecap="round"/>
      <rect x="-56" y="2" width="112" height="46" rx="8" fill="#334155"/>
      ${[0, 1].map(r => [0, 1, 2, 3, 4, 5].map(c => `<rect x="${-48 + c * 16.5}" y="${10 + r * 16}" width="12" height="11" rx="3" fill="#cbd5e1"/>`).join('')).join('')}`,
    mp3: `<rect x="-30" y="-52" width="60" height="104" rx="12" fill="#a855f7"/><rect x="-22" y="-44" width="44" height="34" rx="5" fill="#f5f3ff"/>
      <text y="-26" font-size="24" text-anchor="middle" dominant-baseline="central">🎵</text><circle cy="20" r="19" fill="#f5f3ff"/><circle cy="20" r="7" fill="#a855f7"/>`,
    recorder: `<rect x="-28" y="-60" width="56" height="120" rx="15" fill="#374151"/><rect x="-19" y="-30" width="38" height="28" rx="5" fill="#a7f3d0"/>
      <circle cx="-10" cy="-46" r="4.5" fill="#9ca3af"/><circle cx="10" cy="-46" r="4.5" fill="#9ca3af"/>
      <path d="M-12-20H12M-12-12H4" stroke="#047857" stroke-width="3" stroke-linecap="round"/>
      <circle cy="22" r="14" fill="#ef4444"/><circle cy="22" r="6" fill="#fecaca"/>
      <text y="50" font-size="13" font-weight="800" fill="#f9fafb" text-anchor="middle">REC</text>`,
    campen: `${pen('#1f2937', '#111827')}<circle cx="-34" cy="28" r="10" fill="#0ea5e9" stroke="#fff" stroke-width="4"/><circle cx="-34" cy="28" r="3.5" fill="#0c4a6e"/>`,
    penBlack: pen('#1f2937'), penBlue: pen('#2563eb'), penRed: pen('#ef4444'),
    signpen: `<g transform="rotate(-35)"><rect x="-66" y="-11" width="124" height="22" rx="6" fill="#111827"/><rect x="-20" y="-11" width="46" height="22" fill="#f8fafc"/>
      <path d="M-14-3H20M-14 4H12" stroke="#64748b" stroke-width="3"/><path d="M58-7L74 0 58 7Z" fill="#111827"/></g>`,
    eraser: `<g transform="rotate(-14)"><rect x="-54" y="-30" width="108" height="60" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      <path d="M-54-18A12 12 0 0 1-42-30H-4V30H-42A12 12 0 0 1-54 18Z" fill="#60a5fa"/></g>`,
    lead: `<g transform="rotate(12)"><rect x="-24" y="-54" width="48" height="108" rx="8" fill="#0f766e"/><rect x="-24" y="-54" width="48" height="26" rx="8" fill="#134e4a"/>
      <text y="14" font-size="22" font-weight="800" fill="#ccfbf1" text-anchor="middle">HB</text>
      <path d="M-8-54V-76M2-54V-82M12-54V-72" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/></g>`,
    tape: `<g transform="rotate(-18)"><path d="M-60-24Q-60-40-44-40H28Q50-40 58-20L68 6Q72 22 56 24H-44Q-60 24-60 8Z" fill="#14b8a6"/>
      <circle cx="-26" cy="-8" r="18" fill="#ccfbf1"/><circle cx="-26" cy="-8" r="6" fill="#0f766e"/>
      <circle cx="22" cy="-8" r="13" fill="#ccfbf1"/><circle cx="22" cy="-8" r="5" fill="#0f766e"/>
      <path d="M56 24L80 40" stroke="#0f766e" stroke-width="11" stroke-linecap="round"/>
      <path d="M-66 46H78" stroke="#cbd5e1" stroke-width="14" stroke-linecap="round"/><path d="M-66 46H78" stroke="#fff" stroke-width="9" stroke-linecap="round"/></g>`,
    cheatnote: `<g transform="rotate(-8)"><rect x="-44" y="-52" width="88" height="104" rx="6" fill="#fef9c3" stroke="#eab308" stroke-width="3"/>
      <path d="M-30-30H30M-30-12H24M-30 6H30M-30 24H10" stroke="#a16207" stroke-width="4" stroke-linecap="round"/></g>`,
    drawer: `<rect x="-58" y="-40" width="116" height="80" rx="8" fill="#d19a55"/><rect x="-46" y="-26" width="92" height="52" rx="6" fill="#7c4a1e"/>
      <path d="M-30 0H30" stroke="#fde68a" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12"/>`,
  };
  const prop = (k, s = 1) => `<g transform="scale(${s})">${P[k] || emo(k)}</g>`;

  // ✕ / ✓ 도장
  const mark = kind => kind === 'x'
    ? `<circle r="40" fill="#fff" stroke="#ef4444" stroke-width="9"/><path d="M-19-19L19 19M19-19L-19 19" stroke="#ef4444" stroke-width="11" stroke-linecap="round"/>`
    : `<circle r="40" fill="#fff" stroke="#22c55e" stroke-width="9"/><path d="M-20 1L-6 17 21-15" fill="none" stroke="#22c55e" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;

  // 칠판에 붙는 카드: 왼쪽 그림 + 오른쪽 글(줄바꿈은 \n)
  function tile(id, cx, cy, w, h, k, label, m, fs = Math.min(30, h * 0.24)) {
    const lines = label.split('\n');
    const tx = -w / 2 + h * 0.86, ty = -(lines.length - 1) * fs * 0.62;
    return `<g id="${id}" class="h tile" transform="translate(${cx} ${cy})"><g class="in">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="20" fill="#fffdf5" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
      <g transform="translate(${-w / 2 + h * 0.45} 0)">${prop(k, h / 165)}</g>
      ${lines.map((l, i) => `<text x="${tx}" y="${ty + i * fs * 1.25}" font-size="${fs}" font-weight="700" fill="${INK}" dominant-baseline="central">${l}</text>`).join('')}
      </g>${m ? `<g class="mark" transform="translate(${w / 2 - 30} ${-h / 2 + 26}) scale(.62)"><g class="in">${mark(m)}</g></g>` : ''}</g>`;
  }
  // n개를 cols열 격자로 놓을 때 i번째 칸의 가운데 좌표와 크기
  function cell(i, cols, box = { x: 330, y: 160, w: 1200, h: 290 }, rows = 2, gap = 18) {
    const w = (box.w - gap * (cols - 1)) / cols, h = (box.h - gap * (rows - 1)) / rows;
    return [box.x + (i % cols) * (w + gap) + w / 2, box.y + Math.floor(i / cols) * (h + gap) + h / 2, w, h];
  }

  function kid({ id, x, y, s = 1, hair = '#3b2a20', shirt = '#60a5fa', style = 'short', blink = 0, bub = 1 }) {
    const back = { bob: `<rect x="-104" y="-352" width="208" height="180" rx="74" fill="${hair}"/>`,
      pony: `<circle cx="100" cy="-332" r="34" fill="${hair}"/><circle cx="124" cy="-286" r="24" fill="${hair}"/>`,
      twin: `<circle cx="-112" cy="-250" r="34" fill="${hair}"/><circle cx="112" cy="-250" r="34" fill="${hair}"/>`,
      curly: [-70, -35, 0, 35, 70].map((cx, i) => `<circle cx="${cx}" cy="${-340 - (i % 2) * 14}" r="34" fill="${hair}"/>`).join('') }[style] || '';
    return `<g id="${id}" class="kid" transform="translate(${x} ${y}) scale(${s})" style="--blink:${blink}s"><g class="k-in">
      ${back}
      <rect x="-17" y="-192" width="34" height="30" fill="${SKIN}"/>
      <path d="M-92-30C-100-120-80-168-40-172L40-172C80-168 100-120 92-30Z" fill="${shirt}"/>
      <path d="M-26-174L0-146 26-174Z" fill="#fff"/>
      <g class="k-head">
        <circle cx="-88" cy="-254" r="14" fill="${SKIN}"/><circle cx="88" cy="-254" r="14" fill="${SKIN}"/>
        <circle cy="-262" r="88" fill="${SKIN}"/>
        <path d="M-92-268A92 92 0 0 1 92-268Q62-298 28-294Q0-324-42-296Q-72-294-92-268Z" fill="${hair}"/>
        <g class="k-brows" stroke="${INK}" stroke-width="5" stroke-linecap="round"><path class="k-brow-l" d="M-46-287H-20"/><path class="k-brow-r" d="M20-287H46"/></g>
        <g class="k-eyes"><ellipse cx="-32" cy="-257" rx="16" ry="18" fill="#fff"/><ellipse cx="32" cy="-257" rx="16" ry="18" fill="#fff"/>
          <g class="k-pupils"><circle cx="-32" cy="-255" r="9.5" fill="${INK}"/><circle cx="32" cy="-255" r="9.5" fill="${INK}"/>
            <circle cx="-29" cy="-259" r="3" fill="#fff"/><circle cx="35" cy="-259" r="3" fill="#fff"/></g></g>
        <circle cx="-56" cy="-224" r="14" fill="#fb7185" opacity=".35"/><circle cx="56" cy="-224" r="14" fill="#fb7185" opacity=".35"/>
        <path class="m m-smile" d="M-20-220Q0-198 20-220" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
        <path class="m m-sad" d="M-18-206Q0-224 18-206" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
        <path class="m m-sly" d="M-16-214Q6-202 24-222" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
        <ellipse class="m m-o" cy="-210" rx="11" ry="14" fill="#7a2e2e"/>
        <ellipse class="m m-talk" cy="-212" rx="15" ry="11" fill="#7a2e2e"/>
        <path class="k-sweat" d="M74-318C74-318 60-296 74-290C88-296 74-318 74-318Z" fill="#38bdf8"/>
        <g class="k-ear"><circle cx="-90" cy="-250" r="11" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/><rect x="-94" y="-244" width="8" height="24" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/></g>
      </g>
      <g class="k-desk">
        <path d="M-200-42H200L226 8H-226Z" fill="#edc58c"/><rect x="-214" y="8" width="428" height="112" rx="6" fill="#d19a55"/>
        <rect x="-214" y="8" width="428" height="14" fill="#b9813f" opacity=".5"/>
        <rect x="-200" y="120" width="20" height="70" fill="#9ca3af"/><rect x="180" y="120" width="20" height="70" fill="#9ca3af"/>
      </g>
      <g class="k-paper"><path d="M-64-38H52L66 4H-78Z" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
        <path d="M-52-28H40M-56-18H44M-60-8H30" stroke="#cbd5e1" stroke-width="3"/></g>
      <g class="k-glow"><rect x="-150" y="22" width="56" height="34" rx="6" fill="#0f172a"/><rect x="-145" y="26" width="46" height="26" rx="3" fill="#7dd3fc"/></g>
      <g class="k-arm k-rest" stroke="${shirt}" stroke-width="34" stroke-linecap="round" fill="none">
        <path d="M-80-132Q-112-70-74-24"/><path d="M80-132Q112-70 74-24"/>
        <circle cx="-72" cy="-18" r="19" fill="${SKIN}" stroke="none"/><circle class="k-hand-r" cx="72" cy="-18" r="19" fill="${SKIN}" stroke="none"/>
        <path class="k-pen" d="M76-22L104-78" stroke="#334155" stroke-width="9"/>
        <g class="k-wrist" stroke="none"><rect x="-102" y="-58" width="30" height="24" rx="7" fill="#0f172a"/><rect x="-98" y="-54" width="22" height="16" rx="4" fill="#5eead4"/></g>
      </g>
      <g class="k-arm k-up" stroke="${shirt}" stroke-width="34" stroke-linecap="round" fill="none">
        <path d="M-80-132Q-112-70-74-24"/><circle cx="-72" cy="-18" r="19" fill="${SKIN}" stroke="none"/>
        <path d="M80-132Q128-210 112-318"/><circle cx="112" cy="-336" r="21" fill="${SKIN}" stroke="none"/>
      </g>
      <g class="k-arm k-palm" stroke="${shirt}" stroke-width="34" stroke-linecap="round" fill="none">
        <path d="M80-132Q112-70 74-24"/><circle cx="72" cy="-18" r="19" fill="${SKIN}" stroke="none"/>
        <path d="M-80-132Q-150-150-128-212"/><circle cx="-128" cy="-228" r="28" fill="${SKIN}" stroke="none"/>
        <path d="M-142-236H-116M-142-226H-120M-140-216H-124" stroke="#1d4ed8" stroke-width="3.5"/>
      </g>
      <g class="k-arm k-slip" stroke="${shirt}" stroke-width="34" stroke-linecap="round" fill="none">
        <path d="M80-132Q112-70 74-24"/><circle cx="72" cy="-18" r="19" fill="${SKIN}" stroke="none"/>
        <path d="M-80-132Q-120-90-112-40"/><circle cx="-112" cy="-26" r="19" fill="${SKIN}" stroke="none"/>
        <g transform="translate(-122 -34) scale(.42)" stroke="none">${P.cheatnote}</g>
      </g>
      <g class="k-bub" transform="translate(${96 + 40 * bub} ${-322 - 70 * bub}) scale(${bub})"><g class="in">
        <path d="M-70-52H70A18 18 0 0 1 88-34V30A18 18 0 0 1 70 48H-30L-62 78-54 48H-70A18 18 0 0 1-88 30V-34A18 18 0 0 1-70-52Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
        <text class="k-bub-t" y="-2" font-size="58" text-anchor="middle" dominant-baseline="central"></text>
        <rect class="k-time" x="-66" y="30" width="132" height="10" rx="5" fill="#f59e0b"/></g></g>
      <g class="k-stamp" transform="translate(0 -250)"><g class="in">${mark('x')}</g></g>
      <rect class="k-hit" x="-226" y="-370" width="452" height="560" fill="transparent"/>
    </g></g>`;
  }

  // 진행 캐릭터 또박이(연필)
  const mascot = (x, y, s = 1) => `<g id="mascot" class="mascot" transform="translate(${x} ${y}) scale(${s})"><g class="k-in">
    <path d="M-34 0V26M34 0V26" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="-40" cy="30" rx="20" ry="10" fill="#ef4444"/><ellipse cx="40" cy="30" rx="20" ry="10" fill="#ef4444"/>
    <path class="ms-arm-l" d="M-58-150Q-104-130-100-92" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path class="ms-arm-r" d="M58-150Q108-176 110-222" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <rect x="-60" y="-44" width="120" height="48" rx="16" fill="#fda4af"/><rect x="-60" y="-62" width="120" height="26" fill="#cbd5e1"/>
    <rect x="-60" y="-262" width="120" height="204" fill="#fbbf24"/><rect x="-60" y="-262" width="30" height="204" fill="#f59e0b" opacity=".55"/>
    <path d="M-60-262L0-352 60-262Z" fill="#fde7c3"/><path d="M-19-323L0-352 19-323Z" fill="#334155"/>
    <ellipse cx="-24" cy="-196" rx="13" ry="16" fill="#fff"/><ellipse cx="24" cy="-196" rx="13" ry="16" fill="#fff"/>
    <g class="k-eyes"><circle cx="-24" cy="-194" r="8" fill="${INK}"/><circle cx="24" cy="-194" r="8" fill="${INK}"/></g>
    <circle cx="-42" cy="-166" r="11" fill="#fb7185" opacity=".5"/><circle cx="42" cy="-166" r="11" fill="#fb7185" opacity=".5"/>
    <path class="m m-smile" d="M-18-160Q0-140 18-160" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <ellipse class="m m-talk" cy="-154" rx="14" ry="11" fill="#7a2e2e"/>
  </g></g>`;

  const floor = `<rect y="640" width="${W}" height="260" fill="#e8caa0"/>
    ${[700, 770, 850].map(y => `<path d="M0 ${y}H${W}" stroke="#d4b080" stroke-width="3"/>`).join('')}
    <rect y="628" width="${W}" height="14" fill="#c9a36b"/>`;
  const clock = (x, y) => `<g transform="translate(${x} ${y})"><circle r="44" fill="#fff" stroke="#475569" stroke-width="8"/>
    <path d="M0 0V-28M0 0L20 8" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle r="5" fill="#ef4444"/></g>`;

  // 앞쪽 벽(칠판) — 영상용
  const bgFront = () => `<rect width="${W}" height="${H}" fill="#fdf3dc"/>${floor}
    <rect x="292" y="32" width="1276" height="450" rx="14" fill="#a16207"/><rect x="306" y="46" width="1248" height="422" rx="6" fill="#2f6b55"/>
    <rect x="292" y="476" width="1276" height="16" rx="6" fill="#854d0e"/>
    <rect x="1380" y="464" width="60" height="12" rx="4" fill="#fff"/><rect x="1450" y="464" width="40" height="12" rx="4" fill="#fecaca"/>
    ${clock(150, 110)}
    <text id="board-title" x="930" y="108" font-size="52" font-weight="800" fill="#fefce8" text-anchor="middle" dominant-baseline="central"></text>`;

  // 뒤쪽 벽(사물함·게시판) — 게임용. 교탁에서 학생들을 바라보는 시점
  const bgBack = () => `<rect width="${W}" height="${H}" fill="#fdf3dc"/>
    <rect y="470" width="${W}" height="430" fill="#e8caa0"/>
    ${[560, 660, 780].map(y => `<path d="M0 ${y}H${W}" stroke="#d4b080" stroke-width="3"/>`).join('')}
    <rect x="80" y="60" width="520" height="190" rx="10" fill="#a16207"/><rect x="92" y="72" width="496" height="166" rx="4" fill="#d9f99d"/>
    <text x="340" y="112" font-size="30" font-weight="800" fill="#3f6212" text-anchor="middle">우리 반 게시판</text>
    ${[0, 1, 2, 3].map(i => `<rect x="${122 + i * 116}" y="134" width="92" height="84" rx="6" fill="${['#fef08a', '#bae6fd', '#fecdd3', '#ddd6fe'][i]}" transform="rotate(${[-3, 2, -2, 3][i]} ${168 + i * 116} 176)"/>`).join('')}
    ${clock(1260, 140)}
    <g transform="translate(1000 250)">${[0, 1, 2, 3, 4].map(c => [0, 1].map(r => `<rect x="${c * 104}" y="${r * 112}" width="98" height="106" rx="6" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/>
      <circle cx="${c * 104 + 80}" cy="${r * 112 + 54}" r="6" fill="#1e3a8a"/><text x="${c * 104 + 16}" y="${r * 112 + 34}" font-size="22" font-weight="700" fill="#1e3a8a">${r * 5 + c + 1}</text>`).join('')).join('')}</g>
    <rect y="462" width="${W}" height="12" fill="#c9a36b"/>`;

  /* 상태 클래스 붙이기. 'face-x' 'look-x' 'arm-x' 는 같은 묶음끼리 서로 바꿔 끼운다. '!이름' 은 떼기 */
  function set(el, classes) {
    for (const c of classes.split(' ').filter(Boolean)) {
      if (c[0] === '!') { el.classList.remove(c.slice(1)); continue; }
      const g = c.match(/^(face|look|arm)-/);
      if (g) [...el.classList].forEach(x => x.startsWith(g[1] + '-') && el.classList.remove(x));
      el.classList.add(c);
    }
  }
  const bubble = (kidEl, text) => {
    const t = kidEl.querySelector('.k-bub-t');
    t.textContent = text || '';
    t.setAttribute('font-size', [...(text || '')].length > 2 ? 36 : 58);
    kidEl.classList.toggle('bub', !!text);
  };

  // 효과음(게임용). 음원 파일 없이 브라우저에서 바로 만든다
  let ac;
  function sfx(name, rate = 1) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const notes = { ok: [[880, 0, .12], [1320, .1, .2]], bad: [[170, 0, .18, 'sawtooth'], [130, .16, .3, 'sawtooth']],
        whistle: [[2100, 0, .1, 'square'], [2400, .1, .25, 'square']], pick: [[660, 0, .07]], tick: [[440, 0, .09]], go: [[880, 0, .3]],
        bell: [[659, 0, .5], [523, .42, .5], [587, .84, .5], [392, 1.26, .9]], win: [[523, 0, .15], [659, .12, .15], [784, .24, .15], [1047, .36, .4]] }[name];
      for (const [f, at, dur, type = 'sine'] of notes) {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
        o.type = type; o.frequency.value = f * rate;
        g.gain.setValueAtTime(type === 'sine' ? .22 : .07, t);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
      }
    } catch (e) { /* 소리를 못 내는 기기에서는 조용히 넘어간다 */ }
  }

  return { W, H, prop, mark, tile, cell, kid, mascot, bgFront, bgBack, set, bubble, sfx, emo };
})();
