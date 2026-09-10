# -*- coding: utf-8 -*-
"""SD WebUI API - 5 张写实人物立绘 (majicMIX realisticv7)"""
import json, base64, time, os, urllib.request

API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/portraits"
os.makedirs(OUT, exist_ok=True)

NEG = ("lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, "
       "fewer digits, cropped, worst quality, low quality, jpeg artifacts, watermark, "
       "signature, blurry, deformed, disfigured, mutation, ugly, duplicate")

CHARACTERS = [
    {
        "file": "lin_shuangwan.png",
        "name": "林霜晚 · 古风冷面剑客",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young chinese woman swordswoman, cold aloof expression, sharp eyes, "
                   "long black hair with silver hairpin, black and dark purple hanfu with silver embroidery, "
                   "holding a chinese jian sword, standing pose, full body, "
                   "rainy night, ancient chinese pavilion background, red lanterns glow, "
                   "cinematic lighting, dramatic rim light, depth of field"),
    },
    {
        "file": "bai_lusheng.png",
        "name": "白鹿笙 · 校园治愈少女",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young chinese girl, gentle warm smile, soft eyes, "
                   "shoulder length dark brown hair, white and blue japanese high school uniform, "
                   "holding books, standing pose, full body, "
                   "sunlit classroom, warm afternoon sunlight through windows, "
                   "soft lighting, depth of field"),
    },
    {
        "file": "shen_zhou.png",
        "name": "沈昼 · 赛博黑客",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1boy, handsome young chinese man hacker, cool confident expression, "
                   "black messy hair, black techwear jacket with glowing cyan circuit lines, "
                   "holographic visor, standing pose, full body, "
                   "neon cyberpunk city street at night, neon signs, rain reflections, purple cyan neon glow, "
                   "cinematic lighting, depth of field"),
    },
    {
        "file": "gu_yan.png",
        "name": "顾衍 · 现代兄长",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1boy, handsome young chinese man, gentle mature smile, warm eyes, "
                   "short black hair, beige knit sweater, rolled up sleeves, standing pose, full body, "
                   "modern cozy apartment living room, warm orange lamp light, evening, "
                   "soft warm lighting, depth of field"),
    },
    {
        "file": "jiang_yinxue.png",
        "name": "姜吟雪 · 仙侠女修",
        "prompt": ("masterpiece, best quality, ultra detailed, photorealistic, "
                   "1girl, beautiful young chinese immortal cultivator, serene elegant expression, "
                   "long silver white hair, flowing white and cyan hanfu robes with cloud patterns, "
                   "ribbon accessories, standing on cloud, full body, "
                   "misty mountain peaks, sea of clouds, floating petals, golden sunlight, "
                   "ethereal atmosphere, cinematic lighting"),
    },
]

def gen(payload):
    req = urllib.request.Request(API, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())

for i, ch in enumerate(CHARACTERS):
    print(f"[{i+1}/5] {ch['name']} ...", flush=True)
    t0 = time.time()
    payload = {
        "prompt": ch["prompt"],
        "negative_prompt": NEG,
        "width": 832, "height": 1216,
        "steps": 28, "cfg_scale": 7,
        "sampler_name": "DPM++ 2M SDE",
        "seed": -1,
    }
    try:
        res = gen(payload)
        img = base64.b64decode(res["images"][0])
        path = os.path.join(OUT, ch["file"])
        with open(path, "wb") as f:
            f.write(img)
        print(f"  OK {len(img)//1024}KB  {time.time()-t0:.1f}s  -> {path}", flush=True)
    except Exception as e:
        print(f"  FAIL: {e}", flush=True)

print("ALL PORTRAITS DONE")
