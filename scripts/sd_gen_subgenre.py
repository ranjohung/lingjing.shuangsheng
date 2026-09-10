# -*- coding: utf-8 -*-
"""SD WebUI API - v5.11 H1: 4 副题材资产（穿越/悬疑/奇幻/科幻）
4 立绘 (majicMIX realisticv7, 832x1216) + 4 场景 (dreamshaper_8, 1344x768)"""
import json, base64, time, os, urllib.request

API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OPT = "http://127.0.0.1:7860/sdapi/v1/options"
P_OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/portraits"
S_OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/scenes"
os.makedirs(P_OUT, exist_ok=True)
os.makedirs(S_OUT, exist_ok=True)

MAJIC = "majicMIX realisticv7.safetensors [7c819b6d13]"
DREAM = "dreamshaper_8.safetensors [879db523c3]"

def set_model(name):
    req = urllib.request.Request(OPT, data=json.dumps({"sd_model_checkpoint": name}).encode(),
                                 headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=30).read()
    time.sleep(8)

def gen(payload):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())

def run_batch(model, items, out_dir, w, h, neg, tag):
    set_model(model)
    print(f"model -> {model}", flush=True)
    for i, it in enumerate(items):
        print(f"[{tag} {i+1}/{len(items)}] {it['name']} ...", flush=True)
        t0 = time.time()
        payload = {"prompt": it["prompt"], "negative_prompt": neg,
                   "width": w, "height": h, "steps": 28, "cfg_scale": 7,
                   "sampler_name": "DPM++ 2M SDE", "seed": -1}
        try:
            res = gen(payload)
            img = base64.b64decode(res["images"][0])
            path = os.path.join(out_dir, it["file"])
            with open(path, "wb") as f:
                f.write(img)
            print(f"  OK {len(img)//1024}KB  {time.time()-t0:.1f}s -> {path}", flush=True)
        except Exception as e:
            print(f"  FAIL: {e}", flush=True)

NEG_P = ("lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, "
         "fewer digits, cropped, worst quality, low quality, jpeg artifacts, watermark, "
         "signature, blurry, deformed, disfigured, mutation, ugly, duplicate")
NEG_S = ("lowres, text, error, worst quality, low quality, jpeg artifacts, watermark, "
         "signature, blurry, people, human, character, deformed")

PORTRAITS = [
    {
        "file": "a_luo.png", "name": "阿萝 · 穿越盛唐少女",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young chinese girl, bright curious expression, sparkling eyes, "
                   "black hair in double buns tang dynasty style with golden hair ornaments, "
                   "red and gold tang dynasty ruqun hanfu dress with flowing sleeves, "
                   "holding a round silk fan, standing pose, full body, "
                   "tang dynasty palace hall at night, red lanterns, golden candlelight, "
                   "cinematic lighting, depth of field"),
    },
    {
        "file": "wen_heng.png", "name": "温衡 · 民国侦探",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1boy, handsome young chinese man detective of 1930s republic era, calm sharp gaze, "
                   "short neat black hair side part, round thin glasses, "
                   "dark grey mandarin collar changshan robe, long coat over shoulder, "
                   "holding a bronze pocket watch, standing pose, full body, "
                   "republic era study room, oil lamp warm light, bookshelves, "
                   "moody cinematic noir lighting, depth of field"),
    },
    {
        "file": "ai_erwei.png", "name": "艾尔薇 · 精灵法师",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young elf girl, long pointed ears, gentle mysterious smile, "
                   "long flowing silver green hair, leaf circlet, "
                   "emerald and gold elven robe with vine embroidery, "
                   "holding a wooden magic staff with glowing crystal, standing pose, full body, "
                   "enchanted forest, glowing fireflies, ancient trees, god rays through leaves, "
                   "magical atmosphere, cinematic lighting, depth of field"),
    },
    {
        "file": "nx07.png", "name": "NX-07 · 星舰副官",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young android female officer, composed precise expression, "
                   "short silver white sleek bob hair, subtle glowing blue circuit lines on neck, "
                   "white and navy blue futuristic starship uniform with silver insignia, "
                   "holding a holographic datapad, standing pose, full body, "
                   "futuristic starship bridge interior, holographic displays, blue ambient light, "
                   "sci-fi cinematic lighting, depth of field"),
    },
]

SCENES = [
    {
        "file": "palace_tang.png", "name": "大明宫夜宴 · 穿越",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "grand tang dynasty palace hall interior at night banquet, red pillars with gold dragon carvings, "
                   "hundreds of red lanterns and candles, silk curtains, bronze mirrors, low tables with wine cups, "
                   "warm golden and crimson palette, luxurious festive atmosphere, depth of field, no people"),
    },
    {
        "file": "study_republic.png", "name": "民国书房 · 悬疑",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "1930s republic era chinese study room at night, dark wooden bookshelves full of old books, "
                   "green desk lamp glowing, typewriter and scattered papers on desk, old wall clock, "
                   "french windows with rain, cigarette smoke haze in lamplight, "
                   "moody noir atmosphere, deep shadows, teal and amber palette, depth of field, no people"),
    },
    {
        "file": "elf_forest.png", "name": "精灵森林 · 奇幻",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "enchanted ancient forest with giant glowing trees, floating fireflies and light particles, "
                   "crystal clear stream, moss covered stone path, mystical ruins with elven runes glowing, "
                   "god rays through canopy, emerald green and gold palette, magical dreamy atmosphere, "
                   "depth of field, no people"),
    },
    {
        "file": "starship_bridge.png", "name": "星舰舰桥 · 科幻",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "futuristic starship bridge interior, curved command consoles with holographic blue displays, "
                   "large panoramic viewport showing galaxy and stars, sleek white and dark metal design, "
                   "glowing blue ambient light strips, sci-fi high tech atmosphere, "
                   "cinematic composition, depth of field, no people"),
    },
]

run_batch(MAJIC, PORTRAITS, P_OUT, 832, 1216, NEG_P, "P")
run_batch(DREAM, SCENES, S_OUT, 1344, 768, NEG_S, "S")
print("ALL SUBGENRE ASSETS DONE", flush=True)
