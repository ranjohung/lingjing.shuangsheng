# -*- coding: utf-8 -*-
"""V24 小说世界OS — 3 张二次元摄影风场景背景 (dreamshaper_8)
二次元摄影画面风格 = anime cel shading + 摄影光影/景深 + 胶片颗粒"""
import json, base64, time, os, urllib.request

API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OPT = "http://127.0.0.1:7860/sdapi/v1/options"
OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/img/novel-os"
os.makedirs(OUT, exist_ok=True)

req = urllib.request.Request(OPT, data=json.dumps({"sd_model_checkpoint": "dreamshaper_8.safetensors [879db523c3]"}).encode(),
                             headers={"Content-Type": "application/json"})
urllib.request.urlopen(req, timeout=30).read()
print("switched to dreamshaper_8", flush=True)
time.sleep(8)

STYLE = ("anime illustration, cel shading, clean anime lineart, cinematic photography lighting, "
         "volumetric light, shallow depth of field, bokeh, film grain, dramatic contrast, "
         "masterpiece, best quality, ultra detailed")
NEG = ("lowres, text, error, worst quality, low quality, jpeg artifacts, watermark, "
       "signature, blurry, realistic photo, 3d render, deformed, people face closeup")

SCENES = [
    {"file": "street_rain_night.png", "name": "临安雨夜街",
     "prompt": ("ancient chinese town street at rainy night, rows of glowing red paper lanterns, "
                "wet bluestone road with lantern reflections, wooden shopfronts with cloth banners, "
                "rain streaks in lamplight, mist, deep blue night palette with warm orange accents, " + STYLE)},
    {"file": "study_rain_night.png", "name": "书房雨夜",
     "prompt": ("modern apartment study room at night during rain, desk with open books and warm desk lamp, "
                "bookshelf, large window with raindrops and blurred city lights bokeh outside, "
                "cozy dark ambience, single warm light source, " + STYLE)},
    {"file": "tavern_warm.png", "name": "古风酒楼",
     "prompt": ("interior of ancient chinese tavern restaurant, round wooden tables, hanging lanterns, "
                "warm candlelight, wine jars, window lattice with moonlight, steam from kitchen in background, "
                "cozy amber palette, " + STYLE)},
]

def gen(payload):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())

for i, sc in enumerate(SCENES):
    fp = os.path.join(OUT, sc["file"])
    if os.path.exists(fp) and os.path.getsize(fp) > 100000:
        print(f"[{i+1}/3] {sc['name']} exists, skip", flush=True)
        continue
    print(f"[{i+1}/3] {sc['name']} ...", flush=True)
    t0 = time.time()
    data = gen({"prompt": sc["prompt"], "negative_prompt": NEG,
                "width": 1344, "height": 768, "steps": 30, "cfg_scale": 7,
                "sampler_name": "DPM++ 2M SDE", "seed": -1})
    with open(fp, "wb") as f:
        img = data["images"][0]
        f.write(base64.b64decode(img.split(",", 1)[1] if img.startswith("data:") else img))
    print(f"    saved {sc['file']} ({time.time()-t0:.0f}s)", flush=True)

print("ALL_DONE", flush=True)
