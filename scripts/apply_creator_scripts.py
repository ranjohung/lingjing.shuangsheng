# -*- coding: utf-8 -*-
"""V23 幂等注入：创作子页接入 tabbar-embed + creator 数据层脚本。
用法：python scripts/apply_creator_scripts.py
铁则：幂等（重复执行不重复插入）；只插 </body> 前、</head> 前各一处。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "output" / "preview"

# Set A：交互流程页（store + ai + pages 集中接线）
SET_A = ["create-image", "create-video", "create-sound", "create-post",
         "create-card", "agent-create", "voice-clone",
         "interaction-manage", "work-editor", "workshop", "dashboard"]
# Set B：数据展示页（仅 store）
SET_B = ["revenue-detail", "creator-center"]
# 全部需要 tabbar
ALL = sorted(set(SET_A + SET_B))

TABBAR_CSS = '<link rel="stylesheet" href="css/tabbar-embed.css">'
SCRIPTS_STORE = '<script src="js/creator-store.js"></script>'
SCRIPTS_AI = SCRIPTS_STORE + '\n<script src="js/creator-ai.js"></script>\n<script src="js/creator-pages.js"></script>'
TABBAR_JS = '<script src="js/tabbar.js"></script>'


def inject(path: Path, head_snippet: str, body_tags: list) -> str:
    t = path.read_text(encoding="utf-8")
    changed = []
    if head_snippet and 'href="css/tabbar-embed.css"' not in t and "</head>" in t:
        t = t.replace("</head>", head_snippet + "\n</head>", 1)
        changed.append("head")
    for tag in body_tags:
        if tag not in t and "</body>" in t:
            t = t.replace("</body>", tag + "\n</body>", 1)
            changed.append(tag.split('"')[1])
    path.write_text(t, encoding="utf-8")
    return ",".join(changed) if changed else "skip"


def main() -> None:
    tabbar = '<script src="js/tabbar.js"></script>'
    for name in ALL:
        p = ROOT / f"{name}.html"
        if not p.exists():
            print(f"{name}: MISSING")
            continue
        if name in SET_A:
            tags = ['<script src="js/creator-store.js"></script>',
                    '<script src="js/creator-ai.js"></script>',
                    '<script src="js/creator-pages.js"></script>']
        else:
            tags = ['<script src="js/creator-store.js"></script>']
        if 'js/tabbar.js' not in (p.read_text(encoding="utf-8")):
            tags.append(tabbar)
        r = inject(p, TABBAR_CSS, tags)
        print(f"{name}: {r}")


if __name__ == "__main__":
    main()
