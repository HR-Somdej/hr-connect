/* SOMDEJ HR Connect — pages-user.js : เข้าสู่ระบบ · หน้าแรก · หน้ากิจกรรม (จองไซซ์) */

/* =================================================================== เข้าสู่ระบบ */
function fmtCid(v) {
  var d = String(v || '').replace(/\D/g, '').slice(0, 13), p = [1, 4, 5, 2, 1], out = [], i = 0;
  p.forEach(function (n) { if (i < d.length) { out.push(d.substr(i, n)); i += n; } });
  return out.join('-');
}
function cidOk(d) { if (!/^\d{13}$/.test(d)) return false; var s = 0; for (var i = 0; i < 12; i++) s += (+d.charAt(i)) * (13 - i); return ((11 - (s % 11)) % 10) === +d.charAt(12); }

function showLogin() {
  setAccent('#8E4B9D');
  document.title = 'เข้าสู่ระบบ · SOMDEJ HR Connect';
  var app = $('#app');
  app.innerHTML = '<div class="login">' +
    '<section class="hero"><div><div class="top"><img src="logo.jpg" alt="โลโก้โรงพยาบาล"><div><b>SOMDEJ HR Connect</b><small>ฝ่ายทรัพยากรบุคคล · รพ.สมเด็จพระบรมราชเทวี ณ ศรีราชา</small></div></div>' +
    '<h1>ทุกกิจกรรมของบุคลากร<br><em>ในที่เดียว</em></h1><p class="lead">จองของที่ระลึก ลงทะเบียนเข้าร่วมงาน และติดตามคำขอต่าง ๆ กับฝ่ายทรัพยากรบุคคล ได้จากทุกอุปกรณ์</p>' +
    '<div id="heroev"></div></div><div class="foot">© ' + (new Date().getFullYear() + 543) + ' ฝ่ายทรัพยากรบุคคล โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา สภากาชาดไทย</div></section>' +
    '<section class="panel"><form class="box" id="loginForm" autocomplete="on" novalidate>' +
    '<h2>เข้าสู่ระบบ</h2><p class="sub">ใช้รหัสพนักงาน และเลขบัตรประชาชน 13 หลักของท่าน</p>' +
    '<div class="field"><label class="f" for="lgEmp">รหัสพนักงาน</label><input class="input" id="lgEmp" name="username" inputmode="numeric" autocomplete="username" placeholder="เช่น 5660101" required></div>' +
    '<div class="field"><label class="f" for="lgCid">เลขบัตรประชาชน (รหัสผ่าน)</label><div class="pin"><input class="input" id="lgCid" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="ตัวเลข 13 หลัก ไม่ต้องใส่ขีด" pattern="[0-9]*" required>' +
    '<button type="button" class="iconbtn eye" id="lgEye" aria-label="แสดงเลขบัตร">' + ic('eye') + '</button></div><div class="hint" id="lgHint"></div></div>' +
    '<div id="lgErr" class="hide" style="background:var(--danger-soft);color:var(--danger);border-radius:12px;padding:10px 13px;font-size:14px;margin-bottom:14px;display:flex;gap:8px"></div>' +
    '<button class="btn primary lg block" id="lgBtn" data-busy="กำลังตรวจสอบกับระบบบุคลากร…">' + ic('key') + 'เข้าสู่ระบบ</button>' +
    '<div class="note">' + ic('shield') + '<div>ระบบตรวจสอบตัวตนกับฐานข้อมูลบุคลากรของโรงพยาบาลโดยตรง <b>ไม่จัดเก็บเลขบัตรประชาชน</b> · จดจำการเข้าระบบบนเครื่องนี้ 7 วัน</div></div>' +
    '<div class="status" id="lgStatus"><span class="dot"></span>กำลังเชื่อมต่อระบบ…</div>' +
    '<div class="ver">v' + HRC_VERSION + ' · ' + HRC_BUILD + '</div></form></section></div>';

  var emp = $('#lgEmp'), cid = $('#lgCid');
  // กรองเฉพาะตัวเลข โดยไม่ใส่ขีดอัตโนมัติ (ใส่ขีดทำให้เคอร์เซอร์กระโดด) — แก้ค่าเฉพาะเมื่อมีอักขระที่ไม่ใช่ตัวเลข และคงตำแหน่งเคอร์เซอร์
  function digitsOnly(el, max) {
    var v = el.value, clean = v.replace(/\D/g, '').slice(0, max);
    if (v === clean) return;
    var pos = el.selectionStart || 0, removed = v.slice(0, pos).replace(/\d/g, '').length;
    el.value = clean;
    try { var p = Math.max(0, Math.min(clean.length, pos - removed)); el.setSelectionRange(p, p); } catch (e) { }
  }
  emp.addEventListener('input', function () { digitsOnly(emp, 10); });
  cid.addEventListener('input', function () {
    digitsOnly(cid, 13);
    var d = cid.value, hint = $('#lgHint');
    if (!d) { hint.innerHTML = ''; return; }
    var grp = fmtCid(d);
    hint.innerHTML = '<span class="num">' + d.length + '/13 หลัก</span>' + (cid.type === 'text' ? ' · <span class="num">' + esc(grp) + '</span>' : '') +
      (d.length === 13 && !cidOk(d) ? ' · <span style="color:var(--warn)">' + ic('alert') + ' เลขบัตรอาจพิมพ์ผิด กรุณาตรวจสอบ</span>' : (d.length === 13 ? ' · <span style="color:var(--ok)">' + ic('check') + ' ครบ</span>' : ''));
  });
  $('#lgEye').onclick = function () { var s = cid.type === 'password'; cid.type = s ? 'text' : 'password'; this.innerHTML = ic(s ? 'eyeoff' : 'eye'); cid.dispatchEvent(new Event('input')); };
  try { var last = localStorage.getItem('hrc_lastemp'); if (last) { emp.value = last; setTimeout(function () { cid.focus(); }, 50); } else setTimeout(function () { emp.focus(); }, 50); } catch (e) { }

  rawCall('branding', {}).then(function (r) {
    var st = $('#lgStatus'); if (!st) return;
    if (r.ok) {
      st.className = 'status ok'; st.innerHTML = '<span class="dot"></span>เชื่อมต่อระบบแล้ว' + (r.data.maintenance ? ' · <b style="color:var(--warn)">ระบบปิดปรับปรุงชั่วคราว</b>' : '');
      var ev = (r.data.events || [])[0];
      if (ev) {
        $('#heroev').innerHTML = '<div class="feature">' + (ev.image ? '<img src="' + esc(ev.image) + '" alt="">' : '') + '<div><span class="chip ' + (ev.status === 'OPEN' ? 'ok dot live' : 'info') + '" style="background:rgba(255,255,255,.9)">' + (ev.status === 'OPEN' ? 'เปิดรับอยู่' : 'เร็ว ๆ นี้') + '</span>' +
          '<b style="margin-top:6px">' + esc(ev.title) + '</b><small style="opacity:.85">' + (ev.status === 'OPEN' ? 'ปิดรับ ' + thDate(ev.closeAt) : 'เปิดรับ ' + thDate(ev.openAt)) + '</small></div></div>';
      }
      if (r.data.announcement) $('#heroev').insertAdjacentHTML('beforeend', '<div class="feature" style="font-size:14px">' + ic('info') + '<div>' + esc(r.data.announcement) + '</div></div>');
    } else { st.className = 'status bad'; st.innerHTML = '<span class="dot"></span>' + esc(r.error); }
  }, function (e) { var st = $('#lgStatus'); if (st) { st.className = 'status bad'; st.innerHTML = '<span class="dot"></span>' + esc(e.message); } });

  $('#loginForm').onsubmit = function (ev) {
    ev.preventDefault();
    var e = emp.value.trim(), c = cid.value.replace(/\D/g, ''), errBox = $('#lgErr');
    errBox.classList.add('hide');
    var bad = !e ? 'กรุณากรอกรหัสพนักงาน' : c.length !== 13 ? 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก' : '';
    if (bad) { errBox.innerHTML = ic('alert') + '<span>' + bad + '</span>'; errBox.classList.remove('hide'); (e ? cid : emp).focus(); return; }
    busy($('#lgBtn'), rawCall('login', { empCode: e, cid: c })).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      try { localStorage.setItem('hrc_lastemp', e); } catch (x) { }
      saveSession(r.data.token, r.data.boot);
      toast('ยินดีต้อนรับ ' + S.me.name, 'ok', 'เข้าสู่ระบบสำเร็จ');
      var pending = (S.boot.events || []).filter(function (x) { return x.status === 'OPEN' && !S.boot.mine[x.id]; });
      if ((!location.hash || location.hash === '#/' ) && pending.length === 1) location.hash = '#/event/' + pending[0].id;
      app.innerHTML = '';
      render();
    }).catch(function (x) {
      errBox.innerHTML = ic('alert') + '<span>' + esc(x.message) + '</span>'; errBox.classList.remove('hide');
      toast(x.message, 'err', 'เข้าสู่ระบบไม่สำเร็จ');
      cid.select();
    });
  };
}

/* =================================================================== หน้าแรก */
ROUTES.home = function () {
  setAccent('#8E4B9D');
  document.title = 'หน้าแรก · SOMDEJ HR Connect';
  var me = S.me, b = S.boot;
  var h = '<div class="welcome"><div class="avatar">' + esc(initials(me.firstName || me.name)) + '</div><div style="position:relative;z-index:1;min-width:0"><h2>สวัสดี คุณ' + esc(me.firstName || me.name) + '</h2>' +
    '<p>' + esc([me.position, me.unit, me.division].filter(Boolean).join(' · ')) + '</p></div></div>';
  var evs = b.events || [];
  h += '<div class="row between" style="margin-bottom:12px"><h2 style="font-size:19px">กิจกรรมของฉัน</h2><span class="muted small">' + evs.length + ' กิจกรรม</span></div>';
  if (!evs.length) h += '<div class="card empty">' + ic('calendar') + '<p>ยังไม่มีกิจกรรมที่เปิดสำหรับท่านในขณะนี้</p></div>';
  else h += '<div class="evgrid">' + evs.map(evCard).join('') + '</div>';
  h += '<div class="card" style="margin-top:22px"><div class="hd"><h3>' + ic('user') + ' ข้อมูลของฉัน</h3><span class="muted small">จากระบบบุคลากรของโรงพยาบาล</span></div><div class="bd"><dl class="kv">' +
    '<dt>รหัสพนักงาน</dt><dd>' + esc(me.empCode) + '</dd><dt>ชื่อ-สกุล</dt><dd>' + esc(me.name) + '</dd><dt>ตำแหน่ง</dt><dd>' + esc(me.position || '-') + '</dd>' +
    '<dt>หน่วยงาน</dt><dd>' + esc(me.unit || '-') + '</dd><dt>ฝ่าย</dt><dd>' + esc(me.division || '-') + '</dd><dt>กลุ่ม</dt><dd>' + esc(me.group || '-') + '</dd></dl>' +
    '<p class="small muted" style="margin:14px 0 0">' + ic('info') + ' หากข้อมูลไม่ถูกต้อง กรุณาแจ้งแก้ไขในระบบหลักของโรงพยาบาลที่ฝ่ายทรัพยากรบุคคล โทร ' + esc((b.brand || {}).contactPhone || '') + '</p></div></div>';
  $('#page').innerHTML = h;
};
function evStatusChip(st) {
  return { OPEN: '<span class="chip ok dot live">เปิดรับ</span>', UPCOMING: '<span class="chip info">เร็ว ๆ นี้</span>', CLOSED: '<span class="chip">ปิดรับแล้ว</span>', DRAFT: '<span class="chip warn">ฉบับร่าง</span>' }[st] || '';
}
function myStateHtml(ev, r) {
  if (!r) return ev.status === 'OPEN' ? '<span class="chip warn dot">ยังไม่ได้บันทึก</span>' : '<span class="chip">ไม่ได้บันทึก</span>';
  if (r.status === 'DECLINED') return '<span class="chip">' + esc((ev.config || {}).declineLabel || 'ไม่ประสงค์') + '</span>';
  var o = ((ev.config || {}).options || []).filter(function (x) { return x.key === r.optKey; })[0];
  return '<span class="chip ok">' + ic('check') + ' ' + esc(o ? o.label : r.optKey) + ' · ไซซ์ ' + esc(r.sizeCode) + '</span>';
}
function evCard(ev) {
  var r = S.boot.mine[ev.id], cfg = ev.config || {}, left = daysLeft(ev.closeAt);
  return '<a class="evcard" href="#/event/' + esc(ev.id) + '" style="--ec:' + esc(ev.color) + '"><div class="cover">' + (cfg.image ? '<img src="' + esc(cfg.image) + '" alt="" loading="lazy">' : '') +
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
  if (cached) { EVS = { ev: cached, mine: S.boot.mine[id] || null }; drawEvent(); }
  api('getEvent', { eventId: id }).then(function (d) {
    if (S.route !== 'event') return;
    var keep = EVS && EVS.ev.id === id ? EVS : null;
    EVS = { ev: d.event, mine: d.mine, opt: keep && keep.opt, size: keep && keep.size, editing: keep && keep.editing };
    S.boot.mine[id] = d.mine || undefined; if (!d.mine) delete S.boot.mine[id];
    drawEvent();
  }).catch(function (e) { errToast(e, 'โหลดกิจกรรมไม่สำเร็จ'); if (!cached) $('#page').innerHTML = '<div class="card empty">' + ic('alert') + '<p>' + esc(e.message) + '</p><a class="btn" href="#/">กลับหน้าแรก</a></div>'; });
};

function drawEvent() {
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
  var h = '<div class="crumb"><a href="#/">' + ic('arrowl') + ' หน้าแรก</a></div>';
  h += '<div class="evhero">' + (cfg.image ? '<div class="pic" id="evPic"><img src="' + esc(cfg.image) + '" alt="' + esc(cfg.itemName || ev.title) + '"><span class="zoom">' + ic('zoom') + ' ดูแบบเต็ม</span></div>' : '') +
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
  if (pic) pic.onclick = function () { modal({ title: esc(cfg.itemName || ev.title), size: 'xl', body: '<div class="lightbox"><img src="' + esc(cfg.image) + '" alt=""></div>' }); };
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
