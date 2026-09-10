from pathlib import Path
p=Path('scripts/generate_realistic_portrait.py')
p.write_text('''import base64,json
from pathlib import Path
import httpx
root=Path(__file__).resolve().parents[1]
out=root/'apps/web/public/assets/characters/ling-realistic-v1.png'
out.parent.mkdir(parents=True,exist_ok=True)
with httpx.Client(base_url='http://127.0.0.1:7860',timeout=300) as client:
    samplers=client.get('/sdapi/v1/samplers').json()
    sampler='DPM++ 2M' if any(x['name']=='DPM++ 2M' for x in samplers) else 'Euler'
    payload=dict(prompt='RAW photograph, professional editorial portrait of a fictional adult East Asian woman age 30, natural realistic facial proportions, realistic skin texture and pores, warm brown eyes, straight dark shoulder length hair tucked behind one ear, subtle silver hair pin, wearing a fully buttoned tailored navy jacket over an ivory blouse, elegant reserved expression, upper body, soft large window light, subtle studio rim lighting, muted slate blue studio background, 85mm portrait lens, shallow depth of field, high detail, photographic realism',negative_prompt='anime, cartoon, illustration, 3d render, cgi, doll, plastic skin, airbrushed, child, teen, nude, cleavage, text, watermark, logo, blurry, distorted face, asymmetrical eyes, extra fingers',width=512,height=768,steps=28,cfg_scale=6.5,seed=984217,sampler_name=sampler,save_images=False,override_settings={'sd_model_checkpoint':'majicMIX realisticv7.safetensors'},override_settings_restore_afterwards=True)
    result=client.post('/sdapi/v1/txt2img',json=payload);result.raise_for_status();data=result.json()
    image=base64.b64decode(data['images'][0].split(',')[-1]);assert image.startswith(b'\\x89PNG')
    out.write_bytes(image);out.with_suffix('.json').write_text(json.dumps({'request':payload,'info':data.get('info')},ensure_ascii=False,indent=2),encoding='utf-8')
    print('REALISTIC_PORTRAIT_SAVED',out,flush=True)
''',encoding='utf-8')
