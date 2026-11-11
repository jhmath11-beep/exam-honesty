# 설계서: 3D 영상 리그 재구성 + 게임 2단계 말풍선 제거

참조: assets/video3d.js, assets/kit.js, assets/game.js, assets/scene.css, assets/cues.js, _build/make_single.py, index.html(206행 reduced-motion 규칙)

## 0. 대원칙
- 영상: 치비 외형 유지. 관절 계층을 다시 짜고 토큰마다 "목표 자세 + 루프 + 1회 클립"을 붙여 연기를 넣는다. toon 음영 + 외곽선, 샷 4개 재배치.
- 게임 2단계: 학생 위 글자 말풍선 제거 → 자세·소품·리듬으로만 행동 구분.
- 재사용: 기존 스프링 엔진(rig.tgt→rig.cur), setTokens, K.set 클래스 토글 구조를 확장. **새 JS/CSS 파일 금지**(make_single.py가 n_js==5 assert).
- reduced-motion: index.html 206행 `* { animation:none !important }` → 게임의 모든 행동은 **멈춘 자세 한 장만으로 구분**되어야 한다. 움직임은 보조 신호.

## A. 영상 리그 (video3d.js makeKid ~324~376 교체)

### A-1. 관절 계층과 피벗 (학생 로컬, m, 앞=+z)
```
root (의자·책상은 root 직속 정적 소품)
├ hips      [0,.49,0]        plX(체중이동), plYaw
│ └ spine   [0,.04,0]        bLean / bYaw / bRoll
│   ├ neck  [0,.46,0]        h* 의 35%
│   │ └ head [0,.08,0]       나머지 65% (월드 y 1.07 = 기존 head와 동일)
│   ├ shP/shN [±.20,.41,0]   위팔(cap .052, l .22): Sx 앞뒤, Sz 벌림
│   │ └ elbow [0,-.22,0]     아래팔(l .24): Ex
│   │   └ wrist [0,-.24,0]   손(sph .055): Wx(새 채널)
├ thighL/R  [±.10,.50,-.01]  기본 rot.x=-π/2, 길이 .34
│ └ knee    [0,-.34,0]       기본 rot.x=+π/2, 길이 .44
│   └ ankle [0,-.44,0]       신발(기존 비율, z +.05)
```
- 다리는 hips가 아니라 root에 붙인다(숙여도 엉덩이가 의자에서 뜨지 않게).
- 팔 회전 규칙은 기존 그대로(Sx<0 앞으로, Sz>0 바깥, n쪽 -nSz) → 기존 TOK 숫자를 출발값으로 사용.

### A-2. 외형 유지
- add() 호출의 지오메트리·색·크기·상대 오프셋 유지. 부모만 바꾸고 바뀐 부모의 월드 오프셋만큼 y를 뺀다.
  - 몸통 cap: body .27 → spine .23 / 깃 토러스·V깃·넥타이·리본: y -.04 / 목 cyl: body .55 → neck .05
  - head 그룹 내부(머리·머리카락·얼굴·땀·이어폰) 수정 0줄.
- 소품: pen, lap, note, palm → wrist로, y +.24. held → wrist 기준 y -.10. watch는 elbow 유지.
- 머리·피부·재킷·넥타이 색, 머리 스타일 5종(short/bob/pony/twin/curly) 분기 유지.
- 확인: 리그 교체 전후 kids 샷 정지 자세(arm-rest, look-c) 머리·몸통 윤곽 동일.

### A-3. 표정·입
face() 메시 그대로(head 따라감), amp→open/smile 유지. 추가:
- 말하는 중 browL += talk*.012
- 말하는 학생이 arm-rest이고 writing이 아니면, amp가 .35를 넘어 오르는 순간 p팔 손짓 1회(.4s, pSx -.3, pEx +.3), 1.2s 안에 1번만.

### A-4. toon 음영 + 외곽선 (학생·마스코트만. 교실 재질 유지)
- MeshToonMaterial + gradientMap: DataTexture RGBA 3×1 [110,190,255], Nearest, mipmap 끔.
- makeKid/makeMascot 안에서만 toon 버전 mat(캐시 키 분리). **roughness/metalness/flatShading 키는 지우고 넘김**(three 경고 방지). emissive/side/transparent/opacity 유지.
- 마스코트 육각 몸통(flatShading 쓰던 부분): geo.toNonIndexed(); computeVertexNormals().
- 외곽선 inverted hull: 공용 MeshBasicMaterial({color:'#2a2522', side:BackSide}) 1개, onBeforeCompile에서 `transformed += normal * 0.011;`. 같은 지오메트리 메시를 대상의 자식으로, castShadow=false.
  - 붙이는 곳: 머리 구, 귀, 앞머리 타원, pony/twin/curly 덩어리, 몸통, 위팔·아래팔·손, 허벅지·정강이·신발, 마스코트 몸통.
  - 안 붙이는 곳: 머리카락 껍질(DoubleSide 열린 구), 얼굴 부품, 의자, 책상.
  - 저사양(low, 기존 ~368행 판정)에서는 배경 학생 외곽선 생략.

## B. 동작 사전

### B-1. 채널과 스프링
| 그룹 | 채널 | k / d |
|---|---|---|
| 눈 | eX, eY | 400/40 |
| 얼굴 | eOpen, curve, mO, brow, browL | 160/22 |
| 머리 | hPitch, hYaw, hRoll(새) | 90/17 |
| 팔 | pSx,pSz,pEx,pWx(새),nSx,nSz,nEx,nWx(새) | 70/15 |
| 몸 | bLean,bYaw,bRoll, plX,plYaw,slump,tense(새) | 35/11 |
| 다리 | kneeL,kneeR(새) | 50/13 |
- dt > 1/60이면 2회로 나눠 적분.
- 뼈 적용: hips position.x=plX, rotation.y=plYaw+.25·bYaw / spine (bLean+.12·slump+.1·tense+숨, .75·bYaw, bRoll) / neck·head는 h*를 .35/.65 분배 / 어깨 `sh.rotation.set(Sx,0,±Sz-.06·slump-.08·tense)` / wrist.rotation.x=Wx / thigh.rotation.x=-π/2-knee, shin.rotation.x=π/2+.6·knee.

### B-2. 레이어
- 최종값 = 스프링(tgt) + 루프(t) + 1회 클립(u). 1회 클립 `rig.clips.push({name,t0})`, 키프레임 사이 smoothstep.
- 되감기: doAct(e)가 `setTokens(rig, cmd, ago)`로 ago = audio.currentTime - e.t 전달, t0 = clock - ago. caughtAt, jumpAt도 같은 방식.

### B-3. 토큰 표 (SC 블록 문자열은 바꾸지 않음)
팔:
| 토큰 | 목표 자세(기존값+추가) | 루프 / 1회 |
|---|---|---|
| arm-rest | REST + nWx .2, pSz +.05 | 없음 |
| arm-up | 기존(pSx -2.9,pSz .5,pEx -.15) + bRoll -.06, hPitch -.08 | 1회: 0~.12s 어깨 Sx +.15 → .45s 목표. 루프: pWx ±.15 2Hz 처음 1.2s만 |
| arm-down | 기존 + bLean -.05 | 1회: writing에서 바뀔 때 0~.12s nWx -.3 들었다 놓기 |
| arm-palm | 기존 + nWx -.6 | 루프 2.4s: 0~1.6 응시 → 1.6~2.0 nSx +.25로 내리고 eY +.6 → 복귀 |
| arm-slip | 기존 + bLean +.18 | 루프 3s: 2.4~2.8s hPitch -.35(눈치). 쪽지 nWx ±.08 3Hz |
| arm-hold | 기존 | 루프 pWx ±.06 1.6Hz |
| arm-cheer | 기존 | 루프 pEx/nEx ±.3 4Hz 엇박 |
| arm-point(마스코트) | 기존 | 1회: pSz +.12 두 번(.15s 간격) |
| arm-wave(마스코트) | 기존 루프 | |

표정:
| face-smile | slump 0, tense 0 |
| face-sad | slump .8 |
| face-sweat | slump .4, 루프 hYaw ±.05 1.3Hz |
| face-o | hPitch -.05 |
| face-shock | 1회 움찔: 0~.12s bLean -.15, hPitch -.12, 두 어깨 Sx +.1 → .6s 복귀 |
| face-sly | hRoll +.08, 루프 3s마다 eX 카메라 쪽 .3s |
| face-angry | tense .7 |

시선:
| look-c | 0 |
| look-u | 기존 + bLean -.04 |
| look-d | 기존(hPitch .42, eY -.5, bLean .12) |
| look-n | 기존 + bYaw n·.12 |
| look-palm | 기존 + hRoll -.06 |
| peek | 기존 + plX n·.05. 루프 2.6s: 70~85% 구간 hYaw -n·.6만큼 되돌려 감독 쪽 흘끔 |

플래그(`!x` 해제 방식 유지):
- writing: 1.6s 한 줄 주기 u=frac(t/1.6+seed). nSz += -.10+.2u(마지막 12%는 빠르게 복귀), nSx += .02·sin(2π·7t), nEx += .05·sin(2π·5.3t+seed), hPitch += .02·sin. 4줄마다 .4s 멈추고 nWx -.15.
- wiggle: plX ±.03 4Hz, kneeL/R 교대 ±.1 5Hz, bRoll ±.05
- flip: 기존 종이 애니메이션 + n팔 nSx -.75, nEx -1.1을 종이 위상(sin(t·5+s))에 맞춤
- caught: face-shock 움찔 + 기존 도장
- cheer: root가 아니라 hips.y 튕김 + knee +.15
- jump, wave, nopaper, nopen, hold-phone, has-watch, has-ear, yawn: 기존 유지
- has-phone: + nWx ±.05 탭 3Hz, 화면 emissiveIntensity .3~.7 깜빡
- bub:* 영상 말풍선은 유지

공통 대기: 숨쉬기 spine pitch +.012·sin(2πt/3.6+seed)(기존 body.scale.y 삭제) / 깜빡임 20% 확률 두 번 / 시선 hash(seed, floor(t/2.4))로 eX,eY ±.15(되감기 결정적) / plYaw ±.035 7s 주기.

### B-4. 장면 전환
- frame()에서 `snap = sceneIdx<0 || t<lastT-.05 || t-lastT>.5`. enterScene(si,t,snap)은 snap일 때만 snapRig. 이어 재생 시 resetRig가 tgt만 바꿔 ~.4s 블렌딩. 카메라는 컷.

## C. 카메라와 배경 학생
장면별 샷: intro host,wide / ban jun,floor→board,board×2 / ok sol,board×3 / bag floor→board×2 / during jun,jun→board,board,jun,board,kids,sol / bell wide→kids,jun,jun→board,board,kids / omr kids→board,board×3 / essay sol,board×2 / cheat board,kids×9,board / outro board,kids,host
- 샷 이름·beat cam 값 불변, 좌표만 변경. 앞 샷은 계속 z<0(front 판정이 부호 사용).

| 샷 | 위치, 바라보는 곳 |
|---|---|
| wide | [.5,3.0,3.3], [.5,1.2,-3.2] (가림 해결) |
| jun | [-.6,1.4,-2.3], [.1,1.05,0] |
| sol | [1.6,1.4,-2.3], [.9,1.05,0] |
| kids | [.5,1.55,-3.3], [.5,1.2,0] |
| board, floor, host | 유지 |
- 배경 학생: x [-1.6,.5,2.6], z 1.75 → 1.9.
- 가림 기준: 뒤 샷(z>0) 배경 학생 머리 NDC가 화면 밖이거나 y>-.3. 앞 샷은 배경 학생 머리 화면 원이 jun/sol 머리 원과 안 겹침.
- debug() 반환에 bgKids, SHOTS, camera 추가.

## D. 게임 2단계 행동 시각 사전 (kit.js K.kid + scene.css + game.js)

### D-1. kit.js kid() 구조 (기존 부품 삭제 없이 감싸기·추가)
```
k-in
├ k-body  (새 래퍼: back 머리, 목, 몸통, 깃, 넥타이/리본, k-head)
├ k-desk, k-paper(+k-sheet), k-book(새), k-glow(위치 이동)
├ k-arms  (새 래퍼: 기존 k-rest/k-down/k-up/k-palm/k-slip + 새 k-a-*)
├ k-bub(영상·1단계용 유지), k-stamp
├ k-time  (k-bub 밖으로: 책상 앞 아래 x -66, y 132, 글자 없는 막대)
└ k-hit
```
- 몸 기울이기는 k-body와 k-arms에 같은 keyframes·같은 delay. 피벗 `transform-box:view-box; transform-origin:0 -30px`.
- 방향 있는 팔 묶음은 오른쪽(+x) 기준으로 그리고 `transform:scaleX(var(--sx))`(origin 0 0). `.side-l{--sx:-1}`, `.side-r{--sx:1}`.
- 한 요소에 transform 애니메이션 하나만. 겹치면 `<g>` 추가.
- 모든 a-* 클래스는 정적 transform(멈춘 자세)을 먼저 정의하고 keyframes를 그 위에.

새 부품(기본 숨김):
- k-sheet(k-paper 안): 윗띠 `M-62-36H50L53-28H-65Z` #f6dcd6 / OMR 2행×5열 타원 rx6 ry4 테두리 #d6322b 1.5 / `.k-omr-f1~f5` #16161a 칠 / `.k-name` 윗띠 위 파란 낙서(stroke-dash) / `.kid.pre .k-paper` scale(1.6)
- k-book: 책상 오른쪽 x 80~190, y -36~2. 닫힘 `.k-book-c` #34507a 표지+흰 띠, 펼침 `.k-book-o` 흰 두 쪽+파란 낙서. `.kid.pre`일 때만.
- k-uglow: k-head 안 ellipse(0,-215,58,34) #9fc6c9 (휴대폰 빛이 얼굴 아래)
- k-glow 이동: (-28,12) 책상 앞판 위끝
- k-ear 이동: 오른쪽 귀 (78,-258)
- 새 팔 묶음(손 r 18~20, 소매는 기존 sleeve() 재사용):
| 묶음 | 소매 경로 | 손 | 기타 |
|---|---|---|---|
| k-a-phone | 양손 가운데 | (±24,18) | |
| k-a-watch | 왼팔 M-92-140Q-120-96-30-104 | (-18,-108) | 시계 (-52,-112) 화면 빛 |
| k-a-ear | 오른팔 M92-140Q130-200 84-250 | (80,-258) | |
| k-a-chin | 오른팔 M92-140Q120-150 30-190 | (14,-196) | |
| k-a-yawn | 오른팔 M92-140Q118-170 18-214 | (24,-222) | |
| k-a-tap | 오른팔 M92-140Q130-80 150-18 | (150,-4) | .k-knock 짧은 호 2개 (196,-30) |
| k-a-demand | 오른팔 M92-140Q170-150 230-120 | 주먹 (240,-118) r20 | .k-anger 빨간 꺾쇠 (60,-350) |
| k-a-tape | 오른손 + 수정테이프(P.tape .22배) | | .k-tapeline 흰 띠 |
| k-pen-down | 책상 위 누운 파란 펜(종료령 정상) | | |
- 기존 k-slip: 쪽지 든 손을 책상 옆 밖(-214,0)으로, 쪽지 .5배 확대.

### D-2. 행동별 신호 (cls에 토큰 추가, 방향 있으면 side-%. cheat/msg 불변)
부정행위:
| ACT(bub) | 토큰 | 멈춘 자세 | 리듬 | 구분 |
|---|---|---|---|---|
| 흘끔 | a-peek side-% | 몸 전체 옆으로(translateX 36·sx, rotate 7°·sx) + 기존 peek-% | 2.6s: 숙여 들어감 20%→유지 50%→빠른 원위치·정면 10%→유지 | 정상 중 옆 기울기 없음 |
| 똑똑/PAIR | a-tap side-% | 몸 곧게, 손이 책상 옆 모서리, 머리 옆 | 1.1s: 손 -18 들렸다 탁 ×3 + 호 깜빡 → .6s 쉼. 짝은 서로 마주 봄 | 흘끔과 달리 기울지 않음 |
| cheatnote/NOTE | a-note side-% | 손+흰 쪽지가 책상 옆 밖, 머리 깊이 숙임(translateY 18, rotate -10°) | 3s 중 2.4~2.8s 고개 번쩍(눈치). 넘기는 중이면 팔 ±260 | |
| 손바닥 | arm-palm + a-palm | 손이 얼굴 옆 바깥(왼쪽), 파란 글씨. 머리 손 쪽 | 2.4s: 65% 보기 → 손 40 내리고 정면(숨김) | 생각(턱 가운데)·하품(입 가운데)·이어폰(오른쪽 귀)과 위치 다름 |
| phone | a-phone | 양손 가운데 무릎, 청록 폰 + 얼굴 아래 청록 빛, 머리 가운데 아래 | 빛 .3~.55 맥동, 엄지 탭 3Hz | 청록은 무선기기 전용 |
| smartwatch | a-watch | 아래팔이 가슴 앞 가로지름 + 손목 청록 점, 머리 손목 쪽 아래 | 다른 손 2번 톡 → 1s 쉼 | 시계 확인(정상)은 고개만 듦 |
| headset | a-ear | 오른손이 오른쪽 귀, 흰 이어폰, 머리 손 쪽 | .5s 박자 끄덕임 | 생각은 손이 턱 아래 가운데 |
| 보여줘! | a-demand side-% | 몸 기울고 팔을 이웃 쪽으로 뻗어 주먹, 빨간 화남 표시, 화난 눈썹 | 주먹 ±12° .14s 빠르게 | 흘끔은 팔 안 씀 |
| 바꿔 | a-swap side-% | 답안지가 책상 밖 옆으로 이동, 손이 따라감 + peek-% | 2.2s: 밀기 30%→유지 30%→되돌림 30% | 면수 확인은 종이가 제자리에서 젖혀짐 |

정상:
| 질문! | arm-up + a-ask | 팔 머리 위로 곧게(가장 높은 실루엣), 웃음, 정면 | 기존 wave를 infinite |
| paper | flip + a-flip | 양손 종이 위, 머리 가운데 아래 | 기존 flip |
| 몇 시? | a-clock | 머리 오른쪽 위(rotate 10°, translate 6/-6), 눈동자 오른쪽 위, 팔 쉼 | 3s: 60% 위 보기 |
| 음… | a-chin | 손 턱 아래, 머리 -6°, 눈동자 왼쪽 위 | 1.2s 손 들썩 |
| 하암 | yawn + a-yawn | 눈 감음, 입 큰 O, 머리 뒤로, 손 입 옆 | 2.4s 몸 scaleY 1.03 기지개 |
| tape | a-tape | 손에 수정테이프, 종이 위 흰 띠 | 손 -50→+50 .7s + 띠 scaleX → .5s 쉼 |

대기 4종(idle-a~d, 자리 i의 (i*3)%4. 모든 반복에 `--ph: -${(i*.37)%3}s`):
a 쓰기(.22s)+끄덕 2.8s / b 쓰기(.3s)+머리 -5°+숨 3.1s / c 읽기: 펜 멈춤, 눈동자 -6→+6 2.6s 단계 이동 / d 쓰기(.26s)+몸 ±1.5° 4s.
금지: 대기 자세는 옆 2° 초과 기울기·팔이 책상 밖·고개 들기 없음.

### D-3. 시작종 전 / 종료령 (HUNT cls만 바꾸고 bub ''; msg/wrong/intro 유지)
- HUNT_PRE: 모두 `pre`(답안지 1.6배 + 시험지 덮임).
  - ok, i%3==0 → `pre sheet-name writing look-d face-smile`: 손이 답안지 윗띠, 파란 이름 써짐, 시험지 덮임.
  - ok 나머지 → `pre arm-down look-c face-smile`.
  - bad k=1 → `pre sheet-mark writing look-d face-sly`: 손이 OMR 칸으로 .4s마다 한 칸, f1~f5 차례로 검게. 머리가 시험지↔답안지 오감.
  - bad k=0,2 → `pre sheet-solve writing look-d face-sly`: 시험지 펼치고 낙서.
- HUNT_END: bad → `writing look-d face-sly a-late`(빠른 쓰기 .14s, 숙이고 1.8s마다 눈치) / ok → `arm-down look-c face-smile` + `.kid.arm-down .k-pen-down`.

### D-4. game.js 변경 (cheat/msg/WAVES 불변)
- ACTS, NOTE, PAIR의 cls 끝에 D-2 토큰 추가. bub 필드는 남기되 그리지 않음.
- setEvent: `K.bubble(el, act.bub)` 줄 삭제.
- idle(i): `'kid tap ' + IDLE[(i*3)%4] + ' look-d'`, --ph는 startWatch에서 style로 1회.
- hop: 방향 `chain[k+1] > chain[k] ? 'r' : 'l'`, 마지막이면 'r'.
- grab: K.set 전에 `/^(a|side|sheet|idle)-/` 클래스 제거.
- HUNT_PRE/END bad/ok는 D-3 cls + bub ''.
- 결과 토스트, #fx, 적발 도장 유지. 1단계(owner 말풍선) 변경 없음.

## E. 파일 분담
| 담당 | 파일 | 범위 |
|---|---|---|
| dev-A | assets/video3d.js만 | mat/toon/외곽선, makeKid·makeMascot, setTokens(ago, 1회 클립), resetRig/snapRig, applyRig, buildCast 배경 좌표, SHOTS, enterScene/frame/doAct, debug() 확장, 저사양(배경 외곽선 생략, 정적 메시 matrixAutoUpdate=false, low pixelRatio 1). **`const SC = {` ~ `/* 재생 */` 블록은 바이트 단위 동일.** |
| dev-B | assets/kit.js, assets/game.js, assets/scene.css | D 전체. kit.js prop/mark/cell/P, bubble/set 시그니처 유지. scene.css `/* 영상 재생기 */` 구간 손대지 않음 |
| 금지 | cues.js, video.mp3, index.html, make_single.py, exam-honesty.html | 빌드는 메인 세션이 마지막에 |

## F. 완료 기준 / QA
불변: (1) `git diff --stat -- assets/cues.js assets/video.mp3 index.html _build/make_single.py` 비어 있음 (2) video3d.js SC 블록 HEAD와 동일 (3) node vm 로드 비교: G.ACTS의 [cheat,msg], G.WAVES, G.ITEMS, G.TOTAL 동일, HUNT_PRE/END msg/wrong/intro, NOTE/PAIR msg 동일 (4) V.check(), G.check() 모두 [].
영상: (5) 전체 재생 콘솔 error 0, three 경고 0 (6) 연속 재생 중 관절 프레임 간 변화 <.3rad (되감기 직후 1프레임 예외) (7) 모든 beat 가림 기준 통과, wide 하단 중앙에 배경 머리 없음 (8) arm-hold 시 rig.held 월드 좌표가 phoneFly 시작점(-.72,1.33,-.3)에서 .05 이내 (9) beat 시작+1.5s 스크린샷에서 서 있거나 앉아만 있는 장면 없음 (10) 10s/95s/150s 점프 직후 자세 일치.
게임: (11) 2단계 내내 250ms마다 `#gsvg .kid.bub` 0개, `.kid .k-bub-t` 글자 0 (caught 도장 제외) (12) 360×740에서 ACTS 15개, NOTE, PAIR, HUNT 정상2·부정2를 앞줄(#k0)·뒷줄(#k12)에 강제 적용, 애니메이션 켬/reduced-motion 각각 스크린샷 → 글자 없이 구분 가능. 특히 손바닥/생각/하품/이어폰, 흘끔/보여줘/바꿔/똑똑, 시계/스마트워치, 인적사항/답 표시/문제 풀기 (13) 대기 14명 자세 3종 이상, 시차 (14) ?tv에서 정답·행위명 미노출 (15) 1단계 정상 동작.
성능·빌드: (16) CPU 4배 감속 1280×720, 영상 cheat 장면 10s, 게임 3교시 10s 각각 rAF 중앙값 30fps 이상 (17) `python _build/make_single.py` 성공, exam-honesty.html file:// 영상 재생·2단계 시작 콘솔 오류 0.

## 위험
- reduced-motion 전역 규칙: 멈춘 자세만으로 구분(F-12b).
- SVG transform-origin(px, view-box)이 iPad Safari에서 다를 수 있음 → Chrome·WebKit 둘 다 확인, 어긋나면 fill-box.
- 외곽선 draw call 약 +75 → 저사양 판정(hardwareConcurrency ≤ 4) 측정 후 조정.
- SVG 14명 반복 애니메이션: 작은 <g>에만, filter/blur 금지.
- 말풍선 제거로 난이도 상승. WAVES 불변, 이번엔 HUNT 제한시간도 바꾸지 않음.
