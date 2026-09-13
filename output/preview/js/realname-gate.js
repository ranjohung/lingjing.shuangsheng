/* =====================================================================
 * V20-U · 通用实名认证门控（realname-gate.js）
 * 用途：未实名用户点击创建角色 / 创建智能体等创作类入口 → 弹实名 modal，
 *       提交后写入 lingjing_v519_realname_done 并跳转目标页。
 *       已实名用户直接跳走，不弹 modal。
 *
 * 调用方式：
 *   <a href="character-create.html"
 *      onclick="event.preventDefault(); window.LJRealname.gate(this.href);">
 *     创建智能体
 *   </a>
 *
 *   或者在 JS 中：
 *   document.getElementById('btn-create').addEventListener('click', function(){
 *     window.LJRealname.gate('character-create.html');
 *   });
 *
 * 样式：与 plot-runner.html 的 .plot-realname-card 一致（已迁出为 .rnm-* 通用类）
 * ===================================================================== */

(function () {
  var STORAGE_DONE = 'lingjing_v519_realname_done';
  var STORAGE_INFO = 'lingjing_v519_realname_info';
  var STORAGE_TRIES = 'lingjing_v519_realname_tries';

  // 校验：身份证 18 位（含 X）/ 港澳台居住证 / 护照字母+数字 5-20 位
  function validateId(type, id) {
    id = String(id || '').trim();
    if (type === '身份证') {
      return /^\d{17}[\dXx]$/.test(id);
    }
    if (type === '港澳台居住证') {
      return /^[A-Z0-9]{8,18}$/.test(id);
    }
    if (type === '护照') {
      return /^[A-Z0-9]{5,20}$/.test(id);
    }
    return false;
  }

  function validateName(name) {
    name = String(name || '').trim();
    return name.length >= 2 && name.length <= 20;
  }

  function getTries() {
    return parseInt(localStorage.getItem(STORAGE_TRIES) || '0', 10);
  }

  function incTries() {
    localStorage.setItem(STORAGE_TRIES, String(getTries() + 1));
  }

  // 注入通用样式（保证脱离 plot-runner 也能独立渲染）
  function ensureCss() {
    if (document.getElementById('rnm-css')) return;
    var s = document.createElement('style');
    s.id = 'rnm-css';
    s.textContent =
      '.rnm-mask{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center}' +
      '.rnm-mask.open{display:flex}' +
      '.rnm-card{background:#fff;color:#333;width:86%;max-width:380px;border-radius:14px;padding:20px 18px 16px;box-shadow:0 12px 40px rgba(0,0,0,.5);animation:rnmIn .25s ease-out}' +
      '@keyframes rnmIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
      '.rnm-card h3{font-size:18px;margin:0 0 8px;text-align:center;font-weight:600}' +
      '.rnm-intro{font-size:13px;color:#666;line-height:1.6;background:#f7f7f7;border-radius:8px;padding:10px 12px;margin-bottom:14px}' +
      '.rnm-row{display:flex;align-items:center;margin-bottom:12px;font-size:13px}' +
      '.rnm-row label{width:64px;color:#666;flex-shrink:0}' +
      '.rnm-row input,.rnm-row select{flex:1;border:1px solid #ddd;border-radius:6px;padding:8px 10px;font-size:13px;background:#fff;color:#333;min-width:0}' +
      '.rnm-row input:focus,.rnm-row select:focus{outline:none;border-color:#E94560}' +
      '.rnm-notice{font-size:11px;color:#999;line-height:1.7;background:#fafafa;border-radius:6px;padding:10px 12px;margin:8px 0 16px}' +
      '.rnm-notice div{margin-bottom:2px}' +
      '.rnm-actions{display:flex;gap:12px;margin-top:6px}' +
      '.rnm-actions button{flex:1;padding:11px 0;border-radius:22px;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:transform .15s,opacity .15s}' +
      '.rnm-actions button:active{transform:scale(.97)}' +
      '.rnm-cancel{background:#f3f3f3;color:#666}' +
      '.rnm-submit{background:#E94560;color:#fff}' +
      '.rnm-submit:disabled{background:#ccc;opacity:.7;cursor:not-allowed}' +
      '@media (prefers-color-scheme:dark){' +
      '.rnm-card{background:#1f1f2e;color:#e0e0e0}' +
      '.rnm-intro,.rnm-notice{background:#2a2a3a;color:#aaa}' +
      '.rnm-row input,.rnm-row select{background:#15151f;color:#e0e0e0;border-color:#333}' +
      '.rnm-cancel{background:#2a2a3a;color:#aaa}' +
      '}';
    document.head.appendChild(s);
  }

  // 挂载 modal DOM（幂等）
  function ensureModal() {
    if (document.getElementById('rnm-mask')) return;
    ensureCss();
    var dlg = document.createElement('div');
    dlg.id = 'rnm-mask';
    dlg.className = 'rnm-mask';
    dlg.innerHTML =
      '<div class="rnm-card">' +
        '<h3>实名认证通知</h3>' +
        '<div class="rnm-intro">根据国家相关规定，未实名账号无法使用部分功能，请先填写实名信息</div>' +
        '<div class="rnm-row"><label>真实姓名</label><input id="rnm-name" placeholder="请输入真实姓名" maxlength="20" autocomplete="off" /></div>' +
        '<div class="rnm-row"><label>证件类型</label>' +
          '<select id="rnm-type"><option>身份证</option><option>港澳台居住证</option><option>护照</option></select>' +
        '</div>' +
        '<div class="rnm-row"><label>证件号码</label><input id="rnm-id" placeholder="请输入证件号码" maxlength="20" autocomplete="off" /></div>' +
        '<div class="rnm-notice">' +
          '<div>1、您提供的证件信息将受到严格保护，仅用于身份验证，未经本人许可不会用于其他用途</div>' +
          '<div>2、如果您是港澳台或海外用户需要实名认证，请联系客服为您进行核实</div>' +
          '<div>3、每日仅可提交 3 次身份认证，请认真检查提交身份信息</div>' +
        '</div>' +
        '<div class="rnm-actions">' +
          '<button class="rnm-cancel" id="rnm-cancel">取消</button>' +
          '<button class="rnm-submit" id="rnm-submit">提交</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dlg);
  }

  function showToast(kind, title, msg) {
    var c = document.getElementById('toast');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast';
      c.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:400;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;width:max-content;max-width:86vw';
      document.body.appendChild(c);
    }
    var t = document.createElement('div');
    t.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;font-size:13px;background:rgba(28,37,66,.96);border:1px solid rgba(255,255,255,.15);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.5);animation:toastIn .35s cubic-bezier(.16,1,.3,1) both';
    t.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:' + (kind === 'ok' ? '#4ECCA3' : '#FFB347') + '"></span><span><b>' + title + '</b>' + (msg ? '<span style="opacity:.65"> · ' + msg + '</span>' : '') + '</span>';
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function isDone() {
    try { return localStorage.getItem(STORAGE_DONE) === 'true'; } catch (e) { return false; }
  }

  /**
   * 实名门控主函数
   * @param {string} target - 目标 URL（已通过校验则跳此 URL）
   * @param {object} [opts] - {skipTries:false, source:'create-character'} 用于测试
   * @returns {boolean} - true 表示放行已跳，false 表示弹窗中
   */
  function gate(target, opts) {
    opts = opts || {};
    if (isDone()) {
      if (target) window.location.href = target;
      return true;
    }
    // 每日 3 次上限
    if (!opts.skipTries && getTries() >= 3) {
      showToast('warn', '实名认证', '今日次数已用完，明天再来');
      if (target) window.location.href = target;
      return false;
    }
    ensureModal();
    var dlg = document.getElementById('rnm-mask');
    var nm = document.getElementById('rnm-name');
    var tp = document.getElementById('rnm-type');
    var id = document.getElementById('rnm-id');
    var cancel = document.getElementById('rnm-cancel');
    var submit = document.getElementById('rnm-submit');

    // 重置状态
    nm.value = ''; tp.value = '身份证'; id.value = '';
    dlg.classList.add('open');
    setTimeout(function () { nm.focus(); }, 200);

    function close() {
      dlg.classList.remove('open');
      cancel.onclick = null;
      submit.onclick = null;
    }

    cancel.onclick = function () { close(); };
    submit.onclick = function () {
      if (!validateName(nm.value)) {
        showToast('warn', '姓名格式', '请输入 2-20 字');
        nm.focus();
        return;
      }
      if (!validateId(tp.value, id.value)) {
        showToast('warn', '证件号格式', '请输入正确的' + tp.value);
        id.focus();
        return;
      }
      localStorage.setItem(STORAGE_DONE, 'true');
      try {
        localStorage.setItem(STORAGE_INFO, JSON.stringify({
          name: nm.value.trim(),
          type: tp.value,
          idLast4: id.value.trim().slice(-4),
          ts: Date.now()
        }));
      } catch (e) {}
      incTries();
      close();
      showToast('ok', '实名成功', '已解锁创作功能');
      if (target) setTimeout(function () { window.location.href = target; }, 400);
    };
    return false;
  }

  window.LJRealname = {
    gate: gate,
    isDone: isDone,
    validateName: validateName,
    validateId: validateId
  };
})();