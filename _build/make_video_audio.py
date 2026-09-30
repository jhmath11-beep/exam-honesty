"""영상용 오디오 트랙 + 자막 타이밍(cues) 생성기.

대본(SCRIPT)이 유일한 원본이다. 대사를 고치면 이 스크립트를 다시 돌린다.
  준비:  pip install edge-tts numpy   (+ ffmpeg 가 PATH 에 있어야 함)
  실행:  python _build/make_video_audio.py
  결과:  assets/video.mp3, assets/cues.js

목소리는 Microsoft Edge 신경망 음성(edge-tts)으로 합성하므로 실행할 때 인터넷이 필요하다.
효과음·배경음악은 외부 음원 없이 numpy 로 직접 합성한다(저작권 걱정 없음).
"""
import asyncio, json, os, subprocess, sys, tempfile
import numpy as np
import edge_tts

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')

VOICES = {
    'n':   dict(voice='ko-KR-SunHiNeural',  rate='+8%',  pitch='+10Hz'),   # 또박이(진행)
    'jun': dict(voice='ko-KR-InJoonNeural', rate='+12%', pitch='+40Hz'),   # 준이
    'sol': dict(voice='ko-KR-SunHiNeural',  rate='+2%',  pitch='+70Hz'),   # 솔이
}

# (누가, 자막, 옵션)  옵션: say=읽는 글(자막과 다를 때), pre=대사 앞 효과음
SCRIPT = [
    ('intro', [
        ('n', '안녕! 나는 시험 도우미 또박이야!', dict(pre='pop')),
        ('n', '시험 보는 날, 이것만 알면 걱정 끝! 같이 가 보자!', {}),
    ]),
    ('ban', [
        ('jun', '폰은 전원 끄고 주머니에 넣으면 되지?', {}),
        ('n', '땡! 휴대전화는 꺼도 안 돼. 시험 시작 전에 꼭 제출해야 해!', dict(pre='buzz')),
        ('n', '스마트 워치, 무선 이어폰, 전자계산기, 전자사전, 카메라, 라디오, 녹음기까지!', {}),
        ('n', '전자 기기는 전부 안 돼. 숫자가 나오는 전자시계도 안 돼!', dict(pre='buzz')),
    ]),
    ('ok', [
        ('sol', '그럼 책상 위에는 뭘 둘 수 있어?', {}),
        ('n', '연필, 지우개, 샤프심! 검정이나 파란 볼펜!', dict(pre='ding')),
        ('n', '컴퓨터용 사인펜이랑 수정테이프도 좋아.', {}),
        ('n', '시계는 바늘이 있는 아날로그 시계만!', {}),
    ]),
    ('bag', [
        ('n', '나머지 물건은 매 교시 시작 전에, 사물함이나 가방 속으로!', {}),
        ('n', '가방 지퍼는 꼭 잠그고, 책상 서랍도 싹 비우기!', dict(pre='zip')),
    ]),
    ('during', [
        ('jun', '문제지 받았다! 미리 풀어야지.', {}),
        ('n', '잠깐! 시작종이 울리기 전에는 인적 사항만 표기할 수 있어.', dict(pre='buzz')),
        ('n', '미리 문제를 풀거나 답을 표시하면 부정행위야!', {}),
        ('jun', '으으, 화장실 가고 싶다.', {}),
        ('n', '화장실은 쉬는 시간 15분 동안 미리 다녀오자!', dict(say='화장실은 쉬는 시간 십오 분 동안 미리 다녀오자!')),
        ('n', '문제지를 받으면 면수와 인쇄 상태부터 확인!', {}),
        ('n', '궁금한 게 있으면 조용히 손을 들면 돼.', {}),
    ]),
    ('bell', [
        ('n', '종이 울리면 바로 필기구를 내려놓고, 손은 책상 아래로!', dict(pre='bell')),
        ('jun', '딱 한 문제만 더.', {}),
        ('n', '안 돼! 종이 울린 뒤에 계속 쓰면 부정행위야.', dict(pre='buzz')),
        ('n', '답안지는 맨 뒷자리 친구가 걷어서 선생님께 드려.', {}),
        ('n', '선생님이 나가실 때까지 조용히 제자리에 앉아 있기!', {}),
    ]),
    ('omr', [
        ('n', '답안지에는 학년, 반, 번호, 그리고 과목코드를 정확하게!', {}),
        ('n', '표기는 컴퓨터용 사인펜으로! 빨간 펜으로 미리 표시하는 건 안 돼.', {}),
        ('n', '틀렸으면 수정테이프로 고치기. 수정테이프는 각자 준비!', dict(pre='ding')),
        ('n', '× 표시로 고친 답은 인정되지 않아.', dict(say='엑스 표시로 고친 답은 인정되지 않아.', pre='buzz')),
    ]),
    ('essay', [
        ('sol', '논술형 답은 어떻게 써?', {}),
        ('n', '검정이나 파란 볼펜으로만 써.', {}),
        ('n', '고칠 때는 밑글씨가 보이게 두 줄 쫙! 수정테이프는 쓰면 안 돼.', {}),
    ]),
    ('cheat', [
        ('n', '지금부터는 절대 하면 안 되는 부정행위야!', {}),
        ('n', '친구 답안지를 보거나, 내 답안지를 보여주기.', dict(pre='alarm')),
        ('n', '손짓이나 소리로 신호 주고받기.', dict(pre='alarm')),
        ('n', '컨닝 페이퍼나 책, 무선기기 사용하기.', dict(pre='alarm')),
        ('n', '손바닥이나 책상, 벽에 적어 놓고 보기.', dict(pre='alarm')),
        ('n', '답을 보여 달라고 강요하거나 위협하기.', dict(pre='alarm')),
        ('n', '시작종이 울리기 전에 문제를 풀거나 답을 표시하기.', dict(pre='alarm')),
        ('n', '종료령이 울린 뒤에도 계속 쓰기.', dict(pre='alarm')),
        ('n', '자리를 바꾸거나 답안지를 대신 써 주기.', dict(pre='alarm')),
        ('n', '금지 물품을 내지 않고 갖고 있기.', dict(pre='alarm')),
        ('n', '그 밖에 감독 선생님이 부정행위라고 판단하는 행동까지!', {}),
    ]),
    ('outro', [
        ('n', '부정행위를 하면 학교 학업성적관리규정에 따라 처리돼.', {}),
        ('n', '정직하게 본 시험이 진짜 내 실력! 모두 파이팅!', dict(pre='fanfare')),
        ('n', '이제 퀴즈로 확인해 볼까?', {}),
    ]),
]

GAP_BEAT, GAP_SCENE, LEAD_IN, TAIL = 0.45, 1.0, 0.8, 1.5


# ───────── 합성 도구 ─────────
def tone(freq, dur, decay=6.0, harm=((1, 1.0), (2, 0.3))):
    t = np.arange(int(SR * dur)) / SR
    y = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in harm)
    env = np.exp(-t * decay) * np.minimum(1, t / 0.004)
    return (y * env).astype(np.float32)


def seq(notes, step, **kw):
    """notes: [(주파수, 길이)] 를 step 초 간격으로 겹쳐 놓는다."""
    n = int(SR * (step * len(notes) + max(d for _, d in notes)))
    out = np.zeros(n, np.float32)
    for i, (f, d) in enumerate(notes):
        y = tone(f, d, **kw)
        p = int(SR * step * i)
        out[p:p + len(y)] += y
    return out


def noise_sweep(dur, f0, f1):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / dur
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + np.random.default_rng(1).uniform(-1, 1, n) * 0.5
    env = np.sin(np.pi * t / dur) ** 2
    k = 40
    y = np.convolve(y, np.ones(k) / k, 'same')  # 거친 소리를 부드럽게
    return (y * env).astype(np.float32)


C4, D4, E4, F4, G4, A4, B4 = 261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88
SFX = {  # 이름: (소리, 대사가 시작되기까지 기다리는 시간)
    'pop':     (seq([(C4 * 2, .25), (G4 * 2, .3)], .09, decay=12), .35),
    'ding':    (seq([(E4 * 2, .5), (C4 * 4, .7)], .12, decay=7), .4),
    'buzz':    (seq([(155, .3), (130, .45)], .22, decay=3, harm=((1, 1), (3, .5), (5, .3))), .75),
    'alarm':   (seq([(1175, .12), (1175, .12)], .16, decay=9, harm=((1, 1), (3, .25))), .45),
    'bell':    (seq([(E4 * 2, 1.2), (C4 * 2, 1.2), (D4 * 2, 1.2), (G4, 1.8)], .48, decay=2.5,
                    harm=((1, 1), (2, .5), (3, .25), (4.2, .12))), 2.3),
    'zip':     (noise_sweep(.55, 500, 2600), .55),
    'whoosh':  (noise_sweep(.45, 1800, 300), 0),
    'fanfare': (seq([(C4 * 2, .3), (E4 * 2, .3), (G4 * 2, .3), (C4 * 4, .9)], .11, decay=5), .8),
}


def bgm(total):
    """밝은 마림바풍 반복 음악(C–G–Am–F)."""
    chords = [(C4, E4, G4), (G4 / 2, B4 / 2, D4), (A4 / 2, C4, E4), (F4 / 2, A4 / 2, C4)]
    step = 60 / 112 / 2  # 8분음표
    pattern = [0, 1, 2, 1, 0, 2, 1, 2]
    out = np.zeros(int(SR * (total + 2)), np.float32)
    i = 0
    while i * step < total:
        ch = chords[(i // 8) % 4]
        f = ch[pattern[i % 8]] * 2
        y = tone(f, .5, decay=8, harm=((1, 1), (4, .15))) * (0.9 if i % 2 == 0 else 0.6)
        if i % 4 == 0:
            y = y + tone(ch[0] / 2, .5, decay=4, harm=((1, 1),))
        p = int(SR * i * step)
        out[p:p + len(y)] += y[:len(out) - p]
        i += 1
    n = int(SR * total)
    out = out[:n]
    fade = int(SR * 1.5)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


async def tts(text, who, path):
    v = VOICES[who]
    await edge_tts.Communicate(text, v['voice'], rate=v['rate'], pitch=v['pitch']).save(path)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    y = np.frombuffer(raw, np.float32).copy()
    loud = np.where(np.abs(y) > 0.01)[0]
    assert len(loud), f'무음 파일: {path}'
    pad = int(SR * 0.04)
    y = y[max(0, loud[0] - pad):loud[-1] + pad]
    rms = np.sqrt(np.mean(y[np.abs(y) > 0.01] ** 2))
    return y * (0.13 / rms)  # 목소리마다 크기를 맞춘다


def put(buf, y, t, gain=1.0):
    p = int(SR * t)
    buf[p:p + len(y)] += y[:len(buf) - p] * gain


async def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp()
    lines = [(si, bi, who, text, opt) for si, (_, beats) in enumerate(SCRIPT) for bi, (who, text, opt) in enumerate(beats)]
    paths = [os.path.join(tmp, f'{i:02d}.mp3') for i in range(len(lines))]
    for i in range(0, len(lines), 6):  # 서버에 한꺼번에 몰리지 않게 6개씩
        await asyncio.gather(*[tts(l[4].get('say', l[3]), l[2], p) for l, p in zip(lines[i:i + 6], paths[i:i + 6])])
    voices = [decode(p) for p in paths]

    total = LEAD_IN + sum(len(v) / SR + GAP_BEAT + SFX[l[4]['pre']][1] if 'pre' in l[4] else len(v) / SR + GAP_BEAT
                          for l, v in zip(lines, voices)) + GAP_SCENE * len(SCRIPT) + TAIL
    voice_buf = np.zeros(int(SR * (total + 1)), np.float32)
    sfx_buf = np.zeros_like(voice_buf)
    cues, t, prev_scene = [], LEAD_IN, 0
    for (si, bi, who, text, opt), v in zip(lines, voices):
        if si != prev_scene:
            t += GAP_SCENE
            put(sfx_buf, SFX['whoosh'][0], t - 0.35, 0.25)
            prev_scene = si
        start = t
        if 'pre' in opt:
            y, lead = SFX[opt['pre']]
            put(sfx_buf, y, t, 0.32)
            t += lead
        put(voice_buf, v, t)
        cues.append(dict(t=round(0 if not cues else start, 2), s=si, b=bi, who=who, text=text,
                         v0=round(t, 2), v1=round(t + len(v) / SR, 2)))
        t += len(v) / SR + GAP_BEAT
    length = t + TAIL
    n = int(SR * length)
    mix = voice_buf[:n] + sfx_buf[:n] + bgm(length) * 0.05
    mix = np.tanh(mix * 1.6) / np.tanh(1.6)  # 부드러운 리미터
    assert np.abs(mix).max() <= 1.0 and np.sqrt(np.mean(mix ** 2)) > 0.02, '믹스 음량 이상'

    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-codec:a', 'libmp3lame', '-b:a', '80k', os.path.join(OUT, 'video.mp3')],
                   input=mix.astype(np.float32).tobytes(), check=True)
    with open(os.path.join(OUT, 'cues.js'), 'w', encoding='utf-8') as f:
        f.write('// _build/make_video_audio.py 가 만든 파일. 직접 고치지 말 것.\n')
        f.write(f'const VIDEO_LEN = {length:.2f};\n')
        f.write('const SCENE_IDS = ' + json.dumps([name for name, _ in SCRIPT]) + ';\n')
        f.write('const CUES = ' + json.dumps(cues, ensure_ascii=False, indent=0) + ';\n')
        # 입 모양용: 목소리만의 크기를 1/30초마다 0~9 로
        hop = SR // 30
        v = voice_buf[:n - n % hop].reshape(-1, hop)
        env = np.sqrt((v ** 2).mean(axis=1))
        env = np.clip(env / (np.percentile(env[env > 0.01], 90) + 1e-9) * 9, 0, 9).round().astype(int)
        f.write('const ENV = "' + ''.join(map(str, env)) + '";\n')
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'길이 {length:.1f}초, 대사 {len(cues)}개')
    for c in cues:
        print(f"{c['t']:7.2f}  {SCRIPT[c['s']][0]:7s} {c['who']:4s} {c['v1'] - c['v0']:5.2f}s  {c['text']}")


asyncio.run(main())
