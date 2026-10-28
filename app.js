/* SOMDEJ HR Connect — app.js : แกนกลาง (เรียกหลังบ้าน · แคช · ล็อกอิน · เส้นทางหน้า · UI กลาง)
 * เลขรุ่นต้องตรงกับ Config.gs และ version.json */
var HRC_BUILD = '2569-10-28.2';
var HRC_VERSION = '1.2569';

var S = { token: null, boot: null, me: null, route: null };

/* =================================================================== ตัวช่วย */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function nf(n) { return (+n || 0).toLocaleString('th-TH'); }
function pct(a, b) { return b ? Math.round(a * 1000 / b) / 10 : 0; }
var TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
var TH_DAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
function thDate(iso, withTime) {
  var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return '-';
  var s = (+m[3]) + ' ' + TH_MON[+m[2] - 1] + ' ' + String(+m[1] + 543);
  return withTime !== false && m[4] ? s + ' ' + m[4] + ':' + m[5] + ' น.' : s;
}
function thShort(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/); return m ? (+m[3]) + ' ' + TH_MON[+m[2] - 1] + (m[4] ? ' ' + m[4] + ':' + m[5] : '') : '-'; }
function localIso(d) { d = d || new Date(); var z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }
function parseLocal(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/); return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) : null; }
function initials(name) { var n = String(name || '').replace(/^(นาย|นางสาว|นาง|ดร\.|นพ\.|พญ\.)\s*/, '').trim(); return n ? n.charAt(0) : '?'; }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
function hasRole(r) { return S.me && S.me.roles.indexOf(r) >= 0; }
function isAdmin() { return hasRole('SUPER') || hasRole('ADMIN'); }
function isHead() { return hasRole('HEAD'); }
function setAccent(hex) {
  hex = hex || '#8E4B9D';
  var r = document.documentElement.style;
  r.setProperty('--accent', hex);
  r.setProperty('--accent-2', shade(hex, -30));
  r.setProperty('--accent-soft', mix(hex, 0.1));
}
function shade(hex, amt) { var n = parseInt(hex.slice(1), 16), c = function (x) { return Math.max(0, Math.min(255, x)); }; return '#' + ((1 << 24) + (c((n >> 16) + amt) << 16) + (c(((n >> 8) & 255) + amt) << 8) + c((n & 255) + amt)).toString(16).slice(1); }
function mix(hex, a) { var n = parseInt(hex.slice(1), 16), f = function (x) { return Math.round(x * a + 255 * (1 - a)); }; return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; }

/* =================================================================== ไอคอน (เส้น) */
var ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  shirt: '<path d="M8 3 3.5 5.5 2 10l3.5 1.5V21h13v-9.5L22 10l-1.5-4.5L16 3c-.6 1.6-2.1 2.6-4 2.6S8.6 4.6 8 3Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M16 3v3M8 3v3M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M17.9 17.9A10 10 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 4.1-5.1M9.9 4.2A9 9 0 0 1 12 4c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5Z"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/>',
  male: '<circle cx="10" cy="14" r="6"/><path d="M14.5 9.5 21 3M15 3h6v6"/>',
  female: '<circle cx="12" cy="9" r="6"/><path d="M12 15v7M9 19h6"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M15 8l2 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  arrowr: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowl: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>'
};
function ic(name, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }

/* =================================================================== เครือข่าย (ตามแม่แบบ: ไม่มี preflight · จำกัด 4 คำขอ · อ่านลองซ้ำ) */
var NET = { active: 0, queue: [], MAX: 4 };
function netSlot() { return new Promise(function (res) { if (NET.active < NET.MAX) { NET.active++; res(); } else NET.queue.push(res); }); }
function netDone() { var n = NET.queue.shift(); if (n) n(); else NET.active = Math.max(0, NET.active - 1); }
function isRead(a) { return /^(get|list|bootstrap|branding|ping|lookup|preview)/.test(a); }
function fetchOnce(action, payload) {
  if (!window.API_URL || /ใส่ลิงก์/.test(window.API_URL)) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js'));
  return fetch(window.API_URL, { method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store',
    body: JSON.stringify({ action: action, token: S.token, payload: payload || {} }) })
    .then(function (r) { return r.text(); })
    .then(function (t) {
      if (String(t).trim().charAt(0) === '<') { var e = new Error('เซิร์ฟเวอร์ Google ไม่ว่างชั่วคราว กรุณาลองใหม่'); e.busy = true; throw e; }
      return JSON.parse(t);
    }, function () { var e = new Error('เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'); e.net = true; throw e; });
}
function rawCall(action, payload) {
  var waits = [700, 1600, 3200], tries = 0, read = isRead(action);
  var attempt = function () {
    return netSlot().then(function () { return fetchOnce(action, payload); })
      .then(function (x) { netDone(); return x; }, function (e) {
        netDone();
        if (read && tries < waits.length && (e.busy || e.net)) { var w = waits[tries++]; return new Promise(function (r) { setTimeout(r, w); }).then(attempt); }
        throw e;
      });
  };
  return attempt();
}
var MEMO = {}, MEMO_T = {}, PC = 'hrc_c:';
function mkey(a, p) { return a + '|' + JSON.stringify(p || {}); }
function pcKey(k) { return PC + (S.me ? S.me.empCode : '') + ':' + k; }
function pcGet(k) { try { var v = localStorage.getItem(pcKey(k)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function pcSet(k, d) { try { var s = JSON.stringify(d); if (s.length < 900000) localStorage.setItem(pcKey(k), s); } catch (e) { } }
function cacheClear() { MEMO = {}; MEMO_T = {}; try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PC) === 0) localStorage.removeItem(k); }); } catch (e) { } }

/** api(action, payload, {fresh, onCache}) — onCache วาดข้อมูลเดิมทันที แล้ว then วาดข้อมูลล่าสุด */
function api(action, payload, opt) {
  opt = opt || {};
  var k = mkey(action, payload);
  if (opt.fresh && opt.onCache) {
    var cd = MEMO[k] || pcGet(k);
    if (cd) try { opt.onCache(cd); } catch (e) { console.error(e); }
    if (MEMO[k] && Date.now() - MEMO_T[k] < 15000) return Promise.resolve(MEMO[k]);
  }
  if (!isRead(action)) cacheClear();
  return rawCall(action, payload).then(function (res) {
    if (res.ok) { if (opt.fresh) { MEMO[k] = res.data; MEMO_T[k] = Date.now(); pcSet(k, res.data); } return res.data; }
    if (res.error === 'SESSION_EXPIRED') { expired(); var e = new Error('หมดเวลาการเข้าใช้งาน กรุณาเข้าสู่ระบบใหม่'); e.expired = true; throw e; }
    throw new Error(res.error || 'เกิดข้อผิดพลาด');
  });
}

/* =================================================================== UI กลาง: toast · modal · confirm · ปุ่มกำลังทำงาน */
function toast(msg, type, title) {
  var box = $('#toasts');
  var el = document.createElement('div');
  var t = type || 'info';
  el.className = 'toast ' + t;
  el.setAttribute('role', t === 'err' ? 'alert' : 'status');
  el.innerHTML = '<div class="ti">' + ic(t === 'ok' ? 'check' : t === 'err' ? 'x' : t === 'warn' ? 'alert' : 'info') + '</div><div class="tm">' + (title ? '<b>' + esc(title) + '</b>' : '') + esc(msg) + '</div><button class="iconbtn" style="width:26px;height:26px" aria-label="ปิด">' + ic('x') + '</button>';
  box.appendChild(el);
  var close = function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 260); };
  el.querySelector('button').onclick = close;
  setTimeout(close, t === 'err' ? 7000 : 3800);
}
function errToast(e, title) { if (e && e.expired) return; toast(e && e.message ? e.message : String(e), 'err', title || 'ทำรายการไม่สำเร็จ'); }

function modal(o) {
  var ov = document.createElement('div');
  ov.className = 'ov';
  ov.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
    (o.title ? '<div class="mh"><h3>' + o.title + '</h3><button class="iconbtn" data-x aria-label="ปิด">' + ic('x') + '</button></div>' : '') +
    '<div class="mb">' + (o.body || '') + '</div>' + (o.foot !== false ? '<div class="mf">' + (o.foot || '<button class="btn" data-x>ปิด</button>') + '</div>' : '') + '</div>';
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  var m = { el: ov, close: function () { ov.remove(); if (!$('.ov')) document.body.style.overflow = ''; if (o.onClose) o.onClose(); } };
  $$('[data-x]', ov).forEach(function (b) { b.onclick = m.close; });
  ov.addEventListener('mousedown', function (e) { if (e.target === ov && !o.sticky) m.close(); });
  var onKey = function (e) { if (e.key === 'Escape' && document.body.contains(ov) && !o.sticky) { m.close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  if (o.onOpen) o.onOpen(ov, m);
  var first = ov.querySelector('input:not([type=hidden]),select,textarea'); if (first && !o.noFocus) setTimeout(function () { first.focus(); }, 60);
  return m;
}
/** confirmBox({title, msg(html), ok, danger, icon}) → Promise<boolean> */
function confirmBox(o) {
  return new Promise(function (res) {
    var done = false;
    var m = modal({ title: '', foot: '<button class="btn" data-no>' + esc(o.cancel || 'ยกเลิก') + '</button><button class="btn ' + (o.danger ? 'brand' : 'primary') + '" data-yes>' + esc(o.ok || 'ยืนยัน') + '</button>',
      body: '<div class="center"><div class="bigicon ' + (o.danger ? 'danger' : o.tone || 'acc') + '">' + ic(o.icon || (o.danger ? 'alert' : 'info')) + '</div><h3 style="font-size:20px;margin-bottom:8px">' + esc(o.title) + '</h3><div class="muted">' + (o.msg || '') + '</div></div>',
      onClose: function () { if (!done) res(false); } });
    m.el.querySelector('[data-no]').onclick = function () { done = true; m.close(); res(false); };
    m.el.querySelector('[data-yes]').onclick = function () { done = true; m.close(); res(true); };
  });
}
/** ปุ่มแสดงสถานะกำลังทำงานระหว่าง promise */
function busy(btn, p) {
  if (!btn) return p;
  var html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (btn.dataset.busy || 'กำลังดำเนินการ…');
  var restore = function () { if (document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = html; } };
  return p.then(function (x) { restore(); return x; }, function (e) { restore(); throw e; });
}
function copyText(t, label) {
  var ok = function () { toast((label ? label + ' ' : '') + 'คัดลอกแล้ว', 'ok'); };
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(String(t)).then(ok, function () { fallbackCopy(t); ok(); });
  fallbackCopy(t); ok(); return Promise.resolve();
}
function fallbackCopy(t) { var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); }
function skel(n) { var s = ''; for (var i = 0; i < (n || 3); i++) s += '<div class="skel" style="height:' + (i ? 90 : 120) + 'px"></div>'; return '<div class="loadingpage">' + s + '</div>'; }
function progBar(p) { return '<div class="prog ' + (p >= 90 ? 'hi' : p >= 50 ? 'mid' : 'lo') + '"><i style="width:' + Math.min(100, p) + '%"></i></div>'; }
function ring(p, size, color) {
  size = size || 64; var r = size / 2 - 6, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, p) / 100);
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="rgba(255,255,255,.25)" stroke-width="7" fill="none"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + (color || '#fff') + '" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
}

/* =================================================================== Excel (โหลดไลบรารีเมื่อใช้) */
var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = XLSX_URL; s.onload = function () { res(window.XLSX); };
    s.onerror = function () { rej(new Error('โหลดตัวอ่าน/เขียน Excel ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต')); };
    document.head.appendChild(s);
  });
}
/** sheets = [{name, rows (array of arrays, แถวแรก = หัว), widths?}] */
function exportXlsx(filename, sheets) {
  return loadXLSX().then(function (X) {
    var wb = X.utils.book_new();
    sheets.forEach(function (sh) {
      var ws = X.utils.aoa_to_sheet(sh.rows);
      ws['!cols'] = (sh.widths || sh.rows[0].map(function (h, i) {
        var mx = 6; sh.rows.slice(0, 200).forEach(function (r) { mx = Math.max(mx, String(r[i] == null ? '' : r[i]).length); }); return Math.min(48, mx + 2);
      })).map(function (w) { return { wch: w }; });
      X.utils.book_append_sheet(wb, ws, String(sh.name).slice(0, 31));
    });
    X.writeFile(wb, filename);
    toast('ดาวน์โหลด ' + filename, 'ok', 'ส่งออกไฟล์แล้ว');
  });
}
/** อ่านไฟล์ Excel/CSV → [{header: value}] ของชีทแรก */
function readSheetFile(file) {
  return loadXLSX().then(function (X) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var wb = X.read(new Uint8Array(fr.result), { type: 'array', cellDates: false, raw: false });
          var ws = wb.Sheets[wb.SheetNames[0]];
          res(X.utils.sheet_to_json(ws, { defval: '', raw: false }));
        } catch (e) { rej(new Error('อ่านไฟล์ไม่ได้: ' + e.message)); }
      };
      fr.onerror = function () { rej(new Error('อ่านไฟล์ไม่ได้')); };
      fr.readAsArrayBuffer(file);
    });
  });
}
function pickFile(accept) {
  return new Promise(function (res) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept || '.xlsx,.xls,.csv';
    inp.onchange = function () { res(inp.files[0] || null); }; inp.click();
  });
}

/* =================================================================== เส้นทางหน้า + โครงหน้า */
var ROUTES = {};   // ชื่อ → function(params) ลงทะเบียนจาก pages-*.js
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
function parseRoute() {
  var h = (location.hash || '#/').replace(/^#\/?/, '').split('?')[0];
  var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
  var q = {}; (location.hash.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
  return { parts: parts, q: q };
}
function render() {
  if (!S.token || !S.boot) return showLogin();
  var r = parseRoute(), name = r.parts[0] || 'home';
  if (name === 'admin') name = 'admin/' + (r.parts[1] || 'dashboard');
  var fn = ROUTES[name];
  if (!fn) { name = 'home'; fn = ROUTES.home; }
  S.route = name;
  shell();
  window.scrollTo(0, 0);
  try { fn(r.parts.slice(name.indexOf('admin/') === 0 ? 2 : 1), r.q); }
  catch (e) { console.error(e); $('#page').innerHTML = '<div class="empty">' + ic('alert') + '<p>' + esc(e.message) + '</p></div>'; }
}
function defaultEventId() { var ev = (S.boot.events || [])[0]; return ev ? ev.id : ''; }
function navItems() {
  var ev = S.lastAdminEvent || defaultEventId(), items = [{ sec: 'บุคลากร' }, { k: 'home', href: '#/', icon: 'home', label: 'หน้าแรก / กิจกรรม' }];
  if (isAdmin() || isHead()) {
    items.push({ sec: isAdmin() ? 'ผู้ดูแลระบบ' : 'หัวหน้าฝ่าย/หน่วย' });
    items.push({ k: 'admin/dashboard', href: '#/admin/dashboard/' + ev, icon: 'chart', label: 'แดชบอร์ด' });
    items.push({ k: 'admin/tracking', href: '#/admin/tracking/' + ev, icon: 'users', label: 'ติดตามรายบุคคล' });
    items.push({ k: 'admin/reports', href: '#/admin/reports/' + ev, icon: 'table', label: 'รายงาน' });
  }
  if (isAdmin()) {
    items.push({ k: 'admin/mail', href: '#/admin/mail/' + ev, icon: 'mail', label: 'อีเมลติดตาม' });
    items.push({ sec: 'จัดการ' });
    items.push({ k: 'admin/events', href: '#/admin/events', icon: 'layers', label: 'กิจกรรม' });
    items.push({ k: 'admin/roster', href: '#/admin/roster', icon: 'user', label: 'รายชื่อบุคลากร' });
    items.push({ k: 'admin/heads', href: '#/admin/heads', icon: 'building', label: 'หัวหน้าฝ่าย/หน่วย' });
    items.push({ k: 'admin/settings', href: '#/admin/settings', icon: 'settings', label: 'ตั้งค่าระบบ' });
  }
  return items;
}
function shell() {
  var app = $('#app');
  if (!app.querySelector('.main')) {
    app.innerHTML = '<aside class="side"><div class="brandbox"><img src="logo.jpg" alt=""><div><b>SOMDEJ HR Connect</b><small>ศูนย์รวมกิจกรรมบุคลากร</small></div></div><nav class="nav" id="nav"></nav>' +
      '<div class="me"><div class="avatar" id="meav"></div><div class="who"><b id="mename"></b><small id="mesub"></small></div><button class="iconbtn" id="btnout" title="ออกจากระบบ" aria-label="ออกจากระบบ">' + ic('logout') + '</button></div><div class="ver">v' + HRC_VERSION + ' · ' + HRC_BUILD + '</div></aside>' +
      '<div class="main"><header class="topbar"><img src="logo.jpg" alt=""><div style="flex:1;min-width:0"><b>SOMDEJ HR Connect</b><small id="topsub"></small></div><button class="iconbtn" id="btnout2" aria-label="ออกจากระบบ">' + ic('logout') + '</button></header>' +
      '<main class="content"><div id="annc"></div><div id="page"></div></main></div><nav class="bottomnav" id="bnav"></nav>';
    $('#btnout').onclick = $('#btnout2').onclick = askLogout;
  }
  var items = navItems();
  $('#nav').innerHTML = items.map(function (it) {
    if (it.sec) return '<div class="sec">' + esc(it.sec) + '</div>';
    return '<a href="' + it.href + '" class="' + (S.route === it.k ? 'on' : '') + '">' + ic(it.icon) + '<span>' + esc(it.label) + '</span></a>';
  }).join('');
  var mob = items.filter(function (i) { return !i.sec; });
  if (mob.length > 5) mob = mob.filter(function (i) { return ['home', 'admin/dashboard', 'admin/tracking', 'admin/reports', 'admin/settings'].indexOf(i.k) >= 0; });
  $('#bnav').innerHTML = mob.length > 1 ? mob.map(function (it) {
    return '<a href="' + it.href + '" class="' + (S.route === it.k ? 'on' : '') + '">' + ic(it.icon) + '<span>' + esc(it.label.split(' / ')[0].replace('ติดตามรายบุคคล', 'ติดตาม')) + '</span></a>';
  }).join('') : '';
  $('#bnav').style.display = mob.length > 1 ? '' : 'none';
  $('#meav').textContent = initials(S.me.firstName || S.me.name);
  $('#mename').textContent = S.me.name;
  $('#mesub').textContent = S.me.empCode + ' · ' + (S.me.position || '');
  $('#topsub').textContent = S.me.name;
  var a = S.boot.brand && S.boot.brand.announcement;
  $('#annc').innerHTML = a ? '<div class="announce">' + ic('info') + '<div>' + esc(a) + '</div></div>' : '';
}
function pageHead(title, sub, actions, crumb) {
  return '<div class="pagehead"><div>' + (crumb ? '<div class="crumb">' + crumb + '</div>' : '') + '<h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="row">' + (actions || '') + '</div></div>';
}

/* =================================================================== ล็อกอิน / ออก */
function saveSession(token, boot) {
  S.token = token; S.boot = boot; S.me = boot.me;
  try { localStorage.setItem('hrc_token', token); } catch (e) { }
}
function expired() {
  if (!S.token) return;
  S.token = null; S.boot = null; cacheClear();
  try { localStorage.removeItem('hrc_token'); } catch (e) { }
  toast('หมดเวลาการเข้าใช้งาน กรุณาเข้าสู่ระบบใหม่', 'warn');
  showLogin();
}
function askLogout() {
  confirmBox({ title: 'ออกจากระบบ?', msg: 'ข้อมูลที่บันทึกแล้วจะไม่หาย', ok: 'ออกจากระบบ', icon: 'logout' }).then(function (y) {
    if (!y) return;
    api('logout', {}).catch(function () { });
    S.token = null; S.boot = null; cacheClear();
    try { localStorage.removeItem('hrc_token'); } catch (e) { }
    toast('ออกจากระบบแล้ว', 'ok');
    location.hash = '#/';
    showLogin();
  });
}
function refreshBoot() {
  return api('bootstrap', {}).then(function (b) { S.boot = b; S.me = b.me; return b; });
}

/* =================================================================== เริ่มระบบ */
function start() {
  var t = null; try { t = localStorage.getItem('hrc_token'); } catch (e) { }
  if (!t) { $('#bootsplash') && $('#bootsplash').remove(); return showLogin(); }
  S.token = t;
  api('bootstrap', {}).then(function (b) {
    S.boot = b; S.me = b.me;
    $('#bootsplash') && $('#bootsplash').remove();
    render();
  }, function (e) {
    $('#bootsplash') && $('#bootsplash').remove();
    if (!e.expired) { S.token = null; toast(e.message, 'err', 'เชื่อมต่อระบบไม่สำเร็จ'); showLogin(); }
  });
  checkVersion();
}
window.addEventListener('hashchange', function () { if (S.token && S.boot) render(); });
document.addEventListener('DOMContentLoaded', start);

/* ตรวจรุ่นหน้าเว็บทุก 10 นาที */
function checkVersion() {
  setInterval(function () {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (v.build && v.build !== HRC_BUILD && !$('.banner-update')) {
        var b = document.createElement('div'); b.className = 'banner-update';
        b.innerHTML = 'มีระบบรุ่นใหม่ ' + esc(v.buildTh || v.build) + ' <button class="btn sm primary">โหลดใหม่</button>';
        b.querySelector('button').onclick = function () { location.reload(); };
        document.body.appendChild(b);
      }
    }).catch(function () { });
  }, 600000);
}
