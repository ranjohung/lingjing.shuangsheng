import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'


def load_pages(text):
    marker = 'var LJ_PAGES = '
    start = text.index(marker) + len(marker)
    pages, length = json.JSONDecoder().raw_decode(text[start:])
    return pages, start, length


HOME_CSS = '''
<style id="lj-discovery-style">
.lj-discovery-note{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:rgba(234,234,240,.64);font-size:10px;font-weight:500;vertical-align:middle}
.lj-discovery-note.ok{color:#b8f5d2;border-color:rgba(91,214,145,.35)}
.lj-discovery-note.off{color:#ffd9a8;border-color:rgba(242,172,87,.35)}
.lj-discovery-modal{position:fixed;inset:0;z-index:5000;display:flex;align-items:flex-start;justify-content:center;padding:72px 16px 20px;background:rgba(3,4,16,.68);backdrop-filter:blur(12px)}
.lj-discovery-card{width:min(420px,100%);max-height:75vh;overflow:auto;border:1px solid rgba(255,255,255,.14);border-radius:24px;background:linear-gradient(160deg,#19162d,#0d0e1e);box-shadow:0 24px 60px rgba(0,0,0,.45);padding:18px;color:#f5f3ff}
.lj-discovery-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.lj-discovery-head h3{margin:0;font-size:18px}.lj-discovery-close{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer}
.lj-discovery-item{padding:12px 0;border-top:1px solid rgba(255,255,255,.09)}.lj-discovery-item:first-child{border-top:0}.lj-discovery-item.unread{color:#fff}.lj-discovery-item.read{color:rgba(255,255,255,.58)}.lj-discovery-item small{display:block;margin-top:4px;color:rgba(255,255,255,.45)}
</style>'''

DISCOVERY_JS = '''
<script id="lj-discovery-runtime">
(function(){
  var API='';
  try { API=(window.LJ_API_BASE||localStorage.getItem('lingjing_api_base')||'').replace(/\\/$/,''); } catch(e) { API=(window.LJ_API_BASE||'').replace(/\\/$/,''); }
  var state={notifications:null,recommendations:null,mode:'未连接'};
  function req(path,options){
    var ctl=window.AbortController?new AbortController():null;
    var timer=ctl?setTimeout(function(){ctl.abort();},2600):null;
    return fetch(API+path,Object.assign({headers:{Accept:'application/json'}},options||{},ctl?{signal:ctl.signal}:{}))
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .finally(function(){if(timer)clearTimeout(timer);});
  }
  function setNotes(ok){
    document.querySelectorAll('[data-lj-discovery-note]').forEach(function(el){
      el.textContent=ok?'接口已连接':'本地内置目录';el.classList.toggle('ok',ok);el.classList.toggle('off',!ok);
    });
  }
  function ensureNote(){
    var h=document.querySelector('.home-board h3');
    if(h&&!h.querySelector('[data-lj-discovery-note]')){var s=document.createElement('span');s.className='lj-discovery-note off';s.dataset.ljDiscoveryNote='';s.textContent='检查接口…';h.appendChild(s);}
    var wh=document.querySelector('.wh-section-title');
    if(wh&&!wh.querySelector('[data-lj-discovery-note]')){var w=document.createElement('span');w.className='lj-discovery-note off';w.dataset.ljDiscoveryNote='';w.textContent='检查接口…';wh.appendChild(w);}
  }
  function modal(){
    var old=document.getElementById('lj-discovery-modal');if(old)old.remove();
    var wrap=document.createElement('div');wrap.id='lj-discovery-modal';wrap.className='lj-discovery-modal';
    var card=document.createElement('div');card.className='lj-discovery-card';
    var head=document.createElement('div');head.className='lj-discovery-head';head.innerHTML='<h3>通知中心</h3><button class="lj-discovery-close" aria-label="关闭">×</button>';card.appendChild(head);
    head.querySelector('button').onclick=function(){wrap.remove();};
    var data=state.notifications;
    if(!data){card.insertAdjacentHTML('beforeend','<div class="lj-discovery-item off">接口未连接，暂无在线通知。<small>当前展示的是本地开发模式，未伪造通知数据。</small></div>');}
    else if(!data.items||!data.items.length){card.insertAdjacentHTML('beforeend','<div class="lj-discovery-item read">暂无通知</div>');}
    else data.items.forEach(function(item){
      var row=document.createElement('div');row.className='lj-discovery-item '+(item.read?'read':'unread');row.innerHTML='<div>'+String(item.title||'未命名通知')+'</div><small>'+String(item.body||'')+'</small>';
      row.onclick=function(){if(!item.read)req('/api/v1/notifications/'+encodeURIComponent(item.id)+'/read',{method:'POST'}).catch(function(){});item.read=true;row.classList.remove('unread');row.classList.add('read');};card.appendChild(row);
    });
    wrap.appendChild(card);wrap.onclick=function(e){if(e.target===wrap)wrap.remove();};document.body.appendChild(wrap);
  }
  function refresh(){
    ensureNote();
    Promise.all([req('/api/v1/notifications'),req('/api/v1/recommendations?limit=4')]).then(function(pair){
      state.notifications=pair[0];state.recommendations=pair[1];state.mode='在线接口';setNotes(true);
      var unread=Number(pair[0].unread_count!=null?pair[0].unread_count:pair[0].unread||0);
      document.querySelectorAll('.hs-bell .badge,.wh-badge').forEach(function(b){b.textContent=String(unread);b.hidden=!(unread>0);});
    }).catch(function(){state.mode='本地内置目录';setNotes(false);});
  }
  window.LJDiscovery={openNotifications:modal,refresh:refresh,state:state};
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.hs-bell,.wh-bell');if(b){e.preventDefault();modal();}});
  setTimeout(refresh,80);
})();
</script>'''


def patch_home(page):
    if 'id="lj-discovery-runtime"' in page:
        return page.replace("var API=(window.LJ_API_BASE||'').replace(/\\/$/,'');", "var API=''; try { API=(window.LJ_API_BASE||localStorage.getItem('lingjing_api_base')||'').replace(/\\/$/,''); } catch(e) { API=(window.LJ_API_BASE||'').replace(/\\/$/,''); }").replace("document.querySelectorAll('.hs-bell .badge,.wh-badge').forEach(function(b){b.textContent=String(pair[0].unread_count||0);b.hidden=!(pair[0].unread_count>0);});", "var unread=Number(pair[0].unread_count!=null?pair[0].unread_count:pair[0].unread||0);document.querySelectorAll('.hs-bell .badge,.wh-badge').forEach(function(b){b.textContent=String(unread);b.hidden=!(unread>0);});")
    page = page.replace('今日推荐</h3>', '今日推荐<span class="lj-discovery-note off" data-lj-discovery-note>检查接口…</span></h3>', 1)
    page = page.replace("onclick=\"if(window.LJToast)window.LJToast.show('warn','3 条未读','通知中心即将开放')\"", "onclick=\"window.LJDiscovery&&window.LJDiscovery.openNotifications()\"", 1)
    return page.replace('</head>', HOME_CSS + '</head>', 1).replace('</body>', DISCOVERY_JS + '</body>', 1)


def patch_world(page):
    if 'id="lj-discovery-runtime"' in page:
        return page.replace("var API=(window.LJ_API_BASE||'').replace(/\\/$/,'');", "var API=''; try { API=(window.LJ_API_BASE||localStorage.getItem('lingjing_api_base')||'').replace(/\\/$/,''); } catch(e) { API=(window.LJ_API_BASE||'').replace(/\\/$/,''); }").replace("document.querySelectorAll('.hs-bell .badge,.wh-badge').forEach(function(b){b.textContent=String(pair[0].unread_count||0);b.hidden=!(pair[0].unread_count>0);});", "var unread=Number(pair[0].unread_count!=null?pair[0].unread_count:pair[0].unread||0);document.querySelectorAll('.hs-bell .badge,.wh-badge').forEach(function(b){b.textContent=String(unread);b.hidden=!(unread>0);});")
    page = page.replace('<div class="wh-ico">🔔<span class="wh-badge">3</span></div>', '<div class="wh-ico wh-bell" role="button" tabindex="0" aria-label="通知">🔔<span class="wh-badge">3</span></div>', 1)
    return page.replace('</head>', HOME_CSS + '</head>', 1).replace('</body>', DISCOVERY_JS + '</body>', 1)


text = INDEX.read_text(encoding='utf-8-sig')
pages, start, length = load_pages(text)
pages['home'] = patch_home(pages['home'])
pages['world-hub'] = patch_world(pages['world-hub'])
payload = json.dumps(pages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
INDEX.write_text(text[:start] + payload + text[start + length:], encoding='utf-8')
(ROOT / 'product-preview.html').write_text(INDEX.read_text(encoding='utf-8'), encoding='utf-8')
print('patched discovery frontend: home/world-hub, synced product-preview.html')
