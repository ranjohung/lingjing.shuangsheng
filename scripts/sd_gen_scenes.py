# -*- coding: utf-8 -*-
"""SD WebUI API - 5 张高质量场景背景 (dreamshaper_8)"""
import json, base64, time, os, urllib.request

API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OPT = "http://127.0.0.1:7860/sdapi/v1/options"
OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/scenes"
os.makedirs(OUT, exist_ok=True)

# 切回 dreamshaper_8（擅长场景/概念图）
req = urllib.request.Request(OPT, data=json.dumps({"sd_model_checkpoint": "dreamshaper_8.safetensors [879db523c3]"}).encode(),
                             headers={"Content-Type": "application/json"})
urllib.request.urlopen(req, timeout=30).read()
print("switched to dreamshaper_8", flush=True)
time.sleep(8)

NEG = ("lowres, text, error, worst quality, low quality, jpeg artifacts, watermark, "
       "signature, blurry, people, human, character, deformed")

SCENES = [
    {
        "file": "pavilion_night.png",
        "name": "雨夜凉亭 · 古风",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "ancient chinese pavilion in a lake garden at rainy night, red lanterns glowing warm orange, "
                   "light rain, misty atmosphere, moonlight through clouds, wet stone bridge, "
                   "dark blue and purple night palette, dramatic lighting, reflections on water, depth of field, no people"),
    },
    {
        "file": "classroom_sunny.png",
        "name": "阳光教室 · 校园",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "empty japanese high school classroom and corridor, afternoon golden sunlight streaming through large windows, "
                   "dusty light beams, desks and chairs neatly arranged, green chalkboard, "
                   "warm cheerful atmosphere, soft shadows, lens flare, depth of field, no people"),
    },
    {
        "file": "neon_street.png",
        "name": "霓虹街 · 赛博",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "cyberpunk city street at night, neon signs in chinese and japanese, purple and cyan neon glow, "
                   "wet asphalt with neon reflections, holographic advertisements, flying cars in distance, "
                   "rain atmosphere, blade runner style, dramatic lighting, depth of field, no people"),
    },
    {
        "file": "livingroom_warm.png",
        "name": "暖光客厅 · 现代",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "cozy modern apartment living room in the evening, warm orange floor lamp, "
                   "soft sofa with blankets, bookshelf, city lights visible through window, "
                   "tv screen glow, plants, warm inviting atmosphere, soft lighting, depth of field, no people"),
    },
    {
        "file": "xianxia_peak.png",
        "name": "仙山之巅 · 仙侠",
        "prompt": ("masterpiece, best quality, ultra detailed, cinematic concept art, "
                   "majestic floating mountain peak above sea of clouds, ancient chinese temple pavilion on the peak, "
                   "waterfall flowing into clouds, flying cranes, floating cherry blossom petals, "
                   "golden sunlight breaking through mist, ethereal xianxia fantasy atmosphere, "
                   "cyan and gold palette, dramatic sky, depth of field, no people"),
    },
]

def gen(payload):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())

for i, sc in enumerate(SCENES):
    print(f"[{i+1}/5] {sc['name']} ...", flush=True)
    t0 = time.time()
    payload = {
        "prompt": sc["prompt"],
        "negative_prompt": NEG,
        "width": 1344, "height": 768,
        "steps": 30, "cfg_scale": 7,
        "sampler_name": "DPM++ 2M SDE",
        "seed": -1,
    }
    try:
        res = gen(payload)
        img = base64.b64decode(res["images"][0])
        path = os.path.join(OUT, sc["file"])
        with open(path, "wb") as f:
            f.write(img)
        print(f"  OK {len(img)//1024}KB  {time.time()-t0:.1f}s  -> {path}", flush=True)
    except Exception as e:
        print(f"  FAIL: {e}", flush=True)

print("ALL SCENES DONE")
