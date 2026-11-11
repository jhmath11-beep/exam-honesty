/* 교실·학생 캐릭터·소품 SVG 키트. 영상(video.js)과 게임(game.js)이 함께 쓴다. 좌표계는 1600×900.
   그리기 규칙: 외곽선 #2a2522 4px, 빛은 왼쪽 위 → 오른쪽 30%에 그늘 한 덩어리, 하이라이트는 화면·유리에만. */
const K = (() => {
  const SKIN = '#f6d2b4', INK = '#1f2a44', OL = '#2a2522', W = 1600, H = 900, WALL = '#ece4d3';
  const SHADE = 'fill="#1a2340" opacity=".18"';   // 기본색보다 어둡고 살짝 차가운 그늘
  const GLARE = 'fill="#fff" opacity=".5"';
  const ol = (w = 4) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // 두 색 섞기(#rrggbb). 뒷줄 학생을 벽색 쪽으로 바래게 할 때 쓴다
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');

  // 둥근 사각형: 채움 → 오른쪽 30% 그늘 → 외곽선
  function box(x, y, w, h, r, fill, sw = 4) {
    const sx = x + w * .7, R = Math.min(r, w * .3);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>
      <path d="M${sx} ${y}H${x + w - R}A${R} ${R} 0 0 1 ${x + w} ${y + R}V${y + h - R}A${R} ${R} 0 0 1 ${x + w - R} ${y + h}H${sx}Z" ${SHADE}/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" ${ol(sw)}/>`;
  }
  // 아무 모양: 채움 → 그늘 조각(모양 안쪽) → 외곽선
  const shape = (d, fill, shade, sw = 4) => `<path d="${d}" fill="${fill}"/>${shade ? `<path d="${shade}" ${SHADE}/>` : ''}<path d="${d}" fill="none" ${ol(sw)}/>`;

  const emo = (e, size = 96) => `<text font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;   // 폴백용
  const pen = (body, cap = body, extra = '') => `<g transform="rotate(-35)">
    <path d="M-62-10H44L64 0 44 10H-62Z" fill="${body}"/><path d="M44-10L64 0 44 10Z" fill="#b9bcc2"/><path d="M57-3.5L64 0 57 3.5Z" fill="${OL}"/>
    <rect x="-62" y="-10" width="34" height="20" fill="${cap}"/><rect x="-62" y="3" width="106" height="7" ${SHADE}/>
    <path d="M-62-10H44L64 0 44 10H-62Z" fill="none" ${ol()}/>
    <rect x="-46" y="-15" width="7" height="22" rx="2" fill="#b9bcc2" ${ol(2.5)}/>${extra}</g>`;
  const watch = (face, strap = '#3a3f4b') => `${box(-20, -64, 40, 128, 8, strap)}${face}`;
  // 손(손가락 4 + 엄지 + 소매). 손을 든 모양
  const hand = (skin = SKIN, sleeve = '#2c3a5c') => `
    ${[[-24, -48], [-10, -58], [4, -55], [18, -42]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="${-y + 4}" rx="7" fill="${skin}" ${ol(3.5)}/>`).join('')}
    <rect x="-46" y="-12" width="15" height="36" rx="7.5" fill="${skin}" transform="rotate(-38 -38 6)" ${ol(3.5)}/>
    <rect x="-26" y="-14" width="58" height="44" rx="13" fill="${skin}"/>
    <path d="M-26-6V18Q-26 30-14 30H20Q32 30 32 18V-6" fill="none" ${ol(3.5)}/>
    ${box(-20, 26, 46, 32, 2, sleeve)}`;
  const paperLines = (x, y, n, w, gap = 14) => Array.from({ length: n }, (_, i) => `M${x} ${y + i * gap}H${x + w - (i % 2) * 14}`).join('');

  // 소품: 가운데가 (0,0), 대략 120×120 크기
  const P = {
    phone: `${box(-32, -56, 64, 112, 8, '#3a3f4b')}<rect x="-24" y="-44" width="48" height="80" rx="3" fill="#9fc6c9"/>
      <path d="M-24 2L8-44H20L-24 16Z" ${GLARE}/><path d="M-8-50H8" stroke="#b9bcc2" stroke-width="3" stroke-linecap="round"/><circle cy="46" r="4" fill="#b9bcc2"/>`,
    camera: `${shape('M-30-30L-20-46H14L24-30Z', '#3a3f4b')}${box(-58, -30, 116, 74, 6, '#3a3f4b')}
      <rect x="-48" y="-40" width="16" height="10" rx="2" fill="#d6322b" ${ol(3)}/><rect x="34" y="-22" width="14" height="10" rx="2" fill="#fffdf7"/>
      <circle cx="2" cy="7" r="27" fill="#b9bcc2" ${ol()}/><circle cx="2" cy="7" r="17" fill="${OL}"/><circle cx="2" cy="7" r="10" fill="#9fc6c9"/>
      <path d="M-4 1A8 8 0 0 1 6-1" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`,
    radio: `<path d="M44-30L58-66" ${ol()}/><circle cx="58" cy="-66" r="4.5" fill="${OL}"/>
      <path d="M-34-30V-44Q-34-50-28-50H14Q20-50 20-44V-30" fill="none" ${ol(6)}/>
      ${box(-58, -30, 116, 80, 8, '#3a3f4b')}
      <circle cx="-26" cy="10" r="24" fill="#b9bcc2" ${ol(3)}/><circle cx="-26" cy="10" r="15" fill="none" stroke="#6b6f78" stroke-width="2.5"/><circle cx="-26" cy="10" r="6" fill="#6b6f78"/>
      <rect x="6" y="-20" width="42" height="20" rx="2" fill="#9fc6c9" ${ol(2.5)}/><path d="M12-14V-8M20-14V-8M28-14V-8M36-14V-8M44-14V-8" stroke="${INK}" stroke-width="1.5"/><path d="M25-18V-2" stroke="#d6322b" stroke-width="3"/>
      <circle cx="16" cy="28" r="9" fill="#b9bcc2" ${ol(3)}/><circle cx="38" cy="28" r="9" fill="#b9bcc2" ${ol(3)}/>`,
    headset: `${shape('M-46 0V-6Q-46-22-30-22H30Q46-22 46-6V0Z', '#d8d4ca')}
      ${[-22, 22].map(x => `<g transform="translate(${x} -40) rotate(${x < 0 ? -15 : 15})"><rect x="-6" y="0" width="12" height="36" rx="6" fill="#fffdf7" ${ol(3)}/>
        <circle r="16" fill="#fffdf7" ${ol(3.5)}/><circle cx="${x < 0 ? -6 : 6}" cy="-2" r="6" fill="#3a3f4b"/></g>`).join('')}
      ${shape('M-46 0H46V28Q46 52 22 52H-22Q-46 52-46 28Z', '#e9e6df', 'M18 0H46V28Q46 52 22 52H18Z')}<circle cy="20" r="3.5" fill="#f2b42c"/>`,
    pencil: `<g transform="rotate(-35)"><path d="M-76-12H40L64 0 40 12H-76Z" fill="#f2b42c"/><path d="M-76-4H40M-76 4H40" stroke="#c98f12" stroke-width="2"/>
      <path d="M40-12L64 0 40 12Z" fill="#e8c9a0"/><path d="M56-4L64 0 56 4Z" fill="${OL}"/>
      <rect x="-64" y="-12" width="12" height="24" fill="#b9bcc2"/><rect x="-76" y="-12" width="12" height="24" fill="#e58a8a"/>
      <rect x="-76" y="4" width="116" height="8" ${SHADE}/><path d="M-76-12H40L64 0 40 12H-76Z" fill="none" ${ol()}/></g>`,
    book: `${box(-44, -56, 88, 112, 3, '#34507a')}<rect x="-40" y="-52" width="12" height="104" fill="${INK}" opacity=".35"/>
      <rect x="-18" y="-36" width="48" height="24" fill="#fffdf7" ${ol(2.5)}/><path d="M-12-28H22M-12-20H12" stroke="${INK}" stroke-width="3"/>
      <path d="M-18 30H30" stroke="#fffdf7" stroke-width="4" opacity=".7"/>`,
    note: `${box(-40, -54, 84, 108, 3, '#3d4f3a')}<rect x="-14" y="-36" width="46" height="26" fill="#fffdf7" ${ol(2.5)}/>
      <path d="M-8-27H24M-8-19H14" stroke="${INK}" stroke-width="3"/>
      ${[-40, -24, -8, 8, 24, 40].map(y => `<circle cx="-40" cy="${y}" r="6" fill="none" stroke="#b9bcc2" stroke-width="3.5"/>`).join('')}`,
    books: [['#5a3d3a', -50, 18, 100], ['#34507a', -42, -10, 92], ['#3d4f3a', -52, -38, 96]].map(([c, x, y, w]) =>
      `${box(x, y, w, 26, 3, c)}<rect x="${x + 14}" y="${y + 9}" width="36" height="8" fill="#fffdf7" opacity=".85"/><path d="M${x + w - 10} ${y + 4}V${y + 22}" stroke="#fffdf7" stroke-width="3" opacity=".6"/>`).join(''),
    bag: `<path d="M-18-62Q-18-84 0-84Q18-84 18-62" fill="none" ${ol(7)}/>
      ${shape('M-48-30Q-48-62-16-62H16Q48-62 48-30V50Q48 60 38 60H-38Q-48 60-48 50Z', '#34507a', 'M16-62Q48-62 48-30V50Q48 60 38 60H16Z')}
      <path d="M-40-34Q0-50 40-34" fill="none" stroke="#b9bcc2" stroke-width="3.5"/>
      ${box(-34, 0, 68, 46, 8, '#2f4b5e')}<path d="M-26 11H26" stroke="#b9bcc2" stroke-width="4" stroke-linecap="round"/><rect x="16" y="9" width="7" height="15" rx="2" fill="#b9bcc2" ${ol(2)}/>`,
    bell: `<rect x="-10" y="-64" width="20" height="16" rx="2" fill="#8a6a48" ${ol(3)}/>
      ${shape('M-50 22C-50-26-30-52 0-52C30-52 50-26 50 22Z', '#d9a441', 'M18-48C38-40 50-16 50 22H22C26-6 24-30 18-48Z')}
      <circle cy="44" r="9" fill="#8a6a48" ${ol(3)}/>${box(-58, 18, 116, 14, 4, '#d9a441')}`,
    lock: `<path d="M-24-8V-28Q-24-54 0-54Q24-54 24-28V-8" fill="none" stroke="${OL}" stroke-width="18"/>
      <path d="M-24-8V-28Q-24-54 0-54Q24-54 24-28V-8" fill="none" stroke="#b9bcc2" stroke-width="10"/>
      ${box(-38, -12, 76, 66, 6, '#d9a441')}<circle cy="12" r="7" fill="${OL}"/><path d="M-4 14L-6 32H6L4 14Z" fill="${OL}"/>`,
    locker: `${box(-44, -58, 88, 116, 4, '#8fa3b5')}<path d="M0-56V56" stroke="#6e8295" stroke-width="3"/>
      <path d="M-34-44H-10M-34-36H-10M-34-28H-10M10-44H34M10-36H34M10-28H34" stroke="#6e8295" stroke-width="3"/>
      <rect x="-20" y="-2" width="13" height="6" rx="2" fill="#3a3f4b"/><rect x="7" y="-2" width="13" height="6" rx="2" fill="#3a3f4b"/>`,
    toilet: `${box(-56, -44, 112, 88, 4, '#2f4b5e')}<path d="M0-34V34" stroke="#fffdf7" stroke-width="3"/>
      <g fill="#fffdf7"><circle cx="-27" cy="-22" r="8"/><rect x="-37" y="-11" width="20" height="25" rx="4"/><rect x="-35" y="12" width="7" height="20" rx="2"/><rect x="-26" y="12" width="7" height="20" rx="2"/>
      <circle cx="27" cy="-22" r="8"/><path d="M27-12L42 18H12Z"/><rect x="19" y="16" width="6" height="16" rx="2"/><rect x="29" y="16" width="6" height="16" rx="2"/></g>`,
    paper: `<path d="M-40-54H22L40-36V54H-40Z" fill="#fffdf7"/><path d="${paperLines(-28, -26, 6, 56)}" stroke="${INK}" stroke-width="3" opacity=".55"/>
      <path d="M-28-40H8" stroke="${INK}" stroke-width="5"/><path d="M22-54V-36H40Z" fill="#e3d8c2" ${ol(3)}/><path d="M-40-54H22L40-36V54H-40Z" fill="none" ${ol()}/>`,
    ask: hand(),
    hush: `${shape('M-50-44H50Q58-44 58-36V18Q58 26 50 26H-4L-24 48-20 26H-50Q-58 26-58 18V-36Q-58-44-50-44Z', '#fffdf7')}
      <text class="disp" y="-8" font-size="40" font-weight="800" fill="${INK}" text-anchor="middle" dominant-baseline="central">쉿</text>
      <path d="M-52 36L52-50" stroke="#d6322b" stroke-width="8" stroke-linecap="round"/>`,
    stack: [[12, 8, 6], [4, 2, 2], [-6, -6, -5]].map(([x, y, r], i) => `<g transform="translate(${x} ${y}) rotate(${r})">
      <rect x="-36" y="-48" width="72" height="96" rx="2" fill="#fffdf7" ${ol(3)}/>${i === 2 ? `<path d="M-24-32H16" stroke="${INK}" stroke-width="5"/><path d="${paperLines(-24, -16, 5, 48)}" stroke="${INK}" stroke-width="3" opacity=".55"/>` : ''}</g>`).join(''),
    hands: `<g transform="translate(-30 6) rotate(-12) scale(.8)">${hand()}</g><g transform="translate(32 6) rotate(12) scale(-.8 .8)">${hand()}</g>`,
    law: `<path d="M-50-38L-66 4M-50-38L-34 4M50-38L34 4M50-38L66 4" stroke="${OL}" stroke-width="2.5"/>
      ${box(-5, -50, 10, 94, 2, '#d9a441', 3)}${shape('M-34 56H34L24 40H-24Z', '#d9a441')}${box(-58, -46, 116, 9, 3, '#d9a441', 3)}<circle cy="-54" r="7" fill="#d9a441" ${ol(3)}/>
      ${shape('M-72 4H-28Q-32 22-50 22Q-68 22-72 4Z', '#b9bcc2', '', 3)}${shape('M28 4H72Q68 22 50 22Q32 22 28 4Z', '#b9bcc2', '', 3)}`,
    basket: `${shape('M-56-18L-44-36H44L56-18Z', '#8c6440')}
      <g transform="rotate(-5)"><rect x="-32" y="-60" width="58" height="48" rx="2" fill="#fffdf7" ${ol(3)}/><path d="M-22-48H14M-22-38H6" stroke="${INK}" stroke-width="3" opacity=".55"/></g>
      ${box(-58, -18, 116, 74, 4, '#c39062')}<rect x="-36" y="-2" width="72" height="40" fill="#fffdf7" ${ol(3)}/>
      <text class="disp" y="19" font-size="28" font-weight="800" fill="#d6322b" text-anchor="middle" dominant-baseline="central">제출</text>`,
    smartwatch: watch(`${box(-38, -42, 76, 84, 14, '#2a2c33')}<rect x="-29" y="-33" width="58" height="66" rx="8" fill="#9fc6c9"/>
      <path d="M-29-4L-4-33H8L-29 8Z" ${GLARE}/>
      <circle cx="-12" cy="-12" r="8" fill="#d6322b"/><circle cx="12" cy="-12" r="8" fill="#f2b42c"/><circle cx="-12" cy="12" r="8" fill="#2b4fa8"/><circle cx="12" cy="12" r="8" fill="#fffdf7"/>
      <rect x="38" y="-10" width="7" height="20" rx="2" fill="#b9bcc2" ${ol(2.5)}/>`),
    digiwatch: watch(`${box(-40, -34, 80, 68, 10, '#2a2c33')}<rect x="-31" y="-24" width="62" height="48" rx="4" fill="#c9d3b0"/>
      <path d="M-31 0L-8-24H2L-31 10Z" ${GLARE}/>
      <text y="2" font-size="25" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="${OL}">12:30</text>`),
    analog: watch(`<circle r="40" fill="#fffdf7" ${ol(5)}/><path d="M0-34V-27M34 0H27M0 34V27M-34 0H-27" stroke="${INK}" stroke-width="3"/>
      <path d="M0 0V-24M0 0L16 9" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle r="4.5" fill="#d6322b"/>
      <path d="M-28-14A30 30 0 0 1-12-28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`, '#8a6a48'),
    calc: `${box(-40, -56, 80, 112, 8, '#3a3f4b')}<rect x="-30" y="-46" width="60" height="26" rx="3" fill="#c9d3b0"/>
      <text x="24" y="-33" font-size="18" font-weight="800" fill="${OL}" text-anchor="end" dominant-baseline="central">3.14</text>
      ${[0, 1, 2, 3].map(r => [0, 1, 2].map(c => `<rect x="${-30 + c * 21}" y="${-12 + r * 16}" width="17" height="12" rx="2" fill="${r === 3 && c === 2 ? '#d6322b' : '#b9bcc2'}"/>`).join('')).join('')}`,
    edict: `${box(-54, -54, 108, 54, 6, '#3a3f4b')}<rect x="-45" y="-46" width="90" height="38" rx="3" fill="#9fc6c9"/>
      <path d="M-36-36H18M-36-25H28M-36-15H8" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M14-8L40-46H45V-38L26-8Z" ${GLARE}/>
      ${box(-58, 0, 116, 50, 6, '#3a3f4b')}
      ${[0, 1].map(r => [0, 1, 2, 3, 4, 5].map(c => `<rect x="${-48 + c * 16.5}" y="${10 + r * 17}" width="12" height="11" rx="2" fill="#b9bcc2"/>`).join('')).join('')}`,
    mp3: `${box(-30, -54, 60, 108, 8, '#2f4b5e')}<rect x="-22" y="-44" width="44" height="36" rx="3" fill="#9fc6c9"/>
      <ellipse cx="-6" cy="-18" rx="6" ry="4.5" fill="${INK}"/><path d="M-0.5-18V-37L12-33V-26" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cy="22" r="19" fill="#b9bcc2" ${ol(3)}/><circle cy="22" r="7" fill="#2f4b5e" ${ol(2)}/>`,
    recorder: `${box(-28, -60, 56, 120, 10, '#3a3f4b')}
      ${[-10, 0, 10].map(x => [-50, -42].map(y => `<circle cx="${x}" cy="${y}" r="2.5" fill="#b9bcc2"/>`).join('')).join('')}
      <rect x="-19" y="-32" width="38" height="26" rx="3" fill="#9fc6c9"/><path d="M-14-19L-9-25-4-13 1-27 6-15 11-21" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cy="18" r="13" fill="#d6322b" ${ol(3)}/><text y="46" font-size="13" font-weight="800" fill="#fffdf7" text-anchor="middle">REC</text>`,
    campen: pen('#3a3f4b', '#16161a', `<circle cx="-12" r="7.5" fill="${OL}"/><circle cx="-12" r="4" fill="#9fc6c9"/><circle cx="-13.5" cy="-1.5" r="1.3" fill="#fff"/>`),
    penBlack: pen('#3a3f4b', '#16161a'), penBlue: pen('#2b4fa8', '#1f3b80'), penRed: pen('#d6322b', '#a8241f'),
    signpen: `<g transform="rotate(-35)"><path d="M-66-12H56L74 0 56 12H-66Z" fill="#2a2c33"/><path d="M56-6L74 0 56 6Z" fill="#16161a"/>
      <rect x="-22" y="-12" width="48" height="24" fill="#fffdf7"/><path d="M-14-3H18M-14 4H10" stroke="#4e5770" stroke-width="3"/>
      <rect x="-66" y="5" width="122" height="7" ${SHADE}/><path d="M-66-12H56L74 0 56 12H-66Z" fill="none" ${ol()}/></g>`,
    eraser: `<g transform="rotate(-14)"><rect x="-54" y="-28" width="108" height="56" rx="6" fill="#fffdf7"/>
      <path d="M-48-28H12V28H-48Q-54 28-54 22V-22Q-54-28-48-28Z" fill="#2b4fa8"/><rect x="-42" y="-6" width="42" height="6" fill="#fffdf7" opacity=".85"/>
      <rect x="-52" y="12" width="104" height="14" ${SHADE}/><rect x="-54" y="-28" width="108" height="56" rx="6" fill="none" ${ol()}/></g>`,
    lead: `<g transform="rotate(12)"><path d="M-8-48V-70M2-48V-76M12-48V-66" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
      ${box(-24, -48, 48, 100, 4, '#2f4b5e')}<rect x="-22" y="-46" width="44" height="20" fill="${INK}"/>
      <text y="16" font-size="22" font-weight="800" fill="#fffdf7" text-anchor="middle">HB</text></g>`,
    tape: `<g transform="rotate(-18)"><path d="M-66 46H78" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M-66 46H78" stroke="#fffdf7" stroke-width="10" stroke-linecap="round"/>
      <path d="M56 24L80 40" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M56 24L80 40" stroke="#b9bcc2" stroke-width="7" stroke-linecap="round"/>
      ${shape('M-60-24Q-60-40-44-40H28Q50-40 58-20L68 6Q72 22 56 24H-44Q-60 24-60 8Z', '#34507a', 'M30-40Q50-40 58-20L68 6Q72 22 56 24H30Z')}
      <circle cx="-26" cy="-8" r="18" fill="#9fc6c9" ${ol(3)}/><circle cx="-26" cy="-8" r="9" fill="#fffdf7"/><circle cx="-26" cy="-8" r="4" fill="#3a3f4b"/>
      <circle cx="22" cy="-8" r="13" fill="#9fc6c9" ${ol(3)}/><circle cx="22" cy="-8" r="6" fill="#fffdf7"/></g>`,
    cheatnote: `<g transform="rotate(-8)"><path d="M-44-52H28L44-36V52H-44Z" fill="#fffdf7"/><rect x="-34" y="-6" width="56" height="12" fill="#f2b42c" opacity=".45"/>
      <path d="M-32-30q8-6 16 0t16 0 16 0M-32-12q8-6 16 0t16 0 12 0M-32 6q8-6 16 0t16 0 16 0M-32 24q8-6 16 0t12 0M-32 40q8-6 16 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M28-52V-36H44Z" fill="#e3d8c2" ${ol(3)}/><path d="M-44-52H28L44-36V52H-44Z" fill="none" ${ol()}/></g>`,
    drawer: `${box(-58, -40, 116, 80, 4, '#a8733f')}<rect x="-46" y="-26" width="92" height="52" rx="2" fill="#5a3d2a" ${ol(3)}/>
      <rect x="-46" y="-26" width="92" height="12" fill="#000" opacity=".25"/><rect x="-14" y="28" width="28" height="7" rx="2" fill="#6b6f78" ${ol(2)}/>`,
  };
  const prop = (k, s = 1) => `<g transform="scale(${s})">${P[k] || emo(k)}</g>`;

  // 채점 표시: o = 빨간 손그림 동그라미, x = 빨간 두 획. 뒤에 바탕 원을 깔아 어디서든 보이게
  const mark = kind => `<circle r="34" fill="#fffdf7" opacity=".85"/>` + (kind === 'x'
    ? `<path d="M-20-22L20 22M21-20L-19 21" stroke="#d6322b" stroke-width="11" stroke-linecap="round"/>`
    : `<path d="M14-30C-12-38-36-20-34 4C-32 28-6 38 16 30C36 22 40-6 26-22C18-30 4-34-10-28" fill="none" stroke="#d6322b" stroke-width="9" stroke-linecap="round"/>`);

  // 칠판에 붙는 카드: 왼쪽 그림 + 오른쪽 글(줄바꿈은 \n). 잘라 붙인 시험지 조각
  function tile(id, cx, cy, w, h, k, label, m, fs = Math.min(30, h * 0.24)) {
    const lines = label.split('\n');
    const tx = -w / 2 + h * 0.86, ty = -(lines.length - 1) * fs * 0.62;
    return `<g id="${id}" class="h tile" transform="translate(${cx} ${cy})"><g class="in">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#fffdf7" stroke="${OL}" stroke-opacity=".9" stroke-width="2"/>
      <rect x="${-w / 2 + 6}" y="${-h / 2 - 9}" width="58" height="20" fill="#f2e2a8" opacity=".85" transform="rotate(-6 ${-w / 2 + 35} ${-h / 2})"/>
      <g transform="translate(${-w / 2 + h * 0.45} 0)">${prop(k, h / 165)}</g>
      ${lines.map((l, i) => `<text x="${tx}" y="${ty + i * fs * 1.25}" font-size="${fs}" font-weight="700" fill="${INK}" dominant-baseline="central">${l}</text>`).join('')}
      </g>${m ? `<g class="mark" transform="translate(${w / 2 - 30} ${-h / 2 + 26}) scale(.62)"><g class="in">${mark(m)}</g></g>` : ''}</g>`;
  }
  // n개를 cols열 격자로 놓을 때 i번째 칸의 가운데 좌표와 크기
  function cell(i, cols, box = { x: 330, y: 160, w: 1200, h: 290 }, rows = 2, gap = 18) {
    const w = (box.w - gap * (cols - 1)) / cols, h = (box.h - gap * (rows - 1)) / rows;
    return [box.x + (i % cols) * (w + gap) + w / 2, box.y + Math.floor(i / cols) * (h + gap) + h / 2, w, h];
  }

  /* 학생. 머리:몸 = 1:1.5, 교복 재킷 + 흰 깃 + 넥타이(tie) 또는 리본.
     선택 인자: skin 피부색, tie 넥타이 여부, tint 벽색 섞기(뒷줄 0~.15), persp 책상 상판 뒷변을 소실점 쪽으로 미는 양 */
  function kid({ id, x, y, s = 1, hair = '#2e2420', shirt = '#2c3a5c', style = 'short', blink = 0, bub = 1, skin = SKIN, tie = true, tint = 0, persp = 0 }) {
    const c = v => tint ? mix(v, WALL, tint) : v;
    const sk = c(skin), hr = c(hair), jk = c(shirt), wt = c('#fffdf7'), rb = c('#b8322b');
    const hairC = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${hr}" ${ol()}/>`;
    const back = { bob: `<rect x="-92" y="-352" width="184" height="168" rx="66" fill="${hr}" ${ol()}/>`,
      pony: hairC(106, -296, 21) + hairC(86, -334, 30),
      twin: hairC(-98, -254, 30) + hairC(98, -254, 30),
      curly: [-60, -30, 0, 30, 60].map((cx, i) => hairC(cx, -334 - (i % 2) * 12, 30)).join('') }[style] || '';
    const sleeve = d => `<path d="${d}" stroke="${OL}" stroke-width="42"/><path d="${d}" stroke="${jk}" stroke-width="34"/>`;
    const handC = (cx, cy, r = 18, cls = '') => `<circle${cls ? ` class="${cls}"` : ''} cx="${cx}" cy="${cy}" r="${r}" fill="${sk}" ${ol()}/>`;
    const armL = sleeve('M-92-140Q-120-72-76-24') + handC(-74, -18), armR = sleeve('M92-140Q120-72 76-24') + handC(74, -18, 18, 'k-hand-r');
    const knot = tie ? `<path d="M-7-160H7L10-150 4-112 0-104-4-112-10-150Z" fill="${rb}" ${ol(2.5)}/>`
      : `<path d="M0-156L-18-167V-145ZM0-156L18-167V-145Z" fill="${rb}" ${ol(2.5)}/><circle cy="-156" r="5" fill="${rb}" ${ol(2.5)}/>`;
    const p = persp;
    return `<g id="${id}" class="kid" transform="translate(${x} ${y}) scale(${s})" style="--blink:${blink}s"><g class="k-in">
      ${back}
      <rect x="-14" y="-204" width="28" height="44" fill="${sk}" ${ol(3)}/><rect x="-12" y="-200" width="24" height="12" ${SHADE}/>
      ${shape('M-104-30C-112-112-100-160-56-168L56-168C100-160 112-112 104-30Z', jk, 'M60-167C100-158 112-112 104-30H70C80-90 78-140 60-167Z')}
      <path d="M-30-168L0-112 30-168Z" fill="${wt}" ${ol(3)}/><path d="M-44-166L-10-116M44-166L10-116" stroke="${OL}" stroke-width="2.5" opacity=".5"/>
      ${knot}
      <g class="k-head">
        <circle cx="-76" cy="-262" r="13" fill="${sk}" ${ol()}/><circle cx="76" cy="-262" r="13" fill="${sk}" ${ol()}/>
        <circle cy="-270" r="77" fill="${sk}"/><path d="M38.5-336.7A77 77 0 0 1 38.5-203.3A100 100 0 0 0 38.5-336.7Z" fill="#1a2340" opacity=".12"/>
        <circle cy="-270" r="77" fill="none" ${ol()}/>
        ${shape('M-80-274A80 80 0 0 1 80-274Q60-300 26-296Q-2-322-38-298Q-64-296-80-274Z', hr, 'M44-341A80 80 0 0 1 80-274Q66-292 50-297Z')}
        <g class="k-brows" stroke="${INK}" stroke-width="4" stroke-linecap="round"><path class="k-brow-l" d="M-40-292H-18"/><path class="k-brow-r" d="M18-292H40"/></g>
        <g class="k-eyes"><g class="k-pupils"><ellipse cx="-27" cy="-262" rx="7.5" ry="10.5" fill="${INK}"/><ellipse cx="27" cy="-262" rx="7.5" ry="10.5" fill="${INK}"/>
          <circle cx="-24.5" cy="-266" r="2.6" fill="#fff"/><circle cx="29.5" cy="-266" r="2.6" fill="#fff"/></g></g>
        <circle cx="-50" cy="-236" r="12" fill="#e86a5a" opacity=".22"/><circle cx="50" cy="-236" r="12" fill="#e86a5a" opacity=".22"/>
        <path class="m m-smile" d="M-16-226Q0-210 16-226" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <path class="m m-sad" d="M-14-214Q0-228 14-214" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <path class="m m-sly" d="M-12-220Q4-210 20-228" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse class="m m-o" cy="-218" rx="9" ry="11" fill="#7a2e2e"/>
        <ellipse class="m m-talk" cy="-220" rx="12" ry="9" fill="#7a2e2e"/>
        <path class="k-sweat" d="M64-322C64-322 50-300 64-294C78-300 64-322 64-322Z" fill="#9fc6c9" ${ol(2.5)}/>
        <g class="k-ear"><circle cx="-78" cy="-258" r="11" fill="#fffdf7" ${ol(3)}/><rect x="-82" y="-252" width="8" height="24" rx="4" fill="#fffdf7" ${ol(2.5)}/></g>
      </g>
      <g class="k-desk">
        <path d="M${-200 + p}-42H${200 + p}L226 8H-226Z" fill="${c('#d7a86e')}" ${ol(3)}/>
        <rect x="-200" y="120" width="20" height="70" fill="${c('#6b6f78')}" ${ol(3)}/><rect x="180" y="120" width="20" height="70" fill="${c('#6b6f78')}" ${ol(3)}/>
        <rect x="-214" y="8" width="428" height="112" rx="4" fill="${c('#a8733f')}"/><rect x="-214" y="8" width="428" height="14" ${SHADE}/>
        <rect x="-214" y="8" width="428" height="112" rx="4" fill="none" ${ol(3)}/>
      </g>
      <g class="k-paper"><path d="M-64-38H52L66 4H-78Z" fill="${wt}" ${ol(2)}/>
        <path d="M-52-28H40M-56-18H44M-60-8H30" stroke="#cfc5ad" stroke-width="3"/></g>
      <g class="k-glow"><rect x="-150" y="22" width="56" height="34" rx="6" fill="#3a3f4b" ${ol(3)}/><rect x="-145" y="26" width="46" height="26" rx="3" fill="#9fc6c9"/></g>
      <g class="k-arm k-rest" stroke-linecap="round" fill="none">
        ${armL}${armR}
        <path class="k-pen" d="M76-22L104-78" stroke="#2b4fa8" stroke-width="9"/>
        <g class="k-wrist"><rect x="-104" y="-58" width="30" height="24" rx="6" fill="#3a3f4b" ${ol(3)}/><rect x="-100" y="-54" width="22" height="16" rx="3" fill="#9fc6c9"/></g>
      </g>
      <g class="k-arm k-down" stroke-linecap="round" fill="none">
        ${sleeve('M-92-140Q-112-90-100-56')}${sleeve('M92-140Q112-90 100-56')}
      </g>
      <g class="k-arm k-up" stroke-linecap="round" fill="none">
        ${armL}${sleeve('M92-140Q136-214 118-318')}${handC(118, -336, 20)}
      </g>
      <g class="k-arm k-palm" stroke-linecap="round" fill="none">
        ${armR}${sleeve('M-92-140Q-160-156-136-214')}${handC(-136, -230, 26)}
        <path d="M-148-238H-124M-148-229H-128M-146-220H-130" stroke="#2b4fa8" stroke-width="3.5"/>
      </g>
      <g class="k-arm k-slip" stroke-linecap="round" fill="none">
        ${armR}${sleeve('M-92-140Q-128-92-116-40')}${handC(-116, -26)}
        <g transform="translate(-126 -34) scale(.42)">${P.cheatnote}</g>
      </g>
      <g class="k-bub" transform="translate(${96 + 40 * bub} ${-322 - 70 * bub}) scale(${bub})"><g class="in">
        <path d="M-78-52H78A10 10 0 0 1 88-42V38A10 10 0 0 1 78 48H-24L-60 84-44 48H-78A10 10 0 0 1-88 38V-42A10 10 0 0 1-78-52Z" fill="#fffdf7" ${ol(3)}/>
        <text class="k-bub-t" y="-2" font-size="58" font-weight="700" fill="${INK}" text-anchor="middle" dominant-baseline="central"></text>
        <g class="k-bub-p" transform="translate(0 -10)"></g>
        <rect class="k-time" x="-66" y="30" width="132" height="10" fill="#f2b42c"/></g></g>
      <g class="k-stamp" transform="translate(0 -250)"><g class="in"><g transform="rotate(-12)" opacity=".9">
        <rect x="-80" y="-35" width="160" height="70" fill="#fffdf7" fill-opacity=".6" stroke="#d6322b" stroke-width="6"/>
        <rect x="-70" y="-25" width="140" height="50" fill="none" stroke="#d6322b" stroke-width="2"/>
        <text class="disp" y="2" font-size="44" font-weight="900" fill="#d6322b" text-anchor="middle" dominant-baseline="central">적발</text></g></g></g>
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
  const clock = (x, y, r = 44) => `<g transform="translate(${x} ${y}) scale(${r / 44})"><circle r="44" fill="#fffdf7" stroke="#3a3f4b" stroke-width="7"/>
    <path d="M0-36V-30M36 0H30M0 36V30M-36 0H-30" stroke="${INK}" stroke-width="3"/>
    <path d="M0 0V-26M0 0L19 8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle r="4.5" fill="#d6322b"/></g>`;

  // 앞쪽 벽(칠판) — 영상용
  const bgFront = () => `<rect width="${W}" height="${H}" fill="#fdf3dc"/>${floor}
    <rect x="292" y="32" width="1276" height="450" rx="14" fill="#a16207"/><rect x="306" y="46" width="1248" height="422" rx="6" fill="#2f6b55"/>
    <rect x="292" y="476" width="1276" height="16" rx="6" fill="#854d0e"/>
    <rect x="1380" y="464" width="60" height="12" rx="4" fill="#fff"/><rect x="1450" y="464" width="40" height="12" rx="4" fill="#fecaca"/>
    ${clock(150, 110)}
    <text id="board-title" x="930" y="108" font-size="52" font-weight="800" fill="#fefce8" text-anchor="middle" dominant-baseline="central"></text>`;

  /* 뒤쪽 벽(창문·게시판·사물함) — 게임용. 교탁에서 학생들을 바라보는 시점, 소실점 (800, 300).
     선택 인자로 배치를 바꾼다: wins [[x,y]…] 창 왼쪽 위, board [x,y,w,h], lockers [x,y,열 수], clock [x,y,r] */
  function bgBack({ wins = [[40, 46], [214, 46]], board = [400, 56, 290, 178], lockers = [1000, 156, 5], clock: ck = [1270, 84, 40] } = {}) {
    const VX = 800, VY = 300, top = x0 => VX + (x0 - VX) * (380 - VY) / (H - VY);
    const xs = []; for (let x0 = -400; x0 <= 2000; x0 += 160) xs.push(x0);
    const [bx, by, bw, bh] = board, [lx, ly, lc] = lockers, nw = (bw - 60) / 4;
    return `<rect width="${W}" height="380" fill="${WALL}"/><rect y="260" width="${W}" height="120" fill="#cdbd9f"/><rect y="254" width="${W}" height="6" fill="#8a6a48"/>
      <rect y="380" width="${W}" height="520" fill="#c39062"/>
      ${xs.slice(0, -1).map((x0, i) => i % 2 ? `<path d="M${top(x0)} 380H${top(xs[i + 1])}L${xs[i + 1]} 900H${x0}Z" fill="#b07f53" opacity=".55"/>` : '').join('')}
      <path d="${xs.map(x0 => `M${top(x0)} 380L${x0} 900`).join('')}" stroke="#8c6440" stroke-width="2"/>
      <path d="${[400, 430, 475, 540, 630, 760].map(y => `M0 ${y}H${W}`).join('')}" stroke="#8c6440" stroke-width="1.5" opacity=".45"/>
      <rect y="${H - 90}" width="${W}" height="90" fill="#000" opacity=".06"/>
      <rect y="372" width="${W}" height="10" fill="#8a6a48"/>
      ${wins.map(([x, y]) => `<rect x="${x}" y="${y}" width="150" height="190" fill="#f7f3ea"/><rect x="${x + 12}" y="${y + 12}" width="126" height="166" fill="#cfe3e6"/>
        <path d="M${x + 12} ${y + 118}L${x + 84} ${y + 12}H${x + 112}L${x + 12} ${y + 156}Z" ${GLARE}/>
        <path d="M${x + 75} ${y + 12}V${y + 178}M${x + 12} ${y + 92}H${x + 138}" stroke="#f7f3ea" stroke-width="10"/>
        <rect x="${x - 8}" y="${y + 186}" width="166" height="10" fill="#d8d0bd"/>
        <path d="M${x + 12} ${y + 178}H${x + 138}L${x + 440} 840H${x + 190}Z" fill="#fff6dc" opacity=".14"/>`).join('')}
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="#8a6a48"/><rect x="${bx + 10}" y="${by + 10}" width="${bw - 20}" height="${bh - 20}" fill="#b88b5c"/>
      <text class="disp" x="${bx + bw / 2}" y="${by + 40}" font-size="26" font-weight="800" fill="${INK}" text-anchor="middle">우리 반 게시판</text>
      ${[0, 1, 2, 3].map(i => { const nx = bx + 20 + i * (nw + 6.6), ny = by + 56, nh = bh - 80, r = [-3, 2, -2, 3][i];
        return `<g transform="rotate(${r} ${nx + nw / 2} ${ny + nh / 2})"><rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="2" fill="#fffdf7"/>
          <path d="M${nx + 9} ${ny + 22}H${nx + nw - 9}M${nx + 9} ${ny + 38}H${nx + nw - 15}M${nx + 9} ${ny + 54}H${nx + nw - 22}" stroke="${INK}" stroke-width="3" opacity=".55"/>
          <circle cx="${nx + nw / 2}" cy="${ny + 8}" r="6" fill="#d6322b" stroke="#8a1f1a" stroke-width="2"/></g>`; }).join('')}
      <rect x="${lx - 4}" y="${ly - 4}" width="${lc * 104 + 4}" height="228" fill="#6e8295"/>
      ${Array.from({ length: lc }, (_, c) => [0, 1].map(r => { const x = lx + c * 104, y = ly + r * 112;
        return `<rect x="${x}" y="${y}" width="100" height="108" fill="#8fa3b5"/><rect x="${x + 62}" y="${y + 52}" width="24" height="6" rx="2" fill="#3a3f4b"/>
          <text x="${x + 12}" y="${y + 28}" font-size="18" font-weight="700" fill="${INK}">${r * lc + c + 1}</text>`; }).join('')).join('')}
      <rect x="${lx + lc * 104 - 30}" y="${ly}" width="30" height="220" ${SHADE}/>
      ${clock(...ck)}`;
  }

  /* 상태 클래스 붙이기. 'face-x' 'look-x' 'arm-x' 는 같은 묶음끼리 서로 바꿔 끼운다. '!이름' 은 떼기 */
  function set(el, classes) {
    for (const c of classes.split(' ').filter(Boolean)) {
      if (c[0] === '!') { el.classList.remove(c.slice(1)); continue; }
      const g = c.match(/^(face|look|arm)-/);
      if (g) [...el.classList].forEach(x => x.startsWith(g[1] + '-') && el.classList.remove(x));
      el.classList.add(c);
    }
  }
  // 말풍선: 글자, 또는 소품 이름(P의 키)이면 그림을 넣는다
  const bubble = (kidEl, text) => {
    const t = kidEl.querySelector('.k-bub-t'), pic = kidEl.querySelector('.k-bub-p'), icon = P[text];
    t.textContent = icon ? '' : text || '';
    t.setAttribute('font-size', [...(text || '')].length > 2 ? 36 : 58);
    if (pic) pic.innerHTML = icon ? prop(text, .5) : '';
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
