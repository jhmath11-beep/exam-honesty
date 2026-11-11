/* 영상(3D): three.js 로 그린 교실. 오디오 트랙(assets/video.mp3)의 재생 시각이 시계 역할을 한다.
   - 캐릭터는 관절(어깨·팔꿈치·목·허리)을 가진 인형이고, '목표 자세'를 향해 스프링으로 부드럽게 움직인다.
   - 입 모양은 cues.js 의 ENV(목소리 크기)에 맞춘다.
   - 칠판 카드·소품의 등장은 재생 시각의 함수라서 되감기·건너뛰기에도 어긋나지 않는다. */
const V = (() => {
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  const INK = '#3b2f2f', SKIN = '#ffd8b5';
  const BOARD = { x: .5, y: 2.0, z: -3.94, w: 4.8 }, PX = BOARD.w / 1248;   // 칠판 위 좌표는 kit 의 2D 좌표(1600×900)를 그대로 쓴다
  const b2w = (sx, sy, dz = .02) => new T.Vector3(BOARD.x + (sx - 930) * PX, BOARD.y - (sy - 257) * PX, BOARD.z + dz);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = u => 1 - (1 - u) ** 3;
  const easeBack = u => { const c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
  const FONT = '"IBM Plex Sans KR","Malgun Gothic",sans-serif', TFONT = 'Hahmlet, serif';
  const NAVY = '#1f2a44', LINE = '#2a2522', PAPER = '#fffdf7', RED = '#d6322b';
  // 칠판 카드·말풍선에 쓰는 아이콘(이모지 대신 직접 그림). 좌표는 K.prop 과 같은 -75~75
  const O = `stroke="${LINE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const SPARK = `<path d="M0-62Q9-9 62 0Q9 9 0 62Q-9 9-62 0Q-9-9 0-62Z" fill="#f2b42c" ${O}/>`;
  const ICON = {
    '❌': [-44, 0, 44].map((x, i) => `<ellipse cx="${x}" cy="0" rx="17" ry="25" fill="${i === 1 ? '#16161a' : PAPER}" stroke="${RED}" stroke-width="4"/>`).join('') +
      `<path d="M-32-36L32 36M32-36L-32 36" stroke="#2b4fa8" stroke-width="9" stroke-linecap="round"/>`,
    '👀': [-27, 27].map(x => `<ellipse cx="${x}" cy="0" rx="25" ry="32" fill="${PAPER}" ${O}/><ellipse cx="${x + 10}" cy="6" rx="11" ry="14" fill="${NAVY}"/><circle cx="${x + 14}" cy="0" r="4" fill="#fff"/>`).join(''),
    '👉': `<rect x="-72" y="-20" width="26" height="50" rx="3" fill="#2c3a5c" ${O}/><rect x="-6" y="-22" width="58" height="18" rx="9" fill="#f6d2b4" ${O}/>
      <rect x="-50" y="-22" width="52" height="52" rx="14" fill="#f6d2b4" ${O}/><path d="M-34-4H-8M-34 10H-8" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <path d="M62-34Q74-13 62 8M70-48Q92-13 70 22" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`,
    '✋': `${[-34, -16, 2, 20].map((x, i) => `<rect x="${x}" y="${-62 + Math.abs(i - 1.5) * 6}" width="15" height="62" rx="7" fill="#f6d2b4" ${O}/>`).join('')}
      <rect x="-54" y="-4" width="34" height="15" rx="7" fill="#f6d2b4" ${O} transform="rotate(-35 -36 4)"/>
      <rect x="-36" y="-14" width="72" height="72" rx="18" fill="#f6d2b4" ${O}/><path d="M-20 6H18M-20 22H10M-20 38H16" stroke="#2b4fa8" stroke-width="4" stroke-linecap="round"/>`,
    '😠': `<circle cx="-6" cy="6" r="48" fill="#f6d2b4" ${O}/><path d="M-36-14L-14-4M24-14L2-4" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="-24" cy="8" rx="5" ry="7" fill="${NAVY}"/><ellipse cx="12" cy="8" rx="5" ry="7" fill="${NAVY}"/><path d="M-24 36Q-6 24 12 36" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
      <path d="M44-60Q44-44 60-44M72-60Q72-44 56-44M44-28Q44-40 60-40M72-28Q72-40 56-40" fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>`,
    '🔄': `<path d="M-48-20H34M18-38L42-20 18-2" fill="none" stroke="${NAVY}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 22H-34M-18 4L-42 22-18 40" fill="none" stroke="${RED}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
    '🧑‍🏫': `<path d="M42 44L66-44" stroke="#8a6a48" stroke-width="6" stroke-linecap="round"/><path d="M-46 70Q-46 16 0 12Q46 16 46 70Z" fill="#3a3f4b" ${O}/>
      <path d="M-13 14L0 40 13 14Z" fill="${PAPER}" ${O}/><circle cy="-24" r="31" fill="#f6d2b4" ${O}/><path d="M-31-26Q-31-58 0-58Q31-58 31-26Q14-44-31-26Z" fill="#2e2420" ${O}/>
      <g fill="none" stroke="${NAVY}" stroke-width="3.5"><circle cx="-12" cy="-20" r="8"/><circle cx="12" cy="-20" r="8"/><path d="M-4-20H4M-6-3Q0 1 6-3"/></g>`,
    '✨': SPARK, '⭐': SPARK,
    '🚽': `<rect x="-44" y="-52" width="88" height="104" rx="4" fill="#8fa3b5" ${O}/><text y="2" font-size="42" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="${PAPER}" font-family="sans-serif">WC</text>`,
    '💢': `<path d="M-14-46Q-14-14-46-14M14-46Q14-14 46-14M-14 46Q-14 14-46 14M14 46Q14 14 46 14" fill="none" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>`,
  };

  let renderer, scene, camera, canvas, audio, ui, raf = 0, stage, objs = {}, titleObj;
  let sceneIdx = -1, cueIdx = -1, lastT = 0, timeline = [], tlPos = 0, clock = 0, prevNow = 0, amp = 0, failed = false;
  const chars = {}, bgKids = [];
  const low = (navigator.hardwareConcurrency || 8) <= 4 || Math.min(screen.width, screen.height) < 820;   // 저사양: 그림자 해상도·배경 학생 외곽선·픽셀 비율을 줄인다
  const cam = { pos: new T.Vector3(), look: new T.Vector3(), tpos: new T.Vector3(), tlook: new T.Vector3(), shot: '' };

  /* ───────── 기본 도구 ───────── */
  const mats = {};
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: .82, metalness: 0, ...o })); };
  // 사람·마스코트용 만화 음영(3단계 명암). 교실은 위의 mat 그대로
  let grad, olMat, toon = false, olOn = false;   // toon·olOn 은 makeKid·makeMascot 안에서만 켠다
  function toonMat(c, o = {}) {
    const k = 'toon' + c + JSON.stringify(o);
    if (mats[k]) return mats[k];
    if (!grad) {
      grad = new T.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1);
      grad.minFilter = grad.magFilter = T.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
    }
    const { roughness, metalness, flatShading, ...r } = o;   // 툰 재질에 없는 키는 빼야 three 경고가 안 난다
    return mats[k] = new T.MeshToonMaterial({ color: c, gradientMap: grad, ...r });
  }
  function outline(m, geo) {   // 뒤집은 껍질 외곽선: 같은 모양을 법선 방향으로 살짝 부풀려 뒷면만 그린다
    if (!olMat) {
      olMat = new T.MeshBasicMaterial({ color: LINE, side: T.BackSide });
      olMat.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normal * 0.011;'); };
    }
    const h = new T.Mesh(geo, olMat);
    h.castShadow = false; m.add(h);
  }
  function add(parent, geo, color, pos, o = {}) {
    const m = new T.Mesh(geo, typeof color === 'string' ? (toon ? toonMat : mat)(color, o.mat) : color);
    if (pos) m.position.set(...pos);
    if (o.rot) m.rotation.set(...o.rot);
    if (o.scale) m.scale.set(...o.scale);
    m.castShadow = o.cast !== false; m.receiveShadow = !!o.receive;
    if (o.ol && olOn) outline(m, o.ol.isBufferGeometry ? o.ol : geo);
    parent.add(m);
    return m;
  }
  const grp = (parent, pos) => { const g = new T.Group(); if (pos) g.position.set(...pos); parent.add(g); return g; };
  const box = (w, h, d) => new T.BoxGeometry(w, h, d), sph = (r, a = 24, b = 16) => new T.SphereGeometry(r, a, b);
  const cyl = (a, b, h, n = 20, open = false) => new T.CylinderGeometry(a, b, h, n, 1, open), cap = (r, l) => new T.CapsuleGeometry(r, l, 6, 14);

  const imgs = {};
  function svgImg(key, inner, vb, redraw, w = 320, h = 320) {   // SVG 조각을 그림으로. 아직 안 불러졌으면 null 을 주고, 불러지면 redraw 를 부른다
    let e = imgs[key];
    if (!e) {
      e = imgs[key] = { img: new Image(), ok: false, cbs: [] };
      e.img.onload = () => { e.ok = true; e.cbs.splice(0).forEach(f => f()); };
      e.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`);
    }
    if (!e.ok && redraw) e.cbs.push(redraw);
    return e.ok ? e.img : null;
  }
  const propImg = (k, redraw) => svgImg('p:' + k, ICON[k] || K.prop(k), '-75 -75 150 150', redraw);
  const markImg = (m, redraw) => svgImg('m:' + m, K.mark(m), '-50 -50 100 100', redraw);

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d'), tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const redraw = () => { ctx.clearRect(0, 0, w, h); draw(ctx, redraw); tex.needsUpdate = true; };
    tex.redraw = redraw;
    redraw();
    return tex;
  }
  const plane = (tex, w, h) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const textTex = (str, size, fill, sticker) => {
    const w = Math.ceil([...str].length * size * 1.08 + size * 1.4), h = Math.ceil(size * 1.8);
    const tex = canvasTex(w * 2, h * 2, ctx => {
      ctx.scale(2, 2);
      if (sticker) { ctx.fillStyle = sticker; rr(ctx, 2, 2, w - 4, h - 4, 4); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.font = `900 ${size}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fill;
      ctx.fillText(str, w / 2, h / 2 + size * .04);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    return { tex, w, h };
  };
  // 칠판 카드(잘라 붙인 시험지 조각 + 빨간 자석): 넓으면 그림 왼쪽+글 오른쪽, 좁으면 그림 위+글 아래
  function cardTex(w, h, k, label, fs) {
    const lines = label.split('\n'), wide = w >= 260;
    return canvasTex(w * 2, h * 2, (ctx, redraw) => {
      ctx.scale(2, 2);
      ctx.fillStyle = PAPER; rr(ctx, 1, 1, w - 2, h - 2, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(42,37,34,.85)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#cfc5ad'; ctx.fillRect(h * .12, h * (wide ? .88 : .95), w - h * .24, 1);   // 괘선
      const im = propImg(k, redraw), is = wide ? h * .8 : h * .52;
      if (im) ctx.drawImage(im, wide ? h * .47 - is / 2 : w / 2 - is / 2, wide ? h / 2 - is / 2 : h * .08, is, is);
      const mr = h * .07, mx = h * .13, my = h * .13;   // 자석
      ctx.fillStyle = 'rgba(42,37,34,.25)'; ctx.beginPath(); ctx.arc(mx + 1.5, my + 2, mr, 0, 7); ctx.fill();
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(mx - mr * .3, my - mr * .38, mr * .38, mr * .22, -.5, 0, 7); ctx.fill();
      ctx.font = `800 ${fs}px ${TFONT}`; ctx.fillStyle = NAVY; ctx.textBaseline = 'middle'; ctx.textAlign = wide ? 'left' : 'center';
      lines.forEach((l, i) => wide
        ? ctx.fillText(l, h * .88, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.25)
        : ctx.fillText(l, w / 2, h * .66 + (i + (2 - lines.length) / 2) * fs * 1.2 + fs * .1));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }

  /* ───────── 장면 속 물체(칠판 카드·소품) ───────── */
  function reg(id, node, o = {}) {
    node.visible = o.vis !== false;
    stage.add(node);
    return objs[id] = { node, s0: node.scale.clone(), p0: node.position.clone(), vis0: node.visible, cmd: null, t0: 0, ...o };
  }
  function updObj(o, t) {
    const n = o.node, u = t - o.t0;
    if (o.billboard) n.quaternion.copy(camera.quaternion);
    if (!o.cmd) return;
    if (o.cmd === 'pop') {
      n.visible = true;
      n.scale.copy(o.s0).multiplyScalar(Math.max(.001, easeBack(clamp(u / .45))));
      if (o.mark) {
        const m = clamp((u - .6) / .3);
        o.mark.visible = u > .6;
        o.mark.scale.setScalar(2.8 - 1.8 * easeOut(m)); o.mark.rotation.z = -.5 * (1 - m); o.mark.material.opacity = m;
      }
    } else if (o.cmd === 'stamp') {
      const m = clamp(u / .3);
      n.visible = true; n.scale.copy(o.s0).multiplyScalar(2.8 - 1.8 * easeOut(m)); n.material.opacity = m;
      if (!o.billboard) n.rotation.z = -.5 * (1 - m);
    } else if (o.cmd === 'fly') {
      const k = clamp(u / .8), e = k * k * (3 - 2 * k);
      n.visible = k < 1;
      n.position.lerpVectors(o.p0, o.to, e); n.position.y += Math.sin(Math.PI * k) * .55;
      n.rotation.set(k * 5, k * 3, 0); n.scale.copy(o.s0).multiplyScalar(1 - .4 * k);
    } else if (o.cmd === 'ring') n.rotation.z = u < 2.6 ? Math.sin(u * 17) * .42 * (1 - u / 2.6) : 0;
    else if (o.cmd === 'pulse') { n.visible = true; n.material.opacity = .35 + .65 * Math.abs(Math.sin(u * 4.5)); }
    else if (o.cmd === 'draw') { n.visible = true; n.scale.x = o.s0.x * Math.max(.001, clamp(u / .4)); n.position.x = o.p0.x - o.len / 2 * (1 - clamp(u / .4)); }
    else if (o.cmd === 'on') n.visible = true;
    else if (o.cmd === 'hide') n.visible = false;
    else if (o.cmd === 'confetti') {
      n.visible = true;
      n.children.forEach((c, i) => {
        const s = i * 12.9898, life = (u * (.7 + (i % 5) * .08) + (i * .37) % 3.4) % 3.4;
        c.position.set(-2.6 + (i * 97 % 640) / 100, 3.1 - life, -2.6 + (i * 53 % 380) / 100);
        c.rotation.set(u * 3 + s, u * 2.2 + s, s);
      });
    }
  }
  const api = {
    tiles(list, cols, box, fs) {
      list.forEach(([k, label, m], i) => {
        const [cx, cy, w, h] = K.cell(i, cols, box);
        const node = plane(cardTex(Math.round(w), Math.round(h), k, label, fs || (w >= 260 ? Math.min(30, h * .24) : 23)), w * PX, h * PX);
        node.position.copy(b2w(cx, cy, .025 + i * .0004)); node.rotation.z = ((i * 37) % 7 - 3) * .004;   // 손으로 붙인 듯 살짝 기울임
        const o = reg('t' + i, node, { vis: false });
        if (m) {
          o.mark = plane(canvasTex(128, 128, (ctx, rd) => { const im = markImg(m, rd); if (im) ctx.drawImage(im, 0, 0, 128, 128); }), 54 * PX, 54 * PX);
          o.mark.position.set(w * PX / 2 - 26 * PX, h * PX / 2 - 24 * PX, .012); o.mark.visible = false;
          node.add(o.mark);
        }
      });
    },
    text(id, str, size, sx, sy, fill, sticker, vis = false) {
      const { tex, w, h } = textTex(str, size, fill, sticker), node = plane(tex, w * PX, h * PX);
      node.position.copy(b2w(sx, sy, .03));
      return reg(id, node, { vis });
    },
    svg(id, inner, vb, sx, sy, w, h, vis = true, dz = .015) {   // (sx,sy) = 가운데
      const node = plane(canvasTex(w * 2, h * 2, (ctx, rd) => { const im = svgImg(id + inner.length, inner, vb, rd, w * 2, h * 2); if (im) ctx.drawImage(im, 0, 0, w * 2, h * 2); }), w * PX, h * PX);
      node.position.copy(b2w(sx, sy, dz));
      return reg(id, node, { vis });
    },
    sprite(id, k, pos, size, vis = true, o = {}) {   // 늘 카메라를 보는 그림
      const node = plane(canvasTex(256, 256, (ctx, rd) => { const im = propImg(k, rd); if (im) ctx.drawImage(im, 0, 0, 256, 256); }), size, size);
      node.position.set(...pos);
      return reg(id, node, { vis, billboard: true, ...o });
    },
    hud(id, k, label, m, pos) {   // 학생들 머리 위에 뜨는 카드
      const w = 520, h = 110, S = .0034, node = plane(cardTex(w, h, k, label, 29), w * S, h * S);
      node.position.set(...pos);
      const o = reg(id, node, { vis: false, billboard: true });
      o.mark = plane(canvasTex(128, 128, (ctx, rd) => { const im = markImg(m, rd); if (im) ctx.drawImage(im, 0, 0, 128, 128); }), .26, .26);
      o.mark.position.set(w * S / 2 - .1, h * S / 2 - .06, .01); o.mark.visible = false;
      node.add(o.mark);
      return o;
    },
    model: (id, node, pos, vis = true, o = {}) => { node.position.set(...pos); return reg(id, node, { vis, ...o }); },
  };

  /* ───────── 3D 소품 ───────── */
  function phoneModel() {
    const g = new T.Group();
    add(g, box(.085, .16, .014), '#3a3f4b', null, { mat: { roughness: .4 } });
    add(g, box(.072, .135, .004), '#9fc6c9', [0, 0, .009], { mat: { emissive: '#9fc6c9', emissiveIntensity: .45, roughness: .2 }, cast: false });
    return g;
  }
  function basketModel() {
    const g = new T.Group();
    add(g, cyl(.26, .19, .26, 24, true), '#c8894a', [0, .13, 0], { mat: { side: T.DoubleSide } });
    add(g, cyl(.19, .19, .02), '#a9713a', [0, .01, 0]);
    add(g, new T.TorusGeometry(.26, .022, 10, 28), '#a9713a', [0, .26, 0], { rot: [Math.PI / 2, 0, 0] });
    add(g, new T.TorusGeometry(.24, .016, 8, 24, Math.PI), '#a9713a', [0, .26, 0]);
    const { tex, w, h } = textTex('제출함', 60, RED, PAPER);
    const sign = plane(tex, w * .002, h * .002);
    sign.position.set(0, .62, 0); sign.rotation.y = Math.PI;
    g.add(sign);
    return g;
  }
  function bagModel() {
    const g = new T.Group();
    add(g, cap(.2, .2), '#34507a', [0, .3, 0], { scale: [1.15, 1, .72] });
    add(g, box(.3, .17, .08), '#2a4266', [0, .19, -.13]);
    add(g, box(.22, .03, .02), '#b9bcc2', [0, .42, -.145], { mat: { metalness: .5, roughness: .4 } });
    add(g, new T.TorusGeometry(.07, .018, 8, 18, Math.PI), '#2a2f3a', [0, .58, 0]);
    return g;
  }
  const bookModel = c => { const g = new T.Group(); add(g, box(.2, .04, .27), c); add(g, box(.19, .03, .26), PAPER, [.008, 0, 0]); return g; };
  function bellModel() {
    const g = new T.Group(), pts = [[.0, .0], [.06, -.02], [.1, -.1], [.12, -.2], [.17, -.27], [.2, -.3]].map(p => new T.Vector2(...p));
    add(g, new T.LatheGeometry(pts, 24), '#f5b301', null, { mat: { metalness: .4, roughness: .35, side: T.DoubleSide } });
    add(g, sph(.035), '#a16207', [0, -.31, 0]);
    add(g, box(.04, .08, .04), '#854d0e', [0, .03, 0]);
    return g;
  }

  /* ───────── 캐릭터 ───────── */
  const P0 = { pSx: -.45, pSz: -.1, pEx: -1.35, pWx: 0, nSx: -.45, nSz: -.1, nEx: -1.35, nWx: 0, bYaw: 0, bLean: 0, bRoll: 0, plX: 0, plYaw: 0, slump: 0, tense: 0,
    kneeL: 0, kneeR: 0, hYaw: 0, hPitch: 0, hRoll: 0, eX: 0, eY: 0, eOpen: 1, curve: 1, mO: 0, brow: 0, browL: 0 };
  const REST = { pSx: -.45, pSz: -.1, pEx: -1.35, pWx: 0, nSx: -.45, nSz: -.1, nEx: -1.35, nWx: 0 };
  const LOOK0 = { hYaw: 0, hPitch: 0, hRoll: 0, eX: 0, eY: 0, bRoll: 0, bYaw: 0, bLean: 0, plX: 0 };
  // 채널별 스프링 [세기, 감쇠]: 눈은 빠르게, 몸은 묵직하게
  const SPR = {};
  [['eX eY', 400, 40], ['eOpen curve mO brow browL', 160, 22], ['hPitch hYaw hRoll', 90, 17], ['pSx pSz pEx pWx nSx nSz nEx nWx', 70, 15],
    ['bLean bYaw bRoll plX plYaw slump tense', 35, 11], ['kneeL kneeR', 50, 13]].forEach(([ks, k, d]) => ks.split(' ').forEach(c => SPR[c] = [k, d]));
  // 상태 이름 → 목표 자세. n = 옆자리 방향(+1/-1)
  const TOK = {
    'arm-rest': () => ({ ...REST, pSz: -.05, nWx: .2 }),
    'arm-up': () => ({ ...REST, pSx: -2.9, pSz: .5, pEx: -.15 }),
    'arm-down': () => ({ pSx: .12, pSz: .1, pEx: -.2, pWx: 0, nSx: .12, nSz: .1, nEx: -.2, nWx: 0 }),
    'arm-palm': () => ({ ...REST, nSx: -1.25, nSz: -.5, nEx: -1.95, nWx: -.6 }),
    'arm-slip': () => ({ ...REST, nSx: .1, nSz: 0, nEx: -1.05 }),
    'arm-hold': () => ({ ...REST, pSx: -1.8, pSz: .3, pEx: -.95 }),   // 휴대전화가 phoneFly 출발점(-.72,1.33,-.3)에 오도록
    'arm-cheer': () => ({ pSx: -2.8, pSz: .5, pEx: -.25, pWx: 0, nSx: -2.8, nSz: .5, nEx: -.25, nWx: 0 }),
    'face-smile': () => ({ curve: 1, mO: 0, brow: 0, browL: 0, eOpen: 1, slump: 0, tense: 0 }),
    'face-sad': () => ({ curve: -.8, mO: 0, brow: -.3, browL: 0, eOpen: 1, slump: .8, tense: 0 }),
    'face-sweat': () => ({ curve: -.6, mO: 0, brow: -.35, browL: .01, eOpen: 1, slump: .4, tense: 0 }),
    'face-o': () => ({ curve: .1, mO: .75, brow: 0, browL: .015, eOpen: 1.1, slump: 0, tense: 0 }),
    'face-shock': () => ({ curve: .1, mO: 1, brow: -.1, browL: .03, eOpen: 1.25, slump: 0, tense: 0 }),
    'face-sly': () => ({ curve: .7, mO: 0, brow: .3, browL: -.005, eOpen: .62, slump: 0, tense: 0 }),
    'face-angry': () => ({ curve: -.6, mO: 0, brow: .45, browL: -.01, eOpen: .85, slump: 0, tense: .7 }),
    'look-c': () => LOOK0,
    'look-u': () => ({ ...LOOK0, hPitch: -.2, eY: .6, bLean: -.04 }),
    'look-d': () => ({ ...LOOK0, hPitch: .42, eY: -.5, bLean: .12 }),
    'look-n': n => ({ ...LOOK0, hYaw: n * .62, eX: n * .8, bYaw: n * .12 }),
    'look-palm': () => ({ ...LOOK0, hYaw: -.4, hPitch: .12, hRoll: -.06, eX: -.8 }),
    'peek': n => ({ ...LOOK0, hYaw: n * .78, hPitch: .22, eX: n, eY: -.4, bRoll: -n * .24, bYaw: n * .25, bLean: .05, plX: n * .05 }),
  };
  // 팔·표정 토큰이 시선 토큰과 같은 채널을 덮어쓰지 않도록 더해지는 몫
  const XA = { 'arm-up': { bRoll: -.06, hPitch: -.08 }, 'arm-down': { bLean: -.05 }, 'arm-slip': { bLean: .18 }, 'face-o': { hPitch: -.05 }, 'face-sly': { hRoll: .08 } };
  const M_REST = { pSx: 0, pSz: .45, pEx: -.5, nSx: 0, nSz: .45, nEx: -.5 };
  const TOK_M = { ...TOK,
    'arm-rest': () => M_REST,
    'arm-point': () => ({ ...M_REST, pSx: .25, pSz: 2.15, pEx: -.15 }),
    'arm-wave': () => ({ ...M_REST, pSx: -.2, pSz: 2.5, pEx: -.7 }),
    'arm-cheer': () => ({ pSx: 0, pSz: 2.5, pEx: -.3, nSx: 0, nSz: 2.5, nEx: -.3 }),
  };
  // 1회 동작: [시각(s), 더할 값] 키프레임, 사이는 부드럽게
  const CLIPS = {
    up: [[0], [.12, { pSx: .15 }], [.45]],
    down: [[0], [.12, { nWx: -.3 }], [.35]],
    shock: [[0], [.12, { bLean: -.15, hPitch: -.12, pSx: .1, nSx: .1 }], [.6]],
    point: [[0], [.075, { pSz: .12 }], [.15], [.225, { pSz: .12 }], [.3]],
    ges: [[0], [.16, { pSx: -.3, pEx: .3 }], [.4]],
  };
  const TAU = Math.PI * 2, tmpV = new T.Vector3();
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const win = (p, a, b, e) => sstep(a, a + e, p) * (1 - sstep(b - e, b, p));   // a~b 구간에서 1, 가장자리 e 초 동안 부드럽게
  const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
  function clipAdd(o, name, u) {   // 끝났으면 false
    const K = CLIPS[name];
    for (let i = 1; i < K.length; i++) if (u < K[i][0]) {
      const a = K[i - 1], b = K[i], e = sstep(a[0], b[0], u);
      for (const k in a[1]) o[k] = (o[k] || 0) + a[1][k] * (1 - e);
      for (const k in b[1]) o[k] = (o[k] || 0) + b[1][k] * e;
      return true;
    }
    return false;
  }
  const freeze = (root, live) => root.traverse(x => { if (x.isMesh && !live.includes(x)) { x.updateMatrix(); x.matrixAutoUpdate = false; } });   // 관절(그룹)만 움직이니 나머지 메시 행렬은 한 번만
  const rigBase = () => ({ vel: {}, os: {}, flags: new Set(), clips: [], fw: { writing: 0, wiggle: 0, flip: 0, cheer: 0, wave: 0 }, armAt: 0, faceAt: 0, lookAt: 0, look: 'look-c', root: new T.Group() });

  function face(head, y, z, s, rig, flat) {   // 눈·눈썹·볼·입
    rig.eyes = []; rig.pupils = []; rig.brows = [];
    for (const sx of [1, -1]) {
      const e = grp(head, [sx * .085 * s, y, z]);
      add(e, sph(.047 * s), '#ffffff', null, { scale: [1, 1.15, .32], cast: false });
      const p = grp(e, [0, 0, .013 * s]);
      add(p, sph(.025 * s, 16, 12), INK, null, { scale: [1, 1.1, .4], cast: false });
      add(p, sph(.008 * s, 8, 8), '#ffffff', [.008 * s, .01 * s, .01 * s], { cast: false });
      rig.eyes.push(e); rig.pupils.push(p);
      rig.brows.push(add(head, box(.075 * s, .014 * s, .012), INK, [sx * .085 * s, y + .07 * s, z + .008], { cast: false }));
      const ch = add(head, new T.CircleGeometry(.036 * s, 20), new T.MeshBasicMaterial({ color: '#e0707a', transparent: true, opacity: .25 }),
        [sx * .155 * s, y - .075 * s, flat ? z + .003 : z - .028 * s], { rot: [0, flat ? 0 : sx * .6, 0], cast: false });
      ch.renderOrder = 2;
    }
    rig.mouth = grp(head, [0, y - .115 * s, z + .012]);
    rig.smile = add(rig.mouth, new T.TorusGeometry(.04 * s, .0075 * s, 8, 20, Math.PI), INK, null, { rot: [0, 0, Math.PI], cast: false });
    rig.open = add(rig.mouth, new T.CircleGeometry(.036 * s, 24), new T.MeshBasicMaterial({ color: '#7a2e2e' }), [0, -.012 * s, .002], { cast: false });
  }
  function arm(body, sx, y, x, r, l1, l2, sleeve, skin, hand, ol) {   // 어깨 → 팔꿈치 → 손목
    const sh = grp(body, [sx * x, y, 0]);
    add(sh, cap(r, l1 - r * 1.2), sleeve, [0, -l1 / 2, 0], { ol });
    const el = grp(sh, [0, -l1, 0]);
    add(el, cap(r * .9, l2 - r * 1.2), skin, [0, -l2 / 2, 0], { ol });
    const wr = grp(el, [0, -l2, 0]);
    const h = add(wr, sph(hand), skin === INK ? '#ffffff' : skin, [0, -hand * .3, 0], { ol });
    return { sh, el, wr, hand: h };
  }
  function bubbleNode() {
    const st = { text: '' };
    const tex = canvasTex(256, 224, (ctx, rd) => {
      ctx.fillStyle = PAPER; ctx.strokeStyle = LINE; ctx.lineWidth = 6;
      rr(ctx, 8, 8, 240, 160, 14); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(70, 164); ctx.lineTo(48, 214); ctx.lineTo(116, 164); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(70, 166); ctx.lineTo(48, 214); ctx.lineTo(116, 166); ctx.stroke();
      const ic = ICON[st.text], im = ic && svgImg('i:' + st.text, ic, '-75 -75 150 150', rd);
      if (ic) { if (im) ctx.drawImage(im, 68, 32, 120, 120); return; }
      ctx.font = `700 ${[...st.text].length > 2 ? 48 : 96}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = NAVY;
      ctx.fillText(st.text, 128, 92);
    });
    const n = plane(tex, .46, .4);
    n.renderOrder = 5; n.material.depthTest = false;
    n.userData = { st, tex };
    return n;
  }
  function makeKid({ hair, shirt, style = 'short', nb = 0, seed = 0, skin = SKIN, tie = true, ol = true }) {
    const rig = { kind: 'kid', tok: TOK, nb, seed, cur: { ...P0 }, tgt: { ...P0 }, blinkAt: 1 + seed, ...rigBase() };
    toon = true; olOn = ol;
    const root = rig.root, wood = '#b07f53', metal = '#6b6f78', mo = { metalness: .35, roughness: .5 };
    const sk = { roughness: .7 }, hm = { roughness: .55, side: T.DoubleSide }, cloth = { roughness: .9 };
    add(root, box(.42, .04, .42), wood, [0, .44, -.03], { receive: true });
    add(root, box(.42, .3, .03), wood, [0, .76, -.25]);
    for (const [x, z] of [[-.19, -.22], [.19, -.22], [-.19, .16], [.19, .16]]) add(root, cyl(.015, .015, .44, 8), metal, [x, .22, z], { mat: mo });
    for (const sx of [-.19, .19]) add(root, cyl(.013, .013, .36, 8), metal, [sx, .66, -.24], { mat: mo });
    rig.legs = [1, -1].map(sx => {   // 다리: 허벅지 → 무릎 → 발목. root 에 붙여서 몸을 숙여도 엉덩이가 의자에서 뜨지 않는다
      const th = grp(root, [sx * .1, .5, -.01]); th.rotation.x = -Math.PI / 2;
      add(th, cap(.072, .2), '#2a2f3a', [0, -.17, 0], { mat: cloth, ol: true });
      const kn = grp(th, [0, -.34, 0]); kn.rotation.x = Math.PI / 2;
      add(kn, cap(.058, .26), '#2a2f3a', [0, -.2, 0], { mat: cloth, ol: true });
      add(grp(kn, [0, -.44, 0]), sph(.075), '#3a3f4b', [0, 0, .05], { scale: [1, .7, 1.5], mat: { roughness: .5 }, ol: true });
      return { th, kn };
    });
    // 책상(학생 앞쪽 = +z)
    const desk = rig.desk = grp(root, [0, 0, .52]);
    add(desk, box(.98, .04, .58), '#d7a86e', [0, .74, 0], { receive: true, mat: { roughness: .6 } });
    add(desk, box(1, .012, .6), '#a8733f', [0, .717, 0]);
    add(desk, box(.9, .03, .46), '#a8733f', [0, .6, .02]);
    for (const [x, z] of [[-.44, -.24], [.44, -.24], [-.44, .24], [.44, .24]]) add(desk, cyl(.017, .017, .74, 8), metal, [x, .37, z], { mat: mo });
    rig.paper = add(desk, box(.24, .004, .32), PAPER, [0, .764, -.04], { receive: true });
    // 몸: 엉덩이 → 허리 → 목 → 머리. 재킷 + 흰 깃 + 넥타이/리본
    const hips = rig.hips = grp(root, [0, .49, 0]), body = rig.spine = grp(hips, [0, .04, 0]);
    add(body, cap(.165, .24), shirt, [0, .23, 0], { scale: [1.12, 1, .85], mat: cloth, ol: true });
    add(body, new T.TorusGeometry(.075, .024, 8, 20), PAPER, [0, .475, .01], { rot: [Math.PI / 2, 0, 0], cast: false });
    add(body, new T.CircleGeometry(.075, 3), PAPER, [0, .41, .142], { rot: [-.25, 0, -Math.PI / 2], scale: [1.25, 1, 1], cast: false });
    if (tie) add(body, box(.036, .15, .012), '#b8322b', [0, .37, .15], { rot: [-.28, 0, 0], cast: false });
    else for (const sx of [1, -1]) add(body, box(.06, .03, .014), '#b8322b', [sx * .03, .45, .148], { rot: [-.3, 0, sx * .35], cast: false });
    const neck = rig.neck = grp(body, [0, .46, 0]);
    add(neck, cyl(.052, .052, .1, 12), skin, [0, .05, 0], { mat: sk });
    const head = rig.head = grp(neck, [0, .08, 0]);
    add(head, sph(.25, 32, 24), skin, [0, .22, 0], { scale: [1, .96, .95], mat: sk });
    for (const sx of [1, -1]) add(head, sph(.045, 12, 10), skin, [sx * .243, .2, 0], { mat: sk });
    const cut = new T.SphereGeometry(.264, 32, 20, 0, Math.PI * 2, 0, 1.72);
    add(head, cut, hair, [0, .225, 0], { rot: [-.52, 0, 0], mat: hm });
    add(head, sph(.13, 20, 12), hair, [0, .405, .15], { scale: [1.5, .42, .6], mat: hm });
    if (style === 'bob') add(head, new T.SphereGeometry(.275, 32, 20, Math.PI * .9, Math.PI * 1.2, 0, 2.25), hair, [0, .225, 0], { mat: hm });
    if (style === 'pony') { add(head, sph(.09), hair, [0, .34, -.27], { mat: hm }); add(head, cap(.06, .2), hair, [0, .16, -.33], { rot: [.35, 0, 0], mat: hm }); }
    if (style === 'twin') for (const sx of [1, -1]) add(head, sph(.1), hair, [sx * .27, .12, -.04], { scale: [1, 1.2, 1], mat: hm });
    if (style === 'curly') [[-.16, .42, 0], [0, .47, .02], [.16, .42, 0], [-.1, .44, -.14], [.1, .44, -.14], [0, .4, .16]].forEach(p => add(head, sph(.1, 16, 12), hair, p, { mat: hm }));
    // 외곽선: 머리·귀·앞머리·머리 덩어리(열린 머리카락 껍질은 제외)
    if (olOn) head.children.filter(m => !(m.geometry.parameters.thetaLength < Math.PI)).forEach(m => outline(m, m.geometry));
    face(head, .235, .222, 1, rig);
    rig.sweat = add(head, sph(.026, 16, 12), '#8fc3e0', [.19, .3, .17], { scale: [.8, 1.35, .7], cast: false, mat: { roughness: .2 } });
    rig.ear = add(head, sph(.035, 12, 10), PAPER, [-.262, .2, .01], { scale: [.7, 1, 1] });
    rig.arms = { p: arm(body, 1, .41, .2, .052, .22, .24, shirt, skin, .055, true), n: arm(body, -1, .41, .2, .052, .22, .24, shirt, skin, .055, true) };
    const wn = rig.arms.n.wr;
    rig.pen = add(wn, cyl(.009, .009, .16, 8), '#2b4fa8', [.02, .02, .06], { rot: [.9, 0, -.3] });
    rig.held = phoneModel(); rig.held.position.set(0, -.1, .03); rig.arms.p.wr.add(rig.held);
    rig.lap = phoneModel(); rig.lap.position.set(.03, -.06, .05); rig.lap.rotation.set(-1.2, 0, 0); wn.add(rig.lap);
    const scr = rig.lap.children[1]; scr.material = scr.material.clone(); rig.lapScr = scr.material;   // 깜빡이는 화면은 따로
    rig.note = add(wn, box(.11, .14, .004), '#f3e6b0', [.02, -.07, .05], { rot: [-1.0, 0, 0] });
    rig.palm = add(wn, new T.CircleGeometry(.04, 16), new T.MeshBasicMaterial({ color: '#2b4fa8' }), [.0, -.015, .057], { scale: [1, .25, 1], cast: false });
    rig.watch = add(rig.arms.n.el, cyl(.058, .058, .04, 16), '#3a3f4b', [0, -.17, 0], { mat: { emissive: '#9fc6c9', emissiveIntensity: .6 } });
    rig.bubble = bubbleNode(); rig.bubble.position.set(.44, 1.5, 0); root.add(rig.bubble);
    rig.stamp = plane(canvasTex(128, 128, (ctx, rd) => { const im = markImg('x', rd); if (im) ctx.drawImage(im, 0, 0, 128, 128); }), .26, .26);
    rig.stamp.position.set(-.36, 1.5, .2); rig.stamp.renderOrder = 6; rig.stamp.material.depthTest = false; root.add(rig.stamp);
    freeze(root, [rig.paper, rig.smile, rig.open, rig.bubble, rig.stamp, ...rig.brows]);
    toon = olOn = false;
    return rig;
  }
  function makeMascot() {
    const rig = { kind: 'mascot', tok: TOK_M, nb: 0, seed: 2.2, cur: { ...P0, ...M_REST }, tgt: { ...P0, ...M_REST }, blinkAt: 2, ...rigBase() };
    toon = olOn = true;
    const root = rig.root, hex = (a, b, h) => { const g = cyl(a, b, h, 6); g.rotateY(Math.PI / 6); return g; };
    const flat = g => { g = g.toNonIndexed(); g.computeVertexNormals(); return g; };   // 툰 재질엔 flatShading 이 없어서 면마다 법선을 따로 둔다
    for (const sx of [1, -1]) { add(root, cyl(.018, .018, .16, 8), NAVY, [sx * .09, .1, 0]); add(root, sph(.07), RED, [sx * .09, .04, .04], { scale: [1, .6, 1.5], mat: { roughness: .5 } }); }
    const body = rig.body = grp(root, [0, .16, 0]), ferrule = { metalness: .6, roughness: .35 };
    add(body, cyl(.19, .19, .12, 24), '#e58a8a', [0, .06, 0], { mat: { roughness: .9 }, ol: true });
    add(body, cyl(.205, .205, .08, 24), '#c0c4c8', [0, .16, 0], { mat: ferrule });
    for (const y of [.13, .19]) add(body, cyl(.209, .209, .012, 24), '#a7abb0', [0, y, 0], { mat: ferrule, cast: false });
    const hb = hex(.2, .2, .6), hw = hex(0, .2, .3);
    add(body, flat(hb), '#f2b42c', [0, .49, 0], { mat: { roughness: .5, flatShading: true }, ol: hb });
    add(body, flat(hex(.203, .203, .012)), '#d99a1c', [0, .79, 0], { mat: { roughness: .5, flatShading: true }, cast: false });
    add(body, flat(hw), '#e8c9a0', [0, .94, 0], { mat: { roughness: .85, flatShading: true }, ol: hw });
    add(body, flat(cyl(0, .068, .102, 6)), LINE, [0, 1.04, 0], { rot: [0, Math.PI / 6, 0], mat: { roughness: .6, flatShading: true } });
    rig.head = grp(body, [0, .3, 0]);
    face(rig.head, .32, .176, .85, rig, true);
    rig.sweat = new T.Group(); rig.ear = new T.Group();
    rig.arms = { p: arm(body, 1, .56, .19, .022, .2, .2, INK, INK, .045), n: arm(body, -1, .56, .19, .022, .2, .2, INK, INK, .045) };
    freeze(root, [rig.smile, rig.open, ...rig.brows]);
    toon = olOn = false;
    return rig;
  }
  // ago = 그 동작이 몇 초 전에 일어났어야 하는지(되감기·장면 중간 진입). 1회 동작·루프의 시작 시각을 그만큼 앞당긴다
  function setTokens(rig, str, ago = 0) {
    const now = clock - ago, wasW = rig.flags.has('writing'), clip = name => rig.clips.push({ name, t0: now });
    for (const tk of str.split(' ').filter(Boolean)) {
      if (tk.startsWith('bub:')) { const b = rig.bubble; if (!b) continue; rig.bub = tk.slice(4); if (rig.bub) { b.userData.st.text = rig.bub; b.userData.tex.redraw(); } continue; }
      if (tk[0] === '!') { rig.flags.delete(tk.slice(1)); continue; }
      const f = rig.tok[tk];
      if (f) {
        Object.assign(rig.tgt, f(rig.nb));
        if (tk.startsWith('face-')) {
          if (tk !== rig.face) rig.faceAt = now;
          rig.face = tk;
          if (tk === 'face-shock') clip('shock');
        }
        if (tk.startsWith('arm-')) {
          if (tk !== rig.armTok) { rig.armAt = now; if (tk === 'arm-up') clip('up'); if (tk === 'arm-down' && wasW) clip('down'); }
          if (tk === 'arm-point') clip('point');
          rig.armTok = tk;
        }
        if (tk.startsWith('look-') || tk === 'peek') { if (tk !== rig.look) rig.lookAt = now; rig.look = tk; }
      } else rig.flags.add(tk);
      if (tk === 'caught') rig.caughtAt = now;
      if (tk === 'jump') rig.jumpAt = now;
    }
  }
  function resetRig(rig, str) {
    rig.flags.clear(); rig.bub = ''; rig.face = 'face-smile'; rig.armTok = 'arm-rest'; rig.look = 'look-c';
    Object.assign(rig.tgt, P0, rig.tok['arm-rest']());
    setTokens(rig, str || '');
  }
  const goal = (rig, k) => rig.tgt[k] + ((XA[rig.armTok] || {})[k] || 0) + ((XA[rig.face] || {})[k] || 0);
  const snapRig = rig => {
    for (const k in rig.tgt) rig.cur[k] = goal(rig, k);
    for (const k in rig.fw) rig.fw[k] = rig.flags.has(k) ? 1 : 0;
    rig.vel = {}; rig.bubS = rig.bub ? 1 : 0; rig.snapO = true;
  };
  // 최종 자세 = 스프링(목표 자세) + 루프(시각) + 1회 동작
  function applyRig(rig, dt, talk, vt) {
    const c = rig.cur, f = rig.flags, t = clock, s = rig.seed, m = rig.kind === 'mascot', n = rig.nb, W = rig.fw;
    const steps = dt > 1 / 60 ? 2 : 1, h = dt / steps;
    for (let i = 0; i < steps; i++) for (const k in rig.tgt) {   // 스프링: 살짝 넘쳤다가 돌아오며 멈춘다
      const [K, D] = SPR[k], v = clamp((rig.vel[k] || 0) + ((goal(rig, k) - c[k]) * K - (rig.vel[k] || 0) * D) * h, -5, 5);   // 장면 전환의 긴 프레임에도 한 번에 튀지 않게 속도 상한
      rig.vel[k] = v; c[k] += v * h;
    }
    for (const k in W) W[k] += ((f.has(k) ? 1 : 0) - W[k]) * Math.min(1, dt * 8);   // 플래그 켜고 끌 때 튀지 않게
    const o = {}, ad = (k, x) => { o[k] = (o[k] || 0) + x; };
    rig.clips = rig.clips.filter(cl => clipAdd(o, cl.name, t - cl.t0));
    // 팔 토큰 루프
    const A = rig.armTok, at = t - rig.armAt;
    if (A === 'arm-up') ad('pWx', .15 * Math.sin(TAU * 2 * at) * clamp(1 - at / 1.2));
    else if (A === 'arm-palm') { const w = win(at % 2.4, 1.6, 2.0, .12); ad('nSx', .25 * w); ad('eY', .6 * w); }
    else if (A === 'arm-slip') { ad('hPitch', -.35 * win(at % 3, 2.4, 2.8, .1)); ad('nWx', .08 * Math.sin(TAU * 3 * t)); }
    else if (A === 'arm-hold') ad('pWx', .06 * Math.sin(TAU * 1.6 * t));
    else if (A === 'arm-cheer') { ad('pEx', .3 * Math.sin(TAU * 4 * t)); ad('nEx', -.3 * Math.sin(TAU * 4 * t)); }
    // 표정·시선 루프
    if (rig.face === 'face-sweat') ad('hYaw', .05 * Math.sin(TAU * 1.3 * t));
    if (rig.face === 'face-sly' && !m) {   // 3초마다 카메라 쪽으로 슬쩍 눈동자
      const w = win((t - rig.faceAt) % 3, 2.5, 2.8, .06);
      if (w) ad('eX', (Math.sign(rig.head.worldToLocal(tmpV.copy(camera.position)).x) * .7 - c.eX) * w);
    }
    if (rig.look === 'peek') ad('hYaw', -n * .6 * win((t - rig.lookAt) % 2.6 / 2.6, .7, .85, .03));   // 감독 쪽 흘끔
    // 플래그
    if (W.writing > .001) {   // 한 줄 1.6초: 손이 옆으로 가다 빠르게 돌아온다. 4줄마다 잠깐 쉼
      const x = t / 1.6 + s, L = Math.floor(x), u = x - L, rest = L % 4 === 3 && u < .25, j = rest ? 0 : W.writing;
      ad('nSz', W.writing * (rest ? -.1 : u < .88 ? -.1 + .2 * u : -.1 + .176 * (1 - (u - .88) / .12)));
      ad('nSx', j * .02 * Math.sin(TAU * 7 * t)); ad('nEx', j * .05 * Math.sin(TAU * 5.3 * t + s)); ad('hPitch', W.writing * .02 * Math.sin(TAU * x));
      if (rest) ad('nWx', -.15 * W.writing * win(u, 0, .25, .05));
    }
    if (W.wiggle > .001) { const w = W.wiggle; ad('plX', w * .03 * Math.sin(TAU * 4 * t)); ad('kneeL', w * .1 * Math.sin(TAU * 5 * t)); ad('kneeR', -w * .1 * Math.sin(TAU * 5 * t)); ad('bRoll', w * .05 * Math.sin(TAU * 4 * t + 1)); }
    if (W.flip > .001) { const ph = Math.sin(t * 5 + s); ad('nSx', W.flip * (-.75 - c.nSx + .15 * ph)); ad('nEx', W.flip * (-1.1 - c.nEx + .2 * ph)); }
    if (W.cheer > .001) { ad('kneeL', .15 * W.cheer); ad('kneeR', .15 * W.cheer); }
    if (f.has('has-phone')) { ad('nWx', .05 * Math.sin(TAU * 3 * t)); rig.lapScr.emissiveIntensity = .5 + .2 * Math.sin(TAU * 1.5 * t); }
    // 공통 대기: 시선 흔들림(재생 시각으로 정해져 되감아도 같다)·몸 흔들림·말할 때 고개
    const g = Math.floor(vt / 2.4);
    ad('eX', (hash(s, g) - .5) * .3); ad('eY', (hash(s + 7.1, g) - .5) * .3);
    ad('plYaw', .035 * Math.sin(TAU * t / 7 + s));
    ad('browL', talk * .012);
    if (!m) {
      ad('hPitch', -talk * .07 + Math.sin(t * 6.3 + s) * .03 * talk); ad('hYaw', Math.sin(t * 2.3 + s) * .06 * talk + Math.sin(t * .6 + s) * .03);
      ad('hRoll', Math.sin(t * .8 + s) * .03 + Math.sin(t * 4.1) * .04 * talk);
      if (talk > .35 && (rig.prevTalk || 0) <= .35 && t - (rig.gesAt ?? -9) > 1.2 && A === 'arm-rest' && !f.has('writing')) { rig.gesAt = t; rig.clips.push({ name: 'ges', t0: t }); }
      rig.prevTalk = talk;
    }
    // 루프·1회 동작 몫은 40ms 저역 통과: 토큰이 바뀌어 루프가 켜지고 꺼질 때 튀지 않게(되감기 직후엔 바로 맞춤)
    const os = rig.os, ke = rig.snapO ? 1 : 1 - Math.exp(-dt * 25);
    rig.snapO = false;
    for (const k in o) if (!(k in os)) os[k] = 0;
    for (const k in os) os[k] += ((o[k] || 0) - os[k]) * ke;
    const v = k => c[k] + (os[k] || 0);
    const ju = clamp((t - (rig.jumpAt ?? -9)) / 1.5), hop = ju < 1 ? Math.abs(Math.sin(ju * Math.PI * 3)) * .22 * (1 - ju * .5) : 0;
    const AR = rig.arms;
    if (m) {
      rig.root.position.y = hop + talk * .025 + Math.sin(t * 2 + s) * .008;
      rig.body.rotation.set(v('bLean') + v('hPitch') * .4 + talk * .04, v('bYaw') + v('hYaw') * .6 + Math.sin(t * 1.3) * .05, v('bRoll') + Math.sin(t * 1.7) * .03);
      rig.body.scale.y = 1 + Math.sin(t * 1.7 + s) * .012 - hop * .1;
      const wave = W.wave * Math.sin(t * 9) * .3, ges = talk * Math.sin(t * 5) * .18;
      AR.p.sh.rotation.set(v('pSx') + ges * .4, 0, v('pSz') + wave + ges);
      AR.p.el.rotation.x = v('pEx') - Math.abs(wave) * .3;
      AR.n.sh.rotation.set(v('nSx') - ges * .3, 0, -v('nSz') - ges * .6);
      AR.n.el.rotation.x = v('nEx');
    } else {
      rig.root.position.y = hop;
      rig.hips.position.set(v('plX'), .49 + W.cheer * Math.abs(Math.sin(t * 6.5 + s)) * .07, 0);
      rig.hips.rotation.y = v('plYaw') + .25 * v('bYaw');
      rig.spine.rotation.set(v('bLean') + .12 * v('slump') + .1 * v('tense') + .012 * Math.sin(TAU * t / 3.6 + s), .75 * v('bYaw'), v('bRoll'));
      const hp = v('hPitch'), hy = v('hYaw'), hr = v('hRoll'), sl = .06 * v('slump') + .08 * v('tense');
      rig.neck.rotation.set(.35 * hp, .35 * hy, .35 * hr); rig.head.rotation.set(.65 * hp, .65 * hy, .65 * hr);
      AR.p.sh.rotation.set(v('pSx'), 0, v('pSz') - sl); AR.p.el.rotation.x = v('pEx'); AR.p.wr.rotation.x = v('pWx');
      AR.n.sh.rotation.set(v('nSx'), 0, -(v('nSz') - sl)); AR.n.el.rotation.x = v('nEx'); AR.n.wr.rotation.x = v('nWx');
      [v('kneeL'), v('kneeR')].forEach((kv, i) => { rig.legs[i].th.rotation.x = -Math.PI / 2 - kv; rig.legs[i].kn.rotation.x = Math.PI / 2 + .6 * kv; });
    }
    // 눈 깜빡임(20%는 두 번)·눈동자·눈썹·입
    if (t > rig.blinkAt) { rig.lastBlink = rig.blinkAt; rig.dbl = hash(s, rig.blinkAt) < .2; rig.blinkAt = t + 2 + ((s * 7 + t * 13) % 3); }
    const sinceB = t - (rig.lastBlink ?? -9), shut = rig.blinkAt - t < .12 || (rig.dbl && sinceB > .1 && sinceB < .22);
    const eo = f.has('yawn') ? .12 : v('eOpen') * (shut ? .1 : 1);
    rig.eyes.forEach(e => e.scale.y = Math.max(.08, eo));
    rig.pupils.forEach(p => p.position.set(v('eX') * .014, v('eY') * .012, p.position.z));
    rig.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * v('brow'); b.position.y = b.userData.y0 + v('browL'); });
    const open = Math.max(c.mO, talk);
    rig.open.visible = open > .1; rig.smile.visible = !rig.open.visible;
    rig.open.scale.set(1 - .3 * c.mO + talk * .1, Math.max(.2, open), 1);
    rig.smile.scale.y = Math.abs(c.curve) < .08 ? .08 : c.curve;
    rig.sweat.visible = rig.face === 'face-sweat' || rig.face === 'face-shock';
    if (m) return;
    rig.paper.visible = !f.has('nopaper');
    rig.paper.rotation.x = f.has('flip') ? -.5 - Math.sin(t * 5 + s) * .45 : 0;
    rig.paper.position.y = .764 + (f.has('flip') ? .09 : 0);
    rig.pen.visible = rig.armTok === 'arm-rest' && !f.has('nopen');
    rig.held.visible = f.has('hold-phone'); rig.lap.visible = f.has('has-phone');
    rig.note.visible = rig.armTok === 'arm-slip' && !f.has('has-phone');
    rig.palm.visible = rig.armTok === 'arm-palm';
    rig.watch.visible = f.has('has-watch'); rig.ear.visible = f.has('has-ear');
    rig.bubS = (rig.bubS || 0) + ((rig.bub ? 1 : 0) - (rig.bubS || 0)) * Math.min(1, dt * 12);
    const front = cam.shot && SHOTS[cam.shot][0][2] < 0;   // 말풍선·도장은 학생 얼굴이 보이는 구도에서만
    rig.bubble.visible = front && rig.bubS > .02; rig.bubble.scale.setScalar(Math.max(.01, rig.bubS));
    rig.bubble.quaternion.copy(camera.quaternion).premultiply(rig.root.quaternion.clone().invert());
    const cu = clamp((t - (rig.caughtAt ?? -9)) / .3);
    rig.stamp.visible = front && f.has('caught');
    rig.stamp.scale.setScalar(2.6 - 1.6 * easeOut(cu)); rig.stamp.material.opacity = cu;
    rig.stamp.quaternion.copy(rig.bubble.quaternion);
  }

  /* ───────── 교실 ───────── */
  function buildRoom() {
    let seed = 7;
    const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;   // 고정 시드: 매번 같은 무늬
    const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(clamp(parseInt(hex.slice(i, i + 2), 16) * k, 0, 255)).toString(16).padStart(2, '0')).join('');
    // 바닥: 판재(판마다 밝기 ±6%, 틈 2px)
    const wood = canvasTex(1024, 1024, ctx => {
      ctx.fillStyle = '#8c6440'; ctx.fillRect(0, 0, 1024, 1024);
      for (let c = 0; c < 8; c++) {
        let y = rnd() * 1024;
        const end = y + 1024;
        while (y < end) {
          const len = 300 + rnd() * 400, col = shade('#c39062', .94 + rnd() * .12);
          for (const yy of [y, y - 1024]) {
            ctx.fillStyle = col; ctx.fillRect(c * 128 + 1, yy + 1, 126, Math.min(len, end - y) - 2);
            ctx.globalAlpha = .07; ctx.fillStyle = '#5a3d22';
            for (let g = 0; g < 4; g++) ctx.fillRect(c * 128 + 10 + ((g * 31 + c * 17) % 100), yy + 6, 1.5, Math.min(len, end - y) - 12);
            ctx.globalAlpha = 1;
          }
          y += len;
        }
      }
    });
    wood.wrapS = wood.wrapT = T.RepeatWrapping; wood.repeat.set(5, 4.5);
    add(scene, new T.PlaneGeometry(10, 9), new T.MeshStandardMaterial({ map: wood, roughness: .7 }), [.5, 0, 0], { rot: [-Math.PI / 2, 0, 0], receive: true, cast: false });
    // 벽: 위는 크림, 아래 0~0.9m 패널 + 몰딩
    const wall = '#ece4d3', side = '#e3d8c2', panel = '#c9b79a', mold = '#8a6a48';
    add(scene, new T.PlaneGeometry(10, 3.6), wall, [.5, 1.8, -4], { receive: true, cast: false });
    add(scene, new T.PlaneGeometry(10, 3.6), wall, [.5, 1.8, 4.4], { rot: [0, Math.PI, 0], receive: true, cast: false });
    add(scene, new T.PlaneGeometry(9, 3.6), side, [-4.4, 1.8, 0], { rot: [0, Math.PI / 2, 0], receive: true, cast: false });
    add(scene, new T.PlaneGeometry(9, 3.6), side, [5.4, 1.8, 0], { rot: [0, -Math.PI / 2, 0], receive: true, cast: false });
    for (const [x, z, w, d] of [[.5, -3.985, 10, .03], [.5, 4.385, 10, .03], [-4.385, .2, .03, 8.4], [5.385, .2, .03, 8.4]]) {
      add(scene, box(w, .9, d), panel, [x, .45, z], { receive: true, cast: false });
      add(scene, box(w + (d > w ? .02 : 0), .05, d + .03), mold, [x, .9, z], { cast: false });
      add(scene, box(w, .1, d + .02), mold, [x, .05, z], { cast: false });
    }
    // 창문 + 빛줄기
    const ray = canvasTex(4, 128, ctx => { const g = ctx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 128); });
    const rayMat = new T.MeshBasicMaterial({ color: '#fff6dc', map: ray, transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    for (const z of [-2.2, .2, 2.6]) {
      add(scene, box(.06, 1.5, 1.7), '#f7f3ea', [-4.38, 1.85, z]);
      add(scene, box(.02, 1.36, 1.56), '#cfe3e6', [-4.34, 1.85, z], { mat: { emissive: '#cfe3e6', emissiveIntensity: .6, roughness: .2 }, cast: false });
      add(scene, box(.03, 1.36, .05), '#f7f3ea', [-4.33, 1.85, z]); add(scene, box(.03, .05, 1.56), '#f7f3ea', [-4.33, 1.85, z]);
      add(scene, box(.16, .04, 1.78), '#f7f3ea', [-4.32, 1.08, z], { receive: true });
      const g = new T.BufferGeometry(), y0 = 2.45, dx = y0 * .9, dz = -y0 * .4;   // 해 방향(4.5,-5,-2)을 따라 바닥까지
      g.setAttribute('position', new T.Float32BufferAttribute([-4.32, y0, z - .75, -4.32, y0, z + .75, -4.32 + dx, .02, z + .75 + dz, -4.32 + dx, .02, z - .75 + dz], 3));
      g.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 2, 1, 0, 3, 2]);
      const m = new T.Mesh(g, rayMat); m.renderOrder = 3; scene.add(m);
    }
    add(scene, box(.12, .5, 1.3), '#d9d4c8', [-4.3, .5, .2], { mat: { metalness: .2, roughness: .5 } });   // 라디에이터
    // 칠판: 짙은 녹색 + 분필 얼룩, 알루미늄 틀
    const chalk = canvasTex(1024, 346, ctx => {
      ctx.fillStyle = '#24463b'; ctx.fillRect(0, 0, 1024, 346);
      for (let i = 0; i < 8; i++) {
        const x = rnd() * 1024, y = rnd() * 346, r = 80 + rnd() * 160, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    });
    add(scene, new T.PlaneGeometry(BOARD.w, 1.623), new T.MeshStandardMaterial({ map: chalk, roughness: 1 }), [BOARD.x, BOARD.y, BOARD.z], { receive: true, cast: false });
    const al = { metalness: .4, roughness: .45 }, fw = .07, bh = 1.623;
    add(scene, box(BOARD.w + .02, bh + .02, .03), '#3a3f4b', [BOARD.x, BOARD.y, BOARD.z - .02], { cast: false });
    for (const sy of [1, -1]) add(scene, box(BOARD.w + fw * 2, fw, .05), '#b8bcc0', [BOARD.x, BOARD.y + sy * (bh + fw) / 2, BOARD.z + .005], { mat: al });
    for (const sx of [1, -1]) add(scene, box(fw, bh, .05), '#b8bcc0', [BOARD.x + sx * (BOARD.w + fw) / 2, BOARD.y, BOARD.z + .005], { mat: al });
    add(scene, box(BOARD.w + .1, .03, .13), '#b8bcc0', [BOARD.x, BOARD.y - bh / 2 - .08, BOARD.z + .06], { mat: al });
    add(scene, box(BOARD.w + .1, .05, .015), '#a7abb0', [BOARD.x, BOARD.y - bh / 2 - .06, BOARD.z + .12], { mat: al });
    add(scene, cyl(.012, .012, .16, 8), '#f4f1e8', [2.3, BOARD.y - bh / 2 - .05, BOARD.z + .07], { rot: [0, 0, Math.PI / 2] });
    add(scene, cyl(.012, .012, .1, 8), '#f2d27a', [2.6, BOARD.y - bh / 2 - .05, BOARD.z + .07], { rot: [0, 0, Math.PI / 2] });
    const clockFace = (x, y, z, ry) => {
      const g = grp(scene, [x, y, z]); g.rotation.y = ry;
      add(g, cyl(.2, .2, .04, 32), '#3a3f4b', null, { rot: [Math.PI / 2, 0, 0] });
      add(g, cyl(.17, .17, .045, 32), PAPER, null, { rot: [Math.PI / 2, 0, 0] });
      add(g, box(.02, .12, .01), NAVY, [0, .06, .03]); add(g, box(.1, .02, .01), NAVY, [.05, 0, .03]);
    };
    clockFace(3.75, 2.75, -3.96, 0); clockFace(.5, 3.0, 4.36, Math.PI);
    // 교탁
    add(scene, box(1.1, .9, .55), '#a8733f', [3.9, .45, -3.0]); add(scene, box(1.2, .05, .65), '#d7a86e', [3.9, .92, -3.0], { receive: true, mat: { roughness: .6 } });
    // 뒤쪽 벽: 사물함·게시판
    for (let c = 0; c < 6; c++) for (let r = 0; r < 2; r++) {
      add(scene, box(.52, .56, .4), '#8fa3b5', [1.6 + c * .55, .3 + r * .59, 4.15], { receive: true, mat: { metalness: .15, roughness: .6 } });
      add(scene, box(.16, .025, .02), '#6e8295', [1.6 + c * .55, .44 + r * .59, 3.945], { mat: { metalness: .3, roughness: .5 } });
    }
    const bb = canvasTex(1024, 400, ctx => {
      ctx.fillStyle = mold; ctx.fillRect(0, 0, 1024, 400); ctx.fillStyle = '#b88b5c'; ctx.fillRect(22, 22, 980, 356);
      for (let i = 0; i < 1400; i++) { ctx.fillStyle = rnd() < .5 ? 'rgba(90,60,30,.18)' : 'rgba(255,235,200,.14)'; ctx.fillRect(22 + rnd() * 978, 22 + rnd() * 354, 2, 2); }
      ctx.font = `800 56px ${TFONT}`; ctx.fillStyle = NAVY; ctx.textAlign = 'center'; ctx.fillText('우리 반 게시판', 512, 92);
      [0, 1, 2, 3].forEach(i => {
        ctx.save(); ctx.translate(150 + i * 240, 245); ctx.rotate([-.05, .04, -.03, .05][i]);
        ctx.fillStyle = 'rgba(42,37,34,.2)'; ctx.fillRect(-84, -76, 176, 168);
        ctx.fillStyle = PAPER; ctx.fillRect(-90, -82, 176, 168);
        ctx.fillStyle = NAVY; ctx.fillRect(-66, -40, 110, 7); ctx.fillStyle = '#4e5770'; [0, 1, 2].forEach(l => ctx.fillRect(-66, -8 + l * 28, [128, 104, 120][(l + i) % 3], 4));
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(-2, -66, 11, 0, 7); ctx.fill();
        ctx.restore();
      });
    });
    const bbm = add(scene, new T.PlaneGeometry(2.6, 1.02), new T.MeshStandardMaterial({ map: bb, roughness: .9 }), [-1.6, 1.9, 4.38], { rot: [0, Math.PI, 0], cast: false });
    bbm.receiveShadow = true;
    // 조명: 하늘/땅 + 창문 쪽 주광(그림자) + 칠판 쪽 보조광
    scene.add(new T.HemisphereLight('#fff4e4', '#7d6146', .5));
    const sun = new T.DirectionalLight('#ffe6bf', 1.4);
    sun.position.set(-4, 5.5, 1.5); sun.target.position.set(.5, .5, -.5); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.setScalar(low ? 1024 : 2048); sun.shadow.bias = -.0004; sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 16 });
    scene.add(sun);
    const fill = new T.DirectionalLight('#d6e4ff', .3); fill.position.set(2, 3, -6); scene.add(fill);   // 칠판 쪽에서 학생 얼굴을 비춘다
  }
  function buildCast() {
    const kid = (id, o, x, z) => { const r = makeKid(o); r.root.position.set(x, 0, z); r.root.rotation.y = Math.PI; r.baseY = 0; scene.add(r.root); return r; };
    chars.jun = kid('jun', { hair: '#1d1a19', shirt: '#2c3a5c', skin: '#f6d2b4', style: 'short', nb: -1, seed: .3 }, -.4, 0);
    chars.sol = kid('sol', { hair: '#4a3426', shirt: '#5a3d3a', skin: '#f9dcc4', style: 'bob', tie: false, nb: 1, seed: 1.9 }, 1.4, 0);
    [['#2e2420', '#3d4f3a', '#e2b08a', 'curly', -1.8], ['#6b4a33', '#2f4b5e', '#eec3a1', 'pony', .5], ['#151820', '#7a5a3a', '#d9a27c', 'twin', 2.8]].forEach(([hair, shirt, skin, style, x], i) =>
      bgKids.push(kid('bg' + i, { hair, shirt, skin, style, tie: !i, nb: i ? -1 : 1, seed: 3 + i * 1.3, ol: !low }, x, 1.9)));
    chars.mascot = makeMascot();
    chars.mascot.root.position.set(-1.45, 0, -2.9); chars.mascot.root.rotation.y = .25;
    scene.add(chars.mascot.root);
    Object.values(chars).concat(bgKids).forEach(r => r.brows.forEach(b => b.userData.y0 = b.position.y));
  }

  /* ───────── 카메라 ───────── */
  const SHOTS = {   // [위치, 바라보는 곳]. z>0 은 교실 뒤에서 칠판 쪽, z<0 은 칠판 쪽에서 학생 쪽
    wide: [[.5, 3.0, 3.3], [.5, 1.2, -3.2]],
    board: [[.3, 2.1, 1.15], [.3, 1.7, -4]],
    host: [[-.7, 1.2, -.35], [-1.38, .78, -2.9]],
    kids: [[.5, 1.55, -3.3], [.5, 1.2, 0]],
    floor: [[.5, 1.75, -3.9], [.5, .6, -.6]],
    jun: [[-.4, 1.4, -2.3], [-.2, 1.05, 0]],
    sol: [[1.4, 1.4, -2.3], [1.2, 1.05, 0]],
  };
  function setShot(name, snap) {
    const s = SHOTS[name], cut = snap || !cam.shot || Math.sign(SHOTS[cam.shot][0][2]) !== Math.sign(s[0][2]);
    cam.shot = name; cam.tpos.set(...s[0]); cam.tlook.set(...s[1]);
    if (cut) { cam.pos.copy(cam.tpos); cam.look.copy(cam.tlook); }
  }

  /* ───────── 장면 정의 ───────── */
  const RIGHT = { x: 930, y: 160, w: 600, h: 290 }, TOP = { x: 330, y: 160, w: 1200, h: 136 };
  const omrSvg = `<rect x="1" y="1" width="558" height="282" rx="4" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>
    <rect x="1" y="1" width="558" height="54" fill="#f6dcd6"/><path d="M1 55H559" stroke="${RED}" stroke-width="2"/><text x="24" y="37" font-size="26" font-weight="800" fill="${RED}" font-family="sans-serif">OMR 답안지</text>
    ${[['학년', 2], ['반', 3], ['번호', 15], ['과목코드', '03']].map(([k, v], i) => `<text x="${28 + i * 132}" y="96" font-size="22" font-weight="700" fill="#4e5770" font-family="sans-serif">${k}</text>
      <rect x="${28 + i * 132}" y="106" width="104" height="44" rx="2" fill="${PAPER}" stroke="${RED}" stroke-width="2"/>
      <text x="${80 + i * 132}" y="137" font-size="28" font-weight="800" fill="${NAVY}" text-anchor="middle" font-family="sans-serif">${v}</text>`).join('')}
    ${[0, 1, 2].map(r => `<text x="34" y="${196 + r * 34}" font-size="22" font-weight="700" fill="#4e5770" font-family="sans-serif">${r + 1}</text>` +
      [0, 1, 2, 3, 4].map(c => `<ellipse cx="${90 + c * 50}" cy="${188 + r * 34}" rx="17" ry="11" fill="${(r === 0 && c === 2) || (r === 1 && c === 0) || (r === 2 && c === 3) ? '#16161a' : PAPER}" stroke="${RED}" stroke-width="2.5"/>`).join('')).join('')}`;
  const essaySvg = `<rect x="1" y="1" width="558" height="282" rx="4" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>
    <text x="28" y="48" font-size="26" font-weight="800" fill="${NAVY}" font-family="sans-serif">[논술형 1] 풀이 과정을 쓰시오.</text>
    ${[110, 170, 230].map(y => `<path d="M28 ${y}H532" stroke="#cfc5ad" stroke-width="2"/>`).join('')}
    <g font-size="34" font-weight="600" fill="#2b4fa8" font-style="italic" font-family="sans-serif"><text x="36" y="100">2x + 4 = 14 이므로</text><text x="36" y="160">x =</text><text x="104" y="160">10</text></g>`;
  const line = (id, sx, sy, len) => { const n = new T.Mesh(new T.PlaneGeometry(len * PX, 4.5 * PX), new T.MeshBasicMaterial({ color: '#2b4fa8' })); n.position.copy(b2w(sx + len / 2, sy, .03)); reg(id, n, { vis: false, len: len * PX }); };
  const DESK_Y = .79, FLOORP = [.5, 0, -1.05];

  const SC = {
    intro: { title: '', build(a) {
        a.text('bt', '시험 보는 날', 130, 930, 215, '#f4f1e8');
        a.text('bs', '이것만은 꼭!', 64, 930, 375, NAVY, '#f2b42c');
        a.svg('st1', ICON['✨'], '-75 -75 150 150', 420, 150, 90, 90, false); a.svg('st2', ICON['⭐'], '-75 -75 150 150', 1440, 380, 70, 70, false);
      },
      beats: [{ cam: 'host', acts: [['mascot', 'jump arm-wave wave'], ['bt', 'pop', .2]] },
        { cam: 'wide', acts: [['mascot', '!wave arm-point'], ['bs', 'pop', .3], ['st1', 'pop', .7], ['st2', 'pop', 1.1], ['jun', 'arm-up', 2.6], ['sol', 'arm-up', 2.8], ['bg', 'arm-up', 3]] }] },
    ban: { title: '가지고 있으면 안 돼요', build(a) {
        a.tiles([['phone', '휴대전화', 'x'], ['smartwatch', '스마트 워치', 'x'], ['headset', '무선 이어폰', 'x'], ['calc', '전자계산기', 'x'], ['edict', '전자사전', 'x'],
          ['camera', '디지털 카메라', 'x'], ['radio', '라디오', 'x'], ['recorder', '녹음기', 'x'], ['mp3', 'MP3 플레이어', 'x'], ['digiwatch', '전자시계', 'x']], 5);
        a.model('basket', basketModel(), FLOORP);
        const ph = a.model('phoneFly', phoneModel(), [-.72, 1.33, -.3], false);
        ph.to = new T.Vector3(.5, .3, -1.05);
      },
      beats: [{ cam: 'jun', acts: [['jun', 'arm-hold hold-phone look-c nopaper'], ['sol', 'look-n nopaper']] },
        { cam: 'floor', acts: [['jun', 'face-shock'], ['sol', 'face-o'], ['jun', '!hold-phone arm-rest nopen', 1.3], ['phoneFly', 'fly', 1.3], ['cam', 'board', 2.6], ['title', '휴대전화는 꺼도 안 돼! 제출!', 2.6], ['t0', 'pop', 2.9], ['mascot', 'arm-point', 2.6]] },
        { cam: 'board', acts: [['jun', 'face-sad look-c'], ['sol', 'face-smile look-c'], ['t1', 'pop', .3], ['t2', 'pop', 1.3], ['t3', 'pop', 2.3], ['t4', 'pop', 3.3], ['t5', 'pop', 4.2], ['t6', 'pop', 5], ['t7', 'pop', 5.8]] },
        { cam: 'board', acts: [['t8', 'pop', 1.1], ['t9', 'pop', 2.4], ['title', '전자 기기는 전부 금지!']] }] },
    ok: { title: '책상 위에 둘 수 있어요', build(a) {
        a.tiles([['pencil', '연필', 'o'], ['eraser', '지우개', 'o'], ['lead', '샤프심', 'o'], ['penBlack', '볼펜\n(흑색·청색)', 'o'],
          ['signpen', '컴퓨터용\n사인펜', 'o'], ['tape', '수정테이프', 'o'], ['analog', '아날로그\n시계', 'o']], 4);
      },
      beats: [{ cam: 'sol', acts: [['sol', 'arm-up face-o look-c'], ['jun', 'look-n']] },
        { cam: 'board', acts: [['sol', 'arm-rest face-smile'], ['jun', 'look-c'], ['mascot', 'arm-point'], ['t0', 'pop', .5], ['t1', 'pop', 1.3], ['t2', 'pop', 2.1], ['t3', 'pop', 3.3]] },
        { cam: 'board', acts: [['t4', 'pop', .2], ['t5', 'pop', 1.4]] },
        { cam: 'board', acts: [['t6', 'pop', .5]] }] },
    bag: { title: '나머지는 가방·사물함으로', init: { jun: 'nopaper nopen', sol: 'nopaper nopen' }, build(a) {
        a.tiles([['bag', '가방', null], ['locker', '사물함', null], ['lock', '지퍼\n잠그기', 'o'], ['drawer', '책상 서랍\n비우기', 'o']], 4);
        a.model('bigbag', bagModel(), FLOORP);
        [['bk1', '#3b82f6', -.62], ['bk2', '#f59e0b', -.2], ['bk3', '#22c55e', 1.4]].forEach(([id, c, x]) => { a.model(id, bookModel(c), [x, DESK_Y, -.5]).to = new T.Vector3(.5, .5, -1.05); });
        a.sprite('bl', 'lock', [.5, .42, -1.32], .3, false);
      },
      beats: [{ cam: 'floor', acts: [['jun', 'look-d'], ['sol', 'look-d'], ['bk1', 'fly', .5], ['bk2', 'fly', 1.1], ['bk3', 'fly', 1.7], ['cam', 'board', 2.5], ['mascot', 'arm-point', 2.5], ['t0', 'pop', 2.7], ['t1', 'pop', 3.2]] },
        { cam: 'floor', acts: [['bl', 'pop', .4], ['jun', 'look-c face-smile'], ['sol', 'look-c face-smile'], ['cam', 'board', 1.7], ['t2', 'pop', 1.9], ['t3', 'pop', 2.7]] }] },
    during: { title: '시작종이 울리기 전에는', build(a) {
        a.tiles([['pencil', '시작종 전에 문제 풀기·\n답 표시는 부정행위', 'x'], ['toilet', '화장실은\n쉬는 시간(15분)에', null], ['paper', '면수·인쇄 상태\n확인', null], ['ask', '질문은\n손 들기', null]], 2, undefined, 28);
      },
      beats: [{ cam: 'jun', acts: [['jun', 'writing look-d face-sly'], ['sol', 'arm-down look-c']] },
        { cam: 'jun', acts: [['jun', '!writing caught arm-down face-shock look-c'], ['sol', 'look-n face-o'], ['cam', 'board', 2.2], ['mascot', 'arm-point', 2.2], ['t0', 'pop', 2.5]] },
        { cam: 'board', acts: [['jun', '!caught face-sad'], ['sol', 'look-c face-smile']] },
        { cam: 'jun', acts: [['title', '시험 중에는'], ['jun', 'arm-rest wiggle face-sweat bub:🚽 look-c'], ['sol', 'arm-rest writing look-d'], ['bg', 'writing look-d']] },
        { cam: 'board', acts: [['jun', '!wiggle face-sad bub:'], ['t1', 'pop', .3]] },
        { cam: 'kids', acts: [['jun', 'face-smile look-d flip nopen'], ['sol', '!writing flip look-d nopen'], ['t2', 'pop', .3]] },
        { cam: 'sol', acts: [['jun', '!flip !nopen writing'], ['sol', '!flip !nopen arm-up look-c face-smile'], ['t3', 'pop', .3]] }] },
    bell: { title: '종료령이 울리면', init: { jun: 'writing look-d', sol: 'writing look-d', bg: 'writing look-d' }, build(a) {
        a.tiles([['hands', '필기구 내려놓고\n손은 책상 아래로', 'o'], ['pencil', '종이 울린 뒤에 쓰면\n부정행위', 'x'], ['stack', '답안지는 맨 뒷자리\n친구가 회수', null], ['hush', '선생님 퇴실까지\n조용히 제자리에', null]], 2, undefined, 28);
        a.model('bigbell', bellModel(), [-2.95, 2.95, -3.8]);
        objs.bigbell.node.scale.setScalar(1.5); objs.bigbell.s0.setScalar(1.5);
      },
      beats: [{ cam: 'wide', acts: [['bigbell', 'ring'], ['sol', '!writing arm-down look-c', .9], ['jun', '!writing arm-down look-c', 1.1], ['bg', '!writing arm-down look-c', 1.3], ['cam', 'kids', 2.3], ['t0', 'pop', 2.4]] },
        { cam: 'jun', acts: [['jun', 'arm-rest writing face-sly look-d'], ['sol', 'look-n face-o']] },
        { cam: 'jun', acts: [['jun', '!writing arm-down face-shock look-c caught'], ['cam', 'board', 2.2], ['mascot', 'arm-point', 2.2], ['t1', 'pop', 2.4]] },
        { cam: 'board', acts: [['jun', '!caught face-sad'], ['sol', 'look-c face-smile'], ['t2', 'pop', .3]] },
        { cam: 'kids', acts: [['jun', 'face-smile'], ['t3', 'pop', .3]] }] },
    omr: { title: '답안지 표기', init: { jun: 'writing look-d', sol: 'writing look-d', bg: 'writing look-d' }, build(a) {
        a.svg('omr', omrSvg, '0 0 560 284', 620, 306, 560, 284);
        a.svg('hl', `<rect x="14" y="66" width="532" height="96" rx="4" fill="none" stroke="#f2b42c" stroke-width="9"/>`, '0 0 560 284', 620, 306, 560, 284, false, .02);
        a.svg('ox', `<path d="M-20-15L20 15M20-15L-20 15" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M-20-15L20 15M20-15L-20 15" stroke="#2b4fa8" stroke-width="7" stroke-linecap="round"/>`, '-40 -40 80 80', 580, 420, 60, 60, false, .02);
        a.svg('oxm', K.mark('x'), '-50 -50 100 100', 660, 412, 70, 70, false, .03);
        a.tiles([['signpen', '컴퓨터용\n사인펜', 'o'], ['penRed', '빨간 펜\n예비 표시', 'x'], ['tape', '수정테이프\n(각자 준비)', 'o'], ['❌', '× 표시로\n고치기', 'x']], 2, RIGHT, 26);
      },
      beats: [{ cam: 'kids', acts: [['hl', 'pulse'], ['mascot', 'arm-point'], ['cam', 'board', 1.6]] },
        { cam: 'board', acts: [['hl', 'hide'], ['t0', 'pop', .3], ['t1', 'pop', 2.6]] },
        { cam: 'board', acts: [['t2', 'pop', .5]] },
        { cam: 'board', acts: [['ox', 'pop', .2], ['oxm', 'stamp', .9], ['t3', 'pop', 1.2]] }] },
    essay: { title: '논술형 답안', build(a) {
        a.svg('essay', essaySvg, '0 0 560 284', 620, 306, 560, 284);
        line('strike1', 438, 310, 56); line('strike2', 438, 320, 56);
        a.text('fix', '5', 34, 530, 314, '#2b4fa8');
        a.tiles([['penBlack', '흑색 볼펜', 'o'], ['penBlue', '청색 볼펜', 'o'], ['tape', '수정테이프\n사용 금지', 'x']], 2, RIGHT, 26);
      },
      beats: [{ cam: 'sol', acts: [['sol', 'arm-up face-o look-c'], ['jun', 'look-n']] },
        { cam: 'board', acts: [['sol', 'arm-rest face-smile'], ['jun', 'look-c'], ['mascot', 'arm-point'], ['t0', 'pop', .2], ['t1', 'pop', 1]] },
        { cam: 'board', acts: [['strike1', 'draw', .9], ['strike2', 'draw', 1.3], ['fix', 'pop', 1.9], ['t2', 'pop', 3]] }] },
    cheat: { title: '이런 행동은 부정행위!', build(a) {
        const L = [['👀', '답안지 보기\n보여주기'], ['👉', '손짓·소리로\n신호 보내기'], ['cheatnote', '컨닝 페이퍼\n무선기기'], ['✋', '손바닥·책상에\n적어 놓기'], ['😠', '답 보여 달라\n강요·위협'],
          ['pencil', '시작종 전에\n문제 풀기'], ['bell', '종료령 뒤에도\n계속 쓰기'], ['🔄', '자리·답안지\n바꾸기'], ['phone', '금지 물품\n제출 안 하기'], ['🧑‍🏫', '감독 선생님이\n판단한 행동']];
        a.tiles(L.map(l => [...l, 'x']), 5);
        L.slice(0, 9).forEach(([k, label], i) => a.hud('h' + i, k, label.replace('\n', ' '), 'x', [.5, 1.86, .15]));
      },
      beats: [{ cam: 'board', acts: [['mascot', 'arm-point'], ['jun', 'writing look-d'], ['sol', 'writing look-d'], ['bg', 'writing look-d']] },
        ...[['jun:!writing peek face-sly', 'sol:face-sad look-n !writing'], ['jun:look-n face-smile bub:👉 arm-rest', 'sol:look-n face-o'], ['jun:bub: arm-slip look-d face-sly', 'sol:writing look-d face-smile'],
          ['jun:arm-palm look-palm', ''], ['jun:arm-rest face-angry look-n bub:💢', 'sol:!writing face-sweat look-n'], ['jun:bub: writing look-d face-sly', 'sol:arm-down look-c face-smile nopen'],
          ['jun:writing look-d face-sly', 'sol:arm-down look-c'], ['jun:!writing look-n face-smile bub:🔄', 'sol:arm-rest look-n face-o bub:🔄'], ['jun:bub: arm-slip has-phone look-d face-sly', 'sol:bub: look-c face-smile writing']]
          .map((p, i) => ({ cam: 'kids', acts: [...(i ? [['h' + (i - 1), 'hide']] : []), ...p.filter(Boolean).map(s => [s.slice(0, 3), s.slice(4)]), ['h' + i, 'pop', .7], ['t' + i, 'pop', .7]] })),
        { cam: 'board', acts: [['h8', 'hide'], ['title', '그 밖에 감독 선생님이 판단하는 행동까지!'], ['jun', '!has-phone arm-rest face-shock look-c'], ['t9', 'pop', .8]] }] },
    outro: { title: '정직한 시험, 진짜 내 실력!', build(a) {
        a.tiles([['law', '부정행위는 학업성적관리규정에 따라 처리', null]], 1, TOP, 32);
        a.text('fin', '모두 파이팅!', 72, 930, 380, NAVY, '#f2b42c');
        const g = new T.Group(), cg = new T.PlaneGeometry(.09, .14);
        for (let i = 0; i < 90; i++) g.add(new T.Mesh(cg, new T.MeshBasicMaterial({ color: ['#d6322b', '#f2b42c', '#1f2a44', '#fffdf7', '#2b4fa8'][i % 5], side: T.DoubleSide })));
        reg('confetti', g, { vis: false });
      },
      beats: [{ cam: 'board', acts: [['mascot', 'arm-point'], ['t0', 'pop', .3]] },
        { cam: 'kids', acts: [['confetti', 'confetti'], ['fin', 'pop', 2.6], ['mascot', 'jump arm-cheer'], ['jun', 'arm-cheer face-smile cheer nopen'], ['sol', 'arm-cheer face-smile cheer nopen'], ['bg', 'arm-cheer cheer nopen']] },
        { cam: 'host', acts: [['mascot', 'arm-wave wave']] }] },
  };

  /* ───────── 재생 ───────── */
  function setTitle(str) { titleObj.st.text = str; titleObj.tex.redraw(); }
  function clearStage() {
    if (stage) { stage.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) { o.material.map.dispose(); o.material.dispose(); } } }); scene.remove(stage); }
    stage = new T.Group(); scene.add(stage); objs = {};
  }
  function doAct(e) {
    const [id, cmd] = e.a, ago = Math.max(0, audio.currentTime - e.t);
    if (id === 'cam') return setShot(cmd, false);
    if (id === 'title') return setTitle(cmd);
    if (id === 'bg') return bgKids.forEach(r => setTokens(r, cmd, ago));
    if (chars[id]) return setTokens(chars[id], cmd, ago);
    const o = objs[id];
    o.cmd = cmd; o.t0 = e.t;
    if (cmd === 'fly') o.node.visible = true;
  }
  // snap = 되감기·건너뛰기: 자세를 바로 맞춘다. 이어 재생이면 목표만 바꿔 스프링으로 넘어간다(카메라는 늘 컷)
  function enterScene(si, t, snap) {
    const sc = SC[SCENE_IDS[si]], all = Object.values(chars).concat(bgKids);
    clearStage();
    sc.build(api);
    setTitle(sc.title);
    const init = sc.init || {};
    for (const id in chars) resetRig(chars[id], init[id]);
    bgKids.forEach(r => resetRig(r, init.bg));
    if (snap) all.forEach(r => r.clips = []);
    timeline = [];
    CUES.filter(c => c.s === si).forEach(c => {
      const b = sc.beats[c.b];
      timeline.push({ t: c.t, a: ['cam', b.cam] });
      b.acts.forEach(a => timeline.push({ t: c.t + (a[2] || 0), a }));
    });
    timeline.sort((x, y) => x.t - y.t);
    tlPos = 0; sceneIdx = si; cam.shot = '';
    while (tlPos < timeline.length && timeline[tlPos].t <= t) doAct(timeline[tlPos++]);
    cam.pos.copy(cam.tpos); cam.look.copy(cam.tlook);
    if (snap) all.forEach(snapRig);
  }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - prevNow) / 1000 || 0);
    prevNow = now; clock += dt;
    const t = audio.currentTime;
    let i = 0;
    while (i + 1 < CUES.length && CUES[i + 1].t <= t) i++;
    const c = CUES[i];
    const snap = sceneIdx < 0 || t < lastT - .05 || t - lastT > .5;
    if (c.s !== sceneIdx || snap) enterScene(c.s, t, true); // 장면 전환은 카메라가 컷이므로 자세도 컷(스프링으로 휘두르지 않음)
    else while (tlPos < timeline.length && timeline[tlPos].t <= t) doAct(timeline[tlPos++]);
    lastT = t;
    if (i !== cueIdx) { cueIdx = i; ui.who.textContent = { n: '또박이', jun: '준이', sol: '솔이' }[c.who]; ui.who.dataset.who = c.who; ui.text.textContent = c.text; }
    const speaking = !audio.paused && t >= c.v0 && t <= c.v1;
    amp += ((speaking ? (+ENV[Math.floor(t * 30)] || 0) / 9 : 0) - amp) * Math.min(1, dt * 22);
    const who = { n: 'mascot', jun: 'jun', sol: 'sol' }[c.who];
    for (const id in chars) applyRig(chars[id], dt, id === who ? amp : 0, t);
    bgKids.forEach(r => applyRig(r, dt, 0, t));
    for (const id in objs) updObj(objs[id], t);
    const k = Math.min(1, dt * 3.2);
    cam.pos.lerp(cam.tpos, k); cam.look.lerp(cam.tlook, k);
    camera.position.copy(cam.pos); camera.position.x += Math.sin(clock * .33) * .05; camera.position.y += Math.sin(clock * .47) * .025;
    camera.lookAt(cam.look);
    renderer.render(scene, camera);
    ui.big.hidden = !audio.paused || t > .1;
    ui.seek.value = t;
    ui.time.textContent = `${fmt(t)} / ${fmt(VIDEO_LEN)}`;
  }
  function state() { ui.play.textContent = audio.paused ? '▶ 재생' : '❚❚ 일시정지'; }
  function toggle() {
    if (failed) return;
    ui.end.hidden = true;
    if (audio.paused) audio.play().catch(() => { ui.text.textContent = '영상을 불러오지 못했어요. 새로고침해 주세요.'; });
    else audio.pause();
  }
  function mute(m) { audio.muted = m; ui.sound.textContent = m ? '소리 꺼짐' : '소리 켜짐'; }
  function resize() {
    const w = canvas.clientWidth, h = Math.round(w * 9 / 16);
    if (w) renderer.setSize(w, h, false);
  }

  function init() {
    const $ = s => document.querySelector(s);
    audio = $('#vaudio'); canvas = $('#vcanvas');
    ui = { who: $('#capWho'), text: $('#capText'), seek: $('#vseek'), time: $('#vtime'), play: $('#vplay'), big: $('#vbig'), sound: $('#vsound'), end: $('#vend') };
    ui.seek.max = VIDEO_LEN;
    ui.seek.addEventListener('input', () => { audio.currentTime = +ui.seek.value; ui.end.hidden = true; });
    audio.addEventListener('play', state); audio.addEventListener('pause', state);
    audio.addEventListener('ended', () => { ui.end.hidden = false; });
    audio.addEventListener('error', () => { ui.text.textContent = '영상 소리 파일(assets/video.mp3)을 찾지 못했어요.'; });
    $('#vscreen').addEventListener('click', e => { if (!e.target.closest('.endcard')) toggle(); });
    ui.play.addEventListener('click', toggle);
    ui.sound.addEventListener('click', () => mute(!audio.muted));
    $('#vfull').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : $('#player').requestFullscreen?.());
    $('#vagain').addEventListener('click', () => { audio.currentTime = 0; ui.end.hidden = true; audio.play(); });
    mute(false);
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true });
    } catch (e) {
      failed = true; ui.big.hidden = true;
      ui.text.textContent = '이 기기에서는 3D 영상을 볼 수 없어요. 다른 브라우저(크롬·엣지)로 열어 주세요.';
      return;
    }
    renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene(); scene.background = new T.Color('#e9e1cf'); scene.fog = new T.Fog('#e9e1cf', 10, 20);
    camera = new T.PerspectiveCamera(35, 16 / 9, .1, 60);
    buildRoom();
    scene.traverse(o => { o.updateMatrix(); o.matrixAutoUpdate = false; });   // 교실은 움직이지 않으니 행렬을 한 번만 계산
    buildCast();
    const st = { text: '' }, tex = canvasTex(2496, 180, ctx => {
      ctx.font = `900 104px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f4f1e8';
      ctx.fillText(st.text, 1248, 94);
    });
    titleObj = { st, tex };
    const tp = plane(tex, BOARD.w, 90 * PX); tp.position.copy(b2w(930, 108, .012)); scene.add(tp);
    new ResizeObserver(resize).observe(canvas);
    // 글꼴이 늦게 오면 카드를 다시 그린다(한글 웹폰트는 글자 묶음별로 나눠 받으므로 받을 때마다)
    let rt; const reload = () => { clearTimeout(rt); rt = setTimeout(() => { sceneIdx = -1; }, 400); }; // ponytail: 글꼴 조각이 몰려 와도 한 번만 다시 그림
    Promise.all([document.fonts?.load(`800 40px Hahmlet`, '시험'), document.fonts?.load(`700 40px "IBM Plex Sans KR"`, '시험')]).then(reload).catch(() => {});
    document.fonts?.addEventListener?.('loadingdone', reload);
  }
  function open() {
    if (failed) return;
    audio.pause(); audio.currentTime = 0; ui.end.hidden = true; state();
    sceneIdx = -1; cueIdx = -1; lastT = 0;
    resize();
    cancelAnimationFrame(raf); prevNow = performance.now(); raf = requestAnimationFrame(frame);
  }
  function close() { audio?.pause(); cancelAnimationFrame(raf); }

  // 자체 점검: 대본(cues)과 장면 정의가 어긋나면 콘솔에 표시
  function check() {
    const bad = [];
    if (failed) return bad;
    SCENE_IDS.forEach((name, s) => {
      const n = CUES.filter(c => c.s === s).length, sc = SC[name];
      if (!sc) return bad.push(name + ': 장면 없음');
      if (sc.beats.length !== n) bad.push(`${name}: 대사 ${n}개인데 장면 동작은 ${sc.beats.length}개`);
      clearStage(); sc.build(api);
      sc.beats.forEach(b => { if (!SHOTS[b.cam]) bad.push(`${name}: 카메라 ${b.cam} 없음`);
        b.acts.forEach(([id, cmd]) => { if (id === 'cam' ? !SHOTS[cmd] : !(id === 'title' || id === 'bg' || chars[id] || objs[id])) bad.push(`${name}: ${id} ${cmd} 없음`); }); });
    });
    clearStage(); sceneIdx = -1;
    console.assert(!bad.length, '영상 장면 오류', bad);
    return bad;
  }

  return { init, open, close, check, debug: () => ({ chars, cam, objs, sceneIdx, renderer, bgKids, SHOTS, camera }) };
})();
