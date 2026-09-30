"""index.html + assets/ 를 HTML 파일 하나로 합친다 (내려받아 더블클릭만으로 쓰는 배포용).
  실행: python _build/make_single.py   →  exam-honesty.html (약 4MB)
CSS·JS는 그대로 안에 넣고, 음성 파일은 base64 로 심는다. 글꼴(CDN)만 인터넷이 없으면 기본 글꼴로 나온다."""
import base64, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
html = rd('index.html')

def inline_js(m):
    src = m.group(1)
    js = rd(src).replace('</script', '<\\/script')
    return f'<script>/* {src} */\n{js}\n</script>'
html, n_js = re.subn(r'<script src="(assets/[^"]+\.js)"></script>', inline_js, html)
html, n_css = re.subn(r'<link rel="stylesheet" href="assets/scene\.css">', lambda m: '<style>\n' + rd('assets/scene.css') + '\n</style>', html)
mp3 = base64.b64encode(open(os.path.join(ROOT, 'assets/video.mp3'), 'rb').read()).decode()
html, n_mp3 = re.subn(r'src="assets/video\.mp3"', f'src="data:audio/mpeg;base64,{mp3}"', html)
assert (n_js, n_css, n_mp3) == (5, 1, 1), (n_js, n_css, n_mp3)
assert 'assets/' not in re.sub(r'/\* assets/[^*]*\*/', '', html).replace('assets/video.mp3', ''), '남은 assets 참조'
out = os.path.join(ROOT, 'exam-honesty.html')
open(out, 'w', encoding='utf-8', newline='\n').write(html)
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
