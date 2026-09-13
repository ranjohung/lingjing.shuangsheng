"""提取 HTML 内联 <script>（无 src）逐块 node --check 校验。
用法: python scripts/check_html_js.py output/preview/xxx.html [output/preview/yyy.html ...]
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

NODE = r"C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node.exe"
SCRIPT_RE = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S | re.I)

def main() -> int:
    bad = 0
    for html in sys.argv[1:]:
        p = Path(html)
        if not p.exists():
            print(f"MISSING {p}")
            bad += 1
            continue
        text = p.read_text(encoding="utf-8")
        for i, m in enumerate(SCRIPT_RE.findall(text)):
            code = m.strip()
            if not code:
                continue
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
                f.write(code)
                tmp = f.name
            r = subprocess.run([NODE, "--check", tmp], capture_output=True, text=True)
            if r.returncode != 0:
                bad += 1
                print(f"FAIL {p.name} <script#{i}>:\n{r.stderr[:1200]}")
            else:
                print(f"OK   {p.name} <script#{i}> ({len(code)} chars)")
    print("RESULT", "FAIL" if bad else "ALL_OK")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
