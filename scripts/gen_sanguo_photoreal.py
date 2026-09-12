"""
V20-Q · 三国演义·真人摄影风格关键场景批量生成
- 模型：majicMIX realisticv7（真人写实 · 电影感）
- 尺寸：512x768 portrait
- 输出：assets/scenes/sg_*.jpg（24 张：12 卷封面 + 12 关键场景）
- 调用：SD WebUI 7860 /sdapi/v1/txt2img
"""
import os, json, base64, time, urllib.request

SD = "http://127.0.0.1:7860"
OUT = r"F:\开发软件项目文件\灵境 · 双生\assets\scenes"
os.makedirs(OUT, exist_ok=True)

# 通用 negative
NEG = (
    "cartoon, anime, illustration, painting, 3d render, sketch, lowres, "
    "blurry, bad anatomy, deformed, ugly, watermark, text, signature, "
    "nsfw, nudity, female warrior, modern clothing"
)

# 通用三国风 + 真人摄影 modifier
STYLE = (
    "Three Kingdoms era 220 AD, ancient Chinese warriors in hanfu armor, "
    "male soldiers with beards, cinematic lighting, golden hour, "
    "film grain, realistic photography, ultra detailed, 8k, "
    "shot on Canon EOS R5, 35mm lens, shallow depth of field"
)

# 24 张三国关键场景
SHOTS = [
    # (id, 卷名, prompt 主体, [可选 seed])
    ("sg_v01_cover", "卷一 桃园豪杰",
     "three male Chinese warriors in ancient armor kneeling oath under blooming peach blossom trees, "
     "dramatic golden sunlight filtering through pink petals, mountains in background, sacred ceremony mood"),
    ("sg_v02_cover", "卷二 诸侯会盟",
     "eighteen ancient Chinese military banners standing in a vast battlefield, "
     "warriors on horseback with spears, dawn light breaking through clouds, epic wide shot"),
    ("sg_v03_cover", "卷三 王司徒献女",
     "a beautiful ancient Chinese court lady in red hanfu standing on a moonlit balcony, "
     "wind blowing her long hair, palace interior with lanterns, romantic tragedy mood"),
    ("sg_v04_cover", "卷四 卧龙出山",
     "an ancient Chinese strategist with feather fan standing on thatched cottage porch, "
     "pine trees and misty mountains behind, calm wise expression, contemplative moment"),
    ("sg_v05_cover", "卷五 官渡之战",
     "two massive ancient Chinese armies facing each other across a dusty plain, "
     "war banners and cavalry formations, sunset light, smoke rising, epic scale"),
    ("sg_v06_cover", "卷六 赤壁火攻",
     "hundreds of ancient wooden warships engulfed in flames on a wide river at night, "
     "orange fire reflections on water, soldiers running, dramatic chiaroscuro lighting"),
    ("sg_v07_cover", "卷七 取西川",
     "ancient Chinese walled city gate with mountains behind, "
     "warriors in blue armor marching through, late afternoon light, heroic atmosphere"),
    ("sg_v08_cover", "卷八 关羽北伐",
     "a tall bearded ancient Chinese general in green hanfu armor holding guandao blade, "
     "standing on a riverbank, wind blowing his cape, heroic portrait composition"),
    ("sg_v09_cover", "卷九 夷陵火海",
     "ancient Chinese army camp surrounded by raging forest fire at night, "
     "orange flames and black smoke, soldiers fleeing, tragic atmosphere"),
    ("sg_v10_cover", "卷十 五丈原",
     "an ancient Chinese strategist in white robes standing under a lonely starry sky, "
     "small oil lamp at his feet, autumn wind blowing, melancholy mood"),
    ("sg_v11_cover", "卷十一 司马懿",
     "an ancient Chinese military commander with white hair and beard, "
     "calm cold expression, standing in dark forest, foggy atmosphere"),
    ("sg_v12_cover", "卷十二 三国归晋",
     "ancient Chinese emperor in golden dragon robe ascending throne steps, "
     "court officials bowing on both sides, golden sunlight streaming through palace windows, regal"),

    # 12 张关键回主图
    ("sg_ch05_huaxiong", "温酒斩华雄",
     "a tall bearded ancient Chinese general in green armor wielding a huge guandao blade, "
     "standing triumphantly over a fallen enemy, snow on ground, wine cup on a tray nearby"),
    ("sg_ch06_3v1lvmbu", "三英战吕布",
     "three ancient Chinese warriors surrounding a fierce warrior on horseback in bright red armor, "
     "dusty battlefield, weapons crossing, dynamic action shot"),
    ("sg_ch25_threevisits", "三顾茅庐",
     "a kneeling ancient Chinese lord in plain clothes before a thatched cottage gate, "
     "snow on branches, morning light, sincere respectful mood"),
    ("sg_ch30_wuchao", "火烧乌巢",
     "ancient Chinese grain storage facility engulfed in flames, "
     "enemy soldiers carrying torches, night scene with orange fire glow"),
    ("sg_ch44_caoqianjiejian", "草船借箭",
     "ancient Chinese straw boats covered in scarecrows emerging from thick morning fog on a river, "
     "enemy archers shooting arrows that stick into straw, mysterious atmosphere"),
    ("sg_ch47_zhouyu", "周瑜舞剑",
     "an ancient Chinese military commander in silver armor performing sword dance on a river barge, "
     "moonlight reflecting on water, elegant and powerful, romantic warrior aesthetic"),
    ("sg_ch49_huarong", "华容道",
     "a bearded ancient Chinese general on horseback at a narrow mountain pass, "
     "rain falling, weary expression, smoke in distance, contemplative mood"),
    ("sg_ch61_zhaoyun", "赵云救主",
     "an ancient Chinese warrior in white armor charging through enemy ranks on horseback, "
     "carrying a baby in his arms, blood splatter, dramatic rescue moment"),
    ("sg_ch74_guagu", "刮骨疗毒",
     "an ancient Chinese general playing chess calmly while a physician cuts his arm bone, "
     "intimate indoor scene with oil lamp, stoic warrior expression, intense focus"),
    ("sg_ch76_maicheng", "败走麦城",
     "a tall bearded ancient Chinese general with bound hands walking through snow, "
     "captured moment, head slightly raised with dignity, tragic heroic portrait"),
    ("sg_ch91_baidi", "白帝城托孤",
     "an ancient Chinese emperor on a sickbed in candlelit chamber, "
     "handing a seal to a kneeling subject, tears in eyes, farewell moment"),
    ("sg_ch95_emptycity", "空城计",
     "an ancient Chinese strategist calmly playing guqin zither on an open city gate tower, "
     "two old servants sweeping below, enemy army visible in misty distance, brilliant tension"),
]

def gen_one(idx, shot_id, vol_name, prompt_main):
    full_prompt = prompt_main + ", " + STYLE
    payload = {
        "prompt": full_prompt,
        "negative_prompt": NEG,
        "width": 512, "height": 768,
        "steps": 22, "sampler_name": "DPM++ 2M Karras",
        "cfg_scale": 7, "seed": 100 + idx * 17,
        "model": "majicMIX realisticv7"
    }
    t0 = time.time()
    req = urllib.request.Request(
        SD + "/sdapi/v1/txt2img",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            d = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [{idx+1:2}/24] {shot_id:30} ERR: {e}")
        return False
    img_b64 = d["images"][0]
    img = base64.b64decode(img_b64)
    path = os.path.join(OUT, shot_id + ".jpg")
    with open(path, "wb") as f:
        f.write(img)
    dt = time.time() - t0
    print(f"  [{idx+1:2}/24] {shot_id:30} {vol_name:18} {len(img)//1024}KB {dt:.1f}s")
    return True

print("=" * 70)
print("V20-Q · 三国真人摄影批量生成（24 张 · 512x768 · majicMIX realisticv7）")
print("=" * 70)
ok = 0
t_start = time.time()
for i, (sid, vname, pmain) in enumerate(SHOTS):
    if gen_one(i, sid, vname, pmain):
        ok += 1
dt_total = time.time() - t_start
print("=" * 70)
print(f"V20-Q 生成完成：{ok}/{len(SHOTS)} 张 · 总耗时 {dt_total:.0f}s（平均 {dt_total/max(ok,1):.1f}s/张）")
print("=" * 70)