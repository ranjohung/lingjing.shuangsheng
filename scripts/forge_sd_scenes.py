# -*- coding: utf-8 -*-
"""V25-B · 小说世界资产生产（本机 Stable Diffusion WebUI）

读 output/preview/worlds/<book>.json 的 assets 清单，逐条出图：
  - backgrounds : 场景背景（1344x768 宽银幕）
  - portraits   : 人物立绘（768x1024 半身）
提示词 100% 由世界蓝图给出（场景英文基底 + 原文意象/外观词映射），脚本本身不造句。

用法：
  python scripts/forge_sd_scenes.py [--book xiyouji] [--only bg|por] [--force]
"""
import json, base64, time, os, sys, urllib.request, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OPT = "http://127.0.0.1:7860/sdapi/v1/options"
MODEL = "dreamshaper_8.safetensors [879db523c3]"

STYLE = ("anime illustration, cel shading, clean anime lineart, cinematic photography lighting, "
         "volumetric light, shallow depth of field, bokeh, film grain, dramatic contrast, "
         "masterpiece, best quality, ultra detailed")

NEG_BG = ("lowres, text, error, worst quality, low quality, jpeg artifacts, watermark, signature, "
          "blurry, realistic photo, 3d render, deformed, people, person, human, character, "
          "crowd, face closeup, ui, letters")

NEG_POR = ("lowres, text, error, worst quality, low quality, jpeg artifacts, watermark, signature, "
           "blurry, realistic photo, 3d render, multiple people, two people, extra limbs, extra arms, "
           "extra fingers, deformed face, bad anatomy, bad hands, cropped, ui, letters")


def post(url, payload, timeout=30):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def switch_model():
    try:
        post(OPT, {"sd_model_checkpoint": MODEL}, timeout=60)
        print("[model] switched -> %s" % MODEL, flush=True)
        time.sleep(6)
    except Exception as e:
        print("[model] switch skipped: %s" % e, flush=True)


def gen(prompt, neg, w, h, seed=-1, steps=28):
    data = post(API, {
        "prompt": prompt, "negative_prompt": neg,
        "width": w, "height": h, "steps": steps, "cfg_scale": 7,
        "sampler_name": "DPM++ 2M SDE", "seed": seed
    }, timeout=900)
    img = data["images"][0]
    return base64.b64decode(img.split(",", 1)[1] if img.startswith("data:") else img)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", default="xiyouji")
    ap.add_argument("--only", default="all", choices=["all", "bg", "por"])
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    wj = os.path.join(ROOT, "output/preview/worlds", args.book + ".json")
    if not os.path.exists(wj):
        print("世界蓝图不存在，请先跑：node scripts/forge_build.js --book " + args.book)
        return 2
    world = json.load(open(wj, encoding="utf-8"))

    outdir = os.path.join(ROOT, "output/preview/img/novel-forge", args.book)
    os.makedirs(outdir, exist_ok=True)

    # 本机 SD 是否在线
    try:
        urllib.request.urlopen("http://127.0.0.1:7860/sdapi/v1/sd-models", timeout=5).read()
    except Exception as e:
        print("本机 SD WebUI(127.0.0.1:7860) 不可达：%s" % e)
        return 3

    switch_model()

    assets = world["assets"]
    jobs = []
    if args.only in ("all", "bg"):
        for b in assets["backgrounds"]:
            jobs.append(("bg", b))
    if args.only in ("all", "por"):
        for p in assets["portraits"]:
            jobs.append(("por", p))

    done, skip, fail = 0, 0, 0
    for kind, item in jobs:
        rel = "img/novel-forge/%s/%s" % (args.book, item["file"])
        fp = os.path.join(ROOT, "output/preview", rel)
        if os.path.exists(fp) and os.path.getsize(fp) > 50000 and not args.force:
            item["image"] = rel
            skip += 1
            print("  [skip] %s %s" % (item["asset_id"], item["file"]), flush=True)
            continue

        if kind == "bg":
            prompt = ", ".join(item["prompt_parts"][:1] + item["prompt_parts"][1:7]) + ", " + STYLE
            neg, W, H = NEG_BG, 1344, 768
            label = "场景 " + item["location"]
        else:
            prompt = ", ".join(item["prompt_parts"][:1] + item["prompt_parts"][1:6]) + ", " + STYLE
            neg, W, H = NEG_POR, 768, 1024
            label = "立绘 " + item["name"]

        print("[%d/%d] %s  %s" % (done + skip + fail + 1, len(jobs), item["asset_id"], label), flush=True)
        t0 = time.time()
        try:
            data = gen(prompt, neg, W, H)
            open(fp, "wb").write(data)
            item["image"] = rel
            item["prompt_final"] = prompt
            done += 1
            print("        ok %.0fs  %s" % (time.time() - t0, rel), flush=True)
        except Exception as e:
            fail += 1
            print("        FAIL %s" % e, flush=True)

    json.dump(world, open(wj, "w", encoding="utf-8"), ensure_ascii=False)
    print("\n=== SD 资产完成：新建 %d / 复用 %d / 失败 %d ===" % (done, skip, fail))
    print("输出目录：output/preview/img/novel-forge/%s/" % args.book)
    print("世界蓝图已回写 image 字段：worlds/%s.json" % args.book)
    return 0


if __name__ == "__main__":
    sys.exit(main())
