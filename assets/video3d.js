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
  const FONT = 'Pretendard, -apple-system, "Segoe UI", "Malgun Gothic", sans-serif';

  let renderer, scene, camera, canvas, audio, ui, raf = 0, stage, objs = {}, titleObj;
  let sceneIdx = -1, cueIdx = -1, lastT = 0, timeline = [], tlPos = 0, clock = 0, prevNow = 0, amp = 0, failed = false;
  const chars = {}, bgKids = [];
  const cam = { pos: new T.Vector3(), look: new T.Vector3(), tpos: new T.Vector3(), tlook: new T.Vector3(), shot: '' };

  /* ───────── 기본 도구 ───────── */
  const mats = {};
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: .82, metalness: 0, ...o })); };
  function add(parent, geo, color, pos, o = {}) {
    const m = new T.Mesh(geo, typeof color === 'string' ? mat(color, o.mat) : color);
    if (pos) m.position.set(...pos);
    if (o.rot) m.rotation.set(...o.rot);
    if (o.scale) m.scale.set(...o.scale);
    m.castShadow = o.cast !== false; m.receiveShadow = !!o.receive;
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
  const propImg = (k, redraw) => svgImg('p:' + k, K.prop(k), '-75 -75 150 150', redraw);
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
      if (sticker) { ctx.fillStyle = sticker; rr(ctx, 2, 2, w - 4, h - 4, size * .5); ctx.fill(); }
      ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fill;
      ctx.fillText(str, w / 2, h / 2 + size * .04);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    return { tex, w, h };
  };
  // 칠판 카드: 넓으면 그림 왼쪽+글 오른쪽, 좁으면 그림 위+글 아래
  function cardTex(w, h, k, label, fs) {
    const lines = label.split('\n'), wide = w >= 260;
    return canvasTex(w * 2, h * 2, (ctx, redraw) => {
      ctx.scale(2, 2);
      ctx.fillStyle = '#fffdf5'; rr(ctx, 1, 1, w - 2, h - 2, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 2; ctx.stroke();
      const im = propImg(k, redraw), is = wide ? h * .9 : h * .56;
      if (im) ctx.drawImage(im, wide ? h * .45 - is / 2 : w / 2 - is / 2, wide ? h / 2 - is / 2 : h * .06, is, is);
      ctx.font = `700 ${fs}px ${FONT}`; ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.textAlign = wide ? 'left' : 'center';
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
        node.position.copy(b2w(cx, cy, .025 + i * .0004));
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
    add(g, box(.085, .16, .014), '#1f2937');
    add(g, box(.072, .135, .004), '#7dd3fc', [0, 0, .009], { mat: { emissive: '#38bdf8', emissiveIntensity: .5 }, cast: false });
    return g;
  }
  function basketModel() {
    const g = new T.Group();
    add(g, cyl(.26, .19, .26, 24, true), '#c8894a', [0, .13, 0], { mat: { side: T.DoubleSide } });
    add(g, cyl(.19, .19, .02), '#a9713a', [0, .01, 0]);
    add(g, new T.TorusGeometry(.26, .022, 10, 28), '#a9713a', [0, .26, 0], { rot: [Math.PI / 2, 0, 0] });
    add(g, new T.TorusGeometry(.24, .016, 8, 24, Math.PI), '#a9713a', [0, .26, 0]);
    const { tex, w, h } = textTex('제출함', 60, '#991b1b', '#fff');
    const sign = plane(tex, w * .002, h * .002);
    sign.position.set(0, .62, 0); sign.rotation.y = Math.PI;
    g.add(sign);
    return g;
  }
  function bagModel() {
    const g = new T.Group();
    add(g, cap(.2, .2), '#ec4899', [0, .3, 0], { scale: [1.15, 1, .72] });
    add(g, box(.3, .17, .08), '#db2777', [0, .19, -.13]);
    add(g, box(.22, .03, .02), '#fbbf24', [0, .42, -.145]);
    add(g, new T.TorusGeometry(.07, .018, 8, 18, Math.PI), '#be185d', [0, .58, 0]);
    return g;
  }
  const bookModel = c => { const g = new T.Group(); add(g, box(.2, .04, .27), c); add(g, box(.19, .03, .26), '#f8fafc', [.008, 0, 0]); return g; };
  function bellModel() {
    const g = new T.Group(), pts = [[.0, .0], [.06, -.02], [.1, -.1], [.12, -.2], [.17, -.27], [.2, -.3]].map(p => new T.Vector2(...p));
    add(g, new T.LatheGeometry(pts, 24), '#f5b301', null, { mat: { metalness: .4, roughness: .35, side: T.DoubleSide } });
    add(g, sph(.035), '#a16207', [0, -.31, 0]);
    add(g, box(.04, .08, .04), '#854d0e', [0, .03, 0]);
    return g;
  }

  /* ───────── 캐릭터 ───────── */
  const P0 = { pSx: -.45, pSz: -.1, pEx: -1.35, nSx: -.45, nSz: -.1, nEx: -1.35, bYaw: 0, bLean: 0, bRoll: 0,
    hYaw: 0, hPitch: 0, eX: 0, eY: 0, eOpen: 1, curve: 1, mO: 0, brow: 0, browL: 0 };
  const REST = { pSx: -.45, pSz: -.1, pEx: -1.35, nSx: -.45, nSz: -.1, nEx: -1.35 };
  const LOOK0 = { hYaw: 0, hPitch: 0, eX: 0, eY: 0, bRoll: 0, bYaw: 0, bLean: 0 };
  // 상태 이름 → 목표 자세. n = 옆자리 방향(+1/-1)
  const TOK = {
    'arm-rest': () => REST,
    'arm-up': () => ({ ...REST, pSx: -2.9, pSz: .5, pEx: -.15 }),
    'arm-down': () => ({ pSx: .12, pSz: .1, pEx: -.2, nSx: .12, nSz: .1, nEx: -.2 }),
    'arm-palm': () => ({ ...REST, nSx: -1.25, nSz: -.5, nEx: -1.95 }),
    'arm-slip': () => ({ ...REST, nSx: .1, nSz: 0, nEx: -1.05 }),
    'arm-hold': () => ({ ...REST, pSx: -1.3, pSz: .22, pEx: -1.25 }),
    'arm-cheer': () => ({ pSx: -2.8, pSz: .5, pEx: -.25, nSx: -2.8, nSz: .5, nEx: -.25 }),
    'face-smile': () => ({ curve: 1, mO: 0, brow: 0, browL: 0, eOpen: 1 }),
    'face-sad': () => ({ curve: -.8, mO: 0, brow: -.3, browL: 0, eOpen: 1 }),
    'face-sweat': () => ({ curve: -.6, mO: 0, brow: -.35, browL: .01, eOpen: 1 }),
    'face-o': () => ({ curve: .1, mO: .75, brow: 0, browL: .015, eOpen: 1.1 }),
    'face-shock': () => ({ curve: .1, mO: 1, brow: -.1, browL: .03, eOpen: 1.25 }),
    'face-sly': () => ({ curve: .7, mO: 0, brow: .3, browL: -.005, eOpen: .62 }),
    'face-angry': () => ({ curve: -.6, mO: 0, brow: .45, browL: -.01, eOpen: .85 }),
    'look-c': () => LOOK0,
    'look-u': () => ({ ...LOOK0, hPitch: -.2, eY: .6 }),
    'look-d': () => ({ ...LOOK0, hPitch: .42, eY: -.5, bLean: .12 }),
    'look-n': n => ({ ...LOOK0, hYaw: n * .62, eX: n * .8 }),
    'look-palm': () => ({ ...LOOK0, hYaw: -.4, hPitch: .12, eX: -.8 }),
    'peek': n => ({ hYaw: n * .78, hPitch: .22, eX: n, eY: -.4, bRoll: -n * .24, bYaw: n * .25, bLean: .05 }),
  };
  const M_REST = { pSx: 0, pSz: .45, pEx: -.5, nSx: 0, nSz: .45, nEx: -.5 };
  const TOK_M = { ...TOK,
    'arm-rest': () => M_REST,
    'arm-point': () => ({ ...M_REST, pSx: .25, pSz: 2.15, pEx: -.15 }),
    'arm-wave': () => ({ ...M_REST, pSx: -.2, pSz: 2.5, pEx: -.7 }),
    'arm-cheer': () => ({ pSx: 0, pSz: 2.5, pEx: -.3, nSx: 0, nSz: 2.5, nEx: -.3 }),
  };

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
      const ch = add(head, new T.CircleGeometry(.036 * s, 20), new T.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: .42 }),
        [sx * .155 * s, y - .075 * s, flat ? z + .003 : z - .028 * s], { rot: [0, flat ? 0 : sx * .6, 0], cast: false });
      ch.renderOrder = 2;
    }
    rig.mouth = grp(head, [0, y - .115 * s, z + .012]);
    rig.smile = add(rig.mouth, new T.TorusGeometry(.04 * s, .0075 * s, 8, 20, Math.PI), INK, null, { rot: [0, 0, Math.PI], cast: false });
    rig.open = add(rig.mouth, new T.CircleGeometry(.036 * s, 24), new T.MeshBasicMaterial({ color: '#7a2e2e' }), [0, -.012 * s, .002], { cast: false });
  }
  function arm(body, sx, y, x, r, l1, l2, sleeve, skin, hand) {
    const sh = grp(body, [sx * x, y, 0]);
    add(sh, cap(r, l1 - r * 1.2), sleeve, [0, -l1 / 2, 0]);
    const el = grp(sh, [0, -l1, 0]);
    add(el, cap(r * .9, l2 - r * 1.2), skin, [0, -l2 / 2, 0]);
    const h = add(el, sph(hand), skin === INK ? '#ffffff' : skin, [0, -l2 - hand * .3, 0]);
    return { sh, el, hand: h };
  }
  function bubbleNode() {
    const st = { text: '' };
    const tex = canvasTex(256, 224, ctx => {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 7;
      rr(ctx, 8, 8, 240, 160, 30); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(70, 164); ctx.lineTo(48, 214); ctx.lineTo(116, 164); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(70, 166); ctx.lineTo(48, 214); ctx.lineTo(116, 166); ctx.stroke();
      ctx.font = `700 ${[...st.text].length > 2 ? 48 : 96}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
      ctx.fillText(st.text, 128, 92);
    });
    const n = plane(tex, .46, .4);
    n.renderOrder = 5; n.material.depthTest = false;
    n.userData = { st, tex };
    return n;
  }
  function makeKid({ hair, shirt, style = 'short', nb = 0, seed = 0 }) {
    const rig = { kind: 'kid', tok: TOK, nb, seed, cur: { ...P0 }, vel: {}, tgt: { ...P0 }, flags: new Set(), blinkAt: 1 + seed, root: new T.Group() };
    const root = rig.root, chair = '#8b9bb4', metal = '#9ca3af';
    add(root, box(.42, .04, .42), chair, [0, .44, -.03], { receive: true });
    add(root, box(.42, .36, .04), chair, [0, .74, -.25]);
    for (const [x, z] of [[-.19, -.22], [.19, -.22], [-.19, .16], [.19, .16]]) add(root, cyl(.015, .015, .44, 8), metal, [x, .22, z]);
    for (const sx of [1, -1]) {   // 다리
      add(root, cap(.072, .2), '#475569', [sx * .1, .5, .16], { rot: [Math.PI / 2, 0, 0] });
      add(root, cap(.058, .26), '#475569', [sx * .1, .3, .33]);
      add(root, sph(.075), '#f8fafc', [sx * .1, .06, .38], { scale: [1, .7, 1.5] });
    }
    // 책상(학생 앞쪽 = +z)
    const desk = rig.desk = grp(root, [0, 0, .52]);
    add(desk, box(.98, .04, .58), '#edc58c', [0, .74, 0], { receive: true });
    add(desk, box(.9, .03, .46), '#d19a55', [0, .6, .02]);
    for (const [x, z] of [[-.44, -.24], [.44, -.24], [-.44, .24], [.44, .24]]) add(desk, cyl(.017, .017, .74, 8), metal, [x, .37, z]);
    rig.paper = add(desk, box(.24, .004, .32), '#ffffff', [0, .764, -.04], { receive: true });
    // 몸
    const body = rig.body = grp(root, [0, .49, 0]);
    add(body, cap(.165, .24), shirt, [0, .27, 0], { scale: [1.12, 1, .85] });
    add(body, new T.TorusGeometry(.075, .024, 8, 20), '#ffffff', [0, .515, .01], { rot: [Math.PI / 2, 0, 0], cast: false });
    add(body, cyl(.052, .052, .1, 12), SKIN, [0, .55, 0]);
    const head = rig.head = grp(body, [0, .58, 0]);
    add(head, sph(.25, 32, 24), SKIN, [0, .22, 0], { scale: [1, .96, .95] });
    for (const sx of [1, -1]) add(head, sph(.045, 12, 10), SKIN, [sx * .243, .2, 0]);
    const cut = new T.SphereGeometry(.264, 32, 20, 0, Math.PI * 2, 0, 1.72);
    add(head, cut, hair, [0, .225, 0], { rot: [-.52, 0, 0], mat: { side: T.DoubleSide } });
    add(head, sph(.13, 20, 12), hair, [0, .405, .15], { scale: [1.5, .42, .6] });
    if (style === 'bob') add(head, new T.SphereGeometry(.275, 32, 20, Math.PI * .9, Math.PI * 1.2, 0, 2.25), hair, [0, .225, 0], { mat: { side: T.DoubleSide } });
    if (style === 'pony') { add(head, sph(.09), hair, [0, .34, -.27]); add(head, cap(.06, .2), hair, [0, .16, -.33], { rot: [.35, 0, 0] }); }
    if (style === 'twin') for (const sx of [1, -1]) add(head, sph(.1), hair, [sx * .27, .12, -.04], { scale: [1, 1.2, 1] });
    if (style === 'curly') [[-.16, .42, 0], [0, .47, .02], [.16, .42, 0], [-.1, .44, -.14], [.1, .44, -.14], [0, .4, .16]].forEach(p => add(head, sph(.1, 16, 12), hair, p));
    face(head, .235, .222, 1, rig);
    rig.sweat = add(head, sph(.026, 16, 12), '#38bdf8', [.19, .3, .17], { scale: [.8, 1.35, .7], cast: false });
    rig.ear = add(head, sph(.035, 12, 10), '#f8fafc', [-.262, .2, .01], { scale: [.7, 1, 1] });
    rig.arms = { p: arm(body, 1, .45, .2, .052, .22, .24, shirt, SKIN, .055), n: arm(body, -1, .45, .2, .052, .22, .24, shirt, SKIN, .055) };
    rig.pen = add(rig.arms.n.el, cyl(.009, .009, .16, 8), '#334155', [.02, -.22, .06], { rot: [.9, 0, -.3] });
    rig.held = phoneModel(); rig.held.position.set(0, -.34, .03); rig.arms.p.el.add(rig.held);
    rig.lap = phoneModel(); rig.lap.position.set(.03, -.3, .05); rig.lap.rotation.set(-1.2, 0, 0); rig.arms.n.el.add(rig.lap);
    rig.note = add(rig.arms.n.el, box(.11, .14, .004), '#fef08a', [.02, -.31, .05], { rot: [-1.0, 0, 0] });
    rig.palm = add(rig.arms.n.el, new T.CircleGeometry(.04, 16), new T.MeshBasicMaterial({ color: '#1d4ed8' }), [.0, -.255, .057], { scale: [1, .25, 1], cast: false });
    rig.watch = add(rig.arms.n.el, cyl(.058, .058, .04, 16), '#0f172a', [0, -.17, 0], { mat: { emissive: '#2dd4bf', emissiveIntensity: .7 } });
    rig.bubble = bubbleNode(); rig.bubble.position.set(.44, 1.5, 0); root.add(rig.bubble);
    rig.stamp = plane(canvasTex(128, 128, (ctx, rd) => { const im = markImg('x', rd); if (im) ctx.drawImage(im, 0, 0, 128, 128); }), .26, .26);
    rig.stamp.position.set(-.36, 1.5, .2); rig.stamp.renderOrder = 6; rig.stamp.material.depthTest = false; root.add(rig.stamp);
    return rig;
  }
  function makeMascot() {
    const rig = { kind: 'mascot', tok: TOK_M, nb: 0, seed: 2.2, cur: { ...P0, ...M_REST }, vel: {}, tgt: { ...P0, ...M_REST }, flags: new Set(), blinkAt: 2, root: new T.Group() };
    const root = rig.root, hex = (a, b, h) => { const g = cyl(a, b, h, 6); g.rotateY(Math.PI / 6); return g; };
    for (const sx of [1, -1]) { add(root, cyl(.018, .018, .16, 8), INK, [sx * .09, .1, 0]); add(root, sph(.07), '#ef4444', [sx * .09, .04, .04], { scale: [1, .6, 1.5] }); }
    const body = rig.body = grp(root, [0, .16, 0]);
    add(body, cyl(.2, .19, .12, 24), '#fda4af', [0, .06, 0]);
    add(body, cyl(.205, .205, .07, 24), '#cbd5e1', [0, .155, 0], { mat: { metalness: .5, roughness: .4 } });
    add(body, hex(.2, .2, .6), '#fbbf24', [0, .49, 0]);
    add(body, hex(0, .2, .3), '#fde7c3', [0, .94, 0]);
    add(body, cyl(0, .068, .102, 6), '#334155', [0, 1.04, 0], { rot: [0, Math.PI / 6, 0] });
    rig.head = grp(body, [0, .3, 0]);
    face(rig.head, .32, .176, .85, rig, true);
    rig.sweat = new T.Group(); rig.ear = new T.Group();
    rig.arms = { p: arm(body, 1, .56, .19, .022, .2, .2, INK, INK, .045), n: arm(body, -1, .56, .19, .022, .2, .2, INK, INK, .045) };
    return rig;
  }
  function setTokens(rig, str) {
    for (const tk of str.split(' ').filter(Boolean)) {
      if (tk.startsWith('bub:')) { const b = rig.bubble; if (!b) continue; rig.bub = tk.slice(4); if (rig.bub) { b.userData.st.text = rig.bub; b.userData.tex.redraw(); } continue; }
      if (tk[0] === '!') { rig.flags.delete(tk.slice(1)); continue; }
      const f = rig.tok[tk];
      if (f) {
        Object.assign(rig.tgt, f(rig.nb));
        if (tk.startsWith('face-')) rig.face = tk;
        if (tk.startsWith('arm-')) rig.armTok = tk;
      } else rig.flags.add(tk);
      if (tk === 'caught') rig.caughtAt = clock;
      if (tk === 'jump') rig.jumpAt = clock;
    }
  }
  function resetRig(rig, str) {
    rig.flags.clear(); rig.bub = ''; rig.face = 'face-smile'; rig.armTok = 'arm-rest';
    Object.assign(rig.tgt, P0, rig.kind === 'mascot' ? M_REST : REST);
    setTokens(rig, str || '');
  }
  const snapRig = rig => { Object.assign(rig.cur, rig.tgt); rig.vel = {}; rig.bubS = rig.bub ? 1 : 0; };
  function applyRig(rig, dt, talk) {
    const c = rig.cur, f = rig.flags, t = clock, s = rig.seed, m = rig.kind === 'mascot';
    for (const k in rig.tgt) {   // 스프링: 살짝 넘쳤다가 돌아오며 멈춘다
      const v = (rig.vel[k] || 0) + ((rig.tgt[k] - c[k]) * 110 - (rig.vel[k] || 0) * 15) * dt;
      rig.vel[k] = v; c[k] += v * dt;
    }
    const wr = f.has('writing') ? 1 : 0, wig = f.has('wiggle') ? 1 : 0, ju = clamp((t - (rig.jumpAt ?? -9)) / 1.5);
    const hop = ju < 1 ? Math.abs(Math.sin(ju * Math.PI * 3)) * .22 * (1 - ju * .5) : 0;
    rig.root.position.y = hop + (f.has('cheer') ? Math.abs(Math.sin(t * 6.5 + s)) * .07 : 0) + (m ? talk * .025 + Math.sin(t * 2 + s) * .008 : 0);
    rig.body.rotation.set(c.bLean + (m ? c.hPitch * .4 + talk * .04 : 0) + wig * Math.sin(t * 8) * .03,
      c.bYaw + (m ? c.hYaw * .6 + Math.sin(t * 1.3) * .05 : 0) + wig * Math.sin(t * 9) * .1, c.bRoll + wig * Math.sin(t * 9 + 1) * .07 + (m ? Math.sin(t * 1.7) * .03 : 0));
    rig.body.scale.y = 1 + Math.sin(t * 1.7 + s) * .012 - hop * .1;
    if (!m) rig.head.rotation.set(c.hPitch - talk * .07 + Math.sin(t * 6.3 + s) * .03 * talk + wr * Math.sin(t * 1.9 + s) * .03,
      c.hYaw + Math.sin(t * 2.3 + s) * .06 * talk + Math.sin(t * .6 + s) * .03, Math.sin(t * .8 + s) * .03 + Math.sin(t * 4.1) * .04 * talk);
    const A = rig.arms, wave = f.has('wave') ? Math.sin(t * 9) * .3 : 0, ges = m ? talk * Math.sin(t * 5) * .18 : 0;
    A.p.sh.rotation.set(c.pSx + ges * .4, 0, c.pSz + wave + ges);
    A.p.el.rotation.x = c.pEx - Math.abs(wave) * .3;
    A.n.sh.rotation.set(c.nSx + wr * Math.sin(t * 11 + s) * .02 - ges * .3, 0, -c.nSz + wr * Math.sin(t * 13 + s) * .035 - ges * .6);
    A.n.el.rotation.x = c.nEx + wr * Math.sin(t * 12 + s) * .05;
    if (t > rig.blinkAt) rig.blinkAt = t + 2 + ((s * 7 + t * 13) % 3);
    const eo = f.has('yawn') ? .12 : c.eOpen * (rig.blinkAt - t < .12 ? .1 : 1);
    rig.eyes.forEach(e => e.scale.y = Math.max(.08, eo));
    rig.pupils.forEach(p => p.position.set(c.eX * .014, c.eY * .012, p.position.z));
    rig.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * c.brow; b.position.y = b.userData.y0 + c.browL; });
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
    const wood = canvasTex(512, 512, ctx => {
      ctx.fillStyle = '#e3c08f'; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#cfa874'; ctx.lineWidth = 3;
      for (let y = 0; y <= 512; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
      for (let i = 0; i < 16; i++) { const y = (i % 8) * 64, x = (i * 173) % 512; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke(); }
    });
    wood.wrapS = wood.wrapT = T.RepeatWrapping; wood.repeat.set(5, 5);
    add(scene, new T.PlaneGeometry(10, 9), new T.MeshStandardMaterial({ map: wood, roughness: .9 }), [.5, 0, 0], { rot: [-Math.PI / 2, 0, 0], receive: true, cast: false });
    const wall = '#fdf3dc';
    add(scene, new T.PlaneGeometry(10, 3.6), wall, [.5, 1.8, -4], { receive: true, cast: false });
    add(scene, new T.PlaneGeometry(10, 3.6), wall, [.5, 1.8, 4.4], { rot: [0, Math.PI, 0], receive: true, cast: false });
    add(scene, new T.PlaneGeometry(9, 3.6), '#f8ecd0', [-4.4, 1.8, 0], { rot: [0, Math.PI / 2, 0], receive: true, cast: false });
    add(scene, new T.PlaneGeometry(9, 3.6), '#f8ecd0', [5.4, 1.8, 0], { rot: [0, -Math.PI / 2, 0], receive: true, cast: false });
    add(scene, box(10, .12, .04), '#c9a36b', [.5, .06, -3.98]); add(scene, box(10, .12, .04), '#c9a36b', [.5, .06, 4.38]);
    for (const z of [-2.2, .2, 2.6]) {   // 창문
      add(scene, box(.06, 1.5, 1.7), '#ffffff', [-4.38, 1.85, z]);
      add(scene, box(.02, 1.36, 1.56), '#bae6fd', [-4.34, 1.85, z], { mat: { emissive: '#bae6fd', emissiveIntensity: .55 }, cast: false });
      add(scene, box(.03, 1.36, .04), '#ffffff', [-4.33, 1.85, z]); add(scene, box(.03, .04, 1.56), '#ffffff', [-4.33, 1.85, z]);
    }
    // 칠판
    add(scene, box(BOARD.w + .2, 1.623 + .2, .06), '#a16207', [BOARD.x, BOARD.y, BOARD.z - .04]);
    add(scene, new T.PlaneGeometry(BOARD.w, 1.623), '#2f6b55', [BOARD.x, BOARD.y, BOARD.z], { receive: true, cast: false, mat: { roughness: .95 } });
    add(scene, box(BOARD.w + .2, .05, .14), '#854d0e', [BOARD.x, BOARD.y - .88, BOARD.z + .04]);
    add(scene, box(.18, .035, .04), '#ffffff', [2.3, BOARD.y - .84, BOARD.z + .07]); add(scene, box(.12, .035, .04), '#fecaca', [2.6, BOARD.y - .84, BOARD.z + .07]);
    const clockFace = (x, y, z, ry) => {
      const g = grp(scene, [x, y, z]); g.rotation.y = ry;
      add(g, cyl(.2, .2, .04, 32), '#475569', null, { rot: [Math.PI / 2, 0, 0] });
      add(g, cyl(.17, .17, .045, 32), '#ffffff', null, { rot: [Math.PI / 2, 0, 0] });
      add(g, box(.02, .12, .01), INK, [0, .06, .03]); add(g, box(.1, .02, .01), INK, [.05, 0, .03]);
    };
    clockFace(3.75, 2.75, -3.96, 0); clockFace(.5, 3.0, 4.36, Math.PI);
    // 교탁
    add(scene, box(1.1, .9, .55), '#b9813f', [3.9, .45, -3.0]); add(scene, box(1.2, .05, .65), '#d19a55', [3.9, .92, -3.0], { receive: true });
    // 뒤쪽 벽: 사물함·게시판
    for (let c = 0; c < 6; c++) for (let r = 0; r < 2; r++) {
      add(scene, box(.52, .56, .4), '#93c5fd', [1.6 + c * .55, .3 + r * .59, 4.15], { receive: true });
      add(scene, sph(.025, 8, 8), '#1e3a8a', [1.42 + c * .55, .3 + r * .59, 3.94]);
    }
    const bb = canvasTex(1024, 400, ctx => {
      ctx.fillStyle = '#a16207'; ctx.fillRect(0, 0, 1024, 400); ctx.fillStyle = '#d9f99d'; ctx.fillRect(22, 22, 980, 356);
      ctx.font = `800 58px ${FONT}`; ctx.fillStyle = '#3f6212'; ctx.textAlign = 'center'; ctx.fillText('우리 반 게시판', 512, 96);
      ['#fef08a', '#bae6fd', '#fecdd3', '#ddd6fe'].forEach((c, i) => { ctx.save(); ctx.translate(150 + i * 240, 240); ctx.rotate([-.05, .04, -.03, .05][i]); ctx.fillStyle = c; ctx.fillRect(-90, -85, 180, 170); ctx.restore(); });
    });
    const bbm = add(scene, new T.PlaneGeometry(2.6, 1.02), new T.MeshStandardMaterial({ map: bb, roughness: .9 }), [-1.6, 1.9, 4.38], { rot: [0, Math.PI, 0], cast: false });
    bbm.receiveShadow = true;
    scene.add(new T.HemisphereLight('#ffffff', '#e8caa0', .72));
    const sun = new T.DirectionalLight('#fff3dc', .95);
    sun.position.set(-4, 6, 1.5); sun.target.position.set(.5, .5, -.5); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.radius = 5;
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 16 });
    scene.add(sun);
    const fill = new T.DirectionalLight('#ffffff', .28); fill.position.set(2, 3, -6); scene.add(fill);   // 칠판 쪽에서 학생 얼굴을 비춘다
  }
  function buildCast() {
    const kid = (id, o, x, z) => { const r = makeKid(o); r.root.position.set(x, 0, z); r.root.rotation.y = Math.PI; r.baseY = 0; scene.add(r.root); return r; };
    chars.jun = kid('jun', { hair: '#2b211b', shirt: '#60a5fa', style: 'short', nb: -1, seed: .3 }, -.4, 0);
    chars.sol = kid('sol', { hair: '#5b3a29', shirt: '#f472b6', style: 'bob', nb: 1, seed: 1.9 }, 1.4, 0);
    [['#1f2937', '#34d399', 'curly', -1.35], ['#7c4a1e', '#fbbf24', 'pony', .5], ['#4a3325', '#fb923c', 'twin', 2.35]].forEach(([hair, shirt, style, x], i) =>
      bgKids.push(kid('bg' + i, { hair, shirt, style, nb: i ? -1 : 1, seed: 3 + i * 1.3 }, x, 1.75)));
    chars.mascot = makeMascot();
    chars.mascot.root.position.set(-1.45, 0, -2.9); chars.mascot.root.rotation.y = .25;
    scene.add(chars.mascot.root);
    Object.values(chars).concat(bgKids).forEach(r => r.brows.forEach(b => b.userData.y0 = b.position.y));
  }

  /* ───────── 카메라 ───────── */
  const SHOTS = {   // [위치, 바라보는 곳]. z>0 은 교실 뒤에서 칠판 쪽, z<0 은 칠판 쪽에서 학생 쪽
    wide: [[.5, 2.45, 4.1], [.5, 1.5, -4]],
    board: [[.3, 2.1, 1.15], [.3, 1.7, -4]],
    host: [[-.7, 1.2, -.35], [-1.38, .78, -2.9]],
    kids: [[.5, 1.55, -3.1], [.5, 1.1, 0]],
    floor: [[.5, 1.75, -3.9], [.5, .6, -.6]],
    jun: [[-.95, 1.28, -2.15], [-.4, 1.04, 0]],
    sol: [[1.95, 1.28, -2.15], [1.4, 1.04, 0]],
  };
  function setShot(name, snap) {
    const s = SHOTS[name], cut = snap || !cam.shot || Math.sign(SHOTS[cam.shot][0][2]) !== Math.sign(s[0][2]);
    cam.shot = name; cam.tpos.set(...s[0]); cam.tlook.set(...s[1]);
    if (cut) { cam.pos.copy(cam.tpos); cam.look.copy(cam.tlook); }
  }

  /* ───────── 장면 정의 ───────── */
  const RIGHT = { x: 930, y: 160, w: 600, h: 290 }, TOP = { x: 330, y: 160, w: 1200, h: 136 };
  const omrSvg = `<rect width="560" height="284" rx="14" fill="#fff"/>
    <rect width="560" height="54" rx="14" fill="#fecaca"/><text x="24" y="36" font-size="26" font-weight="800" fill="#991b1b" font-family="sans-serif">OMR 답안지</text>
    ${[['학년', 2], ['반', 3], ['번호', 15], ['과목코드', '03']].map(([k, v], i) => `<text x="${28 + i * 132}" y="96" font-size="22" font-weight="700" fill="#64748b" font-family="sans-serif">${k}</text>
      <rect x="${28 + i * 132}" y="106" width="104" height="44" rx="8" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
      <text x="${80 + i * 132}" y="137" font-size="28" font-weight="800" fill="#0f172a" text-anchor="middle" font-family="sans-serif">${v}</text>`).join('')}
    ${[0, 1, 2].map(r => `<text x="34" y="${196 + r * 34}" font-size="22" font-weight="700" fill="#64748b" font-family="sans-serif">${r + 1}</text>` +
      [0, 1, 2, 3, 4].map(c => `<ellipse cx="${90 + c * 50}" cy="${188 + r * 34}" rx="17" ry="11" fill="${(r === 0 && c === 2) || (r === 1 && c === 0) || (r === 2 && c === 3) ? '#0f172a' : '#fff'}" stroke="#ef4444" stroke-width="2.5"/>`).join('')).join('')}`;
  const essaySvg = `<rect width="560" height="284" rx="14" fill="#fff"/>
    <text x="28" y="48" font-size="26" font-weight="800" fill="#0f172a" font-family="sans-serif">[논술형 1] 풀이 과정을 쓰시오.</text>
    ${[110, 170, 230].map(y => `<path d="M28 ${y}H532" stroke="#cbd5e1" stroke-width="2"/>`).join('')}
    <g font-size="34" font-weight="600" fill="#1d4ed8" font-style="italic" font-family="sans-serif"><text x="36" y="100">2x + 4 = 14 이므로</text><text x="36" y="160">x =</text><text x="104" y="160">10</text></g>`;
  const line = (id, sx, sy, len) => { const n = new T.Mesh(new T.PlaneGeometry(len * PX, 4.5 * PX), new T.MeshBasicMaterial({ color: '#1d4ed8' })); n.position.copy(b2w(sx + len / 2, sy, .03)); reg(id, n, { vis: false, len: len * PX }); };
  const DESK_Y = .79, FLOORP = [.5, 0, -1.05];

  const SC = {
    intro: { title: '', build(a) {
        a.text('bt', '시험 보는 날', 130, 930, 215, '#ffffff');
        a.text('bs', '이것만은 꼭!', 64, 930, 375, '#713f12', '#fde047');
        a.svg('st1', K.emo('✨', 100), '-75 -75 150 150', 420, 150, 90, 90, false); a.svg('st2', K.emo('⭐', 100), '-75 -75 150 150', 1440, 380, 90, 90, false);
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
        a.svg('hl', `<rect x="14" y="66" width="532" height="96" rx="14" fill="none" stroke="#f59e0b" stroke-width="9"/>`, '0 0 560 284', 620, 306, 560, 284, false, .02);
        a.svg('ox', `<path d="M-20-15L20 15M20-15L-20 15" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M-20-15L20 15M20-15L-20 15" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>`, '-40 -40 80 80', 580, 420, 60, 60, false, .02);
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
        a.text('fix', '5', 34, 530, 314, '#1d4ed8');
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
        a.text('fin', '모두 파이팅!', 72, 930, 380, '#713f12', '#fde047');
        const g = new T.Group(), cg = new T.PlaneGeometry(.09, .14);
        for (let i = 0; i < 90; i++) g.add(new T.Mesh(cg, new T.MeshBasicMaterial({ color: ['#f43f5e', '#f59e0b', '#22c55e', '#38bdf8', '#a855f7'][i % 5], side: T.DoubleSide })));
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
    const [id, cmd] = e.a;
    if (id === 'cam') return setShot(cmd, false);
    if (id === 'title') return setTitle(cmd);
    if (id === 'bg') return bgKids.forEach(r => setTokens(r, cmd));
    if (chars[id]) return setTokens(chars[id], cmd);
    const o = objs[id];
    o.cmd = cmd; o.t0 = e.t;
    if (cmd === 'fly') o.node.visible = true;
  }
  function enterScene(si, t) {
    const sc = SC[SCENE_IDS[si]];
    clearStage();
    sc.build(api);
    setTitle(sc.title);
    const init = sc.init || {};
    for (const id in chars) resetRig(chars[id], init[id]);
    bgKids.forEach(r => resetRig(r, init.bg));
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
    Object.values(chars).concat(bgKids).forEach(snapRig);
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
    if (c.s !== sceneIdx || t < lastT - .05) enterScene(c.s, t);
    else while (tlPos < timeline.length && timeline[tlPos].t <= t) doAct(timeline[tlPos++]);
    lastT = t;
    if (i !== cueIdx) { cueIdx = i; ui.who.textContent = { n: '또박이', jun: '준이', sol: '솔이' }[c.who]; ui.who.dataset.who = c.who; ui.text.textContent = c.text; }
    const speaking = !audio.paused && t >= c.v0 && t <= c.v1;
    amp += ((speaking ? (+ENV[Math.floor(t * 30)] || 0) / 9 : 0) - amp) * Math.min(1, dt * 22);
    const who = { n: 'mascot', jun: 'jun', sol: 'sol' }[c.who];
    for (const id in chars) applyRig(chars[id], dt, id === who ? amp : 0);
    bgKids.forEach(r => applyRig(r, dt, 0));
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
  function state() { ui.play.textContent = audio.paused ? '▶ 재생' : '⏸ 일시정지'; }
  function toggle() {
    if (failed) return;
    ui.end.hidden = true;
    if (audio.paused) audio.play().catch(() => { ui.text.textContent = '영상을 불러오지 못했어요. 새로고침해 주세요.'; });
    else audio.pause();
  }
  function mute(m) { audio.muted = m; ui.sound.textContent = m ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'; }
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
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene(); scene.background = new T.Color('#fdf3dc');
    camera = new T.PerspectiveCamera(35, 16 / 9, .1, 60);
    buildRoom(); buildCast();
    const st = { text: '' }, tex = canvasTex(2496, 180, ctx => {
      ctx.font = `800 104px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fefce8';
      ctx.fillText(st.text, 1248, 94);
    });
    titleObj = { st, tex };
    const tp = plane(tex, BOARD.w, 90 * PX); tp.position.copy(b2w(930, 108, .012)); scene.add(tp);
    new ResizeObserver(resize).observe(canvas);
    document.fonts?.load(`800 40px Pretendard`).then(() => { sceneIdx = -1; }).catch(() => {});   // 글꼴이 늦게 오면 카드를 다시 그린다
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

  return { init, open, close, check, debug: () => ({ chars, cam, objs, sceneIdx, renderer }) };
})();
