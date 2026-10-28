/* SOMDEJ HR Connect — pages-admin.js : แดชบอร์ด · ติดตาม · รายงาน · อีเมล · กิจกรรม · รายชื่อ · หัวหน้า · ตั้งค่า */

var AD = { events: null };
var STATUS_TH = { ORDERED: 'จองแล้ว', DECLINED: 'ไม่ประสงค์', '': 'ยังไม่ตอบ' };
var FLAG_TH = { NEW_API: 'พบใหม่จาก API', NOT_IN_API: 'ไม่พบใน API', MANUAL: 'เพิ่มเอง' };
var MAIL_TH = { REMIND_STAFF: 'เตือนบุคลากรที่ยังไม่ตอบ', HEAD_SUMMARY: 'สรุปถึงหัวหน้าฝ่าย/หน่วย', ADMIN_SUMMARY: 'สรุปภาพรวมถึงผู้ดูแล', CONFIRM: 'ยืนยันการบันทึกถึงบุคลากร' };

function needAdmin() { if (!isAdmin()) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>เฉพาะผู้ดูแลระบบ</p></div>'; return false; } return true; }
function needViewer() { if (!isAdmin() && !isHead()) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>เฉพาะผู้ดูแลระบบและหัวหน้าฝ่าย/หน่วย</p></div>'; return false; } return true; }
function loadEvents(force) {
  if (!isAdmin()) return Promise.resolve(AD.events = S.boot.events || []);
  if (AD.events && !force) return Promise.resolve(AD.events);
  return api('listEvents', {}).then(function (l) { AD.events = l; return l; });
}
function eventPicker(cur, base) {
  var list = AD.events || S.boot.events || [];
  if (list.length < 2) return '';
  return '<select class="input" style="width:auto;min-height:40px" onchange="go(\'#/admin/' + base + '/\'+this.value)">' + list.map(function (e) { return '<option value="' + esc(e.id) + '" ' + (e.id === cur ? 'selected' : '') + '>' + esc(e.title) + '</option>'; }).join('') + '</select>';
}
function withEvent(params, base, fn) {
  if (!needViewer()) return;
  $('#page').innerHTML = skel(3);
  loadEvents().then(function (list) {
    var id = params[0] || (list[0] && list[0].id);
    if (!id) { $('#page').innerHTML = '<div class="card empty">' + ic('layers') + '<p>ยังไม่มีกิจกรรม</p>' + (isAdmin() ? '<a class="btn primary" href="#/admin/events">สร้างกิจกรรม</a>' : '') + '</div>'; return; }
    if (!params[0]) { history.replaceState(null, '', '#/admin/' + base + '/' + id); }
    S.lastAdminEvent = id;
    var ev = list.filter(function (e) { return e.id === id; })[0];
    setAccent(ev ? ev.color : '#8E4B9D');
    fn(id, ev);
  }).catch(errToast);
}
function scopeNote() {
  if (isAdmin()) return '';
  return '<div class="announce" style="background:var(--info-soft);border-color:#cfe0fb;color:#1e40af">' + ic('info') + '<div>ท่านเห็นข้อมูลเฉพาะ: <b>' + S.me.scopes.map(function (s) { return (s.level === 'UNIT' ? 'หน่วย ' : '') + esc(s.scope.replace(/^รพ\.สมเด็จฯ - /, '')); }).join(', ') + '</b> (ดูอย่างเดียว)</div></div>';
}

/* =================================================================== แดชบอร์ด */
ROUTES['admin/dashboard'] = function (params) {
  withEvent(params, 'dashboard', function (id) {
    document.title = 'แดชบอร์ด · SOMDEJ HR Connect';
    var draw = function (d) { if (S.route === 'admin/dashboard') drawDash(d); };
    api('getDashboard', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function drawDash(d) {
  var k = d.kpi, ev = d.event;
  var h = pageHead(esc(ev.title), evStatusChip(ev.status) + ' &nbsp;ปิดรับ ' + esc(thDate(ev.closeAt)) + ' · ข้อมูล ณ ' + esc(thShort(d.generatedAt)),
    eventPicker(ev.id, 'dashboard') + '<button class="btn" id="dRefresh">' + ic('refresh') + 'รีเฟรช</button><button class="btn primary" id="dExport" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'ส่งออก Excel</button>', 'แดชบอร์ด');
  h += scopeNote();
  h += '<div class="kpis"><div class="kpi hero"><small>' + ic('chart') + ' ความคืบหน้า</small><b class="num">' + k.pct + '%</b><div class="sub">ตอบแล้ว ' + nf(k.done) + ' จาก ' + nf(k.target) + ' คน</div>' + ring(k.pct, 70) + '</div>' +
    '<div class="kpi"><small>' + ic('shirt') + ' จองแล้ว</small><b class="num" style="color:var(--ok)">' + nf(k.ordered) + '</b><div class="sub">รวม ' + nf(k.pieces) + ' ตัว' + (k.extra ? ' (สั่งเพิ่ม ' + nf(k.extra) + ')' : '') + '</div></div>' +
    '<div class="kpi"><small>' + ic('ban') + ' ไม่ประสงค์</small><b class="num" style="color:var(--muted)">' + nf(k.declined) + '</b><div class="sub">นับว่าตอบแล้ว</div></div>' +
    '<a class="kpi" href="#/admin/tracking/' + esc(ev.id) + '?status=pending" style="text-decoration:none;color:inherit"><small>' + ic('alert') + ' ยังไม่ตอบ</small><b class="num" style="color:var(--warn)">' + nf(k.pending) + '</b><div class="sub">กดเพื่อดูรายชื่อ ' + ic('arrowr') + '</div></a>' +
    '<div class="kpi"><small>' + ic('users') + ' เป้าหมาย</small><b class="num">' + nf(k.target) + '</b><div class="sub">' + (k.byAdmin ? 'HR บันทึกแทน ' + nf(k.byAdmin) + ' · ' : '') + (k.outside ? 'นอกเป้า ' + k.outside : 'บุคลากรที่ต้องตอบ') + '</div></div></div>';

  // ขนาด
  var maxc = 1; d.sizes.forEach(function (o) { o.sizes.forEach(function (s) { maxc = Math.max(maxc, s.count); }); });
  var bars = d.sizes.map(function (o, i) {
    return '<h4><span>' + esc(o.label) + '</span><span class="num">' + nf(o.total) + ' ตัว</span></h4>' + o.sizes.filter(function (s) { return !s.hidden || s.count; }).map(function (s) {
      return '<div class="b"><span class="lbl">' + esc(s.code) + '</span><div class="track"><div class="fill ' + (i % 2 ? 'f' : '') + '" style="width:' + (s.count / maxc * 100) + '%"></div></div><span class="val">' + nf(s.count) + '</span></div>';
    }).join('');
  }).join('<div style="height:10px"></div>');
  var totalForm = d.form.reduce(function (a, f) { return a + f.count; }, 0);
  var formHtml = '<div class="formcopy">' + d.form.map(function (f, i) { return '<div class="fc" data-copy="' + f.count + '" title="คลิกเพื่อคัดลอก"><span><span class="n">' + (i + 3) + '.</span> ' + esc(f.label) + '</span><b>' + f.count + '</b></div>'; }).join('') + '</div>';
  var coord = d.coordinator && d.coordinator.name ? d.coordinator.name + ' โทร ' + d.coordinator.phone : '';

  var divs = d.byDivision.slice().sort(function (a, b) { return a.pct - b.pct; });
  var tl = d.timeline.slice(-21), maxT = 1; tl.forEach(function (t) { maxT = Math.max(maxT, t.n); });

  h += '<div class="dgrid"><div class="stack">' +
    '<div class="card"><div class="hd"><h3>' + ic('shirt') + ' จำนวนตามไซซ์</h3><span class="chip acc num">รวม ' + nf(k.pieces) + ' ตัว</span></div><div class="bd bars">' + bars + '</div></div>' +
    (ev.type === 'CHOICE' ? '<div class="card"><div class="hd"><div><h3>' + ic('send') + ' สรุปส่งจัดซื้อ (เรียงตามแบบฟอร์ม)</h3><div class="small muted">คลิกตัวเลขเพื่อคัดลอกไปวางในช่องของ MS Forms ทีละช่อง</div></div>' +
      '<div class="row"><button class="btn sm" id="cpAll">' + ic('copy') + 'คัดลอกทั้งชุด</button></div></div><div class="bd">' +
      '<div class="fc" data-copy="' + esc(d.exportUnit) + '" style="margin-bottom:8px"><span><span class="n">1.</span> หน่วยงาน</span><b style="font-size:14px">' + esc(d.exportUnit) + '</b></div>' + formHtml +
      (coord ? '<div class="fc" data-copy="' + esc(coord) + '" style="margin-top:8px"><span><span class="n">20.</span> ผู้ประสานงาน</span><b style="font-size:14px">' + esc(coord) + '</b></div>' : '') +
      '<div class="row between" style="margin-top:12px"><span class="muted small">รวมทุกไซซ์</span><b class="num" style="font-size:18px">' + nf(totalForm) + ' ตัว</b></div></div></div>' : '') +
    '</div><div class="stack">' +
    '<div class="card"><div class="hd"><h3>' + ic('building') + ' ความคืบหน้ารายฝ่าย</h3><a class="btn sm ghost" href="#/admin/reports/' + esc(ev.id) + '">ดูทั้งหมด ' + ic('arrowr') + '</a></div><div class="bd" style="padding-top:8px;max-height:430px;overflow:auto">' +
    divs.map(function (g) { return '<a href="#/admin/tracking/' + esc(ev.id) + '?div=' + encodeURIComponent(g.name) + '&status=pending" style="display:block;text-decoration:none;color:inherit;padding:8px 0;border-bottom:1px dashed var(--line)"><div class="row between"><span style="font-weight:600;font-size:14px">' + esc(g.name) + '</span><span class="small num">' + g.done + '/' + g.target + ' · <b>' + g.pct + '%</b></span></div>' + progBar(g.pct) + '</a>'; }).join('') + '</div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('calendar') + ' การตอบรายวัน</h3></div><div class="bd">' + (tl.length ? '<div class="timeline">' + tl.map(function (t) { return '<div class="col" title="' + esc(thDate(t.d)) + ': ' + t.n + ' คน"><b class="num">' + t.n + '</b><i style="height:' + (t.n / maxT * 78) + '%"></i><small>' + esc(thShort(t.d).replace(/ \d\d:\d\d$/, '')) + '</small></div>'; }).join('') + '</div>' : '<div class="muted small">ยังไม่มีข้อมูล</div>') + '</div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('history') + ' ล่าสุด</h3></div><div class="bd" style="padding-top:4px"><ul class="recent">' + (d.recent.length ? d.recent.map(function (r) {
      return '<li><div class="avatar" style="width:32px;height:32px;font-size:13px">' + esc(initials(r.name)) + '</div><div style="flex:1;min-width:0"><b style="font-size:13.5px">' + esc(r.name) + '</b><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.unit || r.division) + '</div></div>' +
        (r.status === 'DECLINED' ? '<span class="chip">ไม่ประสงค์</span>' : '<span class="chip acc">' + esc(r.optKey) + ' · ' + esc(r.sizeCode) + '</span>') + '<span class="small muted">' + esc(thShort(r.at)) + '</span></li>';
    }).join('') : '<li class="muted">ยังไม่มีการตอบ</li>') + '</ul></div></div>' +
    '</div></div>';
  $('#page').innerHTML = h;
  $$('[data-copy]').forEach(function (el) { el.onclick = function () { copyText(el.dataset.copy).then(function () { el.classList.add('copied'); }); }; });
  var ca = $('#cpAll'); if (ca) ca.onclick = function () { copyText([d.exportUnit].concat(d.form.map(function (f) { return f.count; })).concat(coord ? [coord] : []).join('\n'), 'ทั้งชุด (1 บรรทัดต่อ 1 ช่อง)'); };
  $('#dRefresh').onclick = function () { var b = this; busy(b, api('getDashboard', { eventId: ev.id }, { fresh: true })).then(function (x) { drawDash(x); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'ok'); }).catch(errToast); };
  $('#dExport').onclick = function () { busy(this, api('getExport', { eventId: ev.id }).then(exportWorkbook)).catch(errToast); };
}

/* ---------- ส่งออกไฟล์รวม ---------- */
function trackObjs(t) { return t.rows.map(function (r) { var o = {}; t.cols.forEach(function (c, i) { o[c] = r[i]; }); return o; }); }
function exportWorkbook(x) {
  var d = x.dashboard, t = x.tracking, rows = trackObjs(t), ev = d.event, contact = t.canSeeContact;
  var coord = d.coordinator && d.coordinator.name ? d.coordinator.name + ' โทร ' + d.coordinator.phone : '';
  var sheets = [];
  if (ev.type === 'CHOICE') {
    var f = [['ลำดับข้อในแบบฟอร์ม', 'หัวข้อ', 'จำนวน (ตัว)'], [1, 'หน่วยงาน', d.exportUnit]];
    d.form.forEach(function (x, i) { f.push([i + 3, x.label + ' (ระบุจำนวนตัว)', x.count]); });
    f.push(['', 'รวมทั้งหมด', d.form.reduce(function (a, x) { return a + x.count; }, 0)]);
    if (coord) f.push([20, 'ชื่อ-นามสกุล และเบอร์โทรติดต่อของผู้ประสานงาน', coord]);
    f.push([], ['', 'ข้อมูล ณ', thDate(d.generatedAt)]);
    sheets.push({ name: 'สรุปส่งจัดซื้อ', rows: f, widths: [12, 48, 40] });
  }
  var sizeCols = [];
  (ev.config.options || []).forEach(function (o) { o.sizes.forEach(function (s) { sizeCols.push({ k: o.key + '|' + s.code, h: s.code + ' ' + o.label.replace(/^แบบ/, '') }); }); });
  function pivot(name, keyFn) {
    var m = {};
    rows.forEach(function (r) {
      var k = keyFn(r) || '(ไม่ระบุ)', g = m[k] || (m[k] = { t: 0, o: 0, dc: 0, p: 0, s: {} });
      if (r.target) g.t++;
      if (r.status === 'ORDERED') { g.o++; var kk = r.optKey + '|' + r.sizeCode; g.s[kk] = (g.s[kk] || 0) + (+r.qty || 1) + (+r.extraQty || 0); }
      else if (r.status === 'DECLINED') g.dc++; else if (r.target) g.p++;
    });
    var out = [[name, 'เป้าหมาย', 'จองแล้ว', 'ไม่ประสงค์', 'ยังไม่ตอบ', '% ตอบแล้ว'].concat(ev.type === 'CHOICE' ? sizeCols.map(function (c) { return c.h; }) : [])];
    Object.keys(m).sort().forEach(function (k) { var g = m[k]; out.push([k, g.t, g.o, g.dc, g.p, g.t ? Math.round((g.o + g.dc) * 1000 / g.t) / 10 : '-'].concat(ev.type === 'CHOICE' ? sizeCols.map(function (c) { return g.s[c.k] || 0; }) : [])); });
    return out;
  }
  sheets.push({ name: 'สรุปรายฝ่าย', rows: pivot('ฝ่าย', function (r) { return r.division; }) });
  sheets.push({ name: 'สรุปรายหน่วย', rows: pivot('หน่วย', function (r) { return (r.unit || '-') + ' (' + r.division + ')'; }) });
  sheets.push({ name: 'สรุปรายตำแหน่ง', rows: pivot('ตำแหน่ง', function (r) { return r.position; }) });
  var head = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วย', 'ฝ่าย', 'กลุ่ม', 'สถานะ', 'แบบ', 'ไซซ์', 'จำนวน', 'สั่งเพิ่ม', 'บันทึกล่าสุด', 'HR บันทึกแทน', 'หมายเหตุ'].concat(contact ? ['โทรศัพท์', 'อีเมล'] : []);
  function list(filter) {
    var out = [head], n = 0;
    rows.filter(filter).forEach(function (r) {
      var o = (ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0];
      out.push([++n, r.empCode, r.name, r.position, r.unit, r.division, r.group, r.target || r.status ? STATUS_TH[r.status] : 'นอกเป้าหมาย', o ? o.label : '', r.sizeCode, r.status === 'ORDERED' ? r.qty : '', r.extraQty || '', r.updatedAt ? thDate(r.updatedAt) : '', r.byAdmin ? 'ใช่' : '', r.note].concat(contact ? [r.phone, r.email] : []));
    });
    return out;
  }
  sheets.push({ name: 'รายชื่อทั้งหมด', rows: list(function () { return true; }) });
  sheets.push({ name: 'ยังไม่ตอบ', rows: list(function (r) { return r.target && !r.status; }) });
  return exportXlsx('สรุป_' + ev.title.replace(/[\\\/:*?"<>|]/g, '').slice(0, 40) + '_' + localIso().slice(0, 10) + '.xlsx', sheets);
}

/* =================================================================== ติดตามรายบุคคล */
var TR = null;
ROUTES['admin/tracking'] = function (params, q) {
  withEvent(params, 'tracking', function (id, ev) {
    document.title = 'ติดตาม · SOMDEJ HR Connect';
    TR = { id: id, ev: ev, data: null, rows: [], f: { q: '', div: q.div || '', unit: '', pos: '', group: '', status: q.status || 'all', flag: '' }, page: 1, size: 50, sort: 'unit' };
    var draw = function (d) { if (S.route !== 'admin/tracking') return; TR.data = d; TR.ev = d.event; TR.rows = trackObjs(d); drawTracking(); };
    api('getTracking', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function trFiltered() {
  var f = TR.f, q = f.q.toLowerCase();
  return TR.rows.filter(function (r) {
    if (f.status === 'pending' && !(r.target && !r.status)) return false;
    if (f.status === 'ordered' && r.status !== 'ORDERED') return false;
    if (f.status === 'declined' && r.status !== 'DECLINED') return false;
    if (f.status === 'done' && !r.status) return false;
    if (f.div && r.division !== f.div) return false;
    if (f.unit && r.unit !== f.unit) return false;
    if (f.pos && r.position !== f.pos) return false;
    if (f.group && r.group !== f.group) return false;
    if (f.flag && r.flag !== f.flag) return false;
    if (q && (r.empCode + ' ' + r.name + ' ' + r.position + ' ' + r.unit + ' ' + r.phone).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function uniq(list, k, where) { var m = {}; list.forEach(function (r) { if (!where || where(r)) m[r[k] || ''] = 1; }); return Object.keys(m).filter(Boolean).sort(); }
function drawTracking() {
  var d = TR.data, f = TR.f, all = TR.rows, admin = d.canSeeContact;
  var cnt = { all: all.length, pending: 0, ordered: 0, declined: 0 };
  var base = all.filter(function (r) { return (!f.div || r.division === f.div) && (!f.unit || r.unit === f.unit) && (!f.pos || r.position === f.pos) && (!f.group || r.group === f.group); });
  cnt.all = base.length; base.forEach(function (r) { if (r.status === 'ORDERED') cnt.ordered++; else if (r.status === 'DECLINED') cnt.declined++; else if (r.target) cnt.pending++; });
  var h = pageHead('ติดตามรายบุคคล', esc(d.event.title) + ' · ข้อมูล ณ ' + esc(thShort(d.generatedAt)),
    eventPicker(TR.id, 'tracking') + '<button class="btn" id="tRefresh">' + ic('refresh') + 'รีเฟรช</button>', 'ติดตาม');
  h += scopeNote();
  h += '<div class="card"><div class="bd" style="padding-bottom:10px"><div class="filters">' +
    '<input class="input search" id="fQ" placeholder="ค้นหา รหัส / ชื่อ / ตำแหน่ง / หน่วย" value="' + esc(f.q) + '">' +
    sel('fDiv', 'ทุกฝ่าย', uniq(all, 'division'), f.div) + sel('fUnit', 'ทุกหน่วย', uniq(all, 'unit', function (r) { return !f.div || r.division === f.div; }), f.unit) +
    sel('fPos', 'ทุกตำแหน่ง', uniq(all, 'position', function (r) { return (!f.div || r.division === f.div) && (!f.unit || r.unit === f.unit); }), f.pos) + sel('fGroup', 'ทุกกลุ่ม', uniq(all, 'group'), f.group) +
    (f.div || f.unit || f.pos || f.group || f.q ? '<button class="btn sm ghost" id="fClear">' + ic('x') + 'ล้างตัวกรอง</button>' : '') + '</div>' +
    '<div class="row between" style="margin-top:12px"><div class="seg" id="fStatus">' +
    [['all', 'ทั้งหมด', cnt.all], ['pending', 'ยังไม่ตอบ', cnt.pending], ['ordered', 'จองแล้ว', cnt.ordered], ['declined', 'ไม่ประสงค์', cnt.declined]].map(function (s) { return '<button class="' + (f.status === s[0] ? 'on' : '') + '" data-st="' + s[0] + '">' + s[1] + '<span class="c num">' + nf(s[2]) + '</span></button>'; }).join('') +
    '</div><div class="row"><button class="btn sm" id="tExport">' + ic('download') + 'ส่งออกที่กรอง</button>' +
    (admin ? '<button class="btn sm" id="tPhones">' + ic('phone') + 'คัดลอกเบอร์ผู้ยังไม่ตอบ</button><button class="btn sm primary" id="tRemind">' + ic('mail') + 'อีเมลเตือนผู้ยังไม่ตอบ</button>' : '') + '</div></div></div>' +
    '<div id="tTable"></div></div>';
  $('#page').innerHTML = h;
  drawTrackTable();
  $('#fQ').oninput = debounce(function () { TR.f.q = $('#fQ').value.trim(); TR.page = 1; drawTrackTable(); }, 200);
  [['fDiv', 'div'], ['fUnit', 'unit'], ['fPos', 'pos'], ['fGroup', 'group']].forEach(function (p) {
    $('#' + p[0]).onchange = function () { TR.f[p[1]] = this.value; if (p[1] === 'div') { TR.f.unit = ''; TR.f.pos = ''; } if (p[1] === 'unit') TR.f.pos = ''; TR.page = 1; drawTracking(); };
  });
  var fc = $('#fClear'); if (fc) fc.onclick = function () { TR.f = { q: '', div: '', unit: '', pos: '', group: '', status: TR.f.status, flag: '' }; TR.page = 1; drawTracking(); };
  $$('#fStatus [data-st]').forEach(function (b) { b.onclick = function () { TR.f.status = b.dataset.st; TR.page = 1; drawTracking(); }; });
  $('#tRefresh').onclick = function () { busy(this, api('getTracking', { eventId: TR.id }, { fresh: true })).then(function (x) { TR.data = x; TR.rows = trackObjs(x); drawTracking(); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'ok'); }).catch(errToast); };
  $('#tExport').onclick = function () { exportTrackList(trFiltered()); };
  if (admin) {
    $('#tPhones').onclick = function () {
      var p = trFiltered().filter(function (r) { return r.target && !r.status && r.phone; });
      if (!p.length) return toast('ไม่มีเบอร์โทรของผู้ที่ยังไม่ตอบในรายการที่กรอง', 'warn');
      copyText(p.map(function (r) { return r.name + '\t' + r.phone + '\t' + (r.unit || r.division); }).join('\n'), p.length + ' รายชื่อพร้อมเบอร์');
    };
    $('#tRemind').onclick = function () { remindFiltered(); };
  }
}
function sel(id, all, list, cur) { return '<select class="input" id="' + id + '"><option value="">' + all + '</option>' + list.map(function (v) { return '<option ' + (v === cur ? 'selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select>'; }
function statusChip(r) {
  if (r.status === 'ORDERED') return '<span class="chip ok">' + ic('check') + ' จองแล้ว</span>';
  if (r.status === 'DECLINED') return '<span class="chip">ไม่ประสงค์</span>';
  return r.target ? '<span class="chip warn dot">ยังไม่ตอบ</span>' : '<span class="chip">นอกเป้าหมาย</span>';
}
function sizeTxt(r) { if (r.status !== 'ORDERED') return '<span class="muted">–</span>'; var o = (TR.ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0]; return '<b>' + esc(r.sizeCode) + '</b> <span class="small muted">' + esc(o ? o.label.replace(/^แบบ/, '') : r.optKey) + (r.extraQty ? ' +' + r.extraQty : '') + '</span>'; }
function drawTrackTable() {
  var list = trFiltered(), admin = TR.data.canSeeContact;
  list.sort(function (a, b) { return (a.division + a.unit + a.name) > (b.division + b.unit + b.name) ? 1 : -1; });
  var pages = Math.max(1, Math.ceil(list.length / TR.size)); if (TR.page > pages) TR.page = pages;
  var slice = list.slice((TR.page - 1) * TR.size, TR.page * TR.size);
  var h = '<div class="tablewrap resp"><table class="t"><thead><tr><th>รหัส / ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย / ฝ่าย</th><th>สถานะ</th><th>ไซซ์</th>' + (admin ? '<th>ติดต่อ</th><th></th>' : '') + '</tr></thead><tbody>' +
    (slice.length ? slice.map(function (r) {
      return '<tr><td><div class="nm">' + esc(r.name) + (r.flag ? ' <span class="chip info" title="' + esc(FLAG_TH[r.flag] || r.flag) + '">' + esc(FLAG_TH[r.flag] || r.flag) + '</span>' : '') + '</div><div class="sub num">' + esc(r.empCode) + (r.lastLoginAt ? '' : ' · ยังไม่เคยเข้าระบบ') + '</div></td>' +
        '<td>' + esc(r.position) + '<div class="sub">' + esc(r.group) + '</div></td><td>' + esc(r.unit || '-') + '<div class="sub">' + esc(r.division) + '</div></td>' +
        '<td>' + statusChip(r) + (r.byAdmin ? '<div class="sub">HR บันทึกแทน</div>' : '') + (r.updatedAt ? '<div class="sub">' + esc(thShort(r.updatedAt)) + '</div>' : '') + '</td><td>' + sizeTxt(r) + '</td>' +
        (admin ? '<td>' + (r.phone ? '<a href="tel:' + esc(r.phone) + '" class="num" style="white-space:nowrap">' + ic('phone') + ' ' + esc(r.phone) + '</a>' : '<span class="muted small">ไม่มีเบอร์</span>') + (r.email ? '<div class="sub">' + esc(r.email) + '</div>' : '') + '</td>' +
          '<td class="r" style="white-space:nowrap"><button class="btn sm" data-proxy="' + esc(r.empCode) + '">' + ic('edit') + (r.status ? 'แก้แทน' : 'บันทึกแทน') + '</button> <button class="iconbtn" data-hist="' + esc(r.empCode) + '" title="ประวัติ">' + ic('history') + '</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="7"><div class="empty">' + ic('search') + '<p>ไม่พบรายชื่อตามเงื่อนไข</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + slice.map(function (r) {
      return '<div class="mi"><div class="avatar" style="width:36px;height:36px;font-size:14px">' + esc(initials(r.name)) + '</div><div class="x"><b>' + esc(r.name) + '</b><small>' + esc(r.empCode + ' · ' + r.position) + '</small><small>' + esc(r.unit || r.division) + '</small>' +
        '<div class="row" style="margin-top:5px">' + statusChip(r) + (r.status === 'ORDERED' ? '<span class="chip acc">' + esc(r.optKey + ' · ' + r.sizeCode) + '</span>' : '') + '</div></div>' +
        (admin ? '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + (r.phone ? '<a class="btn sm" href="tel:' + esc(r.phone) + '">' + ic('phone') + '</a>' : '') + '<button class="btn sm" data-proxy="' + esc(r.empCode) + '">' + ic('edit') + '</button></div>' : '') + '</div>';
    }).join('') + '</div></div>' +
    '<div class="pager"><span>แสดง ' + (list.length ? ((TR.page - 1) * TR.size + 1) + '–' + Math.min(list.length, TR.page * TR.size) : 0) + ' จาก ' + nf(list.length) + ' คน</span><div class="row">' +
    '<button class="btn sm" id="pPrev" ' + (TR.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + TR.page + '/' + pages + '</span><button class="btn sm" id="pNext" ' + (TR.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div>';
  $('#tTable').innerHTML = h;
  $('#pPrev').onclick = function () { TR.page--; drawTrackTable(); };
  $('#pNext').onclick = function () { TR.page++; drawTrackTable(); };
  $$('[data-proxy]').forEach(function (b) { b.onclick = function () { proxyModal(TR.rows.filter(function (r) { return r.empCode === b.dataset.proxy; })[0]); }; });
  $$('[data-hist]').forEach(function (b) { b.onclick = function () { histModal(b.dataset.hist); }; });
}
function exportTrackList(list) {
  var ev = TR.ev, contact = TR.data.canSeeContact;
  var rows = [['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วย', 'ฝ่าย', 'กลุ่ม', 'สถานะ', 'แบบ', 'ไซซ์', 'บันทึกล่าสุด'].concat(contact ? ['โทรศัพท์', 'อีเมล'] : [])];
  list.forEach(function (r, i) { var o = (ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0]; rows.push([i + 1, r.empCode, r.name, r.position, r.unit, r.division, r.group, r.target || r.status ? STATUS_TH[r.status] : 'นอกเป้าหมาย', o ? o.label : '', r.sizeCode, r.updatedAt ? thDate(r.updatedAt) : ''].concat(contact ? [r.phone, r.email] : [])); });
  exportXlsx('รายชื่อ_' + (TR.f.status === 'pending' ? 'ยังไม่ตอบ_' : '') + (TR.f.div || 'ทั้งหมด').slice(0, 30) + '_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รายชื่อ', rows: rows }]).catch(errToast);
}
function remindFiltered() {
  var p = trFiltered().filter(function (r) { return r.target && !r.status; }), withMail = p.filter(function (r) { return r.email; });
  if (!p.length) return toast('ไม่มีผู้ที่ยังไม่ตอบในรายการที่กรอง', 'info');
  confirmBox({ title: 'ส่งอีเมลเตือน ' + withMail.length + ' คน?', icon: 'mail', ok: 'ส่งอีเมล',
    msg: 'ผู้ที่ยังไม่ตอบในรายการที่กรอง ' + p.length + ' คน · มีอีเมลใน HR ' + withMail.length + ' คน' + (p.length > withMail.length ? '<br><span style="color:var(--warn)">อีก ' + (p.length - withMail.length) + ' คนไม่มีอีเมล — ใช้เบอร์โทรหรือแจ้งหัวหน้าแทน</span>' : '') }).then(function (y) {
    if (!y || !withMail.length) return;
    toast('กำลังส่งอีเมล…', 'info');
    api('sendMail', { eventId: TR.id, type: 'REMIND_STAFF', opt: { codes: withMail.map(function (r) { return r.empCode; }) } }).then(function (r) {
      toast('ส่งแล้ว ' + r.sent + ' ฉบับ' + (r.failed ? ' · ล้มเหลว ' + r.failed : '') + (r.remaining ? ' · ค้าง ' + r.remaining + ' (กดส่งอีกครั้ง)' : ''), r.failed ? 'warn' : 'ok', 'ส่งอีเมลเตือน');
    }).catch(errToast);
  });
}
function proxyModal(r) {
  var ev = TR.ev, cfg = ev.config || {}, opts = cfg.options || [];
  var cur = r.status === 'ORDERED' ? r.optKey : (opts.filter(function (o) { return o.key === r.gender; })[0] || opts[0] || {}).key;
  var body = '<div class="row" style="margin-bottom:12px"><div class="avatar">' + esc(initials(r.name)) + '</div><div><b>' + esc(r.name) + '</b><div class="small muted">' + esc(r.empCode + ' · ' + r.position + ' · ' + (r.unit || r.division)) + '</div></div></div>' +
    '<div class="seg" id="pxMode" style="margin-bottom:14px"><button class="' + (r.status !== 'DECLINED' ? 'on' : '') + '" data-m="ORDERED">จอง</button>' + (cfg.allowDecline !== false ? '<button class="' + (r.status === 'DECLINED' ? 'on' : '') + '" data-m="DECLINED">' + esc(cfg.declineLabel || 'ไม่ประสงค์') + '</button>' : '') + '</div>' +
    '<div id="pxOrder" class="grid2"><div class="field"><label class="f">แบบ</label><select class="input" id="pxOpt">' + opts.map(function (o) { return '<option value="' + esc(o.key) + '" ' + (o.key === cur ? 'selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label class="f">ไซซ์</label><select class="input" id="pxSize"></select></div></div>' +
    '<div class="field"><label class="f">หมายเหตุ / เหตุผลที่บันทึกแทน</label><input class="input" id="pxNote" maxlength="300" value="' + esc(r.note || '') + '" placeholder="เช่น โทรสอบถามแล้ว"></div>' +
    '<div class="small muted">' + ic('info') + ' บันทึกแทนได้แม้ปิดรับแล้ว · ระบบบันทึกประวัติว่าใครแก้อะไร</div>';
  var m = modal({ title: (r.status ? 'แก้ไขแทน' : 'บันทึกแทน'), body: body, foot: (r.status ? '<button class="btn danger" id="pxReset" style="margin-right:auto">' + ic('trash') + 'ล้างคำตอบ</button>' : '') + '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="pxSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  var mode = r.status === 'DECLINED' ? 'DECLINED' : 'ORDERED';
  var fillSizes = function () { var o = opts.filter(function (x) { return x.key === $('#pxOpt').value; })[0] || { sizes: [] }; $('#pxSize').innerHTML = o.sizes.filter(function (s) { return !s.hidden; }).map(function (s) { return '<option ' + (s.code === r.sizeCode && o.key === r.optKey ? 'selected' : '') + '>' + esc(s.code) + '</option>'; }).join(''); };
  fillSizes(); $('#pxOpt').onchange = fillSizes;
  $$('#pxMode [data-m]').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; $$('#pxMode button').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#pxOrder').style.display = mode === 'ORDERED' ? '' : 'none'; }; });
  $('#pxOrder').style.display = mode === 'ORDERED' ? '' : 'none';
  $('#pxSave').onclick = function () {
    busy(this, api('saveResponseFor', { eventId: TR.id, empCode: r.empCode, status: mode, optKey: $('#pxOpt').value, sizeCode: $('#pxSize').value, note: $('#pxNote').value.trim() })).then(function (d) {
      m.close(); Object.assign(r, { status: d.mine.status, optKey: d.mine.optKey, sizeCode: d.mine.sizeCode, qty: d.mine.qty, updatedAt: d.mine.updatedAt, byAdmin: 1, note: d.mine.note });
      drawTracking(); toast(r.name + ' · ' + (mode === 'DECLINED' ? 'ไม่ประสงค์' : d.mine.optKey + ' ' + d.mine.sizeCode) + (d.mailed ? ' · ส่งอีเมลยืนยันแล้ว' : ''), 'ok', 'บันทึกแทนเรียบร้อย');
    }).catch(errToast);
  };
  var rs = $('#pxReset');
  if (rs) rs.onclick = function () {
    confirmBox({ title: 'ล้างคำตอบของ ' + r.name + '?', msg: 'สถานะจะกลับเป็น "ยังไม่ตอบ" (มีบันทึกประวัติ)', danger: true, ok: 'ล้างคำตอบ' }).then(function (y) {
      if (!y) return;
      api('resetResponse', { eventId: TR.id, empCode: r.empCode, reason: $('#pxNote') ? $('#pxNote').value : '' }).then(function () { m.close(); r.status = ''; r.optKey = ''; r.sizeCode = ''; drawTracking(); toast('ล้างคำตอบแล้ว', 'ok'); }).catch(errToast);
    });
  };
}
function histModal(code) {
  var m = modal({ title: 'ประวัติการแก้ไข · ' + esc(code), body: skel(1) });
  api('getResponseHistory', { eventId: TR.id, empCode: code }).then(function (l) {
    $('.mb', m.el).innerHTML = l.length ? '<ul class="recent">' + l.map(function (a) { return '<li><span class="chip ' + (a.action === 'RESPONSE_BY_ADMIN' ? 'info' : a.action === 'RESPONSE_RESET' ? 'danger' : 'acc') + '">' + esc({ RESPONSE_NEW: 'บันทึกใหม่', RESPONSE_EDIT: 'แก้ไขเอง', RESPONSE_BY_ADMIN: 'HR บันทึกแทน', RESPONSE_RESET: 'ล้าง' }[a.action] || a.action) + '</span><div style="flex:1"><b>' + esc(a.detail) + '</b><div class="small muted">โดย ' + esc(a.actor) + ' · ' + esc(thDate(a.ts)) + '</div></div></li>'; }).join('') + '</ul>' : '<div class="empty">ยังไม่มีประวัติ</div>';
  }).catch(errToast);
}

/* =================================================================== รายงาน */
var RP = null;
ROUTES['admin/reports'] = function (params, q) {
  withEvent(params, 'reports', function (id) {
    document.title = 'รายงาน · SOMDEJ HR Connect';
    RP = { id: id, by: q.by || 'division', x: null };
    var draw = function (x) { if (S.route !== 'admin/reports') return; RP.x = x; drawReport(); };
    api('getExport', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function drawReport() {
  var x = RP.x, d = x.dashboard, rows = trackObjs(x.tracking), ev = d.event, by = RP.by;
  var keyFn = { division: function (r) { return r.division; }, unit: function (r) { return r.unit || '(ไม่ระบุหน่วย)'; }, position: function (r) { return r.position; }, group: function (r) { return r.group; } }[by];
  var sizeCols = []; (ev.config.options || []).forEach(function (o) { o.sizes.forEach(function (s) { if (!s.hidden) sizeCols.push({ k: o.key + '|' + s.code, h: s.code, o: o.label.replace(/^แบบ/, '') }); }); });
  var m = {}, tot = { t: 0, o: 0, dc: 0, p: 0, s: {}, sub: '' };
  rows.forEach(function (r) {
    var k = keyFn(r) || '(ไม่ระบุ)', g = m[k] || (m[k] = { name: k, sub: by === 'unit' ? r.division : '', t: 0, o: 0, dc: 0, p: 0, s: {} });
    [g, tot].forEach(function (z) {
      if (r.target) z.t++;
      if (r.status === 'ORDERED') { z.o++; var kk = r.optKey + '|' + r.sizeCode; z.s[kk] = (z.s[kk] || 0) + (+r.qty || 1) + (+r.extraQty || 0); }
      else if (r.status === 'DECLINED') z.dc++; else if (r.target) z.p++;
    });
  });
  var list = Object.keys(m).map(function (k) { var g = m[k]; g.pct = pct(g.o + g.dc, g.t); return g; }).sort(function (a, b) { return a.pct - b.pct || b.p - a.p; });
  var showSizes = ev.type === 'CHOICE';
  var h = pageHead('รายงาน', esc(ev.title) + ' · ข้อมูล ณ ' + esc(thShort(d.generatedAt)), eventPicker(ev.id, 'reports') + '<button class="btn" onclick="window.print()">' + ic('download') + 'พิมพ์</button><button class="btn primary" id="rExport" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'ส่งออก Excel (ทุกแผ่น)</button>', 'รายงาน');
  h += scopeNote();
  h += '<div class="tabs">' + [['division', 'รายฝ่าย', 'building'], ['unit', 'รายหน่วย', 'layers'], ['position', 'รายตำแหน่ง', 'user'], ['group', 'รายกลุ่มบุคลากร', 'users']].map(function (t) { return '<a href="#/admin/reports/' + esc(ev.id) + '?by=' + t[0] + '" class="' + (by === t[0] ? 'on' : '') + '">' + ic(t[2]) + t[1] + '</a>'; }).join('') + '</div>';
  var hdr = '<tr><th>' + { division: 'ฝ่าย', unit: 'หน่วย', position: 'ตำแหน่ง', group: 'กลุ่ม' }[by] + '</th><th class="r">เป้าหมาย</th><th class="r">จอง</th><th class="r">ไม่ประสงค์</th><th class="r">ค้าง</th><th style="min-width:130px">ตอบแล้ว</th>' +
    (showSizes ? sizeCols.map(function (c) { return '<th class="r" title="' + esc(c.o) + '">' + esc(c.h) + '<div class="sub" style="font-weight:500">' + esc(c.o) + '</div></th>'; }).join('') : '') + '</tr>';
  var line = function (g, isTot) {
    return '<tr' + (isTot ? ' style="font-weight:700;background:var(--surface-2)"' : '') + '><td><div class="nm">' + esc(isTot ? 'รวมทั้งหมด' : g.name) + '</div>' + (g.sub ? '<div class="sub">' + esc(g.sub) + '</div>' : '') + '</td><td class="r num">' + nf(g.t) + '</td><td class="r num" style="color:var(--ok)">' + nf(g.o) + '</td><td class="r num">' + nf(g.dc) + '</td>' +
      '<td class="r num" style="color:' + (g.p ? 'var(--warn)' : 'inherit') + '">' + (g.p && !isTot && by === 'division' ? '<a href="#/admin/tracking/' + esc(ev.id) + '?div=' + encodeURIComponent(g.name) + '&status=pending">' + nf(g.p) + '</a>' : nf(g.p)) + '</td>' +
      '<td><div class="row" style="gap:8px;flex-wrap:nowrap">' + progBar(pct(g.o + g.dc, g.t)) + '<span class="small num">' + pct(g.o + g.dc, g.t) + '%</span></div></td>' +
      (showSizes ? sizeCols.map(function (c) { return '<td class="r num">' + (g.s[c.k] || '<span class="muted">·</span>') + '</td>'; }).join('') : '') + '</tr>';
  };
  h += '<div class="card"><div class="tablewrap" style="max-height:70vh"><table class="t"><thead>' + hdr + '</thead><tbody>' + line(tot, true) + list.map(function (g) { return line(g); }).join('') + '</tbody></table></div></div>';
  $('#page').innerHTML = h;
  $('#rExport').onclick = function () { busy(this, exportWorkbook(RP.x)).catch(errToast); };
}

/* =================================================================== อีเมลติดตาม */
ROUTES['admin/mail'] = function (params) {
  if (!needAdmin()) return;
  withEvent(params, 'mail', function (id) {
    document.title = 'อีเมลติดตาม · SOMDEJ HR Connect';
    loadEvents(true).then(function () { drawMail(id); }).catch(errToast);
  });
};
function drawMail(id) {
  var ev = AD.events.filter(function (e) { return e.id === id; })[0], mc = ev.mail || {};
  var days = mc.days || [];
  var cards = [
    ['CONFIRM', 'check', 'ยืนยันการบันทึกถึงบุคลากร', 'ส่งทันทีที่บุคลากรบันทึก/แก้ไข พร้อมรายละเอียดไซซ์ (เฉพาะผู้มีอีเมลใน HR)', 'confirm', false],
    ['REMIND_STAFF', 'alert', 'เตือนบุคลากรที่ยังไม่ตอบ', 'ส่งรายบุคคลถึงผู้ที่ยังไม่บันทึก พร้อมปุ่มเข้าระบบ (ครั้งละไม่เกิน 400 ฉบับ)', 'remindStaff', true],
    ['HEAD_SUMMARY', 'building', 'สรุปถึงหัวหน้าฝ่าย/หน่วย', 'รายชื่อผู้ที่ยังไม่ตอบในสังกัด + ความคืบหน้า (ส่งตามรอบเฉพาะสังกัดที่ยังค้าง)', 'headSummary', true],
    ['ADMIN_SUMMARY', 'chart', 'สรุปภาพรวมถึงผู้ดูแล', 'ตัวเลขรวม ไซซ์ และฝ่ายที่ยังค้าง ถึงผู้ดูแลระบบทุกคนที่มีอีเมล', 'adminSummary', true]
  ];
  var h = pageHead('อีเมลติดตาม', esc(ev.title), eventPicker(id, 'mail'), 'อีเมล');
  h += '<div class="mailcards">' + cards.map(function (c) {
    return '<div class="mailcard"><div class="row between"><div class="ic">' + ic(c[1]) + '</div><label class="switch" title="ส่งอัตโนมัติ"><input type="checkbox" data-auto="' + c[4] + '" ' + (mc[c[4]] ? 'checked' : '') + '><span class="tr"></span><span class="small">' + (c[0] === 'CONFIRM' ? 'เปิดใช้' : 'ส่งตามรอบ') + '</span></label></div>' +
      '<h4>' + c[2] + '</h4><p>' + c[3] + '</p><div class="row"><button class="btn sm" data-pv="' + c[0] + '">' + ic('eye') + 'ดูตัวอย่าง</button>' + (c[5] ? '<button class="btn sm" data-test="' + c[0] + '">' + ic('send') + 'ส่งทดสอบ</button><button class="btn sm primary" data-send="' + c[0] + '">ส่งตอนนี้</button>' : '') + '</div></div>';
  }).join('') + '</div>';
  h += '<div class="card" style="margin-top:18px"><div class="hd"><h3>' + ic('calendar') + ' รอบส่งอัตโนมัติ</h3><button class="btn primary sm" id="mSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึกการตั้งค่า</button></div><div class="bd"><div class="grid3">' +
    '<div class="field"><label class="f">วันที่ส่ง</label><div class="daypick">' + TH_DAY.map(function (d, i) { return '<label><input type="checkbox" data-day="' + i + '" ' + (days.indexOf(i) >= 0 ? 'checked' : '') + '><span>' + d + '</span></label>'; }).join('') + '</div></div>' +
    '<div class="field"><label class="f">เวลา (ประมาณ)</label><select class="input" id="mHour">' + [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(function (x) { return '<option value="' + x + '" ' + ((mc.hour == null ? 9 : +mc.hour) === x ? 'selected' : '') + '>' + x + ':00 น.</option>'; }).join('') + '</select><div class="hint">ระบบตรวจทุกชั่วโมง ส่งในชั่วโมงนั้น</div></div>' +
    '<div class="field"><label class="f">ส่งเพิ่มก่อนปิดรับ</label><select class="input" id="mBefore">' + [0, 1, 2, 3, 5, 7].map(function (x) { return '<option value="' + x + '" ' + ((+mc.beforeCloseDays || 0) === x ? 'selected' : '') + '>' + (x ? x + ' วันก่อนปิด' : 'ไม่ส่ง') + '</option>'; }).join('') + '</select></div></div>' +
    '<div class="small muted">' + ic('info') + ' ต้อง Run <b>installTriggers</b> ใน Apps Script หนึ่งครั้งเพื่อเปิดตัวตั้งเวลา · ส่งจากบัญชีที่ Deploy (Workspace ~1,500 ฉบับ/วัน) · หัวหน้าต้องมีอีเมลในเมนู "หัวหน้าฝ่าย/หน่วย"</div></div></div>';
  h += '<div class="card" style="margin-top:18px"><div class="hd"><h3>' + ic('history') + ' บันทึกการส่ง</h3><button class="btn sm" id="mLogR">' + ic('refresh') + '</button></div><div id="mLog">' + skel(1) + '</div></div>';
  $('#page').innerHTML = h;
  var loadLog = function () {
    api('listMailLog', { eventId: id, limit: 300 }).then(function (l) {
      $('#mLog').innerHTML = l.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>เวลา</th><th>ชนิด</th><th>วิธี</th><th class="r">ผู้รับ</th><th class="r">สำเร็จ</th><th class="r">ล้มเหลว</th><th>โดย</th><th>หมายเหตุ</th></tr></thead><tbody>' +
        l.map(function (r) { return '<tr><td class="num">' + esc(thShort(r.ts)) + '</td><td>' + esc(MAIL_TH[r.type] || r.type) + '</td><td><span class="chip ' + (r.trigger === 'AUTO' ? 'info' : 'acc') + '">' + (r.trigger === 'AUTO' ? 'อัตโนมัติ' : 'กดส่ง') + '</span></td><td class="r num">' + r.recipients + '</td><td class="r num" style="color:var(--ok)">' + r.sent + '</td><td class="r num" style="color:' + (+r.failed ? 'var(--danger)' : 'inherit') + '">' + r.failed + '</td><td>' + esc(r.actor) + '</td><td class="small">' + esc(r.type === 'CONFIRM' ? r.detail : r.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ยังไม่มีการส่งอีเมล</div>';
    }).catch(errToast);
  };
  loadLog(); $('#mLogR').onclick = loadLog;
  $$('[data-pv]').forEach(function (b) { b.onclick = function () { previewMail(id, b.dataset.pv); }; });
  $$('[data-test]').forEach(function (b) {
    b.onclick = function () {
      var me = ''; try { me = localStorage.getItem('hrc_testmail') || ''; } catch (e) { }
      var m = modal({ title: 'ส่งทดสอบ · ' + MAIL_TH[b.dataset.test], body: '<div class="field"><label class="f">ส่งถึงอีเมล</label><input class="input" id="tmTo" type="email" value="' + esc(me) + '" placeholder="you@redcross.or.th"></div><div class="small muted">ส่ง 1 ฉบับ (หัวเรื่องขึ้นต้น [ทดสอบ]) ด้วยข้อมูลจริงของผู้รับรายแรก</div>',
        foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="tmGo" data-busy="กำลังส่ง…">' + ic('send') + 'ส่งทดสอบ</button>' });
      $('#tmGo').onclick = function () { var to = $('#tmTo').value.trim(); try { localStorage.setItem('hrc_testmail', to); } catch (e) { } busy(this, api('sendMail', { eventId: id, type: b.dataset.test, testTo: to })).then(function () { m.close(); toast('ส่งอีเมลทดสอบถึง ' + to + ' แล้ว', 'ok'); loadLog(); }).catch(errToast); };
    };
  });
  $$('[data-send]').forEach(function (b) {
    b.onclick = function () {
      var t = b.dataset.send;
      busy(b, api('previewMail', { eventId: id, type: t })).then(function (pv) {
        return confirmBox({ title: 'ส่ง "' + MAIL_TH[t] + '" ตอนนี้?', icon: 'send', ok: 'ส่ง ' + pv.recipients + ' ฉบับ', msg: esc(pv.note) + (pv.recipients ? '' : '<br><b>ไม่มีผู้รับที่มีอีเมล</b>') }).then(function (y) {
          if (!y || !pv.recipients) return;
          toast('กำลังส่ง ' + pv.recipients + ' ฉบับ อาจใช้เวลาสักครู่…', 'info');
          return busy(b, api('sendMail', { eventId: id, type: t })).then(function (r) {
            toast('ส่งแล้ว ' + r.sent + '/' + r.recipients + (r.failed ? ' · ล้มเหลว ' + r.failed : '') + (r.remaining ? ' · ค้าง ' + r.remaining + ' กดส่งอีกครั้งเพื่อส่งต่อ' : '') + ' · โควตาคงเหลือวันนี้ ' + r.quotaLeft, r.failed ? 'warn' : 'ok', MAIL_TH[t]);
            loadLog();
          });
        });
      }).catch(errToast);
    };
  });
  $('#mSave').onclick = function () {
    var mail = Object.assign({}, mc);
    $$('[data-auto]').forEach(function (c) { mail[c.dataset.auto] = c.checked; });
    mail.days = $$('[data-day]').filter(function (c) { return c.checked; }).map(function (c) { return +c.dataset.day; });
    mail.hour = +$('#mHour').value; mail.beforeCloseDays = +$('#mBefore').value;
    var e2 = Object.assign({}, ev, { mail: mail });
    busy(this, api('saveEvent', { event: e2 })).then(function () { ev.mail = mail; toast('บันทึกการตั้งค่าอีเมลแล้ว', 'ok'); }).catch(errToast);
  };
  $$('[data-auto]').forEach(function (c) { c.onchange = function () { toast('กด "บันทึกการตั้งค่า" เพื่อยืนยัน', 'info'); }; });
}
function previewMail(id, type) {
  var m = modal({ title: 'ตัวอย่าง · ' + MAIL_TH[type], size: 'lg', body: skel(1) });
  api('previewMail', { eventId: id, type: type }).then(function (pv) {
    $('.mb', m.el).innerHTML = '<div class="small muted" style="margin-bottom:8px"><b>หัวเรื่อง:</b> ' + esc(pv.subject) + '<br>' + esc(pv.note) + '</div><iframe class="mailframe" id="pvFrame"></iframe>';
    var f = $('#pvFrame'); f.srcdoc = pv.html;
  }).catch(function (e) { m.close(); errToast(e); });
}

/* =================================================================== กิจกรรม */
var COLORS = ['#8E4B9D', '#C8202E', '#1F6FB2', '#0F8B6E', '#D97706', '#BE185D', '#334155', '#7C3AED'];
ROUTES['admin/events'] = function (params) {
  if (!needAdmin()) return;
  document.title = 'กิจกรรม · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  if (params[0] === 'edit') return editEvent(params[1]);
  $('#page').innerHTML = skel(2);
  loadEvents(true).then(function (list) {
    var h = pageHead('กิจกรรม', 'สร้างและจัดการกิจกรรมทั้งหมดในระบบ — เลือกไซซ์/สั่งของ · ลงทะเบียน · คำขอ', '<a class="btn primary" href="#/admin/events/edit/new">' + ic('plus') + 'สร้างกิจกรรม</a>', 'จัดการ');
    h += list.length ? '<div class="evgrid">' + list.map(function (e) {
      return '<div class="evcard" style="--ec:' + esc(e.color) + '"><div class="cover" style="height:110px">' + (e.config.image ? '<img src="' + esc(e.config.image) + '" alt="">' : '') + '<div class="tag">' + evStatusChip(e.status) + '</div></div><div class="body"><h3>' + esc(e.title) + '</h3>' +
        '<div class="meta"><span>' + esc({ CHOICE: 'เลือกตัวเลือก/สั่งของ', REGISTER: 'ลงทะเบียน', REQUEST: 'คำขอ' }[e.type] || e.type) + '</span><span>' + ic('users') + ' ' + (e.audience.mode === 'FILTER' ? 'เฉพาะกลุ่ม' : 'ทุกคน') + '</span><span>' + ic('check') + ' ตอบแล้ว ' + nf(e.responded) + '</span></div>' +
        '<div class="meta"><span>' + ic('calendar') + ' ' + esc(thDate(e.openAt)) + ' – ' + esc(thDate(e.closeAt)) + '</span></div>' +
        '<div class="mystate"><a class="btn sm" href="#/admin/dashboard/' + esc(e.id) + '">' + ic('chart') + 'แดชบอร์ด</a><a class="btn sm primary" href="#/admin/events/edit/' + esc(e.id) + '">' + ic('edit') + 'แก้ไข</a></div></div></div>';
    }).join('') + '</div>' : '<div class="card empty">' + ic('layers') + '<p>ยังไม่มีกิจกรรม</p></div>';
    h += '<div class="card pad" style="margin-top:20px"><h3 style="font-size:16px;margin-bottom:6px">' + ic('sparkle') + ' แผนต่อยอด</h3><p class="muted small" style="margin:0">โครงระบบรองรับกิจกรรม 3 แบบ: <b>เลือกตัวเลือก/สั่งของ</b> (ใช้งานได้แล้ว) · <b>ลงทะเบียนเข้าร่วมงาน</b> · <b>คำขอ/ขอสิทธิ (มีขั้นอนุมัติ)</b> — สองแบบหลังวางโครงข้อมูลไว้แล้ว จะเปิดใช้ในรุ่นถัดไป</p></div>';
    $('#page').innerHTML = h;
  }).catch(errToast);
};
function dtLocal(v) { return String(v || '').slice(0, 16); }
function editEvent(id) {
  $('#page').innerHTML = skel(3);
  loadEvents(true).then(function (list) {
    var isNew = id === 'new', e = isNew ? { type: 'CHOICE', title: '', color: '#8E4B9D', published: false, audience: { mode: 'ALL' }, openAt: localIso().slice(0, 16), closeAt: '',
      config: { itemName: '', image: '', sizeNote: '', qtyPerPerson: 1, allowExtra: false, extraMax: 0, extraPrice: 0, allowDecline: true, declineLabel: 'ไม่ประสงค์รับ', coordinator: { name: '', phone: '' }, exportUnit: S.boot.brand.orgName,
        options: [{ key: 'M', label: 'แบบชาย', sizes: [{ code: 'S', chest: '', length: '' }] }, { key: 'F', label: 'แบบหญิง', sizes: [{ code: 'S', chest: '', length: '' }] }] }, mail: { confirm: true, days: [1, 4], hour: 9, beforeCloseDays: 2 } } : JSON.parse(JSON.stringify(list.filter(function (x) { return x.id === id; })[0] || null));
    if (!e) { $('#page').innerHTML = '<div class="card empty">ไม่พบกิจกรรม</div>'; return; }
    var ED = e; setAccent(e.color);
    var draw = function () {
      var c = ED.config, a = ED.audience || { mode: 'ALL' };
      var h = pageHead(isNew ? 'สร้างกิจกรรม' : 'แก้ไขกิจกรรม', isNew ? '' : esc(ED.title), '<a class="btn" href="#/admin/events">ยกเลิก</a><button class="btn primary" id="evSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>', '<a href="#/admin/events">กิจกรรม</a>');
      h += '<div class="dgrid"><div class="stack"><div class="card"><div class="hd"><h3>ข้อมูลกิจกรรม</h3></div><div class="bd">' +
        '<div class="field"><label class="f">ชื่อกิจกรรม *</label><input class="input" data-k="title" value="' + esc(ED.title) + '"></div>' +
        '<div class="field"><label class="f">คำอธิบายย่อ (บรรทัดรอง)</label><input class="input" data-k="subtitle" value="' + esc(ED.subtitle || '') + '"></div>' +
        '<div class="field"><label class="f">รายละเอียด</label><textarea class="input" data-k="description">' + esc(ED.description || '') + '</textarea></div>' +
        '<div class="grid2"><div class="field"><label class="f">ชนิด</label><select class="input" data-k="type"' + (isNew ? '' : ' disabled') + '><option value="CHOICE">เลือกตัวเลือก / สั่งของ</option><option value="REGISTER">ลงทะเบียนเข้าร่วม (รุ่นถัดไป)</option><option value="REQUEST">คำขอ / ขอสิทธิ (รุ่นถัดไป)</option></select></div>' +
        '<div class="field"><label class="f">สีประจำกิจกรรม</label><div class="colorpick">' + COLORS.map(function (x) { return '<button type="button" data-color="' + x + '" class="' + (x.toLowerCase() === String(ED.color).toLowerCase() ? 'on' : '') + '" style="background:' + x + '"></button>'; }).join('') + '</div></div></div>' +
        '<div class="grid2"><div class="field"><label class="f">เปิดรับ</label><input class="input" type="datetime-local" data-k="openAt" value="' + esc(dtLocal(ED.openAt)) + '"></div><div class="field"><label class="f">ปิดรับ</label><input class="input" type="datetime-local" data-k="closeAt" value="' + esc(dtLocal(ED.closeAt)) + '"><div class="hint">ขยายเวลาได้ตลอด · หลังปิดแอดมินยังบันทึกแทนได้</div></div></div>' +
        '<label class="switch"><input type="checkbox" id="evPub" ' + (ED.published ? 'checked' : '') + '><span class="tr"></span>เผยแพร่ (บุคลากรมองเห็น)</label></div></div>' +
        '<div class="card"><div class="hd"><h3>ผู้มีสิทธิ์เข้าร่วม</h3></div><div class="bd"><div class="seg" id="audMode"><button class="' + (a.mode !== 'FILTER' ? 'on' : '') + '" data-m="ALL">บุคลากรทุกคน</button><button class="' + (a.mode === 'FILTER' ? 'on' : '') + '" data-m="FILTER">เฉพาะกลุ่ม</button></div>' +
        '<div id="audBox" style="margin-top:12px;' + (a.mode === 'FILTER' ? '' : 'display:none') + '"><div class="field"><label class="f">ฝ่าย (ชื่อเต็ม คั่นด้วยบรรทัด)</label><textarea class="input" data-a="divisions" placeholder="รพ.สมเด็จฯ - ฝ่ายการพยาบาล">' + esc((a.divisions || []).join('\n')) + '</textarea></div>' +
        '<div class="grid2"><div class="field"><label class="f">กลุ่มบุคลากร</label><textarea class="input" data-a="groups">' + esc((a.groups || []).join('\n')) + '</textarea></div><div class="field"><label class="f">ตำแหน่ง</label><textarea class="input" data-a="positions">' + esc((a.positions || []).join('\n')) + '</textarea></div></div>' +
        '<div class="field"><label class="f">รหัสพนักงานเพิ่มเติม (คั่นด้วย , หรือบรรทัด)</label><textarea class="input" data-a="codes">' + esc((a.codes || []).join('\n')) + '</textarea><div class="hint">เงื่อนไขต่างหมวดต้องตรงทุกข้อ · รหัสที่ระบุได้สิทธิ์เสมอ</div></div></div></div></div></div>' +
        '<div class="stack">' + (ED.type === 'CHOICE' ? choiceEditor(c) : '<div class="card pad empty">' + ic('layers') + '<p>แบบฟอร์มสำหรับกิจกรรมชนิดนี้จะเปิดในรุ่นถัดไป</p></div>') + '</div></div>';
      $('#page').innerHTML = h;
      bindEditor();
    };
    var readForm = function () {
      $$('[data-k]').forEach(function (i) { ED[i.dataset.k] = i.value; });
      ED.published = $('#evPub').checked;
      var a = ED.audience = ED.audience || { mode: 'ALL' };
      $$('[data-a]').forEach(function (t) { a[t.dataset.a] = t.value.split(/[\n,]+/).map(function (x) { return x.trim(); }).filter(Boolean); });
      if (ED.type === 'CHOICE') {
        var c = ED.config;
        $$('[data-c]').forEach(function (i) { var k = i.dataset.c; c[k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? +i.value : i.value; });
        c.coordinator = { name: $('#coName').value.trim(), phone: $('#coPhone').value.trim() };
        $$('[data-oi]').forEach(function (box) {
          var o = c.options[+box.dataset.oi];
          o.label = $('[data-ol]', box).value.trim(); o.key = $('[data-ok]', box).value.trim().toUpperCase();
          o.sizes = $$('tr[data-si]', box).map(function (tr) {
            var s = { code: $('[data-s=code]', tr).value.trim().toUpperCase(), chest: $('[data-s=chest]', tr).value.trim(), length: $('[data-s=length]', tr).value.trim() };
            var note = $('[data-s=note]', tr).value.trim(); if (note) s.note = note; if ($('[data-s=hidden]', tr).checked) s.hidden = true;
            if (s.chest !== '') s.chest = +s.chest; if (s.length !== '') s.length = +s.length; return s;
          }).filter(function (s) { return s.code; });
        });
      }
    };
    var bindEditor = function () {
      $$('[data-color]').forEach(function (b) { b.onclick = function () { readForm(); ED.color = b.dataset.color; setAccent(ED.color); draw(); }; });
      $$('#audMode [data-m]').forEach(function (b) { b.onclick = function () { readForm(); ED.audience.mode = b.dataset.m; draw(); }; });
      $$('[data-addsize]').forEach(function (b) { b.onclick = function () { readForm(); ED.config.options[+b.dataset.addsize].sizes.push({ code: '', chest: '', length: '' }); draw(); }; });
      $$('[data-delsize]').forEach(function (b) { b.onclick = function () { readForm(); var p = b.dataset.delsize.split(':'); ED.config.options[+p[0]].sizes.splice(+p[1], 1); draw(); }; });
      $$('[data-mv]').forEach(function (b) { b.onclick = function () { readForm(); var p = b.dataset.mv.split(':'), arr = ED.config.options[+p[0]].sizes, i = +p[1], j = i + (+p[2]); if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; draw(); }; });
      $$('[data-delopt]').forEach(function (b) { b.onclick = function () { readForm(); ED.config.options.splice(+b.dataset.delopt, 1); draw(); }; });
      var imgIn = $('#imgIn');
      if (imgIn) {
        var pv = function () {
          var src = imgIn.value.trim(), meta = $('#imgMeta');
          ['#imgPv1', '#imgPv2'].forEach(function (k) { var im = $(k); im.style.display = src ? '' : 'none'; if (src) im.src = src; });
          if (!src) { meta.textContent = 'ไม่มีรูป — การ์ดจะแสดงเป็นแถบสีประจำกิจกรรม'; return; }
          var t = new Image();
          t.onload = function () { var w = t.naturalWidth, h = t.naturalHeight, r = w / h; meta.innerHTML = 'ขนาด ' + w + '×' + h + ' px · ' + (w < 900 ? '<span style="color:var(--warn)">ภาพเล็ก อาจไม่คมบนจอใหญ่ (แนะนำกว้าง 1,200–1,600 px)</span>' : '<span style="color:var(--ok)">ความละเอียดเหมาะสม</span>') + (r < 1.2 ? ' · <span style="color:var(--warn)">ภาพแนวตั้ง จะเหลือขอบซ้าย-ขวา (แนะนำภาพแนวนอน ~2:1)</span>' : ''); };
          t.onerror = function () { meta.innerHTML = '<span style="color:var(--danger)">' + ic('alert') + ' โหลดรูปไม่ได้ — ตรวจชื่อไฟล์ (ตัวพิมพ์เล็ก/ใหญ่ต้องตรง) หรือรอ GitHub อัปเดต 1–2 นาที</span>'; };
          t.src = src;
        };
        imgIn.oninput = debounce(pv, 400); pv();
      }
      var ao = $('#addOpt'); if (ao) ao.onclick = function () { readForm(); ED.config.options.push({ key: 'X' + ED.config.options.length, label: 'แบบใหม่', sizes: [{ code: 'S', chest: '', length: '' }] }); draw(); };
      $('#evSave').onclick = function () {
        readForm();
        if (!ED.title.trim()) return toast('กรุณาระบุชื่อกิจกรรม', 'warn');
        if (!ED.closeAt) return toast('กรุณาระบุวันปิดรับ', 'warn');
        busy(this, api('saveEvent', { event: ED })).then(function (r) {
          AD.events = null; toast('บันทึกกิจกรรม "' + r.title + '" แล้ว', 'ok');
          refreshBoot().catch(function () { }); go('#/admin/events');
        }).catch(errToast);
      };
    };
    draw();
  }).catch(errToast);
}
function choiceEditor(c) {
  return '<div class="card"><div class="hd"><h3>รายการ / ไซซ์</h3><button class="btn sm" id="addOpt">' + ic('plus') + 'เพิ่มแบบ</button></div><div class="bd">' +
    '<div class="grid2"><div class="field"><label class="f">ชื่อสิ่งของ</label><input class="input" data-c="itemName" value="' + esc(c.itemName || '') + '"></div><div class="field"><label class="f">ไฟล์รูป (ในหน้าเว็บ) หรือ URL</label><input class="input" data-c="image" id="imgIn" value="' + esc(c.image || '') + '"><div class="hint">อัปโหลดรูปขึ้น GitHub (repo hr-connect) แล้วพิมพ์ชื่อไฟล์ที่นี่</div></div></div>' +
    '<div class="imgprev"><div class="box"><small>ตัวอย่าง: การ์ดหน้าแรก (ภาพแสดงเต็ม ไม่ตัดขอบ)</small><div class="frame" style="height:120px"><img id="imgPv1" alt=""></div></div>' +
    '<div class="box"><small>ตัวอย่าง: หน้ากิจกรรม (กดขยายดูเต็มได้)</small><div class="frame" style="height:120px"><img id="imgPv2" alt=""></div></div>' +
    '<div class="meta muted" id="imgMeta" style="grid-column:1/-1"></div></div>' +
    (c.options || []).map(function (o, oi) {
      return '<div data-oi="' + oi + '" style="border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:12px"><div class="row" style="margin-bottom:8px"><input class="input" data-ol value="' + esc(o.label) + '" style="flex:1;min-width:140px" placeholder="ชื่อแบบ"><input class="input" data-ok value="' + esc(o.key) + '" style="width:80px" placeholder="รหัส" title="รหัสแบบ (ห้ามเปลี่ยนเมื่อมีคนจองแล้ว)"><button class="iconbtn" data-delopt="' + oi + '" title="ลบแบบ">' + ic('trash') + '</button></div>' +
        '<div class="tablewrap"><table class="t sizeeditor"><thead><tr><th>ไซซ์</th><th>อก (นิ้ว)</th><th>ยาว (นิ้ว)</th><th>หมายเหตุ</th><th title="ซ่อนจากผู้ใช้">ซ่อน</th><th></th></tr></thead><tbody>' +
        o.sizes.map(function (s, si) {
          return '<tr data-si="' + si + '"><td><input class="input" data-s="code" value="' + esc(s.code) + '" style="width:70px"></td><td><input class="input" data-s="chest" type="number" step="0.5" value="' + esc(s.chest) + '" style="width:76px"></td><td><input class="input" data-s="length" type="number" step="0.5" value="' + esc(s.length) + '" style="width:76px"></td>' +
            '<td><input class="input" data-s="note" value="' + esc(s.note || '') + '" placeholder="-"></td><td><input type="checkbox" data-s="hidden" ' + (s.hidden ? 'checked' : '') + '></td><td style="white-space:nowrap"><button class="iconbtn" data-mv="' + oi + ':' + si + ':-1">' + ic('up') + '</button><button class="iconbtn" data-mv="' + oi + ':' + si + ':1">' + ic('down') + '</button><button class="iconbtn" data-delsize="' + oi + ':' + si + '">' + ic('trash') + '</button></td></tr>';
        }).join('') + '</tbody></table></div><button class="btn sm ghost" data-addsize="' + oi + '" style="margin-top:6px">' + ic('plus') + 'เพิ่มไซซ์</button></div>';
    }).join('') +
    '<div class="field"><label class="f">หมายเหตุตารางไซซ์</label><input class="input" data-c="sizeNote" value="' + esc(c.sizeNote || '') + '"></div>' +
    '<div class="grid3"><div class="field"><label class="f">จำนวนต่อคน</label><input class="input" type="number" min="1" data-c="qtyPerPerson" value="' + esc(c.qtyPerPerson || 1) + '"></div><div class="field"><label class="f">สั่งเพิ่มได้สูงสุด</label><input class="input" type="number" min="0" data-c="extraMax" value="' + esc(c.extraMax || 0) + '"></div><div class="field"><label class="f">ราคาต่อตัวที่สั่งเพิ่ม (บาท)</label><input class="input" type="number" min="0" data-c="extraPrice" value="' + esc(c.extraPrice || 0) + '"></div></div>' +
    '<div class="row" style="gap:20px;margin-bottom:14px"><label class="switch"><input type="checkbox" data-c="allowExtra" ' + (c.allowExtra ? 'checked' : '') + '><span class="tr"></span>อนุญาตสั่งเพิ่ม (จ่ายเงินเพิ่ม)</label><label class="switch"><input type="checkbox" data-c="allowDecline" ' + (c.allowDecline !== false ? 'checked' : '') + '><span class="tr"></span>มีตัวเลือก "ไม่ประสงค์"</label><label class="switch"><input type="checkbox" data-c="requireReason" ' + (c.requireReason ? 'checked' : '') + '><span class="tr"></span>บังคับเหตุผล</label></div>' +
    '<div class="field"><label class="f">ข้อความปุ่ม "ไม่ประสงค์"</label><input class="input" data-c="declineLabel" value="' + esc(c.declineLabel || '') + '"></div>' +
    '<div class="grid2"><div class="field"><label class="f">หน่วยงาน (สำหรับแบบฟอร์มจัดซื้อ)</label><input class="input" data-c="exportUnit" value="' + esc(c.exportUnit || '') + '"></div><div class="field"><label class="f">ผู้ประสานงาน</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="coName" value="' + esc((c.coordinator || {}).name || '') + '" placeholder="ชื่อ-สกุล"><input class="input" id="coPhone" value="' + esc((c.coordinator || {}).phone || '') + '" placeholder="เบอร์โทร" style="max-width:150px"></div></div></div></div></div>';
}

/* =================================================================== รายชื่อบุคลากร */
var RS = null;
ROUTES['admin/roster'] = function () {
  if (!needAdmin()) return;
  document.title = 'รายชื่อบุคลากร · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  RS = RS || { q: '', status: 'ACTIVE', flag: '', div: '', page: 1, size: 50 };
  $('#page').innerHTML = skel(3);
  var draw = function (d) { if (S.route !== 'admin/roster') return; RS.d = d; RS.rows = d.rows.map(function (r) { var o = {}; d.cols.forEach(function (c, i) { o[c] = r[i]; }); return o; }); drawRoster(); };
  api('listRoster', {}, { fresh: true, onCache: draw }).then(draw).catch(errToast);
};
function rName(p) { return ((p.title || '') + (p.firstName || '') + ' ' + (p.lastName || '')).trim(); }
function drawRoster() {
  var all = RS.rows, c = { total: all.length, ACTIVE: 0, INACTIVE: 0, NEW_API: 0, NOT_IN_API: 0, MANUAL: 0, noPhone: 0 };
  all.forEach(function (p) { c[p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE']++; if (p.flag) c[p.flag] = (c[p.flag] || 0) + 1; if (p.status !== 'INACTIVE' && !p.phone) c.noPhone++; });
  var h = pageHead('รายชื่อบุคลากร', 'ฐานรายชื่อสำหรับติดตาม · นำเข้าจาก HRMi · ซิงก์เบอร์/อีเมล/เพศ จาก SmartAPI ทุกคืน',
    '<button class="btn" id="rsTpl">' + ic('download') + 'เทมเพลต</button><button class="btn" id="rsExp">' + ic('download') + 'ส่งออก</button><button class="btn" id="rsSync" data-busy="กำลังซิงก์กับ API…">' + ic('refresh') + 'ซิงก์ API</button><button class="btn" id="rsAdd">' + ic('plus') + 'เพิ่มบุคลากร</button><button class="btn primary" id="rsImp">' + ic('upload') + 'นำเข้า Excel</button>', 'จัดการ');
  h += '<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">' +
    [['ใช้งาน', c.ACTIVE, 'ok', 'ACTIVE', ''], ['ไม่ใช้งาน', c.INACTIVE, '', 'INACTIVE', ''], ['พบใหม่จาก API', c.NEW_API, 'info', '', 'NEW_API'], ['ไม่พบใน API', c.NOT_IN_API, 'warn', '', 'NOT_IN_API'], ['เพิ่มเอง', c.MANUAL, '', '', 'MANUAL'], ['ไม่มีเบอร์โทร', c.noPhone, '', 'ACTIVE', 'NOPHONE']].map(function (k) {
      return '<button class="kpi" data-kf="' + k[3] + '|' + k[4] + '" style="text-align:left;cursor:pointer;' + (RS.status === k[3] && RS.flag === k[4] ? 'outline:2px solid var(--accent)' : '') + '"><small>' + k[0] + '</small><b class="num" style="font-size:26px;color:' + (k[2] ? 'var(--' + k[2] + ')' : 'inherit') + '">' + nf(k[1]) + '</b></button>';
    }).join('') + '</div>';
  h += '<div class="card"><div class="bd" style="padding-bottom:8px"><div class="filters"><input class="input search" id="rsQ" placeholder="ค้นหา รหัส / ชื่อ / ตำแหน่ง / หน่วย / เบอร์" value="' + esc(RS.q) + '">' + sel('rsDiv', 'ทุกฝ่าย', uniq(all, 'division'), RS.div) +
    '<select class="input" id="rsSt"><option value="">ทุกสถานะ</option><option value="ACTIVE" ' + (RS.status === 'ACTIVE' ? 'selected' : '') + '>ใช้งาน</option><option value="INACTIVE" ' + (RS.status === 'INACTIVE' ? 'selected' : '') + '>ไม่ใช้งาน</option></select>' +
    (RS.flag ? '<span class="chip info">' + esc(FLAG_TH[RS.flag] || 'ไม่มีเบอร์โทร') + ' <button class="iconbtn" style="width:20px;height:20px" id="rsFlagX">' + ic('x') + '</button></span>' : '') + '</div></div><div id="rsTable"></div></div>';
  $('#page').innerHTML = h;
  drawRosterTable();
  $('#rsQ').oninput = debounce(function () { RS.q = $('#rsQ').value.trim(); RS.page = 1; drawRosterTable(); }, 200);
  $('#rsDiv').onchange = function () { RS.div = this.value; RS.page = 1; drawRosterTable(); };
  $('#rsSt').onchange = function () { RS.status = this.value; RS.page = 1; drawRoster(); };
  var fx = $('#rsFlagX'); if (fx) fx.onclick = function () { RS.flag = ''; drawRoster(); };
  $$('[data-kf]').forEach(function (b) { b.onclick = function () { var p = b.dataset.kf.split('|'); RS.status = p[0]; RS.flag = p[1]; RS.page = 1; drawRoster(); }; });
  $('#rsTpl').onclick = rosterTemplate;
  $('#rsExp').onclick = function () {
    var rows = [['EmpCode', 'Title', 'FirstName', 'LastName', 'Gender', 'PositionName', 'DivisionName', 'WardName', 'HireName', 'LevelName', 'Phone', 'Email', 'สถานะ', 'ที่มา', 'ธง', 'ซิงก์ API ล่าสุด', 'เข้าระบบล่าสุด']];
    rsFiltered().forEach(function (p) { rows.push([p.empCode, p.title, p.firstName, p.lastName, p.gender, p.position, p.division, p.unit, p.empGroup, p.level, p.phone, p.email, p.status === 'INACTIVE' ? 'ไม่ใช้งาน' : 'ใช้งาน', p.source, FLAG_TH[p.flag] || '', p.apiSyncedAt, p.lastLoginAt]); });
    exportXlsx('รายชื่อบุคลากร_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รายชื่อ', rows: rows }]).catch(errToast);
  };
  $('#rsSync').onclick = function () {
    var b = this;
    confirmBox({ title: 'ซิงก์กับ SmartAPI ทั้งหมด?', icon: 'refresh', ok: 'เริ่มซิงก์', msg: 'ดึงเบอร์โทร อีเมล เพศ ของบุคลากรที่ใช้งาน ' + nf(c.ACTIVE) + ' คน (ประมาณ 1–2 นาที) · ระบบทำอัตโนมัติทุกคืน 01:00 อยู่แล้ว' }).then(function (y) {
      if (!y) return;
      busy(b, api('syncApiNow', {})).then(function (r) { toast('ตรวจ ' + nf(r.checked) + ' · พบ ' + nf(r.found) + ' · ไม่พบ ' + nf(r.missing), 'ok', 'ซิงก์เสร็จ'); ROUTES['admin/roster'](); }).catch(errToast);
    });
  };
  $('#rsAdd').onclick = function () { personModal(null); };
  $('#rsImp').onclick = importRosterFlow;
}
function rsFiltered() {
  var q = RS.q.toLowerCase();
  return RS.rows.filter(function (p) {
    if (RS.status && (p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') !== RS.status) return false;
    if (RS.flag === 'NOPHONE') { if (p.phone) return false; } else if (RS.flag && p.flag !== RS.flag) return false;
    if (RS.div && p.division !== RS.div) return false;
    if (q && (p.empCode + ' ' + rName(p) + ' ' + p.position + ' ' + p.unit + ' ' + p.phone).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function drawRosterTable() {
  var list = rsFiltered(), pages = Math.max(1, Math.ceil(list.length / RS.size)); if (RS.page > pages) RS.page = pages;
  var slice = list.slice((RS.page - 1) * RS.size, RS.page * RS.size);
  $('#rsTable').innerHTML = '<div class="tablewrap resp"><table class="t"><thead><tr><th>รหัส / ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย / ฝ่าย</th><th>ติดต่อ</th><th>สถานะ</th></tr></thead><tbody>' +
    (slice.length ? slice.map(function (p) {
      return '<tr class="click" data-p="' + esc(p.empCode) + '"><td><div class="nm">' + esc(rName(p)) + '</div><div class="sub num">' + esc(p.empCode) + ' · ' + (p.gender === 'M' ? 'ชาย' : p.gender === 'F' ? 'หญิง' : '-') + '</div></td><td>' + esc(p.position) + '<div class="sub">' + esc(p.empGroup) + '</div></td>' +
        '<td>' + esc(p.unit || '-') + '<div class="sub">' + esc(String(p.division).replace(/^รพ\.สมเด็จฯ - /, '')) + '</div></td><td class="num">' + esc(p.phone || '-') + '<div class="sub">' + esc(p.email) + '</div></td>' +
        '<td>' + (p.status === 'INACTIVE' ? '<span class="chip">ไม่ใช้งาน</span>' : '<span class="chip ok">ใช้งาน</span>') + (p.flag ? ' <span class="chip ' + (p.flag === 'NOT_IN_API' ? 'warn' : 'info') + '">' + esc(FLAG_TH[p.flag] || p.flag) + '</span>' : '') + '<div class="sub">' + esc(p.source) + (p.lastLoginAt ? ' · เข้าระบบแล้ว' : '') + '</div></td></tr>';
    }).join('') : '<tr><td colspan="5"><div class="empty">' + ic('users') + '<p>' + (RS.rows.length ? 'ไม่พบรายชื่อตามเงื่อนไข' : 'ยังไม่มีรายชื่อ — กด "นำเข้า Excel" เพื่อนำเข้าไฟล์จาก HRMi') + '</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + slice.map(function (p) { return '<div class="mi" data-p="' + esc(p.empCode) + '"><div class="avatar" style="width:36px;height:36px;font-size:14px">' + esc(initials(p.firstName)) + '</div><div class="x"><b>' + esc(rName(p)) + '</b><small>' + esc(p.empCode + ' · ' + p.position) + '</small><small>' + esc(p.unit || p.division) + '</small></div>' + (p.flag ? '<span class="chip info">' + esc(FLAG_TH[p.flag]) + '</span>' : '') + '</div>'; }).join('') + '</div></div>' +
    '<div class="pager"><span>' + nf(list.length) + ' คน</span><div class="row"><button class="btn sm" id="rpPrev" ' + (RS.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + RS.page + '/' + pages + '</span><button class="btn sm" id="rpNext" ' + (RS.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div>';
  $('#rpPrev').onclick = function () { RS.page--; drawRosterTable(); };
  $('#rpNext').onclick = function () { RS.page++; drawRosterTable(); };
  $$('[data-p]', $('#rsTable')).forEach(function (tr) { tr.onclick = function () { personModal(RS.rows.filter(function (p) { return p.empCode === tr.dataset.p; })[0]); }; });
}
function personModal(p) {
  var isNew = !p; p = p || { status: 'ACTIVE' };
  var f = function (k, label, extra) { return '<div class="field"><label class="f">' + label + '</label><input class="input" data-pf="' + k + '" value="' + esc(p[k] || '') + '" ' + (extra || '') + '></div>'; };
  var body = (isNew ? '<div class="row" style="align-items:flex-end;margin-bottom:6px"><div class="field" style="flex:1;margin:0"><label class="f">รหัสพนักงาน *</label><input class="input" data-pf="empCode" inputmode="numeric"></div><button class="btn" id="pfLook" data-busy="กำลังค้น…">' + ic('search') + 'ดึงข้อมูลจาก API</button></div><div class="hint small muted" style="margin-bottom:12px">สำหรับพนักงานใหม่ที่ยังไม่อยู่ในไฟล์ HRMi · ถ้า API ไม่พบ กรอกเองได้ (บุคคลนั้นจะเข้าระบบเองไม่ได้จนกว่า HR บันทึกในระบบหลัก — ให้ HR บันทึกแทน)</div>'
    : '<div class="row" style="margin-bottom:12px"><div class="avatar">' + esc(initials(p.firstName)) + '</div><div><b>' + esc(rName(p)) + '</b><div class="small muted">' + esc(p.empCode) + ' · ที่มา ' + esc(p.source) + (p.apiSyncedAt ? ' · ซิงก์ ' + esc(thShort(p.apiSyncedAt)) : '') + '</div></div></div>' +
      (p.flag ? '<div class="announce" style="margin-bottom:12px">' + ic('info') + '<div>ธง: <b>' + esc(FLAG_TH[p.flag]) + '</b> ' + (p.flag === 'NOT_IN_API' ? '— อาจพ้นสภาพแล้ว ตรวจสอบก่อนเปลี่ยนสถานะเป็น "ไม่ใช้งาน"' : '') + ' <label class="switch" style="margin-left:8px"><input type="checkbox" id="pfClear"><span class="tr"></span>ตรวจแล้ว (ลบธง)</label></div></div>' : '')) +
    '<div class="grid3">' + f('title', 'คำนำหน้า') + f('firstName', 'ชื่อ *') + f('lastName', 'นามสกุล') + '</div>' +
    '<div class="grid2">' + f('position', 'ตำแหน่ง') + f('empGroup', 'กลุ่มบุคลากร') + f('division', 'ฝ่าย (ชื่อเต็ม)', 'list="dlDiv"') + f('unit', 'หน่วย', 'list="dlUnit"') + f('phone', 'โทรศัพท์') + f('email', 'อีเมล') + '</div>' +
    '<div class="grid2"><div class="field"><label class="f">เพศ (ค่าเริ่มต้นแบบเสื้อ)</label><select class="input" data-pf="gender"><option value="">-</option><option value="M" ' + (p.gender === 'M' ? 'selected' : '') + '>ชาย</option><option value="F" ' + (p.gender === 'F' ? 'selected' : '') + '>หญิง</option></select></div>' +
    '<div class="field"><label class="f">สถานะ</label><select class="input" data-pf="status"><option value="ACTIVE">ใช้งาน (นับในเป้าหมาย)</option><option value="INACTIVE" ' + (p.status === 'INACTIVE' ? 'selected' : '') + '>ไม่ใช้งาน (ไม่นับ)</option></select></div></div>' +
    '<datalist id="dlDiv">' + uniq(RS.rows, 'division').map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist><datalist id="dlUnit">' + uniq(RS.rows, 'unit').map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>';
  var m = modal({ title: isNew ? 'เพิ่มบุคลากร' : 'แก้ไขข้อมูลบุคลากร', size: 'lg', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="pfSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  var lk = $('#pfLook');
  if (lk) lk.onclick = function () {
    var code = $('[data-pf=empCode]').value.trim(); if (!code) return toast('กรอกรหัสพนักงานก่อน', 'warn');
    busy(lk, api('lookupPerson', { empCode: code })).then(function (r) {
      if (r.inRoster) return toast('รหัสนี้มีในรายชื่อแล้ว: ' + rName(r.inRoster), 'warn');
      if (!r.api) return toast('ไม่พบใน API — กรอกข้อมูลเองได้', 'warn');
      Object.keys(r.api).forEach(function (k) { var i = $('[data-pf=' + k + ']', m.el); if (i && r.api[k]) i.value = r.api[k]; });
      toast('ดึงข้อมูลจาก API แล้ว', 'ok');
    }).catch(errToast);
  };
  $('#pfSave').onclick = function () {
    var o = { empCode: isNew ? $('[data-pf=empCode]').value.trim() : p.empCode };
    $$('[data-pf]', m.el).forEach(function (i) { if (i.dataset.pf !== 'empCode') o[i.dataset.pf] = i.value.trim(); });
    if ($('#pfClear') && $('#pfClear').checked) o.flag = '';
    busy(this, api('savePerson', { person: o, isNew: isNew })).then(function () { m.close(); toast((isNew ? 'เพิ่ม ' : 'บันทึก ') + (o.firstName || o.empCode) + ' แล้ว', 'ok'); ROUTES['admin/roster'](); }).catch(errToast);
  };
}
var TITLES = ['นางสาว', 'นาง', 'นาย', 'ว่าที่ร้อยตรีหญิง', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.', 'ดร.', 'นพ.', 'พญ.', 'ทพ.', 'ทพญ.', 'ภก.', 'ภญ.', 'น.ส.'];
function pickCol(row, names) { for (var i = 0; i < names.length; i++) { if (row.hasOwnProperty(names[i]) && String(row[names[i]]).trim() !== '') return String(row[names[i]]).trim(); } return ''; }
function mapImportRow(r) {
  var code = pickCol(r, ['EmpCode', 'รหัสพนักงาน', 'รหัส', 'empCode']).replace(/\D/g, '');
  var title = pickCol(r, ['Title', 'คำนำหน้า']), fn = pickCol(r, ['FirstName', 'ชื่อ']), ln = pickCol(r, ['LastName', 'นามสกุล']);
  var full = pickCol(r, ['FullName', 'ชื่อ-สกุล', 'ชื่อ-นามสกุล', 'ชื่อสกุล']);
  if (full && !fn) {
    var s = full.replace(/\s+/g, ' ').trim();
    for (var i = 0; i < TITLES.length; i++) { if (s.indexOf(TITLES[i]) === 0) { title = TITLES[i]; s = s.slice(TITLES[i].length).trim(); break; } }
    var parts = s.split(' '); fn = parts.shift() || ''; ln = parts.join(' ');
  }
  var st = pickCol(r, ['WorkingStatus', 'สถานะ', 'status']);
  var g = pickCol(r, ['Gender', 'เพศ']);
  if (!g) g = /^(นาย|ว่าที่ร้อยตรี$|นพ\.|ทพ\.|ภก\.)/.test(title) ? 'M' : /^(นาง|น\.ส\.|ว่าที่ร้อยตรีหญิง|พญ\.|ทพญ\.|ภญ\.)/.test(title) ? 'F' : '';
  return { empCode: code, title: title, firstName: fn, lastName: ln, gender: g,
    position: pickCol(r, ['PositionName', 'ตำแหน่ง']), division: pickCol(r, ['DivisionName', 'SourceDivisionName', 'ฝ่าย']),
    unit: pickCol(r, ['WardName', 'emOrgUnitName', 'OrgUnitName', 'หน่วย', 'หน่วยงาน']), empGroup: pickCol(r, ['HireName', 'GroupName', 'Benefits', 'กลุ่ม', 'ประเภทบุคลากร']),
    level: pickCol(r, ['LevelName', 'ระดับ']), phone: pickCol(r, ['Phone', 'เบอร์โทร', 'โทรศัพท์']), email: pickCol(r, ['Email', 'อีเมล']),
    status: /ลาออก|พ้น|เกษียณ|เสียชีวิต|เลิกจ้าง|ไม่ใช้งาน|INACTIVE|ออก/.test(st) ? 'INACTIVE' : 'ACTIVE' };
}
function importRosterFlow() {
  pickFile('.xls,.xlsx,.csv').then(function (file) {
    if (!file) return;
    toast('กำลังอ่านไฟล์ ' + file.name + '…', 'info');
    return readSheetFile(file).then(function (raw) {
      // ไม่อ่าน/ไม่ส่งคอลัมน์ IdentityCard, PassportNo, BookNo ฯลฯ — เลือกเฉพาะคอลัมน์ที่ใช้
      var rows = raw.map(mapImportRow), valid = rows.filter(function (r) { return /^\d{4,10}$/.test(r.empCode); });
      var seen = {}, dup = 0; valid = valid.filter(function (r) { if (seen[r.empCode]) { dup++; return false; } seen[r.empCode] = 1; return true; });
      var ina = valid.filter(function (r) { return r.status === 'INACTIVE'; }).length;
      var existing = {}; (RS.rows || []).forEach(function (p) { existing[p.empCode] = 1; });
      var nNew = valid.filter(function (r) { return !existing[r.empCode]; }).length;
      var divs = uniq(valid, 'division');
      var body = '<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">' + [['ในไฟล์', raw.length], ['นำเข้าได้', valid.length], ['ใหม่', nNew], ['ปรับปรุง', valid.length - nNew]].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><b class="num" style="font-size:24px">' + nf(k[1]) + '</b></div>'; }).join('') + '</div>' +
        (raw.length - valid.length - dup > 0 ? '<div class="announce">' + ic('alert') + '<div>ข้าม ' + (raw.length - valid.length - dup) + ' แถวที่ไม่มีรหัสพนักงาน</div></div>' : '') + (dup ? '<div class="announce">' + ic('alert') + '<div>รหัสซ้ำในไฟล์ ' + dup + ' แถว (ใช้แถวแรก)</div></div>' : '') +
        '<div class="small muted" style="margin-bottom:6px">' + divs.length + ' ฝ่าย · สถานะไม่ใช้งาน ' + ina + ' คน · ตัวอย่าง 5 แถวแรก</div><div class="tablewrap"><table class="t"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย</th><th>ฝ่าย</th><th>กลุ่ม</th></tr></thead><tbody>' +
        valid.slice(0, 5).map(function (r) { return '<tr><td class="num">' + esc(r.empCode) + '</td><td>' + esc(r.title + r.firstName + ' ' + r.lastName) + '</td><td>' + esc(r.position) + '</td><td>' + esc(r.unit) + '</td><td class="small">' + esc(r.division) + '</td><td class="small">' + esc(r.empGroup) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="stack" style="margin-top:14px"><label class="switch"><input type="checkbox" id="imDeact"><span class="tr"></span>ตั้ง "ไม่ใช้งาน" ให้คนที่มาจาก HRMi เดิมแต่ไม่อยู่ในไฟล์นี้ (ใช้เมื่อไฟล์เป็นรายชื่อครบทั้ง รพ.)</label>' +
        '<label class="switch"><input type="checkbox" id="imSync" checked><span class="tr"></span>หลังนำเข้า ดึงเบอร์โทร/อีเมล/เพศ จาก SmartAPI ทันที (1–2 นาที)</label></div>' +
        '<div class="small muted" style="margin-top:10px">' + ic('shield') + ' ระบบอ่านเฉพาะคอลัมน์ที่ใช้งาน — <b>ไม่อ่านและไม่ส่งเลขบัตรประชาชน</b> หรือข้อมูลอื่นในไฟล์</div>';
      var m = modal({ title: 'นำเข้ารายชื่อ · ' + esc(file.name), size: 'lg', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="imGo" data-busy="กำลังนำเข้า…" ' + (valid.length ? '' : 'disabled') + '>' + ic('upload') + 'นำเข้า ' + nf(valid.length) + ' คน</button>' });
      $('#imGo').onclick = function () {
        var deact = $('#imDeact').checked, sync = $('#imSync').checked, b = this;
        var run = function () {
          return busy(b, api('importRoster', { rows: valid, deactivateMissing: deact, fileName: file.name })).then(function (r) {
            toast('เพิ่ม ' + nf(r.added) + ' · ปรับปรุง ' + nf(r.updated) + (r.deactivated ? ' · ปิดใช้งาน ' + nf(r.deactivated) : ''), 'ok', 'นำเข้าเรียบร้อย');
            m.close();
            if (sync) { toast('กำลังดึงเบอร์โทร/อีเมลจาก SmartAPI… (ทำงานต่อได้)', 'info'); api('syncApiNow', {}).then(function (s) { toast('ซิงก์ ' + nf(s.found) + ' คน · ไม่พบใน API ' + nf(s.missing), 'ok', 'ซิงก์ API เสร็จ'); if (S.route === 'admin/roster') ROUTES['admin/roster'](); }).catch(errToast); }
            ROUTES['admin/roster']();
          });
        };
        (deact ? confirmBox({ title: 'ยืนยันปิดใช้งานคนที่ไม่อยู่ในไฟล์?', danger: true, ok: 'นำเข้าและปิดใช้งาน', msg: 'คนที่เคยนำเข้าจาก HRMi แต่ไม่อยู่ในไฟล์นี้จะไม่ถูกนับในการติดตาม (ข้อมูลการจองยังอยู่)' }) : Promise.resolve(true)).then(function (y) { if (y) run().catch(errToast); });
      };
    });
  }).catch(errToast);
}
function rosterTemplate() {
  exportXlsx('เทมเพลตนำเข้ารายชื่อ_SOMDEJ_HR_Connect.xlsx', [
    { name: 'รายชื่อ', rows: [['EmpCode', 'FullName', 'PositionName', 'DivisionName', 'WardName', 'HireName', 'LevelName', 'WorkingStatus', 'Gender', 'Phone', 'Email'],
      ['5600001', 'นาย ตัวอย่าง ข้อมูลสมมติ', 'เจ้าหน้าที่บริหารงานทั่วไป', 'รพ.สมเด็จฯ - ฝ่ายทรัพยากรบุคคล', 'งานบริหารงานบุคคล', 'เจ้าหน้าที่สภากาชาดไทย ประเภท ก', 'เจ้าหน้าที่ ระดับ 4', 'ทำงาน', 'M', '', '']] },
    { name: 'คำอธิบาย', rows: [['คอลัมน์', 'ความหมาย', 'จำเป็น'], ['EmpCode', 'รหัสพนักงาน (ตัวเลข)', 'ใช่'], ['FullName', 'คำนำหน้า ชื่อ นามสกุล (หรือใช้ Title / FirstName / LastName แยกคอลัมน์)', 'ใช่'],
      ['PositionName', 'ตำแหน่ง', ''], ['DivisionName', 'ฝ่าย (ชื่อเต็มตาม HRMi)', 'แนะนำ'], ['WardName', 'หน่วย/งาน', 'แนะนำ'], ['HireName', 'กลุ่มบุคลากร', ''], ['LevelName', 'ระดับ', ''],
      ['WorkingStatus', 'ทำงาน / ลาออก / พ้นสภาพ (ว่าง = ทำงาน)', ''], ['Gender', 'M / F (ว่าง = เดาจากคำนำหน้า และอัปเดตจาก API)', ''], ['Phone, Email', 'ว่างได้ — ระบบดึงจาก SmartAPI', ''],
      [], ['หมายเหตุ', 'ไฟล์ export จาก HRMi (emEmployee) นำเข้าได้ทันทีโดยไม่ต้องแก้ไข · ระบบไม่อ่านคอลัมน์ IdentityCard', '']] }
  ]).catch(errToast);
}

/* =================================================================== หัวหน้าฝ่าย/หน่วย */
ROUTES['admin/heads'] = function () {
  if (!needAdmin()) return;
  document.title = 'หัวหน้าฝ่าย/หน่วย · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  $('#page').innerHTML = skel(2);
  api('listHeads', {}).then(drawHeads).catch(errToast);
};
function drawHeads(d) {
  var covered = {}; d.heads.forEach(function (h) { if (h.active && h.level === 'DIVISION') covered[h.scope] = 1; });
  var missing = d.divisions.filter(function (x) { return !covered[x.name]; });
  var h = pageHead('หัวหน้าฝ่าย/หน่วย', 'ผู้รับอีเมลสรุปและผู้ที่ดูรายงานเฉพาะสังกัดของตน (ดูอย่างเดียว)',
    '<button class="btn" id="hdTpl">' + ic('download') + 'ส่งออก / เทมเพลต</button><button class="btn" id="hdImp">' + ic('upload') + 'นำเข้า</button><button class="btn primary" id="hdAdd">' + ic('plus') + 'เพิ่มหัวหน้า</button>', 'จัดการ');
  if (missing.length) h += '<div class="announce">' + ic('alert') + '<div><b>' + missing.length + ' ฝ่ายยังไม่มีหัวหน้า</b>: ' + missing.slice(0, 12).map(function (x) { return esc(x.short); }).join(', ') + (missing.length > 12 ? ' …' : '') + '</div></div>';
  h += '<div class="card"><div class="tablewrap resp"><table class="t"><thead><tr><th>ชื่อ</th><th>ระดับ</th><th>ฝ่าย/หน่วยที่ดูแล</th><th class="r">บุคลากร</th><th>อีเมล</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
    (d.heads.length ? d.heads.map(function (x) {
      return '<tr><td><div class="nm">' + esc(x.name || '-') + '</div><div class="sub">' + esc(x.empCode || 'ไม่มีรหัส (รับอีเมลอย่างเดียว)') + (x.position ? ' · ' + esc(x.position) : '') + '</div></td><td><span class="chip ' + (x.level === 'UNIT' ? 'info' : 'acc') + '">' + (x.level === 'UNIT' ? 'หน่วย' : 'ฝ่าย') + '</span></td><td>' + esc(x.scopeShort) + '</td><td class="r num">' + nf(x.scopeCount) + '</td>' +
        '<td>' + (x.email ? esc(x.email) : '<span class="chip warn">ไม่มีอีเมล</span>') + '</td><td>' + (x.active ? '<span class="chip ok">ใช้งาน</span>' : '<span class="chip">ปิด</span>') + '</td><td class="r"><button class="iconbtn" data-he="' + esc(x.id) + '">' + ic('edit') + '</button><button class="iconbtn" data-hd="' + esc(x.id) + '">' + ic('trash') + '</button></td></tr>';
    }).join('') : '<tr><td colspan="7"><div class="empty">' + ic('building') + '<p>ยังไม่มีหัวหน้า · เพิ่มทีละคน หรือส่งออกเทมเพลตเพื่อกรอกแล้วนำเข้า</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + d.heads.map(function (x) { return '<div class="mi" data-he="' + esc(x.id) + '"><div class="x"><b>' + esc(x.name) + '</b><small>' + (x.level === 'UNIT' ? 'หน่วย ' : '') + esc(x.scopeShort) + '</small><small>' + esc(x.email || 'ไม่มีอีเมล') + '</small></div></div>'; }).join('') + '</div></div></div>';
  $('#page').innerHTML = h;
  $('#hdAdd').onclick = function () { headModal(null, d); };
  $$('[data-he]').forEach(function (b) { b.onclick = function () { headModal(d.heads.filter(function (x) { return x.id === b.dataset.he; })[0], d); }; });
  $$('[data-hd]').forEach(function (b) {
    b.onclick = function () { var x = d.heads.filter(function (y) { return y.id === b.dataset.hd; })[0]; confirmBox({ title: 'ลบ ' + (x.name || x.email) + '?', msg: 'ออกจากหัวหน้า ' + esc(x.scopeShort), danger: true, ok: 'ลบ' }).then(function (y) { if (y) api('deleteHead', { id: x.id }).then(function (r) { toast('ลบแล้ว', 'ok'); drawHeads(r); }).catch(errToast); }); };
  });
  $('#hdTpl').onclick = function () {
    var rows = [['รหัสพนักงาน', 'ชื่อ-สกุล', 'อีเมล', 'ระดับ (ฝ่าย/หน่วย)', 'ฝ่ายหรือหน่วยที่ดูแล', 'สถานะ (ใช้งาน/ปิด)']];
    d.heads.forEach(function (x) { rows.push([x.empCode, x.name, x.email, x.level === 'UNIT' ? 'หน่วย' : 'ฝ่าย', x.scopeShort, x.active ? 'ใช้งาน' : 'ปิด']); });
    missing.forEach(function (x) { rows.push(['', '', '', 'ฝ่าย', x.short, 'ใช้งาน']); });
    exportXlsx('หัวหน้าฝ่าย_หน่วย_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'หัวหน้า', rows: rows }, { name: 'รายชื่อฝ่าย', rows: [['ฝ่าย', 'จำนวนบุคลากร']].concat(d.divisions.map(function (x) { return [x.short, x.count]; })) }, { name: 'รายชื่อหน่วย', rows: [['หน่วย', 'จำนวนบุคลากร']].concat(d.units.map(function (x) { return [x.name, x.count]; })) }]).catch(errToast);
  };
  $('#hdImp').onclick = function () {
    pickFile('.xlsx,.xls,.csv').then(function (file) {
      if (!file) return;
      return readSheetFile(file).then(function (raw) {
        var rows = raw.map(function (r) { return { empCode: pickCol(r, ['รหัสพนักงาน', 'EmpCode']), name: pickCol(r, ['ชื่อ-สกุล', 'Name']), email: pickCol(r, ['อีเมล', 'Email']), level: /หน่วย|UNIT/i.test(pickCol(r, ['ระดับ (ฝ่าย/หน่วย)', 'ระดับ', 'Level'])) ? 'UNIT' : 'DIVISION', scope: pickCol(r, ['ฝ่ายหรือหน่วยที่ดูแล', 'Scope']), active: !/ปิด|false|0/i.test(pickCol(r, ['สถานะ (ใช้งาน/ปิด)', 'สถานะ', 'Active'])) }; })
          .filter(function (r) { return r.scope && (r.empCode || r.email); });
        if (!rows.length) return toast('ไม่พบแถวที่มีทั้ง "ฝ่ายหรือหน่วยที่ดูแล" และ "รหัสพนักงาน/อีเมล"', 'warn');
        var m = modal({ title: 'นำเข้าหัวหน้า ' + rows.length + ' รายการ', body: '<p class="muted">จากไฟล์ ' + esc(file.name) + '</p><label class="switch"><input type="checkbox" id="hdRep"><span class="tr"></span>แทนที่รายการเดิมทั้งหมด</label>',
          foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="hdGo" data-busy="กำลังนำเข้า…">นำเข้า</button>' });
        $('#hdGo').onclick = function () { busy(this, api('importHeads', { rows: rows, replace: $('#hdRep').checked, fileName: file.name })).then(function (r) { m.close(); toast('นำเข้าหัวหน้า ' + rows.length + ' รายการ', 'ok'); drawHeads(r); }).catch(errToast); };
      });
    }).catch(errToast);
  };
}
function headModal(x, d) {
  x = x || { level: 'DIVISION', active: true };
  var body = '<div class="grid2"><div class="field"><label class="f">รหัสพนักงาน</label><input class="input" id="hmCode" value="' + esc(x.empCode || '') + '" inputmode="numeric"><div class="hint">มีรหัส = เข้าระบบดูรายงานของสังกัดได้</div></div><div class="field"><label class="f">ชื่อ-สกุล</label><input class="input" id="hmName" value="' + esc(x.name || '') + '" placeholder="ว่าง = ดึงจากรายชื่อ"></div></div>' +
    '<div class="field"><label class="f">อีเมล (รับสรุป)</label><input class="input" id="hmEmail" type="email" value="' + esc(x.email || '') + '" placeholder="name@redcross.or.th"></div>' +
    '<div class="grid2"><div class="field"><label class="f">ระดับ</label><select class="input" id="hmLevel"><option value="DIVISION">ฝ่าย</option><option value="UNIT" ' + (x.level === 'UNIT' ? 'selected' : '') + '>หน่วย</option></select></div>' +
    '<div class="field"><label class="f">ฝ่าย/หน่วยที่ดูแล</label><input class="input" id="hmScope" list="dlScope" value="' + esc(x.scope || '') + '"></div></div>' +
    '<label class="switch"><input type="checkbox" id="hmAct" ' + (x.active ? 'checked' : '') + '><span class="tr"></span>ใช้งาน</label>' +
    '<datalist id="dlScope"></datalist>';
  var m = modal({ title: x.id ? 'แก้ไขหัวหน้า' : 'เพิ่มหัวหน้า', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="hmSave" data-busy="กำลังบันทึก…">บันทึก</button>' });
  var fill = function () { var lv = $('#hmLevel').value; $('#dlScope').innerHTML = (lv === 'UNIT' ? d.units.map(function (u) { return u.name; }) : d.divisions.map(function (v) { return v.name; })).map(function (v) { return '<option value="' + esc(v) + '">'; }).join(''); };
  fill(); $('#hmLevel').onchange = fill;
  $('#hmSave').onclick = function () {
    busy(this, api('saveHead', { head: { id: x.id, empCode: $('#hmCode').value, name: $('#hmName').value, email: $('#hmEmail').value, level: $('#hmLevel').value, scope: $('#hmScope').value, active: $('#hmAct').checked } }))
      .then(function (r) { m.close(); toast('บันทึกหัวหน้าแล้ว', 'ok'); drawHeads(r); }).catch(errToast);
  };
}

/* =================================================================== ตั้งค่า */
ROUTES['admin/settings'] = function (params) {
  if (!needAdmin()) return;
  document.title = 'ตั้งค่า · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  var tab = params[0] || 'general';
  var tabs = [['general', 'ทั่วไป', 'settings'], ['admins', 'ผู้ดูแลระบบ', 'shield'], ['api', 'การเชื่อมต่อ', 'link'], ['audit', 'ประวัติการใช้งาน', 'history']];
  $('#page').innerHTML = pageHead('ตั้งค่าระบบ', 'SOMDEJ HR Connect v' + HRC_VERSION + ' · ' + HRC_BUILD, '', 'จัดการ') +
    '<div class="tabs">' + tabs.map(function (t) { return '<a href="#/admin/settings/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + ic(t[2]) + t[1] + '</a>'; }).join('') + '</div><div id="stBody">' + skel(2) + '</div>';
  if (tab === 'admins') return settingsAdmins();
  if (tab === 'audit') return settingsAudit();
  api('getSettings', {}).then(function (d) { tab === 'api' ? settingsApi(d) : settingsGeneral(d); }).catch(errToast);
};
function sf(k, label, v, opt) { opt = opt || {}; return '<div class="field"><label class="f">' + label + '</label>' + (opt.area ? '<textarea class="input" data-st="' + k + '">' + esc(v) + '</textarea>' : '<input class="input" data-st="' + k + '" value="' + esc(v) + '">') + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>'; }
function saveSettingsBtn(scope) {
  $('#stSave').onclick = function () {
    var o = {}; $$('[data-st]', scope).forEach(function (i) { o[i.dataset.st] = i.type === 'checkbox' ? (i.checked ? 'TRUE' : 'FALSE') : i.value; });
    busy(this, api('saveSettings', { settings: o })).then(function () { toast('บันทึกการตั้งค่าแล้ว', 'ok'); refreshBoot().then(shell).catch(function () { }); }).catch(errToast);
  };
}
function settingsGeneral(d) {
  var s = d.settings;
  $('#stBody').innerHTML = '<div class="dgrid"><div class="card"><div class="hd"><h3>องค์กรและการติดต่อ</h3><button class="btn primary sm" id="stSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button></div><div class="bd">' +
    sf('orgName', 'ชื่อโรงพยาบาล', s.orgName) + '<div class="grid2">' + sf('deptName', 'หน่วยงานผู้ดูแลระบบ', s.deptName) + sf('contactPhone', 'เบอร์ติดต่อ (แสดงในระบบ)', s.contactPhone) + '</div>' +
    sf('signature', 'ลายเซ็นท้ายอีเมล', s.signature, { area: true }) + '<div class="grid2">' + sf('mailSenderName', 'ชื่อผู้ส่งอีเมล', s.mailSenderName) + sf('mailReplyTo', 'Reply-To (ถ้ามี)', s.mailReplyTo) + '</div>' +
    sf('webUrl', 'ลิงก์หน้าเว็บ (ใช้ในอีเมล)', s.webUrl, { hint: 'เช่น https://hr-somdej.github.io/hr-connect/' }) + sf('divisionPrefix', 'คำนำหน้าชื่อฝ่ายที่ตัดตอนแสดงผล', s.divisionPrefix) + '</div></div>' +
    '<div class="stack"><div class="card"><div class="hd"><h3>ประกาศ / สถานะระบบ</h3></div><div class="bd">' + sf('announcement', 'ข้อความประกาศ (แสดงบนทุกหน้าและหน้าเข้าสู่ระบบ)', s.announcement, { area: true, hint: 'ว่าง = ไม่แสดง' }) +
    '<label class="switch"><input type="checkbox" data-st="maintenance" ' + (s.maintenance === 'TRUE' ? 'checked' : '') + '><span class="tr"></span>ปิดปรับปรุง (เฉพาะผู้ดูแลใช้งานได้)</label></div></div>' +
    '<div class="card pad"><h3 style="font-size:16px">ลิงก์สำหรับประชาสัมพันธ์</h3><p class="small muted">แชร์ในกลุ่มไลน์ หรือพิมพ์ QR ติดประกาศ</p><div class="row"><input class="input" readonly value="' + esc(s.webUrl) + '" style="flex:1"><button class="btn" id="cpUrl">' + ic('copy') + '</button></div>' +
    '<div style="margin-top:12px;text-align:center"><img alt="QR" style="width:180px;height:180px;border-radius:12px;border:1px solid var(--line)" src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=' + encodeURIComponent(s.webUrl) + '"><div class="small muted">คลิกขวา › บันทึกรูปภาพ</div></div></div>' +
    '<div class="card pad small muted">โควตาอีเมลคงเหลือวันนี้: <b>' + (d.mailQuota == null ? '-' : nf(d.mailQuota)) + '</b> ฉบับ · หลังบ้าน build <b>' + esc(d.build) + '</b>' + (d.build !== HRC_BUILD ? ' <span class="chip warn">ไม่ตรงกับหน้าเว็บ ' + HRC_BUILD + ' — Deploy New version</span>' : ' <span class="chip ok">ตรงกับหน้าเว็บ</span>') + '</div></div></div>';
  saveSettingsBtn($('#stBody'));
  $('#cpUrl').onclick = function () { copyText(s.webUrl, 'ลิงก์'); };
}
function settingsApi(d) {
  var s = d.settings;
  $('#stBody').innerHTML = '<div class="dgrid"><div class="card"><div class="hd"><h3>SmartAPI (HR)</h3><button class="btn primary sm" id="stSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button></div><div class="bd">' +
    '<div class="announce" style="background:' + (d.apiConfigured ? 'var(--ok-soft);border-color:#bfe3cf;color:var(--ok)' : 'var(--danger-soft);border-color:#f3c2c4;color:var(--danger)') + '">' + ic(d.apiConfigured ? 'check' : 'alert') + '<div>' + (d.apiConfigured ? 'ตั้งค่าบัญชี SMARTAPI_USER / SMARTAPI_PASS ใน Script Properties แล้ว' : 'ยังไม่ได้ตั้งค่า SMARTAPI_USER / SMARTAPI_PASS ใน Script Properties') + '</div></div>' +
    sf('apiBase', 'URL หลัก', s.apiBase) + sf('apiEmpPath', 'Path ข้อมูลพนักงาน + ตรวจ Cid', s.apiEmpPath, { hint: 'ตอนนี้ยังเป็น /uat/ — เมื่อไอทีประกาศ production แก้ที่นี่ได้เลย' }) +
    '<label class="switch"><input type="checkbox" data-st="nightlySync" ' + (s.nightlySync !== 'FALSE' ? 'checked' : '') + '><span class="tr"></span>ซิงก์เบอร์/อีเมล/เพศ ทุกคืน 01:00</label>' +
    '<div class="row" style="margin-top:16px"><button class="btn" id="apiTest" data-busy="กำลังทดสอบ…">' + ic('link') + 'ทดสอบการเชื่อมต่อ</button><span id="apiRes" class="small"></span></div></div></div>' +
    '<div class="card pad small"><h3 style="font-size:16px;margin-bottom:8px">วิธีเข้าสู่ระบบของบุคลากร</h3><p class="muted">หน้าเว็บส่งรหัสพนักงาน + เลขบัตรประชาชน → หลังบ้าน (Apps Script) เรียก <code>emp-info</code> พร้อม <code>{"Empcode","Cid"}</code> → ผ่านเมื่อ <code>islogin = true</code> เท่านั้น</p>' +
    '<p class="muted">ระบบไม่บันทึกเลขบัตรประชาชน · ผิด 5 ครั้งพัก 10 นาที · จดจำ 7 วัน · ถ้า API ไม่ตอบ ผู้ใช้จะเห็นข้อความให้ลองใหม่/ติดต่อ HR</p></div></div>';
  saveSettingsBtn($('#stBody'));
  $('#apiTest').onclick = function () { busy(this, api('testApi', {})).then(function (r) { $('#apiRes').innerHTML = '<span class="chip ok">token ' + esc(r.token) + '</span> <span class="chip ok">' + esc(r.empInfo) + '</span>'; toast('เชื่อมต่อ SmartAPI สำเร็จ', 'ok'); }).catch(function (e) { $('#apiRes').innerHTML = '<span class="chip danger">' + esc(e.message) + '</span>'; errToast(e); }); };
}
function settingsAdmins() {
  api('listAdmins', {}).then(function drawA(d) {
    var h = '<div class="card"><div class="hd"><div><h3>ผู้ดูแลระบบ</h3><div class="small muted">ผู้ดูแลสูงสุดเพิ่ม/ถอดผู้ดูแลได้ · ผู้ดูแลจัดการกิจกรรม รายชื่อ รายงาน และอีเมลได้ทั้งหมด · เห็นเบอร์โทร</div></div>' + (d.canManage ? '<button class="btn primary sm" id="adAdd">' + ic('plus') + 'เพิ่มผู้ดูแล</button>' : '') + '</div>' +
      '<div class="tablewrap"><table class="t"><thead><tr><th>ชื่อ</th><th>บทบาท</th><th>อีเมล (รับสรุป)</th><th>เพิ่มโดย</th><th></th></tr></thead><tbody>' +
      d.admins.map(function (a) {
        return '<tr><td><div class="nm">' + esc(a.name || '-') + (a.empCode === d.me ? ' <span class="chip acc">คุณ</span>' : '') + '</div><div class="sub">' + esc(a.empCode) + (a.division ? ' · ' + esc(a.division) : '') + '</div></td><td><span class="chip ' + (a.role === 'SUPER' ? 'danger' : 'acc') + '">' + (a.role === 'SUPER' ? 'ผู้ดูแลสูงสุด' : 'ผู้ดูแล') + '</span>' + (a.active ? '' : ' <span class="chip">ปิด</span>') + '</td>' +
          '<td>' + esc(a.email || '-') + '</td><td class="small muted">' + esc(a.addedBy || '') + (a.addedAt ? ' · ' + esc(thShort(a.addedAt)) : '') + '</td><td class="r">' + (d.canManage && !a.locked ? '<button class="iconbtn" data-ae="' + esc(a.empCode) + '">' + ic('edit') + '</button>' + (a.empCode !== d.me && a.empCode !== '5660101' ? '<button class="iconbtn" data-ar="' + esc(a.empCode) + '">' + ic('trash') + '</button>' : '') : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    $('#stBody').innerHTML = h;
    var edit = function (a) {
      a = a || { role: 'ADMIN', active: true };
      var m = modal({ title: a.empCode ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล', body: '<div class="field"><label class="f">รหัสพนักงาน</label><input class="input" id="aeCode" value="' + esc(a.empCode || '') + '" ' + (a.empCode ? 'readonly' : '') + ' inputmode="numeric"></div>' +
        '<div class="grid2"><div class="field"><label class="f">บทบาท</label><select class="input" id="aeRole"><option value="ADMIN">ผู้ดูแล</option><option value="SUPER" ' + (a.role === 'SUPER' ? 'selected' : '') + '>ผู้ดูแลสูงสุด</option></select></div><div class="field"><label class="f">อีเมล (รับสรุปภาพรวม)</label><input class="input" id="aeEmail" type="email" value="' + esc(a.email || '') + '"></div></div>' +
        '<label class="switch"><input type="checkbox" id="aeAct" ' + (a.active !== false ? 'checked' : '') + '><span class="tr"></span>ใช้งาน</label>', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="aeSave" data-busy="กำลังบันทึก…">บันทึก</button>' });
      $('#aeSave').onclick = function () { busy(this, api('saveAdmin', { empCode: $('#aeCode').value.trim(), role: $('#aeRole').value, email: $('#aeEmail').value.trim(), active: $('#aeAct').checked })).then(function (r) { m.close(); toast('บันทึกผู้ดูแลแล้ว', 'ok'); drawA(r); }).catch(errToast); };
    };
    var add = $('#adAdd'); if (add) add.onclick = function () { edit(null); };
    $$('[data-ae]').forEach(function (b) { b.onclick = function () { edit(d.admins.filter(function (a) { return a.empCode === b.dataset.ae; })[0]); }; });
    $$('[data-ar]').forEach(function (b) { b.onclick = function () { confirmBox({ title: 'ถอดสิทธิ์ผู้ดูแล ' + b.dataset.ar + '?', danger: true, ok: 'ถอดสิทธิ์', msg: 'มีผลทันที' }).then(function (y) { if (y) api('removeAdmin', { empCode: b.dataset.ar }).then(function (r) { toast('ถอดสิทธิ์แล้ว', 'ok'); drawA(r); }).catch(errToast); }); }; });
  }).catch(errToast);
}
var AUDIT_TH = { LOGIN: 'เข้าสู่ระบบ', RESPONSE_NEW: 'บันทึกใหม่', RESPONSE_EDIT: 'แก้ไขคำตอบ', RESPONSE_BY_ADMIN: 'HR บันทึกแทน', RESPONSE_RESET: 'ล้างคำตอบ', ROSTER_IMPORT: 'นำเข้ารายชื่อ', ROSTER_ADD: 'เพิ่มบุคลากร', ROSTER_EDIT: 'แก้ไขบุคลากร', ROSTER_NEW_FROM_API: 'พบใหม่จาก API', API_SYNC: 'ซิงก์ API', API_SYNC_FAIL: 'ซิงก์ API ล้มเหลว', EVENT_NEW: 'สร้างกิจกรรม', EVENT_EDIT: 'แก้ไขกิจกรรม', SETTINGS: 'ตั้งค่า', ADMIN_ADD: 'เพิ่มผู้ดูแล', ADMIN_EDIT: 'แก้ผู้ดูแล', ADMIN_REMOVE: 'ถอดผู้ดูแล', HEAD_ADD: 'เพิ่มหัวหน้า', HEAD_EDIT: 'แก้หัวหน้า', HEAD_REMOVE: 'ลบหัวหน้า', HEAD_IMPORT: 'นำเข้าหัวหน้า', MAIL_SEND: 'ส่งอีเมล', MAIL_TEST: 'ส่งอีเมลทดสอบ' };
function settingsAudit() {
  var load = function (q) {
    api('listAudit', { limit: 400, q: q || '' }).then(function (l) {
      $('#auList').innerHTML = l.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>รายการ</th><th>เป้าหมาย</th><th>รายละเอียด</th></tr></thead><tbody>' + l.map(function (a) { return '<tr><td class="num small" style="white-space:nowrap">' + esc(thShort(a.ts)) + '</td><td class="num">' + esc(a.actor) + '</td><td><span class="chip">' + esc(AUDIT_TH[a.action] || a.action) + '</span></td><td class="small">' + esc(a.target) + '</td><td class="small">' + esc(a.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ไม่พบรายการ</div>';
    }).catch(errToast);
  };
  $('#stBody').innerHTML = '<div class="card"><div class="hd"><h3>ประวัติการใช้งาน (ล่าสุด)</h3><input class="input" id="auQ" placeholder="ค้นหา รหัส / รายการ" style="max-width:280px;min-height:38px"></div><div id="auList">' + skel(1) + '</div></div>';
  $('#auQ').oninput = debounce(function () { load($('#auQ').value.trim()); }, 400);
  load('');
}
