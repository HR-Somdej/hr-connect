/* SOMDEJ HR Connect — pages-user.js : เข้าสู่ระบบ · หน้าแรก · หน้ากิจกรรม (จองไซซ์) */

/* =================================================================== เข้าสู่ระบบ */
function fmtCid(v) {
  var d = String(v || '').replace(/\D/g, '').slice(0, 13), p = [1, 4, 5, 2, 1], out = [], i = 0;
  p.forEach(function (n) { if (i < d.length) { out.push(d.substr(i, n)); i += n; } });
  return out.join('-');
}
function cidOk(d) { if (!/^\d{13}$/.test(d)) return false; var s = 0; for (var i = 0; i < 12; i++) s += (+d.charAt(i)) * (13 - i); return ((11 - (s % 11)) % 10) === +d.charAt(12); }

/* ข้อมูลช่วยเหลือ (โทร/LINE) — ใช้ทั้งหน้าเข้าสู่ระบบและในระบบ */
var HELPC = { phone: '23400 - 23419', lineId: '@hrsomdej', lineUrl: 'https://lin.ee/sJieAtw' };
function helpContact(b) { b = b || {}; return { phone: b.supportPhone || HELPC.phone, lineId: b.lineId || HELPC.lineId, lineUrl: b.lineUrl || HELPC.lineUrl }; }
function lineBtn(h, label) {
  return '<a class="btn line" href="' + esc(h.lineUrl) + '" target="_blank" rel="noopener"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6.1C21.5 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8Z" fill="currentColor" stroke="none"/></svg>' + esc(label || ('LINE ' + h.lineId)) + '</a>';
}
function helpBox(h) {
  return '<div class="helpbox">' + ic('phone') + '<div style="flex:1;min-width:0"><b>ติดขัดการเข้าระบบ / ลืมรหัสผ่าน</b><div class="small">โทร ฝ่ายทรัพยากรบุคคล <a href="tel:' + esc(String(h.phone).split(/\s|-/)[0]) + '" class="num">' + esc(h.phone) + '</a> หรือทัก LINE Official</div></div>' + lineBtn(h, h.lineId) + '</div>';
}
/** ตรวจรหัสผ่านใหม่ (แสดงผลทันทีขณะพิมพ์) */
function pwRules(pw, pw2, emp) {
  return [
    { ok: pw.length >= 8, t: 'อย่างน้อย 8 ตัวอักษร' },
    { ok: /\d/.test(pw) && /[^\d\s]/.test(pw), t: 'มีทั้งตัวอักษรและตัวเลข' },
    { ok: !emp || pw.indexOf(emp) < 0, t: 'ไม่มีรหัสพนักงานอยู่ในรหัสผ่าน' },
    { ok: !!pw && pw === pw2, t: 'พิมพ์ยืนยันตรงกัน' }
  ];
}
function pwFields(prefix, emp) {
  return '<div class="field"><label class="f" for="' + prefix + 'P1">รหัสผ่านใหม่</label><div class="pin"><input class="input" id="' + prefix + 'P1" type="password" autocomplete="new-password" maxlength="64">' +
    '<button type="button" class="iconbtn eye" data-eye="' + prefix + 'P1" aria-label="แสดงรหัสผ่าน">' + ic('eye') + '</button></div></div>' +
    '<div class="field"><label class="f" for="' + prefix + 'P2">พิมพ์รหัสผ่านใหม่อีกครั้ง</label><input class="input" id="' + prefix + 'P2" type="password" autocomplete="new-password" maxlength="64"></div>' +
    '<ul class="pwrules" id="' + prefix + 'Rules"></ul>';
}
function bindPwFields(root, prefix, emp, onValid) {
  var p1 = $('#' + prefix + 'P1', root), p2 = $('#' + prefix + 'P2', root), box = $('#' + prefix + 'Rules', root);
  var upd = function () {
    var r = pwRules(p1.value, p2.value, emp), all = r.every(function (x) { return x.ok; });
    box.innerHTML = r.map(function (x) { return '<li class="' + (x.ok ? 'ok' : '') + '">' + ic(x.ok ? 'check' : 'x') + esc(x.t) + '</li>'; }).join('');
    if (onValid) onValid(all);
    return all;
  };
  p1.oninput = p2.oninput = upd;
  $$('[data-eye]', root).forEach(function (b) { b.onclick = function () { var i = $('#' + b.dataset.eye, root), s = i.type === 'password'; i.type = s ? 'text' : 'password'; p2.type = i.type; b.innerHTML = ic(s ? 'eyeoff' : 'eye'); }; });
  upd();
  return { valid: upd, value: function () { return p1.value; } };
}
function digitsOnly(el, max) {
  var v = el.value, clean = v.replace(/\D/g, '').slice(0, max);
  if (v === clean) return;
  var pos = el.selectionStart || 0, removed = v.slice(0, pos).replace(/\d/g, '').length;
  el.value = clean;
  try { var p = Math.max(0, Math.min(clean.length, pos - removed)); el.setSelectionRange(p, p); } catch (e) { }
}

var LG = { mode: 'pw', brand: null };
function showLogin(mode) {
  setAccent('#8E4B9D');
  document.title = 'เข้าสู่ระบบ · SOMDEJ HR Connect';
  var app = $('#app');
  try { LG.mode = mode || localStorage.getItem('hrc_loginmode') || 'pw'; } catch (e) { LG.mode = mode || 'pw'; }
  if (['pw', 'cid'].indexOf(LG.mode) < 0) LG.mode = 'pw';
  app.innerHTML = '<div class="login">' +
    '<section class="hero"><div><div class="top"><img src="logo.jpg" alt="โลโก้โรงพยาบาล"><div><b>SOMDEJ HR Connect</b><small>ฝ่ายทรัพยากรบุคคล · รพ.สมเด็จพระบรมราชเทวี ณ ศรีราชา</small></div></div>' +
    '<h1>ทุกกิจกรรมของบุคลากร<br><em>ในที่เดียว</em></h1><p class="lead">จองของที่ระลึก ตอบแบบสอบถาม ลงทะเบียนเข้าร่วมงาน และติดตามคำขอต่าง ๆ กับฝ่ายทรัพยากรบุคคล ได้จากทุกอุปกรณ์</p>' +
    '<div id="heroev"></div></div><div class="foot">© ' + (new Date().getFullYear() + 543) + ' ฝ่ายทรัพยากรบุคคล โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา สภากาชาดไทย</div></section>' +
    '<section class="panel"><div class="box" id="lgBox"></div></section></div>';
  var hf = $('#helpFab'); if (hf) hf.style.display = 'none';
  drawLoginForm();
  rawCall('branding', {}).then(function (r) {
    var st = $('#lgStatus');
    if (r.ok) {
      LG.brand = r.data;
      if (st) { st.className = 'status ok'; st.innerHTML = '<span class="dot"></span>เชื่อมต่อระบบแล้ว' + (r.data.maintenance ? ' · <b style="color:var(--warn)">ระบบปิดปรับปรุงชั่วคราว</b>' : ''); }
      var hb = $('#lgHelpBox'); if (hb) hb.innerHTML = helpBox(helpContact(LG.brand));
      var ev = (r.data.events || [])[0];
      if (ev && $('#heroev')) {
        $('#heroev').innerHTML = '<div class="feature">' + (ev.image ? '<img src="' + esc(ev.image) + '" alt="">' : '') + '<div><span class="chip ' + (ev.status === 'OPEN' ? 'ok dot live' : 'info') + '" style="background:rgba(255,255,255,.9)">' + (ev.status === 'OPEN' ? 'เปิดรับอยู่' : 'เร็ว ๆ นี้') + '</span>' +
          '<b style="margin-top:6px">' + esc(ev.title) + '</b><small style="opacity:.85">' + (ev.status === 'OPEN' ? 'ปิดรับ ' + thDate(ev.closeAt) : 'เปิดรับ ' + thDate(ev.openAt)) + '</small></div></div>';
      }
      if (r.data.announcement && $('#heroev')) $('#heroev').insertAdjacentHTML('beforeend', '<div class="feature" style="font-size:14px">' + ic('info') + '<div>' + esc(r.data.announcement) + '</div></div>');
    } else if (st) { st.className = 'status bad'; st.innerHTML = '<span class="dot"></span>' + esc(r.error); }
  }, function (e) { var st = $('#lgStatus'); if (st) { st.className = 'status bad'; st.innerHTML = '<span class="dot"></span>' + esc(e.message); } });
}
function lgErr(msg) { var b = $('#lgErr'); if (!b) return toast(msg, 'err'); b.innerHTML = ic('alert') + '<span>' + esc(msg) + '</span>'; b.classList.remove('hide'); }
function lgFoot() {
  return '<div id="lgHelpBox">' + helpBox(helpContact(LG.brand)) + '</div>' +
    '<div class="status" id="lgStatus"><span class="dot"></span>' + (LG.brand ? 'เชื่อมต่อระบบแล้ว' : 'กำลังเชื่อมต่อระบบ…') + '</div>' +
    '<div class="row" style="justify-content:center;margin-top:10px;gap:14px"><button type="button" class="linkbtn" id="lgHelp">' + ic('help') + ' วิธีเข้าสู่ระบบ</button><a class="linkbtn" href="manual.html?v=' + HRC_BUILD + '&role=staff#staff-login" target="_blank" rel="noopener">' + ic('book') + ' คู่มือการใช้งาน</a></div>' +
    '<div class="ver">v' + HRC_VERSION + ' · ' + HRC_BUILD + '</div>';
}
function drawLoginForm() {
  if (LG.brand && LG.brand.lineUrl) { HELPC.lineUrl = LG.brand.lineUrl; }
  var m = LG.mode, box = $('#lgBox');
  box.innerHTML = '<form id="loginForm" autocomplete="on" novalidate>' +
    (/^#\/checkin\//.test(location.hash) ? '<div class="announce" style="margin-bottom:12px">' + ic('qr') + '<div><b>เช็กอิน Hospital Town Hall</b><br>เข้าสู่ระบบแล้วระบบจะเช็กอินให้อัตโนมัติ · หากแจ้งว่า QR หมดอายุ ให้สแกนจากจออีกครั้ง</div></div>' : '') + '<h2>เข้าสู่ระบบ</h2><p class="sub">' + (m === 'pw' ? 'ใช้รหัสพนักงาน และรหัสผ่านที่ท่านตั้งไว้' : 'ยังไม่เคยตั้งรหัสผ่าน ใช้รหัสพนักงานและเลขบัตรประชาชน 13 หลัก') + '</p>' +
    '<div class="seg lgtabs" role="tablist"><button type="button" role="tab" class="' + (m === 'pw' ? 'on' : '') + '" data-lm="pw">' + ic('key') + 'รหัสผ่าน</button><button type="button" role="tab" class="' + (m === 'cid' ? 'on' : '') + '" data-lm="cid">' + ic('user') + 'เข้าครั้งแรก (เลขบัตร)</button></div>' +
    '<div class="field"><label class="f" for="lgEmp">รหัสพนักงาน</label><input class="input" id="lgEmp" name="username" inputmode="numeric" autocomplete="username" placeholder="เลขประจำตัวบุคลากร 7 หลัก เช่น 5XXXXXX" required></div>' +
    (m === 'pw'
      ? '<div class="field"><label class="f" for="lgPw">รหัสผ่าน</label><div class="pin"><input class="input" id="lgPw" name="password" type="password" autocomplete="current-password" maxlength="64" required>' +
        '<button type="button" class="iconbtn eye" id="lgEye" aria-label="แสดงรหัสผ่าน">' + ic('eye') + '</button></div></div>'
      : '<div class="field"><label class="f" for="lgCid">เลขบัตรประชาชน 13 หลัก</label><div class="pin"><input class="input" id="lgCid" type="password" inputmode="numeric" autocomplete="off" placeholder="ตัวเลข 13 หลัก ไม่ต้องใส่ขีด">' +
        '<button type="button" class="iconbtn eye" id="lgEye" aria-label="แสดงเลขบัตร">' + ic('eye') + '</button></div><div class="hint" id="lgHint"></div></div>') +
    '<div id="lgErr" class="hide lgerr"></div>' +
    '<button class="btn primary lg block" id="lgBtn" data-busy="' + (m === 'pw' ? 'กำลังเข้าสู่ระบบ…' : 'กำลังตรวจสอบกับระบบบุคลากร…') + '">' + ic('key') + 'เข้าสู่ระบบ</button>' +
    '<div class="row" style="justify-content:space-between;margin-top:12px"><button type="button" class="linkbtn" id="lgForgot">' + ic('help') + ' ลืมรหัสผ่าน</button>' +
    (m === 'pw' ? '<button type="button" class="linkbtn" data-lm="cid">ยังไม่เคยตั้งรหัสผ่าน?</button>' : '<button type="button" class="linkbtn" data-lm="pw">มีรหัสผ่านแล้ว</button>') + '</div>' +
    '<div class="note">' + ic('shield') + '<div>' + (m === 'pw' ? 'รหัสผ่านถูกเก็บแบบเข้ารหัสทางเดียว <b>ไม่มีใครเห็นรหัสของท่าน</b> รวมถึงเจ้าหน้าที่ HR' : 'ระบบตรวจตัวตนกับฐานข้อมูลบุคลากรของโรงพยาบาลโดยตรง <b>ไม่จัดเก็บเลขบัตรประชาชน</b> · เมื่อตั้งรหัสผ่านแล้ว เลขบัตรจะใช้ได้เฉพาะตอน "ลืมรหัสผ่าน"') + ' · จดจำการเข้าระบบ 7 วัน</div></div>' +
    '</form>' + lgFoot();
  $$('[data-lm]', box).forEach(function (b) { b.onclick = function () { var e = $('#lgEmp').value; LG.mode = b.dataset.lm; try { localStorage.setItem('hrc_loginmode', LG.mode); } catch (x) { } drawLoginForm(); $('#lgEmp').value = e; (e ? ($('#lgPw') || $('#lgCid')) : $('#lgEmp')).focus(); }; });
  $('#lgHelp').onclick = function () { openHelp('login'); };
  $('#lgForgot').onclick = function () { drawForgot($('#lgEmp').value.trim()); };
  var emp = $('#lgEmp'), sec = $('#lgPw') || $('#lgCid');
  emp.addEventListener('input', function () { digitsOnly(emp, 10); });
  if (m === 'cid') {
    sec.addEventListener('input', function () {
      digitsOnly(sec, 13);
      var d = sec.value, hint = $('#lgHint');
      if (!d) { hint.innerHTML = ''; return; }
      hint.innerHTML = '<span class="num">' + d.length + '/13 หลัก</span>' + (sec.type === 'text' ? ' · <span class="num">' + esc(fmtCid(d)) + '</span>' : '') +
        (d.length === 13 && !cidOk(d) ? ' · <span style="color:var(--warn)">' + ic('alert') + ' เลขบัตรอาจพิมพ์ผิด กรุณาตรวจสอบ</span>' : (d.length === 13 ? ' · <span style="color:var(--ok)">' + ic('check') + ' ครบ</span>' : ''));
    });
  }
  $('#lgEye').onclick = function () { var s = sec.type === 'password'; sec.type = s ? 'text' : 'password'; this.innerHTML = ic(s ? 'eyeoff' : 'eye'); sec.dispatchEvent(new Event('input')); };
  try { var last = localStorage.getItem('hrc_lastemp'); if (last) { emp.value = last; setTimeout(function () { sec.focus(); }, 50); } else setTimeout(function () { emp.focus(); }, 50); } catch (e) { }
  $('#loginForm').onsubmit = function (ev) {
    ev.preventDefault();
    var e = emp.value.trim(), v = m === 'pw' ? sec.value : sec.value.replace(/\D/g, '');
    $('#lgErr').classList.add('hide');
    var bad = !e ? 'กรุณากรอกรหัสพนักงาน' : (m === 'pw' ? (!v ? 'กรุณากรอกรหัสผ่าน' : '') : (v.length !== 13 ? 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก' : ''));
    if (bad) { lgErr(bad); (e ? sec : emp).focus(); return; }
    busy($('#lgBtn'), rawCall('login', m === 'pw' ? { empCode: e, password: v } : { empCode: e, cid: v })).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      try { localStorage.setItem('hrc_lastemp', e); } catch (x) { }
      if (r.data.setup) return drawSetPassword(r.data.setup, r.data.reason, e, m === 'cid' ? v : '');
      afterLogin(r.data, e, m === 'cid');
    }).catch(function (x) {
      lgErr(x.message);
      if (/ตั้งรหัสผ่านแล้ว/.test(x.message) && m === 'cid') { LG.mode = 'pw'; try { localStorage.setItem('hrc_loginmode', 'pw'); } catch (y) { } setTimeout(function () { drawLoginForm(); $('#lgEmp').value = e; $('#lgPw').focus(); lgErr(x.message); }, 10); return; }
      if (/ยังไม่เคยตั้งรหัสผ่าน/.test(x.message)) toast('ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ "เข้าครั้งแรก (เลขบัตร)"', 'info');
      sec.select();
    });
  };
}
function afterLogin(d, emp, viaCid) {
  try { localStorage.setItem('hrc_loginmode', d.boot.me.hasPassword ? 'pw' : 'cid'); } catch (x) { }
  saveSession(d.token, d.boot);
  toast('ยินดีต้อนรับ ' + S.me.name, 'ok', 'เข้าสู่ระบบสำเร็จ');
  var pending = (S.boot.events || []).filter(function (x) { return x.status === 'OPEN' && x.type !== 'ORDER' && !S.boot.mine[x.id]; });
  if ((!location.hash || location.hash === '#/') && pending.length === 1) location.hash = '#/event/' + pending[0].id;
  $('#app').innerHTML = '';
  render();
  if (viaCid && !S.me.hasPassword) setTimeout(promptSetPassword, 900);
}
var SETUP_TH = {
  PRIVILEGED: ['ตั้งรหัสผ่านก่อนเริ่มใช้งาน', 'บัญชีของท่านมีสิทธิ์ผู้ดูแล/หัวหน้า เพื่อความปลอดภัยต้องตั้งรหัสผ่านของตนเอง หลังจากนี้เลขบัตรประชาชนจะใช้เข้าระบบไม่ได้อีก'],
  POLICY: ['ตั้งรหัสผ่านก่อนเริ่มใช้งาน', 'ระบบกำหนดให้บุคลากรทุกคนตั้งรหัสผ่านของตนเอง หลังจากนี้ให้เข้าระบบด้วยรหัสผ่านนี้'],
  TEMP: ['ตั้งรหัสผ่านใหม่', 'ท่านเข้าระบบด้วยรหัสผ่านชั่วคราวจากเจ้าหน้าที่ HR กรุณาตั้งรหัสผ่านใหม่ที่จำได้ง่ายสำหรับท่าน แต่คนอื่นเดายาก'],
  FORGOT: ['ตั้งรหัสผ่านใหม่', 'ยืนยันตัวตนเรียบร้อย กรุณาตั้งรหัสผ่านใหม่ ระบบจะออกจากระบบทุกเครื่องที่เคยเข้าไว้']
};
function drawSetPassword(setup, reason, emp, cid) {
  var t = SETUP_TH[reason] || SETUP_TH.FORGOT, box = $('#lgBox');
  box.innerHTML = '<form id="spForm" novalidate><div class="bigicon acc" style="margin:0 0 12px">' + ic('shield') + '</div><h2>' + esc(t[0]) + '</h2><p class="sub">' + esc(t[1]) + '</p>' +
    '<div class="field"><label class="f">รหัสพนักงาน</label><input class="input" value="' + esc(emp) + '" readonly autocomplete="username"></div>' + pwFields('sp', emp) +
    '<div id="lgErr" class="hide lgerr"></div><button class="btn primary lg block" id="spBtn" data-busy="กำลังบันทึก…" disabled>' + ic('check') + 'บันทึกรหัสผ่านและเข้าสู่ระบบ</button>' +
    '<div class="note">' + ic('info') + '<div>เคล็ดลับ: ใช้คำหรือวลีที่จำง่ายผสมตัวเลข เช่น ชื่อสัตว์เลี้ยง + ปีที่ชอบ · <b>ห้ามใช้เลขบัตรประชาชนหรือวันเกิด</b> · จดไว้ในที่ปลอดภัย</div></div>' +
    '<div class="row" style="justify-content:center;margin-top:10px"><button type="button" class="linkbtn" id="spBack">' + ic('arrowl') + ' กลับหน้าเข้าสู่ระบบ</button></div></form>' + lgFoot();
  var pw = bindPwFields(box, 'sp', emp, function (ok) { $('#spBtn').disabled = !ok; });
  $('#spBack').onclick = function () { drawLoginForm(); };
  $('#lgHelp').onclick = function () { openHelp('login'); };
  setTimeout(function () { $('#spP1').focus(); }, 50);
  $('#spForm').onsubmit = function (ev) {
    ev.preventDefault();
    if (!pw.valid()) return;
    if (cid && pw.value().replace(/\D/g, '') === cid) return lgErr('ห้ามใช้เลขบัตรประชาชนเป็นรหัสผ่าน');
    busy($('#spBtn'), rawCall('completeSetup', { setup: setup, password: pw.value() })).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      try { localStorage.setItem('hrc_loginmode', 'pw'); localStorage.setItem('hrc_lastemp', emp); } catch (x) { }
      toast('ตั้งรหัสผ่านเรียบร้อย ครั้งต่อไปเข้าด้วยรหัสพนักงาน + รหัสผ่านนี้', 'ok', 'บันทึกแล้ว');
      afterLogin(r.data, emp, false);
    }).catch(function (x) { lgErr(x.message); if (/หมดเวลา|ถูกใช้ไปแล้ว/.test(x.message)) setTimeout(drawLoginForm, 2500); });
  };
}
/** ลืมรหัสผ่าน: ขั้น 1 รหัส+เลขบัตร → ขั้น 2 OTP → ตั้งรหัสใหม่ */
function drawForgot(emp0) {
  var box = $('#lgBox');
  box.innerHTML = '<form id="fgForm" novalidate><h2>ลืมรหัสผ่าน</h2><p class="sub">ยืนยันตัวตนด้วยรหัสพนักงานและเลขบัตรประชาชน ระบบจะส่ง <b>รหัสยืนยัน 6 หลัก</b> ไปที่อีเมลของท่านในระบบ HR</p>' +
    '<div class="field"><label class="f" for="fgEmp">รหัสพนักงาน</label><input class="input" id="fgEmp" inputmode="numeric" placeholder="เลขประจำตัวบุคลากร 7 หลัก" value="' + esc(emp0 || '') + '"></div>' +
    '<div class="field"><label class="f" for="fgCid">เลขบัตรประชาชน 13 หลัก</label><input class="input" id="fgCid" type="password" inputmode="numeric" autocomplete="off" placeholder="ตัวเลข 13 หลัก"></div>' +
    '<div id="lgErr" class="hide lgerr"></div><button class="btn primary lg block" id="fgBtn" data-busy="กำลังตรวจสอบ…">' + ic('send') + 'ส่งรหัสยืนยันทางอีเมล</button>' +
    '<div class="row" style="justify-content:center;margin-top:10px"><button type="button" class="linkbtn" id="fgBack">' + ic('arrowl') + ' กลับหน้าเข้าสู่ระบบ</button></div></form>' + lgFoot();
  $('#fgBack').onclick = function () { drawLoginForm(); };
  $('#lgHelp').onclick = function () { openHelp('login'); };
  $('#fgEmp').oninput = function () { digitsOnly(this, 10); }; $('#fgCid').oninput = function () { digitsOnly(this, 13); };
  setTimeout(function () { (emp0 ? $('#fgCid') : $('#fgEmp')).focus(); }, 50);
  $('#fgForm').onsubmit = function (ev) {
    ev.preventDefault();
    var e = $('#fgEmp').value.trim(), c = $('#fgCid').value.replace(/\D/g, '');
    if (!e || c.length !== 13) return lgErr('กรุณากรอกรหัสพนักงาน และเลขบัตรประชาชนให้ครบ 13 หลัก');
    busy($('#fgBtn'), rawCall('forgotStart', { empCode: e, cid: c })).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      if (r.data.noEmail) return drawNoEmail(e, r.data.help);
      drawOtp(e, c, r.data);
    }).catch(function (x) { lgErr(x.message); });
  };
}
function drawNoEmail(emp, h) {
  h = helpContact({ supportPhone: h.phone, lineId: h.lineId, lineUrl: h.lineUrl });
  $('#lgBox').innerHTML = '<div class="bigicon warn" style="margin:0 0 12px">' + ic('mail') + '</div><h2>ไม่พบอีเมลของท่านในระบบ</h2>' +
    '<p class="sub">ระบบจึงส่งรหัสยืนยันให้ไม่ได้ กรุณาติดต่อฝ่ายทรัพยากรบุคคลเพื่อขอ <b>รหัสผ่านชั่วคราว</b> (ใช้ได้ 72 ชั่วโมง) แล้วเข้าระบบเพื่อตั้งรหัสใหม่</p>' +
    '<div class="stack" style="gap:10px"><a class="btn lg block" href="tel:' + esc(String(h.phone).split(/\s|-/)[0]) + '">' + ic('phone') + 'โทร ' + esc(h.phone) + '</a>' + lineBtn(h, 'แจ้งทาง LINE ' + h.lineId).replace('class="btn line"', 'class="btn line lg block"') + '</div>' +
    '<div class="note">' + ic('info') + '<div>แจ้งรหัสพนักงาน <b class="num">' + esc(emp) + '</b> และชื่อ-สกุล · เจ้าหน้าที่จะไม่ถามเลขบัตรประชาชนหรือรหัสผ่านของท่าน · หลังเข้าระบบได้แล้ว แนะนำให้เพิ่มอีเมลในหน้าแรก เพื่อกู้รหัสผ่านเองได้ครั้งหน้า</div></div>' +
    '<div class="row" style="justify-content:center;margin-top:14px"><button type="button" class="linkbtn" id="neBack">' + ic('arrowl') + ' กลับหน้าเข้าสู่ระบบ</button></div>';
  $('#neBack').onclick = function () { LG.mode = 'pw'; drawLoginForm(); };
}
function drawOtp(emp, cid, d) {
  var box = $('#lgBox');
  box.innerHTML = '<form id="otpForm" novalidate><div class="bigicon acc" style="margin:0 0 12px">' + ic('mail') + '</div><h2>กรอกรหัสยืนยัน</h2><p class="sub">ส่งรหัส 6 หลักไปที่ <b>' + esc(d.to) + '</b> แล้ว (ใช้ได้ ' + d.minutes + ' นาที) · ไม่พบ ลองดูในกล่อง <b>จดหมายขยะ/Spam</b></p>' +
    '<div class="field"><label class="f" for="otpIn">รหัสยืนยัน 6 หลัก</label><input class="input otp" id="otpIn" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"></div>' +
    '<div id="lgErr" class="hide lgerr"></div><button class="btn primary lg block" id="otpBtn" data-busy="กำลังตรวจสอบ…">' + ic('check') + 'ยืนยัน</button>' +
    '<div class="row" style="justify-content:space-between;margin-top:12px"><button type="button" class="linkbtn" id="otpBack">' + ic('arrowl') + ' ย้อนกลับ</button><button type="button" class="linkbtn" id="otpRe" disabled>ส่งรหัสใหม่ (60)</button></div></form>' + lgFoot();
  $('#lgHelp').onclick = function () { openHelp('login'); };
  var inp = $('#otpIn'); inp.oninput = function () { digitsOnly(inp, 6); if (inp.value.length === 6) $('#otpForm').requestSubmit ? $('#otpForm').requestSubmit() : $('#otpBtn').click(); };
  setTimeout(function () { inp.focus(); }, 50);
  var left = 60, re = $('#otpRe'), tm = setInterval(function () { if (!document.body.contains(re)) return clearInterval(tm); left--; re.textContent = left > 0 ? 'ส่งรหัสใหม่ (' + left + ')' : 'ส่งรหัสใหม่'; re.disabled = left > 0; if (left <= 0) clearInterval(tm); }, 1000);
  re.onclick = function () { busy(re, rawCall('forgotStart', { empCode: emp, cid: cid })).then(function (r) { if (!r.ok) throw new Error(r.error); toast('ส่งรหัสใหม่แล้ว', 'ok'); drawOtp(emp, cid, r.data); }).catch(function (x) { lgErr(x.message); }); };
  $('#otpBack').onclick = function () { drawForgot(emp); };
  $('#otpForm').onsubmit = function (ev) {
    ev.preventDefault();
    if (inp.value.length !== 6) return lgErr('กรุณากรอกรหัส 6 หลัก');
    busy($('#otpBtn'), rawCall('forgotVerify', { empCode: emp, otp: inp.value })).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      drawSetPassword(r.data.setup, 'FORGOT', emp, cid);
    }).catch(function (x) { lgErr(x.message); inp.select(); });
  };
}

/* =================================================================== ตั้ง/เปลี่ยนรหัสผ่าน (ขณะเข้าระบบ) */
function promptSetPassword() {
  if (!S.me || S.me.hasPassword) return;
  var k = 'hrc_pwprompt_' + S.me.empCode, today = localIso().slice(0, 10);
  try { if (localStorage.getItem(k) === today) return; localStorage.setItem(k, today); } catch (e) { }
  confirmBox({ title: 'ตั้งรหัสผ่านของท่านเอง', icon: 'shield', ok: 'ตั้งรหัสผ่านตอนนี้', cancel: 'ไว้ภายหลัง',
    msg: 'ตอนนี้ท่านเข้าระบบด้วยเลขบัตรประชาชน ซึ่งผู้อื่นอาจทราบได้ · ตั้งรหัสผ่านของตนเองเพื่อความปลอดภัยและความเป็นส่วนตัว (ใช้เวลาไม่ถึง 1 นาที) · หลังตั้งแล้วเลขบัตรจะใช้ได้เฉพาะตอนลืมรหัสผ่าน' })
    .then(function (y) { if (y) passwordModal(); });
}
function passwordModal() {
  var has = S.me.hasPassword;
  var m = modal({ title: ic('key') + ' ' + (has ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'), size: 'md',
    body: (has ? '<div class="field"><label class="f" for="cpCur">รหัสผ่านปัจจุบัน</label><input class="input" id="cpCur" type="password" autocomplete="current-password"></div>' : '<div class="announce" style="background:var(--info-soft);border-color:#cfe0fb;color:#1e40af">' + ic('info') + '<div>หลังตั้งรหัสผ่าน ครั้งต่อไปให้เลือกแท็บ <b>"รหัสผ่าน"</b> ในหน้าเข้าสู่ระบบ</div></div>') +
      pwFields('cp', S.me.empCode) + '<div class="small muted">' + ic('shield') + ' เมื่อบันทึก ระบบจะออกจากระบบทุกเครื่องอื่นที่เคยเข้าไว้ และส่งอีเมลแจ้งท่าน (ถ้ามีอีเมล)</div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="cpSave" data-busy="กำลังบันทึก…" disabled>' + ic('check') + 'บันทึกรหัสผ่าน</button>' });
  var pw = bindPwFields(m.el, 'cp', S.me.empCode, function (ok) { $('#cpSave').disabled = !ok; });
  $('#cpSave').onclick = function () {
    if (!pw.valid()) return;
    busy(this, api('changePassword', { current: has ? $('#cpCur').value : '', next: pw.value() })).then(function (r) {
      saveSession(r.token); S.me.hasPassword = true; S.me.pwSetAt = localIso();
      try { localStorage.setItem('hrc_loginmode', 'pw'); } catch (e) { }
      m.close(); toast('ครั้งต่อไปเข้าด้วยรหัสพนักงาน + รหัสผ่านนี้', 'ok', has ? 'เปลี่ยนรหัสผ่านแล้ว' : 'ตั้งรหัสผ่านแล้ว');
      if (S.route === 'home') render();
    }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); });
  };
}

/* =================================================================== ข้อมูลติดต่อของฉัน */
function contactModal() {
  var me = S.me;
  var m = modal({ title: ic('phone') + ' แก้ไขข้อมูลติดต่อของฉัน', size: 'md',
    body: '<p class="small muted" style="margin-top:0">ใช้สำหรับรับข่าวสาร การแจ้งเตือน และ<b>กู้รหัสผ่านทางอีเมล</b> · HR จะนำข้อมูลที่แก้ไปอัปเดตในระบบหลักของโรงพยาบาล (HRMi) ให้</p>' +
      '<div class="grid2"><div class="field"><label class="f" for="ctPhone">เบอร์มือถือ</label><input class="input" id="ctPhone" inputmode="tel" value="' + esc(me.phone) + '" placeholder="08XXXXXXXX"></div>' +
      '<div class="field"><label class="f" for="ctExt">เบอร์ภายใน (ถ้ามี)</label><input class="input" id="ctExt" inputmode="tel" value="' + esc(me.extPhone) + '" placeholder="เช่น 23419"></div></div>' +
      '<div class="field"><label class="f" for="ctEmail">อีเมล</label><input class="input" id="ctEmail" type="email" inputmode="email" value="' + esc(me.email) + '" placeholder="name@example.com"><div class="hint">ถ้าเปลี่ยนอีเมล ระบบจะส่งรหัสยืนยัน 6 หลักไปที่อีเมลใหม่ก่อน เพื่อให้แน่ใจว่าเป็นอีเมลของท่าน</div></div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="ctSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  $('#ctSave').onclick = function () {
    busy(this, api('updateMyContact', { phone: $('#ctPhone').value, extPhone: $('#ctExt').value, email: $('#ctEmail').value.trim() })).then(function (r) {
      S.me = S.boot.me = Object.assign(S.me, r.me);
      m.close();
      if (r.changed.length) toast('บันทึก' + r.changed.map(function (k) { return { phone: 'เบอร์มือถือ', extPhone: 'เบอร์ภายใน' }[k]; }).join(' และ ') + 'แล้ว', 'ok');
      if (r.emailPending) emailOtpModal(r.to, r.minutes);
      else if (!r.changed.length) toast('ไม่มีข้อมูลที่เปลี่ยนแปลง', 'info');
      if (S.route === 'home') render();
    }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); });
  };
}
function emailOtpModal(to, minutes) {
  var m = modal({ title: ic('mail') + ' ยืนยันอีเมลใหม่', size: 'md', sticky: true,
    body: '<p style="margin-top:0">ส่งรหัส 6 หลักไปที่ <b>' + esc(to) + '</b> แล้ว (ใช้ได้ ' + (minutes || 10) + ' นาที) · ไม่พบ ลองดูในกล่องจดหมายขยะ/Spam</p>' +
      '<div class="field"><label class="f" for="emOtp">รหัสยืนยัน</label><input class="input otp" id="emOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"></div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="emGo" data-busy="กำลังตรวจสอบ…">' + ic('check') + 'ยืนยันอีเมล</button>' });
  var inp = $('#emOtp'); inp.oninput = function () { digitsOnly(inp, 6); };
  $('#emGo').onclick = function () {
    busy(this, api('verifyMyEmail', { otp: inp.value })).then(function (r) {
      S.me = S.boot.me = Object.assign(S.me, r.me); m.close(); toast('ยืนยันอีเมลเรียบร้อย', 'ok', 'บันทึกอีเมลแล้ว'); if (S.route === 'home') render();
    }).catch(function (e) { errToast(e, 'ยืนยันไม่สำเร็จ'); inp.select(); });
  };
}
function myContactCard() {
  var me = S.me, pend = me.selfEdit || [];
  var row = function (icn, label, val, extra) { return '<div class="ctrow"><span class="ci">' + ic(icn) + '</span><div><small>' + label + '</small><b class="' + (val ? 'num' : 'muted') + '">' + (val ? esc(val) : 'ยังไม่มีข้อมูล') + '</b>' + (extra || '') + '</div></div>'; };
  var fmtP = function (p) { p = String(p || ''); return p.length === 10 ? p.slice(0, 3) + '-' + p.slice(3, 6) + '-' + p.slice(6) : p; };
  var warn = !me.email ? '<div class="announce" style="margin:12px 0 0">' + ic('alert') + '<div>ยังไม่มีอีเมล — เพิ่มอีเมลเพื่อรับการแจ้งเตือน และ<b>กู้รหัสผ่านได้ด้วยตนเอง</b></div></div>' : '';
  return '<div class="card mycard"><div class="hd"><h3>' + ic('phone') + ' ข้อมูลติดต่อของฉัน</h3><button class="btn sm" id="btnContact">' + ic('edit') + 'แก้ไข</button></div><div class="bd"><div class="ctgrid">' +
    row('phone', 'เบอร์มือถือ', fmtP(me.phone)) + row('building', 'เบอร์ภายใน', me.extPhone) +
    row('mail', 'อีเมล', me.email, me.email ? (me.emailVerified ? ' <span class="chip ok">' + ic('check') + 'ยืนยันแล้ว</span>' : ' <span class="chip">จากระบบ HR</span>') : '') + '</div>' + warn +
    (pend.length ? '<div class="small muted" style="margin-top:10px">' + ic('info') + ' ข้อมูลที่ท่านแก้ (' + pend.map(function (k) { return { phone: 'มือถือ', extPhone: 'เบอร์ภายใน', email: 'อีเมล' }[k]; }).join(', ') + ') รอ HR อัปเดตในระบบหลักของโรงพยาบาล — ระบบนี้ใช้ค่าที่ท่านแก้แล้ว</div>' : '') +
    '</div></div>' +
    '<div class="card mycard"><div class="hd"><h3>' + ic('shield') + ' ความปลอดภัยบัญชี</h3>' + (me.hasPassword ? '<span class="chip ok">' + ic('check') + 'ตั้งรหัสผ่านแล้ว</span>' : '<span class="chip warn dot">ยังไม่ได้ตั้งรหัสผ่าน</span>') + '</div><div class="bd">' +
    '<p class="small muted" style="margin:0 0 12px">' + (me.hasPassword ? 'ตั้งเมื่อ ' + esc(thDate(me.pwSetAt)) + ' · เข้าระบบด้วยรหัสพนักงาน + รหัสผ่าน · เลขบัตรประชาชนใช้ได้เฉพาะตอนลืมรหัสผ่าน' : 'ตอนนี้ท่านเข้าระบบด้วยเลขบัตรประชาชน · ตั้งรหัสผ่านของตนเองเพื่อความปลอดภัยและความเป็นส่วนตัว') + '</p>' +
    '<button class="btn ' + (me.hasPassword ? '' : 'primary') + '" id="btnPw">' + ic('key') + (me.hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่านตอนนี้') + '</button></div></div>';
}

/* =================================================================== หน้าแรก */
ROUTES.home = function () {
  setAccent('#8E4B9D');
  document.title = 'หน้าแรก · SOMDEJ HR Connect';
  var me = S.me, b = S.boot;
  var h = '<div class="welcome"><div class="avatar">' + esc(initials(me.firstName || me.name)) + '</div><div style="position:relative;z-index:1;min-width:0;flex:1"><h2>สวัสดี คุณ' + esc(me.firstName || me.name) + '</h2>' +
    '<p>' + esc([me.position, me.unit, me.division].filter(Boolean).join(' · ')) + '</p>' +
    '<div class="wcontact">' + (me.phone ? '<span>' + ic('phone') + ' <span class="num">' + esc(me.phone) + '</span></span>' : '') + (me.email ? '<span>' + ic('mail') + ' ' + esc(me.email) + '</span>' : '<span>' + ic('alert') + ' ยังไม่มีอีเมล</span>') +
    '<button class="wedit" id="btnContact2">' + ic('edit') + 'ตรวจ/แก้ข้อมูลติดต่อ</button></div></div></div>';
  if (!me.hasPassword) h += '<div class="pwbanner">' + ic('shield') + '<div style="flex:1;min-width:200px"><b>ตั้งรหัสผ่านของท่านเอง</b><div class="small">ตอนนี้เข้าระบบด้วยเลขบัตรประชาชน ซึ่งผู้อื่นอาจทราบได้ — ตั้งรหัสผ่านเพื่อความปลอดภัยและความเป็นส่วนตัว</div></div><button class="btn primary sm" id="btnPw2">' + ic('key') + 'ตั้งรหัสผ่าน</button></div>';
  var evs = b.events || [];
  h += '<div class="row between" style="margin-bottom:12px"><h2 style="font-size:19px">กิจกรรมของฉัน</h2><div class="row" style="gap:10px"><span class="muted small">' + evs.length + ' กิจกรรม</span>' + helpBtn() + '</div></div>';
  if (!evs.length) h += '<div class="card empty">' + ic('calendar') + '<p>ยังไม่มีกิจกรรมที่เปิดสำหรับท่านในขณะนี้</p></div>';
  else h += '<div class="evgrid">' + evs.map(evCard).join('') + '</div>';
  h += '<div class="mygrid">' + myContactCard() + '</div>';
  h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('user') + ' ข้อมูลของฉัน</h3><span class="muted small">จากระบบบุคลากรของโรงพยาบาล</span></div><div class="bd"><dl class="kv">' +
    '<dt>รหัสพนักงาน</dt><dd>' + esc(me.empCode) + '</dd><dt>ชื่อ-สกุล</dt><dd>' + esc(me.name) + '</dd><dt>ตำแหน่ง</dt><dd>' + esc(me.position || '-') + '</dd>' +
    '<dt>หน่วยงาน</dt><dd>' + esc(me.unit || '-') + '</dd><dt>ฝ่ายที่ปฏิบัติงาน</dt><dd>' + esc(me.division || '-') + '</dd>' +
    (me.hrmiDivision && me.hrmiDivision !== me.division ? '<dt>ฝ่ายต้นสังกัด (HRMi)</dt><dd>' + esc(me.hrmiDivision) + '</dd>' : '') + '<dt>กลุ่ม</dt><dd>' + esc(me.group || '-') + '</dd></dl>' +
    '<p class="small muted" style="margin:14px 0 0">' + ic('info') + ' หากชื่อ ตำแหน่ง หรือสังกัดไม่ถูกต้อง กรุณาแจ้งฝ่ายทรัพยากรบุคคล โทร ' + esc(helpContact(b.brand).phone) + '</p></div></div>';
  $('#page').innerHTML = h;
  $('#btnContact').onclick = $('#btnContact2').onclick = contactModal;
  $('#btnPw').onclick = passwordModal;
  var p2 = $('#btnPw2'); if (p2) p2.onclick = passwordModal;
};
function evStatusChip(st) {
  return { OPEN: '<span class="chip ok dot live">เปิดรับ</span>', UPCOMING: '<span class="chip info">เร็ว ๆ นี้</span>', CLOSED: '<span class="chip">ปิดรับแล้ว</span>', DRAFT: '<span class="chip warn">ฉบับร่าง</span>' }[st] || '';
}
function pickLabel(ev, key) { var it = ((ev.config || {}).items || []).filter(function (x) { return x.key === key; })[0]; return it ? it.label : key; }
function myStateHtml(ev, r) {
  if (!r) return ev.status === 'OPEN' ? '<span class="chip warn dot">ยังไม่ได้บันทึก</span>' : '<span class="chip">ไม่ได้บันทึก</span>';
  if (r.status === 'DECLINED') return '<span class="chip">' + esc((ev.config || {}).declineLabel || 'ไม่ประสงค์') + '</span>';
  if (ev.type === 'PICK') return '<span class="chip ok" style="white-space:normal;max-width:100%">' + ic('check') + ' ' + esc(pickLabel(ev, r.optKey)) + '</span>';
  var o = ((ev.config || {}).options || []).filter(function (x) { return x.key === r.optKey; })[0];
  return '<span class="chip ok">' + ic('check') + ' ' + esc(o ? o.label : r.optKey) + ' · ไซซ์ ' + esc(r.sizeCode) + '</span>';
}
function orderStateHtml(ev) {
  var x = (S.boot.orders || {})[ev.id];
  if (!x || !x.count) return ev.status === 'OPEN' ? '<span class="chip">ยังไม่มีคำสั่งซื้อ</span>' : '<span class="chip">ไม่มีคำสั่งซื้อ</span>';
  if (x.unpaid || x.rejected) return '<span class="chip warn dot">' + (x.rejected ? 'สลิปถูกตีกลับ ' + x.rejected : 'รอชำระ ' + x.unpaid) + ' รายการ</span>';
  if (x.pending) return '<span class="chip info dot">รอตรวจสลิป ' + x.pending + '</span>';
  return '<span class="chip ok">' + ic('check') + ' ชำระแล้ว ' + x.qty + ' ตัว</span>';
}
function evCard(ev) {
  if (isTh(ev)) return thCard(ev);
  var r = S.boot.mine[ev.id], cfg = ev.config || {}, left = daysLeft(ev.closeAt);
  if (ev.type === 'ORDER') {
    var x = (S.boot.orders || {})[ev.id], act = x && (x.unpaid || x.rejected);
    return '<a class="evcard" href="#/event/' + esc(ev.id) + '" style="--ec:' + esc(ev.color) + '"><div class="cover">' + (cfg.image ? '<img src="' + esc(cfg.image) + '" alt="" loading="lazy">' : '') +
      '<div class="tag">' + evStatusChip(ev.status) + ' <span class="chip" style="background:#fff">' + ic('shirt') + ' สั่งซื้อ</span></div></div><div class="body"><h3>' + esc(ev.title) + '</h3>' +
      '<div class="meta"><span>' + ic('calendar') + ' ปิดรับ ' + esc(thDate(ev.closeAt)) + '</span>' + (ev.status === 'OPEN' && left != null ? '<span>' + ic('clock') + ' เหลือ ' + left + ' วัน</span>' : '') + '</div>' +
      '<div class="mystate">' + orderStateHtml(ev) + '<span class="btn sm ' + (act || (!x && ev.status === 'OPEN') ? 'primary' : '') + '">' + (act ? 'ชำระเงิน' : x ? 'ดูคำสั่งซื้อ' : ev.status === 'OPEN' ? 'สั่งซื้อ' : 'ดูรายละเอียด') + ' ' + ic('arrowr') + '</span></div></div></a>';
  }
  return '<a class="evcard" href="#/event/' + esc(ev.id) + '" style="--ec:' + esc(ev.color) + '"><div class="cover">' + (cfg.image ? imgTag(cfg.image, '', 'loading="lazy"') : (ev.type === 'PICK' ? '<div class="coverico">' + ic('shirt') + '</div>' : '')) +
    '<div class="tag">' + evStatusChip(ev.status) + '</div></div><div class="body"><h3>' + esc(ev.title) + '</h3>' +
    '<div class="meta"><span>' + ic('calendar') + ' ปิดรับ ' + esc(thDate(ev.closeAt)) + '</span>' + (ev.status === 'OPEN' && left != null ? '<span>' + ic('clock') + ' เหลือ ' + left + ' วัน</span>' : '') + '</div>' +
    '<div class="mystate">' + myStateHtml(ev, r) + '<span class="btn sm ' + (r || ev.status !== 'OPEN' ? '' : 'primary') + '">' + (r ? (ev.status === 'OPEN' ? 'ดู / แก้ไข' : 'ดูข้อมูล') : (ev.status === 'OPEN' ? 'บันทึกเลย' : 'ดูรายละเอียด')) + ' ' + ic('arrowr') + '</span></div></div></a>';
}
function daysLeft(iso) { var d = parseLocal(iso); if (!d) return null; var t = new Date(); t.setHours(0, 0, 0, 0); var c = new Date(d); c.setHours(0, 0, 0, 0); return Math.round((c - t) / 86400000); }

/* =================================================================== หน้ากิจกรรม (จองไซซ์) */
var EVS = null;   // สถานะหน้ากิจกรรม
ROUTES.event = function (params) {
  var id = params[0];
  if (!id) return go('#/');
  $('#page').innerHTML = skel(3);
  var cached = (S.boot.events || []).filter(function (e) { return e.id === id; })[0];
  var loadOrders = function () {
    return api('getMyOrders', { eventId: id }).then(function (d) { if (S.route === 'event') drawOrderEvent(d.event, d); })
      .catch(function (e) { errToast(e, 'โหลดกิจกรรมไม่สำเร็จ'); $('#page').innerHTML = '<div class="card empty">' + ic('alert') + '<p>' + esc(e.message) + '</p><a class="btn" href="#/">กลับหน้าแรก</a></div>'; });
  };
  if (cached && cached.type === 'ORDER') return loadOrders();
  if (cached) { EVS = { ev: cached, mine: S.boot.mine[id] || null }; drawEvent(); }
  api('getEvent', { eventId: id }).then(function (d) {
    if (S.route !== 'event') return;
    if (d.event.type === 'ORDER') return loadOrders();
    var keep = EVS && EVS.ev.id === id ? EVS : null;
    EVS = { ev: d.event, mine: d.mine, opt: keep && keep.opt, size: keep && keep.size, editing: keep && keep.editing, pick: keep && keep.pick,
      x: d, nm: keep && keep.nm, evalMode: keep && keep.evalMode, ans: keep && keep.ans };
    S.boot.mine[id] = d.mine || undefined; if (!d.mine) delete S.boot.mine[id];
    drawEvent();
  }).catch(function (e) { errToast(e, 'โหลดกิจกรรมไม่สำเร็จ'); if (!cached) $('#page').innerHTML = '<div class="card empty">' + ic('alert') + '<p>' + esc(e.message) + '</p><a class="btn" href="#/">กลับหน้าแรก</a></div>'; });
};

function drawEvent() {
  if (isTh(EVS.ev)) return drawTh();
  if (EVS.ev.type === 'PICK') return drawPick();
  var ev = EVS.ev, cfg = ev.config || {}, mine = EVS.mine, open = ev.status === 'OPEN';
  setAccent(ev.color);
  document.title = ev.title + ' · SOMDEJ HR Connect';
  var opts = (cfg.options || []);
  if (!EVS.opt) {
    var g = S.me.gender;
    EVS.opt = mine && mine.status === 'ORDERED' ? mine.optKey : (opts.filter(function (o) { return o.key === g; })[0] || opts[0] || {}).key;
    EVS.size = mine && mine.status === 'ORDERED' ? mine.sizeCode : null;
  }
  var showForm = open && (!mine || EVS.editing);
  var h = '<div class="row between crumbrow"><div class="crumb"><a href="#/">' + ic('arrowl') + ' หน้าแรก</a></div>' + helpBtn() + '</div>';
  h += '<div class="evhero">' + (cfg.image ? '<div class="pic" id="evPic">' + imgTag(cfg.image, cfg.itemName || ev.title) + '<span class="zoom">' + ic('zoom') + ' ดูแบบเต็ม</span></div>' : '') +
    '<div class="info"><div class="row">' + evStatusChip(ev.status) + '<span class="chip">' + ic('calendar') + ' ' + esc(thDate(ev.openAt, false)) + ' – ' + esc(thDate(ev.closeAt)) + '</span></div>' +
    '<h1>' + esc(ev.title) + '</h1>' + (ev.subtitle ? '<div class="subt">' + esc(ev.subtitle) + '</div>' : '') + '<div class="desc">' + esc(ev.description || '') + '</div>' +
    (open ? '<div class="countdown" id="cd"></div>' : '') + '</div></div>';

  if (mine && !EVS.editing) h += myBanner(ev, mine, open);
  if (!open && !mine) h += '<div class="card pad" style="text-align:center">' + (ev.status === 'UPCOMING' ? ic('clock') + ' กิจกรรมจะเปิดรับ ' + esc(thDate(ev.openAt)) : ic('ban') + ' ปิดรับแล้ว หากต้องการบันทึก กรุณาติดต่อฝ่ายทรัพยากรบุคคล โทร ' + esc(S.boot.brand.contactPhone)) + '</div>';

  if (showForm && ev.type === 'CHOICE') {
    h += '<div class="step"><div class="sh"><span class="no">1</span><div><h3>เลือกแบบ</h3><div class="small muted">เลือกได้ตามความถนัด ไม่จำเป็นต้องตรงกับเพศ</div></div></div><div class="cuts">' +
      opts.map(function (o) {
        var icn = /หญิง|F/.test(o.label + o.key) ? 'female' : /ชาย|M/.test(o.label + o.key) ? 'male' : 'shirt';
        var range = o.sizes.filter(function (s) { return !s.hidden; });
        return '<button type="button" class="cut ' + (EVS.opt === o.key ? 'on' : '') + '" data-opt="' + esc(o.key) + '"><span class="ic">' + ic(icn) + '</span><span><b>' + esc(o.label) + '</b><small>ไซซ์ ' + esc(range[0] ? range[0].code : '') + ' – ' + esc(range.length ? range[range.length - 1].code : '') + '</small></span></button>';
      }).join('') + '</div></div>';
    var o = opts.filter(function (x) { return x.key === EVS.opt; })[0] || opts[0];
    if (o) {
      h += '<div class="step"><div class="sh"><span class="no">2</span><div><h3>เลือกไซซ์ · ' + esc(o.label) + '</h3><div class="small muted">ตัวเลขเป็นขนาดของเสื้อ (นิ้ว) · ' + esc(cfg.sizeNote || '') + '</div></div></div><div class="sizes" id="sizes">' +
        o.sizes.filter(function (s) { return !s.hidden; }).map(function (s) {
          var na = !s.chest && !s.length;
          return '<button type="button" class="size ' + (EVS.size === s.code ? 'on' : '') + (na ? ' na' : '') + '" data-size="' + esc(s.code) + '"><b>' + esc(s.code) + '</b><small>' + (na ? esc(s.note || 'ไม่มีข้อมูลขนาด') : 'อก ' + s.chest + '″ · ยาว ' + s.length + '″') + '</small></button>';
        }).join('') + '</div>' +
        '<div class="helper">' + ic('sparkle') + '<span>ไม่แน่ใจไซซ์? ใส่รอบอกของท่าน</span><input class="input" id="bodyChest" type="number" inputmode="decimal" min="20" max="80" step="0.5" placeholder="นิ้ว"><span class="small muted" id="recTxt">ระบบจะแนะนำไซซ์ที่หลวมกว่ารอบอกประมาณ 2 นิ้ว</span>' +
        '<button type="button" class="btn sm ghost" id="btnChart">' + ic('table') + ' ตารางไซซ์ทั้งหมด</button></div></div>';
      var cur = o.sizes.filter(function (s) { return s.code === EVS.size; })[0];
      h += '<div class="actionbar"><div class="sum"><small>' + (mine ? 'แก้ไขเป็น' : 'สิ่งที่เลือก') + '</small><b>' + esc(o.label) + ' · ' + (cur ? 'ไซซ์ ' + esc(cur.code) : '<span style="opacity:.6">ยังไม่เลือกไซซ์</span>') + '</b></div>' +
        (mine ? '<button class="btn" id="btnCancelEdit" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">ยกเลิก</button>' : '') +
        '<button class="btn primary" id="btnSubmit" ' + (cur ? '' : 'disabled') + '>' + ic('send') + (mine ? 'บันทึกการแก้ไข' : 'ยืนยันส่ง HR') + '</button></div>';
      if (cfg.allowDecline !== false && !(mine && mine.status === 'DECLINED')) h += '<div class="declinelink"><button class="btn ghost" id="btnDecline">' + ic('ban') + ' ' + esc(cfg.declineLabel || 'ไม่ประสงค์รับ') + '</button></div>';
    }
  } else if (showForm) {
    h += '<div class="card pad empty">' + ic('layers') + '<p>กิจกรรมประเภทนี้กำลังพัฒนา</p></div>';
  }
  $('#page').innerHTML = h;
  bindEvent();
}

function myBanner(ev, mine, open) {
  var cfg = ev.config || {};
  if (mine.status === 'DECLINED') {
    return '<div class="mybanner decl"><div class="big">' + ic('ban') + '</div><div style="flex:1;min-width:200px"><div class="small muted">สถานะของท่าน</div><h3>' + esc(cfg.declineLabel || 'ไม่ประสงค์รับ') + '</h3>' +
      '<div class="small muted">บันทึกเมื่อ ' + esc(thDate(mine.updatedAt)) + (mine.byAdmin ? ' · บันทึกโดยเจ้าหน้าที่ HR' : '') + (mine.note ? ' · ' + esc(mine.note) : '') + '</div></div>' +
      (open ? '<button class="btn primary" id="btnEdit">' + ic('shirt') + ' เปลี่ยนใจ ต้องการรับ</button>' : '') + '</div>';
  }
  var o = (cfg.options || []).filter(function (x) { return x.key === mine.optKey; })[0] || {}, s = (o.sizes || []).filter(function (x) { return x.code === mine.sizeCode; })[0] || {};
  return '<div class="mybanner"><div class="big">' + esc(mine.sizeCode) + '</div><div style="flex:1;min-width:200px"><div class="small" style="color:var(--ok);font-weight:700">' + ic('check') + ' บันทึกแล้ว · ส่ง HR เรียบร้อย</div>' +
    '<h3>' + esc(o.label || mine.optKey) + ' · ไซซ์ ' + esc(mine.sizeCode) + (s.chest ? ' <span class="muted small">(อก ' + s.chest + '″ · ยาว ' + s.length + '″)</span>' : '') + '</h3>' +
    '<div class="small muted">บันทึกเมื่อ ' + esc(thDate(mine.updatedAt)) + (mine.editCount ? ' · แก้ไข ' + mine.editCount + ' ครั้ง' : '') + (mine.byAdmin ? ' · บันทึกโดยเจ้าหน้าที่ HR' : '') + '</div></div>' +
    (open ? '<button class="btn" id="btnEdit">' + ic('edit') + ' แก้ไข</button>' : '<span class="chip">ปิดรับแล้ว · แก้ไขผ่าน HR</span>') + '</div>';
}

var _cdTimer = null;
function bindEvent() {
  var ev = EVS.ev, cfg = ev.config || {};
  var pic = $('#evPic');
  if (pic) pic.onclick = function () { modal({ title: esc(cfg.itemName || ev.title), size: 'xl', body: '<div class="lightbox">' + imgTag(cfg.image, '') + '</div>' }); };
  clearInterval(_cdTimer);
  var cd = $('#cd');
  if (cd) {
    var tick = function () {
      var end = parseLocal(ev.closeAt), ms = end - new Date();
      if (!document.body.contains(cd)) return clearInterval(_cdTimer);
      if (ms <= 0) { cd.innerHTML = '<span class="chip">ปิดรับแล้ว</span>'; return clearInterval(_cdTimer); }
      var d = Math.floor(ms / 86400000), hh = Math.floor(ms % 86400000 / 3600000), mm = Math.floor(ms % 3600000 / 60000);
      cd.innerHTML = '<div class="cd"><b>' + d + '</b><small>วัน</small></div><div class="cd"><b>' + hh + '</b><small>ชั่วโมง</small></div><div class="cd"><b>' + mm + '</b><small>นาที</small></div><div class="small muted" style="align-self:center">ก่อนปิดรับ</div>';
    };
    tick(); _cdTimer = setInterval(tick, 30000);
  }
  $$('[data-opt]').forEach(function (b) { b.onclick = function () { if (EVS.opt !== b.dataset.opt) { EVS.opt = b.dataset.opt; EVS.size = null; drawEvent(); } }; });
  $$('[data-size]').forEach(function (b) { b.onclick = function () { EVS.size = b.dataset.size; drawEvent(); var x = $('[data-size="' + EVS.size + '"]'); if (x) x.focus(); }; });
  var be = $('#btnEdit'); if (be) be.onclick = function () { EVS.editing = true; if (EVS.mine.status === 'DECLINED') { EVS.opt = null; } drawEvent(); setTimeout(function () { var s = $('.step'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
  var bc = $('#btnCancelEdit'); if (bc) bc.onclick = function () { EVS.editing = false; EVS.opt = null; drawEvent(); };
  var bodyChest = $('#bodyChest');
  if (bodyChest) {
    bodyChest.oninput = debounce(function () {
      var v = parseFloat(bodyChest.value), o = (cfg.options || []).filter(function (x) { return x.key === EVS.opt; })[0];
      $$('.size .rec').forEach(function (x) { x.remove(); });
      if (!v || !o) { $('#recTxt').textContent = 'ระบบจะแนะนำไซซ์ที่หลวมกว่ารอบอกประมาณ 2 นิ้ว'; return; }
      var rec = o.sizes.filter(function (s) { return !s.hidden && +s.chest && +s.chest >= v + 2; })[0];
      if (rec) { var el = $('[data-size="' + rec.code + '"]'); if (el) el.insertAdjacentHTML('afterbegin', '<span class="rec">แนะนำ</span>'); $('#recTxt').innerHTML = 'แนะนำไซซ์ <b>' + esc(rec.code) + '</b> (อกเสื้อ ' + rec.chest + '″)'; }
      else $('#recTxt').textContent = 'รอบอกเกินตารางไซซ์ของแบบนี้ ลองเลือกไซซ์ใหญ่สุด หรือแบบอื่น';
    }, 250);
  }
  var bch = $('#btnChart'); if (bch) bch.onclick = function () { modal({ title: 'ตารางไซซ์ · ' + esc(cfg.itemName || ''), size: 'lg', body: sizeChartHtml(cfg, EVS.opt, EVS.size) }); };
  var bs = $('#btnSubmit'); if (bs) bs.onclick = function () { confirmSubmit(); };
  var bd = $('#btnDecline'); if (bd) bd.onclick = function () { confirmDecline(); };
}
function sizeChartHtml(cfg, optKey, sizeCode) {
  return (cfg.options || []).map(function (o) {
    var sz = o.sizes.filter(function (s) { return !s.hidden; });
    return '<h4 style="margin:6px 0 0">' + esc(o.label) + '</h4><div class="chartwrap"><table class="chart"><tr><th>SIZE</th>' + sz.map(function (s) { return '<th class="' + (o.key === optKey && s.code === sizeCode ? 'on' : '') + '">' + esc(s.code) + '</th>'; }).join('') + '</tr>' +
      '<tr><th>รอบอก (นิ้ว)</th>' + sz.map(function (s) { return '<td class="' + (o.key === optKey && s.code === sizeCode ? 'on' : '') + '">' + (s.chest || '–') + '</td>'; }).join('') + '</tr>' +
      '<tr><th>ความยาว (นิ้ว)</th>' + sz.map(function (s) { return '<td class="' + (o.key === optKey && s.code === sizeCode ? 'on' : '') + '">' + (s.length || '–') + '</td>'; }).join('') + '</tr></table></div>';
  }).join('') + '<p class="small muted">หมายเหตุ: ' + esc(cfg.sizeNote || '') + '</p>';
}
function confirmSubmit() {
  var ev = EVS.ev, cfg = ev.config, o = cfg.options.filter(function (x) { return x.key === EVS.opt; })[0], s = o.sizes.filter(function (x) { return x.code === EVS.size; })[0];
  var m = modal({ title: '', foot: '<button class="btn" data-x>กลับไปแก้</button><button class="btn primary" id="cfOk" data-busy="กำลังบันทึก…">' + ic('send') + 'ยืนยันส่ง HR</button>',
    body: '<div class="center"><div class="small muted">กรุณาตรวจสอบก่อนยืนยัน</div><div style="font-family:var(--font-head);font-size:64px;line-height:1.1;color:var(--accent-2);margin:10px 0 2px">' + esc(s.code) + '</div>' +
      '<div style="font-size:18px;font-weight:700">' + esc(o.label) + '</div><div class="muted">' + (s.chest ? 'รอบอก ' + s.chest + '″ · ความยาว ' + s.length + '″' : esc(s.note || '')) + '</div>' +
      '<div class="small muted" style="margin-top:14px">' + esc(cfg.itemName || ev.title) + ' · ' + (+cfg.qtyPerPerson || 1) + ' ตัว<br>แก้ไขได้จนถึง ' + esc(thDate(ev.closeAt)) + '</div></div>' });
  $('#cfOk').onclick = function () {
    busy(this, api('submitResponse', { eventId: ev.id, status: 'ORDERED', optKey: o.key, sizeCode: s.code })).then(function (d) {
      m.close(); afterSave(d, 'บันทึก ' + o.label + ' ไซซ์ ' + s.code + ' เรียบร้อย');
    }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); });
  };
}
function confirmDecline() {
  var ev = EVS.ev, cfg = ev.config, label = cfg.declineLabel || 'ไม่ประสงค์รับ';
  var m = modal({ title: '', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn brand" id="dcOk" data-busy="กำลังบันทึก…">ยืนยัน ' + esc(label) + '</button>',
    body: '<div class="center"><div class="bigicon warn">' + ic('ban') + '</div><h3 style="font-size:20px">ยืนยัน "' + esc(label) + '"?</h3><p class="muted">ระบบจะนับว่าท่านตอบกลับแล้ว และเปลี่ยนใจได้จนถึงวันปิดรับ</p></div>' +
      '<div class="field"><label class="f" for="dcNote">เหตุผล ' + (cfg.requireReason ? '(จำเป็น)' : '(ถ้ามี)') + '</label><textarea class="input" id="dcNote" maxlength="300" placeholder="เช่น มีเสื้อแล้ว"></textarea></div>' });
  $('#dcOk').onclick = function () {
    var note = $('#dcNote').value.trim();
    if (cfg.requireReason && !note) { toast('กรุณาระบุเหตุผล', 'warn'); return; }
    busy(this, api('submitResponse', { eventId: ev.id, status: 'DECLINED', note: note })).then(function (d) { m.close(); afterSave(d, 'บันทึก "' + label + '" เรียบร้อย'); }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); });
  };
}
/* =================================================================== หน้ากิจกรรมชนิด PICK (เลือก 1 รายการจากรายการเฉพาะบุคคล เช่น ผ้า/ชุดปฏิบัติงาน) */
function drawPick() {
  var ev = EVS.ev, cfg = ev.config || {}, mine = EVS.mine, open = ev.status === 'OPEN';
  setAccent(ev.color);
  document.title = ev.title + ' · SOMDEJ HR Connect';
  var my = (ev.myItems || []).map(function (k) { return (cfg.items || []).filter(function (x) { return x.key === k; })[0]; }).filter(Boolean);
  if (EVS.pick == null) EVS.pick = mine ? (mine.status === 'DECLINED' ? 'X' : mine.optKey) : null;
  var showForm = open && (!mine || EVS.editing), decl = cfg.declineLabel || 'ไม่ประสงค์รับ';
  var h = '<div class="row between crumbrow"><div class="crumb"><a href="#/">' + ic('arrowl') + ' หน้าแรก</a></div>' + helpBtn() + '</div>';
  h += '<div class="evhero">' + (cfg.image ? '<div class="pic" id="evPic">' + imgTag(cfg.image, cfg.itemName || ev.title) + '<span class="zoom">' + ic('zoom') + ' ดูแบบเต็ม</span></div>' : '') +
    '<div class="info"><div class="row">' + evStatusChip(ev.status) + '<span class="chip">' + ic('calendar') + ' ' + esc(thDate(ev.openAt, false)) + ' – ' + esc(thDate(ev.closeAt)) + '</span></div>' +
    '<h1>' + esc(ev.title) + '</h1>' + (ev.subtitle ? '<div class="subt">' + esc(ev.subtitle) + '</div>' : '') + '<div class="desc">' + esc(ev.description || '') + '</div>' +
    (open ? '<div class="countdown" id="cd"></div>' : '') + '</div></div>';
  if ((cfg.notice || []).length) h += '<div class="noticebox">' + ic('info') + '<div><b>คำชี้แจง</b><ul>' + cfg.notice.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div></div>';
  if (mine && !EVS.editing) {
    h += mine.status === 'DECLINED'
      ? '<div class="mybanner decl"><div class="big">' + ic('ban') + '</div><div style="flex:1;min-width:200px"><div class="small muted">ความประสงค์ของท่าน</div><h3>' + esc(decl) + '</h3><div class="small muted">บันทึกเมื่อ ' + esc(thDate(mine.updatedAt)) + (mine.byAdmin ? ' · บันทึกโดยเจ้าหน้าที่ HR' : '') + '</div></div>' + (open ? '<button class="btn primary" id="btnEdit">' + ic('edit') + ' เปลี่ยนใจ</button>' : '') + '</div>'
      : '<div class="mybanner"><div class="big">' + ic('check') + '</div><div style="flex:1;min-width:200px"><div class="small" style="color:var(--ok);font-weight:700">' + ic('check') + ' บันทึกแล้ว · ส่ง HR เรียบร้อย</div><h3>' + esc(pickLabel(ev, mine.optKey)) + '</h3>' +
        '<div class="small muted">บันทึกเมื่อ ' + esc(thDate(mine.updatedAt)) + (mine.editCount ? ' · แก้ไข ' + mine.editCount + ' ครั้ง' : '') + (mine.byAdmin ? ' · บันทึกโดยเจ้าหน้าที่ HR' : '') + '</div></div>' +
        (open ? '<button class="btn" id="btnEdit">' + ic('edit') + ' แก้ไข</button>' : '<span class="chip">ปิดรับแล้ว · แก้ไขผ่าน HR</span>') + '</div>';
  }
  if (!open && !mine) h += '<div class="card pad" style="text-align:center">' + (ev.status === 'UPCOMING' ? ic('clock') + ' เปิดรับ ' + esc(thDate(ev.openAt)) : ic('ban') + ' ปิดรับแล้ว · ' + esc(cfg.allowDecline !== false ? 'กรณีไม่ตอบภายในกำหนด ถือว่า "' + decl + '"' : '')) + '</div>';
  if (showForm) {
    h += '<div class="step"><div class="sh"><span class="no">' + ic('shirt') + '</span><div><h3>เลือก' + esc(cfg.itemName ? cfg.itemName.replace(/ ประจำปี.*$/, '') : 'รายการ') + '</h3><div class="small muted">เลือกได้ 1 ตัวเลือก จากรายการที่กำหนดไว้สำหรับท่าน</div></div></div><div class="picks" role="radiogroup">';
    if (!my.length) h += '<div class="empty-note">' + ic('info') + ' ' + esc(cfg.noOptionNote || 'ไม่พบรายการที่กำหนดไว้สำหรับท่าน กรุณาติดต่อฝ่ายทรัพยากรบุคคล') + '</div>';
    h += my.map(function (it) {
      return '<label class="pick ' + (EVS.pick === it.key ? 'on' : '') + '"><input type="radio" name="pk" value="' + esc(it.key) + '" ' + (EVS.pick === it.key ? 'checked' : '') + '><span class="rd"></span>' +
        (cfg.showImages && it.image ? '<span class="pimg">' + imgTag(it.image, it.label, 'loading="lazy"') + '</span>' : '') + '<span class="pt"><b>' + esc(it.label) + '</b>' + (it.kind ? '<small>' + esc(it.kind) + '</small>' : '') + '</span>' +
        (cfg.showImages && it.image ? '<button type="button" class="iconbtn" data-zoom="' + esc(it.key) + '" title="ดูรูปใหญ่">' + ic('zoom') + '</button>' : '') + '</label>';
    }).join('');
    if (cfg.allowDecline !== false) h += '<label class="pick decl ' + (EVS.pick === 'X' ? 'on' : '') + '"><input type="radio" name="pk" value="X" ' + (EVS.pick === 'X' ? 'checked' : '') + '><span class="rd"></span><span class="pt"><b>' + esc(decl) + '</b></span></label>';
    h += '</div></div>';
    h += '<div class="actionbar"><div class="sum"><small>' + (mine ? 'แก้ไขเป็น' : 'สิ่งที่เลือก') + '</small><b>' + (EVS.pick ? esc(EVS.pick === 'X' ? decl : pickLabel(ev, EVS.pick)) : '<span style="opacity:.6">ยังไม่ได้เลือก</span>') + '</b></div>' +
      (mine ? '<button class="btn" id="btnCancelEdit" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">ยกเลิก</button>' : '') +
      '<button class="btn primary" id="btnPick" ' + (EVS.pick ? '' : 'disabled') + '>' + ic('send') + (mine ? 'บันทึกการแก้ไข' : 'ยืนยันการเลือก') + '</button></div>';
  }
  if (cfg.contact && cfg.contact.name) h += '<div class="contactbox">' + ic('phone') + '<div>หากมีข้อสงสัย กรุณาติดต่อ <b>' + esc(cfg.contact.name) + '</b>' + (cfg.contact.phone ? ' โทร. <b class="num">' + esc(cfg.contact.phone) + '</b>' : '') + '</div></div>';
  $('#page').innerHTML = h;
  bindEvent();
  $$('input[name=pk]').forEach(function (r) { r.onchange = function () { EVS.pick = r.value; drawPick(); }; });
  $$('[data-zoom]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var it = my.filter(function (x) { return x.key === b.dataset.zoom; })[0]; modal({ title: esc(it.label), size: 'xl', body: '<div class="lightbox">' + imgTag(it.image, it.label) + '</div>' }); }; });
  var be = $('#btnEdit'); if (be) be.onclick = function () { EVS.editing = true; drawPick(); setTimeout(function () { var s = $('.step'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
  var bc = $('#btnCancelEdit'); if (bc) bc.onclick = function () { EVS.editing = false; EVS.pick = null; drawPick(); };
  var bp = $('#btnPick'); if (bp) bp.onclick = confirmPick;
}
function confirmPick() {
  var ev = EVS.ev, cfg = ev.config || {}, k = EVS.pick, isX = k === 'X', label = isX ? (cfg.declineLabel || 'ไม่ประสงค์รับ') : pickLabel(ev, k);
  var m = modal({ title: '', foot: '<button class="btn" data-x>ตรวจสอบอีกครั้ง</button><button class="btn ' + (isX ? 'brand' : 'primary') + '" id="pkOk" data-busy="กำลังบันทึก…">' + ic('send') + 'ยืนยัน</button>',
    body: '<div class="center"><div class="bigicon ' + (isX ? 'warn' : 'acc') + '">' + ic(isX ? 'ban' : 'shirt') + '</div><div class="small muted">ยืนยันการเลือก</div><div class="pickconfirm">' + esc(label) + '</div>' +
      '<div class="small muted" style="margin-top:12px">บันทึกทันที และแก้ไขได้ด้วยตนเองจนถึง ' + esc(thDate(ev.closeAt)) + '</div></div>' });
  $('#pkOk').onclick = function () {
    busy(this, api('submitResponse', isX ? { eventId: ev.id, status: 'DECLINED' } : { eventId: ev.id, status: 'ORDERED', optKey: k })).then(function (d) {
      m.close(); EVS.pick = null; afterSave(d, 'บันทึก "' + label + '" เรียบร้อย');
    }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); });
  };
}
function afterSave(d, msg) {
  EVS.mine = d.mine; EVS.editing = false; S.boot.mine[EVS.ev.id] = d.mine;
  toast(msg + (d.mailed ? ' · ส่งอีเมลยืนยันแล้ว' : ''), 'ok', d.isNew ? 'ส่งข้อมูลถึง HR แล้ว' : 'แก้ไขเรียบร้อย');
  drawEvent();
  var colors = ['#8e4b9d', '#c8202e', '#f2b705', '#1f8a5b', '#2563eb', '#e79bbd'], conf = '';
  for (var i = 0; i < 26; i++) conf += '<i style="left:' + (Math.random() * 100) + '%;background:' + colors[i % colors.length] + ';animation-delay:' + (Math.random() * .3) + 's"></i>';
  var declined = d.mine.status === 'DECLINED';
  modal({ title: '', foot: '<button class="btn primary block" data-x>เรียบร้อย</button>',
    body: '<div class="success-burst center">' + (declined ? '' : '<div class="confetti">' + conf + '</div>') + '<div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      '<h3 style="font-size:22px">' + (declined ? 'บันทึกเรียบร้อย' : (d.isNew ? 'ส่งถึง HR เรียบร้อย!' : 'แก้ไขเรียบร้อย!')) + '</h3><p class="muted" style="margin:6px 0 0">' + esc(msg) + '</p>' +
      '<p class="small muted">' + (d.mailed ? ic('mail') + ' ส่งอีเมลยืนยันไปยังอีเมลของท่านแล้ว<br>' : '') + 'แก้ไขได้จนถึง ' + esc(thDate(EVS.ev.closeAt)) + '</p></div>' });
}
