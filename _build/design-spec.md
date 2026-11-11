# 디자인 스펙 — "시험지·OMR 답안지"

**방향:** 크림색 시험지 위에 남색 잉크로 인쇄하고, 빨간펜으로 채점한 화면. 메뉴는 문항 번호, 선택은 OMR 마킹, 결과는 채점 도장.

**금지:** 민트/청록(#14b8a6 계열), 보라·인디고, 그라디언트 배경, 이모지 아이콘(UI·SVG 소품·칠판 카드), 알약 배지(radius 999), 반경 8px 넘는 카드, 같은 크기 카드 격자, 가운데 정렬 히어로, 흰 카드+옅은 그림자 반복, 원색(#3b82f6·#22c55e·#f43f5e 등 Tailwind 기본값).
**허용 예외:** 원(radius 50%)은 OMR 칸·도장·마스코트에만 쓴다.

---

## 1. 토큰 (index.html `:root`에 둔다. 이름 고정)

```css
@import url("https://fonts.googleapis.com/css2?family=Hahmlet:wght@600;800;900&family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap");
:root{
  --paper:#f4eedf;   /* 시험지 바탕 */
  --sheet:#fffdf7;   /* 답안지 면 */
  --ink:#1f2a44;     /* 남색 잉크: 본문·제목 */
  --ink-2:#4e5770;   /* 보조 글자 (paper 위 7:1 이상) */
  --rule:#cfc5ad;    /* 괘선 */
  --red:#d6322b;     /* 채점 빨간펜·OMR 인쇄색 */
  --pencil:#f2b42c;  /* 연필 노랑·형광펜 */
  --marker:#16161a;  /* 컴퓨터용 사인펜(마킹 채움) */
  --red-soft:#d6322b1f; --pencil-soft:#f2b42c40;
  --font-display:"Hahmlet","Nanum Myeongjo",serif;          /* 제목·숫자·점수 */
  --font-body:"IBM Plex Sans KR","Malgun Gothic",sans-serif; /* 본문·버튼·자막 */
  --r-sm:2px; --r-md:4px; --r-lg:6px;
  --shadow-paper:0 1px 0 var(--rule),0 10px 20px -14px #1f2a4459;
  --line:1px solid var(--rule); --line-ink:2px solid var(--ink);
}
```
- A는 기존 변수명(`--primary --surface --border --text --text-muted --bg --success --danger --r-full` 등)을 지우지 말고 **새 토큰 별칭**으로 다시 정의한다(scene.css가 쓰고 있음). 예: `--primary:var(--ink); --surface:var(--sheet); --bg:var(--paper); --border:var(--rule); --text:var(--ink); --text-muted:var(--ink-2); --danger:var(--red); --success:var(--ink); --warning:var(--pencil); --r-full:var(--r-md);` Pretendard `<link>`는 삭제.
- 숫자는 항상 `font-variant-numeric: tabular-nums`.

---

## 2. 담당 파일 (서로 겹치지 않기)
| 팀 | 파일 | 범위 |
|---|---|---|
| A | `index.html` | 토큰, 헤더, 홈, 한눈에 보기, 퀴즈, 마크업 속 이모지 제거 |
| B | `assets/kit.js`, `assets/game.js`, `assets/scene.css` | SVG 교실·캐릭터·소품, 게임 HUD·드롭존, **영상 자막바·컨트롤바·큰 재생 버튼·엔드카드**(scene.css에 있음) |
| C | `assets/video3d.js` | 3D 조명·재질·배경·칠판 카드·마스코트 |

공통: ID·클래스명·함수 시그니처·데이터·대사·타이밍 변경 금지(선택 인자 추가는 허용). `exam-honesty.html`은 아무도 손대지 않는다(나중에 재빌드).

---

## 3-A. index.html

**헤더:** 흰 바 대신 `--paper` 바탕 + 하단 `--line-ink` 한 줄과 그 아래 1px `--rule`(시험지 상단 이중선). 브랜드 `📝` 제거 → 왼쪽에 작은 글자 `2학기 정기고사` (ink-2, body 500) + 줄바꿈 없이 `학생 유의사항`(display 800). 모드 전환 `.seg`: 알약 대신 OMR 칸 2개 — 각 버튼 앞 `::before`로 18px 원(테두리 2px `--red`), `aria-pressed=true`면 원을 `--marker`로 채움. 버튼 배경은 투명, 테두리 없음. 전체화면·처음으로 버튼은 `.btn--ghost`(밑줄 텍스트 버튼).

**버튼:** `.btn` = `--ink` 바탕, `--sheet` 글자, radius `--r-sm`, 높이 48px, body 700. hover는 `--marker`. `.btn--ghost` = 투명 바탕, ink 글자, 아래 2px `--ink` 밑줄(`box-shadow: inset 0 -2px 0`), hover 시 `--pencil-soft` 형광펜 배경.

**`.badge`:** 알약 금지. 1.5px `--ink` 테두리 사각 라벨, radius 0, body 700 `--fs-sm`, 자간 .04em.

**홈 히어로:** 좌측 정렬 2단(≥768px: 1.6fr / 1fr, 아래 정렬). 왼쪽: 배지 텍스트 → `시험 전 10분 교육` 그대로, 그 아래 h1(display 900, `clamp(2.6rem,6vw,4.2rem)`, 자간 -.03em). h1 마지막 단어 `실력.` 아래에 `--pencil` 형광펜 밑줄(배경 linear 하단 35%). `.lead`는 ink-2. 오른쪽 `.qr.card`는 **수험표**: `--sheet` 바탕, 2px `--ink` 테두리 + 안쪽 4px 간격 1px 테두리(outline-offset 이용), radius 0, 상단에 `수험표` 작은 라벨 띠(ink 바탕, sheet 글자). QR 오른쪽 위에 지름 64px 빨간 원형 도장 `::after`(테두리 3px `--red`, 글자 `확인`, display 900, rotate(-12deg), opacity .85). 히어로 아래 전체 폭 이중선(2px ink + 3px 간격 + 1px ink).

**메뉴 5개(`.menu`):** 카드 격자 폐지 → **문항 목록** 1열. 각 `a.card`는 배경 투명, 테두리 없음, 아래 `--line`만, 패딩 20px 0, 그림자 없음. 행 구조: `[번호] [제목+설명] [OMR 5칸]`.
- `.ico` 안의 이모지를 `1`~`5` 숫자로 교체(마크업). 스타일: display 900, 2.6rem, ink, 폭 3.5rem, 배경 없음, 숫자 뒤 `.` .
- 제목 h2: display 800 `--fs-xl`. 설명 p: body ink-2.
- 오른쪽(≥640px): `::after`로 OMR 5칸 `①②③④⑤`를 그리거나 span 추가 — n번째 칸만 `--marker` 채움, 나머지는 `--red` 1.5px 테두리 원(지름 22px). 모바일은 숨김.
- 첫 행(영상)은 강조: 위에 `--line-ink`, 제목 옆 `[약 3분]` 배점 표기 스타일(설명 그대로 두고 CSS만).
- hover/focus: 행 배경 `--pencil-soft`, 번호를 `--red`로.
- 목록 왼쪽에 시험지 여백선: `.menu { border-left: 2px solid var(--red-soft); padding-left: 16px }`.

**한눈에 보기:** 카드 6장 → 한 장의 시험지. `.notes`를 `--sheet` 바탕 1개 면(2px ink 테두리, `--shadow-paper`), 안의 `.card`는 테두리·그림자·배경 없음, 칸 사이 `--line`. ≥768px 2단, 단 사이 세로 1px `--rule`(시험지 2단 편집). h2의 이모지 제거, 앞에 번호 사각 `counter()`(24px, 1.5px ink 테두리, display 800). 금지 품목 h2 뒤에 빨간 사각 도장 `금지`, 가능 품목 뒤에 ink 사각 도장 `가능`(::after). `.notes b`는 `--red` + 굵게(밑줄 없음).

**퀴즈:**
- `.meta`: 왼쪽 `문 3` 형태는 기존 텍스트 그대로, display 800. `.bar`: 높이 6px, 트랙 `--rule`, 채움 `--ink`, radius 0.
- `.question`: display 800 `--fs-xl`, 앞 왼쪽 여백 빨간 세로선 3px.
- `.opt`: OMR 행. `--sheet` 바탕, 1px `--rule` 테두리, radius `--r-sm`, 왼쪽 padding 64px, `::before`로 28px 원 칸(1.5px `--red`) — 보기 순서 번호는 `counter(opt, decimal)`로 원 안에 표시(red, 700). hover: 원 안을 `--pencil-soft`.
- `.opt.right`: 원을 `--marker`로 채움(번호 흰색) + 행 바탕 `--pencil-soft` + 오른쪽 끝 `::after`로 빨간 동그라미(40px, 테두리 4px `--red`, 살짝 rotate(-8deg), 한쪽이 덜 닫힌 느낌은 `border-right-color: transparent`).
- `.opt.wrong`: 행 바탕 `--red-soft`, `::after`로 빨간 빗금 `/`(display 900, 2.4rem, red). 글자색은 ink 유지(가독성).
- `.opts.two`(O/X): 보기 높이 120px, 글자 display 900 3rem, 원 칸 없음.
- `.why`: 왼쪽 3px `--red`, 바탕 `--sheet`, `.why.bad`도 같은 레이아웃에 바탕 `--red-soft`.
- `.result .num`: display 900 5rem `--red`, `::after` 빨간 이중 밑줄, 숫자 주위 빨간 원 테두리 4px rotate(-6deg)(채점 점수). `.miss`는 오답노트처럼 왼쪽 빨간 여백선.

**TV 모드(`html.tv`):** 바탕은 그대로 크림(밝은 교실에서 반사 적음), `--ink-2`를 `#353d52`로 진하게, 괘선 2px, `.menu` OMR 칸·hover 효과 숨김, 메뉴 번호 3.4rem. 정답·풀이를 미리 보여주는 요소 추가 금지(현행 흐름 유지).

`prefers-reduced-motion` 규칙 유지.

---

## 3-B. 게임 SVG (1600×900) + scene.css

**공통 그리기 규칙**
- 외곽선: 인물·소품 `#2a2522` 4px, `stroke-linejoin:round`. 배경 사물은 외곽선 없이 면만(깊이감), 혹은 2px 같은 계열 어두운 색.
- 음영 1단계: 빛은 왼쪽 위(창문). 각 면의 오른쪽/아래 30%에 기본색보다 18% 어둡고 약간 차가운 색 한 덩어리. 하이라이트는 화면·유리에만 흰색 .5 사선 1개.
- 반경: 기기 ≤8, 종이 2, 가구 4.

**팔레트**
| 용도 | 값 |
|---|---|
| 벽 위 / 벽 아래(걸레받이 높이 패널) / 몰딩 | `#ece4d3` / `#cdbd9f` / `#8a6a48` |
| 바닥 판재 / 판재 틈 / 판재 그늘 | `#c39062` / `#8c6440` / `#b07f53` |
| 창틀 / 하늘 / 빛 줄기 | `#f7f3ea` / `#cfe3e6` / `#fff6dc` opacity .14 |
| 사물함 / 이음선 | `#8fa3b5` / `#6e8295` |
| 게시판 코르크 / 공지 종이 | `#b88b5c` / `#fffdf7`(잉크 줄 3개) |
| 책상 상판 / 옆면 / 다리 | `#d7a86e` / `#a8733f` / `#6b6f78` |
| 피부 5종 | `#f6d2b4 #eec3a1 #e2b08a #f9dcc4 #d9a27c` |
| 머리 7종 | `#1d1a19 #2e2420 #4a3426 #6b4a33 #151820 #3b2c26 #5a4636` |
| 교복 재킷 6종 (`SHIRT` 대체) | `#2c3a5c #3d4f3a #5a3d3a #6f7682 #2f4b5e #7a5a3a` |
| 셔츠 깃 / 넥타이·리본 | `#fffdf7` / `#b8322b` |
| 소품: 기기몸체 / 꺼진화면 / 금속 / 펜파랑 / 가방천 | `#3a3f4b` / `#9fc6c9` / `#b9bcc2` / `#2b4fa8` / `#34507a` |

**교실 배경(`K.bgBack/bgFront`, game.js `room`)** — 소실점 (800, 300).
- 벽 0–380, 아래 260–380은 패널 색 + 몰딩 6px. 벽 왼쪽에 창 2개(창틀 12px, 십자 창살), 창에서 바닥 쪽으로 사다리꼴 빛 줄기 2개.
- 바닥: 380–900 사다리꼴 채움, 판재 선을 소실점에서 방사(x = -400…2000, 160 간격), 가로 이음선은 아래로 갈수록 간격 넓게(400, 430, 475, 540, 630, 760). 바닥 앞쪽 10%는 `#000` .06 비네팅 사각.
- 게시판: 코르크 + 기울어진 공지 종이 4장(포스트잇 원색 금지) + 빨간 압정. 글자 `우리 반 게시판`은 ink, display 800.
- 사물함: 위 팔레트, 문 손잡이 가로 막대.
- 2단계 학생 줄: 뒷줄일수록 책상 상판을 소실점 쪽으로 좁힌 사다리꼴, 뒷줄 전체 `opacity .92` + 채도 낮춤 대신 색을 벽색 쪽으로 10% 섞기.

**학생(`K.kid`)** — 비율 머리:몸 = 1:1.5(지금보다 머리 12% 작게, 목 추가, 어깨 폭 +15%).
- 교복: 재킷 + V자 흰 셔츠 깃 + 넥타이/리본(짝수 index 넥타이, 홀수 리본).
- 얼굴: 흰자 큰 눈 대신 세로 타원 눈(ink, 9×13) + 작은 흰 반사점 1개, 볼터치 opacity .22, 입은 3.5px 선. 눈썹은 4px 짧은 선.
- 머리카락은 앞머리 덩어리 + 음영 1조각.
- 선택 인자 `skin` 추가(기본값 기존 SKIN). game.js는 index로 피부·머리·재킷을 고르게 섞음(`HAIR`, `SHIRT` 배열 값만 교체).

**소품(`P`)** — `emo()` 사용처 전부 직접 그린 SVG로: phone, camera, radio, headset, pencil, book, note, books, bag, bell, lock, locker, toilet, paper, ask(든 손), hush(입 가린 손 대신 "쉿" 말풍선에 사선), stack, hands, law(저울), basket(→ 답안지 **제출함**: 사각 상자, 앞면에 `제출` 글자), mp3의 `🎵`도 음표 path로. 크기 약 120×120, 위 규칙(외곽선 4px, 음영 1단계). 기존 pen/watch/calc 등도 같은 색·외곽선 규칙으로 정리. `emo` 함수는 폴백용으로만 남김.

**채점 표시(`K.mark`)** — 흰 원 배지 폐지. `o`: 빨간 손그림 동그라미(stroke 9, `--red`, 끝이 살짝 겹치는 path, 채움 없음). `x`: 빨간 두 획 사선(stroke 11). 뒤에 `#fffdf7` .85 원(r 34)을 깔아 어떤 배경에서도 보이게.

**적발 스탬프(`.k-stamp`)** — 내용만 교체: 빨간 사각 도장 160×70, 바깥 6px + 안쪽 2px 이중 테두리, 글자 `적발` display 900 44px, rotate(-12), opacity .9. 클래스·위치·애니메이션 유지.

**말풍선(`.k-bub`)** — 흰 → `#fffdf7`, 외곽선 3px `#2a2522`, rx 10, 꼬리는 뾰족한 삼각형. 글자 body 700 ink. 시간 막대 `.k-time`은 `--pencil`.

**`tile`/칠판 카드(SVG)** — rx 20 → 3, `#fffdf7`, 2px `#2a2522` .9, 왼쪽 위에 마스킹테이프(`#f2e2a8` .85, rotate -6) 한 조각.

**드롭존(game.js `ZONES`)** — color 교체: bag `#1f2a44`, submit `#d6322b`, desk `#b9831a`. rx 26 → 6, 점선 `stroke-dasharray:14 10` 4px, 바탕 `#fffdf7` .6. 라벨 display 800, 보조글 ink-2. `.zone.hot`: 실선 8px + 바탕 `#f2b42c40`.
드래그 물건: 흰 원 → `#fffdf7` 원 + 3px ink 테두리(OMR 칸 느낌), 이름표 rx 17 → 3, 바탕 ink. `.ring-sel` stroke `#d6322b`, 점선.

**HUD·게임 오버레이(scene.css)** — `.hud .score` display 900 `--red`(채점 점수). `#gHearts` 문자열을 `●`/`○`로 바꾸고 `.hud .hearts{color:var(--red)}`(개수 로직 그대로). `.combo` 알약 → 사각 도장(1.5px 테두리, radius 0), `.hot`은 `--pencil` 바탕 ink 글자. `.toast` radius `--r-sm`, 기본 ink, good은 ink+왼쪽 6px pencil 띠, bad는 `--red`. `.overlay` `#1f2a44e6`. `.banner` display 900, 글자 sheet + ink 그림자 3px(블러 없음). `.fx-pop` good `#1f2a44`, bad `#d6322b`, combo `#b9831a`. `.timebar` 트랙 rule, 채움 pencil, radius 0. `.scene-svg text` 폰트 `var(--font-body)`. `.scene-svg/.scene-canvas` 바탕 `#ece4d3`, radius `--r-lg`.

**영상 플레이어 크롬(scene.css)** — `.player`: 바탕 `--sheet`, 2px ink 테두리, radius `--r-md`, 그림자 `--shadow-paper`. `.cap`: 위쪽 `--line`, 글자 body 700 `--fs-xl`. `.cap .who` 사각 이름표(radius 0, display 800): 또박이 = pencil 바탕 ink 글자, `jun` = ink 바탕 sheet 글자, `sol` = 1.5px red 테두리 red 글자. `.vbar`: range `accent-color: var(--red)`, 시간 tabular. `.bigplay`: 지름 112px OMR 칸(바탕 sheet .92, 테두리 4px `--red`, ▶는 `--red`), hover 시 바탕 `--marker`·▶ 흰색. `.endcard`: 바탕 `#f4eedff2`, 글자 ink, h2 display 900.

---

## 3-C. 3D 영상 (three.js r149, video3d.js)

**렌더러:** `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.05`, `outputEncoding = sRGBEncoding`(유지). `setPixelRatio(Math.min(devicePixelRatio, 1.5))`. 저사양(`hardwareConcurrency<=4` 또는 화면 짧은 변<820): 그림자 맵 1024, 아니면 2048. `scene.background = #e9e1cf`, `scene.fog = new Fog('#e9e1cf', 10, 20)`.

**조명:** Hemisphere(하늘 `#fff4e4`, 땅 `#7d6146`, .5) + 주광 Directional(`#ffe6bf`, 1.4, 창문 쪽 `(-4, 5.5, 1.5)`, 그림자, bias -.0004, radius 4) + 보조 Directional(`#d6e4ff`, .3, 칠판 쪽 앞에서, 그림자 없음).

**재질(roughness 기본 .85, metalness 0):**
- 벽 위 `#ece4d3`, 벽 아래 0–0.9m 패널 박스 `#c9b79a` + 몰딩 `#8a6a48`, 옆벽 `#e3d8c2`.
- 바닥: canvas 판재 텍스처 — 바탕 `#c39062`, 판마다 밝기 ±6% 무작위(seed 고정), 틈 `#8c6440` 2px, roughness .7.
- 칠판 `#24463b` roughness 1 + 분필 얼룩 텍스처(흰 원형 그라데이션 alpha .04 × 8개). 틀·분필받이는 알루미늄 `#b8bcc0`(metalness .4, roughness .45) — 주황 나무틀 폐지.
- 사물함 `#8fa3b5`(metalness .15, roughness .6). 게시판 코르크 `#b88b5c` + 크림 공지 종이(원색 포스트잇 폐지), 글자 ink.
- 교탁 `#a8733f`, 상판 `#d7a86e`.

**배경 요소:** 창 유리는 `#cfe3e6` emissive .6 유지 + 창마다 빛 줄기 평면 1장(MeshBasic `#fff6dc`, opacity .08, AdditiveBlending, depthWrite false, 바닥으로 기울임). 창 아래 라디에이터 박스 1개(`#d9d4c8`) 정도만 추가 — 그 이상 소품 추가 금지(성능).

**칠판 카드(`cardTex`, `textTex`):** 둥근 흰 카드 → **잘라 붙인 시험지 조각**. 바탕 `#fffdf7`, radius 4, 테두리 2px `#2a2522` alpha .85, 왼쪽 위 빨간 자석(지름 h×.14 원, `#d6322b`, 위쪽 흰 반사점), 아래쪽 1px `#cfc5ad` 괘선 1줄. 아이콘은 B가 다시 그린 `K` 소품을 그대로 사용(이모지 없음 — B 완료 후 확인). 라벨 Hahmlet 800, `#1f2a44`. `textTex` sticker radius `size*.5` → 4. 칠판 제목 글씨 `#f4f1e8` Hahmlet 900. O/X 표시는 B의 `K.mark`를 따른다.
**FONT:** 본문 `'"IBM Plex Sans KR","Malgun Gothic",sans-serif'`, 제목용 상수 `TFONT='Hahmlet, serif'` 추가. 끝부분 `document.fonts.load`는 두 글꼴 모두 기다리게.

**마스코트(연필):** 몸통 육각기둥(Cylinder radialSegments 6) `#f2b42c` roughness .5, 깎은 나무 `#e8c9a0` roughness .85, 심 `#2a2522`, 쇠 띠 `#c0c4c8` metalness .6 roughness .35, 지우개 `#e58a8a`. 볼터치 opacity .25. 팔은 ink 색 유지.
**학생 3D:** 머리·피부·교복 색은 3-B 팔레트와 같은 값 사용(재킷+흰 깃).
**꽃가루(confetti):** `['#d6322b','#f2b42c','#1f2a44','#fffdf7','#2b4fa8']`.
**말풍선·이름 스티커:** `#fffdf7` + 2px `#2a2522`.

피사계 심도·후처리·환경맵은 쓰지 않는다(태블릿 성능).
