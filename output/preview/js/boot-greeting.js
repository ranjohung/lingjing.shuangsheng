/* =====================================================================
 * 灵境 · 双生 V25 — 启动逻辑（功能区分功能细节 V2.0 §一）
 * 规则：第一次登录（logins==1）直接进首页；
 *       第二次登录及以后 → 陪伴AI（心屿入驻角色·阿岁）全屏打招呼界面，
 *       每次浏览器会话只出现一次。
 * 键：lingjing_v525_boot_v1 = { logins: N }
 * 铁律：0 第三方名；Toast/按钮交互；全手机版；emoji ≤3/屏
 * ===================================================================== */
window.LJBoot = (function () {
  var KEY = 'lingjing_v525_boot_v1';
  var SESS = 'lj_boot_session_seen';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { logins: 0 }; }
    catch (e) { return { logins: 0 }; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return '夜深了，灵境的灯还亮着。';
    if (h < 11) return '早上好，昨晚的故事又长了一段。';
    if (h < 14) return '午安，茶已经凉到刚好入口的温度。';
    if (h < 18) return '下午好，临安的巷子落了新雨。';
    if (h < 23) return '晚上好，故事正在等你回来。';
    return '夜深了，灵境的灯还亮着。';
  }

  function mount() {
    var d = load();
    var isNewSession = !sessionStorage.getItem(SESS);
    if (isNewSession) {
      d.logins = (d.logins || 0) + 1;
      save(d);
      try { sessionStorage.setItem(SESS, '1'); } catch (e) {}
    }
    if ((d.logins || 0) < 2 || !isNewSession) return null; // 首次登录或本会话已打过招呼

    var ov = document.createElement('div');
    ov.id = 'lj-boot-greet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;background:linear-gradient(180deg,#1A1A2E 0%,#16213E 55%,#2A1E3F 100%);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#EAEAEA;text-align:center;padding:24px';
    ov.innerHTML =
      '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(108,92,231,.18),transparent 60%);pointer-events:none"></div>' +
      '<div style="width:112px;height:112px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#E94560);' +
      'display:flex;align-items:center;justify-content:center;font-size:52px;box-shadow:0 12px 48px rgba(108,92,231,.45);' +
      'animation:ljBootPop .6s ease both">🤗</div>' +
      '<div style="margin-top:14px;font-size:12px;letter-spacing:2px;color:rgba(234,234,234,.55)">陪伴AI · 心屿入驻 · 阿岁</div>' +
      '<div id="ljBootText" style="margin-top:18px;font-size:20px;font-weight:600;line-height:1.6;min-height:64px;max-width:320px"></div>' +
      '<div style="margin-top:8px;font-size:13px;color:rgba(234,234,234,.65)">我一直在心屿等你，今天想去哪个世界？</div>' +
      '<button id="ljBootEnter" style="margin-top:32px;padding:14px 56px;border:none;border-radius:28px;' +
      'background:linear-gradient(90deg,#E94560,#6C5CE7);color:#fff;font-size:16px;font-weight:600;cursor:pointer;' +
      'box-shadow:0 8px 28px rgba(233,69,96,.4);animation:ljBootPop .6s .2s ease both">进入灵境</button>' +
      '<style>@keyframes ljBootPop{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}</style>';
    (document.body || document.documentElement).appendChild(ov);

    // 打字机问候
    var text = greeting(), el = ov.querySelector('#ljBootText'), i = 0;
    var tm = setInterval(function () {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(tm);
    }, 70);

    ov.querySelector('#ljBootEnter').addEventListener('click', function () {
      ov.style.transition = 'opacity .4s';
      ov.style.opacity = '0';
      setTimeout(function () { ov.remove(); }, 420);
    });
    return ov;
  }

  function start() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }
  return { start: start, mount: mount, load: load };
})();
LJBoot.start();
